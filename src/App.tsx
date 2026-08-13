import { Routes, Route, Navigate } from 'react-router-dom';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { Layout } from './components/layout/Layout';
import { ConfirmEmailPage } from './pages/ConfirmEmailPage';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Редирект с корня на регистрацию */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        
        {/* Публичные маршруты */}
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Защищённые маршруты (позже добавим auth-guard) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/profile" element={<DashboardPage tab="profile" />} />
        <Route path="/dashboard/team" element={<DashboardPage tab="team" />} />
        <Route path="/dashboard/cases" element={<DashboardPage tab="cases" />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        
        {/* Админка (позже) */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* 404 */}
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