import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBriefcase, FaChartLine, FaClock, FaShieldHalved, FaUsers } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import { getAdminAnalytics, type AdminAnalytics } from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';
import '../../styles/admin-overview.css';

function AdminOverviewPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    void getAdminAnalytics(token).then((result) => {
      if (!active) return;
      if (!result.ok) setError(result.error.message);
      else setAnalytics(result.data.data);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  if (isLoading) return <AdminPageSkeleton showToolbar={false} statCards={5} rows={4} />;
  if (error) return <div className="admin-overview-page"><section className="admin-panel admin-analytics-message admin-analytics-message--error">{error}</section></div>;
  if (!analytics) return <div className="admin-overview-page"><section className="admin-panel admin-analytics-message">No overview data available.</section></div>;

  const { summary } = analytics;
  const stats = [
    ['jobs', summary.totalJobs, 'Total jobs', FaBriefcase, '/admin/jobs'],
    ['pending', summary.pendingJobs, 'Pending jobs', FaClock, '/admin/jobs'],
    ['seekers', summary.totalSeekers, 'Seekers', FaUsers, '/admin/seekers'],
    ['employers', summary.totalEmployers, 'Employers', FaUsers, '/admin/companies'],
    ['applications', summary.totalApplications, 'Applications', FaChartLine, '/admin/analytics'],
  ] as const;

  return <div className="admin-overview-page"><section className="admin-overview-hero"><div className="admin-overview-hero__content"><span className="admin-overview-kicker">Control room</span><h1 className="admin-overview-title">Website administration</h1><p className="admin-overview-description">All-time platform totals from the live database.</p></div><Link to="/admin/moderation" className="admin-overview-button admin-overview-button--primary"><FaShieldHalved /> Review queue</Link></section><section className="admin-overview-stats" aria-label="All-time platform metrics"><div className="admin-overview-stats__container">{stats.map(([id, value, label, Icon, link]) => <Link key={id} to={link} className={`admin-overview-stat-card admin-overview-stat-card--${id}`}><div className="admin-overview-stat-icon"><Icon /></div><div className="admin-overview-stat-content"><span className="admin-overview-stat-value">{value}</span><p className="admin-overview-stat-label">{label}</p><p className="admin-overview-stat-subtext">All-time</p></div><FaArrowRight className="admin-overview-stat-arrow" /></Link>)}</div></section><section className="admin-overview-priorities"><div className="admin-overview-section-header"><h2>Platform status</h2><span className="admin-overview-section-badge">Live data</span></div><div className="admin-overview-priorities-grid"><Link to="/admin/jobs" className="admin-overview-priority-item"><div className="admin-overview-priority-icon"><FaBriefcase /></div><div className="admin-overview-priority-content"><h3>Job review queue</h3><p>{summary.pendingJobs} pending jobs</p></div><FaArrowRight className="admin-overview-priority-arrow" /></Link><Link to="/admin/analytics" className="admin-overview-priority-item"><div className="admin-overview-priority-icon"><FaChartLine /></div><div className="admin-overview-priority-content"><h3>Approved jobs</h3><p>{summary.approvedJobs} all-time approved jobs</p></div><FaArrowRight className="admin-overview-priority-arrow" /></Link><Link to="/admin/users" className="admin-overview-priority-item"><div className="admin-overview-priority-icon"><FaUsers /></div><div className="admin-overview-priority-content"><h3>Verified users</h3><p>{summary.verifiedUsers} verified accounts</p></div><FaArrowRight className="admin-overview-priority-arrow" /></Link></div></section></div>;
}

export default AdminOverviewPage;
