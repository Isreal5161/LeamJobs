import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaBell,
  FaBriefcase,
  FaCheck,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaDownload,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFileAlt,
  FaGoogle,
  FaMicrosoft,
  FaSearch,
  FaTimesCircle,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';
import { useJobStore } from '../../context/JobStoreContext';

const applicationStats = [
  { label: 'Total applications', value: '18', icon: <FaFileAlt />, tone: 'blue' },
  { label: 'Approved', value: '7', icon: <FaCheckCircle />, tone: 'success' },
  { label: 'Pending review', value: '8', icon: <FaClock />, tone: 'warning' },
  { label: 'Rejected', value: '3', icon: <FaTimesCircle />, tone: 'danger' },
];

const applications = [
  {
    id: 'google',
    company: 'Google',
    role: 'Senior Product Designer',
    type: 'Remote',
    applied: 'Applied Aug 12, 2026',
    status: 'Approved',
    nextStep: 'Interview scheduled',
    amount: '$4,800',
    icon: <FaGoogle />,
    tone: 'google',
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    role: 'UX Designer',
    type: 'Hybrid',
    applied: 'Applied Aug 10, 2026',
    status: 'Pending',
    nextStep: 'Recruiter review',
    amount: '$3,200',
    icon: <FaMicrosoft />,
    tone: 'microsoft',
  },
  {
    id: 'stripe',
    company: 'Stripe',
    role: 'Product Designer',
    type: 'Contract',
    applied: 'Applied Aug 6, 2026',
    status: 'Rejected',
    nextStep: 'Feedback available',
    amount: '$0',
    icon: 'S',
    tone: 'stripe',
  },
  {
    id: 'figma',
    company: 'Figma',
    role: 'Design Systems Designer',
    type: 'Remote',
    applied: 'Applied Aug 2, 2026',
    status: 'Completed',
    nextStep: 'Payment released',
    amount: '$6,500',
    icon: 'F',
    tone: 'figma',
  },
];

const completedJobs = [
  { label: 'Jobs completed', value: '5' },
  { label: 'Total income', value: '$18,450' },
  { label: 'This month', value: '$6,500' },
];

const seekerCvSkills = ['UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Figma', 'User Testing'];
type CvSource = 'profile' | 'upload' | null;

type Application = {
  id: string;
  company: string;
  role: string;
  type: string;
  applied: string;
  status: string;
  nextStep: string;
  amount: string;
  icon: ReactNode;
  tone: string;
};

function ApplicationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { visibleJobs } = useJobStore();
  const requestedJob = visibleJobs.find((job) => job.id === searchParams.get('jobId'));
  const [selectedJob, setSelectedJob] = useState(requestedJob);
  const [proposal, setProposal] = useState('');
  const [applicationSent, setApplicationSent] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [supportingFileName, setSupportingFileName] = useState('');
  const [cvSource, setCvSource] = useState<CvSource>(null);
  const [cvFileName, setCvFileName] = useState('');
  const [submittedApplications, setSubmittedApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (searchParams.get('apply') === 'true' && requestedJob) {
      setSelectedJob(requestedJob);
      setApplicationSent(false);
      setSavedDraft(false);
      setProposal('');
      setSupportingFileName('');
      setCvSource(null);
      setCvFileName('');
    }
  }, [requestedJob, searchParams]);

  const closeApplication = () => {
    setSelectedJob(undefined);
    navigate('/seeker/applications', { replace: true });
  };

  const submitApplication = () => {
    if (!selectedJob || (cvRequirement === 'required' && !cvSource)) return;

    setSubmittedApplications((current) => [
      {
        id: selectedJob.id,
        company: selectedJob.company,
        role: selectedJob.role,
        type: selectedJob.workArrangement,
        applied: 'Applied today',
        status: 'Pending',
        nextStep: 'Recruiter review',
        amount: selectedJob.paymentAmount ? `$${selectedJob.paymentAmount.toLocaleString()}` : '$0',
        icon: selectedJob.logoText,
        tone: selectedJob.logoClass?.replace('brand-logo--', '') || 'default',
      },
      ...current.filter((application) => application.id !== selectedJob.id),
    ]);
    setApplicationSent(true);
  };

  const allApplications = [...submittedApplications, ...applications];
  const cvRequirement = selectedJob?.cvRequirement ?? 'recommended';
  const cvSelected = cvSource !== null;
  const matchingSkills = cvSelected ? selectedJob?.details.skills.filter((skill) => seekerCvSkills.includes(skill)) ?? [] : [];
  const missingSkills = selectedJob?.details.skills.filter((skill) => !matchingSkills.includes(skill)) ?? [];
  const cvMatchScore = selectedJob ? Math.min(96, Math.max(38, 48 + matchingSkills.length * 10)) : 0;
  const cvIsWeakMatch = cvRequirement !== 'not-needed' && cvMatchScore < 70;

  return (
    <div className="seeker-applications-page">
      <section className="seeker-applications-hero">
        <div className="seeker-hero__top">
          <div className="seeker-profile">
            <div className="seeker-profile__avatar" aria-hidden="true">SJ</div>
            <div>
              <h1>Applications</h1>
              <p>Track progress, outcomes, and job income</p>
            </div>
          </div>
          <button className="seeker-icon-button seeker-icon-button--alert" type="button" aria-label="Notifications">
            <FaBell />
          </button>
        </div>

        <label className="seeker-search" aria-label="Search applications">
          <FaSearch />
          <input type="search" placeholder="Search company, role, or status" />
        </label>
      </section>

      <main className="seeker-applications-content">
        <section className="seeker-application-stats" aria-label="Application overview">
          {applicationStats.map((stat) => (
            <article className="seeker-application-stat" key={stat.label}>
              <span className={`seeker-application-stat__icon seeker-application-stat__icon--${stat.tone}`}>
                {stat.icon}
              </span>
              <div>
                <strong>{stat.value}</strong>
                <p>{stat.label}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="seeker-applications-grid">
          <div className="seeker-card seeker-application-list-card">
            <div className="seeker-section-heading">
              <h2>Recent applications</h2>
              <button type="button" className="seeker-applications-export">
                <FaDownload />
                Export
              </button>
            </div>

            <div className="seeker-application-tabs" aria-label="Application status filters">
              {['All', 'Approved', 'Pending', 'Rejected', 'Completed'].map((tab) => (
                <button className={tab === 'All' ? 'seeker-application-tab--active' : ''} type="button" key={tab}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="seeker-application-list">
              {allApplications.map((application) => (
                <article className="seeker-application-card" key={`${application.id}-${application.role}`}>
                  <div className={`seeker-application-card__logo seeker-application-card__logo--${application.tone}`}>
                    {application.icon}
                  </div>
                  <div className="seeker-application-card__content">
                    <div className="seeker-application-card__top">
                      <div>
                        <h3>{application.role}</h3>
                        <p>{application.company} · {application.type}</p>
                      </div>
                      <span className={`seeker-application-status seeker-application-status--${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                    </div>
                    <div className="seeker-application-card__meta">
                      <span><FaCalendarAlt /> {application.applied}</span>
                      <span><FaBriefcase /> {application.nextStep}</span>
                      <span><FaDollarSign /> {application.amount}</span>
                    </div>
                  </div>
                  <Link to={`/seeker/jobs/${application.id}`} className="seeker-application-card__link" aria-label={`View ${application.role} details`}>
                    <FaExternalLinkAlt />
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <aside className="seeker-card seeker-income-card" aria-label="Completed jobs and income">
            <div className="seeker-income-card__heading">
              <span><FaDollarSign /></span>
              <div>
                <h2>Work summary</h2>
                <p>Completed jobs and released payments</p>
              </div>
            </div>
            <div className="seeker-income-metrics">
              {completedJobs.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="seeker-income-progress">
              <div>
                <span>Monthly goal</span>
                <strong>72%</strong>
              </div>
              <span className="seeker-income-progress__bar"><i /></span>
            </div>
          </aside>
        </section>
      </main>

      {selectedJob && (
        <div className="seeker-application-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeApplication();
        }}>
          <section className="seeker-application-modal" role="dialog" aria-modal="true" aria-labelledby="application-modal-title">
            <div className="seeker-application-modal__header">
              <div>
                <span className="seeker-application-modal__eyebrow">Application workspace</span>
                <h2 id="application-modal-title">Apply for {selectedJob.role}</h2>
                <p>{selectedJob.company} · {selectedJob.location}</p>
              </div>
              <button type="button" className="seeker-application-modal__close" onClick={closeApplication} aria-label="Close application form">
                <FaTimes />
              </button>
            </div>

            {applicationSent ? (
              <div className="seeker-application-success">
                <span><FaCheck /></span>
                <h3>Application submitted</h3>
                <p>Your application was sent to {selectedJob.company}. You can track it from Applications.</p>
                <button type="button" className="button button--primary" onClick={closeApplication}>Back to applications</button>
              </div>
            ) : (
              <>
                <div className="seeker-application-modal__body">
                  <div className="seeker-application-job-facts">
                    <span><strong>Compensation</strong>{selectedJob.salary}</span>
                    <span><strong>Work type</strong>{selectedJob.workType}</span>
                    <span><strong>Arrangement</strong>{selectedJob.workArrangement}</span>
                  </div>
                  <div className="seeker-application-cv-choice">
                    <div className="seeker-application-cv-choice__heading">
                      <div>
                        <h3>Choose a CV <small>{cvRequirement === 'required' ? 'Required for this job' : 'Optional for this job'}</small></h3>
                        <p>Select a CV to see how well it matches this role.</p>
                      </div>
                      {cvSource && <span className="seeker-application-cv-selected"><FaCheck /> {cvSource === 'profile' ? 'Profile CV selected' : cvFileName}</span>}
                    </div>
                    <div className="seeker-application-cv-actions">
                      <button type="button" className={`seeker-application-cv-button ${cvSource === 'profile' ? 'seeker-application-cv-button--selected' : ''}`} onClick={() => setCvSource('profile')}>
                        <FaFileAlt />
                        <span><strong>Use profile CV</strong><small>Sarah Johnson CV</small></span>
                      </button>
                      <label className={`seeker-application-cv-button ${cvSource === 'upload' ? 'seeker-application-cv-button--selected' : ''}`} htmlFor="application-cv-upload">
                        <FaUpload />
                        <span><strong>Upload a CV</strong><small>PDF or DOCX</small></span>
                      </label>
                      <input id="application-cv-upload" className="seeker-application-cv-input" type="file" accept=".pdf,.doc,.docx" onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setCvFileName(file.name);
                          setCvSource('upload');
                        }
                      }} />
                    </div>
                    {cvSource === 'profile' && <Link className="seeker-application-edit-cv" to="/seeker/profile">Edit CV in profile</Link>}
                    {cvRequirement !== 'required' && !cvSource && <span className="seeker-application-cv-note">You can continue without a CV.</span>}
                  </div>
                  {cvRequirement === 'not-needed' && !cvSelected ? (
                    <div className="seeker-application-fit seeker-application-fit--neutral">
                      <div className="seeker-application-fit__score"><FaCheck /></div>
                      <div>
                        <h3>CV is optional for this job</h3>
                        <p>Focus on your work samples, portfolio, or a clear introduction instead.</p>
                      </div>
                    </div>
                  ) : !cvSelected ? (
                    <div className="seeker-application-fit seeker-application-fit--neutral">
                      <div className="seeker-application-fit__score"><FaFileAlt /></div>
                      <div>
                        <h3>No CV selected</h3>
                        <p>Choose your profile CV or upload one to see the compatibility check.</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`seeker-application-fit ${cvIsWeakMatch ? 'seeker-application-fit--weak' : ''}`}>
                      <div className="seeker-application-fit__score"><strong>{cvMatchScore}%</strong><span>CV match</span></div>
                      <div>
                        <h3>{cvIsWeakMatch ? 'Your CV needs a little work' : 'Good fit for this role'}</h3>
                        <p>Matching skills: {matchingSkills.length ? matchingSkills.join(', ') : 'No direct skill matches yet'}</p>
                        {cvIsWeakMatch ? (
                          <>
                            <p className="seeker-application-fit__note"><FaExclamationTriangle /> Add {missingSkills.slice(0, 2).join(' and ')} to improve your match.</p>
                            <Link className="seeker-application-edit-cv" to="/seeker/profile">Edit CV</Link>
                          </>
                        ) : (
                          <p className="seeker-application-fit__note">Your experience aligns well with the skills requested for this role.</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="seeker-application-readiness">
                    <h3>Application readiness</h3>
                    {(cvRequirement === 'not-needed' && !cvSelected
                      ? ['CV not required', 'Profile summary complete', 'Portfolio available', 'Contact details verified']
                      : [cvSource === 'upload' ? 'Uploaded CV selected' : 'Profile CV selected', 'Profile summary complete', 'Portfolio available', 'Contact details verified']
                    ).map((item) => (
                      <span key={item}><FaCheck /> {item}</span>
                    ))}
                  </div>
                  <div className="seeker-application-proposal">
                    <label htmlFor="application-proposal">Cover letter or short introduction <small>(optional)</small></label>
                    <textarea id="application-proposal" value={proposal} onChange={(event) => setProposal(event.target.value)} placeholder="Share a concise introduction, relevant experience, and what you would bring to this role." rows={5} />
                    <small>{proposal.trim().length ? `${proposal.trim().length} characters` : 'You can apply without a cover letter.'}</small>
                  </div>
                  <div className="seeker-application-upload">
                    <div>
                      <strong>Supporting material <small>(optional)</small></strong>
                      <span>{supportingFileName || 'Add a portfolio, work sample, or another document.'}</span>
                    </div>
                    <label className="seeker-application-upload__button" htmlFor="supporting-material">{supportingFileName ? 'Change file' : 'Upload file'}</label>
                    <input id="supporting-material" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" onChange={(event) => setSupportingFileName(event.target.files?.[0]?.name || '')} />
                  </div>
                </div>
                <div className="seeker-application-modal__footer">
                  <button type="button" className="seeker-application-secondary-button" onClick={closeApplication}>Cancel</button>
                  <button type="button" className="seeker-application-secondary-button" onClick={() => setSavedDraft(true)}>{savedDraft ? 'Draft saved' : 'Save draft'}</button>
                  <button type="button" className="button button--primary" disabled={cvRequirement === 'required' && !cvSource} onClick={submitApplication}>Submit application</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ApplicationsPage;
