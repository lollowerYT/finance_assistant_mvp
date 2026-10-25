import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { operationsApi } from '../../api/operations';
import { accountsApi } from '../../api/accounts';
import { categoriesApi } from '../../api/categories';
import { AppApiError } from '../../api/errors';
import { formatMoney } from '../../lib/formatMoney';
import { formatOperationDateTime, dateFilterToIsoBoundary } from '../../lib/formatDate';
import { OperationFormModal } from './OperationFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Account, Category, Operation, OperationType } from '../../types/api';

const PAGE_LIMIT = 50;

export const OperationsPage: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [filterType, setFilterType] = useState<OperationType | ''>('');
  const [filterAccountId, setFilterAccountId] = useState<number | ''>('');
  const [filterCategoryId, setFilterCategoryId] = useState<number | ''>('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);

  const [deletingOp, setDeletingOp] = useState<Operation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadDictionaries = useCallback(async () => {
    try {
      const [accs, cats] = await Promise.all([accountsApi.list(), categoriesApi.list()]);
      setAccounts(accs);
      setCategories(cats);
    } catch {
      // Ошибки справочников обрабатываются при загрузке списка
    }
  }, []);

  const loadOperations = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await operationsApi.list(
          {
            limit: PAGE_LIMIT,
            offset,
            type: filterType,
            account_id: filterAccountId,
            category_id: filterCategoryId,
            from: filterFromDate ? dateFilterToIsoBoundary(filterFromDate, 'start') : undefined,
            to: filterToDate ? dateFilterToIsoBoundary(filterToDate, 'end') : undefined,
          },
          signal
        );
        setOperations(res.items);
        setTotal(res.total);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить историю операций');
      } finally {
        setLoading(false);
      }
    },
    [offset, filterType, filterAccountId, filterCategoryId, filterFromDate, filterToDate]
  );

  useEffect(() => {
    loadDictionaries();
  }, [loadDictionaries]);

  useEffect(() => {
    const controller = new AbortController();
    loadOperations(controller.signal);
    return () => controller.abort();
  }, [loadOperations]);

  const resetFilters = () => {
    setFilterType('');
    setFilterAccountId('');
    setFilterCategoryId('');
    setFilterFromDate('');
    setFilterToDate('');
    setOffset(0);
  };

  const handleDelete = async () => {
    if (!deletingOp) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await operationsApi.remove(deletingOp.id);
      setDeletingOp(null);
      await Promise.all([loadOperations(), loadDictionaries()]);
    } catch (err) {
      setDeleteError(err instanceof AppApiError ? err.message : 'Не удалось удалить операцию');
    } finally {
      setDeleteLoading(false);
    }
  };

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Операции</h1>
          <p className="text-xs text-[#6B706B]">История доходов, расходов и переводов между счетами</p>
        </div>
        <button
          onClick={() => {
            setEditingOp(null);
            setIsModalOpen(true);
          }}
          className="btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить операцию</span>
        </button>
      </div>

      {/* Панель фильтров (п. 6.2) */}
      <div className="card-surface p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end text-xs">
          <div>
            <label className="block font-semibold text-[#6B706B] mb-1">Тип</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as OperationType | '');
                setOffset(0);
              }}
              className="input-control"
            >
              <option value="">Все типы</option>
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
              <option value="transfer">Перевод</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#6B706B] mb-1">Счёт</label>
            <select
              value={filterAccountId}
              onChange={(e) => {
                setFilterAccountId(e.target.value ? Number(e.target.value) : '');
                setOffset(0);
              }}
              className="input-control"
            >
              <option value="">Все счета</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#6B706B] mb-1">Категория</label>
            <select
              value={filterCategoryId}
              onChange={(e) => {
                setFilterCategoryId(e.target.value ? Number(e.target.value) : '');
                setOffset(0);
              }}
              className="input-control"
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#6B706B] mb-1">Дата С</label>
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => {
                setFilterFromDate(e.target.value);
                setOffset(0);
              }}
              className="input-control"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#6B706B] mb-1">Дата По</label>
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => {
                setFilterToDate(e.target.value);
                setOffset(0);
              }}
              className="input-control"
            />
          </div>

          <div>
            <button type="button" onClick={resetFilters} className="btn-secondary w-full py-2 font-semibold">
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card-surface p-6 text-xs text-[#6B706B]">Загрузка операций...</div>
      ) : error ? (
        <div className="card-surface p-6 text-center space-y-3">
          <p className="text-xs text-red-700 font-semibold">{error}</p>
          <button onClick={() => loadOperations()} className="btn-primary px-4 py-2 text-xs font-semibold">
            Повторить
          </button>
        </div>
      ) : operations.length === 0 ? (
        <div className="card-surface p-8 text-center space-y-2">
          <p className="text-sm font-bold">Операции не найдены</p>
          <p className="text-xs text-[#6B706B]">Попробуйте изменить параметры фильтрации или добавьте новую операцию.</p>
        </div>
      ) : (
        <>
          {/* Таблица для Desktop (п. 6.3) */}
          <div className="hidden md:block card-surface overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFBF9] border-b border-[#E6E4DD] text-[#6B706B] uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Дата и время</th>
                  <th className="py-3 px-4">Тип</th>
                  <th className="py-3 px-4">Категория</th>
                  <th className="py-3 px-4">Описание</th>
                  <th className="py-3 px-4">Счёт / Счета</th>
                  <th className="py-3 px-4 text-right">Сумма</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {operations.map((op) => {
                  const fromName = accountMap.get(op.from_account_id) || `Счёт #${op.from_account_id}`;
                  const toName = op.to_account_id
                    ? accountMap.get(op.to_account_id) || `Счёт #${op.to_account_id}`
                    : '';
                  const catName = op.type === 'transfer' ? '—' : categoryMap.get(op.category_id ?? 0) || '—';

                  return (
                    <tr key={op.id} className="hover:bg-[#FCFBF9]">
                      <td className="py-3 px-4 whitespace-nowrap text-[#6B706B]">
                        {formatOperationDateTime(op.occurred_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                            op.type === 'income'
                              ? 'bg-emerald-50 text-emerald-800'
                              : op.type === 'transfer'
                              ? 'bg-teal-50 text-teal-800'
                              : 'bg-[#EFECE6] text-[#1F2421]'
                          }`}
                        >
                          {op.type === 'income' ? 'Доход' : op.type === 'transfer' ? 'Перевод' : 'Расход'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{catName}</td>
                      <td className="py-3 px-4 text-[#6B706B] max-w-xs truncate">{op.comment || '—'}</td>
                      <td className="py-3 px-4">
                        {op.type === 'transfer' ? `${fromName} → ${toName}` : fromName}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap ${
                          op.type === 'income' ? 'text-[#047857]' : ''
                        }`}
                      >
                        {op.type === 'income' ? '+' : op.type === 'expense' ? '−' : ''}
                        {formatMoney(op.amount)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingOp(op);
                            setIsModalOpen(true);
                          }}
                          aria-label="Редактировать операцию"
                          className="p-1 text-[#6B706B] hover:text-[#1F2421] mr-1"
                        >
                          <Pencil className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingOp(op);
                          }}
                          aria-label="Удалить операцию"
                          className="p-1 text-red-700 hover:text-red-900"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Карточки для Mobile (п. 6.3) */}
          <div className="md:hidden space-y-2.5">
            {operations.map((op) => {
              const fromName = accountMap.get(op.from_account_id) || `Счёт #${op.from_account_id}`;
              const toName = op.to_account_id
                ? accountMap.get(op.to_account_id) || `Счёт #${op.to_account_id}`
                : '';
              const catName =
                op.type === 'transfer' ? 'Перевод между счетами' : categoryMap.get(op.category_id ?? 0) || '—';

              return (
                <div key={op.id} className="card-surface p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded bg-[#EFECE6] font-semibold text-[10px]">
                      {op.type === 'income' ? 'Доход' : op.type === 'transfer' ? 'Перевод' : 'Расход'}
                    </span>
                    <span className={`font-bold tabular-nums text-sm ${op.type === 'income' ? 'text-[#047857]' : ''}`}>
                      {op.type === 'income' ? '+' : op.type === 'expense' ? '−' : ''}
                      {formatMoney(op.amount)}
                    </span>
                  </div>
                  <div className="font-bold">{catName}</div>
                  {op.comment && <div className="text-[#6B706B] text-[11px]">{op.comment}</div>}
                  <div className="pt-2 border-t border-[#E6E4DD] flex justify-between items-center text-[11px] text-[#6B706B]">
                    <span>
                      {op.type === 'transfer' ? `${fromName} → ${toName}` : fromName} •{' '}
                      {formatOperationDateTime(op.occurred_at)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingOp(op);
                          setIsModalOpen(true);
                        }}
                        className="text-[#0F766E] font-semibold"
                      >
                        Изм.
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingOp(op);
                        }}
                        className="text-red-700 font-semibold"
                      >
                        Удал.
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Пагинация (п. 6.4) */}
          <div className="flex items-center justify-between text-xs text-[#6B706B] pt-2">
            <span>
              Показано {offset + 1}–{Math.min(offset + operations.length, total)} из {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_LIMIT))}
                className="btn-secondary px-3 py-1.5 font-semibold disabled:opacity-50"
              >
                ← Назад
              </button>
              <button
                disabled={offset + PAGE_LIMIT >= total}
                onClick={() => setOffset((o) => o + PAGE_LIMIT)}
                className="btn-secondary px-3 py-1.5 font-semibold disabled:opacity-50"
              >
                Вперёд →
              </button>
            </div>
          </div>
        </>
      )}

      <OperationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadOperations();
          loadDictionaries();
        }}
        accounts={accounts}
        editingOperation={editingOp}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingOp)}
        onClose={() => setDeletingOp(null)}
        onConfirm={handleDelete}
        title="Удалить операцию?"
        description="Баланс связанного счёта будет автоматически пересчитан на сервере."
        confirmLabel="Удалить"
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
};