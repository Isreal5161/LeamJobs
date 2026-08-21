import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBookmark, FaBuilding, FaCheck, FaChevronRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import CompanyLogo from '../../components/jobs/CompanyLogo';
import { useJobStore } from '../../context/JobStoreContext';

const skillClasses = ['job-detail-skill--pink', 'job-detail-skill--purple', 'job-detail-skill--green', 'job-detail-skill--yellow', 'job-detail-skill--blue'];

function JobDetailsPage() {
  const { jobId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isSeekerRoute = pathname.startsWith('/seeker/');
  const { visibleJobs } = useJobStore();
  const job = visibleJobs.find((item) => item.id === jobId);

  if (!job) {
    return <Navigate to={isSeekerRoute ? '/seeker/jobs' : '/'} replace />;
  }

  const details = job.details;

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
          <button type="button" className="job-detail-icon-button" aria-label={`Save ${job.company} ${job.role}`}>
            <FaBookmark />
          </button>
        </div>
      </header>

      <div className="job-detail-layout">
        <section className="job-detail-summary card" aria-label={`${job.role} at ${job.company}`}>
          <CompanyLogo company={job.company} logoText={job.logoText} logoClass={job.logoClass} />
          <div className="job-detail-summary__content">
            <div className="job-detail-summary__top">
              <h2>{job.role}</h2>
              {job.featured && (
                <span className="job-detail-featured">
                  <FaCheck />
                  Featured
                </span>
              )}
            </div>
            <p className="job-detail-company">{job.company}</p>
            <p className="job-detail-meta">
              <span>{job.salary}</span>
              <span>{job.location}</span>
            </p>
            <div className="job-detail-tags">
              <span className="job-tag job-tag--yellow">{job.workType}</span>
              <span className="job-tag job-tag--lavender">{job.level}</span>
              <span className="job-tag job-tag--blue">{job.workArrangement}</span>
            </div>
          </div>
        </section>

        <main className="job-detail-main">
          <section className="job-detail-section">
            <h2>Job Description</h2>
            <p>{details.overview}</p>
          </section>

          <section className="job-detail-section">
            <h2>Responsibilities</h2>
            <ul className="job-detail-check-list">
              {details.responsibilities.map((item) => (
                <li key={item}>
                  <FaCheck />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="job-detail-section">
            <h2>Requirements</h2>
            <ul className="job-detail-check-list">
              {details.requirements.map((item) => (
                <li key={item}>
                  <FaCheck />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="job-detail-section">
            <h2>Required Skills</h2>
            <div className="job-detail-skills">
              {details.skills.map((skill, index) => (
                <span key={skill} className={`job-detail-skill ${skillClasses[index % skillClasses.length]}`}>
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="job-detail-company-card card">
            <CompanyLogo company={job.company} logoText={job.logoText} logoClass={job.logoClass} />
            <div>
              <h2>About {job.company}</h2>
              <p>{details.company}</p>
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
            <p>{isSeekerRoute ? 'Review this role and start your application when you are ready.' : 'Create a free account or sign in to start your application for this role.'}</p>
            <div className="job-detail-quick-facts">
              <span>
                <FaMapMarkerAlt />
                {job.location}
              </span>
              <span>
                <FaClock />
                Posted {job.postedAt} days ago
              </span>
              <span>
                <FaBuilding />
                {job.workArrangement}
              </span>
            </div>
            <Link className="button button--primary job-detail-apply-link" to={isSeekerRoute ? '/seeker/applications' : '/register'}>
              Apply Now
            </Link>
          </div>
        </aside>
      </div>

      <div className="job-detail-bottom-cta">
        <div className="job-detail-mobile-apply-card">
          <h2>Ready to apply?</h2>
          <p>{isSeekerRoute ? 'Review this role and start your application when you are ready.' : 'Create a free account or sign in to start your application for this role.'}</p>
          <div className="job-detail-quick-facts">
            <span>
              <FaMapMarkerAlt />
              {job.location}
            </span>
            <span>
              <FaClock />
              Posted {job.postedAt} days ago
            </span>
            <span>
              <FaBuilding />
              {job.workArrangement}
            </span>
          </div>
        </div>
        <Link className="button button--primary job-detail-apply-link" to={isSeekerRoute ? '/seeker/applications' : '/register'}>
          Apply Now
        </Link>
      </div>
    </article>
  );
}

export default JobDetailsPage;
