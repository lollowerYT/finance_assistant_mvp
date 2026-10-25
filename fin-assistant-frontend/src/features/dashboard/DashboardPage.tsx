import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Wallet, CalendarClock, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { operationsApi } from '../../api/operations';
import { categoriesApi } from '../../api/categories';
import { formatMoney, isNegativeAmount } from '../../lib/formatMoney';
import { formatDueDate, formatOperationDateTime } from '../../lib/formatDate';
import { OperationFormModal } from '../operations/OperationFormModal';
import { PayPlannedExpenseModal } from '../planned-expenses/PayPlannedExpenseModal';
import type { Category, Dashboard, Operation, PlannedExpense } from '../../types/api';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [recentOps, setRecentOps] = useState<Operation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(true);

  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [payingExpense, setPayingExpense] = useState<Pick<PlannedExpense, 'id' | 'name' | 'amount'> | null>(null);

  const loadDashboardData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, opsData, catsData] = await Promise.all([
        dashboardApi.get(signal),
        operationsApi.list({ limit: 5, offset: 0 }, signal),
        categoriesApi.list(undefined, signal),
      ]);
      setDashboard(dashData);
      setRecentOps(opsData.items);
      setCategories(catsData);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные главной страницы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboardData(controller.signal);
    return () => controller.abort();
  }, [loadDashboardData]);

  if (loading && !dashboard) {
    return (
      <div className="space-y-4">
        <div className="card-surface p-8 animate-pulse h-44" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-surface p-6 animate-pulse h-24" />
          <div className="card-surface p-6 animate-pulse h-24" />
          <div className="card-surface p-6 animate-pulse h-24" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="card-surface p-6 text-center space-y-3">
        <p className="text-sm font-bold text-red-700">{error || 'Ошибка загрузки'}</p>
        <button onClick={() => loadDashboardData()} className="btn-primary px-4 py-2 text-xs font-semibold">
          Повторить попытку
        </button>
      </div>
    );
  }

  const isDeficit = isNegativeAmount(dashboard.available_amount);
  const isNewUserEmpty =
    dashboard.accounts.length === 0 &&
    dashboard.upcoming_expenses.length === 0 &&
    recentOps.length === 0;

  const accountMap = new Map(dashboard.accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      {/* Шапка страницы (п. 5.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Мои финансы</h1>
          <p className="text-xs text-[#6B706B]">Актуальный расчёт свободных средств</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsOpModalOpen(true)}
            disabled={dashboard.accounts.length === 0}
            className="btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить операцию</span>
          </button>
          <Link to="/accounts" className="btn-secondary px-3 py-2 text-xs font-semibold">
            + Счёт
          </Link>
          <Link to="/planned-expenses" className="btn-secondary px-3 py-2 text-xs font-semibold">
            + Запланировать расход
          </Link>
        </div>
      </div>

      {/* Пустое состояние нового пользователя (п. 5.8) */}
      {isNewUserEmpty && (
        <div className="card-surface p-6 border-dashed border-2 border-[#0F766E]/40 bg-[#FCFBF9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold">Добро пожаловать в ФинПомощник!</h2>
            <p className="text-xs text-[#6B706B] mt-1">
              У вас пока не добавлено ни одного счёта. Добавьте первый счёт, чтобы приложение рассчитало доступную для трат сумму.
            </p>
          </div>
          <Link to="/accounts" className="btn-primary px-4 py-2 text-xs font-semibold shrink-0">
            Добавить первый счёт
          </Link>
        </div>
      )}

      {/* Главная карточка доступной суммы (п. 5.2) */}
      <div
        className={`card-surface p-6 md:p-7 ${
          isDeficit ? 'border-2 border-red-300 bg-red-50/40' : 'border-2 border-[#0F766E]/25 bg-[#FCFBF9]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B706B]">
                Доступно для трат
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                  isDeficit
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-[#CCFBF1] text-[#0F766E]'
                }`}
              >
                {isDeficit ? 'Дефицит бюджета' : 'Свободный остаток'}
              </span>
            </div>

            <div
              className={`text-3xl md:text-5xl font-extrabold tabular-nums tracking-tight my-1 ${
                isDeficit ? 'text-red-700' : 'text-[#1F2421]'
              }`}
            >
              {formatMoney(dashboard.available_amount)}
            </div>

            <p className={`text-xs mt-2 ${isDeficit ? 'text-red-700 font-semibold' : 'text-[#6B706B]'}`}>
              {isDeficit
                ? 'Будущие обязательства и резерв превышают текущие остатки на счетах.'
                : 'С учётом неоплаченных будущих платежей и установленного финансового резерва.'}
            </p>

            <button
              type="button"
              onClick={() => setShowFormula((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:underline"
            >
              <span>Как рассчитана сумма</span>
              {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showFormula && (
            <div className="bg-white border border-[#E6E4DD] rounded-2xl p-4 min-w-[270px] text-xs space-y-2">
              <div className="font-bold text-[#1F2421] mb-1">Расшифровка расчёта:</div>
              <div className="flex justify-between">
                <span className="text-[#6B706B]">Всего на счетах:</span>
                <span className="font-semibold tabular-nums">{formatMoney(dashboard.total_balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B706B]">Будущие расходы:</span>
                <span className="font-semibold tabular-nums text-amber-800">
                  − {formatMoney(dashboard.upcoming_expenses_total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B706B]">Финансовый резерв:</span>
                <span className="font-semibold tabular-nums">− {formatMoney(dashboard.reserve_amount)}</span>
              </div>
              <div className="border-t border-[#E6E4DD] pt-2 flex justify-between font-bold text-sm">
                <span>Доступно:</span>
                <span className={`tabular-nums ${isDeficit ? 'text-red-700' : 'text-[#0F766E]'}`}>
                  {formatMoney(dashboard.available_amount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 карточки финансовой сводки (п. 5.3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-surface p-4">
          <div className="flex items-center justify-between text-xs text-[#6B706B] mb-1">
            <span>Всего на счетах</span>
            <Wallet className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-xl font-bold tabular-nums">{formatMoney(dashboard.total_balance)}</div>
          <p className="text-[11px] text-[#6B706B] mt-1">Сумма текущих остатков по всем счетам</p>
        </div>

        <div className="card-surface p-4">
          <div className="flex items-center justify-between text-xs text-[#6B706B] mb-1">
            <span>Будущие расходы</span>
            <CalendarClock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold tabular-nums text-amber-800">
            {formatMoney(dashboard.upcoming_expenses_total)}
          </div>
          <p className="text-[11px] text-[#6B706B] mt-1">
            Деньги пока на счетах, но отложены под обязательные платежи
          </p>
        </div>

        <div
          onClick={() => navigate('/reserve')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/reserve')}
          className="card-surface p-4 cursor-pointer hover:border-[#0F766E] transition"
        >
          <div className="flex items-center justify-between text-xs text-[#6B706B] mb-1">
            <span>Финансовый резерв</span>
            <span className="text-[#0F766E] font-semibold flex items-center gap-1">
              Изменить <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold tabular-nums">{formatMoney(dashboard.reserve_amount)}</div>
          <p className="text-[11px] text-[#6B706B] mt-1">Неприкосновенная подушка безопасности</p>
        </div>
      </div>

      {/* Счета (п. 5.4) и Будущие расходы (п. 5.5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">Счета</h2>
            <Link to="/accounts" className="text-xs font-semibold text-[#0F766E] hover:underline">
              Все счета →
            </Link>
          </div>

          {dashboard.accounts.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-[#6B706B]">Добавьте первый счёт для начала учёта</p>
              <Link to="/accounts" className="btn-secondary inline-block px-3 py-1.5 text-xs font-semibold">
                Добавить счёт
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E6E4DD]">
              {dashboard.accounts.map((acc) => (
                <div key={acc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-[#6B706B]" />
                    <span className="font-semibold">{acc.name}</span>
                  </div>
                  <span className="font-bold tabular-nums text-sm">{formatMoney(acc.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">Будущие расходы</h2>
            <Link to="/planned-expenses" className="text-xs font-semibold text-[#0F766E] hover:underline">
              Все будущие расходы →
            </Link>
          </div>

          {dashboard.upcoming_expenses.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-[#6B706B]">
                Добавьте будущие платежи, чтобы доступная сумма учитывала обязательства
              </p>
              <Link to="/planned-expenses" className="btn-secondary inline-block px-3 py-1.5 text-xs font-semibold">
                Запланировать расход
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E6E4DD]">
              {dashboard.upcoming_expenses.map((exp) => (
                <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold">{exp.name}</div>
                    <div className="text-[11px] text-[#6B706B]">Дата оплаты: {formatDueDate(exp.due_date)}</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold tabular-nums text-sm">{formatMoney(exp.amount)}</span>
                    <button
                      type="button"
                      onClick={() => setPayingExpense(exp)}
                      className="btn-secondary px-2.5 py-1 text-[11px] font-semibold"
                    >
                      Оплатить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Последние операции (п. 5.6) */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Последние операции</h2>
          <Link to="/operations" className="text-xs font-semibold text-[#0F766E] hover:underline">
            Все операции →
          </Link>
        </div>

        {recentOps.length === 0 ? (
          <p className="text-xs text-[#6B706B] text-center py-4">История операций пока пуста</p>
        ) : (
          <div className="divide-y divide-[#E6E4DD]">
            {recentOps.map((op) => {
              const fromName = accountMap.get(op.from_account_id) || `Счёт #${op.from_account_id}`;
              const toName = op.to_account_id
                ? accountMap.get(op.to_account_id) || `Счёт #${op.to_account_id}`
                : '';
              const catName = op.category_id ? categoryMap.get(op.category_id) || 'Категория' : '';

              return (
                <div key={op.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div>
                    <div className="font-semibold">
                      {op.type === 'transfer' ? 'Перевод между счетами' : catName}
                      {op.comment && <span className="font-normal text-[#6B706B]"> • {op.comment}</span>}
                    </div>
                    <div className="text-[11px] text-[#6B706B]">
                      {formatOperationDateTime(op.occurred_at)} •{' '}
                      {op.type === 'transfer' ? `${fromName} → ${toName}` : fromName}
                    </div>
                  </div>
                  <div
                    className={`font-bold tabular-nums text-sm ${
                      op.type === 'income' ? 'text-[#047857]' : 'text-[#1F2421]'
                    }`}
                  >
                    {op.type === 'income' ? '+' : op.type === 'expense' ? '−' : ''}
                    {formatMoney(op.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OperationFormModal
        isOpen={isOpModalOpen}
        onClose={() => setIsOpModalOpen(false)}
        onSuccess={() => loadDashboardData()}
        accounts={dashboard.accounts}
      />

      <PayPlannedExpenseModal
        isOpen={Boolean(payingExpense)}
        onClose={() => setPayingExpense(null)}
        onSuccess={() => loadDashboardData()}
        expense={payingExpense}
        accounts={dashboard.accounts}
      />
    </div>
  );
};