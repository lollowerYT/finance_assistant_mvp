import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { AppApiError } from '../../api/errors';
import { useAuth } from '../../app/providers';
import { validateEmail } from '../../lib/validation';

export const RegisterPage: React.FC = () => {
  const { status } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    if (!password || password.length < 8) errors.password = 'Пароль должен содержать не менее 8 символов';
    if (password !== confirmPassword) errors.confirmPassword = 'Пароли не совпадают';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await authApi.register(email.trim(), password);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setFieldErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Не удалось создать аккаунт');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-surface p-6 md:p-8 w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">₽</div>
          <span className="font-bold text-base">ФинПомощник</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Регистрация</h1>
        <p className="text-xs text-[#6B706B] mb-6">Создайте аккаунт для расчёта доступных к расходованию средств</p>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold mb-1.5">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-control"
              placeholder="name@example.com"
            />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold mb-1.5">Пароль (от 8 символов)</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-control"
              placeholder="••••••••"
            />
            {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-xs font-semibold mb-1.5">Подтверждение пароля</label>
            <input
              id="reg-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-control"
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 text-xs font-semibold">
            {submitting ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-xs text-[#6B706B] text-center mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-[#0F766E] font-semibold hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
};
