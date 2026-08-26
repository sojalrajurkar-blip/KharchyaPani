import { apiClient } from './client';
import { Category, CategoryCreateInput, CategoryUpdateInput } from '@/types';

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    return apiClient<Category[]>('/api/categories');
  },

  getById: async (id: number): Promise<Category> => {
    return apiClient<Category>(`/api/categories/${id}`);
  },

  create: async (data: CategoryCreateInput): Promise<Category> => {
    return apiClient<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: CategoryUpdateInput): Promise<Category> => {
    return apiClient<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiClient<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
