import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBriefcase,
  FaCalendarAlt,
  FaCheck,
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
import CVTemplateRenderer, { CVData, sampleCVData, type CVTemplateId } from '../../components/cv-templates/CVTemplateRenderer';
import { useAuth } from '../../context/AuthContext';
import { getAccountTypeLabel, useSubscriptions } from '../../context/SubscriptionContext';
import { startSeekerFreeTrial } from '../../services/api';
import {
  getSeekerProfile,
  getSeekerProfilePicture,
  getAiRateLimitCopy,
  isAiRateLimitError,
  request,
  updateSeekerCV,
  updateSeekerProfile,
  uploadSeekerProfilePicture,
  uploadSeekerResume,
  deleteSeekerProfilePicture,
  PROFILE_IMAGE_UPDATED_EVENT,
  deleteSeekerResume,
  type CertificationItem as ApiCertificationItem,
  type EducationItem as ApiEducationItem,
  type ExperienceItem as ApiExperienceItem,
  requestProfileAssistant,
  requestCvOptimizer,
  getAdvancedProfileStrength,
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

type ProfileValidationIssue = {
  path: string;
  message: string;
  displayMessage: string;
  guidance?: string;
  step: StepKey;
};

const validationFieldLabels: Record<string, string> = {
  jobTitle: 'Job title',
  company: 'Company name',
  startDate: 'Start date',
  endDate: 'End date',
  degree: 'Degree',
  school: 'School name',
  year: 'Year',
  name: 'Name',
  issuer: 'Issuer',
  proficiency: 'Proficiency',
  description: 'Description',
  technologies: 'Technologies',
  projectUrl: 'Project URL',
  githubUrl: 'GitHub URL',
  bio: 'Profile summary',
  linkedinUrl: 'LinkedIn URL',
  fullName: 'Full name',
  professionalTitle: 'Professional title',
  country: 'Country',
  state: 'State or region',
  city: 'City',
  skills: 'Skills',
};

const validationSectionLabels: Record<string, { label: string; step: StepKey }> = {
  experience: { label: 'Experience', step: 'experience' },
  education: { label: 'Education', step: 'education' },
  certifications: { label: 'Certification', step: 'certifications' },
  languages: { label: 'Language', step: 'languages' },
  projects: { label: 'Project', step: 'projects' },
  bio: { label: 'Profile summary', step: 'summary' },
  linkedinUrl: { label: 'LinkedIn', step: 'linkedin' },
  fullName: { label: 'Personal details', step: 'personal' },
  professionalTitle: { label: 'Personal details', step: 'personal' },
  country: { label: 'Personal details', step: 'personal' },
  state: { label: 'Personal details', step: 'personal' },
  city: { label: 'Personal details', step: 'personal' },
  skills: { label: 'Skills', step: 'skills' },
};

const humanizeValidationPart = (part: string) => part
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (character) => character.toUpperCase());

const formatProfileValidationIssues = (details: unknown): ProfileValidationIssue[] => {
  const rawIssues = Array.isArray(details)
    ? details
    : details && typeof details === 'object' && Array.isArray((details as { errors?: unknown }).errors)
      ? (details as { errors: unknown[] }).errors
      : [];

  return rawIssues.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const rawPath = String((entry as { field?: unknown }).field ?? '').trim();
    const message = String((entry as { message?: unknown }).message ?? 'Please check this field.').trim();
    if (!rawPath) return [];

    const parts = rawPath.split('.');
    const sectionKey = parts[0];
    const index = /^\d+$/.test(parts[1] ?? '') ? Number(parts[1]) : null;
    const fieldKey = parts[index === null ? 1 : 2] ?? sectionKey;
    const section = validationSectionLabels[sectionKey];
    const fieldLabel = sectionKey === 'certifications' && fieldKey === 'name'
      ? 'Certification name'
      : sectionKey === 'languages' && fieldKey === 'name'
        ? 'Language name'
        : sectionKey === 'projects' && fieldKey === 'name'
          ? 'Project name'
          : validationFieldLabels[fieldKey] ?? humanizeValidationPart(fieldKey);
    const prefix = section
      ? `${section.label}${index === null ? '' : ` ${index + 1}`}`
      : humanizeValidationPart(sectionKey);
    const guidance = rawPath.match(/^experience\.\d+\.endDate$/)
      ? 'Enter an end date, or select “Currently working here” if you still work there.'
      : undefined;
    const messageWithoutField = message.replace(new RegExp(`^${fieldKey.replace(/[A-Z]/g, (character) => ` ${character.toLowerCase()}`)}(?: name)?\\s*`, 'i'), '').trim();

    return [{
      path: rawPath,
      message,
      displayMessage: `${prefix} — ${fieldLabel}${messageWithoutField ? ` ${messageWithoutField}` : ''}`,
      guidance,
      step: section?.step ?? 'personal',
    }];
  });
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
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplateId>('modern');
  const [templateSelectionChanged, setTemplateSelectionChanged] = useState(false);
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
  const [validationIssues, setValidationIssues] = useState<ProfileValidationIssue[]>([]);
  const [isImportConfirmationOpen, setIsImportConfirmationOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(createEmptyProfileState());
  const [loadedProfileSnapshot, setLoadedProfileSnapshot] = useState<ProfileState | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profilePictureBlobUrl, setProfilePictureBlobUrl] = useState<string | null>(null);
  const [profilePictureReloadKey, setProfilePictureReloadKey] = useState(0);
  const [localProfilePictureUrl, setLocalProfilePictureUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [languageQueries, setLanguageQueries] = useState<Record<string, string>>({});
  const [openLanguageId, setOpenLanguageId] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [onboardingLocation, setOnboardingLocation] = useState({ country: '', state: '', city: '' });
  const [addPanel, setAddPanel] = useState<AddPanel>(null);
  const [addValue, setAddValue] = useState('');
  const [aiRequest, setAiRequest] = useState('Improve my profile summary and identify the strongest profile improvements.');
  const [aiSuggestions, setAiSuggestions] = useState<{ section: string; suggestion: string; reason: string }[]>([]);
  const [aiCvSuggestions, setAiCvSuggestions] = useState<{ section: string; original: string; suggested: string; reason: string }[]>([]);
  const [pendingAiSuggestion, setPendingAiSuggestion] = useState<{
    section: string;
    step: StepKey;
    targetId: string;
    value: string;
  } | null>(null);
  const [aiApprovalModal, setAiApprovalModal] = useState<{
    completedSection: StepKey;
    completedLabel: string;
    nextSection: StepKey | 'review';
    nextLabel: string;
    nextTargetId: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiRateLimitModal, setAiRateLimitModal] = useState<{ retryAfterSeconds: number | null } | null>(null);
  const [aiManualOnlyModal, setAiManualOnlyModal] = useState<{ targetId: string; fieldLabel: string } | null>(null);
  const [profileStrength, setProfileStrength] = useState<{ score: number; dimensions: { label: string; score: number; complete: boolean }[]; strengths: string[]; recommendations: string[] } | null>(null);
  const [profileStrengthError, setProfileStrengthError] = useState('');
  const { plans, getSubscription, refresh, trialOffer, currentPlan } = useSubscriptions();
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const aiRateLimitCloseRef = useRef<HTMLButtonElement | null>(null);
  const aiManualOnlyCloseRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  const subscriptionUserId = user?.id || '';
  const subscription = subscriptionUserId ? getSubscription(subscriptionUserId) : { status: 'Expired' as const, planId: 'free', renewalDate: '', advancedCvEligible: false, aiEntitlements: [] as string[], seekerId: '', seekerName: '', email: '', startedAt: 'Not started', featured: false };
  const canonicalEntitlements = Array.isArray(currentPlan?.entitlements) && currentPlan.entitlements.length > 0
    ? currentPlan.entitlements
    : Array.isArray(subscription.aiEntitlements)
      ? subscription.aiEntitlements
      : [];
  const canUseAdvancedCv = canonicalEntitlements.includes('AI_CV_IMPROVEMENT');
  const canUseProfileAssistant = canonicalEntitlements.includes('AI_CV_REVIEW');
  const canUseCvOptimizer = canonicalEntitlements.includes('AI_CV_IMPROVEMENT');
  const canUseProfileStrength = currentPlan?.key?.toUpperCase() === 'PREMIUM' && canonicalEntitlements.includes('PROFILE_STRENGTH');
  const selectedTemplateIsAdvanced = TEMPLATES.find((template) => template.style === selectedTemplate)?.advanced ?? false;
  const renderedTemplate: CVTemplateId = selectedTemplateIsAdvanced && !canUseAdvancedCv ? 'modern' : selectedTemplate;

  const handleStartTrial = async () => {
    if (!token || !trialOffer.available || isStartingTrial) return;
    setIsStartingTrial(true);
    const result = await startSeekerFreeTrial(token);
    if (result.ok) {
      await refresh();
      showNotification({ title: 'Free trial started', message: `Your ${trialOffer.durationDays}-day free trial is now active.`, tone: 'success' });
    } else {
      showNotification({ title: 'Free trial unavailable', message: result.error.message || 'We could not start your free trial.', tone: 'error' });
    }
    setIsStartingTrial(false);
  };

  const handleTemplateSelection = (template: CVTemplateId) => {
    setSelectedTemplate(template);
    setTemplateSelectionChanged(true);
  };

  const runProfileAssistant = async () => {
    if (!token || !canUseProfileAssistant || isAiLoading) return;
    setIsAiLoading(true); setAiError('');
    const result = await requestProfileAssistant({ professionalTitle: profile.personalInfo.title, bio: profile.personalInfo.summary, skills: profile.skills, experience: profile.experience, education: profile.education, request: aiRequest }, token);
    setIsAiLoading(false);
    if (handleAiRateLimitResult(result)) return;
    if (result.ok) setAiSuggestions(result.data.data.suggestions);
    else setAiError(result.error.message || 'AI assistance is unavailable.');
  };

  const runCvOptimizer = async () => {
    if (!token || !canUseCvOptimizer || isAiLoading) return;
    setIsAiLoading(true); setAiError('');
    const cv = { personalInfo: profile.personalInfo, summary: profile.personalInfo.summary, experience: profile.experience, education: profile.education, skills: profile.skills, certifications: profile.certifications, languages: profile.languages, projects: profile.projects };
    const result = await requestCvOptimizer({ cv, request: 'Suggest concise, achievement-oriented improvements without inventing facts.' }, token);
    setIsAiLoading(false);
    if (handleAiRateLimitResult(result)) return;
    if (result.ok) setAiCvSuggestions(result.data.data.suggestions);
    else setAiError(result.error.message || 'AI assistance is unavailable.');
  };

  useEffect(() => {
    if (!token || !canUseProfileStrength) return;
    let isMounted = true;
    void getAdvancedProfileStrength(token).then((result) => {
      if (!isMounted) return;
      if (result.ok) setProfileStrength(result.data.data);
      else setProfileStrengthError(result.error.message || 'Advanced profile strength is unavailable.');
    });
    return () => { isMounted = false; };
  }, [token, canUseProfileStrength]);

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
      setTemplateSelectionChanged(false);
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
    if (!token || !profilePictureUrl) {
      setProfilePictureBlobUrl(null);
      return undefined;
    }

    let objectUrl: string | null = null;
    let isMounted = true;
    setProfilePictureBlobUrl(null);
    const loadPicture = async () => {
      const response = await getSeekerProfilePicture(token);
      if (!response.ok || !isMounted) return;
      objectUrl = URL.createObjectURL(response.data);
      setProfilePictureBlobUrl(objectUrl);
    };

    void loadPicture();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profilePictureReloadKey, profilePictureUrl, token]);

  useEffect(() => {
    return () => {
      if (localProfilePictureUrl && localProfilePictureUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localProfilePictureUrl);
      }
    };
  }, [localProfilePictureUrl]);

  useEffect(() => {
    if (!notification) return undefined;

    const timeout = window.setTimeout(() => setNotification(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  useEffect(() => {
    if (!isImportConfirmationOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImportConfirmationOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isImportConfirmationOpen]);

  useEffect(() => {
    if (!aiRateLimitModal) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAiRateLimitModal(null);
    };

    const focusTimer = window.setTimeout(() => {
      aiRateLimitCloseRef.current?.focus();
    }, 0);

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [aiRateLimitModal]);

  useEffect(() => {
    if (!aiManualOnlyModal) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAiManualOnlyModal(null);
    };

    const focusTimer = window.setTimeout(() => {
      aiManualOnlyCloseRef.current?.focus();
    }, 0);

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [aiManualOnlyModal]);

  const showNotification = (nextNotification: ProfileNotification) => {
    setNotification(nextNotification);
  };

  const handleAiRateLimitResult = <T,>(result: { ok: boolean; status: number; error?: { retryAfterSeconds?: number | null; code?: string; message?: string } }) => {
    if (!result.ok && isAiRateLimitError(result.status, result.error)) {
      setPendingAiSuggestion(null);
      setAiError('');
      setAiRateLimitModal({ retryAfterSeconds: result.error?.retryAfterSeconds ?? null });
      return true;
    }
    return false;
  };

  const getManualOnlyAiTarget = (section: string): { step: StepKey; targetId: string; fieldLabel: string } | null => {
    const normalized = section.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!normalized) return null;

    const manualOnlyTargetMap: Record<string, { step: StepKey; targetId: string; fieldLabel: string }> = {
      'full name': { step: 'personal', targetId: 'profile-full-name-field', fieldLabel: 'Full Name' },
      'email': { step: 'personal', targetId: 'profile-email-field', fieldLabel: 'Email' },
      'phone': { step: 'personal', targetId: 'profile-phone-field', fieldLabel: 'Phone' },
      'location': { step: 'personal', targetId: 'profile-location-field', fieldLabel: 'Location' },
      'linkedin': { step: 'linkedin', targetId: 'linkedin-field', fieldLabel: 'LinkedIn profile URL' },
      'linked in': { step: 'linkedin', targetId: 'linkedin-field', fieldLabel: 'LinkedIn profile URL' },
      education: { step: 'education', targetId: primaryEducationId, fieldLabel: 'Education details' },
      'certification': { step: 'certifications', targetId: primaryCertificationId, fieldLabel: 'Qualification or certificate' },
      'certifications': { step: 'certifications', targetId: primaryCertificationId, fieldLabel: 'Qualification or certificate' },
      qualification: { step: 'certifications', targetId: primaryCertificationId, fieldLabel: 'Qualification or certificate' },
      qualifications: { step: 'certifications', targetId: primaryCertificationId, fieldLabel: 'Qualification or certificate' },
      language: { step: 'languages', targetId: primaryLanguageId, fieldLabel: 'Language' },
      languages: { step: 'languages', targetId: primaryLanguageId, fieldLabel: 'Language' },
    };

    return manualOnlyTargetMap[normalized] ?? null;
  };

  const focusTargetField = (targetId: string) => {
    window.setTimeout(() => {
      const target = document.getElementById(targetId) as HTMLElement | null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus();
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const end = target.value.length;
        target.setSelectionRange(end, end);
      }
    }, 60);
  };

  const openManualOnlyAiModal = (section: string) => {
    const target = getManualOnlyAiTarget(section);
    if (!target) return;
    setPendingAiSuggestion(null);
    setAiManualOnlyModal({ targetId: target.targetId, fieldLabel: target.fieldLabel });
    setActiveStep(target.step);
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

  const primaryExperienceId = profile.experience[0]?.id ? `experience-description-${profile.experience[0].id}` : 'experience-root';
  const primaryEducationId = profile.education[0]?.id ? `education-degree-${profile.education[0].id}` : 'education-root';
  const primarySkillId = profile.skills.length > 0 ? 'skill-input-0' : 'skills-root';
  const primaryCertificationId = profile.certifications[0]?.id ? `certification-name-${profile.certifications[0].id}` : 'certifications-root';
  const primaryLanguageId = profile.languages[0]?.id ? `language-name-${profile.languages[0].id}` : 'languages-root';
  const primaryProjectId = profile.projects[0]?.id ? `project-description-${profile.projects[0].id}` : 'projects-root';

  const resolveAiEditorTarget = (section: string): { step: StepKey; targetId: string } | null => {
    const normalized = section.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!normalized) return null;

    const matchMap: Record<string, { step: StepKey; targetId: string }> = {
      bio: { step: 'summary', targetId: 'profile-summary-field' },
      summary: { step: 'summary', targetId: 'profile-summary-field' },
      'profile summary': { step: 'summary', targetId: 'profile-summary-field' },
      title: { step: 'personal', targetId: 'profile-title-field' },
      'professional title': { step: 'personal', targetId: 'profile-title-field' },
      experience: { step: 'experience', targetId: primaryExperienceId },
      'work experience': { step: 'experience', targetId: primaryExperienceId },
      education: { step: 'education', targetId: primaryEducationId },
      skills: { step: 'skills', targetId: primarySkillId },
      qualifications: { step: 'certifications', targetId: primaryCertificationId },
      certification: { step: 'certifications', targetId: primaryCertificationId },
      certifications: { step: 'certifications', targetId: primaryCertificationId },
      languages: { step: 'languages', targetId: primaryLanguageId },
      projects: { step: 'projects', targetId: primaryProjectId },
      linkedin: { step: 'linkedin', targetId: 'linkedin-field' },
      'linked in': { step: 'linkedin', targetId: 'linkedin-field' },
    };

    return matchMap[normalized] ?? null;
  };

  const profileSectionLabels: Record<StepKey, string> = {
    personal: 'Personal Details',
    summary: 'Profile Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    certifications: 'Qualifications',
    languages: 'Languages',
    projects: 'Projects',
    linkedin: 'LinkedIn',
    review: 'Review',
  };

  const profileStepCompletionOrder: StepKey[] = ['personal', 'summary', 'experience', 'education', 'skills', 'certifications', 'languages', 'projects', 'linkedin', 'review'];
  const optionalProfileSections: StepKey[] = ['certifications', 'languages', 'projects'];

  const profileSectionUpdateCount = useMemo(() => {
    return profileStepCompletionOrder
      .filter((step) => step !== 'review')
      .filter((step) => {
        const status = getProfileSectionCompletionStatus(step, profile);
        return status === 'EMPTY' || status === 'INCOMPLETE';
      }).length;
  }, [profile]);

  const profileSectionUpdateText = profileSectionUpdateCount === 0
    ? 'No sections need updates'
    : profileSectionUpdateCount === 1
      ? '1 section needs update'
      : `${profileSectionUpdateCount} sections need updates`;

  const getProfileSectionTargetId = (stepKey: StepKey, profileState: ProfileState): string => {
    switch (stepKey) {
      case 'personal':
        return 'profile-title-field';
      case 'summary':
        return 'profile-summary-field';
      case 'experience':
        return profileState.experience[0]?.id ? `experience-description-${profileState.experience[0].id}` : 'experience-root';
      case 'education':
        return profileState.education[0]?.id ? `education-degree-${profileState.education[0].id}` : 'education-root';
      case 'skills':
        return profileState.skills.length > 0 ? 'skill-input-0' : 'skills-root';
      case 'certifications':
        return profileState.certifications[0]?.id ? `certification-name-${profileState.certifications[0].id}` : 'certifications-root';
      case 'languages':
        return profileState.languages[0]?.id ? `language-name-${profileState.languages[0].id}` : 'languages-root';
      case 'projects':
        return profileState.projects[0]?.id ? `project-description-${profileState.projects[0].id}` : 'projects-root';
      case 'linkedin':
        return 'linkedin-field';
      case 'review':
        return 'review';
      default:
        return 'profile-title-field';
    }
  };

  const getProfileSectionCompletionStatus = (stepKey: StepKey, profileState: ProfileState): 'EMPTY' | 'INCOMPLETE' | 'COMPLETE' => {
    switch (stepKey) {
      case 'personal': {
        const personalFields = [
          profileState.personalInfo.fullName.trim(),
          profileState.personalInfo.email.trim(),
          profileState.personalInfo.phone.trim(),
          profileState.personalInfo.location.trim(),
        ].filter(Boolean);
        if (personalFields.length === 0) return 'EMPTY';
        return personalFields.length >= 2 ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'summary': {
        const summary = profileState.personalInfo.summary.trim();
        if (!summary) return 'EMPTY';
        return summary.length < 80 ? 'INCOMPLETE' : 'COMPLETE';
      }
      case 'experience': {
        if (profileState.experience.length === 0) return 'EMPTY';
        const hasMeaningfulExperience = profileState.experience.some((item) => item.jobTitle.trim() && item.company.trim() && item.description.trim());
        return hasMeaningfulExperience ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'education': {
        if (profileState.education.length === 0) return 'EMPTY';
        const hasMeaningfulEducation = profileState.education.some((item) => item.degree.trim() || item.school.trim() || item.year.trim());
        return hasMeaningfulEducation ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'skills': {
        const skills = profileState.skills.map((skill) => skill.trim()).filter(Boolean);
        if (skills.length === 0) return 'EMPTY';
        return skills.length >= 3 ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'certifications': {
        if (profileState.certifications.length === 0) return 'EMPTY';
        const hasMeaningfulCertification = profileState.certifications.some((item) => item.name.trim() || item.issuer.trim());
        return hasMeaningfulCertification ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'languages': {
        if (profileState.languages.length === 0) return 'EMPTY';
        const hasMeaningfulLanguage = profileState.languages.some((item) => item.name.trim() && item.proficiency);
        return hasMeaningfulLanguage ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'projects': {
        if (profileState.projects.length === 0) return 'EMPTY';
        const hasMeaningfulProject = profileState.projects.some((item) => item.name.trim() || item.description.trim() || item.projectUrl.trim());
        return hasMeaningfulProject ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'linkedin': {
        const linkedin = profileState.personalInfo.linkedin.trim();
        if (!linkedin) return 'EMPTY';
        return /^https?:\/\/.+/i.test(linkedin) ? 'COMPLETE' : 'INCOMPLETE';
      }
      case 'review':
        return 'COMPLETE';
      default:
        return 'EMPTY';
    }
  };

  const getNextIncompleteProfileSection = (startingFrom: StepKey | null, profileState: ProfileState = profile): StepKey | 'review' => {
    const startIndex = startingFrom ? profileStepCompletionOrder.indexOf(startingFrom) : -1;

    let checked = 0;
    while (checked < profileStepCompletionOrder.length) {
      const index = startIndex === -1
        ? checked
        : (startIndex + 1 + checked) % profileStepCompletionOrder.length;
      const step = profileStepCompletionOrder[index];
      checked += 1;

      if (step === 'review') {
        const requiredSections: StepKey[] = ['personal', 'summary', 'experience', 'education', 'skills', 'linkedin'];
        const allRequiredComplete = requiredSections.every((section) => getProfileSectionCompletionStatus(section, profileState) === 'COMPLETE');
        const optionalSectionsComplete = optionalProfileSections.every((section) => {
          const status = getProfileSectionCompletionStatus(section, profileState);
          return status === 'COMPLETE' || status === 'EMPTY';
        });
        if (allRequiredComplete && optionalSectionsComplete) return 'review';
        continue;
      }

      const status = getProfileSectionCompletionStatus(step, profileState);
      if (status === 'COMPLETE') continue;
      if (optionalProfileSections.includes(step) && status === 'EMPTY') continue;
      return step;
    }

    return 'review';
  };

  const applyAiSuggestionToProfile = (current: ProfileState, section: string, value: string): ProfileState => {
    const normalized = section.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!normalized) return current;

    if (normalized === 'bio' || normalized === 'summary' || normalized === 'profile summary') {
      return {
        ...current,
        personalInfo: { ...current.personalInfo, summary: value },
      };
    }

    if (normalized === 'title' || normalized === 'professional title') {
      return {
        ...current,
        personalInfo: { ...current.personalInfo, title: value },
      };
    }

    if (normalized === 'experience' || normalized === 'work experience') {
      if (current.experience.length === 0) {
        return {
          ...current,
          experience: [{
            id: createId('experience'),
            jobTitle: '',
            company: '',
            startDate: '',
            endDate: '',
            currentlyWorking: false,
            description: value,
          }],
        };
      }

      return {
        ...current,
        experience: current.experience.map((item, index) => (index === 0 ? { ...item, description: value } : item)),
      };
    }

    if (normalized === 'education') {
      if (current.education.length === 0) {
        return {
          ...current,
          education: [{
            id: createId('education'),
            degree: value,
            school: '',
            year: '',
          }],
        };
      }

      return {
        ...current,
        education: current.education.map((item, index) => (index === 0 ? { ...item, degree: value } : item)),
      };
    }

    if (normalized === 'skills') {
      const nextSkills = value
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
      return { ...current, skills: nextSkills.length > 0 ? nextSkills : current.skills };
    }

    if (normalized === 'qualification' || normalized === 'qualifications' || normalized === 'certification' || normalized === 'certifications') {
      return {
        ...current,
        certifications: current.certifications.length > 0
          ? current.certifications.map((item, index) => (index === 0 ? { ...item, name: value } : item))
          : [{ id: createId('cert'), name: value, issuer: '' }],
      };
    }

    if (normalized === 'languages') {
      return {
        ...current,
        languages: current.languages.length > 0
          ? current.languages.map((item, index) => (index === 0 ? { ...item, name: value } : item))
          : [{ id: createId('language'), name: value, proficiency: 'Conversational' }],
      };
    }

    if (normalized === 'projects') {
      return {
        ...current,
        projects: current.projects.length > 0
          ? current.projects.map((item, index) => (index === 0 ? { ...item, description: value } : item))
          : [{ id: createId('project'), name: '', description: value, technologies: [], projectUrl: '', githubUrl: '', startDate: '', endDate: '' }],
      };
    }

    if (normalized === 'linkedin' || normalized === 'linked in') {
      return {
        ...current,
        personalInfo: { ...current.personalInfo, linkedin: value },
      };
    }

    return current;
  };

  const applyAiSuggestionToSection = (section: string, value: string) => {
    setProfile((current) => applyAiSuggestionToProfile(current, section, value));
  };

  const handleSuggestionUse = (section: string, value: string) => {
    if (getManualOnlyAiTarget(section)) {
      openManualOnlyAiModal(section);
      return;
    }

    const target = resolveAiEditorTarget(section);
    if (!target) {
      applyAiSuggestionToSection(section, value);
      return;
    }

    setPendingAiSuggestion({ section, step: target.step, targetId: target.targetId, value });
    setActiveStep(target.step);
    window.setTimeout(() => {
      const field = document.getElementById(target.targetId) as HTMLElement | null;
      const previousFocus = document.activeElement as HTMLElement | null;
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (field) {
        field.focus();
        if ('setSelectionRange' in field && typeof field.setSelectionRange === 'function') {
          const inputField = field as HTMLInputElement | HTMLTextAreaElement;
          inputField.setSelectionRange(inputField.value.length, inputField.value.length);
        }
      }
      if (previousFocus && previousFocus !== document.activeElement && target.step === 'personal') {
        previousFocus.focus();
      }
    }, 60);
  };

  const handleAiApprovalNext = () => {
    if (!aiApprovalModal) return;

    setAiApprovalModal(null);

    if (aiApprovalModal.nextSection === 'review') {
      setActiveStep('review');
      return;
    }

    setActiveStep(aiApprovalModal.nextSection);
    window.setTimeout(() => {
      const target = document.getElementById(aiApprovalModal.nextTargetId) as HTMLElement | null;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus();
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const end = target.value.length;
        target.setSelectionRange(end, end);
      }
    }, 80);
  };

  const applyPendingAiSuggestion = () => {
    if (!pendingAiSuggestion) return;

    const updatedProfile = applyAiSuggestionToProfile(profile, pendingAiSuggestion.section, pendingAiSuggestion.value);
    const completedSectionKey = pendingAiSuggestion.step;
    const completedLabel = profileSectionLabels[completedSectionKey] ?? pendingAiSuggestion.section;
    const nextSection = getNextIncompleteProfileSection(completedSectionKey, updatedProfile);
    const nextLabel = nextSection === 'review' ? 'Review Profile' : profileSectionLabels[nextSection];

    setProfile(updatedProfile);
    setPendingAiSuggestion(null);
    setAiApprovalModal({
      completedSection: completedSectionKey,
      completedLabel,
      nextSection,
      nextLabel,
      nextTargetId: nextSection === 'review' ? 'review' : getProfileSectionTargetId(nextSection, updatedProfile),
    });
  };

  const renderAiPreview = (targetId: string, stepKey: StepKey) => {
    if (!pendingAiSuggestion || pendingAiSuggestion.targetId !== targetId || activeStep !== stepKey) return null;

    return (
      <div className="seeker-ai-inline-preview">
        <div className="seeker-ai-inline-preview__header">
          <strong>AI suggestion</strong>
          <span>{pendingAiSuggestion.section}</span>
        </div>
        <p>{pendingAiSuggestion.value}</p>
        <div className="seeker-ai-inline-preview__actions">
          <button type="button" className="seeker-inline-ai-button seeker-inline-ai-button--primary" onClick={applyPendingAiSuggestion}>Use This AI Content</button>
          <button type="button" className="seeker-inline-ai-button" onClick={() => setPendingAiSuggestion(null)}>Keep My Version</button>
        </div>
      </div>
    );
  };

  const startOptimizeProfileFlow = () => {
    setPendingAiSuggestion(null);
    setAiError('');
    setActiveStep('personal');
    document.getElementById('seeker-profile-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const generateAiSuggestionForSection = async (section: 'summary' | 'title' | 'experience' | 'education' | 'skills' | 'certifications' | 'languages' | 'projects' | 'linkedin') => {
    if (!token || !canUseProfileAssistant) return;

    if (getManualOnlyAiTarget(section)) {
      openManualOnlyAiModal(section);
      return;
    }

    const requestBySection: Record<typeof section, string> = {
      summary: 'Improve my profile summary to be clear, professional, and grounded only in my actual experience.',
      title: 'Give me a professional job title that reflects my skills and experience without inventing facts.',
      experience: 'Improve this work experience description to sound clearer, more professional, and more achievement-focused without inventing facts.',
      education: 'Improve this education entry to be clearer and more professional while preserving the actual facts.',
      skills: 'Suggest a concise, relevant set of professional skills based only on the seeker profile and experience.',
      certifications: 'Suggest relevant professional certifications or qualifications based only on the profile and current experience.',
      languages: 'Suggest a polished language entry and professional proficiency label based only on the profile.',
      projects: 'Improve this project or work sample description to sound more polished and outcome-focused without inventing facts.',
      linkedin: 'Help me craft a clear, professional LinkedIn profile value without inventing qualifications or achievements.',
    };

    const response = await requestProfileAssistant({
      professionalTitle: profile.personalInfo.title,
      bio: profile.personalInfo.summary,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
      request: requestBySection[section],
    }, token);

    if (handleAiRateLimitResult(response)) return;
    if (!response.ok) {
      setAiError(response.error.message || 'AI assistance is unavailable.');
      return;
    }

    const suggestions = response.data.data.suggestions ?? [];
    const allowedSections = {
      summary: ['summary', 'bio', 'profile summary'],
      title: ['title', 'professional title'],
      experience: ['experience', 'work experience', 'role description', 'job description'],
      education: ['education'],
      skills: ['skills'],
      certifications: ['certifications', 'qualification', 'qualifications', 'certification'],
      languages: ['languages', 'language'],
      projects: ['projects', 'project', 'work sample'],
      linkedin: ['linkedin', 'linked in'],
    } satisfies Record<typeof section, string[]>;

    const nextSuggestion = suggestions.find((item) => {
      const normalized = item.section.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      return allowedSections[section].includes(normalized);
    }) ?? suggestions[0];

    if (!nextSuggestion) {
      setAiError('AI returned no field-specific suggestion for this section.');
      return;
    }

    const suggestedSection = nextSuggestion.section || section;
    const manualOnlyTarget = getManualOnlyAiTarget(suggestedSection);
    if (manualOnlyTarget) {
      openManualOnlyAiModal(suggestedSection);
      return;
    }

    const target = resolveAiEditorTarget(suggestedSection);
    if (!target) {
      setAiError('This field cannot currently be opened directly from AI suggestions.');
      return;
    }

    setPendingAiSuggestion({
      section: suggestedSection,
      step: target.step,
      targetId: target.targetId,
      value: nextSuggestion.suggestion,
    });
    setActiveStep(target.step);
    window.setTimeout(() => {
      const field = document.getElementById(target.targetId) as HTMLElement | null;
      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus();
    }, 60);
  };

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
          <button type="button" className="seeker-step-button seeker-step-button--primary" onClick={isFinalStep ? handleUpdateProfile : () => goToStep(1)} disabled={isFinalStep && isSaving} aria-busy={isFinalStep && isSaving}>
            {isFinalStep && isSaving ? <span className="leamjobs-spinner" aria-hidden="true" /> : null}
            {isFinalStep ? (isSaving ? 'Updating...' : 'Finish Optimization') : 'Continue'}
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

  const getValidationIssue = (path: string) => validationIssues.find((issue) => issue.path === path);

  const renderValidationMessage = (path: string) => {
    const issue = getValidationIssue(path);
    if (!issue) return null;
    return <span className="seeker-field-error" id={`${path.replace(/[^a-z0-9]+/gi, '-')}-error`}><span>{issue.message}</span>{issue.guidance && <small>{issue.guidance}</small>}</span>;
  };

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

    setValidationIssues([]);

    const fullNameParts = profile.personalInfo.fullName.trim().split(/\s+/).filter(Boolean);
    if (fullNameParts.length < 2) {
      showNotification({
        title: 'Name required',
        message: 'Enter your first and last name before saving your profile.',
        tone: 'error',
      });
      return;
    }

    const shouldPersistTemplate = canUseAdvancedCv || !selectedTemplateIsAdvanced || templateSelectionChanged;
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
      ...(shouldPersistTemplate ? { cvTemplate: selectedTemplate } : {}),
    };

    setIsSaving(true);
    const cvResult = await updateSeekerCV(cvPayload, token);

    if (!cvResult.ok) {
      setIsSaving(false);
      const issues = cvResult.status === 400 ? formatProfileValidationIssues(cvResult.error.details) : [];
      if (issues.length > 0) {
        setValidationIssues(issues);
        setActiveStep(issues[0].step);
      }
      const message = issues.length > 0
        ? 'Review the highlighted fields and correct them before saving.'
        : cvResult.status === 400
          ? 'Please check the profile fields and try again.'
        : cvResult.status === 401
          ? 'Your session has expired. Please sign in again.'
          : cvResult.status === 403
            ? 'You do not have permission to update this profile.'
            : 'We could not save your CV right now. Please try again.';
      showNotification({ title: issues.length > 0 ? 'Please fix the following before saving' : 'Save failed', message, tone: 'error' });
      return;
    }

    setTemplateSelectionChanged(false);

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
        const issues = profileResult.status === 400 ? formatProfileValidationIssues(profileResult.error.details) : [];
        if (issues.length > 0) {
          setValidationIssues(issues);
          setActiveStep(issues[0].step);
        }
        const message = issues.length > 0
          ? 'Review the highlighted fields and correct them before saving.'
          : profileResult.status === 400
            ? 'Your personal profile fields are incomplete or invalid.'
          : profileResult.status === 401
            ? 'Your session has expired. Please sign in again.'
            : profileResult.status === 403
              ? 'You do not have permission to update this profile.'
              : 'Your CV was saved, but personal details could not be updated.';
        showNotification({ title: issues.length > 0 ? 'Please fix the following before saving' : 'Partial save', message, tone: 'error' });
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

  const startCvImport = async () => {
    if (!token || !resumeUrl || cvImportStatus === 'processing') return;

    setIsImportConfirmationOpen(false);
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

  const handleImportCv = () => {
    if (!token || !resumeUrl || cvImportStatus === 'processing') return;
    if (hasUnsavedProfileEdits) {
      setIsImportConfirmationOpen(true);
      return;
    }
    void startCvImport();
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

    if (localProfilePictureUrl && localProfilePictureUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localProfilePictureUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setProfilePictureFile(file);
    setLocalProfilePictureUrl(previewUrl);

    if (token) {
      setIsUploadingFile(true);
      const result = await uploadSeekerProfilePicture(file, token);
      setIsUploadingFile(false);
      if (result.ok) {
        setProfilePictureUrl(result.data.data.profilePictureUrl ?? null);
        setProfilePictureBlobUrl(null);
        setProfilePictureReloadKey((current) => current + 1);
        setProfilePictureFile(null);
        setLocalProfilePictureUrl(null);
        window.dispatchEvent(new Event(PROFILE_IMAGE_UPDATED_EVENT));
        showNotification({ title: 'Profile picture updated', message: 'Your profile picture has been uploaded.', tone: 'success' });
      } else {
        setLocalProfilePictureUrl(null);
        showNotification({ title: 'Upload failed', message: result.error.message, tone: 'error' });
      }
    }
    event.target.value = '';
  };

  const handleRemoveProfilePicture = async () => {
    if (!token || isUploadingFile) return;
    setIsUploadingFile(true);
    const result = await deleteSeekerProfilePicture(token);
    setIsUploadingFile(false);
    if (result.ok) {
      setProfilePictureUrl(null);
      setProfilePictureBlobUrl(null);
      setProfilePictureFile(null);
      setLocalProfilePictureUrl(null);
      window.dispatchEvent(new Event(PROFILE_IMAGE_UPDATED_EVENT));
      showNotification({ title: 'Profile picture removed', message: 'Your profile picture has been removed.', tone: 'success' });
    } else showNotification({ title: 'Remove failed', message: result.error.message, tone: 'error' });
  };
  const displayProfilePictureUrl = localProfilePictureUrl ?? profilePictureBlobUrl;
  const hasProfilePicture = Boolean(localProfilePictureUrl || profilePictureUrl);

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
          <div className="seeker-profile-skeleton" role="status" aria-live="polite" aria-label="Loading your profile">
            <span className="sr-only">Loading your profile</span>
            <section className="seeker-card seeker-profile-skeleton__summary" aria-hidden="true">
              <span className="leamjobs-skeleton-circle seeker-profile-skeleton__avatar" />
              <div className="seeker-profile-skeleton__lines">
                <span className="leamjobs-skeleton-line" style={{ width: '40%', height: '1.2rem' }} />
                <span className="leamjobs-skeleton-line" style={{ width: '75%' }} />
                <span className="leamjobs-skeleton-line" style={{ width: '55%' }} />
              </div>
            </section>
            <section className="seeker-card leamjobs-skeleton-block seeker-profile-skeleton__block" aria-hidden="true" />
            <div className="seeker-profile-skeleton__grid" aria-hidden="true">
              <div className="seeker-card leamjobs-skeleton-block seeker-profile-skeleton__card" />
              <div className="seeker-card leamjobs-skeleton-block seeker-profile-skeleton__card" />
              <div className="seeker-card leamjobs-skeleton-block seeker-profile-skeleton__card" />
              <div className="seeker-card leamjobs-skeleton-block seeker-profile-skeleton__card" />
            </div>
          </div>
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
                    <span>{profileSectionUpdateText}</span>
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
                  <button type="button" className="seeker-cv-upload-action" onClick={handleUploadResume} disabled={!uploadedCvFile || isUploadingFile} aria-busy={isUploadingFile}>
                    {isUploadingFile ? <span className="leamjobs-spinner" aria-hidden="true" /> : null}
                    {isUploadingFile ? 'Uploading...' : 'Upload CV'}
                  </button>
                  <button type="button" className="seeker-delete-button seeker-cv-remove-action" onClick={handleRemoveResume} disabled={!resumeUrl || isUploadingFile}>
                    Remove CV
                  </button>
                </div>
                {(uploadedCvFile || resumeUrl) && (
                  <div className="seeker-cv-file-meta" aria-live="polite">
                    <span className="seeker-cv-file-status"><FaCheck /> {uploadedCvName || 'Uploaded resume'}</span>
                    {uploadedCvFile && <small>Ready to upload</small>}
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
                    {TEMPLATES.filter((template) => !template.advanced).map((template) => (
                      <button type="button" key={template.id} className={selectedTemplate === template.style ? 'seeker-cv-template-choice seeker-cv-template-choice--active' : 'seeker-cv-template-choice'} onClick={() => handleTemplateSelection(template.style)}>
                        <span>{template.name}</span>
                        <small>{template.description}</small>
                      </button>
                    ))}
                  </div>
                  <div className="seeker-cv-advanced-templates" aria-labelledby="advanced-cv-designs-title">
                    <div className="seeker-cv-advanced-templates__heading">
                      <div>
                        <span className="seeker-cv-summary__eyebrow">Advanced CV</span>
                        <h3 id="advanced-cv-designs-title">Advanced CV designs</h3>
                        <p>Premium presentation options for a more tailored CV.</p>
                      </div>
                      {!canUseAdvancedCv ? <div className="seeker-cv-advanced-templates__actions"><span className="seeker-cv-advanced-templates__locked">Requires Advanced CV</span><button type="button" onClick={() => navigate('/seeker/subscription')}>View plans</button></div> : null}
                    </div>
                    <div className="seeker-cv-template-choices seeker-cv-template-choices--advanced">
                      {TEMPLATES.filter((template) => template.advanced).map((template) => (
                        <button
                          type="button"
                          key={template.id}
                          disabled={!canUseAdvancedCv}
                          aria-label={canUseAdvancedCv ? `Use ${template.name} CV design` : `${template.name} requires Advanced CV`}
                          className={`${selectedTemplate === template.style && canUseAdvancedCv ? 'seeker-cv-template-choice seeker-cv-template-choice--active' : 'seeker-cv-template-choice'}${!canUseAdvancedCv ? ' seeker-cv-template-choice--locked' : ''}`}
                          onClick={() => handleTemplateSelection(template.style)}
                        >
                          <span className="seeker-cv-template-thumb" aria-hidden="true"><CVTemplateRenderer data={sampleCVData} template={template.style} /></span>
                          <span>{template.name}</span>
                          <small>{canUseAdvancedCv ? template.description : 'Available with an eligible subscription'}</small>
                        </button>
                      ))}
                    </div>
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
                    }} template={renderedTemplate} />
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

            {canUseProfileStrength ? <section className="seeker-card seeker-profile-strength" aria-labelledby="profile-strength-title">
              <div className="seeker-ai-panel__heading"><div><span className="seeker-cv-summary__eyebrow">Advanced profile</span><h2 id="profile-strength-title">Profile strength</h2><p>Measured from the information currently in your profile.</p></div>{profileStrength ? <strong className="seeker-profile-strength__score">{profileStrength.score}%</strong> : null}</div>
              {profileStrengthError ? <p role="alert" className="seeker-ai-panel__error">{profileStrengthError}</p> : null}
              {profileStrength ? <><div className="seeker-profile-strength__grid">{profileStrength.dimensions.map((dimension) => <div key={dimension.label}><span>{dimension.label}</span><strong>{dimension.complete ? 'Complete' : 'Needs attention'}</strong></div>)}</div>{profileStrength.recommendations.length ? <ul className="seeker-profile-strength__recommendations">{profileStrength.recommendations.slice(0, 4).map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul> : <p className="seeker-profile-strength__complete">Your profile covers all measured dimensions.</p>}</> : <p role="status">Calculating your profile strength...</p>}
            </section> : null}

            <section className="seeker-card seeker-ai-panel" aria-labelledby="ai-profile-tools-title">
              <div className="seeker-ai-panel__heading">
                <div><span className="seeker-cv-summary__eyebrow">Premium AI</span><h2 id="ai-profile-tools-title">Profile and CV guidance</h2><p>Review suggestions before changing your profile or CV.</p></div>
                {(!canUseProfileAssistant && !canUseCvOptimizer) ? <span className="seeker-cv-advanced-templates__locked">Premium feature</span> : null}
              </div>
              <label className="seeker-ai-panel__request"><span>What would you like help with?</span><textarea value={aiRequest} onChange={(event) => setAiRequest(event.target.value)} maxLength={500} rows={2} disabled={!canUseProfileAssistant && !canUseCvOptimizer} /></label>
              <div className="seeker-ai-panel__actions">
                <button type="button" onClick={startOptimizeProfileFlow} disabled={isAiLoading}>Optimize Profile</button>
                <button type="button" onClick={() => void runProfileAssistant()} disabled={!canUseProfileAssistant || isAiLoading}>{isAiLoading ? 'Thinking...' : 'Improve profile'}</button>
                <button type="button" onClick={() => void runCvOptimizer()} disabled={!canUseCvOptimizer || isAiLoading}>Optimize CV</button>
              </div>
              {aiError ? <p role="alert" className="seeker-ai-panel__error">{aiError}</p> : null}
              {aiSuggestions.length > 0 ? <div className="seeker-ai-panel__results"><h3>Profile suggestions</h3>{aiSuggestions.map((item, index) => <article key={`${item.section}-${index}`}><strong>{item.section}</strong><p>{item.suggestion}</p><small>{item.reason}</small><button type="button" onClick={() => handleSuggestionUse(item.section, item.suggestion)}>Use in editor</button></article>)}</div> : null}
              {aiCvSuggestions.length > 0 ? <div className="seeker-ai-panel__results"><h3>CV suggestions</h3>{aiCvSuggestions.map((item, index) => <article key={`${item.section}-${index}`}><strong>{item.section}</strong><p>{item.suggested}</p><small>{item.reason}</small><button type="button" onClick={() => handleSuggestionUse(item.section, item.suggested)}>Use in editor</button></article>)}</div> : null}
            </section>

            <section className="seeker-card seeker-profile-account-card" aria-labelledby="profile-account-heading">
              <div className="seeker-profile-account-card__content">
                <div>
                  <span className="seeker-cv-summary__eyebrow">Account</span>
                  <h2 id="profile-account-heading">{getAccountTypeLabel(currentPlan?.key ?? subscription.planId ?? 'free', 'Basic') === 'Basic' ? 'Upgrade Account' : 'Manage Subscription'}</h2>
                  <p>Review your account plan and manage your LeamJobs subscription from one place.</p>
                </div>
                {trialOffer.available ? (
                  <button type="button" className="seeker-profile-account-card__action seeker-profile-account-card__action--trial" onClick={() => void handleStartTrial()} disabled={isStartingTrial}>
                    {isStartingTrial ? 'Starting trial…' : `Start ${trialOffer.durationDays}-day free trial`}
                  </button>
                ) : (
                  <button type="button" className="seeker-profile-account-card__action" onClick={() => navigate('/seeker/subscription')}>
                    {getAccountTypeLabel(currentPlan?.key ?? subscription.planId ?? 'free', 'Basic') === 'Basic' ? 'Upgrade Account' : 'Manage Subscription'}
                  </button>
                )}
              </div>
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

            {validationIssues.length > 0 && (
              <section className="seeker-profile-validation-summary" role="alert" aria-labelledby="profile-validation-title">
                <strong id="profile-validation-title">Please fix the following before saving:</strong>
                <ul>
                  {validationIssues.map((issue, index) => <li key={`${issue.path}-${index}`}>{issue.displayMessage}{issue.guidance && <small>{issue.guidance}</small>}</li>)}
                </ul>
              </section>
            )}

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
                        <span className="seeker-profile-picture-control__label">Profile Photo</span>
                        <div className="seeker-profile-picture-preview">
                          {displayProfilePictureUrl ? <img src={displayProfilePictureUrl} alt="Profile" /> : <span aria-hidden="true">{profile.personalInfo.fullName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ME'}</span>}
                        </div>
                        <div className="seeker-profile-picture-actions">
                          <label className="seeker-profile-upload-button" aria-busy={isUploadingFile}>
                            {isUploadingFile ? <span className="leamjobs-spinner leamjobs-spinner--accent" aria-hidden="true" /> : null}
                            {isUploadingFile ? 'Uploading...' : 'Upload Photo'}
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePictureSelect} disabled={isUploadingFile} />
                          </label>
                          {hasProfilePicture && <button type="button" className="seeker-profile-remove-button" onClick={handleRemoveProfilePicture} disabled={isUploadingFile}>Remove picture</button>}
                        </div>
                      </div>
                      <label>
                        <span>Full Name</span>
                        <input id="profile-full-name-field" type="text" value={profile.personalInfo.fullName} onChange={(event) => updatePersonalInfo('fullName', event.target.value)} />
                      </label>
                      <label htmlFor="profile-title-field">
                        <span className="seeker-field-header">
                          <span>Professional Title</span>
                          <button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('title')}>✨ Use AI</button>
                        </span>
                        <input id="profile-title-field" type="text" value={profile.personalInfo.title} onChange={(event) => updatePersonalInfo('title', event.target.value)} />
                      </label>
                      {renderAiPreview('profile-title-field', 'personal')}
                      <div className="seeker-profile-form__split">
                        <label>
                          <span>Email</span>
                          <input id="profile-email-field" type="email" value={profile.personalInfo.email} onChange={(event) => updatePersonalInfo('email', event.target.value)} />
                        </label>
                        <label>
                          <span>Phone</span>
                          <input id="profile-phone-field" type="tel" value={profile.personalInfo.phone} onChange={(event) => updatePersonalInfo('phone', event.target.value)} />
                        </label>
                      </div>
                      <div className="seeker-profile-form__split">
                        <label>
                          <span>Location</span>
                          <input id="profile-location-field" type="text" value={profile.personalInfo.location} onChange={(event) => updatePersonalInfo('location', event.target.value)} />
                        </label>
                        <label>
                          <span>LinkedIn</span>
                          <input id="linkedin-field" type="url" value={profile.personalInfo.linkedin} onChange={(event) => updatePersonalInfo('linkedin', event.target.value)} />
                        </label>
                      </div>
                    </form>
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
                      <label htmlFor="profile-summary-field">
                        <span className="seeker-field-header">
                          <span>Profile Summary</span>
                          <button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('summary')}>✨ Improve with AI</button>
                        </span>
                        <textarea
                          id="profile-summary-field"
                          className="seeker-profile-summary"
                          value={profile.personalInfo.summary}
                          rows={6}
                          placeholder="Write a short summary about your work, strengths, and what you are looking for."
                          onChange={(event) => updatePersonalInfo('summary', event.target.value)}
                        />
                      </label>
                      {renderAiPreview('profile-summary-field', 'summary')}
                    </form>
                  </section>
                )}

                {activeStep === 'experience' && (
                  <section id="experience-root" className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading">
                      <div>
                        <h2>Experience</h2>
                        <p>Add your work experience in reverse chronological order.</p>
                      </div>
                      <button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('experience')}>✨ Improve with AI</button>
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
                              <label className={getValidationIssue(`experience.${profile.experience.indexOf(item)}.jobTitle`) ? 'seeker-field--invalid' : ''}>
                                <span>Job Title</span>
                                <input type="text" value={item.jobTitle} aria-invalid={Boolean(getValidationIssue(`experience.${profile.experience.indexOf(item)}.jobTitle`))} aria-describedby={getValidationIssue(`experience.${profile.experience.indexOf(item)}.jobTitle`) ? `experience-${profile.experience.indexOf(item)}-jobTitle-error` : undefined} onChange={(event) => updateExperience(item.id, 'jobTitle', event.target.value)} />
                                {renderValidationMessage(`experience.${profile.experience.indexOf(item)}.jobTitle`)}
                              </label>
                              <label className={getValidationIssue(`experience.${profile.experience.indexOf(item)}.company`) ? 'seeker-field--invalid' : ''}>
                                <span>Company</span>
                                <input type="text" value={item.company} aria-invalid={Boolean(getValidationIssue(`experience.${profile.experience.indexOf(item)}.company`))} aria-describedby={getValidationIssue(`experience.${profile.experience.indexOf(item)}.company`) ? `experience-${profile.experience.indexOf(item)}-company-error` : undefined} onChange={(event) => updateExperience(item.id, 'company', event.target.value)} />
                                {renderValidationMessage(`experience.${profile.experience.indexOf(item)}.company`)}
                              </label>
                              <div className="seeker-profile-form__split">
                                <label className={getValidationIssue(`experience.${profile.experience.indexOf(item)}.startDate`) ? 'seeker-field--invalid' : ''}>
                                  <span>Start Date</span>
                                  <div className="seeker-date-input">
                                    <input type="text" value={item.startDate} aria-invalid={Boolean(getValidationIssue(`experience.${profile.experience.indexOf(item)}.startDate`))} aria-describedby={getValidationIssue(`experience.${profile.experience.indexOf(item)}.startDate`) ? `experience-${profile.experience.indexOf(item)}-startDate-error` : undefined} onChange={(event) => updateExperience(item.id, 'startDate', event.target.value)} />
                                    <FaCalendarAlt />
                                  </div>
                                  {renderValidationMessage(`experience.${profile.experience.indexOf(item)}.startDate`)}
                                </label>
                                <label className={getValidationIssue(`experience.${profile.experience.indexOf(item)}.endDate`) ? 'seeker-field--invalid' : ''}>
                                  <span>End Date</span>
                                  <div className="seeker-date-input">
                                    <input type="text" value={item.endDate} aria-invalid={Boolean(getValidationIssue(`experience.${profile.experience.indexOf(item)}.endDate`))} aria-describedby={getValidationIssue(`experience.${profile.experience.indexOf(item)}.endDate`) ? `experience-${profile.experience.indexOf(item)}-endDate-error` : undefined} onChange={(event) => updateExperience(item.id, 'endDate', event.target.value)} disabled={item.currentlyWorking} />
                                    <FaCalendarAlt />
                                  </div>
                                  {renderValidationMessage(`experience.${profile.experience.indexOf(item)}.endDate`)}
                                </label>
                              </div>
                              <label className="seeker-profile-check">
                                <input type="checkbox" checked={item.currentlyWorking} onChange={(event) => updateExperience(item.id, 'currentlyWorking', event.target.checked)} />
                                <span>I currently work here</span>
                              </label>
                              <label>
                                <span className="seeker-field-header">
                                  <span>Job Description</span>
                                  <button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('experience')}>✨ Improve with AI</button>
                                </span>
                                <div className="seeker-rich-editor">
                                  <div className="seeker-rich-editor__toolbar" aria-label="Formatting toolbar">
                                    <strong>B</strong>
                                    <em>I</em>
                                    <u>U</u>
                                    <span>•</span>
                                    <span>1.</span>
                                    <FaEdit />
                                  </div>
                                  <textarea id={`experience-description-${item.id}`} value={item.description} onChange={(event) => updateExperience(item.id, 'description', event.target.value)} />
                                </div>
                              </label>
                              {renderAiPreview(profile.experience[0]?.id ? `experience-description-${profile.experience[0].id}` : 'experience-root', 'experience')}
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeStep === 'education' && (
                  <section id="education-root" className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading">
                      <div><h2>Education</h2><p>Add your education and training.</p></div>
                      <div className="seeker-editor-card__tools">
                        <button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('education')}>✨ Improve with AI</button>
                        <button type="button" aria-label="Add education" onClick={addEducation}><FaPlus /></button>
                      </div>
                    </div>
                    {profile.education.length === 0 ? <div className="seeker-step-empty-state"><p>No education added yet? You can skip this step and return later.</p></div> : (
                      <div className="seeker-form-list">{profile.education.map((item) => (
                        <div className="seeker-form-item" key={item.id}>
                          <div className="seeker-form-item__header"><strong>Education #{profile.education.indexOf(item) + 1}</strong><button type="button" className="seeker-delete-button" onClick={() => removeEducation(item.id)}><FaTrash /></button></div>
                          <form className="seeker-profile-form">
                            <label className={getValidationIssue(`education.${profile.education.indexOf(item)}.degree`) ? 'seeker-field--invalid' : ''}><span>Degree</span><input id={`education-degree-${item.id}`} type="text" value={item.degree} aria-invalid={Boolean(getValidationIssue(`education.${profile.education.indexOf(item)}.degree`))} onChange={(event) => updateEducation(item.id, 'degree', event.target.value)} />{renderValidationMessage(`education.${profile.education.indexOf(item)}.degree`)}</label>
                            <label className={getValidationIssue(`education.${profile.education.indexOf(item)}.school`) ? 'seeker-field--invalid' : ''}><span>School</span><input type="text" value={item.school} aria-invalid={Boolean(getValidationIssue(`education.${profile.education.indexOf(item)}.school`))} onChange={(event) => updateEducation(item.id, 'school', event.target.value)} />{renderValidationMessage(`education.${profile.education.indexOf(item)}.school`)}</label>
                            <label className={getValidationIssue(`education.${profile.education.indexOf(item)}.year`) ? 'seeker-field--invalid' : ''}><span>Year</span><input type="text" value={item.year} aria-invalid={Boolean(getValidationIssue(`education.${profile.education.indexOf(item)}.year`))} onChange={(event) => updateEducation(item.id, 'year', event.target.value)} />{renderValidationMessage(`education.${profile.education.indexOf(item)}.year`)}</label>
                          </form>
                          {renderAiPreview(profile.education[0]?.id ? `education-degree-${profile.education[0].id}` : 'education-root', 'education')}
                        </div>
                      ))}</div>
                    )}
                  </section>
                )}

                {activeStep === 'skills' && (
                  <section id="skills-root" className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Skills</h2><p>Highlight the strengths and abilities that matter most to employers.</p></div><div className="seeker-editor-card__tools"><button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('skills')}>✨ Suggest Skills</button><button type="button" aria-label="Add skill" onClick={() => openAddPanel('skill')}><FaPlus /></button></div></div>
                    {addPanel === 'skill' && renderAddPanel('skill')}
                    {profile.skills.length === 0 ? <div className="seeker-step-empty-state"><p>No skills added yet. You can skip this step and return later.</p></div> : <div className="seeker-form-list">{profile.skills.map((skill, index) => <div className="seeker-form-item seeker-form-item--inline" key={`${skill}-${index}`}><input id={index === 0 ? 'skill-input-0' : undefined} type="text" list="skill-suggestions" value={skill} placeholder="Type a skill or choose a suggestion" onChange={(event) => updateSkill(index, event.target.value)} /><button type="button" className="seeker-delete-button" onClick={() => removeSkill(index)}><FaTrash /></button></div>)}</div>}
                    {renderAiPreview(profile.skills.length > 0 ? 'skill-input-0' : 'skills-root', 'skills')}
                    <datalist id="skill-suggestions">{skillSuggestions.map((skill) => <option value={skill} key={skill} />)}</datalist>
                  </section>
                )}

                {activeStep === 'certifications' && (
                  <section id="certifications-root" className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Qualifications</h2><p>Show qualifications, awards, and credentials that strengthen your profile.</p></div><div className="seeker-editor-card__tools"><button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('certifications')}>✨ Improve with AI</button><button type="button" aria-label="Add qualification" onClick={() => openAddPanel('qualification')}><FaPlus /></button></div></div>
                    {addPanel === 'qualification' && renderAddPanel('qualification')}
                    {profile.certifications.length === 0 ? <div className="seeker-step-empty-state"><p>No qualifications added yet. You can skip this step for now.</p></div> : <div className="seeker-form-list">{profile.certifications.map((item) => <div className="seeker-form-item" key={item.id}><div className="seeker-form-item__header"><strong>Certification</strong><button type="button" className="seeker-delete-button" onClick={() => removeCertification(item.id)}><FaTrash /></button></div><form className="seeker-profile-form"><label className={getValidationIssue(`certifications.${profile.certifications.indexOf(item)}.name`) ? 'seeker-field--invalid' : ''}><span>Qualification or Certificate</span><input id={profile.certifications.indexOf(item) === 0 ? `certification-name-${item.id}` : undefined} type="text" list="qualification-suggestions" value={item.name} placeholder="Type a qualification or choose a suggestion" aria-invalid={Boolean(getValidationIssue(`certifications.${profile.certifications.indexOf(item)}.name`))} onChange={(event) => updateCertification(item.id, 'name', event.target.value)} />{renderValidationMessage(`certifications.${profile.certifications.indexOf(item)}.name`)}</label><label className={getValidationIssue(`certifications.${profile.certifications.indexOf(item)}.issuer`) ? 'seeker-field--invalid' : ''}><span>Issuer</span><input type="text" value={item.issuer} aria-invalid={Boolean(getValidationIssue(`certifications.${profile.certifications.indexOf(item)}.issuer`))} onChange={(event) => updateCertification(item.id, 'issuer', event.target.value)} />{renderValidationMessage(`certifications.${profile.certifications.indexOf(item)}.issuer`)}</label></form></div>)}</div>}
                    {renderAiPreview(profile.certifications[0]?.id ? `certification-name-${profile.certifications[0].id}` : 'certifications-root', 'certifications')}
                    <datalist id="qualification-suggestions">{qualificationSuggestions.map((qualification) => <option value={qualification} key={qualification} />)}</datalist>
                  </section>
                )}

                {activeStep === 'languages' && (
                  <section id="languages-root" className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Languages</h2><p>Add languages you speak and choose your proficiency.</p></div><button type="button" aria-label="Add language" onClick={addLanguage}><FaPlus /></button></div>
                    {profile.languages.length === 0 ? <div className="seeker-step-empty-state"><p>No languages added yet. You can skip this step and return later.</p></div> : <div className="seeker-form-list">{profile.languages.map((item) => <div className="seeker-form-item" key={item.id}><div className="seeker-form-item__header"><strong>Language</strong><button type="button" className="seeker-delete-button" onClick={() => removeLanguage(item.id)}><FaTrash /></button></div><div className="seeker-profile-form__split"><div className={`seeker-combobox ${getValidationIssue(`languages.${profile.languages.indexOf(item)}.name`) ? 'seeker-field--invalid' : ''}`}><label htmlFor={`language-${item.id}`}>Language</label><input id={profile.languages.indexOf(item) === 0 ? `language-name-${item.id}` : `language-${item.id}`} value={languageQueries[item.id] ?? item.name} placeholder="Search or type a language" aria-invalid={Boolean(getValidationIssue(`languages.${profile.languages.indexOf(item)}.name`))} onFocus={() => setOpenLanguageId(item.id)} onChange={(event) => { setLanguageQueries((current) => ({ ...current, [item.id]: event.target.value })); updateLanguage(item.id, 'name', event.target.value); setOpenLanguageId(item.id); }} onKeyDown={(event) => { const options = getLanguageSuggestions(onboardingLocation.country, languageQueries[item.id] ?? item.name); if (event.key === 'Escape') setOpenLanguageId(null); if (event.key === 'Enter' && options[0]) { event.preventDefault(); selectLanguage(item.id, options[0]); } }} />{openLanguageId === item.id && getLanguageSuggestions(onboardingLocation.country, languageQueries[item.id] ?? item.name).length > 0 && <div className="seeker-combobox__options" role="listbox">{getLanguageSuggestions(onboardingLocation.country, languageQueries[item.id] ?? item.name).map((language) => <button type="button" role="option" key={language} onMouseDown={(event) => event.preventDefault()} onClick={() => selectLanguage(item.id, language)}>{language}</button>)}</div>}{renderValidationMessage(`languages.${profile.languages.indexOf(item)}.name`)}</div><label className={getValidationIssue(`languages.${profile.languages.indexOf(item)}.proficiency`) ? 'seeker-field--invalid' : ''}><span>Proficiency</span><select value={item.proficiency} aria-invalid={Boolean(getValidationIssue(`languages.${profile.languages.indexOf(item)}.proficiency`))} onChange={(event) => updateLanguage(item.id, 'proficiency', event.target.value)}>{['Basic', 'Conversational', 'Professional', 'Fluent', 'Native'].map((level) => <option key={level}>{level}</option>)}</select>{renderValidationMessage(`languages.${profile.languages.indexOf(item)}.proficiency`)}</label></div></div>)}</div>}
                    {renderAiPreview(primaryLanguageId, 'languages')}
                  </section>
                )}

                {activeStep === 'projects' && (
                  <section id="projects-root" className="seeker-card seeker-editor-card">
                    <div className="seeker-editor-card__heading"><div><h2>Projects &amp; Work Samples</h2><p>Show client jobs, creative work, services, repairs, business work, or software projects.</p></div><button type="button" aria-label="Add project" onClick={addProject}><FaPlus /></button></div>
                    {profile.projects.length === 0 ? <div className="seeker-step-empty-state"><p>No work samples yet. You can skip this step and return later.</p></div> : <div className="seeker-form-list">{profile.projects.map((item) => <div className="seeker-form-item" key={item.id}><div className="seeker-form-item__header"><strong>Work Sample</strong><button type="button" className="seeker-delete-button" onClick={() => removeProject(item.id)}><FaTrash /></button></div><form className="seeker-profile-form"><label className={getValidationIssue(`projects.${profile.projects.indexOf(item)}.name`) ? 'seeker-field--invalid' : ''}><span>Work or project name</span><input value={item.name} placeholder="e.g. Bridal Makeup for a Wedding" aria-invalid={Boolean(getValidationIssue(`projects.${profile.projects.indexOf(item)}.name`))} onChange={(event) => updateProject(item.id, 'name', event.target.value)} />{renderValidationMessage(`projects.${profile.projects.indexOf(item)}.name`)}</label><label><span>Description</span><textarea id={profile.projects.indexOf(item) === 0 ? `project-description-${item.id}` : undefined} value={item.description} placeholder="Describe what you did and the result." onChange={(event) => updateProject(item.id, 'description', event.target.value)} /></label><label><span>Tools or technologies used (optional)</span><input value={item.technologies.join(', ')} placeholder="Optional: tools, materials, or technologies" onChange={(event) => updateProjectTechnologies(item.id, event.target.value)} /></label><div className="seeker-profile-form__split"><label><span>Work/project link (optional)</span><input type="url" value={item.projectUrl} placeholder="Website, portfolio, social media, or other link" onChange={(event) => updateProject(item.id, 'projectUrl', event.target.value)} /></label><label><span>GitHub URL (optional)</span><input type="url" value={item.githubUrl} onChange={(event) => updateProject(item.id, 'githubUrl', event.target.value)} /></label></div><div className="seeker-profile-form__split"><label><span>Start date (optional)</span><input type="month" value={item.startDate} onChange={(event) => updateProject(item.id, 'startDate', event.target.value)} /></label><label><span>End date (optional)</span><input type="month" value={item.endDate} onChange={(event) => updateProject(item.id, 'endDate', event.target.value)} /></label></div></form></div>)}</div>}
                    {renderAiPreview(primaryProjectId, 'projects')}
                  </section>
                )}

                {activeStep === 'linkedin' && (
                  <section className="seeker-card seeker-editor-card"><div className="seeker-editor-card__heading"><div><h2>LinkedIn</h2><p>Add your LinkedIn profile so employers can verify your background.</p></div><button type="button" className="seeker-inline-ai-button" onClick={() => void generateAiSuggestionForSection('linkedin')}>✨ Improve with AI</button></div><form className="seeker-profile-form"><label htmlFor="linkedin-field"><span>LinkedIn profile URL</span><input id="linkedin-field" type="url" value={profile.personalInfo.linkedin} placeholder="https://linkedin.com/in/yourname" onChange={(event) => updatePersonalInfo('linkedin', event.target.value)} /></label>{renderAiPreview('linkedin-field', 'linkedin')}</form></section>
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
            {renderStepControls(activeStep)}
          </>
        )}
      </main>

      <div className="seeker-profile-actions">
        <button type="button" onClick={handleUpdateProfile} disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? <span className="leamjobs-spinner" aria-hidden="true" /> : <FaRegSave />} {isSaving ? 'Updating...' : 'Update Profile'}
        </button>
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

      {isImportConfirmationOpen && (
        <div
          className="seeker-profile-confirmation-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsImportConfirmationOpen(false);
          }}
        >
          <section className="seeker-profile-confirmation" role="dialog" aria-modal="true" aria-labelledby="import-confirmation-title" aria-describedby="import-confirmation-message">
            <div>
              <span className="seeker-cv-summary__eyebrow">CV import</span>
              <h2 id="import-confirmation-title">Replace your current CV information?</h2>
              <p id="import-confirmation-message">Importing this CV will replace the CV information currently being edited. Your previously saved profile will not be affected.</p>
            </div>
            <div className="seeker-profile-confirmation__actions">
              <button type="button" className="seeker-step-button seeker-step-button--secondary" onClick={() => setIsImportConfirmationOpen(false)}>Cancel</button>
              <button type="button" className="seeker-step-button seeker-step-button--primary" onClick={() => void startCvImport()} disabled={cvImportStatus === 'processing'}>Import CV</button>
            </div>
          </section>
        </div>
      )}

      {aiApprovalModal && (
        <div
          className="seeker-ai-success-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAiApprovalModal(null);
          }}
        >
          <section className="seeker-ai-success-modal" role="dialog" aria-modal="true" aria-labelledby="profile-ai-success-title">
            <div className="seeker-ai-success-modal__icon" aria-hidden="true">✓</div>
            <div className="seeker-ai-success-modal__content">
              <span className="seeker-cv-summary__eyebrow">Profile updated</span>
              <h2 id="profile-ai-success-title">{aiApprovalModal.nextSection === 'review' ? 'Your profile is ready for review' : 'Profile updated'}</h2>
              <p>
                {aiApprovalModal.nextSection === 'review'
                  ? 'Your key profile sections are complete enough for review.'
                  : `${aiApprovalModal.completedLabel} has been updated with your approved AI content.`}
              </p>
              {aiApprovalModal.nextSection !== 'review' ? (
                <div className="seeker-ai-success-modal__next">
                  <span>Next recommended</span>
                  <strong>{aiApprovalModal.nextLabel}</strong>
                </div>
              ) : (
                <div className="seeker-ai-success-modal__next">
                  <span>Review</span>
                  <strong>Review Profile</strong>
                </div>
              )}
            </div>
            <div className="seeker-ai-success-modal__actions">
              <button type="button" className="seeker-step-button seeker-step-button--secondary" onClick={() => setAiApprovalModal(null)}>
                {aiApprovalModal.nextSection === 'review' ? 'Continue Editing' : 'Skip'}
              </button>
              <button type="button" className="seeker-step-button seeker-step-button--primary" onClick={handleAiApprovalNext}>
                {aiApprovalModal.nextSection === 'review' ? 'Review Profile' : 'Next →'}
              </button>
            </div>
          </section>
        </div>
      )}

      {aiRateLimitModal && (() => {
        const rateLimitCopy = getAiRateLimitCopy(aiRateLimitModal.retryAfterSeconds);
        return (
          <div
            className="seeker-ai-rate-limit-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setAiRateLimitModal(null);
            }}
          >
            <section className="seeker-ai-rate-limit-modal" role="dialog" aria-modal="true" aria-labelledby="ai-rate-limit-title">
              <div className="seeker-ai-rate-limit-modal__icon" aria-hidden="true">⏱</div>
              <div className="seeker-ai-rate-limit-modal__content">
                <span className="seeker-cv-summary__eyebrow">AI cooldown</span>
                <h2 id="ai-rate-limit-title">{rateLimitCopy.title}</h2>
                <p>{rateLimitCopy.description}</p>
                <p className="seeker-ai-rate-limit-modal__detail">{rateLimitCopy.detail}</p>
              </div>
              <div className="seeker-ai-rate-limit-modal__actions">
                <button type="button" ref={aiRateLimitCloseRef} className="seeker-step-button seeker-step-button--primary" onClick={() => setAiRateLimitModal(null)}>Got it</button>
              </div>
            </section>
          </div>
        );
      })()}

      {aiManualOnlyModal && (
        <div
          className="seeker-ai-manual-only-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAiManualOnlyModal(null);
          }}
        >
          <section className="seeker-ai-manual-only-modal" role="dialog" aria-modal="true" aria-labelledby="ai-manual-only-title">
            <div className="seeker-ai-manual-only-modal__icon" aria-hidden="true">⚠</div>
            <div className="seeker-ai-manual-only-modal__content">
              <span className="seeker-cv-summary__eyebrow">Manual field</span>
              <h2 id="ai-manual-only-title">This field is best kept manual</h2>
              <p>{aiManualOnlyModal.fieldLabel} is factual profile information, so AI should not rewrite it for you. Update it yourself to keep the details accurate.</p>
            </div>
            <div className="seeker-ai-manual-only-modal__actions">
              <button type="button" className="seeker-step-button seeker-step-button--secondary" onClick={() => setAiManualOnlyModal(null)}>Close</button>
              <button
                type="button"
                ref={aiManualOnlyCloseRef}
                className="seeker-step-button seeker-step-button--primary"
                onClick={() => {
                  setAiManualOnlyModal(null);
                  focusTargetField(aiManualOnlyModal.targetId);
                }}
              >
                Edit Manually
              </button>
            </div>
          </section>
        </div>
      )}

      <CVTemplateSelector
        isOpen={isTemplateModalOpen}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={(template) => handleTemplateSelection(template as CVTemplateId)}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
}

export default ProfilePage;
