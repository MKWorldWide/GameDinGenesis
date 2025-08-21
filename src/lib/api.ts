import { ENV } from './env';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestOptions<T = unknown> {
  method?: RequestMethod;
  path: string;
  data?: T;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<Response = unknown, Request = unknown>({
  method = 'GET',
  path,
  data,
  headers = {},
  signal,
}: ApiRequestOptions<Request>): Promise<Response> {
  const url = new URL(path, ENV.API);
  const isFormData = data instanceof FormData;
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(!isFormData && { 'Content-Type': 'application/json' }),
  };

  const response = await fetch(url.toString(), {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: 'include',
    signal,
  });

  const responseData = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      responseData?.message || 'An error occurred',
      response.status,
      responseData
    );
  }

  return responseData as Response;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType) return null;
  
  if (contentType.includes('application/json')) {
    return response.json();
  }
  
  if (contentType.includes('text/')) {
    return response.text();
  }
  
  return response.blob();
}

// Helper methods for common HTTP methods
export const api = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'path'>) =>
    apiRequest<T>({ ...options, method: 'GET', path }),
  
  post: <T, U = unknown>(path: string, data?: U, options?: Omit<ApiRequestOptions<U>, 'method' | 'path' | 'data'>) =>
    apiRequest<T, U>({ ...options, method: 'POST', path, data }),
  
  put: <T, U = unknown>(path: string, data: U, options?: Omit<ApiRequestOptions<U>, 'method' | 'path' | 'data'>) =>
    apiRequest<T, U>({ ...options, method: 'PUT', path, data }),
  
  patch: <T, U = unknown>(path: string, data: Partial<U>, options?: Omit<ApiRequestOptions<Partial<U>>, 'method' | 'path' | 'data'>) =>
    apiRequest<T, Partial<U>>({ ...options, method: 'PATCH', path, data }),
  
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'path'>) =>
    apiRequest<T>({ ...options, method: 'DELETE', path }),
};
