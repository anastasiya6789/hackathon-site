import { Routes, Route, Navigate } from 'react-router-dom';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { Layout } from './components/layout/Layout';
import { ConfirmEmailPage } from './pages/ConfirmEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { RulesPage } from './pages/RulesPage';
import { ContactsPage } from './pages/ContactsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/profile" element={<DashboardPage tab="profile" />} />
        <Route path="/dashboard/team" element={<DashboardPage tab="team" />} />
        <Route path="/dashboard/cases" element={<DashboardPage tab="cases" />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/rules" element={<RulesPage />} />
<Route path="/contacts" element={<ContactsPage />} />
        
        <Route path="/admin" element={<AdminPage />} />
        
        <Route path="*" element={
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <h2>🔍 Страница не найдена</h2>
            <p>Вернитесь на <a href="/register">страницу регистрации</a></p>
          </div>
        } />
      </Routes>
    </Layout>
  );
}

export default App;