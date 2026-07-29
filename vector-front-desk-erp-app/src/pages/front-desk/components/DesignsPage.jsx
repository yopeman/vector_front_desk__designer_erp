import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function DesignsPage() {
  const { profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileUrls, setFileUrls] = useState({});
  const [versionFileUrls, setVersionFileUrls] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Form state
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
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDesigns();
    fetchOrders();
    fetchUsers();
    fetchFiles();
  }, []);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*, order:orders(order_no), assigned_designer:users(username), design_versions(*)')
        .order('created_at', { ascending: false });

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

  const getFileUrl = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        order_id: formData.order_id,
        design_type: formData.design_type,
        purpose: formData.purpose,
        requested_date: formData.requested_date,
        required_date: formData.required_date,
        priority: formData.priority,
        status: formData.status,
        assigned_designer_id: formData.assigned_designer_id,
        requested_by: formData.requested_by,
        brief_dimensions: formData.brief_dimensions,
        specifications: formData.specifications,
        special_instructions: formData.special_instructions,
        internal_notes: formData.internal_notes
      };

      // Filter out empty fields
      if (!submitData.order_id) delete submitData.order_id;
      if (!submitData.design_type) delete submitData.design_type;
      if (!submitData.purpose) delete submitData.purpose;
      if (!submitData.requested_date) delete submitData.requested_date;
      if (!submitData.required_date) delete submitData.required_date;
      if (!submitData.assigned_designer_id) delete submitData.assigned_designer_id;
      if (!submitData.requested_by) delete submitData.requested_by;
      if (!submitData.brief_dimensions) delete submitData.brief_dimensions;
      if (!submitData.specifications) delete submitData.specifications;
      if (!submitData.special_instructions) delete submitData.special_instructions;
      if (!submitData.internal_notes) delete submitData.internal_notes;

      let designId;
      if (editingId) {
        const { error } = await supabase
          .from('designs')
          .update(submitData)
          .eq('id', editingId);
        if (error) throw error;
        designId = editingId;

        // Delete existing design versions and create new ones
        await supabase.from('design_versions').delete().eq('design_id', designId);
      } else {
        const { data, error } = await supabase
          .from('designs')
          .insert([submitData])
          .select();
        if (error) throw error;
        designId = data[0].id;
      }

      // Insert design versions
      const validVersions = formData.design_versions.filter(version => version.file_id);
      for (const version of validVersions) {
        const versionData = {
          design_id: designId,
          file_id: version.file_id,
          version_number: version.version_number,
          status: version.status
        };
        if (version.description) versionData.description = version.description;
        if (version.sent_on) versionData.sent_on = version.sent_on;
        if (version.sent_by) versionData.sent_by = version.sent_by;
        
        await supabase.from('design_versions').insert([versionData]);
      }

      // Save attached_file_ids from documents
      const fileIds = documents.filter(doc => doc.file_id).map(doc => doc.file_id);
      if (fileIds.length > 0) {
        await supabase
          .from('designs')
          .update({ attached_file_ids: fileIds })
          .eq('id', designId);
      }

      await fetchDesigns();
      resetForm();
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Error saving design: ' + error.message);
    }
  };

  const handleEdit = async (design) => {
    // Fetch file info for design versions
    let versionsWithFileInfo = design.design_versions || [];
    const versionFileIds = versionsWithFileInfo
      .filter(v => v.file_id)
      .map(v => v.file_id);

    if (versionFileIds.length > 0) {
      const { data: versionFiles } = await supabase
        .from('files')
        .select('*')
        .in('id', versionFileIds);

      if (versionFiles) {
        const fileMap = {};
        versionFiles.forEach(f => { fileMap[f.id] = f; });

        versionsWithFileInfo = versionsWithFileInfo.map(v => ({
          ...v,
          file_name: fileMap[v.file_id]?.name || v.file_name || '',
          file_path: fileMap[v.file_id]?.path || ''
        }));

        // Generate signed URLs for version files
        const urls = { ...versionFileUrls };
        for (const file of versionFiles) {
          if (file.path) {
            const url = await getFileUrl(file.path);
            if (url) urls[file.id] = url;
          }
        }
        setVersionFileUrls(urls);
      }
    }

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
      design_versions: versionsWithFileInfo
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
          file_name: file.name,
          file_path: file.path
        })));

        // Generate signed URLs for documents
        const urls = { ...fileUrls };
        for (const file of files) {
          if (file.path) {
            const url = await getFileUrl(file.path);
            if (url) urls[file.id] = url;
          }
        }
        setFileUrls(urls);
      }
    } else {
      setDocuments([]);
    }
    
    setShowModal(true);
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
      requested_by: `Front Desk Officer (${profile?.username})` || '',
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

  const addDesignVersion = () => {
    const maxVersion = formData.design_versions.length > 0 
      ? Math.max(...formData.design_versions.map(v => v.version_number || 0))
      : 0;
    setFormData({
      ...formData,
      design_versions: [
        ...formData.design_versions,
        {
          file_id: '',
          file: null,
          file_name: '',
          version_number: maxVersion + 1,
          description: '',
          sent_on: '',
          sent_by: `Front Desk Officer (${profile?.username})` || '',
          status: 'Sent'
        }
      ]
    });
  };

  const updateDesignVersion = (index, field, value) => {
    const updatedVersions = [...formData.design_versions];
    updatedVersions[index][field] = value;
    setFormData({ ...formData, design_versions: updatedVersions });
  };

  const removeDesignVersion = (index) => {
    setFormData({
      ...formData,
      design_versions: formData.design_versions.filter((_, i) => i !== index)
    });
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
      
      // Upload file to Supabase storage
      const fileName = `${Date.now()}_${doc.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, doc.file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
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

    // Update document state with file_id
    const newDocs = [...documents];
    newDocs[idx].file_id = fileData.id;
    newDocs[idx].file_name = fileData.name;
    newDocs[idx].file_path = fileData.path;
    setDocuments(newDocs);

    // Generate signed URL for the uploaded file
    const url = await getFileUrl(fileData.path);
    if (url) {
      setFileUrls(prev => ({ ...prev, [fileData.id]: url }));
    }

    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    }
  };

  const handleSaveDesignVersionFile = async (index) => {
    const version = formData.design_versions[index];
    if (!version.file) {
      alert('Please select a file to upload');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Upload file to Supabase storage
      const fileName = `${Date.now()}_${version.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, version.file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          name: version.file.name,
          path: uploadData.path,
          mime_type: version.file.type,
          file_size: version.file.size,
          uploaded_by: userId,
          description: version.description
        })
        .select()
        .single();

      if (fileError) throw fileError;

    // Update version state with file_id
    const updatedVersions = [...formData.design_versions];
    updatedVersions[index].file_id = fileData.id;
    updatedVersions[index].file_name = fileData.name;
    updatedVersions[index].file_path = fileData.path;
    setFormData({ ...formData, design_versions: updatedVersions });

    // Generate signed URL for the uploaded file
    const url = await getFileUrl(fileData.path);
    if (url) {
      setVersionFileUrls(prev => ({ ...prev, [fileData.id]: url }));
    }

    } catch (error) {
      console.error('Error saving design version file:', error);
      alert('Error saving design version file: ' + error.message);
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = 
      (design.design_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.purpose?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.order?.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || design.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || design.priority === priorityFilter;
    
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
        <h2 className="text-xl font-bold text-slate-800">Designs</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> New Design
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by type, purpose, or order no..."
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
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredDesigns.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      design.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      design.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      design.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {design.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      design.priority === 'High' ? 'bg-red-100 text-red-700' :
                      design.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {design.priority}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(design)}
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
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Design' : 'New Design'}
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

                <div id="design-documents-list" className="space-y-3">
                  {documents.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4">No documents added yet. Click "+ Add Document" to add.</div>
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
                            <label className="block text-xs font-medium text-slate-500 mb-1">Upload file (file chooser)</label>
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
                            {fileUrls[doc.file_id] ? (
                              <a
                                href={fileUrls[doc.file_id]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 no-underline flex items-center gap-1"
                              >
                                <i className="fa-solid fa-check text-green-700 mr-1"></i>
                                {doc.file_name || doc.file?.name || 'File saved'}
                                <i className="fa-solid fa-external-link text-blue-400 text-[10px]"></i>
                              </a>
                            ) : (
                              <span className="text-xs text-green-700">
                                <i className="fa-solid fa-check mr-1"></i>
                                {doc.file_name || doc.file?.name || 'File saved'}
                              </span>
                            )}
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

              {/* Design Versions */}
              <div className="mt-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Design Versions</h3>
                  <button
                    type="button"
                    onClick={addDesignVersion}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-colors border-none cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Add Version
                  </button>
                </div>

                {formData.design_versions.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">No versions added yet</p>
                ) : (
                  <div className="space-y-3">
                    {formData.design_versions.map((version, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Upload File</label>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const updatedVersions = [...formData.design_versions];
                                      updatedVersions[index].file = file;
                                      setFormData({ ...formData, design_versions: updatedVersions });
                                    }
                                  }}
                                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveDesignVersionFile(index)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none"
                              >
                                (+ save)
                              </button>
                            </div>
                            {version.file_id && (
                              <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg mt-2">
                                {versionFileUrls[version.file_id] ? (
                                  <a
                                    href={versionFileUrls[version.file_id]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 no-underline flex items-center gap-1"
                                  >
                                    <i className="fa-solid fa-check text-green-700 mr-1"></i>
                                    {version.file_name || version.file?.name || 'File saved'}
                                    <i className="fa-solid fa-external-link text-blue-400 text-[10px]"></i>
                                  </a>
                                ) : (
                                  <span className="text-xs text-green-700">
                                    <i className="fa-solid fa-check mr-1"></i>
                                    {version.file_name || version.file?.name || 'File saved'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Version Number</label>
                              <input
                                type="number"
                                value={version.version_number}
                                onChange={(e) => updateDesignVersion(index, 'version_number', parseInt(e.target.value) || 0)}
                                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                              <select
                                value={version.status}
                                onChange={(e) => updateDesignVersion(index, 'status', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              >
                                <option value="Sent">Sent</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Sent On</label>
                              <input
                                type="datetime-local"
                                value={version.sent_on}
                                onChange={(e) => updateDesignVersion(index, 'sent_on', e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                              <input
                                type="text"
                                value={version.description}
                                onChange={(e) => updateDesignVersion(index, 'description', e.target.value)}
                                placeholder="Enter description"
                                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDesignVersion(index)}
                          className="mt-3 text-red-600 hover:text-red-800 text-xs bg-transparent border-none cursor-pointer"
                        >
                          <i className="fa-solid fa-trash"></i> Remove Version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
