import { apiFetch } from './client';
import type { Operation, OperationsFilterParams, PaginatedResponse, OperationType } from '../types/api';

export interface CreateOperationPayload {
  type: OperationType;
  amount: string;
  occurred_at: string;
  from_account_id: number;
  to_account_id?: number | null;
  category_id?: number | null;
  comment?: string | null;
}

export type UpdateOperationPayload = Omit<CreateOperationPayload, 'type'>;

export const operationsApi = {
  list: (params: OperationsFilterParams = {}, signal?: AbortSignal) => {
    const search = new URLSearchParams();
    search.set('limit', String(params.limit ?? 50));
    search.set('offset', String(params.offset ?? 0));
    if (params.type) search.set('type', params.type);
    if (params.account_id) search.set('account_id', String(params.account_id));
    if (params.category_id) search.set('category_id', String(params.category_id));
    if (params.from) search.set('from', params.from);
    if (params.to) search.set('to', params.to);
    return apiFetch<PaginatedResponse<Operation>>(`/operations?${search.toString()}`, { method: 'GET', signal });
  },
  getById: (id: number) => apiFetch<Operation>(`/operations/${id}`, { method: 'GET' }),
  create: (payload: CreateOperationPayload) =>
    apiFetch<Operation>('/operations', { method: 'POST', body: payload }),
  update: (id: number, payload: UpdateOperationPayload) =>
    apiFetch<Operation>(`/operations/${id}`, { method: 'PATCH', body: payload }),
  remove: (id: number) => apiFetch<void>(`/operations/${id}`, { method: 'DELETE' }),
};
