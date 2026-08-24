import { useEffect, useState } from 'react';
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

function AdminJobsPage() {
  const { jobs, updateJob } = useJobStore();
  const postedJobs = jobs.filter((job) => job.status === 'Approved');
  const editableJobs = postedJobs.length ? postedJobs : jobs;
  const [selectedJobId, setSelectedJobId] = useState(editableJobs[0]?.id ?? '');
  const [saveNotice, setSaveNotice] = useState('No job updates saved yet');

  const selectedJob = editableJobs.find((job) => job.id === selectedJobId) ?? editableJobs[0];
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

  const updateJobField = <Field extends EditableJobField>(field: Field, value: PublicJob[Field]) => {
    updateJob(selectedJob.id, { [field]: value } as Partial<PublicJob>);
  };

  const updateDetails = (patch: Partial<JobDetails>) => {
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
    updateDetails({
      [field]: selectedJob.details[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    });
  };

  const addDetailListItem = (field: EditableDetailList) => {
    updateDetails({ [field]: [...selectedJob.details[field], 'New item'] });
  };

  const removeDetailListItem = (field: EditableDetailList, index: number) => {
    updateDetails({ [field]: selectedJob.details[field].filter((_, itemIndex) => itemIndex !== index) });
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
        <button className="admin-icon-button" type="button" aria-label="Preview live jobs">
          <FaEye />
        </button>
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
                onClick={() => setSelectedJobId(job.id)}
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

        {selectedJob ? (
          <article className="admin-panel admin-review-detail">
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
            />

            <DetailListEditor
              title="Requirements"
              field="requirements"
              items={selectedJob.details.requirements}
            />

            <DetailListEditor
              title="Skills"
              field="skills"
              items={selectedJob.details.skills}
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

  function DetailListEditor({ title, field, items }: { title: string; field: EditableDetailList; items: string[] }) {
    return (
      <section className="admin-review-section">
        <div className="admin-review-section__header">
          <h3>{title}</h3>
          <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => addDetailListItem(field)}>
            <FaPlus /> Add
          </button>
        </div>
        <div className="admin-review-requirements">
          {items.map((item, index) => (
            <div className="admin-review-list-editor" key={`${selectedJob.id}-${field}-${index}`}>
              <input value={item} onChange={(event) => updateDetailListItem(field, index, event.target.value)} />
              <button type="button" aria-label={`Remove ${title.toLowerCase()} ${index + 1}`} onClick={() => removeDetailListItem(field, index)}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }
}

export default AdminJobsPage;
