import { useEffect, useState } from 'react';
import { FaChartLine, FaCheckCircle, FaCrown, FaDollarSign, FaEye, FaUserShield, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminSubscription,
  getAdminSubscriptionPlans,
  getAdminSubscriptionSummary,
  getAdminSubscriptions,
  updateAdminSubscriptionPlan,
  type AdminSubscription,
  type AdminSubscriptionPlan,
  type AdminSubscriptionSummary,
} from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

type AdminSubscriptionDetail = AdminSubscription & {
  payments: {
    id: string;
    amount: string | null;
    currency: string;
    status: string;
    provider: string;
    providerReference: string;
    transactionId: string | null;
    verifiedAt: string | null;
    createdAt: string;
  }[];
  events: {
    id: string;
    eventType: string;
    occurredAt: string;
    providerReference: string | null;
  }[];
};

const formatDate = (value: string | null) => (value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded');
const formatMoney = (amount: string | null, currency: string | null) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  return currency ? `${currency} ${amount}` : amount;
};
const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());

function AdminSubscriptionsPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AdminSubscriptionSummary | null>(null);
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminSubscriptionDetail | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [plansError, setPlansError] = useState('');
  const [subsError, setSubsError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status: AdminSubscription['status'] | ''; plan: string; currency: string; from: string; to: string; search: string }>({ status: '', plan: '', currency: '', from: '', to: '', search: '' });
  const [query] = useState({ limit: 25 });

  const fetchSummary = async () => {
    if (!token) return;
    setSummaryLoading(true);
    const result = await getAdminSubscriptionSummary(token);
    if (result.ok) {
      setSummary(result.data.data);
      setSummaryError('');
    } else {
      setSummary(null);
      setSummaryError(result.error.message || 'Subscription summary could not be loaded.');
    }
    setSummaryLoading(false);
  };

  const fetchPlans = async () => {
    if (!token) return;
    setPlansLoading(true);
    const result = await getAdminSubscriptionPlans(token);
    if (result.ok) {
      setPlans(result.data.data.plans);
      setPlansError('');
    } else {
      setPlans([]);
      setPlansError(result.error.message || 'Subscription plans could not be loaded.');
    }
    setPlansLoading(false);
  };

  const fetchSubscriptions = async (append = false) => {
    if (!token) return;
    setSubsLoading(true);
    const result = await getAdminSubscriptions(token, {
      limit: query.limit,
      ...(append && nextCursor ? { cursor: nextCursor } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.plan ? { plan: filters.plan } : {}),
      ...(filters.currency ? { currency: filters.currency } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    });

    if (result.ok) {
      setSubscriptions((current) => (append ? [...current, ...result.data.data.items] : result.data.data.items));
      setNextCursor(result.data.data.nextCursor);
      setSubsError('');
    } else {
      setSubscriptions([]);
      setNextCursor(null);
      setSubsError(result.error.message || 'Subscriber list could not be loaded.');
    }
    setSubsLoading(false);
  };

  useEffect(() => {
    void fetchSummary();
    void fetchPlans();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void fetchSubscriptions(false);
  }, [token, filters.status, filters.plan, filters.currency, filters.from, filters.to, filters.search, query.limit]);

  const updatePlanState = (planId: string, updates: Partial<AdminSubscriptionPlan>) => {
    setPlans((current) => current.map((plan) => (plan.id === planId ? { ...plan, ...updates } : plan)));
  };

  const handleSavePlan = async (plan: AdminSubscriptionPlan) => {
    if (!token) return;
    setSavingPlanId(plan.id);
    const payload = {
      displayName: plan.name,
      description: plan.description,
      price: plan.price === null ? null : Number(plan.price),
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      isActive: plan.active,
      isPublic: plan.public,
      displayOrder: plan.displayOrder,
      benefits: plan.benefits,
      entitlementKeys: plan.entitlements.map((entitlement) => entitlement.key),
    };

    const result = await updateAdminSubscriptionPlan(plan.id, payload, token);
    if (result.ok) {
      setPlans((current) => current.map((item) => (item.id === plan.id ? result.data.data.plan : item)));
      setPlansError('');
    } else {
      setPlansError(result.error.message || 'Plan could not be updated.');
    }
    setSavingPlanId(null);
  };

  const openSubscriptionDetails = async (subscriptionId: string) => {
    if (!token) return;
    setDetailLoading(true);
    const result = await getAdminSubscription(subscriptionId, token);
    if (result.ok) {
      setDetail(result.data.data.subscription);
    }
    setDetailLoading(false);
  };

  const totalSubscribers = summary?.subscriptionCounts.total ?? 0;
  const activeSubscriptions = summary?.subscriptionCounts.active ?? 0;
  const professionalActive = summary?.plans.find((row) => row.planKey === 'PROFESSIONAL')?.active ?? 0;
  const premiumActive = summary?.plans.find((row) => row.planKey === 'PREMIUM')?.active ?? 0;
  const revenueLabel = summary?.revenue.length ? summary.revenue.map((row) => `${row.currency} ${row.amount}`).join(' / ') : 'NGN 0';

  return (
    <div className="admin-page subscription-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Admin monetization</span>
          <h1>Subscription management</h1>
          <p>Review real subscription health, plan configuration, and payment-backed revenue at the admin level.</p>
        </div>
        <button className="admin-icon-button" type="button" aria-label="Manage subscriptions">
          <FaCrown />
        </button>
      </section>

      <section className="admin-stat-grid" aria-label="Subscription overview summary">
        {summaryLoading ? (
          <AdminPageSkeleton statCards={4} rows={0} showToolbar={false} />
        ) : (
          <>
            <article className="admin-stat-card">
              <span className="admin-stat-card__icon"><FaUsers /></span>
              <div><strong>{totalSubscribers}</strong><p>total subscribers</p></div>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaCheckCircle /></span>
              <div><strong>{activeSubscriptions}</strong><p>active subscriptions</p></div>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaDollarSign /></span>
              <div><strong>{revenueLabel}</strong><p>subscription revenue</p></div>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-card__icon admin-stat-card__icon--purple"><FaChartLine /></span>
              <div><strong>{professionalActive} / {premiumActive}</strong><p>professional / premium</p></div>
            </article>
          </>
        )}
      </section>

      {summaryError ? <p className="payment-copy payment-copy--error" role="alert">{summaryError}</p> : null}

      <section className="admin-panel subscription-panel subscription-panel--editor">
        <div className="subscription-heading">
          <div>
            <span><FaUserShield /> Plan configuration</span>
            <h2>Plan details</h2>
          </div>
        </div>

        {plansLoading ? <AdminPageSkeleton rows={2} statCards={0} showToolbar={false} /> : null}
        {!plansLoading && plansError ? <p className="payment-copy payment-copy--error" role="alert">{plansError}</p> : null}

        {!plansLoading && !plansError && !plans.length ? (
          <p className="payment-copy payment-empty">No subscription plans yet.</p>
        ) : null}

        {!plansLoading && !plansError && plans.length ? (
          <div className="subscription-plan-grid">
            {plans.map((plan) => (
              <article className="subscription-plan" key={plan.id}>
                <label className="subscription-input">
                  <span>Plan name</span>
                  <input type="text" value={plan.name} onChange={(event) => updatePlanState(plan.id, { name: event.target.value })} />
                </label>
                <strong>{formatMoney(plan.price, plan.currency)}<small>{plan.billingInterval ? ` / ${plan.billingInterval.toLowerCase()}` : ''}</small></strong>
                <label className="subscription-input">
                  <span>Price</span>
                  <input type="number" min={0} step="0.01" value={plan.price ?? 0} onChange={(event) => updatePlanState(plan.id, { price: event.target.value === '' ? null : String(Number(event.target.value).toFixed(2)) })} />
                </label>
                <label className="subscription-input">
                  <span>Currency</span>
                  <input type="text" maxLength={3} value={plan.currency ?? ''} onChange={(event) => updatePlanState(plan.id, { currency: event.target.value.toUpperCase() })} />
                </label>
                <label className="subscription-input">
                  <span>Display order</span>
                  <input type="number" min={0} value={plan.displayOrder} onChange={(event) => updatePlanState(plan.id, { displayOrder: Number(event.target.value) || 0 })} />
                </label>
                <label className="subscription-input">
                  <span>Plan description</span>
                  <textarea rows={3} value={plan.description ?? ''} onChange={(event) => updatePlanState(plan.id, { description: event.target.value })} />
                </label>
                <div className="subscription-benefits-editor">
                  <span>Benefits</span>
                  <div className="subscription-benefits-list">
                    {plan.benefits.map((benefit, index) => (
                      <div className="subscription-benefit-item" key={`${plan.id}-benefit-${index}`}>
                        <input type="text" value={benefit} onChange={(event) => {
                          const nextBenefits = [...plan.benefits];
                          nextBenefits[index] = event.target.value;
                          updatePlanState(plan.id, { benefits: nextBenefits });
                        }} />
                        <button
                          type="button"
                          className="subscription-benefit-remove"
                          onClick={() => updatePlanState(plan.id, { benefits: plan.benefits.filter((_, benefitIndex) => benefitIndex !== index) })}
                          aria-label={`Remove benefit ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="subscription-benefit-add" onClick={() => updatePlanState(plan.id, { benefits: [...plan.benefits, 'New benefit'] })}>+ Add benefit</button>
                </div>
                <div className="subscription-benefits-editor">
                  <span>Entitlements</span>
                  <div className="subscription-benefits-list">
                    {plan.entitlements.length ? plan.entitlements.map((entitlement) => (
                      <div className="subscription-benefit-item" key={`${plan.id}-entitlement-${entitlement.key}`}>
                        <input type="text" value={entitlement.key} readOnly />
                      </div>
                    )) : <p className="payment-copy">No entitlements assigned.</p>}
                  </div>
                </div>
                <label className="subscription-checkbox">
                  <input type="checkbox" checked={plan.active} onChange={(event) => updatePlanState(plan.id, { active: event.target.checked })} />
                  <span>Active</span>
                </label>
                <label className="subscription-checkbox">
                  <input type="checkbox" checked={plan.public} onChange={(event) => updatePlanState(plan.id, { public: event.target.checked })} />
                  <span>Public</span>
                </label>
                <button type="button" className="subscription-action-button" onClick={() => void handleSavePlan(plan)} disabled={savingPlanId === plan.id}>
                  {savingPlanId === plan.id ? 'Saving…' : 'Save plan'}
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="admin-panel subscription-panel">
        <div className="subscription-heading">
          <div>
            <span><FaUsers /> Subscriber directory</span>
            <h2>Real subscriptions</h2>
          </div>
        </div>

        <div className="payment-filter-toolbar" style={{ marginBottom: '1rem' }}>
          <label className="payment-filter-search">
            <span>Search</span>
            <div>
              <FaEye aria-hidden="true" />
              <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Name or email" />
            </div>
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as AdminSubscription['status'] | '' }))}>
              <option value="">All</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>
          <label>
            <span>Plan</span>
            <select value={filters.plan} onChange={(event) => setFilters((current) => ({ ...current, plan: event.target.value }))}>
              <option value="">All</option>
              {plans.map((plan) => <option key={plan.id} value={plan.key}>{plan.name}</option>)}
            </select>
          </label>
          <label>
            <span>Currency</span>
            <input value={filters.currency} maxLength={3} onChange={(event) => setFilters((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} placeholder="NGN" />
          </label>
          <label>
            <span>From</span>
            <input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
          </label>
          <div className="payment-filter-actions">
            <button type="button" className="payment-heading-action" onClick={() => setFilters({ status: '', plan: '', currency: '', from: '', to: '', search: '' })}>Reset</button>
          </div>
        </div>

        {subsLoading && !subscriptions.length ? <AdminPageSkeleton rows={4} statCards={0} showToolbar={false} /> : null}
        {!subsLoading && !subsError && !subscriptions.length ? <p className="payment-copy payment-empty">No subscriptions yet.</p> : null}
        {subsError ? <p className="payment-copy payment-copy--error" role="alert">{subsError}</p> : null}

        {!subsLoading && !subsError && subscriptions.length ? (
          <div className="subscription-list">
            {subscriptions.map((subscription) => (
              <article className="subscription-row" key={subscription.id}>
                <div>
                  <strong>{subscription.seeker.name}</strong>
                  <p>{subscription.seeker.email}</p>
                </div>
                <div>
                  <strong>{subscription.plan.name}</strong>
                  <p>{subscription.status}</p>
                </div>
                <div>
                  <strong>{formatDate(subscription.startDate)}</strong>
                  <p>Started</p>
                </div>
                <div>
                  <strong>{formatDate(subscription.endDate)}</strong>
                  <p>Expires</p>
                </div>
                <div>
                  <strong>{formatMoney(subscription.latestPayment?.amount ?? null, subscription.latestPayment?.currency ?? subscription.currencySnapshot)}</strong>
                  <p>{subscription.latestPayment ? label(subscription.latestPayment.status) : 'No payment'}</p>
                </div>
                <button type="button" className="subscription-action-button subscription-action-button--secondary" onClick={() => void openSubscriptionDetails(subscription.id)}>
                  View
                </button>
              </article>
            ))}
          </div>
        ) : null}

        {nextCursor ? (
          <div className="subscription-row-action">
            <button type="button" className="subscription-action-button" onClick={() => void fetchSubscriptions(true)} disabled={subsLoading}>
              {subsLoading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </section>

      {detail ? (
        <div className="payment-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
          <section className="payment-modal payment-details-modal" role="dialog" aria-modal="true" aria-labelledby="subscription-details-title">
            <div className="payment-modal__header">
              <span>Subscription details</span>
              <button type="button" className="payment-modal__close" onClick={() => setDetail(null)} aria-label="Close subscription details">×</button>
            </div>
            <h2 id="subscription-details-title">{detail.seeker.name}</h2>
            <div className="payment-details-grid">
              <div><span>User</span><strong>{detail.seeker.email}</strong></div>
              <div><span>Plan</span><strong>{detail.plan.name}</strong></div>
              <div><span>Status</span><strong>{detail.status}</strong></div>
              <div><span>Started</span><strong>{formatDate(detail.startDate)}</strong></div>
              <div><span>Expires</span><strong>{formatDate(detail.endDate)}</strong></div>
              <div><span>Next renewal</span><strong>{formatDate(detail.nextRenewalAt)}</strong></div>
              <div><span>Price snapshot</span><strong>{formatMoney(detail.priceSnapshot, detail.currencySnapshot)}</strong></div>
              <div><span>Cancellation</span><strong>{detail.cancellationReason ?? 'None'}</strong></div>
            </div>

            <h3>Payment history</h3>
            {detail.payments.length ? (
              <div className="payment-history-list">
                {detail.payments.map((payment: AdminSubscriptionDetail['payments'][number]) => (
                  <article className="payment-history-row" key={payment.id}>
                    <div><span className="payment-history-label">Amount</span><strong>{formatMoney(payment.amount, payment.currency)}</strong></div>
                    <div><span className="payment-history-label">Status</span><strong>{label(payment.status)}</strong></div>
                    <div><span className="payment-history-label">Provider</span><strong>{payment.provider}</strong></div>
                    <div><span className="payment-history-label">Reference</span><strong>{payment.providerReference}</strong></div>
                    <div><span className="payment-history-label">Date</span><strong>{formatDate(payment.createdAt)}</strong></div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="payment-copy payment-empty">No subscription payments yet.</p>
            )}

            <h3>Lifecycle events</h3>
            {detail.events.length ? (
              <div className="payment-history-list">
                {detail.events.map((event: AdminSubscriptionDetail['events'][number]) => (
                  <article className="payment-history-row" key={event.id}>
                    <div><span className="payment-history-label">Type</span><strong>{label(event.eventType)}</strong></div>
                    <div><span className="payment-history-label">Occurred</span><strong>{formatDate(event.occurredAt)}</strong></div>
                    <div><span className="payment-history-label">Reference</span><strong>{event.providerReference ?? '—'}</strong></div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="payment-copy payment-empty">No lifecycle events recorded.</p>
            )}
          </section>
        </div>
      ) : null}

      {detailLoading ? <p className="payment-copy payment-copy--success" role="status">Loading subscription details…</p> : null}
    </div>
  );
}

export default AdminSubscriptionsPage;
