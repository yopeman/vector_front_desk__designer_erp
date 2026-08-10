import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Purchases } from './pages/Purchases';
import { Sales } from './pages/Sales';
import { ChartOfAccounts } from './pages/ChartOfAccounts';
import { Inventory } from './pages/Inventory';
import { GeneralJournal } from './pages/GeneralJournal';
import { Payroll } from './pages/Payroll';
import { Reports } from './pages/Reports';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import NotesPage from './pages/NotesPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/general-journal" element={<GeneralJournal />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
