import { useEffect, useRef, useState } from 'react';
import { FaBolt, FaMapMarkerAlt, FaRedo, FaSearch, FaSpinner, FaStar, FaTag, FaTimes, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { createEmployerInvitation, getEmployerCandidates, getEmployerJobs, type EmployerCandidate, type EmployerJob } from '../../services/api';

const PAGE_SIZE = 25;

function EmployerCandidatesPage() {
  const { token } = useAuth();
  const [candidates, setCandidates] = useState<EmployerCandidate[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [skill, setSkill] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<EmployerCandidate | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [invitationError, setInvitationError] = useState('');
  const [invitationSent, setInvitationSent] = useState('');
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setLocation(locationInput.trim());
      setSkill(skillInput.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput, locationInput, skillInput]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('Your session could not be loaded. Please sign in again.');
      return undefined;
    }

    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setIsLoading(true);
    setError('');
    setCandidates([]);
    setNextCursor(null);
    setHasMore(false);

    void getEmployerCandidates({ search, location, skill, limit: PAGE_SIZE }, token).then((result) => {
      if (requestVersion.current !== version) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load candidates.');
      } else {
        setCandidates(result.data.data.candidates);
        setNextCursor(result.data.data.pagination.nextCursor);
        setHasMore(result.data.data.pagination.hasMore);
      }
      setIsLoading(false);
    });

    return () => {
      requestVersion.current += 1;
    };
  }, [token, search, location, skill, retryKey]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    void getEmployerJobs(token).then((result) => {
      if (active && result.ok) setJobs(result.data.data.jobs);
    });
    return () => { active = false; };
  }, [token]);

  const loadMore = async () => {
    if (!token || !nextCursor || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const result = await getEmployerCandidates({ search, location, skill, limit: PAGE_SIZE, cursor: nextCursor }, token);
    if (result.ok) {
      setCandidates((current) => {
        const known = new Set(current.map((candidate) => candidate.id));
        return [...current, ...result.data.data.candidates.filter((candidate) => !known.has(candidate.id))];
      });
      setNextCursor(result.data.data.pagination.nextCursor);
      setHasMore(result.data.data.pagination.hasMore);
    } else {
      setError(result.error.message || 'We could not load more candidates.');
    }
    setIsLoadingMore(false);
  };

  const friendlyError = error.includes('401') || error.toLowerCase().includes('unauthorized')
    ? 'Your session has expired. Please sign in again.'
    : error.includes('403') || error.toLowerCase().includes('forbidden')
      ? 'Your employer account cannot access candidate discovery.'
      : 'We could not load candidates right now. Please try again.';

  const eligibleJobs = jobs.filter((job) => job.status === 'APPROVED' && (!job.applicationDeadline || new Date(job.applicationDeadline) >= new Date()));
  const openInvitation = (candidate: EmployerCandidate) => {
    setSelectedCandidate(candidate);
    setSelectedJobId('');
    setInvitationMessage('');
    setInvitationError('');
    setInvitationSent('');
  };
  const sendInvitation = async () => {
    if (!token || !selectedCandidate || !selectedJobId || !invitationMessage.trim() || isSendingInvitation) return;
    setIsSendingInvitation(true);
    setInvitationError('');
    const result = await createEmployerInvitation({ seekerId: selectedCandidate.id, jobId: selectedJobId, message: invitationMessage.trim() }, token);
    if (!result.ok) setInvitationError(result.status === 409 ? 'A pending invitation already exists for this candidate and job.' : result.error.message || 'Invitation could not be sent.');
    else {
      setInvitationSent('Invitation sent successfully. The candidate will see it in Messages.');
      setInvitationMessage('');
    }
    setIsSendingInvitation(false);
  };

  return (
    <div className="employer-page employer-candidates-page">
      <section className="employer-hero employer-hero--compact">
        <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Talent discovery</span>
            <h1>Find candidates</h1>
            <p>Browse candidate profiles shared for employer discovery.</p>
          </div>
          <span className="employer-candidates-hero-icon" aria-hidden="true"><FaUsers /></span>
        </div>
      </section>

      <main className="employer-content employer-candidates-content">
        <section className="employer-panel employer-candidates-toolbar" aria-label="Candidate filters">
          <label className="employer-candidate-filter employer-candidate-filter--search">
            <span>Search</span>
            <div className="employer-candidate-filter__input"><FaSearch aria-hidden="true" /><input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search names or professional titles" /></div>
          </label>
          <label className="employer-candidate-filter">
            <span>Location</span>
            <div className="employer-candidate-filter__input"><FaMapMarkerAlt aria-hidden="true" /><input type="search" value={locationInput} onChange={(event) => setLocationInput(event.target.value)} placeholder="Any location" /></div>
          </label>
          <label className="employer-candidate-filter">
            <span>Skill</span>
            <div className="employer-candidate-filter__input"><FaTag aria-hidden="true" /><input type="search" value={skillInput} onChange={(event) => setSkillInput(event.target.value)} placeholder="Any skill" /></div>
          </label>
        </section>

        <section className="employer-panel employer-candidates-list-panel" aria-live="polite" aria-busy={isLoading}>
          <div className="employer-section-heading">
            <div><span className="employer-eyebrow">Employer directory</span><h2>Candidate profiles</h2></div>
            {!isLoading && !error ? <span className="employer-candidates-count">Showing {candidates.length}{hasMore ? '+' : ''}</span> : null}
          </div>

          {isLoading ? (
            <div className="employer-candidates-grid" role="status" aria-label="Loading candidates">
              {[1, 2, 3, 4].map((item) => <article className="employer-candidate-card employer-candidate-card--skeleton" key={item}><span className="leamjobs-skeleton-circle" /><div><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-line" /></div></article>)}
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="employer-empty-state employer-candidates-state" role="alert">
              <strong>Candidates unavailable</strong><p>{friendlyError}</p><button className="employer-button employer-button--ghost" type="button" onClick={() => setRetryKey((value) => value + 1)}><FaRedo /> Try again</button>
            </div>
          ) : null}

          {!isLoading && !error && candidates.length === 0 ? (
            <div className="employer-empty-state employer-candidates-state"><strong>No candidates found</strong><p>Try broadening your search or removing a filter.</p></div>
          ) : null}

          {!isLoading && !error && candidates.length > 0 ? (
            <div className="employer-candidates-grid">
              {candidates.map((candidate) => <CandidateCard candidate={candidate} key={candidate.id} onInvite={openInvitation} />)}
            </div>
          ) : null}

          {!isLoading && !error && hasMore ? <div className="employer-candidates-load-more"><button className="employer-button employer-button--primary" type="button" onClick={() => void loadMore()} disabled={isLoadingMore}>{isLoadingMore ? <FaSpinner className="leamjobs-spin" /> : null}{isLoadingMore ? 'Loading candidates...' : 'Load more candidates'}</button></div> : null}
        </section>
      </main>
      {selectedCandidate ? <div className="employer-invitation-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedCandidate(null); }}>
        <section className="employer-invitation-modal" role="dialog" aria-modal="true" aria-labelledby="invitation-title">
          <header><div><span className="employer-eyebrow">Job invitation</span><h2 id="invitation-title">Invite {selectedCandidate.firstName} {selectedCandidate.lastName} to apply</h2></div><button type="button" className="employer-icon-button" onClick={() => setSelectedCandidate(null)} aria-label="Close invitation"><FaTimes /></button></header>
          {!eligibleJobs.length ? <div className="employer-empty-state"><strong>No eligible jobs available</strong><p>Only approved, open jobs can receive invitations.</p></div> : <>
            <label className="employer-invitation-field"><span>Job</span><select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}><option value="">Select a job</option>{eligibleJobs.map((job) => <option value={job.id} key={job.id}>{job.title}</option>)}</select></label>
            <label className="employer-invitation-field"><span>Message</span><textarea value={invitationMessage} onChange={(event) => setInvitationMessage(event.target.value)} maxLength={2000} rows={5} placeholder="Write a short invitation message" /></label>
            {invitationError ? <p className="employer-action-error" role="alert">{invitationError}</p> : null}
            {invitationSent ? <p className="employer-action-success" role="status">{invitationSent}</p> : null}
            <footer><button type="button" className="employer-button employer-button--ghost" onClick={() => setSelectedCandidate(null)}>Cancel</button><button type="button" className="employer-button employer-button--primary" onClick={() => void sendInvitation()} disabled={!selectedJobId || !invitationMessage.trim() || isSendingInvitation}>{isSendingInvitation ? <FaSpinner className="leamjobs-spin" /> : null}{isSendingInvitation ? 'Sending...' : 'Send invitation'}</button></footer>
          </>}
        </section>
      </div> : null}
    </div>
  );
}

function CandidateCard({ candidate, onInvite }: { candidate: EmployerCandidate; onInvite: (candidate: EmployerCandidate) => void }) {
  const { profile } = candidate;
  return (
    <article className="employer-candidate-card">
      <div className="employer-candidate-card__top">
        {profile.profilePictureUrl ? <img src={profile.profilePictureUrl} alt="" /> : <span className="employer-candidate-card__avatar" aria-hidden="true">{`${candidate.firstName[0] ?? ''}${candidate.lastName[0] ?? ''}`.toUpperCase()}</span>}
        <div className="employer-candidate-card__identity"><h3>{candidate.firstName} {candidate.lastName}</h3><p>{profile.professionalTitle || 'Professional title not provided'}</p></div>
      </div>
      {candidate.featured || candidate.visibilityBoosted ? <div className="employer-candidate-card__badges">{candidate.featured ? <span><FaStar aria-hidden="true" /> Featured</span> : null}{candidate.visibilityBoosted ? <span><FaBolt aria-hidden="true" /> Visibility Boost</span> : null}</div> : null}
      {profile.location ? <p className="employer-candidate-card__location"><FaMapMarkerAlt aria-hidden="true" /> {profile.location}</p> : null}
      {profile.bio ? <p className="employer-candidate-card__bio">{profile.bio}</p> : null}
      {profile.skills.length ? <div className="employer-candidate-card__skills">{profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : null}
      <button type="button" className="employer-button employer-button--primary employer-candidate-card__invite" onClick={() => onInvite(candidate)}>Invite to apply</button>
    </article>
  );
}

export default EmployerCandidatesPage;
