import type { CVData } from '../components/cv-templates/CVTemplateRenderer';

export const cvExportSections = [
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'links',
  'languages',
  'projects',
] as const;

export type CvExportSection = typeof cvExportSections[number];

export const cvExportSectionLabels: Record<CvExportSection, string> = {
  summary: 'Professional summary',
  experience: 'Work experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  links: 'Website and LinkedIn',
  languages: 'Languages',
  projects: 'Projects',
};

const hasText = (values: Array<string | undefined>) =>
  values.some((value) => Boolean(value?.trim()));

export function getFullCvExportData(data: CVData): CVData {
  return {
    ...data,
    summary: data.summary?.trim() ?? '',
    experience: data.experience.filter((item) => hasText([
      item.jobTitle, item.company, item.startDate, item.endDate, item.description,
    ])),
    education: data.education.filter((item) => hasText([
      item.degree, item.school, item.year, item.details,
    ])),
    skills: data.skills.filter((skill) => Boolean(skill.trim())),
    certifications: data.certifications.filter((item) => hasText([item.name, item.issuer])),
    languages: (data.languages ?? []).filter((item) => hasText([item.name, item.proficiency])),
    projects: (data.projects ?? []).filter((item) => hasText([
      item.name, item.description, item.projectUrl, item.githubUrl, item.startDate, item.endDate,
      item.technologies.join(' '),
    ])).map((item) => ({
      ...item,
      technologies: item.technologies.filter((technology) => Boolean(technology.trim())),
    })),
  };
}

export function getAvailableCvExportSections(data: CVData): CvExportSection[] {
  const populated = getFullCvExportData(data);
  return cvExportSections.filter((section) => {
    switch (section) {
      case 'summary':
        return Boolean(populated.summary);
      case 'experience':
        return populated.experience.length > 0;
      case 'education':
        return populated.education.length > 0;
      case 'skills':
        return populated.skills.length > 0;
      case 'certifications':
        return populated.certifications.length > 0;
      case 'links':
        return Boolean(populated.personalInfo.website?.trim() || populated.personalInfo.linkedin?.trim());
      case 'languages':
        return (populated.languages ?? []).length > 0;
      case 'projects':
        return (populated.projects ?? []).length > 0;
    }
  });
}

export function getSelectedCvExportData(
  data: CVData,
  selectedSections: readonly CvExportSection[],
): CVData {
  const populated = getFullCvExportData(data);
  const selected = new Set(selectedSections);
  return {
    ...populated,
    personalInfo: {
      ...populated.personalInfo,
      website: selected.has('links') ? populated.personalInfo.website : '',
      linkedin: selected.has('links') ? populated.personalInfo.linkedin : '',
    },
    summary: selected.has('summary') ? populated.summary : '',
    experience: selected.has('experience') ? populated.experience : [],
    education: selected.has('education') ? populated.education : [],
    skills: selected.has('skills') ? populated.skills : [],
    certifications: selected.has('certifications') ? populated.certifications : [],
    languages: selected.has('languages') ? populated.languages : [],
    projects: selected.has('projects') ? populated.projects : [],
  };
}
