import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
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
  FaMagic,
  FaMapMarkerAlt,
  FaPlus,
  FaRegSave,
  FaTrash,
  FaTimes,
  FaUpload,
  FaUser,
} from 'react-icons/fa';
import CVTemplateSelector, { TEMPLATES } from '../../components/cv-templates/CVTemplateSelector';
import CVTemplateRenderer, { CVData } from '../../components/cv-templates/CVTemplateRenderer';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptions, type SubscriptionPlanId } from '../../context/SubscriptionContext';
import {
  getSeekerProfile,
  API_BASE_URL,
  request,
  updateSeekerCV,
  updateSeekerProfile,
  uploadSeekerProfilePicture,
  uploadSeekerResume,
  deleteSeekerProfilePicture,
  deleteSeekerResume,
  type CertificationItem as ApiCertificationItem,
  type EducationItem as ApiEducationItem,
  type ExperienceItem as ApiExperienceItem,
} from '../../services/api';
import { downloadCVAsPDF } from '../../utils/cvDownloadUtils';
import { getLanguageSuggestions } from '../../data/languageSuggestions';

type StepKey = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'languages' | 'projects' | 'linkedin' | 'review';

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

type LanguageItem = {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Professional' | 'Fluent' | 'Native';
};

type ProjectItem = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  projectUrl: string;
  githubUrl: string;
  startDate: string;
  endDate: string;
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
  languages: LanguageItem[];
  projects: ProjectItem[];
};

type AddPanel = 'skill' | 'qualification' | null;
type CvWorkflowMode = 'template' | 'uploaded' | 'imported' | 'import-review';
type CvImportStatus = 'idle' | 'processing' | 'review' | 'editing-imported';
type ImportedCvData = {
  fullName: string | null;
  professionalTitle: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  website: string | null;
  experience: ExperienceItem[] | null;
  education: EducationItem[] | null;
  skills: string[] | null;
  certifications: CertificationItem[] | null;
  languages: LanguageItem[] | null;
  projects: ProjectItem[] | null;
  linkedinUrl: string | null;
};
type ResumeImportResponse = {
  success: true;
  data: {
    source: { format: string; filename: string | null };
    requiresReview: boolean;
    extraction: { method: string; aiUsed: boolean };
    warnings: string[];
    cv: ImportedCvData;
  };
};
type ProfileNotification = {
  title: string;
  message: string;
  tone: 'success' | 'info' | 'error';
};

const steps: Array<{ key: StepKey; label: string; description: string }> = [
  { key: 'personal', label: 'Personal Details', description: 'Add your basic details so employers know who you are.' },
  { key: 'summary', label: 'Profile Summary', description: 'Tell employers a little about your experience and the kind of work you do.' },
  { key: 'experience', label: 'Experience', description: 'Add previous jobs, freelancing, or client work.' },
  { key: 'education', label: 'Education', description: 'Add your education, training, and qualifications.' },
  { key: 'skills', label: 'Skills', description: 'Highlight the abilities and strengths you want employers to notice.' },
  { key: 'certifications', label: 'Qualifications', description: 'Add certificates, awards, or training that support your profile.' },
  { key: 'languages', label: 'Languages', description: 'Share the languages you speak and your level of confidence.' },
  { key: 'projects', label: 'Projects', description: 'Show examples of work you have completed, from client jobs to creative work or services.' },
  { key: 'linkedin', label: 'LinkedIn', description: 'Add your LinkedIn profile to make your CV easier to verify.' },
  { key: 'review', label: 'Review', description: 'Check your final CV and save your progress.' },
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

const createEmptyProfileState = (): ProfileState => ({
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
  },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
});

function ProfilePage() {
  const { user, token } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'professional' | 'creative' | 'minimalist'>('modern');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>('personal');
  const [notification, setNotification] = useState<ProfileNotification | null>(null);
  const [uploadedCvName, setUploadedCvName] = useState('');
  const [uploadedCvFile, setUploadedCvFile] = useState<File | null>(null);
  const [cvWorkflowMode, setCvWorkflowMode] = useState<CvWorkflowMode>('template');
  const [cvImportStatus, setCvImportStatus] = useState<CvImportStatus>('idle');
  const [importedCvData, setImportedCvData] = useState<ImportedCvData | null>(null);
  const [cvImportWarnings, setCvImportWarnings] = useState<string[]>([]);
  const [cvImportSourceFormat, setCvImportSourceFormat] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileState>(createEmptyProfileState());
  const [loadedProfileSnapshot, setLoadedProfileSnapshot] = useState<ProfileState | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [languageQueries, setLanguageQueries] = useState<Record<string, string>>({});
  const [openLanguageId, setOpenLanguageId] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [onboardingLocation, setOnboardingLocation] = useState({ country: '', state: '', city: '' });
  const [addPanel, setAddPanel] = useState<AddPanel>(null);
  const [addValue, setAddValue] = useState('');
  const { plans, getSubscription, updateSubscription } = useSubscriptions();

  const subscriptionUserId = user?.id || '';
  const subscription = subscriptionUserId ? getSubscription(subscriptionUserId) : { status: 'Free', planId: 'free', renewalDate: '' };

  useEffect(() => {
    if (!token) {
      setIsLoadingProfile(false);
      setProfileError('Unable to load profile: no authentication token');
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      const result = await getSeekerProfile(token);

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        const errorMessage = result.status === 401
          ? 'Your session has expired. Please sign in again.'
          : result.status === 403
            ? 'You do not have permission to view this profile.'
            : 'We could not load your profile right now. Please try again.';

        setProfileError(errorMessage);
        setIsLoadingProfile(false);
        return;
      }

      const { user: apiUser, profile: apiProfile } = result.data.data;

      const fullName = `${apiUser.firstName ?? ''} ${apiUser.lastName ?? ''}`.trim();
      const phone = apiUser.phone ? String(apiUser.phone).trim() : '';

      const locationParts = [apiProfile.city, apiProfile.state, apiProfile.country]
        .map((part) => part ? String(part).trim() : '')
        .filter(Boolean);
      const location = locationParts.join(', ');

      const title = apiProfile.professionalTitle ? String(apiProfile.professionalTitle).trim() : '';
      const skills = Array.isArray(apiProfile.skills)
        ? apiProfile.skills.filter((skill) => skill && String(skill).trim().length > 0)
        : [];

      const loadedProfile: ProfileState = {
        personalInfo: {
          fullName,
          title,
          email: apiUser.email ?? '',
          phone,
          location,
          linkedin: apiProfile.linkedinUrl ?? '',
          summary: apiProfile.bio ?? '',
        },
        experience: apiProfile.experience ?? [],
        education: apiProfile.education ?? [],
        skills,
        certifications: apiProfile.certifications ?? [],
        languages: apiProfile.languages ?? [],
        projects: apiProfile.projects ?? [],
      };
      setProfile(loadedProfile);
      setLoadedProfileSnapshot(loadedProfile);
      setSelectedTemplate(apiProfile.cvTemplate ?? 'modern');
      setProfilePictureUrl(apiProfile.profilePictureUrl ?? null);
      setResumeUrl(apiProfile.resumeUrl ?? null);
      if (apiProfile.resumeUrl) {
        setUploadedCvName('Uploaded resume');
        setCvWorkflowMode('uploaded');
      }
      setOnboardingLocation({
        country: apiProfile.country ?? '',
        state: apiProfile.state ?? '',
        city: apiProfile.city ?? '',
      });

      setProfileError(null);
      setIsLoadingProfile(false);
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !profilePictureUrl || profilePictureUrl.startsWith('blob:')) return undefined;

    let objectUrl = '';
    let isMounted = true;
    const loadPicture = async () => {
      const response = await fetch(`${API_BASE_URL}${profilePictureUrl}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok || !isMounted) return;
      objectUrl = URL.createObjectURL(await response.blob());
      setProfilePictureUrl(objectUrl);
    };

    void loadPicture();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profilePictureUrl, token]);

  useEffect(() => {
    if (!notification) return undefined;

    const timeout = window.setTimeout(() => setNotification(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  const showNotification = (nextNotification: ProfileNotification) => {
    setNotification(nextNotification);
  };

  const completionScore = useMemo(() => {
    const onboardingReady = Boolean(
      onboardingLocation.country.trim()
      && onboardingLocation.state.trim()
      && onboardingLocation.city.trim()
      && profile.personalInfo.title.trim()
      && profile.skills.length > 0,
    );

    const cvFields = [
      profile.personalInfo.summary.trim(),
      profile.experience.length > 0 ? 'experience' : '',
      profile.education.length > 0 ? 'education' : '',
      profile.skills.length > 0 ? 'skills' : '',
      profile.certifications.length > 0 ? 'certifications' : '',
      profile.languages.length > 0 ? 'languages' : '',
      profile.projects.length > 0 ? 'projects' : '',
      profile.personalInfo.linkedin.trim(),
    ];

    const filledCvFields = cvFields.filter((value) => String(value).trim() !== '').length;
    const onboardingWeight = onboardingReady ? 50 : 0;
    const cvWeight = Math.min(50, Math.round((filledCvFields / 8) * 50));

    return Math.min(100, onboardingWeight + cvWeight);
  }, [onboardingLocation, profile]);

  const completionMessage = useMemo(() => {
    if (completionScore >= 100) return 'Your profile is complete.';
    if (completionScore >= 75) return 'Great progress! Keep going to complete your CV.';
    if (completionScore >= 50) return 'Your basic profile is complete. Complete your CV to reach 100%.';
    return 'Start with your basics and build your CV step by step.';
  }, [completionScore]);

  const currentStepIndex = steps.findIndex((step) => step.key === activeStep);
  const currentStep = steps[currentStepIndex] ?? steps[0];
  const isFinalStep = activeStep === 'review';

  const goToStep = (direction: number) => {
    const nextIndex = Math.max(0, Math.min(steps.length - 1, currentStepIndex + direction));
    setActiveStep(steps[nextIndex].key);
  };

  const shouldShowSkipForStep = (stepKey: StepKey) => {
    if (stepKey === 'personal') return false;
    if (stepKey === 'summary') return !profile.personalInfo.summary.trim();
    if (stepKey === 'experience') return profile.experience.length === 0;
    if (stepKey === 'education') return profile.education.length === 0;
    if (stepKey === 'skills') return profile.skills.length === 0;
    if (stepKey === 'certifications') return profile.certifications.length === 0;
    if (stepKey === 'languages') return profile.languages.length === 0;
    if (stepKey === 'projects') return profile.projects.length === 0;
    if (stepKey === 'linkedin') return !profile.personalInfo.linkedin.trim();
    return false;
  };

  const renderStepControls = (stepKey: StepKey) => {
    const skipVisible = shouldShowSkipForStep(stepKey);

    return (
      <div className="seeker-step-actions">
        <div className="seeker-step-actions__left">
          {currentStepIndex > 0 && (
            <button type="button" className="seeker-step-button seeker-step-button--secondary" onClick={() => goToStep(-1)}>
              Back
            </button>
          )}
        </div>
        <div className="seeker-step-actions__right">
          {skipVisible && !isFinalStep && (
            <button type="button" className="seeker-step-button seeker-step-button--ghost" onClick={() => goToStep(1)}>
              Skip for now
            </button>
          )}
          <button type="button" className="seeker-step-button seeker-step-button--primary" onClick={isFinalStep ? handleUpdateProfile : () => goToStep(1)} disabled={isFinalStep && isSaving}>
            {isFinalStep ? (isSaving ? 'Updating...' : 'Finish CV') : 'Next'}
          </button>
        </div>
      </div>
    );
  };

  const renderReviewStatus = (isComplete: boolean, completeText: string) => (
    <span className={isComplete ? 'seeker-step-review__status seeker-step-review__status--complete' : 'seeker-step-review__status'}>
      {isComplete ? `✓ ${completeText}` : '○ Not added'}
    </span>
  );

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

  const addLanguage = () => {
    setProfile((current) => ({
      ...current,
      languages: [...current.languages, { id: createId('language'), name: '', proficiency: 'Professional' }],
    }));
  };

  const updateLanguage = (id: string, field: keyof LanguageItem, value: string) => {
    if (field === 'name' && profile.languages.some((item) => item.id !== id && item.name.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase())) {
      showNotification({ title: 'Duplicate language', message: 'That language is already in your profile.', tone: 'error' });
      return;
    }

    setProfile((current) => ({
      ...current,
      languages: current.languages.map((item) => item.id === id ? { ...item, [field]: value } as LanguageItem : item),
    }));
  };

  const selectLanguage = (id: string, name: string) => {
    updateLanguage(id, 'name', name);
    setLanguageQueries((current) => ({ ...current, [id]: name }));
    setOpenLanguageId(null);
  };

  const removeLanguage = (id: string) => {
    setProfile((current) => ({ ...current, languages: current.languages.filter((item) => item.id !== id) }));
  };

  const addProject = () => {
    setProfile((current) => ({
      ...current,
      projects: [...current.projects, {
        id: createId('project'), name: '', description: '', technologies: [], projectUrl: '', githubUrl: '', startDate: '', endDate: '',
      }],
    }));
  };

  const updateProject = (id: string, field: keyof ProjectItem, value: string | string[]) => {
    setProfile((current) => ({
      ...current,
      projects: current.projects.map((item) => item.id === id ? { ...item, [field]: value } as ProjectItem : item),
    }));
  };

  const removeProject = (id: string) => {
    setProfile((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== id) }));
  };

  const updateProjectTechnologies = (id: string, value: string) => {
    const seen = new Set<string>();
    const technologies = value.split(',').map((technology) => technology.trim()).filter((technology) => {
      const key = technology.toLocaleLowerCase();
      if (!technology || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    updateProject(id, 'technologies', technologies);
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

  const handleUpdateProfile = async () => {
    if (!token || isSaving) return;

    const fullNameParts = profile.personalInfo.fullName.trim().split(/\s+/).filter(Boolean);
    if (fullNameParts.length < 2) {
      showNotification({
        title: 'Name required',
        message: 'Enter your first and last name before saving your profile.',
        tone: 'error',
      });
      return;
    }

    const cvPayload = {
      bio: profile.personalInfo.summary.trim(),
      education: profile.education as ApiEducationItem[],
      experience: profile.experience.map((item) => ({
        ...item,
        endDate: item.currentlyWorking && !item.endDate.trim() ? 'Present' : item.endDate,
      })) as ApiExperienceItem[],
      certifications: profile.certifications as ApiCertificationItem[],
      languages: profile.languages,
      projects: profile.projects,
      linkedinUrl: profile.personalInfo.linkedin.trim(),
      cvTemplate: selectedTemplate,
    };

    setIsSaving(true);
    const cvResult = await updateSeekerCV(cvPayload, token);

    if (!cvResult.ok) {
      setIsSaving(false);
      const message = cvResult.status === 400
        ? 'Please check the profile fields and try again.'
        : cvResult.status === 401
          ? 'Your session has expired. Please sign in again.'
          : cvResult.status === 403
            ? 'You do not have permission to update this profile.'
            : 'We could not save your CV right now. Please try again.';
      showNotification({ title: 'Save failed', message, tone: 'error' });
      return;
    }

    const incompleteProfileFields = [
      !onboardingLocation.country.trim() ? 'country' : '',
      !onboardingLocation.state.trim() ? 'state or region' : '',
      !onboardingLocation.city.trim() ? 'city' : '',
      !profile.personalInfo.title.trim() ? 'professional title' : '',
      profile.skills.length === 0 ? 'at least one skill' : '',
    ].filter(Boolean);
    const profileFieldsAreReady = incompleteProfileFields.length === 0;

    if (profileFieldsAreReady) {
      const profileResult = await updateSeekerProfile({
        fullName: profile.personalInfo.fullName.trim(),
        country: onboardingLocation.country.trim(),
        state: onboardingLocation.state.trim(),
        city: onboardingLocation.city.trim(),
        professionalTitle: profile.personalInfo.title.trim(),
        skills: profile.skills.map((skill) => skill.trim()).filter(Boolean),
      }, token);

      if (!profileResult.ok) {
        setIsSaving(false);
        const message = profileResult.status === 400
          ? 'Your personal profile fields are incomplete or invalid.'
          : profileResult.status === 401
            ? 'Your session has expired. Please sign in again.'
            : profileResult.status === 403
              ? 'You do not have permission to update this profile.'
              : 'Your CV was saved, but personal details could not be updated.';
        showNotification({ title: 'Partial save', message, tone: 'error' });
        return;
      }
    }

    if (!profileFieldsAreReady) {
      setIsSaving(false);
      showNotification({
        title: 'CV updated, profile incomplete',
        message: `Complete your ${incompleteProfileFields.join(', ')} to update your full profile.`,
        tone: 'info',
      });
      return;
    }

    setIsSaving(false);
    showNotification({
      title: 'Profile updated successfully',
      message: 'Your profile and CV template changes have been saved.',
      tone: 'success',
    });
    setLoadedProfileSnapshot(profile);
  };

  const hasUnsavedProfileEdits = loadedProfileSnapshot !== null
    && JSON.stringify(profile) !== JSON.stringify(loadedProfileSnapshot);

  const handleImportCv = async () => {
    if (!token || !resumeUrl || cvImportStatus === 'processing') return;

    if (hasUnsavedProfileEdits && !window.confirm('Import this CV?\n\nImporting will replace the current unsaved CV information in the editor. Your previously saved profile will not be affected.')) {
      return;
    }

    setCvImportStatus('processing');
    const result = await request<ResumeImportResponse>({
      method: 'POST',
      endpoint: '/seeker/profile/resume/import',
      token,
    });

    if (!result.ok) {
      const messages: Record<string, string> = {
        RESUME_NOT_FOUND: 'No uploaded CV was found. Please upload your CV first.',
        UNSUPPORTED_RESUME_FORMAT: 'This CV format cannot be imported. Please use PDF or DOCX.',
        DOC_IMPORT_UNSUPPORTED: 'Word .doc files cannot be imported automatically yet. Convert the CV to PDF or DOCX and upload it again.',
        TEXT_EXTRACTION_FAILED: "We couldn't read the CV. Please check that the file is valid and try again.",
        TEXT_EXTRACTION_EMPTY: "We couldn't find readable text in this CV. If it is scanned, automatic import may not be available.",
        RESUME_IMPORT_FAILED: "We couldn't import this CV right now. Please try again.",
        RESUME_IMPORT_RATE_LIMITED: 'Too many import attempts. Please wait a few minutes before trying again.',
      };

      setCvImportStatus('idle');
      showNotification({
        title: 'CV import failed',
        message: messages[result.error.code ?? ''] ?? "We couldn't import this CV right now. Please try again.",
        tone: 'error',
      });
      return;
    }

    const imported = result.data.data.cv;
    const importedLocation = [imported.city, imported.state, imported.country]
      .map((part) => part?.trim() || '')
      .filter(Boolean)
      .join(', ');
    const importedExperience = Array.isArray(imported.experience) ? imported.experience.filter(Boolean).map((item) => ({ ...item, id: item.id || createId('experience') })) : [];
    const importedEducation = Array.isArray(imported.education) ? imported.education.filter(Boolean).map((item) => ({ ...item, id: item.id || createId('education') })) : [];
    const importedCertifications = Array.isArray(imported.certifications) ? imported.certifications.filter(Boolean).map((item) => ({ ...item, id: item.id || createId('certification') })) : [];
    const importedLanguages = Array.isArray(imported.languages) ? imported.languages.filter(Boolean).map((item) => ({ ...item, id: item.id || createId('language') })) : [];
    const importedProjects = Array.isArray(imported.projects) ? imported.projects.filter(Boolean).map((item) => ({ ...item, id: item.id || createId('project') })) : [];
    const importedSkills = Array.isArray(imported.skills) ? [...new Set(imported.skills.map((skill) => skill.trim()).filter(Boolean))] : [];

    setProfile((current) => ({
      ...current,
      personalInfo: {
        ...current.personalInfo,
        fullName: imported.fullName?.trim() || current.personalInfo.fullName,
        title: imported.professionalTitle?.trim() || current.personalInfo.title,
        email: imported.email?.trim() || current.personalInfo.email,
        phone: imported.phone?.trim() || current.personalInfo.phone,
        location: importedLocation || current.personalInfo.location,
        summary: imported.bio?.trim() || current.personalInfo.summary,
        linkedin: imported.linkedinUrl?.trim() || current.personalInfo.linkedin,
      },
      experience: importedExperience.length > 0 ? importedExperience : current.experience,
      education: importedEducation.length > 0 ? importedEducation : current.education,
      skills: importedSkills.length > 0 ? importedSkills : current.skills,
      certifications: importedCertifications.length > 0 ? importedCertifications : current.certifications,
      languages: importedLanguages.length > 0 ? importedLanguages : current.languages,
      projects: importedProjects.length > 0 ? importedProjects : current.projects,
    }));
    setOnboardingLocation((current) => ({
      country: imported.country?.trim() || current.country,
      state: imported.state?.trim() || current.state,
      city: imported.city?.trim() || current.city,
    }));
    setImportedCvData(imported);
    setCvImportWarnings(result.data.data.warnings ?? []);
    setCvImportSourceFormat(result.data.data.source.format ?? null);
    setCvImportStatus('review');
    setCvWorkflowMode('import-review');
    showNotification({
      title: 'CV information imported',
      message: result.data.data.extraction.aiUsed
        ? 'AI-assisted extraction completed. Review the imported information before updating your profile.'
        : 'Review the imported information in the guided editor before updating your profile.',
      tone: 'success',
    });
  };

  const handleEditCvContent = () => {
    if (cvImportStatus === 'review') {
      setCvImportStatus('editing-imported');
      setCvWorkflowMode('imported');
    }
    setActiveStep('personal');
    document.getElementById('seeker-profile-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCvFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const supportedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const supportedExtension = /\.(pdf|doc|docx)$/i.test(file.name);
    if (!supportedTypes.includes(file.type) && !supportedExtension) {
      showNotification({
        title: 'Unsupported file type',
        message: 'Please upload a PDF, DOC, or DOCX file for your CV.',
        tone: 'error',
      });
      event.target.value = '';
      return;
    }

    setUploadedCvFile(file);
    setUploadedCvName(file.name);
    setCvWorkflowMode('uploaded');
    setCvImportStatus('idle');
    setImportedCvData(null);
    setCvImportWarnings([]);
    setCvImportSourceFormat(null);
    showNotification({
      title: 'CV file selected',
      message: `${file.name} is ready to upload with your profile.`,
      tone: 'success',
    });
    console.log('CV_FILE_READY_FOR_BACKEND', {
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    });
  };

  const handleProfilePictureSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      showNotification({ title: 'Invalid profile picture', message: 'Choose a JPEG, PNG, or WebP image under 10 MB.', tone: 'error' });
      event.target.value = '';
      return;
    }
    setProfilePictureFile(file);
    setProfilePictureUrl(URL.createObjectURL(file));
    if (token) {
      setIsUploadingFile(true);
      const result = await uploadSeekerProfilePicture(file, token);
      setIsUploadingFile(false);
      if (result.ok) {
        setProfilePictureUrl(result.data.data.profilePictureUrl ?? null);
        setProfilePictureFile(null);
        showNotification({ title: 'Profile picture updated', message: 'Your profile picture has been uploaded.', tone: 'success' });
      } else {
        showNotification({ title: 'Upload failed', message: result.error.message, tone: 'error' });
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!token || isUploadingFile) return;
    setIsUploadingFile(true);
    const result = await deleteSeekerProfilePicture(token);
    setIsUploadingFile(false);
    if (result.ok) {
      setProfilePictureUrl(null);
      setProfilePictureFile(null);
      showNotification({ title: 'Profile picture removed', message: 'Your profile picture has been removed.', tone: 'success' });
    } else showNotification({ title: 'Remove failed', message: result.error.message, tone: 'error' });
  };

  const handleUploadResume = async () => {
    if (!token || !uploadedCvFile || isUploadingFile) return;
    setIsUploadingFile(true);
    const result = await uploadSeekerResume(uploadedCvFile, token);
    setIsUploadingFile(false);
    if (result.ok) {
      setResumeUrl(result.data.data.resumeUrl ?? null);
      setUploadedCvFile(null);
      setCvWorkflowMode('uploaded');
      setCvImportStatus('idle');
      setImportedCvData(null);
      setCvImportWarnings([]);
      setCvImportSourceFormat(null);
      showNotification({ title: 'Resume uploaded', message: 'Your resume is now attached to your profile.', tone: 'success' });
    } else showNotification({ title: 'Upload failed', message: result.error.message, tone: 'error' });
  };

  const handleRemoveResume = async () => {
    if (!token || isUploadingFile) return;
    setIsUploadingFile(true);
    const result = await deleteSeekerResume(token);
    setIsUploadingFile(false);
    if (result.ok) {
      setResumeUrl(null);
      setUploadedCvName('');
      setCvWorkflowMode('template');
      setCvImportStatus('idle');
      setImportedCvData(null);
      setCvImportWarnings([]);
      setCvImportSourceFormat(null);
      showNotification({ title: 'Resume removed', message: 'Your uploaded resume has been removed.', tone: 'success' });
    } else showNotification({ title: 'Remove failed', message: result.error.message, tone: 'error' });
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
        {isLoadingProfile ? (
          <section className="seeker-card">
            <div className="seeker-cv-summary__content" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ fontSize: '1rem', color: '#666' }}>Loading your profile...</p>
            </div>
          </section>
        ) : profileError ? (
          <section className="seeker-card">
            <div className="seeker-cv-summary__content" style={{ textAlign: 'center', padding: '3rem', color: '#d32f2f' }}>
              <strong style={{ fontSize: '1.1rem' }}>Unable to load profile</strong>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>{profileError}</p>
            </div>
          </section>
        ) : (
          <>
            <section className="seeker-cv-summary seeker-card">
              <div className="seeker-cv-summary__content">
                <span className="seeker-cv-summary__eyebrow">Modern template</span>
                <h2>{profile.personalInfo.fullName || 'Your Profile'}</h2>
                <p>{profile.personalInfo.summary || 'Add a professional summary to your profile.'}</p>
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

            <section className="seeker-card seeker-cv-setup">
              <div className="seeker-cv-setup__content">
                <div>
                  <span className="seeker-cv-summary__eyebrow">CV Setup</span>
                  <h2>Step {currentStepIndex + 1} of {steps.length}</h2>
                  <p>{currentStep.description}</p>
                </div>
                <div className="seeker-cv-progress">
                  <div>
                    <strong>{completionScore}% complete</strong>
                    <span>{completionMessage}</span>
                  </div>
                  <span className="seeker-cv-progress__bar"><i style={{ width: `${completionScore}%` }} /></span>
                </div>
              </div>
            </section>

            <section className="seeker-card seeker-cv-workspace">
              <div className="seeker-cv-workspace__heading">
                <div>
                  <span className="seeker-cv-summary__eyebrow">CV workspace</span>
                  <h2>How do you want to use your CV?</h2>
                  <p>Choose one path. Your structured CV information remains in the guided editor below.</p>
                </div>
              </div>

              <div className="seeker-cv-mode-grid" role="tablist" aria-label="Choose how to create your CV">
                <button type="button" role="tab" aria-selected={cvWorkflowMode === 'uploaded'} className={cvWorkflowMode === 'uploaded' ? 'seeker-cv-mode-card seeker-cv-mode-card--active' : 'seeker-cv-mode-card'} onClick={() => setCvWorkflowMode('uploaded')}>
                  <FaUpload />
                  <strong>Use an existing CV</strong>
                  <span>Upload your existing CV and use it directly, or import its information into a LeamJobs template later.</span>
                </button>
                <button type="button" role="tab" aria-selected={cvWorkflowMode === 'template' || cvWorkflowMode === 'imported' || cvWorkflowMode === 'import-review'} className={cvWorkflowMode === 'template' || cvWorkflowMode === 'imported' || cvWorkflowMode === 'import-review' ? 'seeker-cv-mode-card seeker-cv-mode-card--active' : 'seeker-cv-mode-card'} onClick={() => setCvWorkflowMode(importedCvData ? 'imported' : 'template')}>
                  <FaEdit />
                  <strong>Build with LeamJobs</strong>
                  <span>Create a professional CV using the guided editor and templates.</span>
                </button>
              </div>

              {(cvWorkflowMode === 'uploaded' || uploadedCvFile) && <div className="seeker-cv-upload-box">
              <FaUpload />
              <strong>Already have a CV?</strong>
              <span>Upload your existing CV here. You can use it directly or use its information with the LeamJobs CV template later.</span>
              <div className="seeker-cv-file-controls">
                <div className="seeker-cv-file-actions">
                  <label className="seeker-cv-upload-control">
                    Choose CV
                    <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleCvFileUpload} />
                  </label>
                  <button type="button" className="seeker-cv-upload-action" onClick={handleUploadResume} disabled={!uploadedCvFile || isUploadingFile}>
                    {isUploadingFile ? 'Uploading...' : 'Upload CV'}
                  </button>
                  <button type="button" className="seeker-delete-button seeker-cv-remove-action" onClick={handleRemoveResume} disabled={!resumeUrl || isUploadingFile}>
                    Remove CV
                  </button>
                </div>
                {(uploadedCvFile || resumeUrl) && (
                  <div className="seeker-cv-file-meta" aria-live="polite">
                    <span className="seeker-cv-file-status"><FaCheck /> {uploadedCvName || 'Uploaded CV'}</span>
                    <small>{uploadedCvFile ? 'Ready to upload' : 'Uploaded CV'}</small>
                  </div>
                )}
                {resumeUrl && !uploadedCvFile && (
                  <div className="seeker-cv-workflow-options">
                    <button type="button" className="seeker-cv-workflow-option seeker-cv-workflow-option--active" onClick={() => setCvWorkflowMode('uploaded')}>
                      <strong>Use uploaded CV</strong>
                      <span>Keep using your uploaded CV without converting it.</span>
                    </button>
                    <button type="button" className="seeker-cv-workflow-option" onClick={handleImportCv} disabled={!resumeUrl || cvImportStatus === 'processing'}>
                      <strong>{cvImportStatus === 'processing' ? 'Importing CV...' : 'Import into LeamJobs template'}</strong>
                      <span>Review extracted information before adding it to your LeamJobs CV.</span>
                      {cvImportStatus === 'processing' && <small>Reading your uploaded CV...</small>}
                    </button>
                  </div>
                )}
              </div></div>}

              {(cvWorkflowMode === 'template' || cvWorkflowMode === 'imported' || cvWorkflowMode === 'import-review') && (
                <>
                  <div className="seeker-cv-template-choices" aria-label="CV templates">
                    {TEMPLATES.map((template) => (
                      <button type="button" key={template.id} className={selectedTemplate === template.style ? 'seeker-cv-template-choice seeker-cv-template-choice--active' : 'seeker-cv-template-choice'} onClick={() => setSelectedTemplate(template.style)}>
                        <span>{template.name}</span>
                        <small>{template.description}</small>
                      </button>
                    ))}
                  </div>
                  {cvWorkflowMode === 'imported' && (
                    <div className="seeker-cv-import-status" role="status">
                      <strong>Your CV information has been imported</strong>
                      <span>Review the guided sections below before updating your LeamJobs CV.</span>
                    </div>
                  )}
                  <div id="cv-preview-container" className="seeker-cv-rendered-preview">
                    <CVTemplateRenderer data={{
                      personalInfo: profile.personalInfo,
                      summary: profile.personalInfo.summary,
                      experience: profile.experience,
                      education: profile.education,
                      skills: profile.skills.filter(Boolean),
                      certifications: profile.certifications,
                      languages: profile.languages,
                      projects: profile.projects,
                    }} template={selectedTemplate} />
                  </div>
                  <div className="seeker-cv-workspace__actions">
                    <button type="button" onClick={handleEditCvContent}><FaEdit /> Edit CV content</button>
                    <button type="button" onClick={handleDownloadPDF}><FaDownload /> Download PDF</button>
                  </div>
                </>
              )}

              {cvImportStatus === 'review' && importedCvData && (
                <div className="seeker-cv-import-review">
                  <strong>Information imported from {cvImportSourceFormat?.toUpperCase() || 'your CV'}</strong>
                  <span>Review the information below in the guided editor before updating your LeamJobs profile.</span>
                  {cvImportWarnings.length > 0 && (
                    <ul className="seeker-cv-import-warnings">
                      {cvImportWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  )}
                  <button type="button" className="seeker-cv-import-review__action" onClick={handleEditCvContent}>Review imported information</button>
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
                    <button type="button" onClick={() => updateSubscription(subscriptionUserId, plan.id as SubscriptionPlanId)}>{subscription.planId === plan.id ? 'Current plan' : plan.id === 'free' ? 'Use Free' : `Choose ${plan.name}`}</button>
                  </article>
                ))}
              </div>
              <small className="seeker-subscription-renewal">Current plan: {plans.find((plan) => plan.id === subscription.planId)?.name} / Renewal: {subscription.renewalDate} / Recommendation boost: +{plans.find((plan) => plan.id === subscription.planId)?.visibilityBoost ?? 0}%</small>
            </section>

            <nav id="seeker-profile-editor" className="seeker-cv-steps" aria-label="CV sections">
              {steps.map((step) => (
                <button
                  className={activeStep === step.key ? 'seeker-cv-step--active' : step.key === 'personal' && profile.personalInfo.fullName ? 'seeker-cv-step--done' : ''}
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
                      <div className="seeker-profile-picture-control">
                        <span>Profile Photo</span>
                        {profilePictureUrl ? <img src={profilePictureUrl} alt="Profile" /> : <span aria-hidden="true">{profile.personalInfo.fullName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ME'}</span>}
                        <label className="seeker-cv-upload-control">
                          {isUploadingFile ? 'Uploading...' : 'Upload Photo'}
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePictureSelect} disabled={isUploadingFile} />
                        </label>
                        {profilePictureUrl && <button type="button" onClick={handleRemoveProfilePicture} disabled={isUploadingFile}>Remove picture</button>}
                      </div>
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
                          <input type="url" value={profile.personalInfo.linkedin} onChange={(event) => updatePersonalInfo('linkedin', event.target.value)} />
                        </label>
                      </div>
                    </form>
                    {renderStepControls('personal')}
                  </section>
                )}

                {activeStep === 'summary' && (
                  <section className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading">
                      <div>
                        <h2>Profile Summary</h2>
                        <p>Tell employers a little about yourself, your experience, and the kind of work you do.</p>
                      </div>
                    </div>

                    <form className="seeker-profile-form">
                      <label>
                        <span>Profile Summary</span>
                        <textarea
                          className="seeker-profile-summary"
                          value={profile.personalInfo.summary}
                          rows={6}
                          placeholder="Write a short summary about your work, strengths, and what you are looking for."
                          onChange={(event) => updatePersonalInfo('summary', event.target.value)}
                        />
                      </label>
                    </form>
                    {renderStepControls('summary')}
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

                    {profile.experience.length === 0 ? (
                      <div className="seeker-step-empty-state">
                        <p>No experience yet? You can skip this step and come back later.</p>
                      </div>
                    ) : (
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
                    )}
                    {renderStepControls('experience')}
                  </section>
                )}

                {activeStep === 'education' && (
                  <section className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading">
                      <div><h2>Education</h2><p>Add your education and training.</p></div>
                      <button type="button" aria-label="Add education" onClick={addEducation}><FaPlus /></button>
                    </div>
                    {profile.education.length === 0 ? <div className="seeker-step-empty-state"><p>No education added yet? You can skip this step and return later.</p></div> : (
                      <div className="seeker-form-list">{profile.education.map((item) => (
                        <div className="seeker-form-item" key={item.id}>
                          <div className="seeker-form-item__header"><strong>Education #{profile.education.indexOf(item) + 1}</strong><button type="button" className="seeker-delete-button" onClick={() => removeEducation(item.id)}><FaTrash /></button></div>
                          <form className="seeker-profile-form">
                            <label><span>Degree</span><input type="text" value={item.degree} onChange={(event) => updateEducation(item.id, 'degree', event.target.value)} /></label>
                            <label><span>School</span><input type="text" value={item.school} onChange={(event) => updateEducation(item.id, 'school', event.target.value)} /></label>
                            <label><span>Year</span><input type="text" value={item.year} onChange={(event) => updateEducation(item.id, 'year', event.target.value)} /></label>
                          </form>
                        </div>
                      ))}</div>
                    )}
                    {renderStepControls('education')}
                  </section>
                )}

                {activeStep === 'skills' && (
                  <section className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Skills</h2><p>Highlight the strengths and abilities that matter most to employers.</p></div><button type="button" aria-label="Add skill" onClick={() => openAddPanel('skill')}><FaPlus /></button></div>
                    {addPanel === 'skill' && renderAddPanel('skill')}
                    {profile.skills.length === 0 ? <div className="seeker-step-empty-state"><p>No skills added yet. You can skip this step and return later.</p></div> : <div className="seeker-form-list">{profile.skills.map((skill, index) => <div className="seeker-form-item seeker-form-item--inline" key={`${skill}-${index}`}><input type="text" list="skill-suggestions" value={skill} placeholder="Type a skill or choose a suggestion" onChange={(event) => updateSkill(index, event.target.value)} /><button type="button" className="seeker-delete-button" onClick={() => removeSkill(index)}><FaTrash /></button></div>)}</div>}
                    <datalist id="skill-suggestions">{skillSuggestions.map((skill) => <option value={skill} key={skill} />)}</datalist>
                    {renderStepControls('skills')}
                  </section>
                )}

                {activeStep === 'certifications' && (
                  <section className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Qualifications</h2><p>Show qualifications, awards, and credentials that strengthen your profile.</p></div><button type="button" aria-label="Add qualification" onClick={() => openAddPanel('qualification')}><FaPlus /></button></div>
                    {addPanel === 'qualification' && renderAddPanel('qualification')}
                    {profile.certifications.length === 0 ? <div className="seeker-step-empty-state"><p>No qualifications added yet. You can skip this step for now.</p></div> : <div className="seeker-form-list">{profile.certifications.map((item) => <div className="seeker-form-item" key={item.id}><div className="seeker-form-item__header"><strong>Certification</strong><button type="button" className="seeker-delete-button" onClick={() => removeCertification(item.id)}><FaTrash /></button></div><form className="seeker-profile-form"><label><span>Qualification or Certificate</span><input type="text" list="qualification-suggestions" value={item.name} placeholder="Type a qualification or choose a suggestion" onChange={(event) => updateCertification(item.id, 'name', event.target.value)} /></label><label><span>Issuer</span><input type="text" value={item.issuer} onChange={(event) => updateCertification(item.id, 'issuer', event.target.value)} /></label></form></div>)}</div>}
                    <datalist id="qualification-suggestions">{qualificationSuggestions.map((qualification) => <option value={qualification} key={qualification} />)}</datalist>
                    {renderStepControls('certifications')}
                  </section>
                )}

                {activeStep === 'languages' && (
                  <section className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Languages</h2><p>Add languages you speak and choose your proficiency.</p></div><button type="button" aria-label="Add language" onClick={addLanguage}><FaPlus /></button></div>
                    {profile.languages.length === 0 ? <div className="seeker-step-empty-state"><p>No languages added yet. You can skip this step and return later.</p></div> : <div className="seeker-form-list">{profile.languages.map((item) => <div className="seeker-form-item" key={item.id}><div className="seeker-form-item__header"><strong>Language</strong><button type="button" className="seeker-delete-button" onClick={() => removeLanguage(item.id)}><FaTrash /></button></div><div className="seeker-profile-form__split"><div className="seeker-combobox"><label htmlFor={`language-${item.id}`}>Language</label><input id={`language-${item.id}`} value={languageQueries[item.id] ?? item.name} placeholder="Search or type a language" onFocus={() => setOpenLanguageId(item.id)} onChange={(event) => { setLanguageQueries((current) => ({ ...current, [item.id]: event.target.value })); updateLanguage(item.id, 'name', event.target.value); setOpenLanguageId(item.id); }} onKeyDown={(event) => { const options = getLanguageSuggestions(onboardingLocation.country, languageQueries[item.id] ?? item.name); if (event.key === 'Escape') setOpenLanguageId(null); if (event.key === 'Enter' && options[0]) { event.preventDefault(); selectLanguage(item.id, options[0]); } }} />{openLanguageId === item.id && getLanguageSuggestions(onboardingLocation.country, languageQueries[item.id] ?? item.name).length > 0 && <div className="seeker-combobox__options" role="listbox">{getLanguageSuggestions(onboardingLocation.country, languageQueries[item.id] ?? item.name).map((language) => <button type="button" role="option" key={language} onMouseDown={(event) => event.preventDefault()} onClick={() => selectLanguage(item.id, language)}>{language}</button>)}</div>}</div><label><span>Proficiency</span><select value={item.proficiency} onChange={(event) => updateLanguage(item.id, 'proficiency', event.target.value)}>{['Basic', 'Conversational', 'Professional', 'Fluent', 'Native'].map((level) => <option key={level}>{level}</option>)}</select></label></div></div>)}</div>}
                    {renderStepControls('languages')}
                  </section>
                )}

                {activeStep === 'projects' && (
                  <section className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Projects &amp; Work Samples</h2><p>Show client jobs, creative work, services, repairs, business work, or software projects.</p></div><button type="button" aria-label="Add project" onClick={addProject}><FaPlus /></button></div>
                    {profile.projects.length === 0 ? <div className="seeker-step-empty-state"><p>No work samples yet. You can skip this step and return later.</p></div> : <div className="seeker-form-list">{profile.projects.map((item) => <div className="seeker-form-item" key={item.id}><div className="seeker-form-item__header"><strong>Work Sample</strong><button type="button" className="seeker-delete-button" onClick={() => removeProject(item.id)}><FaTrash /></button></div><form className="seeker-profile-form"><label><span>Work or project name</span><input value={item.name} placeholder="e.g. Bridal Makeup for a Wedding" onChange={(event) => updateProject(item.id, 'name', event.target.value)} /></label><label><span>Description</span><textarea value={item.description} placeholder="Describe what you did and the result." onChange={(event) => updateProject(item.id, 'description', event.target.value)} /></label><label><span>Tools or technologies used (optional)</span><input value={item.technologies.join(', ')} placeholder="Optional: tools, materials, or technologies" onChange={(event) => updateProjectTechnologies(item.id, event.target.value)} /></label><div className="seeker-profile-form__split"><label><span>Work/project link (optional)</span><input type="url" value={item.projectUrl} placeholder="Website, portfolio, social media, or other link" onChange={(event) => updateProject(item.id, 'projectUrl', event.target.value)} /></label><label><span>GitHub URL (optional)</span><input type="url" value={item.githubUrl} onChange={(event) => updateProject(item.id, 'githubUrl', event.target.value)} /></label></div><div className="seeker-profile-form__split"><label><span>Start date (optional)</span><input type="month" value={item.startDate} onChange={(event) => updateProject(item.id, 'startDate', event.target.value)} /></label><label><span>End date (optional)</span><input type="month" value={item.endDate} onChange={(event) => updateProject(item.id, 'endDate', event.target.value)} /></label></div></form></div>)}</div>}
                    {renderStepControls('projects')}
                  </section>
                )}

                {activeStep === 'linkedin' && (
                  <section className="seeker-card seeker-editor-card"><div className="seeker-editor-card__heading"><div><h2>LinkedIn</h2><p>Add your LinkedIn profile so employers can verify your background.</p></div></div><form className="seeker-profile-form"><label><span>LinkedIn profile URL</span><input type="url" value={profile.personalInfo.linkedin} placeholder="https://linkedin.com/in/yourname" onChange={(event) => updatePersonalInfo('linkedin', event.target.value)} /></label></form>{renderStepControls('linkedin')}</section>
                )}

                {activeStep === 'review' && (
                  <section className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading">
                      <div>
                        <h2>Review your CV</h2>
                        <p>Check the main sections of your profile before saving.</p>
                      </div>
                    </div>
                    <div className="seeker-step-review">
                      <div className="seeker-step-review__grid">
                        <div><strong>Personal details</strong>{renderReviewStatus(Boolean(profile.personalInfo.fullName.trim()), profile.personalInfo.fullName || 'Complete')}</div>
                        <div><strong>Summary</strong>{renderReviewStatus(Boolean(profile.personalInfo.summary.trim()), 'Complete')}</div>
                        <div><strong>Experience</strong>{renderReviewStatus(profile.experience.length > 0, `${profile.experience.length} item(s)`)}</div>
                        <div><strong>Education</strong>{renderReviewStatus(profile.education.length > 0, `${profile.education.length} item(s)`)}</div>
                        <div><strong>Skills</strong>{renderReviewStatus(profile.skills.length > 0, `${profile.skills.length} skill(s)`)}</div>
                        <div><strong>Qualifications</strong>{renderReviewStatus(profile.certifications.length > 0, `${profile.certifications.length} item(s)`)}</div>
                        <div><strong>Languages</strong>{renderReviewStatus(profile.languages.length > 0, `${profile.languages.length} language(s)`)}</div>
                        <div><strong>Work samples</strong>{renderReviewStatus(profile.projects.length > 0, `${profile.projects.length} item(s)`)}</div>
                        <div><strong>LinkedIn</strong>{renderReviewStatus(Boolean(profile.personalInfo.linkedin.trim()), 'Complete')}</div>
                      </div>
                    </div>
                    {renderStepControls('review')}
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
          </>
        )}
      </main>

      <div className="seeker-profile-actions">
        <button type="button" onClick={handleUpdateProfile} disabled={isSaving}><FaRegSave /> {isSaving ? 'Updating...' : 'Update Profile'}</button>
      </div>

      {notification && (
        <div
          className={`seeker-profile-toast seeker-profile-toast--${notification.tone}`}
          role="status"
          aria-live="polite"
        >
          <span className="seeker-profile-toast__icon">
            {notification.tone === 'error' ? <FaTimes /> : notification.tone === 'info' ? <FaMagic /> : <FaCheck />}
          </span>
          <div>
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
          </div>
          <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss notification">
            <FaTimes />
          </button>
        </div>
      )}

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
