import { Link } from 'react-router-dom';
import {
  FaBriefcase,
  FaChartLine,
  FaDollarSign,
  FaShieldHalved,
  FaUsers,
  FaCircleCheck,
  FaArrowRight,
  FaClock,
} from 'react-icons/fa6';
import { adminEmployers, adminJobs, adminSeekers } from './adminData';
import '../../styles/admin-overview.css';

function AdminOverviewPage() {
  const totalJobs = adminJobs.length;
  const pendingJobs = adminJobs.filter((job) => job.status === 'Pending').length;
  const approvedJobs = adminJobs.filter((job) => job.status === 'Approved').length;
  const totalAccounts = adminSeekers.length + adminEmployers.length;
  const seekerCount = adminSeekers.length;
  const employerCount = adminEmployers.length;
  const monthlyIncome = adminEmployers.reduce((total, employer) => total + employer.monthlyIncome, 0);
  const avgJobsPerEmployer = (totalJobs / employerCount).toFixed(1);

  const stats = [
    {
      id: 'jobs',
      icon: <FaBriefcase />,
      value: totalJobs,
      label: 'Total jobs posted',
      trend: '+12%',
      color: 'blue',
      link: '/admin/jobs',
    },
    {
      id: 'pending',
      icon: <FaClock />,
      value: pendingJobs,
      label: 'Pending approval',
      trend: `${pendingJobs} needs review`,
      color: 'orange',
      link: '/admin/jobs',
    },
    {
      id: 'users',
      icon: <FaUsers />,
      value: totalAccounts,
      label: 'Active accounts',
      subtext: `${seekerCount} seekers • ${employerCount} employers`,
      color: 'green',
      link: '/admin/seekers',
    },
    {
      id: 'income',
      icon: <FaDollarSign />,
      value: `$${monthlyIncome.toLocaleString()}`,
      label: 'Monthly revenue',
      trend: '+8% from last month',
      color: 'purple',
      link: '/admin/analytics',
    },
  ];

  const priorities = [
    { id: 1, icon: <FaBriefcase />, title: 'Approve pending jobs', description: `${pendingJobs} jobs waiting for review`, link: '/admin/jobs' },
    { id: 2, icon: <FaUsers />, title: 'Review user applications', description: 'Check seeker account requests', link: '/admin/seekers' },
    { id: 3, icon: <FaChartLine />, title: 'Check marketplace analytics', description: 'Monitor traffic and conversion', link: '/admin/analytics' },
      { id: 4, icon: <FaShieldHalved />, title: 'Moderate content', description: 'Review flagged posts and messages', link: '/admin/moderation' },
  ];

  return (
    <div className="admin-overview-page">
      {/* Hero Section */}
      <section className="admin-overview-hero">
        <div className="admin-overview-hero__content">
          <span className="admin-overview-kicker">Control room</span>
          <h1 className="admin-overview-title">Website administration</h1>
          <p className="admin-overview-description">Monitor the marketplace, manage content, and track platform analytics in real-time.</p>
        </div>
          <Link to="/admin/moderation" className="admin-overview-button admin-overview-button--primary">
            <FaShieldHalved /> Review queue
        </Link>
      </section>

      {/* Stats Grid */}
      <section className="admin-overview-stats" aria-label="Key metrics">
        <div className="admin-overview-stats__container">
          {stats.map((stat) => (
            <Link
              key={stat.id}
              to={stat.link}
              className={`admin-overview-stat-card admin-overview-stat-card--${stat.color}`}
            >
              <div className="admin-overview-stat-icon">{stat.icon}</div>
              <div className="admin-overview-stat-content">
                <div className="admin-overview-stat-header">
                  <span className="admin-overview-stat-value">{stat.value}</span>
                  {stat.trend && <span className="admin-overview-stat-trend">{stat.trend}</span>}
                </div>
                <p className="admin-overview-stat-label">{stat.label}</p>
                {stat.subtext && <p className="admin-overview-stat-subtext">{stat.subtext}</p>}
              </div>
              <FaArrowRight className="admin-overview-stat-arrow" />
            </Link>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <div className="admin-overview-main-grid">
        {/* Quick Actions / Priorities Section */}
        <section className="admin-overview-priorities">
          <div className="admin-overview-section-header">
            <h2>Today's priorities</h2>
            <span className="admin-overview-section-badge">4 tasks</span>
          </div>
          <div className="admin-overview-priorities-grid">
            {priorities.map((priority) => (
              <Link
                key={priority.id}
                to={priority.link}
                className="admin-overview-priority-item"
              >
                <div className="admin-overview-priority-icon">{priority.icon}</div>
                <div className="admin-overview-priority-content">
                  <h3>{priority.title}</h3>
                  <p>{priority.description}</p>
                </div>
                <FaArrowRight className="admin-overview-priority-arrow" />
              </Link>
            ))}
          </div>
        </section>

        {/* System Status */}
        <section className="admin-overview-status">
          <div className="admin-overview-section-header">
            <h2>System status</h2>
          </div>
          <div className="admin-overview-status-card admin-overview-status-card--healthy">
            <div className="admin-overview-status-indicator">
              <FaCircleCheck />
              <span>All systems operational</span>
            </div>
            <h3>Marketplace stable</h3>
            <p>All public pages, employer tools, and seeker flows are running smoothly and available for use.</p>
            <ul className="admin-overview-status-list">
              <li><FaCircleCheck /> Job posting service</li>
              <li><FaCircleCheck /> Payment processing</li>
              <li><FaCircleCheck /> Application system</li>
              <li><FaCircleCheck /> Search and discovery</li>
            </ul>
          </div>
        </section>
      </div>

      {/* Summary Stats */}
      <section className="admin-overview-summary">
        <div className="admin-overview-summary-grid">
          <div className="admin-overview-summary-card">
            <span className="admin-overview-summary-label">Avg jobs per employer</span>
            <strong className="admin-overview-summary-value">{avgJobsPerEmployer}</strong>
          </div>
          <div className="admin-overview-summary-card">
            <span className="admin-overview-summary-label">Jobs approved today</span>
            <strong className="admin-overview-summary-value">{approvedJobs}</strong>
          </div>
          <div className="admin-overview-summary-card">
            <span className="admin-overview-summary-label">Total employer subscriptions</span>
            <strong className="admin-overview-summary-value">{employerCount}</strong>
          </div>
          <div className="admin-overview-summary-card">
            <span className="admin-overview-summary-label">Active seekers</span>
            <strong className="admin-overview-summary-value">{seekerCount}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminOverviewPage;
