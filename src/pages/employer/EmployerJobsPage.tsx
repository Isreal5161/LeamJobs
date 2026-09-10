import { FormEvent, useEffect, useState } from 'react';
import { FaBell, FaCalendarAlt, FaCheckCircle, FaEdit, FaEye, FaLayerGroup, FaPlus, FaSearch, FaSlidersH, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  closeEmployerJob,
  createEmployerJob,
  getEmployerJobs,
  updateEmployerJob,
  type EmployerJob,
  type EmployerJobPayload,
} from '../../services/api';

const departments = ['Design', 'Engineering', 'Marketing', 'Operations'];
const statusFilters = ['All posts', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED'] as const;

type JobForm = {
  title: string;
  department: string;
  location: string;
  workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE';
  engagementType: 'MONTHLY' | 'CONTRACT' | 'FREELANCE';
  description: string;
  applicationDeadline: string;
  salaryMin: string;
  salaryMax: string;
  contractAmount: string;
  contractDuration: string;
  freelanceAmount: string;
  currency: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
};

const emptyJobForm: JobForm = {
  title: '', department: '', location: '', workArrangement: 'REMOTE', engagementType: 'MONTHLY', description: '',
  applicationDeadline: '', salaryMin: '', salaryMax: '', contractAmount: '', contractDuration: '', freelanceAmount: '', currency: 'NGN',
  requirements: [''], responsibilities: [''], skills: [''], benefits: [],
};

const formFromJob = (job: EmployerJob): JobForm => ({
  title: job.title,
  department: job.department ?? '',
  location: job.location,
  workArrangement: job.workArrangement ?? 'REMOTE',
  engagementType: job.engagementType,
  description: job.description,
  applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : '',
  salaryMin: job.compensation?.type === 'MONTHLY' ? job.compensation.salaryMin ?? '' : '',
  salaryMax: job.compensation?.type === 'MONTHLY' ? job.compensation.salaryMax ?? '' : '',
  contractAmount: job.compensation?.type === 'CONTRACT' ? job.compensation.amount : '',
  contractDuration: job.compensation?.type === 'CONTRACT' ? job.compensation.duration ?? '' : '',
  freelanceAmount: job.compensation?.type === 'FREELANCE' ? job.compensation.projectAmount : '',
  currency: job.compensation?.currency ?? 'NGN',
  requirements: Array.isArray(job.requirements)
    ? (job.requirements.length ? job.requirements : [''])
    : job.requirements
      ? Object.entries(job.requirements).map(([key, value]) => `${key}: ${String(value)}`)
      : [''],
  responsibilities: job.responsibilities.length ? job.responsibilities : [''],
  skills: job.skills.length ? job.skills : [''],
  benefits: job.benefits,
});

const formatStatus = (status: EmployerJob['status']) => status.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'No deadline';

function EmployerJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<JobForm>(emptyJobForm);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitFeedback, setSubmitFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
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
      setJobs(result.data.data.jobs);
      setSelectedJobId((current) => {
        const nextId = current || result.data.data.jobs[0]?.id || '';
        const nextJob = result.data.data.jobs.find((job) => job.id === nextId);
        if (nextJob) setForm(formFromJob(nextJob));
        return nextId;
      });
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey, token]);

  const selectedJob = isCreating ? undefined : jobs.find((job) => job.id === selectedJobId);
  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title} ${job.department ?? ''} ${job.location} ${job.workArrangement ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === 'All posts' || job.status === statusFilter);
  });

  const setField = <Field extends keyof JobForm>(field: Field, value: JobForm[Field]) => setForm((current) => ({ ...current, [field]: value }));
  const setListField = (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits', index: number, value: string) => setForm((current) => ({ ...current, [field]: current[field].map((item, itemIndex) => itemIndex === index ? value : item) }));
  const addListField = (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits') => setForm((current) => ({ ...current, [field]: [...current[field], ''] }));
  const removeListField = (field: 'requirements' | 'responsibilities' | 'skills' | 'benefits', index: number) => setForm((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));

  const startEditing = (job: EmployerJob) => {
    setSelectedJobId(job.id);
    setIsCreating(false);
    setSubmitFeedback(null);
    setForm(formFromJob(job));
  };

  const startCreating = () => {
    setIsCreating(true);
    setSelectedJobId('');
    setSubmitFeedback(null);
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setSelectedJobId(jobs[0]?.id ?? '');
    setForm(selectedJob ? formFromJob(selectedJob) : emptyJobForm);
    setSubmitFeedback(null);
  };

  const buildPayload = (): EmployerJobPayload => {
    const common = {
      title: form.title,
      description: form.description,
      location: form.location,
      department: form.department || null,
      workArrangement: form.workArrangement,
      engagementType: form.engagementType,
      jobType: form.engagementType === 'FREELANCE' ? 'FREELANCE_PROJECT' as const : 'NORMAL_EMPLOYMENT' as const,
      requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
      responsibilities: form.responsibilities.map((item) => item.trim()).filter(Boolean),
      skills: form.skills.map((item) => item.trim()).filter(Boolean),
      benefits: form.benefits.map((item) => item.trim()).filter(Boolean),
      applicationDeadline: form.applicationDeadline || null,
    };
    if (form.engagementType === 'MONTHLY') return {
      ...common,
      monthlyCompensation: { salaryMin: form.salaryMin ? Number(form.salaryMin) : null, salaryMax: form.salaryMax ? Number(form.salaryMax) : null, currency: form.currency },
      contractCompensation: null, freelanceCompensation: null,
    };
    if (form.engagementType === 'CONTRACT') return {
      ...common,
      monthlyCompensation: null, contractCompensation: { amount: Number(form.contractAmount), currency: form.currency, duration: form.contractDuration }, freelanceCompensation: null,
    };
    return {
      ...common,
      monthlyCompensation: null, contractCompensation: null, freelanceCompensation: { projectAmount: Number(form.freelanceAmount), currency: form.currency },
    };
  };

  const saveJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setSubmitFeedback(null);

    const result = isCreating ? await createEmployerJob(buildPayload(), token) : selectedJob ? await updateEmployerJob(selectedJob.id, buildPayload(), token) : null;

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
    setJobs((current) => isCreating ? [savedJob, ...current] : current.map((job) => job.id === savedJob.id ? savedJob : job));
    setSelectedJobId(savedJob.id);
    setIsCreating(false);
    setForm(formFromJob(savedJob));
    setSubmitFeedback({
      tone: 'success',
      message: isCreating
        ? 'Job submitted successfully. It is now awaiting admin approval.'
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
    if (selectedJobId === job.id) setForm(formFromJob(result.data.data.job));
  };

  if (isLoading) return <div className="employer-page employer-empty-state" role="status">Loading your job posts...</div>;
  if (error) return <div className="employer-page employer-empty-state" role="alert"><strong>Jobs unavailable</strong><p>{error}</p><button className="employer-button employer-button--ghost" type="button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button></div>;

  const listFields = [
    ['requirements', 'Requirements'],
    ['responsibilities', 'Responsibilities'],
    ['skills', 'Skills Required'],
    ['benefits', 'Benefits (optional)'],
  ] as const;

  return (
    <div className="employer-page employer-jobs-page">
      <section className="employer-hero employer-hero--compact"><div className="employer-hero__top"><div><span className="employer-eyebrow">Job posting and editing</span><h1>Manage open positions</h1><p>Create, update, and monitor your real job posts.</p></div><div className="employer-hero__actions"><button className="employer-icon-button" type="button" aria-label="Notifications"><FaBell /></button><button className="employer-button employer-button--light" type="button" onClick={startCreating}><FaPlus /> Post job</button></div></div></section>
      <main className="employer-content employer-jobs-grid">
        <section className="employer-panel employer-job-editor">
          <div className="employer-section-heading"><div><h2>{isCreating ? 'Create job post' : selectedJob ? 'Edit job post' : 'Create your first job post'}</h2><p>Job posts are submitted as pending for review.</p></div></div>
          {submitFeedback ? (
            <div
              className={`employer-page-notice employer-page-notice--${submitFeedback.tone}`}
              role={submitFeedback.tone === 'error' ? 'alert' : 'status'}
            >
              {submitFeedback.message}
            </div>
          ) : null}
          <form className="employer-form" onSubmit={saveJob}>
            <label><span>Job title</span><input required maxLength={160} value={form.title} onChange={(event) => setField('title', event.target.value)} /></label>
            <div className="employer-form__split"><label><span>Department</span><select value={form.department} onChange={(event) => setField('department', event.target.value)}><option value="">Select department</option>{departments.map((department) => <option key={department}>{department}</option>)}</select></label><label><span>Location</span><input required maxLength={160} value={form.location} onChange={(event) => setField('location', event.target.value)} /></label></div>
            <div className="employer-form__split"><label><span>Work arrangement</span><select value={form.workArrangement} onChange={(event) => setField('workArrangement', event.target.value as JobForm['workArrangement'])}><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label><label><span>Engagement type</span><select value={form.engagementType} onChange={(event) => setField('engagementType', event.target.value as JobForm['engagementType'])}><option value="MONTHLY">Monthly</option><option value="CONTRACT">Contract</option><option value="FREELANCE">Freelance</option></select></label></div>
            <label><span>Job overview</span><textarea required maxLength={10000} value={form.description} onChange={(event) => setField('description', event.target.value)} /></label>
            <div className="employer-form__split"><label><span>Currency</span><input required maxLength={3} value={form.currency} onChange={(event) => setField('currency', event.target.value.toUpperCase())} /></label>{form.engagementType === 'MONTHLY' ? <><label><span>Minimum monthly salary</span><input type="number" min="0" step="0.01" value={form.salaryMin} onChange={(event) => setField('salaryMin', event.target.value)} /></label><label><span>Maximum monthly salary</span><input type="number" min="0" step="0.01" value={form.salaryMax} onChange={(event) => setField('salaryMax', event.target.value)} /></label></> : null}{form.engagementType === 'CONTRACT' ? <><label><span>Contract amount</span><input required type="number" min="0" step="0.01" value={form.contractAmount} onChange={(event) => setField('contractAmount', event.target.value)} /></label><label><span>Contract duration</span><input required maxLength={100} value={form.contractDuration} onChange={(event) => setField('contractDuration', event.target.value)} placeholder="e.g. 6 months" /></label></> : null}{form.engagementType === 'FREELANCE' ? <label><span>Project amount</span><input required type="number" min="0" step="0.01" value={form.freelanceAmount} onChange={(event) => setField('freelanceAmount', event.target.value)} /></label> : null}</div>
            <label><span>Application deadline</span><input type="date" value={form.applicationDeadline} onChange={(event) => setField('applicationDeadline', event.target.value)} /></label>
            {listFields.map(([field, label]) => <div className="employer-form__detail-section" key={field}><span className="employer-form__detail-heading">{label}</span><div className="employer-detail-list-editor">{form[field].map((item, index) => <div className="employer-detail-list-editor__row" key={`${field}-${index}`}><input required={field !== 'benefits'} value={item} onChange={(event) => setListField(field, index, event.target.value)} placeholder={`${label.replace(' (optional)', '')} ${index + 1}`} /><button type="button" aria-label={`Remove ${label} item ${index + 1}`} onClick={() => removeListField(field, index)}><FaTrashAlt /></button></div>)}</div><button className="employer-add-detail" type="button" onClick={() => addListField(field)}><FaPlus /> Add item</button></div>)}
            <div className="employer-editor-actions">
              <button className="employer-button employer-button--ghost" type="button" onClick={cancelEditing}>Cancel</button>
              <button className="employer-button employer-button--primary" type="submit" disabled={isSaving}>
                <FaCheckCircle />
                {isSaving ? (isCreating ? 'Posting Job...' : 'Saving Changes...') : (isCreating ? 'Post Job' : 'Update Job')}
              </button>
            </div>
          </form>
        </section>
        <aside className="employer-panel employer-open-jobs"><div className="employer-list-tools"><label className="employer-search" aria-label="Search job posts"><FaSearch /><input type="search" placeholder="Search job posts" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" aria-label="Filter job posts" onClick={() => setStatusFilter(statusFilters[(statusFilters.indexOf(statusFilter) + 1) % statusFilters.length])} title={`Showing ${statusFilter}`}><FaSlidersH /></button></div><div className="employer-tabs employer-tabs--compact" aria-label="Job status filters">{statusFilters.map((filter) => <button className={filter === statusFilter ? 'employer-tab--active' : ''} type="button" key={filter} onClick={() => setStatusFilter(filter)}>{filter === 'All posts' ? filter : formatStatus(filter as EmployerJob['status'])}</button>)}</div><div className="employer-job-list">{filteredJobs.map((job) => <article className={`employer-job-card ${selectedJobId === job.id ? 'employer-job-card--active' : ''}`} key={job.id}><button type="button" onClick={() => startEditing(job)}><div><span className={`employer-status employer-status--${job.status.toLowerCase()}`}>{formatStatus(job.status)}</span><h3>{job.title}</h3><p>{job.location} / {job.engagementType.toLowerCase()}</p></div><strong>{job.applicantCount}</strong></button><div className="employer-job-card__footer"><span><FaCalendarAlt /> Apply by {formatDate(job.applicationDeadline)}</span><div><button type="button" aria-label={`View ${job.title}`} onClick={() => startEditing(job)}><FaEye /></button><button type="button" aria-label={`Edit ${job.title}`} onClick={() => startEditing(job)}><FaEdit /></button>{job.status !== 'CLOSED' ? <button type="button" aria-label={`Close ${job.title}`} onClick={() => void handleClose(job)}><FaLayerGroup /></button> : null}</div></div></article>)}{filteredJobs.length === 0 ? <div className="employer-empty-state"><strong>{jobs.length === 0 ? 'No job posts yet' : 'No matching posts'}</strong><p>{jobs.length === 0 ? 'Create your first real job post to start hiring.' : 'Try another title, department, location, or status filter.'}</p></div> : null}</div></aside>
      </main>
    </div>
  );
}

export default EmployerJobsPage;
