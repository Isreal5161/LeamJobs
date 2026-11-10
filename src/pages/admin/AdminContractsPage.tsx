import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { FaArchive, FaFileContract, FaSearch, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  archiveAdminContract,
  cancelAdminContract,
  getAdminContracts,
  type AdminContractListItem,
} from '../../services/api';
import type { AdminPermissionState } from '../../utils/adminNavigation.js';
import {
  canAccessAdminContracts,
  canShowAdminContractAction,
  type AdminContractManagementAction,
} from './adminContractsPermissions';

const PAGE_SIZE = 20;
const contractStatuses = ['PENDING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ENDED', 'DISPUTED', 'CANCELLED'];
const escrowStatuses = ['UNFUNDED', 'FUNDING', 'FUNDED', 'RELEASE_ELIGIBLE', 'RELEASED', 'DISPUTED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED'];
const workStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETION_SUBMITTED', 'COMPLETED', 'DISPUTED', 'RELEASE_ELIGIBLE', 'RELEASED', 'REFUNDED', 'CANCELLED'];

const label = (value: string | null | undefined) => value
  ? value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  : 'Not available';

const participantName = (person: { firstName: string; lastName: string } | null | undefined) => (
  [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Not available'
);

const money = (amount: string | null | undefined, currency: string | null | undefined) => {
  if (amount === null || amount === undefined || !currency || !Number.isFinite(Number(amount))) return 'Not available';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

function AdminContractsPage() {
  const { token } = useAuth();
  const permissionState = useOutletContext<AdminPermissionState>();
  const [contracts, setContracts] = useState<AdminContractListItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');
  const [workStatus, setWorkStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedAction, setSelectedAction] = useState<{ action: AdminContractManagementAction; contract: AdminContractListItem } | null>(null);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    if (!token) {
      setContracts([]);
      setIsLoading(false);
      setError('Your session could not be loaded. Please sign in again.');
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setError('');
    void getAdminContracts(token, {
      page,
      limit: PAGE_SIZE,
      search,
      status,
      escrowStatus,
      workStatus,
    }).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setContracts([]);
        setTotal(0);
        setTotalPages(0);
        setError(result.error.message || 'Contracts could not be loaded.');
      } else {
        setContracts(result.data.data.contracts);
        setTotal(result.data.data.pagination.total);
        setTotalPages(result.data.data.pagination.totalPages);
        setError('');
      }
      setIsLoading(false);
    });

    return () => { active = false; };
  }, [token, page, search, status, escrowStatus, workStatus, reloadKey]);

  useEffect(() => {
    if (!selectedAction) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isActing) setSelectedAction(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedAction, isActing]);

  const changeFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
    setNotice('');
  };

  const confirmAction = async () => {
    if (!token || !selectedAction || isActing) return;
    setIsActing(true);
    setActionError('');
    setNotice('');
    const { action, contract } = selectedAction;
    const result = action === 'cancel'
      ? await cancelAdminContract(contract.id, token)
      : await archiveAdminContract(contract.id, token);
    setIsActing(false);
    if (!result.ok) {
      setActionError(result.error.message || `This contract could not be ${action === 'cancel' ? 'cancelled' : 'archived'}. Refresh its state and try again.`);
      return;
    }

    setSelectedAction(null);
    setNotice(action === 'cancel'
      ? `Contract ${contract.id} was cancelled. No funds were moved.`
      : `Contract ${contract.id} was archived from the employer list. Its financial and transaction history was retained.`);
    setReloadKey((value) => value + 1);
  };

  const setAction = (action: AdminContractManagementAction, contract: AdminContractListItem) => {
    setActionError('');
    setNotice('');
    setSelectedAction({ action, contract });
  };

  return (
    <main className="admin-page admin-contracts-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow"><FaFileContract /> Operations</span>
          <h1>Contracts</h1>
          <p>Review contract lifecycle and protected payment state across all employers.</p>
        </div>
      </section>

      <section className="admin-panel admin-contracts-toolbar" aria-label="Contract search and filters">
        <label className="admin-contracts-search">
          <span>Search contracts</span>
          <span className="admin-contracts-search__input"><FaSearch aria-hidden="true" /><input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Contract ID, job, employer, or seeker" /></span>
        </label>
        <label><span>Contract status</span><select value={status} onChange={(event) => changeFilter(setStatus, event.target.value)}><option value="">All statuses</option>{contractStatuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label><span>Escrow status</span><select value={escrowStatus} onChange={(event) => changeFilter(setEscrowStatus, event.target.value)}><option value="">All escrow statuses</option>{escrowStatuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label><span>Work status</span><select value={workStatus} onChange={(event) => changeFilter(setWorkStatus, event.target.value)}><option value="">All work statuses</option>{workStatuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
      </section>

      {notice ? <p className="admin-contracts-notice" role="status">{notice}</p> : null}
      {error ? <section className="admin-contracts-state admin-contracts-state--error" role="alert"><h2>Contracts could not be loaded</h2><p>{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></section> : null}
      {!error ? <section className="admin-panel admin-contracts-results" aria-busy={isLoading}>
        <div className="admin-contracts-results__heading"><strong>{isLoading ? 'Loading contracts…' : `${total} ${total === 1 ? 'contract' : 'contracts'}`}</strong><button type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={isLoading}>Refresh</button></div>
        {isLoading ? <div className="admin-contracts-loading" role="status">Loading contracts…</div> : contracts.length === 0 ? (
          <div className="admin-contracts-state"><FaFileContract aria-hidden="true" /><h2>No contracts found</h2><p>Change your search or filters to view other contracts.</p></div>
        ) : <div className="admin-contracts-list">
          {contracts.map((contract) => {
            const canCancel = canShowAdminContractAction(permissionState, contract, 'cancel');
            const canArchive = canShowAdminContractAction(permissionState, contract, 'archive');
            const canExplainArchiveUnavailability = canAccessAdminContracts(permissionState, 'archive');
            const escrow = contract.freelance?.escrow;
            const amount = contract.funding?.fundedAmount && Number(contract.funding.fundedAmount) > 0
              ? contract.funding.fundedAmount
              : contract.funding?.totalEmployerPayment ?? contract.freelance?.agreedAmount;
            const currency = contract.funding?.currency ?? contract.freelance?.currency;
            return <article className="admin-contract-card" key={contract.id}>
              <div className="admin-contract-card__heading">
                <div><span className="admin-contract-card__type">{label(contract.type)}</span><h2>{contract.job.title || 'Untitled contract'}</h2><p>{contract.id}</p></div>
                <div className="admin-contract-card__badges"><span className={`admin-contract-status admin-contract-status--${contract.status.toLowerCase()}`}>{label(contract.status)}</span>{contract.employerArchivedAt ? <span className="admin-contract-status admin-contract-status--archived">Archived</span> : null}</div>
              </div>
              <div className="admin-contract-card__details">
                <div><span>Employer</span><strong>{participantName(contract.employer)}</strong></div>
                <div><span>Seeker</span><strong>{participantName(contract.seeker)}</strong></div>
                <div><span>Work status</span><strong>{label(contract.freelance?.workStatus)}</strong></div>
                <div><span>Escrow status</span><strong>{label(escrow?.status ?? contract.funding?.escrowStatus)}</strong></div>
                <div><span>Payment status</span><strong>{label(contract.funding?.paymentStatus)}</strong></div>
                <div><span>Amount / currency</span><strong>{money(amount, currency)}</strong></div>
              </div>
              <div className="admin-contract-card__actions">
                <Link className="button button--secondary" to={`/admin/contracts/${encodeURIComponent(contract.id)}`}>View details</Link>
                {canCancel ? <button type="button" className="button button--secondary" onClick={() => setAction('cancel', contract)}>Cancel</button> : null}
                {canArchive ? <button type="button" className="button button--secondary" onClick={() => setAction('archive', contract)}><FaArchive aria-hidden="true" /> Archive</button> : null}
              </div>
              {contract.status === 'COMPLETED' && !canArchive && canExplainArchiveUnavailability
                ? <p className="admin-contracts-archive-hint">Archive is unavailable until completion and full financial settlement are verified.</p>
                : null}
            </article>;
          })}
        </div>}
        {!isLoading && totalPages > 1 ? <nav className="admin-contracts-pagination" aria-label="Contract pages">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Next</button>
        </nav> : null}
      </section> : null}

      {selectedAction ? <div className="admin-contract-dialog-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isActing) setSelectedAction(null);
      }}>
        <section className="admin-contract-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-contract-dialog-title">
          <button type="button" className="admin-contract-dialog__close" aria-label="Close confirmation" onClick={() => setSelectedAction(null)} disabled={isActing}><FaTimes /></button>
          <h2 id="admin-contract-dialog-title">{selectedAction.action === 'cancel' ? 'Cancel this unfunded contract?' : 'Archive this contract?'}</h2>
          {selectedAction.action === 'cancel'
            ? <p>This will mark the contract as cancelled, reject the selected application, and notify the seeker. No refund, wallet credit, or escrow release will be created. Contracts with payment attempts, funding, disputes, or unresolved provider activity cannot be cancelled.</p>
            : <p>This removes the contract from the employer’s contract list. It remains visible in Admin and is not permanently deleted. The contract, escrow, payments, refunds, payouts, webhook events, ledger entries, and audit history are retained. Completed contracts can be archived only after completion and full financial settlement are verified; disputed or financially unsafe contracts cannot be archived.</p>}
          <strong>{selectedAction.contract.job.title || selectedAction.contract.id}</strong>
          {actionError ? <p className="admin-contract-dialog__error" role="alert">{actionError}</p> : null}
          <div className="admin-contract-dialog__actions">
            <button type="button" className="button button--secondary" onClick={() => setSelectedAction(null)} disabled={isActing}>Keep contract</button>
            <button type="button" className="button button--primary" onClick={() => void confirmAction()} disabled={isActing}>{isActing ? 'Saving…' : selectedAction.action === 'cancel' ? 'Cancel contract' : 'Archive contract'}</button>
          </div>
        </section>
      </div> : null}
    </main>
  );
}

export default AdminContractsPage;
