import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaCrown, FaLock, FaShieldAlt, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAccountTypeLabel, useSubscriptions } from '../../context/SubscriptionContext';
import { createSeekerSubscriptionCheckout, startSeekerFreeTrial } from '../../services/api';
import { getUserFacingError } from '../../utils/userFacingError';

const formatDateLabel = (value?: string | null) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed);
};

const formatPlanPrice = (price: number, currency: string | null) => {
  if (!currency || !Number.isFinite(price) || price <= 0) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
};

const checkoutAttemptStorageKey = (userId: string, planId: string) => `leamjobs:subscription-checkout:${userId}:${planId}`;

const normalizeStatus = (value?: string | null) => {
  if (!value) return 'Active';
  const status = value.toLowerCase();
  if (status === 'pending') return 'Pending';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'expired') return 'Expired';
  if (status === 'failed') return 'Failed';
  return 'Active';
};

function SubscriptionPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { plans, subscriptions, getSubscription, currentPlan, trial, trialOffer, aiUsage, refresh } = useSubscriptions();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState<string | null>(null);
  const checkoutRequestInFlight = useRef(false);

  const currentSubscription = useMemo(() => {
    if (!user?.id) return null;
    return getSubscription(user.id);
  }, [getSubscription, user?.id]);
  const activeSubscription = subscriptions.find((subscription) => subscription.status === 'Active') ?? null;
  const pendingSubscription = activeSubscription
    ? null
    : subscriptions.find((subscription) => subscription.status === 'Pending' && subscription.pendingPayment) ?? null;

  const currentPlanName = useMemo(
    () => activeSubscription
      ? getAccountTypeLabel(currentPlan?.key ?? activeSubscription.planId, 'Basic')
      : trial
        ? `${getAccountTypeLabel(trial.grantedPlanKey)} trial`
        : 'Basic',
    [activeSubscription, currentPlan?.key, activeSubscription?.planId, trial],
  );

  const selectedCheckoutPlan = plans.find((plan) => plan.id === checkoutPlanId) ?? null;

  const handlePlanAction = async (planId: string) => {
    if (checkoutRequestInFlight.current) return;
    if (activeSubscription || pendingSubscription) {
      setCheckoutError(activeSubscription
        ? 'You already have an active subscription.'
        : 'A subscription payment is still being confirmed. Check its status before starting another checkout.');
      return;
    }
    if (!token || !user?.id) return;
    checkoutRequestInFlight.current = true;
    setCheckoutError('');
    setIsSubmitting(planId);

    try {
      const storageKey = checkoutAttemptStorageKey(user.id, planId);
      let idempotencyKey = checkoutIdempotencyKey;
      if (!idempotencyKey) {
        try {
          idempotencyKey = sessionStorage.getItem(storageKey);
        } catch {
          idempotencyKey = null;
        }
      }
      if (!idempotencyKey) {
        idempotencyKey = globalThis.crypto?.randomUUID?.() ?? null;
        if (!idempotencyKey) {
          setCheckoutError('Secure checkout is unavailable in this browser. Please use an up-to-date browser and try again.');
          return;
        }
        try {
          sessionStorage.setItem(storageKey, idempotencyKey);
        } catch {
          setCheckoutError('Secure checkout could not be prepared in this browser. Please allow session storage and try again.');
          return;
        }
      }
      setCheckoutIdempotencyKey(idempotencyKey);

      const result = await createSeekerSubscriptionCheckout(planId, token, idempotencyKey);
      if (!result.ok) {
        if (result.status === 502) {
          try { sessionStorage.removeItem(storageKey); } catch { /* A confirmed initialization failure starts a fresh attempt. */ }
          setCheckoutIdempotencyKey(null);
        }
        setCheckoutError(result.status === 0 || result.status >= 500
          ? result.status === 502
            ? 'Flutterwave could not start this checkout. Close this review and begin a new attempt.'
            : 'We could not confirm whether checkout started. Reopen this plan to safely retry the same attempt.'
          : 'We could not start checkout for this plan. Please review the plan and try again.');
        return;
      }

      if (!result.data?.data?.checkoutUrl) {
        const paymentStatus = String(result.data?.data?.payment?.status ?? '');
        if (result.data.data.initializing || paymentStatus === 'PROCESSING') {
          setCheckoutError('Secure checkout is still being prepared. Please wait a moment before trying again.');
        } else {
          setCheckoutError('This checkout attempt could not be started. Close this review and begin a new attempt.');
          if (paymentStatus === 'FAILED') {
            try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional after checkout returns. */ }
            setCheckoutIdempotencyKey(null);
          }
        }
        return;
      }

      window.location.href = result.data.data.checkoutUrl;
    } catch (error) {
      setCheckoutError(getUserFacingError(error, 'payment').message || 'We could not start checkout. Please try again.');
    } finally {
      checkoutRequestInFlight.current = false;
      setIsSubmitting(null);
    }
  };

  const handleTrialStart = async (planKey: string) => {
    if (!token || !user?.id) return;
    setCheckoutError('');
    setIsSubmitting(`trial:${planKey}`);

    try {
      const result = await startSeekerFreeTrial(token);
      if (!result.ok) {
        setCheckoutError(result.error?.message || 'We could not start your free trial.');
        return;
      }
      await refresh();
    } catch (error) {
      setCheckoutError(getUserFacingError(error, 'payment').message);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleSubscriptionRefresh = async () => {
    if (!token || !user?.id) return;
    setCheckoutError('');
    setIsSubmitting('verify');

    try {
      await refresh();
    } catch (error) {
      setCheckoutError(getUserFacingError(error, 'payment').message || 'We could not refresh your subscription status.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const statusLabel = activeSubscription
    ? 'Active'
    : pendingSubscription
      ? 'Pending'
      : normalizeStatus(currentSubscription?.status ?? (trial ? 'Active' : 'Expired'));
  const accountTypeLabel = currentPlanName;
  const pendingResultUrl = pendingSubscription?.pendingPayment
    ? `/seeker/subscription/payment-result?tx_ref=${encodeURIComponent(pendingSubscription.pendingPayment.providerReference)}${pendingSubscription.pendingPayment.transactionId ? `&transaction_id=${encodeURIComponent(pendingSubscription.pendingPayment.transactionId)}` : ''}`
    : null;

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
          <article>
            <span>AI usage</span>
            <strong>{aiUsage.unlimited ? 'Unlimited' : `${aiUsage.used} / ${aiUsage.limit ?? 0}`}</strong>
          </article>
        </div>

        <div className="subscription-trial-summary" aria-live="polite">
          <strong>{trial ? `${getAccountTypeLabel(trial.grantedPlanKey)} trial active` : 'No active trial'}</strong>
          <span>{trial ? `Ends ${formatDateLabel(trial.endAt)}` : `Remaining AI uses: ${aiUsage.remaining}`}</span>
        </div>

        {pendingSubscription ? <div className="subscription-pending-notice" role="status">
          <div>
            <strong>Payment confirmation in progress</strong>
            <p>Your {getAccountTypeLabel(plans.find((plan) => plan.id === pendingSubscription.planId)?.key, 'subscription')} payment has not been confirmed yet. Paid access will remain unavailable until verification is complete.</p>
          </div>
          {pendingResultUrl ? <button type="button" className="subscription-action-button subscription-action-button--secondary" onClick={() => navigate(pendingResultUrl)}>Check payment status</button> : null}
        </div> : null}

        {checkoutError ? <p className="payment-copy payment-copy--error" role="alert">{checkoutError}</p> : null}

        <div className="subscription-save-row">
          <button type="button" className="subscription-action-button subscription-action-button--secondary" onClick={() => navigate('/seeker/profile')}>
            <FaArrowLeft /> Back to profile
          </button>
          {currentSubscription?.status === 'Active' ? (
            <button type="button" className="subscription-action-button" onClick={() => void handleSubscriptionRefresh()} disabled={isSubmitting === 'verify'}>
              {isSubmitting === 'verify' ? <FaSpinner className="subscription-spin" aria-hidden="true" /> : null}
              {isSubmitting === 'verify' ? 'Refreshing…' : 'Refresh status'}
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
            const isFreePlan = plan.key?.toUpperCase() === 'BASIC' || plan.id === 'free';
            const isActive = activeSubscription?.planId === plan.id;
            const isPending = pendingSubscription?.planId === plan.id;
            const displayName = getAccountTypeLabel(plan.name, plan.id === 'free' ? 'Basic' : 'Professional');
            const isUpgradeAction = !isFreePlan;
            const planKey = (plan.key ?? plan.id).toString().toUpperCase();
            const isConfiguredTrialPlan = !isActive
              && !isFreePlan
              && !activeSubscription
              && !pendingSubscription
              && trialOffer.available
              && planKey === trialOffer.trialPlanKey.toUpperCase();
            const formattedPrice = formatPlanPrice(plan.price, plan.currency);
            const hasConfiguredPrice = Boolean(formattedPrice);

            return (
              <article className={`subscription-plan ${isActive ? 'subscription-plan--active' : ''}`} key={plan.id}>
                <div>
                  <h3>{displayName}</h3>
                  <strong>{isFreePlan ? 'Free' : formattedPrice ?? 'Price unavailable'}<small>{formattedPrice ? `/${plan.billingInterval.toLowerCase()}` : ''}</small></strong>
                </div>
                <p>{plan.description}</p>
                <span>{plan.aiUnlimited ? 'Unlimited AI usage' : `${plan.aiAllowance ?? 0} AI uses included`}</span>
                <ul>
                  {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
                </ul>
                <button
                  type="button"
                  className="subscription-action-button"
                  onClick={() => {
                    if (isFreePlan || activeSubscription || pendingSubscription || isSubmitting) return;
                    if (isConfiguredTrialPlan) {
                      void handleTrialStart(planKey);
                      return;
                    }
                    setCheckoutError('');
                    setCheckoutIdempotencyKey(null);
                    setCheckoutPlanId(String(plan.id));
                  }}
                  disabled={Boolean(isSubmitting) || isActive || Boolean(activeSubscription && !isActive) || Boolean(pendingSubscription) || (isFreePlan) || (!isConfiguredTrialPlan && !hasConfiguredPrice)}
                >
                  {isActive
                    ? 'Current plan'
                    : isPending
                      ? 'Payment pending'
                      : activeSubscription
                        ? 'Included with current plan'
                        : pendingSubscription
                          ? 'Payment in progress'
                    : isConfiguredTrialPlan
                      ? `Start ${trialOffer.durationDays} Days Free Trial`
                      : isUpgradeAction
                        ? `Subscribe to ${displayName}`
                        : 'Select plan'}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      {selectedCheckoutPlan ? <div className="subscription-checkout-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          setCheckoutPlanId(null);
          setCheckoutIdempotencyKey(null);
          setCheckoutError('');
        }
      }}>
        <section className="subscription-checkout-dialog" role="dialog" aria-modal="true" aria-busy={Boolean(isSubmitting)} aria-labelledby="subscription-checkout-title" onKeyDown={(event) => {
          if (event.key === 'Escape' && !isSubmitting) {
            setCheckoutPlanId(null);
            setCheckoutIdempotencyKey(null);
            setCheckoutError('');
            return;
          }
          if (event.key === 'Tab') {
            const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}>
          <div className="subscription-checkout-dialog__heading">
            <span className="seeker-subscription-eyebrow"><FaLock aria-hidden="true" /> Secure hosted checkout</span>
            <h2 id="subscription-checkout-title">Review your plan</h2>
            <p>You will complete payment on Flutterwave. LeamJobs verifies payment before activating access.</p>
          </div>
          <div className="subscription-checkout-summary">
            <div><span>Plan</span><strong>{getAccountTypeLabel(selectedCheckoutPlan.key, selectedCheckoutPlan.name)}</strong></div>
            <div><span>Billing</span><strong>{selectedCheckoutPlan.billingInterval === 'MONTHLY' ? 'Monthly' : selectedCheckoutPlan.billingInterval}</strong></div>
            <div><span>Amount</span><strong>{formatPlanPrice(selectedCheckoutPlan.price, selectedCheckoutPlan.currency) ?? 'Price unavailable'}</strong></div>
          </div>
          {selectedCheckoutPlan.benefits.length ? <ul className="subscription-checkout-benefits">{selectedCheckoutPlan.benefits.map((benefit) => <li key={benefit}><FaCheck aria-hidden="true" />{benefit}</li>)}</ul> : null}
          {checkoutError ? <p className="payment-copy payment-copy--error" role="alert">{checkoutError}</p> : null}
          <div className="subscription-checkout-actions">
            <button type="button" autoFocus className="subscription-action-button subscription-action-button--secondary" onClick={() => {
              if (isSubmitting) return;
              setCheckoutPlanId(null);
              setCheckoutIdempotencyKey(null);
              setCheckoutError('');
            }} disabled={Boolean(isSubmitting)}>Cancel</button>
            <button type="button" className="subscription-action-button" onClick={() => void handlePlanAction(String(selectedCheckoutPlan.id))} disabled={Boolean(isSubmitting) || Boolean(activeSubscription) || Boolean(pendingSubscription)}>
              {isSubmitting === String(selectedCheckoutPlan.id) ? <FaSpinner className="subscription-spin" aria-hidden="true" /> : <FaLock aria-hidden="true" />}
              {isSubmitting === String(selectedCheckoutPlan.id) ? 'Preparing checkout…' : 'Continue to payment'}
            </button>
          </div>
        </section>
      </div> : null}
    </main>
  );
}

export default SubscriptionPage;
