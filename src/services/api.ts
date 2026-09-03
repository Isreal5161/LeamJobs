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
