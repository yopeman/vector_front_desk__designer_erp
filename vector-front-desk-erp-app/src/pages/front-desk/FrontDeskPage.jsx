import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import ClientsTable from './components/ClientsTable';
import OrdersTable from './components/OrdersTable';

export default function FrontDeskPage() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    const [clientsRes, ordersRes, visitsRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('orders').select('*, clients(name)').order('created_at', { ascending: false }).limit(10),
      supabase.from('site_visits').select('*, clients(name)').order('created_at', { ascending: false }).limit(10),
    ]);
    if (clientsRes.data) setClients(clientsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (visitsRes.data) setSiteVisits(visitsRes.data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <KpiCards clients={clients} orders={orders} siteVisits={siteVisits} />
            <ClientsTable clients={clients} />
            <OrdersTable orders={orders} />
          </>
        )}
      </div>
    </div>
  );
}