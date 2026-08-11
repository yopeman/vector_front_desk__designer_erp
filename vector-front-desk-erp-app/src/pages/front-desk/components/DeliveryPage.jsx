import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [formData, setFormData] = useState({
    job_order_id: '',
    client_id: '',
    delivery_no: '',
    delivery_address: '',
    contact_person: '',
    contact_phone: '',
    items: '',
    vehicle_driver: '',
    scheduled_date: '',
    scheduled_time: '',
    actual_delivery_time: '',
    status: 'Pending',
    received_by: ''
  });

  useEffect(() => {
    fetchDeliveries();
    fetchJobOrders();
    fetchClients();
  }, [currentPage, itemsPerPage]);

  const fetchDeliveries = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('deliveries')
        .select('*, job_order:job_orders(job_no, invoice:invoices(invoice_no)), client:clients(name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`delivery_no.ilike.%${searchQuery}%,job_order.job_no.ilike.%${searchQuery}%,client.name.ilike.%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      setDeliveries(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('job_orders')
        .select('*, invoice:invoices(*, order:orders(*, client:clients(*)))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobOrders(data || []);
    } catch (error) {
      console.error('Error fetching job orders:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_type', 'client')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleJobOrderChange = (jobOrderId) => {
    setFormData({ ...formData, job_order_id: jobOrderId });
    
    // Auto-fill client_id from job order
    const selectedJobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    if (selectedJobOrder && selectedJobOrder.invoice?.order?.client_id) {
      setFormData(prev => ({ ...prev, job_order_id: jobOrderId, client_id: selectedJobOrder.invoice.order.client_id }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.job_order_id) {
      alert('Please select a job order');
      return;
    }

    try {
      // Get current user (simplified - in real app, use auth context)
      const currentUser = localStorage.getItem('username') || 'Admin';

      if (editingDelivery) {
        // Update existing delivery
        const { error } = await supabase
          .from('deliveries')
          .update({
            job_order_id: formData.job_order_id,
            client_id: formData.client_id,
            delivery_no: formData.delivery_no,
            delivery_address: formData.delivery_address,
            contact_person: formData.contact_person,
            contact_phone: formData.contact_phone,
            items: formData.items,
            vehicle_driver: formData.vehicle_driver,
            scheduled_date: formData.scheduled_date || null,
            scheduled_time: formData.scheduled_time || null,
            actual_delivery_time: formData.actual_delivery_time || null,
            status: formData.status,
            received_by: formData.received_by,
            logged_by: currentUser
          })
          .eq('id', editingDelivery.id);

        if (error) throw error;
        alert('Delivery updated successfully!');
      } else {
        // Create new delivery
        const { error } = await supabase
          .from('deliveries')
          .insert([{
            job_order_id: formData.job_order_id,
            client_id: formData.client_id,
            delivery_no: formData.delivery_no,
            delivery_address: formData.delivery_address,
            contact_person: formData.contact_person,
            contact_phone: formData.contact_phone,
            items: formData.items,
            vehicle_driver: formData.vehicle_driver,
            scheduled_date: formData.scheduled_date || null,
            scheduled_time: formData.scheduled_time || null,
            actual_delivery_time: formData.actual_delivery_time || null,
            status: formData.status,
            received_by: formData.received_by,
            logged_by: currentUser
          }]);

        if (error) throw error;
        alert('Delivery created successfully!');
      }

      setShowModal(false);
      setEditingDelivery(null);
      setFormData({
        job_order_id: '',
        client_id: '',
        delivery_no: '',
        delivery_address: '',
        contact_person: '',
        contact_phone: '',
        items: '',
        vehicle_driver: '',
        scheduled_date: '',
        scheduled_time: '',
        actual_delivery_time: '',
        status: 'Pending',
        received_by: ''
      });
      await fetchDeliveries();
    } catch (error) {
      console.error('Error saving delivery:', error);
      alert('Error saving delivery: ' + error.message);
    }
  };

  const handleEdit = (delivery) => {
    setEditingDelivery(delivery);
    setFormData({
      job_order_id: delivery.job_order_id,
      client_id: delivery.client_id,
      delivery_no: delivery.delivery_no || '',
      delivery_address: delivery.delivery_address || '',
      contact_person: delivery.contact_person || '',
      contact_phone: delivery.contact_phone || '',
      items: delivery.items || '',
      vehicle_driver: delivery.vehicle_driver || '',
      scheduled_date: delivery.scheduled_date || '',
      scheduled_time: delivery.scheduled_time || '',
      actual_delivery_time: delivery.actual_delivery_time ? delivery.actual_delivery_time.split('T')[0] : '',
      status: delivery.status || 'Pending',
      received_by: delivery.received_by || ''
    });
    setShowModal(true);
  };


  const handleOpenModal = () => {
    setEditingDelivery(null);
    setFormData({
      job_order_id: '',
      client_id: '',
      delivery_no: '',
      delivery_address: '',
      contact_person: '',
      contact_phone: '',
      items: '',
      vehicle_driver: '',
      scheduled_date: '',
      scheduled_time: '',
      actual_delivery_time: '',
      status: 'Pending',
      received_by: ''
    });
    setShowModal(true);
  };

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Deliveries</h2>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
        >
          <i className="fa-solid fa-plus mr-2"></i>New Delivery
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by delivery no, job no, or client..."
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
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Delivery No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Job No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Contact Person</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Scheduled Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400">
                  No deliveries found
                </td>
              </tr>
            ) : (
              deliveries.map((delivery, index) => (
                <tr key={delivery.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-4 font-medium">{delivery.delivery_no || '-'}</td>
                  <td className="p-4">{delivery.job_order?.job_no || '-'}</td>
                  <td className="p-4">{delivery.client?.name || '-'}</td>
                  <td className="p-4">{delivery.contact_person || '-'}</td>
                  <td className="p-4">{delivery.scheduled_date || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      delivery.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      delivery.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                      delivery.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(delivery)}
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

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} deliveries
        </div>
        <div className="flex items-center gap-2">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-slate-600">
            Page {currentPage} of {Math.ceil(totalCount / itemsPerPage) || 1}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(Math.ceil(totalCount / itemsPerPage))}
            disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Last
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg mt-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingDelivery ? 'Edit Delivery' : 'New Delivery'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingDelivery(null);
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Job Order *</label>
                  <select
                    value={formData.job_order_id}
                    onChange={(e) => handleJobOrderChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    required
                  >
                    <option value="">Select Job Order</option>
                    {jobOrders.map(jobOrder => (
                      <option key={jobOrder.id} value={jobOrder.id}>
                        {jobOrder.job_no || 'No Job No'} - {jobOrder.invoice?.order?.client?.name || 'Unknown Client'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Delivery No</label>
                  <input
                    type="text"
                    value={formData.delivery_no}
                    onChange={(e) => setFormData({ ...formData, delivery_no: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Items</label>
                  <textarea
                    value={formData.items}
                    onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Driver</label>
                  <input
                    type="text"
                    value={formData.vehicle_driver}
                    onChange={(e) => setFormData({ ...formData, vehicle_driver: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Actual Delivery Time</label>
                  <input
                    type="date"
                    value={formData.actual_delivery_time}
                    onChange={(e) => setFormData({ ...formData, actual_delivery_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Received By</label>
                  <input
                    type="text"
                    value={formData.received_by}
                    onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDelivery(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
                >
                  <i className="fa-solid fa-check mr-2"></i>{editingDelivery ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
