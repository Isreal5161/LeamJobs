import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaChevronRight,
  FaDownload,
  FaEdit,
  FaFilePdf,
  FaFilter,
  FaSearch,
  FaUserFriends,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { request, type SeekerDashboardData, type SeekerDashboardJob, type SeekerDashboardResponse } from '../../services/api';

const filters = ['Remote', 'Full-time', 'Design', 'New York', '$100k+'];

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
          <div className="seeker-job-card__top"><h3>{companyName}</h3></div>
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
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<SeekerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      const result = await request<SeekerDashboardResponse>({
        method: 'GET',
        endpoint: '/seeker/dashboard',
        token,
      });

      if (!isMounted) return;

      if (!result.ok) {
        setError(result.error.message || 'We could not load your dashboard. Please try again.');
        setDashboard(null);
      } else {
        setDashboard(result.data.data);
      }

      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const profile = dashboard?.profile;
  const fullName = profile?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Welcome back';
  const profileCompletion = profile?.profileCompletion ?? 0;
  const stats = dashboard ? [
    { icon: <FaBriefcase />, value: dashboard.stats.appliedJobs, label: 'Applied Jobs', tone: 'green' },
    { icon: <FaUserFriends />, value: dashboard.stats.interviews, label: 'Interviews', tone: 'yellow' },
  ] : [];

  return (
    <div className="seeker-home">
      <section className="seeker-hero">
        <div className="seeker-hero__top">
          <div className="seeker-profile">
            <div className="seeker-profile__avatar" aria-hidden="true">{getInitials(fullName)}</div>
            <div>
              <h1>{fullName === 'Welcome back' ? fullName : `Hi, ${fullName}!`}</h1>
              <p>Let's find your next opportunity</p>
            </div>
          </div>
          <button className="seeker-icon-button seeker-icon-button--alert" type="button" aria-label="Notifications">
            <FaBell />
          </button>
        </div>

        <label className="seeker-search" aria-label="Search jobs, companies or roles">
          <FaSearch />
          <input type="search" placeholder="Search jobs, companies or roles" />
        </label>

        <div className="seeker-filter-row">
          {filters.map((filter) => (
            <button type="button" key={filter}>{filter}</button>
          ))}
          <button className="seeker-filter-row__control" type="button" aria-label="Filter jobs">
            <FaFilter />
          </button>
        </div>
      </section>

      <div className="seeker-home__content">
        <section className="seeker-card seeker-progress">
          <div className="seeker-section-heading">
            <h2>Profile completion</h2>
            <strong>{isLoading ? '...' : `${profileCompletion}%`}</strong>
          </div>
          <div className="seeker-progress__bar" aria-hidden="true">
            <span style={{ width: `${profileCompletion}%` }} />
          </div>
          <div className="seeker-progress__footer">
            <p>{error || (profile ? 'Keep your profile current for better opportunities.' : 'Complete your profile to help employers learn more about you.')}</p>
            <Link to="/seeker/profile">
              View suggestions
              <FaChevronRight />
            </Link>
          </div>
        </section>

        <section className="seeker-card seeker-recommendations">
          <div className="seeker-section-heading">
            <h2>Approved jobs</h2>
            <Link to="/seeker/jobs">
              View all
              <FaChevronRight />
            </Link>
          </div>
          <div className="seeker-job-list">
            {isLoading ? <p>Loading approved jobs...</p> : null}
            {!isLoading && !error && dashboard?.approvedJobs.length === 0 ? <p>No approved jobs are available right now.</p> : null}
            {!isLoading && !error ? dashboard?.approvedJobs.slice(0, 2).map((job) => <ApprovedJobCard job={job} key={job.id} />) : null}
          </div>
        </section>

        <section className="seeker-card seeker-resume">
          <div className="seeker-section-heading">
            <h2>Resume / CV</h2>
          </div>
          <div className="seeker-resume__body">
            <span className="seeker-resume__icon"><FaFilePdf /></span>
            {profile?.resume ? <div><strong>Current resume</strong><p>Available from your profile</p></div> : <div><strong>No resume uploaded</strong><p>Add a resume from your profile</p></div>}
            <div className="seeker-resume__actions">
              <Link to="/seeker/profile"><FaEdit /> Edit CV</Link>
              {profile?.resume ? <a href={profile.resume.url} target="_blank" rel="noreferrer"><FaDownload /> Download</a> : null}
            </div>
          </div>
        </section>

        <section className="seeker-card seeker-stats" aria-label="Application overview">
          {isLoading ? <p>Loading application stats...</p> : null}
          {!isLoading && !error ? stats.map((stat) => (
            <article key={stat.label}>
              <span className={`seeker-stat-icon seeker-stat-icon--${stat.tone}`}>{stat.icon}</span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </article>
          )) : null}
        </section>

        <section className="seeker-card seeker-portfolio">
          <div className="seeker-section-heading">
            <h2>Recent applications</h2>
            <Link to="/seeker/applications">View all <FaChevronRight /></Link>
          </div>
          <div className="seeker-portfolio__grid" aria-label="Recent applications">
            {isLoading ? <p>Loading recent applications...</p> : null}
            {!isLoading && !error && dashboard?.recentApplications.length === 0 ? <p>No applications yet.</p> : null}
            {!isLoading && !error ? dashboard?.recentApplications.map((application) => (
              <article className="seeker-portfolio__project" key={application.id}>
                <div className="seeker-portfolio__project-top"><span className="seeker-portfolio__employer">{application.companyName ?? 'Company not provided'}</span><small>{formatDate(application.appliedAt)}</small></div>
                <h3>{application.jobTitle}</h3>
                <p>Status: {application.status}</p>
              </article>
            )) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Homepage;
