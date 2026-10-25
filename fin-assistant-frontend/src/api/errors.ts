import type { ApiErrorResponse } from '../types/api';

export class AppApiError extends Error {
  public status: number;
  public code: string;
  public fieldErrors: Record<string, string>;

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'AppApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

const CODE_MESSAGES: Record<string, string> = {
  authentication_required: 'Сессия истекла. Пожалуйста, войдите снова.',
  invalid_credentials: 'Неверный email или пароль',
  email_already_exists: 'Пользователь с таким email уже зарегистрирован',
  account_not_found: 'Счёт не найден',
  account_has_operations: 'Нельзя удалить счёт, к которому привязаны операции',
  operation_not_found: 'Операция не найдена',
  operation_linked_to_planned_expense: 'Эту операцию нельзя изменить или удалить напрямую, так как она связана с запланированным расходом.',
  planned_expense_not_found: 'Будущий расход не найден',
  planned_expense_already_paid: 'Оплаченный расход нельзя редактировать',
  planned_expense_not_paid: 'Расход ещё не оплачен, поэтому отменить оплату нельзя',
  category_not_found: 'Выбранная категория не найдена',
  insufficient_funds: 'На счёте недостаточно средств (баланс не может стать отрицательным)',
  validation_error: 'Проверьте корректность введённых данных',
  internal_server_error: 'Что-то пошло не так. Попробуйте позже.',
};

export function parseApiError(status: number, body: ApiErrorResponse | null): AppApiError {
  if (status >= 500) {
    return new AppApiError(status, 'internal_server_error', CODE_MESSAGES.internal_server_error);
  }
  const fieldErrors: Record<string, string> = {};
  let code = status === 401 ? 'authentication_required' : 'unknown_error';
  let message = 'Произошла ошибка при обращении к серверу';

  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = body.detail;
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      code = 'validation_error';
      message = CODE_MESSAGES.validation_error;
      for (const item of detail) {
        const fieldName = String(item.loc[item.loc.length - 1] ?? '');
        if (fieldName) fieldErrors[fieldName] = item.msg;
      }
    } else if (detail && typeof detail === 'object') {
      code = detail.code || code;
      message = CODE_MESSAGES[code] || detail.message || message;
      if (Array.isArray(detail.fields)) {
        for (const f of detail.fields) fieldErrors[f.field] = f.message;
      }
    }
  }
  if (CODE_MESSAGES[code]) message = CODE_MESSAGES[code];
  return new AppApiError(status, code, message, fieldErrors);
}
