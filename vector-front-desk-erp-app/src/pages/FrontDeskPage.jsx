import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function FrontDeskPage() {
  const { profile, signOut } = useAuth();
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Front Desk Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome, {profile?.username || 'Officer'}
          </p>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Clients
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {clients.length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent Orders
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {orders.length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Site Visits
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {siteVisits.length}
                </p>
              </div>
            </div>

            {/* Recent Clients */}
            <section>
              <h2 className="text-base font-bold text-gray-800 mb-3">
                Recent Clients
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Company</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <a
                            href={`/clients/${c.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {c.name}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.company_name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          No clients yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent Orders */}
            <section>
              <h2 className="text-base font-bold text-gray-800 mb-3">
                Recent Orders
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600">Order No</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Client</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {o.order_no}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {o.clients?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          ETB {Number(o.total_amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}