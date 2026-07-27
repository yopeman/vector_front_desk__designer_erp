import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function DesignerPage() {
  const { profile, signOut } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesigns();
  }, []);

  async function fetchDesigns() {
    setLoading(true);
    const { data } = await supabase
      .from('designs')
      .select('*, orders(order_no, clients(name))')
      .order('created_at', { ascending: false });
    if (data) setDesigns(data);
    setLoading(false);
  }

  async function updateDesignStatus(id, status) {
    await supabase.from('designs').update({ status }).eq('id', id);
    fetchDesigns();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Designer Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome, {profile?.username || 'Designer'}
          </p>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Design Type</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Order</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Client</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Priority</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {designs.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {d.design_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.orders?.order_no || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.orders?.clients?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          d.priority === 'High'
                            ? 'bg-red-50 text-red-700'
                            : d.priority === 'Medium'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {d.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {d.status === 'Pending' && (
                          <button
                            onClick={() => updateDesignStatus(d.id, 'In Progress')}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                          >
                            Start
                          </button>
                        )}
                        {d.status === 'In Progress' && (
                          <button
                            onClick={() => updateDesignStatus(d.id, 'Completed')}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {designs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No design requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}