import { useEffect, useState } from 'react';
import { FaBriefcase, FaChartLine, FaCheckCircle, FaClipboardList, FaDollarSign, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminAnalytics, type AdminAnalytics } from '../../services/api';

type Preset = '7d' | '30d' | '90d' | '12m';

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const rangeFor = (preset: Preset) => {
  const to = new Date();
  const from = new Date(to);
  if (preset === '12m') from.setUTCMonth(from.getUTCMonth() - 12);
  else from.setUTCDate(from.getUTCDate() - Number(preset.replace('d', '')) + 1);
  to.setUTCDate(to.getUTCDate() + 1);
  return { from: isoDate(from), to: isoDate(to), granularity: preset === '90d' ? 'week' as const : preset === '12m' ? 'month' as const : 'day' as const };
};

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const formatDecimal = (value: string) => {
  const [integerPart, fractionPart] = value.split('.');
  const sign = integerPart.startsWith('-') ? '-' : '';
  const unsignedInteger = sign ? integerPart.slice(1) : integerPart;
  const groupedInteger = unsignedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${groupedInteger}${fractionPart ? `.${fractionPart}` : ''}`;
};
const formatMoney = (rows: { currency: string; amount: string }[]) => rows.length ? rows.map((row) => `${row.currency} ${formatDecimal(row.amount)}`).join(' / ') : 'No records';

function Breakdown({ title, rows, keyName, scope }: { title: string; rows: { [key: string]: string | number }[]; keyName: string; scope: 'all-time' | 'selected period' }) {
  return <section className="admin-panel admin-analytics-breakdown"><div className="admin-section-heading"><div><span><FaChartLine /> {title}</span><h2>{scope}</h2></div></div>{rows.length ? <div className="admin-analytics-breakdown__rows">{rows.map((row) => <div key={String(row[keyName])}><strong>{label(String(row[keyName]))}</strong><b>{row.count}</b></div>)}</div> : <p className="admin-analytics-message">No {scope} records.</p>}</section>;
}

function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [preset, setPreset] = useState<Preset>('30d');
  const [range, setRange] = useState(() => rangeFor('30d'));
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    setIsLoading(true);
    setError('');
    void getAdminAnalytics(token, range).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setAnalytics(null);
        setError(result.error.message || 'We could not load analytics.');
      } else setAnalytics(result.data.data);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [token, range]);

  const selectPreset = (next: Preset) => { setPreset(next); setRange(rangeFor(next)); };
  const summary = analytics?.summary;
  const trends = analytics?.trends;
  const maxTrend = trends ? Math.max(...Object.values(trends).flat().map((point) => point.count), 1) : 1;
  const cards: { title: string; value: number; icon: typeof FaUsers }[] = summary ? [
    { title: 'Total users', value: summary.totalUsers, icon: FaUsers }, { title: 'Seekers', value: summary.totalSeekers, icon: FaUsers }, { title: 'Employers', value: summary.totalEmployers, icon: FaUsers }, { title: 'Active users', value: summary.activeUsers, icon: FaCheckCircle },
    { title: 'Total jobs', value: summary.totalJobs, icon: FaBriefcase }, { title: 'Approved jobs', value: summary.approvedJobs, icon: FaCheckCircle }, { title: 'Applications', value: summary.totalApplications, icon: FaClipboardList }, { title: 'Contracts', value: summary.totalContracts, icon: FaClipboardList },
  ] : [];

  return <div className="admin-page admin-analytics-real-page">
    <section className="admin-hero"><div><span className="admin-eyebrow"><FaChartLine /> Analytics</span><h1>Marketplace analytics</h1><p>Real database metrics for users, jobs, applications, contracts, and financial activity.</p></div></section>
    <section className="admin-panel admin-analytics-controls" aria-label="Analytics date range"><span>Date range</span>{(['7d', '30d', '90d', '12m'] as Preset[]).map((item) => <button key={item} type="button" className={preset === item ? 'admin-analytics-control--active' : ''} onClick={() => selectPreset(item)}>{item === '12m' ? 'Last 12 months' : `Last ${item.replace('d', ' days')}`}</button>)}</section>
    {isLoading ? <section className="admin-panel admin-analytics-message">Loading analytics...</section> : null}
    {!isLoading && error ? <section className="admin-panel admin-analytics-message admin-analytics-message--error">{error}</section> : null}
    {!isLoading && !error && analytics ? <>
      <section className="admin-stat-grid admin-analytics-summary">{cards.map(({ title, value, icon: Icon }) => <article className="admin-stat-card" key={title}><span className="admin-stat-card__icon"><Icon /></span><div><strong>{value}</strong><p>{title} / all-time</p></div></article>)}</section>
      <section className="admin-panel admin-analytics-trends"><div className="admin-section-heading"><div><span><FaChartLine /> Created records</span><h2>{label(analytics.dateRange.granularity)} trends</h2></div></div><div className="admin-analytics-trend-grid">{(['users', 'jobs', 'applications', 'contracts'] as const).map((key) => <div className="admin-analytics-trend" key={key}><strong>{label(key)}</strong>{trends?.[key].length ? <div className="admin-analytics-bars">{trends[key].map((point) => <div className="admin-analytics-bar" key={point.date} title={`${point.date}: ${point.count}`}><span style={{ height: `${Math.max((point.count / maxTrend) * 100, 4)}%` }} /><small>{point.date.slice(5)}</small></div>)}</div> : <p className="admin-analytics-message">No trend records.</p>}</div>)}</div></section>
      <section className="admin-analytics-breakdown-grid"><Breakdown title="Jobs by status" rows={analytics.breakdowns.jobsByStatus} keyName="status" scope="all-time" /><Breakdown title="Applications by status" rows={analytics.breakdowns.applicationsByStatus} keyName="status" scope="all-time" /><Breakdown title="Contracts by status" rows={analytics.breakdowns.contractsByStatus} keyName="status" scope="all-time" /><Breakdown title="Contracts by type" rows={analytics.breakdowns.contractsByType} keyName="type" scope="all-time" /><Breakdown title="Payments by status" rows={analytics.breakdowns.paymentsByStatus} keyName="status" scope="selected period" /><Breakdown title="Payments by type" rows={analytics.breakdowns.paymentsByType} keyName="paymentType" scope="selected period" /><Breakdown title="Subscriptions by status" rows={analytics.breakdowns.subscriptionsByStatus} keyName="status" scope="selected period" /></section>
      <section className="admin-panel admin-analytics-financial"><div className="admin-section-heading"><div><span><FaDollarSign /> Financial activity</span><h2>Authoritative currency-separated totals</h2></div></div><div className="admin-analytics-financial-grid"><div><strong>Successful payments</strong><span>{formatMoney(analytics.financial.successfulPayments)}</span></div><div><strong>Funded escrow</strong><span>{formatMoney(analytics.financial.fundedEscrow)}</span></div><div><strong>Released escrow</strong><span>{formatMoney(analytics.financial.releasedEscrow)}</span></div><div><strong>Platform fees</strong><span>{formatMoney(analytics.financial.platformFees)}</span></div></div></section>
    </> : null}
  </div>;
}

export default AdminAnalyticsPage;
