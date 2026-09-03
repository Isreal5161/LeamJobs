import { useEffect, useRef, useState, type FormEvent } from 'react';
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
  FaSave,
  FaStar,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import { useJobStore } from '../../context/JobStoreContext';
import type { JobDetails, PublicJob } from '../../data/jobData';

type EditableJobField =
  | 'role'
  | 'company'
  | 'level'
  | 'location'
  | 'workType'
  | 'workArrangement'
  | 'salary'
  | 'description'
  | 'expires'
  | 'conversion';
type EditableDetailField = keyof JobDetails;
type EditableDetailList = 'responsibilities' | 'requirements' | 'skills';

type AdminJobForm = {
  role: string;
  company: string;
  logoText: string;
  level: string;
  location: string;
  workType: string;
  workArrangement: string;
  salary: string;
  compensationType: 'Monthly salary' | 'One-time payment';
  paymentAmount: string;
  cvRequirement: NonNullable<PublicJob['cvRequirement']>;
  description: string;
  expires: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  companyDetails: string;
};

const emptyAdminJobForm: AdminJobForm = {
  role: '',
  company: '',
  logoText: '',
  level: 'Mid-level',
  location: '',
  workType: 'Full-time',
  workArrangement: 'Remote',
  salary: '',
  compensationType: 'Monthly salary',
  paymentAmount: '',
  cvRequirement: 'recommended',
  description: '',
  expires: '',
  overview: '',
  responsibilities: ['', '', ''],
  requirements: ['', '', ''],
  skills: ['', '', ''],
  companyDetails: '',
};

function AdminJobTextField({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return (
    <section className="admin-review-section">
      <h3>{title}</h3>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </section>
  );
}

function AdminJobListField({
  title,
  field,
  items,
  onChange,
  onAdd,
}: {
  title: string;
  field: 'responsibilities' | 'requirements' | 'skills';
  items: string[];
  onChange: (field: 'responsibilities' | 'requirements' | 'skills', index: number, value: string) => void;
  onAdd: (field: 'responsibilities' | 'requirements' | 'skills') => void;
}) {
  return (
    <section className="admin-review-section">
      <div className="admin-review-section__header">
        <h3>{title}</h3>
        <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => onAdd(field)}>
          <FaPlus /> Add
        </button>
      </div>
      <div className="admin-review-requirements">
        {items.map((item, index) => (
          <input key={`${field}-${index}`} value={item} placeholder={`${title.slice(0, -1)} ${index + 1}`} onChange={(event) => onChange(field, index, event.target.value)} />
        ))}
      </div>
    </section>
  );
}

function DetailListEditor({
  title,
  field,
  items,
  jobId,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string;
  field: EditableDetailList;
  items: string[];
  jobId: string;
  onChange: (field: EditableDetailList, index: number, value: string) => void;
  onAdd: (field: EditableDetailList) => void;
  onRemove: (field: EditableDetailList, index: number) => void;
}) {
  return (
    <section className="admin-review-section">
      <div className="admin-review-section__header">
        <h3>{title}</h3>
        <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => onAdd(field)}>
          <FaPlus /> Add
        </button>
      </div>
      <div className="admin-review-requirements">
        {items.map((item, index) => (
          <div className="admin-review-list-editor" key={`${jobId}-${field}-${index}`}>
            <input value={item} onChange={(event) => onChange(field, index, event.target.value)} />
            <button type="button" aria-label={`Remove ${title.toLowerCase()} ${index + 1}`} onClick={() => onRemove(field, index)}>
              <FaTrash />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminJobsPage() {
  const { jobs, addJob, updateJob } = useJobStore();
  const postedJobs = jobs.filter((job) => job.status === 'Approved');
  const editableJobs = postedJobs.length ? postedJobs : jobs;
  const [selectedJobId, setSelectedJobId] = useState(editableJobs[0]?.id ?? '');
  const [saveNotice, setSaveNotice] = useState('No job updates saved yet');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<AdminJobForm>(emptyAdminJobForm);
  const [shouldScrollToDetails, setShouldScrollToDetails] = useState(false);
  const detailsRef = useRef<HTMLElement>(null);

  const selectedJob = isCreating ? undefined : editableJobs.find((job) => job.id === selectedJobId) ?? editableJobs[0];
  const selectedCompanyName = selectedJob?.company ?? 'Selected company';
  const selectedCompanyJobs = selectedJob ? jobs.filter((job) => job.company === selectedJob.company) : [];
  const selectedCompanyPostedJobs = selectedCompanyJobs.filter((job) => job.status === 'Approved');
  const selectedCompanyFeaturedJobs = selectedCompanyJobs.filter((job) => job.featured);
  const selectedCompanyViews = selectedCompanyPostedJobs.reduce((total, job) => total + job.views, 0);
  const selectedCompanyPendingJobs = selectedCompanyJobs.filter((job) => job.status !== 'Approved');

  useEffect(() => {
    if (!editableJobs.length) {
      setSelectedJobId('');
      return;
    }

    if (!selectedJobId || !editableJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(editableJobs[0].id);
    }
  }, [editableJobs, selectedJobId]);

  useEffect(() => {
    if (!shouldScrollToDetails || !detailsRef.current) {
      return;
    }

    detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShouldScrollToDetails(false);
  }, [shouldScrollToDetails, isCreating, selectedJobId]);

  const updateJobField = <Field extends EditableJobField>(field: Field, value: PublicJob[Field]) => {
    if (!selectedJob) {
      return;
    }

    updateJob(selectedJob.id, { [field]: value } as Partial<PublicJob>);
  };

  const updateDetails = (patch: Partial<JobDetails>) => {
    if (!selectedJob) {
      return;
    }

    updateJob(selectedJob.id, {
      details: {
        ...selectedJob.details,
        ...patch,
      },
    });
  };

  const updateDetailText = (field: EditableDetailField, value: string) => {
    if (field === 'responsibilities' || field === 'requirements' || field === 'skills') {
      return;
    }

    updateDetails({ [field]: value });
  };

  const updateDetailListItem = (field: EditableDetailList, index: number, value: string) => {
    if (!selectedJob) {
      return;
    }

    updateDetails({
      [field]: selectedJob.details[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    });
  };

  const addDetailListItem = (field: EditableDetailList) => {
    if (!selectedJob) {
      return;
    }

    updateDetails({ [field]: [...selectedJob.details[field], 'New item'] });
  };

  const removeDetailListItem = (field: EditableDetailList, index: number) => {
    if (!selectedJob) {
      return;
    }

    updateDetails({ [field]: selectedJob.details[field].filter((_, itemIndex) => itemIndex !== index) });
  };

  const setFormField = <Field extends keyof AdminJobForm>(field: Field, value: AdminJobForm[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setFormListField = (field: 'responsibilities' | 'requirements' | 'skills', index: number, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  };

  const addFormListItem = (field: 'responsibilities' | 'requirements' | 'skills') => {
    setForm((current) => ({ ...current, [field]: [...current[field], ''] }));
  };

  const startCreating = () => {
    setIsCreating(true);
    setForm(emptyAdminJobForm);
    setShouldScrollToDetails(true);
  };

  const selectJob = (jobId: string) => {
    setIsCreating(false);
    setSelectedJobId(jobId);
    setShouldScrollToDetails(true);
  };

  const saveNewJob = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = `${form.role.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'admin-job'}-${Date.now()}`;
    const responsibilities = form.responsibilities.filter((item) => item.trim());
    const requirements = form.requirements.filter((item) => item.trim());
    const skills = form.skills.filter((item) => item.trim());
    const company = form.company.trim() || 'LeamJobs';

    addJob({
      id,
      company,
      logoText: form.logoText.trim() || company.slice(0, 2).toUpperCase(),
      role: form.role || 'Untitled position',
      salary: form.salary,
      compensationType: form.compensationType,
      paymentAmount: form.compensationType === 'One-time payment' ? Number(form.paymentAmount) || 0 : undefined,
      location: form.location,
      workArrangement: form.workArrangement,
      workType: form.workType,
      level: form.level,
      cvRequirement: form.cvRequirement,
      description: form.description,
      postedAt: 0,
      salaryHigh: 0,
      applicants: 0,
      views: 0,
      conversion: '0%',
      expires: form.expires || 'Not set',
      status: 'Approved',
      details: {
        overview: form.overview,
        responsibilities,
        requirements,
        skills,
        company: form.companyDetails || `${company} is building a thoughtful experience for its customers and team.`,
      },
    });
    setIsCreating(false);
    setSelectedJobId(id);
    setSaveNotice('New admin job published');
  };

  const saveJobUpdate = () => {
    setSaveNotice(`Job updated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Job control</span>
          <h1>Posted and approved jobs</h1>
          <p>Edit live employer job posts after approval and publish updated job details to the marketplace.</p>
        </div>
        <div className="admin-hero__actions">
          <button className="admin-button admin-button--primary" type="button" onClick={startCreating}>
            <FaPlus /> Post job
          </button>
        </div>
      </section>

      <section className="admin-stat-grid" aria-label="Posted job summary">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaBriefcase /></span>
          <div><strong>{selectedCompanyPostedJobs.length}</strong><p>{selectedCompanyName} live jobs</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaCheckCircle /></span>
          <div><strong>{selectedCompanyFeaturedJobs.length}</strong><p>{selectedCompanyName} featured</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--purple"><FaEye /></span>
          <div><strong>{selectedCompanyViews}</strong><p>{selectedCompanyName} views</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaClock /></span>
          <div><strong>{selectedCompanyPendingJobs.length}</strong><p>{selectedCompanyName} not yet live</p></div>
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
            {editableJobs.map((job) => (
              <button
                className={`admin-review-item admin-review-job-card ${selectedJob?.id === job.id ? 'admin-review-item--active' : ''}`}
                type="button"
                key={job.id}
                onClick={() => selectJob(job.id)}
              >
                <span className="admin-job-company-mark" data-color={job.logoClass ?? 'brand-logo--default'}>{job.logoText}</span>
                <div className="admin-review-job-card__content">
                  <strong>{job.role}</strong>
                  <p>{job.company} / {job.location}</p>
                  <small>{job.level} / {job.workType} / Posted {job.postedAt} days ago</small>
                </div>
                <div className="admin-review-job-card__meta">
                  <span>{job.salary}</span>
                  <span>{job.views} views</span>
                </div>
                <span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{job.status}</span>
              </button>
            ))}
          </div>
        </div>

        {isCreating ? (
          <article ref={detailsRef} className="admin-panel admin-review-detail">
            <div className="admin-review-detail__header">
              <div>
                <span className="admin-review-kicker"><FaPlus /> New admin job</span>
                <h2>Create a complete job post</h2>
                <p>Publish a job with the same full details shown on the public job details page.</p>
              </div>
            </div>
            <form className="admin-form" onSubmit={saveNewJob}>
              <div className="admin-review-edit-grid">
                <label><span>Job title</span><input required value={form.role} onChange={(event) => setFormField('role', event.target.value)} /></label>
                <label><span>Employer company</span><input required value={form.company} onChange={(event) => setFormField('company', event.target.value)} /></label>
                <label><span>Company initials</span><input maxLength={3} value={form.logoText} onChange={(event) => setFormField('logoText', event.target.value)} /></label>
                <label><span>Category / level</span><input value={form.level} onChange={(event) => setFormField('level', event.target.value)} /></label>
                <label><span>Location</span><input required value={form.location} onChange={(event) => setFormField('location', event.target.value)} /></label>
                <label><span>Work type</span><select value={form.workType} onChange={(event) => setFormField('workType', event.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option></select></label>
                <label><span>Work arrangement</span><select value={form.workArrangement} onChange={(event) => setFormField('workArrangement', event.target.value)}><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label>
                <label><span>Salary range</span><input required value={form.salary} onChange={(event) => setFormField('salary', event.target.value)} /></label>
                <label><span>Compensation type</span><select value={form.compensationType} onChange={(event) => setFormField('compensationType', event.target.value as AdminJobForm['compensationType'])}><option>Monthly salary</option><option>One-time payment</option></select></label>
                {form.compensationType === 'One-time payment' ? <label><span>Payment amount</span><input type="number" min="0" value={form.paymentAmount} onChange={(event) => setFormField('paymentAmount', event.target.value)} /></label> : null}
                <label><span>CV requirement</span><select value={form.cvRequirement} onChange={(event) => setFormField('cvRequirement', event.target.value as AdminJobForm['cvRequirement'])}><option value="required">Required</option><option value="recommended">Recommended</option><option value="optional">Optional</option><option value="not-needed">Not needed</option></select></label>
                <label><span>Expires</span><input value={form.expires} onChange={(event) => setFormField('expires', event.target.value)} placeholder="Sep 30, 2026" /></label>
                <label><span>Short description</span><input required value={form.description} onChange={(event) => setFormField('description', event.target.value)} /></label>
              </div>
              <AdminJobTextField title="Job overview" value={form.overview} onChange={(value) => setFormField('overview', value)} />
              <AdminJobListField title="Responsibilities" field="responsibilities" items={form.responsibilities} onChange={setFormListField} onAdd={addFormListItem} />
              <AdminJobListField title="Requirements" field="requirements" items={form.requirements} onChange={setFormListField} onAdd={addFormListItem} />
              <AdminJobListField title="Skills" field="skills" items={form.skills} onChange={setFormListField} onAdd={addFormListItem} />
              <AdminJobTextField title="About company" value={form.companyDetails} onChange={(value) => setFormField('companyDetails', value)} />
              <div className="admin-review-actions admin-review-actions--footer">
                <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => setIsCreating(false)}>Cancel</button>
                <button type="submit" className="admin-review-action admin-review-action--approve"><FaSave /> Publish job</button>
              </div>
            </form>
          </article>
        ) : selectedJob ? (
          <article ref={detailsRef} className="admin-panel admin-review-detail">
            <div className="admin-review-detail__header">
              <div>
                <span className="admin-review-kicker"><FaEdit /> Live job editor</span>
                <h2>{selectedJob.role}</h2>
                <p>{selectedJob.company} is already published. Changes here update the job post.</p>
              </div>
              <div className="admin-job-detail-panel__actions">
                {selectedJob.featured ? <span className="admin-status admin-status--approved">Featured</span> : null}
                <span className={`admin-status admin-status--${selectedJob.status.toLowerCase()}`}>{selectedJob.status}</span>
              </div>
            </div>

            <div className="admin-review-facts">
              <span><FaBuilding /> {selectedJob.company}</span>
              <span><FaMapMarkerAlt /> {selectedJob.location}</span>
              <span><FaDollarSign /> {selectedJob.salary}</span>
              <span><FaClock /> Expires {selectedJob.expires}</span>
            </div>

            <div className="admin-review-edit-grid">
              <label><span>Job title</span><input value={selectedJob.role} onChange={(event) => updateJobField('role', event.target.value)} /></label>
              <label><span>Employer company</span><input value={selectedJob.company} onChange={(event) => updateJobField('company', event.target.value)} /></label>
              <label><span>Category / level</span><input value={selectedJob.level} onChange={(event) => updateJobField('level', event.target.value)} /></label>
              <label><span>Location</span><input value={selectedJob.location} onChange={(event) => updateJobField('location', event.target.value)} /></label>
              <label><span>Work type</span><input value={selectedJob.workType} onChange={(event) => updateJobField('workType', event.target.value)} /></label>
              <label><span>Work arrangement</span><input value={selectedJob.workArrangement} onChange={(event) => updateJobField('workArrangement', event.target.value)} /></label>
              <label><span>Salary range</span><input value={selectedJob.salary} onChange={(event) => updateJobField('salary', event.target.value)} /></label>
              <label><span>Expires</span><input value={selectedJob.expires} onChange={(event) => updateJobField('expires', event.target.value)} /></label>
              <label><span>Conversion</span><input value={selectedJob.conversion} onChange={(event) => updateJobField('conversion', event.target.value)} /></label>
              <label><span>Short description</span><input value={selectedJob.description} onChange={(event) => updateJobField('description', event.target.value)} /></label>
            </div>

            <section className="admin-review-section">
              <h3>Job overview</h3>
              <textarea
                value={selectedJob.details.overview}
                onChange={(event) => {
                  updateJob(selectedJob.id, { description: event.target.value });
                  updateDetailText('overview', event.target.value);
                }}
              />
            </section>

            <DetailListEditor
              title="Responsibilities"
              field="responsibilities"
              items={selectedJob.details.responsibilities}
              jobId={selectedJob.id}
              onChange={updateDetailListItem}
              onAdd={addDetailListItem}
              onRemove={removeDetailListItem}
            />

            <DetailListEditor
              title="Requirements"
              field="requirements"
              items={selectedJob.details.requirements}
              jobId={selectedJob.id}
              onChange={updateDetailListItem}
              onAdd={addDetailListItem}
              onRemove={removeDetailListItem}
            />

            <DetailListEditor
              title="Skills"
              field="skills"
              items={selectedJob.details.skills}
              jobId={selectedJob.id}
              onChange={updateDetailListItem}
              onAdd={addDetailListItem}
              onRemove={removeDetailListItem}
            />

            <section className="admin-review-section">
              <h3>About company</h3>
              <textarea value={selectedJob.details.company} onChange={(event) => updateDetailText('company', event.target.value)} />
            </section>

            <div className="admin-review-performance">
              <div><strong>{selectedJob.applicants}</strong><span>Applicants</span></div>
              <div><strong>{selectedJob.views}</strong><span>Views</span></div>
              <div><strong>{selectedJob.conversion}</strong><span>Conversion</span></div>
              <div><strong>{selectedJob.expires}</strong><span>Expires</span></div>
            </div>

            <div className="admin-review-decision-card">
              <div>
                <span><FaSave /> Update live post</span>
                <strong>{saveNotice}</strong>
              </div>
              <div className="admin-review-actions">
                <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => updateJob(selectedJob.id, { featured: !selectedJob.featured })}>
                  <FaStar /> {selectedJob.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button type="button" className="admin-review-action admin-review-action--decline" onClick={() => updateJob(selectedJob.id, { status: 'Declined' })}>
                  <FaTimesCircle /> Remove live
                </button>
                <button type="button" className="admin-review-action admin-review-action--approve" onClick={saveJobUpdate}>
                  <FaSave /> Update job
                </button>
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );

}

export default AdminJobsPage;
