import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBriefcase,
  FaChevronRight,
  FaDownload,
  FaEdit,
  FaFilePdf,
  FaSearch,
  FaUserFriends,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getSeekerProfile, request, type SeekerDashboardData, type SeekerDashboardJob, type SeekerDashboardResponse, type GetSeekerProfileResponse } from '../../services/api';

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
}).format(new Date(value));

const formatJobType = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

const formatCompensation = (job: SeekerDashboardJob) => {
  if (!job.compensation) return 'Compensation not specified';

  if (job.compensation.type === 'FREELANCE') {
    return `${job.compensation.currency} ${job.compensation.projectAmount} project`;
  }

  const minimum = job.compensation.salaryMin ?? 'Not specified';
  const maximum = job.compensation.salaryMax ?? 'Not specified';
  return `${job.compensation.currency} ${minimum} - ${maximum} / ${job.compensation.salaryPeriod.toLowerCase()}`;
};

const getInitials = (name: string) => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const formatStatus = (status: string) => status
  .toLowerCase()
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (character) => character.toUpperCase());

function ApprovedJobCard({ job }: { job: SeekerDashboardJob }) {
  const companyName = job.company?.name ?? 'Company not provided';
  const logoUrl = job.company?.logoUrl;

  return (
    <article className="seeker-job-card">
      <Link className="seeker-job-card__body-link" to={`/seeker/jobs/${job.id}`} aria-label={`View ${job.title} at ${companyName}`}>
        {logoUrl ? (
          <img className="company-logo seeker-job-card__logo" src={logoUrl} alt="" />
        ) : (
          <span className="company-logo seeker-job-card__logo" aria-hidden="true">{getInitials(companyName)}</span>
        )}
        <div className="seeker-job-card__content">
          <div className="seeker-job-card__top">
            <h3>{companyName}</h3>
          </div>
          <h4>{job.title}</h4>
          <p>{formatCompensation(job)} <span /> {job.location}</p>
          <div className="seeker-job-card__tags">
            <small className="seeker-tag seeker-tag--0">{formatJobType(job.jobType)}</small>
            {job.company?.industry ? <small className="seeker-tag seeker-tag--1">{job.company.industry}</small> : null}
          </div>
          <p className="seeker-job-card__description">{job.description}</p>
        </div>
      </Link>
      <div className="seeker-job-card__actions">
        <Link className="seeker-job-card__apply-btn seeker-job-card__apply-btn--primary" to={`/seeker/applications?jobId=${job.id}&apply=true`}>Apply Now</Link>
        <Link className="seeker-job-card__details-link" to={`/seeker/jobs/${job.id}`}>View Details</Link>
      </div>
    </article>
  );
}

function Homepage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<SeekerDashboardData | null>(null);
  const [profileState, setProfileState] = useState<GetSeekerProfileResponse['data']['profile'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!token) {
        setIsLoading(false);
        setError('Your session could not be loaded. Please sign in again.');
        return;
      }

      setIsLoading(true);
      setError('');

      const [dashboardResult, profileResult] = await Promise.all([
        request<SeekerDashboardResponse>({
          method: 'GET',
          endpoint: '/seeker/dashboard',
          token,
        }),
        getSeekerProfile(token),
      ]);

      if (!isMounted) return;

      if (!dashboardResult.ok) {
        setError(dashboardResult.error.message || 'We could not load your dashboard right now. Please try again.');
        setDashboard(null);
      } else {
        setDashboard(dashboardResult.data.data);
      }

      if (profileResult.ok) {
        setProfileState(profileResult.data.data.profile);
      } else {
        setProfileState(null);
      }

      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [token, retryKey]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValue = searchValue.trim();
    navigate(trimmedValue ? `/seeker/jobs?search=${encodeURIComponent(trimmedValue)}` : '/seeker/jobs');
  };

  const profile = dashboard?.profile;
  const fullName = profile?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Welcome back';
  const profileCompletion = profile?.profileCompletion ?? 0;
  const resumeUrl = profile?.resume?.url ?? profileState?.resumeUrl ?? null;
  const hasStructuredCv = Boolean(
    profileState && (
      profileState.professionalTitle?.trim()
      || profileState.bio?.trim()
      || profileState.linkedinUrl?.trim()
      || profileState.cvTemplate
      || (profileState.skills?.length ?? 0) > 0
      || (profileState.experience?.length ?? 0) > 0
      || (profileState.education?.length ?? 0) > 0
      || (profileState.certifications?.length ?? 0) > 0
      || (profileState.languages?.length ?? 0) > 0
      || (profileState.projects?.length ?? 0) > 0
    )
  );
  const cvStatus = resumeUrl
    ? { title: 'CV available', description: 'Your uploaded CV is ready to view and download.' }
    : hasStructuredCv
      ? { title: 'CV profile ready', description: 'Your CV is ready to edit and update.' }
      : { title: 'No CV uploaded yet', description: 'Create or upload your CV to start your job search.' };
  const stats = dashboard ? [
    { icon: <FaBriefcase />, value: dashboard.stats.appliedJobs, label: 'Applied Jobs', tone: 'blue' },
    { icon: <FaUserFriends />, value: dashboard.stats.interviews, label: 'Interviews', tone: 'gold' },
  ] : [];

  const renderSkeletonCard = (className: string) => (
    <div className={`${className} is-skeleton`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );

  return (
    <div className="seeker-home">
      <header className="seeker-home__header">
        <div className="seeker-home__greeting">
          <div className="seeker-home__avatar" aria-hidden="true">{getInitials(fullName)}</div>
          <div className="seeker-home__identity">
            <p className="seeker-home__eyebrow">Welcome back</p>
            <h1>{fullName === 'Welcome back' ? fullName : `${fullName}`}</h1>
          </div>
        </div>
      </header>

      <form className="seeker-home__search" onSubmit={handleSearchSubmit}>
        <label className="seeker-home__search-label" htmlFor="dashboard-search">
          <FaSearch aria-hidden="true" />
          <span className="sr-only">Search jobs</span>
        </label>
        <input
          id="dashboard-search"
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search jobs, companies or roles"
          aria-label="Search jobs, companies or roles"
        />
        <button type="submit">Search</button>
      </form>

      <div className="seeker-home__content">
        <section className="seeker-card seeker-progress" aria-labelledby="profile-completion-heading">
          <div className="seeker-section-heading">
            <div>
              <p className="seeker-card__label">Overview</p>
              <h2 id="profile-completion-heading">Profile completion</h2>
            </div>
            <strong>{isLoading ? '...' : `${profileCompletion}%`}</strong>
          </div>
          <div className="seeker-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion} aria-label="Profile completion percentage">
            <span style={{ width: `${profileCompletion}%` }} />
          </div>
          <div className="seeker-progress__footer">
            <p>{error || (profile ? 'Keep your profile current for better opportunities.' : 'Complete your profile to help employers learn more about you.')}</p>
            <Link to="/seeker/profile">
              View Profile
              <FaChevronRight />
            </Link>
          </div>
        </section>

        <section className="seeker-card seeker-cv" aria-labelledby="cv-header">
          <div className="seeker-section-heading">
            <div>
              <p className="seeker-card__label">Profile</p>
              <h2 id="cv-header">CV / Resume</h2>
            </div>
          </div>

          {isLoading ? (
            renderSkeletonCard('seeker-cv__skeleton')
          ) : (
            <div className="seeker-cv__body">
              <div className="seeker-cv__summary">
                <span className="seeker-cv__icon" aria-hidden="true"><FaFilePdf /></span>
                <div>
                  <strong>{cvStatus.title}</strong>
                  <p>{cvStatus.description}</p>
                </div>
              </div>

              <div className="seeker-cv__actions">
                <Link className="seeker-button seeker-button--primary" to="/seeker/profile#seeker-profile-editor">
                  <FaEdit />
                  Edit CV
                </Link>
                {resumeUrl ? (
                  <a className="seeker-button seeker-button--secondary" href={resumeUrl} target="_blank" rel="noreferrer" download>
                    <FaDownload />
                    Download
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="seeker-card seeker-stats" aria-label="Application overview">
          {isLoading ? (
            <>
              {renderSkeletonCard('seeker-stats__skeleton')}
              {renderSkeletonCard('seeker-stats__skeleton')}
            </>
          ) : error ? null : stats.map((stat) => (
            <article key={stat.label}>
              <span className={`seeker-stat-icon seeker-stat-icon--${stat.tone}`}>{stat.icon}</span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </article>
          ))}
        </section>

        <section className="seeker-card seeker-portfolio" aria-labelledby="recent-applications-heading">
          <div className="seeker-section-heading">
            <div>
              <p className="seeker-card__label">Activity</p>
              <h2 id="recent-applications-heading">Recent applications</h2>
            </div>
            <Link to="/seeker/applications">
              View Applications
              <FaChevronRight />
            </Link>
          </div>

          {isLoading ? (
            renderSkeletonCard('seeker-portfolio__skeleton')
          ) : error ? (
            <div className="seeker-card__empty-state" role="alert">
              <p>We couldn’t load your recent applications right now.</p>
              <button type="button" className="seeker-button seeker-button--secondary" onClick={() => setRetryKey((current) => current + 1)}>Retry</button>
            </div>
          ) : dashboard && dashboard.recentApplications.length === 0 ? (
            <div className="seeker-card__empty-state">
              <p>No applications yet.</p>
              <Link className="seeker-button seeker-button--secondary" to="/seeker/jobs">Browse jobs</Link>
            </div>
          ) : (
            <div className="seeker-portfolio__grid">
              {dashboard?.recentApplications.map((application) => (
                <article className="seeker-portfolio__project" key={application.id}>
                  <div className="seeker-portfolio__project-top">
                    <span className="seeker-portfolio__employer">{application.companyName ?? 'Company not provided'}</span>
                    <small>{formatDate(application.appliedAt)}</small>
                  </div>
                  <h3>{application.jobTitle}</h3>
                  <div className="seeker-portfolio__meta">
                    <span className={`seeker-portfolio__status seeker-portfolio__status--${application.status.toLowerCase()}`}>{formatStatus(application.status)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="seeker-card seeker-recommendations" aria-labelledby="approved-jobs-heading">
          <div className="seeker-section-heading">
            <div>
              <p className="seeker-card__label">Discover</p>
              <h2 id="approved-jobs-heading">Approved jobs</h2>
            </div>
            <Link to="/seeker/jobs">
              View all
              <FaChevronRight />
            </Link>
          </div>

          {isLoading ? (
            renderSkeletonCard('seeker-job-list__skeleton')
          ) : error ? (
            <div className="seeker-card__empty-state" role="alert">
              <p>We couldn’t load the latest job opportunities.</p>
              <button type="button" className="seeker-button seeker-button--secondary" onClick={() => setRetryKey((current) => current + 1)}>Retry</button>
            </div>
          ) : dashboard && dashboard.approvedJobs.length === 0 ? (
            <div className="seeker-card__empty-state">
              <p>No approved jobs are available right now.</p>
            </div>
          ) : (
            <div className="seeker-job-list">
              {dashboard?.approvedJobs.slice(0, 2).map((job) => (
                <ApprovedJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Homepage;
