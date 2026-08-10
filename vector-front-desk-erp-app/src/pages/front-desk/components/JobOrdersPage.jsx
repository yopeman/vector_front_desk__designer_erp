import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function JobOrdersPage() {
  const [jobOrders, setJobOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingJobOrder, setEditingJobOrder] = useState(null);
  const [formData, setFormData] = useState({
    invoice_id: '',
    job_no: '',
    collaboration: '',
    order_status: 'Pending',
    start_time: '',
    delivery_time: '',
    expected_date: '',
    follow_up: 'No',
    delivery_status: 'Pending'
  });

  useEffect(() => {
    fetchJobOrders();
    fetchInvoices();
  }, []);

  const fetchJobOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('job_orders')
        .select('*, invoice:invoices(invoice_no, invoice_type, order:orders(*, client:clients(name)))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobOrders(data || []);
    } catch (error) {
      console.error('Error fetching job orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, order:orders(*, client:clients(name))')
        .eq('invoice_type', 'Sales Invoice')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.invoice_id) {
      alert('Please select an invoice');
      return;
    }

    try {
      if (editingJobOrder) {
        // Update existing job order
        const { error } = await supabase
          .from('job_orders')
          .update({
            invoice_id: formData.invoice_id,
            job_no: formData.job_no,
            collaboration: formData.collaboration,
            order_status: formData.order_status,
            start_time: formData.start_time || null,
            delivery_time: formData.delivery_time || null,
            expected_date: formData.expected_date || null,
            follow_up: formData.follow_up,
            delivery_status: formData.delivery_status
          })
          .eq('id', editingJobOrder.id);

        if (error) throw error;
        alert('Job order updated successfully!');
      } else {
        // Create new job order
        const { error } = await supabase
          .from('job_orders')
          .insert([{
            invoice_id: formData.invoice_id,
            job_no: formData.job_no,
            collaboration: formData.collaboration,
            order_status: formData.order_status,
            start_time: formData.start_time || null,
            delivery_time: formData.delivery_time || null,
            expected_date: formData.expected_date || null,
            follow_up: formData.follow_up,
            delivery_status: formData.delivery_status
          }]);

        if (error) throw error;
        alert('Job order created successfully!');
      }

      setShowModal(false);
      setEditingJobOrder(null);
      setFormData({
        invoice_id: '',
        job_no: '',
        collaboration: '',
        order_status: 'Pending',
        start_time: '',
        delivery_time: '',
        expected_date: '',
        follow_up: '',
        delivery_status: ''
      });
      await fetchJobOrders();
    } catch (error) {
      console.error('Error saving job order:', error);
      alert('Error saving job order: ' + error.message);
    }
  };

  const handleEdit = (jobOrder) => {
    setEditingJobOrder(jobOrder);
    setFormData({
      invoice_id: jobOrder.invoice_id,
      job_no: jobOrder.job_no || '',
      collaboration: jobOrder.collaboration || '',
      order_status: jobOrder.order_status || 'Pending',
      start_time: jobOrder.start_time ? jobOrder.start_time.split('T')[0] : '',
      delivery_time: jobOrder.delivery_time ? jobOrder.delivery_time.split('T')[0] : '',
      expected_date: jobOrder.expected_date || '',
      follow_up: jobOrder.follow_up || 'No',
      delivery_status: jobOrder.delivery_status || 'Pending'
    });
    setShowModal(true);
  };


  const generateNextJobNo = async () => {
    try {
      const { data, error } = await supabase
        .from('job_orders')
        .select('job_no')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].job_no) {
        const lastJobNo = data[0].job_no;
        const match = lastJobNo.match(/CS-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          return `CS-${String(nextNum).padStart(2, '0')}`;
        }
      }
      return 'CS-01';
    } catch (error) {
      console.error('Error generating job no:', error);
      return 'CS-01';
    }
  };

  const handleOpenModal = async () => {
    setEditingJobOrder(null);
    const nextJobNo = await generateNextJobNo();
    setFormData({
      invoice_id: '',
      job_no: nextJobNo,
      collaboration: '',
      order_status: 'Pending',
      start_time: '',
      delivery_time: '',
      expected_date: '',
      follow_up: 'No',
      delivery_status: 'Pending'
    });
    setShowModal(true);
  };

  const filteredJobOrders = jobOrders.filter(jobOrder => {
    const matchesSearch = jobOrder.job_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         jobOrder.invoice?.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         jobOrder.invoice?.order?.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || jobOrder.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Job Orders</h2>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
        >
          <i className="fa-solid fa-plus mr-2"></i>New Job Order
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by job no, invoice no, or client..."
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
              <option value="Pending">Pending</option>
              <option value="Started">Started</option>
              <option value="Completed">Completed</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Job No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Invoice No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Collaboration</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Expected Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Delivery Status</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredJobOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
                  No job orders found
                </td>
              </tr>
            ) : (
              filteredJobOrders.map((jobOrder, index) => (
                <tr key={jobOrder.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">{jobOrder.job_no || '-'}</td>
                  <td className="p-4">{jobOrder.invoice?.invoice_no || '-'}</td>
                  <td className="p-4">{jobOrder.invoice?.order?.client?.name || '-'}</td>
                  <td className="p-4">{jobOrder.collaboration || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      jobOrder.order_status === 'Completed' ? 'bg-green-100 text-green-700' :
                      jobOrder.order_status === 'Started' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {jobOrder.order_status}
                    </span>
                  </td>
                  <td className="p-4">{jobOrder.expected_date || '-'}</td>
                  <td className="p-4">{jobOrder.delivery_status || '-'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(jobOrder)}
                      className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg mt-10">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingJobOrder ? 'Edit Job Order' : 'New Job Order'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingJobOrder(null);
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Invoice *</label>
                  <select
                    value={formData.invoice_id}
                    onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    required
                  >
                    <option value="">Select Invoice</option>
                    {invoices.map(invoice => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_no} - {invoice.order?.client?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Job No</label>
                  <input
                    type="text"
                    value={formData.job_no}
                    readOnly
                    disabled
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Collaboration</label>
                  <input
                    type="text"
                    value={formData.collaboration}
                    onChange={(e) => setFormData({ ...formData, collaboration: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Order Status</label>
                  <select
                    value={formData.order_status}
                    onChange={(e) => setFormData({ ...formData, order_status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Started">Started</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="date"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Time</label>
                  <input
                    type="date"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Follow Up</label>
                  <select
                    value={formData.follow_up}
                    onChange={(e) => setFormData({ ...formData, follow_up: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Status</label>
                  <select
                    value={formData.delivery_status}
                    onChange={(e) => setFormData({ ...formData, delivery_status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingJobOrder(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
                >
                  <i className="fa-solid fa-check mr-2"></i>{editingJobOrder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
