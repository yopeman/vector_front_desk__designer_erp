import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import KpiGrid7 from './components/KpiGrid7';
import KpiGrid6 from './components/KpiGrid6';
import MiddleGrid from './components/MiddleGrid';
import BottomGrid from './components/BottomGrid';
import LeadsPage from './components/LeadsPage';
import ClientsPage from './components/ClientsPage';
import SiteVisitsPage from './components/SiteVisitsPage';
import ItemsPage from './components/ItemsPage';
import OrdersPage from './components/OrdersPage';
import DesignsPage from './components/DesignsPage';

export default function FrontDeskPage() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [clientsRes, ordersRes, visitsRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('orders').select('*, clients(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('site_visits').select('*, clients(name)').order('created_at', { ascending: false }).limit(10),
      ]);
      console.log('Dashboard data loaded:', { clients: clientsRes.data, orders: ordersRes.data, visits: visitsRes.data });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleMenuClick = (page) => {
    console.log('Menu clicked:', page, '- setting currentPage to:', page);
    setCurrentPage(page);
    console.log('currentPage set to:', page);
  };

    return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#eef2f7' }}>
      <Sidebar onMenuClick={handleMenuClick} />
      
      <div className="main-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#eef2f7',
        overflowX: 'auto',
        minWidth: 0
      }}>
        <TopHeader />

        <div className="date-bar" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '8px 28px 0',
          color: '#64748b',
          fontSize: '11.5px',
          gap: '6px'
        }}>
          <i className="fa-solid fa-calendar"></i>
          <span id="currentDateText">June 26, 2026 | Friday</span>
        </div>

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
                borderTop: '3px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          ) : currentPage === 'dashboard' ? (
            <>
              <KpiGrid7 />
              <KpiGrid6 />
              <MiddleGrid />
              <BottomGrid />
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
              <OrdersPage />
            </div>
          ) : currentPage === 'designs' ? (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Designs Page Loaded</h2>
              <DesignsPage />
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