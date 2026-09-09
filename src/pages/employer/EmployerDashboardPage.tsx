import { useEffect, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { getEmployerDashboard, type EmployerDashboardData } from '../../services/api';

const pipelineItems = [
  { key: 'applied', label: 'New' },
  { key: 'reviewing', label: 'Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'accepted', label: 'Accepted' },
] as const;

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(value));

function EmployerDashboardPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<EmployerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;

    let isActive = true;
    setIsLoading(true);
    setError('');

    const loadDashboard = async () => {
      const result = await getEmployerDashboard(token);

      if (!isActive) return;

      if (!result.ok) {
        setError(result.error.message || 'Unable to load your dashboard.');
        setIsLoading(false);
        return;
      }

      setDashboard(result.data.data);
      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [reloadKey, token]);

  if (isLoading) {
    return <div className="employer-page employer-empty-state" role="status">Loading your hiring dashboard...</div>;
  }

  if (error || !dashboard) {
    return (
      <div className="employer-page employer-empty-state" role="alert">
        <strong>Dashboard unavailable</strong>
        <p>{error || 'We could not load your dashboard data.'}</p>
        <button className="employer-button employer-button--ghost" type="button" onClick={() => setReloadKey((value) => value + 1)}>
          Try again
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Open roles', value: String(dashboard.stats.openRoles), icon: <FaBriefcase />, tone: 'blue' },
    { label: 'New applicants', value: String(dashboard.stats.newApplicants), icon: <FaUsers />, tone: 'green' },
    { label: 'Interviews', value: String(dashboard.stats.interviews), icon: <FaClipboardCheck />, tone: 'yellow' },
    { label: 'Avg. match score', value: dashboard.stats.averageMatchScore === null ? '—' : `${dashboard.stats.averageMatchScore}%`, icon: <FaStar />, tone: 'purple' },
  ];
  const pipelineMaximum = Math.max(...pipelineItems.map(({ key }) => dashboard.pipeline[key]), 1);

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
              {dashboard.recentJobs.map((job) => (
                <article className="employer-job-row" key={job.id}>
                  <span className="employer-job-row__mark">{job.title.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.location} / {job.jobType} / {job.status}</p>
                  </div>
                  <div className="employer-job-row__metrics">
                    <strong>{job.applicantCount}</strong>
                    <span>Applicants</span>
                  </div>
                  <Link to="/employer/jobs" className="employer-row-action" aria-label={`View ${job.title}`}>
                    <FaEdit />
                  </Link>
                </article>
              ))}
              {dashboard.recentJobs.length === 0 ? (
                <div className="employer-empty-state">
                  <strong>No job posts yet</strong>
                  <p>Your active and pending job posts will appear here.</p>
                </div>
              ) : null}
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
            {pipelineItems.map(({ key, label }) => {
              const value = dashboard.pipeline[key];

              return (
                <div className="employer-pipeline-item" key={key}>
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <span className="employer-pipeline-bar"><i style={{ width: `${(value / pipelineMaximum) * 100}%` }} /></span>
                </div>
              );
            })}
          </aside>
        </section>

        <section className="employer-panel">
          <div className="employer-section-heading">
            <div>
              <h2>Recent applicants</h2>
              <p>Latest applications across your job posts.</p>
            </div>
            <Link to="/employer/applicants">
              Review all
              <FaChevronRight />
            </Link>
          </div>

          <div className="employer-applicant-strip">
            {dashboard.recentApplications.map((application) => (
              <article className="employer-applicant-mini" key={application.id}>
                <ApplicantAvatar name={application.seekerName} size="sm" />
                <div>
                  <h3>{application.seekerName}</h3>
                  <p>{application.jobTitle} / {formatDate(application.appliedAt)}</p>
                </div>
                <strong>{application.status}</strong>
                <Link to="/employer/applicants" aria-label={`View ${application.seekerName}`}>
                  <FaEye />
                </Link>
              </article>
            ))}
            {dashboard.recentApplications.length === 0 ? (
              <div className="employer-empty-state">
                <strong>No applications yet</strong>
                <p>Applications for your job posts will appear here.</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export default EmployerDashboardPage;
