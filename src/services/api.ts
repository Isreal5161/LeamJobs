export const API_BASE_URL = 'https://leamjobs.com/api';
export const PROFILE_IMAGE_UPDATED_EVENT = 'leamjobs-profile-image-updated';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  token?: string;
  headers?: HeadersInit;
};

export type ApiSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

export type ApiFailure = {
  ok: false;
  status: number;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type SeekerDashboardProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  professionalTitle?: string | null;
  location?: string | null;
  bio?: string | null;
  skills: string[];
  resume: { url: string } | null;
  profileCompletion: number;
};

export type SeekerDashboardApplication = {
  id: string;
  jobTitle: string;
  companyName: string | null;
  status: string;
  appliedAt: string;
};

export type SeekerDashboardJob = {
  id: string;
  title: string;
  description: string;
  location: string;
  department?: string | null;
  workArrangement?: string | null;
  engagementType?: 'MONTHLY' | 'CONTRACT' | 'FREELANCE';
  jobType: string;
  skills: string[];
  requirements: string[] | Record<string, unknown> | null;
  responsibilities: string[];
  benefits: string[];
  applicationDeadline?: string | null;
  company: {
    name: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    size: string | null;
    location: string | null;
    logoUrl: string | null;
  } | null;
  compensation: {
    type: 'EMPLOYMENT';
    engagementType: 'MONTHLY';
    salaryMin: string | null;
    salaryMax: string | null;
    currency: string;
    salaryPeriod: string;
  } | {
    type: 'CONTRACT';
    engagementType: 'CONTRACT';
    amount: string;
    salaryMin: string;
    salaryMax: string | null;
    salaryPeriod: string;
    currency: string;
    duration: string | null;
    startMode: 'IMMEDIATE' | 'SCHEDULED';
    scheduledStartDate: string | null;
    expectedCompletionDate: string | null;
  } | {
    type: 'FREELANCE';
    engagementType: 'FREELANCE';
    projectAmount: string;
    currency: string;
  } | null;
  createdAt: string;
};

export type SeekerDashboardData = {
  profile: SeekerDashboardProfile | null;
  stats: {
    appliedJobs: number;
    interviews: number;
  };
  recentApplications: SeekerDashboardApplication[];
  approvedJobs: SeekerDashboardJob[];
};

export type SeekerDashboardResponse = {
  success: true;
  data: SeekerDashboardData;
};

export type EmployerDashboardJob = {
  id: string;
  title: string;
  location: string;
  jobType: string;
  status: string;
  applicantCount: number;
  createdAt: string;
};

export type EmployerDashboardApplication = {
  id: string;
  seekerName: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
};

export type EmployerDashboardData = {
  stats: {
    openRoles: number;
    newApplicants: number;
    interviews: number;
    averageMatchScore: number | null;
  };
  pipeline: {
    applied: number;
    reviewing: number;
    shortlisted: number;
    interview: number;
    accepted: number;
  };
  recentJobs: EmployerDashboardJob[];
  recentApplications: EmployerDashboardApplication[];
};

export type EmployerDashboardResponse = {
  success: true;
  data: EmployerDashboardData;
};

export type EmployerProfile = {
  id: string;
  companyName: string;
  companyDescription: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  companyLogoUrl: string | null;
};

export type EmployerProfileData = {
  profile: EmployerProfile | null;
  account: { email: string };
};

export type EmployerProfileResponse = {
  success: true;
  data: EmployerProfileData;
};

export type EmployerLogoResponse = {
  success: true;
  data: { profile: EmployerProfile };
};

export type EmployerLogoDeleteResponse = {
  success: true;
  data: { companyLogoUrl: null };
};

export type EmployerProfilePayload = {
  companyName?: string;
  companyDescription?: string | null;
  website?: string | null;
  industry?: string | null;
  companySize?: string | null;
  location?: string | null;
};

export type EmployerJob = {
  id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  department: string | null;
  workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
  engagementType: 'MONTHLY' | 'CONTRACT' | 'FREELANCE';
  jobType: 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT';
  skills: string[];
  requirements: string[] | Record<string, unknown> | null;
  responsibilities: string[];
  benefits: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  applicationDeadline: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    name: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    location: string | null;
    logoUrl: string | null;
  } | null;
  compensation: {
    type: 'MONTHLY';
    salaryMin: string | null;
    salaryMax: string | null;
    currency: string;
    salaryPeriod: string;
  } | {
    type: 'CONTRACT';
    amount: string;
    salaryMin: string;
    salaryMax: string | null;
    salaryPeriod: string;
    currency: string;
    duration: string | null;
    startMode: 'IMMEDIATE' | 'SCHEDULED';
    scheduledStartDate: string | null;
    expectedCompletionDate: string | null;
  } | {
    type: 'FREELANCE';
    projectAmount: string;
    currency: string;
  } | null;
  applicantCount: number;
};

export type EmployerJobsResponse = {
  success: true;
  data: { jobs: EmployerJob[] };
};

export type EmployerJobResponse = {
  success: true;
  data: { job: EmployerJob };
};

export type AdminJob = {
  id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  department: string | null;
  workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
  engagementType: 'MONTHLY' | 'CONTRACT' | 'FREELANCE';
  jobType: 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT';
  skills: string[];
  requirements: string[] | Record<string, unknown> | null;
  responsibilities: string[];
  benefits: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  applicationDeadline: string | null;
  rejectionReason: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: {
    name: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    location: string | null;
    logoUrl: string | null;
  } | null;
  compensation: {
    type: 'MONTHLY';
    salaryMin: string | null;
    salaryMax: string | null;
    currency: string;
    salaryPeriod: string;
  } | {
    type: 'CONTRACT';
    amount: string;
    currency: string;
    duration: string | null;
    startMode: 'IMMEDIATE' | 'SCHEDULED';
    scheduledStartDate: string | null;
    expectedCompletionDate: string | null;
  } | {
    type: 'FREELANCE';
    projectAmount: string;
    currency: string;
  } | null;
  applicantCount: number;
};

export type AdminJobsResponse = {
  success: true;
  data: { jobs: AdminJob[] };
};

export type AdminJobResponse = {
  success: true;
  data: { job: AdminJob };
};

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'SEEKER' | 'EMPLOYER' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  profile: {
    location: string | null;
    professionalTitle: string | null;
    companyName: string | null;
  } | null;
};

export type AdminUsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminUser['role'];
  status?: 'ACTIVE' | 'INACTIVE' | 'VERIFIED' | 'UNVERIFIED' | 'ALL';
  sortBy?: 'createdAt' | 'lastLogin' | 'name';
  sortOrder?: 'asc' | 'desc';
};

export type AdminUsersResponse = {
  success: true;
  data: {
    users: AdminUser[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

export type EmployerApplicationStatus = 'APPLIED' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED' | 'PAYMENT_PENDING' | 'WITHDRAWN';

export type EmployerApplicant = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  fullName: string;
  professionalTitle: string | null;
  profilePictureUrl: string | null;
  location: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  bio: string | null;
  skills: string[];
  education: EducationItem[] | null;
  experience: ExperienceItem[] | null;
  certifications: CertificationItem[] | null;
  languages: LanguageItem[] | null;
  projects: ProjectItem[] | null;
  linkedinUrl: string | null;
  cvTemplate: 'modern' | 'professional' | 'creative' | 'minimalist' | null;
};

export type EmployerApplicationListItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  applicant: EmployerApplicant;
  status: EmployerApplicationStatus;
  createdAt: string;
  updatedAt: string;
  contractId: string | null;
};

export type EmployerApplicationDetail = {
  id: string;
  jobId: string;
  status: EmployerApplicationStatus;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  contractId: string | null;
  resume: { available: boolean; source: 'application' | 'profile' | 'template' | null; submittedAt: string | null; version: string | null };
  job: { id: string; title: string };
  applicant: EmployerApplicant;
};

export type EmployerApplicationsResponse = {
  success: true;
  data: { applications: EmployerApplicationListItem[] };
};

export type EmployerApplicationResponse = {
  success: true;
  data: { application: EmployerApplicationDetail };
};

export type EmployerConversation = {
  id: string;
  seeker: {
    id: string;
    firstName: string;
    lastName: string;
    professionalTitle: string | null;
    profilePictureUrl: string | null;
    location: string | null;
  };
  job: { id: string; title: string; location: string; jobType: string } | null;
  application: { id: string; status: string; jobId: string } | null;
  lastMessage: EmployerMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type EmployerMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  clientMessageId: string | null;
  createdAt: string;
  readAt: string | null;
};

export type EmployerConversationsResponse = {
  success: true;
  data: { conversations: EmployerConversation[] };
};

export type EmployerConversationResponse = {
  success: true;
  data: { conversation: EmployerConversation };
};

export type EmployerMessagesResponse = {
  success: true;
  data: { messages: EmployerMessage[]; nextCursor: string | null };
};

export type EmployerMessageResponse = {
  success: true;
  data: { message: EmployerMessage };
};

export type EmployerReadResponse = {
  success: true;
  data: { conversationId: string; unreadCount: number };
};

export type EmployerJobPayload = {
  title: string;
  description: string;
  location: string;
  department?: string | null;
  workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE' | null;
  engagementType: 'MONTHLY' | 'CONTRACT' | 'FREELANCE';
  jobType: 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT';
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
  applicationDeadline?: string | null;
  monthlyCompensation?: {
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency: string;
  } | null;
  contractCompensation?: {
    amount: number;
    currency: string;
    duration: string;
    startMode: 'IMMEDIATE' | 'SCHEDULED';
    scheduledStartDate?: string | null;
    expectedCompletionDate?: string | null;
  } | null;
  freelanceCompensation?: {
    projectAmount: number;
    currency: string;
  } | null;
};

export type SeekerJobResponse = {
  success: true;
  data: {
    job: SeekerDashboardJob;
    alreadyApplied: boolean;
  };
};

export type SeekerJobListItem = SeekerDashboardJob & {
};

export type SeekerJobsResponse = {
  success: true;
  data: {
    jobs: SeekerJobListItem[];
    nextCursor: string | null;
  };
};

export type SeekerJobsQuery = {
  search?: string;
  location?: string;
  jobType?: 'NORMAL_EMPLOYMENT' | 'FREELANCE_PROJECT';
  skills?: string[];
  limit?: number;
  cursor?: string;
};

export type SeekerApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string | null;
  jobType: string;
  location: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
  contractId: string | null;
};

export type SeekerApplicationsResponse = {
  success: true;
  data: {
    applications: SeekerApplication[];
    summary: {
      total: number;
      interviews: number;
    };
  };
};

export type CreateSeekerApplicationPayload = {
  jobId: string;
  coverLetter?: string;
};

export type CreateSeekerApplicationResponse = {
  success: true;
  data: {
    application: SeekerApplication;
  };
};

export type GetSeekerProfileResponse = {
  success: true;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
    profile: {
      id: string | null;
      country: string | null;
      state: string | null;
      city: string | null;
      professionalTitle: string | null;
      location: string | null;
      skills: string[];
      bio: string | null;
      education: EducationItem[] | null;
      experience: ExperienceItem[] | null;
      certifications: CertificationItem[] | null;
      languages: LanguageItem[] | null;
      projects: ProjectItem[] | null;
      cvTemplate: 'modern' | 'professional' | 'creative' | 'minimalist' | null;
      linkedinUrl: string | null;
      resumeUrl: string | null;
      resumeObjectKey: string | null;
      profilePictureUrl: string | null;
      profilePictureKey: string | null;
    };
    onboardingComplete: boolean;
  };
};

export type UpdateSeekerProfilePayload = {
  fullName?: string;
  country: string;
  state: string;
  city: string;
  professionalTitle: string;
  skills: string[];
};

export type UpdateSeekerProfileResponse = {
  success: true;
  data: {
    id: string;
    country: string | null;
    state: string | null;
    city: string | null;
    professionalTitle: string | null;
    location: string | null;
    skills: string[];
  };
};

export type EducationItem = {
  id: string;
  degree: string;
  school: string;
  year: string;
};

export type ExperienceItem = {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
};

export type CertificationItem = {
  id: string;
  name: string;
  issuer: string;
};
export type LanguageItem = {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Professional' | 'Fluent' | 'Native';
};
export type ProjectItem = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  projectUrl: string;
  githubUrl: string;
  startDate: string;
  endDate: string;
};

export type UpdateSeekerCVPayload = {
  bio?: string | null;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  certifications?: CertificationItem[];
  linkedinUrl?: string | null;
  cvTemplate?: 'modern' | 'professional' | 'creative' | 'minimalist' | null;
  languages?: LanguageItem[] | null;
  projects?: ProjectItem[] | null;
};

export type UpdateSeekerCVResponse = {
  success: true;
  data: {
    id: string;
    bio: string | null;
    education: EducationItem[] | null;
    experience: ExperienceItem[] | null;
    certifications: CertificationItem[] | null;
    languages: LanguageItem[] | null;
    projects: ProjectItem[] | null;
    linkedinUrl: string | null;
    cvTemplate: 'modern' | 'professional' | 'creative' | 'minimalist' | null;
  };
};

export async function request<T>({
  method,
  endpoint,
  body,
  token,
  headers: customHeaders,
}: ApiRequestOptions): Promise<ApiResponse<T>> {
  const headers = new Headers(customHeaders);

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });

    const data = await response.json().catch(() => undefined);

    if (!response.ok) {
      const errorData = typeof data === 'object' && data !== null
        ? data as { message?: string; errors?: unknown; error?: { message?: string; code?: string } }
        : undefined;

      return {
        ok: false,
        status: response.status,
        error: {
          message: errorData?.message ?? errorData?.error?.message ?? 'Request failed',
          code: errorData?.error?.code,
          details: errorData?.errors,
        },
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: {
        message: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

export function getSeekerJob(jobId: string, token: string) {
  return request<SeekerJobResponse>({
    method: 'GET',
    endpoint: `/seeker/jobs/${encodeURIComponent(jobId)}`,
    token,
  });
}

export function getPublicJobs(query: Partial<SeekerJobsQuery> = {}) {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.location?.trim()) params.set('location', query.location.trim());
  if (query.jobType) params.set('jobType', query.jobType);
  if (query.skills?.length) params.set('skills', query.skills.join(','));
  params.set('limit', String(query.limit ?? 25));
  if (query.cursor) params.set('cursor', query.cursor);

  return request<SeekerJobsResponse>({
    method: 'GET',
    endpoint: `/jobs?${params.toString()}`,
  });
}

export function getPublicJob(jobId: string) {
  return request<SeekerJobResponse>({ method: 'GET', endpoint: `/jobs/${encodeURIComponent(jobId)}` });
}

export function getEmployerDashboard(token: string) {
  return request<EmployerDashboardResponse>({
    method: 'GET',
    endpoint: '/employer/dashboard',
    token,
  });
}

export function getEmployerProfile(token: string) {
  return request<EmployerProfileResponse>({ method: 'GET', endpoint: '/employer/profile', token });
}

async function getProtectedBlob(endpoint: string, token: string, fallbackMessage: string): Promise<ApiResponse<Blob>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => undefined) as { message?: string } | undefined;
      return { ok: false, status: response.status, error: { message: data?.message ?? fallbackMessage } };
    }
    return { ok: true, status: response.status, data: await response.blob() };
  } catch (error) {
    return { ok: false, status: 0, error: { message: error instanceof Error ? error.message : fallbackMessage } };
  }
}

export function getEmployerProfileLogo(token: string) {
  return getProtectedBlob('/employer/profile/logo', token, 'Company logo could not be loaded.');
}

export function getAdminCompanyLogo(userId: string, token: string) {
  return getProtectedBlob(`/admin/companies/${encodeURIComponent(userId)}/logo`, token, 'Company logo could not be loaded.');
}

export function uploadEmployerProfileLogo(file: File, token: string) {
  const body = new FormData();
  body.append('file', file);
  return request<EmployerLogoResponse>({ method: 'POST', endpoint: '/employer/profile/logo', body, token });
}

export function deleteEmployerProfileLogo(token: string) {
  return request<EmployerLogoDeleteResponse>({ method: 'DELETE', endpoint: '/employer/profile/logo', token });
}

export function updateEmployerProfile(payload: EmployerProfilePayload, token: string) {
  return request<EmployerProfileResponse>({ method: 'PATCH', endpoint: '/employer/profile', body: payload, token });
}

export function getEmployerJobs(token: string) {
  return request<EmployerJobsResponse>({ method: 'GET', endpoint: '/employer/jobs', token });
}

export function getAdminJobs(token: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED') {
  const endpoint = status ? `/admin/jobs?status=${encodeURIComponent(status)}` : '/admin/jobs';
  return request<AdminJobsResponse>({ method: 'GET', endpoint, token });
}

export function getAdminUsers(token: string, query: AdminUsersQuery = {}) {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.role) params.set('role', query.role);
  if (query.status) params.set('status', query.status);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const queryString = params.toString();
  return request<AdminUsersResponse>({
    method: 'GET',
    endpoint: `/admin/users${queryString ? `?${queryString}` : ''}`,
    token,
  });
}

export type AdminCompany = {
  id: string;
  userId: string;
  companyName: string;
  companyDescription: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  companyLogoUrl: string | null;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  jobCount: number;
};

export type AdminCompaniesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  companySize?: string;
  sortBy?: 'createdAt' | 'companyName' | 'jobCount';
  sortOrder?: 'asc' | 'desc';
};

export type AdminCompaniesResponse = {
  success: true;
  data: {
    companies: AdminCompany[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

export function getAdminCompanies(token: string, query: AdminCompaniesQuery = {}) {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.industry) params.set('industry', query.industry);
  if (query.companySize) params.set('companySize', query.companySize);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const queryString = params.toString();
  return request<AdminCompaniesResponse>({
    method: 'GET',
    endpoint: `/admin/companies${queryString ? `?${queryString}` : ''}`,
    token,
  });
}

export type AdminSeeker = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  profile: {
    professionalTitle: string | null;
    location: string | null;
    skills: string[];
    hasResume: boolean;
    profilePictureUrl: string | null;
  } | null;
  applicationCount: number;
};

export type AdminSeekersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  verification?: 'VERIFIED' | 'UNVERIFIED';
  location?: string;
  sortBy?: 'createdAt' | 'lastLogin' | 'applicationCount' | 'name';
  sortOrder?: 'asc' | 'desc';
};

export type AdminSeekersResponse = {
  success: true;
  data: {
    seekers: AdminSeeker[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

export function getAdminSeekers(token: string, query: AdminSeekersQuery = {}) {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.status) params.set('status', query.status);
  if (query.verification) params.set('verification', query.verification);
  if (query.location?.trim()) params.set('location', query.location.trim());
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);

  const queryString = params.toString();
  return request<AdminSeekersResponse>({
    method: 'GET',
    endpoint: `/admin/seekers${queryString ? `?${queryString}` : ''}`,
    token,
  });
}

export type AdminAnalytics = {
  dateRange: { from: string; to: string; granularity: 'day' | 'week' | 'month' };
  summary: {
    totalUsers: number; totalSeekers: number; totalEmployers: number; activeUsers: number; verifiedUsers: number;
    totalJobs: number; pendingJobs: number; approvedJobs: number; rejectedJobs: number; closedJobs: number;
    totalApplications: number; totalContracts: number;
  };
  trends: Record<'users' | 'jobs' | 'applications' | 'contracts', { date: string; count: number }[]>;
  breakdowns: {
    jobsByStatus: { status: string; count: number }[];
    applicationsByStatus: { status: string; count: number }[];
    contractsByStatus: { status: string; count: number }[];
    contractsByType: { type: string; count: number }[];
    paymentsByStatus: { status: string; count: number }[];
    paymentsByType: { paymentType: string; count: number }[];
    subscriptionsByStatus: { status: string; count: number }[];
  };
  financial: Record<'successfulPayments' | 'fundedEscrow' | 'releasedEscrow' | 'platformFees', { currency: string; amount: string }[]>;
};

export type AdminAnalyticsResponse = { success: true; data: AdminAnalytics };

export function getAdminAnalytics(token: string, query: { from?: string; to?: string; granularity?: 'day' | 'week' | 'month' } = {}) {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.granularity) params.set('granularity', query.granularity);
  return request<AdminAnalyticsResponse>({ method: 'GET', endpoint: `/admin/analytics?${params.toString()}`, token });
}

export type SiteContentResponse = { success: true; data: { content: Record<string, unknown> } };

export function getSiteContent() {
  return request<SiteContentResponse>({ method: 'GET', endpoint: '/content' });
}

export function updateAdminSiteContent(token: string, pageKey: string, content: unknown) {
  return request<{ success: true; data: { page: { pageKey: string; content: unknown; updatedAt: string } } }>({ method: 'PUT', endpoint: '/admin/content', body: { pageKey, content }, token });
}

export function getAdminJob(jobId: string, token: string) {
  return request<AdminJobResponse>({ method: 'GET', endpoint: `/admin/jobs/${encodeURIComponent(jobId)}`, token });
}

export type AdminReleaseCandidate = {
  contractId: string;
  job: { id: string; title: string };
  employer: { id: string; firstName: string; lastName: string; email: string };
  seeker: { id: string; firstName: string; lastName: string; email: string };
  freelance: {
    agreedAmount: string;
    currency: string;
    duration: string | null;
    startMode: 'IMMEDIATE' | 'SCHEDULED' | null;
    platformFeePercentage: string;
    platformFeeAmount: string;
    seekerNetAmount: string;
    completionSubmittedAt: string | null;
    employerCompletionConfirmedAt: string | null;
    workStatus: string;
    escrow: {
      id: string;
      grossAmount: string;
      platformFeeAmount: string;
      seekerNetAmount: string;
      status: string;
      releaseEligibleAt: string | null;
      releasedAmount: string;
      releasedAt: string | null;
    };
  };
};

export type AdminReleaseCandidatesResponse = {
  success: true;
  data: { contracts: AdminReleaseCandidate[] };
};

export function getAdminReleaseCandidates(token: string) {
  return request<AdminReleaseCandidatesResponse>({ method: 'GET', endpoint: '/admin/contracts/release-eligible', token });
}

export function releaseAdminContract(contractId: string, token: string) {
  return request<{ success: true; message: string; data: { alreadyReleased: boolean; escrow: { escrowId: string; contractId: string; status: string; releasedAmount: string; currency: string; releasedAt: string } } }>({
    method: 'POST',
    endpoint: `/admin/contracts/${encodeURIComponent(contractId)}/release`,
    token,
  });
}

export function approveAdminJob(jobId: string, token: string) {
  return request<AdminJobResponse>({ method: 'PATCH', endpoint: `/admin/jobs/${encodeURIComponent(jobId)}/approve`, token });
}

export function rejectAdminJob(jobId: string, rejectionReason: string, token: string) {
  return request<AdminJobResponse>({
    method: 'PATCH',
    endpoint: `/admin/jobs/${encodeURIComponent(jobId)}/reject`,
    body: { rejectionReason },
    token,
  });
}

export function createEmployerJob(payload: EmployerJobPayload, token: string) {
  return request<EmployerJobResponse>({ method: 'POST', endpoint: '/employer/jobs', body: payload, token });
}

export function updateEmployerJob(jobId: string, payload: EmployerJobPayload, token: string) {
  return request<EmployerJobResponse>({ method: 'PATCH', endpoint: `/employer/jobs/${encodeURIComponent(jobId)}`, body: payload, token });
}

export function closeEmployerJob(jobId: string, token: string) {
  return request<EmployerJobResponse>({ method: 'PATCH', endpoint: `/employer/jobs/${encodeURIComponent(jobId)}/close`, token });
}

export function getEmployerApplications(jobId: string, token: string) {
  return request<EmployerApplicationsResponse>({ method: 'GET', endpoint: `/employer/jobs/${encodeURIComponent(jobId)}/applications`, token });
}

export function getEmployerApplication(jobId: string, applicationId: string, token: string) {
  return request<EmployerApplicationResponse>({ method: 'GET', endpoint: `/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}`, token });
}

export function updateEmployerApplicationStatus(jobId: string, applicationId: string, status: EmployerApplicationStatus, token: string) {
  return request<EmployerApplicationResponse>({
    method: 'PATCH',
    endpoint: `/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}/status`,
    body: { status },
    token,
  });
}

export function selectContractApplication(jobId: string, applicationId: string, token: string) {
  return request<{ success: true; data: { selection: { contractId: string; applicationId: string; status: 'PAYMENT_PENDING' } } }>({
    method: 'POST',
    endpoint: `/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}/select-contract`,
    token,
  });
}

export type ContractPayment = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentType: string;
  verifiedAt: string | null;
  createdAt: string;
};

export type ContractData = {
  id: string;
  applicationId: string;
  jobId: string;
  employerId: string;
  seekerId: string;
  type: string;
  status: string;
  startDate: string | null;
  expectedEndDate: string | null;
  job: { id: string; title: string };
  employer: { id: string; firstName: string; lastName: string };
  seeker: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
  freelance: {
    id: string;
    agreedAmount: string;
    currency: string;
    duration: string | null;
    startMode: 'IMMEDIATE' | 'SCHEDULED' | null;
    platformFeePercentage: string | null;
    platformFeeAmount: string | null;
    seekerNetAmount: string | null;
    employerConfirmedAt: string | null;
    seekerConfirmedAt: string | null;
    employerCompletionConfirmedAt: string | null;
    completionSubmittedAt: string | null;
    completionNote: string | null;
    workStatus: string;
    escrow: {
      id: string;
      grossAmount: string;
      platformFeeAmount: string;
      seekerNetAmount: string;
      currency: string;
      fundedAmount: string;
      releasedAmount: string;
      refundedAmount: string;
      status: string;
      fundedAt: string | null;
      releaseEligibleAt: string | null;
      payments: ContractPayment[];
    } | null;
  } | null;
};

export type ContractResponse = { success: true; data: { contract: ContractData } };
export type ContractPaymentResponse = {
  success: true;
  data: {
    alreadyFunded: boolean;
    payment: ContractPayment & { providerReference: string; transactionId: string | null; checkoutUrl: string | null };
    contract?: ContractData;
  };
};

export function getEmployerContract(contractId: string, token: string) {
  return request<ContractResponse>({ method: 'GET', endpoint: `/employer/contracts/${encodeURIComponent(contractId)}`, token });
}

export function initializeEmployerContractPayment(contractId: string, token: string, idempotencyKey: string) {
  return request<ContractPaymentResponse>({ method: 'POST', endpoint: `/employer/contracts/${encodeURIComponent(contractId)}/payment`, body: { idempotencyKey }, token });
}

export function verifyEmployerContractPayment(contractId: string, payload: { providerReference?: string; transactionId: string }, token: string) {
  return request<{ success: true; data: { payment: ContractPayment; contract: ContractData } }>({ method: 'POST', endpoint: `/employer/contracts/${encodeURIComponent(contractId)}/payment/verify`, body: payload, token });
}

export function confirmEmployerCompletion(contractId: string, token: string) {
  return request<ContractResponse>({ method: 'POST', endpoint: `/employer/contracts/${encodeURIComponent(contractId)}/confirm-completion`, token });
}

export function getSeekerContract(contractId: string, token: string) {
  return request<ContractResponse>({ method: 'GET', endpoint: `/seeker/contracts/${encodeURIComponent(contractId)}`, token });
}

export function submitSeekerCompletion(contractId: string, completionNote: string, token: string) {
  return request<ContractResponse>({ method: 'POST', endpoint: `/seeker/contracts/${encodeURIComponent(contractId)}/submit-completion`, body: { completionNote }, token });
}

export function createEmployerApplicationConversation(jobId: string, applicationId: string, token: string) {
  return request<EmployerConversationResponse>({
    method: 'POST',
    endpoint: `/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}/conversation`,
    token,
  });
}

export async function getEmployerApplicationResume(jobId: string, applicationId: string, token: string): Promise<ApiResponse<Blob>> {
  try {
    const response = await fetch(`${API_BASE_URL}/employer/jobs/${encodeURIComponent(jobId)}/applications/${encodeURIComponent(applicationId)}/resume`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => undefined) as { message?: string } | undefined;
      return { ok: false, status: response.status, error: { message: data?.message ?? 'CV could not be loaded.' } };
    }
    return { ok: true, status: response.status, data: await response.blob() };
  } catch (error) {
    return { ok: false, status: 0, error: { message: error instanceof Error ? error.message : 'CV could not be loaded.' } };
  }
}

export function getEmployerConversations(token: string) {
  return request<EmployerConversationsResponse>({ method: 'GET', endpoint: '/employer/conversations', token });
}

export function getEmployerConversation(conversationId: string, token: string) {
  return request<EmployerConversationResponse>({ method: 'GET', endpoint: `/employer/conversations/${encodeURIComponent(conversationId)}`, token });
}

export function getEmployerConversationMessages(conversationId: string, token: string, options: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(options.limit ?? 50));
  if (options.cursor) params.set('cursor', options.cursor);
  return request<EmployerMessagesResponse>({ method: 'GET', endpoint: `/employer/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`, token });
}

export function sendEmployerMessage(conversationId: string, body: string, token: string, clientMessageId?: string) {
  return request<EmployerMessageResponse>({
    method: 'POST',
    endpoint: `/employer/conversations/${encodeURIComponent(conversationId)}/messages`,
    body: { body, ...(clientMessageId ? { clientMessageId } : {}) },
    token,
  });
}

export function markEmployerConversationAsRead(conversationId: string, token: string) {
  return request<EmployerReadResponse>({ method: 'PATCH', endpoint: `/employer/conversations/${encodeURIComponent(conversationId)}/read`, token });
}

export function getSeekerJobs(query: SeekerJobsQuery, token: string) {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.location?.trim()) params.set('location', query.location.trim());
  if (query.jobType) params.set('jobType', query.jobType);
  if (query.skills?.length) params.set('skills', query.skills.join(','));
  params.set('limit', String(query.limit ?? 25));
  if (query.cursor) params.set('cursor', query.cursor);

  return request<SeekerJobsResponse>({
    method: 'GET',
    endpoint: `/seeker/jobs?${params.toString()}`,
    token,
  });
}

export type SeekerRecommendation = {
  job: SeekerJobListItem;
  matchScore: number;
  matchedSkills: string[];
  totalJobSkills: number;
};

export type SeekerRecommendationsResponse = {
  success: true;
  data: {
    recommendations: SeekerRecommendation[];
    nextCursor: string | null;
  };
};

export function getSeekerRecommendations(query: { limit?: number; cursor?: string }, token: string) {
  const params = new URLSearchParams();
  params.set('limit', String(query.limit ?? 25));
  if (query.cursor) params.set('cursor', query.cursor);
  return request<SeekerRecommendationsResponse>({ method: 'GET', endpoint: `/seeker/recommendations?${params.toString()}`, token });
}

export function getSeekerApplications(token: string) {
  return request<SeekerApplicationsResponse>({
    method: 'GET',
    endpoint: '/seeker/applications',
    token,
  });
}

export function createSeekerApplication(payload: CreateSeekerApplicationPayload, token: string) {
  return request<CreateSeekerApplicationResponse>({
    method: 'POST',
    endpoint: '/seeker/applications',
    body: payload,
    token,
  });
}

export function getSeekerProfile(token: string) {
  return request<GetSeekerProfileResponse>({
    method: 'GET',
    endpoint: '/seeker/profile',
    token,
  });
}

export function updateSeekerProfile(payload: UpdateSeekerProfilePayload, token: string) {
  return request<UpdateSeekerProfileResponse>({
    method: 'PATCH',
    endpoint: '/seeker/profile',
    body: payload,
    token,
  });
}

export function updateSeekerCV(payload: UpdateSeekerCVPayload, token: string) {
  return request<UpdateSeekerCVResponse>({
    method: 'PATCH',
    endpoint: '/seeker/profile/cv',
    body: payload,
    token,
  });
}

export type ProfileFileResponse = {
  success: true;
  data: {
    profilePictureUrl?: string | null;
    profilePictureKey?: string | null;
    resumeUrl?: string | null;
    resumeObjectKey?: string | null;
  };
};

export function uploadSeekerProfilePicture(file: File, token: string) {
  const body = new FormData();
  body.append('file', file);
  return request<ProfileFileResponse>({ method: 'POST', endpoint: '/seeker/profile/picture', body, token });
}

export function getSeekerProfilePicture(token: string) {
  return getProtectedBlob('/seeker/profile/picture', token, 'Profile picture could not be loaded.');
}

export function deleteSeekerProfilePicture(token: string) {
  return request<ProfileFileResponse>({ method: 'DELETE', endpoint: '/seeker/profile/picture', token });
}

export function uploadSeekerResume(file: File, token: string) {
  const body = new FormData();
  body.append('file', file);
  return request<ProfileFileResponse>({ method: 'POST', endpoint: '/seeker/profile/resume', body, token });
}

export function deleteSeekerResume(token: string) {
  return request<ProfileFileResponse>({ method: 'DELETE', endpoint: '/seeker/profile/resume', token });
}

export type SeekerMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  clientMessageId: string | null;
  createdAt: string;
  readAt: string | null;
};

export type SeekerConversation = {
  id: string;
  employer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    companyLogoUrl: string | null;
  };
  job: { id: string; title: string; location: string; jobType: string } | null;
  application: { id: string; status: string; jobId: string } | null;
  lastMessage: SeekerMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type SeekerConversationsResponse = {
  success: true;
  data: { conversations: SeekerConversation[] };
};

export type SeekerConversationResponse = {
  success: true;
  data: { conversation: SeekerConversation };
};

export type SeekerMessagesResponse = {
  success: true;
  data: { messages: SeekerMessage[]; nextCursor: string | null };
};

export type SeekerMessageResponse = {
  success: true;
  data: { message: SeekerMessage };
};

export type SeekerReadResponse = {
  success: true;
  data: { conversationId: string; unreadCount: number };
};

export function getSeekerConversations(token: string) {
  return request<SeekerConversationsResponse>({ method: 'GET', endpoint: '/seeker/conversations', token });
}

export function getSeekerConversation(conversationId: string, token: string) {
  return request<SeekerConversationResponse>({ method: 'GET', endpoint: `/seeker/conversations/${encodeURIComponent(conversationId)}`, token });
}

export function getSeekerConversationMessages(conversationId: string, token: string, options: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(options.limit ?? 50));
  if (options.cursor) params.set('cursor', options.cursor);
  return request<SeekerMessagesResponse>({ method: 'GET', endpoint: `/seeker/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`, token });
}

export function createSeekerConversationFromApplication(applicationId: string, token: string) {
  return request<SeekerConversationResponse>({ method: 'POST', endpoint: `/seeker/conversations/from-application/${encodeURIComponent(applicationId)}`, token });
}

export function sendSeekerMessage(conversationId: string, body: string, token: string, clientMessageId?: string) {
  return request<SeekerMessageResponse>({
    method: 'POST',
    endpoint: `/seeker/conversations/${encodeURIComponent(conversationId)}/messages`,
    body: { body, ...(clientMessageId ? { clientMessageId } : {}) },
    token,
  });
}

export function markSeekerConversationAsRead(conversationId: string, token: string) {
  return request<SeekerReadResponse>({ method: 'PATCH', endpoint: `/seeker/conversations/${encodeURIComponent(conversationId)}/read`, token });
}

export type SeekerPaymentSummary = {
  currency: string | null;
  availableBalance: string;
  pendingWithdrawalBalance: string;
  pendingEarnings: string;
  totalEarnings: string;
  totalWithdrawn: string;
};

export type SeekerPaymentItem = {
  id: string;
  jobTitle: string | null;
  employerName: string | null;
  amount: string;
  currency: string;
  platformFee: string | null;
  netAmount: string;
  status: string;
  date: string;
};

export type SeekerTransactionItem = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  description: string | null;
  createdAt: string;
  balanceAfter: string | null;
};

export type SeekerWithdrawalItem = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  requestedAt: string;
  processingAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  paymentMethod: { type: string; last4: string } | null;
};

export type SeekerPaymentPageResponse<T> = {
  success: true;
  data: T;
};

export function getSeekerPaymentSummary(token: string) {
  return request<SeekerPaymentPageResponse<SeekerPaymentSummary>>({ method: 'GET', endpoint: '/seeker/payments/summary', token });
}

export function getSeekerPayments(token: string) {
  return request<SeekerPaymentPageResponse<{ items: SeekerPaymentItem[]; nextCursor: string | null }>>({ method: 'GET', endpoint: '/seeker/payments?limit=25', token });
}

export function getSeekerTransactions(token: string) {
  return request<SeekerPaymentPageResponse<{ items: SeekerTransactionItem[]; nextCursor: string | null }>>({ method: 'GET', endpoint: '/seeker/payments/transactions?limit=25', token });
}

export function getSeekerWithdrawals(token: string) {
  return request<SeekerPaymentPageResponse<{ items: SeekerWithdrawalItem[]; nextCursor: string | null }>>({ method: 'GET', endpoint: '/seeker/payments/withdrawals?limit=25', token });
}

export type SeekerPayoutAccount = {
  id: string;
  provider: string;
  payoutMethod: string;
  country: string;
  currency: string;
  bankCode: string | null;
  bankName: string | null;
  accountName: string;
  accountNumberLast4: string;
  maskedAccountNumber: string;
  isDefault: boolean;
  verifiedAt: string | null;
  verified: boolean;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DISABLED' | string;
};

export type SeekerPayoutAccountsResponse = {
  success: true;
  data: { payoutAccounts: SeekerPayoutAccount[] };
};

export type CreateSeekerPayoutAccountPayload = {
  country: string;
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  payoutIdentifier?: string;
  currency?: string;
  isDefault?: boolean;
};

export type UpdateSeekerPayoutAccountPayload = CreateSeekerPayoutAccountPayload | { isDefault: boolean };

export type SeekerPayoutAccountResponse = {
  success: true;
  data: { payoutAccount: SeekerPayoutAccount };
};

export type SeekerWithdrawalRequest = {
  amount: string;
  currency: string;
  payoutAccountId: string;
};

export type SeekerWithdrawal = {
  id: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | string;
  requestedAt: string;
  createdAt: string;
  payoutAccount: SeekerPayoutAccount | null;
};

export type SeekerWithdrawalResponse = {
  success: true;
  data: { withdrawal: SeekerWithdrawal };
};

export function getSeekerPayoutAccounts(token: string) {
  return request<SeekerPayoutAccountsResponse>({ method: 'GET', endpoint: '/seeker/payout-accounts?scope=all', token });
}

export function createSeekerPayoutAccount(payload: CreateSeekerPayoutAccountPayload, token: string) {
  return request<SeekerPayoutAccountResponse>({ method: 'POST', endpoint: '/seeker/payout-accounts', body: payload, token });
}

export function updateSeekerPayoutAccount(id: string, payload: UpdateSeekerPayoutAccountPayload, token: string) {
  return request<SeekerPayoutAccountResponse>({ method: 'PATCH', endpoint: `/seeker/payout-accounts/${encodeURIComponent(id)}`, body: payload, token });
}

export function requestSeekerWithdrawal(payload: SeekerWithdrawalRequest, idempotencyKey: string, token: string) {
  return request<SeekerWithdrawalResponse>({
    method: 'POST',
    endpoint: '/seeker/payments/withdrawals',
    body: payload,
    token,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}
