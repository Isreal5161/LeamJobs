export const API_BASE_URL = 'https://leamjobs.com/api';

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

export type EmployerApplicationStatus = 'APPLIED' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED' | 'WITHDRAWN';

export type EmployerApplicant = {
  id?: string;
  firstName: string;
  lastName: string;
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
};

export type EmployerApplicationListItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  applicant: EmployerApplicant;
  status: EmployerApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type EmployerApplicationDetail = {
  id: string;
  jobId: string;
  status: EmployerApplicationStatus;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  resume: { available: boolean; submittedAt: string; version: string | null };
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
  resumeUrl?: string;
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

export function getEmployerJobs(token: string) {
  return request<EmployerJobsResponse>({ method: 'GET', endpoint: '/employer/jobs', token });
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
