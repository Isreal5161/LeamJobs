import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FaBolt, FaDownload, FaExternalLinkAlt, FaFileAlt, FaGlobe, FaLinkedin, FaMapMarkerAlt, FaRedo, FaSearch, FaSpinner, FaStar, FaTag, FaTimes, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  createEmployerInvitation,
  getEmployerApplication,
  getEmployerApplicationResume,
  getEmployerCandidateDetails,
  getEmployerCandidates,
  getEmployerJobs,
  type EmployerApplicationDetail,
  type EmployerCandidate,
  type EmployerCandidateDetails,
  type EmployerJob,
} from '../../services/api';
import AuthenticatedImage from '../../components/common/AuthenticatedImage';
import CVTemplateRenderer, { type CVData, type CVTemplateId } from '../../components/cv-templates/CVTemplateRenderer';

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
  const [candidateDetail, setCandidateDetail] = useState<EmployerCandidateDetails | null>(null);
  const [candidateDetailTarget, setCandidateDetailTarget] = useState<EmployerCandidate | null>(null);
  const [isLoadingCandidateDetail, setIsLoadingCandidateDetail] = useState(false);
  const [candidateDetailError, setCandidateDetailError] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [applicationDetail, setApplicationDetail] = useState<EmployerApplicationDetail | null>(null);
  const [isLoadingApplicationDetail, setIsLoadingApplicationDetail] = useState(false);
  const [applicationDetailError, setApplicationDetailError] = useState('');
  const [applicationDetailRetry, setApplicationDetailRetry] = useState(0);
  const [cvObjectUrl, setCvObjectUrl] = useState('');
  const [cvContentType, setCvContentType] = useState('');
  const [cvError, setCvError] = useState('');
  const [isLoadingCv, setIsLoadingCv] = useState(false);
  const [showCv, setShowCv] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [invitationError, setInvitationError] = useState('');
  const [invitationSent, setInvitationSent] = useState('');
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const requestVersion = useRef(0);
  const candidateDetailRequestVersion = useRef(0);
  const applicationDetailRequestVersion = useRef(0);
  const cvRequestVersion = useRef(0);
  const cvObjectUrlRef = useRef('');

  const clearCandidateCv = useCallback(() => {
    cvRequestVersion.current += 1;
    if (cvObjectUrlRef.current) URL.revokeObjectURL(cvObjectUrlRef.current);
    cvObjectUrlRef.current = '';
    setCvObjectUrl('');
    setCvContentType('');
    setIsLoadingCv(false);
  }, []);

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

  useEffect(() => () => {
    cvRequestVersion.current += 1;
    if (cvObjectUrlRef.current) URL.revokeObjectURL(cvObjectUrlRef.current);
  }, []);

  useEffect(() => {
    if (!token || !candidateDetail || !selectedApplicationId) {
      setApplicationDetail(null);
      setApplicationDetailError('');
      setIsLoadingApplicationDetail(false);
      setCvError('');
      setShowCv(false);
      clearCandidateCv();
      return undefined;
    }

    const version = applicationDetailRequestVersion.current + 1;
    applicationDetailRequestVersion.current = version;
    setIsLoadingApplicationDetail(true);
    setApplicationDetailError('');
    setApplicationDetail(null);
    setCvError('');
    setCvContentType('');
    setShowCv(false);
    clearCandidateCv();
    const application = candidateDetail.applications.find((item) => item.id === selectedApplicationId);
    if (!application) {
      setApplicationDetailError('This application is no longer available.');
      setIsLoadingApplicationDetail(false);
      return undefined;
    }

    void getEmployerApplication(application.jobId, application.id, token).then((result) => {
      if (applicationDetailRequestVersion.current !== version) return;
      if (!result.ok) setApplicationDetailError(result.error.message || 'Application details could not be loaded.');
      else setApplicationDetail(result.data.data.application);
      setIsLoadingApplicationDetail(false);
    });

    return () => {
      applicationDetailRequestVersion.current += 1;
    };
  }, [applicationDetailRetry, candidateDetail, clearCandidateCv, selectedApplicationId, token]);

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

  const openCandidateDetails = async (candidate: EmployerCandidate) => {
    if (!token || isLoadingCandidateDetail) return;
    const version = candidateDetailRequestVersion.current + 1;
    candidateDetailRequestVersion.current = version;
    setCandidateDetailTarget(candidate);
    setCandidateDetail(null);
    setCandidateDetailTarget(null);
    setCandidateDetailError('');
    setSelectedApplicationId('');
    setApplicationDetail(null);
    setIsLoadingCandidateDetail(true);
    clearCandidateCv();
    const result = await getEmployerCandidateDetails(candidate.id, token);
    if (candidateDetailRequestVersion.current !== version) return;
    if (!result.ok) setCandidateDetailError(result.error.message || 'Candidate details could not be loaded.');
    else setCandidateDetail(result.data.data.candidate);
    setIsLoadingCandidateDetail(false);
  };

  const closeCandidateDetails = () => {
    candidateDetailRequestVersion.current += 1;
    applicationDetailRequestVersion.current += 1;
    setCandidateDetail(null);
    setCandidateDetailError('');
    setSelectedApplicationId('');
    setApplicationDetail(null);
    setShowCv(false);
    setCvError('');
    setIsLoadingCandidateDetail(false);
    clearCandidateCv();
  };

  const openCandidateCv = async () => {
    if (!token || !applicationDetail || isLoadingCv || !applicationDetail.resume.available) return;
    const version = cvRequestVersion.current + 1;
    cvRequestVersion.current = version;
    setCvError('');
    setShowCv(false);
    if (applicationDetail.resume.source === 'template') {
      setShowCv(true);
      return;
    }

    setIsLoadingCv(true);
    const result = await getEmployerApplicationResume(applicationDetail.jobId, applicationDetail.id, token);
    if (cvRequestVersion.current !== version) return;
    if (!result.ok) {
      setCvError(result.error.message || 'This application CV could not be loaded.');
      setIsLoadingCv(false);
      return;
    }
    const objectUrl = URL.createObjectURL(result.data);
    cvObjectUrlRef.current = objectUrl;
    setCvObjectUrl(objectUrl);
    setCvContentType(result.data.type);
    setShowCv(true);
    setIsLoadingCv(false);
  };

  const downloadCandidateCv = () => {
    if (!cvObjectUrl || !applicationDetail) return;
    const extension = cvContentType === 'application/pdf'
      ? 'pdf'
      : cvContentType === 'application/msword'
        ? 'doc'
        : cvContentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ? 'docx'
          : 'cv';
    const link = document.createElement('a');
    link.href = cvObjectUrl;
    link.download = `${applicationDetail.applicant.fullName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'candidate'}-cv.${extension}`;
    link.click();
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
              {candidates.map((candidate) => (
                <CandidateCard
                  candidate={candidate}
                  token={token ?? ''}
                  key={candidate.id}
                  onInvite={openInvitation}
                  onDetails={(value) => void openCandidateDetails(value)}
                />
              ))}
            </div>
          ) : null}

          {!isLoading && !error && hasMore ? <div className="employer-candidates-load-more"><button className="employer-button employer-button--primary" type="button" onClick={() => void loadMore()} disabled={isLoadingMore}>{isLoadingMore ? <FaSpinner className="leamjobs-spin" /> : null}{isLoadingMore ? 'Loading candidates...' : 'Load more candidates'}</button></div> : null}
        </section>
      </main>
      {candidateDetail || isLoadingCandidateDetail || candidateDetailError ? (
        <div className="employer-invitation-backdrop employer-candidate-detail-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeCandidateDetails();
        }}>
          <section className="employer-candidate-detail-modal" role="dialog" aria-modal="true" aria-labelledby="employer-candidate-detail-title">
            <header className="employer-candidate-detail-modal__header">
              <div>
                <span className="employer-eyebrow">Candidate profile</span>
                <h2 id="employer-candidate-detail-title">
                  {candidateDetail ? `${candidateDetail.firstName} ${candidateDetail.lastName}` : candidateDetailTarget ? `${candidateDetailTarget.firstName} ${candidateDetailTarget.lastName}` : 'Candidate details'}
                </h2>
              </div>
              <button type="button" className="employer-icon-button" onClick={closeCandidateDetails} aria-label="Close candidate details"><FaTimes /></button>
            </header>
            {isLoadingCandidateDetail ? <div className="employer-candidate-detail-state" role="status"><FaSpinner className="leamjobs-spin" /> Loading profile...</div> : null}
            {candidateDetailError ? <div className="employer-empty-state employer-candidate-detail-state" role="alert"><strong>Candidate details unavailable</strong><p>{candidateDetailError}</p><button type="button" className="employer-button employer-button--ghost" onClick={() => {
              if (candidateDetailTarget) void openCandidateDetails(candidateDetailTarget);
            }}>Try again</button></div> : null}
            {candidateDetail ? (
              <div className="employer-candidate-detail-content">
                <section className="employer-candidate-detail-identity">
                  {candidateDetail.profile.profilePictureUrl && token ? (
                    <AuthenticatedImage
                      endpoint={`/employer/candidates/${encodeURIComponent(candidateDetail.id)}/profile-picture`}
                      token={token}
                      alt={`${candidateDetail.firstName} ${candidateDetail.lastName}`}
                      className="employer-candidate-detail-identity__photo"
                      fallback={<span className="employer-candidate-detail-identity__initials">{`${candidateDetail.firstName[0] ?? ''}${candidateDetail.lastName[0] ?? ''}`.toUpperCase()}</span>}
                    />
                  ) : <span className="employer-candidate-detail-identity__initials">{`${candidateDetail.firstName[0] ?? ''}${candidateDetail.lastName[0] ?? ''}`.toUpperCase()}</span>}
                  <div>
                    <h3>{candidateDetail.profile.professionalTitle || 'Professional headline not provided'}</h3>
                    <p>{candidateDetail.profile.location || [candidateDetail.profile.city, candidateDetail.profile.state, candidateDetail.profile.country].filter(Boolean).join(', ') || 'Location not provided'}</p>
                    <p>{candidateDetail.profile.availability === 'AVAILABLE_NOW' ? 'Available now' : candidateDetail.profile.availability === 'AVAILABLE_SOON' ? 'Available soon' : 'Availability not provided'}</p>
                  </div>
                </section>

                <DetailSection title="Summary">
                  {candidateDetail.profile.bio ? <p>{candidateDetail.profile.bio}</p> : <EmptyDetail />}
                </DetailSection>
                <DetailSection title="Skills and specializations">
                  {candidateDetail.profile.skills.length
                    ? <div className="employer-candidate-detail-skills">{candidateDetail.profile.skills.map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}</div>
                    : <EmptyDetail />}
                </DetailSection>
                <DetailSection title="Work experience">
                  {candidateDetail.profile.experience.length ? candidateDetail.profile.experience.map((item, index) => (
                    <article className="employer-candidate-detail-entry" key={item.id || `${item.company}-${index}`}>
                      <h4>{item.jobTitle || 'Role not specified'}</h4>
                      <p><strong>{item.company || 'Employer not specified'}</strong></p>
                      <p>{[item.startDate, item.currentlyWorking ? 'Present' : item.endDate].filter(Boolean).join(' – ') || 'Dates not provided'}</p>
                      <p>{item.description || 'No description provided.'}</p>
                    </article>
                  )) : <EmptyDetail />}
                </DetailSection>
                <DetailSection title="Education">
                  {candidateDetail.profile.education.length ? candidateDetail.profile.education.map((item, index) => (
                    <article className="employer-candidate-detail-entry" key={item.id || `${item.school}-${index}`}>
                      <h4>{item.degree || 'Qualification not specified'}</h4>
                      <p>{item.school || 'Institution not specified'}{item.year ? ` · ${item.year}` : ''}</p>
                      {item.details ? <p>{item.details}</p> : null}
                    </article>
                  )) : <EmptyDetail />}
                </DetailSection>
                <DetailSection title="Certifications and qualifications">
                  {candidateDetail.profile.certifications.length ? candidateDetail.profile.certifications.map((item, index) => (
                    <article className="employer-candidate-detail-entry" key={item.id || `${item.name}-${index}`}>
                      <h4>{item.name || 'Qualification'}</h4><p>{item.issuer || 'Issuer not provided'}</p>
                    </article>
                  )) : <EmptyDetail />}
                </DetailSection>
                <DetailSection title="Languages">
                  {candidateDetail.profile.languages.length ? candidateDetail.profile.languages.map((item, index) => (
                    <p key={item.id || `${item.name}-${index}`}><strong>{item.name || 'Language'}</strong>{item.proficiency ? ` · ${item.proficiency}` : ''}</p>
                  )) : <EmptyDetail />}
                </DetailSection>
                <DetailSection title="Portfolio projects">
                  {candidateDetail.profile.projects.length ? candidateDetail.profile.projects.map((item, index) => (
                    <article className="employer-candidate-detail-entry" key={item.id || `${item.name}-${index}`}>
                      <h4>{item.name || 'Project'}</h4>
                      {item.startDate || item.endDate ? <p>{[item.startDate, item.endDate].filter(Boolean).join(' – ')}</p> : null}
                      <p>{item.description || 'No description provided.'}</p>
                      {item.technologies?.length ? <p><strong>Technologies:</strong> {item.technologies.join(', ')}</p> : null}
                      {safeExternalUrl(item.projectUrl) ? <a href={safeExternalUrl(item.projectUrl)} target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> Project link</a> : null}
                      {safeExternalUrl(item.githubUrl) ? <a href={safeExternalUrl(item.githubUrl)} target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> GitHub</a> : null}
                    </article>
                  )) : <EmptyDetail />}
                </DetailSection>
                <DetailSection title="Professional links">
                  {safeExternalUrl(candidateDetail.profile.linkedinUrl) || safeExternalUrl(candidateDetail.profile.website) ? (
                    <div className="employer-candidate-detail-links">
                      {safeExternalUrl(candidateDetail.profile.linkedinUrl) ? <a href={safeExternalUrl(candidateDetail.profile.linkedinUrl)} target="_blank" rel="noopener noreferrer"><FaLinkedin /> LinkedIn</a> : null}
                      {safeExternalUrl(candidateDetail.profile.website) ? <a href={safeExternalUrl(candidateDetail.profile.website)} target="_blank" rel="noopener noreferrer"><FaGlobe /> Website</a> : null}
                    </div>
                  ) : <EmptyDetail />}
                </DetailSection>

                <DetailSection title="Applications to your jobs">
                  {candidateDetail.applications.length ? (
                    <>
                      <label className="employer-candidate-detail-application-select">
                        <span>Application</span>
                        <select value={selectedApplicationId} onChange={(event) => setSelectedApplicationId(event.target.value)}>
                          <option value="">Select an application</option>
                          {candidateDetail.applications.map((application) => (
                            <option value={application.id} key={application.id}>
                              {application.jobTitle} — {application.status.replaceAll('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </label>
                      {isLoadingApplicationDetail ? <p role="status"><FaSpinner className="leamjobs-spin" /> Loading application details...</p> : null}
                      {applicationDetailError ? <div className="employer-action-error" role="alert"><p>{applicationDetailError}</p><button type="button" className="employer-button employer-button--ghost" onClick={() => setApplicationDetailRetry((value) => value + 1)}>Retry application details</button></div> : null}
                      {applicationDetail ? (
                        <div className="employer-candidate-application-details">
                          <p><strong>Position:</strong> {applicationDetail.job.title}</p>
                          <p><strong>Status:</strong> {applicationDetail.status.replaceAll('_', ' ')}</p>
                          <p><strong>Applied:</strong> {formatCandidateDate(applicationDetail.createdAt)}</p>
                          {applicationDetail.coverLetter ? <p><strong>Cover letter:</strong><br />{applicationDetail.coverLetter}</p> : null}
                          {applicationDetail.resume.available ? (
                            <div className="employer-candidate-cv-actions">
                              <button className="employer-button employer-button--primary" type="button" onClick={() => void openCandidateCv()} disabled={isLoadingCv}>
                                {isLoadingCv ? <FaSpinner className="leamjobs-spin" /> : <FaFileAlt />}
                                {isLoadingCv ? 'Loading CV...' : showCv ? 'Reload CV' : 'View CV'}
                              </button>
                              {cvObjectUrl ? <button className="employer-button employer-button--ghost" type="button" onClick={downloadCandidateCv}><FaDownload /> Download CV</button> : null}
                              {applicationDetail.cvSnapshot ? <small>Using the CV snapshot captured for this application on {formatCandidateDate(applicationDetail.cvSnapshot.snapshotCapturedAt)}.</small> : null}
                            </div>
                          ) : <p className="employer-candidate-detail-empty"><FaFileAlt /> No CV was attached or saved for this application.</p>}
                          {cvError ? <p className="employer-action-error" role="alert">{cvError}</p> : null}
                          {showCv && applicationDetail.resume.source === 'template' ? (
                            <div className="employer-candidate-cv-template">
                              <CVTemplateRenderer
                                data={applicationDetail.cvSnapshot?.snapshot ?? cvDataForApplicant(applicationDetail)}
                                template={(applicationDetail.cvSnapshot?.templateId ?? applicationDetail.applicant.cvTemplate ?? 'professional') as CVTemplateId}
                              />
                            </div>
                          ) : null}
                          {showCv && cvObjectUrl && cvContentType === 'application/pdf' ? (
                            <iframe className="employer-candidate-cv-document" src={cvObjectUrl} title={`${candidateDetail.firstName} ${candidateDetail.lastName} CV`} />
                          ) : null}
                          {showCv && cvObjectUrl && cvContentType !== 'application/pdf' ? (
                            <p className="employer-candidate-detail-empty">This document format is not previewable in your browser. Use Download CV to open it.</p>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : <p className="employer-candidate-detail-empty">This candidate has not applied to any of your jobs. Application CV files are available only through applications submitted to your jobs.</p>}
                </DetailSection>
              </div>
            ) : null}
            {candidateDetail ? (
              <footer className="employer-candidate-detail-modal__footer">
                <button type="button" className="employer-button employer-button--ghost" onClick={closeCandidateDetails}>Close</button>
                <button type="button" className="employer-button employer-button--primary" onClick={() => {
                  const candidate = candidates.find((item) => item.id === candidateDetail.id);
                  closeCandidateDetails();
                  if (candidate) openInvitation(candidate);
                }}>Invite to apply</button>
              </footer>
            ) : null}
          </section>
        </div>
      ) : null}
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

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="employer-candidate-detail-section"><h3>{title}</h3>{children}</section>;
}

function EmptyDetail() {
  return <p className="employer-candidate-detail-empty">Not provided.</p>;
}

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.toString() : '';
  } catch {
    return '';
  }
}

function formatCandidateDate(value: string | null | undefined) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not provided' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function cvDataForApplicant(application: EmployerApplicationDetail): CVData {
  const applicant = application.applicant;
  return {
    personalInfo: {
      fullName: applicant.fullName,
      title: applicant.professionalTitle || 'Professional',
      email: applicant.email,
      phone: applicant.phone ?? undefined,
      location: applicant.location ?? undefined,
      linkedin: applicant.linkedinUrl ?? undefined,
      website: applicant.website ?? undefined,
    },
    summary: applicant.bio ?? '',
    experience: (applicant.experience ?? []).map((item) => ({
      jobTitle: item.jobTitle || '',
      company: item.company || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      currentlyWorking: Boolean(item.currentlyWorking),
      description: item.description || '',
    })),
    education: (applicant.education ?? []).map((item) => ({ degree: item.degree || '', school: item.school || '', year: item.year || '', details: item.details || '' })),
    skills: applicant.skills ?? [],
    certifications: (applicant.certifications ?? []).map((item) => ({ name: item.name || '', issuer: item.issuer || '' })),
    languages: (applicant.languages ?? []).map((item) => ({ name: item.name || '', proficiency: item.proficiency || '' })),
    projects: (applicant.projects ?? []).map((item) => ({
      name: item.name || '',
      description: item.description || '',
      technologies: item.technologies ?? [],
      projectUrl: item.projectUrl || '',
      githubUrl: item.githubUrl || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
    })),
  };
}

function CandidateCard({ candidate, token, onInvite, onDetails }: {
  candidate: EmployerCandidate;
  token: string;
  onInvite: (candidate: EmployerCandidate) => void;
  onDetails: (candidate: EmployerCandidate) => void;
}) {
  const { profile } = candidate;
  return (
    <article className="employer-candidate-card">
      <div className="employer-candidate-card__top">
        {profile.profilePictureUrl ? <AuthenticatedImage endpoint={`/employer/candidates/${encodeURIComponent(candidate.id)}/profile-picture`} token={token} alt={`${candidate.firstName} ${candidate.lastName} profile picture`} fallback={<span className="employer-candidate-card__avatar" aria-hidden="true">{`${candidate.firstName[0] ?? ''}${candidate.lastName[0] ?? ''}`.toUpperCase()}</span>} /> : <span className="employer-candidate-card__avatar" aria-hidden="true">{`${candidate.firstName[0] ?? ''}${candidate.lastName[0] ?? ''}`.toUpperCase()}</span>}
        <div className="employer-candidate-card__identity"><h3>{candidate.firstName} {candidate.lastName}</h3><p>{profile.professionalTitle || 'Professional title not provided'}</p></div>
      </div>
      <div className="employer-candidate-card__meta">
        {candidate.subscriptionTier === 'PROFESSIONAL' ? <div className="employer-candidate-card__tier"><span>Professional</span></div> : null}
        {candidate.featured || candidate.visibilityBoosted ? <div className="employer-candidate-card__badges">{candidate.featured ? <span><FaStar aria-hidden="true" /> Featured</span> : null}{candidate.visibilityBoosted ? <span><FaBolt aria-hidden="true" /> Visibility Boost</span> : null}</div> : null}
      </div>
      <p className="employer-candidate-card__location"><FaMapMarkerAlt aria-hidden="true" /> {profile.location || 'Location not provided'}</p>
      <p className={`employer-candidate-card__availability employer-candidate-card__availability--${candidate.availability.toLowerCase()}`}>{candidate.availability === 'AVAILABLE_NOW' ? 'Available now' : candidate.availability === 'AVAILABLE_SOON' ? 'Available soon' : 'Not currently available'}</p>
      <p className={`employer-candidate-card__bio${profile.bio ? '' : ' employer-candidate-card__bio--empty'}`}>{profile.bio || 'No profile summary added yet.'}</p>
      <div className={`employer-candidate-card__skills${profile.skills.length ? '' : ' employer-candidate-card__skills--empty'}`}>
        {profile.skills.length ? profile.skills.map((skill) => <span key={skill}>{skill}</span>) : <span>No skills listed</span>}
      </div>
      <div className="employer-candidate-card__actions">
        <button type="button" className="employer-button employer-button--ghost" onClick={() => onDetails(candidate)}>View profile</button>
        <button type="button" className="employer-button employer-button--primary employer-candidate-card__invite" onClick={() => onInvite(candidate)}>Invite to apply</button>
      </div>
    </article>
  );
}

export default EmployerCandidatesPage;
