import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaBriefcase,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaFileAlt,
  FaSearch,
  FaTimes,
  FaTimesCircle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import {
  createSeekerApplication,
  getSeekerApplications,
  getSeekerJob,
  getSeekerProfile,
  requestApplicationAssistance,
  type SeekerApplication,
  type SeekerDashboardJob,
} from '../../services/api';

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
const formatJobType = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
const getInitials = (value: string) => value.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const applicationFilters = ['All', 'Interview', 'Applied', 'Reviewing', 'Rejected'] as const;
type ApplicationFilter = typeof applicationFilters[number];

const mapApplicationStatus = (status: string) => status === 'INTERVIEW'
  ? 'Interview'
  : status === 'PAYMENT_PENDING'
    ? 'Selected - Awaiting Employer Payment'
    : status.charAt(0) + status.slice(1).toLowerCase();

function ApplicationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { getSubscription } = useSubscriptions();

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
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeObjectKey, setResumeObjectKey] = useState<string | null>(null);
  const [profileOnboardingComplete, setProfileOnboardingComplete] = useState(true);
  const [cvChoice, setCvChoice] = useState<'profile' | 'upload'>('profile');
  const [showCvWarning, setShowCvWarning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ApplicationFilter>('All');
  const aiApplicationAvailable = user ? getSubscription(user.id).aiEntitlements.includes('AI_APPLICATION_ASSISTANCE') : false;
  const [aiApplication, setAiApplication] = useState<{ coverLetter: string; alignmentPoints: string[]; strengths: string[]; gaps: string[] } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

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
    if (!token) {
      setResumeUrl(null);
      setResumeObjectKey(null);
      setProfileOnboardingComplete(true);
      return undefined;
    }

    let isMounted = true;

    const loadResume = async () => {
      const result = await getSeekerProfile(token);
      if (!isMounted) return;

      if (result.ok) {
        const profile = result.data.data.profile;
        setResumeUrl(profile.resumeUrl ?? null);
        setResumeObjectKey(profile.resumeObjectKey ?? null);
        setProfileOnboardingComplete(result.data.data.onboardingComplete ?? true);
      } else {
        setResumeUrl(null);
        setResumeObjectKey(null);
        setProfileOnboardingComplete(true);
      }
    };

    void loadResume();
    return () => {
      isMounted = false;
    };
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
        setCvChoice('profile');
        setShowCvWarning(false);
      }

      setIsJobLoading(false);
    };

    void loadJob();
    return () => {
      isMounted = false;
    };
  }, [searchParams, token]);

  useEffect(() => {
    const modalIsOpen = Boolean(selectedJob || isJobLoading || jobError);
    if (!modalIsOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeApplication();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedJob, isJobLoading, jobError]);

  const closeApplication = () => {
    setSelectedJob(null);
    setIsJobLoading(false);
    setJobError('');
    setApplicationSent(false);
    setProposal('');
    setSubmitError('');
    setShowCvWarning(false);
    setAiApplication(null);
    setAiError('');
    navigate('/seeker/applications', { replace: true });
  };

  const runApplicationAssistance = async () => {
    if (!selectedJob || !token || isAiLoading) return;
    setIsAiLoading(true); setAiError('');
    const result = await requestApplicationAssistance({ jobId: selectedJob.id, request: 'Draft a concise, truthful cover letter and explain the strongest alignment points.', coverLetter: proposal }, token);
    setIsAiLoading(false);
    if (result.ok) setAiApplication(result.data.data);
    else setAiError(result.error.message || 'AI assistance is unavailable.');
  };

  const submitApplication = async () => {
    if (!selectedJob || !token || isSubmitting) return;
    if (cvChoice === 'upload' && !resumeUrl) return;

    const cvSource: 'template' | 'upload' = cvChoice === 'upload' ? 'upload' : 'template';
    const payload = {
      jobId: selectedJob.id,
      ...(proposal.trim() ? { coverLetter: proposal.trim() } : {}),
      cvSource,
    };

    setIsSubmitting(true);
    setSubmitError('');

    const result = await createSeekerApplication(payload, token);

    if (!result.ok) {
      setSubmitError(result.error.message || 'We could not submit your application.');
    } else {
      setApplicationSent(true);
      await loadApplications();
    }

    setIsSubmitting(false);
  };

  const handleCvChoiceClick = (choice: 'profile' | 'upload') => {
    if (choice === 'profile' && !profileOnboardingComplete) {
      setShowCvWarning(true);
      return;
    }

    setCvChoice(choice);
    setShowCvWarning(false);
  };

  const continueWithIncompleteProfile = () => {
    setCvChoice('profile');
    setShowCvWarning(false);
  };

  const completeProfileAndExit = () => {
    closeApplication();
    navigate('/seeker/profile', { replace: false });
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Welcome back';
  const applicationStats = [
    { label: 'Total applications', value: summary.total, icon: <FaFileAlt />, tone: 'blue' },
    { label: 'Interviews', value: summary.interviews, icon: <FaCheckCircle />, tone: 'success' },
  ];

  const filteredApplications = applications.filter((application) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Reviewing') return ['REVIEWING', 'SHORTLISTED'].includes(application.status);
    return application.status === activeFilter.toUpperCase();
  });

  const applicationCard = (application: SeekerApplication) => (
    <article className="seeker-application-card" key={application.id}>
      <div className="seeker-application-card__logo seeker-application-card__logo--default">
        {getInitials(application.companyName || 'Company')}
      </div>
      <div className="seeker-application-card__content">
        <div className="seeker-application-card__top">
          <div>
            <h3>{application.jobTitle}</h3>
            <p>
              {application.companyName || 'Company not provided'} · {formatJobType(application.jobType)}
            </p>
          </div>
          <span className={`seeker-application-status seeker-application-status--${application.status.toLowerCase()}`}>
            {mapApplicationStatus(application.status)}
          </span>
        </div>
        <div className="seeker-application-card__meta">
          <span><FaCalendarAlt /> Applied {formatDate(application.appliedAt)}</span>
          <span><FaBriefcase /> Updated {formatDate(application.updatedAt)}</span>
        </div>
      </div>
      {application.contractId ? (
        <Link
          to={`/seeker/contracts/${application.contractId}`}
          className="seeker-application-card__link"
          aria-label={`Open ${application.jobTitle} contract`}
        >
          Contract
        </Link>
      ) : (
        <Link
          to={`/seeker/jobs/${application.jobId}`}
          className="seeker-application-card__link"
          aria-label={`View ${application.jobTitle} details`}
        >
          <FaExternalLinkAlt />
        </Link>
      )}
    </article>
  );

  return (
    <div className="seeker-applications-page">
      <section className="seeker-applications-hero">
        <div className="seeker-hero__top">
          <div className="seeker-profile">
            <div className="seeker-profile__avatar" aria-hidden="true">
              {getInitials(fullName)}
            </div>
            <div>
              <h1>Applications</h1>
              <p>Track progress, outcomes, and job income</p>
            </div>
          </div>
        </div>
        <label className="seeker-search" aria-label="Search applications">
          <FaSearch />
          <input type="search" placeholder="Search company, role, or status" />
        </label>
      </section>

      <main className="seeker-applications-content">
        <section className="seeker-application-stats" aria-label="Application overview" aria-busy={isLoading}>
          {isLoading ? (
            <>
              <span className="sr-only" role="status" aria-live="polite">Loading application stats</span>
              {[1, 2].map((item) => (
                <article className="seeker-application-stat" key={item} aria-hidden="true">
                  <span className="leamjobs-skeleton-block seeker-application-stat__icon-skeleton" />
                  <div>
                    <span className="leamjobs-skeleton-line" style={{ width: '2.5rem' }} />
                    <span className="leamjobs-skeleton-line" style={{ width: '6rem', marginTop: '0.4rem' }} />
                  </div>
                </article>
              ))}
            </>
          ) : (
            applicationStats.map((stat) => (
              <article className="seeker-application-stat" key={stat.label}>
                <span className={`seeker-application-stat__icon seeker-application-stat__icon--${stat.tone}`}>
                  {stat.icon}
                </span>
                <div>
                  <strong>{stat.value}</strong>
                  <p>{stat.label}</p>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="seeker-applications-grid">
          <div className="seeker-card seeker-application-list-card">
            <div className="seeker-section-heading">
              <div>
                <h2>Recent applications</h2>
                <p className="seeker-application-list-card__subtitle">
                  Review your latest applications and their progress.
                </p>
              </div>
            </div>
            <div className="seeker-application-tabs" aria-label="Application status filters">
              {applicationFilters.map((tab) => (
                <button
                  className={tab === activeFilter ? 'seeker-application-tab--active' : ''}
                  type="button"
                  key={tab}
                  aria-pressed={tab === activeFilter}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="seeker-application-list" aria-busy={isLoading}>
              {error ? <p role="alert">{error}</p> : null}
              {isLoading ? (
                <>
                  <span className="sr-only" role="status" aria-live="polite">Loading applications</span>
                  {[1, 2, 3].map((item) => (
                    <article className="seeker-application-card" key={item} aria-hidden="true">
                      <span className="leamjobs-skeleton-block seeker-application-card__logo-skeleton" />
                      <div className="seeker-application-card__content">
                        <div className="seeker-application-card__top">
                          <div>
                            <span className="leamjobs-skeleton-line" style={{ width: '55%' }} />
                            <span className="leamjobs-skeleton-line" style={{ width: '75%', marginTop: '0.4rem' }} />
                          </div>
                        </div>
                        <div className="seeker-application-card__meta">
                          <span className="leamjobs-skeleton-line" style={{ width: '40%' }} />
                          <span className="leamjobs-skeleton-line" style={{ width: '35%' }} />
                        </div>
                      </div>
                    </article>
                  ))}
                </>
              ) : null}
              {!isLoading && !error && applications.length === 0 ? <p>No applications yet.</p> : null}
              {!isLoading && !error && applications.length > 0 && filteredApplications.length === 0 ? (
                <p>No {activeFilter.toLowerCase()} applications yet.</p>
              ) : null}
              {!isLoading && !error ? filteredApplications.map(applicationCard) : null}
            </div>
          </div>

          <aside className="seeker-card seeker-income-card" aria-label="Application summary">
            <div className="seeker-income-card__heading">
              <span><FaBriefcase /></span>
              <div>
                <h2>Application summary</h2>
                <p>Your current application activity</p>
              </div>
            </div>
            <div className="seeker-income-metrics">
              <div>
                <strong>{summary.total}</strong>
                <span>Total applications</span>
              </div>
              <div>
                <strong>{summary.interviews}</strong>
                <span>Interviews</span>
              </div>
            </div>
          </aside>
        </section>
      </main>

      {(selectedJob || isJobLoading || jobError) && (
        <div
          className="seeker-application-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeApplication();
            }
          }}
        >
          <section
            className="seeker-application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
          >
            <div className="seeker-application-modal__header">
              <div>
                <span className="seeker-application-modal__eyebrow">Application workspace</span>
                <h2 id="application-modal-title">
                  {isJobLoading ? (
                    <>
                      <span className="sr-only">Loading job details</span>
                      <span
                        className="leamjobs-skeleton-line seeker-application-modal__title-skeleton"
                        aria-hidden="true"
                      />
                    </>
                  ) : selectedJob ? (
                    `Apply for ${selectedJob.title}`
                  ) : (
                    'Application unavailable'
                  )}
                </h2>
                {selectedJob ? (
                  <p>
                    {selectedJob.company?.name || 'Company not provided'} · {selectedJob.location}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="seeker-application-modal__close"
                onClick={closeApplication}
                aria-label="Close application form"
              >
                <FaTimes />
              </button>
            </div>

            {isJobLoading ? (
              <div className="seeker-application-modal__body" role="status" aria-live="polite">
                <span className="sr-only">Loading job details</span>
                <div className="seeker-application-job-facts" aria-hidden="true">
                  <span className="leamjobs-skeleton-line" />
                  <span className="leamjobs-skeleton-line" />
                  <span className="leamjobs-skeleton-line" />
                </div>
                <div className="leamjobs-skeleton-block seeker-application-skeleton-block" aria-hidden="true" />
                <div
                  className="leamjobs-skeleton-block seeker-application-skeleton-block seeker-application-skeleton-block--tall"
                  aria-hidden="true"
                />
              </div>
            ) : jobError ? (
              <div className="seeker-application-success">
                <span><FaTimesCircle /></span>
                <h3>Unable to apply</h3>
                <p>{jobError}</p>
                <button type="button" className="button button--primary" onClick={closeApplication}>
                  Back to applications
                </button>
              </div>
            ) : applicationSent ? (
              <div className="seeker-application-success">
                <span><FaCheck /></span>
                <h3>Application submitted</h3>
                <p>Your application was sent. You can track it from Applications.</p>
                <button type="button" className="button button--primary" onClick={closeApplication}>
                  Back to applications
                </button>
              </div>
            ) : selectedJob ? (
              <>
                <div className="seeker-application-modal__body">
                  <div className="seeker-application-job-facts">
                    <span>
                      <strong>Compensation</strong>
                      {selectedJob.compensation?.type === 'FREELANCE'
                        ? `${selectedJob.compensation.currency} ${selectedJob.compensation.projectAmount}`
                        : selectedJob.compensation
                          ? `${selectedJob.compensation.currency} ${selectedJob.compensation.salaryMin ?? 'Not specified'} - ${selectedJob.compensation.salaryMax ?? 'Not specified'}`
                          : 'Not specified'}
                    </span>
                    <span>
                      <strong>Job type</strong>
                      {formatJobType(selectedJob.jobType)}
                    </span>
                    <span>
                      <strong>Location</strong>
                      {selectedJob.location}
                    </span>
                  </div>

                  {showCvWarning ? (
                    <div className="seeker-application-warning">
                      <h3>Your CV profile is incomplete</h3>
                      <p>
                        Some information is missing from your LeamJobs CV. Completing your profile can
                        help employers better understand your experience and qualifications.
                      </p>
                      <div className="seeker-application-warning__actions">
                        <button type="button" className="button button--secondary" onClick={completeProfileAndExit}>
                          Complete profile
                        </button>
                        <button type="button" className="button button--primary" onClick={continueWithIncompleteProfile}>
                          Continue application
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="seeker-application-cv-choice">
                      <div className="seeker-application-cv-choice__heading">
                        <div>
                          <h3>Choose your CV</h3>
                          <p>
                            {profileOnboardingComplete
                              ? 'Your LeamJobs profile is ready to use.'
                              : 'Your LeamJobs CV profile is incomplete, but you can still continue.'}
                          </p>
                        </div>
                      </div>

                      <div className="seeker-application-cv-options">
                        <label className="seeker-application-cv-option">
                          <input
                            type="radio"
                            checked={cvChoice === 'profile'}
                            onChange={() => handleCvChoiceClick('profile')}
                          />
                          <span>
                            <strong>Use my LeamJobs CV</strong>
                            <small>Generated from your LeamJobs profile</small>
                          </span>
                        </label>

                        <label className="seeker-application-cv-option">
                          <input
                            type="radio"
                            checked={cvChoice === 'upload'}
                            onChange={() => handleCvChoiceClick('upload')}
                            disabled={!resumeUrl}
                          />
                          <span>
                            <strong>Use my saved uploaded CV</strong>
                            <small>{resumeUrl ? 'Using your current profile-uploaded CV' : 'No uploaded profile CV saved yet'}</small>
                          </span>
                        </label>
                      </div>

                      {cvChoice === 'profile' && !profileOnboardingComplete ? (
                        <p className="seeker-application-cv-note">
                          Your profile is incomplete. You can still continue with the information currently available.
                        </p>
                      ) : null}
                      {cvChoice === 'profile' && resumeUrl ? (
                        <span className="seeker-application-cv-note">
                          This saved profile CV will be included when you submit your application.
                        </span>
                      ) : null}
                      {cvChoice === 'upload' && resumeUrl ? (
                        <span className="seeker-application-cv-note">
                          Your uploaded CV will be included when you submit your application.
                        </span>
                      ) : null}
                      {cvChoice === 'upload' && !resumeUrl ? (
                        <span className="seeker-application-cv-note">
                          No saved uploaded profile CV is available for this application.
                        </span>
                      ) : null}
                      {cvChoice === 'profile' && !resumeUrl && !profileOnboardingComplete ? (
                        <span className="seeker-application-cv-note">
                          You can continue without a stored CV, but employers will only see the information you provided.
                        </span>
                      ) : null}
                      {cvChoice === 'profile' && !resumeUrl && profileOnboardingComplete ? (
                        <span className="seeker-application-cv-note">
                          Your profile will be used as the application CV.
                        </span>
                      ) : null}
                    </div>
                  )}

                  {!showCvWarning && (
                    <div className="seeker-application-proposal">
                      <label htmlFor="application-proposal">Cover letter or short introduction</label>
                      <textarea
                        id="application-proposal"
                        value={proposal}
                        onChange={(event) => setProposal(event.target.value)}
                        rows={5}
                        placeholder="Write a short introduction or note for the employer."
                      />
                      <small>
                        {proposal.trim().length
                          ? `${proposal.trim().length} characters`
                          : 'You can apply without a cover letter.'}
                      </small>
                    </div>
                  )}

                  {!showCvWarning ? <section className="seeker-ai-application" aria-label="AI application assistance">
                    <div><strong>Premium application assistance</strong><p>Draft a cover letter and review job alignment before you submit.</p></div>
                    <button type="button" onClick={() => void runApplicationAssistance()} disabled={!aiApplicationAvailable || isAiLoading}>{!aiApplicationAvailable ? 'Requires Premium' : isAiLoading ? 'Thinking...' : 'Get AI draft'}</button>
                    {aiError ? <p role="alert">{aiError}</p> : null}
                    {aiApplication ? <div className="seeker-ai-application__result"><h4>Review draft</h4><textarea value={aiApplication.coverLetter} onChange={(event) => setProposal(event.target.value)} rows={6} /><strong>Alignment</strong><ul>{aiApplication.alignmentPoints.map((point) => <li key={point}>{point}</li>)}</ul><strong>Possible gaps</strong><ul>{aiApplication.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></div> : null}
                  </section> : null}

                  {submitError ? <p role="alert">{submitError}</p> : null}
                </div>

                <div className="seeker-application-modal__footer">
                  <button type="button" className="button button--secondary" onClick={closeApplication}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={isSubmitting || (cvChoice === 'upload' && !resumeUrl)}
                    onClick={submitApplication}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit application'}
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}

export default ApplicationsPage;
