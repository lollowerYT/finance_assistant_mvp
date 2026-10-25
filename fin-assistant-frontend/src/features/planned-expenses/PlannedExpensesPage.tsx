import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { plannedExpensesApi } from '../../api/plannedExpenses';
import { dashboardApi } from '../../api/dashboard';
import { AppApiError } from '../../api/errors';
import { formatMoney, normalizeMoneyInput } from '../../lib/formatMoney';
import { formatDueDate } from '../../lib/formatDate';
import { validatePlannedExpenseForm } from '../../lib/validation';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PayPlannedExpenseModal } from './PayPlannedExpenseModal';
import type { Account, PlannedExpense, PlannedExpenseStatus } from '../../types/api';

export const PlannedExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<PlannedExpense[]>([]);
  const [upcomingTotal, setUpcomingTotal] = useState('0.00');
  const [accounts, setAccounts] = useState<Pick<Account, 'id' | 'name' | 'balance'>[]>([]);
  const [statusFilter, setStatusFilter] = useState<PlannedExpenseStatus | ''>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PlannedExpense | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [payingExpense, setPayingExpense] = useState<PlannedExpense | null>(null);
  const [unpayingExpense, setUnpayingExpense] = useState<PlannedExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<PlannedExpense | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const [list, dash] = await Promise.all([
          plannedExpensesApi.list(statusFilter, signal),
          dashboardApi.get(signal),
        ]);
        setExpenses(list);
        setUpcomingTotal(dash.upcoming_expenses_total);
        setAccounts(dash.accounts);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить будущие расходы');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const openCreate = () => {
    setEditingExpense(null);
    setName('');
    setAmount('');
    setDueDate(new Date().toISOString().slice(0, 10));
    setFieldErrors({});
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (exp: PlannedExpense) => {
    setEditingExpense(exp);
    setName(exp.name);
    setAmount(exp.amount);
    setDueDate(exp.due_date);
    setFieldErrors({});
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors = validatePlannedExpenseForm(name, amount, dueDate);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const normalizedAmount = normalizeMoneyInput(amount)!;
    setFieldErrors({});
    setSubmitting(true);

    try {
      if (editingExpense) {
        await plannedExpensesApi.update(editingExpense.id, {
          name: name.trim(),
          amount: normalizedAmount,
          due_date: dueDate,
        });
      } else {
        await plannedExpensesApi.create({
          name: name.trim(),
          amount: normalizedAmount,
          due_date: dueDate,
        });
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      if (err instanceof AppApiError) {
        setFieldErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Не удалось сохранить будущий расход');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnpay = async () => {
    if (!unpayingExpense) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await plannedExpensesApi.unpay(unpayingExpense.id);
      setUnpayingExpense(null);
      await loadData();
    } catch (err) {
      setActionError(err instanceof AppApiError ? err.message : 'Не удалось отменить оплату');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await plannedExpensesApi.remove(deletingExpense.id);
      setDeletingExpense(null);
      await loadData();
    } catch (err) {
      setActionError(err instanceof AppApiError ? err.message : 'Не удалось удалить запись');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Будущие расходы</h1>
          <p className="text-xs text-[#6B706B]">
            Все неоплаченные расходы учитываются при расчёте доступной суммы независимо от даты
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Добавить расход</span>
        </button>
      </div>

      {/* Верхняя сводка и фильтр статуса (п. 8.2) */}
      <div className="card-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#6B706B]">Сумма неоплаченных будущих расходов</div>
          <div className="text-xl font-bold tabular-nums text-amber-800">{formatMoney(upcomingTotal)}</div>
        </div>
        <div className="flex gap-1.5 text-xs">
          {(['', 'pending', 'paid'] as const).map((st) => (
            <button
              key={st || 'all'}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                statusFilter === st ? 'bg-[#0F766E] text-white' : 'btn-secondary'
              }`}
            >
              {st === '' ? 'Все' : st === 'pending' ? 'Ожидают оплаты' : 'Оплаченные'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card-surface p-6 text-xs text-[#6B706B]">Загрузка будущих расходов...</div>
      ) : error ? (
        <div className="card-surface p-6 text-center space-y-3">
          <p className="text-xs text-red-700 font-semibold">{error}</p>
          <button onClick={() => loadData()} className="btn-primary px-4 py-2 text-xs font-semibold">
            Повторить
          </button>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card-surface p-8 text-center space-y-2">
          <p className="text-sm font-bold">Запланированных расходов нет</p>
          <p className="text-xs text-[#6B706B]">
            Добавьте предстоящие обязательные платежи (аренда, связь, кредиты), чтобы зарезервировать под них деньги.
          </p>
        </div>
      ) : (
        <div className="card-surface divide-y divide-[#E6E4DD]">
          {expenses.map((exp) => (
            <div key={exp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{exp.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      exp.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {exp.status === 'pending' ? 'Ожидает оплаты' : 'Оплачен'}
                  </span>
                </div>
                <div className="text-[11px] text-[#6B706B] mt-0.5">Дата оплаты: {formatDueDate(exp.due_date)}</div>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                <span className="font-extrabold tabular-nums text-sm">{formatMoney(exp.amount)}</span>

                {exp.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPayingExpense(exp)}
                      className="btn-primary px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Отметить оплаченным</span>
                    </button>
                    <button
                      onClick={() => openEdit(exp)}
                      aria-label="Редактировать расход"
                      className="btn-secondary p-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActionError(null);
                        setDeletingExpense(exp);
                      }}
                      aria-label="Удалить расход"
                      className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActionError(null);
                        setUnpayingExpense(exp);
                      }}
                      className="btn-secondary px-2.5 py-1.5 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Вернуть в неоплаченные</span>
                    </button>
                    <button
                      onClick={() => {
                        setActionError(null);
                        setDeletingExpense(exp);
                      }}
                      aria-label="Удалить расход"
                      className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingExpense ? 'Редактировать будущий расход' : 'Новый будущий расход'}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Название платежа *</label>
            <input
              type="text"
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Аренда квартиры"
              className="input-control"
            />
            {fieldErrors.name && <p className="text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block font-semibold mb-1">Сумма (₽) *</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15000.00"
              className="input-control tabular-nums font-semibold"
            />
            {fieldErrors.amount && <p className="text-red-600 mt-1">{fieldErrors.amount}</p>}
          </div>

          <div>
            <label className="block font-semibold mb-1">Плановая дата оплаты *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-control"
            />
            {fieldErrors.due_date && <p className="text-red-600 mt-1">{fieldErrors.due_date}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary px-4 py-2 font-semibold">
              Отмена
            </button>
            <button type="submit" disabled={submitting} className="btn-primary px-4 py-2 font-semibold">
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>

      <PayPlannedExpenseModal
        isOpen={Boolean(payingExpense)}
        onClose={() => setPayingExpense(null)}
        onSuccess={() => loadData()}
        expense={payingExpense}
        accounts={accounts}
      />

      <ConfirmDialog
        isOpen={Boolean(unpayingExpense)}
        onClose={() => setUnpayingExpense(null)}
        onConfirm={handleUnpay}
        title="Вернуть расход в неоплаченные?"
        description="Связанная расходная операция будет удалена из истории, а списанная сумма вернётся на баланс счёта."
        confirmLabel="Вернуть в неоплаченные"
        isDanger={false}
        loading={actionLoading}
        error={actionError}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDelete}
        title="Удалить будущий расход?"
        description={
          deletingExpense?.status === 'paid'
            ? 'Запись о запланированном расходе будет удалена, но созданная при оплате расходная операция останется в истории операций.'
            : 'Неоплаченный расход будет удалён, а доступная для трат сумма увеличится.'
        }
        confirmLabel="Удалить"
        loading={actionLoading}
        error={actionError}
      />
    </div>
  );
};