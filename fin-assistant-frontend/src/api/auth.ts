import { apiFetch } from './client';
import type { User } from '../types/api';

export const authApi = {
  register: (email: string, password: string) =>
    apiFetch<User>('/auth/register', { method: 'POST', body: { email, password }, skipAuthRedirect: true }),
  login: (email: string, password: string) =>
    apiFetch<User | void>('/auth/login', { method: 'POST', body: { email, password }, skipAuthRedirect: true }),
  me: (signal?: AbortSignal) =>
    apiFetch<User>('/auth/me', { method: 'GET', signal, skipAuthRedirect: true }),
  logout: () =>
    apiFetch<void>('/auth/logout', { method: 'POST' }),
};
