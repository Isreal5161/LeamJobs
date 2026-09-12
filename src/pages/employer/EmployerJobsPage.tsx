import { FormEvent, useEffect, useState } from 'react';
import {
  FaBell,
  FaCalendarAlt,
  FaCheckCircle,
  FaEdit,
  FaEye,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaSlidersH,
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
  closeEmployerJob,
  createEmployerJob,
  getEmployerJobs,
  updateEmployerJob,
  type EmployerJob,
} from '../../services/api';

const departments = [
  'Accounting',
  'Administration',
  'Advertising',
  'Agriculture',
  'Architecture',
  'Banking',
  'Business Development',
  'Customer Service',
  'Data & Analytics',
  'Design',
  'Education',
  'Engineering',
  'Finance',
  'Healthcare',
  'Human Resources',
  'Information Technology',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Marketing',
  'Media & Communications',
  'Operations',
  'Procurement',
  'Product Management',
  'Project Management',
  'Public Relations',
  'Quality Assurance',
  'Real Estate',
  'Research',
  'Sales',
  'Security',
  'Software Development',
  'Supply Chain',
  'Telecommunications',
  'Training',
  'Transportation',
  'Other',
] as const;
const statusFilters = ['All posts', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED'] as const;

const formatStatus = (status: EmployerJob['status']) =>
  status.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'No deadline';

const focusField = (fieldId: string) => {
  const field = document.getElementById(fieldId);

  if (field) {
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus();
  }
};

function EmployerJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<JobFormState>(emptyJobForm);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitFeedback, setSubmitFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;

    let active = true;

    setIsLoading(true);
    setError('');

    void getEmployerJobs(token).then((result) => {
      if (!active) return;

      if (!result.ok) {
        setError(result.error.message || 'We could not load your jobs.');
        setIsLoading(false);
        return;
      }

      const nextJobs = result.data.data.jobs;
      setJobs(nextJobs);
      setSelectedJobId('');
      setIsCreating(false);
      setForm(emptyJobForm);
      setSubmitFeedback(null);
      setValidationErrors({});

      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [reloadKey, token]);

  const selectedJob = isCreating ? undefined : jobs.find((job) => job.id === selectedJobId);

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title} ${job.department ?? ''} ${job.location} ${job.workArrangement ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === 'All posts' || job.status === statusFilter);
  });

  const setField = <Field extends keyof JobFormState>(field: Field, value: JobFormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({
      ...current,
      [field]: '',
    }));
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

  const startEditing = (job: EmployerJob) => {
    setSelectedJobId(job.id);
    setIsCreating(false);
    setSubmitFeedback(null);
    setValidationErrors({});
    setForm(formFromJob(job));
  };

  const startCreating = () => {
    setIsCreating(true);
    setSelectedJobId('');
    setSubmitFeedback(null);
    setValidationErrors({});
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setSelectedJobId('');
    setSubmitFeedback(null);
    setValidationErrors({});
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
  };


  const saveJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) return;

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

    const result = isCreating
      ? await createEmployerJob(buildPayload(form), token)
      : selectedJob
        ? await updateEmployerJob(selectedJob.id, buildPayload(form), token)
        : null;

    if (!result) {
      setSubmitFeedback({ tone: 'error', message: 'Select a job before editing it.' });
      setIsSaving(false);
      return;
    }

    if (!result.ok) {
      setSubmitFeedback({ tone: 'error', message: result.error.message || 'We could not save this job.' });
      setIsSaving(false);
      return;
    }

    const savedJob = result.data.data.job;
    setJobs((current) => (isCreating ? [savedJob, ...current] : current.map((job) => job.id === savedJob.id ? savedJob : job)));
    setSelectedJobId('');
    setIsCreating(false);
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
    setSubmitFeedback({
      tone: 'success',
      message: isCreating
        ? 'Job posted successfully. It is now waiting for admin approval.'
        : 'Job updated successfully.',
    });
    setIsSaving(false);
  };

  const handleClose = async (job: EmployerJob) => {
    if (!token || !window.confirm(`Close ${job.title}?`)) return;

    setSubmitFeedback(null);

    const result = await closeEmployerJob(job.id, token);

    if (!result.ok) {
      setSubmitFeedback({ tone: 'error', message: result.error.message || 'We could not close this job.' });
      return;
    }

    setJobs((current) => current.map((item) => item.id === job.id ? result.data.data.job : item));

    if (selectedJobId === job.id) {
      setForm(formFromJob(result.data.data.job));
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="employer-page employer-jobs-page" aria-live="polite" aria-label="Loading jobs">
      <section className="employer-hero employer-hero--compact">
        <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Job posting and editing</span>
            <h1>Manage open positions</h1>
            <p>Create, update, and monitor your real job posts.</p>
          </div>
          <div className="employer-hero__actions">
            <span className="leamjobs-skeleton-block" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
            <span className="leamjobs-skeleton-line" style={{ width: '120px', height: '40px', borderRadius: '12px' }} />
          </div>
        </div>
      </section>

      <main className="employer-content employer-jobs-grid">
        <section className="employer-panel employer-job-editor">
          <div className="employer-form" aria-hidden="true">
            <div className="employer-form__section">
              <span className="leamjobs-skeleton-line" style={{ width: '26%', height: '1.1rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px', marginTop: '1rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px', marginTop: '0.8rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px', marginTop: '0.8rem' }} />
            </div>
            <div className="employer-form__section">
              <span className="leamjobs-skeleton-line" style={{ width: '24%', height: '1.1rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '44px', marginTop: '1rem' }} />
              <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '90px', marginTop: '0.8rem' }} />
            </div>
          </div>
        </section>

        <aside className="employer-panel employer-open-jobs">
          <div className="employer-list-tools">
            <span className="leamjobs-skeleton-line" style={{ width: '100%', height: '42px', borderRadius: '12px' }} />
            <span className="leamjobs-skeleton-block" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
          </div>

          <div className="employer-tabs employer-tabs--compact" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((item) => (
              <span key={item} className="leamjobs-skeleton-line" style={{ width: `${item === 1 ? 86 : item === 2 ? 70 : item === 3 ? 94 : item === 4 ? 80 : 72}px`, height: '36px', borderRadius: '999px' }} />
            ))}
          </div>

          <div className="employer-job-list">
            {[1, 2, 3].map((item) => (
              <article className="employer-job-card employer-job-card--skeleton" key={item} aria-hidden="true">
                <div>
                  <span className="leamjobs-skeleton-line" style={{ width: '78px', height: '24px', borderRadius: '999px' }} />
                  <span className="leamjobs-skeleton-line" style={{ width: '58%', height: '1.1rem', marginTop: '0.7rem' }} />
                  <span className="leamjobs-skeleton-line" style={{ width: '74%', height: '0.8rem', marginTop: '0.45rem' }} />
                </div>
                <span className="leamjobs-skeleton-line" style={{ width: '36px', height: '36px', borderRadius: '10px', justifySelf: 'end' }} />
              </article>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );

  if (isLoading) {
    return renderLoadingSkeleton();
  }

  if (error) {
    return (
      <div className="employer-page employer-empty-state" role="alert">
        <strong>Jobs unavailable</strong>
        <p>{error}</p>
        <button className="employer-button employer-button--ghost" type="button" onClick={() => setReloadKey((value) => value + 1)}>
          Try again
        </button>
      </div>
    );
  }

  const showEmptyState = jobs.length === 0 && !isCreating;
  const isEditorOpen = isCreating || Boolean(selectedJobId && jobs.some((job) => job.id === selectedJobId));

  return (
    <div className="employer-page employer-jobs-page">
      <section className="employer-hero employer-hero--compact">
        <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Job posting and editing</span>
            <h1>Manage open positions</h1>
            <p>Create, update, and monitor your real job posts.</p>
          </div>
          <div className="employer-hero__actions">
            <button className="employer-icon-button" type="button" aria-label="Notifications">
              <FaBell />
            </button>
            <button className="employer-button employer-button--light" type="button" onClick={startCreating}>
              <FaPlus /> Post job
            </button>
          </div>
        </div>
      </section>

      <main className="employer-content employer-jobs-grid">
        <section className="employer-panel employer-job-editor">
          {!isEditorOpen ? (
            <div className="employer-empty-state employer-empty-state--large">
              <div className="employer-empty-state__icon">
                <FaPlus />
              </div>
              <h2>Your jobs</h2>
              <p>
                Select an existing job to review or edit it, or create a new post when you are ready.
              </p>
              <button className="employer-button employer-button--primary" type="button" onClick={startCreating}>
                <FaPlus /> Post a new job
              </button>
            </div>
          ) : (
            <>
              <div className="employer-section-heading">
                <div>
                  <h2>{isCreating ? 'Create job post' : selectedJob ? 'Edit job post' : 'Create your first job post'}</h2>
                  <p>Job posts are submitted as pending for admin review.</p>
                </div>
              </div>

              {submitFeedback ? (
                <div
                  className={`employer-page-notice employer-page-notice--${submitFeedback.tone}`}
                  role={submitFeedback.tone === 'error' ? 'alert' : 'status'}
                >
                  {submitFeedback.message}
                </div>
              ) : null}

              <JobForm
                form={form}
                validationErrors={validationErrors}
                isCreating={isCreating}
                isSaving={isSaving}
                onFieldChange={setField}
                onListFieldChange={setListField}
                onAddListField={addListField}
                onRemoveListField={removeListField}
                onSubmit={saveJob}
                onCancel={cancelEditing}
              />
            </>
          )}
        </section>

        <aside className="employer-panel employer-open-jobs">
          <div className="employer-list-tools">
            <label className="employer-search" aria-label="Search job posts">
              <FaSearch />
              <input type="search" placeholder="Search job posts" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <button
              type="button"
              aria-label="Filter job posts"
              onClick={() => setStatusFilter(statusFilters[(statusFilters.indexOf(statusFilter) + 1) % statusFilters.length])}
              title={`Showing ${statusFilter}`}
            >
              <FaSlidersH />
            </button>
          </div>

          <div className="employer-tabs employer-tabs--compact" aria-label="Job status filters">
            {statusFilters.map((filter) => (
              <button
                className={filter === statusFilter ? 'employer-tab--active' : ''}
                type="button"
                key={filter}
                onClick={() => setStatusFilter(filter)}
              >
                {filter === 'All posts' ? filter : formatStatus(filter as EmployerJob['status'])}
              </button>
            ))}
          </div>

          {showEmptyState ? (
            <div className="employer-empty-state">
              <strong>No job posts yet</strong>
              <p>Once you create your first opportunity, it will appear here.</p>
            </div>
          ) : (
            <div className="employer-job-list">
              {filteredJobs.map((job) => (
                <article
                  className={`employer-job-card ${selectedJobId === job.id ? 'employer-job-card--active' : ''}`}
                  key={job.id}
                >
                  <button type="button" onClick={() => startEditing(job)}>
                    <div>
                      <span className={`employer-status employer-status--${job.status.toLowerCase()}`}>
                        {formatStatus(job.status)}
                      </span>
                      <h3>{job.title}</h3>
                      <p>
                        {job.department || 'General'} • {job.location} • {job.engagementType.toLowerCase()}
                      </p>
                      {job.status === 'REJECTED' && job.rejectionReason ? (
                        <small className="employer-job-card__rejection">Rejection reason: {job.rejectionReason}</small>
                      ) : null}
                    </div>
                    <strong>{job.applicantCount}</strong>
                  </button>

                  <div className="employer-job-card__footer">
                    <span>
                      <FaCalendarAlt /> Apply by {formatDate(job.applicationDeadline)}
                    </span>

                    <div>
                      <button type="button" aria-label={`View ${job.title}`} onClick={() => startEditing(job)}>
                        <FaEye />
                      </button>
                      <button type="button" aria-label={`Edit ${job.title}`} onClick={() => startEditing(job)}>
                        <FaEdit />
                      </button>
                      {job.status !== 'CLOSED' ? (
                        <button type="button" aria-label={`Close ${job.title}`} onClick={() => void handleClose(job)}>
                          <FaLayerGroup />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}

              {filteredJobs.length === 0 ? (
                <div className="employer-empty-state">
                  <strong>No matching posts</strong>
                  <p>Try a different search or status filter.</p>
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default EmployerJobsPage;
