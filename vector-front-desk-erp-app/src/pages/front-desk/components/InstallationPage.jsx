import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function InstallationPage() {
  const [installations, setInstallations] = useState([]);
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
  const [editingInstallation, setEditingInstallation] = useState(null);
  const [formData, setFormData] = useState({
    job_order_id: '',
    client_id: '',
    installation_no: '',
    site_address: '',
    contact_person: '',
    contact_phone: '',
    items_installed: '',
    team: '',
    team_lead: '',
    scheduled_date: '',
    scheduled_time: '',
    completion_time: '',
    status: 'Scheduled',
    signed_off_by: ''
  });

  useEffect(() => {
    fetchInstallations();
    fetchJobOrders();
    fetchClients();
  }, [currentPage, itemsPerPage]);

  const fetchInstallations = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('installations')
        .select('*, job_order:job_orders(job_no, invoice:invoices(invoice_no)), client:clients(name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`installation_no.ilike.%${searchQuery}%,job_order.job_no.ilike.%${searchQuery}%,client.name.ilike.%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      setInstallations(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching installations:', error);
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

      if (editingInstallation) {
        // Update existing installation
        const { error } = await supabase
          .from('installations')
          .update({
            job_order_id: formData.job_order_id,
            client_id: formData.client_id,
            installation_no: formData.installation_no,
            site_address: formData.site_address,
            contact_person: formData.contact_person,
            contact_phone: formData.contact_phone,
            items_installed: formData.items_installed,
            team: formData.team,
            team_lead: formData.team_lead,
            scheduled_date: formData.scheduled_date || null,
            scheduled_time: formData.scheduled_time || null,
            completion_time: formData.completion_time || null,
            status: formData.status,
            signed_off_by: formData.signed_off_by,
            logged_by: currentUser
          })
          .eq('id', editingInstallation.id);

        if (error) throw error;
        alert('Installation updated successfully!');
      } else {
        // Create new installation
        const { error } = await supabase
          .from('installations')
          .insert([{
            job_order_id: formData.job_order_id,
            client_id: formData.client_id,
            installation_no: formData.installation_no,
            site_address: formData.site_address,
            contact_person: formData.contact_person,
            contact_phone: formData.contact_phone,
            items_installed: formData.items_installed,
            team: formData.team,
            team_lead: formData.team_lead,
            scheduled_date: formData.scheduled_date || null,
            scheduled_time: formData.scheduled_time || null,
            completion_time: formData.completion_time || null,
            status: formData.status,
            signed_off_by: formData.signed_off_by,
            logged_by: currentUser
          }]);

        if (error) throw error;
        alert('Installation created successfully!');
      }

      setShowModal(false);
      setEditingInstallation(null);
      setFormData({
        job_order_id: '',
        client_id: '',
        installation_no: '',
        site_address: '',
        contact_person: '',
        contact_phone: '',
        items_installed: '',
        team: '',
        team_lead: '',
        scheduled_date: '',
        scheduled_time: '',
        completion_time: '',
        status: 'Scheduled',
        signed_off_by: ''
      });
      await fetchInstallations();
    } catch (error) {
      console.error('Error saving installation:', error);
      alert('Error saving installation: ' + error.message);
    }
  };

  const handleEdit = (installation) => {
    setEditingInstallation(installation);
    setFormData({
      job_order_id: installation.job_order_id,
      client_id: installation.client_id,
      installation_no: installation.installation_no || '',
      site_address: installation.site_address || '',
      contact_person: installation.contact_person || '',
      contact_phone: installation.contact_phone || '',
      items_installed: installation.items_installed || '',
      team: installation.team || '',
      team_lead: installation.team_lead || '',
      scheduled_date: installation.scheduled_date || '',
      scheduled_time: installation.scheduled_time || '',
      completion_time: installation.completion_time ? installation.completion_time.split('T')[0] : '',
      status: installation.status || 'Scheduled',
      signed_off_by: installation.signed_off_by || ''
    });
    setShowModal(true);
  };


  const handleOpenModal = () => {
    setEditingInstallation(null);
    setFormData({
      job_order_id: '',
      client_id: '',
      installation_no: '',
      site_address: '',
      contact_person: '',
      contact_phone: '',
      items_installed: '',
      team: '',
      team_lead: '',
      scheduled_date: '',
      scheduled_time: '',
      completion_time: '',
      status: 'Scheduled',
      signed_off_by: ''
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
        <h2 className="text-xl font-bold text-slate-800">Installations</h2>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
        >
          <i className="fa-solid fa-plus mr-2"></i>New Installation
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by installation no, job no, or client..."
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
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Installation No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Job No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Site Address</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Contact Person</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Scheduled Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {installations.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
                  No installations found
                </td>
              </tr>
            ) : (
              installations.map((installation, index) => (
                <tr key={installation.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-4 font-medium">{installation.installation_no || '-'}</td>
                  <td className="p-4">{installation.job_order?.job_no || '-'}</td>
                  <td className="p-4">{installation.client?.name || '-'}</td>
                  <td className="p-4">{installation.site_address || '-'}</td>
                  <td className="p-4">{installation.contact_person || '-'}</td>
                  <td className="p-4">{installation.scheduled_date || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      installation.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      installation.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      installation.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {installation.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(installation)}
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
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} installations
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
                {editingInstallation ? 'Edit Installation' : 'New Installation'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInstallation(null);
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Installation No</label>
                  <input
                    type="text"
                    value={formData.installation_no}
                    onChange={(e) => setFormData({ ...formData, installation_no: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Site Address</label>
                  <input
                    type="text"
                    value={formData.site_address}
                    onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Items Installed</label>
                  <textarea
                    value={formData.items_installed}
                    onChange={(e) => setFormData({ ...formData, items_installed: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Team</label>
                  <input
                    type="text"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Team Lead</label>
                  <input
                    type="text"
                    value={formData.team_lead}
                    onChange={(e) => setFormData({ ...formData, team_lead: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Completion Time</label>
                  <input
                    type="date"
                    value={formData.completion_time}
                    onChange={(e) => setFormData({ ...formData, completion_time: e.target.value })}
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
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Signed Off By</label>
                  <input
                    type="text"
                    value={formData.signed_off_by}
                    onChange={(e) => setFormData({ ...formData, signed_off_by: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInstallation(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
                >
                  <i className="fa-solid fa-check mr-2"></i>{editingInstallation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
