import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { accountsApi } from '../../api/accounts';
import { dashboardApi } from '../../api/dashboard';
import { AppApiError } from '../../api/errors';
import { formatMoney, normalizeMoneyInput } from '../../lib/formatMoney';
import { validateAccountForm } from '../../lib/validation';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Account } from '../../types/api';

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [accList, dash] = await Promise.all([
        accountsApi.list(signal),
        dashboardApi.get(signal),
      ]);
      setAccounts(accList);
      setTotalBalance(dash.total_balance);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Не удалось загрузить счета');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const openCreate = () => {
    setEditingAccount(null);
    setName('');
    setBalance('0.00');
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBalance(acc.balance);
    setFieldErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors = validateAccountForm(name, balance);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const normalizedBalance = normalizeMoneyInput(balance)!;
    setFieldErrors({});
    setSubmitting(true);

    try {
      if (editingAccount) {
        await accountsApi.update(editingAccount.id, {
          name: name.trim(),
          balance: normalizedBalance,
        });
      } else {
        await accountsApi.create({
          name: name.trim(),
          balance: normalizedBalance,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      if (err instanceof AppApiError) {
        setFieldErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Не удалось сохранить счёт');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await accountsApi.remove(deletingAccount.id);
      setDeletingAccount(null);
      await loadData();
    } catch (err) {
      setDeleteError(err instanceof AppApiError ? err.message : 'Не удалось удалить счёт');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Счета</h1>
          <p className="text-xs text-[#6B706B]">Управление вашими счетами и актуальными остатками</p>
        </div>
        <button onClick={openCreate} className="btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Добавить счёт</span>
        </button>
      </div>

      {/* Верхняя сводка по всем счетам (п. 7.2) */}
      <div className="card-surface p-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-[#6B706B]">Общая сумма на счетах</div>
          <div className="text-2xl font-bold tabular-nums mt-0.5">{formatMoney(totalBalance)}</div>
        </div>
        <div className="text-xs text-[#6B706B]">
          Количество счетов: <strong className="text-[#1F2421]">{accounts.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="card-surface p-6 text-xs text-[#6B706B]">Загрузка списка счетов...</div>
      ) : error ? (
        <div className="card-surface p-6 text-center space-y-3">
          <p className="text-xs text-red-700 font-semibold">{error}</p>
          <button onClick={() => loadData()} className="btn-primary px-4 py-2 text-xs font-semibold">
            Повторить
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="card-surface p-8 text-center space-y-3">
          <p className="text-sm font-bold">У вас пока нет добавленных счетов</p>
          <p className="text-xs text-[#6B706B]">
            Добавьте банковскую карту, накопительный счёт или наличные, чтобы начать расчёт доступных средств.
          </p>
          <button onClick={openCreate} className="btn-primary px-4 py-2 text-xs font-semibold">
            Добавить первый счёт
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="card-surface p-5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm">{acc.name}</div>
                <div className="text-2xl font-extrabold tabular-nums my-2">{formatMoney(acc.balance)}</div>
              </div>
              <div className="pt-3 mt-2 border-t border-[#E6E4DD] flex items-center justify-between text-xs">
                <button
                  onClick={() => openEdit(acc)}
                  className="inline-flex items-center gap-1 text-[#0F766E] font-semibold hover:underline"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Изменить</span>
                </button>
                <button
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingAccount(acc);
                  }}
                  className="inline-flex items-center gap-1 text-red-700 font-semibold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Редактировать счёт' : 'Новый счёт'}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Название счёта *</label>
            <input
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Основная карта"
              className="input-control"
            />
            {fieldErrors.name && <p className="text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block font-semibold mb-1">
              {editingAccount ? 'Текущий баланс (₽) *' : 'Начальный баланс (₽) *'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="35000.00"
              className="input-control tabular-nums font-semibold"
            />
            {fieldErrors.balance && <p className="text-red-600 mt-1">{fieldErrors.balance}</p>}
            <p className="text-[11px] text-[#6B706B] mt-1.5">
              {editingAccount
                ? 'Изменение остатка не создаст отдельную операцию в истории.'
                : 'Создание счёта задаёт начальный остаток и не создаёт операцию дохода.'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-4 py-2 font-semibold">
              Отмена
            </button>
            <button type="submit" disabled={submitting} className="btn-primary px-4 py-2 font-semibold">
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDelete}
        title="Удаление счёта"
        description={`Вы действительно хотите удалить счёт «${deletingAccount?.name ?? ''}»? Удаление возможно только в том случае, если к счёту не привязаны операции.`}
        confirmLabel="Удалить счёт"
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
};