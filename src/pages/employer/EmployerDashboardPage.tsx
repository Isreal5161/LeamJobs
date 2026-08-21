import { Link } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaChartLine,
  FaChevronRight,
  FaClipboardCheck,
  FaEdit,
  FaEye,
  FaPlus,
  FaStar,
  FaUsers,
} from 'react-icons/fa';
import ApplicantAvatar from '../../components/employer/ApplicantAvatar';
import { applicants, employerJobs } from './employerData';

const stats = [
  { label: 'Open roles', value: '12', icon: <FaBriefcase />, tone: 'blue' },
  { label: 'New applicants', value: '84', icon: <FaUsers />, tone: 'green' },
  { label: 'Interviews', value: '18', icon: <FaClipboardCheck />, tone: 'yellow' },
  { label: 'Avg. match score', value: '88%', icon: <FaStar />, tone: 'purple' },
];

function EmployerDashboardPage() {
  return (
    <div className="employer-page">
      <section className="employer-hero">
        <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Employer workspace</span>
            <h1>Hiring command center</h1>
            <p>Post roles, review talent, and keep your pipeline moving.</p>
          </div>
          <div className="employer-hero__actions">
            <button className="employer-icon-button" type="button" aria-label="Notifications">
              <FaBell />
            </button>
            <Link className="employer-button employer-button--light" to="/employer/jobs">
              <FaPlus />
              Post Job
            </Link>
          </div>
        </div>
      </section>

      <main className="employer-content">
        <section className="employer-stat-grid" aria-label="Hiring overview">
          {stats.map((stat) => (
            <article className="employer-stat-card" key={stat.label}>
              <span className={`employer-stat-card__icon employer-stat-card__icon--${stat.tone}`}>{stat.icon}</span>
              <div>
                <strong>{stat.value}</strong>
                <p>{stat.label}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="employer-dashboard-grid">
          <div className="employer-panel">
            <div className="employer-section-heading">
              <div>
                <h2>Active job posts</h2>
                <p>Track roles that need attention today.</p>
              </div>
              <Link to="/employer/jobs">
                Manage
                <FaChevronRight />
              </Link>
            </div>

            <div className="employer-job-stack">
              {employerJobs.slice(0, 3).map((job) => (
                <article className="employer-job-row" key={job.id}>
                  <span className="employer-job-row__mark">{job.team.slice(0, 2)}</span>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.location} / {job.type} / {job.mode}</p>
                  </div>
                  <div className="employer-job-row__metrics">
                    <strong>{job.applicants}</strong>
                    <span>Applicants</span>
                  </div>
                  <Link to="/employer/jobs" className="employer-row-action" aria-label={`Edit ${job.title}`}>
                    <FaEdit />
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="employer-panel employer-pipeline-card">
            <div className="employer-section-heading">
              <div>
                <h2>Pipeline health</h2>
                <p>Current hiring funnel.</p>
              </div>
              <FaChartLine />
            </div>
            {[
              { label: 'New', value: 42 },
              { label: 'Review', value: 28 },
              { label: 'Interview', value: 18 },
              { label: 'Offer', value: 6 },
            ].map((item) => (
              <div className="employer-pipeline-item" key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <span className="employer-pipeline-bar"><i style={{ width: `${item.value * 2}%` }} /></span>
              </div>
            ))}
          </aside>
        </section>

        <section className="employer-panel">
          <div className="employer-section-heading">
            <div>
              <h2>Top applicants</h2>
              <p>Highest scoring profiles across open roles.</p>
            </div>
            <Link to="/employer/applicants">
              Review all
              <FaChevronRight />
            </Link>
          </div>

          <div className="employer-applicant-strip">
            {applicants.slice(0, 3).map((applicant) => (
              <article className="employer-applicant-mini" key={applicant.id}>
                <ApplicantAvatar name={applicant.name} imageUrl={applicant.avatarUrl} size="sm" />
                <div>
                  <h3>{applicant.name}</h3>
                  <p>{applicant.role}</p>
                </div>
                <strong>{applicant.score}%</strong>
                <Link to="/employer/applicants" aria-label={`View ${applicant.name}`}>
                  <FaEye />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default EmployerDashboardPage;
