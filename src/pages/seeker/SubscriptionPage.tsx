import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaCrown, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAccountTypeLabel, resolveAccountTypeForPlan, useSubscriptions } from '../../context/SubscriptionContext';
import { createSeekerSubscriptionCheckout, verifySeekerSubscriptionPayment } from '../../services/api';
import { getUserFacingError } from '../../utils/userFacingError';

const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed);
};

const normalizeStatus = (value?: string | null) => {
  if (!value) return 'Active';
  const status = value.toLowerCase();
  if (status === 'pending') return 'Pending';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'expired') return 'Expired';
  if (status === 'failed') return 'Failed';
  return 'Active';
};

const formatSubscriptionPlanName = (planId: string | null | undefined, plans: Parameters<typeof resolveAccountTypeForPlan>[1]) => {
  const mapped = resolveAccountTypeForPlan(planId ?? 'free', plans, 'Basic');
  if (mapped === 'Basic') return 'Basic';
  return mapped;
};

function SubscriptionPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { plans, getSubscription } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const currentSubscription = useMemo(() => {
    if (!user?.id) return null;
    return getSubscription(user.id);
  }, [getSubscription, user?.id]);

  const currentPlanName = useMemo(
    () => formatSubscriptionPlanName(currentSubscription?.planId ?? 'free', plans),
    [currentSubscription?.planId, plans],
  );

  const handlePlanAction = async (planId: string) => {
    if (!token || !user?.id) return;
    setCheckoutError('');
    setIsSubmitting(planId);

    try {
      const result = await createSeekerSubscriptionCheckout(planId, token);
      if (!result.ok) {
        setCheckoutError(result.error?.message || 'We could not start your subscription checkout.');
        return;
      }

      if (!result.data?.data?.checkoutUrl) {
        setCheckoutError('We could not start your subscription checkout.');
        return;
      }

      window.location.href = result.data.data.checkoutUrl;
    } catch (error) {
      setCheckoutError(getUserFacingError(error, 'payment').message);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handlePaymentVerification = async () => {
    if (!token || !user?.id) return;
    setCheckoutError('');
    setIsSubmitting('verify');

    try {
      const params = new URLSearchParams(window.location.search);
      const providerReference = params.get('providerReference') ?? undefined;
      const transactionId = params.get('transaction_id') ?? params.get('transactionId') ?? undefined;
      const result = await verifySeekerSubscriptionPayment(providerReference, transactionId, token);
      if (!result.ok) {
        setCheckoutError(result.error?.message || 'We could not verify your payment.');
        return;
      }
      window.location.href = '/seeker/subscription';
    } catch (error) {
      setCheckoutError(getUserFacingError(error, 'payment').message);
    } finally {
      setIsSubmitting(null);
    }
  };

  const statusLabel = normalizeStatus(currentSubscription?.status ?? 'Active');
  const accountTypeLabel = currentPlanName;

  return (
    <main className="seeker-layout__main subscription-page">
      <section className="subscription-hero">
        <div>
          <span>Account</span>
          <h1>Subscription</h1>
          <p>Manage your LeamJobs account plan and keep your profile visible to employers.</p>
        </div>
        <FaCrown aria-hidden="true" />
      </section>

      <section className="subscription-panel subscription-panel--editor">
        <div className="subscription-heading">
          <div>
            <span className="seeker-subscription-eyebrow"><FaShieldAlt /> Current account</span>
            <h2>{accountTypeLabel}</h2>
          </div>
          <span className={`subscription-status subscription-status--${statusLabel.toLowerCase()}`}>{statusLabel}</span>
        </div>

        <div className="subscription-stat-grid">
          <article>
            <span>Account type</span>
            <strong>{accountTypeLabel}</strong>
          </article>
          <article>
            <span>Status</span>
            <strong>{statusLabel}</strong>
          </article>
          <article>
            <span>Started</span>
            <strong>{formatDateLabel(currentSubscription?.startedAt)}</strong>
          </article>
          <article>
            <span>Renewal / expiry</span>
            <strong>{formatDateLabel(currentSubscription?.renewalDate)}</strong>
          </article>
        </div>

        {checkoutError ? <p className="payment-copy payment-copy--error" role="alert">{checkoutError}</p> : null}

        <div className="subscription-save-row">
          <button type="button" className="subscription-action-button subscription-action-button--secondary" onClick={() => navigate('/seeker/profile')}>
            <FaArrowLeft /> Back to profile
          </button>
          {currentSubscription?.status === 'Active' ? (
            <button type="button" className="subscription-action-button" onClick={() => handlePaymentVerification()} disabled={isSubmitting === 'verify'}>
              {isSubmitting === 'verify' ? 'Verifying…' : 'Refresh status'}
            </button>
          ) : null}
        </div>
      </section>

      <section className="subscription-panel">
        <div className="subscription-heading">
          <div>
            <span className="seeker-subscription-eyebrow"><FaCheck /> Available plans</span>
            <h2>Choose the plan that matches your goals</h2>
          </div>
        </div>

        <div className="subscription-plan-grid">
          {plans.map((plan) => {
            const isActive = currentSubscription?.planId === plan.id || (currentSubscription?.planId === 'free' && plan.id === 'free');
            const displayName = getAccountTypeLabel(plan.name, plan.id === 'free' ? 'Basic' : 'Professional');
            const isUpgradeAction = plan.id !== 'free';

            return (
              <article className={`subscription-plan ${isActive ? 'subscription-plan--active' : ''}`} key={plan.id}>
                <div>
                  <h3>{displayName}</h3>
                  <strong>{plan.price ? `$${plan.price}` : 'Free'}<small>{plan.price ? '/month' : ''}</small></strong>
                </div>
                <p>{plan.description}</p>
                <ul>
                  {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
                </ul>
                <button
                  type="button"
                  className="subscription-action-button"
                  onClick={() => {
                    if (plan.id === 'free') return;
                    void handlePlanAction(String(plan.id));
                  }}
                  disabled={isSubmitting === String(plan.id) || isActive}
                >
                  {isActive ? 'Current plan' : isUpgradeAction ? 'Upgrade' : 'Select plan'}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default SubscriptionPage;
