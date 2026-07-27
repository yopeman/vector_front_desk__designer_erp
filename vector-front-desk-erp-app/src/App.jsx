import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import FrontDeskPage from './pages/FrontDeskPage';
import DesignerPage from './pages/DesignerPage';
import ClientPage from './pages/ClientPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Front Desk (default) — protected, any authenticated user */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FrontDeskPage />
              </ProtectedRoute>
            }
          />

          {/* Admin — only admin role */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Designers — only designer role */}
          <Route
            path="/designers"
            element={
              <ProtectedRoute allowedRoles={['designer']}>
                <DesignerPage />
              </ProtectedRoute>
            }
          />

          {/* Client detail page — unprotected */}
          <Route path="/clients/:client_id" element={<ClientPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}