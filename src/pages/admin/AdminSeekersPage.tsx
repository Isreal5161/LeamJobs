import { useState } from 'react';
import { FaClipboardList, FaFileAlt, FaMapMarkerAlt, FaStar, FaUserCheck, FaUsers } from 'react-icons/fa';
import { applicants } from '../employer/employerData';
import { adminSeekers } from './adminData';

function AdminSeekersPage() {
  const [selectedSeekerId, setSelectedSeekerId] = useState(applicants[0]?.id ?? '');
  const selectedSeeker = applicants.find((applicant) => applicant.id === selectedSeekerId) ?? applicants[0];
  const statusById = new Map(adminSeekers.map((seeker) => [seeker.id, seeker.status]));
  const totalApplications = adminSeekers.reduce((total, seeker) => total + seeker.applications, 0);
  const totalInterviews = adminSeekers.reduce((total, seeker) => total + seeker.interviews, 0);
  const averageScore = Math.round(applicants.reduce((total, applicant) => total + applicant.score, 0) / applicants.length);

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Seekers</span>
          <h1>Job seekers and applications</h1>
          <p>Review seeker profiles, application activity, CV details, skills, match quality, and moderation status.</p>
        </div>
        <button className="admin-icon-button" type="button" aria-label="Review seeker profiles">
          <FaUsers />
        </button>
      </section>

      <section className="admin-stat-grid" aria-label="Seeker summary">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaUsers /></span>
          <div><strong>{applicants.length}</strong><p>seekers</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--purple"><FaClipboardList /></span>
          <div><strong>{totalApplications}</strong><p>applications</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaUserCheck /></span>
          <div><strong>{totalInterviews}</strong><p>interviews</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaStar /></span>
          <div><strong>{averageScore}%</strong><p>average match</p></div>
        </article>
      </section>

      <section className="admin-seekers-workspace">
        <div className="admin-panel admin-seekers-list-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaUsers /> Seeker directory</span>
              <h2>Profiles and applications</h2>
            </div>
          </div>
          <div className="admin-seeker-list">
            {applicants.map((applicant) => (
              <button
                type="button"
                className={`admin-seeker-item ${selectedSeeker?.id === applicant.id ? 'admin-seeker-item--active' : ''}`}
                key={applicant.id}
                onClick={() => setSelectedSeekerId(applicant.id)}
              >
                <div className="admin-seeker-item__avatar">
                  {applicant.avatarUrl ? <img src={applicant.avatarUrl} alt="" /> : applicant.name.split(' ').map((part) => part[0]).join('')}
                </div>
                <div>
                  <strong>{applicant.name}</strong>
                  <p>{applicant.role}</p>
                  <small>{applicant.location} / {applicant.experience}</small>
                </div>
                <span className={`admin-status admin-status--${(statusById.get(applicant.id) ?? 'Approved').toLowerCase()}`}>{statusById.get(applicant.id) ?? 'Approved'}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedSeeker ? (
          <article className="admin-panel admin-seeker-profile-panel">
            <div className="admin-seeker-profile-header">
              <div className="admin-seeker-profile-identity">
                <div className="admin-seeker-profile-avatar">
                  {selectedSeeker.avatarUrl ? <img src={selectedSeeker.avatarUrl} alt={selectedSeeker.name} /> : selectedSeeker.name.split(' ').map((part) => part[0]).join('')}
                </div>
                <div>
                  <span className="admin-review-kicker"><FaUsers /> Seeker profile</span>
                  <h2>{selectedSeeker.name}</h2>
                  <p>{selectedSeeker.role}</p>
                </div>
              </div>
              <span className="admin-status admin-status--approved">{selectedSeeker.stage}</span>
            </div>

            <div className="admin-seeker-facts">
              <div><span>Location</span><strong><FaMapMarkerAlt /> {selectedSeeker.location}</strong></div>
              <div><span>Experience</span><strong>{selectedSeeker.experience}</strong></div>
              <div><span>Availability</span><strong>{selectedSeeker.availability}</strong></div>
              <div><span>Match score</span><strong>{selectedSeeker.score}%</strong></div>
            </div>

            <section className="admin-seeker-section">
              <h3>Contact and application</h3>
              <div className="admin-seeker-contact-grid">
                <div><span>Email</span><strong>{selectedSeeker.id}@example.com</strong></div>
                <div><span>Application source</span><strong>{selectedSeeker.source}</strong></div>
                <div><span>Applied</span><strong>{selectedSeeker.applied}</strong></div>
                <div><span>Current note</span><strong>{selectedSeeker.note}</strong></div>
              </div>
            </section>

            <section className="admin-seeker-section">
              <h3>Skills</h3>
              <div className="admin-token-list admin-token-list--seeker">
                {selectedSeeker.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </section>

            <section className="admin-seeker-cv">
              <div className="admin-seeker-cv__icon"><FaFileAlt /></div>
              <div>
                <h3>CV details</h3>
                <strong>{selectedSeeker.cvFile}</strong>
                <p>{selectedSeeker.cvUpdated}</p>
                <span>{selectedSeeker.cvSummary}</span>
              </div>
              <button type="button" className="admin-button admin-button--secondary">View CV</button>
            </section>
          </article>
        ) : null}
      </section>
    </div>
  );
}

export default AdminSeekersPage;
