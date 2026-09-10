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
  FaTrashAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import {
  closeEmployerJob,
  createEmployerJob,
  getEmployerJobs,
  updateEmployerJob,
  type EmployerJob,
  type EmployerJobPayload,
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

type JobForm = {
  title: string;
  department: string;
  departmentChoice: string;
  departmentCustom: string;
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
  title: '',
  department: '',
  departmentChoice: '',
  departmentCustom: '',
  location: '',
  workArrangement: 'REMOTE',
  engagementType: 'MONTHLY',
  description: '',
  applicationDeadline: '',
  salaryMin: '',
  salaryMax: '',
  contractAmount: '',
  contractDuration: '',
  freelanceAmount: '',
  currency: 'NGN',
  requirements: [''],
  responsibilities: [''],
  skills: [''],
  benefits: [],
};

const formFromJob = (job: EmployerJob): JobForm => {
  const rawDepartment = job.department ?? '';
  const isKnownDepartment = rawDepartment.length > 0 && departments.includes(rawDepartment as (typeof departments)[number]);

  return {
    title: job.title,
    department: rawDepartment,
    departmentChoice: isKnownDepartment ? rawDepartment : 'Other',
    departmentCustom: isKnownDepartment ? '' : rawDepartment,
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
      ? job.requirements.length
        ? job.requirements
        : ['']
      : job.requirements
        ? Object.entries(job.requirements).map(([key, value]) => `${key}: ${String(value)}`)
        : [''],
    responsibilities: job.responsibilities.length ? job.responsibilities : [''],
    skills: job.skills.length ? job.skills : [''],
    benefits: job.benefits.length ? job.benefits : [],
  };
};

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
  const [form, setForm] = useState<JobForm>(emptyJobForm);
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

      if (nextJobs.length > 0) {
        setSelectedJobId((current) => {
          const fallbackJob = nextJobs.find((job) => job.id === current) ?? nextJobs[0];
          if (fallbackJob) {
            setForm(formFromJob(fallbackJob));
          }
          return fallbackJob?.id ?? '';
        });
      } else {
        setSelectedJobId('');
        setForm(emptyJobForm);
      }

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

  const setField = <Field extends keyof JobForm>(field: Field, value: JobForm[Field]) => {
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
    setSubmitFeedback(null);
    setValidationErrors({});

    if (jobs.length > 0) {
      const fallbackJob = jobs[0];
      setSelectedJobId(fallbackJob.id);
      setForm(formFromJob(fallbackJob));
      return;
    }

    setSelectedJobId('');
    setForm({ ...emptyJobForm, requirements: [''], responsibilities: [''], skills: [''], benefits: [] });
  };

  const buildPayload = (): EmployerJobPayload => {
    const departmentValue = form.departmentChoice === 'Other'
      ? form.departmentCustom.trim() || null
      : form.departmentChoice || null;
    const jobType: EmployerJobPayload['jobType'] = form.engagementType === 'FREELANCE'
      ? 'FREELANCE_PROJECT'
      : 'NORMAL_EMPLOYMENT';

    const common = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      department: departmentValue,
      workArrangement: form.workArrangement,
      engagementType: form.engagementType,
      jobType,
      requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
      responsibilities: form.responsibilities.map((item) => item.trim()).filter(Boolean),
      skills: form.skills.map((item) => item.trim()).filter(Boolean),
      benefits: form.benefits.map((item) => item.trim()).filter(Boolean),
      applicationDeadline: form.applicationDeadline || null,
    };

    if (form.engagementType === 'MONTHLY') {
      return {
        ...common,
        monthlyCompensation: {
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          currency: form.currency.trim().toUpperCase() || 'NGN',
        },
        contractCompensation: null,
        freelanceCompensation: null,
      };
    }

    if (form.engagementType === 'CONTRACT') {
      return {
        ...common,
        monthlyCompensation: null,
        contractCompensation: {
          amount: Number(form.contractAmount),
          currency: form.currency.trim().toUpperCase() || 'NGN',
          duration: form.contractDuration.trim(),
        },
        freelanceCompensation: null,
      };
    }

    return {
      ...common,
      monthlyCompensation: null,
      contractCompensation: null,
      freelanceCompensation: {
        projectAmount: Number(form.freelanceAmount),
        currency: form.currency.trim().toUpperCase() || 'NGN',
      },
    };
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      nextErrors.title = 'Job title is required.';
    }

    if (!form.location.trim()) {
      nextErrors.location = 'Location is required.';
    }

    if (!form.description.trim()) {
      nextErrors.description = 'Job overview is required.';
    }

    if (form.departmentChoice === 'Other' && !form.departmentCustom.trim()) {
      nextErrors.departmentCustom = 'Please enter the department name.';
    }

    if (!form.currency.trim()) {
      nextErrors.currency = 'Currency is required.';
    }

    if (form.engagementType === 'MONTHLY') {
      if (!form.salaryMin.trim() && !form.salaryMax.trim()) {
        nextErrors.salaryMin = 'At least one monthly salary value is required.';
      }

      if (form.salaryMin.trim() && form.salaryMax.trim()) {
        const minValue = Number(form.salaryMin);
        const maxValue = Number(form.salaryMax);

        if (minValue > maxValue) {
          nextErrors.salaryMax = 'Maximum salary must be greater than or equal to minimum salary.';
        }
      }
    }

    if (form.engagementType === 'CONTRACT') {
      if (!form.contractAmount.trim()) {
        nextErrors.contractAmount = 'Contract amount is required.';
      }

      if (!form.contractDuration.trim()) {
        nextErrors.contractDuration = 'Contract duration is required.';
      }
    }

    if (form.engagementType === 'FREELANCE' && !form.freelanceAmount.trim()) {
      nextErrors.freelanceAmount = 'Project amount is required.';
    }

    return nextErrors;
  };

  const saveJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) return;

    const nextErrors = validateForm();

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
      ? await createEmployerJob(buildPayload(), token)
      : selectedJob
        ? await updateEmployerJob(selectedJob.id, buildPayload(), token)
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
    setSelectedJobId(savedJob.id);
    setIsCreating(false);
    setForm(formFromJob(savedJob));
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

  if (isLoading) {
    return <div className="employer-page employer-empty-state" role="status">Loading your job posts...</div>;
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

  const listFields = [
    ['requirements', 'Requirements'],
    ['responsibilities', 'Responsibilities'],
    ['skills', 'Skills Required'],
    ['benefits', 'Benefits (optional)'],
  ] as const;

  const showEmptyState = jobs.length === 0 && !isCreating;

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
          {showEmptyState ? (
            <div className="employer-empty-state employer-empty-state--large">
              <div className="employer-empty-state__icon">
                <FaPlus />
              </div>
              <h2>Your jobs</h2>
              <p>
                Manage and publish opportunities from one place. Create your first job post to start receiving applications.
              </p>
              <button className="employer-button employer-button--primary" type="button" onClick={startCreating}>
                <FaPlus /> Post your first job
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

              <form className="employer-form" onSubmit={saveJob} noValidate>
                <div className="employer-form__section">
                  <h3>Basic information</h3>

                  <label className="employer-form__field">
                    <span>Job title</span>
                    <input
                      id="title"
                      aria-invalid={Boolean(validationErrors.title)}
                      aria-describedby={validationErrors.title ? 'title-error' : undefined}
                      value={form.title}
                      onChange={(event) => setField('title', event.target.value)}
                      placeholder="Senior Product Designer"
                    />
                    {validationErrors.title ? (
                      <span id="title-error" className="employer-form__error" role="alert">
                        {validationErrors.title}
                      </span>
                    ) : null}
                  </label>

                  <div className="employer-form__split">
                    <label className="employer-form__field">
                      <span>Department</span>
                      <select
                        id="departmentChoice"
                        value={form.departmentChoice}
                        onChange={(event) => setField('departmentChoice', event.target.value)}
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="employer-form__field">
                      <span>Location</span>
                      <input
                        id="location"
                        aria-invalid={Boolean(validationErrors.location)}
                        aria-describedby={validationErrors.location ? 'location-error' : undefined}
                        value={form.location}
                        onChange={(event) => setField('location', event.target.value)}
                        placeholder="Lagos, Nigeria"
                      />
                      {validationErrors.location ? (
                        <span id="location-error" className="employer-form__error" role="alert">
                          {validationErrors.location}
                        </span>
                      ) : null}
                    </label>
                  </div>

                  {form.departmentChoice === 'Other' ? (
                    <label className="employer-form__field employer-form__field--inline">
                      <span>Enter department</span>
                      <input
                        id="departmentCustom"
                        aria-invalid={Boolean(validationErrors.departmentCustom)}
                        aria-describedby={validationErrors.departmentCustom ? 'departmentCustom-error' : undefined}
                        value={form.departmentCustom}
                        onChange={(event) => setField('departmentCustom', event.target.value)}
                        placeholder="e.g. Cybersecurity"
                      />
                      {validationErrors.departmentCustom ? (
                        <span id="departmentCustom-error" className="employer-form__error" role="alert">
                          {validationErrors.departmentCustom}
                        </span>
                      ) : null}
                    </label>
                  ) : null}
                </div>

                <div className="employer-form__section">
                  <h3>Job details</h3>

                  <div className="employer-form__split">
                    <label className="employer-form__field">
                      <span>Work arrangement</span>
                      <select value={form.workArrangement} onChange={(event) => setField('workArrangement', event.target.value as JobForm['workArrangement'])}>
                        <option value="REMOTE">Remote</option>
                        <option value="HYBRID">Hybrid</option>
                        <option value="ONSITE">On-site</option>
                      </select>
                    </label>

                    <label className="employer-form__field">
                      <span>Engagement type</span>
                      <select value={form.engagementType} onChange={(event) => setField('engagementType', event.target.value as JobForm['engagementType'])}>
                        <option value="MONTHLY">Monthly</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="FREELANCE">Freelance</option>
                      </select>
                    </label>
                  </div>

                  <label className="employer-form__field">
                    <span>Job overview</span>
                    <textarea
                      id="description"
                      aria-invalid={Boolean(validationErrors.description)}
                      aria-describedby={validationErrors.description ? 'description-error' : undefined}
                      value={form.description}
                      onChange={(event) => setField('description', event.target.value)}
                      placeholder="Describe the role, team, and what success looks like."
                    />
                    {validationErrors.description ? (
                      <span id="description-error" className="employer-form__error" role="alert">
                        {validationErrors.description}
                      </span>
                    ) : null}
                  </label>

                  {listFields.map(([field, label]) => (
                    <div className="employer-form__detail-section" key={field}>
                      <span className="employer-form__detail-heading">{label}</span>
                      <div className="employer-detail-list-editor">
                        {form[field].map((item, index) => (
                          <div className="employer-detail-list-editor__row" key={`${field}-${index}`}>
                            <input
                              id={`${field}-${index}`}
                              value={item}
                              onChange={(event) => setListField(field, index, event.target.value)}
                              placeholder={`${label.replace(' (optional)', '')} ${index + 1}`}
                            />
                            <button
                              type="button"
                              aria-label={`Remove ${label} item ${index + 1}`}
                              className="employer-icon-button employer-icon-button--danger"
                              onClick={() => removeListField(field, index)}
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button className="employer-add-detail" type="button" onClick={() => addListField(field)}>
                        <FaPlus /> Add item
                      </button>
                    </div>
                  ))}
                </div>

                <div className="employer-form__section">
                  <h3>Compensation</h3>

                  <div className="employer-form__split employer-form__split--compact">
                    <label className="employer-form__field">
                      <span>Currency</span>
                      <input
                        id="currency"
                        aria-invalid={Boolean(validationErrors.currency)}
                        aria-describedby={validationErrors.currency ? 'currency-error' : undefined}
                        value={form.currency}
                        onChange={(event) => setField('currency', event.target.value.toUpperCase())}
                        placeholder="NGN"
                      />
                      {validationErrors.currency ? (
                        <span id="currency-error" className="employer-form__error" role="alert">
                          {validationErrors.currency}
                        </span>
                      ) : null}
                    </label>
                  </div>

                  {form.engagementType === 'MONTHLY' ? (
                    <div className="employer-form__split">
                      <label className="employer-form__field">
                        <span>Minimum monthly salary</span>
                        <input
                          id="salaryMin"
                          type="number"
                          min="0"
                          step="0.01"
                          aria-invalid={Boolean(validationErrors.salaryMin)}
                          aria-describedby={validationErrors.salaryMin ? 'salaryMin-error' : undefined}
                          value={form.salaryMin}
                          onChange={(event) => setField('salaryMin', event.target.value)}
                        />
                        {validationErrors.salaryMin ? (
                          <span id="salaryMin-error" className="employer-form__error" role="alert">
                            {validationErrors.salaryMin}
                          </span>
                        ) : null}
                      </label>

                      <label className="employer-form__field">
                        <span>Maximum monthly salary</span>
                        <input
                          id="salaryMax"
                          type="number"
                          min="0"
                          step="0.01"
                          aria-invalid={Boolean(validationErrors.salaryMax)}
                          aria-describedby={validationErrors.salaryMax ? 'salaryMax-error' : undefined}
                          value={form.salaryMax}
                          onChange={(event) => setField('salaryMax', event.target.value)}
                        />
                        {validationErrors.salaryMax ? (
                          <span id="salaryMax-error" className="employer-form__error" role="alert">
                            {validationErrors.salaryMax}
                          </span>
                        ) : null}
                      </label>
                    </div>
                  ) : null}

                  {form.engagementType === 'CONTRACT' ? (
                    <div className="employer-form__split">
                      <label className="employer-form__field">
                        <span>Contract amount</span>
                        <input
                          id="contractAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          aria-invalid={Boolean(validationErrors.contractAmount)}
                          aria-describedby={validationErrors.contractAmount ? 'contractAmount-error' : undefined}
                          value={form.contractAmount}
                          onChange={(event) => setField('contractAmount', event.target.value)}
                        />
                        {validationErrors.contractAmount ? (
                          <span id="contractAmount-error" className="employer-form__error" role="alert">
                            {validationErrors.contractAmount}
                          </span>
                        ) : null}
                      </label>

                      <label className="employer-form__field">
                        <span>Contract duration</span>
                        <input
                          id="contractDuration"
                          aria-invalid={Boolean(validationErrors.contractDuration)}
                          aria-describedby={validationErrors.contractDuration ? 'contractDuration-error' : undefined}
                          value={form.contractDuration}
                          onChange={(event) => setField('contractDuration', event.target.value)}
                          placeholder="e.g. 6 months"
                        />
                        {validationErrors.contractDuration ? (
                          <span id="contractDuration-error" className="employer-form__error" role="alert">
                            {validationErrors.contractDuration}
                          </span>
                        ) : null}
                      </label>
                    </div>
                  ) : null}

                  {form.engagementType === 'FREELANCE' ? (
                    <label className="employer-form__field">
                      <span>Project amount</span>
                      <input
                        id="freelanceAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        aria-invalid={Boolean(validationErrors.freelanceAmount)}
                        aria-describedby={validationErrors.freelanceAmount ? 'freelanceAmount-error' : undefined}
                        value={form.freelanceAmount}
                        onChange={(event) => setField('freelanceAmount', event.target.value)}
                      />
                      {validationErrors.freelanceAmount ? (
                        <span id="freelanceAmount-error" className="employer-form__error" role="alert">
                          {validationErrors.freelanceAmount}
                        </span>
                      ) : null}
                    </label>
                  ) : null}
                </div>

                <div className="employer-form__section">
                  <h3>Application</h3>

                  <label className="employer-form__field">
                    <span>Application deadline</span>
                    <input
                      id="applicationDeadline"
                      type="date"
                      value={form.applicationDeadline}
                      onChange={(event) => setField('applicationDeadline', event.target.value)}
                    />
                  </label>
                </div>

                <div className="employer-editor-actions">
                  <button className="employer-button employer-button--ghost" type="button" onClick={cancelEditing}>
                    Cancel
                  </button>
                  <button className="employer-button employer-button--primary" type="submit" disabled={isSaving}>
                    <FaCheckCircle />
                    {isSaving ? (isCreating ? 'Posting Job...' : 'Saving Changes...') : isCreating ? 'Post Job' : 'Update Job'}
                  </button>
                </div>
              </form>
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
