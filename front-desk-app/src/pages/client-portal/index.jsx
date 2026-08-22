import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ClientsPage() {
  const [view, setView] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [officerFilter, setOfficerFilter] = useState('All');

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    alt_email: '',
    address: '',
    city: '',
    subcity: '',
    woreda: '',
    region: '',
    po_box: '',
    type: '',
    industry: '',
    website: '',
    description: '',
    poc: '',
    priority: '',
    source: '',
    source_heard: '',
    budget: '',
    timeframe: '',
    interests: '',
    assigned_sales_officer_id: '',
    followup_date: '',
    tin: '',
    vat_number: '',
    reg_number: '',
    date_established: '',
    credit_limit: '',
    payment_terms: '',
    currency: 'ETB',
    opening_balance: '',
    total_orders: 0,
    total_sales: '',
    paid_amount: '',
    loyalty_level: '',
    account_manager: '',
    referral_source: '',
    status: '',
    registered_on: '',
    allow_self_update: false,
    extraNotes: []
  });
  const [formTab, setFormTab] = useState('info');
  const [noteAuthors, setNoteAuthors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [contactPersons, setContactPersons] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docFileUrls, setDocFileUrls] = useState({});

  const getFileUrl = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchClients();
    
    // Check for lead upgrade data from sessionStorage
    const upgradeLeadData = sessionStorage.getItem('upgradeLeadData');
    if (upgradeLeadData) {
      const lead = JSON.parse(upgradeLeadData);
      handleEdit(lead);
      sessionStorage.removeItem('upgradeLeadData');
    }
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const submitData = {
        ...formData,
        client_type: 'client',
        phone: formData.phone,
        point_of_contact: formData.poc,
        address: formData.address,
        assigned_sales_officer_id: user?.id || null,
        document_file_ids: documents.filter(doc => doc.file_id).map(doc => doc.file_id)
      };

      delete submitData.poc;
      delete submitData.extraNotes;
      delete submitData.total_orders;
      delete submitData.total_sales;
      delete submitData.paid_amount;

      // Filter out empty UUID fields
      if (!submitData.assigned_sales_officer_id) {
        delete submitData.assigned_sales_officer_id;
      }

      // Filter out empty date fields
      if (!submitData.followup_date) {
        delete submitData.followup_date;
      }
      if (!submitData.registered_on) {
        delete submitData.registered_on;
      }
      if (!submitData.date_established) {
        delete submitData.date_established;
      }

      // Filter out empty numeric fields
      if (!submitData.budget || submitData.budget === '') {
        delete submitData.budget;
      }
      if (!submitData.credit_limit || submitData.credit_limit === '') {
        delete submitData.credit_limit;
      }
      if (!submitData.opening_balance || submitData.opening_balance === '') {
        delete submitData.opening_balance;
      }
      if (!submitData.total_sales || submitData.total_sales === '') {
        delete submitData.total_sales;
      }
      if (!submitData.paid_amount || submitData.paid_amount === '') {
        delete submitData.paid_amount;
      }

      // Filter out invalid type field (must be Corporate, Individual, or Government)
      if (!submitData.type || !['Corporate', 'Individual', 'Government'].includes(submitData.type)) {
        delete submitData.type;
      }

      if (submitData.interests) {
        if (Array.isArray(submitData.interests)) {
          submitData.interests = submitData.interests;
        } else {
          submitData.interests = submitData.interests.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else {
        submitData.interests = [];
      }

      let clientId;
      if (editingId) {
        const { error } = await supabase
          .from('clients')
          .update(submitData)
          .eq('id', editingId);
        if (error) throw error;
        clientId = editingId;
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert([submitData])
          .select();
        if (error) throw error;
        clientId = data[0].id;
      }

      await saveClientContacts(clientId);
      await saveClientNotes(clientId);
      await fetchClients();
      resetForm();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client: ' + error.message);
    }
  };

  const handleEdit = async (client) => {
    setFormData({
      name: client.name || '',
      company_name: client.company_name || '',
      phone: client.phone || '',
      email: client.email || '',
      alt_email: client.alt_email || '',
      address: client.address || '',
      city: client.city || '',
      subcity: client.subcity || '',
      woreda: client.woreda || '',
      region: client.region || '',
      po_box: client.po_box || '',
      type: client.type || '',
      industry: client.industry || '',
      website: client.website || '',
      description: client.description || '',
      poc: client.point_of_contact || '',
      priority: client.priority || '',
      source: client.source || '',
      source_heard: client.source_heard || '',
      budget: client.budget || '',
      timeframe: client.timeframe || '',
      interests: client.interests || '',
      assigned_sales_officer_id: client.assigned_sales_officer_id || '',
      followup_date: client.followup_date || '',
      tin: client.tin || '',
      vat_number: client.vat_number || '',
      reg_number: client.reg_number || '',
      date_established: client.date_established || '',
      credit_limit: client.credit_limit || '',
      payment_terms: client.payment_terms || '',
      currency: client.currency || 'ETB',
      opening_balance: client.opening_balance || '',
      total_orders: client.total_orders || 0,
      total_sales: client.total_sales || '',
      paid_amount: client.paid_amount || '',
      loyalty_level: client.loyalty_level || '',
      account_manager: client.account_manager || '',
      referral_source: client.referral_source || '',
      status: client.status || '',
      registered_on: client.registered_on || '',
      allow_self_update: client.allow_self_update || false,
      extraNotes: []
    });
    setContactPersons([]);
    setDocuments([]);
    
    // Load contact persons from client_contacts table
    const { data: contacts } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', client.id);
    if (contacts) {
      setContactPersons(contacts.map(c => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        role: c.role
      })));
    }
    
    // Load documents
    if (client.document_file_ids && client.document_file_ids.length > 0) {
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .in('id', client.document_file_ids);
      if (files) {
        setDocuments(files.map(file => ({
          description: file.description || '',
          file: null,
          file_id: file.id,
          file_name: file.name,
          file_path: file.path
        })));

        // Generate signed URLs for documents
        const urls = { ...docFileUrls };
        for (const file of files) {
          if (file.path) {
            const url = await getFileUrl(file.path);
            if (url) urls[file.id] = url;
          }
        }
        setDocFileUrls(urls);
      }
    }
    setNoteAuthors([]);
    setEditingId(client.id);
    setView('form');
    const { data: notes } = await supabase
      .from('notes')
      .select('content, user_id')
      .eq('entity_type', 'clients')
      .eq('entity_id', client.id)
      .order('created_at', { ascending: true });
    const noteContents = (notes || []).map(n => n.content);
    const userIds = (notes || []).map(n => n.user_id);
    setFormData(prev => ({ ...prev, extraNotes: noteContents }));
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);
      const userMap = {};
      (users || []).forEach(u => { userMap[u.id] = u.username; });
      setNoteAuthors(userIds.map(uid => userMap[uid] || 'Unknown'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company_name: '',
      phone: '',
      email: '',
      alt_email: '',
      address: '',
      city: '',
      subcity: '',
      woreda: '',
      region: '',
      po_box: '',
      type: '',
      industry: '',
      website: '',
      description: '',
      poc: '',
      priority: '',
      source: '',
      source_heard: '',
      budget: '',
      timeframe: '',
      interests: '',
      assigned_sales_officer_id: '',
      followup_date: '',
      tin: '',
      vat_number: '',
      reg_number: '',
      date_established: '',
      credit_limit: '',
      payment_terms: '',
      currency: 'ETB',
      opening_balance: '',
      total_orders: 0,
      total_sales: '',
      paid_amount: '',
      loyalty_level: '',
      account_manager: '',
      referral_source: '',
      status: '',
      registered_on: '',
      allow_self_update: false,
      extraNotes: []
    });
    setContactPersons([]);
    setDocuments([]);
    setNoteAuthors([]);
    setEditingId(null);
    setView('dashboard');
  };

  const addExtraNote = () => {
    setFormData({ ...formData, extraNotes: [...formData.extraNotes, ''] });
  };

  const updateExtraNote = (index, value) => {
    const newNotes = [...formData.extraNotes];
    newNotes[index] = value;
    setFormData({ ...formData, extraNotes: newNotes });
  };

  const removeExtraNote = (index) => {
    setFormData({ ...formData, extraNotes: formData.extraNotes.filter((_, i) => i !== index) });
  };

  const saveClientNotes = async (clientId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    await supabase.from('notes').delete().eq('entity_type', 'clients').eq('entity_id', clientId);
    const extraNotes = formData.extraNotes.filter(note => note.trim());
    const noteInserts = extraNotes.map(note => ({
      entity_type: 'clients',
      entity_id: clientId,
      user_id: userId,
      content: note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    if (noteInserts.length > 0) {
      const { error } = await supabase.from('notes').insert(noteInserts);
      if (error) throw error;
    }
  };

  const saveClientContacts = async (clientId) => {
    await supabase.from('client_contacts').delete().eq('client_id', clientId);
    const validContacts = contactPersons.filter(cp => cp.name || cp.phone || cp.email);
    const contactInserts = validContacts.map(cp => ({
      client_id: clientId,
      name: cp.name || '',
      phone: cp.phone || '',
      email: cp.email || '',
      role: cp.role || ''
    }));
    if (contactInserts.length > 0) {
      const { error } = await supabase.from('client_contacts').insert(contactInserts);
      if (error) throw error;
    }
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
        setDocFileUrls(prev => ({ ...prev, [fileData.id]: url }));
      }

    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery ||
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || client.status === statusFilter;
    const matchesType = typeFilter === 'All' || client.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard View */}
      {view === 'dashboard' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Total Clients</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{clients.length}</p>
                <span className="text-[10px] text-slate-400">All Time</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Active</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{clients.filter(c => c.status === 'Active').length}</p>
                <span className="text-[10px] text-slate-400">Currently Active</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-user-check"></i>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Prospective</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{clients.filter(c => c.status === 'Prospective').length}</p>
                <span className="text-[10px] text-slate-400">Potential</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-user-clock"></i>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Lost</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{clients.filter(c => c.status === 'Lost').length}</p>
                <span className="text-[10px] text-slate-400">Closed Lost</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-user-xmark"></i>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white text-slate-600 flex-1 sm:flex-none min-w-[120px]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Prospective">Prospective</option>
                <option value="Inactive">Inactive</option>
                <option value="Lost">Lost</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white text-slate-600 flex-1 sm:flex-none min-w-[120px]"
              >
                <option value="All">All Types</option>
                <option value="Corporate">Corporate</option>
                <option value="Individual">Individual</option>
                <option value="Government">Government</option>
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Search in table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none w-full sm:w-48 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                    <th className="p-4 text-center w-12">#</th>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Company</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredClients.map((client, index) => (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{index + 1}</td>
                      <td className="p-4 font-medium">{client.name}</td>
                      <td className="p-4">{client.company_name || '-'}</td>
                      <td className="p-4">{client.phone || '-'}</td>
                      <td className="p-4">{client.email || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          client.type === 'Corporate' ? 'bg-blue-100 text-blue-700' :
                          client.type === 'Government' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{client.type || '-'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          client.status === 'Active' ? 'bg-green-100 text-green-700' :
                          client.status === 'Prospective' ? 'bg-blue-100 text-blue-700' :
                          client.status === 'Lost' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{client.status || '-'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer mr-2"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredClients.map((client, index) => (
              <div key={client.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-slate-800">{client.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{client.company_name || '-'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                      client.type === 'Corporate' ? 'bg-blue-100 text-blue-700' :
                      client.type === 'Government' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{client.type || '-'}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                      client.status === 'Active' ? 'bg-green-100 text-green-700' :
                      client.status === 'Prospective' ? 'bg-blue-100 text-blue-700' :
                      client.status === 'Lost' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{client.status || '-'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-slate-400">Phone:</span>
                    <span className="ml-1 text-slate-600">{client.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <span className="ml-1 text-slate-600 truncate block">{client.email || '-'}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer text-xs font-medium"
                  >
                    <i className="fa-solid fa-pen-to-square mr-1"></i> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Form Modal */}
      {view === 'form' && (
        <div style={{
          position: 'fixed',
          inset: '0',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '95vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            padding: '16px'
          }}>
            <div className="flex justify-between items-center pb-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingId ? 'Edit Client' : 'New Client'}
              </h2>
              <div className="flex items-center gap-2">
                {editingId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://vectoradvert.com/erp/frontdesk/#/clients/${editingId}`);
                    }}
                    className="text-slate-500 hover:text-blue-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
                    title="Copy client link"
                  >
                    <i className="fa-solid fa-link"></i> Copy Link
                  </button>
                )}
                <button
                  onClick={resetForm}
                  className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs gap-4 font-medium text-slate-400 pb-0 mb-4 overflow-x-auto scrollbar-hide">
              <button onClick={() => setFormTab('info')} className={`pb-3 border-b-2 cursor-pointer bg-transparent whitespace-nowrap ${formTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`} style={{border:'none',outline:'none'}}>Client Information</button>
              <button onClick={() => setFormTab('address')} className={`pb-3 border-b-2 cursor-pointer bg-transparent whitespace-nowrap ${formTab === 'address' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`} style={{border:'none',outline:'none'}}>Address Information</button>
              <button onClick={() => setFormTab('contacts')} className={`pb-3 border-b-2 cursor-pointer bg-transparent whitespace-nowrap ${formTab === 'contacts' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`} style={{border:'none',outline:'none'}}>Contact Persons</button>
              <button onClick={() => setFormTab('additional')} className={`pb-3 border-b-2 cursor-pointer bg-transparent whitespace-nowrap ${formTab === 'additional' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`} style={{border:'none',outline:'none'}}>Additional Information</button>
              <button onClick={() => setFormTab('documents')} className={`pb-3 border-b-2 cursor-pointer bg-transparent whitespace-nowrap ${formTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`} style={{border:'none',outline:'none'}}>Documents</button>
              <button onClick={() => setFormTab('notes')} className={`pb-3 border-b-2 cursor-pointer bg-transparent whitespace-nowrap ${formTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent'}`} style={{border:'none',outline:'none'}}>Notes</button>
            </div>

            {/* TAB: Client Information */}
            {formTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Client Name <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter client name" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                      <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="Enter company name" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                      <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white">
                        <option value="">Select type</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Individual">Individual</option>
                        <option value="Government">Government</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Industry</label>
                      <input type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} placeholder="Enter industry" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Website</label>
                    <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="Enter website" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" placeholder="Enter description" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-700" />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Communication Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email address" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Alternate Email</label>
                    <input type="email" value={formData.alt_email} onChange={(e) => setFormData({ ...formData, alt_email: e.target.value })} placeholder="Enter alternate email" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Point Of Contact</label>
                    <input type="text" value={formData.poc} onChange={(e) => setFormData({ ...formData, poc: e.target.value })} placeholder="Enter point of contact" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Address Information */}
            {formTab === 'address' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Address Details</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Enter address" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Enter city" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Subcity</label>
                    <input type="text" value={formData.subcity} onChange={(e) => setFormData({ ...formData, subcity: e.target.value })} placeholder="Enter subcity" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Woreda</label>
                    <input type="text" value={formData.woreda} onChange={(e) => setFormData({ ...formData, woreda: e.target.value })} placeholder="Enter woreda" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Region</label>
                    <input type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="Enter region" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">PO Box</label>
                    <input type="text" value={formData.po_box} onChange={(e) => setFormData({ ...formData, po_box: e.target.value })} placeholder="Enter PO Box" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Contact Persons */}
            {formTab === 'contacts' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Contact Persons</h3>
                  <button
                    type="button"
                    onClick={() => setContactPersons([...contactPersons, { name: '', role: '', phone: '', email: '' }])}
                    className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer bg-transparent border-none hover:text-blue-800"
                  >
                    <i className="fa-solid fa-plus"></i> Add Contact
                  </button>
                </div>
                <div id="cli-contacts-list" className="space-y-3">
                  {contactPersons.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4">No contact persons added yet. Click "+ Add Contact" to add.</div>
                  ) : (
                    contactPersons.map((cp, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={cp.name || ''}
                            onChange={(e) => {
                              const newContacts = [...contactPersons];
                              newContacts[idx].name = e.target.value;
                              setContactPersons(newContacts);
                            }}
                            placeholder="Contact name"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Role / Title</label>
                          <input
                            type="text"
                            value={cp.role || ''}
                            onChange={(e) => {
                              const newContacts = [...contactPersons];
                              newContacts[idx].role = e.target.value;
                              setContactPersons(newContacts);
                            }}
                            placeholder="e.g. Managing Director"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                          <input
                            type="text"
                            value={cp.phone || ''}
                            onChange={(e) => {
                              const newContacts = [...contactPersons];
                              newContacts[idx].phone = e.target.value;
                              setContactPersons(newContacts);
                            }}
                            placeholder="Phone number"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={cp.email || ''}
                            onChange={(e) => {
                              const newContacts = [...contactPersons];
                              newContacts[idx].email = e.target.value;
                              setContactPersons(newContacts);
                            }}
                            placeholder="Email address"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                          />
                        </div>
                        <div className="lg:col-span-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setContactPersons(contactPersons.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer bg-transparent border-none"
                          >
                            <i className="fa-solid fa-trash"></i> Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: Additional Information */}
            {formTab === 'additional' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">TIN</label>
                    <input type="text" value={formData.tin} onChange={(e) => setFormData({ ...formData, tin: e.target.value })} placeholder="Enter TIN" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">VAT Number</label>
                    <input type="text" value={formData.vat_number} onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })} placeholder="Enter VAT number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Reg Number</label>
                    <input type="text" value={formData.reg_number} onChange={(e) => setFormData({ ...formData, reg_number: e.target.value })} placeholder="Enter registration number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Credit Limit (ETB)</label>
                    <input type="number" value={formData.credit_limit} onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })} placeholder="Enter credit limit" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Opening Balance (ETB)</label>
                    <input type="number" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })} placeholder="Enter opening balance" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Total Sales (ETB)</label>
                    <input type="number" value={formData.total_sales} onChange={(e) => setFormData({ ...formData, total_sales: e.target.value })} placeholder="Enter total sales" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div> */}
                  {/* <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Paid Amount (ETB)</label>
                    <input type="number" value={formData.paid_amount} onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })} placeholder="Enter paid amount" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div> */}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Payment Terms</label>
                  <input type="text" value={formData.payment_terms} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} placeholder="Enter payment terms" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white">
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Prospective">Prospective</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                    <input type="text" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} placeholder="Enter priority" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                    <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Enter source" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Source Heard</label>
                    <input type="text" value={formData.source_heard} onChange={(e) => setFormData({ ...formData, source_heard: e.target.value })} placeholder="Where did they hear about us" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Budget (ETB)</label>
                    <input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="Enter budget" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Timeframe</label>
                    <input type="text" value={formData.timeframe} onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })} placeholder="Enter timeframe" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Followup Date</label>
                    <input type="date" value={formData.followup_date} onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Interests</label>
                  <input type="text" value={formData.interests} onChange={(e) => setFormData({ ...formData, interests: e.target.value })} placeholder="Enter interests (comma-separated)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Registered On</label>
                    <input type="date" value={formData.registered_on} onChange={(e) => setFormData({ ...formData, registered_on: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Date Established</label>
                    <input type="date" value={formData.date_established} onChange={(e) => setFormData({ ...formData, date_established: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                    <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white">
                      <option value="ETB">ETB</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Loyalty Level</label>
                    <input type="text" value={formData.loyalty_level} onChange={(e) => setFormData({ ...formData, loyalty_level: e.target.value })} placeholder="Enter loyalty level" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Account Manager</label>
                    <input type="text" value={formData.account_manager} onChange={(e) => setFormData({ ...formData, account_manager: e.target.value })} placeholder="Enter account manager" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Referral Source</label>
                    <input type="text" value={formData.referral_source} onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })} placeholder="Enter referral source" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow-self-update"
                    checked={formData.allow_self_update}
                    onChange={(e) => setFormData({ ...formData, allow_self_update: e.target.checked })}
                    className="cursor-pointer"
                  />
                  <label htmlFor="allow-self-update" className="text-xs font-medium text-slate-600 select-none">Allow Self Update</label>
                </div>
              </div>
            )}

            {/* TAB: Documents */}
            {formTab === 'documents' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Documents</h3>
                  <button
                    type="button"
                    onClick={() => setDocuments([...documents, { description: '', file: null, file_id: null }])}
                    className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer bg-transparent border-none hover:text-blue-800"
                  >
                    <i className="fa-solid fa-plus"></i> Add Document
                  </button>
                </div>
                <div id="cli-documents-list" className="space-y-3">
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
                            {docFileUrls[doc.file_id] ? (
                              <a
                                href={docFileUrls[doc.file_id]}
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
            )}

            {/* TAB: Notes */}
            {formTab === 'notes' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Notes</h3>
                  <button
                    type="button"
                    onClick={addExtraNote}
                    className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer bg-transparent border-none hover:text-blue-800"
                  >
                    <i className="fa-solid fa-plus"></i> Add Note
                  </button>
                </div>
                <div id="client-extra-notes-container" className="space-y-3">
                  {formData.extraNotes.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4">No notes added yet. Click "+ Add Note" to add.</div>
                  ) : (
                    formData.extraNotes.map((note, index) => (
                      <div key={index} className="bg-white p-4 rounded-xl border border-slate-200">
                        {noteAuthors[index] && (
                          <span className="text-[10px] text-slate-400 mb-2 block">{noteAuthors[index]}</span>
                        )}
                        <textarea
                          value={note}
                          onChange={(e) => updateExtraNote(index, e.target.value)}
                          rows="3"
                          placeholder={`Additional note ${index + 1}…`}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => removeExtraNote(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer bg-transparent border-none"
                          >
                            <i className="fa-solid fa-trash"></i> Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Footer — Save actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-4 mt-6">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button type="button" onClick={resetForm} className="flex-1 sm:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-medium text-xs transition-colors cursor-pointer">Cancel</button>
                <button type="submit" onClick={() => handleSubmit(new Event('submit'))} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer">
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}