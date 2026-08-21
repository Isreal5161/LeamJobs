import { Link } from 'react-router-dom';
import { FaBriefcase, FaChartLine, FaDollarSign, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { adminEmployers, adminJobs, adminSeekers } from './adminData';

function AdminOverviewPage() {
  const pendingJobs = adminJobs.filter((job) => job.status === 'Pending').length;
  const monthlyIncome = adminEmployers.reduce((total, employer) => total + employer.monthlyIncome, 0);

  return (
    <div className="admin-page">
      <section className="admin-command-hero">
        <div>
          <span className="admin-kicker">Control room</span>
          <h1>Website administration</h1>
          <p>Monitor the marketplace, moderate new activity, and manage the content that seekers and employers see.</p>
        </div>
        <Link className="admin-command-hero__action" to="/admin/moderation">Review queue</Link>
      </section>

      <section className="admin-stat-grid" aria-label="Admin overview">
        {[
          { icon: <FaBriefcase />, value: adminJobs.length, label: 'jobs posted' },
          { icon: <FaShieldAlt />, value: pendingJobs, label: 'waiting approval' },
          { icon: <FaUsers />, value: adminSeekers.length + adminEmployers.length, label: 'accounts tracked' },
          { icon: <FaDollarSign />, value: `$${monthlyIncome}`, label: 'monthly employer income' },
        ].map((item) => (
          <article className="admin-stat-card admin-stat-card--command" key={item.label}>
            <span>{item.icon}</span>
            <div>
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-console-grid">
        <article className="admin-console-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaChartLine /> Activity snapshot</span>
              <h2>Today’s admin priorities</h2>
            </div>
          </div>
          <div className="admin-priority-list">
            <Link to="/admin/jobs">Approve new uploaded jobs</Link>
            <Link to="/admin/content">Update welcome and company page content</Link>
            <Link to="/admin/seekers">Review seeker applications and account numbers</Link>
            <Link to="/admin/analytics">Check income, subscriptions, seekers, and employers</Link>
          </div>
        </article>

        <article className="admin-console-panel admin-console-panel--dark">
          <span>System status</span>
          <strong>Marketplace stable</strong>
          <p>All public pages, employer tools, and seeker flows are available for review.</p>
        </article>
      </section>
    </div>
  );
}

export default AdminOverviewPage;
