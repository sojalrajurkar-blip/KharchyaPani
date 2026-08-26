import { apiClient } from './client';
import { DashboardSummary } from '@/types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    return apiClient<DashboardSummary>('/api/dashboard');
  },
};
