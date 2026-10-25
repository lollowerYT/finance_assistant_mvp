import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/providers';

export const ProtectedRoute: React.FC = () => {
  const { status, errorMessage, refreshSession } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-surface p-6 text-sm text-[#6B706B]">Проверка авторизации...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-surface p-6 max-w-md w-full text-center space-y-4">
          <h2 className="text-base font-bold">Не удалось подключиться к backend</h2>
          <p className="text-xs text-[#6B706B]">{errorMessage}</p>
          <button onClick={refreshSession} className="btn-primary px-4 py-2 text-xs font-semibold">
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
