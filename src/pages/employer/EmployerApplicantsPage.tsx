import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft, FaBell, FaBriefcase, FaCalendarCheck, FaCheck, FaDownload, FaEnvelope,
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
  type EmployerApplicationDetail,
  type EmployerApplicationListItem,
  type EmployerApplicationStatus,
  type EmployerJob,
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
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<EmployerApplicationDetail | null>(null);
  const [activeStatus, setActiveStatus] = useState<typeof statuses[number]>('ALL');
  const [query, setQuery] = useState('');
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isOpeningResume, setIsOpeningResume] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    setIsLoadingJobs(true);
    void getEmployerJobs(token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error.message || 'We could not load your jobs.');
        setJobs([]);
      } else {
        const nextJobs = result.data.data.jobs;
        setJobs(nextJobs);
        const requestedJobId = searchParams.get('jobId');
        if (requestedJobId && nextJobs.some((job) => job.id === requestedJobId)) setSelectedJobId(requestedJobId);
        else if (requestedJobId) setSelectedJobId('');
      }
      setIsLoadingJobs(false);
    });
    return () => { active = false; };
  }, [searchParams, token]);

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
    void Promise.all(jobIds.map((jobId) => getEmployerApplications(jobId, token))).then((results) => {
      if (!active) return;
      const failed = results.find((result) => !result.ok);
      if (failed && !failed.ok) {
        setError(failed.error.message || 'We could not load applications.');
        setApplications([]);
      } else {
        setError('');
        setApplications(results.flatMap((result) => result.ok ? result.data.data.applications : []));
      }
      setIsLoadingApplications(false);
    });
    return () => { active = false; };
  }, [jobs, selectedJobId, token]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications
      .filter((application) => activeStatus === 'ALL' || application.status === activeStatus)
      .filter((application) => [application.applicant.fullName, application.applicant.professionalTitle, application.applicant.location, ...application.applicant.skills].join(' ').toLowerCase().includes(normalizedQuery))
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  }, [activeStatus, applications, query]);

  useEffect(() => {
    if (!filteredApplications.length) {
      setSelectedApplicationId('');
      setSelectedApplication(null);
    } else if (!filteredApplications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(filteredApplications[0].id);
    }
  }, [filteredApplications, selectedApplicationId]);

  const selectedListItem = applications.find((application) => application.id === selectedApplicationId) ?? null;

  useEffect(() => {
    if (!token || !selectedListItem) {
      setSelectedApplication(null);
      return;
    }
    let active = true;
    setIsLoadingDetail(true);
    setDetailError('');
    void getEmployerApplication(selectedListItem.jobId, selectedListItem.id, token).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setSelectedApplication(null);
        setDetailError(result.error.message || 'This application is unavailable.');
      } else setSelectedApplication(result.data.data.application);
      setIsLoadingDetail(false);
    });
    return () => { active = false; };
  }, [selectedListItem, token]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const selectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedApplicationId('');
    setSelectedApplication(null);
    if (jobId) setSearchParams({ jobId });
    else setSearchParams({});
  };

  const updateStatus = async (status: EmployerApplicationStatus) => {
    if (!token || !selectedListItem || isMutating || selectedListItem.status === status) return;
    if (status === 'REJECTED' && !window.confirm('Reject this application?')) return;
    setIsMutating(true);
    setActionError('');
    const result = await updateEmployerApplicationStatus(selectedListItem.jobId, selectedListItem.id, status, token);
    if (!result.ok) setActionError(result.error.message || 'The application status could not be updated.');
    else {
      setApplications((current) => current.map((application) => application.id === selectedListItem.id ? { ...application, status, updatedAt: result.data.data.application.updatedAt } : application));
      setSelectedApplication(result.data.data.application);
    }
    setIsMutating(false);
  };

  const openResume = async () => {
    if (!token || !selectedListItem || !selectedApplication?.resume.available || isOpeningResume) return;
    setIsOpeningResume(true);
    setActionError('');
    const result = await getEmployerApplicationResume(selectedListItem.jobId, selectedListItem.id, token);
    if (!result.ok) setActionError(result.error.message || 'The CV could not be loaded.');
    else {
      const url = URL.createObjectURL(result.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    setIsOpeningResume(false);
  };

  const startConversation = async () => {
    if (!token || !selectedListItem || isMutating) return;
    setIsMutating(true);
    setActionError('');
    const result = await createEmployerApplicationConversation(selectedListItem.jobId, selectedListItem.id, token);
    if (!result.ok) setActionError(result.error.message || 'The conversation could not be opened.');
    else navigate(`/employer/messages?conversationId=${encodeURIComponent(result.data.data.conversation.id)}`);
    setIsMutating(false);
  };

  const applicant = selectedApplication?.applicant;
  const renderList = (value: unknown) => {
    const items = Array.isArray(value) ? value : value && typeof value === 'object' ? Object.entries(value).map(([key, item]) => `${key}: ${String(item)}`) : [];
    return items.length ? <ul>{items.map((item, index) => <li key={`${String(item)}-${index}`}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}</ul> : null;
  };

  return (
    <div className="employer-page employer-applicants-page">
      <section className="employer-hero employer-hero--compact"><div className="employer-hero__top"><div><span className="employer-eyebrow">Applicant dashboard</span><h1>Review candidate applications</h1><p>Review real applicants, submitted information, and current application status.</p></div><button className="employer-icon-button" type="button" aria-label="Notifications"><FaBell /></button></div></section>
      <main className="employer-content employer-applicants-grid">
        <section className="employer-panel employer-applicant-list-panel">
          <div className="employer-section-heading employer-applicants-heading"><div><h2>Applications</h2><p>{selectedJob?.title || 'All jobs'}</p></div><label className="employer-job-selector"><span className="sr-only">Select job</span><select value={selectedJobId} onChange={(event) => selectJob(event.target.value)} disabled={isLoadingJobs || !jobs.length}><option value="">All jobs ({applications.length})</option>{jobs.map((job) => <option value={job.id} key={job.id}>{job.title} ({job.applicantCount})</option>)}</select></label></div>
          <div className="employer-list-tools"><label className="employer-search" aria-label="Search applicants"><FaSearch /><input type="search" placeholder="Search applicants, titles, or skills" value={query} onChange={(event) => setQuery(event.target.value)} /></label><span className="employer-sort-caption">Newest first / {filteredApplications.length} applicants</span></div>
          <div className="employer-tabs" aria-label="Application status filters">{statuses.map((status) => <button className={status === activeStatus ? 'employer-tab--active' : ''} type="button" key={status} onClick={() => setActiveStatus(status)} aria-pressed={status === activeStatus}>{statusLabels[status]}</button>)}</div>
          <div className="employer-applicant-list" aria-busy={isLoadingApplications}>
            {isLoadingApplications ? <div className="employer-empty-state" role="status"><FaSpinner className="leamjobs-spin" /> Loading applications...</div> : null}
            {error ? <div className="employer-empty-state" role="alert"><strong>Applications unavailable</strong><p>{error}</p></div> : null}
            {!isLoadingApplications && !error && !jobs.length ? <div className="employer-empty-state"><strong>Post your first job to start receiving applications.</strong><p>Your applications will appear here once candidates apply.</p></div> : null}
            {!isLoadingApplications && !error && jobs.length > 0 && !filteredApplications.length ? <div className="employer-empty-state"><strong>{applications.length ? 'No applicants match your current filters.' : 'No applications yet for this job.'}</strong><p>Try another job or adjust your search and status filters.</p></div> : null}
            {!isLoadingApplications && !error ? filteredApplications.map((application) => <article className={`employer-applicant-card ${selectedApplicationId === application.id ? 'employer-applicant-card--active' : ''}`} key={application.id}><button type="button" onClick={() => setSelectedApplicationId(application.id)} aria-label={`Review application from ${application.applicant.fullName}`}><ApplicantAvatar name={application.applicant.fullName} imageUrl={application.applicant.profilePictureUrl ?? undefined} /><div><h3>{application.applicant.fullName}</h3><p>{application.applicant.professionalTitle || 'Professional title not provided'}</p><div className="employer-applicant-card__meta"><span><FaMapMarkerAlt /> {application.applicant.location || 'Location not provided'}</span><span><FaCalendarCheck /> {formatDate(application.createdAt)}</span><span className={statusClass(application.status)}>{statusLabels[application.status]}</span></div></div></button></article>) : null}
          </div>
        </section>
        <aside className="employer-panel employer-candidate-detail">
          <button className="employer-mobile-back" type="button" onClick={() => setSelectedApplicationId('')}><FaArrowLeft /> Back to applicants</button>
          {isLoadingDetail ? <div className="employer-empty-state" role="status"><FaSpinner className="leamjobs-spin" /> Loading applicant details...</div> : null}
          {!isLoadingDetail && detailError ? <div className="employer-empty-state" role="alert"><strong>Application unavailable</strong><p>{detailError}</p></div> : null}
          {!isLoadingDetail && !detailError && selectedApplication && applicant ? <>
            <div className="employer-candidate-detail__header"><ApplicantAvatar name={applicant.fullName} imageUrl={applicant.profilePictureUrl ?? undefined} size="lg" /><div><h2>{applicant.fullName}</h2><p>{applicant.professionalTitle || 'Professional title not provided'}</p></div><span className={statusClass(selectedApplication.status)}>{statusLabels[selectedApplication.status]}</span></div>
            <div className="employer-candidate-facts"><span><FaMapMarkerAlt /> {applicant.location || 'Location not provided'}</span><span><FaCalendarCheck /> Applied {formatDate(selectedApplication.createdAt)}</span><span><FaBriefcase /> {selectedApplication.job.title}</span></div>
            <section className="employer-candidate-section"><div className="employer-section-heading"><div><h2>Application status</h2><p>Update the current stage for this application.</p></div></div><select className="employer-status-select" value={selectedApplication.status} onChange={(event) => void updateStatus(event.target.value as EmployerApplicationStatus)} disabled={isMutating} aria-label="Application status">{statuses.filter((status) => status !== 'ALL').map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></section>
            {actionError ? <p className="employer-action-error" role="alert">{actionError}</p> : null}
            <section className="employer-cv-card" aria-label={`${applicant.fullName} CV`}><span className="employer-cv-card__icon"><FaFileAlt /></span><div><h2>Candidate CV</h2><p>{selectedApplication.resume.available ? 'Application CV is available through the protected employer endpoint.' : 'CV not available for this application.'}</p>{selectedApplication.resume.submittedAt ? <small>Submitted {formatDate(selectedApplication.resume.submittedAt)}</small> : null}</div><div className="employer-cv-card__actions"><button className="employer-button employer-button--primary" type="button" onClick={() => void openResume()} disabled={!selectedApplication.resume.available || isOpeningResume}>{isOpeningResume ? <FaSpinner className="leamjobs-spin" /> : <FaExternalLinkAlt />} View CV</button><button className="employer-button employer-button--ghost" type="button" onClick={() => void openResume()} disabled={!selectedApplication.resume.available || isOpeningResume} aria-label="Download CV"><FaDownload /></button></div></section>
            {applicant.bio ? <section className="employer-candidate-section"><h2>About the applicant</h2><p>{applicant.bio}</p></section> : null}
            {applicant.skills.length ? <section className="employer-candidate-section"><h2>Skills</h2><div className="employer-skill-list">{applicant.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section> : null}
            {applicant.experience?.length ? <section className="employer-candidate-section"><h2>Experience</h2>{renderList(applicant.experience)}</section> : null}
            {applicant.education?.length ? <section className="employer-candidate-section"><h2>Education</h2>{renderList(applicant.education)}</section> : null}
            {applicant.certifications?.length ? <section className="employer-candidate-section"><h2>Certifications</h2>{renderList(applicant.certifications)}</section> : null}
            {applicant.languages?.length ? <section className="employer-candidate-section"><h2>Languages</h2><p>{applicant.languages.map((item) => `${item.name} (${item.proficiency})`).join(', ')}</p></section> : null}
            {applicant.projects?.length ? <section className="employer-candidate-section"><h2>Projects</h2>{renderList(applicant.projects)}</section> : null}
            {applicant.linkedinUrl ? <p className="employer-profile-link"><FaGlobe /> <a href={applicant.linkedinUrl} target="_blank" rel="noreferrer">View LinkedIn profile</a></p> : null}
            <section className="employer-candidate-section"><h2>Cover letter</h2><p>{selectedApplication.coverLetter || 'No cover letter submitted.'}</p></section>
            <div className="employer-review-actions"><button className="employer-button employer-button--danger" type="button" onClick={() => void updateStatus('REJECTED')} disabled={isMutating}><FaTimes /> Reject</button><button className="employer-button employer-button--ghost" type="button" onClick={() => void startConversation()} disabled={isMutating}><FaEnvelope /> Message</button><button className="employer-button employer-button--primary" type="button" onClick={() => void updateStatus('SHORTLISTED')} disabled={isMutating}><FaCheck /> Shortlist</button></div>
          </> : null}
          {!isLoadingDetail && !detailError && !selectedApplication && !filteredApplications.length ? <div className="employer-empty-state"><strong>Select an applicant to review details.</strong></div> : null}
        </aside>
      </main>
    </div>
  );
}

export default EmployerApplicantsPage;
