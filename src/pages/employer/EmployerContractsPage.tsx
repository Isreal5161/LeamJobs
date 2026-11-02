import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBriefcase, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaFileContract, FaRedoAlt, FaTimes, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { cancelEmployerContract, deleteEmployerContract, getEmployerContracts, type ContractData, type EmployerContractStatus } from '../../services/api';
import { canDeleteEmployerContract } from '../../utils/employerContractActions';

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
  const [contractToCancel, setContractToCancel] = useState<ContractData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState('');
  const [contractToDelete, setContractToDelete] = useState<ContractData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionError, setDeletionError] = useState('');
  const [feedback, setFeedback] = useState('');
  const isDeletingRef = useRef(false);
  const deleteDialogRef = useRef<HTMLElement | null>(null);
  isDeletingRef.current = isDeleting;

  useEffect(() => {
    if (!contractToDelete) return undefined;
    const previousOverflow = document.body.style.overflow;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeletingRef.current) setContractToDelete(null);
      if (event.key !== 'Tab') return;
      const dialog = deleteDialogRef.current;
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!dialog || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      if (opener?.isConnected) opener.focus();
    };
  }, [contractToDelete]);

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

  const cancelContract = async () => {
    if (!token || !contractToCancel || isCancelling) return;
    setIsCancelling(true);
    setCancellationError('');
    try {
      const result = await cancelEmployerContract(contractToCancel.id, token);
      if (!result.ok) {
        setCancellationError(result.error.message || 'This contract could not be cancelled. Refresh its payment state and try again.');
        return;
      }
      setContractToCancel(null);
      setReloadKey((value) => value + 1);
    } catch {
      setCancellationError('This contract could not be cancelled. Refresh its payment state and try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const deleteContract = async () => {
    if (!token || !contractToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeletionError('');
    setFeedback('');
    try {
      const result = await deleteEmployerContract(contractToDelete.id, token);
      if (!result.ok) {
        setDeletionError(result.error.message || 'This contract could not be deleted. Refresh its financial state and try again.');
        return;
      }
      const remainingTotal = Math.max(0, total - 1);
      const remainingPages = Math.ceil(remainingTotal / PAGE_SIZE);
      const needsPageRefresh = remainingPages > 0 && page > remainingPages;
      setContracts((current) => current.filter((contract) => contract.id !== contractToDelete.id));
      setTotal(remainingTotal);
      setTotalPages(remainingPages);
      setContractToDelete(null);
      setFeedback('Contract deleted from your list. Financial and transaction records have been retained.');
      if (needsPageRefresh) {
        setPage(remainingPages);
        setReloadKey((value) => value + 1);
      }
    } catch {
      setDeletionError('This contract could not be deleted. Refresh its financial state and try again.');
    } finally {
      setIsDeleting(false);
    }
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
      {feedback ? <p className="employer-contract-feedback" role="status">{feedback}</p> : null}

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
                    <div className="employer-contract-card__actions">
                      {contract.availableActions?.cancel === true ? (
                        <button
                          type="button"
                          className="button button--secondary employer-contract-cancel"
                          onClick={() => {
                            setCancellationError('');
                            setContractToCancel(contract);
                          }}
                        >
                          Cancel
                        </button>
                      ) : null}
                      {canDeleteEmployerContract(contract) ? (
                        <button
                          type="button"
                          className="button button--secondary employer-contract-delete"
                          aria-label={`Delete contract ${contract.job?.title || 'Untitled project'}`}
                          onClick={() => {
                            setDeletionError('');
                            setFeedback('');
                            setContractToDelete(contract);
                          }}
                        >
                          <FaTrashAlt aria-hidden="true" /> <span>Delete</span>
                        </button>
                      ) : null}
                      <Link className="button button--secondary employer-contract-view" to={`/employer/contracts/${encodeURIComponent(contract.id)}`}>
                        View contract <FaArrowRight />
                      </Link>
                    </div>
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
      {contractToCancel ? (
        <div className="employer-contract-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isCancelling) setContractToCancel(null);
        }}>
          <section className="employer-contract-dialog" role="alertdialog" aria-modal="true" aria-labelledby="employer-contract-list-cancel-title" aria-describedby="employer-contract-list-cancel-description">
            <button type="button" className="employer-contract-dialog__close" aria-label="Close cancellation confirmation" onClick={() => setContractToCancel(null)} disabled={isCancelling}>
              <FaTimes />
            </button>
            <span className="employer-contract-dialog__icon"><FaTimes /></span>
            <h2 id="employer-contract-list-cancel-title">Cancel this unfunded contract?</h2>
            <p id="employer-contract-list-cancel-description">
              “{contractToCancel.job?.title || 'Untitled project'}” will be marked cancelled and the selected application rejected. This cannot be undone. No money will be moved.
            </p>
            {cancellationError ? <p className="employer-contract-cancel-error" role="alert">{cancellationError}</p> : null}
            <div className="employer-contract-dialog__actions">
              <button type="button" className="button button--secondary" onClick={() => setContractToCancel(null)} disabled={isCancelling}>Keep contract</button>
              <button type="button" className="button button--primary contract-cancel-confirm" onClick={() => void cancelContract()} disabled={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Cancel contract'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {contractToDelete ? (
        <div className="employer-contract-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setContractToDelete(null);
        }}>
          <section ref={deleteDialogRef} className="employer-contract-dialog" role="alertdialog" aria-modal="true" aria-busy={isDeleting} aria-labelledby="employer-contract-list-delete-title" aria-describedby="employer-contract-list-delete-description">
            <button type="button" className="employer-contract-dialog__close" aria-label="Close delete confirmation" onClick={() => setContractToDelete(null)} disabled={isDeleting}>
              <FaTimes />
            </button>
            <span className="employer-contract-dialog__icon employer-contract-dialog__icon--delete"><FaTrashAlt aria-hidden="true" /></span>
            <h2 id="employer-contract-list-delete-title">Delete contract?</h2>
            <p id="employer-contract-list-delete-description">
              “{contractToDelete.job?.title || 'Untitled project'}” will be removed from your employer contract list. Financial and transaction records will be retained.
            </p>
            {deletionError ? <p className="employer-contract-cancel-error" role="alert">{deletionError}</p> : null}
            <div className="employer-contract-dialog__actions">
              <button type="button" className="button button--secondary" onClick={() => setContractToDelete(null)} disabled={isDeleting} autoFocus>Cancel</button>
              <button type="button" className="button button--primary employer-contract-delete-confirm" onClick={() => void deleteContract()} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Contract'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default EmployerContractsPage;
