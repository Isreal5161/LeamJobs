import { useState } from 'react';
import { FaBriefcase, FaBuilding, FaChartLine, FaDollarSign, FaEye, FaUsers } from 'react-icons/fa';
import { useJobStore } from '../../context/JobStoreContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { adminEmployers, adminSeekers } from './adminData';

function AdminAnalyticsPage() {
  const { jobs } = useJobStore();
  const { subscriptions, plans } = useSubscriptions();
  const [companyQuery, setCompanyQuery] = useState('');
  const approvedJobs = jobs.filter((job) => job.status === 'Approved');
  const pendingJobs = jobs.filter((job) => job.status !== 'Approved');
  const totalViews = approvedJobs.reduce((total, job) => total + job.views, 0);
  const totalApplicants = approvedJobs.reduce((total, job) => total + job.applicants, 0);
  const employerIncome = adminEmployers.reduce((total, employer) => total + employer.monthlyIncome, 0);
  const subscriptionRevenue = subscriptions
    .filter((subscription) => subscription.status === 'Active')
    .reduce((total, subscription) => total + (plans.find((plan) => plan.id === subscription.planId)?.price ?? 0), 0);
  const totalRevenue = employerIncome + subscriptionRevenue;

  const revenueRows = [
    { label: 'Employer subscriptions', value: employerIncome, width: 78 },
    { label: 'Seeker subscriptions', value: subscriptionRevenue, width: 46 },
    { label: 'Featured marketplace jobs', value: jobs.filter((job) => job.featured).length * 120, width: 34 },
  ];
  const normalizedCompanyQuery = companyQuery.trim().toLowerCase();
  const filteredEmployers = adminEmployers.filter((employer) => {
    const employerJobs = jobs.filter((job) => job.company.toLowerCase().includes(employer.name.split(' ')[0].toLowerCase()));
    const searchableText = [
      employer.name,
      employer.email,
      employer.subscription,
      employer.status,
      ...employerJobs.flatMap((job) => [job.role, job.location, job.level, job.workType]),
    ].join(' ').toLowerCase();

    return !normalizedCompanyQuery || searchableText.includes(normalizedCompanyQuery);
  });

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Analytics</span>
          <h1>Marketplace analytics</h1>
          <p>Track seeker growth, employer activity, live job performance, subscription revenue, and marketplace health.</p>
        </div>
        <button className="admin-icon-button" type="button" aria-label="View analytics">
          <FaChartLine />
        </button>
      </section>

      <section className="admin-stat-grid" aria-label="Marketplace analytics">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaUsers /></span>
          <div><strong>{adminSeekers.length}</strong><p>active seekers</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaBriefcase /></span>
          <div><strong>{approvedJobs.length}</strong><p>live jobs</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--purple"><FaEye /></span>
          <div><strong>{totalViews}</strong><p>job views</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaDollarSign /></span>
          <div><strong>${totalRevenue}</strong><p>tracked revenue</p></div>
        </article>
      </section>

      <section className="admin-analytics-workspace">
        <article className="admin-panel admin-insight-card admin-insight-card--primary">
          <div className="admin-section-heading">
            <div>
              <span><FaChartLine /> Marketplace health</span>
              <h2>Performance snapshot</h2>
            </div>
          </div>
          <div className="admin-insight-score">
            <strong>{totalApplicants}</strong>
            <span>applicants across approved jobs</span>
          </div>
          <p>{pendingJobs.length} job posts still need admin attention before becoming visible to seekers.</p>
        </article>

        <article className="admin-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaDollarSign /> Revenue sources</span>
              <h2>Income by channel</h2>
            </div>
          </div>
          <div className="admin-bars">
            {revenueRows.map((row) => (
              <span key={row.label}>
                <strong>{row.label} / ${row.value}</strong>
                <i style={{ width: `${row.width}%` }} />
              </span>
            ))}
          </div>
        </article>

        <section className="admin-panel admin-company-directory">
          <div className="admin-section-heading">
            <div>
              <span><FaBuilding /> Employer activity</span>
              <h2>Companies by subscription and jobs</h2>
            </div>
          </div>
          <label className="admin-company-search" aria-label="Search companies">
            <span>Search employers</span>
            <input
              type="search"
              value={companyQuery}
              onChange={(event) => setCompanyQuery(event.target.value)}
              placeholder="Search company, email, plan, status, or job"
            />
          </label>
          <div className="admin-company-list">
            {filteredEmployers.map((employer) => {
              const employerJobs = jobs.filter((job) => job.company.toLowerCase().includes(employer.name.split(' ')[0].toLowerCase()));
              return (
                <article className="admin-company-card admin-company-card--static" key={employer.id}>
                  <div className="admin-company-card__identity">
                    <div className="admin-job-company-mark">{employer.name.slice(0, 1)}</div>
                    <div><h3>{employer.name}</h3><p>{employer.email}</p><small>{employer.subscription} plan / ${employer.monthlyIncome} monthly income</small></div>
                  </div>
                  <span className={`admin-status admin-status--${employer.status.toLowerCase()}`}>{employer.status}</span>
                  <div className="admin-company-card__stats">
                    <div><strong>{employerJobs.length}</strong><span>Live records</span></div>
                    <div><strong>{employer.postedJobs}</strong><span>Posted</span></div>
                    <div><strong>{employerJobs.reduce((total, job) => total + job.views, 0)}</strong><span>Views</span></div>
                    <div><strong>{employer.monthlyIncome}</strong><span>Income</span></div>
                  </div>
                </article>
              );
            })}
            {!filteredEmployers.length ? <p className="admin-empty-state">No companies match your search.</p> : null}
          </div>
        </section>
      </section>
    </div>
  );
}

export default AdminAnalyticsPage;
