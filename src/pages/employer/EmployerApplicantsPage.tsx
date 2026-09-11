import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft, FaBell, FaBriefcase, FaCalendarCheck, FaCheck, FaEnvelope,
  FaExternalLinkAlt, FaFileAlt, FaGlobe, FaMapMarkerAlt, FaSearch, FaSpinner, FaTimes,
} from 'react-icons/fa';
import ApplicantAvatar from '../../components/employer/ApplicantAvatar';
import { useAuth } from '../../context/AuthContext';
import {
  createEmployerApplicationConversation,
  getEmployerApplication,
  getEmployerApplicationResume,
  getEmployerApplications,
  getEmployerJobs,
  type CertificationItem,
  type EducationItem,
  type EmployerApplicationDetail,
  type EmployerApplicationListItem,
  type EmployerApplicationStatus,
  type EmployerJob,
  type ExperienceItem,
  type LanguageItem,
  type ProjectItem,
  updateEmployerApplicationStatus,
} from '../../services/api';

const statuses: Array<'ALL' | EmployerApplicationStatus> = ['ALL', 'APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'ACCEPTED', 'WITHDRAWN'];
const statusLabels: Record<typeof statuses[number], string> = {
  ALL: 'All', APPLIED: 'Applied', REVIEWING: 'Reviewing', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview',
  REJECTED: 'Rejected', ACCEPTED: 'Accepted', WITHDRAWN: 'Withdrawn',
};
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
const statusClass = (status: EmployerApplicationStatus) => `employer-application-status employer-application-status--${status.toLowerCase()}`;

function EmployerApplicantsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [applications, setApplications] = useState<EmployerApplicationListItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') ?? '');
  const [selectedApplicationId, setSelectedApplicationId] = useState(searchParams.get('applicationId') ?? '');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(searchParams.get('applicationId') ? 'detail' : 'list');
  const [selectedApplication, setSelectedApplication] = useState<EmployerApplicationDetail | null>(null);
  const [activeStatus, setActiveStatus] = useState<typeof statuses[number]>('ALL');
  const [query, setQuery] = useState('');
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isOpeningResume, setIsOpeningResume] = useState(false);
  const [resumeState, setResumeState] = useState<'idle' | 'success' | 'error'>('idle');
  const [resumeError, setResumeError] = useState('');
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [pendingRejection, setPendingRejection] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [detailRetryKey, setDetailRetryKey] = useState(0);
  const [applicationsRetryKey, setApplicationsRetryKey] = useState(0);
  const applicationCache = useRef<Record<string, EmployerApplicationListItem[]>>({});

  useEffect(() => {
    const nextJobId = searchParams.get('jobId') ?? '';
    const nextApplicationId = searchParams.get('applicationId') ?? '';
    setSelectedJobId((current) => current === nextJobId ? current : nextJobId);
    setSelectedApplicationId((current) => current === nextApplicationId ? current : nextApplicationId);
    setMobileView(nextApplicationId ? 'detail' : 'list');
    if (!nextApplicationId) {
      setSelectedApplication(null);
      setPendingRejection(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setIsLoadingJobs(true);
    setError('');
    void getEmployerJobs(token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load your jobs.');
        setJobs([]);
      } else {
        const nextJobs = result.data.data.jobs;
        applicationCache.current = {};
        setJobs(nextJobs);
        const requestedJobId = searchParams.get('jobId');
        if (requestedJobId && nextJobs.some((job) => job.id === requestedJobId)) setSelectedJobId(requestedJobId);
        else if (requestedJobId) setSelectedJobId('');
      }
      setIsLoadingJobs(false);
    });
    return () => { active = false; };
  }, [reloadKey, token]);

  useEffect(() => {
    if (!token || !jobs.length) {
      setApplications([]);
      setSelectedApplicationId('');
      setSelectedApplication(null);
      return;
    }
    let active = true;
    setIsLoadingApplications(true);
    const jobIds = selectedJobId ? [selectedJobId] : jobs.map((job) => job.id);
    const missingJobIds = jobIds.filter((jobId) => !applicationCache.current[jobId]);
    void Promise.all(missingJobIds.map(async (jobId) => {
      const result = await getEmployerApplications(jobId, token);
      if (result.ok) applicationCache.current[jobId] = result.data.data.applications;
      return result;
    })).then((results) => {
      if (!active) return;
      const failed = results.find((result) => !result.ok);
      if (failed && !failed.ok) {
        setError(failed.error.message || 'We could not load applications.');
        setApplications([]);
      } else {
        setError('');
        setApplications(jobIds.flatMap((jobId) => applicationCache.current[jobId] ?? []));
      }
      setIsLoadingApplications(false);
    });
    return () => { active = false; };
  }, [applicationsRetryKey, jobs, selectedJobId, token]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications
      .filter((application) => activeStatus === 'ALL' || application.status === activeStatus)
      .filter((application) => [application.applicant.fullName, application.applicant.professionalTitle, application.applicant.location, ...application.applicant.skills].join(' ').toLowerCase().includes(normalizedQuery))
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  }, [activeStatus, applications, query]);

  const statusCounts = useMemo(() => statuses.reduce<Record<string, number>>((counts, status) => {
    counts[status] = status === 'ALL' ? applications.length : applications.filter((application) => application.status === status).length;
    return counts;
  }, {}), [applications]);

  useEffect(() => {
    if (!filteredApplications.length) {
      setSelectedApplicationId('');
      setSelectedApplication(null);
    } else if (selectedApplicationId && !filteredApplications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(filteredApplications[0].id);
    }
  }, [filteredApplications, selectedApplicationId]);

  const selectedListItem = applications.find((application) => application.id === selectedApplicationId) ?? null;

  useEffect(() => {
    if (!token || !selectedListItem) {
      setSelectedApplication(null);
      setIsLoadingDetail(false);
      return;
    }
    let active = true;
    setIsLoadingDetail(true);
    setDetailError('');
    setResumeState('idle');
    setResumeError('');
    void getEmployerApplication(selectedListItem.jobId, selectedListItem.id, token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setSelectedApplication(null);
        setDetailError(result.error.message || 'This application is unavailable.');
      } else setSelectedApplication(result.data.data.application);
      setIsLoadingDetail(false);
    });
    return () => { active = false; };
  }, [detailRetryKey, selectedListItem, token]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const selectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedApplicationId('');
    setSelectedApplication(null);
    setMobileView('list');
    if (jobId) setSearchParams({ jobId });
    else setSearchParams({});
  };

  const selectApplication = (applicationId: string) => {
    const application = applications.find((item) => item.id === applicationId);
    if (!application) return;
    setSelectedApplicationId(applicationId);
    setMobileView('detail');
    setSearchParams({ jobId: application.jobId, applicationId });
  };

  const returnToApplicantList = () => {
    setSelectedApplicationId('');
    setSelectedApplication(null);
    setMobileView('list');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('applicationId');
    setSearchParams(nextParams);
  };

  const updateStatus = async (status: EmployerApplicationStatus) => {
    if (!token || !selectedListItem || isMutating || selectedListItem.status === status) return;
    if (status === 'REJECTED' && !pendingRejection) {
      setPendingRejection(true);
      return;
    }
    setIsMutating(true);
    setActionError('');
    setActionMessage('');
    const result = await updateEmployerApplicationStatus(selectedListItem.jobId, selectedListItem.id, status, token);
    if (!result.ok) setActionError('Unable to update the application status. Please try again.');
    else {
      setApplications((current) => current.map((application) => application.id === selectedListItem.id ? { ...application, status, updatedAt: result.data.data.application.updatedAt } : application));
      setSelectedApplication(result.data.data.application);
      setActionMessage(`Application moved to ${statusLabels[status]}.`);
    }
    setPendingRejection(false);
    setIsMutating(false);
  };

  const openResume = async () => {
    if (!token || !selectedListItem || !selectedApplication?.resume.available || isOpeningResume) return;
    const resumeWindow = window.open('', '_blank', 'noopener,noreferrer');
    setIsOpeningResume(true);
    setActionError('');
    setResumeError('');
    setResumeState('idle');
    const result = await getEmployerApplicationResume(selectedListItem.jobId, selectedListItem.id, token);
    if (!result.ok) {
      resumeWindow?.close();
      setResumeError('We could not retrieve this candidate\'s submitted resume.');
      setResumeState('error');
    }
    else {
      const url = URL.createObjectURL(result.data);
      if (resumeWindow) resumeWindow.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setResumeState('success');
    }
    setIsOpeningResume(false);
  };

  const startConversation = async () => {
    if (!token || !selectedListItem || isMutating) return;
    setIsMutating(true);
    setActionError('');
    const result = await createEmployerApplicationConversation(selectedListItem.jobId, selectedListItem.id, token);
    if (!result.ok) setActionError('Unable to message this candidate. Please try again.');
    else navigate(`/employer/messages?conversationId=${encodeURIComponent(result.data.data.conversation.id)}`);
    setIsMutating(false);
  };

  const applicant = selectedApplication?.applicant;

  const renderBadgeList = (skills: string[] | null | undefined) => {
    return (
      <section className="employer-candidate-section applicant-skills-section">
        <div className="employer-detail-section-header"><h2>Skills</h2></div>
        {skills?.filter((skill) => skill && skill.trim()).length ? <div className="employer-skill-list">{skills.filter((skill) => skill && skill.trim()).map((skill) => <span key={skill}>{skill}</span>)}</div> : <p className="applicant-section-empty">No skills provided.</p>}
      </section>
    );
  };

  const formatDateRange = (startDate?: string, endDate?: string, currentlyWorking?: boolean) => {
    const range = [startDate, currentlyWorking ? 'Present' : endDate].filter(Boolean);
    return range.length ? range.join(' — ') : 'Dates not provided';
  };

  const renderExperience = (items: ExperienceItem[] | null | undefined) => {
    if (!items?.length) return null;

    return (
      <section className="employer-candidate-section">
        <div className="employer-detail-section-header">
          <h2>Professional Experience</h2>
        </div>
        <div className="employer-profile-entry-list">
          {items.map((item) => (
            <article className="employer-profile-entry" key={item.id || `${item.company}-${item.jobTitle}`}>
              <div className="employer-profile-entry__top">
                <div>
                  <h3>{item.jobTitle || 'Role not provided'}</h3>
                  <p>{item.company || 'Company not provided'}</p>
                </div>
                {item.currentlyWorking ? <span className="employer-inline-badge">Current</span> : null}
              </div>
              <p className="employer-profile-entry__meta">{formatDateRange(item.startDate, item.endDate, item.currentlyWorking)}</p>
              {item.description ? <p>{item.description}</p> : null}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderEducation = (items: EducationItem[] | null | undefined) => {
    if (!items?.length) return null;

    return (
      <section className="employer-candidate-section">
        <div className="employer-detail-section-header">
          <h2>Education</h2>
        </div>
        <div className="employer-profile-entry-list">
          {items.map((item) => (
            <article className="employer-profile-entry" key={item.id || `${item.school}-${item.degree}`}>
              <div className="employer-profile-entry__top">
                <div>
                  <h3>{item.degree || 'Degree not provided'}</h3>
                  <p>{item.school || 'School not provided'}</p>
                </div>
              </div>
              {item.year ? <p className="employer-profile-entry__meta">{item.year}</p> : null}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderCertifications = (items: CertificationItem[] | null | undefined) => {
    if (!items?.length) return null;

    return (
      <section className="employer-candidate-section">
        <div className="employer-detail-section-header">
          <h2>Certifications</h2>
        </div>
        <div className="employer-profile-entry-list">
          {items.map((item) => (
            <article className="employer-profile-entry" key={item.id || `${item.name}-${item.issuer}`}>
              <div className="employer-profile-entry__top">
                <div>
                  <h3>{item.name || 'Certification not provided'}</h3>
                  {item.issuer ? <p>{item.issuer}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderLanguages = (items: LanguageItem[] | null | undefined) => {
    if (!items?.length) return null;

    return (
      <section className="employer-candidate-section">
        <div className="employer-detail-section-header">
          <h2>Languages</h2>
        </div>
        <div className="employer-tag-list">
          {items.filter((item) => item && (item.name || item.proficiency)).map((item) => (
            <span className="employer-tag" key={item.id || `${item.name}-${item.proficiency}`}>
              {item.name || 'Language'}{item.proficiency ? ` — ${item.proficiency}` : ''}
            </span>
          ))}
        </div>
      </section>
    );
  };

  const renderProjects = (items: ProjectItem[] | null | undefined) => {
    if (!items?.length) return null;

    return (
      <section className="employer-candidate-section">
        <div className="employer-detail-section-header">
          <h2>Projects</h2>
        </div>
        <div className="employer-profile-entry-list">
          {items.map((item) => (
            <article className="employer-profile-entry" key={item.id || `${item.name}-${item.startDate}-${item.endDate}`}>
              <div className="employer-profile-entry__top">
                <div>
                  <h3>{item.name || 'Project not provided'}</h3>
                  {item.startDate || item.endDate ? <p className="employer-profile-entry__meta">{formatDateRange(item.startDate, item.endDate, false)}</p> : null}
                </div>
              </div>
              {item.description ? <p>{item.description}</p> : null}
              {item.technologies?.length ? <div className="employer-tag-list employer-tag-list--compact"><span className="employer-tag employer-tag--muted">Technologies</span>{item.technologies.filter(Boolean).map((technology) => <span className="employer-tag" key={`${item.id}-${technology}`}>{technology}</span>)}</div> : null}
              {item.projectUrl || item.githubUrl ? (
                <div className="employer-profile-entry__links">
                  {item.projectUrl ? <a href={item.projectUrl} target="_blank" rel="noreferrer">Project link</a> : null}
                  {item.githubUrl ? <a href={item.githubUrl} target="_blank" rel="noreferrer">GitHub link</a> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="employer-page employer-applicants-page">
      <section className="employer-hero employer-hero--compact"><div className="employer-hero__top"><div><span className="employer-eyebrow">Applicant dashboard</span><h1>Review candidate applications</h1><p>Review real applicants, submitted information, and current application status.</p></div><button className="employer-icon-button" type="button" aria-label="Notifications"><FaBell /></button></div></section>
      <main className={`employer-content employer-applicants-grid applicant-workspace ${mobileView === 'detail' ? 'applicant-workspace--detail' : ''}`}>
        <section className="employer-panel employer-applicant-list-panel">
          <div className="employer-section-heading employer-applicants-heading"><div><h2>Applicants</h2><p>{selectedJob?.title || 'All jobs'} · {applications.length} candidates</p></div><label className="employer-job-selector"><span className="sr-only">Select job</span><select value={selectedJobId} onChange={(event) => selectJob(event.target.value)} disabled={isLoadingJobs || !jobs.length}><option value="">All jobs ({applications.length})</option>{jobs.map((job) => <option value={job.id} key={job.id}>{job.title} ({job.applicantCount})</option>)}</select></label></div>
          <div className="employer-list-tools"><div className="employer-search"><label className="sr-only" htmlFor="applicant-search">Search applicants</label><FaSearch /><input id="applicant-search" type="search" placeholder="Search applicants, titles, or skills" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" className="applicant-search-clear" onClick={() => setQuery('')} aria-label="Clear applicant search" disabled={!query}><FaTimes /></button></div></div>
          <div className="employer-tabs applicant-filter-tabs" aria-label="Application status filters">{statuses.map((status) => <button className={status === activeStatus ? 'employer-tab--active' : ''} type="button" key={status} onClick={() => setActiveStatus(status)} aria-pressed={status === activeStatus}>{statusLabels[status]} <span>{statusCounts[status]}</span></button>)}</div>
          {query || activeStatus !== 'ALL' ? <div className="applicant-filter-summary"><span>{filteredApplications.length} matching candidates</span><button type="button" onClick={() => { setQuery(''); setActiveStatus('ALL'); }}>Clear filters</button></div> : null}
          <div className="employer-applicant-list" aria-busy={isLoadingApplications}>
            {isLoadingJobs ? <div className="applicant-list-loading" aria-live="polite" aria-label="Loading applicant list" role="status">{[1, 2, 3].map((item) => <article className="applicant-list-loading__item" key={item}><span className="leamjobs-skeleton-circle" /><span><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-line" /></span></article>)}</div> : null}
            {isLoadingApplications ? (
              <div aria-live="polite" aria-label="Loading applications" role="status">
                {[1, 2, 3].map((item) => (
                  <article className="employer-applicant-card employer-applicant-card--skeleton" key={item} aria-hidden="true">
                    <div className="employer-applicant-card__skeleton">
                      <span className="leamjobs-skeleton-circle" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                      <div>
                        <span className="leamjobs-skeleton-line" style={{ width: '62%', height: '0.9rem' }} />
                        <span className="leamjobs-skeleton-line" style={{ width: '74%', height: '0.8rem', marginTop: '0.45rem' }} />
                        <span className="leamjobs-skeleton-line" style={{ width: '85%', height: '0.72rem', marginTop: '0.35rem' }} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {error ? <div className="employer-empty-state applicant-state" role="alert"><strong>Applicants unavailable</strong><p>We could not load this applicant list right now.</p><button className="employer-button employer-button--ghost" type="button" onClick={() => { setReloadKey((value) => value + 1); setApplicationsRetryKey((value) => value + 1); }}>Try again</button></div> : null}
            {!isLoadingJobs && !isLoadingApplications && !error && !jobs.length ? <div className="employer-empty-state"><strong>Post your first job to start receiving applications.</strong><p>Your applications will appear here once candidates apply.</p></div> : null}
            {!isLoadingApplications && !error && jobs.length > 0 && !filteredApplications.length ? <div className="employer-empty-state"><strong>{applications.length ? 'No applicants match your current filters.' : 'No applications yet for this job.'}</strong><p>Try another job or adjust your search and status filters.</p></div> : null}
            {!isLoadingApplications && !error ? filteredApplications.map((application) => <article className={`employer-applicant-card applicant-list-card ${selectedApplicationId === application.id ? 'employer-applicant-card--active applicant-list-card--active' : ''}`} key={application.id}><button type="button" onClick={() => selectApplication(application.id)} aria-label={`Review application from ${application.applicant.fullName}`} aria-pressed={selectedApplicationId === application.id}><ApplicantAvatar name={application.applicant.fullName} imageUrl={application.applicant.profilePictureUrl ?? undefined} /><div><h3>{application.applicant.fullName}</h3><p>{application.applicant.professionalTitle || 'Professional title not provided'}</p><div className="employer-applicant-card__meta"><span><FaMapMarkerAlt /> {application.applicant.location || 'Location not provided'}</span><span><FaCalendarCheck /> {formatDate(application.createdAt)}</span><span className={statusClass(application.status)}>{statusLabels[application.status]}</span></div></div></button></article>) : null}
          </div>
        </section>
        <aside className="employer-panel employer-candidate-detail applicant-detail-pane">
          <button className="employer-mobile-back" type="button" onClick={returnToApplicantList}><FaArrowLeft /> Back to applicants</button>
          {isLoadingDetail ? (
            <div className="applicant-detail-skeleton" aria-live="polite" aria-label="Loading applicant details" role="status">
              <div className="applicant-detail-skeleton__header"><span className="leamjobs-skeleton-circle" /><span><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-line" /></span></div>
              <div className="applicant-detail-skeleton__facts"><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-line" /></div>
              <div className="applicant-detail-skeleton__board"><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-block" /><span className="leamjobs-skeleton-block" /></div>
              <div className="applicant-detail-skeleton__board applicant-detail-skeleton__board--application"><span className="leamjobs-skeleton-line" /><span className="leamjobs-skeleton-block" /><span className="leamjobs-skeleton-block" /></div>
            </div>
          ) : null}
          {!isLoadingDetail && detailError ? <div className="employer-empty-state applicant-state" role="alert"><strong>Unable to load this candidate</strong><p>We could not load the applicant details right now.</p><button className="employer-button employer-button--ghost" type="button" onClick={() => setDetailRetryKey((value) => value + 1)}>Try again</button></div> : null}
          {!isLoadingDetail && !detailError && selectedApplication && applicant ? <>
            <div className="employer-candidate-detail__header">
              <ApplicantAvatar name={applicant.fullName} imageUrl={applicant.profilePictureUrl ?? undefined} size="lg" />
              <div className="employer-candidate-detail__header-copy">
                <h2>{applicant.fullName}</h2>
                <p>{applicant.professionalTitle || 'Professional title not provided'}</p>
              </div>
              <div className="employer-candidate-detail__header-actions">
                <span className={statusClass(selectedApplication.status)}>{statusLabels[selectedApplication.status]}</span>
                <button className="employer-button employer-button--primary" type="button" onClick={() => void openResume()} disabled={!selectedApplication.resume.available || isOpeningResume}>
                  {isOpeningResume ? <FaSpinner className="leamjobs-spin" /> : <FaFileAlt />} View CV
                </button>
                <button className="employer-button employer-button--ghost" type="button" onClick={() => void startConversation()} disabled={isMutating}><FaEnvelope /> Message</button>
              </div>
            </div>
            <div className="employer-candidate-facts">
              <span><FaMapMarkerAlt /> {applicant.location || 'Location not provided'}</span>
              <span><FaCalendarCheck /> Applied {formatDate(selectedApplication.createdAt)}</span>
              <span><FaBriefcase /> {selectedApplication.job.title}</span>
            </div>
            <div className="employer-detail-grid">
              <div className="employer-detail-main">
                {applicant.bio ? <section className="employer-candidate-section"><div className="employer-detail-section-header"><h2>About the applicant</h2></div><p>{applicant.bio}</p></section> : null}
                {renderBadgeList(applicant.skills)}
                {renderExperience(applicant.experience)}
                {renderEducation(applicant.education)}
                {renderCertifications(applicant.certifications)}
                {renderLanguages(applicant.languages)}
                {renderProjects(applicant.projects)}
                {applicant.linkedinUrl ? <section className="employer-candidate-section"><div className="employer-detail-section-header"><h2>Profile links</h2></div><p className="employer-profile-link"><FaGlobe /> <a href={applicant.linkedinUrl} target="_blank" rel="noreferrer">View LinkedIn profile ↗</a></p></section> : null}
              </div>
              <div className="employer-detail-sidebar">
                <section className="employer-candidate-section applicant-cover-letter">
                  <div className="employer-detail-section-header"><h2>Cover letter</h2></div>
                  <p>{selectedApplication.coverLetter || 'No cover letter submitted.'}</p>
                </section>
                <section className="employer-candidate-section">
                  <div className="employer-detail-section-header">
                    <h2>Application summary</h2>
                  </div>
                  <div className="employer-summary-list">
                    <div><span>Submitted</span><strong>{formatDate(selectedApplication.createdAt)}</strong></div>
                    <div><span>Resume</span><strong>{selectedApplication.resume.available ? 'Available' : 'Unavailable'}</strong></div>
                    <div><span>Job</span><strong>{selectedApplication.job.title}</strong></div>
                  </div>
                  <label className="employer-status-field">
                    <span>Application status</span>
                    <select className="employer-status-select" value={selectedApplication.status} onChange={(event) => void updateStatus(event.target.value as EmployerApplicationStatus)} disabled={isMutating} aria-label="Application status">
                      {statuses.filter((status) => status !== 'ALL').map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
                    </select>
                  </label>
                </section>
                {actionError ? <p className="employer-action-error" role="alert">{actionError}</p> : null}
                {actionMessage ? <p className="employer-action-success" role="status">{actionMessage}</p> : null}
                <section className="employer-cv-card" aria-label={`${applicant.fullName} CV`}>
                  <span className="employer-cv-card__icon"><FaFileAlt /></span>
                  <div>
                    <h2>Candidate CV</h2>
                    <p>{resumeState === 'error' ? resumeError : selectedApplication.resume.available ? 'Submitted with this application.' : 'No CV was submitted with this application.'}</p>
                    {selectedApplication.resume.submittedAt ? <small>Submitted {formatDate(selectedApplication.resume.submittedAt)}</small> : null}
                  </div>
                  {resumeState === 'error' ? <button className="employer-button employer-button--ghost applicant-cv-retry" type="button" onClick={() => void openResume()} disabled={isOpeningResume}>{isOpeningResume ? <FaSpinner className="leamjobs-spin" /> : <FaExternalLinkAlt />} Try again</button> : null}
                </section>
                {pendingRejection ? <div className="applicant-confirmation" role="alert"><div><strong>Reject this application?</strong><span>This moves the candidate out of your active review queue.</span></div><button className="employer-button employer-button--danger" type="button" onClick={() => void updateStatus('REJECTED')}>Confirm reject</button><button className="employer-button employer-button--ghost" type="button" onClick={() => setPendingRejection(false)}>Cancel</button></div> : null}
                <div className="employer-review-actions">
                  {!['REJECTED', 'WITHDRAWN', 'ACCEPTED'].includes(selectedApplication.status) ? <button className="employer-button employer-button--danger" type="button" onClick={() => void updateStatus('REJECTED')} disabled={isMutating}><FaTimes /> Reject</button> : null}
                  {!['SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(selectedApplication.status) ? <button className="employer-button employer-button--primary" type="button" onClick={() => void updateStatus('SHORTLISTED')} disabled={isMutating}><FaCheck /> Shortlist</button> : null}
                </div>
              </div>
            </div>
          </> : null}
          {!isLoadingDetail && !detailError && !selectedApplication && !filteredApplications.length ? <div className="employer-empty-state"><strong>Select an applicant to review details.</strong></div> : null}
        </aside>
      </main>
    </div>
  );
}

export default EmployerApplicantsPage;
