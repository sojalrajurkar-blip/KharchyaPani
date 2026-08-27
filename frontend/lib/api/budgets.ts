import { apiClient } from './client';
import { Budget, BudgetCreateInput, BudgetUpdateInput, BudgetProgress } from '@/types';

export const budgetsApi = {
  getAll: async (): Promise<Budget[]> => {
    return apiClient<Budget[]>('/api/budgets');
  },

  createOrUpdate: async (data: BudgetCreateInput): Promise<Budget> => {
    return apiClient<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: BudgetUpdateInput): Promise<Budget> => {
    return apiClient<Budget>(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient<void>(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  getStatuses: async (): Promise<BudgetProgress[]> => {
    return apiClient<BudgetProgress[]>('/api/budgets/status');
  },
};
