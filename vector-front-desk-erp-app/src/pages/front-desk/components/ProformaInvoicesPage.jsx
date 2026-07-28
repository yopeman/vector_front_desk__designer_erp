import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

export default function ProformaInvoicesPage({ preselectedOrderId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [applyVat, setApplyVat] = useState(true);
  const [vatAmount, setVatAmount] = useState(15);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, client:clients(name), order_items(*, item:items(name))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, order:orders(order_no, client:clients(name))')
        .eq('invoice_type', 'Proforma')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching proforma invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this proforma invoice?')) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchInvoices();
    } catch (error) {
      console.error('Error deleting proforma invoice:', error);
      alert('Error deleting proforma invoice: ' + error.message);
    }
  };

  const handlePreview = async (invoice) => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*, item:items(name)), order:orders(*, client:clients(*))')
        .eq('id', invoice.id)
        .single();

      if (invoiceError) throw invoiceError;
      setPreviewInvoice(invoiceData);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error fetching invoice preview:', error);
      alert('Error fetching invoice preview: ' + error.message);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrderId) {
      alert('Please select an order');
      return;
    }

    try {
      // Calculate totals
      const subtotal = selectedOrder.order_items?.reduce((total, item) => total + (item.amount || 0), 0) || 0;
      const vatValue = applyVat ? (subtotal * (vatAmount / 100)) : 0;
      const grandTotal = subtotal + vatValue;

      // Generate invoice number
      const { data: lastInvoice } = await supabase
        .from('invoices')
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
      const invoiceNo = `PROF-${String(nextNumber).padStart(5, '0')}`;

      // Insert invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          order_id: selectedOrderId,
          invoice_no: invoiceNo,
          invoice_type: 'Proforma',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: subtotal,
          vat_amount: vatValue,
          grand_total: grandTotal,
          paid_amount: 0,
          balance: grandTotal,
          status: 'Unpaid'
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      for (const item of selectedOrder.order_items || []) {
        await supabase.from('invoice_items').insert([{
          invoice_id: invoiceData.id,
          item_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.amount
        }]);
      }

      alert(`Proforma Invoice created successfully! Invoice No: ${invoiceNo}`);
      setShowNewInvoiceModal(false);
      setSelectedOrderId('');
      setSelectedOrder(null);
      setApplyVat(true);
      setVatAmount(15);
      await fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice: ' + error.message);
    }
  };

  const handleOpenNewInvoiceModal = async () => {
    await fetchOrders();
    setShowNewInvoiceModal(true);
  };

  const handleOrderSelect = (orderId) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
  };

  useEffect(() => {
    if (preselectedOrderId) {
      handleOpenNewInvoiceModal();
    }
  }, [preselectedOrderId]);

  useEffect(() => {
    if (preselectedOrderId && orders.length > 0) {
      handleOrderSelect(preselectedOrderId);
    }
  }, [preselectedOrderId, orders]);

  const handleExport = async (invoice) => {
    try {
      // Fetch invoice with items
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*, item:items(name)), order:orders(*, client:clients(*))')
        .eq('id', invoice.id)
        .single();

      if (invoiceError) throw invoiceError;

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFORMA INVOICE', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Invoice details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${invoiceData.invoice_no}`, 20, y);
      y += 8;
      doc.text(`Client: ${invoiceData.order?.client?.name || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Order No: ${invoiceData.order?.order_no || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Issue Date: ${invoiceData.issue_date || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Due Date: ${invoiceData.due_date || 'N/A'}`, 20, y);
      y += 15;

      // Items table header
      doc.setFont('helvetica', 'bold');
      doc.text('Item Name', 20, y);
      doc.text('Description', 60, y);
      doc.text('Qty', 120, y);
      doc.text('Unit Price', 140, y);
      doc.text('Total', 170, y);
      y += 8;

      // Draw line
      doc.setDrawColor(0);
      doc.line(20, y - 2, 190, y - 2);
      y += 5;

      // Items
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
      doc.text(`Balance: ${invoiceData.balance}`, 130, y);
      y += 8;
      doc.text(`Status: ${invoiceData.status}`, 130, y);

      // Save PDF
      doc.save(`Proforma_${invoiceData.invoice_no}.pdf`);

      alert('Invoice exported successfully!');
    } catch (error) {
      console.error('Error exporting invoice:', error);
      alert('Error exporting invoice: ' + error.message);
    }
  };

  const handleUpgrade = async (invoice) => {
    if (!confirm('Are you sure you want to convert this Proforma Invoice to a Sales Invoice?')) return;
    try {
      // Fetch invoice with items
      const { data: proformaData, error: proformaError } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', invoice.id)
        .single();

      if (proformaError) throw proformaError;

      // Generate sales invoice number
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_no')
        .ilike('invoice_no', 'INV%')
        .order('invoice_no', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastInvoice?.invoice_no) {
        const lastNum = parseInt(lastInvoice.invoice_no.split('-')[1]);
        nextNumber = lastNum + 1;
      }
      const invoiceNo = `INV-${String(nextNumber).padStart(5, '0')}`;

      // Insert sales invoice
      const { data: salesInvoiceData, error: salesInvoiceError } = await supabase
        .from('invoices')
        .insert([{
          order_id: proformaData.order_id,
          invoice_no: invoiceNo,
          invoice_type: 'Sales Invoice',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: proformaData.subtotal,
          vat_amount: proformaData.vat_amount,
          grand_total: proformaData.grand_total,
          paid_amount: proformaData.paid_amount,
          balance: proformaData.balance,
          status: proformaData.status,
          reference: proformaData.invoice_no
        }])
        .select()
        .single();

      if (salesInvoiceError) throw salesInvoiceError;

      // Insert invoice items
      for (const item of proformaData.invoice_items || []) {
        await supabase.from('invoice_items').insert([{
          invoice_id: salesInvoiceData.id,
          item_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        }]);
      }

      alert(`Proforma Invoice upgraded to Sales Invoice successfully! Sales Invoice No: ${invoiceNo}`);
      await fetchInvoices();
    } catch (error) {
      console.error('Error upgrading invoice:', error);
      alert('Error upgrading invoice: ' + error.message);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      (invoice.invoice_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.order?.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (invoice.order?.client?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
        <h2 className="text-xl font-bold text-slate-800">Proforma Invoices</h2>
        <button
          onClick={handleOpenNewInvoiceModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> New Proforma Invoice
        </button>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Balance</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="12" className="p-8 text-center text-slate-400">
                  No proforma invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice, index) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
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
                      onClick={() => handlePreview(invoice)}
                      className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Preview"
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
                    <button
                      onClick={() => handleUpgrade(invoice)}
                      className="text-green-600 hover:text-green-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Upgrade to Sales Invoice"
                    >
                      <i className="fa-solid fa-arrow-up"></i> Upgrade
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
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

      {/* Preview Modal */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Invoice Preview</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">PROFORMA INVOICE</h1>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-slate-600">Invoice No:</span>
                    <span className="ml-2 text-slate-800">{previewInvoice.invoice_no}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Order No:</span>
                    <span className="ml-2 text-slate-800">{previewInvoice.order?.order_no || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Client:</span>
                    <span className="ml-2 text-slate-800">{previewInvoice.order?.client?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      previewInvoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      previewInvoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {previewInvoice.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Issue Date:</span>
                    <span className="ml-2 text-slate-800">{previewInvoice.issue_date || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Due Date:</span>
                    <span className="ml-2 text-slate-800">{previewInvoice.due_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 text-left text-sm font-semibold text-slate-600 border-b">Item Name</th>
                    <th className="p-3 text-left text-sm font-semibold text-slate-600 border-b">Description</th>
                    <th className="p-3 text-right text-sm font-semibold text-slate-600 border-b">Quantity</th>
                    <th className="p-3 text-right text-sm font-semibold text-slate-600 border-b">Unit Price</th>
                    <th className="p-3 text-right text-sm font-semibold text-slate-600 border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.invoice_items?.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 text-sm text-slate-800">{item.item?.name || 'N/A'}</td>
                      <td className="p-3 text-sm text-slate-800">{item.description || 'N/A'}</td>
                      <td className="p-3 text-sm text-slate-800 text-right">{item.quantity}</td>
                      <td className="p-3 text-sm text-slate-800 text-right">{item.unit_price}</td>
                      <td className="p-3 text-sm text-slate-800 text-right">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-600">Subtotal:</span>
                    <span className="text-slate-800">{previewInvoice.subtotal || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-600">VAT ({previewInvoice.subtotal ? ((previewInvoice.vat_amount / previewInvoice.subtotal) * 100).toFixed(2) : 0}%):</span>
                    <span className="text-slate-800">
                      {previewInvoice.vat_amount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-lg border-t pt-2">
                    <span className="text-slate-600">Grand Total:</span>
                    <span className="text-slate-800">{previewInvoice.grand_total || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-600">Balance:</span>
                    <span className="text-slate-800">{previewInvoice.balance || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleExport(previewInvoice);
                  setShowPreviewModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
              >
                <i className="fa-solid fa-download mr-2"></i>Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Create Proforma Invoice</h2>
              <button
                onClick={() => {
                  setShowNewInvoiceModal(false);
                  setSelectedOrderId('');
                  setSelectedOrder(null);
                  setApplyVat(true);
                  setVatAmount(15);
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Select Order <span className="text-red-500">*</span></label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Select an order</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.order_no || 'No Order No'} - {order.client?.name || 'Unknown Client'} ({order.total_amount || 0})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <>
                  <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-600 mb-4">
                    <p className="font-semibold mb-2">Order Details:</p>
                    <p>Order No: {selectedOrder.order_no || 'N/A'}</p>
                    <p>Client: {selectedOrder.client?.name || 'N/A'}</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Order Items</label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-2 text-left font-semibold text-slate-600">Item Name</th>
                            <th className="p-2 text-left font-semibold text-slate-600">Description</th>
                            <th className="p-2 text-right font-semibold text-slate-600">Qty</th>
                            <th className="p-2 text-right font-semibold text-slate-600">Unit Price</th>
                            <th className="p-2 text-right font-semibold text-slate-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.order_items?.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{item.item?.name || 'N/A'}</td>
                              <td className="p-2">{item.description || 'N/A'}</td>
                              <td className="p-2 text-right">{item.quantity}</td>
                              <td className="p-2 text-right">{item.unit_price}</td>
                              <td className="p-2 text-right">{item.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyVat}
                        onChange={(e) => setApplyVat(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Apply VAT
                    </label>
                  </div>

                  {applyVat && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-500 mb-2">VAT Amount (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={vatAmount}
                        onChange={(e) => setVatAmount(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-slate-600">Subtotal:</span>
                      <span className="text-slate-800">{selectedOrder.order_items?.reduce((total, item) => total + (item.amount || 0), 0).toFixed(2) || 0}</span>
                    </div>
                    {applyVat && (
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-slate-600">VAT ({vatAmount}%):</span>
                        <span className="text-slate-800">{(selectedOrder.order_items?.reduce((total, item) => total + (item.amount || 0), 0) * (vatAmount / 100)).toFixed(2) || 0}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1">
                      <span className="text-slate-600">Grand Total:</span>
                      <span className="text-slate-800">
                        {applyVat 
                          ? (selectedOrder.order_items?.reduce((total, item) => total + (item.amount || 0), 0) * (1 + vatAmount / 100)).toFixed(2) || 0
                          : selectedOrder.order_items?.reduce((total, item) => total + (item.amount || 0), 0).toFixed(2) || 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewInvoiceModal(false);
                  setSelectedOrderId('');
                  setSelectedOrder(null);
                  setApplyVat(true);
                  setVatAmount(15);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
              >
                <i className="fa-solid fa-check mr-2"></i>Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
