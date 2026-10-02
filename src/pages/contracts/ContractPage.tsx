import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaFileUpload, FaLock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  confirmAdminCompletion,
  confirmEmployerCompletion,
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
const getFundingSummary = (value: ContractData['freelance'] | null | undefined) => {
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

  if (currencyIsValid && projectMinor !== null && feeMinor !== null && seekerMinor !== null
    && Number.isFinite(percentageNumber) && percentageNumber >= 0 && percentageNumber <= 100) {
    if (seekerMinor === projectMinor) {
      model = 'ADDITIVE';
      totalAmount = ((projectMinor + feeMinor) / 100n).toString()
        + `.${((projectMinor + feeMinor) % 100n).toString().padStart(2, '0')}`;
    } else if (seekerMinor === projectMinor - feeMinor) {
      model = 'LEGACY_DEDUCTED';
      totalAmount = projectAmount;
    }
  }

  return {
    projectAmount,
    fundingCharge,
    fundingPercentage,
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
  if (contract.status === 'ACTIVE') return 'Payment required';
  if (contract.status === 'PENDING') return 'Awaiting confirmation';
  return contract.status.replaceAll('_', ' ');
};

function ContractPage({ role }: ContractPageProps) {
  const { contractId } = useParams();
  const { token } = useAuth();
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
        const snapshotSummary = getFundingSummary(contract?.freelance);
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
    const result = role === 'ADMIN'
      ? await confirmAdminCompletion(contractId, token)
      : await confirmEmployerCompletion(contractId, token);
    if (!result.ok) setError(result.error.message || 'Completion could not be confirmed.');
    else {
      setContract(result.data.data.contract);
      setMessage('Completion confirmed. Escrow is ready for admin release.');
    }
    setIsMutating(false);
  };

  if (isLoading) return <main className="contract-page"><p className="contract-state"><FaSpinner className="contract-spin" /> Loading contract...</p></main>;
  if (error && !contract) return <main className="contract-page"><p className="contract-state contract-state--error" role="alert">{error}</p></main>;
  if (!contract?.freelance) return <main className="contract-page"><p className="contract-state contract-state--error">Freelance contract details are unavailable.</p></main>;

  const freelance = contract.freelance;
  const escrow = freelance.escrow;
  const isFunded = escrow?.status === 'FUNDED';
  const isReleaseEligible = escrow?.status === 'RELEASE_ELIGIBLE';
  const isReleased = escrow?.status === 'RELEASED';
  const hasSubmitted = Boolean(freelance.completionSubmittedAt);
  const isContractJob = contract.type === 'CONTRACT_PROJECT';
  const fundingSummary = getFundingSummary(freelance);

  return (
    <main className="contract-page">
      <button type="button" className="contract-back" onClick={() => navigate(role === 'EMPLOYER' ? '/employer/applicants' : role === 'ADMIN' ? `/admin/jobs/${contract?.job.id ?? ''}/applicants` : '/seeker/applications')}><FaArrowLeft /> Back to applications</button>
      <header className="contract-header"><div><span className="contract-eyebrow">{isContractJob ? 'Contract Job' : 'Freelance Project'}</span><h1>{contract.job.title}</h1><p>{role === 'EMPLOYER' ? `${isContractJob ? 'Securing this contract' : 'Funding this project'} for ${displayName(contract.seeker)}` : role === 'ADMIN' ? `${isContractJob ? 'Managing this contract' : 'Managing this project'} for ${displayName(contract.seeker)}` : `${isContractJob ? 'Contract Job with' : 'Project with'} ${displayName(contract.employer)}`}</p></div><span className={`contract-status contract-status--${(escrow?.status ?? contract.status).toLowerCase()}`}>{statusLabel(contract)}</span></header>
      {message ? (
        <div className="contract-result-status">
          <p className="contract-message" role="status" aria-busy={isVerifyingReturn}>{isVerifyingReturn ? <FaSpinner className="contract-spin" aria-hidden="true" /> : null}{message}</p>
          {transactionId && (role === 'EMPLOYER' || role === 'ADMIN') && !alreadyFunded ? (
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
          {(role === 'EMPLOYER' || role === 'ADMIN') && ((isContractJob && contract.status === 'PENDING') || (!isContractJob && contract.status === 'ACTIVE')) && escrow?.status === 'UNFUNDED' && !alreadyFunded ? (
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
                <FaCreditCard /> {isMutating ? 'Preparing secure payment...' : isVerifyingReturn ? 'Verifying payment...' : showFundingReview ? `Confirm & Pay ${formatMoney(fundingSummary.totalAmount, freelance.currency)}` : isContractJob ? 'Secure payment' : 'Fund Project'}
              </button>
              {showFundingReview && fundingSummary.model === 'UNKNOWN' ? <p className="contract-error" role="alert">Funding details are unavailable or inconsistent. Please contact support before paying.</p> : null}
              {showFundingReview ? <button type="button" className="button button--secondary contract-action contract-action--secondary" onClick={() => setShowFundingReview(false)} disabled={isMutating}>Back</button> : null}
            </>
          ) : null}{(role === 'EMPLOYER' || role === 'ADMIN') && alreadyFunded && !isReleased ? <p className="contract-message">Payment already completed. This contract has already been funded.</p> : null}</article>
      </section>
      <section className="contract-panel contract-workflow"><div className="contract-panel-heading"><FaFileUpload /><div><h2>Work completion</h2><p>{isReleased ? 'Funds have been released for this project.' : isReleaseEligible ? 'Completed - awaiting admin release.' : hasSubmitted ? 'Completion submitted - waiting for employer review.' : isFunded ? 'Funded - work can begin.' : 'Waiting for employer payment.'}</p></div></div>{role === 'SEEKER' && isFunded && !hasSubmitted ? <form onSubmit={submitCompletion}><label htmlFor="completion-note">Completion note</label><textarea id="completion-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} placeholder="Tell the employer what you completed..." required /><button type="submit" className="button button--primary" disabled={isMutating || !note.trim()}>{isMutating ? 'Submitting...' : 'Submit Work'}</button></form> : null}{(role === 'EMPLOYER' || role === 'ADMIN') && isFunded && hasSubmitted && !isReleaseEligible && !isReleased ? <div className="contract-review"><p><strong>Work completed</strong><br />{freelance.completionNote || 'No completion note provided.'}</p><p className="contract-muted">Submitted {freelance.completionSubmittedAt ? new Date(freelance.completionSubmittedAt).toLocaleString() : ''}</p><button type="button" className="button button--primary" onClick={() => void confirmCompletion()} disabled={isMutating || isReleaseEligible}><FaCheckCircle /> {isMutating ? 'Confirming...' : 'Confirm Completion'}</button></div> : null}</section>
    </main>
  );
}

export default ContractPage;