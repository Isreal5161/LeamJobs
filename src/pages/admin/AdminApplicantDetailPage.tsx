import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCheck, FaDownload, FaFileAlt, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminJob,
  getAdminJobApplication,
  getAdminJobApplicationResume,
  selectAdminContractApplication,
  type AdminApplicationDetail,
  type AdminJob,
  type EmployerApplicationStatus,
} from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const statusLabels: Record<EmployerApplicationStatus, string> = {
  APPLIED: 'Applied', REVIEWING: 'Reviewing', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', REJECTED: 'Rejected', ACCEPTED: 'Accepted', PAYMENT_PENDING: 'Selected', WITHDRAWN: 'Withdrawn',
};
const statusClass = (status: EmployerApplicationStatus) => `admin-applicant-status admin-applicant-status--${status.toLowerCase()}`;
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
const initialsFromName = (value: string) => value.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'NA';

function AdminApplicantDetailPage() {
  const { jobId, applicationId } = useParams();
  const { token } = useAuth();
  const [job, setJob] = useState<AdminJob | null>(null);
  const [application, setApplication] = useState<AdminApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpeningResume, setIsOpeningResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const [showConfirmSelection, setShowConfirmSelection] = useState(false);

  useEffect(() => {
    if (!token || !jobId || !applicationId) {
      setJob(null);
      setApplication(null);
      setError('This applicant detail is unavailable.');
      setIsLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      setResumeError('');

      const [jobResult, applicationResult] = await Promise.all([
        getAdminJob(jobId, token),
        getAdminJobApplication(jobId, applicationId, token),
      ]);

      if (!active) return;

      if (!jobResult.ok) {
        setJob(null);
        setApplication(null);
        setError(jobResult.error.message || 'We could not load this application.');
        setIsLoading(false);
        return;
      }

      if (!applicationResult.ok) {
        setJob(null);
        setApplication(null);
        setError(applicationResult.error.message || 'We could not load this application.');
        setIsLoading(false);
        return;
      }

      setJob(jobResult.data.data.job);
      setApplication(applicationResult.data.data.application);
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [applicationId, jobId, token]);

  const openResume = async () => {
    if (!token || !jobId || !applicationId) return;
    setIsOpeningResume(true);
    setResumeError('');

    const result = await getAdminJobApplicationResume(jobId, applicationId, token);
    if (!result.ok) {
      setResumeError(result.error.message || 'The CV could not be loaded.');
      setIsOpeningResume(false);
      return;
    }

    const url = URL.createObjectURL(result.data);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpeningResume(false);
  };

  const canSelectCandidate = job !== null && application !== null
    && job.engagementType === 'CONTRACT'
    && !application.contractId
    && !['ACCEPTED', 'PAYMENT_PENDING'].includes(application.status)
    && ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW'].includes(application.status);

  const selectCandidate = async () => {
    if (!token || !jobId || !applicationId || isSelecting) return;

    setIsSelecting(true);
    setSelectionError('');
    const result = await selectAdminContractApplication(jobId, applicationId, token);

    if (!result.ok) {
      setSelectionError(result.error.message || 'The candidate could not be selected for this contract role.');
      setIsSelecting(false);
      setShowConfirmSelection(false);
      return;
    }

    setApplication((current) => current ? { ...current, status: 'PAYMENT_PENDING', contractId: result.data.data.selection.contractId } : current);
    setShowConfirmSelection(false);
    setIsSelecting(false);
  };

  if (isLoading) {
    return <AdminPageSkeleton showToolbar={false} statCards={0} rows={3} />;
  }

  if (!job || !application) {
    return (
      <div className="admin-page admin-empty-state" role="alert">
        <strong>Applicant detail unavailable</strong>
        <p>{error || 'This job application could not be found.'}</p>
      </div>
    );
  }

  const applicant = application.applicant;

  return (
    <div className="admin-page admin-applicant-detail-page">
      <section className="admin-hero admin-applicants-hero">
        <div>
          <span className="admin-eyebrow">Applicant review</span>
          <h1>{applicant.fullName}</h1>
          <p>{job.title} · {applicant.professionalTitle || 'Professional title not provided'}</p>
        </div>
        <Link className="admin-button admin-button--secondary admin-button--icon" to={`/admin/jobs/${jobId}/applicants`}>
          <FaArrowLeft />
          <span>Back to applicants</span>
        </Link>
      </section>

      {resumeError ? (
        <section className="admin-panel admin-empty-state" role="alert">
          <strong>CV could not be opened</strong>
          <p>{resumeError}</p>
        </section>
      ) : null}

      {selectionError ? (
        <section className="admin-panel admin-empty-state" role="alert">
          <strong>Selection could not be completed</strong>
          <p>{selectionError}</p>
        </section>
      ) : null}

      {showConfirmSelection ? (
        <section className="admin-panel" role="dialog" aria-modal="true" aria-labelledby="admin-contract-selection-title">
          <div className="admin-release-confirmation">
            <div>
              <strong id="admin-contract-selection-title">Select this candidate for a contract job?</strong>
              <p>This creates the contract and escrow flow for this LeamJobs role. The candidate will move to payment pending.</p>
            </div>
            <div className="admin-release-confirmation__actions">
              <button type="button" className="admin-button admin-button--secondary" onClick={() => setShowConfirmSelection(false)} disabled={isSelecting}>Cancel</button>
              <button type="button" className="admin-button admin-button--primary" onClick={() => void selectCandidate()} disabled={isSelecting}>
                {isSelecting ? <FaSpinner className="leamjobs-spin" /> : <FaCheck />}
                <span>{isSelecting ? 'Selecting...' : 'Confirm selection'}</span>
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="admin-panel admin-applicant-detail-panel">
        <div className="admin-applicant-detail__header">
          <div className="admin-applicant-card__avatar admin-applicant-card__avatar--large">{initialsFromName(applicant.fullName)}</div>
          <div>
            <div className="admin-applicant-detail__title-row">
              <h2>{applicant.fullName}</h2>
              <span className={statusClass(application.status)}>{statusLabels[application.status]}</span>
            </div>
            <p>{applicant.professionalTitle || 'Professional title not provided'}</p>
          </div>
          <div className="admin-applicant-detail__actions">
            {canSelectCandidate ? (
              <button type="button" className="admin-button admin-button--primary admin-button--icon" onClick={() => setShowConfirmSelection(true)} disabled={isSelecting}>
                <FaCheck />
                <span>Select candidate</span>
              </button>
            ) : null}
            <button type="button" className="admin-button admin-button--secondary admin-button--icon" onClick={() => void openResume()} disabled={isOpeningResume}>
              {isOpeningResume ? <FaSpinner className="leamjobs-spin" /> : <FaFileAlt />}
              <span>View CV</span>
            </button>
          </div>
        </div>

        <div className="admin-applicant-detail__facts">
          <span><FaMapMarkerAlt /> {applicant.location || 'Location not provided'}</span>
          <span><FaCalendarAlt /> Applied {formatDate(application.createdAt)}</span>
          <span><FaDownload /> Resume {application.resume.available ? 'available' : 'unavailable'}</span>
        </div>

        <div className="admin-applicant-detail__content">
          <article className="admin-applicant-detail__section">
            <h3>About</h3>
            <p>{applicant.bio || 'No profile bio is available yet.'}</p>
          </article>

          <article className="admin-applicant-detail__section">
            <h3>Contact</h3>
            <ul className="admin-applicant-detail__list">
              <li><strong>Email:</strong> {applicant.email}</li>
              <li><strong>Phone:</strong> {applicant.phone || 'Not provided'}</li>
              <li><strong>Location:</strong> {applicant.location || 'Not provided'}</li>
            </ul>
          </article>

          <article className="admin-applicant-detail__section">
            <h3>Skills</h3>
            <div className="admin-tag-list">
              {applicant.skills.length ? applicant.skills.map((skill) => <span key={skill} className="admin-tag">{skill}</span>) : <span className="admin-empty-inline">No skills listed.</span>}
            </div>
          </article>

          {application.coverLetter ? (
            <article className="admin-applicant-detail__section">
              <h3>Cover letter</h3>
              <p>{application.coverLetter}</p>
            </article>
          ) : null}

          {applicant.experience?.length ? (
            <article className="admin-applicant-detail__section">
              <h3>Experience</h3>
              <div className="admin-entry-list">
                {applicant.experience.map((item) => (
                  <div key={`${item.company}-${item.jobTitle}-${item.startDate}`} className="admin-entry-item">
                    <strong>{item.jobTitle || 'Role not provided'}</strong>
                    <p>{item.company || 'Company not provided'} · {item.startDate || 'Start date unavailable'}{item.currentlyWorking ? ' — Present' : item.endDate ? ` — ${item.endDate}` : ''}</p>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {applicant.education?.length ? (
            <article className="admin-applicant-detail__section">
              <h3>Education</h3>
              <div className="admin-entry-list">
                {applicant.education.map((item) => (
                  <div key={`${item.school}-${item.degree}-${item.year}`} className="admin-entry-item">
                    <strong>{item.degree || 'Degree not provided'}</strong>
                    <p>{item.school || 'School not provided'}{item.year ? ` · ${item.year}` : ''}</p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {applicant.certifications?.length ? (
            <article className="admin-applicant-detail__section">
              <h3>Certifications</h3>
              <div className="admin-entry-list">
                {applicant.certifications.map((item) => (
                  <div key={`${item.name}-${item.issuer}`} className="admin-entry-item">
                    <strong>{item.name || 'Certification not provided'}</strong>
                    {item.issuer ? <p>{item.issuer}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {applicant.languages?.length ? (
            <article className="admin-applicant-detail__section">
              <h3>Languages</h3>
              <div className="admin-tag-list">
                {applicant.languages.map((item) => (
                  <span key={`${item.name}-${item.proficiency}`} className="admin-tag">
                    {item.name}{item.proficiency ? ` — ${item.proficiency}` : ''}
                  </span>
                ))}
              </div>
            </article>
          ) : null}

          {applicant.projects?.length ? (
            <article className="admin-applicant-detail__section">
              <h3>Projects</h3>
              <div className="admin-entry-list">
                {applicant.projects.map((item) => (
                  <div key={`${item.name}-${item.startDate}`} className="admin-entry-item">
                    <strong>{item.name || 'Project not provided'}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                    {item.technologies?.length ? <p><FaCheck /> {item.technologies.join(', ')}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default AdminApplicantDetailPage;
