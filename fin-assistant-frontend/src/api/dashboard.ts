import { apiFetch } from './client';
import type { Dashboard } from '../types/api';

export const dashboardApi = {
  get: (signal?: AbortSignal) => apiFetch<Dashboard>('/dashboard', { method: 'GET', signal }),
};
