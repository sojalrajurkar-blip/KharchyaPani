export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return 'http://localhost:8000';
};

export class APIException extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'APIException';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    cache: 'no-store',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred.';
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        if (data.detail.message) {
          errorMessage = data.detail.message;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => `${err.loc?.join('.') || 'field'}: ${err.msg || 'invalid'}`).join(', ');
        }
      }
      throw new APIException(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIException) {
      throw error;
    }
    throw new APIException(
      (error as Error).message || 'Network failure connecting to API server.',
      0,
      null
    );
  }
}
