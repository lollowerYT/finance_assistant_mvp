import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Wallet, CalendarClock, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../app/providers';

const NAV_ITEMS = [
  { to: '/', label: 'Главная', icon: LayoutDashboard, end: true },
  { to: '/operations', label: 'Операции', icon: ArrowLeftRight, end: false },
  { to: '/accounts', label: 'Счета', icon: Wallet, end: false },
  { to: '/planned-expenses', label: 'Будущие расходы', icon: CalendarClock, end: false },
  { to: '/reserve', label: 'Резерв', icon: ShieldCheck, end: false },
];

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#FCFBF9]">
      {/* Десктопное левое меню */}
      <aside className="hidden lg:flex lg:w-64 flex-col justify-between bg-[#FCFBF9] border-r border-[#E6E4DD] p-5 shrink-0 h-full">
        <div>
          <div className="flex items-center gap-2.5 mb-8 px-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">₽</div>
            <div>
              <div className="font-bold text-sm leading-tight">ФинПомощник</div>
              <div className="text-[11px] text-[#6B706B]">Контроль бюджета</div>
            </div>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive ? 'bg-[#0F766E] text-white' : 'text-[#6B706B] hover:bg-[#EFECE6] hover:text-[#1F2421]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-[#E6E4DD] pt-4 px-2">
          <div className="text-xs font-medium truncate mb-2">{user?.email}</div>
          <button onClick={logout} className="flex items-center gap-2 text-xs text-red-700 hover:underline font-medium cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Мобильная шапка */}
      <header className="lg:hidden bg-[#FCFBF9] border-b border-[#E6E4DD] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">₽</div>
          <span className="font-bold text-sm">ФинПомощник</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B706B] truncate max-w-[150px]">{user?.email}</span>
          <button onClick={logout} aria-label="Выйти" className="p-1.5 rounded-lg border border-[#E6E4DD] text-red-700">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Основной контейнер контента */}
      <main className="flex-1 overflow-y-auto h-full w-full">
        <div className="p-4 md:p-8 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Мобильная нижняя навигация */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E6E4DD] px-2 py-2 flex justify-around z-30">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                isActive ? 'text-[#0F766E]' : 'text-[#6B706B]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
