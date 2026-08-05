import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

export default function TestProformaInvoicesPage({ onUpgradeToOrder }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [applyVat, setApplyVat] = useState(true);
  const [vatAmount, setVatAmount] = useState(15);
  const [testInvoiceData, setTestInvoiceData] = useState({
    id: null,
    invoice_no: '',
    order_no: '',
    client_name: '',
    items: []
  });
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [formTab, setFormTab] = useState('details');
  const [documents, setDocuments] = useState([]);
  const [docFileUrls, setDocFileUrls] = useState({});
  const [extraNotes, setExtraNotes] = useState([]);
  const [noteAuthors, setNoteAuthors] = useState([]);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchItems();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchClients(clientSearchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [clientSearchQuery]);

  const fetchInvoices = async () => {
    try {
      let query = supabase
        .from('test_proforma_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (searchQuery) {
        query = query.ilike('client_name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching test invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async (search = '') => {
    try {
      let query = supabase
        .from('clients')
        .select('id, name, client_type')
        .order('name', { ascending: true });
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      } else {
        query = query.limit(10);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const { data: lastInvoice } = await supabase
        .from('test_proforma_invoices')
        .select('invoice_no')
        .ilike('invoice_no', 'PROF%')
        .order('invoice_no', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastInvoice?.invoice_no) {
        const lastNum = parseInt(lastInvoice.invoice_no.split('-')[1]);
        nextNumber = lastNum + 1;
      }
      return `PROF-${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // If no invoices exist or error occurs, start from 1
      return `PROF-00001`;
    }
  };

  const handleOpenCreateModal = async () => {
    const invoiceNo = await generateInvoiceNumber();
    setTestInvoiceData({
      id: null,
      invoice_no: invoiceNo,
      order_no: '',
      client_name: '',
      status: 'not_upgraded',
      items: []
    });
    setApplyVat(true);
    setVatAmount(15);
    setClientSearchQuery('');
    setFormTab('details');
    setDocuments([]);
    setDocFileUrls({});
    setExtraNotes([]);
    setNoteAuthors([]);
    setShowFormModal(true);
  };

  const handleEdit = async (invoice) => {
    setTestInvoiceData({
      id: invoice.id,
      invoice_no: invoice.invoice_no,
      order_no: invoice.order_no || '',
      client_name: invoice.client_name,
      status: invoice.status || 'not_upgraded',
      items: invoice.items || []
    });
    setApplyVat(invoice.apply_vat);
    setVatAmount(invoice.vat_percentage || 15);
    setClientSearchQuery(invoice.client_name);
    setFormTab('details');
    setDocuments([]);
    setDocFileUrls({});
    setExtraNotes([]);
    setNoteAuthors([]);

    // Load existing documents
    if (invoice.attached_file_ids && invoice.attached_file_ids.length > 0) {
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .in('id', invoice.attached_file_ids);
      if (files) {
        setDocuments(files.map(file => ({
          description: file.description || '',
          file: null,
          file_id: file.id,
          file_name: file.name,
          file_path: file.path
        })));

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

    // Load existing notes
    const { data: notes } = await supabase
      .from('notes')
      .select('content, user_id')
      .eq('entity_type', 'test_proforma_invoices')
      .eq('entity_id', invoice.id)
      .order('created_at', { ascending: true });
    const noteContents = (notes || []).map(n => n.content);
    const userIds = (notes || []).map(n => n.user_id);
    setExtraNotes(noteContents);
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);
      const userMap = {};
      (users || []).forEach(u => { userMap[u.id] = u.username; });
      setNoteAuthors(userIds.map(uid => userMap[uid] || 'Unknown'));
    }

    setShowFormModal(true);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this test invoice?')) return;
    
    try {
      const { error } = await supabase
        .from('test_proforma_invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Test invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting test invoice:', error);
      alert('Error deleting test invoice: ' + error.message);
    }
  };

  const handleUpgradeToOrder = async (invoice) => {
    try {
      // Fetch client data to get client_id
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, client_type')
        .ilike('name', invoice.client_name)
        .single();

      if (!clientData) {
        alert('Client not found. Please ensure the client exists in the system.');
        return;
      }

      // Prepare order data from test proforma
      const orderData = {
        client_id: clientData.id,
        client_name: invoice.client_name,
        client_type: clientData.client_type,
        order_no: invoice.order_no || '',
        order_date: new Date().toISOString().split('T')[0],
        required_date: '',
        status: 'New',
        priority: 'Medium',
        currency: 'ETB',
        paid_amount: 0,
        payment_terms: '',
        special_instructions: '',
        order_items: (invoice.items || []).map(item => ({
          item_id: item.item_id || '',
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || '',
          unit_price: item.unit_price,
          discount_percent: 0,
          tax_percent: 0,
          amount: item.total
        }))
      };

      // Update the invoice status to 'upgraded'
      const { error: updateError } = await supabase
        .from('test_proforma_invoices')
        .update({ status: 'upgraded' })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('Error updating invoice status:', updateError);
        alert('Error updating invoice status: ' + updateError.message);
        return;
      }

      onUpgradeToOrder(orderData);
    } catch (error) {
      console.error('Error upgrading to order:', error);
      alert('Error upgrading to order: ' + error.message);
    }
  };

  const handleSave = async () => {
    if (!testInvoiceData.client_name) {
      alert('Please select a client');
      return;
    }
    if (testInvoiceData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      const subtotal = testInvoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      const vatValue = applyVat ? (subtotal * (vatAmount / 100)) : 0;
      const grandTotal = subtotal + vatValue;

      let invoiceNo = testInvoiceData.invoice_no;
      
      // For new invoices, ensure invoice_no is unique
      if (!testInvoiceData.id) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          const { data: existing } = await supabase
            .from('test_proforma_invoices')
            .select('invoice_no')
            .eq('invoice_no', invoiceNo)
            .single();
          
          if (!existing) {
            isUnique = true;
          } else {
            invoiceNo = await generateInvoiceNumber();
            attempts++;
          }
        }
        
        if (!isUnique) {
          alert('Unable to generate unique invoice number. Please try again.');
          return;
        }
      }

      const invoiceData = {
        invoice_no: invoiceNo,
        order_no: testInvoiceData.order_no,
        client_name: testInvoiceData.client_name,
        status: testInvoiceData.status || 'not_upgraded',
        subtotal: subtotal,
        vat_amount: vatValue,
        vat_percentage: vatAmount,
        grand_total: grandTotal,
        apply_vat: applyVat,
        items: testInvoiceData.items,
        attached_file_ids: documents.filter(doc => doc.file_id).map(doc => doc.file_id)
      };

      let invoiceId;
      let error;
      if (testInvoiceData.id) {
        const { data: updateData, error: updateError } = await supabase
          .from('test_proforma_invoices')
          .update(invoiceData)
          .eq('id', testInvoiceData.id)
          .select()
          .single();
        error = updateError;
        invoiceId = testInvoiceData.id;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('test_proforma_invoices')
          .insert([invoiceData])
          .select()
          .single();
        error = insertError;
        invoiceId = insertData?.id;
      }

      if (error) throw error;

      await saveInvoiceNotes(invoiceId);

      alert(testInvoiceData.id ? 'Test invoice updated successfully' : 'Test invoice created successfully');
      setShowFormModal(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error saving test invoice:', error);
      alert('Error saving test invoice: ' + error.message);
    }
  };

  const handleExportTestInvoice = (invoice = null) => {
    try {
      const dataToExport = invoice || testInvoiceData;
      const items = dataToExport.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const vatValue = dataToExport.apply_vat ? (subtotal * (dataToExport.vat_percentage / 100)) : 0;
      const grandTotal = subtotal + vatValue;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFORMA INVOICE (TEST)', pageWidth / 2, y, { align: 'center' });
      y += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${dataToExport.invoice_no}`, 20, y);
      y += 8;
      doc.text(`Order No: ${dataToExport.order_no || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Client: ${dataToExport.client_name || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, y);
      y += 15;

      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, y);
      doc.text('Quantity', 100, y);
      doc.text('Unit Price', 130, y);
      doc.text('Total', 160, y);
      y += 8;

      doc.setDrawColor(0);
      doc.line(20, y - 2, 190, y - 2);
      y += 5;

      doc.setFont('helvetica', 'normal');
      items.forEach(item => {
        const description = item.description || 'N/A';
        doc.text(description.substring(0, 40), 20, y);
        doc.text(String(item.quantity), 100, y);
        doc.text(String(item.unit_price), 130, y);
        doc.text(String(item.total.toFixed(2)), 160, y);
        y += 8;
      });

      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 130, y);
      y += 8;
      if (dataToExport.apply_vat) {
        doc.text(`VAT (${dataToExport.vat_percentage}%): ${vatValue.toFixed(2)}`, 130, y);
        y += 8;
      }
      doc.text(`Grand Total: ${grandTotal.toFixed(2)}`, 130, y);

      doc.save(`Test_Proforma_${dataToExport.invoice_no}.pdf`);
    } catch (error) {
      console.error('Error exporting test invoice:', error);
      alert('Error exporting test invoice: ' + error.message);
    }
  };

  const handleAddTestItem = () => {
    setTestInvoiceData({
      ...testInvoiceData,
      items: [
        ...testInvoiceData.items,
        { id: Date.now(), item_id: '', description: '', quantity: 1, unit: '', unit_price: 0, total: 0 }
      ]
    });
  };

  const handleRemoveTestItem = (itemId) => {
    setTestInvoiceData({
      ...testInvoiceData,
      items: testInvoiceData.items.filter(item => item.id !== itemId)
    });
  };

  const handleTestItemChange = (itemId, field, value) => {
    const updatedItems = testInvoiceData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };

        // If item_id is selected, auto-fill description from items table
        if (field === 'item_id' && value) {
          const selectedItem = items.find(i => i.id === value);
          if (selectedItem) {
            updatedItem.description = selectedItem.name;
          }
        }

        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unit_price || 0);
        }
        return updatedItem;
      }
      return item;
    });
    setTestInvoiceData({ ...testInvoiceData, items: updatedItems });
  };

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
      newDocs[idx].file_path = fileData.path;
      setDocuments(newDocs);

      const url = await getFileUrl(fileData.path);
      if (url) {
        setDocFileUrls(prev => ({ ...prev, [fileData.id]: url }));
      }

      // alert('File uploaded successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    }
  };

  const addExtraNote = () => {
    setExtraNotes([...extraNotes, '']);
  };

  const updateExtraNote = (index, value) => {
    const newNotes = [...extraNotes];
    newNotes[index] = value;
    setExtraNotes(newNotes);
  };

  const removeExtraNote = (index) => {
    setExtraNotes(extraNotes.filter((_, i) => i !== index));
  };

  const saveInvoiceNotes = async (invoiceId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    await supabase.from('notes').delete().eq('entity_type', 'test_proforma_invoices').eq('entity_id', invoiceId);
    const filteredNotes = extraNotes.filter(note => note.trim());
    const noteInserts = filteredNotes.map(note => ({
      entity_type: 'test_proforma_invoices',
      entity_id: invoiceId,
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Proforma Invoices</h2>
        <button
          onClick={handleOpenCreateModal}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> Create Proforma Invoice
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No test invoices found. Click "Create Proforma Invoice" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left font-semibold text-slate-600">Invoice No</th>
                <th className="p-3 text-left font-semibold text-slate-600">Order No</th>
                <th className="p-3 text-left font-semibold text-slate-600">Client</th>
                <th className="p-3 text-right font-semibold text-slate-600">Total</th>
                <th className="p-3 text-left font-semibold text-slate-600">Status</th>
                <th className="p-3 text-left font-semibold text-slate-600">Date</th>
                <th className="p-3 text-center font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{invoice.invoice_no}</td>
                  <td className="p-3 text-slate-600">{invoice.order_no || '-'}</td>
                  <td className="p-3 text-slate-600">{invoice.client_name}</td>
                  <td className="p-3 text-right text-slate-800">{invoice.grand_total?.toFixed(2) || '0.00'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'upgraded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.status === 'upgraded' ? 'Upgraded' : 'Not Upgraded'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{new Date(invoice.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleView(invoice)}
                        className="text-blue-600 hover:text-blue-800 border-none bg-transparent cursor-pointer"
                        title="View"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-green-600 hover:text-green-800 border-none bg-transparent cursor-pointer"
                        title="Edit"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleExportTestInvoice(invoice)}
                        className="text-purple-600 hover:text-purple-800 border-none bg-transparent cursor-pointer"
                        title="Export PDF"
                      >
                        <i className="fa-solid fa-download"></i>
                      </button>
                      <button
                        onClick={() => handleUpgradeToOrder(invoice)}
                        className="text-green-600 hover:text-green-800 border-none bg-transparent cursor-pointer"
                        title="Upgrade to Order"
                      >
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      {/* <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-500 hover:text-red-700 border-none bg-transparent cursor-pointer"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {testInvoiceData.id ? 'Edit Test Invoice' : 'Create Proforma Invoice'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-[73px] bg-white border-b border-slate-200 px-6 flex gap-1">
              <button
                type="button"
                onClick={() => setFormTab('details')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  formTab === 'details'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setFormTab('documents')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  formTab === 'documents'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Documents
              </button>
              <button
                type="button"
                onClick={() => setFormTab('notes')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  formTab === 'notes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Notes
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formTab === 'details' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Invoice No</label>
                    <input
                      type="text"
                      value={testInvoiceData.invoice_no}
                      onChange={(e) => setTestInvoiceData({ ...testInvoiceData, invoice_no: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-50"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Order No</label>
                    <input
                      type="text"
                      value={testInvoiceData.order_no}
                      onChange={(e) => setTestInvoiceData({ ...testInvoiceData, order_no: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter order number"
                    />
                  </div>

              <div className="relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  placeholder="Search client..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
                {showClientDropdown && clients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clients.map(client => (
                      <div
                        key={client.id}
                        onClick={() => {
                          setTestInvoiceData({ ...testInvoiceData, client_name: client.name });
                          setClientSearchQuery(`${client.name} (${client.client_type})`);
                          setShowClientDropdown(false);
                        }}
                        className="px-3 py-2 text-xs hover:bg-slate-100 cursor-pointer"
                      >
                        {client.name} ({client.client_type})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Order Items</label>
                {testInvoiceData.items.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 p-3 rounded-lg mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-slate-600">Item {index + 1}</span>
                      <button
                        onClick={() => handleRemoveTestItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs border-none bg-transparent cursor-pointer"
                      >
                        <i className="fa-solid fa-trash"></i> Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Item</label>
                        <select
                          value={item.item_id}
                          onChange={(e) => handleTestItemChange(item.id, 'item_id', e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                        >
                          <option value="">Select item...</option>
                          {items.map(itemOption => (
                            <option key={itemOption.id} value={itemOption.id}>
                              {itemOption.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleTestItemChange(item.id, 'description', e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          placeholder="Item description"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleTestItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleTestItemChange(item.id, 'unit', e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          placeholder="e.g., pcs, kg, liter"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Unit Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleTestItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Total</label>
                        <input
                          type="text"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAddTestItem}
                  className="w-full border border-dashed border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-plus mr-1"></i> Add Item
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applyVatTest"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="w-4 h-4 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <label htmlFor="applyVatTest" className="text-xs text-slate-600">
                  Apply VAT
                </label>
              </div>

              {applyVat && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">VAT Amount (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vatAmount}
                    onChange={(e) => setVatAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              )}
                </>
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
                  <div id="invoice-documents-list" className="space-y-3">
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
                  <div id="invoice-extra-notes-container" className="space-y-3">
                    {extraNotes.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4">No notes added yet. Click "+ Add Note" to add.</div>
                    ) : (
                      extraNotes.map((note, index) => (
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

              {formTab === 'details' && (
                <div className="bg-purple-50 p-4 rounded-lg text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-600">Subtotal:</span>
                    <span className="text-slate-800">{testInvoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}</span>
                  </div>
                  {applyVat && (
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-600">VAT ({vatAmount}%):</span>
                      <span className="text-slate-800">{(testInvoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0) * (vatAmount / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1">
                    <span className="text-slate-600">Grand Total:</span>
                    <span className="text-slate-800">
                      {applyVat
                        ? (testInvoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0) * (1 + vatAmount / 100)).toFixed(2)
                        : testInvoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium cursor-pointer"
              >
                <i className="fa-solid fa-save mr-2"></i>{testInvoiceData.id ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Test Invoice Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Invoice No</label>
                  <p className="text-sm text-slate-800">{selectedInvoice.invoice_no}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Order No</label>
                  <p className="text-sm text-slate-800">{selectedInvoice.order_no || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
                  <p className="text-sm text-slate-800">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <p className="text-sm text-slate-800">{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Items</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left font-semibold text-slate-600">Description</th>
                        <th className="p-2 text-right font-semibold text-slate-600">Qty</th>
                        <th className="p-2 text-right font-semibold text-slate-600">Unit Price</th>
                        <th className="p-2 text-right font-semibold text-slate-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.description || 'N/A'}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{item.unit_price}</td>
                          <td className="p-2 text-right">{item.total?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-slate-600">Subtotal:</span>
                  <span className="text-slate-800">{selectedInvoice.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {selectedInvoice.apply_vat && (
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-600">VAT ({selectedInvoice.vat_percentage}%):</span>
                    <span className="text-slate-800">{selectedInvoice.vat_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1">
                  <span className="text-slate-600">Grand Total:</span>
                  <span className="text-slate-800">{selectedInvoice.grand_total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleExportTestInvoice(selectedInvoice)}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium cursor-pointer"
              >
                <i className="fa-solid fa-download mr-2"></i>Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
