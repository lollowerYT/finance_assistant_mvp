import { AppApiError, parseApiError } from './errors';
import type { ApiErrorResponse } from '../types/api';

const API_BASE = '/api';

type UnauthorizedHandler = () => void;
let onUnauthorizedCallback: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorizedCallback = handler;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuthRedirect?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRedirect = false, headers, ...rest } = options;
  const method = (rest.method || 'GET').toUpperCase();

  const init: RequestInit = {
    ...rest,
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    throw new AppApiError(0, 'network_error', 'Не удалось соединиться с сервером (проверьте, запущен ли бэкенд на порту 8000)');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const apiErr = parseApiError(response.status, data as ApiErrorResponse | null);
    if (response.status === 401 && !skipAuthRedirect && apiErr.code !== 'invalid_credentials') {
      onUnauthorizedCallback?.();
    }
    throw apiErr;
  }

  return data as T;
}
