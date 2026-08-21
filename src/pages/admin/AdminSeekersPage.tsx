import { FaClipboardList, FaUserCheck, FaUsers } from 'react-icons/fa';
import { adminSeekers } from './adminData';

function AdminSeekersPage() {
  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <span className="admin-kicker">Seekers</span>
        <h1>Job seekers and applications</h1>
        <p>Track seeker account numbers, applications submitted, interviews, saved jobs, and moderation status.</p>
      </section>

      <section className="admin-stat-grid">
        <article className="admin-stat-card admin-stat-card--command">
          <span><FaUsers /></span>
          <div><strong>{adminSeekers.length}</strong><p>seekers</p></div>
        </article>
        <article className="admin-stat-card admin-stat-card--command">
          <span><FaClipboardList /></span>
          <div><strong>{adminSeekers.reduce((total, seeker) => total + seeker.applications, 0)}</strong><p>applications</p></div>
        </article>
        <article className="admin-stat-card admin-stat-card--command">
          <span><FaUserCheck /></span>
          <div><strong>{adminSeekers.reduce((total, seeker) => total + seeker.interviews, 0)}</strong><p>interviews</p></div>
        </article>
      </section>

      <section className="admin-console-panel">
        <div className="admin-management-table">
          {adminSeekers.map((seeker) => (
            <article className="admin-management-row" key={seeker.id}>
              <div>
                <strong>{seeker.name}</strong>
                <p>{seeker.role} / {seeker.email}</p>
                <small>{seeker.applications} applications / {seeker.interviews} interviews / {seeker.savedJobs} saved jobs</small>
              </div>
              <span className={`admin-status admin-status--${seeker.status.toLowerCase()}`}>{seeker.status}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminSeekersPage;
