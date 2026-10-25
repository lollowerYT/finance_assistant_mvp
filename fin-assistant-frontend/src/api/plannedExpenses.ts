import { apiFetch } from './client';
import type { PlannedExpense, PlannedExpenseStatus, PayPlannedExpensePayload } from '../types/api';

export const plannedExpensesApi = {
  list: (status?: PlannedExpenseStatus | '', signal?: AbortSignal) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<PlannedExpense[]>(`/planned-expenses${query}`, { method: 'GET', signal });
  },
  create: (payload: { name: string; amount: string; due_date: string }) =>
    apiFetch<PlannedExpense>('/planned-expenses', { method: 'POST', body: payload }),
  update: (id: number, payload: { name: string; amount: string; due_date: string }) =>
    apiFetch<PlannedExpense>(`/planned-expenses/${id}`, { method: 'PATCH', body: payload }),
  pay: (id: number, payload: PayPlannedExpensePayload) =>
    apiFetch<PlannedExpense>(`/planned-expenses/${id}/pay`, { method: 'PATCH', body: payload }),
  unpay: (id: number) =>
    apiFetch<PlannedExpense>(`/planned-expenses/${id}/unpay`, { method: 'PATCH' }),
  remove: (id: number) =>
    apiFetch<void>(`/planned-expenses/${id}`, { method: 'DELETE' }),
};
