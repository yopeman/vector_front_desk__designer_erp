import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRouter from './components/RoleRouter';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import FrontDeskPage from './pages/FrontDeskPage';
import DesignerPage from './pages/DesignerPage';
import ClientPage from './pages/ClientPage';
import PendingPage from './pages/PendingPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Pending approval page */}
          <Route
            path="/pending"
            element={
              <ProtectedRoute>
                <PendingPage />
              </ProtectedRoute>
            }
          />

          {/* Root — RoleRouter checks role and redirects accordingly */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRouter />
                <FrontDeskPage />
              </ProtectedRoute>
            }
          />

          {/* Admin — only renders when role is admin (RoleRouter handles redirect) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Designers — only renders when role is designer */}
          <Route
            path="/designers"
            element={
              <ProtectedRoute>
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