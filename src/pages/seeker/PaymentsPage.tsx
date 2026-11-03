import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { FaArrowDown, FaCheckCircle, FaClock, FaMoneyBillWave, FaReceipt, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getSeekerPaymentSummary,
  getSeekerPayments,
  provisionSeekerUsdWallet,
  getSeekerPayoutAccounts,
  getSeekerPayoutCapabilities,
  getSeekerPayoutBanks,
  getSeekerProfile,
  createSeekerPayoutAccount,
  updateSeekerPayoutAccount,
  getSeekerTransactions,
  getSeekerWithdrawals,
  getSeekerWithdrawalQuote,
  getFreelancePaymentCapabilities,
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
  type FreelancePaymentCapabilities,
} from '../../services/api';

const formatMoney = (amount: string | null | undefined, currency: string | null | undefined) => {
  if (!currency) return 'Currency not available';
  if (amount === null || amount === undefined || amount.trim() === '') return 'Amount not available';
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 'Amount not available';
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
  && capability.withdrawalEnabled === true
));

const isAvailablePayoutAccount = (
  account: SeekerPayoutAccount,
  capabilities: SeekerPayoutCapability[],
) => account.withdrawalSupported
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
const statusLabel = (status: string) => ({
  CREDITED: 'Credited',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SUCCESSFUL: 'Successful',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  REVERSED: 'Reversed',
}[status] ?? 'Updated');
const transactionLabel = (type: string) => ({
  EMPLOYER_PAYMENT: 'Contract payment',
  ESCROW_FUNDED: 'Contract funded',
  PLATFORM_FEE: 'Service fee',
  FUNDS_RELEASED: 'Contract payment released',
  WALLET_CREDIT: 'Earnings added',
  WITHDRAWAL_RESERVED: 'Withdrawal requested',
  WITHDRAWAL_SUCCESSFUL: 'Withdrawal completed',
  WITHDRAWAL_FEE: 'Withdrawal fee',
  WITHDRAWAL_FEE_REVERSAL: 'Withdrawal fee returned',
  WITHDRAWAL_FAILED_REVERSAL: 'Withdrawal amount returned',
  REFUND: 'Refund',
  ADMIN_ADJUSTMENT: 'Balance adjustment',
}[type] ?? 'Wallet activity');
const statusClass = (status: string) => status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const friendlyError = (failure: ApiFailure) => failure.status === 401
  ? 'Your session has expired. Please sign in again.'
  : failure.status === 403
    ? 'You do not have permission to view this information.'
    : 'We could not load this information. Please try again.';
type PaymentListSection = 'payments' | 'transactions' | 'withdrawals';

function SectionState({ error, empty, children }: { error?: string; empty: string; children: ReactNode }) {
  if (error) return <p className="payment-copy payment-copy--error" role="alert">{error}</p>;
  return children || <p className="payment-copy">{empty}</p>;
}

function PaymentsPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<SeekerPaymentSummary | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [payments, setPayments] = useState<SeekerPaymentItem[]>([]);
  const [transactions, setTransactions] = useState<SeekerTransactionItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<SeekerWithdrawalItem[]>([]);
  const [nextCursors, setNextCursors] = useState<Record<PaymentListSection, string | null>>({
    payments: null,
    transactions: null,
    withdrawals: null,
  });
  const [loadingMore, setLoadingMore] = useState<Record<PaymentListSection, boolean>>({
    payments: false,
    transactions: false,
    withdrawals: false,
  });
  const [payoutAccounts, setPayoutAccounts] = useState<SeekerPayoutAccount[]>([]);
  const [payoutCapabilities, setPayoutCapabilities] = useState<SeekerPayoutCapability[]>([]);
  const [paymentCapabilities, setPaymentCapabilities] = useState<FreelancePaymentCapabilities | null>(null);
  const [paymentCapabilitiesError, setPaymentCapabilitiesError] = useState('');
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
  const [isProvisioningUsdWallet, setIsProvisioningUsdWallet] = useState(false);
  const [usdWalletProvisionError, setUsdWalletProvisionError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const emptyPayoutForm = {
    bankCode: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    bankName: '',
    accountType: 'checking' as 'checking' | 'depository',
    beneficiaryName: '',
    beneficiaryAddress: '',
    postalCode: '',
    streetNumber: '',
    streetName: '',
    city: '',
    email: '',
    mobileNumber: '',
  };
  const [selectedPayoutCountry, setSelectedPayoutCountry] = useState('');
  const [showPayoutSettings, setShowPayoutSettings] = useState(false);
  const [editingPayoutAccountId, setEditingPayoutAccountId] = useState<string | null>(null);
  const [payoutForm, setPayoutForm] = useState(emptyPayoutForm);
  const [payoutFormError, setPayoutFormError] = useState('');
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [payoutNotice, setPayoutNotice] = useState('');
  const payoutSettingsTriggerRef = useRef<HTMLButtonElement>(null);
  const dataRequestRef = useRef(0);
  const currency = normalizeCurrencyCode(selectedCurrency);
  const walletSummary = summary?.wallets?.find((wallet) => wallet.currency === selectedCurrency)
    ?? (summary?.currency === selectedCurrency ? summary : null);
  const withdrawalCapability = currency
    ? payoutCapabilities.find((capability) => normalizeCurrencyCode(capability.currency) === currency
      && capability.withdrawalEnabled === true) ?? null
    : null;
  const withdrawalEnabled = Boolean(withdrawalCapability)
    && paymentCapabilities?.withdrawalsEnabled === true;

  const loadPaymentData = async () => {
    const requestId = ++dataRequestRef.current;
    if (!token) {
      setIsLoading(false);
      setError('Your session has expired. Please sign in again.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSectionErrors({});
    const [summaryResult, paymentsResult, transactionsResult, withdrawalsResult, accountsResult, profileResult, capabilitiesResult, paymentCapabilitiesResult] = await Promise.all([
      getSeekerPaymentSummary(token), getSeekerPayments(token, selectedCurrency), getSeekerTransactions(token, selectedCurrency), getSeekerWithdrawals(token, selectedCurrency), getSeekerPayoutAccounts(token), getSeekerProfile(token), getSeekerPayoutCapabilities(token), getFreelancePaymentCapabilities(),
    ]);
    if (requestId !== dataRequestRef.current) return;
    const nextErrors: Record<string, string> = {};
    if (summaryResult.ok) setSummary(summaryResult.data.data); else {
      setSummary(null);
      nextErrors.summary = friendlyError(summaryResult);
    }
    if (paymentsResult.ok) {
      setPayments(paymentsResult.data.data.items);
      setNextCursors((current) => ({ ...current, payments: paymentsResult.data.data.nextCursor }));
    } else {
      setPayments([]);
      setNextCursors((current) => ({ ...current, payments: null }));
      nextErrors.payments = friendlyError(paymentsResult);
    }
    if (transactionsResult.ok) {
      setTransactions(transactionsResult.data.data.items);
      setNextCursors((current) => ({ ...current, transactions: transactionsResult.data.data.nextCursor }));
    } else {
      setTransactions([]);
      setNextCursors((current) => ({ ...current, transactions: null }));
      nextErrors.transactions = friendlyError(transactionsResult);
    }
    if (withdrawalsResult.ok) {
      setWithdrawals(withdrawalsResult.data.data.items);
      setNextCursors((current) => ({ ...current, withdrawals: withdrawalsResult.data.data.nextCursor }));
    } else {
      setWithdrawals([]);
      setNextCursors((current) => ({ ...current, withdrawals: null }));
      nextErrors.withdrawals = friendlyError(withdrawalsResult);
    }
    if (accountsResult.ok) {
      const accounts = accountsResult.data.data.payoutAccounts;
      setPayoutAccounts(accounts);
      const walletCurrency = selectedCurrency;
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
    if (paymentCapabilitiesResult.ok) {
      setPaymentCapabilities(paymentCapabilitiesResult.data.data);
      setPaymentCapabilitiesError('');
    } else {
      setPaymentCapabilities(null);
      setPaymentCapabilitiesError('We can’t check withdrawal availability right now. Please try again later.');
    }
    setSectionErrors(nextErrors);
    setIsLoading(false);
  };

  const loadMore = async (section: PaymentListSection) => {
    if (!token || !nextCursors[section] || loadingMore[section]) return;
    const cursor = nextCursors[section];
    const requestId = dataRequestRef.current;
    setLoadingMore((current) => ({ ...current, [section]: true }));
    setSectionErrors((current) => ({ ...current, [section]: '' }));
    try {
      if (section === 'payments') {
        const result = await getSeekerPayments(token, selectedCurrency, cursor);
        if (requestId !== dataRequestRef.current) return;
        if (!result.ok) {
          setSectionErrors((current) => ({ ...current, payments: friendlyError(result) }));
          return;
        }
        setPayments((current) => {
          const ids = new Set(current.map((item) => item.id));
          return [...current, ...result.data.data.items.filter((item) => !ids.has(item.id))];
        });
        setNextCursors((current) => ({ ...current, payments: result.data.data.nextCursor }));
      } else if (section === 'transactions') {
        const result = await getSeekerTransactions(token, selectedCurrency, cursor);
        if (requestId !== dataRequestRef.current) return;
        if (!result.ok) {
          setSectionErrors((current) => ({ ...current, transactions: friendlyError(result) }));
          return;
        }
        setTransactions((current) => {
          const ids = new Set(current.map((item) => item.id));
          return [...current, ...result.data.data.items.filter((item) => !ids.has(item.id))];
        });
        setNextCursors((current) => ({ ...current, transactions: result.data.data.nextCursor }));
      } else {
        const result = await getSeekerWithdrawals(token, selectedCurrency, cursor);
        if (requestId !== dataRequestRef.current) return;
        if (!result.ok) {
          setSectionErrors((current) => ({ ...current, withdrawals: friendlyError(result) }));
          return;
        }
        setWithdrawals((current) => {
          const ids = new Set(current.map((item) => item.id));
          return [...current, ...result.data.data.items.filter((item) => !ids.has(item.id))];
        });
        setNextCursors((current) => ({ ...current, withdrawals: result.data.data.nextCursor }));
      }
    } catch {
      setSectionErrors((current) => ({
        ...current,
        [section]: 'We could not load more records. Please try again.',
      }));
    } finally {
      setLoadingMore((current) => ({ ...current, [section]: false }));
    }
  };

  const provisionUsdWallet = async () => {
    if (!token || paymentCapabilities?.usdWalletProvisioningEnabled !== true || isProvisioningUsdWallet) return;
    setIsProvisioningUsdWallet(true);
    setUsdWalletProvisionError('');
    const result = await provisionSeekerUsdWallet(token);
    if (!result.ok) {
      setUsdWalletProvisionError('We could not set up your USD wallet. Please try again.');
      setIsProvisioningUsdWallet(false);
      return;
    }
    await loadPaymentData();
    setIsProvisioningUsdWallet(false);
  };

  useEffect(() => { void loadPaymentData(); }, [token, retryKey, selectedCurrency]);
  useEffect(() => {
    const amountCents = decimalToCents(amount);
    if (!token || !currency || !withdrawalEnabled || !selectedPayoutAccountId || amountCents === null || amountCents <= 0n) {
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
          setWithdrawalQuoteError('We could not prepare your withdrawal estimate. Please try again.');
        }
        setIsLoadingWithdrawalQuote(false);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [amount, currency, selectedPayoutAccountId, token, withdrawalEnabled, withdrawalQuoteRefreshKey]);
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
        setPayoutBankError('We could not load the bank list. Please try again.');
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
    && payoutCapability.destinationSetupEnabled !== false
    && ['FLUTTERWAVE_ACCOUNT_RESOLVE', 'BENEFICIARY_DETAILS'].includes(payoutCapability.verificationMethod);
  const isUsUsdPayout = payoutCapability?.route === 'INTERNATIONAL_USD';
  const canEditPayoutAccount = (account: SeekerPayoutAccount) => account.withdrawalSupported || account.provider === 'PAYSTACK';
  const availableCents = walletSummary ? decimalToCents(walletSummary.availableBalance) : null;
  const amountCents = decimalToCents(amount);
  const hasValidAmount = amountCents !== null && amountCents > 0n && availableCents !== null && amountCents <= availableCents;
  const validateAmount = () => {
    if (!amount.trim()) return 'Enter an amount.';
    if (!amountCents || amountCents <= 0n) return 'Enter an amount greater than zero with no more than 2 decimal places.';
    if (!walletSummary || availableCents === null) return 'Your available balance is not available. Refresh the page and try again.';
    if (amountCents > availableCents) return 'Your available balance is too low for this withdrawal.';
    if (!currency) return 'Your wallet currency is not available.';
    if (paymentCapabilitiesError) return paymentCapabilitiesError;
    if (paymentCapabilities?.withdrawalsEnabled !== true) return 'Withdrawals are temporarily unavailable. You can still view your balance and payment history.';
    if (!withdrawalEnabled) return currency === 'USD'
      ? 'USD withdrawals are not available yet. We’re working to make this service available.'
      : `Withdrawals are not available for ${currency} yet.`;
    return '';
  };
  const withdrawalButtonReason = !currency
    ? 'Your wallet currency is not available.'
    : paymentCapabilitiesError
      ? paymentCapabilitiesError
      : paymentCapabilities?.withdrawalsEnabled !== true
        ? 'Withdrawals are temporarily unavailable. You can still view your balance and payment history.'
    : !withdrawalEnabled
      ? currency === 'USD'
        ? 'USD withdrawals are not available yet. We’re working to make this service available.'
        : `Withdrawals are not available for ${currency} yet.`
      : !walletSummary
        ? 'Your wallet balance is not available. Refresh the page and try again.'
        : !selectedPayoutAccount
          ? currency === 'USD'
            ? 'You don’t have an active USD withdrawal account yet. Add an eligible account to continue.'
            : `Add an active ${currency} withdrawal account to continue.`
          : !amount.trim()
            ? 'Enter an amount to continue.'
            : !hasValidAmount
              ? 'Enter a valid amount within your available balance.'
              : '';
  const openConfirmation = () => {
    const nextError = validateAmount();
    if (nextError) { setFormError(nextError); return; }
    if (!withdrawalQuote || isLoadingWithdrawalQuote || withdrawalQuoteError) {
      setFormError('Please wait for your withdrawal estimate before continuing.');
      return;
    }
    if (!selectedPayoutAccount) {
      setFormError(currency === 'USD'
        ? 'You don’t have an active USD withdrawal account yet. Add an eligible account to continue.'
        : 'Add an active payout account in your wallet currency to continue.');
      return;
    }
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
    if (!supportsBankAccount) return 'Payouts are not available for this country yet.';
    if (isUsUsdPayout) {
      if (!/^\d{4,17}$/.test(payoutForm.accountNumber.trim())) return 'Enter a valid US account number.';
      if (!/^\d{9}$/.test(payoutForm.routingNumber.trim())) return 'Enter a valid 9-digit US routing number.';
      if (!/^[A-Z0-9]{8}(?:[A-Z0-9]{3})?$/.test(payoutForm.swiftCode.trim().toUpperCase())) return 'Enter a valid 8- or 11-character SWIFT/BIC code.';
      if (payoutForm.bankName.trim().length < 2) return 'Enter the bank name.';
      if (payoutForm.beneficiaryName.trim().length < 2) return 'Enter the account holder’s full name.';
      if (payoutForm.beneficiaryAddress.trim().length < 5) return 'Enter the account holder’s address.';
      if (!/^\d{5}(?:-\d{4})?$/.test(payoutForm.postalCode.trim())) return 'Enter a valid US postal code.';
      if (!payoutForm.streetNumber.trim() || payoutForm.streetName.trim().length < 2 || payoutForm.city.trim().length < 2) return 'Enter the street number, street name, and city.';
    } else {
      if (!payoutForm.bankCode.trim()) return 'Select your bank.';
      if (isLoadingPayoutBanks || payoutBankError) return 'Please wait until the bank list is ready.';
      if (!/^\d{6,20}$/.test(payoutForm.accountNumber.trim())) return 'Enter a valid account number.';
    }
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
      setPayoutFormError('Payouts are not available for this country yet.');
      return;
    }
    const payload = isUsUsdPayout
      ? {
        country: payoutCapability.country,
        currency: 'USD' as const,
        accountNumber: payoutForm.accountNumber.trim(),
        routingNumber: payoutForm.routingNumber.trim(),
        swiftCode: payoutForm.swiftCode.trim().toUpperCase(),
        bankName: payoutForm.bankName.trim(),
        accountType: payoutForm.accountType,
        beneficiaryName: payoutForm.beneficiaryName.trim(),
        beneficiaryAddress: payoutForm.beneficiaryAddress.trim(),
        postalCode: payoutForm.postalCode.trim(),
        streetNumber: payoutForm.streetNumber.trim(),
        streetName: payoutForm.streetName.trim(),
        city: payoutForm.city.trim(),
        email: payoutForm.email.trim() || undefined,
        mobileNumber: payoutForm.mobileNumber.trim() || undefined,
      }
      : {
        country: payoutCapability.country,
        bankCode: payoutForm.bankCode,
        accountNumber: payoutForm.accountNumber.trim(),
      };
    const result = editingPayoutAccountId
      ? await updateSeekerPayoutAccount(editingPayoutAccountId, payload, token)
      : await createSeekerPayoutAccount(payload, token);
    setIsSavingPayout(false);
    if (!result.ok) {
      if (result.status === 409) setPayoutFormError('These payout details may already be saved. Check your accounts and try again.');
      else if (result.status === 401) setPayoutFormError('Your session has expired. Please sign in again.');
      else if (result.status === 403) setPayoutFormError('You do not have permission to manage payout accounts.');
      else setPayoutFormError('We could not save your payout details. Check the information and try again.');
      return;
    }
    setPayoutAccounts((current) => editingPayoutAccountId
      ? current.map((account) => account.id === result.data.data.payoutAccount.id ? result.data.data.payoutAccount : account)
      : [...current, result.data.data.payoutAccount]);
    if (result.data.data.payoutAccount.withdrawalSupported && result.data.data.payoutAccount.currency === currency) {
      setSelectedPayoutAccountId(result.data.data.payoutAccount.id);
    }
    setPayoutNotice(result.data.data.payoutAccount.verified
      ? `Payout details ${editingPayoutAccountId ? 'updated' : 'saved'} and verified.`
      : `Payout details ${editingPayoutAccountId ? 'updated' : 'saved'}. This account isn’t ready for withdrawals yet.`);
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
      setPayoutFormError(result.status === 409
        ? 'This account could not be set as your default. Refresh the page and try again.'
        : 'We could not update your default payout account. Please try again.');
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
    if (!token || !selectedPayoutAccount || !hasValidAmount || !currency || !withdrawalEnabled || !withdrawalQuote || isSubmitting) return;
    const idempotencyKey = globalThis.crypto?.randomUUID?.();
    if (!idempotencyKey) { setFormError('Your browser could not start this withdrawal. Refresh the page and try again.'); return; }
    setIsSubmitting(true); setFormError(''); setNotice('');
    const result = await requestSeekerWithdrawal({ quoteReference: withdrawalQuote.quoteReference }, idempotencyKey, token);
    if (!result.ok) {
      setIsSubmitting(false);
      if (result.error.code === 'WITHDRAWAL_QUOTE_STALE') {
        setShowConfirmation(false);
        setWithdrawalQuote(null);
        setWithdrawalQuoteError('');
        setNotice('Your withdrawal estimate has expired. Review the updated amount before continuing.');
        setWithdrawalQuoteRefreshKey((current) => current + 1);
        return;
      }
      setShowConfirmation(false);
      if (result.status === 401) setFormError('Your session has expired. Please sign in again.');
      else if (result.status === 403) setFormError('You are not allowed to request withdrawals.');
      else if (result.status === 404) setFormError('This payout account is no longer available. Select another account and try again.');
      else if (result.status === 409) setFormError('We could not submit this withdrawal. Check your withdrawal history before trying again.');
      else if (result.status === 422) setFormError('Your withdrawal details may have changed. Check your balance and try again.');
      else setFormError("We couldn't confirm the withdrawal request. Please check your withdrawal history before trying again.");
      return;
    }
    setIsSubmitting(false); setShowConfirmation(false); setAmount('');
    const created = result.data.data.withdrawal;
    setNotice(`Your withdrawal request has been submitted. You’ll receive ${formatMoney(created.payoutAmount, created.currency)} after processing. Withdrawal fee: ${formatMoney(created.withdrawalFeeAmount, created.currency)}.`);
    await loadPaymentData();
  };

  if (isLoading) {
    return (
      <div className="payment-page" role="status" aria-live="polite" aria-label="Loading your payment information">
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
  if (error) return <div className="payment-page"><section className="payment-panel" role="alert"><div className="payment-heading"><div>  <h2>We couldn’t load your payment information</h2><p className="payment-copy">{error}</p></div></div><div className="payment-actions"><button type="button" onClick={() => setRetryKey((current) => current + 1)}>Try again</button></div></section></div>;

  return <div className="payment-page">
    <section className="payment-hero"><div><span>Seeker wallet</span><h1>Your earnings</h1><p>Track completed work, available balance, and withdrawal requests.</p></div><FaMoneyBillWave aria-hidden="true" /></section>
    <section className="payment-wallet-switch" aria-label="Currency wallets">
      <div className="payment-wallet-switch__heading"><h2>Your wallets</h2><p>Balances and activity are kept separate by currency.</p></div>
      <div className="payment-wallet-switch__items">
        {summary?.wallets?.length === 0 && <p className="payment-copy">Your wallet will appear here when it’s ready.</p>}
        {(summary?.wallets ?? []).map((wallet) => <button
          type="button"
          className="payment-wallet-switch__item"
          key={wallet.currency}
          aria-pressed={selectedCurrency === wallet.currency}
          onClick={() => setSelectedCurrency(wallet.currency)}
        ><span>{wallet.currency} wallet</span><strong>{formatMoney(wallet.availableBalance, wallet.currency)}</strong></button>)}
        {!summary?.wallets?.some(({ currency: walletCurrency }) => walletCurrency === 'USD') && <div className="payment-wallet-switch__item payment-wallet-switch__item--disabled">
          <span>USD wallet</span><strong>Not set up yet</strong><small>Your USD wallet can receive USD earnings once it’s set up.</small>
          <button className="payment-wallet-provision-button" type="button" onClick={provisionUsdWallet} disabled={paymentCapabilities?.usdWalletProvisioningEnabled !== true || isProvisioningUsdWallet}>
            {isProvisioningUsdWallet ? 'Setting up…' : 'Set up USD wallet'}
          </button>
        </div>}
      </div>
      {usdWalletProvisionError && <p className="payment-copy payment-copy--error" role="alert">{usdWalletProvisionError}</p>}
      {paymentCapabilities && !paymentCapabilities.usdCollectionEnabled && <p className="payment-copy" role="status">
        You can’t add money in USD yet. USD earnings may still be added to your wallet.
      </p>}
    </section>
    {sectionErrors.summary
      ? <p className="payment-copy payment-copy--error" role="alert">{sectionErrors.summary}</p>
      : walletSummary
        ? <section className="payment-stat-grid" aria-label={`${selectedCurrency} wallet summary`}>
          <article className="payment-stat-card payment-stat-card--primary"><span>Available balance · {selectedCurrency}</span><strong>{formatMoney(walletSummary.availableBalance, displayCurrency)}</strong><small>Money available in your wallet. The amount you can withdraw may differ.</small></article>
          <article><span>Pending earnings · {selectedCurrency}</span><strong>{formatMoney(walletSummary.pendingEarnings, displayCurrency)}</strong><small>Added to your balance when the contract payment is released.</small></article>
          <article><span>Pending withdrawal · {selectedCurrency}</span><strong>{formatMoney(walletSummary.pendingWithdrawalBalance, displayCurrency)}</strong><small>Withdrawals being processed.</small></article>
          <article><span>Total earnings · {selectedCurrency}</span><strong>{formatMoney(walletSummary.totalEarnings, displayCurrency)}</strong><small>Credited wallet earnings</small></article>
          <article><span>Total withdrawn · {selectedCurrency}</span><strong>{formatMoney(walletSummary.totalWithdrawn, displayCurrency)}</strong><small>Successful withdrawals</small></article>
        </section>
        : <section className="payment-empty payment-empty--wallet" role="status">
          <strong>Your {selectedCurrency} wallet isn’t set up yet.</strong>
          <p>Your balance will appear here when your wallet is ready.</p>
        </section>}
    {!summary?.conversionEnabled && <p className="payment-conversion-notice" role="status">
      This payment can’t be completed because the contract and wallet use different currencies.
    </p>}
    {notice && <p className="payment-notice" role="status">{notice}</p>}
    <main className="payment-content-grid">
      <section className="payment-panel payment-panel--withdrawal" aria-labelledby="withdrawal-heading">
        <div className="payment-heading"><div><span><FaArrowDown aria-hidden="true" /> Withdraw balance</span><h2 id="withdrawal-heading">Request a payout</h2></div><button type="button" className="payment-heading-action" onClick={openConfirmation} disabled={!withdrawalEnabled || !walletSummary || !hasValidAmount || !selectedPayoutAccount || isSubmitting}>Withdraw</button></div>
        <div className="payment-withdraw-box">
          <div className="payment-withdrawal-currency">
            <span>Withdrawal currency</span>
            <strong>{!currency ? 'Currency not available' : paymentCapabilitiesError ? 'Availability not confirmed' : paymentCapabilities?.withdrawalsEnabled !== true ? 'Withdrawals temporarily unavailable' : currency === 'USD' ? 'USD withdrawals not available yet' : payoutCapabilityError ? 'Availability not confirmed' : !withdrawalCapability ? `Withdrawals not available for ${currency} yet` : formatPayoutCurrency(withdrawalCapability)}</strong>
            {!currency ? <small>Your wallet currency isn’t available, so you can’t request a withdrawal right now.</small>
              : paymentCapabilitiesError ? <small>{paymentCapabilitiesError}</small>
                : paymentCapabilities?.withdrawalsEnabled !== true ? <small>Withdrawals are temporarily unavailable. Please try again later.</small>
                  : currency === 'USD' ? <small>USD withdrawals are not available yet. We’re working to make this service available.</small>
                : payoutCapabilityError ? <small>We can’t check payout availability right now. Please try again later.</small>
                  : !withdrawalCapability ? <small>Withdrawals are not available for this currency yet.</small> : null}
          </div>
          <div className="payment-balance-line"><span>Wallet balance</span><strong>{formatMoney(walletSummary?.availableBalance, displayCurrency)}</strong></div>
          <label htmlFor="withdrawal-amount">Amount<input id="withdrawal-amount" type="text" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setFormError(''); }} placeholder="0.00" aria-invalid={Boolean(formError)} aria-describedby="withdrawal-help withdrawal-error" disabled={isSubmitting} /></label>
          <label htmlFor="payout-account">Payout account<select id="payout-account" value={selectedPayoutAccountId} onChange={(event) => setSelectedPayoutAccountId(event.target.value)} disabled={isSubmitting || eligiblePayoutAccounts.length === 0}><option value="">Choose an account</option>{eligiblePayoutAccounts.map((account) => <option value={account.id} key={account.id}>{account.bankName || 'Payout account'} · {account.maskedAccountNumber || `••••${account.accountNumberLast4}`}{account.isDefault ? ' · Default' : ''}</option>)}</select></label>
          <p id="withdrawal-help">{currency ? `Your wallet balance is in ${currency}.` : 'Your wallet currency isn’t available.'}</p>
          {isLoadingWithdrawalQuote ? <p className="payment-copy" role="status">Preparing your withdrawal estimate…</p> : null}
          {withdrawalQuoteError ? <p className="payment-copy payment-copy--error" role="alert">{withdrawalQuoteError}</p> : null}
          {withdrawalQuote ? <div className="payment-withdrawal-quote" aria-live="polite">
            <p className="payment-copy">Review your withdrawal amount and fee before confirming.</p>
            <div><span>Withdrawal amount</span><strong>{formatMoney(withdrawalQuote.amount, withdrawalQuote.currency)}</strong></div>
            <div><span>Withdrawal fee ({withdrawalQuote.withdrawalFeePercentage}%)</span><strong>{formatMoney(withdrawalQuote.withdrawalFeeAmount, withdrawalQuote.currency)}</strong></div>
            <div><span>You’ll receive</span><strong>{formatMoney(withdrawalQuote.payoutAmount, withdrawalQuote.currency)}</strong></div>
          </div> : null}
          {sectionErrors.accounts && <p className="payment-copy payment-copy--error" role="alert">{sectionErrors.accounts}</p>}
          {!sectionErrors.accounts && eligiblePayoutAccounts.length === 0 && <p className="payment-copy">{currency === 'USD'
            ? 'You don’t have an active USD withdrawal account yet. Add an account to continue.'
            : currency
              ? `You don’t have an active ${currency} withdrawal account yet. Add an account to continue.`
              : 'Add a payout account to continue.'}</p>}
          {formError && <p id="withdrawal-error" className="payment-copy payment-copy--error" role="alert">{formError}</p>}
          {!formError && withdrawalButtonReason && <p className="payment-copy">{withdrawalButtonReason}</p>}
          <button type="button" onClick={openConfirmation} disabled={!withdrawalEnabled || !walletSummary || !hasValidAmount || !selectedPayoutAccount || !withdrawalQuote || isLoadingWithdrawalQuote || isSubmitting}>{isSubmitting ? 'Submitting withdrawal...' : 'Review withdrawal'}</button>
        </div>
      </section>
      <section className="payment-panel" aria-labelledby="account-heading">
        <div className="payment-heading"><div><span><FaCheckCircle aria-hidden="true" /> Payout account</span><h2 id="account-heading">Where withdrawals go</h2></div><button ref={payoutSettingsTriggerRef} type="button" className="payment-heading-action" onClick={() => openPayoutSettings()}>Payout Settings</button></div>
        <SectionState error={sectionErrors.accounts} empty="Add a payout account to get started.">
          <div className="payment-account-groups">
            <section className="payment-account-group" aria-labelledby="available-payout-accounts-heading">
              <div className="payment-account-group__heading">
                <h3 id="available-payout-accounts-heading">Available payout accounts</h3>
                <p>Accounts you can use for withdrawals.</p>
              </div>
              <div className="payment-account-list">
                {availablePayoutAccounts.length > 0 ? availablePayoutAccounts.map((account) => (
                  <article className="payment-account payment-account--available" key={account.id}>
                    <div>
                      <strong>{account.bankName || 'Payout account'}</strong>
                      <p>{account.maskedAccountNumber || `••••${account.accountNumberLast4}`}</p>
                      <p>{account.accountName} · {account.country || 'Country not available'} · {account.currency || 'Currency not available'}</p>
                    </div>
                    <div className="payment-account__actions">
                      <span className={`payment-status payment-status--${paymentCapabilities?.withdrawalsEnabled === true && withdrawalCapability?.withdrawalEnabled === true ? 'verified' : 'pending'}`}>{paymentCapabilities?.withdrawalsEnabled === true && withdrawalCapability?.withdrawalEnabled === true ? 'Ready for withdrawals' : 'Saved, but withdrawals aren’t available right now'}{account.isDefault ? ' · Default' : ''}</span>
                      <div className="payment-account__buttons">
                        <button type="button" className="payment-account__action" onClick={() => openPayoutSettings(account)}>Edit</button>
                        {!account.isDefault ? <button type="button" className="payment-account__action" onClick={() => setDefaultPayoutAccount(account.id)} disabled={isSavingPayout}>Make default</button> : null}
                      </div>
                    </div>
                  </article>
                )) :                 <p className="payment-copy">No payout accounts are ready to use yet. Add an account to continue.</p>}
              </div>
            </section>
            {historicalPayoutAccounts.length > 0 ? (
              <section className="payment-account-group payment-account-group--historical" aria-labelledby="historical-payout-accounts-heading">
                <div className="payment-account-group__heading">
                  <h3 id="historical-payout-accounts-heading">Other payout accounts</h3>
                  <p>These accounts are saved for your records but can’t be used for withdrawals right now.</p>
                </div>
                <div className="payment-account-list">
                  {historicalPayoutAccounts.map((account) => {
                    const verificationRequired = account.status === 'PENDING_VERIFICATION' || !account.verified;
                    const statusText = verificationRequired
                      ? 'Verify this account before using it for withdrawals'
                      : account.status === 'DISABLED'
                        ? 'This account is turned off'
                        : 'This account can’t be used for withdrawals right now';
                    return (
                      <article className="payment-account payment-account--historical" key={account.id}>
                        <div>
                          <strong>{account.bankName || 'Payout account'}</strong>
                          <p>{account.maskedAccountNumber || `••••${account.accountNumberLast4}`}</p>
                          <p>{account.accountName} · {account.country || 'Country not available'} · {account.currency || 'Currency not available'}</p>
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
    <section className="payment-panel" aria-labelledby="payments-heading">
      <div className="payment-heading"><div><span><FaReceipt aria-hidden="true" /> Earnings</span><h2 id="payments-heading">Job payment history</h2></div></div>
      <SectionState error={sectionErrors.payments} empty="No payment activity yet.">
        <div className="payment-list" aria-busy={loadingMore.payments}>
          {payments.length > 0 ? payments.map((payment) => (
            <article className="payment-row payment-row--payment" key={payment.id}>
              <div><strong>{payment.jobTitle || 'Payment activity'}</strong><p>{payment.employerName || 'Employer not available'} · {formatDate(payment.date)}</p></div>
              <div><span className={`payment-status payment-status--${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span><p>Payment status</p></div>
              <div><strong>{formatMoney(payment.amount, payment.currency)}</strong><p>Payment amount</p></div>
              <div><strong>{formatMoney(payment.platformFee, payment.currency)}</strong><p>Service fee</p></div>
              <div><strong>{formatMoney(payment.netAmount, payment.currency)}</strong><p>After fees</p></div>
            </article>
          )) : <p className="payment-copy">No payment activity yet.</p>}
        </div>
      </SectionState>
      {nextCursors.payments && <button type="button" className="payment-load-more" onClick={() => void loadMore('payments')} disabled={loadingMore.payments}>{loadingMore.payments ? 'Loading…' : 'Load more payments'}</button>}
    </section>
    <section className="payment-panel" aria-labelledby="transactions-heading">
      <div className="payment-heading"><div><span><FaReceipt aria-hidden="true" /> Transactions</span><h2 id="transactions-heading">Wallet transaction history</h2></div></div>
      <SectionState error={sectionErrors.transactions} empty="No wallet transactions yet.">
        <div className="payment-list" aria-busy={loadingMore.transactions}>
          {transactions.length > 0 ? transactions.map((transaction) => (
            <article className="payment-row payment-row--transaction" key={transaction.id}>
              <div><strong>{transactionLabel(transaction.type)}</strong><p>{formatDate(transaction.createdAt)}</p></div>
              <div><strong>{formatMoney(transaction.amount, transaction.currency)}</strong><p>{transaction.currency}</p></div>
              <div><strong>{formatMoney(transaction.balanceAfter, transaction.currency)}</strong><p>Balance after this transaction</p></div>
            </article>
          )) : <p className="payment-copy">No wallet transactions yet.</p>}
        </div>
      </SectionState>
      {nextCursors.transactions && <button type="button" className="payment-load-more" onClick={() => void loadMore('transactions')} disabled={loadingMore.transactions}>{loadingMore.transactions ? 'Loading…' : 'Load more transactions'}</button>}
    </section>
    <section className="payment-panel" aria-labelledby="withdrawals-heading">
      <div className="payment-heading"><div><span><FaArrowDown aria-hidden="true" /> Withdrawals</span><h2 id="withdrawals-heading">Withdrawal history</h2></div></div>
      <SectionState error={sectionErrors.withdrawals} empty="No withdrawal requests yet.">
        <div className="payment-list" aria-busy={loadingMore.withdrawals}>
          {withdrawals.length > 0 ? withdrawals.map((withdrawal) => (
            <article className="payment-row payment-row--withdrawal" key={withdrawal.id}>
              <div><strong>{formatMoney(withdrawal.amount, withdrawal.currency)} withdrawal</strong><p>Requested {formatDate(withdrawal.requestedAt)} · {withdrawal.paymentMethod ? `Account ending in ${withdrawal.paymentMethod.last4}` : 'Payout account not available'}</p></div>
              <div><span className={`payment-status payment-status--${statusClass(withdrawal.status)}`}>{statusLabel(withdrawal.status)}</span><p>Status</p></div>
              <div className="payment-date-list"><p>Withdrawal fee ({withdrawal.withdrawalFeePercentage}%): {formatMoney(withdrawal.withdrawalFeeAmount, withdrawal.currency)}</p><p>Payout amount: {formatMoney(withdrawal.payoutAmount, withdrawal.currency)}</p><p>Processing: {formatDate(withdrawal.processingAt)}</p><p>Completed: {formatDate(withdrawal.completedAt)}</p><p>Failed: {formatDate(withdrawal.failedAt)}</p></div>
              {withdrawal.failureReason && <p className="payment-copy payment-copy--error">This withdrawal could not be completed. Please contact support if you need help.</p>}
            </article>
          )) : <p className="payment-copy">No withdrawal requests yet.</p>}
        </div>
      </SectionState>
      {nextCursors.withdrawals && <button type="button" className="payment-load-more" onClick={() => void loadMore('withdrawals')} disabled={loadingMore.withdrawals}>{loadingMore.withdrawals ? 'Loading…' : 'Load more withdrawals'}</button>}
    </section>
    {showConfirmation && selectedPayoutAccount && withdrawalQuote && <div className="payment-modal-backdrop" role="presentation"><section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-confirmation-title" aria-describedby="withdrawal-confirmation-copy"><div className="payment-modal__header"><span><FaClock aria-hidden="true" /> Confirm withdrawal</span><button type="button" className="payment-modal__close" onClick={() => setShowConfirmation(false)} disabled={isSubmitting} aria-label="Close withdrawal confirmation">×</button></div><h2 id="withdrawal-confirmation-title">Review your withdrawal</h2><p id="withdrawal-confirmation-copy" className="payment-copy">Check the amount and fee before confirming.</p><div className="payment-modal__amount"><span>Withdrawal amount</span><strong>{formatMoney(withdrawalQuote.amount, withdrawalQuote.currency)}</strong></div><div className="payment-withdrawal-quote"><div><span>Withdrawal fee ({withdrawalQuote.withdrawalFeePercentage}%)</span><strong>{formatMoney(withdrawalQuote.withdrawalFeeAmount, withdrawalQuote.currency)}</strong></div><div><span>You’ll receive</span><strong>{formatMoney(withdrawalQuote.payoutAmount, withdrawalQuote.currency)}</strong></div></div><p>Payout account ending in {selectedPayoutAccount.accountNumberLast4}</p><p>Balance after withdrawal: {availableCents !== null && amountCents !== null ? formatMoney(centsToAmount(availableCents - amountCents), displayCurrency) : 'Not available'}</p><p>The fee is taken from the amount shown. The remaining amount will be sent to your payout account after processing.</p><div className="payment-actions"><button type="button" className="payment-button-secondary" onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>Cancel</button><button type="button" onClick={submitWithdrawal} disabled={isSubmitting}>{isSubmitting ? 'Submitting withdrawal…' : 'Confirm withdrawal'}</button></div></section></div>}

    {showPayoutSettings && (
      <div className="payment-modal-backdrop" role="presentation">
        <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payout-settings-title" aria-describedby="payout-settings-copy">
          <div className="payment-modal__header"><span><FaCheckCircle aria-hidden="true" /> Payout details</span><button type="button" className="payment-modal__close" onClick={closePayoutSettings} disabled={isSavingPayout} aria-label="Close">×</button></div>
          <h2 id="payout-settings-title">{editingPayoutAccountId ? 'Edit payout details' : 'Payout details'}</h2>
          <p id="payout-settings-copy">{payoutCapability ? `Add a bank account in ${payoutCapability.country} to receive ${payoutCapability.currency} withdrawals.` : 'Payouts aren’t available for this country yet.'}</p>
          {!payoutCountry ? (
            <p className="payment-copy">Add your country to your profile before setting up payout details.</p>
          ) : payoutCapabilityError ? (
            <p className="payment-copy payment-copy--error" role="alert">{payoutCapabilityError}</p>
          ) : !payoutCapability ? (
            <p className="payment-copy">Withdrawals aren’t available for your country yet. Please check back later.</p>
          ) : (
            <form className="payment-payout-form" onSubmit={handleSavePayoutDetails} aria-busy={isSavingPayout}>
              <div className="payment-withdraw-box">
                <label htmlFor="payout-country">Destination country<select id="payout-country" value={payoutCountry ?? ''} onChange={(event) => { setSelectedPayoutCountry(event.target.value); setPayoutForm(emptyPayoutForm); setPayoutBankSearch(''); setPayoutFormError(''); }} disabled={isSavingPayout || Boolean(editingPayoutAccountId)}><option value="">Choose a country</option>{[...new Map(payoutCapabilities.filter((capability) => capability.destinationSetupEnabled !== false).map((capability) => [capability.country, capability])).values()].map((capability) => <option key={`${capability.countryCode}-${capability.currency}`} value={capability.country}>{capability.country} · {capability.currency}</option>)}</select></label>
                <div className="payment-balance-line"><span>Country</span><strong>{payoutCountry}</strong></div>
                <div className="payment-balance-line"><span>Payout method</span><strong>Bank account</strong></div>
                <div className="payment-balance-line"><span>Currency</span><strong>{payoutCapability.currency}</strong></div>
                {supportsBankAccount ? (
                  isUsUsdPayout ? (
                    <>
                      <p className="payment-copy">Enter your bank details as they appear on your account. We’ll use them to set up your USD payout account.</p>
                      <label htmlFor="payout-beneficiary-name">Account holder’s full name<input id="payout-beneficiary-name" value={payoutForm.beneficiaryName} onChange={(event) => setPayoutForm((current) => ({ ...current, beneficiaryName: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-account-number">US account number<input id="payout-account-number" inputMode="numeric" value={payoutForm.accountNumber} onChange={(event) => setPayoutForm((current) => ({ ...current, accountNumber: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-routing-number">Routing number<input id="payout-routing-number" inputMode="numeric" value={payoutForm.routingNumber} onChange={(event) => setPayoutForm((current) => ({ ...current, routingNumber: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-swift-code">SWIFT/BIC code<input id="payout-swift-code" value={payoutForm.swiftCode} onChange={(event) => setPayoutForm((current) => ({ ...current, swiftCode: event.target.value.toUpperCase() }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-bank-name">Bank name<input id="payout-bank-name" value={payoutForm.bankName} onChange={(event) => setPayoutForm((current) => ({ ...current, bankName: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-account-type">Account type<select id="payout-account-type" value={payoutForm.accountType} onChange={(event) => setPayoutForm((current) => ({ ...current, accountType: event.target.value as 'checking' | 'depository' }))} disabled={isSavingPayout}><option value="checking">Checking</option><option value="depository">Depository</option></select></label>
                      <label htmlFor="payout-beneficiary-address">Account holder’s address<input id="payout-beneficiary-address" value={payoutForm.beneficiaryAddress} onChange={(event) => setPayoutForm((current) => ({ ...current, beneficiaryAddress: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-street-number">Street number<input id="payout-street-number" value={payoutForm.streetNumber} onChange={(event) => setPayoutForm((current) => ({ ...current, streetNumber: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-street-name">Street name<input id="payout-street-name" value={payoutForm.streetName} onChange={(event) => setPayoutForm((current) => ({ ...current, streetName: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-city">City<input id="payout-city" value={payoutForm.city} onChange={(event) => setPayoutForm((current) => ({ ...current, city: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-postal-code">ZIP / postal code<input id="payout-postal-code" value={payoutForm.postalCode} onChange={(event) => setPayoutForm((current) => ({ ...current, postalCode: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-email">Account holder’s email (optional)<input id="payout-email" type="email" value={payoutForm.email} onChange={(event) => setPayoutForm((current) => ({ ...current, email: event.target.value }))} disabled={isSavingPayout} /></label>
                      <label htmlFor="payout-mobile-number">Account holder’s mobile number (optional)<input id="payout-mobile-number" value={payoutForm.mobileNumber} onChange={(event) => setPayoutForm((current) => ({ ...current, mobileNumber: event.target.value }))} disabled={isSavingPayout} /></label>
                    </>
                  ) : (
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
                      placeholder="Search banks..."
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
                          ? 'Could not load banks'
                          : payoutBanks.length === 0
                            ? 'No banks available'
                            : normalizedBankSearch && filteredPayoutBanks.length === 0
                              ? 'No banks found'
                              : 'Select your bank'}
                    </option>
                    {filteredPayoutBanks.map((bank) => <option value={bank.code} key={bank.code}>{bank.name}</option>)}
                  </select>
                  {isLoadingPayoutBanks ? <p className="payment-copy" role="status">Loading banks…</p> : null}
                  {payoutBankError ? <p className="payment-copy payment-copy--error" role="alert">{payoutBankError}</p> : null}
                  {!isLoadingPayoutBanks && !payoutBankError && payoutBanks.length === 0 ? <p className="payment-copy" role="status">No banks are available right now.</p> : null}
                  {!isLoadingPayoutBanks && !payoutBankError && payoutBanks.length > 0 && normalizedBankSearch && filteredPayoutBanks.length === 0 ? <p className="payment-copy" role="status">No banks found</p> : null}
                </div>
                <p className="payment-copy">We’ll check your account details before you can use them for withdrawals.</p>
                    <label htmlFor="payout-account-number">Account number{editingPayoutAccountId ? <small>Re-enter to replace the masked account ending {editingPayoutAccount?.accountNumberLast4}</small> : null}<input id="payout-account-number" inputMode="numeric" value={payoutForm.accountNumber} onChange={(event) => { setPayoutForm((current) => ({ ...current, accountNumber: event.target.value })); setPayoutFormError(''); }} disabled={isSavingPayout} /></label>
                    </>
                  )
                ) : <p className="payment-copy">Payouts aren’t available for this destination yet.</p>}
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
