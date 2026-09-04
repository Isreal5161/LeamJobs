import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBookmark, FaBuilding, FaCheck, FaChevronRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getSeekerJob, type SeekerDashboardJob } from '../../services/api';

const skillClasses = ['job-detail-skill--pink', 'job-detail-skill--purple', 'job-detail-skill--green', 'job-detail-skill--yellow', 'job-detail-skill--blue'];

const formatJobType = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

const formatCompensation = (job: SeekerDashboardJob) => {
  if (!job.compensation) return 'Compensation not specified';
  if (job.compensation.type === 'FREELANCE') return `${job.compensation.currency} ${job.compensation.projectAmount} project`;
  return `${job.compensation.currency} ${job.compensation.salaryMin ?? 'Not specified'} - ${job.compensation.salaryMax ?? 'Not specified'} / ${job.compensation.salaryPeriod.toLowerCase()}`;
};

const getInitials = (value: string) => value.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

function JobDetailsPage() {
  const { jobId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isSeekerRoute = pathname.startsWith('/seeker/');
  const [job, setJob] = useState<SeekerDashboardJob | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(isSeekerRoute);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSeekerRoute) return;

    let isMounted = true;

    const loadJob = async () => {
      if (!jobId || !token) {
        setError('This job could not be loaded. Please sign in again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      const result = await getSeekerJob(jobId, token);

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

  if (isLoading) {
    return <article className="job-detail-page"><p>Loading job details...</p></article>;
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
          <button type="button" className="job-detail-icon-button" aria-label={`Save ${job.title}`}>
            <FaBookmark />
          </button>
        </div>
      </header>

      <div className="job-detail-layout">
        <section className="job-detail-summary card" aria-label={`${job.title} at ${companyName}`}>
          {logoUrl ? <img className="company-logo" src={logoUrl} alt="" /> : <span className="company-logo" aria-hidden="true">{getInitials(companyName)}</span>}
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
              <span className="job-tag job-tag--yellow">{formatJobType(job.jobType)}</span>
              {job.company?.industry ? <span className="job-tag job-tag--blue">{job.company.industry}</span> : null}
            </div>
          </div>
        </section>

        <main className="job-detail-main">
          <section className="job-detail-section">
            <h2>Job Description</h2>
            <p>{job.description}</p>
          </section>

          <section className="job-detail-section">
            <h2>Company information</h2>
            <ul className="job-detail-check-list">
              <li><FaCheck /><span>{job.company?.location || 'Company location not provided'}</span></li>
              <li><FaCheck /><span>{job.company?.website || 'Company website not provided'}</span></li>
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
              <span className={`job-detail-skill ${skillClasses[0]}`}>{formatJobType(job.jobType)}</span>
              {job.company?.industry ? <span className={`job-detail-skill ${skillClasses[1]}`}>{job.company.industry}</span> : null}
            </div>
          </section>

          <section className="job-detail-company-card card">
            {logoUrl ? <img className="company-logo" src={logoUrl} alt="" /> : <span className="company-logo" aria-hidden="true">{getInitials(companyName)}</span>}
            <div>
              <h2>About {companyName}</h2>
              <p>{job.company?.description || 'Company information is not available.'}</p>
              <Link to="/companies">
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
                {formatJobType(job.jobType)}
              </span>
            </div>
            <Link className="button button--primary job-detail-apply-link" to={alreadyApplied ? '/seeker/applications' : detailPath}>{alreadyApplied ? 'View application' : 'Apply Now'}</Link>
          </div>
        </aside>
      </div>

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
                {formatJobType(job.jobType)}
            </span>
          </div>
        </div>
        <Link className="button button--primary job-detail-apply-link" to={alreadyApplied ? '/seeker/applications' : detailPath}>{alreadyApplied ? 'View application' : 'Apply Now'}</Link>
      </div>
    </article>
  );
}

export default JobDetailsPage;
