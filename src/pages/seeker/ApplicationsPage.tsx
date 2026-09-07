import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaCheck,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaFileAlt,
  FaSearch,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  createSeekerApplication,
  getSeekerApplications,
  getSeekerJob,
  type SeekerApplication,
  type SeekerDashboardJob,
} from '../../services/api';

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
const formatJobType = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
const getInitials = (value: string) => value.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const mapApplicationStatus = (status: string) => status === 'INTERVIEW' ? 'Interview' : status.charAt(0) + status.slice(1).toLowerCase();

function ApplicationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<SeekerApplication[]>([]);
  const [summary, setSummary] = useState({ total: 0, interviews: 0 });
  const [selectedJob, setSelectedJob] = useState<SeekerDashboardJob | null>(null);
  const [proposal, setProposal] = useState('');
  const [applicationSent, setApplicationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJobLoading, setIsJobLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [jobError, setJobError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const loadApplications = async () => {
    if (!token) {
      setError('Your session could not be loaded. Please sign in again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getSeekerApplications(token);

    if (result.ok) {
      setApplications(result.data.data.applications);
      setSummary(result.data.data.summary);
      setError('');
    } else {
      setError(result.error.message || 'We could not load your applications.');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadApplications();
  }, [token]);

  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (!token || !jobId || searchParams.get('apply') !== 'true') return;

    let isMounted = true;
    setIsJobLoading(true);
    setJobError('');
    setSubmitError('');

    const loadJob = async () => {
      const result = await getSeekerJob(jobId, token);
      if (!isMounted) return;

      if (!result.ok) {
        setSelectedJob(null);
        setJobError(result.error.message || 'This job is unavailable.');
      } else if (result.data.data.alreadyApplied) {
        setSelectedJob(null);
        setJobError('You have already applied to this job.');
      } else {
        setSelectedJob(result.data.data.job);
        setApplicationSent(false);
        setProposal('');
      }

      setIsJobLoading(false);
    };

    void loadJob();
    return () => { isMounted = false; };
  }, [searchParams, token]);

  useEffect(() => {
    const modalIsOpen = Boolean(selectedJob || isJobLoading || jobError);
    if (!modalIsOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeApplication();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedJob, isJobLoading, jobError]);

  const closeApplication = () => {
    setSelectedJob(null);
    setApplicationSent(false);
    setProposal('');
    setSubmitError('');
    navigate('/seeker/applications', { replace: true });
  };

  const submitApplication = async () => {
    if (!selectedJob || !token || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');
    const result = await createSeekerApplication({
      jobId: selectedJob.id,
      ...(proposal.trim() ? { coverLetter: proposal.trim() } : {}),
    }, token);

    if (!result.ok) {
      setSubmitError(result.error.message || 'We could not submit your application.');
    } else {
      setApplicationSent(true);
      await loadApplications();
    }

    setIsSubmitting(false);
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Welcome back';
  const applicationStats = [
    { label: 'Total applications', value: summary.total, icon: <FaFileAlt />, tone: 'blue' },
    { label: 'Interviews', value: summary.interviews, icon: <FaCheckCircle />, tone: 'success' },
  ];

  const applicationCard = (application: SeekerApplication) => (
    <article className="seeker-application-card" key={application.id}>
      <div className="seeker-application-card__logo seeker-application-card__logo--default">{getInitials(application.companyName || 'Company')}</div>
      <div className="seeker-application-card__content">
        <div className="seeker-application-card__top">
          <div><h3>{application.jobTitle}</h3><p>{application.companyName || 'Company not provided'} · {formatJobType(application.jobType)}</p></div>
          <span className={`seeker-application-status seeker-application-status--${application.status.toLowerCase()}`}>{mapApplicationStatus(application.status)}</span>
        </div>
        <div className="seeker-application-card__meta">
          <span><FaCalendarAlt /> Applied {formatDate(application.appliedAt)}</span>
          <span><FaBriefcase /> Updated {formatDate(application.updatedAt)}</span>
        </div>
      </div>
      <Link to={`/seeker/jobs/${application.jobId}`} className="seeker-application-card__link" aria-label={`View ${application.jobTitle} details`}><FaExternalLinkAlt /></Link>
    </article>
  );

  return (
    <div className="seeker-applications-page">
      <section className="seeker-applications-hero">
        <div className="seeker-hero__top"><div className="seeker-profile"><div className="seeker-profile__avatar" aria-hidden="true">{getInitials(fullName)}</div><div><h1>Applications</h1><p>Track progress, outcomes, and job income</p></div></div><button className="seeker-icon-button seeker-icon-button--alert" type="button" aria-label="Notifications"><FaBell /></button></div>
        <label className="seeker-search" aria-label="Search applications"><FaSearch /><input type="search" placeholder="Search company, role, or status" /></label>
      </section>

      <main className="seeker-applications-content">
        <section className="seeker-application-stats" aria-label="Application overview">
          {isLoading ? <p>Loading application stats...</p> : applicationStats.map((stat) => <article className="seeker-application-stat" key={stat.label}><span className={`seeker-application-stat__icon seeker-application-stat__icon--${stat.tone}`}>{stat.icon}</span><div><strong>{stat.value}</strong><p>{stat.label}</p></div></article>)}
        </section>

        <section className="seeker-applications-grid">
          <div className="seeker-card seeker-application-list-card">
            <div className="seeker-section-heading"><div><h2>Recent applications</h2><p className="seeker-application-list-card__subtitle">Review your latest applications and their progress.</p></div></div>
            <div className="seeker-application-tabs" aria-label="Application status filters">{['All', 'Interview', 'Applied', 'Reviewing', 'Rejected'].map((tab) => <button className={tab === 'All' ? 'seeker-application-tab--active' : ''} type="button" key={tab}>{tab}</button>)}</div>
            <div className="seeker-application-list">
              {error ? <p role="alert">{error}</p> : null}
              {!isLoading && !error && applications.length === 0 ? <p>No applications yet.</p> : null}
              {!isLoading && !error ? applications.map(applicationCard) : null}
            </div>
          </div>
          <aside className="seeker-card seeker-income-card" aria-label="Application summary"><div className="seeker-income-card__heading"><span><FaBriefcase /></span><div><h2>Application summary</h2><p>Your current application activity</p></div></div><div className="seeker-income-metrics"><div><strong>{summary.total}</strong><span>Total applications</span></div><div><strong>{summary.interviews}</strong><span>Interviews</span></div></div></aside>
        </section>
      </main>

      {(selectedJob || isJobLoading || jobError) && (
        <div className="seeker-application-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeApplication(); }}>
          <section className="seeker-application-modal" role="dialog" aria-modal="true" aria-labelledby="application-modal-title">
            <div className="seeker-application-modal__header"><div><span className="seeker-application-modal__eyebrow">Application workspace</span><h2 id="application-modal-title">{isJobLoading ? 'Loading job...' : selectedJob ? `Apply for ${selectedJob.title}` : 'Application unavailable'}</h2>{selectedJob ? <p>{selectedJob.company?.name || 'Company not provided'} · {selectedJob.location}</p> : null}</div><button type="button" className="seeker-application-modal__close" onClick={closeApplication} aria-label="Close application form"><FaTimes /></button></div>
            {isJobLoading ? <div className="seeker-application-modal__body"><p>Loading this job...</p></div> : jobError ? <div className="seeker-application-success"><span><FaTimesCircle /></span><h3>Unable to apply</h3><p>{jobError}</p><button type="button" className="button button--primary" onClick={closeApplication}>Back to applications</button></div> : applicationSent ? <div className="seeker-application-success"><span><FaCheck /></span><h3>Application submitted</h3><p>Your application was sent. You can track it from Applications.</p><button type="button" className="button button--primary" onClick={closeApplication}>Back to applications</button></div> : selectedJob ? <><div className="seeker-application-modal__body"><div className="seeker-application-job-facts"><span><strong>Compensation</strong>{selectedJob.compensation?.type === 'FREELANCE' ? `${selectedJob.compensation.currency} ${selectedJob.compensation.projectAmount}` : selectedJob.compensation ? `${selectedJob.compensation.currency} ${selectedJob.compensation.salaryMin ?? 'Not specified'} - ${selectedJob.compensation.salaryMax ?? 'Not specified'}` : 'Not specified'}</span><span><strong>Job type</strong>{formatJobType(selectedJob.jobType)}</span><span><strong>Location</strong>{selectedJob.location}</span></div><div className="seeker-application-cv-choice"><div className="seeker-application-cv-choice__heading"><div><h3>Resume</h3><p>The JSON application API accepts a resume URL. Local file uploads are not connected.</p></div></div><span className="seeker-application-cv-note">Add or update your resume URL from your profile before applying.</span></div><div className="seeker-application-proposal"><label htmlFor="application-proposal">Cover letter or short introduction <small>(optional)</small></label><textarea id="application-proposal" value={proposal} onChange={(event) => setProposal(event.target.value)} placeholder="Share a concise introduction, relevant experience, and what you would bring to this role." rows={5} /><small>{proposal.trim().length ? `${proposal.trim().length} characters` : 'You can apply without a cover letter.'}</small></div>{submitError ? <p role="alert">{submitError}</p> : null}</div><div className="seeker-application-modal__footer"><button type="button" className="seeker-application-secondary-button" onClick={closeApplication}>Cancel</button><button type="button" className="button button--primary" disabled={isSubmitting} onClick={submitApplication}>{isSubmitting ? 'Submitting...' : 'Submit application'}</button></div></> : null}
          </section>
        </div>
      )}
    </div>
  );
}

export default ApplicationsPage;