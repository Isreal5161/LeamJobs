import { useState } from 'react';
import {
  FaBell,
  FaBriefcase,
  FaCalendarCheck,
  FaCheck,
  FaChevronDown,
  FaDownload,
  FaEnvelope,
  FaFileAlt,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaSlidersH,
  FaSortAmountDown,
  FaStar,
  FaTimes,
} from 'react-icons/fa';
import ApplicantAvatar from '../../components/employer/ApplicantAvatar';
import { applicants } from './employerData';

const stages = ['All', 'New', 'Review', 'Shortlisted', 'Interview'];
const sortModes = ['Score', 'Newest', 'Experience'];

function EmployerApplicantsPage() {
  const [selectedApplicantId, setSelectedApplicantId] = useState(applicants[0].id);
  const [activeStage, setActiveStage] = useState(stages[0]);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState(sortModes[0]);
  const selectedApplicant = applicants.find((applicant) => applicant.id === selectedApplicantId) ?? applicants[0];
  const filteredApplicants = applicants
    .filter((applicant) => {
      const matchesStage = activeStage === 'All' || applicant.stage === activeStage;
      const matchesQuery = `${applicant.name} ${applicant.role} ${applicant.location} ${applicant.skills.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesStage && matchesQuery;
    })
    .sort((first, second) => {
      if (sortMode === 'Experience') {
        return Number.parseInt(second.experience, 10) - Number.parseInt(first.experience, 10);
      }

      if (sortMode === 'Newest') {
        return applicants.indexOf(first) - applicants.indexOf(second);
      }

      return second.score - first.score;
    });

  return (
    <div className="employer-page employer-applicants-page">
      <section className="employer-hero employer-hero--compact">
        <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Applicant dashboard</span>
            <h1>Review candidate profiles</h1>
            <p>Sort, score, and move applicants through your hiring pipeline.</p>
          </div>
          <button className="employer-icon-button" type="button" aria-label="Notifications">
            <FaBell />
          </button>
        </div>
      </section>

      <main className="employer-content employer-applicants-grid">
        <section className="employer-panel employer-applicant-list-panel">
          <div className="employer-list-tools">
            <label className="employer-search" aria-label="Search applicants">
              <FaSearch />
              <input
                type="search"
                placeholder="Search applicants or skills"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button
              type="button"
              aria-label="Change applicant sort"
              onClick={() => {
                const nextIndex = (sortModes.indexOf(sortMode) + 1) % sortModes.length;
                setSortMode(sortModes[nextIndex]);
              }}
              title={`Sorted by ${sortMode}`}
            >
              <FaSortAmountDown />
            </button>
          </div>

          <div className="employer-sort-caption">
            <FaSlidersH />
            Sorted by {sortMode.toLowerCase()} / {filteredApplicants.length} candidates
          </div>

          <div className="employer-tabs" aria-label="Applicant stages">
            {stages.map((stage) => (
              <button
                className={stage === activeStage ? 'employer-tab--active' : ''}
                type="button"
                key={stage}
                onClick={() => setActiveStage(stage)}
              >
                {stage}
              </button>
            ))}
          </div>

          <div className="employer-applicant-list">
            {filteredApplicants.map((applicant) => (
              <article className={`employer-applicant-card ${selectedApplicantId === applicant.id ? 'employer-applicant-card--active' : ''}`} key={applicant.id}>
                <button type="button" onClick={() => setSelectedApplicantId(applicant.id)}>
                  <ApplicantAvatar name={applicant.name} imageUrl={applicant.avatarUrl} />
                  <div>
                    <h3>{applicant.name}</h3>
                    <p>{applicant.role}</p>
                    <div className="employer-applicant-card__meta">
                      <span><FaMapMarkerAlt /> {applicant.location}</span>
                      <span><FaBriefcase /> {applicant.experience}</span>
                      <span>{applicant.stage}</span>
                    </div>
                  </div>
                  <strong>{applicant.score}%</strong>
                </button>
              </article>
            ))}
            {filteredApplicants.length === 0 ? (
              <div className="employer-empty-state">
                <strong>No applicants found</strong>
                <p>Change the stage or search terms to widen the list.</p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="employer-panel employer-candidate-detail">
          <div className="employer-candidate-detail__header">
            <ApplicantAvatar name={selectedApplicant.name} imageUrl={selectedApplicant.avatarUrl} size="lg" />
            <div>
              <h2>{selectedApplicant.name}</h2>
              <p>{selectedApplicant.role}</p>
            </div>
            <span className="employer-score">
              <FaStar />
              {selectedApplicant.score}%
            </span>
          </div>

          <div className="employer-candidate-facts">
            <span><FaMapMarkerAlt /> {selectedApplicant.location}</span>
            <span><FaBriefcase /> {selectedApplicant.experience} experience</span>
            <span><FaCalendarCheck /> Applied {selectedApplicant.applied}</span>
            <span>{selectedApplicant.source}</span>
            <span>Available in {selectedApplicant.availability}</span>
          </div>

          <section className="employer-cv-card" aria-label={`${selectedApplicant.name} CV`}>
            <span className="employer-cv-card__icon"><FaFileAlt /></span>
            <div>
              <h2>Candidate CV</h2>
              <strong>{selectedApplicant.cvFile}</strong>
              <p>{selectedApplicant.cvSummary}</p>
              <small>{selectedApplicant.cvUpdated}</small>
            </div>
            <div className="employer-cv-card__actions">
              <button className="employer-button employer-button--primary" type="button">
                <FaExternalLinkAlt />
                View CV
              </button>
              <button className="employer-button employer-button--ghost" type="button" aria-label={`Download ${selectedApplicant.name} CV`}>
                <FaDownload />
              </button>
            </div>
          </section>

          <section className="employer-candidate-section">
            <div className="employer-section-heading">
              <div>
                <h2>Recruiter score</h2>
                <p>Weighted match across skills, role fit, and experience.</p>
              </div>
              <button type="button">
                Adjust
                <FaChevronDown />
              </button>
            </div>
            <div className="employer-score-meter">
              <span><i style={{ width: `${selectedApplicant.score}%` }} /></span>
              <strong>{selectedApplicant.score}% match</strong>
            </div>
          </section>

          <section className="employer-candidate-section">
            <h2>Key skills</h2>
            <div className="employer-skill-list">
              {selectedApplicant.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </section>

          <section className="employer-candidate-section">
            <h2>Profile note</h2>
            <p>{selectedApplicant.note}</p>
          </section>

          <div className="employer-review-actions">
            <button className="employer-button employer-button--danger" type="button">
              <FaTimes />
              Reject
            </button>
            <button className="employer-button employer-button--ghost" type="button">
              <FaEnvelope />
              Message
            </button>
            <button className="employer-button employer-button--primary" type="button">
              <FaCheck />
              Shortlist
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default EmployerApplicantsPage;
