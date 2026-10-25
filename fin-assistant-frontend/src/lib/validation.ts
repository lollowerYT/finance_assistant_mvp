import { normalizeMoneyInput, isPositiveMoneyString } from './formatMoney';

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Укажите email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Некорректный формат email';
  return null;
}

export function validateAccountForm(name: string, balanceRaw: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedName = name.trim();
  if (!trimmedName) errors.name = 'Введите название счёта';
  else if (trimmedName.length > 100) errors.name = 'Название счёта не должно превышать 100 символов';

  const normalized = normalizeMoneyInput(balanceRaw);
  if (normalized === null) errors.balance = 'Введите корректную неотрицательную сумму (например, 35000.00)';
  return errors;
}

export function validatePlannedExpenseForm(name: string, amountRaw: string, dueDate: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedName = name.trim();
  if (!trimmedName) errors.name = 'Введите название расхода';
  else if (trimmedName.length > 150) errors.name = 'Название не должно превышать 150 символов';

  const normalized = normalizeMoneyInput(amountRaw);
  if (normalized === null || !isPositiveMoneyString(normalized)) {
    errors.amount = 'Сумма должна быть строго больше нуля';
  }
  if (!dueDate) errors.due_date = 'Укажите дату планируемого платежа';
  return errors;
}

export function validateOperationDatetimeNotFuture(datetimeLocalVal: string): string | null {
  if (!datetimeLocalVal) return 'Укажите дату и время операции';
  const selected = new Date(datetimeLocalVal);
  if (Number.isNaN(selected.getTime())) return 'Некорректная дата';
  if (selected.getTime() > Date.now() + 60_000) return 'Дата операции не может находиться в будущем';
  return null;
}
