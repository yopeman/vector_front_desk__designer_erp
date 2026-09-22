import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRouter from './components/RoleRouter';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import FrontDeskPage from './pages/front-desk/FrontDeskPage';
import DesignerPage from './pages/DesignerPage';
import ClientPage from './pages/ClientPage';
import PendingPage from './pages/PendingPage';
import ReportPage from './pages/front-desk/components/ReportPage';
import Sidebar from './pages/front-desk/components/Sidebar';
import TopHeader from './pages/front-desk/components/TopHeader';
import DesignMessageNotifier from './components/DesignMessageNotifier';
import ProductionMessageNotifier from './components/ProductionMessageNotifier';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DesignMessageNotifier />
        <ProductionMessageNotifier />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Public report routes */}
          <Route path="/frontdesk-public-report" element={<FrontDeskPage />} />
          <Route path="/design-public-report" element={<DesignerPage />} />

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
              </ProtectedRoute>
            }
          />
          
          {/* Designers — only renders when role is designer */}
          <Route
            path="/frontdesk"
            element={
              <ProtectedRoute>
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
    </HashRouter>
  );
}