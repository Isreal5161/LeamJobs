import { useState } from 'react';
import { FaBriefcase, FaCheckCircle, FaEdit, FaTimesCircle } from 'react-icons/fa';
import { adminJobs, type ModerationStatus } from './adminData';

function AdminJobsPage() {
  const [jobs, setJobs] = useState(adminJobs);

  const updateStatus = (jobId: string, status: ModerationStatus) => {
    setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, status } : job)));
  };

  return (
    <div className="admin-page">
      <section className="admin-page-header">
        <span className="admin-kicker">Job control</span>
        <h1>Posted and uploaded jobs</h1>
        <p>View employer job posts, edit listings, approve new uploads, decline posts, and manage recommendations.</p>
      </section>

      <section className="admin-console-panel">
        <div className="admin-section-heading">
          <div>
            <span><FaBriefcase /> Jobs</span>
            <h2>Employer posts review table</h2>
          </div>
        </div>
        <div className="admin-management-table">
          {jobs.map((job) => (
            <article className="admin-management-row" key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <p>{job.employer} / {job.category} / {job.location}</p>
                <small>{job.posted} / {job.applicants} applicants / {job.views} views</small>
              </div>
              <span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{job.status}</span>
              <div className="admin-row-actions">
                <button type="button"><FaEdit /> Edit</button>
                <button type="button" onClick={() => updateStatus(job.id, 'Approved')}><FaCheckCircle /> Approve</button>
                <button type="button" onClick={() => updateStatus(job.id, 'Declined')}><FaTimesCircle /> Decline</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminJobsPage;
