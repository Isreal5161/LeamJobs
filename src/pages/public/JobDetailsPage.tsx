import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBuilding, FaCheck, FaChevronRight, FaClock, FaMagic, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAiRateLimitCopy, getPublicJob, getSeekerJob, isAiRateLimitError, requestInterviewPreparation, requestSkillsGap, type InterviewPreparation, type SeekerDashboardJob, type SkillsGapResult } from '../../services/api';
import { useSubscriptions } from '../../context/SubscriptionContext';
import CompanyLogo from '../../components/jobs/CompanyLogo';

const skillClasses = ['job-detail-skill--pink', 'job-detail-skill--purple', 'job-detail-skill--green', 'job-detail-skill--yellow', 'job-detail-skill--blue'];

const formatJobType = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

const formatCompensation = (job: SeekerDashboardJob) => {
  if (!job.compensation) return 'Compensation not specified';
  if (job.compensation.type === 'FREELANCE') return `${job.compensation.currency} ${job.compensation.projectAmount} project`;
  if (job.compensation.type === 'CONTRACT') return `${job.compensation.currency} ${job.compensation.amount} Contract Job${job.compensation.duration ? ` / ${job.compensation.duration}` : ''}`;
  return `${job.compensation.currency} ${job.compensation.salaryMin ?? 'Not specified'} - ${job.compensation.salaryMax ?? 'Not specified'} / ${job.compensation.salaryPeriod.toLowerCase()}`;
};

const formatList = (items: string[] | Record<string, unknown> | null) => {
  if (Array.isArray(items)) return items.length ? items : ['No information provided.'];
  if (items && typeof items === 'object') return Object.entries(items).map(([key, value]) => `${key}: ${String(value)}`);
  return ['No information provided.'];
};

const getInitials = (value: string) => value.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

function JobDetailsPage() {
  const { jobId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { currentPlan } = useSubscriptions();
  const isSeekerRoute = pathname.startsWith('/seeker/');
  const [job, setJob] = useState<SeekerDashboardJob | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviewPreparation, setInterviewPreparation] = useState<InterviewPreparation | null>(null);
  const [skillsGap, setSkillsGap] = useState<SkillsGapResult | null>(null);
  const [aiLoading, setAiLoading] = useState<'interview' | 'skills' | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiServiceModal, setAiServiceModal] = useState<null | {
    kind: 'rate-limit' | 'temporary' | 'network';
    title: string;
    description: string;
    detail: string;
    retryAction: 'interview' | 'skills' | null;
    primaryAction: string;
  }>(null);
  const aiServiceModalCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadJob = async () => {
      if (!jobId || (isSeekerRoute && !token)) {
        setError('This job could not be loaded. Please sign in again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      const result = isSeekerRoute ? await getSeekerJob(jobId, token as string) : await getPublicJob(jobId);

      if (!isMounted) return;

      if (!result.ok) {
        setJob(null);
        setError(result.error.message || 'This job is unavailable.');
      } else {
        setJob(result.data.data.job);
        setAlreadyApplied(result.data.data.alreadyApplied);
      }

      setIsLoading(false);
    };

    void loadJob();

    return () => {
      isMounted = false;
    };
  }, [isSeekerRoute, jobId, token]);

  useEffect(() => {
    if (!aiServiceModal) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAiServiceModal(null);
    };

    const focusTimer = window.setTimeout(() => {
      aiServiceModalCloseRef.current?.focus();
    }, 0);

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [aiServiceModal]);

  const handlePremiumToolFailure = (tool: 'interview' | 'skills', result: { ok: boolean; status: number; error?: { message?: string; code?: string; retryAfterSeconds?: number | null } }) => {
    if (!result.ok) {
      if (isAiRateLimitError(result.status, result.error)) {
        const rateLimitCopy = getAiRateLimitCopy(result.error?.retryAfterSeconds ?? null);
        setAiServiceModal({
          kind: 'rate-limit',
          title: rateLimitCopy.title,
          description: rateLimitCopy.description,
          detail: rateLimitCopy.detail,
          retryAction: null,
          primaryAction: 'Got it',
        });
        return true;
      }

      if (result.status === 0 || /failed to fetch|network error|network request|econn|enotfound|socket/i.test(String(result.error?.message ?? ''))) {
        setAiServiceModal({
          kind: 'network',
          title: 'Connection problem',
          description: "We couldn't reach the AI service.",
          detail: 'Please check your internet connection and try again.',
          retryAction: tool,
          primaryAction: 'Try Again',
        });
        return true;
      }

      if (result.status === 401 || result.status === 403) {
        setAiError(result.error?.message || 'Your session has expired. Please sign in again.');
        return true;
      }

      if (result.status === 502 || result.status === 503 || result.status === 504) {
        setAiServiceModal({
          kind: 'temporary',
          title: 'AI Interview Preparation Unavailable',
          description: "We couldn't prepare your interview questions right now.",
          detail: 'The AI service is temporarily unavailable. Please try again in a moment.',
          retryAction: tool,
          primaryAction: 'Try Again',
        });
        return true;
      }

      setAiError(result.error?.message || (tool === 'interview' ? 'Interview preparation is unavailable.' : 'Skills-gap analysis is unavailable.'));
      return true;
    }

    return false;
  };

  const runPremiumTool = async (tool: 'interview' | 'skills') => {
    if (!token || !jobId || aiLoading) return;
    setAiServiceModal(null);
    setAiLoading(tool); setAiError('');

    if (tool === 'interview') {
      const result = await requestInterviewPreparation({ jobId }, token);
      setAiLoading(null);
      if (!result.ok) {
        if (handlePremiumToolFailure(tool, result)) return;
        return;
      }
      setInterviewPreparation(result.data.data);
    } else {
      const result = await requestSkillsGap({ jobId }, token);
      setAiLoading(null);
      if (!result.ok) {
        if (handlePremiumToolFailure(tool, result)) return;
        return;
      }
      setSkillsGap(result.data.data);
    }
  };

  if (isLoading) {
    return (
      <article className="job-detail-page" role="status" aria-live="polite" aria-label="Loading job details">
        <header className="job-detail-hero">
          <div className="job-detail-hero__nav">
            <button type="button" className="job-detail-icon-button" aria-label="Go back" onClick={() => navigate(-1)}>
              <FaArrowLeft />
            </button>
            <div>
              <h1>Job Details</h1>
              <p>Learn more about this opportunity</p>
            </div>
          </div>
        </header>
        <div className="job-detail-layout" aria-hidden="true">
          <section className="job-detail-summary card">
            <span className="leamjobs-skeleton-circle" style={{ width: '112px', height: '112px', borderRadius: '20px' }} />
            <div className="job-detail-summary__content">
              <span className="leamjobs-skeleton-line" style={{ width: '70%', height: '1.8rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '40%' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '55%' }} />
            </div>
          </section>
          <main className="job-detail-main">
            <section className="job-detail-section">
              <span className="leamjobs-skeleton-line" style={{ width: '30%', height: '1.2rem' }} />
              <span className="leamjobs-skeleton-block" style={{ height: '90px', marginTop: '.6rem' }} />
            </section>
            <section className="job-detail-section">
              <span className="leamjobs-skeleton-line" style={{ width: '35%', height: '1.2rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '80%', marginTop: '.6rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '65%', marginTop: '.4rem' }} />
            </section>
          </main>
          <aside className="job-detail-sidebar">
            <div className="job-detail-apply-card card">
              <span className="leamjobs-skeleton-line" style={{ width: '60%', height: '1.2rem' }} />
              <span className="leamjobs-skeleton-block" style={{ height: '120px', marginTop: '.8rem' }} />
            </div>
          </aside>
        </div>
      </article>
    );
  }

  if (!job) {
    return (
      <article className="job-detail-page">
        <section className="job-detail-section">
          <h1>{error || 'Job not found'}</h1>
          <Link className="button button--primary" to={isSeekerRoute ? '/seeker/jobs' : '/'}>Back to jobs</Link>
        </section>
      </article>
    );
  }

  const companyName = job.company?.name ?? 'Company not provided';
  const logoUrl = job.company?.logoUrl;
  const detailPath = `/seeker/applications?jobId=${job.id}&apply=true`;
  const premiumPreparationTools = isSeekerRoute && currentPlan?.entitlements?.includes('AI_INTERVIEW_PREPARATION') ? (
    <div className="job-detail-premium-tools">
      <strong><FaMagic aria-hidden="true" /> Premium preparation</strong>
      <button type="button" onClick={() => void runPremiumTool('interview')} disabled={aiLoading !== null}>{aiLoading === 'interview' ? 'Preparing...' : 'Prepare for interview'}</button>
      <button type="button" onClick={() => void runPremiumTool('skills')} disabled={aiLoading !== null}>{aiLoading === 'skills' ? 'Analysing...' : 'Analyse skills gap'}</button>
      {aiError ? <p role="alert">{aiError}</p> : null}
    </div>
  ) : null;

  return (
    <article className="job-detail-page">
      <header className="job-detail-hero">
        <div className="job-detail-hero__nav">
          <button type="button" className="job-detail-icon-button" aria-label="Go back" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div>
            <h1>Job Details</h1>
            <p>Learn more about this opportunity</p>
          </div>
        </div>
      </header>

      <div className="job-detail-layout">
        <section className="job-detail-summary card" aria-label={`${job.title} at ${companyName}`}>
          <CompanyLogo company={companyName} logoUrl={logoUrl} logoText={getInitials(companyName)} />
          <div className="job-detail-summary__content">
            <div className="job-detail-summary__top">
              <h2>{job.title}</h2>
            </div>
            <p className="job-detail-company">{companyName}</p>
            <p className="job-detail-meta">
              <span>{formatCompensation(job)}</span>
              <span>{job.location}</span>
            </p>
            <div className="job-detail-tags">
              <span className="job-tag job-tag--yellow">{job.engagementType === 'CONTRACT' ? 'Contract Job' : formatJobType(job.engagementType ?? job.jobType)}</span>
              {job.workArrangement ? <span className="job-tag job-tag--green">{formatJobType(job.workArrangement)}</span> : null}
            </div>
            {job.compensation?.type === 'CONTRACT' ? <div className="job-detail-contract-dates"><span>{job.compensation.startMode === 'SCHEDULED' && job.compensation.scheduledStartDate ? `Starts ${new Date(job.compensation.scheduledStartDate).toLocaleDateString()}` : 'Starts immediately'}</span>{job.compensation.expectedCompletionDate ? <span>Expected completion {new Date(job.compensation.expectedCompletionDate).toLocaleDateString()}</span> : null}</div> : null}
          </div>
        </section>

        <main className="job-detail-main">
          <section className="job-detail-section">
            <h2>Job Description</h2>
            <p>{job.description}</p>
          </section>

          {job.department ? <section className="job-detail-section"><h2>Department</h2><p>{job.department}</p></section> : null}

          <section className="job-detail-section">
            <h2>Responsibilities</h2>
            <ul className="job-detail-check-list">{formatList(job.responsibilities).map((item) => <li key={item}><FaCheck /><span>{item}</span></li>)}</ul>
          </section>

          <section className="job-detail-section">
            <h2>Requirements</h2>
            <ul className="job-detail-check-list">{formatList(job.requirements).map((item) => <li key={item}><FaCheck /><span>{item}</span></li>)}</ul>
          </section>

          <section className="job-detail-section">
            <h2>Company information</h2>
            <ul className="job-detail-check-list">
              <li><FaCheck /><span>{job.company?.location || 'Company location not provided'}</span></li>
              <li><FaCheck /><span>{job.company?.website || 'Company website not provided'}</span></li>
              {job.company?.industry ? <li><FaCheck /><span>Industry: {job.company.industry}</span></li> : null}
            </ul>
          </section>

          <section className="job-detail-section">
            <h2>Compensation</h2>
            <ul className="job-detail-check-list">
              <li><FaCheck /><span>{formatCompensation(job)}</span></li>
            </ul>
          </section>

          <section className="job-detail-section">
            <h2>Required Skills</h2>
            <div className="job-detail-skills">
              {job.skills.length ? job.skills.map((skill, index) => <span className={`job-detail-skill ${skillClasses[index % skillClasses.length]}`} key={skill}>{skill}</span>) : <span>No skills provided.</span>}
            </div>
          </section>

          {job.benefits.length ? <section className="job-detail-section"><h2>Benefits</h2><ul className="job-detail-check-list">{job.benefits.map((benefit) => <li key={benefit}><FaCheck /><span>{benefit}</span></li>)}</ul></section> : null}

          <section className="job-detail-company-card card">
            <CompanyLogo company={companyName} logoUrl={logoUrl} logoText={getInitials(companyName)} />
            <div>
              <h2>About {companyName}</h2>
              <p>{job.company?.description || 'Company information is not available.'}</p>
              <Link to={`${isSeekerRoute ? '/seeker' : ''}/companies/${encodeURIComponent(job.employerId)}`} state={{ fromJob: true, jobTitle: job.title }}>
                View company profile
                <FaChevronRight />
              </Link>
            </div>
          </section>
        </main>

        <aside className="job-detail-sidebar" aria-label="Application details">
          <div className="job-detail-apply-card card">
            <h2>Ready to apply?</h2>
            <p>{alreadyApplied ? 'You have already applied to this job.' : isSeekerRoute ? 'Review this role and start your application when you are ready.' : 'Create a free account or sign in to start your application for this role.'}</p>
            <div className="job-detail-quick-facts">
              <span>
                <FaMapMarkerAlt />
                {job.location}
              </span>
              <span>
                <FaClock />
                {job.applicationDeadline ? `Apply by ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(job.applicationDeadline))}` : 'No deadline provided'}
              </span>
              <span>
                <FaBuilding />
                {formatJobType(job.engagementType ?? job.jobType)}
              </span>
            </div>
            <Link className="button button--primary job-detail-apply-link" to={alreadyApplied ? '/seeker/applications' : detailPath}>{alreadyApplied ? 'View application' : 'Apply Now'}</Link>
            {premiumPreparationTools}
          </div>
        </aside>
      </div>
      {interviewPreparation ? <section className="job-detail-ai-result" aria-live="polite"><h2>Interview preparation</h2><p>{interviewPreparation.answerFramework}</p><ul>{interviewPreparation.questions.map((item) => <li key={item.question}><strong>{item.type}</strong><span>{item.question}</span><small>{item.guidance}</small></li>)}</ul></section> : null}
      {skillsGap ? <section className="job-detail-ai-result" aria-live="polite"><h2>Skills-gap analysis</h2><p><strong>Matched:</strong> {skillsGap.matchedSkills.join(', ') || 'No direct matches found.'}</p><p><strong>Missing:</strong> {skillsGap.missingSkills.join(', ') || 'No missing target skills identified.'}</p><p><strong>Priority areas:</strong> {skillsGap.priorities.join(', ') || 'No priority areas identified.'}</p></section> : null}

      {aiServiceModal && (
        <div
          className="job-detail-ai-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAiServiceModal(null);
          }}
        >
          <section className="job-detail-ai-modal" role="dialog" aria-modal="true" aria-labelledby="job-detail-ai-modal-title">
            <div className="job-detail-ai-modal__icon" aria-hidden="true">⚠</div>
            <div className="job-detail-ai-modal__content">
              <span className="job-detail-ai-modal__eyebrow">AI service</span>
              <h2 id="job-detail-ai-modal-title">{aiServiceModal.title}</h2>
              <p>{aiServiceModal.description}</p>
              <p className="job-detail-ai-modal__detail">{aiServiceModal.detail}</p>
            </div>
            <div className="job-detail-ai-modal__actions">
              {aiServiceModal.primaryAction === 'Got it' ? (
                <button type="button" ref={aiServiceModalCloseRef} className="button button--primary" onClick={() => setAiServiceModal(null)}>{aiServiceModal.primaryAction}</button>
              ) : (
                <>
                  <button type="button" className="button button--secondary" onClick={() => setAiServiceModal(null)}>Close</button>
                  <button type="button" ref={aiServiceModalCloseRef} className="button button--primary" onClick={() => {
                    setAiServiceModal(null);
                    if (aiServiceModal.retryAction) void runPremiumTool(aiServiceModal.retryAction);
                  }} disabled={aiLoading !== null}>{aiLoading !== null ? 'Retrying...' : aiServiceModal.primaryAction}</button>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="job-detail-bottom-cta">
        <div className="job-detail-mobile-apply-card">
          <h2>Ready to apply?</h2>
          <p>{alreadyApplied ? 'You have already applied to this job.' : 'Review this opportunity and submit your application.'}</p>
          <div className="job-detail-quick-facts">
            <span>
              <FaMapMarkerAlt />
              {job.location}
            </span>
            <span>
              <FaClock />
                {job.applicationDeadline ? `Apply by ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(job.applicationDeadline))}` : 'No deadline provided'}
            </span>
            <span>
              <FaBuilding />
                {formatJobType(job.engagementType ?? job.jobType)}
            </span>
          </div>
        </div>
        <Link className="button button--primary job-detail-apply-link" to={alreadyApplied ? '/seeker/applications' : detailPath}>{alreadyApplied ? 'View application' : 'Apply Now'}</Link>
        {premiumPreparationTools}
      </div>
    </article>
  );
}

export default JobDetailsPage;
