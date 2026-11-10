import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { FaEye, FaSearch, FaTimes, FaWallet } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminWithdrawal,
  getAdminWithdrawals,
  type AdminWithdrawal,
  type AdminWithdrawalDetails,
  type AdminWithdrawalProvider,
  type AdminWithdrawalQuery,
  type AdminWithdrawalStatus,
  type AdminWithdrawalSummary,
} from '../../services/api';

type Filters = {
  search: string;
  seeker: string;
  status: AdminWithdrawalStatus | '';
  provider: AdminWithdrawalProvider | '';
  currency: string;
  from: string;
  to: string;
};

const emptyFilters: Filters = {
  search: '',
  seeker: '',
  status: '',
  provider: '',
  currency: '',
  from: '',
  to: '',
};
const statuses: AdminWithdrawalStatus[] = ['PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'REVERSED', 'CANCELLED'];
const providers: AdminWithdrawalProvider[] = ['FLUTTERWAVE', 'PAYSTACK'];

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const formatDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Not recorded';
const formatMoney = (value: string, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'code' }).format(Number(value));
  } catch {
    return `${currency} ${value}`;
  }
};

function SummaryCards({ summary }: { summary: AdminWithdrawalSummary }) {
  const cards = [
    ['Total withdrawals', String(summary.totalWithdrawals)],
    ['Pending', String(summary.pending)],
    ['Processing', String(summary.processing)],
    ['Successful', String(summary.successful)],
    ['Failed', String(summary.failed)],
    ['Reversed', String(summary.reversed)],
    ['Cancelled', String(summary.cancelled)],
    ['Successfully paid', formatMoney(summary.totalSuccessfullyPaid, summary.currency)],
    ['Awaiting processing (net payout)', formatMoney(summary.totalAwaitingProcessing, summary.currency)],
  ];
  return (
    <section className="admin-withdrawals-summary" aria-label={`${summary.currency} withdrawal summary`}>
      <h2>{summary.currency} overview</h2>
      <div className="admin-withdrawals-summary__grid">
        {cards.map(([title, value]) => (
          <article className="admin-withdrawals-summary__card" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function DetailField({ label: fieldLabel, children }: { label: string; children: ReactNode }) {
  return <div className="admin-withdrawal-detail__field"><span>{fieldLabel}</span><strong>{children || 'Not recorded'}</strong></div>;
}

function WithdrawalDetails({
  withdrawal,
  onClose,
}: {
  withdrawal: AdminWithdrawalDetails;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="admin-withdrawal-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="admin-withdrawal-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-withdrawal-detail-title">
        <button className="admin-withdrawal-dialog__close" type="button" onClick={onClose} aria-label="Close withdrawal details"><FaTimes /></button>
        <header className="admin-withdrawal-dialog__header">
          <div>
            <span className="admin-withdrawal-eyebrow">Withdrawal detail</span>
            <h2 id="admin-withdrawal-detail-title">Transaction trace</h2>
            <code>{withdrawal.id}</code>
          </div>
          <span className={`admin-withdrawal-status admin-withdrawal-status--${withdrawal.status.toLowerCase()}`}>{label(withdrawal.status)}</span>
        </header>

        <section className="admin-withdrawal-detail-section">
          <h3>Withdrawal identity</h3>
          <div className="admin-withdrawal-detail-grid">
            <DetailField label="Seeker">{withdrawal.seeker.name}</DetailField>
            <DetailField label="Email">{withdrawal.seeker.email}</DetailField>
            <DetailField label="Amount">{formatMoney(withdrawal.amount, withdrawal.currency)}</DetailField>
            <DetailField label="Provider">{withdrawal.provider ? label(withdrawal.provider) : null}</DetailField>
            <DetailField label="Requested">{formatDate(withdrawal.requestedAt)}</DetailField>
            <DetailField label="Last updated">{formatDate(withdrawal.updatedAt)}</DetailField>
          </div>
        </section>

        <section className="admin-withdrawal-detail-section">
          <h3>Bank destination</h3>
          <div className="admin-withdrawal-detail-grid">
            <DetailField label="Bank">{withdrawal.bankDestination.bankName}</DetailField>
            <DetailField label="Account holder">{withdrawal.bankDestination.accountHolderName}</DetailField>
            <DetailField label="Account number">{withdrawal.bankDestination.maskedAccountNumber}</DetailField>
            <DetailField label="Payout method">{withdrawal.bankDestination.payoutMethod ? label(withdrawal.bankDestination.payoutMethod) : null}</DetailField>
            <DetailField label="Country">{withdrawal.bankDestination.country}</DetailField>
          </div>
        </section>

        <section className="admin-withdrawal-detail-section">
          <h3>Provider and reconciliation</h3>
          <div className="admin-withdrawal-detail-grid">
            <DetailField label="Transfer reference">{withdrawal.providerInfo.transferReference}</DetailField>
            <DetailField label="Transfer code">{withdrawal.providerInfo.transferCode}</DetailField>
            <DetailField label="Provider status">{label(withdrawal.providerInfo.status)}</DetailField>
            <DetailField label="Last reconciliation attempt">{withdrawal.providerInfo.lastReconciliationAt ? formatDate(withdrawal.providerInfo.lastReconciliationAt) : 'Not recorded'}</DetailField>
            <DetailField label="Failure information">{withdrawal.failureReason}</DetailField>
          </div>
        </section>

        {withdrawal.payout ? (
          <section className="admin-withdrawal-detail-section">
            <h3>Payout attempts <span>({withdrawal.payout.attempts.length})</span></h3>
            <p className="admin-withdrawal-detail__id">Payout ID: <code>{withdrawal.payout.id}</code></p>
            {withdrawal.payout.attempts.length ? (
              <div className="admin-withdrawal-attempts">
                {withdrawal.payout.attempts.map((attempt) => (
                  <article className="admin-withdrawal-attempt" key={attempt.id}>
                    <strong>Attempt {attempt.attemptNumber}</strong>
                    <span>Attempt ID: <code>{attempt.id}</code></span>
                    <span>Provider reference / transfer code: {attempt.providerReference ?? 'Not recorded'}</span>
                    <span>Status: {label(attempt.status)}</span>
                    <span>Created: {formatDate(attempt.createdAt)}</span>
                    <span>Last updated: {formatDate(attempt.updatedAt)}</span>
                    <span>Processed at: {formatDate(attempt.processedAt)}</span>
                    {attempt.failureReason ? <span>Provider message: {attempt.failureReason}</span> : null}
                  </article>
                ))}
              </div>
            ) : <p className="admin-withdrawal-muted">No payout attempts are recorded.</p>}
          </section>
        ) : null}

        <section className="admin-withdrawal-detail-section">
          <h3>Transaction timeline</h3>
          {withdrawal.timeline.length ? (
            <ol className="admin-withdrawal-timeline">
              {withdrawal.timeline.map((event) => (
                <li key={event.id}>
                  <span className="admin-withdrawal-timeline__dot" />
                  <div>
                    <strong>{event.title}</strong>
                    {event.status ? <span>{label(event.status)}</span> : null}
                    {event.detail ? <p>{event.detail}</p> : null}
                    {event.amount && event.currency ? <span>{formatMoney(event.amount, event.currency)}</span> : null}
                    <time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="admin-withdrawal-muted">No transaction events are recorded.</p>}
        </section>
      </section>
    </div>
  );
}

function AdminWithdrawalsPage() {
  const { token } = useAuth();
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [summaries, setSummaries] = useState<AdminWithdrawalSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminWithdrawalDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const cursor = cursorHistory[pageIndex];

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      setError('Your Admin session is unavailable. Refresh your session before viewing withdrawals.');
      return () => { active = false; };
    }
    setLoading(true);
    setError('');
    const query: AdminWithdrawalQuery = {
      limit: 25,
      ...(cursor ? { cursor } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.seeker ? { seeker: filters.seeker } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.provider ? { provider: filters.provider } : {}),
      ...(filters.currency ? { currency: filters.currency } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
    };
    void getAdminWithdrawals(token, query).then((result) => {
      if (!active) return;
      if (result.ok) {
        setWithdrawals(result.data.data.items);
        setSummaries(result.data.data.summaryByCurrency);
        setNextCursor(result.data.data.nextCursor);
      } else {
        setWithdrawals([]);
        setSummaries([]);
        setNextCursor(null);
        setError(result.error.message || 'Withdrawal records could not be loaded.');
      }
    }).catch((loadError: unknown) => {
      if (!active) return;
      setWithdrawals([]);
      setSummaries([]);
      setNextCursor(null);
      setError(loadError instanceof Error ? loadError.message : 'Withdrawal records could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [cursor, filters, refreshKey, token]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedWithdrawal(null);
      setDetailError('');
      return undefined;
    }
    let active = true;
    if (!token) {
      setDetailLoading(false);
      setDetailError('Your Admin session is unavailable. Refresh your session before viewing withdrawal details.');
      return () => { active = false; };
    }
    setDetailLoading(true);
    setDetailError('');
    void getAdminWithdrawal(token, selectedId).then((result) => {
      if (!active) return;
      if (result.ok) setSelectedWithdrawal(result.data.data);
      else {
        setSelectedWithdrawal(null);
        setDetailError(result.error.message || 'Withdrawal details could not be loaded.');
      }
    }).catch((loadError: unknown) => {
      if (!active) return;
      setSelectedWithdrawal(null);
      setDetailError(loadError instanceof Error ? loadError.message : 'Withdrawal details could not be loaded.');
    }).finally(() => {
      if (active) setDetailLoading(false);
    });
    return () => { active = false; };
  }, [detailRefreshKey, selectedId, token]);

  const changeDraft = (key: keyof Filters, value: string) => {
    setDraftFilters((previous) => ({ ...previous, [key]: value }));
  };
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({ ...draftFilters });
    setCursorHistory([undefined]);
    setPageIndex(0);
  };
  const resetFilters = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setCursorHistory([undefined]);
    setPageIndex(0);
  };
  const openDetails = (withdrawal: AdminWithdrawal) => {
    setSelectedId(withdrawal.id);
    setSelectedWithdrawal(null);
  };

  return (
    <div className="admin-withdrawals-page">
      <header className="admin-withdrawals-heading">
        <div className="admin-withdrawals-heading__icon"><FaWallet aria-hidden="true" /></div>
        <div>
          <p className="admin-withdrawal-eyebrow">Financial operations</p>
          <h1>Withdrawal Monitoring</h1>
          <p>Read-only trace of seeker payouts, provider outcomes, and wallet ledger evidence.</p>
        </div>
      </header>

      <form className="admin-withdrawals-toolbar" onSubmit={applyFilters}>
        <label className="admin-withdrawals-toolbar__search">
          Search
          <span className="admin-withdrawals-searchbox"><FaSearch aria-hidden="true" /><input value={draftFilters.search} onChange={(event) => changeDraft('search', event.target.value)} placeholder="ID, seeker, email, provider reference or transfer code" /></span>
        </label>
        <label>Seeker<input value={draftFilters.seeker} onChange={(event) => changeDraft('seeker', event.target.value)} placeholder="Name, email or seeker ID" /></label>
        <label>Status
          <select value={draftFilters.status} onChange={(event) => changeDraft('status', event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((status) => <option value={status} key={status}>{label(status)}</option>)}
          </select>
        </label>
        <label>Provider
          <select value={draftFilters.provider} onChange={(event) => changeDraft('provider', event.target.value)}>
            <option value="">All providers</option>
            {providers.map((provider) => <option value={provider} key={provider}>{label(provider)}</option>)}
          </select>
        </label>
        <label>Currency
          <input value={draftFilters.currency} onChange={(event) => changeDraft('currency', event.target.value)} placeholder="Any currency" maxLength={3} />
        </label>
        <label>From<input type="date" value={draftFilters.from} onChange={(event) => changeDraft('from', event.target.value)} /></label>
        <label>To<input type="date" value={draftFilters.to} onChange={(event) => changeDraft('to', event.target.value)} /></label>
        <div className="admin-withdrawals-toolbar__actions">
          <button className="admin-withdrawal-button admin-withdrawal-button--primary" type="submit">Apply filters</button>
          <button className="admin-withdrawal-button" type="button" onClick={resetFilters}>Reset</button>
        </div>
      </form>

      {summaries.map((summary) => <SummaryCards key={summary.currency} summary={summary} />)}

      <section className="admin-withdrawals-records" aria-labelledby="admin-withdrawals-records-title">
        <div className="admin-withdrawals-records__heading">
          <div><h2 id="admin-withdrawals-records-title">Withdrawal records</h2><p>Search results are paginated on the server.</p></div>
          <button type="button" className="admin-withdrawal-button" onClick={() => setRefreshKey((key) => key + 1)}>Refresh</button>
        </div>
        {error ? (
          <div className="admin-withdrawals-state admin-withdrawals-state--error" role="alert">
            <strong>Could not load withdrawal records</strong><span>{error}</span>
            <button type="button" className="admin-withdrawal-button" onClick={() => setRefreshKey((key) => key + 1)}>Retry</button>
          </div>
        ) : loading ? (
          <div className="admin-withdrawals-state" role="status">Loading withdrawal records…</div>
        ) : withdrawals.length === 0 ? (
          <div className="admin-withdrawals-state"><strong>No withdrawals found</strong><span>Adjust your filters or search terms.</span></div>
        ) : (
          <>
            <div className="admin-withdrawals-table-wrap">
              <table className="admin-withdrawals-table">
                <thead><tr>
                  <th scope="col">Withdrawal ID</th><th scope="col">Seeker</th><th scope="col">Amount</th><th scope="col">Provider</th>
                  <th scope="col">Status</th><th scope="col">Requested</th><th scope="col">Last updated</th><th scope="col">Provider reference</th><th scope="col">Details</th>
                </tr></thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td><code>{withdrawal.id}</code></td>
                      <td><strong>{withdrawal.seeker.name}</strong><span className="admin-withdrawals-table__secondary">{withdrawal.seeker.email}</span></td>
                      <td>{formatMoney(withdrawal.amount, withdrawal.currency)}</td>
                      <td>{withdrawal.provider ? label(withdrawal.provider) : 'Not recorded'}</td>
                      <td><span className={`admin-withdrawal-status admin-withdrawal-status--${withdrawal.status.toLowerCase()}`}>{label(withdrawal.status)}</span></td>
                      <td>{formatDate(withdrawal.requestedAt)}</td>
                      <td>{formatDate(withdrawal.updatedAt)}</td>
                      <td>{withdrawal.providerTransferCode ?? withdrawal.providerReference ?? 'Not recorded'}</td>
                      <td><button className="admin-withdrawal-icon-button" type="button" onClick={() => openDetails(withdrawal)} aria-label={`View withdrawal ${withdrawal.id}`}><FaEye aria-hidden="true" /> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="admin-withdrawals-pagination" aria-label="Withdrawal pages">
              <button type="button" className="admin-withdrawal-button" disabled={pageIndex === 0 || loading} onClick={() => setPageIndex((index) => Math.max(0, index - 1))}>Previous</button>
              <span>Page {pageIndex + 1}</span>
              <button
                type="button"
                className="admin-withdrawal-button"
                disabled={!nextCursor || loading}
                onClick={() => {
                  if (!nextCursor) return;
                  setCursorHistory((history) => [...history.slice(0, pageIndex + 1), nextCursor]);
                  setPageIndex((index) => index + 1);
                }}
              >Next</button>
            </nav>
          </>
        )}
      </section>

      {selectedId && detailLoading ? (
        <div className="admin-withdrawal-dialog-backdrop" role="presentation">
          <section className="admin-withdrawal-dialog admin-withdrawal-dialog--state" role="status">Loading withdrawal detail…</section>
        </div>
      ) : null}
      {selectedId && detailError ? (
        <div className="admin-withdrawal-dialog-backdrop">
          <section className="admin-withdrawal-dialog admin-withdrawal-dialog--state" role="alert">
            <button className="admin-withdrawal-dialog__close" type="button" onClick={() => setSelectedId(null)} aria-label="Close withdrawal details"><FaTimes /></button>
            <strong>Could not load withdrawal details</strong><span>{detailError}</span>
            <button type="button" className="admin-withdrawal-button" onClick={() => setDetailRefreshKey((key) => key + 1)}>Retry</button>
          </section>
        </div>
      ) : null}
      {selectedWithdrawal ? <WithdrawalDetails withdrawal={selectedWithdrawal} onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}

export default AdminWithdrawalsPage;
