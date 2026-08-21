import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBell,
  FaChevronDown,
  FaChevronRight,
  FaFilter,
  FaSearch,
  FaSlidersH,
  FaStar,
  FaSortAmountDown,
} from 'react-icons/fa';
import SeekerJobCard from '../../components/jobs/SeekerJobCard';
import { useJobStore } from '../../context/JobStoreContext';
import { useSubscriptions } from '../../context/SubscriptionContext';

const filters = ['Remote', 'Full-time', 'Design', 'New York', '$100k+'];

function JobsPage() {
  const { visibleJobs } = useJobStore();
  const { getVisibilityBoost } = useSubscriptions();
  const visibilityBoost = getVisibilityBoost('sarah-johnson');
  const [sortBy, setSortBy] = useState('relevant');

  const sortedJobs = useMemo(() => {
    const jobs = [...visibleJobs];

    if (sortBy === 'newest') return jobs.sort((first, second) => second.postedAt - first.postedAt);
    if (sortBy === 'salary') return jobs.sort((first, second) => second.salaryHigh - first.salaryHigh);
    if (sortBy === 'applicants') return jobs.sort((first, second) => second.applicants - first.applicants);

    return jobs.sort((first, second) => Number(Boolean(second.featured)) - Number(Boolean(first.featured)));
  }, [sortBy, visibleJobs]);

  return (
    <div className="seeker-jobs-page">
      <section className="seeker-jobs-hero">
        <div className="seeker-hero__top">
          <div className="seeker-profile">
            <div className="seeker-profile__avatar" aria-hidden="true">SJ</div>
            <div>
              <h1>Find Jobs</h1>
              <p>Discover opportunities that fit you</p>
            </div>
          </div>
          <button className="seeker-icon-button seeker-icon-button--alert" type="button" aria-label="Notifications">
            <FaBell />
          </button>
        </div>

        <label className="seeker-search" aria-label="Search jobs, companies or keywords">
          <FaSearch />
          <input type="search" placeholder="Search for jobs, companies or keywords" />
        </label>

        <div className="seeker-filter-row">
          {filters.map((filter) => (
            <button type="button" key={filter}>{filter}</button>
          ))}
          <button className="seeker-filter-row__control" type="button" aria-label="Advanced filters">
            <FaSlidersH />
          </button>
        </div>
      </section>

      <main className="seeker-jobs-content">
        <section className="seeker-jobs-toolbar" aria-label="Job sorting and filters">
          <label className="seeker-jobs-toolbar__sort">
            <FaSortAmountDown />
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort jobs">
              <option value="relevant">Most Relevant</option>
              <option value="newest">Newest</option>
              <option value="salary">Highest Salary</option>
              <option value="applicants">Most Applicants</option>
            </select>
            <FaChevronDown className="seeker-jobs-toolbar__sort-chevron" />
          </label>
          <button type="button" className="seeker-jobs-toolbar__filter">
            <FaFilter />
            <span>Filters</span>
          </button>
        </section>

        <section className="seeker-card seeker-jobs-results">
          <div className="seeker-section-heading">
            <h2>Featured jobs</h2>
            <Link to="/seeker/jobs">
              View all
              <FaChevronRight />
            </Link>
          </div>

          <div className="seeker-job-list seeker-job-list--jobs-page">
            {sortedJobs.map((job) => (
              <SeekerJobCard job={job} listing key={job.id} />
            ))}
          </div>
        </section>

      </main>

      <aside className="seeker-jobs-profile-match" aria-label="Profile match summary">
        <div className="seeker-jobs-profile-match__icon"><FaStar /></div>
        <div>
          <span>Profile match</span>
          <strong>{visibleJobs.length} roles available</strong>
          <p>{visibleJobs.filter((job) => job.workArrangement === 'Remote').length} remote-friendly roles prioritized</p>
          <small className="seeker-jobs-profile-match__boost">Your profile visibility boost: +{visibilityBoost}%</small>
        </div>
        <div className="seeker-jobs-profile-match__progress" aria-hidden="true"><span style={{ width: `${visibleJobs.length ? 78 : 0}%` }} /></div>
      </aside>
    </div>
  );
}

export default JobsPage;
