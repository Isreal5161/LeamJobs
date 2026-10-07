import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { FaArrowDown, FaCheckCircle, FaClock, FaMoneyBillWave, FaReceipt, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getSeekerPaymentSummary,
  getSeekerPayments,
  getSeekerPayoutAccounts,
  getSeekerPayoutCapabilities,
  getSeekerPayoutBanks,
  getSeekerProfile,
  createSeekerPayoutAccount,
  updateSeekerPayoutAccount,
  getSeekerTransactions,
  getSeekerWithdrawals,
  getSeekerWithdrawalQuote,
  requestSeekerWithdrawal,
  type ApiFailure,
  type SeekerPaymentItem,
  type SeekerPaymentSummary,
  type SeekerPayoutAccount,
  type SeekerPayoutBank,
  type SeekerPayoutCapability,
  type SeekerTransactionItem,
  type SeekerWithdrawalQuote,
  type SeekerWithdrawalItem,
} from '../../services/api';

const formatMoney = (amount: string | null | undefined, currency: string | null | undefined) => {
  if (!currency) return 'Currency unavailable';
  const numericAmount = Number(amount ?? 0);
  if (!Number.isFinite(numericAmount)) return 'Amount unavailable';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};

const formatPayoutCurrency = (capability: SeekerPayoutCapability) => {
  const countryCode = capability.countryCode.toUpperCase();
  const flag = /^[A-Z]{2}$/.test(countryCode)
    ? String.fromCodePoint(...Array.from(countryCode, (letter) => letter.charCodeAt(0) + 127397))
    : '';
  let currencyName: string | undefined;
  try {
    currencyName = new Intl.DisplayNames(undefined, { type: 'currency' })
      .of(capability.currency)
      ?.replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    currencyName = undefined;
  }
  return `${flag ? `${flag} ` : ''}${capability.currency}${currencyName ? ` — ${currencyName}` : ''}`;
};

const normalizeCurrencyCode = (value: string | null | undefined) => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
};

const isCurrentCapabilityAccount = (
  account: SeekerPayoutAccount,
  capabilities: SeekerPayoutCapability[],
) => capabilities.some((capability) => (
  capability.country === account.country
  && capability.currency === account.currency
  && capability.provider === account.provider
  && capability.payoutMethod === account.payoutMethod
));

const isAvailablePayoutAccount = (
  account: SeekerPayoutAccount,
  capabilities: SeekerPayoutCapability[],
) => account.withdrawalSupported
  && account.verified
  && account.status !== 'DISABLED'
  && isCurrentCapabilityAccount(account, capabilities);

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
  const [payoutCapabilities, setPayoutCapabilities] = useState<SeekerPayoutCapability[]>([]);
  const [payoutBanks, setPayoutBanks] = useState<SeekerPayoutBank[]>([]);
  const [isLoadingPayoutBanks, setIsLoadingPayoutBanks] = useState(false);
  const [payoutBankError, setPayoutBankError] = useState('');
  const [payoutBankSearch, setPayoutBankSearch] = useState('');
  const [payoutCapabilityError, setPayoutCapabilityError] = useState('');
  const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState('');
  const [profileCountry, setProfileCountry] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [withdrawalQuote, setWithdrawalQuote] = useState<SeekerWithdrawalQuote | null>(null);
  const [isLoadingWithdrawalQuote, setIsLoadingWithdrawalQuote] = useState(false);
  const [withdrawalQuoteError, setWithdrawalQuoteError] = useState('');
  const [withdrawalQuoteRefreshKey, setWithdrawalQuoteRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const emptyPayoutForm = {
    bankCode: '',
    accountNumber: '',
  };
  const [selectedPayoutCountry, setSelectedPayoutCountry] = useState('');
  const [showPayoutSettings, setShowPayoutSettings] = useState(false);
  const [editingPayoutAccountId, setEditingPayoutAccountId] = useState<string | null>(null);
  const [payoutForm, setPayoutForm] = useState(emptyPayoutForm);
  const [payoutFormError, setPayoutFormError] = useState('');
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [payoutNotice, setPayoutNotice] = useState('');
  const payoutSettingsTriggerRef = useRef<HTMLButtonElement>(null);
  const currency = normalizeCurrencyCode(summary?.currency);
  const withdrawalCapability = currency
    ? payoutCapabilities.find((capability) => normalizeCurrencyCode(capability.currency) === currency) ?? null
    : null;

  const loadPaymentData = async () => {
    if (!token) {
      setIsLoading(false);
      setError('Your session could not be loaded. Please sign in again.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSectionErrors({});
    const [summaryResult, paymentsResult, transactionsResult, withdrawalsResult, accountsResult, profileResult, capabilitiesResult] = await Promise.all([
      getSeekerPaymentSummary(token), getSeekerPayments(token), getSeekerTransactions(token), getSeekerWithdrawals(token), getSeekerPayoutAccounts(token), getSeekerProfile(token), getSeekerPayoutCapabilities(token),
    ]);
    const nextErrors: Record<string, string> = {};
    if (summaryResult.ok) setSummary(summaryResult.data.data); else nextErrors.summary = friendlyError(summaryResult);
    if (paymentsResult.ok) setPayments(paymentsResult.data.data.items); else nextErrors.payments = friendlyError(paymentsResult);
    if (transactionsResult.ok) setTransactions(transactionsResult.data.data.items); else nextErrors.transactions = friendlyError(transactionsResult);
    if (withdrawalsResult.ok) setWithdrawals(withdrawalsResult.data.data.items); else nextErrors.withdrawals = friendlyError(withdrawalsResult);
    if (accountsResult.ok) {
      const accounts = accountsResult.data.data.payoutAccounts;
      setPayoutAccounts(accounts);
      const walletCurrency = summaryResult.ok ? normalizeCurrencyCode(summaryResult.data.data.currency) : null;
      const supportedCapabilities = capabilitiesResult.ok ? capabilitiesResult.data.data.capabilities : [];
      const eligibleAccounts = accounts.filter((account) => isAvailablePayoutAccount(account, supportedCapabilities)
        && account.currency === walletCurrency);
      setSelectedPayoutAccountId((current) => current && eligibleAccounts.some((account) => account.id === current)
        ? current
        : eligibleAccounts.find((account) => account.isDefault)?.id ?? eligibleAccounts[0]?.id ?? '');
    } else nextErrors.accounts = friendlyError(accountsResult);
    if (profileResult.ok) setProfileCountry(profileResult.data.data.profile.country);
    if (capabilitiesResult.ok) {
      const capabilities = capabilitiesResult.data.data.capabilities;
      setPayoutCapabilities(capabilities);
      setPayoutCapabilityError('');
      const country = profileResult.ok ? profileResult.data.data.profile.country : null;
      setSelectedPayoutCountry((current) => current && capabilities.some((entry) => entry.country === current)
        ? current
        : capabilities.find((entry) => entry.country === country)?.country ?? capabilities[0]?.country ?? '');
    } else {
      setPayoutCapabilities([]);
      setPayoutCapabilityError(friendlyError(capabilitiesResult));
    }
    setSectionErrors(nextErrors);
    setIsLoading(false);
  };

  useEffect(() => { void loadPaymentData(); }, [token, retryKey]);
  useEffect(() => {
    const amountCents = decimalToCents(amount);
    if (!token || !currency || !withdrawalCapability || !selectedPayoutAccountId || amountCents === null || amountCents <= 0n) {
      setWithdrawalQuote(null);
      setIsLoadingWithdrawalQuote(false);
      setWithdrawalQuoteError('');
      return undefined;
    }
    let active = true;
    setWithdrawalQuote(null);
    setWithdrawalQuoteError('');
    setIsLoadingWithdrawalQuote(true);
    const timeout = window.setTimeout(() => {
      void getSeekerWithdrawalQuote(amount.trim(), currency, selectedPayoutAccountId, token).then((result) => {
        if (!active) return;
        if (result.ok) {
          setWithdrawalQuote(result.data.data.withdrawalQuote);
          setWithdrawalQuoteError('');
        } else {
          setWithdrawalQuote(null);
          setWithdrawalQuoteError(result.error.message || 'Withdrawal estimate is unavailable.');
        }
        setIsLoadingWithdrawalQuote(false);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [amount, currency, selectedPayoutAccountId, token, withdrawalCapability, withdrawalQuoteRefreshKey]);
  useEffect(() => {
    if (!showConfirmation && !showPayoutSettings) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showConfirmation && !isSubmitting) setShowConfirmation(false);
      if (showPayoutSettings && !isSavingPayout) closePayoutSettings();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSavingPayout, isSubmitting, showConfirmation, showPayoutSettings]);

  useEffect(() => {
    const accountCountry = editingPayoutAccountId
      ? payoutAccounts.find((account) => account.id === editingPayoutAccountId)?.country
      : selectedPayoutCountry;
    const capability = payoutCapabilities.find((entry) => entry.country === accountCountry);
    if (!showPayoutSettings || !token || !capability?.bankListAvailable) {
      setPayoutBanks([]);
      setIsLoadingPayoutBanks(false);
      return undefined;
    }
    let active = true;
    setIsLoadingPayoutBanks(true);
    setPayoutBankError('');
    void getSeekerPayoutBanks(capability.countryCode, token).then((result) => {
      if (!active) return;
      if (result.ok) setPayoutBanks(result.data.data.banks);
      else {
        setPayoutBanks([]);
        setPayoutBankError(result.error.message || 'We could not load the supported banks. Please try again.');
      }
      setIsLoadingPayoutBanks(false);
    });
    return () => { active = false; };
  }, [editingPayoutAccountId, payoutAccounts, payoutCapabilities, selectedPayoutCountry, showPayoutSettings, token]);

  const availablePayoutAccounts = payoutAccounts.filter((account) => isAvailablePayoutAccount(account, payoutCapabilities));
  const availablePayoutAccountIds = new Set(availablePayoutAccounts.map((account) => account.id));
  const historicalPayoutAccounts = payoutAccounts.filter((account) => !availablePayoutAccountIds.has(account.id));
  const eligiblePayoutAccounts = availablePayoutAccounts.filter((account) => account.currency === currency);
  const selectedPayoutAccount = eligiblePayoutAccounts.find((account) => account.id === selectedPayoutAccountId) ?? null;
  const displayCurrency = currency;
  const sortedPayoutBanks = [...payoutBanks].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
  const normalizedBankSearch = payoutBankSearch.trim().toLocaleLowerCase();
  const filteredPayoutBanks = sortedPayoutBanks.filter((bank) => !normalizedBankSearch
    || bank.name.toLocaleLowerCase().includes(normalizedBankSearch)
    || bank.code.toLocaleLowerCase().includes(normalizedBankSearch));
  const editingPayoutAccount = editingPayoutAccountId ? payoutAccounts.find((account) => account.id === editingPayoutAccountId) ?? null : null;
  const payoutCountry = editingPayoutAccount?.country ?? selectedPayoutCountry;
  const payoutCapability = payoutCapabilities.find((capability) => capability.country === payoutCountry) ?? null;
  const supportsBankAccount = payoutCapability?.payoutMethod === 'BANK_ACCOUNT'
    && payoutCapability.verificationMethod === 'FLUTTERWAVE_ACCOUNT_RESOLVE';
  const canEditPayoutAccount = (account: SeekerPayoutAccount) => account.withdrawalSupported || account.provider === 'PAYSTACK';
  const availableCents = decimalToCents(summary?.availableBalance ?? '0');
  const amountCents = decimalToCents(amount);
  const hasValidAmount = amountCents !== null && amountCents > 0n && availableCents !== null && amountCents <= availableCents;
  const validateAmount = () => {
    if (!amount.trim()) return 'Enter an amount.';
    if (!amountCents || amountCents <= 0n) return 'Enter an amount greater than zero with no more than 2 decimal places.';
    if (!availableCents || amountCents > availableCents) return 'Your available balance is not sufficient for this withdrawal.';
    if (!currency) return 'Wallet currency is unavailable.';
    if (!withdrawalCapability) return 'Withdrawals are not supported for this wallet currency.';
    return '';
  };
  const withdrawalButtonReason = !currency
    ? 'Wallet currency is unavailable.'
    : !withdrawalCapability
      ? 'Withdrawals are not supported for this wallet currency.'
      : !selectedPayoutAccount
        ? 'A payout account supported for your wallet currency is required.'
        : !amount.trim()
          ? 'Enter an amount to continue.'
          : !hasValidAmount
            ? 'Enter a valid amount within your available balance.'
            : '';
  const openConfirmation = () => {
    const nextError = validateAmount();
    if (nextError) { setFormError(nextError); return; }
    if (!withdrawalQuote || isLoadingWithdrawalQuote || withdrawalQuoteError) {
      setFormError('Wait for the current withdrawal estimate before continuing.');
      return;
    }
    if (!selectedPayoutAccount) { setFormError('No supported payout account matching your wallet currency is available.'); return; }
    setFormError('');
    setShowConfirmation(true);
  };

  const openPayoutSettings = (account?: SeekerPayoutAccount) => {
    setEditingPayoutAccountId(account?.id ?? null);
    if (account) setSelectedPayoutCountry(account.country);
    setPayoutForm(emptyPayoutForm);
    setPayoutBankSearch('');
    setPayoutFormError('');
    setPayoutNotice('');
    setShowPayoutSettings(true);
  };
  const closePayoutSettings = () => {
    setShowPayoutSettings(false);
    setEditingPayoutAccountId(null);
    setPayoutForm(emptyPayoutForm);
    setPayoutBankSearch('');
    setPayoutFormError('');
    setPayoutNotice('');
    window.setTimeout(() => payoutSettingsTriggerRef.current?.focus(), 0);
  };
  const validatePayoutForm = () => {
    if (supportsBankAccount) {
      if (!payoutForm.bankCode.trim()) return 'Select your bank.';
      if (isLoadingPayoutBanks || payoutBankError) return 'Wait until the supported bank list is available.';
      if (!/^\d{6,20}$/.test(payoutForm.accountNumber.trim())) return 'Enter a valid account number.';
    } else return 'Payouts are not supported for this country.';
    return '';
  };
  const handleSavePayoutDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || isSavingPayout) return;
    const nextError = validatePayoutForm();
    if (nextError) { setPayoutFormError(nextError); return; }
    setPayoutFormError('');
    setPayoutNotice('');
    setIsSavingPayout(true);
    if (!payoutCapability) {
      setIsSavingPayout(false);
      setPayoutFormError('Payouts are not supported for this country.');
      return;
    }
    const payload = {
      country: payoutCapability.country,
      bankCode: payoutForm.bankCode,
      accountNumber: payoutForm.accountNumber.trim(),
    };
    const result = editingPayoutAccountId
      ? await updateSeekerPayoutAccount(editingPayoutAccountId, payload, token)
      : await createSeekerPayoutAccount(payload, token);
    setIsSavingPayout(false);
    if (!result.ok) {
      if (result.status === 409) setPayoutFormError(result.error.message || 'This payout account conflicts with an existing request.');
      else if (result.status === 401) setPayoutFormError('Your session has expired. Please sign in again.');
      else if (result.status === 403) setPayoutFormError('You do not have permission to manage payout accounts.');
      else if (result.error.details && Array.isArray(result.error.details)) setPayoutFormError(result.error.details.map((detail) => typeof detail === 'object' && detail !== null && 'message' in detail ? String(detail.message) : '').filter(Boolean).join(' ') || result.error.message);
      else setPayoutFormError(result.error.message || 'We could not save your payout details.');
      return;
    }
    setPayoutAccounts((current) => editingPayoutAccountId
      ? current.map((account) => account.id === result.data.data.payoutAccount.id ? result.data.data.payoutAccount : account)
      : [...current, result.data.data.payoutAccount]);
    if (result.data.data.payoutAccount.withdrawalSupported && result.data.data.payoutAccount.currency === currency) {
      setSelectedPayoutAccountId(result.data.data.payoutAccount.id);
    }
    setPayoutNotice(`${editingPayoutAccountId ? 'Payout details updated' : 'Payout details saved'}: ${result.data.data.payoutAccount.verified ? 'Verified by Flutterwave' : 'not currently eligible for withdrawals'}.`);
    setPayoutForm(emptyPayoutForm);
    setEditingPayoutAccountId(null);
    setPayoutFormError('');
  };

  const setDefaultPayoutAccount = async (accountId: string) => {
    if (!token || isSavingPayout) return;
    setIsSavingPayout(true);
    setPayoutNotice('');
    const result = await updateSeekerPayoutAccount(accountId, { isDefault: true }, token);
    setIsSavingPayout(false);
    if (!result.ok) {
      setPayoutFormError(result.status === 409 ? 'This account could not be made default.' : result.error.message || 'We could not update the default payout account.');
      return;
    }
    setPayoutFormError('');
    const refreshed = await getSeekerPayoutAccounts(token);
    if (refreshed.ok) setPayoutAccounts(refreshed.data.data.payoutAccounts);
    else setPayoutAccounts((current) => current.map((account) => ({ ...account, isDefault: account.id === accountId })));
    setSelectedPayoutAccountId(accountId);
    setPayoutNotice('Default payout account updated.');
  };
  const submitWithdrawal = async () => {
    if (!token || !selectedPayoutAccount || !hasValidAmount || !currency || !withdrawalCapability || !withdrawalQuote || isSubmitting) return;
    const idempotencyKey = globalThis.crypto?.randomUUID?.();
    if (!idempotencyKey) { setFormError('This browser cannot securely create a withdrawal request key.'); return; }
    setIsSubmitting(true); setFormError(''); setNotice('');
    const result = await requestSeekerWithdrawal({ quoteReference: withdrawalQuote.quoteReference }, idempotencyKey, token);
    if (!result.ok) {
      setIsSubmitting(false);
      if (result.error.code === 'WITHDRAWAL_QUOTE_STALE') {
        setShowConfirmation(false);
        setWithdrawalQuote(null);
        setWithdrawalQuoteError('');
        setNotice('The withdrawal charge changed or the quote expired. Review the updated estimate before confirming again.');
        setWithdrawalQuoteRefreshKey((current) => current + 1);
        return;
      }
      setShowConfirmation(false);
      if (result.status === 401) setFormError('Your session has expired. Please sign in again.');
      else if (result.status === 403) setFormError('You are not allowed to request withdrawals.');
      else if (result.status === 404) setFormError('The selected payout account is no longer available. Please select another account.');
      else if (result.status === 409) setFormError('This withdrawal request conflicts with an existing request. Check your withdrawal history before trying again.');
      else if (result.status === 422) setFormError(result.error.message.includes('balance') ? 'Your available balance is no longer sufficient for this withdrawal.' : 'Please review the withdrawal details.');
      else setFormError("We couldn't confirm the withdrawal request. Please check your withdrawal history before trying again.");
      return;
    }
    setIsSubmitting(false); setShowConfirmation(false); setAmount('');
    const created = result.data.data.withdrawal;
    setNotice(`Withdrawal request submitted. ${formatMoney(created.payoutAmount, created.currency)} will be paid to you after processing; ${formatMoney(created.withdrawalFeeAmount, created.currency)} is the platform withdrawal charge.`);
    await loadPaymentData();
  };

  if (isLoading) {
    return (
      <div className="payment-page" role="status" aria-live="polite" aria-label="Loading financial data">
        <section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p className="leamjobs-skeleton-line" style={{ width: '55%', marginTop: '.5rem' }} aria-hidden="true" /></div><FaMoneyBillWave aria-hidden="true" /></section>
        <section className="payment-stat-grid" aria-hidden="true">
          {[1, 2, 3, 4].map((item) => (
            <article key={item}>
              <span className="leamjobs-skeleton-line" style={{ width: '60%' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '75%', height: '1.4rem', marginTop: '.35rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '45%' }} />
            </article>
          ))}
        </section>
        <main className="payment-content-grid" aria-hidden="true">
          <section className="payment-panel payment-panel--withdrawal">
            <div className="payment-heading"><div><span className="leamjobs-skeleton-line" style={{ width: '40%' }} /><span className="leamjobs-skeleton-line" style={{ width: '60%', height: '1.1rem', marginTop: '.35rem' }} /></div></div>
            <span className="leamjobs-skeleton-block" style={{ height: '190px' }} />
          </section>
          <section className="payment-panel">
            <div className="payment-heading"><div><span className="leamjobs-skeleton-line" style={{ width: '40%' }} /><span className="leamjobs-skeleton-line" style={{ width: '55%', height: '1.1rem', marginTop: '.35rem' }} /></div></div>
            <div className="payment-account-list">{[1, 2].map((item) => <span className="leamjobs-skeleton-block" style={{ height: '64px' }} key={item} />)}</div>
          </section>
        </main>
        <section className="payment-panel" aria-hidden="true">
          <div className="payment-heading"><div><span className="leamjobs-skeleton-line" style={{ width: '30%' }} /><span className="leamjobs-skeleton-line" style={{ width: '50%', height: '1.1rem', marginTop: '.35rem' }} /></div></div>
          <div className="payment-list">{[1, 2, 3].map((item) => <span className="leamjobs-skeleton-block" style={{ height: '64px' }} key={item} />)}</div>
        </section>
      </div>
    );
  }
  if (error) return <div className="payment-page"><section className="payment-panel" role="alert"><div className="payment-heading"><div><h2>Unable to load financial data</h2><p className="payment-copy">{error}</p></div></div><div className="payment-actions"><button type="button" onClick={() => setRetryKey((current) => current + 1)}>Retry</button></div></section></div>;

  return <div className="payment-page">
    <section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p>Track completed work, available balance, and withdrawal requests.</p></div><FaMoneyBillWave aria-hidden="true" /></section>
    <section className="payment-stat-grid" aria-label="Wallet summary">
      <article className="payment-stat-card payment-stat-card--primary"><span>Available balance</span><strong>{formatMoney(summary?.availableBalance, displayCurrency)}</strong><small>Ready for withdrawal</small></article>
      <article><span>Pending earnings</span><strong>{formatMoney(summary?.pendingEarnings, displayCurrency)}</strong><small>Secured by LeamJobs until completion and release</small></article>
      <article><span>Pending withdrawal</span><strong>{formatMoney(summary?.pendingWithdrawalBalance, displayCurrency)}</strong><small>Reserved for processing</small></article>
      <article><span>Total earnings</span><strong>{formatMoney(summary?.totalEarnings, displayCurrency)}</strong><small>Credited wallet earnings</small></article>
      <article><span>Total withdrawn</span><strong>{formatMoney(summary?.totalWithdrawn, displayCurrency)}</strong><small>Successful withdrawals</small></article>
      {sectionErrors.summary && <p className="payment-copy payment-copy--error" role="alert">{sectionErrors.summary}</p>}
    </section>
    {notice && <p className="payment-notice" role="status">{notice}</p>}
    <main className="payment-content-grid">
      <section className="payment-panel payment-panel--withdrawal" aria-labelledby="withdrawal-heading">
        <div className="payment-heading"><div><span><FaArrowDown aria-hidden="true" /> Withdraw balance</span><h2 id="withdrawal-heading">Request a payout</h2></div><button type="button" className="payment-heading-action" onClick={openConfirmation} disabled={!currency || !withdrawalCapability || !hasValidAmount || !selectedPayoutAccount || isSubmitting}>Withdraw</button></div>
        <div className="payment-withdraw-box">
          <div className="payment-withdrawal-currency">
            <span>Withdrawal currency</span>
            <strong>{!currency || payoutCapabilityError ? 'Currency unavailable' : withdrawalCapability ? formatPayoutCurrency(withdrawalCapability) : 'Withdrawals unavailable for this wallet currency'}</strong>
            {!currency ? <small>Wallet currency unavailable. Withdrawals cannot be requested until it is available.</small>
              : !withdrawalCapability ? <small>There is no enabled payout capability for this wallet currency.</small> : null}
          </div>
          <div className="payment-balance-line"><span>Available to withdraw</span><strong>{formatMoney(summary?.availableBalance, displayCurrency)}</strong></div>
          <label htmlFor="withdrawal-amount">Amount<input id="withdrawal-amount" type="text" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setFormError(''); }} placeholder="0.00" aria-invalid={Boolean(formError)} aria-describedby="withdrawal-help withdrawal-error" disabled={isSubmitting} /></label>
          <label htmlFor="payout-account">Payout account<select id="payout-account" value={selectedPayoutAccountId} onChange={(event) => setSelectedPayoutAccountId(event.target.value)} disabled={isSubmitting || eligiblePayoutAccounts.length === 0}><option value="">Select a verified payout account</option>{eligiblePayoutAccounts.map((account) => <option value={account.id} key={account.id}>{account.bankName || 'Bank name unavailable'} · {account.maskedAccountNumber || `••••${account.accountNumberLast4}`} · Verified{account.isDefault ? ' (Default)' : ''}</option>)}</select></label>
          <p id="withdrawal-help">{currency ? `Wallet currency: ${currency}. The amount will be reserved and remain pending processing.` : 'Wallet currency unavailable. The amount cannot be submitted for withdrawal.'}</p>
          {isLoadingWithdrawalQuote ? <p className="payment-copy" role="status">Calculating withdrawal charge…</p> : null}
          {withdrawalQuoteError ? <p className="payment-copy payment-copy--error" role="alert">{withdrawalQuoteError}</p> : null}
          {withdrawalQuote ? <div className="payment-withdrawal-quote" aria-live="polite">
            <p className="payment-copy">Current estimate from LeamJobs. The confirmation below uses this exact quote.</p>
            <div><span>Withdrawal amount</span><strong>{formatMoney(withdrawalQuote.amount, withdrawalQuote.currency)}</strong></div>
            <div><span>Withdrawal charge ({withdrawalQuote.withdrawalFeePercentage}%)</span><strong>{formatMoney(withdrawalQuote.withdrawalFeeAmount, withdrawalQuote.currency)}</strong></div>
            <div><span>You’ll receive</span><strong>{formatMoney(withdrawalQuote.payoutAmount, withdrawalQuote.currency)}</strong></div>
          </div> : null}
          {sectionErrors.accounts && <p className="payment-copy payment-copy--error" role="alert">{sectionErrors.accounts}</p>}
          {!sectionErrors.accounts && eligiblePayoutAccounts.length === 0 && <p className="payment-copy">No payout account matching your wallet currency is ready. Add one of the supported payout destinations below.</p>}
          {formError && <p id="withdrawal-error" className="payment-copy payment-copy--error" role="alert">{formError}</p>}
          {!formError && withdrawalButtonReason && <p className="payment-copy">{withdrawalButtonReason}</p>}
          <button type="button" onClick={openConfirmation} disabled={!currency || !withdrawalCapability || !hasValidAmount || !selectedPayoutAccount || !withdrawalQuote || isLoadingWithdrawalQuote || isSubmitting}>{isSubmitting ? 'Submitting withdrawal...' : 'Review withdrawal'}</button>
        </div>
      </section>
      <section className="payment-panel" aria-labelledby="account-heading">
        <div className="payment-heading"><div><span><FaCheckCircle aria-hidden="true" /> Payout account</span><h2 id="account-heading">Where withdrawals go</h2></div><button ref={payoutSettingsTriggerRef} type="button" className="payment-heading-action" onClick={() => openPayoutSettings()}>Payout Settings</button></div>
        <SectionState error={sectionErrors.accounts} empty="No payout accounts have been added.">
          <div className="payment-account-groups">
            <section className="payment-account-group" aria-labelledby="available-payout-accounts-heading">
              <div className="payment-account-group__heading">
                <h3 id="available-payout-accounts-heading">Available payout accounts</h3>
                <p>Verified accounts supported for current withdrawals.</p>
              </div>
              <div className="payment-account-list">
                {availablePayoutAccounts.length > 0 ? availablePayoutAccounts.map((account) => (
                  <article className="payment-account payment-account--available" key={account.id}>
                    <div>
                      <strong>{account.bankName || 'Bank name unavailable'}</strong>
                      <p>{account.maskedAccountNumber || `••••${account.accountNumberLast4}`}</p>
                      <p>{account.accountName} · {account.provider} · {account.country || 'Country unavailable'} · {account.currency || 'Currency unavailable'}</p>
                    </div>
                    <div className="payment-account__actions">
                      <span className="payment-status payment-status--verified">Verified · Ready for withdrawal{account.isDefault ? ' · Default' : ''}</span>
                      <div className="payment-account__buttons">
                        <button type="button" className="payment-account__action" onClick={() => openPayoutSettings(account)}>Edit</button>
                        {!account.isDefault ? <button type="button" className="payment-account__action" onClick={() => setDefaultPayoutAccount(account.id)} disabled={isSavingPayout}>Make default</button> : null}
                      </div>
                    </div>
                  </article>
                )) : <p className="payment-copy">No verified payout accounts are available for the current withdrawal capability.</p>}
              </div>
            </section>
            {historicalPayoutAccounts.length > 0 ? (
              <section className="payment-account-group payment-account-group--historical" aria-labelledby="historical-payout-accounts-heading">
                <div className="payment-account-group__heading">
                  <h3 id="historical-payout-accounts-heading">Historical / unsupported accounts</h3>
                  <p>Preserved for your records; these accounts are not available for withdrawals.</p>
                </div>
                <div className="payment-account-list">
                  {historicalPayoutAccounts.map((account) => {
                    const verificationRequired = account.status === 'PENDING_VERIFICATION' || !account.verified;
                    const statusText = verificationRequired
                      ? 'Verification required · Not available for withdrawals'
                      : account.status === 'DISABLED'
                        ? 'Disabled · Not available for withdrawals'
                        : 'Not available for withdrawals';
                    const isLegacyPaystackAccount = account.provider === 'PAYSTACK';
                    return (
                      <article className="payment-account payment-account--historical" key={account.id}>
                        <div>
                          <strong>{account.bankName || 'Bank name unavailable'}</strong>
                          <p>{account.maskedAccountNumber || `••••${account.accountNumberLast4}`}</p>
                          <p>{account.accountName} · {account.country || 'Country unavailable'} · {account.currency || 'Currency unavailable'}{isLegacyPaystackAccount ? ' · Legacy Paystack' : ''}</p>
                        </div>
                        <div className="payment-account__actions">
                          <span className={`payment-status ${verificationRequired ? 'payment-status--pending' : 'payment-status--disabled'}`}>{statusText}</span>
                          <div className="payment-account__buttons">
                            {canEditPayoutAccount(account) ? <button type="button" className="payment-account__action" onClick={() => openPayoutSettings(account)}>Edit</button> : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </SectionState>
      </section>
    </main>
    <section className="payment-panel" aria-labelledby="payments-heading"><div className="payment-heading"><div><span><FaReceipt aria-hidden="true" /> Earnings</span><h2 id="payments-heading">Job payment history</h2></div></div><SectionState error={sectionErrors.payments} empty="No payment activity yet."><div className="payment-list">{payments.length > 0 ? payments.map((payment) => <article className="payment-row payment-row--payment" key={payment.id}><div><strong>{payment.jobTitle || 'Payment activity'}</strong><p>{payment.employerName || 'Employer unavailable'} · {formatDate(payment.date)}</p></div><div><span className={`payment-status payment-status--${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span><p>Payment status</p></div><div><strong>{formatMoney(payment.amount, payment.currency)}</strong><p>Gross amount</p></div><div><strong>{formatMoney(payment.platformFee, payment.currency)}</strong><p>Platform fee</p></div><div><strong>{formatMoney(payment.netAmount, payment.currency)}</strong><p>Net amount</p></div></article>) : <p className="payment-copy">No payment activity yet.</p>}</div></SectionState></section>
    <section className="payment-panel" aria-labelledby="transactions-heading"><div className="payment-heading"><div><span><FaReceipt aria-hidden="true" /> Transactions</span><h2 id="transactions-heading">Wallet transaction history</h2></div></div><SectionState error={sectionErrors.transactions} empty="No wallet transactions yet."><div className="payment-list">{transactions.length > 0 ? transactions.map((transaction) => <article className="payment-row payment-row--transaction" key={transaction.id}><div><strong>{humanize(transaction.type)}</strong><p>{transaction.description || 'No description'} · {formatDate(transaction.createdAt)}</p></div><div><strong>{formatMoney(transaction.amount, transaction.currency)}</strong><p>{transaction.currency}</p></div><div><strong>{formatMoney(transaction.balanceAfter, transaction.currency)}</strong><p>Balance after</p></div></article>) : <p className="payment-copy">No wallet transactions yet.</p>}</div></SectionState></section>
    <section className="payment-panel" aria-labelledby="withdrawals-heading"><div className="payment-heading"><div><span><FaArrowDown aria-hidden="true" /> Withdrawals</span><h2 id="withdrawals-heading">Withdrawal history</h2></div></div><SectionState error={sectionErrors.withdrawals} empty="No withdrawal requests yet."><div className="payment-list">{withdrawals.length > 0 ? withdrawals.map((withdrawal) => <article className="payment-row payment-row--withdrawal" key={withdrawal.id}><div><strong>{formatMoney(withdrawal.amount, withdrawal.currency)} request</strong><p>Requested {formatDate(withdrawal.requestedAt)} · {withdrawal.paymentMethod ? `${humanize(withdrawal.paymentMethod.type)} ···· ${withdrawal.paymentMethod.last4}` : 'Payment method unavailable'}</p></div><div><span className={`payment-status payment-status--${statusClass(withdrawal.status)}`}>{statusLabel(withdrawal.status)}</span><p>Status</p></div><div className="payment-date-list"><p>Charge ({withdrawal.withdrawalFeePercentage}%): {formatMoney(withdrawal.withdrawalFeeAmount, withdrawal.currency)}</p><p>Payout amount: {formatMoney(withdrawal.payoutAmount, withdrawal.currency)}</p><p>Processing: {formatDate(withdrawal.processingAt)}</p><p>Completed: {formatDate(withdrawal.completedAt)}</p><p>Failed: {formatDate(withdrawal.failedAt)}</p></div>{withdrawal.failureReason && <p className="payment-copy payment-copy--error">Failure reason: {withdrawal.failureReason}</p>}</article>) : <p className="payment-copy">No withdrawal requests yet.</p>}</div></SectionState></section>
    {showConfirmation && selectedPayoutAccount && withdrawalQuote && <div className="payment-modal-backdrop" role="presentation"><section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-confirmation-title" aria-describedby="withdrawal-confirmation-copy"><div className="payment-modal__header"><span><FaClock aria-hidden="true" /> Confirm withdrawal</span><button type="button" className="payment-modal__close" onClick={() => setShowConfirmation(false)} disabled={isSubmitting} aria-label="Close withdrawal confirmation">×</button></div><h2 id="withdrawal-confirmation-title">Review payout request</h2><p id="withdrawal-confirmation-copy" className="payment-copy">You are confirming the exact server-generated quote shown below.</p><div className="payment-modal__amount"><span>Withdrawal amount</span><strong>{formatMoney(withdrawalQuote.amount, withdrawalQuote.currency)}</strong></div><div className="payment-withdrawal-quote"><div><span>Withdrawal charge ({withdrawalQuote.withdrawalFeePercentage}%)</span><strong>{formatMoney(withdrawalQuote.withdrawalFeeAmount, withdrawalQuote.currency)}</strong></div><div><span>You’ll receive</span><strong>{formatMoney(withdrawalQuote.payoutAmount, withdrawalQuote.currency)}</strong></div></div><p>To: {selectedPayoutAccount.provider} ···· {selectedPayoutAccount.accountNumberLast4}</p><p>Available after request: {availableCents !== null && amountCents !== null ? formatMoney(centsToAmount(availableCents - amountCents), displayCurrency) : '-'}</p><p>The requested amount is reserved from your available balance; only the net payout is sent to your account.</p><div className="payment-actions"><button type="button" className="payment-button-secondary" onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>Cancel</button><button type="button" onClick={submitWithdrawal} disabled={isSubmitting}>{isSubmitting ? 'Submitting withdrawal...' : 'Confirm withdrawal'}</button></div></section></div>}

    {showPayoutSettings && (
      <div className="payment-modal-backdrop" role="presentation">
        <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payout-settings-title" aria-describedby="payout-settings-copy">
          <div className="payment-modal__header"><span><FaCheckCircle aria-hidden="true" /> Payout details</span><button type="button" className="payment-modal__close" onClick={closePayoutSettings} disabled={isSavingPayout} aria-label="Close">×</button></div>
          <h2 id="payout-settings-title">{editingPayoutAccountId ? 'Edit payout details' : 'Payout &amp; Withdrawal Details'}</h2>
          <p id="payout-settings-copy">{payoutCapability ? `${payoutCapability.country} payouts use ${payoutCapability.currency} through ${payoutCapability.provider}.` : 'Payout options are not enabled for this country yet.'}</p>
          {!payoutCountry ? (
            <p className="payment-copy">Complete your profile country before adding payout details.</p>
          ) : payoutCapabilityError ? (
            <p className="payment-copy payment-copy--error" role="alert">{payoutCapabilityError}</p>
          ) : !payoutCapability ? (
            <p className="payment-copy">Verified withdrawals are currently available only for the payout destinations listed by LeamJobs. Your country does not have an enabled, verified payout method yet.</p>
          ) : (
            <form className="payment-payout-form" onSubmit={handleSavePayoutDetails} aria-busy={isSavingPayout}>
              <div className="payment-withdraw-box">
                <label htmlFor="payout-country">Destination country<select id="payout-country" value={payoutCountry ?? ''} onChange={(event) => { setSelectedPayoutCountry(event.target.value); setPayoutForm(emptyPayoutForm); setPayoutBankSearch(''); setPayoutFormError(''); }} disabled={isSavingPayout || Boolean(editingPayoutAccountId)}><option value="">Select a supported destination</option>{payoutCapabilities.map((capability) => <option key={capability.countryCode} value={capability.country}>{capability.country}</option>)}</select></label>
                <div className="payment-balance-line"><span>Country</span><strong>{payoutCountry}</strong></div>
                <div className="payment-balance-line"><span>Payout method</span><strong>{payoutCapability.provider} bank account</strong></div>
                <div className="payment-balance-line"><span>Currency</span><strong>{payoutCapability.currency}</strong></div>
                {supportsBankAccount ? (
                  <>
                <div className="payment-bank-selector">
                  <label htmlFor="payout-bank-search">Bank</label>
                  <div className="payment-bank-search">
                    <FaSearch aria-hidden="true" />
                    <input
                      id="payout-bank-search"
                      type="search"
                      value={payoutBankSearch}
                      onChange={(event) => {
                        setPayoutBankSearch(event.target.value);
                        setPayoutForm((current) => ({ ...current, bankCode: '' }));
                        setPayoutFormError('');
                      }}
                      placeholder="Search Nigerian banks..."
                      autoComplete="off"
                      disabled={isSavingPayout || isLoadingPayoutBanks || Boolean(payoutBankError) || payoutBanks.length === 0}
                    />
                  </div>
                  <label htmlFor="payout-bank-code">Select bank</label>
                  <select
                    id="payout-bank-code"
                    value={payoutForm.bankCode}
                    onChange={(event) => {
                      setPayoutForm((current) => ({ ...current, bankCode: event.target.value }));
                      setPayoutFormError('');
                    }}
                    disabled={isSavingPayout || isLoadingPayoutBanks || Boolean(payoutBankError) || filteredPayoutBanks.length === 0}
                  >
                    <option value="">
                      {isLoadingPayoutBanks
                        ? 'Loading banks…'
                        : payoutBankError
                          ? 'Bank list unavailable'
                          : payoutBanks.length === 0
                            ? 'No banks are currently available'
                            : normalizedBankSearch && filteredPayoutBanks.length === 0
                              ? 'No banks found'
                              : 'Select your bank'}
                    </option>
                    {filteredPayoutBanks.map((bank) => <option value={bank.code} key={bank.code}>{bank.name}</option>)}
                  </select>
                  {isLoadingPayoutBanks ? <p className="payment-copy" role="status">Loading supported banks…</p> : null}
                  {payoutBankError ? <p className="payment-copy payment-copy--error" role="alert">{payoutBankError}</p> : null}
                  {!isLoadingPayoutBanks && !payoutBankError && payoutBanks.length === 0 ? <p className="payment-copy" role="status">No banks are currently available.</p> : null}
                  {!isLoadingPayoutBanks && !payoutBankError && payoutBanks.length > 0 && normalizedBankSearch && filteredPayoutBanks.length === 0 ? <p className="payment-copy" role="status">No banks found</p> : null}
                </div>
                <p className="payment-copy">Flutterwave will verify the account details and use the verified account name.</p>
                    <label htmlFor="payout-account-number">Account number{editingPayoutAccountId ? <small>Re-enter to replace the masked account ending {editingPayoutAccount?.accountNumberLast4}</small> : null}<input id="payout-account-number" inputMode="numeric" value={payoutForm.accountNumber} onChange={(event) => { setPayoutForm((current) => ({ ...current, accountNumber: event.target.value })); setPayoutFormError(''); }} disabled={isSavingPayout} /></label>
                  </>
                ) : <p className="payment-copy">An enabled payout flow is not available for this destination.</p>}
                {payoutFormError && <p className="payment-copy payment-copy--error" role="alert">{payoutFormError}</p>}
                {payoutNotice && <p className="payment-notice" role="status">{payoutNotice}</p>}
              </div>
              <div className="payment-actions">
                <button type="button" className="payment-button-secondary" onClick={closePayoutSettings} disabled={isSavingPayout}>Cancel</button>
                <button type="submit" disabled={isSavingPayout || !supportsBankAccount}>{isSavingPayout ? 'Saving...' : editingPayoutAccountId ? 'Update payout details' : 'Save payout details'}</button>
              </div>
            </form>
          )}
        </section>
      </div>
    )}
  </div>;
}

export default PaymentsPage;
