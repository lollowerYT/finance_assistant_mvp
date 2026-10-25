import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { categoriesApi } from '../../api/categories';
import { plannedExpensesApi } from '../../api/plannedExpenses';
import { AppApiError } from '../../api/errors';
import { formatMoney } from '../../lib/formatMoney';
import { getNowDatetimeLocalValue, toLocalIsoWithOffset } from '../../lib/formatDate';
import { validateOperationDatetimeNotFuture } from '../../lib/validation';
import type { Account, Category, PlannedExpense } from '../../types/api';

interface PayPlannedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Pick<PlannedExpense, 'id' | 'name' | 'amount'> | null;
  accounts: Pick<Account, 'id' | 'name' | 'balance'>[];
}

export const PayPlannedExpenseModal: React.FC<PayPlannedExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expense,
  accounts,
}) => {
  const [accountId, setAccountId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [occurredAt, setOccurredAt] = useState(getNowDatetimeLocalValue());
  const [comment, setComment] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadExpenseCategories = async () => {
    setCatLoading(true);
    setCatError(null);
    try {
      const list = await categoriesApi.list('expense');
      setCategories(list);
      if (list[0]) setCategoryId(list[0].id);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Ошибка загрузки категорий расходов');
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadExpenseCategories();
    setAccountId(accounts[0]?.id ?? '');
    setOccurredAt(getNowDatetimeLocalValue());
    setComment('');
    setFormError(null);
  }, [isOpen, accounts]);

  if (!expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!accountId) {
      setFormError('Выберите счёт списания');
      return;
    }
    if (!categoryId) {
      setFormError('Выберите категорию расхода');
      return;
    }
    const dateErr = validateOperationDatetimeNotFuture(occurredAt);
    if (dateErr) {
      setFormError(dateErr);
      return;
    }

    setSubmitting(true);
    try {
      await plannedExpensesApi.pay(expense.id, {
        account_id: Number(accountId),
        category_id: Number(categoryId),
        occurred_at: toLocalIsoWithOffset(new Date(occurredAt)),
        comment: comment.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err instanceof AppApiError ? err.message : 'Не удалось отметить расход оплаченным');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Оплата будущего расхода">
      <p className="text-xs text-[#6B706B] mb-4">
        Платеж <strong>«{expense.name}»</strong> на сумму{' '}
        <strong className="tabular-nums text-[#1F2421]">{formatMoney(expense.amount)}</strong> будет списан с
        выбранного счёта и добавлен в историю операций.
      </p>

      {catError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex justify-between">
          <span>{catError}</span>
          <button type="button" onClick={loadExpenseCategories} className="underline font-semibold">
            Повторить
          </button>
        </div>
      )}

      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="block font-semibold mb-1">Счёт списания *</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
            className="input-control"
          >
            <option value="">Выберите счёт</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatMoney(acc.balance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Категория расхода *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            disabled={catLoading || Boolean(catError)}
            className="input-control"
          >
            <option value="">Выберите категорию</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Дата и время операции</label>
          <input
            type="datetime-local"
            max={getNowDatetimeLocalValue()}
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="input-control"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Комментарий (необязательно)</label>
          <input
            type="text"
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-control"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 font-semibold">
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting || catLoading || Boolean(catError)}
            className="btn-primary px-4 py-2 font-semibold"
          >
            {submitting ? 'Оплата...' : 'Подтвердить оплату'}
          </button>
        </div>
      </form>
    </Modal>
  );
};