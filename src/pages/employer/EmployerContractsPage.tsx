import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBriefcase, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaFileContract, FaRedoAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getEmployerContracts, type ContractData, type EmployerContractStatus } from '../../services/api';

const PAGE_SIZE = 10;
const statusOptions: Array<{ label: string; value: EmployerContractStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Ended', value: 'ENDED' },
  { label: 'Disputed', value: 'DISPUTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const titleCase = (value: string | null | undefined) => value
  ? value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  : 'Not available';

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

const formatMoney = (amount: string | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency || !Number.isFinite(Number(amount))) return 'Not available';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

const seekerName = (contract: ContractData) => [contract.seeker?.firstName, contract.seeker?.lastName].filter(Boolean).join(' ') || 'Seeker';

const contractKind = (contract: ContractData) => contract.type === 'CONTRACT_PROJECT' ? 'Contract project' : 'Freelance project';

const escrowLabel = (contract: ContractData) => {
  const escrow = contract.funding?.escrowStatus ?? contract.freelance?.escrow?.status;
  if (escrow) return titleCase(escrow);
  if (contract.availableActions?.fund) return 'Awaiting funding';
  return 'Not created';
};

function ContractCardSkeleton() {
  return (
    <article className="employer-contract-card employer-contract-card--skeleton" aria-hidden="true">
      <span className="leamjobs-skeleton-line employer-contract-skeleton__title" />
      <span className="leamjobs-skeleton-line employer-contract-skeleton__meta" />
      <span className="leamjobs-skeleton-line employer-contract-skeleton__amount" />
      <span className="leamjobs-skeleton-line employer-contract-skeleton__button" />
    </article>
  );
}

function EmployerContractsPage() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [status, setStatus] = useState<EmployerContractStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const loadContracts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    const result = await getEmployerContracts(token, { page, limit: PAGE_SIZE, ...(status ? { status } : {}) });
    if (!result.ok) {
      setError(result.error.message || 'We could not load your contracts.');
      setIsLoading(false);
      return;
    }
    setContracts(result.data.data.contracts);
    setTotalPages(result.data.data.pagination.totalPages);
    setTotal(result.data.data.pagination.total);
    setIsLoading(false);
  }, [page, reloadKey, status, token]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const changeStatus = (nextStatus: EmployerContractStatus | '') => {
    setStatus(nextStatus);
    setPage(1);
  };

  return (
    <main className="employer-contracts-page">
      <header className="employer-contracts-heading">
        <div>
          <span className="employer-contracts-eyebrow">Work management</span>
          <h1>My Contracts</h1>
          <p>Track project progress, protected payments, and completion reviews in one place.</p>
        </div>
        <label className="employer-contracts-filter">
          <span>Contract status</span>
          <select value={status} onChange={(event) => changeStatus(event.target.value as EmployerContractStatus | '')}>
            {statusOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </header>

      <div className="employer-contracts-results" aria-live="polite">
        <span>{isLoading ? 'Loading contracts...' : `${total} ${total === 1 ? 'contract' : 'contracts'}`}</span>
        {!isLoading && totalPages > 1 ? <span>Page {page} of {totalPages}</span> : null}
      </div>

      {isLoading ? (
        <div className="employer-contract-list" aria-label="Loading contracts">
          {Array.from({ length: 3 }, (_, index) => <ContractCardSkeleton key={index} />)}
        </div>
      ) : error ? (
        <section className="employer-contracts-state employer-contracts-state--error" role="alert">
          <h2>Contracts could not be loaded</h2>
          <p>{error}</p>
          <button type="button" className="button button--primary" onClick={() => setReloadKey((value) => value + 1)}>
            <FaRedoAlt /> Try again
          </button>
        </section>
      ) : contracts.length === 0 ? (
        <section className="employer-contracts-state">
          <span className="employer-contracts-empty-icon"><FaFileContract /></span>
          <h2>{status ? 'No contracts with this status' : 'No contracts yet'}</h2>
          <p>{status ? 'Choose another status to view more of your contract work.' : 'Contracts for selected candidates will appear here when they are created.'}</p>
          {status ? <button type="button" className="button button--secondary" onClick={() => changeStatus('')}>View all contracts</button> : null}
        </section>
      ) : (
        <>
          <div className="employer-contract-list">
            {contracts.map((contract) => {
              const workStatus = contract.freelance?.workStatus;
              const paymentStatus = contract.funding?.paymentStatus;
              const totalAmount = contract.funding?.totalEmployerPayment;
              const fundedAmount = contract.funding?.fundedAmount;
              const currency = contract.funding?.currency ?? contract.freelance?.currency;
              return (
                <article className="employer-contract-card" key={contract.id}>
                  <div className="employer-contract-card__top">
                    <div className="employer-contract-card__identity">
                      <span className="employer-contract-card__icon"><FaBriefcase /></span>
                      <div className="employer-contract-card__title">
                        <span className="employer-contracts-eyebrow">{contractKind(contract)}</span>
                        <h2>{contract.job?.title || 'Untitled project'}</h2>
                        <p>With {seekerName(contract)}{contract.seeker?.professionalTitle ? ` · ${contract.seeker.professionalTitle}` : ''}</p>
                      </div>
                    </div>
                    <span className={`employer-contract-status employer-contract-status--${contract.status.toLowerCase()}`}>{titleCase(contract.status)}</span>
                  </div>

                  <div className="employer-contract-card__facts">
                    <div><span>Work status</span><strong>{titleCase(workStatus)}</strong></div>
                    <div><span>Escrow</span><strong>{escrowLabel(contract)}</strong></div>
                    <div><span>Payment</span><strong>{titleCase(paymentStatus)}</strong></div>
                    <div>
                      <span>{fundedAmount && Number(fundedAmount) > 0 ? 'Amount funded' : 'Employer total'}</span>
                      <strong>{formatMoney(fundedAmount && Number(fundedAmount) > 0 ? fundedAmount : totalAmount, currency)}</strong>
                    </div>
                  </div>

                  <div className="employer-contract-card__bottom">
                    <span><FaCalendarAlt /> Updated {formatDate(contract.updatedAt || contract.createdAt)}</span>
                    <Link className="button button--secondary employer-contract-view" to={`/employer/contracts/${encodeURIComponent(contract.id)}`}>
                      View contract <FaArrowRight />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          {totalPages > 1 ? (
            <nav className="employer-contract-pagination" aria-label="Contract pages">
              <button type="button" className="button button--secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
                <FaChevronLeft /> Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" className="button button--secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading}>
                Next <FaChevronRight />
              </button>
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}

export default EmployerContractsPage;
