import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * SelfUpdateForm — lets a client (or lead) view and update their own information.
 *
 * Rules:
 *  - Only renders when `client.allow_self_update` is true.
 *  - `client_type` is NEVER editable (excluded from the form and payload).
 *  - When client_type === 'lead'  → show lead fields only (name, address, phone, poc).
 *  - When client_type === 'client' → show all client fields (tabbed form) + documents upload.
 */
export default function SelfUpdateForm({ client, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState('info');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ---- Lead form state ----
  const [leadData, setLeadData] = useState({
    name: '',
    address: '',
    phone: '',
    poc: ''
  });

  // ---- Client form state ----
  const [clientData, setClientData] = useState({});
  const [contactPersons, setContactPersons] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docFileUrls, setDocFileUrls] = useState({});
  const [uploadingIdx, setUploadingIdx] = useState(null);

  useEffect(() => {
    if (!client) return;
    if (client.client_type === 'lead') {
      setLeadData({
        name: client.name || '',
        address: client.address || '',
        phone: client.phone || '',
        poc: client.point_of_contact || ''
      });
    } else {
      setClientData({
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
        followup_date: client.followup_date || '',
        tin: client.tin || '',
        vat_number: client.vat_number || '',
        reg_number: client.reg_number || '',
        date_established: client.date_established || '',
        credit_limit: client.credit_limit || '',
        payment_terms: client.payment_terms || '',
        currency: client.currency || 'ETB',
        opening_balance: client.opening_balance || '',
        total_sales: client.total_sales || '',
        paid_amount: client.paid_amount || '',
        loyalty_level: client.loyalty_level || '',
        account_manager: client.account_manager || '',
        referral_source: client.referral_source || '',
        status: client.status || '',
        registered_on: client.registered_on || ''
      });
      loadContacts(client.id);
      loadDocuments(client);
    }
  }, [client]);

  // ---- Helpers ----

  async function loadContacts(clientId) {
    const { data: contacts } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId);
    if (contacts) {
      setContactPersons(contacts.map(c => ({
        name: c.name, phone: c.phone, email: c.email, role: c.role
      })));
    }
  }

  async function loadDocuments(client) {
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
        const urls = {};
        for (const file of files) {
          if (file.path) {
            const url = await getFileUrl(file.path);
            if (url) urls[file.id] = url;
          }
        }
        setDocFileUrls(urls);
      }
    }
  }

  async function getFileUrl(filePath) {
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
  }

  // ---- Document upload ----
  async function handleUploadDocument(idx) {
    const doc = documents[idx];
    if (!doc.file) {
      alert('Please select a file to upload');
      return;
    }

    setUploadingIdx(idx);
    try {
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

      // Update client's document_file_ids
      const currentFileIds = (client.document_file_ids || []);
      if (!currentFileIds.includes(fileData.id)) {
        const updatedFileIds = [...currentFileIds, fileData.id];
        await supabase
          .from('clients')
          .update({ document_file_ids: updatedFileIds })
          .eq('id', client.id);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    } finally {
      setUploadingIdx(null);
    }
  }

  async function handleRemoveDocument(idx) {
    const doc = documents[idx];
    if (!doc.file_id) {
      // Not uploaded yet, just remove from list
      setDocuments(documents.filter((_, i) => i !== idx));
      return;
    }

    try {
      // Remove from client's document_file_ids
      const currentFileIds = (client.document_file_ids || []).filter(id => id !== doc.file_id);
      await supabase
        .from('clients')
        .update({ document_file_ids: currentFileIds })
        .eq('id', client.id);

      // Delete file from storage
      if (doc.file_path) {
        await supabase.storage.from('documents').remove([doc.file_path]);
      }

      // Delete file record
      await supabase.from('files').delete().eq('id', doc.file_id);

      setDocuments(documents.filter((_, i) => i !== idx));
      setDocFileUrls(prev => {
        const next = { ...prev };
        delete next[doc.file_id];
        return next;
      });
    } catch (error) {
      console.error('Error removing document:', error);
      alert('Error removing document: ' + error.message);
    }
  }

  // ---- Lead save ----
  async function saveLead(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: leadData.name,
        address: leadData.address,
        phone: leadData.phone,
        point_of_contact: leadData.poc
      };
      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', client.id);
      if (error) throw error;
      setEditing(false);
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error updating: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  // ---- Client save ----
  async function saveClient(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...clientData };
      // Never allow clients to change their own type or self-update permission
      delete payload.allow_self_update;
      delete payload.client_type;
      // Map poc to point_of_contact
      payload.point_of_contact = payload.poc;
      delete payload.poc;

      // Process interests
      if (payload.interests) {
        if (Array.isArray(payload.interests)) {
          // keep as is
        } else {
          payload.interests = payload.interests.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else {
        payload.interests = [];
      }

      // Filter empty date fields
      ['followup_date', 'registered_on', 'date_established'].forEach(f => {
        if (!payload[f]) delete payload[f];
      });

      // Filter empty numeric fields
      ['budget', 'credit_limit', 'opening_balance', 'total_sales', 'paid_amount'].forEach(f => {
        if (!payload[f] || payload[f] === '') delete payload[f];
      });

      // Filter invalid type
      if (!payload.type || !['Corporate', 'Individual', 'Government'].includes(payload.type)) {
        delete payload.type;
      }

      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', client.id);
      if (error) throw error;

      await saveContacts(client.id);
      setEditing(false);
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error updating: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveContacts(clientId) {
    await supabase.from('client_contacts').delete().eq('client_id', clientId);
    const valid = contactPersons.filter(cp => cp.name || cp.phone || cp.email);
    const inserts = valid.map(cp => ({
      client_id: clientId,
      name: cp.name || '',
      phone: cp.phone || '',
      email: cp.email || '',
      role: cp.role || ''
    }));
    if (inserts.length > 0) {
      const { error } = await supabase.from('client_contacts').insert(inserts);
      if (error) throw error;
    }
  }

  // ---- Render guards ----
  if (!client) return null;

  const isLead = client.client_type === 'lead';
  const canEdit = client.allow_self_update;

  // ---- Lead view (read-only + edit) ----
  if (isLead) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">My Information</h2>
          {!editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDetailsModal(true)}
                className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                View Details
              </button>
              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Edit
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveLead}
                disabled={saving}
                className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-semibold text-gray-800">{leadData.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-semibold text-gray-800">{leadData.phone || '-'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={saveLead} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={leadData.phone}
                onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={leadData.address}
                onChange={(e) => setLeadData({ ...leadData, address: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Point of Contact <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={leadData.poc}
                onChange={(e) => setLeadData({ ...leadData, poc: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </form>
        )}

        {/* Lead Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Lead Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Name</label>
                  <p className="text-sm text-gray-800">{leadData.name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Phone</label>
                  <p className="text-sm text-gray-800">{leadData.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Address</label>
                  <p className="text-sm text-gray-800">{leadData.address || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Point of Contact</label>
                  <p className="text-sm text-gray-800">{leadData.poc || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Client view (tabbed form, all fields) ----
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">My Information</h2>
        {!editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              View Details
            </button>
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Edit
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveClient}
              disabled={saving}
              className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        /* Read-only summary */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-gray-500">Name</p><p className="font-semibold text-gray-800">{clientData.name || '-'}</p></div>
          <div><p className="text-xs text-gray-500">Phone</p><p className="font-semibold text-gray-800">{clientData.phone || '-'}</p></div>
        </div>
      ) : (
        /* Editable tabbed form */
        <div>
          {/* Tabs */}
          <div className="flex flex-wrap gap-4 border-b border-gray-200 mb-4 text-sm font-medium text-gray-400">
            {['info', 'address', 'contacts', 'additional', 'documents'].map(tab => (
              <button
                key={tab}
                onClick={() => setFormTab(tab)}
                className={`pb-2 capitalize ${formTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'border-b-2 border-transparent'}`}
              >
                {tab === 'info' ? 'Client Information' : tab === 'poc' ? 'Point of Contact' : tab}
              </button>
            ))}
          </div>

          {/* TAB: info */}
          {formTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                <input type="text" value={clientData.name || ''} onChange={(e) => setClientData({ ...clientData, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Company Name</label>
                <input type="text" value={clientData.company_name || ''} onChange={(e) => setClientData({ ...clientData, company_name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={clientData.type || ''} onChange={(e) => setClientData({ ...clientData, type: e.target.value })} className={inputCls}>
                  <option value="">Select type</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Individual">Individual</option>
                  <option value="Government">Government</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Industry</label>
                <input type="text" value={clientData.industry || ''} onChange={(e) => setClientData({ ...clientData, industry: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input type="text" value={clientData.website || ''} onChange={(e) => setClientData({ ...clientData, website: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={clientData.description || ''} onChange={(e) => setClientData({ ...clientData, description: e.target.value })} rows={3} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="text" value={clientData.phone || ''} onChange={(e) => setClientData({ ...clientData, phone: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={clientData.email || ''} onChange={(e) => setClientData({ ...clientData, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Alternate Email</label>
                <input type="email" value={clientData.alt_email || ''} onChange={(e) => setClientData({ ...clientData, alt_email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Point of Contact</label>
                <input type="text" value={clientData.poc || ''} onChange={(e) => setClientData({ ...clientData, poc: e.target.value })} className={inputCls} />
              </div>
            </div>
          )}

          {/* TAB: address */}
          {formTab === 'address' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Address</label>
                <input type="text" value={clientData.address || ''} onChange={(e) => setClientData({ ...clientData, address: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={labelCls}>City</label><input type="text" value={clientData.city || ''} onChange={(e) => setClientData({ ...clientData, city: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Subcity</label><input type="text" value={clientData.subcity || ''} onChange={(e) => setClientData({ ...clientData, subcity: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Woreda</label><input type="text" value={clientData.woreda || ''} onChange={(e) => setClientData({ ...clientData, woreda: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Region</label><input type="text" value={clientData.region || ''} onChange={(e) => setClientData({ ...clientData, region: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>PO Box</label><input type="text" value={clientData.po_box || ''} onChange={(e) => setClientData({ ...clientData, po_box: e.target.value })} className={inputCls} /></div>
              </div>
            </div>
          )}

          {/* TAB: contacts */}
          {formTab === 'contacts' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Contact Persons</span>
                <button type="button" onClick={() => setContactPersons([...contactPersons, { name: '', role: '', phone: '', email: '' }])} className="text-blue-600 text-xs font-semibold hover:text-blue-800">+ Add Contact</button>
              </div>
              {contactPersons.length === 0 && <p className="text-xs text-gray-400 italic">No contact persons added.</p>}
              {contactPersons.map((cp, idx) => (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div><label className={labelCls}>Full Name</label><input type="text" value={cp.name || ''} onChange={(e) => { const n = [...contactPersons]; n[idx].name = e.target.value; setContactPersons(n); }} className={inputCls} /></div>
                  <div><label className={labelCls}>Role</label><input type="text" value={cp.role || ''} onChange={(e) => { const n = [...contactPersons]; n[idx].role = e.target.value; setContactPersons(n); }} className={inputCls} /></div>
                  <div><label className={labelCls}>Phone</label><input type="text" value={cp.phone || ''} onChange={(e) => { const n = [...contactPersons]; n[idx].phone = e.target.value; setContactPersons(n); }} className={inputCls} /></div>
                  <div><label className={labelCls}>Email</label><input type="email" value={cp.email || ''} onChange={(e) => { const n = [...contactPersons]; n[idx].email = e.target.value; setContactPersons(n); }} className={inputCls} /></div>
                  <div className="lg:col-span-4 flex justify-end">
                    <button type="button" onClick={() => setContactPersons(contactPersons.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: additional */}
          {formTab === 'additional' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={labelCls}>TIN</label><input type="text" value={clientData.tin || ''} onChange={(e) => setClientData({ ...clientData, tin: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>VAT Number</label><input type="text" value={clientData.vat_number || ''} onChange={(e) => setClientData({ ...clientData, vat_number: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Reg Number</label><input type="text" value={clientData.reg_number || ''} onChange={(e) => setClientData({ ...clientData, reg_number: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Credit Limit</label><input type="number" value={clientData.credit_limit || ''} onChange={(e) => setClientData({ ...clientData, credit_limit: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Opening Balance</label><input type="number" value={clientData.opening_balance || ''} onChange={(e) => setClientData({ ...clientData, opening_balance: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Total Sales</label><input type="number" value={clientData.total_sales || ''} onChange={(e) => setClientData({ ...clientData, total_sales: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Paid Amount</label><input type="number" value={clientData.paid_amount || ''} onChange={(e) => setClientData({ ...clientData, paid_amount: e.target.value })} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Payment Terms</label><input type="text" value={clientData.payment_terms || ''} onChange={(e) => setClientData({ ...clientData, payment_terms: e.target.value })} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={clientData.status || ''} onChange={(e) => setClientData({ ...clientData, status: e.target.value })} className={inputCls}>
                  <option value="">Select status</option>
                  <option value="Active">Active</option>
                  <option value="Prospective">Prospective</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Priority</label><input type="text" value={clientData.priority || ''} onChange={(e) => setClientData({ ...clientData, priority: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Source</label><input type="text" value={clientData.source || ''} onChange={(e) => setClientData({ ...clientData, source: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Source Heard</label><input type="text" value={clientData.source_heard || ''} onChange={(e) => setClientData({ ...clientData, source_heard: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Budget</label><input type="number" value={clientData.budget || ''} onChange={(e) => setClientData({ ...clientData, budget: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Timeframe</label><input type="text" value={clientData.timeframe || ''} onChange={(e) => setClientData({ ...clientData, timeframe: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Followup Date</label><input type="date" value={clientData.followup_date || ''} onChange={(e) => setClientData({ ...clientData, followup_date: e.target.value })} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Interests (comma-separated)</label><input type="text" value={Array.isArray(clientData.interests) ? clientData.interests.join(', ') : clientData.interests || ''} onChange={(e) => setClientData({ ...clientData, interests: e.target.value })} className={inputCls} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Registered On</label><input type="date" value={clientData.registered_on || ''} onChange={(e) => setClientData({ ...clientData, registered_on: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Date Established</label><input type="date" value={clientData.date_established || ''} onChange={(e) => setClientData({ ...clientData, date_established: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={clientData.currency || 'ETB'} onChange={(e) => setClientData({ ...clientData, currency: e.target.value })} className={inputCls}>
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div><label className={labelCls}>Loyalty Level</label><input type="text" value={clientData.loyalty_level || ''} onChange={(e) => setClientData({ ...clientData, loyalty_level: e.target.value })} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Account Manager</label><input type="text" value={clientData.account_manager || ''} onChange={(e) => setClientData({ ...clientData, account_manager: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Referral Source</label><input type="text" value={clientData.referral_source || ''} onChange={(e) => setClientData({ ...clientData, referral_source: e.target.value })} className={inputCls} /></div>
              </div>
            </div>
          )}

          {/* TAB: documents (functional upload) */}
          {formTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Documents</span>
                <button type="button" onClick={() => setDocuments([...documents, { description: '', file: null, file_id: null }])} className="text-blue-600 text-xs font-semibold hover:text-blue-800">+ Add Document</button>
              </div>
              {documents.length === 0 && <p className="text-xs text-gray-400 italic">No documents yet.</p>}
              {documents.map((doc, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                  <div>
                    <label className={labelCls}>Description</label>
                    <input
                      type="text"
                      value={doc.description || ''}
                      onChange={(e) => {
                        const n = [...documents];
                        n[idx].description = e.target.value;
                        setDocuments(n);
                      }}
                      placeholder="Write description here"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className={labelCls}>Upload file</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const n = [...documents];
                            n[idx].file = file;
                            setDocuments(n);
                          }
                        }}
                        className={inputCls}
                      />
                    </div>
                    {!doc.file_id && (
                      <button
                        type="button"
                        onClick={() => handleUploadDocument(idx)}
                        disabled={uploadingIdx === idx}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-60 mt-5"
                      >
                        {uploadingIdx === idx ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                  {doc.file_id && (
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
                      {docFileUrls[doc.file_id] ? (
                        <a href={docFileUrls[doc.file_id]} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <i className="fa-solid fa-check text-green-700"></i>
                          {doc.file_name || 'File saved'}
                        </a>
                      ) : (
                        <span className="text-sm text-green-700">
                          <i className="fa-solid fa-check mr-1"></i>
                          {doc.file_name || 'File saved'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {!doc.file_id && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Client Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Client Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Name</label>
                  <p className="text-sm text-gray-800">{clientData.name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Company Name</label>
                  <p className="text-sm text-gray-800">{clientData.company_name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Type</label>
                  <p className="text-sm text-gray-800">{clientData.type || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Industry</label>
                  <p className="text-sm text-gray-800">{clientData.industry || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Website</label>
                  <p className="text-sm text-gray-800">{clientData.website || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Description</label>
                  <p className="text-sm text-gray-800">{clientData.description || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Phone</label>
                  <p className="text-sm text-gray-800">{clientData.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Email</label>
                  <p className="text-sm text-gray-800">{clientData.email || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Alt Email</label>
                  <p className="text-sm text-gray-800">{clientData.alt_email || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Point of Contact</label>
                  <p className="text-sm text-gray-800">{clientData.poc || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Address</label>
                  <p className="text-sm text-gray-800">{clientData.address || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">City</label>
                  <p className="text-sm text-gray-800">{clientData.city || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Subcity</label>
                  <p className="text-sm text-gray-800">{clientData.subcity || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Woreda</label>
                  <p className="text-sm text-gray-800">{clientData.woreda || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Region</label>
                  <p className="text-sm text-gray-800">{clientData.region || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">PO Box</label>
                  <p className="text-sm text-gray-800">{clientData.po_box || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">TIN</label>
                  <p className="text-sm text-gray-800">{clientData.tin || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">VAT Number</label>
                  <p className="text-sm text-gray-800">{clientData.vat_number || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Reg Number</label>
                  <p className="text-sm text-gray-800">{clientData.reg_number || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Date Established</label>
                  <p className="text-sm text-gray-800">{clientData.date_established || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Credit Limit</label>
                  <p className="text-sm text-gray-800">{clientData.credit_limit || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Payment Terms</label>
                  <p className="text-sm text-gray-800">{clientData.payment_terms || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Currency</label>
                  <p className="text-sm text-gray-800">{clientData.currency || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Opening Balance</label>
                  <p className="text-sm text-gray-800">{clientData.opening_balance || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Total Sales</label>
                  <p className="text-sm text-gray-800">{clientData.total_sales || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Paid Amount</label>
                  <p className="text-sm text-gray-800">{clientData.paid_amount || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Status</label>
                  <p className="text-sm text-gray-800">{clientData.status || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Priority</label>
                  <p className="text-sm text-gray-800">{clientData.priority || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Source</label>
                  <p className="text-sm text-gray-800">{clientData.source || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Source Heard</label>
                  <p className="text-sm text-gray-800">{clientData.source_heard || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Budget</label>
                  <p className="text-sm text-gray-800">{clientData.budget || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Timeframe</label>
                  <p className="text-sm text-gray-800">{clientData.timeframe || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Interests</label>
                  <p className="text-sm text-gray-800">{Array.isArray(clientData.interests) ? clientData.interests.join(', ') : clientData.interests || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Followup Date</label>
                  <p className="text-sm text-gray-800">{clientData.followup_date || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Registered On</label>
                  <p className="text-sm text-gray-800">{clientData.registered_on || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Loyalty Level</label>
                  <p className="text-sm text-gray-800">{clientData.loyalty_level || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Account Manager</label>
                  <p className="text-sm text-gray-800">{clientData.account_manager || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Referral Source</label>
                  <p className="text-sm text-gray-800">{clientData.referral_source || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}