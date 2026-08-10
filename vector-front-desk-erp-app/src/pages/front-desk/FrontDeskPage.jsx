import { useState } from 'react';
import './dashboard.css';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import KpiGrid7 from './components/KpiGrid7';
import KpiGrid6 from './components/KpiGrid6';
import MiddleGrid from './components/MiddleGrid';
import BottomGrid from './components/BottomGrid';
import useDashboardData from './components/useDashboardData';
import LeadsPage from './components/LeadsPage';
import ClientsPage from '../client-portal';
import SiteVisitsPage from './components/SiteVisitsPage';
import ItemsPage from './components/ItemsPage';
import OrdersPage from './components/OrdersPage';
import DesignsPage from './components/DesignsPage';
import DesignStatusPage from './components/DesignStatusPage';
import DesignLibraryPage from './components/DesignLibraryPage';
import ProformaInvoicesPage from './components/ProformaInvoicesPage';
import TestProformaInvoicesPage from './components/TestProformaInvoicesPage';
import SalesInvoicesPage from './components/SalesInvoicesPage';
import PaymentsPage from './components/PaymentsPage';
import JobOrdersPage from './components/JobOrdersPage';
import ProductionStatusPage from './components/ProductionStatusPage';
import DeliveryPage from './components/DeliveryPage';
import InstallationPage from './components/InstallationPage';
import FeedbackPage from './components/FeedbackPage';
import ComplaintsPage from './components/ComplaintsPage';
import WarrantyPage from './components/WarrantyPage';
import DailyFinanceReportPage from './components/DailyFinanceReportPage';
import WeeklyFinanceReportPage from './components/WeeklyFinanceReportPage';
import ReportPage from './components/ReportPage';
import MessagesPage from './components/MessagesPage';
import NotificationsPage from './components/NotificationsPage';
import NotesPage from './components/NotesPage';
import SettingsPage from './components/SettingsPage';

export default function FrontDeskPage() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [preselectedOrderId, setPreselectedOrderId] = useState(null);
  const [prefillOrderData, setPrefillOrderData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { loading, data } = useDashboardData();

  const handleMenuClick = (page, orderId = null) => {
    console.log('Menu clicked:', page, '- setting currentPage to:', page);
    setPreselectedOrderId(orderId);
    setCurrentPage(page);
    console.log('currentPage set to:', page);
  };

  const handleUpgradeToOrder = (orderData) => {
    setPrefillOrderData(orderData);
    setCurrentPage('orders');
  };

    return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#eef2f7' }}>
      <Sidebar onMenuClick={handleMenuClick} currentPage={currentPage} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <div className="main-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#eef2f7',
        overflowX: 'auto',
        overflowY: 'auto',
        height: '100vh',
        minWidth: 0
      }}>
        <TopHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} onNavigate={handleMenuClick} />

        <div className="dashboard-body" style={{
          padding: '16px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {console.log('Rendering page:', currentPage, 'loading:', loading)}
          {loading && currentPage === 'dashboard' ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #00ced1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          ) : currentPage === 'dashboard' ? (
            <>
              <KpiGrid7 data={data} onNavigate={handleMenuClick} />
              <KpiGrid6 data={data} onNavigate={handleMenuClick} />
              <MiddleGrid data={data} onNavigate={handleMenuClick} />
              <BottomGrid data={data} onNavigate={handleMenuClick} />
            </>
          ) : currentPage === 'leads' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Leads Page Loaded</h2>
              <LeadsPage onUpgradeToClient={() => setCurrentPage('clients')} />
            </div>
          ) : currentPage === 'clients' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Clients Page Loaded</h2>
              <ClientsPage />
            </div>
          ) : currentPage === 'site visits' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Site Visits Page Loaded</h2>
              <SiteVisitsPage />
            </div>
          ) : currentPage === 'items' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Items Page Loaded</h2>
              <ItemsPage />
            </div>
          ) : currentPage === 'orders' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Orders Page Loaded</h2>
              <OrdersPage 
                onNavigateToProforma={(orderId) => handleMenuClick('proforma invoices', orderId)} 
                prefillOrderData={prefillOrderData}
              />
            </div>
          ) : currentPage === 'designs' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Designs Page Loaded</h2>
              <DesignsPage />
            </div>
          ) : currentPage === 'design status' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Design Status Page Loaded</h2>
              <DesignStatusPage />
            </div>
          ) : currentPage === 'design library' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <DesignLibraryPage />
            </div>
          ) : currentPage === 'proforma invoices' ? ( // Test Proforma Invoices (test_proforma_invoices table)
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Proforma Invoices Page Loaded</h2>
              <TestProformaInvoicesPage onUpgradeToOrder={handleUpgradeToOrder} />
            </div>
          ) : currentPage === 'sales invoices' ? ( // Proforma Invoices (invoices table with type Proforma)
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Sales Invoices Page Loaded</h2>
              <ProformaInvoicesPage preselectedOrderId={preselectedOrderId} />
            </div>
          ) : currentPage === 'sales invoices status' ? ( // Sales Invoices (invoices table with type Sales Invoice)
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Sales Invoices Status Page Loaded</h2>
              <SalesInvoicesPage />
            </div>
          ) : currentPage === 'payments' ? ( // Payments
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Payments Page Loaded</h2>
              <PaymentsPage />
            </div>
          ) : currentPage === 'job orders' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Job Orders Page Loaded</h2>
              <JobOrdersPage />
            </div>
          ) : currentPage === 'production status' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Production Status Page Loaded</h2>
              <ProductionStatusPage />
            </div>
          ) : currentPage === 'delivery' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Delivery Page Loaded</h2>
              <DeliveryPage />
            </div>
          ) : currentPage === 'installation' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Installation Page Loaded</h2>
              <InstallationPage />
            </div>
          ) : currentPage === 'feedback' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Feedback Page Loaded</h2>
              <FeedbackPage />
            </div>
          ) : currentPage === 'complaints' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Complaints Page Loaded</h2>
              <ComplaintsPage />
            </div>
          ) : currentPage === 'warranty' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Warranty Page Loaded</h2>
              <WarrantyPage />
            </div>
          ) : currentPage === 'daily finance report' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Daily Finance Report Page Loaded</h2>
              <DailyFinanceReportPage />
            </div>
          ) : currentPage === 'weekly finance report' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Weekly Finance Report Page Loaded</h2>
              <WeeklyFinanceReportPage />
            </div>
          ) : currentPage === 'report' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Report Page Loaded</h2>
              <ReportPage />
            </div>
           ) : currentPage === 'messages' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', height: 'calc(100vh - 110px)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Messages</h2>
              <MessagesPage />
            </div>
           ) : currentPage === 'notifications' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', height: 'calc(100vh - 110px)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Notifications</h2>
              <NotificationsPage />
            </div>
          ) : currentPage === 'notes' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', height: 'calc(100vh - 110px)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Notes</h2>
              <NotesPage />
            </div>
          ) : currentPage === 'settings' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Settings</h2>
              <SettingsPage />
            </div>
          ) : (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Unknown page: {currentPage}</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}