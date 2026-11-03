import type { EmployerApplicant } from '../services/api';
import {
  type CVData,
  type CVTemplateId,
} from '../components/cv-templates/CVTemplateRenderer';

export const CURRENT_CV_TEMPLATE_VERSION = '1';

type ApplicationCvInfo = {
  resume?: {
    available?: boolean;
    source?: 'application' | 'profile' | 'template' | null;
    isHistorical?: boolean;
    unavailableReason?: 'storage_reference_missing' | null;
    submittedAt?: string | null;
    version?: string | null;
  } | null;
  cvSnapshot?: {
    templateId?: string | null;
    templateVersion?: string | null;
    snapshotCapturedAt?: string | null;
    snapshot?: CVData | null;
  } | null;
} | null | undefined;

type ApplicationCvView = {
  available: boolean;
  source: 'application' | 'profile' | 'template' | null;
  isHistorical: boolean;
  unavailableReason: 'storage_reference_missing' | null;
  submittedAt: string | null;
  version: string | null;
  template: CVTemplateId;
  templateData: CVData | null;
  templateVersionSupported: boolean;
};

export const cvTemplateId = (value: string | null | undefined): CVTemplateId => {
  switch (value) {
    case 'modern':
    case 'professional':
    case 'creative':
    case 'minimalist':
    case 'executive':
    case 'ats':
    case 'compact':
      return value;
    default:
      return 'modern';
  }
};

const asArray = <T>(value: T[] | null | undefined): T[] => Array.isArray(value) ? value : [];
const isCvData = (value: unknown): value is CVData => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<CVData>;
  return Boolean(data.personalInfo
    && typeof data.personalInfo === 'object'
    && Array.isArray(data.experience)
    && Array.isArray(data.education)
    && Array.isArray(data.skills)
    && Array.isArray(data.certifications));
};

export const currentProfileCvData = (applicant: Partial<EmployerApplicant> | null | undefined): CVData => ({
  personalInfo: {
    fullName: applicant?.fullName ?? '',
    title: applicant?.professionalTitle || 'Professional',
    email: applicant?.email ?? '',
    phone: applicant?.phone ?? undefined,
    location: applicant?.location ?? undefined,
    linkedin: applicant?.linkedinUrl ?? undefined,
    website: applicant?.website ?? undefined,
  },
  summary: applicant?.bio ?? '',
  experience: asArray(applicant?.experience).map((item) => ({
    jobTitle: item.jobTitle || '',
    company: item.company || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    currentlyWorking: Boolean(item.currentlyWorking),
    description: item.description || '',
  })),
  education: asArray(applicant?.education).map((item) => ({
    degree: item.degree || '',
    school: item.school || '',
    year: item.year || '',
    details: item.details || '',
  })),
  skills: asArray(applicant?.skills),
  certifications: asArray(applicant?.certifications).map((item) => ({
    name: item.name || '',
    issuer: item.issuer || '',
  })),
  languages: asArray(applicant?.languages).map((item) => ({
    name: item.name || '',
    proficiency: item.proficiency || '',
  })),
  projects: asArray(applicant?.projects).map((item) => ({
    name: item.name || '',
    description: item.description || '',
    technologies: asArray(item.technologies),
    projectUrl: item.projectUrl || '',
    githubUrl: item.githubUrl || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
  })),
});

export const resolveApplicationCvView = (
  application: ApplicationCvInfo,
  applicant?: Partial<EmployerApplicant> | null,
): ApplicationCvView => {
  const snapshot = application?.cvSnapshot;
  if (snapshot) {
    if (!isCvData(snapshot.snapshot)) {
      return {
        available: false,
        source: null,
        isHistorical: false,
        unavailableReason: null,
        submittedAt: null,
        version: null,
        template: cvTemplateId(snapshot.templateId),
        templateData: null,
        templateVersionSupported: false,
      };
    }

    const version = snapshot.templateVersion ?? null;
    return {
      available: true,
      source: 'template',
      isHistorical: true,
      unavailableReason: null,
      submittedAt: snapshot.snapshotCapturedAt ?? application?.resume?.submittedAt ?? null,
      version,
      template: cvTemplateId(snapshot.templateId),
      templateData: snapshot.snapshot,
      templateVersionSupported: version === null || version === CURRENT_CV_TEMPLATE_VERSION,
    };
  }

  const resume = application?.resume;
  if (!resume?.available) {
    return {
      available: false,
      source: null,
      isHistorical: false,
      unavailableReason: resume?.unavailableReason ?? null,
      submittedAt: null,
      version: null,
      template: cvTemplateId(null),
      templateData: null,
      templateVersionSupported: true,
    };
  }

  if (resume.source === 'application') {
    return {
      available: true,
      source: 'application',
      isHistorical: true,
      unavailableReason: null,
      submittedAt: resume.submittedAt ?? null,
      version: resume.version ?? null,
      template: cvTemplateId(null),
      templateData: null,
      templateVersionSupported: true,
    };
  }

  if (resume.source === 'profile') {
    return {
      available: true,
      source: 'profile',
      isHistorical: false,
      unavailableReason: null,
      submittedAt: null,
      version: null,
      template: cvTemplateId(null),
      templateData: null,
      templateVersionSupported: true,
    };
  }

  if (resume.source === 'template') {
    return {
      available: true,
      source: 'template',
      isHistorical: false,
      unavailableReason: null,
      submittedAt: null,
      version: null,
      template: cvTemplateId(applicant?.cvTemplate),
      templateData: currentProfileCvData(applicant),
      templateVersionSupported: true,
    };
  }

  return {
    available: false,
    source: null,
    isHistorical: false,
    unavailableReason: null,
    submittedAt: null,
    version: null,
    template: cvTemplateId(null),
    templateData: null,
    templateVersionSupported: true,
  };
};
