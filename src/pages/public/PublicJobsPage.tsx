import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRedo, FaSearch, FaSpinner } from 'react-icons/fa';
import SeekerJobCard from '../../components/jobs/SeekerJobCard';
import { getPublicJobs, type SeekerJobListItem } from '../../services/api';

const PAGE_SIZE = 25;

function PublicJobsPage() {
  const [jobs, setJobs] = useState<SeekerJobListItem[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    setJobs([]);
    setNextCursor(null);

    void getPublicJobs({ search, limit: PAGE_SIZE }).then((result) => {
      if (!active) return;
      if (!result.ok) setError(result.error.message || 'We could not load public job listings.');
      else {
        setJobs(result.data.data.jobs);
        setNextCursor(result.data.data.nextCursor);
      }
      setIsLoading(false);
    });

    return () => { active = false; };
  }, [search, retryKey]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const result = await getPublicJobs({ search, limit: PAGE_SIZE, cursor: nextCursor });
    if (result.ok) {
      setJobs((current) => {
        const known = new Set(current.map((job) => job.id));
        return [...current, ...result.data.data.jobs.filter((job) => !known.has(job.id))];
      });
      setNextCursor(result.data.data.nextCursor);
    } else setError(result.error.message || 'We could not load more jobs.');
    setIsLoadingMore(false);
  };

  return (
    <main className="public-job-listings-page">
      <header className="public-job-listings-hero">
        <span>Opportunities at LeamJobs</span>
        <h1>Find your next opportunity</h1>
        <p>Explore current job openings and project opportunities from employers on LeamJobs.</p>
        <label className="public-job-listings-search">
          <FaSearch aria-hidden="true" />
          <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search job titles, skills, or locations" />
        </label>
      </header>

      <section className="public-job-listings-results" aria-live="polite" aria-busy={isLoading}>
        <div className="public-job-listings-heading">
          <div><span>Verified opportunities</span><h2>Approved jobs</h2></div>
          {!isLoading && !error ? <strong>{jobs.length}{nextCursor ? '+' : ''} listed</strong> : null}
        </div>
        {isLoading ? <div className="public-job-listings-state" role="status"><FaSpinner className="leamjobs-spin" /> Loading available jobs...</div> : null}
        {!isLoading && error ? (
          <div className="public-job-listings-state" role="alert"><p>{error}</p><button type="button" onClick={() => setRetryKey((value) => value + 1)}><FaRedo /> Try again</button></div>
        ) : null}
        {!isLoading && !error && jobs.length === 0 ? <p className="public-job-listings-state">No matching approved jobs are available right now. Please check back soon.</p> : null}
        {!isLoading && !error && jobs.length > 0 ? (
          <div className="seeker-job-list seeker-job-list--jobs-page">
            {jobs.map((job) => <SeekerJobCard key={job.id} job={job} listing showBookmark={false} publicView />)}
          </div>
        ) : null}
        {!isLoading && !error && nextCursor ? (
          <button className="public-job-listings-more" type="button" onClick={() => void loadMore()} disabled={isLoadingMore}>
            {isLoadingMore ? <FaSpinner className="leamjobs-spin" /> : null}
            {isLoadingMore ? 'Loading more jobs...' : 'Load more jobs'}
          </button>
        ) : null}
      </section>
      <p className="public-job-listings-contact">Need help? <Link to="/contact">Contact LeamJobs support</Link>.</p>
    </main>
  );
}

export default PublicJobsPage;
