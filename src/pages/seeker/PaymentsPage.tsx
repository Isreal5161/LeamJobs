import { useEffect, useState, type ReactNode } from 'react';
import { FaArrowDown, FaCheckCircle, FaClock, FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getSeekerPaymentSummary,
  getSeekerPayments,
  getSeekerPayoutAccounts,
  getSeekerTransactions,
  getSeekerWithdrawals,
  requestSeekerWithdrawal,
  type ApiFailure,
  type SeekerPaymentItem,
  type SeekerPaymentSummary,
  type SeekerPayoutAccount,
  type SeekerTransactionItem,
  type SeekerWithdrawalItem,
} from '../../services/api';

const formatMoney = (amount: string | null | undefined, currency: string | null | undefined) => {
  if (!currency) return '-';
  const numericAmount = Number(amount ?? 0);
  if (!Number.isFinite(numericAmount)) return '-';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

const decimalToCents = (value: string) => {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};

const centsToAmount = (cents: bigint) => `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
const humanize = (value: string) => value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
const statusLabel = (status: string) => ({ CREDITED: 'Credited', PENDING: 'Pending', PROCESSING: 'Processing', SUCCESSFUL: 'Successful', FAILED: 'Failed', CANCELLED: 'Cancelled' }[status] ?? humanize(status));
const statusClass = (status: string) => status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const friendlyError = (failure: ApiFailure) => failure.status === 401 ? 'Your session has expired. Please sign in again.' : failure.status === 403 ? 'You do not have permission to view this information.' : 'We could not load this information right now. Please try again.';

function SectionState({ error, empty, children }: { error?: string; empty: string; children: ReactNode }) {
  if (error) return <p className="payment-copy payment-copy--error" role="alert">{error}</p>;
  return children || <p className="payment-copy">{empty}</p>;
}

function PaymentsPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<SeekerPaymentSummary | null>(null);
  const [payments, setPayments] = useState<SeekerPaymentItem[]>([]);
  const [transactions, setTransactions] = useState<SeekerTransactionItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<SeekerWithdrawalItem[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<SeekerPayoutAccount[]>([]);
  const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const loadPaymentData = async () => {
    if (!token) {
      setIsLoading(false);
      setError('Your session could not be loaded. Please sign in again.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSectionErrors({});
    const [summaryResult, paymentsResult, transactionsResult, withdrawalsResult, accountsResult] = await Promise.all([
      getSeekerPaymentSummary(token), getSeekerPayments(token), getSeekerTransactions(token), getSeekerWithdrawals(token), getSeekerPayoutAccounts(token),
    ]);
    const nextErrors: Record<string, string> = {};
    if (summaryResult.ok) setSummary(summaryResult.data.data); else nextErrors.summary = friendlyError(summaryResult);
    if (paymentsResult.ok) setPayments(paymentsResult.data.data.items); else nextErrors.payments = friendlyError(paymentsResult);
    if (transactionsResult.ok) setTransactions(transactionsResult.data.data.items); else nextErrors.transactions = friendlyError(transactionsResult);
    if (withdrawalsResult.ok) setWithdrawals(withdrawalsResult.data.data.items); else nextErrors.withdrawals = friendlyError(withdrawalsResult);
    if (accountsResult.ok) {
      const accounts = accountsResult.data.data.payoutAccounts;
      setPayoutAccounts(accounts);
      setSelectedPayoutAccountId((current) => current && accounts.some((account) => account.id === current) ? current : accounts.find((account) => account.isDefault)?.id ?? accounts[0]?.id ?? '');
    } else nextErrors.accounts = friendlyError(accountsResult);
    setSectionErrors(nextErrors);
    setIsLoading(false);
  };

  useEffect(() => { void loadPaymentData(); }, [token, retryKey]);
  useEffect(() => {
    if (!showConfirmation) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !isSubmitting) setShowConfirmation(false); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, showConfirmation]);

  const selectedPayoutAccount = payoutAccounts.find((account) => account.id === selectedPayoutAccountId) ?? null;
  const currency = summary?.currency ?? null;
  const availableCents = decimalToCents(summary?.availableBalance ?? '0');
  const amountCents = decimalToCents(amount);
  const hasValidAmount = amountCents !== null && amountCents > 0n && availableCents !== null && amountCents <= availableCents;
  const validateAmount = () => {
    if (!amount.trim()) return 'Enter an amount.';
    if (!amountCents || amountCents <= 0n) return 'Enter an amount greater than zero with no more than 2 decimal places.';
    if (!availableCents || amountCents > availableCents) return 'Your available balance is not sufficient for this withdrawal.';
    if (!currency) return 'Wallet currency is unavailable.';
    return '';
  };
  const withdrawalButtonReason = !currency ? 'Wallet currency is unavailable.' : !selectedPayoutAccount ? 'A verified payout account is required.' : !amount.trim() ? 'Enter an amount to continue.' : !hasValidAmount ? 'Enter a valid amount within your available balance.' : '';
  const openConfirmation = () => {
    const nextError = validateAmount();
    if (nextError) { setFormError(nextError); return; }
    if (!selectedPayoutAccount) { setFormError('No verified payout account is available. A verified payout account is required before withdrawal can be completed.'); return; }
    setFormError('');
    setShowConfirmation(true);
  };
  const submitWithdrawal = async () => {
    if (!token || !selectedPayoutAccount || !hasValidAmount || !currency || isSubmitting) return;
    const idempotencyKey = globalThis.crypto?.randomUUID?.();
    if (!idempotencyKey) { setFormError('This browser cannot securely create a withdrawal request key.'); return; }
    setIsSubmitting(true); setFormError(''); setNotice('');
    const result = await requestSeekerWithdrawal({ amount: amount.trim(), currency, payoutAccountId: selectedPayoutAccount.id }, idempotencyKey, token);
    if (!result.ok) {
      setIsSubmitting(false); setShowConfirmation(false);
      if (result.status === 401) setFormError('Your session has expired. Please sign in again.');
      else if (result.status === 403) setFormError('You are not allowed to request withdrawals.');
      else if (result.status === 404) setFormError('The selected payout account is no longer available. Please select another account.');
      else if (result.status === 409) setFormError('This withdrawal request conflicts with an existing request. Check your withdrawal history before trying again.');
      else if (result.status === 422) setFormError(result.error.message.includes('balance') ? 'Your available balance is no longer sufficient for this withdrawal.' : 'Please review the withdrawal details.');
      else setFormError("We couldn't confirm the withdrawal request. Please check your withdrawal history before trying again.");
      return;
    }
    setIsSubmitting(false); setShowConfirmation(false); setAmount('');
    setNotice(`Withdrawal request submitted. ${formatMoney(result.data.data.withdrawal.amount, result.data.data.withdrawal.currency)} is pending processing.`);
    await loadPaymentData();
  };

  if (isLoading) return <div className="payment-page"><section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p>Loading your financial data...</p></div><FaMoneyBillWave /></section></div>;
  if (error) return <div className="payment-page"><section className="payment-panel" role="alert"><div className="payment-heading"><div><h2>Unable to load financial data</h2><p className="payment-copy">{error}</p></div></div><div className="payment-actions"><button type="button" onClick={() => setRetryKey((current) => current + 1)}>Retry</button></div></section></div>;

  return <div className="payment-page">
    <section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p>Track completed work, available balance, and withdrawal requests.</p></div><FaMoneyBillWave aria-hidden="true" /></section>
    <section className="payment-stat-grid" aria-label="Wallet summary">
      <article className="payment-stat-card payment-stat-card--primary"><span>Available balance</span><strong>{formatMoney(summary?.availableBalance, currency)}</strong><small>Ready for withdrawal</small></article>
      <article><span>Pending withdrawal</span><strong>{formatMoney(summary?.pendingWithdrawalBalance, currency)}</strong><small>Reserved for processing</small></article>
      <article><span>Total earnings</span><strong>{formatMoney(summary?.totalEarnings, currency)}</strong><small>Credited wallet earnings</small></article>
      <article><span>Total withdrawn</span><strong>{formatMoney(summary?.totalWithdrawn, currency)}</strong><small>Successful withdrawals</small></article>
      {sectionErrors.summary && <p className="payment-copy payment-copy--error" role="alert">{sectionErrors.summary}</p>}
    </section>
    {notice && <p className="payment-notice" role="status">{notice}</p>}
    <main className="payment-content-grid">
      <section className="payment-panel payment-panel--withdrawal" aria-labelledby="withdrawal-heading">
        <div className="payment-heading"><div><span><FaArrowDown aria-hidden="true" /> Withdraw balance</span><h2 id="withdrawal-heading">Request a payout</h2></div><button type="button" className="payment-heading-action" onClick={openConfirmation} disabled={!hasValidAmount || !selectedPayoutAccount || isSubmitting}>Withdraw</button></div>
        <div className="payment-withdraw-box">
          <div className="payment-balance-line"><span>Available to withdraw</span><strong>{formatMoney(summary?.availableBalance, currency)}</strong></div>
          <label htmlFor="withdrawal-amount">Amount<input id="withdrawal-amount" type="text" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setFormError(''); }} placeholder="0.00" aria-invalid={Boolean(formError)} aria-describedby="withdrawal-help withdrawal-error" disabled={isSubmitting} /></label>
          <label htmlFor="payout-account">Payout account<select id="payout-account" value={selectedPayoutAccountId} onChange={(event) => setSelectedPayoutAccountId(event.target.value)} disabled={isSubmitting || payoutAccounts.length === 0}><option value="">Select a verified account</option>{payoutAccounts.map((account) => <option value={account.id} key={account.id}>{account.provider} - {account.accountName} •••• {account.accountNumberLast4}{account.isDefault ? ' (Default)' : ''}</option>)}</select></label>
          <p id="withdrawal-help">Currency: {currency ?? 'Unavailable'}. The amount will be reserved and remain pending processing.</p>
          {sectionErrors.accounts && <p className="payment-copy payment-copy--error" role="alert">{sectionErrors.accounts}</p>}
          {!sectionErrors.accounts && payoutAccounts.length === 0 && <p className="payment-copy">No verified payout account is available. A verified payout account is required before withdrawal can be completed.</p>}
          {formError && <p id="withdrawal-error" className="payment-copy payment-copy--error" role="alert">{formError}</p>}
          {!formError && withdrawalButtonReason && <p className="payment-copy">{withdrawalButtonReason}</p>}
          <button type="button" onClick={openConfirmation} disabled={!hasValidAmount || !selectedPayoutAccount || isSubmitting}>{isSubmitting ? 'Submitting withdrawal...' : 'Review withdrawal'}</button>
        </div>
      </section>
      <section className="payment-panel" aria-labelledby="account-heading">
        <div className="payment-heading"><div><span><FaCheckCircle aria-hidden="true" /> Payout account</span><h2 id="account-heading">Where withdrawals go</h2></div></div>
        <SectionState error={sectionErrors.accounts} empty="No verified payout account is available."><div className="payment-account-list">{payoutAccounts.length > 0 ? payoutAccounts.map((account) => <article className="payment-account" key={account.id}><div><strong>{account.provider}</strong><p>{account.accountName} ···· {account.accountNumberLast4}</p></div><span className="payment-status payment-status--verified">Verified{account.isDefault ? ' · Default' : ''}</span></article>) : <p className="payment-copy">A verified payout account is required before withdrawal can be completed.</p>}</div></SectionState>
      </section>
    </main>
    <section className="payment-panel" aria-labelledby="payments-heading"><div className="payment-heading"><div><span><FaReceipt aria-hidden="true" /> Earnings</span><h2 id="payments-heading">Job payment history</h2></div></div><SectionState error={sectionErrors.payments} empty="No payment activity yet."><div className="payment-list">{payments.length > 0 ? payments.map((payment) => <article className="payment-row payment-row--payment" key={payment.id}><div><strong>{payment.jobTitle || 'Payment activity'}</strong><p>{payment.employerName || 'Employer unavailable'} · {formatDate(payment.date)}</p></div><div><span className={`payment-status payment-status--${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span><p>Payment status</p></div><div><strong>{formatMoney(payment.amount, payment.currency)}</strong><p>Gross amount</p></div><div><strong>{formatMoney(payment.platformFee, payment.currency)}</strong><p>Platform fee</p></div><div><strong>{formatMoney(payment.netAmount, payment.currency)}</strong><p>Net amount</p></div></article>) : <p className="payment-copy">No payment activity yet.</p>}</div></SectionState></section>
    <section className="payment-panel" aria-labelledby="transactions-heading"><div className="payment-heading"><div><span><FaReceipt aria-hidden="true" /> Transactions</span><h2 id="transactions-heading">Wallet transaction history</h2></div></div><SectionState error={sectionErrors.transactions} empty="No wallet transactions yet."><div className="payment-list">{transactions.length > 0 ? transactions.map((transaction) => <article className="payment-row payment-row--transaction" key={transaction.id}><div><strong>{humanize(transaction.type)}</strong><p>{transaction.description || 'No description'} · {formatDate(transaction.createdAt)}</p></div><div><strong>{formatMoney(transaction.amount, transaction.currency)}</strong><p>{transaction.currency}</p></div><div><strong>{formatMoney(transaction.balanceAfter, transaction.currency)}</strong><p>Balance after</p></div></article>) : <p className="payment-copy">No wallet transactions yet.</p>}</div></SectionState></section>
    <section className="payment-panel" aria-labelledby="withdrawals-heading"><div className="payment-heading"><div><span><FaArrowDown aria-hidden="true" /> Withdrawals</span><h2 id="withdrawals-heading">Withdrawal history</h2></div></div><SectionState error={sectionErrors.withdrawals} empty="No withdrawal requests yet."><div className="payment-list">{withdrawals.length > 0 ? withdrawals.map((withdrawal) => <article className="payment-row payment-row--withdrawal" key={withdrawal.id}><div><strong>{formatMoney(withdrawal.amount, withdrawal.currency)} request</strong><p>Requested {formatDate(withdrawal.requestedAt)} · {withdrawal.paymentMethod ? `${humanize(withdrawal.paymentMethod.type)} ···· ${withdrawal.paymentMethod.last4}` : 'Payment method unavailable'}</p></div><div><span className={`payment-status payment-status--${statusClass(withdrawal.status)}`}>{statusLabel(withdrawal.status)}</span><p>Status</p></div><div className="payment-date-list"><p>Processing: {formatDate(withdrawal.processingAt)}</p><p>Completed: {formatDate(withdrawal.completedAt)}</p><p>Failed: {formatDate(withdrawal.failedAt)}</p></div>{withdrawal.failureReason && <p className="payment-copy payment-copy--error">Failure reason: {withdrawal.failureReason}</p>}</article>) : <p className="payment-copy">No withdrawal requests yet.</p>}</div></SectionState></section>
    {showConfirmation && selectedPayoutAccount && <div className="payment-modal-backdrop" role="presentation"><section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-confirmation-title" aria-describedby="withdrawal-confirmation-copy"><div className="payment-modal__header"><span><FaClock aria-hidden="true" /> Confirm withdrawal</span><button type="button" className="payment-modal__close" onClick={() => setShowConfirmation(false)} disabled={isSubmitting} aria-label="Close withdrawal confirmation">×</button></div><h2 id="withdrawal-confirmation-title">Review payout request</h2><div className="payment-modal__amount"><span>Amount</span><strong>{formatMoney(amount, currency)}</strong></div><p id="withdrawal-confirmation-copy">To: {selectedPayoutAccount.provider} ···· {selectedPayoutAccount.accountNumberLast4}</p><p>Available after request: {availableCents !== null && amountCents !== null ? formatMoney(centsToAmount(availableCents - amountCents), currency) : '-'}</p><p>The amount will be reserved from your available balance and remain pending processing.</p><div className="payment-actions"><button type="button" className="payment-button-secondary" onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>Cancel</button><button type="button" onClick={submitWithdrawal} disabled={isSubmitting}>{isSubmitting ? 'Submitting withdrawal...' : 'Confirm withdrawal'}</button></div></section></div>}
  </div>;
}

export default PaymentsPage;
