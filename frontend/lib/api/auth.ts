import { apiClient, setAccessToken } from './client';
import {
  User,
  TokenResponse,
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  ResetPasswordInput,
} from '@/types';

export const authApi = {
  async register(data: RegisterInput): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAccessToken(res.access_token);
    return res;
  },

  async login(data: LoginInput): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAccessToken(res.access_token);
    return res;
  },

  async googleLogin(credential: string): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    setAccessToken(res.access_token);
    return res;
  },

  async refresh(): Promise<TokenResponse> {
    const res = await apiClient<TokenResponse>('/api/auth/refresh', {
      method: 'POST',
    });
    setAccessToken(res.access_token);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await apiClient('/api/auth/logout-all', { method: 'POST' });
    } finally {
      setAccessToken(null);
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
    return apiClient<{ message: string; reset_token?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: ChangePasswordInput): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<User> {
    return apiClient<User>('/api/auth/me');
  },
};
