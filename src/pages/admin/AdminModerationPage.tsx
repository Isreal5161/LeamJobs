import { useEffect, useState } from 'react';
import {
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaEye,
  FaFlag,
  FaMapMarkerAlt,
  FaPlus,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import { useJobStore } from '../../context/JobStoreContext';
import type { JobDetails, ModerationStatus, PublicJob } from '../../data/jobData';

type EditableJobField = 'role' | 'company' | 'level' | 'location' | 'workType' | 'workArrangement' | 'salary' | 'description';
type EditableDetailField = keyof JobDetails;
type EditableDetailList = 'responsibilities' | 'requirements' | 'skills';

function AdminModerationPage() {
  const { jobs, updateJob, updateJobStatus } = useJobStore();
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? '');

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0];
  const pendingJobs = jobs.filter((job) => job.status === 'Pending').length;
  const flaggedJobs = jobs.filter((job) => job.status === 'Flagged').length;
  const approvedJobs = jobs.filter((job) => job.status === 'Approved').length;

  useEffect(() => {
    if (!jobs.length) {
      setSelectedJobId('');
      return;
    }

    if (!selectedJobId || !jobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

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

  const decideJob = (status: ModerationStatus) => {
    updateJobStatus(selectedJob.id, status);
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Review queue</span>
          <h1>Employer job approvals</h1>
          <p>Edit submitted job posts, verify the full job details, then approve, flag, or reject them before they go live.</p>
        </div>
        <button className="admin-icon-button" type="button" aria-label="Open review filters">
          <FaFlag />
        </button>
      </section>

      <section className="admin-stat-grid" aria-label="Review summary">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--yellow"><FaClock /></span>
          <div><strong>{pendingJobs}</strong><p>pending jobs</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon"><FaBriefcase /></span>
          <div><strong>{jobs.length}</strong><p>total submissions</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--green"><FaCheckCircle /></span>
          <div><strong>{approvedJobs}</strong><p>approved posts</p></div>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon admin-stat-card__icon--red"><FaFlag /></span>
          <div><strong>{flaggedJobs}</strong><p>flagged for edits</p></div>
        </article>
      </section>

      <section className="admin-moderation-workspace">
        <div className="admin-panel admin-review-list-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaBriefcase /> Job queue</span>
              <h2>Employer posts waiting for admin decision</h2>
            </div>
          </div>

          <div className="admin-review-list admin-review-list--rows">
            {jobs.map((job) => (
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
                <span className="admin-review-kicker"><FaEdit /> Full job editor</span>
                <h2>{selectedJob.role}</h2>
                <p>{selectedJob.company} submitted this job for marketplace review.</p>
              </div>
              <span className={`admin-status admin-status--${selectedJob.status.toLowerCase()}`}>{selectedJob.status}</span>
            </div>

            <div className="admin-review-facts">
              <span><FaBuilding /> {selectedJob.company}</span>
              <span><FaMapMarkerAlt /> {selectedJob.location}</span>
              <span><FaClock /> Posted {selectedJob.postedAt} days ago</span>
              <span><FaDollarSign /> {selectedJob.salary}</span>
            </div>

            <div className="admin-review-edit-grid">
              <label>
                <span>Job title</span>
                <input value={selectedJob.role} onChange={(event) => updateJobField('role', event.target.value)} />
              </label>
              <label>
                <span>Employer company</span>
                <input value={selectedJob.company} onChange={(event) => updateJobField('company', event.target.value)} />
              </label>
              <label>
                <span>Category / level</span>
                <input value={selectedJob.level} onChange={(event) => updateJobField('level', event.target.value)} />
              </label>
              <label>
                <span>Location</span>
                <input value={selectedJob.location} onChange={(event) => updateJobField('location', event.target.value)} />
              </label>
              <label>
                <span>Work type</span>
                <input value={selectedJob.workType} onChange={(event) => updateJobField('workType', event.target.value)} />
              </label>
              <label>
                <span>Work arrangement</span>
                <input value={selectedJob.workArrangement} onChange={(event) => updateJobField('workArrangement', event.target.value)} />
              </label>
              <label>
                <span>Salary range</span>
                <input value={selectedJob.salary} onChange={(event) => updateJobField('salary', event.target.value)} />
              </label>
              <label>
                <span>Short description</span>
                <input value={selectedJob.description} onChange={(event) => updateJobField('description', event.target.value)} />
              </label>
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

            <section className="admin-review-section">
              <div className="admin-review-section__header">
                <h3>Responsibilities</h3>
                <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => addDetailListItem('responsibilities')}>
                  <FaPlus /> Add
                </button>
              </div>
              <div className="admin-review-requirements">
                {selectedJob.details.responsibilities.map((item, index) => (
                  <div className="admin-review-list-editor" key={`${selectedJob.id}-responsibility-${index}`}>
                    <input value={item} onChange={(event) => updateDetailListItem('responsibilities', index, event.target.value)} />
                    <button type="button" aria-label={`Remove responsibility ${index + 1}`} onClick={() => removeDetailListItem('responsibilities', index)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-review-section">
              <div className="admin-review-section__header">
                <h3>Requirements</h3>
                <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => addDetailListItem('requirements')}>
                  <FaPlus /> Add
                </button>
              </div>
              <div className="admin-review-requirements">
                {selectedJob.details.requirements.map((item, index) => (
                  <div className="admin-review-list-editor" key={`${selectedJob.id}-requirement-${index}`}>
                    <input value={item} onChange={(event) => updateDetailListItem('requirements', index, event.target.value)} />
                    <button type="button" aria-label={`Remove requirement ${index + 1}`} onClick={() => removeDetailListItem('requirements', index)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-review-section">
              <div className="admin-review-section__header">
                <h3>Skills</h3>
                <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => addDetailListItem('skills')}>
                  <FaPlus /> Add
                </button>
              </div>
              <div className="admin-review-requirements">
                {selectedJob.details.skills.map((item, index) => (
                  <div className="admin-review-list-editor" key={`${selectedJob.id}-skill-${index}`}>
                    <input value={item} onChange={(event) => updateDetailListItem('skills', index, event.target.value)} />
                    <button type="button" aria-label={`Remove skill ${index + 1}`} onClick={() => removeDetailListItem('skills', index)}>
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </section>

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
                <span><FaEye /> Final decision</span>
                <strong>Choose whether this edited job post should be published, flagged, or rejected.</strong>
              </div>
              <div className="admin-review-actions">
                <button type="button" className="admin-review-action admin-review-action--approve" onClick={() => decideJob('Approved')}>
                  <FaCheckCircle /> Approve
                </button>
                <button type="button" className="admin-review-action admin-review-action--flag" onClick={() => decideJob('Flagged')}>
                  <FaFlag /> Flag
                </button>
                <button type="button" className="admin-review-action admin-review-action--decline" onClick={() => decideJob('Declined')}>
                  <FaTimesCircle /> Reject
                </button>
              </div>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}

export default AdminModerationPage;
