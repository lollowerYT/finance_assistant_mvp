import { apiFetch } from './client';
import type { Reserve } from '../types/api';

export const reserveApi = {
  get: (signal?: AbortSignal) => apiFetch<Reserve>('/reserve', { method: 'GET', signal }),
  update: (amount: string) => apiFetch<Reserve>('/reserve', { method: 'PUT', body: { amount } }),
};
