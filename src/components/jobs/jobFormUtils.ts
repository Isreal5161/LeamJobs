import type { EmployerJob, EmployerJobPayload } from '../../services/api';

export const departments = [
  'Accounting',
  'Administration',
  'Advertising',
  'Agriculture',
  'Architecture',
  'Banking',
  'Business Development',
  'Customer Service',
  'Data & Analytics',
  'Design',
  'Education',
  'Engineering',
  'Finance',
  'Healthcare',
  'Human Resources',
  'Information Technology',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Marketing',
  'Media & Communications',
  'Operations',
  'Procurement',
  'Product Management',
  'Project Management',
  'Public Relations',
  'Quality Assurance',
  'Real Estate',
  'Research',
  'Sales',
  'Security',
  'Software Development',
  'Supply Chain',
  'Telecommunications',
  'Training',
  'Transportation',
  'Other',
] as const;

export type JobForm = {
  title: string;
  department: string;
  departmentChoice: string;
  departmentCustom: string;
  location: string;
  workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE';
  engagementType: 'MONTHLY' | 'CONTRACT' | 'FREELANCE';
  description: string;
  applicationDeadline: string;
  salaryMin: string;
  salaryMax: string;
  contractAmount: string;
  contractDuration: string;
  contractStartMode: 'IMMEDIATE' | 'SCHEDULED';
  scheduledStartDate: string;
  expectedCompletionDate: string;
  freelanceAmount: string;
  currency: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
};

export const emptyJobForm: JobForm = {
  title: '',
  department: '',
  departmentChoice: '',
  departmentCustom: '',
  location: '',
  workArrangement: 'REMOTE',
  engagementType: 'MONTHLY',
  description: '',
  applicationDeadline: '',
  salaryMin: '',
  salaryMax: '',
  contractAmount: '',
  contractDuration: '',
  contractStartMode: 'IMMEDIATE',
  scheduledStartDate: '',
  expectedCompletionDate: '',
  freelanceAmount: '',
  currency: 'NGN',
  requirements: [''],
  responsibilities: [''],
  skills: [''],
  benefits: [],
};

export const formFromJob = (job: EmployerJob): JobForm => {
  const rawDepartment = job.department ?? '';
  const isKnownDepartment = rawDepartment.length > 0 && departments.includes(rawDepartment as (typeof departments)[number]);

  return {
    title: job.title,
    department: rawDepartment,
    departmentChoice: isKnownDepartment ? rawDepartment : 'Other',
    departmentCustom: isKnownDepartment ? '' : rawDepartment,
    location: job.location,
    workArrangement: job.workArrangement ?? 'REMOTE',
    engagementType: job.engagementType,
    description: job.description,
    applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : '',
    salaryMin: job.compensation?.type === 'MONTHLY' ? job.compensation.salaryMin ?? '' : '',
    salaryMax: job.compensation?.type === 'MONTHLY' ? job.compensation.salaryMax ?? '' : '',
    contractAmount: job.compensation?.type === 'CONTRACT' ? job.compensation.amount : '',
    contractDuration: job.compensation?.type === 'CONTRACT' ? job.compensation.duration ?? '' : '',
    contractStartMode: job.compensation?.type === 'CONTRACT' ? job.compensation.startMode ?? 'IMMEDIATE' : 'IMMEDIATE',
    scheduledStartDate: job.compensation?.type === 'CONTRACT' && job.compensation.scheduledStartDate ? job.compensation.scheduledStartDate.slice(0, 10) : '',
    expectedCompletionDate: job.compensation?.type === 'CONTRACT' && job.compensation.expectedCompletionDate ? job.compensation.expectedCompletionDate.slice(0, 10) : '',
    freelanceAmount: job.compensation?.type === 'FREELANCE' ? job.compensation.projectAmount : '',
    currency: job.compensation?.currency ?? 'NGN',
    requirements: Array.isArray(job.requirements)
      ? job.requirements.length
        ? job.requirements
        : ['']
      : job.requirements
        ? Object.entries(job.requirements).map(([key, value]) => `${key}: ${String(value)}`)
        : [''],
    responsibilities: job.responsibilities.length ? job.responsibilities : [''],
    skills: job.skills.length ? job.skills : [''],
    benefits: job.benefits.length ? job.benefits : [],
  };
};

export const listFields = [
  ['requirements', 'Requirements'],
  ['responsibilities', 'Responsibilities'],
  ['skills', 'Skills Required'],
  ['benefits', 'Benefits (optional)'],
] as const;

export const buildPayload = (form: JobForm): EmployerJobPayload => {
  const departmentValue = form.departmentChoice === 'Other'
    ? form.departmentCustom.trim() || null
    : form.departmentChoice || null;
  const jobType: EmployerJobPayload['jobType'] = form.engagementType === 'FREELANCE'
    ? 'FREELANCE_PROJECT'
    : 'NORMAL_EMPLOYMENT';

  const common = {
    title: form.title.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    department: departmentValue,
    workArrangement: form.workArrangement,
    engagementType: form.engagementType,
    jobType,
    requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
    responsibilities: form.responsibilities.map((item) => item.trim()).filter(Boolean),
    skills: form.skills.map((item) => item.trim()).filter(Boolean),
    benefits: form.benefits.map((item) => item.trim()).filter(Boolean),
    applicationDeadline: form.applicationDeadline || null,
  };

  if (form.engagementType === 'MONTHLY') {
    return {
      ...common,
      monthlyCompensation: {
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        currency: form.currency.trim().toUpperCase() || 'NGN',
      },
      contractCompensation: null,
      freelanceCompensation: null,
    };
  }

  if (form.engagementType === 'CONTRACT') {
    return {
      ...common,
      monthlyCompensation: null,
      contractCompensation: {
        amount: Number(form.contractAmount),
        currency: form.currency.trim().toUpperCase() || 'NGN',
        duration: form.contractDuration.trim(),
        startMode: form.contractStartMode,
        scheduledStartDate: form.contractStartMode === 'SCHEDULED' ? form.scheduledStartDate || null : null,
        expectedCompletionDate: form.expectedCompletionDate || null,
      },
      freelanceCompensation: null,
    };
  }

  return {
    ...common,
    monthlyCompensation: null,
    contractCompensation: null,
    freelanceCompensation: {
      projectAmount: Number(form.freelanceAmount),
      currency: form.currency.trim().toUpperCase() || 'NGN',
    },
  };
};

export const validateForm = (form: JobForm): Record<string, string> => {
  const nextErrors: Record<string, string> = {};

  if (!form.title.trim()) {
    nextErrors.title = 'Job title is required.';
  }

  if (!form.location.trim()) {
    nextErrors.location = 'Location is required.';
  }

  if (!form.description.trim()) {
    nextErrors.description = 'Job overview is required.';
  }

  if (form.departmentChoice === 'Other' && !form.departmentCustom.trim()) {
    nextErrors.departmentCustom = 'Please enter the department name.';
  }

  if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
    nextErrors.currency = 'Enter a valid 3-letter currency code, such as NGN.';
  }

  if (form.engagementType === 'MONTHLY') {
    if (!form.salaryMin.trim() && !form.salaryMax.trim()) {
      nextErrors.salaryMin = 'At least one monthly salary value is required.';
    }

    if (form.salaryMin.trim() && form.salaryMax.trim()) {
      const minValue = Number(form.salaryMin);
      const maxValue = Number(form.salaryMax);

      if (minValue > maxValue) {
        nextErrors.salaryMax = 'Maximum salary must be greater than or equal to minimum salary.';
      }
    }
  }

  if (form.engagementType === 'CONTRACT') {
    const contractAmount = Number(form.contractAmount);
    if (!form.contractAmount.trim() || !Number.isFinite(contractAmount) || contractAmount <= 0) {
      nextErrors.contractAmount = 'Contract amount is required.';
    }

    if (!form.contractDuration.trim()) {
      nextErrors.contractDuration = 'Contract duration is required.';
    }
    if (form.contractStartMode === 'SCHEDULED' && !form.scheduledStartDate) {
      nextErrors.scheduledStartDate = 'Scheduled start date is required.';
    }
    if (form.contractStartMode === 'IMMEDIATE' && form.scheduledStartDate) {
      nextErrors.scheduledStartDate = 'Clear the scheduled date when starting immediately.';
    }
    if (form.scheduledStartDate && form.expectedCompletionDate && form.expectedCompletionDate <= form.scheduledStartDate) {
      nextErrors.expectedCompletionDate = 'Expected completion must be after the scheduled start date.';
    }
  }

  if (form.engagementType === 'FREELANCE' && !form.freelanceAmount.trim()) {
    nextErrors.freelanceAmount = 'Project amount is required.';
  }

  return nextErrors;
};
