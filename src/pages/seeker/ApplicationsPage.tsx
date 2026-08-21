import { Link } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaDownload,
  FaExternalLinkAlt,
  FaFileAlt,
  FaGoogle,
  FaMicrosoft,
  FaSearch,
  FaTimesCircle,
} from 'react-icons/fa';

const applicationStats = [
  { label: 'Total applications', value: '18', icon: <FaFileAlt />, tone: 'blue' },
  { label: 'Approved', value: '7', icon: <FaCheckCircle />, tone: 'success' },
  { label: 'Pending review', value: '8', icon: <FaClock />, tone: 'warning' },
  { label: 'Rejected', value: '3', icon: <FaTimesCircle />, tone: 'danger' },
];

const applications = [
  {
    id: 'google',
    company: 'Google',
    role: 'Senior Product Designer',
    type: 'Remote',
    applied: 'Applied Aug 12, 2026',
    status: 'Approved',
    nextStep: 'Interview scheduled',
    amount: '$4,800',
    icon: <FaGoogle />,
    tone: 'google',
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    role: 'UX Designer',
    type: 'Hybrid',
    applied: 'Applied Aug 10, 2026',
    status: 'Pending',
    nextStep: 'Recruiter review',
    amount: '$3,200',
    icon: <FaMicrosoft />,
    tone: 'microsoft',
  },
  {
    id: 'stripe',
    company: 'Stripe',
    role: 'Product Designer',
    type: 'Contract',
    applied: 'Applied Aug 6, 2026',
    status: 'Rejected',
    nextStep: 'Feedback available',
    amount: '$0',
    icon: 'S',
    tone: 'stripe',
  },
  {
    id: 'figma',
    company: 'Figma',
    role: 'Design Systems Designer',
    type: 'Remote',
    applied: 'Applied Aug 2, 2026',
    status: 'Completed',
    nextStep: 'Payment released',
    amount: '$6,500',
    icon: 'F',
    tone: 'figma',
  },
];

const completedJobs = [
  { label: 'Jobs completed', value: '5' },
  { label: 'Total income', value: '$18,450' },
  { label: 'This month', value: '$6,500' },
];

function ApplicationsPage() {
  return (
    <div className="seeker-applications-page">
      <section className="seeker-applications-hero">
        <div className="seeker-hero__top">
          <div className="seeker-profile">
            <div className="seeker-profile__avatar" aria-hidden="true">SJ</div>
            <div>
              <h1>Applications</h1>
              <p>Track progress, outcomes, and job income</p>
            </div>
          </div>
          <button className="seeker-icon-button seeker-icon-button--alert" type="button" aria-label="Notifications">
            <FaBell />
          </button>
        </div>

        <label className="seeker-search" aria-label="Search applications">
          <FaSearch />
          <input type="search" placeholder="Search company, role, or status" />
        </label>
      </section>

      <main className="seeker-applications-content">
        <section className="seeker-application-stats" aria-label="Application overview">
          {applicationStats.map((stat) => (
            <article className="seeker-application-stat" key={stat.label}>
              <span className={`seeker-application-stat__icon seeker-application-stat__icon--${stat.tone}`}>
                {stat.icon}
              </span>
              <div>
                <strong>{stat.value}</strong>
                <p>{stat.label}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="seeker-applications-grid">
          <div className="seeker-card seeker-application-list-card">
            <div className="seeker-section-heading">
              <h2>Recent applications</h2>
              <button type="button" className="seeker-applications-export">
                <FaDownload />
                Export
              </button>
            </div>

            <div className="seeker-application-tabs" aria-label="Application status filters">
              {['All', 'Approved', 'Pending', 'Rejected', 'Completed'].map((tab) => (
                <button className={tab === 'All' ? 'seeker-application-tab--active' : ''} type="button" key={tab}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="seeker-application-list">
              {applications.map((application) => (
                <article className="seeker-application-card" key={`${application.id}-${application.role}`}>
                  <div className={`seeker-application-card__logo seeker-application-card__logo--${application.tone}`}>
                    {application.icon}
                  </div>
                  <div className="seeker-application-card__content">
                    <div className="seeker-application-card__top">
                      <div>
                        <h3>{application.role}</h3>
                        <p>{application.company} · {application.type}</p>
                      </div>
                      <span className={`seeker-application-status seeker-application-status--${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="seeker-application-card__meta">
                      <span><FaCalendarAlt /> {application.applied}</span>
                      <span><FaBriefcase /> {application.nextStep}</span>
                      <span><FaDollarSign /> {application.amount}</span>
                    </div>
                  </div>
                  <Link to={`/seeker/jobs/${application.id}`} className="seeker-application-card__link" aria-label={`View ${application.role} details`}>
                    <FaExternalLinkAlt />
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="seeker-card seeker-income-card" aria-label="Completed jobs and income">
            <div className="seeker-income-card__heading">
              <span><FaDollarSign /></span>
              <div>
                <h2>Work summary</h2>
                <p>Completed jobs and released payments</p>
              </div>
            </div>
            <div className="seeker-income-metrics">
              {completedJobs.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="seeker-income-progress">
              <div>
                <span>Monthly goal</span>
                <strong>72%</strong>
              </div>
              <span className="seeker-income-progress__bar"><i /></span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default ApplicationsPage;
