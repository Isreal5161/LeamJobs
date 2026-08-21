import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaChartLine,
  FaClock,
  FaEdit,
  FaFileAlt,
  FaFilter,
  FaFlag,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaPlus,
  FaStar,
  FaTimesCircle,
  FaUserShield,
  FaUsers,
} from 'react-icons/fa';
import { applicants } from '../employer/employerData';
import { adminEmployers } from './adminData';
import { useJobStore } from '../../context/JobStoreContext';
import { useSiteContent, type SitePageKey } from '../../context/SiteContentContext';
import type { ModerationStatus, PublicJob } from '../../data/jobData';

type Section = 'dashboard' | 'moderation' | 'jobs' | 'content' | 'filters' | 'recommendations' | 'users' | 'companies';

type UserAccount = {
  id: string;
  name: string;
  type: 'Job seeker' | 'Employer';
  email: string;
  status: ModerationStatus;
  joined: string;
};

const initialUsers: UserAccount[] = [
  {
    id: 'sarah-johnson',
    name: 'Sarah Johnson',
    type: 'Job seeker',
    email: 'sarah@example.com',
    status: 'Approved',
    joined: 'Aug 14, 2026',
  },
  {
    id: 'nova-cloud',
    name: 'Nova Cloud',
    type: 'Employer',
    email: 'hiring@novacloud.com',
    status: 'Pending',
    joined: 'Aug 16, 2026',
  },
  {
    id: 'brightpath-media',
    name: 'BrightPath Media',
    type: 'Employer',
    email: 'team@brightpath.com',
    status: 'Flagged',
    joined: 'Aug 12, 2026',
  },
];

const initialFilters = ['Remote', 'Full-time', 'Design', 'New York', '$100k+', 'Engineering', 'Marketing'];
const initialCategories = ['Design', 'Engineering', 'Marketing', 'Product', 'Sales'];

const sectionLabels: Record<Section, string> = {
  dashboard: 'Overview',
  moderation: 'Moderation',
  jobs: 'Job posts',
  content: 'Page content',
  filters: 'Filters',
  recommendations: 'Recommendations',
  users: 'Users',
  companies: 'Companies',
};

function getSection(pathname: string): Section {
  const section = pathname.split('/').filter(Boolean)[1] as Section | undefined;
  return section && section in sectionLabels ? section : 'dashboard';
}

function AdminDashboardPage() {
  const { pathname } = useLocation();
  const activeSection = getSection(pathname);
  const { jobs, updateJob, updateJobStatus } = useJobStore();
  const { content, updatePage } = useSiteContent();
  const [users, setUsers] = useState(initialUsers);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [categories, setCategories] = useState(initialCategories);
  const [newFilter, setNewFilter] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedModerationJobId, setSelectedModerationJobId] = useState('');
  const [selectedSeekerId, setSelectedSeekerId] = useState(applicants[0]?.id ?? '');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedContentPage, setSelectedContentPage] = useState<SitePageKey>('welcome');
  const [heroContent, setHeroContent] = useState({
    title: 'Find a job that actually fits you.',
    subtitle: 'Smart matching, better opportunities, and tools to help you grow your career.',
    primaryCta: 'Create free account',
    employerCta: 'Post a job',
  });

  const metrics = useMemo(
    () => [
      { icon: <FaBriefcase />, value: jobs.length.toString(), label: 'job posts managed', tone: 'blue' },
      { icon: <FaFlag />, value: jobs.filter((job) => job.status === 'Pending').length.toString(), label: 'posts waiting review', tone: 'yellow' },
      { icon: <FaUsers />, value: users.length.toString(), label: 'accounts monitored', tone: 'green' },
      { icon: <FaStar />, value: jobs.filter((job) => job.featured).length.toString(), label: 'featured jobs', tone: 'purple' },
    ],
    [jobs, users]
  );

  const overviewStats = useMemo(() => {
    const approvedJobs = jobs.filter((job) => job.status === 'Approved').length;
    const pendingJobs = jobs.filter((job) => job.status === 'Pending').length;
    const flaggedJobs = jobs.filter((job) => job.status === 'Flagged').length;
    const approvedUsers = users.filter((user) => user.status === 'Approved').length;
    const pendingUsers = users.filter((user) => user.status === 'Pending').length;
    const flaggedUsers = users.filter((user) => user.status === 'Flagged').length;
    const totalApplicants = jobs.reduce((total, job) => total + job.applicants, 0);

    return {
      approvedJobs,
      pendingJobs,
      flaggedJobs,
      approvedUsers,
      pendingUsers,
      flaggedUsers,
      totalApplicants,
      reviewLoad: pendingJobs + flaggedJobs + pendingUsers + flaggedUsers,
      recommendationCoverage: jobs.length ? Math.round((jobs.filter((job) => job.featured).length / jobs.length) * 100) : 0,
    };
  }, [jobs, users]);

  const overviewHealth = [
    { label: 'Approved jobs', value: overviewStats.approvedJobs, total: jobs.length, tone: 'green' },
    { label: 'Pending jobs', value: overviewStats.pendingJobs, total: jobs.length, tone: 'yellow' },
    { label: 'Flagged jobs', value: overviewStats.flaggedJobs, total: jobs.length, tone: 'red' },
    { label: 'Approved users', value: overviewStats.approvedUsers, total: users.length, tone: 'blue' },
  ];

  const overviewShortcuts = [
    { label: 'Review job queue', value: overviewStats.pendingJobs, detail: 'posts need admin decision', to: '/admin/moderation', icon: <FaFlag /> },
    { label: 'Manage users', value: overviewStats.flaggedUsers + overviewStats.pendingUsers, detail: 'accounts need attention', to: '/admin/users', icon: <FaUsers /> },
    { label: 'Tune recommendations', value: `${overviewStats.recommendationCoverage}%`, detail: 'jobs currently featured', to: '/admin/recommendations', icon: <FaStar /> },
  ];

  const updateJobField = <Field extends keyof PublicJob>(jobId: string, field: Field, value: PublicJob[Field]) => {
    updateJob(jobId, { [field]: value } as Partial<PublicJob>);
  };

  const updateUserStatus = (userId: string, status: ModerationStatus) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status } : user)));
  };

  const addFilter = () => {
    const value = newFilter.trim();

    if (!value || filters.includes(value)) {
      return;
    }

    setFilters((current) => [...current, value]);
    setNewFilter('');
  };

  const addCategory = () => {
    const value = newCategory.trim();

    if (!value || categories.includes(value)) {
      return;
    }

    setCategories((current) => [...current, value]);
    setNewCategory('');
  };

  const approvedJobs = useMemo(() => jobs.filter((job) => job.status === 'Approved'), [jobs]);
  const selectedModerationJob = jobs.find((job) => job.id === selectedModerationJobId) ?? jobs[0];
  const selectedSeeker = applicants.find((applicant) => applicant.id === selectedSeekerId) ?? applicants[0];
  const selectedJob = approvedJobs.find((job) => job.id === selectedJobId) ?? approvedJobs[0] ?? null;

  useEffect(() => {
    if (!approvedJobs.length) {
      setSelectedJobId('');
      return;
    }

    if (!selectedJobId || !approvedJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(approvedJobs[0].id);
    }
  }, [approvedJobs, selectedJobId]);

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">Admin control center</span>
          <h1>{sectionLabels[activeSection]}</h1>
          <p>Moderate jobs, manage accounts, update public content, and keep the hiring marketplace clean.</p>
        </div>
        <button className="admin-icon-button" type="button" aria-label="Admin notifications">
          <FaBell />
        </button>
      </section>

      {activeSection === 'dashboard' ? (
        <section className="admin-stat-grid" aria-label="Admin overview">
          {metrics.map((metric) => (
            <article className="admin-stat-card" key={metric.label}>
              <span className={`admin-stat-card__icon admin-stat-card__icon--${metric.tone}`}>{metric.icon}</span>
              <div>
                <strong>{metric.value}</strong>
                <p>{metric.label}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeSection === 'dashboard' ? (
        <>
          <section className="admin-overview-grid">
            <article className="admin-panel admin-insight-card admin-insight-card--primary">
              <div className="admin-section-heading">
                <div>
                  <span><FaChartLine /> Marketplace health</span>
                  <h2>Operational snapshot</h2>
                </div>
              </div>
              <div className="admin-insight-score">
                <strong>{overviewStats.reviewLoad}</strong>
                <span>items need attention</span>
              </div>
              <p>
                {overviewStats.pendingJobs} job posts and {overviewStats.pendingUsers + overviewStats.flaggedUsers} user accounts are waiting for admin action.
              </p>
              <Link className="admin-button admin-button--primary" to="/admin/moderation">Open review queue</Link>
            </article>

            <article className="admin-panel admin-insight-card">
              <div className="admin-section-heading">
                <div>
                  <span><FaBriefcase /> Hiring activity</span>
                  <h2>Job post performance</h2>
                </div>
              </div>
              <div className="admin-overview-number">
                <strong>{overviewStats.totalApplicants}</strong>
                <span>total applicants across active job posts</span>
              </div>
              <div className="admin-mini-metrics">
                <span>{jobs.length} posts</span>
                <span>{jobs.filter((job) => job.featured).length} featured</span>
                <span>{overviewStats.pendingJobs} pending</span>
              </div>
            </article>
          </section>

          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaLayerGroup /> Status analysis</span>
                <h2>Website activity by status</h2>
              </div>
            </div>
            <div className="admin-health-list">
              {overviewHealth.map((item) => {
                const width = item.total ? Math.round((item.value / item.total) * 100) : 0;

                return (
                  <div className="admin-health-row" key={item.label}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.value} of {item.total}</span>
                    </div>
                    <div className="admin-health-row__track" aria-hidden="true">
                      <span className={`admin-health-row__bar admin-health-row__bar--${item.tone}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-overview-grid admin-overview-grid--shortcuts">
            {overviewShortcuts.map((item) => (
              <Link className="admin-panel admin-shortcut-card" to={item.to} key={item.label}>
                <span className="admin-shortcut-card__icon">{item.icon}</span>
                <div>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                  <p>{item.detail}</p>
                </div>
              </Link>
            ))}
          </section>
        </>
      ) : null}

      {activeSection === 'moderation' ? (
        <section className="admin-moderation-workspace">
          <div className="admin-panel admin-review-list-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaFlag /> Job review queue</span>
                <h2>Review jobs one by one</h2>
              </div>
            </div>
            <div className="admin-review-list">
              {jobs.map((job) => (
                <button
                  className={`admin-review-item ${selectedModerationJob?.id === job.id ? 'admin-review-item--active' : ''}`}
                  type="button"
                  key={job.id}
                  onClick={() => setSelectedModerationJobId(job.id)}
                >
                  <div>
                    <strong>{job.role}</strong>
                    <p>{job.company} / {job.workType}</p>
                  </div>
                  <span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{job.status}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedModerationJob ? (
            <article className="admin-panel admin-review-detail">
              <div className="admin-review-detail__header">
                <div>
                  <span className="admin-review-kicker"><FaBriefcase /> Full job details</span>
                  <h2>{selectedModerationJob.role}</h2>
                  <p>{selectedModerationJob.company}</p>
                </div>
                <span className={`admin-status admin-status--${selectedModerationJob.status.toLowerCase()}`}>
                  {selectedModerationJob.status}
                </span>
              </div>

              <div className="admin-review-facts">
                <span><FaMapMarkerAlt /> {selectedModerationJob.location}</span>
                <span><FaClock /> Posted {selectedModerationJob.postedAt} days ago</span>
                <span><FaBuilding /> {selectedModerationJob.workArrangement}</span>
                <span>{selectedModerationJob.salary}</span>
              </div>

              <div className="admin-review-edit-grid">
                <label>
                  <span>Job title</span>
                  <input
                    value={selectedModerationJob.role}
                    onChange={(event) => updateJobField(selectedModerationJob.id, 'role', event.target.value)}
                  />
                </label>
                <label>
                  <span>Employer company</span>
                  <input
                    value={selectedModerationJob.company}
                    onChange={(event) => updateJobField(selectedModerationJob.id, 'company', event.target.value)}
                  />
                </label>
                <label>
                  <span>Category</span>
                  <input
                    value={selectedModerationJob.level}
                    onChange={(event) => updateJobField(selectedModerationJob.id, 'level', event.target.value)}
                  />
                </label>
                <label>
                  <span>Location</span>
                  <input
                    value={selectedModerationJob.location}
                    onChange={(event) => updateJobField(selectedModerationJob.id, 'location', event.target.value)}
                  />
                </label>
                <label>
                  <span>Work type</span>
                  <input
                    value={selectedModerationJob.workType}
                    onChange={(event) => updateJobField(selectedModerationJob.id, 'workType', event.target.value)}
                  />
                </label>
                <label>
                  <span>Salary</span>
                  <input
                    value={selectedModerationJob.salary}
                    onChange={(event) => updateJobField(selectedModerationJob.id, 'salary', event.target.value)}
                  />
                </label>
              </div>

              <section className="admin-review-section">
                <h3>Job Description</h3>
                <textarea
                  value={selectedModerationJob.details.overview}
                  onChange={(event) =>
                    updateJob(selectedModerationJob.id, {
                      description: event.target.value,
                      details: { ...selectedModerationJob.details, overview: event.target.value },
                    })
                  }
                />
              </section>

              <section className="admin-review-section">
                <h3>Responsibilities</h3>
                <div className="admin-review-requirements">
                  {selectedModerationJob.details.responsibilities.map((item, index) => (
                    <input
                      key={`${selectedModerationJob.id}-responsibility-${index}`}
                      value={item}
                      onChange={(event) =>
                        updateJobField(
                          selectedModerationJob.id,
                          'details',
                          {
                            ...selectedModerationJob.details,
                            responsibilities: selectedModerationJob.details.responsibilities.map((responsibility, itemIndex) =>
                              itemIndex === index ? event.target.value : responsibility
                            ),
                          }
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              <section className="admin-review-section">
                <h3>Requirements</h3>
                <div className="admin-review-requirements">
                  {selectedModerationJob.details.requirements.map((requirement, index) => (
                    <input
                      key={`${selectedModerationJob.id}-requirement-${index}`}
                      value={requirement}
                      onChange={(event) =>
                        updateJobField(
                          selectedModerationJob.id,
                          'details',
                          {
                            ...selectedModerationJob.details,
                            requirements: selectedModerationJob.details.requirements.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item
                            ),
                          }
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              <section className="admin-review-section">
                <h3>About company</h3>
                <textarea
                  value={selectedModerationJob.details.company}
                  onChange={(event) =>
                    updateJobField(selectedModerationJob.id, 'details', {
                      ...selectedModerationJob.details,
                      company: event.target.value,
                    })
                  }
                />
              </section>

              <div className="admin-review-performance">
                <div>
                  <strong>{selectedModerationJob.applicants}</strong>
                  <span>Applicants</span>
                </div>
                <div>
                  <strong>{selectedModerationJob.views}</strong>
                  <span>Views</span>
                </div>
                <div>
                  <strong>{selectedModerationJob.conversion}</strong>
                  <span>Conversion</span>
                </div>
                <div>
                  <strong>{selectedModerationJob.expires}</strong>
                  <span>Expires</span>
                </div>
              </div>

              <div className="admin-review-actions admin-review-actions--footer">
                <button type="button" className="admin-review-action admin-review-action--approve" onClick={() => updateJobStatus(selectedModerationJob.id, 'Approved')}><FaCheckCircle /> Approve</button>
                <button type="button" className="admin-review-action admin-review-action--flag" onClick={() => updateJobStatus(selectedModerationJob.id, 'Flagged')}><FaFlag /> Flag</button>
                <button type="button" className="admin-review-action admin-review-action--decline" onClick={() => updateJobStatus(selectedModerationJob.id, 'Declined')}><FaTimesCircle /> Decline</button>
              </div>
            </article>
          ) : null}

          <aside className="admin-panel admin-review-accounts">
            <div className="admin-section-heading">
              <div>
                <span><FaUserShield /> Employer accounts</span>
                <h2>Company and account checks</h2>
              </div>
            </div>
            <div className="admin-stack">
              {users.filter((user) => user.type === 'Employer').map((user) => (
                <article className="admin-account-card" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                    <small>Joined {user.joined}</small>
                  </div>
                  <span className={`admin-status admin-status--${user.status.toLowerCase()}`}>{user.status}</span>
                  <div className="admin-mini-actions">
                    <button type="button" onClick={() => updateUserStatus(user.id, 'Approved')}>Approve</button>
                    <button type="button" onClick={() => updateUserStatus(user.id, 'Flagged')}>Flag</button>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>
      ) : null}

      {activeSection === 'jobs' ? (
        <section className="admin-panel admin-job-management-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaBriefcase /> Public job control</span>
              <h2>Approved jobs visible to seekers and the public site</h2>
            </div>
            <button className="admin-button admin-button--primary" type="button"><FaPlus /> Post job</button>
          </div>

          {approvedJobs.length === 0 ? (
            <p className="admin-empty-state">No approved jobs are currently available for the public site.</p>
          ) : (
            <div className="admin-jobs-layout">
              <div className="admin-job-list">
                {approvedJobs.map((job) => (
                  <article
                    key={job.id}
                    className={`admin-job-summary-card ${selectedJob?.id === job.id ? 'admin-job-summary-card--selected' : ''}`}
                  >
                    <div className="admin-job-summary-card__header">
                      <div className="admin-job-company-mark" data-color={job.logoClass ?? 'brand-logo--default'}>
                        {job.logoText}
                      </div>
                      <div className="admin-job-summary-card__text">
                        <strong>{job.role}</strong>
                        <span>{job.company}</span>
                      </div>
                    </div>

                    <div className="admin-job-summary-card__meta">
                      <span>{job.workType}</span>
                      <span>{job.level}</span>
                      <span>{job.location}</span>
                    </div>

                    <div className="admin-job-summary-card__actions">
                      <button type="button" className="admin-button admin-button--secondary" onClick={() => {
                        setSelectedJobId(job.id);
                        setEditingJobId(null);
                      }}>
                        Details
                      </button>
                      <button type="button" className="admin-icon-action" aria-label={`Edit ${job.role}`} onClick={() => {
                        setSelectedJobId(job.id);
                        setEditingJobId(job.id);
                      }}>
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className={`admin-feature-toggle ${job.featured ? 'admin-feature-toggle--active' : ''}`}
                        onClick={() => updateJobField(job.id, 'featured', !job.featured)}
                      >
                        <FaStar /> {job.featured ? 'Featured' : 'Feature'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {selectedJob ? (
                <article className="admin-panel admin-job-detail-panel">
                  <div className="admin-job-detail-panel__header">
                    <div>
                      <span className="admin-review-kicker"><FaBriefcase /> Job details</span>
                      <h3>{selectedJob.role}</h3>
                    </div>
                    <div className="admin-job-detail-panel__actions">
                      {!editingJobId || editingJobId !== selectedJob.id ? (
                        <button type="button" className="admin-review-action admin-review-action--edit" onClick={() => setEditingJobId(selectedJob.id)}>
                          <FaEdit /> Edit
                        </button>
                      ) : null}
                      {selectedJob.featured ? <span className="admin-status admin-status--approved">Featured</span> : null}
                    </div>
                  </div>

                  {editingJobId === selectedJob.id ? (
                    <div className="admin-job-edit-form">
                      <div className="admin-review-edit-grid">
                        <label>
                          <span>Job title</span>
                          <input
                            value={selectedJob.role}
                            onChange={(event) => updateJobField(selectedJob.id, 'role', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Employer company</span>
                          <input
                            value={selectedJob.company}
                            onChange={(event) => updateJobField(selectedJob.id, 'company', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Category</span>
                          <input
                            value={selectedJob.level}
                            onChange={(event) => updateJobField(selectedJob.id, 'level', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Location</span>
                          <input
                            value={selectedJob.location}
                            onChange={(event) => updateJobField(selectedJob.id, 'location', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Work type</span>
                          <input
                            value={selectedJob.workType}
                            onChange={(event) => updateJobField(selectedJob.id, 'workType', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Salary</span>
                          <input
                            value={selectedJob.salary}
                            onChange={(event) => updateJobField(selectedJob.id, 'salary', event.target.value)}
                          />
                        </label>
                      </div>

                      <section className="admin-review-section">
                        <h3>Overview</h3>
                        <textarea
                          value={selectedJob.details.overview}
                          onChange={(event) =>
                            updateJobField(selectedJob.id, 'details', {
                              ...selectedJob.details,
                              overview: event.target.value,
                            })
                          }
                        />
                      </section>

                      <section className="admin-review-section">
                        <h3>Responsibilities</h3>
                        <div className="admin-review-requirements">
                          {selectedJob.details.responsibilities.map((item, index) => (
                            <input
                              key={`${selectedJob.id}-responsibility-${index}`}
                              value={item}
                              onChange={(event) =>
                                updateJobField(selectedJob.id, 'details', {
                                  ...selectedJob.details,
                                  responsibilities: selectedJob.details.responsibilities.map((responsibility, itemIndex) =>
                                    itemIndex === index ? event.target.value : responsibility
                                  ),
                                })
                              }
                            />
                          ))}
                        </div>
                      </section>

                      <section className="admin-review-section">
                        <h3>Requirements</h3>
                        <div className="admin-review-requirements">
                          {selectedJob.details.requirements.map((item, index) => (
                            <input
                              key={`${selectedJob.id}-requirement-${index}`}
                              value={item}
                              onChange={(event) =>
                                updateJobField(selectedJob.id, 'details', {
                                  ...selectedJob.details,
                                  requirements: selectedJob.details.requirements.map((requirement, itemIndex) =>
                                    itemIndex === index ? event.target.value : requirement
                                  ),
                                })
                              }
                            />
                          ))}
                        </div>
                      </section>

                      <div className="admin-review-actions admin-review-actions--footer">
                        <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => setEditingJobId(null)}>Cancel</button>
                        <button type="button" className="admin-review-action admin-review-action--approve" onClick={() => setEditingJobId(null)}>
                          <FaCheckCircle /> Update job post
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="admin-job-detail-panel__company">
                        <div className="admin-job-company-mark" data-color={selectedJob.logoClass ?? 'brand-logo--default'}>
                          {selectedJob.logoText}
                        </div>
                        <div>
                          <strong>{selectedJob.company}</strong>
                          <p>{selectedJob.location}</p>
                        </div>
                      </div>

                      <div className="admin-review-facts">
                        <span><FaMapMarkerAlt /> {selectedJob.location}</span>
                        <span><FaClock /> Posted {selectedJob.postedAt} days ago</span>
                        <span><FaBuilding /> {selectedJob.workArrangement}</span>
                        <span>{selectedJob.salary}</span>
                      </div>

                      <div className="admin-job-detail-panel__content">
                        <section>
                          <h4>Overview</h4>
                          <p>{selectedJob.details.overview}</p>
                        </section>

                        <section>
                          <h4>Responsibilities</h4>
                          <ul>
                            {selectedJob.details.responsibilities.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </section>

                        <section>
                          <h4>Requirements</h4>
                          <ul>
                            {selectedJob.details.requirements.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    </>
                  )}
                </article>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {activeSection === 'content' ? (
        <section className="admin-grid admin-content-workspace">
          <div className="admin-panel admin-content-pages-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaEdit /> Public content</span>
                <h2>Select a page to update</h2>
              </div>
            </div>
            <div className="admin-content-page-list">
              {Object.entries(content).map(([pageKey, pageContent]) => (
                <button
                  key={pageKey}
                  type="button"
                  className={`admin-content-item ${selectedContentPage === pageKey ? 'admin-content-item--active' : ''}`}
                  onClick={() => setSelectedContentPage(pageKey as SitePageKey)}
                >
                  <strong>{pageKey === 'welcome' ? 'Welcome' : pageKey === 'about' ? 'About' : pageKey === 'features' ? 'Features' : pageKey === 'how-it-works' ? 'How it works' : 'Companies'}</strong>
                  <span>{'title' in pageContent ? pageContent.title : 'heroTitle' in pageContent ? pageContent.heroTitle : 'Page copy'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel admin-content-editor-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaEdit /> Editor</span>
                <h2>{selectedContentPage === 'welcome' ? 'Welcome page' : selectedContentPage === 'about' ? 'About page' : selectedContentPage === 'features' ? 'Features page' : selectedContentPage === 'how-it-works' ? 'How it works page' : 'Companies page'}</h2>
              </div>
            </div>

            <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
              {selectedContentPage === 'welcome' ? (
                <>
                  <label>
                    <span>Hero headline</span>
                    <input value={content.welcome.heroTitle} onChange={(event) => updatePage('welcome', (current) => ({ ...current, heroTitle: event.target.value }))} />
                  </label>
                  <label>
                    <span>Hero subtitle</span>
                    <textarea value={content.welcome.heroSubtitle} onChange={(event) => updatePage('welcome', (current) => ({ ...current, heroSubtitle: event.target.value }))} />
                  </label>
                  <div className="admin-form__split">
                    <label>
                      <span>Primary CTA</span>
                      <input value={content.welcome.primaryCta} onChange={(event) => updatePage('welcome', (current) => ({ ...current, primaryCta: event.target.value }))} />
                    </label>
                    <label>
                      <span>Secondary CTA</span>
                      <input value={content.welcome.secondaryCta} onChange={(event) => updatePage('welcome', (current) => ({ ...current, secondaryCta: event.target.value }))} />
                    </label>
                  </div>
                  <label>
                    <span>Employer CTA</span>
                    <input value={content.welcome.employerCta} onChange={(event) => updatePage('welcome', (current) => ({ ...current, employerCta: event.target.value }))} />
                  </label>
                  <div className="admin-stack">
                    {content.welcome.stats.map((stat, index) => (
                      <div key={`${stat.label}-${index}`} className="admin-form__split">
                        <label>
                          <span>Stat value</span>
                          <input value={stat.value} onChange={(event) => updatePage('welcome', (current) => ({ ...current, stats: current.stats.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item) }))} />
                        </label>
                        <label>
                          <span>Stat label</span>
                          <input value={stat.label} onChange={(event) => updatePage('welcome', (current) => ({ ...current, stats: current.stats.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))} />
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {selectedContentPage === 'about' ? (
                <>
                  <label>
                    <span>Eyebrow</span>
                    <input value={content.about.eyebrow} onChange={(event) => updatePage('about', (current) => ({ ...current, eyebrow: event.target.value }))} />
                  </label>
                  <label>
                    <span>Title</span>
                    <input value={content.about.title} onChange={(event) => updatePage('about', (current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label>
                    <span>Description</span>
                    <textarea value={content.about.description} onChange={(event) => updatePage('about', (current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <div className="admin-form__split">
                    <label>
                      <span>Primary CTA</span>
                      <input value={content.about.primaryCta} onChange={(event) => updatePage('about', (current) => ({ ...current, primaryCta: event.target.value }))} />
                    </label>
                    <label>
                      <span>Secondary CTA</span>
                      <input value={content.about.secondaryCta} onChange={(event) => updatePage('about', (current) => ({ ...current, secondaryCta: event.target.value }))} />
                    </label>
                  </div>
                  <div className="admin-stack">
                    {content.about.values.map((value, index) => (
                      <div key={`${value.title}-${index}`} className="admin-stack">
                        <label>
                          <span>Value title</span>
                          <input value={value.title} onChange={(event) => updatePage('about', (current) => ({ ...current, values: current.values.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} />
                        </label>
                        <label>
                          <span>Value text</span>
                          <textarea value={value.text} onChange={(event) => updatePage('about', (current) => ({ ...current, values: current.values.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) }))} />
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {selectedContentPage === 'features' ? (
                <>
                  <label>
                    <span>Hero title</span>
                    <input value={content.features.heroTitle} onChange={(event) => updatePage('features', (current) => ({ ...current, heroTitle: event.target.value }))} />
                  </label>
                  <label>
                    <span>Hero subtitle</span>
                    <textarea value={content.features.heroSubtitle} onChange={(event) => updatePage('features', (current) => ({ ...current, heroSubtitle: event.target.value }))} />
                  </label>
                  <div className="admin-form__split">
                    <label>
                      <span>Primary CTA</span>
                      <input value={content.features.primaryCta} onChange={(event) => updatePage('features', (current) => ({ ...current, primaryCta: event.target.value }))} />
                    </label>
                    <label>
                      <span>Secondary CTA</span>
                      <input value={content.features.secondaryCta} onChange={(event) => updatePage('features', (current) => ({ ...current, secondaryCta: event.target.value }))} />
                    </label>
                  </div>
                  <div className="admin-stack">
                    {content.features.items.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="admin-stack">
                        <label>
                          <span>Feature title</span>
                          <input value={item.title} onChange={(event) => updatePage('features', (current) => ({ ...current, items: current.items.map((feature, featureIndex) => featureIndex === index ? { ...feature, title: event.target.value } : feature) }))} />
                        </label>
                        <label>
                          <span>Feature text</span>
                          <textarea value={item.text} onChange={(event) => updatePage('features', (current) => ({ ...current, items: current.items.map((feature, featureIndex) => featureIndex === index ? { ...feature, text: event.target.value } : feature) }))} />
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {selectedContentPage === 'how-it-works' ? (
                <>
                  <label>
                    <span>Hero title</span>
                    <input value={content['how-it-works'].heroTitle} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, heroTitle: event.target.value }))} />
                  </label>
                  <label>
                    <span>Hero subtitle</span>
                    <textarea value={content['how-it-works'].heroSubtitle} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, heroSubtitle: event.target.value }))} />
                  </label>
                  <div className="admin-form__split">
                    <label>
                      <span>Primary CTA</span>
                      <input value={content['how-it-works'].primaryCta} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, primaryCta: event.target.value }))} />
                    </label>
                    <label>
                      <span>Secondary CTA</span>
                      <input value={content['how-it-works'].secondaryCta} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, secondaryCta: event.target.value }))} />
                    </label>
                  </div>
                  <div className="admin-stack">
                    {content['how-it-works'].steps.map((step, index) => (
                      <div key={`${step.title}-${index}`} className="admin-stack">
                        <label>
                          <span>Step title</span>
                          <input value={step.title} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, steps: current.steps.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} />
                        </label>
                        <label>
                          <span>Step text</span>
                          <textarea value={step.text} onChange={(event) => updatePage('how-it-works', (current) => ({ ...current, steps: current.steps.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) }))} />
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {selectedContentPage === 'companies' ? (
                <>
                  <label>
                    <span>Hero title</span>
                    <input value={content.companies.heroTitle} onChange={(event) => updatePage('companies', (current) => ({ ...current, heroTitle: event.target.value }))} />
                  </label>
                  <label>
                    <span>Hero subtitle</span>
                    <textarea value={content.companies.heroSubtitle} onChange={(event) => updatePage('companies', (current) => ({ ...current, heroSubtitle: event.target.value }))} />
                  </label>
                  <div className="admin-form__split">
                    <label>
                      <span>Primary CTA</span>
                      <input value={content.companies.primaryCta} onChange={(event) => updatePage('companies', (current) => ({ ...current, primaryCta: event.target.value }))} />
                    </label>
                    <label>
                      <span>Secondary CTA</span>
                      <input value={content.companies.secondaryCta} onChange={(event) => updatePage('companies', (current) => ({ ...current, secondaryCta: event.target.value }))} />
                    </label>
                  </div>
                  <div className="admin-stack">
                    {content.companies.companies.map((company, index) => (
                      <div key={`${company.name}-${index}`} className="admin-form__split">
                        <label>
                          <span>Company name</span>
                          <input value={company.name} onChange={(event) => updatePage('companies', (current) => ({ ...current, companies: current.companies.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) }))} />
                        </label>
                        <label>
                          <span>Company category</span>
                          <input value={company.category} onChange={(event) => updatePage('companies', (current) => ({ ...current, companies: current.companies.map((item, itemIndex) => itemIndex === index ? { ...item, category: event.target.value } : item) }))} />
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </form>
          </div>
        </section>
      ) : null}

      {activeSection === 'filters' ? (
        <section className="admin-grid admin-filters-workspace">
          <div className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaFilter /> Job filters</span>
                <h2>Add and remove welcome page filters</h2>
              </div>
            </div>
            <div className="admin-token-list">
              {filters.map((filter) => (
                <button type="button" key={filter} onClick={() => setFilters((current) => current.filter((item) => item !== filter))}>
                  {filter}
                  <FaTimesCircle />
                </button>
              ))}
            </div>
            <div className="admin-add-control">
              <input value={newFilter} onChange={(event) => setNewFilter(event.target.value)} placeholder="Add job filter" />
              <button type="button" onClick={addFilter}><FaPlus /> Add</button>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaLayerGroup /> Job categories</span>
                <h2>Manage categories used across jobs</h2>
              </div>
            </div>
            <div className="admin-token-list admin-token-list--category">
              {categories.map((category) => (
                <button type="button" key={category} onClick={() => setCategories((current) => current.filter((item) => item !== category))}>
                  {category}
                  <FaTimesCircle />
                </button>
              ))}
            </div>
            <div className="admin-add-control">
              <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Add job category" />
              <button type="button" onClick={addCategory}><FaPlus /> Add</button>
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === 'recommendations' ? (
        <section className="admin-grid">
          <div className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaBuilding /> Recommended companies</span>
                <h2>Promote employers on public pages</h2>
              </div>
            </div>
            <div className="admin-stack">
              {jobs.filter((job) => job.featured).map((job) => (
                <article className="admin-recommend-card" key={job.id}>
                  <FaBuilding />
                  <div>
                    <strong>{job.company}</strong>
                    <p>{job.role} / {job.applicants} applicants</p>
                  </div>
                  <span>Featured</span>
                </article>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span><FaStar /> Recommended employees</span>
                <h2>Highlight strong seeker profiles</h2>
              </div>
            </div>
            <div className="admin-stack">
              {applicants.slice(0, 4).map((applicant) => (
                <article className="admin-recommend-card" key={applicant.id}>
                  <FaUsers />
                  <div>
                    <strong>{applicant.name}</strong>
                    <p>{applicant.role} / {applicant.score}% match</p>
                  </div>
                  <button type="button">Recommend</button>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === 'users' ? (
        <section className="admin-seekers-workspace">
          <div className="admin-panel admin-seekers-list-panel">
          <div className="admin-section-heading">
            <div>
              <span><FaUsers /> Job seekers</span>
              <h2>Seeker directory</h2>
            </div>
          </div>
          <div className="admin-seeker-list">
            {applicants.map((applicant) => (
              <button
                type="button"
                className={`admin-seeker-item ${selectedSeeker?.id === applicant.id ? 'admin-seeker-item--active' : ''}`}
                key={applicant.id}
                onClick={() => setSelectedSeekerId(applicant.id)}
              >
                <div className="admin-seeker-item__avatar">
                  {applicant.avatarUrl ? <img src={applicant.avatarUrl} alt="" /> : applicant.name.split(' ').map((part) => part[0]).join('')}
                </div>
                <div>
                  <strong>{applicant.name}</strong>
                  <p>{applicant.role}</p>
                  <small>{applicant.location} / {applicant.experience}</small>
                </div>
                <span className="admin-status admin-status--approved">Profile</span>
              </button>
            ))}
          </div>
          </div>

          {selectedSeeker ? (
            <article className="admin-panel admin-seeker-profile-panel">
              <div className="admin-seeker-profile-header">
                <div className="admin-seeker-profile-identity">
                  <div className="admin-seeker-profile-avatar">
                    {selectedSeeker.avatarUrl ? <img src={selectedSeeker.avatarUrl} alt={selectedSeeker.name} /> : selectedSeeker.name.split(' ').map((part) => part[0]).join('')}
                  </div>
                  <div>
                    <span className="admin-review-kicker"><FaUsers /> Seeker profile</span>
                    <h2>{selectedSeeker.name}</h2>
                    <p>{selectedSeeker.role}</p>
                  </div>
                </div>
                <span className="admin-status admin-status--approved">{selectedSeeker.stage}</span>
              </div>

              <div className="admin-seeker-facts">
                <div><span>Location</span><strong>{selectedSeeker.location}</strong></div>
                <div><span>Experience</span><strong>{selectedSeeker.experience}</strong></div>
                <div><span>Availability</span><strong>{selectedSeeker.availability}</strong></div>
                <div><span>Match score</span><strong>{selectedSeeker.score}%</strong></div>
              </div>

              <section className="admin-seeker-section">
                <h3>Contact and application</h3>
                <div className="admin-seeker-contact-grid">
                  <div><span>Email</span><strong>{selectedSeeker.id}@example.com</strong></div>
                  <div><span>Application source</span><strong>{selectedSeeker.source}</strong></div>
                  <div><span>Applied</span><strong>{selectedSeeker.applied}</strong></div>
                  <div><span>Current note</span><strong>{selectedSeeker.note}</strong></div>
                </div>
              </section>

              <section className="admin-seeker-section">
                <h3>Skills</h3>
                <div className="admin-token-list admin-token-list--seeker">
                  {selectedSeeker.skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              </section>

              <section className="admin-seeker-cv">
                <div className="admin-seeker-cv__icon"><FaFileAlt /></div>
                <div>
                  <h3>CV details</h3>
                  <strong>{selectedSeeker.cvFile}</strong>
                  <p>{selectedSeeker.cvUpdated}</p>
                  <span>{selectedSeeker.cvSummary}</span>
                </div>
                <button type="button" className="admin-button admin-button--secondary">View CV</button>
              </section>
            </article>
          ) : null}
        </section>
      ) : null}

      {activeSection === 'companies' ? (
        <section className="admin-companies-workspace">
          <div className="admin-company-metrics">
            <article className="admin-panel admin-company-metric"><span>Total employers</span><strong>{adminEmployers.length}</strong><small>Registered company accounts</small></article>
            <article className="admin-panel admin-company-metric"><span>Jobs posted</span><strong>{jobs.length}</strong><small>All submitted work posts</small></article>
            <article className="admin-panel admin-company-metric"><span>Approved jobs</span><strong>{jobs.filter((job) => job.status === 'Approved').length}</strong><small>Visible on the public site</small></article>
            <article className="admin-panel admin-company-metric"><span>Pending review</span><strong>{jobs.filter((job) => job.status === 'Pending').length}</strong><small>Waiting for admin approval</small></article>
          </div>

          <section className="admin-panel admin-company-directory">
            <div className="admin-section-heading">
              <div><span><FaBuilding /> Employer accounts</span><h2>Companies and job activity</h2></div>
            </div>
            <div className="admin-company-list">
              {adminEmployers.map((employer) => {
                const employerJobs = jobs.filter((job) => job.company.toLowerCase().includes(employer.name.split(' ')[0].toLowerCase()));
                const approved = employerJobs.filter((job) => job.status === 'Approved').length;
                const pending = employerJobs.filter((job) => job.status === 'Pending').length;

                return (
                  <button
                    type="button"
                    className={`admin-company-card ${selectedCompanyId === employer.id ? 'admin-company-card--selected' : ''}`}
                    key={employer.id}
                    onClick={() => setSelectedCompanyId(employer.id)}
                  >
                    <div className="admin-company-card__identity">
                      <div className="admin-job-company-mark">{employer.name.slice(0, 1)}</div>
                      <div><h3>{employer.name}</h3><p>{employer.email}</p><small>{employer.subscription} plan / ${employer.monthlyIncome} monthly income</small></div>
                    </div>
                    <span className={`admin-status admin-status--${employer.status.toLowerCase()}`}>{employer.status}</span>
                    <div className="admin-company-card__stats">
                      <div><strong>{employer.postedJobs}</strong><span>Posted</span></div>
                      <div><strong>{approved}</strong><span>Approved</span></div>
                      <div><strong>{pending}</strong><span>Pending</span></div>
                      <div><strong>{Math.max(employer.postedJobs - approved - pending, 0)}</strong><span>Other review</span></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedCompanyId ? (() => {
            const selectedCompany = adminEmployers.find((employer) => employer.id === selectedCompanyId);
            const companyJobs = selectedCompany
              ? jobs.filter((job) => job.company.toLowerCase().includes(selectedCompany.name.split(' ')[0].toLowerCase()))
              : [];
            const selectedCompanyJob = companyJobs.find((job) => job.id === selectedJobId);

            return selectedCompany ? (
              <section className="admin-panel admin-company-detail-panel">
                <div className="admin-company-detail-header">
                  <div>
                    <span className="admin-review-kicker"><FaBuilding /> Company details</span>
                    <h2>{selectedCompany.name}</h2>
                    <p>{selectedCompany.email}</p>
                  </div>
                  <span className={`admin-status admin-status--${selectedCompany.status.toLowerCase()}`}>{selectedCompany.status}</span>
                </div>
                <div className="admin-company-detail-facts">
                  <div><span>Subscription</span><strong>{selectedCompany.subscription}</strong></div>
                  <div><span>Monthly income</span><strong>${selectedCompany.monthlyIncome}</strong></div>
                  <div><span>Jobs listed</span><strong>{selectedCompany.postedJobs}</strong></div>
                  <div><span>Live job records</span><strong>{companyJobs.length}</strong></div>
                </div>
                <div className="admin-company-detail-jobs">
                  <div className="admin-section-heading"><div><span><FaBriefcase /> Posted jobs</span><h3>Review and update this company&apos;s jobs</h3></div></div>
                  {companyJobs.length ? companyJobs.map((job) => (
                    <article className="admin-company-job-card" key={job.id}>
                      <div><strong>{job.role}</strong><p>{job.location} / {job.workType} / {job.salary}</p></div>
                      <span className={`admin-status admin-status--${job.status.toLowerCase()}`}>{job.status}</span>
                      <div className="admin-company-job-actions">
                        <button type="button" className="admin-button admin-button--secondary" onClick={() => { setSelectedJobId(job.id); setEditingJobId(null); }}>Details</button>
                        <button type="button" className="admin-review-action admin-review-action--edit" onClick={() => { setSelectedJobId(job.id); setEditingJobId(job.id); }}><FaEdit /> Edit</button>
                      </div>
                    </article>
                  )) : <p className="admin-empty-state">No live job records are linked to this company yet.</p>}
                  {selectedCompanyJob && editingJobId === selectedCompanyJob.id ? (
                    <div className="admin-company-job-editor">
                      <div className="admin-review-edit-grid">
                        <label><span>Job title</span><input value={selectedCompanyJob.role} onChange={(event) => updateJobField(selectedCompanyJob.id, 'role', event.target.value)} /></label>
                        <label><span>Location</span><input value={selectedCompanyJob.location} onChange={(event) => updateJobField(selectedCompanyJob.id, 'location', event.target.value)} /></label>
                        <label><span>Work type</span><input value={selectedCompanyJob.workType} onChange={(event) => updateJobField(selectedCompanyJob.id, 'workType', event.target.value)} /></label>
                        <label><span>Salary</span><input value={selectedCompanyJob.salary} onChange={(event) => updateJobField(selectedCompanyJob.id, 'salary', event.target.value)} /></label>
                      </div>
                      <label className="admin-company-job-editor__full"><span>Job overview</span><textarea value={selectedCompanyJob.details.overview} onChange={(event) => updateJobField(selectedCompanyJob.id, 'details', { ...selectedCompanyJob.details, overview: event.target.value })} /></label>
                      <section className="admin-company-job-editor__section">
                        <h4>Responsibilities</h4>
                        <div className="admin-review-requirements">
                          {selectedCompanyJob.details.responsibilities.map((item, index) => (
                            <input
                              key={`${selectedCompanyJob.id}-company-responsibility-${index}`}
                              value={item}
                              onChange={(event) => updateJobField(selectedCompanyJob.id, 'details', {
                                ...selectedCompanyJob.details,
                                responsibilities: selectedCompanyJob.details.responsibilities.map((responsibility, itemIndex) => itemIndex === index ? event.target.value : responsibility),
                              })}
                            />
                          ))}
                        </div>
                      </section>
                      <section className="admin-company-job-editor__section">
                        <h4>Requirements</h4>
                        <div className="admin-review-requirements">
                          {selectedCompanyJob.details.requirements.map((item, index) => (
                            <input
                              key={`${selectedCompanyJob.id}-company-requirement-${index}`}
                              value={item}
                              onChange={(event) => updateJobField(selectedCompanyJob.id, 'details', {
                                ...selectedCompanyJob.details,
                                requirements: selectedCompanyJob.details.requirements.map((requirement, itemIndex) => itemIndex === index ? event.target.value : requirement),
                              })}
                            />
                          ))}
                        </div>
                      </section>
                      <div className="admin-review-actions admin-review-actions--footer">
                        <button type="button" className="admin-review-action admin-review-action--secondary" onClick={() => setEditingJobId(null)}>Cancel</button>
                        <button type="button" className="admin-review-action admin-review-action--approve" onClick={() => setEditingJobId(null)}><FaCheckCircle /> Update job post</button>
                      </div>
                    </div>
                  ) : null}
                  {selectedCompanyJob && editingJobId !== selectedCompanyJob.id ? (
                    <div className="admin-company-job-details">
                      <div className="admin-company-job-details__header">
                        <div><span className="admin-review-kicker"><FaBriefcase /> Selected job</span><h3>{selectedCompanyJob.role}</h3></div>
                        <button type="button" className="admin-review-action admin-review-action--edit" onClick={() => setEditingJobId(selectedCompanyJob.id)}><FaEdit /> Edit job</button>
                      </div>
                      <p>{selectedCompanyJob.details.overview}</p>
                      <div className="admin-company-job-details__columns">
                        <div><strong>Responsibilities</strong><ul>{selectedCompanyJob.details.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></div>
                        <div><strong>Requirements</strong><ul>{selectedCompanyJob.details.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null;
          })() : null}

          <section className="admin-panel admin-company-status-panel">
            <div className="admin-section-heading">
              <div><span><FaBriefcase /> Job approval status</span><h2>All work posts under admin review</h2></div>
            </div>
            <div className="admin-company-job-status-list">
              {(['Approved', 'Pending', 'Flagged', 'Declined'] as ModerationStatus[]).map((status) => (
                <div className="admin-company-job-status" key={status}>
                  <span className={`admin-status admin-status--${status.toLowerCase()}`}>{status}</span>
                  <strong>{jobs.filter((job) => job.status === status).length}</strong><span>job posts</span>
                </div>
              ))}
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}

export default AdminDashboardPage;
