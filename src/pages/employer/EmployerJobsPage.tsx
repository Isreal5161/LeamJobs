import { useState } from 'react';
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
  FaStar,
  FaTrashAlt,
  FaUsers,
} from 'react-icons/fa';
import { useJobStore } from '../../context/JobStoreContext';
import type { PublicJob } from '../../data/jobData';

const departments = ['Design', 'Engineering', 'Marketing', 'Operations'];
const statusFilters = ['All posts', 'Open', 'Draft'];

type JobForm = {
  title: string;
  team: string;
  type: string;
  location: string;
  mode: string;
  salary: string;
  compensationType: 'Monthly salary' | 'One-time payment';
  paymentAmount: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
};

const emptyJobForm: JobForm = {
  title: '',
  team: 'Design',
  type: 'Full-time',
  location: '',
  mode: 'Remote',
  salary: '',
  compensationType: 'Monthly salary',
  paymentAmount: '',
  overview: '',
  responsibilities: ['', '', ''],
  requirements: ['', '', ''],
};

function formFromJob(job: PublicJob): JobForm {
  return {
    title: job.role,
    team: job.level.replace('-level', '') || 'Design',
    type: job.workType,
    location: job.location,
    mode: job.workArrangement,
    salary: job.salary,
    compensationType: job.compensationType ?? 'Monthly salary',
    paymentAmount: job.paymentAmount?.toString() ?? '',
    overview: job.details.overview,
    responsibilities: job.details.responsibilities,
    requirements: job.details.requirements,
  };
}

function EmployerJobsPage() {
  const { jobs, addJob, updateJob } = useJobStore();
  const employerJobs = jobs;
  const [selectedJobId, setSelectedJobId] = useState(employerJobs[0]?.id ?? '');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<JobForm>(employerJobs[0] ? formFromJob(employerJobs[0]) : emptyJobForm);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusFilters[0]);
  const selectedJob = isCreating ? undefined : employerJobs.find((job) => job.id === selectedJobId) ?? employerJobs[0];
  const filteredJobs = employerJobs.filter((job) => {
    const matchesQuery = `${job.role} ${job.level} ${job.location} ${job.workArrangement}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'All posts'
      || (statusFilter === 'Open' && job.status === 'Approved')
      || job.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const setField = <Field extends keyof JobForm>(field: Field, value: JobForm[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setListField = (field: 'responsibilities' | 'requirements', index: number, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  };

  const addListField = (field: 'responsibilities' | 'requirements') => {
    setForm((current) => ({ ...current, [field]: [...current[field], ''] }));
  };

  const startEditing = (job: PublicJob) => {
    setSelectedJobId(job.id);
    setIsCreating(false);
    setForm(formFromJob(job));
  };

  const startCreating = () => {
    setIsCreating(true);
    setSelectedJobId('');
    setForm(emptyJobForm);
  };

  const saveJob = (status: PublicJob['status']) => {
    const responsibilities = form.responsibilities.filter((item) => item.trim());
    const requirements = form.requirements.filter((item) => item.trim());
    const details = selectedJob ? selectedJob.details : {
      overview: form.overview,
      responsibilities,
      requirements,
      skills: requirements,
      company: 'A verified employer on LeamJobs.',
    };

    if (isCreating) {
      const id = `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'new-job'}-${Date.now()}`;
      addJob({
        id,
        company: 'Your company',
        logoText: 'YC',
        role: form.title || 'Untitled position',
        salary: form.salary,
        compensationType: form.compensationType,
        paymentAmount: form.compensationType === 'One-time payment' ? Number(form.paymentAmount) || 0 : undefined,
        location: form.location,
        workArrangement: form.mode,
        workType: form.type,
        level: form.team,
        description: form.overview,
        postedAt: 0,
        salaryHigh: 0,
        applicants: 0,
        views: 0,
        conversion: '0%',
        expires: 'Not set',
        status,
        details: { ...details, overview: form.overview, responsibilities, requirements, skills: requirements },
      });
      setIsCreating(false);
      setSelectedJobId(id);
      return;
    }

    if (selectedJob) {
      updateJob(selectedJob.id, {
        role: form.title,
        salary: form.salary,
        compensationType: form.compensationType,
        paymentAmount: form.compensationType === 'One-time payment' ? Number(form.paymentAmount) || 0 : undefined,
        location: form.location,
        workArrangement: form.mode,
        workType: form.type,
        level: form.team,
        description: form.overview,
        status,
        details: { ...selectedJob.details, overview: form.overview, responsibilities, requirements, skills: requirements },
      });
    }
  };

  return (
    <div className="employer-page employer-jobs-page">
      <section className="employer-hero employer-hero--compact">
        <div className="employer-hero__top">
          <div>
            <span className="employer-eyebrow">Job posting and editing</span>
            <h1>Manage open positions</h1>
            <p>Create, update, publish, and monitor every role from one focused workspace.</p>
          </div>
          <button className="employer-icon-button" type="button" aria-label="Notifications">
            <FaBell />
          </button>
        </div>
      </section>

      <main className="employer-content employer-jobs-grid">
        <section className="employer-panel employer-job-editor">
          <div className="employer-section-heading">
            <div>
              <h2>{isCreating ? 'Create job post' : selectedJob?.status === 'Draft' ? 'Finish job draft' : 'Edit job post'}</h2>
              <p>Build a clear role description for stronger applicant matches.</p>
            </div>
            <button className="employer-button employer-button--primary" type="button" onClick={startCreating}>
              <FaPlus />
              Publish
            </button>
          </div>

          {selectedJob?.status === 'Approved' ? (
            <div className="employer-editor-summary" aria-label="Selected job performance">
              <span><FaUsers /> {selectedJob.applicants} applicants</span>
              <span><FaEye /> {selectedJob.views.toLocaleString()} views</span>
              <span><FaStar /> Match data updates after applications</span>
              <span><FaLayerGroup /> {selectedJob.status} status</span>
            </div>
          ) : null}

          <form className="employer-form" onSubmit={(event) => { event.preventDefault(); saveJob('Pending'); }}>
            <label>
              <span>Job title</span>
              <input type="text" value={form.title} onChange={(event) => setField('title', event.target.value)} />
            </label>
            <div className="employer-form__split">
              <label>
                <span>Department</span>
                  <select value={form.team} onChange={(event) => setField('team', event.target.value)}>
                  {departments.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Employment type</span>
                <select value={form.type} onChange={(event) => setField('type', event.target.value)}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </label>
            </div>
            <div className="employer-form__split">
              <label>
                <span>Location</span>
                <input type="text" value={form.location} onChange={(event) => setField('location', event.target.value)} />
              </label>
              <label>
                <span>Work mode</span>
                <select value={form.mode} onChange={(event) => setField('mode', event.target.value)}>
                  <option>Remote</option>
                  <option>Hybrid</option>
                  <option>On-site</option>
                </select>
              </label>
            </div>
            <label>
              <span>Salary range</span>
              <input type="text" value={form.salary} onChange={(event) => setField('salary', event.target.value)} />
            </label>
            <div className="employer-form__split">
              <label>
                <span>Compensation type</span>
                <select value={form.compensationType} onChange={(event) => setField('compensationType', event.target.value as JobForm['compensationType'])}>
                  <option>Monthly salary</option>
                  <option>One-time payment</option>
                </select>
              </label>
              {form.compensationType === 'One-time payment' ? (
                <label>
                  <span>Project payment amount</span>
                  <input type="number" min="0" value={form.paymentAmount} onChange={(event) => setField('paymentAmount', event.target.value)} placeholder="Enter total project payment" />
                </label>
              ) : <div aria-hidden="true" />}
            </div>
            <div className="employer-form__detail-section">
              <span className="employer-form__detail-heading">Job overview</span>
              <textarea value={form.overview} onChange={(event) => setField('overview', event.target.value)} />
            </div>
            <div className="employer-form__detail-section">
              <span className="employer-form__detail-heading">Responsibilities</span>
              <div className="employer-detail-list-editor">
                {form.responsibilities.map((item, index) => <input key={`responsibility-${index}`} type="text" placeholder={`Responsibility ${index + 1}`} value={item} onChange={(event) => setListField('responsibilities', index, event.target.value)} />)}
              </div>
              <button className="employer-add-detail" type="button" onClick={() => addListField('responsibilities')}><FaPlus /> Add responsibility</button>
            </div>
            <div className="employer-form__detail-section">
              <span className="employer-form__detail-heading">Requirements</span>
              <div className="employer-detail-list-editor">
                {form.requirements.map((item, index) => <input key={`requirement-${index}`} type="text" placeholder={`Requirement ${index + 1}`} value={item} onChange={(event) => setListField('requirements', index, event.target.value)} />)}
              </div>
              <button className="employer-add-detail" type="button" onClick={() => addListField('requirements')}><FaPlus /> Add requirement</button>
            </div>

            <div className="employer-editor-actions">
                <button className="employer-button employer-button--ghost" type="button" onClick={() => saveJob('Draft')}>
                Save Draft
              </button>
              <button className="employer-button employer-button--primary" type="button" onClick={() => saveJob('Pending')}>
                <FaCheckCircle />
                Update Job
              </button>
            </div>
          </form>
        </section>

        <aside className="employer-panel employer-open-jobs">
          <div className="employer-list-tools">
            <label className="employer-search" aria-label="Search job posts">
              <FaSearch />
              <input
                type="search"
                placeholder="Search job posts"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button
              type="button"
              aria-label="Filter job posts"
              onClick={() => {
                const nextIndex = (statusFilters.indexOf(statusFilter) + 1) % statusFilters.length;
                setStatusFilter(statusFilters[nextIndex]);
              }}
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
                {filter}
              </button>
            ))}
          </div>

          <div className="employer-job-list">
            {filteredJobs.map((job) => (
              <article className={`employer-job-card ${selectedJobId === job.id ? 'employer-job-card--active' : ''}`} key={job.id}>
                <button type="button" onClick={() => startEditing(job)}>
                  <div>
                    <span className={`employer-status employer-status--${job.status.toLowerCase()}`}>{job.status}</span>
                    <h3>{job.role}</h3>
                    <p>{job.location} / {job.workArrangement}</p>
                  </div>
                  <strong>{job.applicants}</strong>
                </button>
                <div className="employer-job-card__footer">
                  <span><FaCalendarAlt /> Closes {job.expires}</span>
                  <div>
                    <button type="button" aria-label={`Preview ${job.title}`}><FaEye /></button>
                    <button type="button" aria-label={`Edit ${job.title}`} onClick={() => startEditing(job)}><FaEdit /></button>
                    <button type="button" aria-label={`Delete ${job.title}`}><FaTrashAlt /></button>
                  </div>
                </div>
              </article>
            ))}
            {filteredJobs.length === 0 ? (
              <div className="employer-empty-state">
                <strong>No matching posts</strong>
                <p>Try another title, team, location, or status filter.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default EmployerJobsPage;
