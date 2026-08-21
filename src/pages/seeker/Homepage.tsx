import { Link } from 'react-router-dom';
import {
  FaBell,
  FaBookmark,
  FaBriefcase,
  FaChevronRight,
  FaDownload,
  FaEdit,
  FaFilePdf,
  FaFilter,
  FaSearch,
  FaUserFriends,
} from 'react-icons/fa';
import SeekerJobCard from '../../components/jobs/SeekerJobCard';
import { useJobStore } from '../../context/JobStoreContext';

const filters = ['Remote', 'Full-time', 'Design', 'New York', '$100k+'];

const stats = [
  { icon: <FaBriefcase />, value: '12', label: 'Applied Jobs', tone: 'green' },
  { icon: <FaUserFriends />, value: '4', label: 'Interviews', tone: 'yellow' },
  { icon: <FaBookmark />, value: '8', label: 'Saved Jobs', tone: 'blue' },
];

function Homepage() {
  const { visibleJobs } = useJobStore();
  const recommendedJobs = visibleJobs.slice(0, 2);

  return (
    <div className="seeker-home">
      <section className="seeker-hero">
        <div className="seeker-hero__top">
          <div className="seeker-profile">
            <div className="seeker-profile__avatar" aria-hidden="true">SJ</div>
            <div>
              <h1>Hi, Sarah!</h1>
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
            <strong>82%</strong>
          </div>
          <div className="seeker-progress__bar" aria-hidden="true">
            <span />
          </div>
          <div className="seeker-progress__footer">
            <p>Almost there! Complete a few more sections.</p>
            <Link to="/seeker/profile">
              View suggestions
              <FaChevronRight />
            </Link>
          </div>
        </section>

        <section className="seeker-card seeker-recommendations">
          <div className="seeker-section-heading">
            <h2>Recommended jobs</h2>
            <Link to="/seeker/jobs">
              View all
              <FaChevronRight />
            </Link>
          </div>
          <div className="seeker-job-list">
            {recommendedJobs.map((job) => (
              <SeekerJobCard job={job} key={job.id} />
            ))}
          </div>
        </section>

        <section className="seeker-card seeker-resume">
          <div className="seeker-section-heading">
            <h2>Resume / CV</h2>
          </div>
          <div className="seeker-resume__body">
            <span className="seeker-resume__icon"><FaFilePdf /></span>
            <div>
              <strong>Sarah_Johnson_Resume.pdf</strong>
              <p>Updated on May 20, 2024</p>
            </div>
            <div className="seeker-resume__actions">
              <button type="button"><FaEdit /> Edit CV</button>
              <button type="button"><FaDownload /> Download</button>
            </div>
          </div>
        </section>

        <section className="seeker-card seeker-stats" aria-label="Application overview">
          {stats.map((stat) => (
            <article key={stat.label}>
              <span className={`seeker-stat-icon seeker-stat-icon--${stat.tone}`}>{stat.icon}</span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </article>
          ))}
        </section>

        <section className="seeker-card seeker-portfolio">
          <div className="seeker-section-heading">
            <h2>Portfolio highlights</h2>
            <Link to="/seeker/profile">
              View portfolio
              <FaChevronRight />
            </Link>
          </div>
          <div className="seeker-portfolio__grid" aria-label="Portfolio project previews">
            <span className="seeker-portfolio__thumb seeker-portfolio__thumb--one" />
            <span className="seeker-portfolio__thumb seeker-portfolio__thumb--two" />
            <span className="seeker-portfolio__thumb seeker-portfolio__thumb--three" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Homepage;
