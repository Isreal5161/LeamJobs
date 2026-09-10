import { useEffect, useState } from 'react';
import {
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEye,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminJobs, type AdminJob } from '../../services/api';

const normalizeList = (value: string[] | Record<string, unknown> | null | undefined) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, entry]) => {
      if (typeof entry === 'string') {
        return entry;
      }

      return `${key}: ${JSON.stringify(entry)}`;
    });
  }

  return [];
};

const formatDate = (value: string | null) => {
  if (!value) {
    return 'No deadline';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const formatCompensation = (job: AdminJob) => {
  if (!job.compensation) {
    return 'Compensation not provided';
  }

  if (job.compensation.type === 'MONTHLY') {
    return `${job.compensation.currency} ${job.compensation.salaryMin ?? '—'} - ${job.compensation.salaryMax ?? '—'} / ${job.compensation.salaryPeriod}`;
  }

  if (job.compensation.type === 'CONTRACT') {
    return `${job.compensation.currency} ${job.compensation.amount} (${job.compensation.duration ?? 'contract'})`;
  }

  return `${job.compensation.currency} ${job.compensation.projectAmount}`;
};

function AdminJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setJobs([]);
      setSelectedJobId('');
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadJobs = async () => {
      setIsLoading(true);
      setError('');
      const result = await getAdminJobs(token);

      if (!active) {
        return;
      }

      if (!result.ok) {
        setError(result.error.message || 'We could not load approved jobs.');
        setIsLoading(false);
        return;
      }

      const approvedJobs = result.data.data.jobs.filter((job) => job.status === 'APPROVED');
      setJobs(approvedJobs);
      setSelectedJobId((current) => current || approvedJobs[0]?.id || '');
      setIsLoading(false);
    };

    void loadJobs();

    return () => {
      active = false;
    };
  }, [token]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null;

  if (isLoading) {
    return (
      <div className="admin-page" aria-live="polite" aria-label="Loading approved jobs">
        <section className="admin-hero">
          <div>
            <span className="admin-eyebrow">Job control</span>
            <h1>Posted and approved jobs</h1>
            <p>Review every live job currently approved by the moderation team.</p>
          </div>
        </section>

        <section className="admin-stat-grid" aria-hidden="true">
          {[1, 2, 3, 4].map((item) => (
            <article className="admin-stat-card" key={item}>
              <span className="admin-stat-card__icon leamjobs-skeleton-block" style={{ width: '42px', height: '42px', borderRadius: '12px' }} />
              <div>
                <span className="leamjobs-skeleton-line" style={{ width: '2.5rem', height: '1.2rem' }} />
                <span className="leamjobs-skeleton-line" style={{ width: '4.5rem', height: '0.85rem', marginTop: '0.4rem' }} />
              </div>
            </article>
          ))}
        </section>

        <section className="admin-posted-jobs-workspace">
          <div className="admin-panel admin-review-list-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaBriefcase /> Posted jobs</span>
                <h2>Jobs already approved by admin</h2>
              </div>
            </div>

            <div className="admin-review-list admin-review-list--rows" aria-hidden="true">
              {[1, 2, 3].map((item) => (
                <div className="admin-review-item admin-review-job-card" key={item}>
                  <span className="admin-job-company-mark leamjobs-skeleton-block" style={{ width: '42px', height: '42px', borderRadius: '14px' }} />
                  <div className="admin-review-job-card__content">
                    <span className="leamjobs-skeleton-line" style={{ width: '72%', height: '1rem' }} />
                    <span className="leamjobs-skeleton-line" style={{ width: '55%', height: '0.8rem', marginTop: '0.5rem' }} />
                    <span className="leamjobs-skeleton-line" style={{ width: '70%', height: '0.75rem', marginTop: '0.45rem' }} />
                  </div>
                  <div className="admin-review-job-card__meta">
                    <span className="leamjobs-skeleton-line" style={{ width: '128px', height: '0.78rem' }} />
                    <span className="leamjobs-skeleton-line" style={{ width: '88px', height: '0.78rem' }} />
                  </div>
                  <span className="leamjobs-skeleton-line" style={{ width: '70px', height: '22px', borderRadius: '999px' }} />
                </div>
              ))}
            </div>
          </div>

          <article className="admin-panel admin-review-detail" aria-hidden="true">
            <div className="admin-review-detail__header">
              <div>
                <span className="admin-review-kicker"><FaEye /> Live job details</span>
                <span className="leamjobs-skeleton-line" style={{ width: '58%', height: '1.5rem', marginTop: '0.75rem' }} />
                <span className="leamjobs-skeleton-line" style={{ width: '38%', height: '0.85rem', marginTop: '0.5rem' }} />
              </div>
            </div>
            <div className="admin-review-facts">
              {[1, 2, 3, 4].map((item) => (
                <span key={item} className="leamjobs-skeleton-line" style={{ width: '120px', height: '1rem' }} />
              ))}
            </div>
            <section className="admin-review-section">
              <span className="leamjobs-skeleton-line" style={{ width: '30%', height: '1rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '70px', marginTop: '0.7rem' }} />
            </section>
            <section className="admin-review-section">
              <span className="leamjobs-skeleton-line" style={{ width: '25%', height: '1rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '80px', marginTop: '0.7rem' }} />
            </section>
          </article>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page admin-empty-state" role="alert">
        <strong>Approved jobs unavailable</strong>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Job control</span>
          <h1>Posted and approved jobs</h1>
          <p>Review every live job currently approved by the moderation team.</p>
        </div>
      </section>

      <section className="admin-stat-grid" aria-label="Posted job summary">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaBriefcase /></span>
          <div><strong>{jobs.length}</strong><p>live jobs</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaCheckCircle /></span>
          <div><strong>{jobs.reduce((count, job) => count + job.applicantCount, 0)}</strong><p>applicants</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--purple"><FaEye /></span>
          <div><strong>{jobs.reduce((total, job) => total + (job.reviewedById ? 1 : 0), 0)}</strong><p>reviewed</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaClock /></span>
          <div><strong>{jobs.filter((job) => job.applicationDeadline).length}</strong><p>with deadlines</p></div>
        </article>
      </section>

      <section className="admin-posted-jobs-workspace">
        <div className="admin-panel admin-review-list-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaBriefcase /> Posted jobs</span>
              <h2>Jobs already approved by admin</h2>
            </div>
          </div>

          <div className="admin-review-list admin-review-list--rows">
            {jobs.length === 0 ? (
              <div className="admin-empty-state">No approved jobs are available yet.</div>
            ) : (
              jobs.map((job) => (
                <button
                  className={`admin-review-item admin-review-job-card ${selectedJob?.id === job.id ? 'admin-review-item--active' : ''}`}
                  type="button"
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <span className="admin-job-company-mark" data-color="brand-logo--default">
                    {job.company?.name?.slice(0, 2).toUpperCase() || 'JD'}
                  </span>
                  <div className="admin-review-job-card__content">
                    <strong>{job.title}</strong>
                    <p>{job.company?.name || 'Unknown employer'} / {job.location}</p>
                    <small>{job.department || 'General'} / {job.jobType} / Published {formatDate(job.createdAt)}</small>
                  </div>
                  <div className="admin-review-job-card__meta">
                    <span>{formatCompensation(job)}</span>
                    <span>{job.applicantCount} applicants</span>
                  </div>
                  <span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{job.status}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedJob ? (
          <article className="admin-panel admin-review-detail">
            <div className="admin-review-detail__header">
              <div>
                <span className="admin-review-kicker"><FaEye /> Live job details</span>
                <h2>{selectedJob.title}</h2>
                <p>{selectedJob.company?.name || 'Unknown employer'} is currently live on the platform.</p>
              </div>
              <span className={`admin-status admin-status--${selectedJob.status.toLowerCase()}`}>{selectedJob.status}</span>
            </div>

            <div className="admin-review-facts">
              <span><FaBuilding /> {selectedJob.company?.name || 'Unknown employer'}</span>
              <span><FaMapMarkerAlt /> {selectedJob.location}</span>
              <span><FaDollarSign /> {formatCompensation(selectedJob)}</span>
              <span><FaClock /> Deadline {formatDate(selectedJob.applicationDeadline)}</span>
            </div>

            <section className="admin-review-section">
              <h3>Job overview</h3>
              <p>{selectedJob.description}</p>
            </section>

            <section className="admin-review-section">
              <h3>Responsibilities</h3>
              <ul>
                {normalizeList(selectedJob.responsibilities).length ? normalizeList(selectedJob.responsibilities).map((item) => <li key={item}>{item}</li>) : <li>No responsibilities listed.</li>}
              </ul>
            </section>

            <section className="admin-review-section">
              <h3>Requirements</h3>
              <ul>
                {normalizeList(selectedJob.requirements).length ? normalizeList(selectedJob.requirements).map((item) => <li key={item}>{item}</li>) : <li>No requirements listed.</li>}
              </ul>
            </section>

            <section className="admin-review-section">
              <h3>Skills</h3>
              <ul>
                {selectedJob.skills.length ? selectedJob.skills.map((skill) => <li key={skill}>{skill}</li>) : <li>No skills listed.</li>}
              </ul>
            </section>

            <section className="admin-review-section">
              <h3>About company</h3>
              <p>{selectedJob.company?.description || 'No company description provided.'}</p>
            </section>

            <div className="admin-review-performance">
              <div><strong>{selectedJob.applicantCount}</strong><span>Applicants</span></div>
              <div><strong>{selectedJob.reviewedById ? 'Reviewed' : 'Pending'}</strong><span>Review state</span></div>
              <div><strong>{selectedJob.reviewedAt ? formatDate(selectedJob.reviewedAt) : 'Not reviewed'}</strong><span>Reviewed on</span></div>
              <div><strong>{selectedJob.company?.location || 'N/A'}</strong><span>Company location</span></div>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}

export default AdminJobsPage;
