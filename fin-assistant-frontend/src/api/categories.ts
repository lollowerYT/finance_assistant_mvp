import { apiFetch } from './client';
import type { Category, CategoryType } from '../types/api';

export const categoriesApi = {
  list: (type?: CategoryType, signal?: AbortSignal) => {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiFetch<Category[]>(`/categories${query}`, { method: 'GET', signal });
  },
};
