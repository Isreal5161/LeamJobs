import { useEffect, useState } from 'react';
import { FaBriefcase, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getAdminJobs, getAdminSeekers, type AdminJob, type AdminSeeker } from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

function AdminRecommendationsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [seekers, setSeekers] = useState<AdminSeeker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    void Promise.all([getAdminJobs(token, 'APPROVED'), getAdminSeekers(token, { limit: 20, sortBy: 'applicationCount', sortOrder: 'desc' })]).then(([jobsResult, seekersResult]) => {
      if (!active) return;
      if (!jobsResult.ok) setError(jobsResult.error.message);
      else setJobs(jobsResult.data.data.jobs);
      if (!seekersResult.ok) setError(seekersResult.error.message);
      else setSeekers(seekersResult.data.data.seekers);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  return <div className="admin-page"><section className="admin-hero"><div><span className="admin-eyebrow">Marketplace curation</span><h1>Marketplace opportunities</h1><p>Approved jobs and active seeker profiles, ordered by real application activity. No AI ranking or match-score logic is presented here.</p></div></section>{isLoading ? <AdminPageSkeleton showToolbar={false} statCards={0} rows={3} /> : null}{!isLoading && error ? <section className="admin-panel admin-analytics-message admin-analytics-message--error">{error}</section> : null}{!isLoading && !error ? <section className="admin-grid"><article className="admin-panel"><div className="admin-section-heading"><div><span><FaBriefcase /> Approved jobs</span><h2>Active job opportunities</h2></div></div>{jobs.length ? <div className="admin-stack">{jobs.map((job) => <div className="admin-recommend-card" key={job.id}><FaBriefcase /><div><strong>{job.title}</strong><p>{job.company?.name ?? 'Company not provided'} / {job.location}</p></div><span>{job.applicantCount} applications</span></div>)}</div> : <p className="admin-empty-state">No approved jobs.</p>}</article><article className="admin-panel"><div className="admin-section-heading"><div><span><FaUsers /> Seeker profiles</span><h2>High-activity seekers</h2></div></div>{seekers.length ? <div className="admin-stack">{seekers.map((seeker) => <div className="admin-recommend-card" key={seeker.id}><FaUsers /><div><strong>{seeker.firstName} {seeker.lastName}</strong><p>{seeker.profile?.professionalTitle ?? 'Title not provided'} / {seeker.profile?.location ?? 'Location not provided'}</p></div><span>{seeker.applicationCount} applications</span></div>)}</div> : <p className="admin-empty-state">No seeker candidates.</p>}</article></section> : null}</div>;
}

export default AdminRecommendationsPage;
