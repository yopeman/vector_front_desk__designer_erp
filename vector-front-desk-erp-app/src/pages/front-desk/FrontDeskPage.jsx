import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import KpiGrid7 from './components/KpiGrid7';
import KpiGrid6 from './components/KpiGrid6';
import MiddleGrid from './components/MiddleGrid';
import BottomGrid from './components/BottomGrid';

export default function FrontDeskPage() {
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#eef2f7' }}>
      <Sidebar />
      
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
          {loading ? (
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
          ) : (
            <>
              <KpiGrid7 />
              <KpiGrid6 />
              <MiddleGrid />
              <BottomGrid />
            </>
          )}
        </div>
      </div>
    </div>
  );
}