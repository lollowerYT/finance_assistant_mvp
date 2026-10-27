import React, { useEffect, useState, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { MoneyInput } from '../../components/ui/MoneyInput';
import { categoriesApi } from '../../api/categories';
import { operationsApi } from '../../api/operations';
import { AppApiError } from '../../api/errors';
import { normalizeMoneyInput, isPositiveMoneyString } from '../../lib/formatMoney';
import { getNowDatetimeLocalValue, toLocalIsoWithOffset } from '../../lib/formatDate';
import { validateOperationDatetimeNotFuture } from '../../lib/validation';
import type { Account, Category, Operation, OperationType } from '../../types/api';

interface OperationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Pick<Account, 'id' | 'name' | 'balance'>[];
  initialType?: OperationType;
  editingOperation?: Operation | null;
}

export const OperationFormModal: React.FC<OperationFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  initialType = 'expense',
  editingOperation = null,
}) => {
  const isEditing = Boolean(editingOperation);

  const [type, setType] = useState<OperationType>(initialType);
  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState<number | ''>('');
  const [toAccountId, setToAccountId] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [occurredAt, setOccurredAt] = useState(getNowDatetimeLocalValue());
  const [comment, setComment] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const prevIsOpenRef = useRef(isOpen);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const list = await categoriesApi.list();
      setCategories(list);
    } catch (err) {
      setCategoriesError(
        err instanceof Error ? err.message : 'Не удалось загрузить справочник категорий'
      );
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      loadCategories();

      if (editingOperation) {
        setType(editingOperation.type);
        setAmount(editingOperation.amount);
        setFromAccountId(editingOperation.from_account_id);
        setToAccountId(editingOperation.to_account_id ?? '');
        setCategoryId(editingOperation.category_id ?? '');
        const d = new Date(editingOperation.occurred_at);
        const pad = (n: number) => String(n).padStart(2, '0');
        setOccurredAt(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        );
        setComment(editingOperation.comment ?? '');
      } else {
        setType(initialType);
        setAmount('');
        setFromAccountId(accounts[0]?.id ?? '');
        setToAccountId(accounts[1]?.id ?? '');
        setCategoryId('');
        setOccurredAt(getNowDatetimeLocalValue());
        setComment('');
      }
      setFieldErrors({});
      setFormError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, editingOperation, initialType, accounts]);

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (isOpen && type !== 'transfer' && !isEditing && categories.length > 0) {
      const firstCat = categories.find((c) => c.type === type);
      setCategoryId(firstCat ? firstCat.id : '');
    }
  }, [type, categories, isEditing, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};

    const normalizedAmount = normalizeMoneyInput(amount);
    if (!normalizedAmount || !isPositiveMoneyString(normalizedAmount)) {
      errors.amount = 'Сумма должна быть больше нуля (например, 250.00)';
    }

    if (!fromAccountId) {
      errors.from_account_id = type === 'income' ? 'Выберите счёт зачисления' : 'Выберите счёт списания';
    }

    if (type === 'transfer') {
      if (!toAccountId) {
        errors.to_account_id = 'Выберите счёт зачисления';
      } else if (toAccountId === fromAccountId) {
        errors.to_account_id = 'Счета списания и зачисления должны различаться';
      }
    } else if (!categoryId) {
      errors.category_id = 'Выберите категорию';
    }

    const dateErr = validateOperationDatetimeNotFuture(occurredAt);
    if (dateErr) errors.occurred_at = dateErr;

    if (comment.trim().length > 500) {
      errors.comment = 'Комментарий не должен превышать 500 символов';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const payload = {
      amount: normalizedAmount!,
      occurred_at: toLocalIsoWithOffset(new Date(occurredAt)),
      from_account_id: Number(fromAccountId),
      to_account_id: type === 'transfer' ? Number(toAccountId) : null,
      category_id: type === 'transfer' ? null : Number(categoryId),
      comment: comment.trim() || null,
    };

    try {
      if (isEditing && editingOperation) {
        await operationsApi.update(editingOperation.id, payload);
      } else {
        await operationsApi.create({ type, ...payload });
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof AppApiError) {
        setFieldErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Не удалось сохранить операцию');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled = submitting || categoriesLoading || (type !== 'transfer' && Boolean(categoriesError));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Редактировать операцию' : 'Новая операция'}>
      {!isEditing && (
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EFECE6] rounded-xl mb-4 text-xs font-semibold">
          {(['expense', 'income', 'transfer'] as OperationType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                type === t ? 'bg-white text-[#1F2421] shadow-sm' : 'text-[#6B706B]'
              }`}
            >
              {t === 'expense' ? 'Расход' : t === 'income' ? 'Доход' : 'Перевод'}
            </button>
          ))}
        </div>
      )}

      {categoriesError && type !== 'transfer' && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{categoriesError}</span>
          <button type="button" onClick={loadCategories} className="underline font-semibold ml-2 cursor-pointer">
            Повторить
          </button>
        </div>
      )}

      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
        <MoneyInput
          label="Сумма (₽) *"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
          error={fieldErrors.amount}
        />

        <div>
          <label className="block font-semibold mb-1">
            {type === 'income' ? 'Счёт зачисления *' : 'Счёт списания *'}
          </label>
          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value ? Number(e.target.value) : '')}
            className="input-control"
          >
            <option value="">Выберите счёт</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.balance} ₽)
              </option>
            ))}
          </select>
          {fieldErrors.from_account_id && <p className="text-red-600 mt-1">{fieldErrors.from_account_id}</p>}
        </div>

        {type === 'transfer' ? (
          <div>
            <label className="block font-semibold mb-1">Счёт зачисления *</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value ? Number(e.target.value) : '')}
              className="input-control"
            >
              <option value="">Выберите счёт</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.balance} ₽)
                </option>
              ))}
            </select>
            {fieldErrors.to_account_id && <p className="text-red-600 mt-1">{fieldErrors.to_account_id}</p>}
          </div>
        ) : (
          <div>
            <label className="block font-semibold mb-1">Категория *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              disabled={categoriesLoading || Boolean(categoriesError)}
              className="input-control"
            >
              <option value="">Выберите категорию</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.category_id && <p className="text-red-600 mt-1">{fieldErrors.category_id}</p>}
          </div>
        )}

        <div>
          <label className="block font-semibold mb-1">Дата и время *</label>
          <input
            type="datetime-local"
            max={getNowDatetimeLocalValue()}
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="input-control"
          />
          {fieldErrors.occurred_at && <p className="text-red-600 mt-1">{fieldErrors.occurred_at}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Комментарий (необязательно)</label>
          <input
            type="text"
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например, покупка кофе"
            className="input-control"
          />
          {fieldErrors.comment && <p className="text-red-600 mt-1">{fieldErrors.comment}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 font-semibold cursor-pointer">
            Отмена
          </button>
          <button type="submit" disabled={isSubmitDisabled} className="btn-primary px-4 py-2 font-semibold cursor-pointer">
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
