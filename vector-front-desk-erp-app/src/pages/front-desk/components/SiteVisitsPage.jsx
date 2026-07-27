import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function SiteVisitsPage() {
  const [showModal, setShowModal] = useState(false);
  const [siteVisits, setSiteVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    request_no: '',
    visit_purpose: '',
    city: '',
    detailed_address: '',
    requested_date: '',
    preferred_date: '',
    preferred_time: '',
    requested_by: '',
    department_id: '',
    installation_team: '',
    contact_person: '',
    phone: '',
    email: '',
    equipment_review: '',
    special_instructions: '',
    status: 'Pending',
    priority: 'Medium'
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSiteVisits();
    fetchClients();
    fetchDepartments();
  }, []);

  const fetchSiteVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*, client:clients(name), department:departments(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSiteVisits(data || []);
    } catch (error) {
      console.error('Error fetching site visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('client_type', 'client')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        client_id: formData.client_id || null
      };

      // Filter out empty fields
      if (!submitData.client_id) {
        delete submitData.client_id;
      }
      if (!submitData.department_id) {
        delete submitData.department_id;
      }
      if (!submitData.requested_date) {
        delete submitData.requested_date;
      }
      if (!submitData.preferred_date) {
        delete submitData.preferred_date;
      }
      if (!submitData.preferred_time) {
        delete submitData.preferred_time;
      }

      if (editingId) {
        const { error } = await supabase
          .from('site_visits')
          .update(submitData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_visits')
          .insert([submitData]);
        if (error) throw error;
      }

      await fetchSiteVisits();
      resetForm();
    } catch (error) {
      console.error('Error saving site visit:', error);
      alert('Error saving site visit: ' + error.message);
    }
  };

  const handleEdit = (visit) => {
    setFormData({
      client_id: visit.client_id || '',
      request_no: visit.request_no || '',
      visit_purpose: visit.visit_purpose || '',
      city: visit.city || '',
      detailed_address: visit.detailed_address || '',
      requested_date: visit.requested_date || '',
      preferred_date: visit.preferred_date || '',
      preferred_time: visit.preferred_time || '',
      requested_by: visit.requested_by || '',
      department_id: visit.department_id || '',
      installation_team: visit.installation_team || '',
      contact_person: visit.contact_person || '',
      phone: visit.phone || '',
      email: visit.email || '',
      equipment_review: visit.equipment_review || '',
      special_instructions: visit.special_instructions || '',
      status: visit.status || 'Pending',
      priority: visit.priority || 'Medium'
    });
    setEditingId(visit.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this site visit?')) return;
    try {
      const { error } = await supabase
        .from('site_visits')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchSiteVisits();
    } catch (error) {
      console.error('Error deleting site visit:', error);
      alert('Error deleting site visit: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      request_no: '',
      visit_purpose: '',
      city: '',
      detailed_address: '',
      requested_date: '',
      preferred_date: '',
      preferred_time: '',
      requested_by: '',
      department_id: '',
      installation_team: '',
      contact_person: '',
      phone: '',
      email: '',
      equipment_review: '',
      special_instructions: '',
      status: 'Pending',
      priority: 'Medium'
    });
    setEditingId(null);
    setShowModal(false);
  };

  const filteredVisits = siteVisits.filter(visit => {
    const matchesSearch = 
      (visit.request_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (visit.visit_purpose?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (visit.city?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (visit.client?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (visit.department?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || visit.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || visit.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
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
        <h2 className="text-xl font-bold text-slate-800">Site Visits</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> New Site Visit
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by request no, purpose, city, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Request No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Purpose</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">City</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Preferred Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Priority</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
                  No site visits found
                </td>
              </tr>
            ) : (
              filteredVisits.map((visit, index) => (
                <tr key={visit.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">{visit.request_no || '-'}</td>
                  <td className="p-4">{visit.client?.name || '-'}</td>
                  <td className="p-4">{visit.visit_purpose || '-'}</td>
                  <td className="p-4">{visit.city || '-'}</td>
                  <td className="p-4">{visit.preferred_date || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      visit.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      visit.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      visit.status === 'Scheduled' ? 'bg-purple-100 text-purple-700' :
                      visit.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {visit.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      visit.priority === 'High' ? 'bg-red-100 text-red-700' :
                      visit.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {visit.priority}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(visit)}
                      className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(visit.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Site Visit' : 'New Site Visit'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Selection */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Client Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Client <span className="text-red-500">*</span></label>
                    <select
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Request No</label>
                    <input
                      type="text"
                      value={formData.request_no}
                      onChange={(e) => setFormData({ ...formData, request_no: e.target.value })}
                      placeholder="Enter request number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Visit Purpose <span className="text-red-500">*</span></label>
                    <textarea
                      value={formData.visit_purpose}
                      onChange={(e) => setFormData({ ...formData, visit_purpose: e.target.value })}
                      rows="3"
                      placeholder="Enter visit purpose"
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Visit Details */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Visit Details</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter city"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Detailed Address</label>
                    <textarea
                      value={formData.detailed_address}
                      onChange={(e) => setFormData({ ...formData, detailed_address: e.target.value })}
                      rows="3"
                      placeholder="Enter detailed address"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Requested Date</label>
                      <input
                        type="date"
                        value={formData.requested_date}
                        onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preferred Time</label>
                    <input
                      type="time"
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Contact Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Requested By</label>
                    <input
                      type="text"
                      value={formData.requested_by}
                      onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                      placeholder="Enter requested by"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Installation Team</label>
                    <input
                      type="text"
                      value={formData.installation_team}
                      onChange={(e) => setFormData({ ...formData, installation_team: e.target.value })}
                      placeholder="Enter installation team"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Enter contact person"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Additional Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Equipment Review</label>
                    <textarea
                      value={formData.equipment_review}
                      onChange={(e) => setFormData({ ...formData, equipment_review: e.target.value })}
                      rows="3"
                      placeholder="Enter equipment review"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Special Instructions</label>
                    <textarea
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      rows="3"
                      placeholder="Enter special instructions"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-colors border-none cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
