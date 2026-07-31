import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ProductionStatusPage() {
  const [productionOrders, setProductionOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  const fetchProductionOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*, orders(order_no, clients(name)), machines(name, machine_type), designer:users(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductionOrders(data || []);
    } catch (error) {
      console.error('Error fetching production orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = productionOrders.filter(order => {
    const matchesSearch =
      (order.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.orders?.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.orders?.clients?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.machines?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.designer?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Production Status</h2>
          <p className="text-xs text-slate-500 mt-1">Track all production orders and their current status</p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
          <i className="fa-solid fa-database text-blue-500"></i>
          <span>{productionOrders.length}</span> orders
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by task, order, client, machine, or designer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          <i className="fa-solid fa-print text-4xl mb-4"></i>
          <p className="text-sm">No production orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Task Name</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Order</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Material</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Machine</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Designer</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Priority</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Job Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium text-slate-800">
                    {order.material || '-'}
                  </td>
                  <td className="p-4 text-slate-600">
                    {order.orders?.order_no || '-'}
                  </td>
                  <td className="p-4 text-slate-600">
                    {order.material || '-'}{order.thickness ? ` / ${order.thickness}` : ''}{order.color ? ` / ${order.color}` : ''}
                  </td>
                  <td className="p-4 text-slate-600">
                    {order.machines?.name || '-'} {order.machines?.machine_type ? `(${order.machines.machine_type})` : ''}
                  </td>
                  <td className="p-4 text-slate-600">
                    {order.designer?.username || '-'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        order.priority === 'High'
                          ? 'bg-rose-100 text-rose-700'
                          : order.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.priority || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        order.status === 'New'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-700'
                          : order.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.status || '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        order.job_type === 'received'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {order.job_type || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}