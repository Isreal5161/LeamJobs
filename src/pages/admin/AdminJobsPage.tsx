import { type FormEvent, useEffect, useState } from 'react';
import {
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaEye,
  FaMapMarkerAlt,
  FaPlus,
} from 'react-icons/fa';
import { JobForm } from '../../components/jobs/JobForm';
import {
  buildPayload,
  emptyJobForm,
  formFromJob,
  type JobForm as JobFormState,
  validateForm,
} from '../../components/jobs/jobFormUtils';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminJob,
  getAdminCompanies,
  getAdminJobs,
  type AdminCompany,
  type AdminJob,
  type EmployerJob,
  updateAdminJob,
} from '../../services/api';
import AdminPageSkeleton from './AdminPageSkeleton';

const normalizeList = (value: string[] | Record<string, unknown> | null | undefined) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, entry]) => {
      if (typeof entry === 'string') {
        return entry;
      }

      return `${key}: ${JSON.stringify(entry)}`;
    });
  }

  return [];
};

const formatDate = (value: string | null) => {
  if (!value) {
    return 'No deadline';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const formatCompensation = (job: AdminJob) => {
  if (!job.compensation) {
    return 'Compensation not provided';
  }

  if (job.compensation.type === 'MONTHLY') {
    return `${job.compensation.currency} ${job.compensation.salaryMin ?? '—'} - ${job.compensation.salaryMax ?? '—'} / ${job.compensation.salaryPeriod}`;
  }

  if (job.compensation.type === 'CONTRACT') {
    return `${job.compensation.currency} ${job.compensation.amount} (${job.compensation.duration ?? 'contract'})`;
  }

  return `${job.compensation.currency} ${job.compensation.projectAmount}`;
};

const focusField = (fieldId: string) => {
  const field = document.getElementById(fieldId);

  if (field) {
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus();
  }
};

function AdminJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [employers, setEmployers] = useState<AdminCompany[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [isLoadingEmployers, setIsLoadingEmployers] = useState(true);
  const [employerError, setEmployerError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<JobFormState>({
    ...emptyJobForm,
    requirements: [''],
    responsibilities: [''],
    skills: [''],
    benefits: [],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitFeedback, setSubmitFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setJobs([]);
      setSelectedJobId('');
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadJobs = async () => {
      setIsLoading(true);
      setError('');
      const result = await getAdminJobs(token);

      if (!active) {
        return;
      }

      if (!result.ok) {
        setError(result.error.message || 'We could not load approved jobs.');
        setIsLoading(false);
        return;
      }

      const approvedJobs = result.data.data.jobs.filter((job) => job.status === 'APPROVED');
      setJobs(approvedJobs);
      setSelectedJobId((current) => current || approvedJobs[0]?.id || '');
      setIsLoading(false);
    };

    void loadJobs();

    return () => {
      active = false;
    };
  }, [reloadKey, token]);

  useEffect(() => {
    if (!token) {
      setEmployers([]);
      setSelectedEmployerId('');
      setIsLoadingEmployers(false);
      setEmployerError('');
      return;
    }

    let active = true;

    const loadEmployers = async () => {
      setIsLoadingEmployers(true);
      setEmployerError('');

      const result = await getAdminCompanies(token, {
        limit: 500,
        sortBy: 'companyName',
        sortOrder: 'asc',
      });

      if (!active) {
        return;
      }

      if (!result.ok) {
        setEmployerError(result.error.message || 'We could not load employers.');
        setEmployers([]);
        setIsLoadingEmployers(false);
        return;
      }

      const nextEmployers = result.data.data.companies.filter((company) => Boolean(company.userId));
      setEmployers(nextEmployers);
      if (!selectedEmployerId && nextEmployers.length > 0) {
        setSelectedEmployerId(nextEmployers[0].userId);
      }
      setIsLoadingEmployers(false);
    };

    void loadEmployers();

    return () => {
      active = false;
    };
  }, [token]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null;
  const selectedEmployer = employers.find((company) => company.userId === selectedEmployerId) ?? null;
  const editingJob = jobs.find((job) => job.id === editingJobId) ?? null;

  const setField = <Field extends keyof JobFormState>(field: Field, value: JobFormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const setListField = (
    field: 'requirements' | 'responsibilities' | 'skills' | 'benefits',
    index: number,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addListField = (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits') => {
    setForm((current) => ({
      ...current,
      [field]: [...current[field], ''],
    }));
  };

  const removeListField = (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits', index: number) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const startCreating = () => {
    if (!employers.length) {
      setSubmitFeedback({ tone: 'error', message: 'No employer accounts are available to assign a job to.' });
      return;
    }

    setIsCreating(true);
    setSubmitFeedback(null);
    setValidationErrors({});
    setSelectedEmployerId((current) => current || employers[0].userId);
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setSubmitFeedback(null);
    setValidationErrors({});
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
  };

  const startEditing = (job: AdminJob) => {
    setIsCreating(false);
    setIsEditing(true);
    setEditingJobId(job.id);
    setSubmitFeedback(null);
    setValidationErrors({});
    setForm(formFromJob(job as unknown as EmployerJob));
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingJobId(null);
    setSubmitFeedback(null);
    setValidationErrors({});
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
  };

  const handleCreateJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) return;

    if (!selectedEmployerId || !employers.some((company) => company.userId === selectedEmployerId)) {
      setSubmitFeedback({ tone: 'error', message: 'Please select a valid employer before creating the job.' });
      return;
    }

    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      setSubmitFeedback({ tone: 'error', message: 'Please complete the highlighted fields.' });
      const firstField = Object.keys(nextErrors)[0];
      focusField(firstField);
      return;
    }

    setIsSaving(true);
    setSubmitFeedback(null);
    setValidationErrors({});

    const employerName = selectedEmployer?.companyName || 'the selected employer';
    const result = await createAdminJob(selectedEmployerId, buildPayload(form), token);

    if (!result.ok) {
      setSubmitFeedback({ tone: 'error', message: result.error.message || 'We could not create this job.' });
      setIsSaving(false);
      return;
    }

    setIsCreating(false);
    setIsSaving(false);
    setSelectedEmployerId('');
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
    setValidationErrors({});
    setSubmitFeedback({
      tone: 'success',
      message: `Job created successfully for ${employerName} and it is already approved.`,
    });
    setReloadKey((value) => value + 1);
  };

  const handleUpdateJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !editingJobId) return;

    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      setSubmitFeedback({ tone: 'error', message: 'Please complete the highlighted fields.' });
      const firstField = Object.keys(nextErrors)[0];
      focusField(firstField);
      return;
    }

    setIsSaving(true);
    setSubmitFeedback(null);
    setValidationErrors({});

    const result = await updateAdminJob(editingJobId, buildPayload(form), token);

    if (!result.ok) {
      setSubmitFeedback({ tone: 'error', message: result.error.message || 'We could not update this job.' });
      setIsSaving(false);
      return;
    }

    setIsEditing(false);
    setEditingJobId(null);
    setIsSaving(false);
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
    setSubmitFeedback({
      tone: 'success',
      message: 'Job updated successfully. Approved jobs remain approved.',
    });
    setReloadKey((value) => value + 1);
  };

  if (isLoading) {
    return <AdminPageSkeleton showToolbar={false} statCards={4} rows={3} />;
  }

  if (error) {
    return (
      <div className="admin-page admin-empty-state" role="alert">
        <strong>Approved jobs unavailable</strong>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Job control</span>
          <h1>Posted and approved jobs</h1>
          <p>Review every live job currently approved by the moderation team.</p>
        </div>
        <button
          className="admin-button admin-button--primary admin-button--cta"
          type="button"
          onClick={startCreating}
          disabled={isLoadingEmployers || Boolean(employerError) || employers.length === 0}
        >
          <FaPlus />
          <span>Post Job</span>
        </button>
      </section>

      {submitFeedback ? (
        <div className={`admin-page-notice admin-page-notice--${submitFeedback.tone}`} role={submitFeedback.tone === 'error' ? 'alert' : 'status'}>
          {submitFeedback.message}
        </div>
      ) : null}

      {isCreating ? (
        <section className="admin-panel admin-authoring-panel" aria-label="Create job form">
          <div className="admin-authoring-panel__header">
            <div>
              <span className="admin-eyebrow"><FaBriefcase /> Create</span>
              <h2>Post a Job</h2>
              <p>Create an approved job posting on behalf of an employer.</p>
            </div>
          </div>

          {employerError ? (
            <p className="admin-empty-state" role="alert">{employerError}</p>
          ) : null}

          {!employerError && employers.length === 0 && !isLoadingEmployers ? (
            <p className="admin-empty-state">No employer accounts are available to assign a job to.</p>
          ) : null}

          {!employerError && employers.length > 0 ? (
            <div className="admin-authoring-field" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'grid', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>Employer / Company</span>
                <select
                  value={selectedEmployerId}
                  onChange={(event) => setSelectedEmployerId(event.target.value)}
                  style={{ padding: '0.8rem 1rem', border: '1px solid #dfe7f1', borderRadius: '12px', background: '#fff' }}
                >
                  <option value="">Select employer</option>
                  {employers.map((company) => (
                    <option key={company.userId} value={company.userId}>
                      {company.companyName} {company.location ? `• ${company.location}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <small>Posting on behalf of the selected employer.</small>
            </div>
          ) : null}

          {employers.length > 0 ? (
            <JobForm
              form={form}
              validationErrors={validationErrors}
              isCreating
              isSaving={isSaving}
              onFieldChange={setField}
              onListFieldChange={setListField}
              onAddListField={addListField}
              onRemoveListField={removeListField}
              onSubmit={handleCreateJob}
              onCancel={cancelCreating}
            />
          ) : null}
        </section>
      ) : null}

      {isEditing && editingJobId ? (
        <section className="admin-panel admin-authoring-panel" aria-label="Edit job form">
          <div className="admin-authoring-panel__header">
            <div>
              <span className="admin-eyebrow"><FaBriefcase /> Update</span>
              <h2>Edit Job</h2>
              <p>{editingJob ? `Edit: ${editingJob.title}` : 'Update the selected job posting.'}</p>
            </div>
            <div className="admin-authoring-panel__meta">
              {editingJob?.company?.name ? <span>{editingJob.company.name}</span> : null}
            </div>
          </div>

          <p className="admin-authoring-status">
            Approved — Admin edits remain approved.
          </p>

          <JobForm
            form={form}
            validationErrors={validationErrors}
            isCreating={false}
            isSaving={isSaving}
            onFieldChange={setField}
            onListFieldChange={setListField}
            onAddListField={addListField}
            onRemoveListField={removeListField}
            onSubmit={handleUpdateJob}
            onCancel={cancelEditing}
          />
        </section>
      ) : null}

      <section className="admin-stat-grid" aria-label="Posted job summary">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaBriefcase /></span>
          <div><strong>{jobs.length}</strong><p>live jobs</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaCheckCircle /></span>
          <div><strong>{jobs.reduce((count, job) => count + job.applicantCount, 0)}</strong><p>applicants</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--purple"><FaEye /></span>
          <div><strong>{jobs.reduce((total, job) => total + (job.reviewedById ? 1 : 0), 0)}</strong><p>reviewed</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaClock /></span>
          <div><strong>{jobs.filter((job) => job.applicationDeadline).length}</strong><p>with deadlines</p></div>
        </article>
      </section>

      <section className="admin-posted-jobs-workspace">
        <div className="admin-panel admin-review-list-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaBriefcase /> Posted jobs</span>
              <h2>Jobs already approved by admin</h2>
            </div>
          </div>

          <div className="admin-review-list admin-review-list--rows">
            {jobs.length === 0 ? (
              <div className="admin-empty-state">No approved jobs are available yet.</div>
            ) : (
              jobs.map((job) => (
                <button
                  className={`admin-review-item admin-review-job-card ${selectedJob?.id === job.id ? 'admin-review-item--active' : ''}`}
                  type="button"
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <span className="admin-job-company-mark" data-color="brand-logo--default">
                    {job.company?.name?.slice(0, 2).toUpperCase() || 'JD'}
                  </span>
                  <div className="admin-review-job-card__content">
                    <strong>{job.title}</strong>
                    <p>{job.company?.name || 'Unknown employer'} / {job.location}</p>
                    <small>{job.department || 'General'} / {job.jobType} / Published {formatDate(job.createdAt)}</small>
                  </div>
                  <div className="admin-review-job-card__meta">
                    <span>{formatCompensation(job)}</span>
                    <span>{job.applicantCount} applicants</span>
                  </div>
                  <span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{job.status}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedJob ? (
          <article className="admin-panel admin-review-detail">
            <div className="admin-review-detail__header">
              <div>
                <span className="admin-review-kicker"><FaEye /> Live job details</span>
                <h2>{selectedJob.title}</h2>
                <p>{selectedJob.company?.name || 'Unknown employer'} is currently live on the platform.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className={`admin-status admin-status--${selectedJob.status.toLowerCase()}`}>{selectedJob.status}</span>
                <button className="admin-button admin-button--secondary admin-button--icon" type="button" onClick={() => startEditing(selectedJob)}>
                  <FaEdit />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            <div className="admin-review-facts">
              <span><FaBuilding /> {selectedJob.company?.name || 'Unknown employer'}</span>
              <span><FaMapMarkerAlt /> {selectedJob.location}</span>
              <span><FaDollarSign /> {formatCompensation(selectedJob)}</span>
              <span><FaClock /> Deadline {formatDate(selectedJob.applicationDeadline)}</span>
            </div>

            <section className="admin-review-section">
              <h3>Job overview</h3>
              <p>{selectedJob.description}</p>
            </section>

            <section className="admin-review-section">
              <h3>Responsibilities</h3>
              <ul>
                {normalizeList(selectedJob.responsibilities).length ? normalizeList(selectedJob.responsibilities).map((item) => <li key={item}>{item}</li>) : <li>No responsibilities listed.</li>}
              </ul>
            </section>

            <section className="admin-review-section">
              <h3>Requirements</h3>
              <ul>
                {normalizeList(selectedJob.requirements).length ? normalizeList(selectedJob.requirements).map((item) => <li key={item}>{item}</li>) : <li>No requirements listed.</li>}
              </ul>
            </section>

            <section className="admin-review-section">
              <h3>Skills</h3>
              <ul>
                {selectedJob.skills.length ? selectedJob.skills.map((skill) => <li key={skill}>{skill}</li>) : <li>No skills listed.</li>}
              </ul>
            </section>

            <section className="admin-review-section">
              <h3>About company</h3>
              <p>{selectedJob.company?.description || 'No company description provided.'}</p>
            </section>

            <div className="admin-review-performance">
              <div><strong>{selectedJob.applicantCount}</strong><span>Applicants</span></div>
              <div><strong>{selectedJob.reviewedById ? 'Reviewed' : 'Pending'}</strong><span>Review state</span></div>
              <div><strong>{selectedJob.reviewedAt ? formatDate(selectedJob.reviewedAt) : 'Not reviewed'}</strong><span>Reviewed on</span></div>
              <div><strong>{selectedJob.company?.location || 'N/A'}</strong><span>Company location</span></div>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}

export default AdminJobsPage;
