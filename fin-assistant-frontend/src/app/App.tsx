import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './providers';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { OperationsPage } from '../features/operations/OperationsPage';
import { AccountsPage } from '../features/accounts/AccountsPage';
import { PlannedExpensesPage } from '../features/planned-expenses/PlannedExpensesPage';
import { ReservePage } from '../features/reserve/ReservePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/operations" element={<OperationsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/planned-expenses" element={<PlannedExpensesPage />} />
              <Route path="/reserve" element={<ReservePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;