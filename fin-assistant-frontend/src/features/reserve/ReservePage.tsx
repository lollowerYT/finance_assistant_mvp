import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { reserveApi } from '../../api/reserve';
import { dashboardApi } from '../../api/dashboard';
import { AppApiError } from '../../api/errors';
import { formatMoney, normalizeMoneyInput } from '../../lib/formatMoney';

export const ReservePage: React.FC = () => {
  const [currentReserve, setCurrentReserve] = useState('0.00');
  const [availableAmount, setAvailableAmount] = useState('0.00');
  const [amountInput, setAmountInput] = useState('0.00');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadReserve = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [resData, dashData] = await Promise.all([
        reserveApi.get(signal),
        dashboardApi.get(signal),
      ]);
      setCurrentReserve(resData.amount);
      setAmountInput(resData.amount);
      setAvailableAmount(dashData.available_amount);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Не удалось загрузить финансовый резерв');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadReserve(controller.signal);
    return () => controller.abort();
  }, [loadReserve]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const normalized = normalizeMoneyInput(amountInput);
    if (normalized === null) {
      setError('Введите корректную неотрицательную сумму (разрешено значение 0)');
      return;
    }

    setSubmitting(true);
    try {
      await reserveApi.update(normalized);
      await loadReserve();
      setSuccessMsg('Сумма финансового резерва успешно обновлена');
    } catch (err) {
      setError(err instanceof AppApiError ? err.message : 'Не удалось сохранить резерв');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Финансовый резерв</h1>
        <p className="text-xs text-[#6B706B] mt-0.5">
          Резерв — сумма, которую вы хотите сохранить. Она вычитается из доступных для трат денег, но не перемещается между вашими счетами.
        </p>
      </div>

      {loading ? (
        <div className="card-surface p-6 text-xs text-[#6B706B]">Загрузка данных резерва...</div>
      ) : (
        <div className="card-surface p-6 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FCFBF9] border border-[#E6E4DD]">
            <div>
              <div className="text-xs text-[#6B706B]">Текущий размер резерва</div>
              <div className="text-2xl font-extrabold tabular-nums mt-0.5">{formatMoney(currentReserve)}</div>
              <div className="text-[11px] text-[#6B706B] mt-1">
                Доступно для трат с учётом резерва: <strong className="text-[#1F2421]">{formatMoney(availableAmount)}</strong>
              </div>
            </div>
            <ShieldCheck className="w-8 h-8 text-[#0F766E]" />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            <div>
              <label htmlFor="reserve-input" className="block font-semibold mb-1.5">
                Новая сумма резерва (₽)
              </label>
              <input
                id="reserve-input"
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="15000.00"
                className="input-control tabular-nums font-semibold"
              />
              <p className="text-[11px] text-[#6B706B] mt-1">
                Вы можете указать 0, если не хотите удерживать резерв при расчёте доступной суммы.
              </p>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary px-5 py-2.5 font-semibold">
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};