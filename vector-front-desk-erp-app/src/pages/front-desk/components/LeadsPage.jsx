import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function LeadsPage({ onUpgradeToClient }) {
  const [view, setView] = useState('dashboard'); // dashboard | form
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [officerFilter, setOfficerFilter] = useState('All');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    poc: '',
    extraNotes: []
  });
  const [noteAuthors, setNoteAuthors] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [payingClientIds, setPayingClientIds] = useState(new Set());

  useEffect(() => {
    fetchLeads();
    fetchPayingClientIds();
  }, []);

  const fetchPayingClientIds = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('client_id');

      if (error) throw error;
      const ids = new Set((data || []).map(p => p.client_id));
      setPayingClientIds(ids);
    } catch (error) {
      console.error('Error fetching paying client IDs:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_type', 'lead')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        client_type: 'lead',
        status: 'New',
        phone: formData.phone,
        point_of_contact: formData.poc,
        address: formData.address
      };

      delete submitData.poc;
      delete submitData.extraNotes;

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

      await saveClientNotes(clientId);
      await fetchLeads();
      resetForm();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error saving lead: ' + error.message);
    }
  };

  const handleEdit = async (lead) => {
    setFormData({
      name: lead.name || '',
      address: lead.address || '',
      phone: lead.phone || '',
      poc: lead.point_of_contact || '',
      extraNotes: []
    });
    setNoteAuthors([]);
    setEditingId(lead.id);
    setView('form');
    const { data: notes } = await supabase
      .from('notes')
      .select('content, user_id')
      .eq('entity_type', 'clients')
      .eq('entity_id', lead.id)
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

  const handleUpgradeToClient = (lead) => {
    // Store lead data in sessionStorage for the ClientsPage to use
    sessionStorage.setItem('upgradeLeadData', JSON.stringify(lead));
    // Call the parent callback to switch to clients page
    if (onUpgradeToClient) {
      onUpgradeToClient();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      poc: '',
      extraNotes: []
    });
    setNoteAuthors([]);
    setEditingId(null);
    setView('dashboard');
  };

  const addExtraNote = () => {
    setFormData({
      ...formData,
      extraNotes: [...formData.extraNotes, '']
    });
  };

  const updateExtraNote = (index, value) => {
    const newNotes = [...formData.extraNotes];
    newNotes[index] = value;
    setFormData({ ...formData, extraNotes: newNotes });
  };

  const removeExtraNote = (index) => {
    setFormData({
      ...formData,
      extraNotes: formData.extraNotes.filter((_, i) => i !== index)
    });
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesOfficer = officerFilter === 'All' || lead.assigned_sales_officer_id === officerFilter;
    
    return matchesSearch && matchesStatus && matchesOfficer;
  });

  const kpiStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    inProgress: leads.filter(l => l.status === 'In Progress').length,
    converted: leads.filter(l => l.status === 'Converted').length,
    lost: leads.filter(l => l.status === 'Lost').length
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dashboard View */}
      {view === 'dashboard' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Total Leads</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{kpiStats.total}</p>
                <span className="text-[10px] text-slate-400">All Time</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">New Leads</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{kpiStats.new}</p>
                <span className="text-[10px] text-slate-400">Uncontacted</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-user-plus"></i>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">In Progress</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{kpiStats.inProgress}</p>
                <span className="text-[10px] text-slate-400">Nurturing</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-paper-plane"></i>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Converted</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{kpiStats.converted}</p>
                <span className="text-[10px] text-slate-400">Closed Won</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-handshake"></i>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 font-semibold">Lost Leads</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{kpiStats.lost}</p>
                <span className="text-[10px] text-slate-400">Closed Lost</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-lg">
                <i className="fa-solid fa-user-xmark"></i>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none bg-white text-slate-600"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="In Progress">In Progress</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
              {/* <select 
                value={officerFilter}
                onChange={(e) => setOfficerFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none bg-white text-slate-600"
              >
                <option value="All">All Officers</option>
                <option value="Tigist">Tigist</option>
                <option value="Lemi">Lemi</option>
                <option value="Aster">Aster</option>
              </select> */}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setView('form')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition-colors border-none cursor-pointer"
              >
                <i className="fa-solid fa-plus"></i>
                <span>New Lead</span>
              </button>
              <div className="relative flex-1 sm:flex-initial">
                <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Search in table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none w-full sm:w-48 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                    <th className="p-4 text-center w-12">#</th>
                    <th className="p-4">Lead Code</th>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Point Of Contact</th>
                    <th className="p-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLeads.map((lead, index) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{index + 1}</td>
                      <td className="p-4">LD-{String(index + 1).padStart(6, '0')}</td>
                      <td className="p-4 font-medium">{lead.name}</td>
                      <td className="p-4">{lead.address}</td>
                      <td className="p-4">{lead.phone}</td>
                      <td className="p-4">{lead.point_of_contact}</td>
                       <td className="p-4 text-center">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer mr-2"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        {payingClientIds.has(lead.id) && (
                          <button
                            onClick={() => handleUpgradeToClient(lead)}
                            className="text-green-600 hover:text-green-800 bg-transparent border-none cursor-pointer"
                            title="Upgrade to Client"
                          >
                            <i className="fa-solid fa-arrow-up"></i> Upgrade
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            padding: '20px'
          }}>
            <div className="flex justify-between items-center pb-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingId ? 'Edit Lead' : 'New Lead'}
              </h2>
              <div className="flex items-center gap-2">
                {editingId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/#/clients/${editingId}`);
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

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center">
                <i className="fa-solid fa-address-card text-blue-500 mr-2"></i>
                Lead Details
              </h3>

              {/* Client Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client name"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="bg-slate-200 border border-r-0 border-slate-300 px-2.5 py-2 rounded-l-lg flex items-center gap-1 text-xs text-slate-600 select-none">
                    <svg width="20" height="14" viewBox="0 0 20 14" style={{borderRadius:'2px',flexShrink:0,display:'inline-block',verticalAlign:'middle'}}>
                      <rect width="20" height="4.67" y="0" fill="#078930"/>
                      <rect width="20" height="4.67" y="4.67" fill="#FCDD09"/>
                      <rect width="20" height="4.67" y="9.33" fill="#DA121A"/>
                      <circle cx="10" cy="7" r="3.2" fill="#0F47AF"/>
                      <polygon points="10,4.2 10.6,6.1 12.6,6.1 11,7.2 11.6,9.1 10,8 8.4,9.1 9,7.2 7.4,6.1 9.4,6.1" fill="#FCDD09"/>
                    </svg>
                    +251
                  </span>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                    className="w-full border border-slate-300 rounded-r-lg px-3 py-2 text-xs focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Point Of Contact */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Point Of Contact <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.poc}
                  onChange={(e) => setFormData({ ...formData, poc: e.target.value })}
                  placeholder="Enter point of contact"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

                {/* Notes */}
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-medium text-slate-500">Note</label>
                    <button
                      type="button"
                      onClick={addExtraNote}
                      className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer bg-transparent border-none hover:text-blue-800"
                    >
                      <i className="fa-solid fa-plus"></i> Add Note
                    </button>
                  </div>
                {/* Dynamic extra notes container */}
                <div id="lead-extra-notes-container" className="space-y-3">
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
            </div>

            {/* Footer — Save actions */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => handleSubmit(new Event('submit'))}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-colors border-none cursor-pointer"
                >
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
