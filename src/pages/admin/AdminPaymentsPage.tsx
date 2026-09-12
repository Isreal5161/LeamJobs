import { useEffect, useState } from 'react';
import { FaCheckCircle, FaCoins, FaLock, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminReleaseCandidates, releaseAdminContract, type AdminReleaseCandidate } from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded';
const fullName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`.trim();
const money = (amount: string, currency: string) => `${currency} ${amount}`;

function AdminPaymentsPage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState<AdminReleaseCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [released, setReleased] = useState<{ candidate: AdminReleaseCandidate; result: { releasedAmount: string; currency: string; status: string; releasedAt: string } } | null>(null);

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

  return (
    <div className="payment-page admin-release-page">
      <section className="payment-hero"><div><span>Admin finance control</span><h1>Release eligible funds</h1><p>Review completed freelance contracts before crediting seeker wallets.</p></div><FaCoins aria-hidden="true" /></section>
      {message ? <p className="payment-copy payment-copy--success" role="status">{message}</p> : null}
      {error ? <p className="payment-copy payment-copy--error" role="alert">{error}</p> : null}
      {released ? <section className="payment-panel admin-release-success" role="status"><div className="payment-heading"><div><span><FaCheckCircle /> Release complete</span><h2>{released.candidate.job.title}</h2></div><span className="payment-status payment-status--completed">{released.result.status}</span></div><p><strong>{money(released.result.releasedAmount, released.result.currency)}</strong> was credited to {fullName(released.candidate.seeker)}&apos;s wallet.</p><div className="admin-release-card__status"><span>Seeker: {fullName(released.candidate.seeker)}</span><span>Employer: {fullName(released.candidate.employer)}</span><span>Released: {formatDate(released.result.releasedAt)}</span></div></section> : null}
      <section className="payment-panel" aria-busy={isLoading}>
        <div className="payment-heading"><div><span><FaLock /> Authoritative escrow queue</span><h2>Release eligible contracts</h2></div><button type="button" onClick={() => void loadCandidates()} disabled={isLoading}>Refresh</button></div>
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
    </div>
  );
}

export default AdminPaymentsPage;
