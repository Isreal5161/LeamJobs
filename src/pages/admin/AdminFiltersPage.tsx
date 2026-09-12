import { useEffect, useMemo, useState } from 'react';
import { FaFilter, FaLayerGroup } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminJobs, type AdminJob } from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort();

function AdminFiltersPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    void getAdminJobs(token).then((result) => {
      if (!active) return;
      if (!result.ok) setError(result.error.message);
      else setJobs(result.data.data.jobs);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  const filters = useMemo(() => ({
    locations: unique(jobs.map((job) => job.location)),
    jobTypes: unique(jobs.map((job) => job.jobType)),
    engagements: unique(jobs.map((job) => job.engagementType)),
    arrangements: unique(jobs.map((job) => job.workArrangement ?? '')),
    skills: unique(jobs.flatMap((job) => job.skills)),
  }), [jobs]);

  return <div className="admin-page"><section className="admin-hero"><div><span className="admin-eyebrow"><FaFilter /> Filters</span><h1>Live marketplace filters</h1><p>These options are derived from real job records. Configuration persistence is not enabled because no filter configuration model exists.</p></div></section>{isLoading ? <AdminPageSkeleton showToolbar={false} statCards={0} rows={3} /> : null}{!isLoading && error ? <section className="admin-panel admin-analytics-message admin-analytics-message--error">{error}</section> : null}{!isLoading && !error ? <section className="admin-grid admin-filters-workspace">{Object.entries(filters).map(([name, values]) => <article className="admin-panel" key={name}><div className="admin-section-heading"><div><span><FaLayerGroup /> {name}</span><h2>{values.length} values from live jobs</h2></div></div>{values.length ? <div className="admin-token-list">{values.map((value) => <span key={value}>{value}</span>)}</div> : <p className="admin-empty-state">No values available.</p>}</article>)}</section> : null}</div>;
}

export default AdminFiltersPage;
