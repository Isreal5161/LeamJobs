import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaFileUpload, FaLock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  confirmEmployerCompletion,
  getEmployerContract,
  getSeekerContract,
  initializeEmployerContractPayment,
  submitSeekerCompletion,
  verifyEmployerContractPayment,
  type ContractData,
} from '../../services/api';

type ContractPageProps = { role: 'EMPLOYER' | 'SEEKER' };

const formatMoney = (amount: string, currency: string) => `${currency} ${amount}`;
const displayName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`.trim();
const statusLabel = (contract: ContractData) => {
  const escrowStatus = contract.freelance?.escrow?.status;
  const workStatus = contract.freelance?.workStatus;
  if (escrowStatus === 'RELEASED') return 'Released';
  if (escrowStatus === 'RELEASE_ELIGIBLE') return 'Release eligible';
  if (workStatus === 'COMPLETION_SUBMITTED') return 'Work submitted';
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

  const loadContract = async () => {
    if (!token || !contractId) return;
    setIsLoading(true);
    const result = role === 'EMPLOYER' ? await getEmployerContract(contractId, token) : await getSeekerContract(contractId, token);
    if (result.ok) {
      setContract(result.data.data.contract);
      setNote(result.data.data.contract.freelance?.completionNote ?? '');
      setAlreadyFunded(['FUNDED', 'RELEASE_ELIGIBLE', 'RELEASED'].includes(result.data.data.contract.freelance?.escrow?.status ?? ''));
      setError('');
    } else setError(result.error.message || 'We could not load this contract.');
    setIsLoading(false);
  };

  useEffect(() => { void loadContract(); }, [contractId, role, token]);

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const providerReference = searchParams.get('tx_ref');
    const returnStatus = searchParams.get('status');
    if (role !== 'EMPLOYER' || !token || !contractId || isVerifyingReturn) return;
    if (!transactionId && (providerReference || returnStatus)) {
      setError('');
      setMessage('Payment was not completed or could not be verified. You can try again.');
      const next = new URLSearchParams(searchParams);
      next.delete('tx_ref');
      next.delete('status');
      setSearchParams(next, { replace: true });
      return;
    }
    if (!transactionId) return;
    setIsVerifyingReturn(true);
    setMessage('Verifying payment with the server...');
    void verifyEmployerContractPayment(contractId, { providerReference: providerReference ?? undefined, transactionId }, token).then((result) => {
      if (!result.ok) setError('Payment could not be verified. No funds were added to escrow. You can try again.');
      else {
        setContract(result.data.data.contract);
        setAlreadyFunded(result.data.data.contract.freelance?.escrow?.status === 'FUNDED');
        setMessage(result.data.data.contract.freelance?.escrow?.status === 'FUNDED' ? 'Payment verified and escrow funded.' : 'Payment verification is still processing.');
      }
      const next = new URLSearchParams(searchParams);
      next.delete('transaction_id');
      next.delete('tx_ref');
      next.delete('status');
      setSearchParams(next, { replace: true });
      setIsVerifyingReturn(false);
    });
  }, [contractId, isVerifyingReturn, role, searchParams, setSearchParams, token]);

  const fundContract = async () => {
    if (!token || !contractId || isMutating) return;
    setIsMutating(true);
    setError('');
    setMessage('Preparing secure checkout...');
    const result = await initializeEmployerContractPayment(contractId, token, `contract:${contractId}`);
    if (!result.ok) {
      if (result.error.message.toLowerCase().includes('already funded')) {
        setAlreadyFunded(true);
        setError('');
        setMessage('Payment already completed. This contract has already been funded.');
      } else setError('Payment could not be started. Please try again.');
      setIsMutating(false);
      return;
    }
    if (result.data.data.payment.checkoutUrl) window.location.assign(result.data.data.payment.checkoutUrl);
    else {
      setMessage(result.data.data.alreadyFunded ? 'This contract is already funded.' : 'Payment is already being processed.');
      await loadContract();
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
    const result = await confirmEmployerCompletion(contractId, token);
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

  return (
    <main className="contract-page">
      <button type="button" className="contract-back" onClick={() => navigate(role === 'EMPLOYER' ? '/employer/applicants' : '/seeker/applications')}><FaArrowLeft /> Back to applications</button>
      <header className="contract-header"><div><span className="contract-eyebrow">Freelance contract</span><h1>{contract.job.title}</h1><p>{role === 'EMPLOYER' ? `Funding this project for ${displayName(contract.seeker)}` : `Project with ${displayName(contract.employer)}`}</p></div><span className={`contract-status contract-status--${(escrow?.status ?? contract.status).toLowerCase()}`}>{statusLabel(contract)}</span></header>
      {message ? <p className="contract-message" role="status">{message}</p> : null}
      {error ? <p className="contract-error" role="alert">{error}</p> : null}
      <section className="contract-grid">
        <article className="contract-panel contract-panel--identity"><div className="contract-panel-heading"><FaLock /><div><h2>Project participants</h2><p>{contract.job.title}</p></div></div><div className="contract-terms"><div><span>Employer</span><strong>{displayName(contract.employer)}</strong></div><div><span>Seeker</span><strong>{displayName(contract.seeker)}</strong></div></div></article>
        <article className="contract-panel contract-panel--terms"><div className="contract-panel-heading"><FaLock /><div><h2>Contract terms</h2><p>Locked from the job after activation</p></div></div><div className="contract-terms"><div><span>Project amount</span><strong>{formatMoney(freelance.agreedAmount, freelance.currency)}</strong></div><div><span>Platform fee</span><strong>{freelance.platformFeePercentage ?? '5.00'}% (informational)</strong></div><div><span>Total to fund</span><strong>{formatMoney(freelance.agreedAmount, freelance.currency)}</strong></div><div><span>Currency</span><strong>{freelance.currency}</strong></div></div></article>
        <article className="contract-panel"><div className="contract-panel-heading"><FaCreditCard /><div><h2>Escrow</h2><p>{isReleased ? 'Funds have been released for this project.' : isFunded ? 'Funds are held for this contract.' : isReleaseEligible ? 'Funds are ready for admin release.' : 'No money moves until payment is verified.'}</p></div></div><div className="contract-escrow-status"><strong>{escrow?.status ?? 'UNFUNDED'}</strong><span>{escrow?.fundedAt ? `Funded ${new Date(escrow.fundedAt).toLocaleDateString()}` : 'Waiting for employer payment'}</span>{isReleased ? <span>Funds released to the seeker wallet.</span> : null}{escrow?.payments?.length ? <span>Payment status: {escrow.payments[0].status}</span> : null}</div>{role === 'EMPLOYER' && contract.status === 'ACTIVE' && escrow?.status === 'UNFUNDED' && !alreadyFunded ? <button type="button" className="button button--primary contract-action" onClick={() => void fundContract()} disabled={isMutating}><FaCreditCard /> {isMutating ? 'Processing payment...' : 'Fund Contract'}</button> : null}{role === 'EMPLOYER' && alreadyFunded && !isReleased ? <p className="contract-message">Payment already completed. This contract has already been funded.</p> : null}</article>
      </section>
      <section className="contract-panel contract-workflow"><div className="contract-panel-heading"><FaFileUpload /><div><h2>Work completion</h2><p>{isReleased ? 'Funds have been released for this project.' : isReleaseEligible ? 'Completed - awaiting admin release.' : hasSubmitted ? 'Completion submitted - waiting for employer review.' : isFunded ? 'Funded - work can begin.' : 'Waiting for employer payment.'}</p></div></div>{role === 'SEEKER' && isFunded && !hasSubmitted ? <form onSubmit={submitCompletion}><label htmlFor="completion-note">Completion note</label><textarea id="completion-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} placeholder="Tell the employer what you completed..." required /><button type="submit" className="button button--primary" disabled={isMutating || !note.trim()}>{isMutating ? 'Submitting...' : 'Submit Work'}</button></form> : null}{role === 'EMPLOYER' && isFunded && hasSubmitted && !isReleaseEligible && !isReleased ? <div className="contract-review"><p><strong>Work completed</strong><br />{freelance.completionNote || 'No completion note provided.'}</p><p className="contract-muted">Submitted {freelance.completionSubmittedAt ? new Date(freelance.completionSubmittedAt).toLocaleString() : ''}</p><button type="button" className="button button--primary" onClick={() => void confirmCompletion()} disabled={isMutating || isReleaseEligible}><FaCheckCircle /> {isMutating ? 'Confirming...' : 'Confirm Completion'}</button></div> : null}</section>
    </main>
  );
}

export default ContractPage;