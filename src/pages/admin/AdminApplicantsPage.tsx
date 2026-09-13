import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminJob,
  getAdminJobApplications,
  type AdminApplicationListItem,
  type AdminJob,
  type EmployerApplicationStatus,
} from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const statuses: Array<'ALL' | EmployerApplicationStatus> = ['ALL', 'APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'ACCEPTED', 'PAYMENT_PENDING', 'WITHDRAWN'];
const statusLabels: Record<typeof statuses[number], string> = {
  ALL: 'All', APPLIED: 'Applied', REVIEWING: 'Reviewing', SHORTLISTED: 'Shortlisted', INTERVIEW: 'Interview', REJECTED: 'Rejected', ACCEPTED: 'Accepted', PAYMENT_PENDING: 'Selected', WITHDRAWN: 'Withdrawn',
};

const statusClass = (status: EmployerApplicationStatus) => `admin-applicant-status admin-applicant-status--${status.toLowerCase()}`;
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
const initialsFromName = (value: string) => value.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'NA';

function AdminApplicantsPage() {
  const { jobId } = useParams();
  const { token } = useAuth();
  const [job, setJob] = useState<AdminJob | null>(null);
  const [applications, setApplications] = useState<AdminApplicationListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<typeof statuses[number]>('ALL');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !jobId) {
      setJob(null);
      setApplications([]);
      setError('This admin applicant list is unavailable.');
      setIsLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError('');

      const [jobResult, applicationsResult] = await Promise.all([
        getAdminJob(jobId, token),
        getAdminJobApplications(jobId, token),
      ]);

      if (!active) return;

      if (!jobResult.ok) {
        setJob(null);
        setApplications([]);
        setError(jobResult.error.message || 'We could not load this applicant list.');
        setIsLoading(false);
        return;
      }

      if (!applicationsResult.ok) {
        setJob(null);
        setApplications([]);
        setError(applicationsResult.error.message || 'We could not load this applicant list.');
        setIsLoading(false);
        return;
      }

      setJob(jobResult.data.data.job);
      setApplications(applicationsResult.data.data.applications);
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [jobId, token]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications
      .filter((application) => statusFilter === 'ALL' || application.status === statusFilter)
      .filter((application) => {
        if (!normalizedQuery) return true;
        const searchableText = [
          application.applicant.fullName,
          application.applicant.professionalTitle,
          application.applicant.location,
          application.applicant.email,
          ...application.applicant.skills,
        ].join(' ').toLowerCase();
        return searchableText.includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [applications, query, statusFilter]);

  if (isLoading) {
    return <AdminPageSkeleton showToolbar={false} statCards={4} rows={4} />;
  }

  if (!job) {
    return (
      <div className="admin-page admin-empty-state" role="alert">
        <strong>Applicants unavailable</strong>
        <p>{error || 'We could not find the selected job.'}</p>
      </div>
    );
  }

  return (
    <div className="admin-page admin-applicants-page">
      <section className="admin-hero admin-applicants-hero">
        <div>
          <span className="admin-eyebrow">Applicant management</span>
          <h1>{job.title}</h1>
          <p>Review applicants for this LeamJobs-owned role without changing the underlying hiring workflow.</p>
        </div>
        <Link className="admin-button admin-button--secondary admin-button--icon" to="/admin/jobs">
          <FaArrowRight style={{ transform: 'rotate(180deg)' }} />
          <span>Back to jobs</span>
        </Link>
      </section>

      <section className="admin-panel admin-applicants-toolbar" aria-label="Applicant filters">
        <div className="admin-applicants-toolbar__search">
          <FaSearch />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applicants, titles, or skills"
            aria-label="Search applicants"
          />
        </div>

        <div className="admin-applicants-toolbar__tabs" role="tablist" aria-label="Applicant status filters">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              className={status === statusFilter ? 'admin-applicants-tab admin-applicants-tab--active' : 'admin-applicants-tab'}
              onClick={() => setStatusFilter(status)}
              aria-pressed={status === statusFilter}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <section className="admin-panel admin-empty-state" role="alert">
          <strong>Applicant data is unavailable</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {!error ? (
        <section className="admin-panel admin-applicants-list-panel" aria-live="polite">
          <div className="admin-section-heading">
            <div>
              <span>Applicants</span>
              <h2>{filteredApplications.length} candidate{filteredApplications.length === 1 ? '' : 's'} found</h2>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="admin-empty-state">
              <strong>No applicants match the current filters.</strong>
              <p>Try a different status or search across candidate details.</p>
            </div>
          ) : (
            <div className="admin-applicants-list">
              {filteredApplications.map((application) => {
                const applicant = application.applicant;
                return (
                  <article key={application.id} className="admin-applicant-card">
                    <div className="admin-applicant-card__avatar">{initialsFromName(applicant.fullName)}</div>
                    <div className="admin-applicant-card__details">
                      <div className="admin-applicant-card__header">
                        <strong>{applicant.fullName}</strong>
                        <span className={statusClass(application.status)}>{statusLabels[application.status]}</span>
                      </div>
                      <p>{applicant.professionalTitle || 'Professional title not provided'}</p>
                      <div className="admin-applicant-card__meta">
                        <span><FaMapMarkerAlt /> {applicant.location || 'Location not provided'}</span>
                        <span><FaCalendarAlt /> {formatDate(application.createdAt)}</span>
                      </div>
                    </div>
                    <Link className="admin-button admin-button--secondary admin-button--icon admin-applicant-card__action" to={`/admin/jobs/${jobId}/applicants/${application.id}`}>
                      <span>Review</span>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default AdminApplicantsPage;
