import { useEffect, useState } from 'react';
import { FaArrowDown, FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getSeekerPaymentSummary,
  getSeekerPayments,
  getSeekerPayoutAccounts,
  getSeekerTransactions,
  getSeekerWithdrawals,
  requestSeekerWithdrawal,
  type SeekerPaymentItem,
  type SeekerPaymentSummary,
  type SeekerPayoutAccount,
  type SeekerTransactionItem,
  type SeekerWithdrawalItem,
} from '../../services/api';

const formatMoney = (amount: string, currency: string | null) => {
  if (!currency) return '-';
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return '-';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numericAmount);
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));

const decimalToCents = (value: string) => {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};

const statusLabel = (status: string) => ({
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SUCCESSFUL: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}[status] ?? status);

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
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const loadPaymentData = async (isMounted?: () => boolean) => {
    if (!token) {
      setIsLoading(false);
      setError('Your session could not be loaded. Please sign in again.');
      return;
    }

    setIsLoading(true);
    setError('');
    const results = await Promise.all([
      getSeekerPaymentSummary(token),
      getSeekerPayments(token),
      getSeekerTransactions(token),
      getSeekerWithdrawals(token),
      getSeekerPayoutAccounts(token),
    ]);
    if (isMounted && !isMounted()) return;

    const failedResult = results.find((result) => !result.ok);
    if (failedResult && !failedResult.ok) {
      setError(failedResult.error.message || 'We could not load your financial data.');
      setIsLoading(false);
      return;
    }

    const [summaryResult, paymentsResult, transactionsResult, withdrawalsResult, accountsResult] = results;
    if (summaryResult.ok) setSummary(summaryResult.data.data);
    if (paymentsResult.ok) setPayments(paymentsResult.data.data.items);
    if (transactionsResult.ok) setTransactions(transactionsResult.data.data.items);
    if (withdrawalsResult.ok) setWithdrawals(withdrawalsResult.data.data.items);
    if (accountsResult.ok) {
      const accounts = accountsResult.data.data.payoutAccounts;
      setPayoutAccounts(accounts);
      setSelectedPayoutAccountId((current) => current && accounts.some((account) => account.id === current)
        ? current
        : accounts.find((account) => account.isDefault)?.id ?? accounts[0]?.id ?? '');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    void loadPaymentData(() => isMounted);
    return () => { isMounted = false; };
  }, [token, retryKey]);

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

  const openConfirmation = () => {
    const nextError = validateAmount();
    if (nextError) {
      setFormError(nextError);
      return;
    }
    if (!selectedPayoutAccount) {
      setFormError('No verified payout account is available. Add and verify a payout account before requesting a withdrawal.');
      return;
    }
    setFormError('');
    setShowConfirmation(true);
  };

  const submitWithdrawal = async () => {
    if (!token || !selectedPayoutAccount || !hasValidAmount || !currency || isSubmitting) return;
    const idempotencyKey = globalThis.crypto?.randomUUID?.();
    if (!idempotencyKey) {
      setFormError('This browser cannot securely create a withdrawal request key.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setNotice('');
    const result = await requestSeekerWithdrawal({ amount: amount.trim(), currency, payoutAccountId: selectedPayoutAccount.id }, idempotencyKey, token);

    if (!result.ok) {
      setIsSubmitting(false);
      setShowConfirmation(false);
      if (result.status === 401) setFormError('Your session has expired. Please sign in again.');
      else if (result.status === 403) setFormError('You are not allowed to request withdrawals.');
      else if (result.status === 404) setFormError('The selected payout account is no longer available. Please select another account.');
      else if (result.status === 409) setFormError('This withdrawal request conflicts with an existing request. Check your withdrawal history before trying again.');
      else if (result.status === 422) setFormError(result.error.message.includes('balance') ? 'Your available balance is no longer sufficient for this withdrawal. Your balance may have changed because of another withdrawal request.' : result.error.message || 'Please review the withdrawal details.');
      else setFormError("We couldn't confirm the withdrawal request. Please check your withdrawal history before trying again.");
      return;
    }

    setIsSubmitting(false);
    setShowConfirmation(false);
    setAmount('');
    setNotice(`Withdrawal request submitted. ${formatMoney(result.data.data.withdrawal.amount, result.data.data.withdrawal.currency)} has been reserved from your available balance and is pending processing.`);
    await loadPaymentData();
  };

  if (isLoading) return <div className="payment-page"><section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p>Loading your financial data...</p></div><FaMoneyBillWave /></section></div>;
  if (error) return <div className="payment-page"><section className="payment-panel" role="alert"><div className="payment-heading"><div><h2>Unable to load financial data</h2><p className="payment-copy">{error}</p></div></div><div className="payment-actions"><button type="button" onClick={() => setRetryKey((current) => current + 1)}>Retry</button></div></section></div>;

  const hasPaymentData = payments.length > 0;
  const hasWithdrawalData = withdrawals.length > 0;
  const hasTransactionData = transactions.length > 0;

  return <div className="payment-page">
    <section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p>Track completed work, available balance, and withdrawal requests.</p></div><FaMoneyBillWave /></section>
    <section className="payment-stat-grid"><article><span>Available balance</span><strong>{formatMoney(summary?.availableBalance ?? '0.00', currency)}</strong><small>Current wallet balance</small></article><article><span>Pending withdrawal</span><strong>{formatMoney(summary?.pendingWithdrawalBalance ?? '0.00', currency)}</strong><small>Reserved for withdrawal</small></article><article><span>Total earnings</span><strong>{formatMoney(summary?.totalEarnings ?? '0.00', currency)}</strong><small>Credited wallet earnings</small></article><article><span>Total withdrawn</span><strong>{formatMoney(summary?.totalWithdrawn ?? '0.00', currency)}</strong><small>Successful withdrawals</small></article></section>
    {notice && <p className="payment-notice" role="status">{notice}</p>}
    <main className="payment-content-grid">
      <section className="payment-panel"><div className="payment-heading"><div><span><FaArrowDown /> Withdraw balance</span><h2>Request a payout</h2></div></div><div className="payment-withdraw-box">
        {payoutAccounts.length === 0 ? <p>No verified payout account is available. Add and verify a payout account before requesting a withdrawal.</p> : <>
          <label>Amount<input type="text" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setFormError(''); }} placeholder={`Up to ${formatMoney(summary?.availableBalance ?? '0.00', currency)}`} aria-describedby="withdrawal-help" /></label>
          <label>Payout account<select value={selectedPayoutAccountId} onChange={(event) => setSelectedPayoutAccountId(event.target.value)} disabled={isSubmitting}><option value="">Select a payout account</option>{payoutAccounts.map((account) => <option value={account.id} key={account.id}>{account.provider} - {account.accountName} •••• {account.accountNumberLast4}{account.isDefault ? ' (Default)' : ''}</option>)}</select></label>
          <p id="withdrawal-help">The amount will be reserved from your available balance and remain pending processing.</p>
          {formError && <p className="payment-copy" role="alert">{formError}</p>}
          <button type="button" onClick={openConfirmation} disabled={!selectedPayoutAccount || isSubmitting || !hasValidAmount}>Review withdrawal</button>
        </>}
      </div></section>
      <section className="payment-panel"><div className="payment-heading"><div><span><FaReceipt /> Earnings</span><h2>Job payment history</h2></div></div><div className="payment-list">{hasPaymentData ? payments.map((payment) => <article className="payment-row" key={payment.id}><div><strong>{payment.jobTitle || 'Payment activity'}</strong><p>{payment.employerName || 'Employer unavailable'} / {payment.status} / {formatDate(payment.date)}</p></div><strong>{formatMoney(payment.netAmount, payment.currency)}</strong></article>) : <p className="payment-copy">No payment activity yet.</p>}</div></section>
    </main>
    <section className="payment-panel"><div className="payment-heading"><div><span><FaReceipt /> Transactions</span><h2>Wallet transaction history</h2></div></div><div className="payment-list">{hasTransactionData ? transactions.map((transaction) => <article className="payment-row" key={transaction.id}><div><strong>{transaction.type}</strong><p>{transaction.description || 'Financial ledger entry'} / {formatDate(transaction.createdAt)}</p></div><strong>{formatMoney(transaction.amount, transaction.currency)}</strong></article>) : <p className="payment-copy">No transactions yet.</p>}</div></section>
    <section className="payment-panel"><div className="payment-heading"><div><span><FaArrowDown /> Withdrawals</span><h2>Withdrawal history</h2></div></div><div className="payment-list">{hasWithdrawalData ? withdrawals.map((withdrawal) => <article className="payment-row" key={withdrawal.id}><div><strong>{formatMoney(withdrawal.amount, withdrawal.currency)} request</strong><p>{withdrawal.paymentMethod ? `Bank transfer •••• ${withdrawal.paymentMethod.last4}` : 'No payout account configured'} / {formatDate(withdrawal.requestedAt)}</p></div><span className={`payment-status payment-status--${withdrawal.status.toLowerCase()}`}>{statusLabel(withdrawal.status)}</span></article>) : <p className="payment-copy">No withdrawal requests yet.</p>}</div></section>
    {showConfirmation && selectedPayoutAccount && <div className="payment-modal-backdrop" role="presentation"><section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-confirmation-title"><h2 id="withdrawal-confirmation-title">Confirm withdrawal</h2><p className="payment-modal__amount">Amount: {formatMoney(amount, currency)}</p><p>To: {selectedPayoutAccount.provider} •••• {selectedPayoutAccount.accountNumberLast4}</p><p>Available balance: {formatMoney(summary?.availableBalance ?? '0.00', currency)}</p><p>The amount will be reserved from your available balance and remain pending processing.</p><div className="payment-actions"><button type="button" className="payment-button-secondary" onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>Cancel</button><button type="button" onClick={submitWithdrawal} disabled={isSubmitting}>{isSubmitting ? 'Submitting withdrawal...' : 'Confirm withdrawal'}</button></div></section></div>}
  </div>;
}

export default PaymentsPage;
