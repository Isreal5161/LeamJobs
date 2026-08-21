import { FaBuilding, FaChartLine, FaDollarSign, FaUsers } from 'react-icons/fa';
import { adminEmployers, adminJobs, adminSeekers } from './adminData';

function AdminAnalyticsPage() {
  const employerIncome = adminEmployers.reduce((total, employer) => total + employer.monthlyIncome, 0);
  const jobIncome = adminJobs.reduce((total, job) => total + job.income, 0);

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <span className="admin-kicker">Analytics</span>
        <h1>Marketplace analytics and subscriptions</h1>
        <p>Monitor seeker growth, employer activity, job post income, employer subscriptions, and platform revenue.</p>
      </section>

      <section className="admin-stat-grid">
        <article className="admin-stat-card admin-stat-card--command">
          <span><FaUsers /></span>
          <div><strong>{adminSeekers.length}</strong><p>active seekers</p></div>
        </article>
        <article className="admin-stat-card admin-stat-card--command">
          <span><FaBuilding /></span>
          <div><strong>{adminEmployers.length}</strong><p>employers</p></div>
        </article>
        <article className="admin-stat-card admin-stat-card--command">
          <span><FaDollarSign /></span>
          <div><strong>${employerIncome + jobIncome}</strong><p>tracked income</p></div>
        </article>
        <article className="admin-stat-card admin-stat-card--command">
          <span><FaChartLine /></span>
          <div><strong>{adminEmployers.filter((employer) => employer.subscription !== 'Free').length}</strong><p>paid subscriptions</p></div>
        </article>
      </section>

      <section className="admin-console-grid">
        <div className="admin-console-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaDollarSign /> Employer subscriptions</span>
              <h2>Plans and monthly income</h2>
            </div>
          </div>
          <div className="admin-management-table">
            {adminEmployers.map((employer) => (
              <article className="admin-management-row" key={employer.id}>
                <div>
                  <strong>{employer.name}</strong>
                  <p>{employer.subscription} plan / {employer.postedJobs} posted jobs</p>
                </div>
                <span>${employer.monthlyIncome}/mo</span>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-console-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaChartLine /> Income sources</span>
              <h2>Seeker and employer revenue</h2>
            </div>
          </div>
          <div className="admin-bars">
            <span><strong>Employer subscriptions</strong><i style={{ width: '78%' }} /></span>
            <span><strong>Job boost income</strong><i style={{ width: '52%' }} /></span>
            <span><strong>Seeker services</strong><i style={{ width: '28%' }} /></span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminAnalyticsPage;
