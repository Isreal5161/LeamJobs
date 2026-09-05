import { useEffect, useState } from 'react';
import { FaBell, FaChevronDown, FaChevronRight, FaFilter, FaSearch, FaSlidersH, FaSortAmountDown } from 'react-icons/fa';
import SeekerJobCard from '../../components/jobs/SeekerJobCard';
import { useAuth } from '../../context/AuthContext';
import { getSeekerJobs, getSeekerRecommendations, type SeekerJobListItem, type SeekerRecommendation } from '../../services/api';

function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<SeekerJobListItem[]>([]);
  const [recommendations, setRecommendations] = useState<SeekerRecommendation[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<'' | 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT'>('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('Your session could not be loaded. Please sign in again.');
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');
    setJobs([]);
    setNextCursor(null);

    void getSeekerJobs({ search, location, jobType: jobType || undefined, limit: 25 }, token).then((result) => {
      if (!isMounted) return;
      if (!result.ok) setError(result.error.message || 'We could not load jobs.');
      else {
        setJobs(result.data.data.jobs);
        setNextCursor(result.data.data.nextCursor);
      }
      setIsLoading(false);
    });
    if (!search && !location && !jobType) {
      void getSeekerRecommendations({ limit: 6 }, token).then((result) => {
        if (isMounted && result.ok) setRecommendations(result.data.data.recommendations);
      });
    } else {
      setRecommendations([]);
    }

    return () => { isMounted = false; };
  }, [token, search, location, jobType, retryKey]);

  const loadMore = async () => {
    if (!token || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const result = await getSeekerJobs({ search, location, jobType: jobType || undefined, limit: 25, cursor: nextCursor }, token);
    if (result.ok) {
      setJobs((current) => [...current, ...result.data.data.jobs.filter((job) => !current.some((item) => item.id === job.id))]);
      setNextCursor(result.data.data.nextCursor);
    } else setError(result.error.message || 'We could not load more jobs.');
    setIsLoadingMore(false);
  };

  return (
    <div className="seeker-jobs-page">
      <section className="seeker-jobs-hero">
        <div className="seeker-hero__top"><div className="seeker-profile"><div className="seeker-profile__avatar" aria-hidden="true">JB</div><div><h1>Find Jobs</h1><p>Discover approved opportunities</p></div></div><button className="seeker-icon-button seeker-icon-button--alert" type="button" aria-label="Notifications"><FaBell /></button></div>
        <label className="seeker-search" aria-label="Search jobs, companies or keywords"><FaSearch /><input type="search" placeholder="Search for jobs, companies or keywords" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /></label>
        <div className="seeker-filter-row"><input aria-label="Filter by location" placeholder="Location" value={location} onChange={(event) => setLocation(event.target.value)} /><select aria-label="Filter by job type" value={jobType} onChange={(event) => setJobType(event.target.value as typeof jobType)}><option value="">All job types</option><option value="NORMAL_EMPLOYMENT">Employment</option><option value="FREELANCE_PROJECT">Freelance projects</option></select><button className="seeker-filter-row__control" type="button" aria-label="Filters"><FaSlidersH /></button></div>
      </section>
      <main className="seeker-jobs-content">
        <section className="seeker-jobs-toolbar" aria-label="Job sorting and filters"><label className="seeker-jobs-toolbar__sort"><FaSortAmountDown /><span>Sort by</span><select aria-label="Sort jobs" value="newest" disabled><option value="newest">Newest</option></select><FaChevronDown className="seeker-jobs-toolbar__sort-chevron" /></label><button type="button" className="seeker-jobs-toolbar__filter" onClick={() => document.querySelector<HTMLInputElement>('[aria-label="Filter by location"]')?.focus()}><FaFilter /><span>Filters</span></button></section>
        {!isLoading && !error && !search && !location && !jobType && recommendations.length > 0 && <section className="seeker-card seeker-jobs-results"><div className="seeker-section-heading"><h2>Recommended jobs</h2><span>Based on your skills</span></div><div className="seeker-job-list seeker-job-list--jobs-page">{recommendations.map((recommendation) => <SeekerJobCard key={recommendation.job.id} job={recommendation.job} listing matchScore={recommendation.matchScore} matchedSkills={recommendation.matchedSkills} />)}</div></section>}
        <section className="seeker-card seeker-jobs-results"><div className="seeker-section-heading"><h2>Approved jobs</h2><span>{jobs.length} loaded</span></div>
          {isLoading ? <p className="payment-copy">Loading approved jobs...</p> : error ? <div role="alert"><p className="payment-copy">{error}</p><button type="button" onClick={() => setRetryKey((current) => current + 1)}>Retry</button></div> : jobs.length === 0 ? <p className="payment-copy">No approved jobs are available right now.</p> : <><div className="seeker-job-list seeker-job-list--jobs-page">{jobs.map((job) => <SeekerJobCard job={job} listing key={job.id} />)}</div>{nextCursor && <button type="button" onClick={loadMore} disabled={isLoadingMore}>{isLoadingMore ? 'Loading...' : 'Load more jobs'}</button>}</>}
        </section>
      </main>
      <aside className="seeker-jobs-profile-match" aria-label="Job results summary"><div><span>Approved jobs</span><strong>{jobs.length} roles loaded</strong><p>Only approved jobs are shown.</p></div><FaChevronRight /></aside>
    </div>
  );
}

export default JobsPage;
