import { useEffect, useState } from 'react';
import { FaBookmark } from 'react-icons/fa';
import SeekerJobCard from '../../components/jobs/SeekerJobCard';
import { useAuth } from '../../context/AuthContext';
import { getSavedJobs, unsaveSeekerJob, type SavedJob } from '../../services/api';

function SavedJobsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void getSavedJobs(token).then((result) => {
      if (result.ok) setItems(result.data.data.items);
      else setError(result.error.message || 'We could not load saved jobs.');
      setIsLoading(false);
    });
  }, [token]);

  const remove = async (jobId: string) => {
    if (!token) return;
    setRemovingId(jobId);
    const result = await unsaveSeekerJob(jobId, token);
    if (result.ok) setItems((current) => current.filter((item) => item.job.id !== jobId));
    else setError(result.error.message || 'We could not remove this saved job.');
    setRemovingId(null);
  };

  return <main className="seeker-layout__main saved-jobs-page">
    <section className="saved-jobs-page__hero"><span><FaBookmark aria-hidden="true" /> Your shortlist</span><h1>Saved jobs</h1><p>Keep promising opportunities together while you decide where to apply.</p></section>
    <section className="seeker-card saved-jobs-page__content" aria-busy={isLoading}>
      {isLoading ? <p role="status">Loading saved jobs...</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!isLoading && !error && !items.length ? <div className="saved-jobs-page__empty"><FaBookmark aria-hidden="true" /><h2>No saved jobs yet</h2><p>Use the bookmark on a job card to keep it here.</p></div> : null}
      {!isLoading && !error && items.length ? <div className="seeker-job-list">{items.map((item) => <div className="saved-jobs-page__item" key={item.id}><SeekerJobCard job={item.job} listing showBookmark saved onToggleBookmark={() => void remove(item.job.id)} /><span className="saved-jobs-page__remove-status">{removingId === item.job.id ? 'Removing...' : ''}</span></div>)}</div> : null}
    </section>
  </main>;
}

export default SavedJobsPage;