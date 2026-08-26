import { apiClient } from './client';
import { HealthResponse } from '@/types';

export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    return apiClient<HealthResponse>('/health');
  },
};
