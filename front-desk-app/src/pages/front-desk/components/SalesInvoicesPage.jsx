import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';
import logo from '../../../assets/logo.png';
import address from '../../../assets/address.png';
import seal from '../../../assets/seal.png';

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewTab, setPreviewTab] = useState('details');
  const [documents, setDocuments] = useState([]);
  const [docFileUrls, setDocFileUrls] = useState({});
  const [extraNotes, setExtraNotes] = useState([]);
  const [noteAuthors, setNoteAuthors] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, itemsPerPage]);

  const fetchInvoices = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('invoices')
        .select('*, order:orders(order_no, client:clients(name))', { count: 'exact' })
        .eq('invoice_type', 'Proforma')
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`invoice_no.ilike.%${searchQuery}%,order.order_no.ilike.%${searchQuery}%,order.client.name.ilike.%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      setInvoices(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = async (invoice) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*, item:items(name)), order:orders(*, client:clients(*))')
        .eq('id', invoice.id)
        .single();

      if (error) throw error;
      setPreviewInvoice(data);
      setPreviewTab('details');
      setDocuments([]);
      setDocFileUrls({});
      setExtraNotes([]);
      setNoteAuthors([]);

      // Load existing documents
      if (data.attached_file_ids && data.attached_file_ids.length > 0) {
        const { data: files } = await supabase
          .from('files')
          .select('*')
          .in('id', data.attached_file_ids);
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

      // Load existing notes
      const { data: notes } = await supabase
        .from('notes')
        .select('content, user_id')
        .eq('entity_type', 'invoices')
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

      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      alert('Error fetching invoice details: ' + error.message);
    }
  };

  const handleExport = async (invoice) => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*, item:items(name)), order:orders(*, client:clients(*))')
        .eq('id', invoice.id)
        .single();

      if (invoiceError) throw invoiceError;

      // Convert images to base64
      const logoBase64 = await imageToBase64(logo);
      const addressBase64 = await imageToBase64(address);
      const sealBase64 = await imageToBase64(seal);

      const doc = new jsPDF();
      let y = 20;

      // Add company logo (left) and address (right) on same row
      doc.addImage(logoBase64, 'PNG', 0, y, 120, 40);
      doc.addImage(addressBase64, 'PNG', 120, y, 80, 40);
      y += 50;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SALES INVOICE', 105, y, { align: 'center' });
      y += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${invoiceData.invoice_no}`, 20, y);
      y += 8;
      doc.text(`Order No: ${invoiceData.order?.order_no || '-'}`, 20, y);
      y += 8;
      doc.text(`Client: ${invoiceData.order?.client?.name || '-'}`, 20, y);
      y += 8;
      doc.text(`Issue Date: ${invoiceData.issue_date || '-'}`, 20, y);
      y += 8;
      doc.text(`Due Date: ${invoiceData.due_date || '-'}`, 20, y);
      y += 15;

      // Items
      doc.setFont('helvetica', 'bold');
      doc.text('Item Name', 20, y);
      doc.text('Description', 60, y);
      doc.text('Qty', 120, y);
      doc.text('Unit Price', 140, y);
      doc.text('Total', 170, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      invoiceData.invoice_items?.forEach(item => {
        const itemName = item.item?.name || 'N/A';
        const description = item.description || 'N/A';
        doc.text(itemName.substring(0, 20), 20, y);
        doc.text(description.substring(0, 25), 60, y);
        doc.text(String(item.quantity), 120, y);
        doc.text(String(item.unit_price), 140, y);
        doc.text(String(item.total), 170, y);
        y += 8;
      });

      y += 10;

      // Totals
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal: ${invoiceData.subtotal}`, 130, y);
      y += 8;
      const vatPercentage = invoiceData.subtotal ? ((invoiceData.vat_amount / invoiceData.subtotal) * 100).toFixed(2) : 0;
      doc.text(`VAT (${vatPercentage}%): ${invoiceData.vat_amount}`, 130, y);
      y += 8;
      doc.text(`Grand Total: ${invoiceData.grand_total}`, 130, y);
      y += 8;
      doc.text(`Unpaid Amount: ${invoiceData.balance}`, 130, y);
      y += 8;
      doc.text(`Status: ${invoiceData.status}`, 130, y);
      y += 20;

      // Add company seal at bottom (full width)
      doc.addImage(sealBase64, 'PNG', 0, y - 10, 200, 40);

      // Save PDF
      doc.save(`Sales_${invoiceData.invoice_no}.pdf`);

      // alert('Invoice exported successfully!');
    } catch (error) {
      console.error('Error exporting invoice:', error);
      alert('Error exporting invoice: ' + error.message);
    }
  };

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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

      // Update invoice with new file_id
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          attached_file_ids: [...(previewInvoice.attached_file_ids || []), fileData.id]
        })
        .eq('id', previewInvoice.id);

      if (updateError) throw updateError;

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

  const saveInvoiceNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    await supabase.from('notes').delete().eq('entity_type', 'invoices').eq('entity_id', previewInvoice.id);
    const filteredNotes = extraNotes.filter(note => note.trim());
    const noteInserts = filteredNotes.map(note => ({
      entity_type: 'invoices',
      entity_id: previewInvoice.id,
      user_id: userId,
      content: note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    if (noteInserts.length > 0) {
      const { error } = await supabase.from('notes').insert(noteInserts);
      if (error) throw error;
    }
    alert('Notes saved successfully');
  };

  const imageToBase64 = (image) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = image;
    });
  };

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
        <h2 className="text-xl font-bold text-slate-800">Sales Invoices</h2>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by invoice no, order no, or client..."
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
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Invoice No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Issue Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Due Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Subtotal</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">VAT</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Grand Total</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Unpaid Amount</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="12" className="p-8 text-center text-slate-400">
                  No sales invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice, index) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-4 font-medium">{invoice.invoice_no || '-'}</td>
                  <td className="p-4">{invoice.order?.order_no || '-'}</td>
                  <td className="p-4">{invoice.order?.client?.name || '-'}</td>
                  <td className="p-4">{invoice.issue_date || '-'}</td>
                  <td className="p-4">{invoice.due_date || '-'}</td>
                  <td className="p-4">{invoice.subtotal || 0}</td>
                  <td className="p-4">{invoice.vat_amount || 0}</td>
                  <td className="p-4 font-medium">{invoice.grand_total || 0}</td>
                  <td className="p-4">{invoice.balance || 0}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleShow(invoice)}
                      className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Show"
                    >
                      <i className="fa-solid fa-eye"></i> Show
                    </button>
                    <button
                      onClick={() => handleExport(invoice)}
                      className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Export"
                    >
                      <i className="fa-solid fa-download"></i> Export
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
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} sales invoices
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

      {/* Preview Modal */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-800">Sales Invoice Preview</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewInvoice(null);
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="sticky top-[73px] bg-white border-b border-slate-200 px-6 flex gap-1 z-10">
              <button
                type="button"
                onClick={() => setPreviewTab('details')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  previewTab === 'details'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('documents')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  previewTab === 'documents'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Documents
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('notes')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  previewTab === 'notes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Notes
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {previewTab === 'details' && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Invoice No:</span>
                        <span className="ml-2 font-medium">{previewInvoice.invoice_no || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Order No:</span>
                        <span className="ml-2 font-medium">{previewInvoice.order?.order_no || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Client:</span>
                        <span className="ml-2 font-medium">{previewInvoice.order?.client?.name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Issue Date:</span>
                        <span className="ml-2 font-medium">{previewInvoice.issue_date || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Due Date:</span>
                        <span className="ml-2 font-medium">{previewInvoice.due_date || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          previewInvoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                          previewInvoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {previewInvoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Items</h3>
                    <table className="w-full border border-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold text-slate-600 border-b">Item Name</th>
                          <th className="p-3 text-left text-xs font-semibold text-slate-600 border-b">Description</th>
                          <th className="p-3 text-right text-xs font-semibold text-slate-600 border-b">Qty</th>
                          <th className="p-3 text-right text-xs font-semibold text-slate-600 border-b">Unit Price</th>
                          <th className="p-3 text-right text-xs font-semibold text-slate-600 border-b">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewInvoice.invoice_items?.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{item.item?.name || 'N/A'}</td>
                            <td className="p-3">{item.description || 'N/A'}</td>
                            <td className="p-3 text-right">{item.quantity || 0}</td>
                            <td className="p-3 text-right">{item.unit_price || 0}</td>
                            <td className="p-3 text-right">{item.total || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-600">Subtotal:</span>
                      <span className="text-slate-800">{previewInvoice.subtotal || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-600">VAT ({previewInvoice.subtotal ? ((previewInvoice.vat_amount / previewInvoice.subtotal) * 100).toFixed(2) : 0}%):</span>
                      <span className="text-slate-800">{previewInvoice.vat_amount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-lg border-t pt-2">
                      <span className="font-semibold text-slate-600">Grand Total:</span>
                      <span className="text-slate-800">{previewInvoice.grand_total || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="font-semibold text-slate-600">Unpaid Amount:</span>
                      <span className="text-slate-800">{previewInvoice.balance || 0}</span>
                    </div>
                  </div>
                </>
              )}

              {/* TAB: Documents */}
              {previewTab === 'documents' && (
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
              {previewTab === 'notes' && (
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
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveInvoiceNotes}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3 z-10">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewInvoice(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
