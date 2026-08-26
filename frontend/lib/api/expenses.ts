import { apiClient } from './client';
import { Expense, ExpenseCreateInput, ExpenseUpdateInput, ExpenseFilterParams } from '@/types';

export const expensesApi = {
  getAll: async (filters: ExpenseFilterParams = {}): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters.category_id !== undefined && filters.category_id !== null) {
      params.append('category_id', filters.category_id.toString());
    }
    if (filters.date) {
      params.append('date', filters.date);
    }
    if (filters.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params.append('date_to', filters.date_to);
    }

    const queryString = params.toString();
    const endpoint = `/api/expenses${queryString ? `?${queryString}` : ''}`;
    return apiClient<Expense[]>(endpoint);
  },

  getById: async (id: number): Promise<Expense> => {
    return apiClient<Expense>(`/api/expenses/${id}`);
  },

  create: async (data: ExpenseCreateInput): Promise<Expense> => {
    return apiClient<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: ExpenseUpdateInput): Promise<Expense> => {
    return apiClient<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient<void>(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};
