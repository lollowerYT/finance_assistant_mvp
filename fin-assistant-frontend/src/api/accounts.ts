import { apiFetch } from './client';
import type { Account } from '../types/api';

export const accountsApi = {
  list: (signal?: AbortSignal) => apiFetch<Account[]>('/accounts', { method: 'GET', signal }),
  getById: (id: number) => apiFetch<Account>(`/accounts/${id}`, { method: 'GET' }),
  create: (payload: { name: string; balance: string }) =>
    apiFetch<Account>('/accounts', { method: 'POST', body: payload }),
  update: (id: number, payload: { name?: string; balance?: string }) =>
    apiFetch<Account>(`/accounts/${id}`, { method: 'PATCH', body: payload }),
  remove: (id: number) => apiFetch<void>(`/accounts/${id}`, { method: 'DELETE' }),
};
