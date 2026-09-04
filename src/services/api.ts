export const API_BASE_URL = 'https://leamjobs.com/api';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = {
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  token?: string;
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
  jobType: string;
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
    salaryMin: string | null;
    salaryMax: string | null;
    currency: string;
    salaryPeriod: string;
  } | {
    type: 'FREELANCE';
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

export type SeekerJobResponse = {
  success: true;
  data: {
    job: SeekerDashboardJob;
    alreadyApplied: boolean;
  };
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

export async function request<T>({
  method,
  endpoint,
  body,
  token,
}: ApiRequestOptions): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await response.json().catch(() => undefined);

    if (!response.ok) {
      const errorData = typeof data === 'object' && data !== null ? data as { message?: string; errors?: unknown } : undefined;

      return {
        ok: false,
        status: response.status,
        error: {
          message: errorData?.message ?? 'Request failed',
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
