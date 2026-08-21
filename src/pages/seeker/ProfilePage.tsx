import { useMemo, useState, type ChangeEvent } from 'react';
import {
  FaArrowLeft,
  FaBriefcase,
  FaCalendarAlt,
  FaCheck,
  FaCrown,
  FaDownload,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaGraduationCap,
  FaGripVertical,
  FaLinkedin,
  FaMagic,
  FaMapMarkerAlt,
  FaPlus,
  FaRegSave,
  FaTrash,
  FaUpload,
  FaUser,
} from 'react-icons/fa';
import CVTemplateSelector, { TEMPLATES } from '../../components/cv-templates/CVTemplateSelector';
import CVTemplateRenderer, { CVData } from '../../components/cv-templates/CVTemplateRenderer';
import { useSubscriptions, type SubscriptionPlanId } from '../../context/SubscriptionContext';
import { downloadCVAsPDF } from '../../utils/cvDownloadUtils';

type StepKey = 'personal' | 'experience' | 'education' | 'skills' | 'certifications';

type ExperienceItem = {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
};

type EducationItem = {
  id: string;
  degree: string;
  school: string;
  year: string;
};

type CertificationItem = {
  id: string;
  name: string;
  issuer: string;
};

type ProfileState = {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    summary: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  certifications: CertificationItem[];
};

type AddPanel = 'skill' | 'qualification' | null;
type CvMode = 'builder' | 'upload';

const steps: Array<{ key: StepKey; label: string }> = [
  { key: 'personal', label: 'Personal Info & Summary' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
  { key: 'certifications', label: 'Qualifications' },
];

const skillSuggestions = [
  'Account Management', 'Accounting', 'Agile Methodology', 'Branding', 'Business Analysis',
  'Cloud Computing', 'Communication', 'Content Writing', 'Customer Service', 'Data Analysis',
  'Data Science', 'Digital Marketing', 'Figma', 'Graphic Design', 'HTML', 'JavaScript',
  'Leadership', 'Microsoft Excel', 'Mobile Development', 'Negotiation', 'Product Management',
  'Project Management', 'Public Speaking', 'Python', 'Research', 'Sales', 'SEO', 'Social Media',
  'SQL', 'Teamwork', 'UI Design', 'UX Research', 'Video Editing', 'Web Development',
];

const qualificationSuggestions = [
  'Bachelor of Arts', 'Bachelor of Science', 'Master of Arts', 'Master of Science',
  'Master of Business Administration', 'Doctor of Philosophy', 'Associate Degree',
  'Google Career Certificate', 'Microsoft Certified Professional', 'AWS Certified Cloud Practitioner',
  'Certified ScrumMaster', 'Project Management Professional (PMP)', 'Certified Public Accountant',
  'CompTIA A+', 'Cisco Certified Network Associate', 'Adobe Certified Professional',
  'Professional Certificate', 'Diploma', 'Vocational Certificate', 'Other qualification',
];

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialProfileState: ProfileState = {
  personalInfo: {
    fullName: 'Sarah Johnson',
    title: 'Senior UI/UX Designer',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/sarahjohnson',
    summary: 'Senior UI/UX Designer with 5+ years of experience building accessible product experiences. Specialized in design systems, user research, and cross-functional collaboration.',
  },
  experience: [
    {
      id: createId('experience'),
      jobTitle: 'Senior UI/UX Designer',
      company: 'Tech Company Inc.',
      startDate: 'Jan 2022',
      endDate: 'Present',
      currentlyWorking: true,
      description: 'Led design system implementation across 50+ products. Improved user onboarding by 40% through comprehensive UX research and iterative design.',
    },
    {
      id: createId('experience'),
      jobTitle: 'UX Designer',
      company: 'Design Studio Co.',
      startDate: 'Jun 2020',
      endDate: 'Dec 2021',
      currentlyWorking: false,
      description: 'Designed mobile and web experiences for Fortune 500 clients. Conducted user research studies and usability testing.',
    },
  ],
  education: [
    {
      id: createId('education'),
      degree: 'B.Sc. in Interaction Design',
      school: 'University of Design',
      year: '2018',
    },
    {
      id: createId('education'),
      degree: 'Google UX Certificate',
      school: 'Google via Coursera',
      year: '2019',
    },
  ],
  skills: ['UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Figma', 'User Testing'],
  certifications: [
    { id: createId('cert'), name: 'Advanced Figma Systems', issuer: 'Figma Academy' },
    { id: createId('cert'), name: 'Interaction Design Specialist', issuer: 'Nielsen Norman Group' },
  ],
};

function ProfilePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'professional' | 'creative' | 'minimalist'>('modern');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>('personal');
  const [uploadStatus, setUploadStatus] = useState('Ready to upload');
  const [uploadedCvName, setUploadedCvName] = useState('');
  const [uploadedCvFile, setUploadedCvFile] = useState<File | null>(null);
  const [cvMode, setCvMode] = useState<CvMode>('builder');
  const [profile, setProfile] = useState<ProfileState>(initialProfileState);
  const [addPanel, setAddPanel] = useState<AddPanel>(null);
  const [addValue, setAddValue] = useState('');
  const { plans, getSubscription, updateSubscription } = useSubscriptions();
  const subscription = getSubscription('sarah-johnson');

  const completionScore = useMemo(() => {
    const fields = [
      profile.personalInfo.fullName,
      profile.personalInfo.title,
      profile.personalInfo.email,
      profile.personalInfo.phone,
      profile.personalInfo.location,
      profile.personalInfo.linkedin,
      profile.experience.length,
      profile.education.length,
      profile.skills.length,
      profile.certifications.length,
    ];

    const filled = fields.filter((value) => String(value).trim() !== '').length;
    return Math.min(100, Math.round((filled / 10) * 100));
  }, [profile]);

  const updatePersonalInfo = (field: keyof ProfileState['personalInfo'], value: string) => {
    setProfile((current) => ({
      ...current,
      personalInfo: {
        ...current.personalInfo,
        [field]: value,
      },
    }));
  };

  const updateExperience = (id: string, field: keyof ExperienceItem, value: string | boolean) => {
    setProfile((current) => ({
      ...current,
      experience: current.experience.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const addExperience = () => {
    setProfile((current) => ({
      ...current,
      experience: [...current.experience, {
        id: createId('experience'),
        jobTitle: '',
        company: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: '',
      }],
    }));
  };

  const removeExperience = (id: string) => {
    setProfile((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== id),
    }));
  };

  const updateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setProfile((current) => ({
      ...current,
      education: current.education.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const addEducation = () => {
    setProfile((current) => ({
      ...current,
      education: [...current.education, {
        id: createId('education'),
        degree: '',
        school: '',
        year: '',
      }],
    }));
  };

  const removeEducation = (id: string) => {
    setProfile((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== id),
    }));
  };

  const openAddPanel = (panel: Exclude<AddPanel, null>) => {
    setAddPanel(panel);
    setAddValue('');
    setActiveStep(panel === 'skill' ? 'skills' : 'certifications');
  };

  const closeAddPanel = () => {
    setAddPanel(null);
    setAddValue('');
  };

  const commitAddValue = () => {
    const value = addValue.trim();
    if (!value || !addPanel) return;

    if (addPanel === 'skill') {
      setProfile((current) => ({
        ...current,
        skills: current.skills.includes(value) ? current.skills : [...current.skills, value],
      }));
    } else {
      setProfile((current) => ({
        ...current,
        certifications: [...current.certifications, { id: createId('cert'), name: value, issuer: '' }],
      }));
    }

    closeAddPanel();
  };

  const updateSkill = (index: number, value: string) => {
    setProfile((current) => ({
      ...current,
      skills: current.skills.map((skill, skillIndex) => skillIndex === index ? value : skill),
    }));
  };

  const removeSkill = (index: number) => {
    setProfile((current) => ({
      ...current,
      skills: current.skills.filter((_, skillIndex) => skillIndex !== index),
    }));
  };

  const addCertification = () => {
    setProfile((current) => ({
      ...current,
      certifications: [...current.certifications, { id: createId('cert'), name: '', issuer: '' }],
    }));
  };

  const updateCertification = (id: string, field: keyof CertificationItem, value: string) => {
    setProfile((current) => ({
      ...current,
      certifications: current.certifications.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const removeCertification = (id: string) => {
    setProfile((current) => ({
      ...current,
      certifications: current.certifications.filter((item) => item.id !== id),
    }));
  };

  const filteredSuggestions = (suggestions: string[]) => suggestions
    .filter((suggestion) => suggestion.toLowerCase().includes(addValue.trim().toLowerCase()))
    .slice(0, 8);

  const renderAddPanel = (panel: Exclude<AddPanel, null>) => {
    const isSkillPanel = panel === 'skill';
    const suggestions = isSkillPanel ? skillSuggestions : qualificationSuggestions;
    const matchingSuggestions = filteredSuggestions(suggestions);

    return (
      <div className="seeker-add-panel">
        <div className="seeker-add-panel__header">
          <div>
            <strong>{isSkillPanel ? 'Add a skill' : 'Add a qualification'}</strong>
            <span>Type your own or choose a suggestion.</span>
          </div>
          <button type="button" onClick={closeAddPanel}>Cancel</button>
        </div>
        <div className="seeker-add-panel__input-row">
          <input
            autoFocus
            type="text"
            value={addValue}
            placeholder={isSkillPanel ? 'e.g. Product Design' : 'e.g. Bachelor of Science'}
            onChange={(event) => setAddValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitAddValue();
              }
            }}
          />
          <button type="button" onClick={commitAddValue} disabled={!addValue.trim()}>Done</button>
        </div>
        {matchingSuggestions.length > 0 && (
          <div className="seeker-add-panel__suggestions" aria-label={`${isSkillPanel ? 'Skill' : 'Qualification'} suggestions`}>
            {matchingSuggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => setAddValue(suggestion)}>{suggestion}</button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSaveDraft = () => {
    setUploadStatus('Draft saved locally');
  };

  const handleEditCvContent = () => {
    setActiveStep('personal');
    document.getElementById('seeker-profile-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCvFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supportedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const supportedExtension = /\.(pdf|doc|docx)$/i.test(file.name);
    if (!supportedTypes.includes(file.type) && !supportedExtension) {
      setUploadStatus('Please upload a PDF, DOC, or DOCX file');
      event.target.value = '';
      return;
    }

    setUploadedCvFile(file);
    setUploadedCvName(file.name);
    setUploadStatus(`CV selected: ${file.name}`);
    console.log('CV_FILE_READY_FOR_BACKEND', {
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    });
  };

  const handleUploadProfile = () => {
    const payload = {
      personalInfo: profile.personalInfo,
      experience: profile.experience,
      education: profile.education,
      skills: profile.skills,
      certifications: profile.certifications,
      cvFile: uploadedCvFile,
      uploadedAt: new Date().toISOString(),
    };

    console.log('PROFILE_PAYLOAD_READY_FOR_BACKEND', payload);
    setUploadStatus('Profile uploaded and ready for backend');
  };

  const handleDownloadPDF = async () => {
    try {
      const previewData: CVData = {
        personalInfo: profile.personalInfo,
        summary: profile.personalInfo.summary,
        experience: profile.experience.map((item) => ({
          jobTitle: item.jobTitle,
          company: item.company,
          startDate: item.startDate,
          endDate: item.endDate,
          currentlyWorking: item.currentlyWorking,
          description: item.description,
        })),
        education: profile.education.map((item) => ({
          degree: item.degree,
          school: item.school,
          year: item.year,
        })),
        skills: profile.skills,
        certifications: profile.certifications.map((item) => ({
          name: item.name,
          issuer: item.issuer,
        })),
      };

      const safeName = profile.personalInfo.fullName || 'profile';
      await downloadCVAsPDF('cv-preview-container', `${safeName}-CV.pdf`);
      console.log('CV_PREVIEW_DATA', previewData);
    } catch (error) {
      console.error('Failed to download CV:', error);
    }
  };

  return (
    <div className="seeker-profile-page">
      <section className="seeker-profile-hero">
        <div className="seeker-profile-hero__top">
          <button type="button" className="seeker-profile-icon-button" aria-label="Go back">
            <FaArrowLeft />
          </button>
          <div>
            <h1>My CV</h1>
            <p>Create a polished resume for applications</p>
          </div>
          <button type="button" className="seeker-profile-icon-button" aria-label="CV settings">
            <FaMagic />
          </button>
        </div>
      </section>

      <main className="seeker-profile-content">
        <section className="seeker-cv-summary seeker-card">
          <div className="seeker-cv-summary__content">
            <span className="seeker-cv-summary__eyebrow">Modern template</span>
            <h2>{profile.personalInfo.fullName}</h2>
            <p>{profile.personalInfo.summary}</p>
            <div className="seeker-cv-progress">
              <div>
                <strong>{completionScore}% complete</strong>
                <span>{Math.max(0, 5 - (completionScore / 20))} sections need updates</span>
              </div>
              <span className="seeker-cv-progress__bar"><i style={{ width: `${completionScore}%` }} /></span>
            </div>
            <div className="seeker-cv-summary__actions">
              <button type="button" onClick={() => document.getElementById('cv-preview-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><FaEye /> Preview</button>
              <button type="button" onClick={handleDownloadPDF}><FaDownload /> Download PDF</button>
            </div>
          </div>
        </section>

        <section className="seeker-cv-tools" aria-label="CV tools">
          <button type="button" onClick={() => setUploadStatus('LinkedIn import is ready for backend connection')}><FaLinkedin /> Import from LinkedIn</button>
          <button type="button" onClick={() => setUploadStatus('AI enhancement is ready for backend connection')}><FaMagic /> AI Resume Enhancement</button>
        </section>

        <section className="seeker-card seeker-cv-workspace">
          <div className="seeker-cv-workspace__heading">
            <div>
              <span className="seeker-cv-summary__eyebrow">CV workspace</span>
              <h2>Build or upload your CV</h2>
              <p>Use your profile information with a template, or send us an existing CV for backend processing.</p>
            </div>
            {uploadedCvName && <span className="seeker-cv-file-status"><FaCheck /> {uploadedCvName}</span>}
          </div>

          <div className="seeker-cv-mode-grid" role="tablist" aria-label="Choose how to create your CV">
            <button type="button" role="tab" aria-selected={cvMode === 'builder'} className={cvMode === 'builder' ? 'seeker-cv-mode-card seeker-cv-mode-card--active' : 'seeker-cv-mode-card'} onClick={() => setCvMode('builder')}>
              <FaEdit />
              <strong>Build with a template</strong>
              <span>Write and edit your CV using your profile information.</span>
            </button>
            <button type="button" role="tab" aria-selected={cvMode === 'upload'} className={cvMode === 'upload' ? 'seeker-cv-mode-card seeker-cv-mode-card--active' : 'seeker-cv-mode-card'} onClick={() => setCvMode('upload')}>
              <FaUpload />
              <strong>Upload existing CV</strong>
              <span>Choose a PDF, DOC, or DOCX file from your device.</span>
            </button>
          </div>

          {cvMode === 'builder' ? (
            <>
              <div className="seeker-cv-template-choices" aria-label="CV templates">
                {TEMPLATES.map((template) => (
                  <button type="button" key={template.id} className={selectedTemplate === template.style ? 'seeker-cv-template-choice seeker-cv-template-choice--active' : 'seeker-cv-template-choice'} onClick={() => setSelectedTemplate(template.style)}>
                    <span>{template.name}</span>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
              <div id="cv-preview-container" className="seeker-cv-rendered-preview">
                <CVTemplateRenderer data={{
                  personalInfo: profile.personalInfo,
                  summary: profile.personalInfo.summary,
                  experience: profile.experience,
                  education: profile.education,
                  skills: profile.skills.filter(Boolean),
                  certifications: profile.certifications,
                }} template={selectedTemplate} />
              </div>
              <div className="seeker-cv-workspace__actions">
                <button type="button" onClick={handleEditCvContent}><FaEdit /> Edit CV content</button>
                <button type="button" onClick={handleDownloadPDF}><FaDownload /> Download PDF</button>
              </div>
            </>
          ) : (
            <div className="seeker-cv-upload-box">
              <FaUpload />
              <strong>Upload your existing CV</strong>
              <span>PDF, DOC, or DOCX files up to 10 MB</span>
              <label className="seeker-cv-upload-control">
                Choose CV file
                <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleCvFileUpload} />
              </label>
              {uploadedCvName && <small>Selected: {uploadedCvName}</small>}
            </div>
          )}
        </section>

        <section className="seeker-card seeker-subscription-card">
          <div className="seeker-subscription-card__heading">
            <div>
              <span className="seeker-subscription-eyebrow"><FaCrown /> Profile visibility</span>
              <h2>Get discovered by more employers</h2>
              <p>Choose a plan to increase your visibility when your profile matches a job.</p>
            </div>
            <span className={`seeker-subscription-status seeker-subscription-status--${subscription.status.toLowerCase()}`}>{subscription.status}</span>
          </div>
          <div className="seeker-subscription-plan-grid">
            {plans.map((plan) => (
              <article className={`seeker-subscription-plan ${subscription.planId === plan.id ? 'seeker-subscription-plan--active' : ''}`} key={plan.id}>
                <div>
                  <h3>{plan.name}</h3>
                  <strong>${plan.price}<small>/month</small></strong>
                </div>
                <p>{plan.description}</p>
                <ul>{plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
                <button type="button" onClick={() => updateSubscription('sarah-johnson', plan.id as SubscriptionPlanId)}>{subscription.planId === plan.id ? 'Current plan' : plan.id === 'free' ? 'Use Free' : `Choose ${plan.name}`}</button>
              </article>
            ))}
          </div>
          <small className="seeker-subscription-renewal">Current plan: {plans.find((plan) => plan.id === subscription.planId)?.name} / Renewal: {subscription.renewalDate} / Recommendation boost: +{plans.find((plan) => plan.id === subscription.planId)?.visibilityBoost ?? 0}%</small>
        </section>

        <nav id="seeker-profile-editor" className="seeker-cv-steps" aria-label="CV sections">
          {steps.map((step) => (
            <button
              className={activeStep === step.key ? 'seeker-cv-step--active' : profile.personalInfo.fullName && step.key === 'personal' ? 'seeker-cv-step--done' : ''}
              type="button"
              key={step.key}
              onClick={() => setActiveStep(step.key)}
            >
              <span>{step.key === 'personal' ? <FaCheck /> : steps.findIndex((item) => item.key === step.key) + 1}</span>
              {step.label}
            </button>
          ))}
        </nav>

        <section className="seeker-profile-grid">
          <div className="seeker-profile-main">
            {activeStep === 'personal' && (
              <section className="seeker-card seeker-editor-card">
                <div className="seeker-editor-card__heading">
                  <div>
                    <h2>Personal details</h2>
                    <p>Keep your public candidate information accurate.</p>
                  </div>
                </div>

                <form className="seeker-profile-form">
                  <label>
                    <span>Full Name</span>
                    <input type="text" value={profile.personalInfo.fullName} onChange={(event) => updatePersonalInfo('fullName', event.target.value)} />
                  </label>
                  <label>
                    <span>Professional Title</span>
                    <input type="text" value={profile.personalInfo.title} onChange={(event) => updatePersonalInfo('title', event.target.value)} />
                  </label>
                  <div className="seeker-profile-form__split">
                    <label>
                      <span>Email</span>
                      <input type="email" value={profile.personalInfo.email} onChange={(event) => updatePersonalInfo('email', event.target.value)} />
                    </label>
                    <label>
                      <span>Phone</span>
                      <input type="tel" value={profile.personalInfo.phone} onChange={(event) => updatePersonalInfo('phone', event.target.value)} />
                    </label>
                  </div>
                  <div className="seeker-profile-form__split">
                    <label>
                      <span>Location</span>
                      <input type="text" value={profile.personalInfo.location} onChange={(event) => updatePersonalInfo('location', event.target.value)} />
                    </label>
                    <label>
                      <span>LinkedIn</span>
                      <input type="text" value={profile.personalInfo.linkedin} onChange={(event) => updatePersonalInfo('linkedin', event.target.value)} />
                    </label>
                  </div>
                  <label>
                    <span>Profile Summary</span>
                    <textarea
                      className="seeker-profile-summary"
                      value={profile.personalInfo.summary}
                      rows={5}
                      onChange={(event) => updatePersonalInfo('summary', event.target.value)}
                    />
                  </label>
                </form>
              </section>
            )}

            {activeStep === 'experience' && (
              <section className="seeker-card seeker-editor-card">
                <div className="seeker-editor-card__heading">
                  <div>
                    <h2>Experience</h2>
                    <p>Add your work experience in reverse chronological order.</p>
                  </div>
                  <div className="seeker-editor-card__tools">
                    <button type="button" aria-label="Reorder section"><FaGripVertical /></button>
                    <button type="button" aria-label="Edit section"><FaEdit /></button>
                    <button type="button" aria-label="Add experience" onClick={addExperience}><FaPlus /></button>
                  </div>
                </div>

                <div className="seeker-form-list">
                  {profile.experience.map((item) => (
                    <div className="seeker-form-item" key={item.id}>
                      <div className="seeker-form-item__header">
                        <strong>Role #{profile.experience.indexOf(item) + 1}</strong>
                        <button type="button" className="seeker-delete-button" onClick={() => removeExperience(item.id)}>
                          <FaTrash />
                        </button>
                      </div>

                      <form className="seeker-profile-form">
                        <label>
                          <span>Job Title</span>
                          <input type="text" value={item.jobTitle} onChange={(event) => updateExperience(item.id, 'jobTitle', event.target.value)} />
                        </label>
                        <label>
                          <span>Company</span>
                          <input type="text" value={item.company} onChange={(event) => updateExperience(item.id, 'company', event.target.value)} />
                        </label>
                        <div className="seeker-profile-form__split">
                          <label>
                            <span>Start Date</span>
                            <div className="seeker-date-input">
                              <input type="text" value={item.startDate} onChange={(event) => updateExperience(item.id, 'startDate', event.target.value)} />
                              <FaCalendarAlt />
                            </div>
                          </label>
                          <label>
                            <span>End Date</span>
                            <div className="seeker-date-input">
                              <input type="text" value={item.endDate} onChange={(event) => updateExperience(item.id, 'endDate', event.target.value)} disabled={item.currentlyWorking} />
                              <FaCalendarAlt />
                            </div>
                          </label>
                        </div>
                        <label className="seeker-profile-check">
                          <input type="checkbox" checked={item.currentlyWorking} onChange={(event) => updateExperience(item.id, 'currentlyWorking', event.target.checked)} />
                          <span>I currently work here</span>
                        </label>
                        <label>
                          <span>Job Description</span>
                          <div className="seeker-rich-editor">
                            <div className="seeker-rich-editor__toolbar" aria-label="Formatting toolbar">
                              <strong>B</strong>
                              <em>I</em>
                              <u>U</u>
                              <span>•</span>
                              <span>1.</span>
                              <FaEdit />
                            </div>
                            <textarea value={item.description} onChange={(event) => updateExperience(item.id, 'description', event.target.value)} />
                          </div>
                        </label>
                      </form>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeStep === 'education' && (
              <section className="seeker-card seeker-editor-card">
                <div className="seeker-editor-card__heading">
                  <div>
                    <h2>Education</h2>
                    <p>List your academic background and certifications.</p>
                  </div>
                  <div className="seeker-editor-card__tools">
                    <button type="button" aria-label="Add education" onClick={addEducation}><FaPlus /></button>
                  </div>
                </div>

                <div className="seeker-form-list">
                  {profile.education.map((item) => (
                    <div className="seeker-form-item" key={item.id}>
                      <div className="seeker-form-item__header">
                        <strong>Education #{profile.education.indexOf(item) + 1}</strong>
                        <button type="button" className="seeker-delete-button" onClick={() => removeEducation(item.id)}>
                          <FaTrash />
                        </button>
                      </div>

                      <form className="seeker-profile-form">
                        <label>
                          <span>Degree</span>
                          <input type="text" value={item.degree} onChange={(event) => updateEducation(item.id, 'degree', event.target.value)} />
                        </label>
                        <label>
                          <span>School</span>
                          <input type="text" value={item.school} onChange={(event) => updateEducation(item.id, 'school', event.target.value)} />
                        </label>
                        <label>
                          <span>Year</span>
                          <input type="text" value={item.year} onChange={(event) => updateEducation(item.id, 'year', event.target.value)} />
                        </label>
                      </form>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeStep === 'skills' && (
              <section className="seeker-card seeker-editor-card">
                <div className="seeker-editor-card__heading">
                  <div>
                    <h2>Skills</h2>
                    <p>Highlight technical and soft skills relevant to the role.</p>
                  </div>
                  <div className="seeker-editor-card__tools">
                    <button type="button" aria-label="Add skill" onClick={() => openAddPanel('skill')}><FaPlus /></button>
                  </div>
                </div>

                {addPanel === 'skill' && renderAddPanel('skill')}

                <div className="seeker-form-list">
                  {profile.skills.map((skill, index) => (
                    <div className="seeker-form-item seeker-form-item--inline" key={`${skill}-${index}`}>
                      <input
                        type="text"
                        list="skill-suggestions"
                        value={skill}
                        placeholder="Type a skill or choose a suggestion"
                        onChange={(event) => updateSkill(index, event.target.value)}
                      />
                      <button type="button" className="seeker-delete-button" onClick={() => removeSkill(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>
                <datalist id="skill-suggestions">
                  {skillSuggestions.map((skill) => <option value={skill} key={skill} />)}
                </datalist>
              </section>
            )}

            {activeStep === 'certifications' && (
              <section className="seeker-card seeker-editor-card">
                <div className="seeker-editor-card__heading">
                  <div>
                    <h2>Qualifications</h2>
                    <p>Show the qualifications, awards, and credentials that strengthen your profile.</p>
                  </div>
                  <div className="seeker-editor-card__tools">
                    <button type="button" aria-label="Add qualification" onClick={() => openAddPanel('qualification')}><FaPlus /></button>
                  </div>
                </div>

                {addPanel === 'qualification' && renderAddPanel('qualification')}

                <div className="seeker-form-list">
                  {profile.certifications.map((item) => (
                    <div className="seeker-form-item" key={item.id}>
                      <div className="seeker-form-item__header">
                        <strong>Certification</strong>
                        <button type="button" className="seeker-delete-button" onClick={() => removeCertification(item.id)}>
                          <FaTrash />
                        </button>
                      </div>

                      <form className="seeker-profile-form">
                        <label>
                          <span>Qualification or Certificate</span>
                          <input
                            type="text"
                            list="qualification-suggestions"
                            value={item.name}
                            placeholder="Type a qualification or choose a suggestion"
                            onChange={(event) => updateCertification(item.id, 'name', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>Issuer</span>
                          <input type="text" value={item.issuer} onChange={(event) => updateCertification(item.id, 'issuer', event.target.value)} />
                        </label>
                      </form>
                    </div>
                  ))}
                </div>
                <datalist id="qualification-suggestions">
                  {qualificationSuggestions.map((qualification) => <option value={qualification} key={qualification} />)}
                </datalist>
              </section>
            )}
          </div>

          <aside className="seeker-profile-side">
            <section className="seeker-card seeker-skill-card">
              <div className="seeker-section-heading">
                <h2>Skills</h2>
                <button type="button" onClick={() => openAddPanel('skill')}><FaPlus /> Add</button>
              </div>
              <div className="seeker-profile-tags">
                {profile.skills.map((skill, index) => (
                  <span key={`${skill}-${index}`}>{skill}</span>
                ))}
              </div>
            </section>

            <section className="seeker-card seeker-skill-card">
              <div className="seeker-section-heading">
                <h2>Qualifications</h2>
                <button type="button" onClick={() => openAddPanel('qualification')}><FaPlus /> Add</button>
              </div>
              <div className="seeker-qualification-list">
                {profile.certifications.map((item) => (
                  <p key={item.id}><FaGraduationCap /> {item.name || 'New certification'}</p>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>

      <div className="seeker-profile-actions">
        <button type="button" onClick={handleSaveDraft}><FaRegSave /> Save Draft</button>
        <button type="button" onClick={handleUploadProfile}><FaUpload /> Upload Profile</button>
      </div>

      <div className="seeker-upload-status">{uploadStatus}</div>

      <CVTemplateSelector
        isOpen={isTemplateModalOpen}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={(template) => setSelectedTemplate(template as any)}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
}

export default ProfilePage;
