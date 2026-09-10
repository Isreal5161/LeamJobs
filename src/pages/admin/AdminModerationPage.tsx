import { useEffect, useState } from 'react';
import {
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEye,
  FaFlag,
  FaMapMarkerAlt,
  FaTimesCircle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { approveAdminJob, getAdminJob, getAdminJobs, rejectAdminJob, type AdminJob } from '../../services/api';

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

function AdminModerationPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadPendingJobs = async (autoSelect = true) => {
    if (!token) {
      setJobs([]);
      setSelectedJobId('');
      setSelectedJob(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await getAdminJobs(token, 'PENDING');

    if (!result.ok) {
      setJobs([]);
      setSelectedJobId('');
      setSelectedJob(null);
      setError(result.error.message || 'We could not load jobs for moderation.');
      setIsLoading(false);
      return;
    }

    const nextJobs = result.data.data.jobs;
    setJobs(nextJobs);

    if (autoSelect) {
      const nextSelectedJobId = nextJobs.find((job) => job.id === selectedJobId)?.id || nextJobs[0]?.id || '';
      setSelectedJobId(nextSelectedJobId);
      setSelectedJob(null);
    } else {
      setSelectedJobId('');
      setSelectedJob(null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!token) {
      setJobs([]);
      setSelectedJobId('');
      setSelectedJob(null);
      setIsLoading(false);
      setIsLoadingDetail(false);
      setDetailError('');
      setError('');
      return;
    }

    void loadPendingJobs();
  }, [token]);

  const loadSelectedJob = async (jobId: string) => {
    if (!token) {
      return;
    }

    setIsLoadingDetail(true);
    setDetailError('');
    setSelectedJob(null);

    const result = await getAdminJob(jobId, token);

    if (!result.ok) {
      setDetailError(result.error.message || 'We could not load this job.');
      setIsLoadingDetail(false);
      return;
    }

    setSelectedJob(result.data.data.job);
    setDetailError('');
    setIsLoadingDetail(false);
  };

  useEffect(() => {
    if (!token || !selectedJobId) {
      setSelectedJob(null);
      setDetailError('');
      return;
    }

    let active = true;

    const runLoad = async () => {
      if (!active) {
        return;
      }

      await loadSelectedJob(selectedJobId);
    };

    void runLoad();

    return () => {
      active = false;
    };
  }, [selectedJobId, token]);

  const pendingJobs = jobs.filter((job) => job.status === 'PENDING');
  const approvedJobs = jobs.filter((job) => job.status === 'APPROVED');
  const rejectedJobs = jobs.filter((job) => job.status === 'REJECTED');

  const refreshJobs = async () => {
    await loadPendingJobs(false);
  };

  const submitDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!token || !selectedJob || isSubmitting) {
      return;
    }

    setActionError('');
    setSuccessMessage('');

    if (status === 'REJECTED') {
      const trimmedReason = rejectionReason.trim();
      if (!trimmedReason) {
        setActionError('A rejection reason is required before rejecting a job.');
        return;
      }
    }

    setIsSubmitting(true);

    const result = status === 'APPROVED'
      ? await approveAdminJob(selectedJob.id, token)
      : await rejectAdminJob(selectedJob.id, rejectionReason.trim(), token);

    setIsSubmitting(false);

    if (!result.ok) {
      setActionError(result.error.message || 'We could not update this job.');
      return;
    }

    setRejectionReason('');
    setSuccessMessage(status === 'APPROVED'
      ? 'Job approved successfully. The pending queue has been refreshed.'
      : 'Job rejected successfully. The pending queue has been refreshed.');
    setSelectedJobId('');
    setSelectedJob(null);
    await refreshJobs();
  };

  if (isLoading) {
    return <div className="admin-page admin-empty-state" role="status">Loading moderation queue...</div>;
  }

  if (error) {
    return (
      <div className="admin-page admin-empty-state" role="alert">
        <strong>Moderation queue unavailable</strong>
        <p>{error}</p>
        <button type="button" className="admin-review-action admin-review-action--approve" onClick={() => void loadPendingJobs()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Review queue</span>
          <h1>Employer job approvals</h1>
          <p>Review submitted jobs, confirm the posted details, and approve or reject them before they go live.</p>
        </div>
        <button className="admin-icon-button" type="button" aria-label="Open review filters">
          <FaFlag />
        </button>
      </section>

      <section className="admin-stat-grid" aria-label="Review summary">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaClock /></span>
          <div><strong>{pendingJobs.length}</strong><p>pending jobs</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaBriefcase /></span>
          <div><strong>{jobs.length}</strong><p>total submissions</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaCheckCircle /></span>
          <div><strong>{approvedJobs.length}</strong><p>approved posts</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--red"><FaFlag /></span>
          <div><strong>{rejectedJobs.length}</strong><p>rejected posts</p></div>
        </article>
      </section>

      {successMessage ? (
        <section className="admin-page" style={{ marginBottom: '1rem' }}>
          <p className="admin-feedback admin-feedback--success">{successMessage}</p>
        </section>
      ) : null}

      <section className="admin-moderation-workspace">
        <div className="admin-panel admin-review-list-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaBriefcase /> Job queue</span>
              <h2>Employer posts waiting for admin decision</h2>
            </div>
          </div>

          <div className="admin-review-list admin-review-list--rows">
            {pendingJobs.length === 0 ? (
              <div className="admin-empty-state">No pending jobs to review right now.</div>
            ) : (
              pendingJobs.map((job) => (
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
                    <small>{job.department || 'General'} / {job.jobType} / Submitted {formatDate(job.createdAt)}</small>
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

        {selectedJobId || isLoadingDetail || detailError ? (
          <article className="admin-panel admin-review-detail">
            {isLoadingDetail ? (
              <div className="admin-page admin-empty-state" role="status">Loading job details...</div>
            ) : detailError ? (
              <div className="admin-page admin-empty-state" role="alert">
                <strong>Job details unavailable</strong>
                <p>{detailError}</p>
                <button type="button" className="admin-review-action admin-review-action--approve" onClick={() => void loadSelectedJob(selectedJobId)}>
                  Retry
                </button>
              </div>
            ) : selectedJob ? (
              <>
                <div className="admin-review-detail__header">
                  <div>
                    <span className="admin-review-kicker"><FaEye /> Review details</span>
                    <h2>{selectedJob.title}</h2>
                    <p>{selectedJob.company?.name || 'Unknown employer'} submitted this role for marketplace review.</p>
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

                {selectedJob.rejectionReason ? (
                  <section className="admin-review-section">
                    <h3>Previous rejection reason</h3>
                    <p>{selectedJob.rejectionReason}</p>
                  </section>
                ) : null}

                <div className="admin-review-performance">
                  <div><strong>{selectedJob.applicantCount}</strong><span>Applicants</span></div>
                  <div><strong>{selectedJob.reviewedById ? 'Reviewed' : 'Pending'}</strong><span>Review state</span></div>
                  <div><strong>{selectedJob.reviewedAt ? formatDate(selectedJob.reviewedAt) : 'Not reviewed'}</strong><span>Reviewed on</span></div>
                  <div><strong>{selectedJob.company?.location || 'N/A'}</strong><span>Company location</span></div>
                </div>

                <div className="admin-review-decision-card">
                  <div>
                    <span><FaEye /> Final decision</span>
                    <strong>Approve this posting to make it public, or reject it with a reason for the employer.</strong>
                  </div>

                  <label className="admin-review-section" style={{ marginTop: '1rem', display: 'block' }}>
                    <span>Rejection reason</span>
                    <textarea
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Add a clear rejection reason for the employer"
                    />
                  </label>

                  {actionError ? <p className="admin-feedback admin-feedback--error">{actionError}</p> : null}

                  <div className="admin-review-actions">
                    <button type="button" className="admin-review-action admin-review-action--approve" onClick={() => void submitDecision('APPROVED')} disabled={isSubmitting}>
                      <FaCheckCircle /> {isSubmitting ? 'Updating...' : 'Approve'}
                    </button>
                    <button type="button" className="admin-review-action admin-review-action--decline" onClick={() => void submitDecision('REJECTED')} disabled={isSubmitting}>
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </article>
        ) : null}
      </section>
    </div>
  );
}

export default AdminModerationPage;
