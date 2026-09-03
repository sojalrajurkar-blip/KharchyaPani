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

// In-Memory Token Store
let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('kharchyapani_access_token', token);
    } else {
      localStorage.removeItem('kharchyapani_access_token');
    }
  }
};

export const getAccessToken = (): string | null => {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('kharchyapani_access_token');
  }
  return null;
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (inMemoryAccessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }


  const config: RequestInit = {
    cache: 'no-store',
    credentials: 'include', // Ensure HttpOnly cookies (refresh token) are sent
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    // Handle 401 Unauthorized by attempting automatic background token refresh
    if (
      response.status === 401 &&
      !endpoint.includes('/api/auth/login') &&
      !endpoint.includes('/api/auth/register') &&
      !endpoint.includes('/api/auth/refresh')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResp = await fetch(`${baseUrl}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (refreshResp.ok) {
            const refreshData = await refreshResp.json();
            const newToken = refreshData.access_token;
            setAccessToken(newToken);
            isRefreshing = false;
            onRefreshed(newToken);

            // Retry original request with the fresh token
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, { ...config, headers });
            if (retryResponse.status === 204) return {} as T;
            const retryData = await retryResponse.json().catch(() => ({}));
            if (!retryResponse.ok) {
              throw new APIException(retryData.detail || 'Request failed after refresh.', retryResponse.status, retryData);
            }
            return retryData as T;
          } else {
            setAccessToken(null);
            isRefreshing = false;
            onRefreshed(null);
          }
        } catch (e) {
          setAccessToken(null);
          isRefreshing = false;
          onRefreshed(null);
        }
      } else {
        // Queue pending requests while refresh is in flight
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber(async (newToken) => {
            if (!newToken) {
              reject(new APIException('Session expired. Please log in again.', 401, null));
              return;
            }
            try {
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(url, { ...config, headers });
              if (retryResponse.status === 204) return resolve({} as T);
              const retryData = await retryResponse.json().catch(() => ({}));
              if (!retryResponse.ok) {
                reject(new APIException(retryData.detail || 'Request failed.', retryResponse.status, retryData));
              } else {
                resolve(retryData as T);
              }
            } catch (err) {
              reject(err);
            }
          });
        });
      }
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
