import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaBriefcase, FaCheckCircle, FaCreditCard, FaFileUpload, FaLock, FaSpinner, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import AuthenticatedImage from '../../components/common/AuthenticatedImage';
import {
  confirmAdminCompletion,
  confirmEmployerContractTerms,
  confirmEmployerCompletion,
  confirmSeekerContractTerms,
  getAdminContract,
  getEmployerContract,
  getSeekerContract,
  initializeAdminContractPayment,
  initializeEmployerContractPayment,
  submitSeekerCompletion,
  verifyAdminContractPayment,
  verifyEmployerContractPayment,
  type ContractData,
} from '../../services/api';
import {
  areContractFundingTermsValid,
  canShowContractFundingAction,
  getPendingFreelanceConfirmationAction,
  hasSuccessfulContractFundingPayment,
} from '../../utils/contractFundingEligibility';

type ContractPageProps = { role: 'EMPLOYER' | 'SEEKER' | 'ADMIN' };

const formatMoney = (amount: string | number | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency) return 'Amount unavailable';
  if (typeof amount === 'string' && !amount.trim()) return 'Amount unavailable';
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 'Amount unavailable';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};
const displayName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`.trim();
const formatStatus = (value: string | null | undefined) => value
  ? value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  : 'Not available';
const amountInMinorUnits = (amount: string | number | null | undefined) => {
  if (amount === null || amount === undefined) return null;
  const normalized = String(amount);
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  try {
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  } catch {
    return null;
  }
};
const minorUnitsToAmount = (amount: bigint) => `${amount / 100n}.${(amount % 100n).toString().padStart(2, '0')}`;
const getFundingSummary = (
  value: ContractData['freelance'] | null | undefined,
  authoritativeFunding?: ContractData['funding'],
  escrow?: NonNullable<ContractData['freelance']>['escrow'] | null,
) => {
  const projectAmount = value?.agreedAmount ?? null;
  const fundingCharge = value?.platformFeeAmount ?? null;
  const fundingPercentage = value?.platformFeePercentage ?? null;
  const currencyIsValid = /^[A-Z]{3}$/.test(value?.currency ?? '');
  const projectMinor = amountInMinorUnits(projectAmount);
  const feeMinor = amountInMinorUnits(fundingCharge);
  const seekerMinor = amountInMinorUnits(value?.seekerNetAmount);
  const percentageNumber = fundingPercentage === null || !/^\d+(?:\.\d{1,2})?$/.test(fundingPercentage)
    ? Number.NaN
    : Number(fundingPercentage);
  let model: 'ADDITIVE' | 'LEGACY_DEDUCTED' | 'UNKNOWN' = 'UNKNOWN';
  let totalAmount: string | null = null;
  const fundingTermsValid = areContractFundingTermsValid({
    projectAmount,
    currency: value?.currency,
    platformFeePercentage: fundingPercentage,
    platformFeeAmount: fundingCharge,
    seekerEntitlement: value?.seekerNetAmount,
    escrow,
    funding: authoritativeFunding,
    existingPayment: escrow?.payments[0],
  });

  if (fundingTermsValid && currencyIsValid && projectMinor !== null && feeMinor !== null && seekerMinor !== null
    && Number.isFinite(percentageNumber) && percentageNumber >= 0 && percentageNumber <= 100) {
    if (seekerMinor === projectMinor) {
      model = 'ADDITIVE';
      totalAmount = minorUnitsToAmount(projectMinor + feeMinor);
    } else if (seekerMinor === projectMinor - feeMinor) {
      model = 'LEGACY_DEDUCTED';
      totalAmount = minorUnitsToAmount(projectMinor);
    }
  }

  return {
    projectAmount: authoritativeFunding?.projectAmount ?? projectAmount,
    fundingCharge: authoritativeFunding?.feeAmount ?? fundingCharge,
    fundingPercentage: authoritativeFunding?.percentage ?? fundingPercentage,
    totalAmount,
    model,
  };
};
const statusLabel = (contract: ContractData) => {
  const escrowStatus = contract.freelance?.escrow?.status;
  const workStatus = contract.freelance?.workStatus;
  if (contract.type === 'CONTRACT_PROJECT' && contract.status === 'PENDING') return 'Payment required';
  if (escrowStatus === 'RELEASED') return 'Released';
  if (escrowStatus === 'RELEASE_ELIGIBLE') return 'Release eligible';
  if (workStatus === 'COMPLETION_SUBMITTED') return 'Work submitted';
  if (contract.type === 'CONTRACT_PROJECT' && escrowStatus === 'FUNDED') return 'Payment secured';
  if (escrowStatus === 'FUNDED') return 'Funded';
  if (contract.type === 'FREELANCE_PROJECT' && contract.status === 'PENDING' && escrowStatus === 'UNFUNDED') return 'Payment required';
  if (contract.status === 'ACTIVE') return 'Payment required';
  if (contract.status === 'PENDING') return 'Awaiting confirmation';
  return contract.status.replaceAll('_', ' ');
};

function ContractPage({ role }: ContractPageProps) {
  const { contractId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contract, setContract] = useState<ContractData | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isVerifyingReturn, setIsVerifyingReturn] = useState(false);
  const [alreadyFunded, setAlreadyFunded] = useState(false);
  const [showFundingReview, setShowFundingReview] = useState(false);
  const [showCompletionConfirmation, setShowCompletionConfirmation] = useState(false);
  const autoVerificationKey = useRef('');
  const transactionId = searchParams.get('transaction_id');
  const providerReference = searchParams.get('tx_ref');
  const returnStatus = searchParams.get('status');

  const loadContract = async () => {
    if (!token || !contractId) return;
    setIsLoading(true);
    const result = role === 'ADMIN'
      ? await getAdminContract(contractId, token)
      : role === 'EMPLOYER'
        ? await getEmployerContract(contractId, token)
        : await getSeekerContract(contractId, token);
    if (result.ok) {
      setContract(result.data.data.contract);
      setNote(result.data.data.contract.freelance?.completionNote ?? '');
      setAlreadyFunded(['FUNDED', 'RELEASE_ELIGIBLE', 'RELEASED'].includes(result.data.data.contract.freelance?.escrow?.status ?? ''));
      setError('');
    } else setError(result.error.message || 'We could not load this contract.');
    setIsLoading(false);
  };

  useEffect(() => { void loadContract(); }, [contractId, role, token]);

  const verifyReturnedPayment = async (id: string, reference: string | null) => {
    if (!token || !contractId || isVerifyingReturn) return;
    setIsVerifyingReturn(true);
    setError('');
    setMessage('Verifying payment with the server...');
    try {
      const verifyPayment = role === 'ADMIN' ? verifyAdminContractPayment : verifyEmployerContractPayment;
      const result = await verifyPayment(contractId, { providerReference: reference ?? undefined, transactionId: id }, token);
      if (!result.ok) {
        setMessage('We could not confirm this payment yet. Check the payment status again before trying another payment.');
        return;
      }

      const { payment, contract: verifiedContract } = result.data.data;
      const escrow = verifiedContract.freelance?.escrow;
      setContract(verifiedContract);
      const funded = payment.status === 'SUCCESSFUL'
        && ['FUNDED', 'RELEASE_ELIGIBLE', 'RELEASED'].includes(escrow?.status ?? '');
      setAlreadyFunded(['FUNDED', 'RELEASE_ELIGIBLE', 'RELEASED'].includes(escrow?.status ?? ''));

      if (funded) {
        setMessage('Payment verified and escrow funded.');
        const next = new URLSearchParams(searchParams);
        next.delete('transaction_id');
        next.delete('tx_ref');
        next.delete('status');
        setSearchParams(next, { replace: true });
      } else if (payment.status === 'FAILED') {
        setMessage('The backend confirmed that this payment failed. You can try funding again.');
        const next = new URLSearchParams(searchParams);
        next.delete('transaction_id');
        next.delete('tx_ref');
        next.delete('status');
        setSearchParams(next, { replace: true });
      } else {
        setMessage('Your payment is still processing. Check the payment status again shortly.');
      }
    } catch {
      setMessage('We could not confirm this payment yet. Check the payment status again before trying another payment.');
    } finally {
      setIsVerifyingReturn(false);
    }
  };

  useEffect(() => {
    if ((role !== 'EMPLOYER' && role !== 'ADMIN') || !token || !contractId) return;
    if (!transactionId && (providerReference || returnStatus)) {
      setMessage('Payment has not been confirmed. A transaction reference was not returned, so payment status cannot be checked here.');
      const next = new URLSearchParams(searchParams);
      next.delete('tx_ref');
      next.delete('status');
      setSearchParams(next, { replace: true });
      return;
    }
    if (!transactionId) return;
    const attemptKey = `${contractId}:${providerReference ?? ''}:${transactionId}`;
    if (autoVerificationKey.current === attemptKey) return;
    autoVerificationKey.current = attemptKey;
    void verifyReturnedPayment(transactionId, providerReference);
  }, [contractId, providerReference, returnStatus, role, searchParams, setSearchParams, token, transactionId]);

  const fundContract = async () => {
    if (!token || !contractId || isMutating) return;
    setIsMutating(true);
    setError('');
    setShowFundingReview(false);
    setMessage('Preparing secure checkout...');
    const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `contract:${contractId}:${Date.now()}`;
    try {
      const result = role === 'ADMIN'
        ? await initializeAdminContractPayment(contractId, token, idempotencyKey)
        : await initializeEmployerContractPayment(contractId, token, idempotencyKey);
      if (!result.ok) {
        if (result.error.message.toLowerCase().includes('already funded')) {
          setAlreadyFunded(true);
          setError('');
          setMessage('Payment already completed. This contract has already been funded.');
        } else {
          setError('Payment could not be started. Please try again.');
          setMessage('');
        }
        return;
      }
      if (result.data.data.payment.checkoutUrl) {
        const snapshotSummary = getFundingSummary(contract?.freelance, contract?.funding, contract?.freelance?.escrow);
        const backendAmount = amountInMinorUnits(result.data.data.payment.amount);
        const displayedAmount = amountInMinorUnits(snapshotSummary.totalAmount);
        if (snapshotSummary.model === 'UNKNOWN'
          || backendAmount === null
          || backendAmount !== displayedAmount
          || result.data.data.payment.currency !== contract?.freelance?.currency) {
          setError('The payment amount does not match the saved contract terms. Reload the contract before continuing.');
          setMessage('');
          return;
        }
        window.location.assign(result.data.data.payment.checkoutUrl);
      } else {
        setMessage(result.data.data.alreadyFunded ? 'This contract is already funded.' : 'Payment is already being processed.');
        await loadContract();
      }
    } catch {
      setError('Payment could not be started. Please try again.');
      setMessage('');
    } finally {
      setIsMutating(false);
    }
  };

  const confirmFunding = async () => {
    if (isMutating) return;
    await fundContract();
  };

  const confirmFreelanceTerms = async () => {
    if (!token || !contractId || isMutating) return;
    setIsMutating(true);
    setError('');
    setMessage('');
    try {
      const result = role === 'EMPLOYER'
        ? await confirmEmployerContractTerms(contractId, token)
        : await confirmSeekerContractTerms(contractId, token);
      if (!result.ok) {
        setError(result.error.message || 'Contract confirmation could not be saved.');
        return;
      }
      const updatedContract = result.data.data.contract;
      setContract(updatedContract);
      setAlreadyFunded(['FUNDED', 'RELEASE_ELIGIBLE', 'RELEASED'].includes(updatedContract.freelance?.escrow?.status ?? ''));
      setMessage(updatedContract.status === 'ACTIVE'
        ? 'Both parties confirmed. The contract is active and eligible funding is now available to the employer.'
        : 'Your confirmation was saved. The contract will activate after the other party confirms.');
    } catch {
      setError('Contract confirmation could not be saved. Please try again.');
    } finally {
      setIsMutating(false);
    }
  };

  const submitCompletion = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !contractId || isMutating) return;
    setIsMutating(true);
    setError('');
    const result = await submitSeekerCompletion(contractId, note, token);
    if (!result.ok) setError(result.error.message || 'Completion could not be submitted.');
    else {
      setContract(result.data.data.contract);
      setMessage('Completion submitted. The employer can now review your work.');
    }
    setIsMutating(false);
  };

  const confirmCompletion = async () => {
    if (!token || !contractId || isMutating) return;
    setIsMutating(true);
    setError('');
    try {
      const result = role === 'ADMIN'
        ? await confirmAdminCompletion(contractId, token)
        : await confirmEmployerCompletion(contractId, token);
      if (!result.ok) setError(result.error.message || 'Completion could not be confirmed.');
      else {
        setContract(result.data.data.contract);
        setShowCompletionConfirmation(false);
        setMessage('Work confirmation submitted. This contract is now awaiting admin review; escrow remains protected until an administrator reviews and releases it.');
        if (role === 'EMPLOYER') {
          const refreshed = await getEmployerContract(contractId, token);
          if (refreshed.ok) setContract(refreshed.data.data.contract);
        }
      }
    } catch {
      setError('Completion could not be confirmed. Please try again.');
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) return <main className="contract-page"><p className="contract-state"><FaSpinner className="contract-spin" /> Loading contract...</p></main>;
  if (error && !contract) return <main className="contract-page"><div className="contract-state contract-state--error" role="alert"><p>{error}</p><button type="button" className="button button--secondary" onClick={() => void loadContract()}>Try again</button></div></main>;
  if (!contract?.freelance) return <main className="contract-page"><p className="contract-state contract-state--error">Freelance contract details are unavailable.</p></main>;

  const freelance = contract.freelance;
  const escrow = freelance.escrow;
  const isFunded = escrow?.status === 'FUNDED';
  const isReleaseEligible = escrow?.status === 'RELEASE_ELIGIBLE';
  const isReleased = escrow?.status === 'RELEASED';
  const hasSubmitted = Boolean(freelance.completionSubmittedAt);
  const isContractJob = contract.type === 'CONTRACT_PROJECT';
  const confirmationAction = getPendingFreelanceConfirmationAction({
    role,
    contractType: contract.type,
    contractStatus: contract.status,
    employerConfirmedAt: freelance.employerConfirmedAt,
    seekerConfirmedAt: freelance.seekerConfirmedAt,
  });
  const fundingSummary = getFundingSummary(freelance, contract.funding, escrow);
  const hasSuccessfulFundingPayment = hasSuccessfulContractFundingPayment(escrow?.payments);
  const hasCompletedFunding = alreadyFunded || hasSuccessfulFundingPayment;
  const canShowFundingAction = canShowContractFundingAction({
    role,
    contractType: contract.type,
    contractStatus: contract.status,
    availableActions: contract.availableActions,
    escrowStatus: escrow?.status,
    alreadyFunded: hasCompletedFunding,
    fundingTermsValid: fundingSummary.model !== 'UNKNOWN',
    ownsContract: role !== 'EMPLOYER' || (user?.role === 'EMPLOYER' && user.id === contract.employerId),
  });
  const payment = escrow?.payments?.[0];
  const timeline = [
    {
      label: 'Contract accepted',
      date: freelance.employerConfirmedAt && freelance.seekerConfirmedAt
        ? freelance.seekerConfirmedAt
        : null,
      complete: Boolean((freelance.employerConfirmedAt && freelance.seekerConfirmedAt)
        || contract.application?.status === 'PAYMENT_PENDING'
        || contract.status !== 'PENDING'),
    },
    {
      label: 'Payment funded',
      date: escrow?.fundedAt ?? null,
      complete: ['FUNDED', 'RELEASE_ELIGIBLE', 'RELEASED'].includes(escrow?.status ?? ''),
    },
    {
      label: 'Work in progress',
      date: null,
      complete: ['IN_PROGRESS', 'COMPLETION_SUBMITTED', 'COMPLETED', 'RELEASE_ELIGIBLE', 'RELEASED'].includes(freelance.workStatus),
    },
    {
      label: 'Completion submitted',
      date: freelance.completionSubmittedAt,
      complete: Boolean(freelance.completionSubmittedAt),
    },
    {
      label: 'Employer confirmation',
      date: freelance.employerCompletionConfirmedAt,
      complete: Boolean(freelance.employerCompletionConfirmedAt),
    },
    {
      label: 'Admin review',
      date: isReleased ? escrow?.releasedAt ?? null : escrow?.releaseEligibleAt ?? null,
      complete: isReleased,
    },
    {
      label: 'Payment released',
      date: escrow?.releasedAt ?? null,
      complete: isReleased,
    },
  ];

  return (
    <main className="contract-page">
      <button type="button" className="contract-back" onClick={() => navigate(role === 'EMPLOYER' ? '/employer/contracts' : role === 'ADMIN' ? `/admin/jobs/${contract?.job.id ?? ''}/applicants` : '/seeker/applications')}><FaArrowLeft /> {role === 'EMPLOYER' ? 'Back to My Contracts' : 'Back to applications'}</button>
      <header className="contract-header"><div><span className="contract-eyebrow">{isContractJob ? 'Contract Job' : 'Freelance Project'}</span><h1>{contract.job.title}</h1><p>{role === 'EMPLOYER' ? `${isContractJob ? 'Securing this contract' : 'Funding this project'} for ${displayName(contract.seeker)}` : role === 'ADMIN' ? `${isContractJob ? 'Managing this contract' : 'Managing this project'} for ${displayName(contract.seeker)}` : `${isContractJob ? 'Contract Job with' : 'Project with'} ${displayName(contract.employer)}`}</p></div><span className={`contract-status contract-status--${(escrow?.status ?? contract.status).toLowerCase()}`}>{statusLabel(contract)}</span></header>
      {contract.type === 'FREELANCE_PROJECT' && contract.status === 'PENDING' ? (
        <section className="contract-panel" aria-live="polite">
          <div className="contract-panel-heading"><FaCheckCircle /><div><h2>Confirm project terms</h2><p>Either party may confirm these terms. The employer can fund the project now; funding does not require the other party to confirm first.</p></div></div>
          {confirmationAction ? (
            <button type="button" className="button button--primary contract-action" onClick={() => void confirmFreelanceTerms()} disabled={isMutating}>
              {isMutating ? 'Saving confirmation...' : 'Confirm project terms'}
            </button>
          ) : (
            <p className="contract-muted">
              {role === 'EMPLOYER' && freelance.employerConfirmedAt
                ? 'Your confirmation is recorded. The project can be funded before the seeker confirms.'
                : role === 'SEEKER' && freelance.seekerConfirmedAt
                  ? 'Your confirmation is recorded. The employer can fund the project before you confirm.'
                  : 'Contract confirmation is available to the employer and selected seeker.'}
            </p>
          )}
          <button type="button" className="button button--secondary contract-action contract-action--secondary" onClick={() => void loadContract()} disabled={isLoading || isMutating}>
            {isLoading ? 'Refreshing contract...' : 'Refresh contract status'}
          </button>
        </section>
      ) : null}
      {role === 'EMPLOYER' ? (
        <>
          <div className="employer-contract-detail-badges">
            <span className={`employer-contract-status employer-contract-status--${contract.status.toLowerCase()}`}>{formatStatus(contract.status)}</span>
            <span className="employer-contract-status employer-contract-status--work">{formatStatus(freelance.workStatus)}</span>
          </div>
          <section className="employer-contract-financial-summary" aria-label="Financial summary">
            <article><span>Project amount</span><strong>{formatMoney(contract.funding?.projectAmount ?? freelance.agreedAmount, freelance.currency)}</strong></article>
            <article><span>Funding fee</span><strong>{contract.funding?.percentage ?? fundingSummary.fundingPercentage ?? '—'}% · {formatMoney(contract.funding?.feeAmount ?? freelance.platformFeeAmount, freelance.currency)}</strong></article>
            <article className="employer-contract-financial-summary__total"><span>Employer total</span><strong>{formatMoney(contract.funding?.totalEmployerPayment ?? null, contract.funding?.currency ?? freelance.currency)}</strong></article>
            <article><span>Seeker entitlement</span><strong>{formatMoney(contract.funding?.seekerEntitlement ?? freelance.seekerNetAmount, freelance.currency)}</strong></article>
            <article><span>Escrow</span><strong>{formatStatus(contract.funding?.escrowStatus ?? escrow?.status ?? 'Not created')}</strong></article>
          </section>
          {fundingSummary.model === 'LEGACY_DEDUCTED' ? (
            <p className="employer-contract-legacy-note" role="note">This contract uses saved historical funding terms. Its funding charge was deducted from the agreed project amount; the historical terms are shown as recorded.</p>
          ) : fundingSummary.model === 'ADDITIVE' ? (
            <p className="employer-contract-funding-note" role="note">The funding charge is added to the project amount. Amounts and terms shown here come from the saved contract funding snapshot.</p>
          ) : null}
          <div className="employer-contract-detail-columns">
            <section className="employer-contract-info-panel">
              <div className="contract-panel-heading"><FaBriefcase /><div><h2>Project information</h2><p>Scope and agreed schedule</p></div></div>
              <dl>
                <div><dt>Project type</dt><dd>{isContractJob ? 'Contract project' : 'Freelance project'}</dd></div>
                <div><dt>Start date</dt><dd>{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'Not specified'}</dd></div>
                <div><dt>Expected completion</dt><dd>{freelance.expectedCompletionDate || contract.expectedEndDate ? new Date(freelance.expectedCompletionDate ?? contract.expectedEndDate ?? '').toLocaleDateString() : 'Not specified'}</dd></div>
                <div className="employer-contract-info-panel__description"><dt>Description</dt><dd>{contract.job.description || 'No project description is available.'}</dd></div>
              </dl>
            </section>
            <section className="employer-contract-info-panel employer-contract-seeker-panel">
              <div className="contract-panel-heading"><FaLock /><div><h2>Seeker</h2><p>Project collaborator</p></div></div>
              <div className="employer-contract-seeker">
                {contract.seeker.profilePictureUrl
                  ? <AuthenticatedImage
                    endpoint={`/employer/jobs/${encodeURIComponent(contract.jobId)}/applications/${encodeURIComponent(contract.applicationId)}/profile-picture`}
                    token={token ?? ''}
                    alt=""
                    fallback={<span aria-hidden="true">{contract.seeker.firstName?.charAt(0) ?? 'S'}</span>}
                  />
                  : <span aria-hidden="true">{contract.seeker.firstName?.charAt(0) ?? 'S'}</span>}
                <div><strong>{displayName(contract.seeker)}</strong><p>{contract.seeker.professionalTitle || 'LeamJobs seeker'}</p></div>
              </div>
            </section>
          </div>
          <section className="employer-contract-timeline">
            <div className="contract-panel-heading"><FaCheckCircle /><div><h2>Project progress</h2><p>Milestones reflect the contract, work, escrow, and completion states recorded by LeamJobs.</p></div></div>
            <ol>
              {timeline.map((stage, index) => (
                <li key={stage.label} className={`${stage.complete ? 'is-complete' : ''}${!stage.complete && timeline.slice(0, index).every((item) => item.complete) ? ' is-current' : ''}`}>
                  <span className="employer-contract-timeline__marker" aria-hidden="true">{stage.complete ? <FaCheckCircle /> : index + 1}</span>
                  <div><strong>{stage.label}</strong><span>{stage.complete ? (stage.date ? new Date(stage.date).toLocaleString() : 'Recorded') : stage.label === 'Admin review' && escrow?.status === 'RELEASE_ELIGIBLE' ? 'Awaiting admin review' : stage.label === 'Payment released' && escrow?.status === 'RELEASE_ELIGIBLE' ? 'Pending administrator release' : 'Not recorded yet'}</span></div>
                </li>
              ))}
            </ol>
          </section>
          <section className="employer-contract-info-panel employer-contract-payment-panel">
            <div className="contract-panel-heading"><FaCreditCard /><div><h2>Payment and escrow</h2><p>Funds remain protected until the existing administrator review and release process is complete.</p></div></div>
            <div className="employer-contract-payment-facts">
              <div><span>Payment status</span><strong>{payment ? formatStatus(payment.status) : 'No payment recorded'}</strong></div>
              <div><span>Provider</span><strong>{payment?.provider ?? 'Not available'}</strong></div>
              <div><span>Payment amount</span><strong>{formatMoney(payment?.amount ?? contract.funding?.totalEmployerPayment ?? null, payment?.currency ?? freelance.currency)}</strong></div>
              <div><span>Funded amount</span><strong>{formatMoney(contract.funding?.fundedAmount ?? escrow?.fundedAmount, freelance.currency)}</strong></div>
              <div><span>Funded at</span><strong>{escrow?.fundedAt ? new Date(escrow.fundedAt).toLocaleString() : 'Not funded'}</strong></div>
              <div><span>Released at</span><strong>{escrow?.releasedAt ? new Date(escrow.releasedAt).toLocaleString() : 'Not released'}</strong></div>
            </div>
          </section>
        </>
      ) : null}
      {message ? (
        <div className="contract-result-status">
          <p className="contract-message" role="status" aria-busy={isVerifyingReturn}>{isVerifyingReturn ? <FaSpinner className="contract-spin" aria-hidden="true" /> : null}{message}</p>
          {transactionId && (role === 'EMPLOYER' || role === 'ADMIN') && !hasCompletedFunding ? (
            <button
              type="button"
              className="button button--secondary contract-action contract-status-check"
              onClick={() => void verifyReturnedPayment(transactionId, providerReference)}
              disabled={isVerifyingReturn}
            >
              {isVerifyingReturn ? 'Checking payment status...' : 'Check Payment Status'}
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="contract-error" role="alert">{error}</p> : null}
      <section className="contract-grid">
        <article className="contract-panel contract-panel--identity"><div className="contract-panel-heading"><FaLock /><div><h2>Project participants</h2><p>{contract.job.title}</p></div></div><div className="contract-terms"><div><span>Employer</span><strong>{displayName(contract.employer)}</strong></div><div><span>Seeker</span><strong>{displayName(contract.seeker)}</strong></div></div></article>
        <article className="contract-panel contract-panel--terms">
          <div className="contract-panel-heading"><FaLock /><div><h2>Contract terms</h2><p>Locked from the job after activation</p></div></div>
          <div className="contract-terms">
            <div><span>Project amount</span><strong>{formatMoney(freelance.agreedAmount, freelance.currency)}</strong></div>
            <div><span>{fundingSummary.model === 'LEGACY_DEDUCTED' ? 'Funding charge deducted' : 'Funding charge'}</span><strong>{fundingSummary.fundingPercentage !== null ? `${fundingSummary.fundingPercentage}% · ` : ''}{formatMoney(fundingSummary.fundingCharge, freelance.currency)}</strong></div>
            <div><span>Total employer payment</span><strong>{formatMoney(fundingSummary.totalAmount, freelance.currency)}</strong></div>
            <div><span>Funding model</span><strong>{fundingSummary.model === 'ADDITIVE' ? 'Charge added to project amount' : fundingSummary.model === 'LEGACY_DEDUCTED' ? 'Historical charge deducted from project amount' : 'Funding terms unavailable'}</strong></div>
            <div><span>Currency</span><strong>{freelance.currency || 'Unavailable'}</strong></div>
            {isContractJob ? <><div><span>Duration</span><strong>{freelance.duration}</strong></div><div><span>Start</span><strong>{freelance.startMode === 'SCHEDULED' && contract.startDate ? `Scheduled ${new Date(contract.startDate).toLocaleDateString()}` : 'Immediately'}</strong></div><div><span>Expected completion</span><strong>{contract.expectedEndDate ? new Date(contract.expectedEndDate).toLocaleDateString() : 'Not specified'}</strong></div></> : null}
          </div>
        </article>
        <article className="contract-panel">
          <div className="contract-panel-heading"><FaCreditCard /><div><h2>Protected payment</h2><p>{isReleased ? 'Funds have been released for this project.' : isFunded ? 'Payment is secured and held by LeamJobs until completion and release.' : isReleaseEligible ? 'Funds are ready for admin release.' : 'Payment is held securely by LeamJobs. It is not released to the seeker until the approved completion and release process.'}</p></div></div>
          <div className="contract-escrow-status"><strong>{escrow?.status ?? 'UNFUNDED'}</strong><span>{escrow?.fundedAt ? `Funded ${new Date(escrow.fundedAt).toLocaleDateString()}` : 'Waiting for employer payment'}</span>{isReleased ? <span>Funds released to the seeker wallet.</span> : null}{escrow?.payments?.length ? <span>Payment status: {escrow.payments[0].status}</span> : null}</div>
          {canShowFundingAction ? (
            <>
              {!showFundingReview ? null : <div className="contract-funding-review" aria-live="polite">
                <h3>Project funding</h3>
                <div className="contract-funding-row"><span>Project amount</span><strong>{formatMoney(fundingSummary.projectAmount, freelance.currency)}</strong></div>
                <div className="contract-funding-row"><span>{fundingSummary.model === 'LEGACY_DEDUCTED' ? 'Funding charge deducted' : 'Funding charge'}</span><strong>{fundingSummary.fundingPercentage !== null ? `${fundingSummary.fundingPercentage}% · ` : ''}{formatMoney(fundingSummary.fundingCharge, freelance.currency)}</strong></div>
                <div className="contract-funding-row contract-funding-row--total"><span>Total employer payment</span><strong>{formatMoney(fundingSummary.totalAmount, freelance.currency)}</strong></div>
                <p>{fundingSummary.model === 'ADDITIVE'
                  ? `Your funding charge is added to the project amount. The project amount remains ${formatMoney(fundingSummary.projectAmount, freelance.currency)} and the additional ${formatMoney(fundingSummary.fundingCharge, freelance.currency)} is the funding charge.`
                  : fundingSummary.model === 'LEGACY_DEDUCTED'
                    ? `This contract uses its saved historical terms: the funding charge is deducted from the agreed project amount. The employer payment is ${formatMoney(fundingSummary.totalAmount, freelance.currency)} and the seeker entitlement is ${formatMoney(freelance.seekerNetAmount, freelance.currency)}.`
                    : 'The saved funding terms are incomplete or inconsistent, so payment cannot be safely confirmed from this page.'}</p>
              </div>}
              <button type="button" className="button button--primary contract-action" onClick={() => { if (!showFundingReview) { setShowFundingReview(true); return; } void confirmFunding(); }} disabled={isMutating || isVerifyingReturn || (showFundingReview && fundingSummary.model === 'UNKNOWN')}>
                <FaCreditCard /> {isMutating ? 'Preparing secure payment...' : isVerifyingReturn ? 'Verifying payment...' : showFundingReview ? `Confirm & Pay ${formatMoney(fundingSummary.totalAmount, freelance.currency)}` : 'Secure payment'}
              </button>
              {showFundingReview && fundingSummary.model === 'UNKNOWN' ? <p className="contract-error" role="alert">Funding details are unavailable or inconsistent. Please contact support before paying.</p> : null}
              {showFundingReview ? <button type="button" className="button button--secondary contract-action contract-action--secondary" onClick={() => setShowFundingReview(false)} disabled={isMutating}>Back</button> : null}
            </>
          ) : null}{(role === 'EMPLOYER' || role === 'ADMIN') && hasCompletedFunding && !isReleased ? <p className="contract-message">Payment already completed. This contract has already been funded.</p> : null}</article>
      </section>
      <section className="contract-panel contract-workflow"><div className="contract-panel-heading"><FaFileUpload /><div><h2>Work completion</h2><p>{isReleased ? 'Funds have been released for this project.' : isReleaseEligible ? 'Completed - awaiting admin release.' : hasSubmitted ? 'Completion submitted - waiting for employer review.' : isFunded ? 'Funded - work can begin.' : 'Waiting for employer payment.'}</p></div></div>{role === 'SEEKER' && isFunded && !hasSubmitted ? <form onSubmit={submitCompletion}><label htmlFor="completion-note">Completion note</label><textarea id="completion-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} placeholder="Tell the employer what you completed..." required /><button type="submit" className="button button--primary" disabled={isMutating || !note.trim()}>{isMutating ? 'Submitting...' : 'Submit Work'}</button></form> : null}{(role === 'EMPLOYER' && contract.availableActions?.confirmCompletion) || (role === 'ADMIN' && isFunded && hasSubmitted && !isReleaseEligible && !isReleased) ? <div className="contract-review"><p><strong>Work completed</strong><br />{freelance.completionNote || 'No completion note provided.'}</p><p className="contract-muted">Submitted {freelance.completionSubmittedAt ? new Date(freelance.completionSubmittedAt).toLocaleString() : ''}</p><button type="button" className="button button--primary" onClick={() => role === 'EMPLOYER' ? setShowCompletionConfirmation(true) : void confirmCompletion()} disabled={isMutating}><FaCheckCircle /> {isMutating ? 'Confirming...' : role === 'EMPLOYER' ? 'Confirm Work & Request Admin Review' : 'Confirm Completion'}</button></div> : null}</section>
      {role === 'EMPLOYER' && showCompletionConfirmation ? (
        <div className="employer-contract-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isMutating) setShowCompletionConfirmation(false);
        }}>
          <section className="employer-contract-dialog" role="dialog" aria-modal="true" aria-labelledby="employer-contract-confirm-title">
            <button type="button" className="employer-contract-dialog__close" aria-label="Close confirmation" onClick={() => setShowCompletionConfirmation(false)} disabled={isMutating}><FaTimes /></button>
            <span className="employer-contract-dialog__icon"><FaLock /></span>
            <h2 id="employer-contract-confirm-title">Request completion review?</h2>
            <p>Confirming this work will move the contract into admin review. The escrowed payment will remain protected until an administrator reviews and releases it.</p>
            <div className="employer-contract-dialog__actions">
              <button type="button" className="button button--secondary" onClick={() => setShowCompletionConfirmation(false)} disabled={isMutating}>Cancel</button>
              <button type="button" className="button button--primary" onClick={() => void confirmCompletion()} disabled={isMutating}>
                {isMutating ? 'Sending confirmation...' : 'Confirm & Request Review'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default ContractPage;