import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, order:orders(order_no, client:clients(name))')
        .eq('invoice_type', 'Sales Invoice')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this sales invoice?')) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchInvoices();
    } catch (error) {
      console.error('Error deleting sales invoice:', error);
      alert('Error deleting sales invoice: ' + error.message);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      (invoice.invoice_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.order?.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.order?.client?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
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
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Sales Invoices</h2>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by invoice no, order no, or client..."
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
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Invoice No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Issue Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Due Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Subtotal</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">VAT</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Grand Total</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Balance</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="12" className="p-8 text-center text-slate-400">
                  No sales invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice, index) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">{invoice.invoice_no || '-'}</td>
                  <td className="p-4">{invoice.order?.order_no || '-'}</td>
                  <td className="p-4">{invoice.order?.client?.name || '-'}</td>
                  <td className="p-4">{invoice.issue_date || '-'}</td>
                  <td className="p-4">{invoice.due_date || '-'}</td>
                  <td className="p-4">{invoice.subtotal || 0}</td>
                  <td className="p-4">{invoice.vat_amount || 0}</td>
                  <td className="p-4 font-medium">{invoice.grand_total || 0}</td>
                  <td className="p-4">{invoice.balance || 0}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:text-red-800 bg-transparent border-none cursor-pointer"
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
