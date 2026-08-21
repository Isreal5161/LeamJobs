import { useState } from 'react';
import { FaCheckCircle, FaFlag, FaTimesCircle, FaUserShield } from 'react-icons/fa';
import { adminEmployers, adminJobs, adminSeekers, type ModerationStatus } from './adminData';

function AdminModerationPage() {
  const [jobs, setJobs] = useState(adminJobs);

  const setStatus = (jobId: string, status: ModerationStatus) => {
    setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, status } : job)));
  };

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <span className="admin-kicker">Moderation</span>
        <h1>Approve, flag, or decline content</h1>
        <p>Review job posts, employer accounts, and seeker accounts before they affect the public marketplace.</p>
      </section>

      <section className="admin-console-grid">
        <div className="admin-console-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaFlag /> Job queue</span>
              <h2>New and flagged job posts</h2>
            </div>
          </div>
          <div className="admin-management-table">
            {jobs.map((job) => (
              <article className="admin-management-row" key={job.id}>
                <div>
                  <strong>{job.title}</strong>
                  <p>{job.employer} / {job.location}</p>
                </div>
                <span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{job.status}</span>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => setStatus(job.id, 'Approved')}><FaCheckCircle /> Approve</button>
                  <button type="button" onClick={() => setStatus(job.id, 'Flagged')}><FaFlag /> Flag</button>
                  <button type="button" onClick={() => setStatus(job.id, 'Declined')}><FaTimesCircle /> Decline</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="admin-console-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaUserShield /> Accounts</span>
              <h2>Employers and seekers</h2>
            </div>
          </div>
          {[...adminEmployers, ...adminSeekers.slice(0, 3)].map((account) => (
            <article className="admin-compact-card" key={account.id}>
              <strong>{account.name}</strong>
              <p>{account.email}</p>
              <span className={`admin-status admin-status--${account.status.toLowerCase()}`}>{account.status}</span>
            </article>
          ))}
        </aside>
      </section>
    </div>
  );
}

export default AdminModerationPage;
