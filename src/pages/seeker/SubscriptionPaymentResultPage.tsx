import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaExclamationCircle, FaLock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAccountTypeLabel, useSubscriptions } from '../../context/SubscriptionContext';
import { cancelSeekerSubscriptionPayment, verifySeekerSubscriptionPayment } from '../../services/api';

type PaymentResultState = 'verifying' | 'success' | 'pending' | 'failed' | 'cancelled' | 'cancelledByUser' | 'missing';

const idempotencyStorageKey = (userId: string, planId: string) => `leamjobs:subscription-checkout:${userId}:${planId}`;

function SubscriptionPaymentResultPage() {
  const { token, user } = useAuth();
  const { plans, subscriptions, refresh } = useSubscriptions();
  const [searchParams] = useSearchParams();
  const [resultState, setResultState] = useState<PaymentResultState>('verifying');
  const [confirmedPlanName, setConfirmedPlanName] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [canCancel, setCanCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const cancelRequestInFlight = useRef(false);
  const verificationRequestRef = useRef<{ requestKey: string; request: ReturnType<typeof verifySeekerSubscriptionPayment> } | null>(null);
  const plansRef = useRef(plans);
  plansRef.current = plans;

  const providerReference = searchParams.get('tx_ref') ?? searchParams.get('providerReference') ?? undefined;
  const transactionId = searchParams.get('transaction_id') ?? searchParams.get('transactionId') ?? undefined;
  const planKey = (searchParams.get('plan') ?? '').trim().toUpperCase();

  useEffect(() => {
    if (!token || !user?.id) {
      setResultState('failed');
      return undefined;
    }

    if (!providerReference && (!transactionId || !/^\d+$/.test(transactionId))) {
      setResultState('missing');
      return undefined;
    }

    let isCurrent = true;
    const requestKey = `${providerReference ?? ''}:${transactionId}:${retryCount}`;
    setResultState('verifying');
    setCanCancel(false);
    if (verificationRequestRef.current?.requestKey !== requestKey) {
      verificationRequestRef.current = {
        requestKey,
        request: verifySeekerSubscriptionPayment(providerReference, transactionId, token, true),
      };
    }

    void verificationRequestRef.current.request.then(async (result) => {
      if (!isCurrent) return;
      if (!result.ok) {
        const isRetryable = result.status === 0 || result.status >= 500 || result.status === 429;
        setResultState(isRetryable ? 'pending' : 'failed');
        if (!isRetryable) clearAttemptKey();
        return;
      }

      const { payment, subscription, pending, failed, failureType } = result.data.data;
      if (failed) {
        setResultState(failureType === 'cancelled' ? 'cancelled' : 'failed');
        clearAttemptKey(subscription?.plan?.id);
        return;
      }

      if (pending || ['PENDING', 'PROCESSING'].includes(String(payment.status))) {
        setResultState('pending');
        setCanCancel(payment.status === 'PENDING' && subscription?.status === 'PENDING');
        return;
      }

      if (payment.status === 'SUCCESSFUL' && subscription?.status === 'ACTIVE') {
        setResultState('success');
        setConfirmedPlanName(subscription.plan?.displayName ?? getAccountTypeLabel(planKey));
        clearAttemptKey(subscription.plan?.id);
        try {
          await refresh();
        } catch {
          // The payment result remains authoritative if refreshing the view state is temporarily unavailable.
        }
        return;
      }

      setResultState('failed');
      clearAttemptKey(subscription?.plan?.id);
    }).catch(() => {
      if (isCurrent) setResultState('pending');
    });

    return () => { isCurrent = false; };
  }, [planKey, providerReference, refresh, retryCount, token, transactionId, user?.id]);

  const clearAttemptKey = (verifiedPlanId?: string) => {
    if (!user?.id) return;
    const planId = verifiedPlanId ?? plansRef.current.find((plan) => plan.key?.toUpperCase() === planKey)?.id;
    if (!planId) return;
    try { sessionStorage.removeItem(idempotencyStorageKey(user.id, planId)); } catch { /* Session storage is optional after the payment attempt. */ }
  };

  const handleCancelPayment = async () => {
    if (cancelRequestInFlight.current || !canCancel || !providerReference || !token) return;
    cancelRequestInFlight.current = true;
    setIsCancelling(true);
    setCancelError('');

    try {
      const result = await cancelSeekerSubscriptionPayment(providerReference, token);
      if (result.ok && result.data.data.status === 'CANCELLED') {
        const cancelledSubscription = subscriptions.find((subscription) => (
          subscription.pendingPayment?.providerReference === providerReference
        ));
        clearAttemptKey(cancelledSubscription?.planId);
        setCanCancel(false);
        setResultState('cancelledByUser');
        try {
          await refresh();
        } catch {
          // The server confirmed cancellation; the result remains valid if refresh is temporarily unavailable.
        }
        return;
      }

      if (!result.ok && result.status === 409) {
        try { await refresh(); } catch { /* Verification below decides whether activation won the race. */ }
        const verification = await verifySeekerSubscriptionPayment(providerReference, transactionId, token, true);
        if (verification.ok) {
          const { payment, subscription, pending, failed, failureType } = verification.data.data;
          if (payment.status === 'SUCCESSFUL' && subscription?.status === 'ACTIVE') {
            setCanCancel(false);
            setConfirmedPlanName(subscription.plan?.displayName ?? getAccountTypeLabel(planKey));
            clearAttemptKey(subscription.plan?.id);
            setResultState('success');
            try {
              await refresh();
            } catch {
              // The server-confirmed activation remains authoritative if refresh is temporarily unavailable.
            }
            return;
          }
          if (failed) {
            setCanCancel(false);
            setResultState(failureType === 'cancelled' ? 'cancelled' : 'failed');
            clearAttemptKey(subscription?.plan?.id);
            return;
          }
          if (pending || ['PENDING', 'PROCESSING'].includes(String(payment.status))) {
            setCanCancel(payment.status === 'PENDING' && subscription?.status === 'PENDING');
          }
        }
      }

      setCancelError("We couldn't cancel this payment attempt. Please try again.");
    } catch {
      setCancelError("We couldn't cancel this payment attempt. Please try again.");
    } finally {
      cancelRequestInFlight.current = false;
      setIsCancelling(false);
    }
  };

  return (
    <main className="seeker-layout__main subscription-page subscription-result-page">
      <section className={`subscription-result-panel subscription-result-panel--${resultState}`} aria-live="polite">
        <span className="subscription-result-icon" aria-hidden="true">
          {resultState === 'success' ? <FaCheckCircle /> : resultState === 'pending' || resultState === 'verifying' ? <FaClock /> : <FaExclamationCircle />}
        </span>
        <span className="seeker-subscription-eyebrow"><FaLock aria-hidden="true" /> Secure payment confirmation</span>
        {resultState === 'verifying' ? <>
          <h1>Verifying your payment</h1>
          <p>Flutterwave is confirming your transaction. Subscription access is granted only after server verification.</p>
          <span className="subscription-result-progress"><FaSpinner className="subscription-spin" aria-hidden="true" /> Checking payment securely…</span>
        </> : null}
        {resultState === 'success' ? <>
          <h1>Payment successful</h1>
          <p>Your {confirmedPlanName ?? getAccountTypeLabel(planKey)} plan is active. Your subscription access has been updated.</p>
          <Link className="subscription-action-button" to="/seeker/dashboard">Continue to LeamJobs</Link>
        </> : null}
        {resultState === 'pending' ? <>
          <h1>{canCancel ? 'Payment not completed' : 'Payment is being confirmed'}</h1>
          <p>{canCancel
            ? "Your payment hasn't been completed yet. Your subscription has not been activated."
            : 'We have not received final confirmation yet. No subscription access is granted until LeamJobs verifies a successful payment.'}</p>
          {canCancel ? <div className="subscription-result-not-completed" role="status">
            <p>You can cancel this pending attempt and start a new subscription whenever you're ready.</p>
            {cancelError ? <p className="subscription-result-cancel-error" role="alert">{cancelError}</p> : null}
            <div className="subscription-result-actions">
              <button type="button" className="subscription-action-button" onClick={() => void handleCancelPayment()} disabled={isCancelling} aria-busy={isCancelling}>
                {isCancelling ? <><FaSpinner className="subscription-spin" aria-hidden="true" /> Canceling payment...</> : 'Cancel Payment'}
              </button>
              <Link className="subscription-action-button subscription-action-button--secondary" to="/seeker/subscription">Try Again</Link>
              <Link className="subscription-action-button subscription-action-button--secondary" to="/seeker/subscription">Return to Subscription</Link>
            </div>
          </div> : null}
          <div className="subscription-result-actions">
            <button type="button" className="subscription-action-button" onClick={() => setRetryCount((count) => count + 1)}>Check payment status</button>
            {!canCancel ? <Link className="subscription-action-button subscription-action-button--secondary" to="/seeker/subscription">Return to Subscription</Link> : null}
          </div>
        </> : null}
        {resultState === 'failed' ? <>
          <h1>Payment could not be completed</h1>
          <p>Your payment could not be verified, so your subscription has not been activated. You can return to plans and begin a new checkout.</p>
          <Link className="subscription-action-button" to="/seeker/subscription">Try again</Link>
        </> : null}
        {resultState === 'cancelled' ? <>
          <h1>Payment cancelled</h1>
          <p>Your payment was cancelled and your subscription has not been activated. You can return to plans and try again when you are ready.</p>
          <Link className="subscription-action-button" to="/seeker/subscription">Return to plans</Link>
        </> : null}
        {resultState === 'cancelledByUser' ? <>
          <h1>Payment cancelled</h1>
          <p>Your subscription payment attempt has been cancelled. You can start a new subscription whenever you're ready.</p>
          <Link className="subscription-action-button" to="/seeker/subscription">Return to Subscription</Link>
        </> : null}
        {resultState === 'missing' ? <>
          <h1>We couldn’t identify this payment</h1>
          <p>No subscription was activated because the callback did not include a transaction reference or a valid transaction ID.</p>
          <Link className="subscription-action-button" to="/seeker/subscription">Return to subscription plans</Link>
        </> : null}
      </section>
    </main>
  );
}

export default SubscriptionPaymentResultPage;