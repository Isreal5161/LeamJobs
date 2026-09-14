import { useEffect, useRef, useState } from 'react';
import { FaCheckCircle, FaChevronDown, FaCoins, FaEye, FaFilter, FaLock, FaSearch, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminAnalytics,
  getAdminPayments,
  getAdminReleaseCandidates,
  releaseAdminContract,
  type AdminAnalytics,
  type AdminPayment,
  type AdminPaymentProvider,
  type AdminPaymentStatus,
  type AdminPaymentType,
  type AdminReleaseCandidate,
} from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded';
const fullName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`.trim();
const money = (amount: string, currency: string) => `${currency} ${amount}`;
const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const metricValue = (rows: { currency: string; amount: string }[]) => rows.length ? rows.map((row) => `${row.currency} ${row.amount}`).join(' / ') : 'No records';
const statuses: AdminPaymentStatus[] = ['PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'CANCELLED', 'REFUNDED'];
const paymentTypes: AdminPaymentType[] = ['CONTRACT_FUNDING', 'SUBSCRIPTION', 'OTHER'];
const providers: AdminPaymentProvider[] = ['FLUTTERWAVE', 'OTHER'];

type PaymentFilters = {
  search: string;
  status: AdminPaymentStatus | '';
  paymentType: AdminPaymentType | '';
  provider: AdminPaymentProvider | '';
  currency: string;
  from: string;
  to: string;
};

const emptyFilters: PaymentFilters = { search: '', status: '', paymentType: '', provider: '', currency: '', from: '', to: '' };

function AdminPaymentsPage() {
  const { token } = useAuth();
  const paymentDetailsCloseRef = useRef<HTMLButtonElement | null>(null);
  const paymentDetailsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState('');
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<PaymentFilters>(emptyFilters);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [contracts, setContracts] = useState<AdminReleaseCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [released, setReleased] = useState<{ candidate: AdminReleaseCandidate; result: { releasedAmount: string; currency: string; status: string; releasedAt: string } } | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setAnalyticsLoading(true);
    void getAdminAnalytics(token).then((result) => {
      if (!active) return;
      if (result.ok) {
        setAnalytics(result.data.data);
        setAnalyticsError('');
      } else {
        setAnalytics(null);
        setAnalyticsError(result.error.message || 'Financial summary could not be loaded.');
      }
      setAnalyticsLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  const loadPayments = async (cursor?: string, append = false) => {
    if (!token) return;
    setPaymentsLoading(true);
    const result = await getAdminPayments(token, {
      limit: 20,
      cursor,
      ...(paymentFilters.status ? { status: paymentFilters.status } : {}),
      ...(paymentFilters.paymentType ? { paymentType: paymentFilters.paymentType } : {}),
      ...(paymentFilters.provider ? { provider: paymentFilters.provider } : {}),
      ...(paymentFilters.currency ? { currency: paymentFilters.currency } : {}),
      ...(paymentFilters.from ? { from: paymentFilters.from } : {}),
      ...(paymentFilters.to ? { to: paymentFilters.to } : {}),
      ...(paymentFilters.search ? { search: paymentFilters.search } : {}),
    });
    if (result.ok) {
      setPayments((current) => append ? [...current, ...result.data.data.items] : result.data.data.items);
      setNextCursor(result.data.data.nextCursor);
      setPaymentsError('');
    } else if (!append) {
      setPayments([]);
      setNextCursor(null);
      setPaymentsError(result.error.message || 'Payment history could not be loaded.');
    }
    setPaymentsLoading(false);
  };

  useEffect(() => {
    void loadPayments();
  }, [token, paymentFilters]);

  const applyFilters = () => setPaymentFilters({ ...draftFilters });
  const clearFilters = () => {
    setDraftFilters(emptyFilters);
    setPaymentFilters(emptyFilters);
  };

  const closePaymentDetails = () => {
    setSelectedPayment(null);
    paymentDetailsTriggerRef.current?.focus();
  };

  useEffect(() => {
    if (!selectedPayment) return undefined;

    paymentDetailsCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePaymentDetails();
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = paymentDetailsCloseRef.current?.closest('[role="dialog"]');
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPayment]);

  const loadCandidates = async () => {
    if (!token) return;
    setIsLoading(true);
    const result = await getAdminReleaseCandidates(token);
    if (result.ok) {
      setContracts(result.data.data.contracts);
      setError('');
    } else setError(result.error.message || 'Release candidates could not be loaded.');
    setIsLoading(false);
  };

  useEffect(() => { void loadCandidates(); }, [token]);

  const release = async (candidate: AdminReleaseCandidate) => {
    if (!token || loadingId) return;
    setLoadingId(candidate.contractId);
    setError('');
    setMessage('');
    const result = await releaseAdminContract(candidate.contractId, token);
    if (!result.ok) setError(result.error.message || 'Funds could not be released. Refresh and try again.');
    else {
      setMessage(result.data.message);
      setConfirmingId(null);
      setReleased({ candidate, result: result.data.data.escrow });
      await loadCandidates();
    }
    setLoadingId(null);
  };

  const overviewCards = analytics ? [
    { title: 'Successful Payments', value: analytics.financial.successfulPayments, tone: 'success' },
    { title: 'Contract Funding', value: analytics.financial.contractFunding, tone: 'contract' },
    { title: 'Subscription Payments', value: analytics.financial.subscriptionPayments, tone: 'subscription' },
    { title: 'Escrow Funded', value: analytics.financial.fundedEscrow, tone: 'escrow' },
    { title: 'Released to Seekers', value: analytics.financial.releasedEscrow, tone: 'released' },
    { title: 'Pending Payments', value: analytics.financial.pendingPayments, tone: 'pending' },
    { title: 'Failed Payments', value: analytics.financial.failedPayments, tone: 'failed' },
    { title: 'Platform Fees', value: analytics.financial.platformFees, tone: 'fees' },
  ] : [];

  return (
    <div className="payment-page admin-release-page admin-payments-page">
      <section className="admin-hero payment-hero">
        <div><span className="admin-eyebrow"><FaCoins /> Admin finance control</span><h1>Payments</h1><p>Monitor platform payment activity, escrow movement, and release operations.</p></div>
        <div className="admin-hero__actions"><span className="admin-icon-button" aria-hidden="true"><FaCoins /></span></div>
      </section>

      <section className="payment-section" aria-labelledby="payments-overview-title">
        <div className="payment-section-heading"><div><span className="payment-section-kicker"><FaCoins /> Payments overview</span><h2 id="payments-overview-title">Financial summary</h2></div></div>
        {analyticsLoading ? <div className="payment-stat-grid payment-stat-grid--loading" aria-busy="true" aria-label="Loading financial summary">
          {Array.from({ length: 8 }, (_, index) => <article className="payment-stat-card payment-stat-card--skeleton" key={index} aria-hidden="true"><span className="payment-stat-card__icon" /><div><span className="payment-skeleton-line payment-skeleton-line--label" /><span className="payment-skeleton-line payment-skeleton-line--value" /><span className="payment-skeleton-line payment-skeleton-line--note" /></div></article>)}
        </div> : null}
        {!analyticsLoading && analyticsError ? <p className="payment-copy payment-copy--error" role="alert">{analyticsError}</p> : null}
        {!analyticsLoading && !analyticsError ? <div className="payment-stat-grid">
          {overviewCards.map((card) => <article className={`payment-stat-card payment-stat-card--${card.tone}`} key={card.title}><span className="payment-stat-card__icon" aria-hidden="true"><FaCoins /></span><div><span>{card.title}</span><strong>{metricValue(card.value)}</strong><small>Selected analytics period · currency-separated</small></div></article>)}
        </div> : null}
      </section>

      <section className="payment-panel payment-history-panel" aria-labelledby="payment-history-title">
        <div className="payment-heading"><div><span><FaCoins /> Payment records</span><h2 id="payment-history-title">Payment History</h2></div><span className="payment-history-count">{payments.length} loaded</span></div>
        <form className="payment-filter-toolbar" onSubmit={(event) => { event.preventDefault(); applyFilters(); }}>
          <label className="payment-filter-search"><span>Search payments</span><div><FaSearch aria-hidden="true" /><input value={draftFilters.search} onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Reference, transaction, payer" /></div></label>
          <label><span>Status</span><select value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value as PaymentFilters['status'] }))}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
          <label><span>Payment type</span><select value={draftFilters.paymentType} onChange={(event) => setDraftFilters((current) => ({ ...current, paymentType: event.target.value as PaymentFilters['paymentType'] }))}><option value="">All types</option>{paymentTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}</select></label>
          <label><span>Provider</span><select value={draftFilters.provider} onChange={(event) => setDraftFilters((current) => ({ ...current, provider: event.target.value as PaymentFilters['provider'] }))}><option value="">All providers</option>{providers.map((provider) => <option key={provider} value={provider}>{label(provider)}</option>)}</select></label>
          <label><span>Currency</span><input value={draftFilters.currency} onChange={(event) => setDraftFilters((current) => ({ ...current, currency: event.target.value.toUpperCase().slice(0, 3) }))} placeholder="NGN" maxLength={3} /></label>
          <label><span>From</span><input type="date" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} /></label>
          <label><span>To</span><input type="date" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} /></label>
          <div className="payment-filter-actions"><button type="submit" className="payment-heading-action"><FaFilter /> Apply filters</button><button type="button" className="payment-filter-clear" onClick={clearFilters}>Clear</button></div>
        </form>
        {paymentsError ? <p className="payment-copy payment-copy--error" role="alert">{paymentsError}</p> : null}
        {paymentsLoading && !payments.length ? <AdminPageSkeleton showToolbar={false} statCards={0} rows={4} /> : null}
        {!paymentsLoading && !paymentsError && !payments.length ? <p className="payment-copy payment-empty">No payment records found.</p> : null}
        {payments.length ? <div className="payment-history-list" aria-busy={paymentsLoading}>
          {payments.map((payment) => <article className="payment-history-row" key={payment.id}>
            <div className="payment-history-main"><strong title={payment.providerReference}>{payment.providerReference}</strong><span title={`${payment.payer.name} · ${payment.payer.email}`}>{payment.payer.name} · {payment.payer.email}</span><small title={payment.context.jobTitle || payment.context.subscriptionPlan || 'Platform payment'}>{payment.context.jobTitle || payment.context.subscriptionPlan || 'Platform payment'}</small></div>
            <div><span className="payment-history-label">Type</span><strong>{label(payment.paymentType)}</strong></div>
            <div><span className="payment-history-label">Amount</span><strong>{money(payment.amount, payment.currency)}</strong></div>
            <div><span className="payment-history-label">Provider</span><strong>{label(payment.provider)}</strong></div>
            <div><span className="payment-history-label">Status</span><span className={`payment-status payment-status--${payment.status.toLowerCase()}`}>{label(payment.status)}</span></div>
            <div className="payment-history-date"><span className="payment-history-label">Date</span><strong>{formatDate(payment.createdAt)}</strong></div>
            <button type="button" className="payment-history-details" onClick={(event) => { paymentDetailsTriggerRef.current = event.currentTarget; setSelectedPayment(payment); }} aria-label={`View details for ${payment.providerReference}`}><FaEye /> Details</button>
          </article>)}
        </div> : null}
        {nextCursor ? <button type="button" className="payment-load-more" onClick={() => void loadPayments(nextCursor, true)} disabled={paymentsLoading}>{paymentsLoading ? 'Loading...' : 'Load more payments'} <FaChevronDown /></button> : null}
      </section>

      {message ? <p className="payment-copy payment-copy--success" role="status">{message}</p> : null}
      {error ? <p className="payment-copy payment-copy--error" role="alert">{error}</p> : null}
      <section className="payment-panel" aria-labelledby="release-queue-title" aria-busy={isLoading}>
        <div className="payment-heading"><div><span><FaLock /> Authoritative escrow queue</span><h2 id="release-queue-title">Contracts Awaiting Release</h2><p className="payment-copy">Review completed freelance contracts before crediting seeker wallets.</p></div><button type="button" onClick={() => void loadCandidates()} disabled={isLoading}>Refresh</button></div>
        {isLoading ? <AdminPageSkeleton showToolbar={false} statCards={0} rows={4} /> : null}
        {!isLoading && !contracts.length ? <p className="payment-copy">No freelance contracts are currently release eligible.</p> : null}
        <div className="payment-list">
          {contracts.map((candidate) => {
            const { freelance } = candidate;
            const isConfirming = confirmingId === candidate.contractId;
            const isReleasing = loadingId === candidate.contractId;
            return <article className="payment-row payment-row--stack admin-release-card" key={candidate.contractId}>
              <div className="admin-release-card__heading"><div><strong>{candidate.job.title}</strong><p>Contract {candidate.contractId}</p></div><span className="payment-status payment-status--completed">{freelance.escrow.status}</span></div>
              <div className="admin-release-card__people"><div><span>Employer</span><strong>{fullName(candidate.employer)}</strong><small>{candidate.employer.email}</small></div><div><span>Seeker</span><strong>{fullName(candidate.seeker)}</strong><small>{candidate.seeker.email}</small></div></div>
              <div className="admin-release-card__money"><div><span>Gross/agreed amount</span><strong>{money(freelance.agreedAmount, freelance.currency)}</strong></div><div><span>Platform fee</span><strong>{money(freelance.platformFeeAmount, freelance.currency)} ({freelance.platformFeePercentage}%)</strong></div><div><span>Seeker net</span><strong>{money(freelance.seekerNetAmount, freelance.currency)}</strong></div><div><span>Escrow</span><strong>{freelance.escrow.status}</strong></div></div>
              <div className="admin-release-card__status"><span>Completion submitted: {formatDate(freelance.completionSubmittedAt)}</span><span>Employer confirmed: {formatDate(freelance.employerCompletionConfirmedAt)}</span><span>Release eligible: {formatDate(freelance.escrow.releaseEligibleAt)}</span></div>
              {isConfirming ? <div className="admin-release-confirmation" role="alert"><p><strong>Release {money(freelance.seekerNetAmount, freelance.currency)} to {fullName(candidate.seeker)}?</strong><br />This action will credit the seeker's wallet and cannot be reversed from this screen.</p><div><button type="button" onClick={() => void release(candidate)} disabled={Boolean(loadingId)}>{isReleasing ? 'Releasing...' : 'Confirm Release'}</button><button type="button" onClick={() => setConfirmingId(null)} disabled={Boolean(loadingId)}>Cancel</button></div></div> : <button type="button" className="button button--primary" onClick={() => setConfirmingId(candidate.contractId)} disabled={Boolean(loadingId)}><FaCheckCircle /> Release Funds</button>}
            </article>;
          })}
        </div>
      </section>

      {selectedPayment ? <div className="payment-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePaymentDetails(); }}><section className="payment-modal payment-details-modal" role="dialog" aria-modal="true" aria-labelledby="payment-details-title"><div className="payment-modal__header"><span>Payment details</span><button ref={paymentDetailsCloseRef} type="button" className="payment-modal__close" onClick={closePaymentDetails} aria-label="Close payment details"><FaTimes /></button></div><h2 id="payment-details-title">{selectedPayment.providerReference}</h2><div className="payment-details-grid"><div><span>Payment ID</span><strong>{selectedPayment.id}</strong></div><div><span>Provider reference</span><strong>{selectedPayment.providerReference}</strong></div><div><span>Transaction ID</span><strong>{selectedPayment.transactionId || 'Not recorded'}</strong></div><div><span>Payer</span><strong>{selectedPayment.payer.name}<small>{selectedPayment.payer.email}</small></strong></div><div><span>Payment type</span><strong>{label(selectedPayment.paymentType)}</strong></div><div><span>Amount</span><strong>{money(selectedPayment.amount, selectedPayment.currency)}</strong></div><div><span>Provider</span><strong>{label(selectedPayment.provider)}</strong></div><div><span>Status</span><strong>{label(selectedPayment.status)}</strong></div><div><span>Created</span><strong>{formatDate(selectedPayment.createdAt)}</strong></div><div><span>Verified</span><strong>{formatDate(selectedPayment.verifiedAt)}</strong></div><div><span>Related record</span><strong>{selectedPayment.context.jobTitle || selectedPayment.context.subscriptionPlan || 'Not linked'}</strong></div></div><button type="button" className="payment-heading-action" onClick={closePaymentDetails}>Close</button></section></div> : null}
    </div>
  );
}

export default AdminPaymentsPage;
