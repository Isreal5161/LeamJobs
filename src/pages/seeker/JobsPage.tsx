import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import SeekerJobCard from '../../components/jobs/SeekerJobCard';
import { useAuth } from '../../context/AuthContext';
import { getSeekerJobs, getSeekerRecommendations, type SeekerJobListItem, type SeekerRecommendation } from '../../services/api';

function JobsPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<SeekerJobListItem[]>([]);
  const [recommendations, setRecommendations] = useState<SeekerRecommendation[]>([]);
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '');
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [locationInput, setLocationInput] = useState(() => searchParams.get('location') ?? '');
  const [location, setLocation] = useState(() => searchParams.get('location') ?? '');
  const [jobType, setJobType] = useState<'' | 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT'>(() => (searchParams.get('jobType') as '' | 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT') || '');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initials = fullName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ME';
  const activeFilterCount = Number(Boolean(location)) + Number(Boolean(jobType));

  const updateQuery = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      setSearch(nextSearch);
      updateQuery({ q: nextSearch });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextLocation = locationInput.trim();
      setLocation(nextLocation);
      updateQuery({ location: nextLocation });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [locationInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const nextSearch = searchParams.get('q') ?? '';
    const nextLocation = searchParams.get('location') ?? '';
    const nextJobType = (searchParams.get('jobType') as typeof jobType) || '';
    if (nextSearch !== searchInput) setSearchInput(nextSearch);
    if (nextSearch !== search) setSearch(nextSearch);
    if (nextLocation !== locationInput) setLocationInput(nextLocation);
    if (nextLocation !== location) setLocation(nextLocation);
    if (nextJobType !== jobType) setJobType(nextJobType);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFilterOpen]);

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

  const clearFilters = () => {
    setLocationInput('');
    setLocation('');
    setJobType('');
    updateQuery({ location: '', jobType: '' });
    setIsFilterOpen(false);
  };

  const friendlyError = error.toLowerCase().includes('401') || error.toLowerCase().includes('unauthorized')
    ? 'Your session has expired. Please sign in again.'
    : 'We could not load jobs right now. Please try again.';

  const renderFilterFields = () => (
    <>
      <label className="seeker-filter-field">
        <span>Location</span>
        <input aria-label="Filter by location" placeholder="Any location" value={locationInput} onChange={(event) => setLocationInput(event.target.value)} />
      </label>
      <label className="seeker-filter-field">
        <span>Job type</span>
        <select aria-label="Filter by job type" value={jobType} onChange={(event) => {
          const nextJobType = event.target.value as typeof jobType;
          setJobType(nextJobType);
          updateQuery({ jobType: nextJobType });
        }}>
          <option value="">All job types</option>
          <option value="NORMAL_EMPLOYMENT">Employment</option>
          <option value="FREELANCE_PROJECT">Freelance projects</option>
        </select>
      </label>
    </>
  );

  const renderSkeletons = () => <div className="seeker-job-list" aria-label="Loading jobs" aria-live="polite">{[1, 2, 3].map((item) => <div className="seeker-job-skeleton" key={item}><span /><div><i /><i /><i /></div></div>)}</div>;

  const emptyMessage = search || location || jobType
    ? search
      ? 'No jobs match your search.'
      : 'No jobs match these filters.'
    : 'No approved jobs are available right now.';

  return (
    <div className="seeker-jobs-page">
      <section className="seeker-jobs-hero">
        <div className="seeker-hero__top"><div className="seeker-profile"><div className="seeker-profile__avatar" aria-hidden="true">{initials}</div><div><h1>Find Jobs</h1><p>Discover approved opportunities</p></div></div></div>
        <label className="seeker-search" aria-label="Search jobs, companies or keywords"><FaSearch /><input type="search" placeholder="Search jobs, companies or keywords" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />{searchInput && <button type="button" className="seeker-search__clear" aria-label="Clear search" onClick={() => setSearchInput('')}><FaTimes /></button>}</label>
        <div className="seeker-filter-row"><div className="seeker-filter-fields">{renderFilterFields()}</div><button className="seeker-filter-trigger" type="button" onClick={() => setIsFilterOpen(true)}><FaFilter /><span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span></button>{activeFilterCount > 0 && <button className="seeker-filter-clear" type="button" onClick={clearFilters}>Clear filters</button>}</div>
      </section>
      <main className="seeker-jobs-content">
        <div className="seeker-jobs-toolbar"><div><strong>{isLoading ? 'Finding jobs...' : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`}</strong>{(search || location || jobType) && <span>{search ? `Showing results for “${search}”` : 'Showing filtered results'}</span>}</div></div>
        {!isLoading && !error && !search && !location && !jobType && recommendations.length > 0 && <section className="seeker-card seeker-jobs-results seeker-jobs-results--recommended"><div className="seeker-section-heading"><div><h2>Recommended for you</h2><span>Based on your skills and profile</span></div></div><div className="seeker-job-list seeker-job-list--jobs-page">{recommendations.filter((recommendation) => !jobs.some((job) => job.id === recommendation.job.id)).map((recommendation) => <SeekerJobCard key={recommendation.job.id} job={recommendation.job} listing showBookmark={false} matchScore={recommendation.matchScore} matchedSkills={recommendation.matchedSkills} />)}</div></section>}
        <section className="seeker-card seeker-jobs-results"><div className="seeker-section-heading"><h2>Approved jobs</h2><span>Verified opportunities</span></div>
          {isLoading ? renderSkeletons() : error ? <div className="seeker-jobs-error" role="alert"><p>{friendlyError}</p><button type="button" onClick={() => setRetryKey((current) => current + 1)}>Retry</button></div> : jobs.length === 0 ? <div className="seeker-jobs-empty"><p>{emptyMessage}</p>{(search || location || jobType) && <button type="button" onClick={() => { setSearchInput(''); clearFilters(); }}>Clear search and filters</button>}</div> : <><div className="seeker-job-list seeker-job-list--jobs-page">{jobs.map((job) => <SeekerJobCard job={job} listing showBookmark={false} key={job.id} />)}</div>{nextCursor ? <button className="seeker-jobs-load-more" type="button" onClick={loadMore} disabled={isLoadingMore}>{isLoadingMore ? 'Loading more jobs...' : 'Load more jobs'}</button> : <p className="seeker-jobs-end">You’ve reached the end of the results.</p>}</>}
        </section>
      </main>
      {isFilterOpen && <div className="seeker-filter-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsFilterOpen(false); }}><section className="seeker-filter-modal" role="dialog" aria-modal="true" aria-labelledby="seeker-filter-title"><div className="seeker-filter-modal__header"><h2 id="seeker-filter-title">Filter jobs</h2><button type="button" aria-label="Close filters" onClick={() => setIsFilterOpen(false)}><FaTimes /></button></div><div className="seeker-filter-modal__fields"><div className="seeker-filter-fields">{renderFilterFields()}</div></div><div className="seeker-filter-modal__actions"><button type="button" className="seeker-filter-clear" onClick={clearFilters}>Clear filters</button><button type="button" className="seeker-filter-apply" onClick={() => setIsFilterOpen(false)}>Show jobs</button></div></section></div>}
    </div>
  );
}

export default JobsPage;
