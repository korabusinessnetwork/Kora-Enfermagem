import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { EscalasPage } from './pages/escalas/EscalasPage';
import { EscalaDetailPage } from './pages/escalas/EscalaDetailPage';
import { PlanosPage } from './pages/PlanosPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/escalas"
            element={
              <ProtectedRoute>
                <EscalasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/escalas/:id"
            element={
              <ProtectedRoute>
                <EscalaDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planos"
            element={
              <ProtectedRoute>
                <PlanosPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
