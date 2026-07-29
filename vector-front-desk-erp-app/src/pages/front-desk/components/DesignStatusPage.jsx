import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function DesignStatusPage() {
  const { profile } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('In Progress');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [formData, setFormData] = useState({
    order_id: '',
    design_type: '',
    purpose: '',
    requested_date: '',
    required_date: '',
    priority: 'Medium',
    status: 'Pending',
    assigned_designer_id: '',
    requested_by: '',
    brief_dimensions: '',
    specifications: '',
    special_instructions: '',
    internal_notes: '',
    design_versions: []
  });

  useEffect(() => {
    fetchDesigns();
    fetchOrders();
    fetchUsers();
  }, [statusFilter]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('designs')
        .select('*, order:orders(order_no), assigned_designer:users(username), design_versions(*)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_no')
        .order('order_no', { ascending: true });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .order('username', { ascending: true });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = 
      (design.design_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.purpose?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.order?.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.assigned_designer?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = async (design) => {
    setFormData({
      order_id: design.order_id || '',
      design_type: design.design_type || '',
      purpose: design.purpose || '',
      requested_date: design.requested_date || '',
      required_date: design.required_date || '',
      priority: design.priority || 'Medium',
      status: design.status || 'Pending',
      assigned_designer_id: design.assigned_designer_id || '',
      requested_by: design.requested_by || '',
      brief_dimensions: design.brief_dimensions || '',
      specifications: design.specifications || '',
      special_instructions: design.special_instructions || '',
      internal_notes: design.internal_notes || '',
      design_versions: design.design_versions || []
    });
    setEditingId(design.id);

    // Load documents from attached_file_ids
    if (design.attached_file_ids && design.attached_file_ids.length > 0) {
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .in('id', design.attached_file_ids);
      if (files) {
        setDocuments(files.map(file => ({
          description: file.description || '',
          file: null,
          file_id: file.id,
          file_name: file.name
        })));
      }
    } else {
      setDocuments([]);
    }

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        order_id: formData.order_id || null,
        design_type: formData.design_type || null,
        purpose: formData.purpose || null,
        requested_date: formData.requested_date || null,
        required_date: formData.required_date || null,
        priority: formData.priority,
        status: formData.status,
        assigned_designer_id: formData.assigned_designer_id || null,
        requested_by: formData.requested_by || null,
        brief_dimensions: formData.brief_dimensions || null,
        specifications: formData.specifications || null,
        special_instructions: formData.special_instructions || null,
        internal_notes: formData.internal_notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('designs')
        .update(submitData)
        .eq('id', editingId);
      if (error) throw error;

      // Save attached_file_ids from documents
      const fileIds = documents.filter(doc => doc.file_id).map(doc => doc.file_id);
      if (fileIds.length > 0) {
        await supabase
          .from('designs')
          .update({ attached_file_ids: fileIds })
          .eq('id', editingId);
      }

      await fetchDesigns();
      resetForm();
    } catch (error) {
      console.error('Error updating design:', error);
      alert('Error updating design: ' + error.message);
    }
  };

  const handleQuickStatusUpdate = async (designId, newStatus) => {
    try {
      setUpdatingId(designId);
      const { error } = await supabase
        .from('designs')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', designId);
      if (error) throw error;

      setDesigns(prev => prev.map(d => 
        d.id === designId ? { ...d, status: newStatus } : d
      ));
    } catch (error) {
      console.error('Error updating design status:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      order_id: '',
      design_type: '',
      purpose: '',
      requested_date: '',
      required_date: '',
      priority: 'Medium',
      status: 'Pending',
      assigned_designer_id: '',
      requested_by: '',
      brief_dimensions: '',
      specifications: '',
      special_instructions: '',
      internal_notes: '',
      design_versions: []
    });
    setDocuments([]);
    setEditingId(null);
    setShowModal(false);
  };

  const addDocument = () => {
    setDocuments([...documents, { description: '', file: null, file_id: null, file_name: '' }]);
  };

  const handleSaveDocument = async (idx) => {
    const doc = documents[idx];
    if (!doc.file) {
      alert('Please select a file to upload');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const fileName = `${Date.now()}_${doc.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, doc.file);
      if (uploadError) throw uploadError;

      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          name: doc.file.name,
          path: uploadData.path,
          mime_type: doc.file.type,
          file_size: doc.file.size,
          uploaded_by: userId,
          description: doc.description
        })
        .select()
        .single();
      if (fileError) throw fileError;

      const newDocs = [...documents];
      newDocs[idx].file_id = fileData.id;
      newDocs[idx].file_name = fileData.name;
      setDocuments(newDocs);
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      'Completed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-slate-100 text-slate-700';
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      'High': 'bg-red-100 text-red-700',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'Low': 'bg-green-100 text-green-700'
    };
    return styles[priority] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Design Status</h2>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by type, purpose, order no, or designer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <button
            onClick={fetchDesigns}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Design Type</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Purpose</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Requested Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Required Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Priority</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Assigned Designer</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan="10" className="p-8 text-center text-slate-400">
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading...
                </td>
              </tr>
            ) : filteredDesigns.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-8 text-center text-slate-400">
                  No designs found
                </td>
              </tr>
            ) : (
              filteredDesigns.map((design, index) => (
                <tr key={design.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">{design.order?.order_no || '-'}</td>
                  <td className="p-4">{design.design_type || '-'}</td>
                  <td className="p-4">{design.purpose || '-'}</td>
                  <td className="p-4">{design.requested_date || '-'}</td>
                  <td className="p-4">{design.required_date || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(design.status)}`}>
                      {design.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(design.priority)}`}>
                      {design.priority}
                    </span>
                  </td>
                  <td className="p-4">{design.assigned_designer?.username || '-'}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(design)}
                        className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer text-xs"
                        title="Full Edit"
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <select
                        value={design.status}
                        onChange={(e) => handleQuickStatusUpdate(design.id, e.target.value)}
                        disabled={updatingId === design.id}
                        className="border border-slate-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      {updatingId === design.id && (
                        <i className="fa-solid fa-spinner fa-spin text-blue-600"></i>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Full Edit Modal - like DesignsPage */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Edit Design</h2>
              <button
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Design Information */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Design Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Order <span className="text-red-500">*</span></label>
                    <select
                      value={formData.order_id}
                      onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select order</option>
                      {orders.map(order => (
                        <option key={order.id} value={order.id}>{order.order_no}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Design Type</label>
                    <input
                      type="text"
                      value={formData.design_type}
                      onChange={(e) => setFormData({ ...formData, design_type: e.target.value })}
                      placeholder="Enter design type"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Purpose</label>
                    <textarea
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      rows="3"
                      placeholder="Enter purpose"
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
                      <label className="block text-xs font-medium text-slate-500 mb-1">Required Date</label>
                      <input
                        type="date"
                        value={formData.required_date}
                        onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
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

                {/* Additional Information */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Additional Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Assigned Designer</label>
                    <select
                      value={formData.assigned_designer_id}
                      onChange={(e) => setFormData({ ...formData, assigned_designer_id: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select designer</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Requested By</label>
                    <input
                      type="text"
                      value={formData.requested_by}
                      onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                      placeholder="Enter requester name"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Brief Dimensions</label>
                    <textarea
                      value={formData.brief_dimensions}
                      onChange={(e) => setFormData({ ...formData, brief_dimensions: e.target.value })}
                      rows="2"
                      placeholder="Enter brief dimensions"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Specifications</label>
                    <textarea
                      value={formData.specifications}
                      onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                      rows="3"
                      placeholder="Enter specifications"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Special Instructions</label>
                    <textarea
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      rows="2"
                      placeholder="Enter special instructions"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Internal Notes</label>
                    <textarea
                      value={formData.internal_notes}
                      onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                      rows="2"
                      placeholder="Enter internal notes"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Attached Files */}
              <div className="mt-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Attached Files</h3>
                  <button
                    type="button"
                    onClick={addDocument}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-colors border-none cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Add Document
                  </button>
                </div>

                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4">No documents added yet.</div>
                  ) : (
                    documents.map((doc, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                          <input
                            type="text"
                            value={doc.description || ''}
                            onChange={(e) => {
                              const newDocs = [...documents];
                              newDocs[idx].description = e.target.value;
                              setDocuments(newDocs);
                            }}
                            placeholder="Write description here"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Upload file</label>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const newDocs = [...documents];
                                  newDocs[idx].file = file;
                                  setDocuments(newDocs);
                                }
                              }}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveDocument(idx)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none mt-5"
                          >
                            (+ save)
                          </button>
                        </div>
                        {doc.file_id && (
                          <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
                            <span className="text-xs text-green-700">
                              <i className="fa-solid fa-check mr-1"></i>
                              {doc.file_name || doc.file?.name || 'File saved'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer bg-transparent border-none"
                            >
                              <i className="fa-solid fa-trash"></i> Remove
                            </button>
                          </div>
                        )}
                        {!doc.file_id && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer bg-transparent border-none"
                            >
                              <i className="fa-solid fa-trash"></i> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}