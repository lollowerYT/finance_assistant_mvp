import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  CalendarClock,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
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
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#FCFBF9]">
      {/* Десктопное левое меню */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-[#FCFBF9] border-r border-[#E6E4DD] p-4 shrink-0 h-full transition-all duration-200 ${
          collapsed ? 'lg:w-20 items-center' : 'lg:w-64'
        }`}
      >
        <div className="w-full">
          <div
            className={`flex items-center mb-8 ${
              collapsed ? 'justify-center' : 'justify-between px-2'
            }`}
          >
            {!collapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ₽
                </div>
                <div className="truncate">
                  <div className="font-bold text-sm leading-tight">ФинПомощник</div>
                  <div className="text-[11px] text-[#6B706B]">Контроль бюджета</div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
              aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
              className="p-2 rounded-xl text-[#6B706B] hover:bg-[#EFECE6] hover:text-[#1F2421] transition cursor-pointer shrink-0"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-xs font-semibold transition ${
                    collapsed
                      ? 'justify-center p-3'
                      : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#0F766E] text-white'
                      : 'text-[#6B706B] hover:bg-[#EFECE6] hover:text-[#1F2421]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#E6E4DD] pt-4 w-full">
          {!collapsed && (
            <div className="text-xs font-medium truncate mb-2 px-2" title={user?.email}>
              {user?.email}
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? `Выйти (${user?.email ?? ''})` : undefined}
            className={`flex items-center text-xs text-red-700 hover:bg-red-50 rounded-xl font-medium cursor-pointer transition w-full ${
              collapsed ? 'justify-center p-2.5' : 'gap-2 px-2 py-1.5'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Мобильная шапка */}
      <header className="lg:hidden bg-[#FCFBF9] border-b border-[#E6E4DD] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
            ₽
          </div>
          <span className="font-bold text-sm">ФинПомощник</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B706B] truncate max-w-[150px]">{user?.email}</span>
          <button
            onClick={logout}
            aria-label="Выйти"
            className="p-1.5 rounded-lg border border-[#E6E4DD] text-red-700"
          >
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
