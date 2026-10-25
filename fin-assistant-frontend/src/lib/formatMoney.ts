const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amountStr: string | undefined | null): string {
  if (!amountStr) return '0,00 ₽';
  const normalized = amountStr.trim().replace(',', '.');
  const isNegative = normalized.startsWith('-');
  const numericPart = Number(normalized);
  if (Number.isNaN(numericPart)) return `${amountStr} ₽`;
  const formatted = rubFormatter.format(Math.abs(numericPart));
  return isNegative ? `−${formatted}` : formatted;
}

export function isNegativeAmount(amountStr: string | undefined | null): boolean {
  if (!amountStr) return false;
  const trimmed = amountStr.trim();
  return trimmed.startsWith('-') && !/^-[0.,]+$/.test(trimmed);
}

export function normalizeMoneyInput(raw: string): string | null {
  const cleaned = raw.trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [intPart, decPart = ''] = cleaned.split('.');
  const cleanInt = intPart.replace(/^0+(?=\d)/, '');
  const paddedDec = (decPart + '00').slice(0, 2);
  return `${cleanInt}.${paddedDec}`;
}

export function isPositiveMoneyString(normalized: string): boolean {
  return !/^0+\.00$/.test(normalized);
}
