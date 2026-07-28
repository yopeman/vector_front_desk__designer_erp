import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, order:orders(order_no, client:clients(name))')
        .eq('invoice_type', 'Sales Invoice')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
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

      const doc = new jsPDF();
      let y = 20;

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
      doc.text(`Balance: ${invoiceData.balance}`, 130, y);
      y += 8;
      doc.text(`Status: ${invoiceData.status}`, 130, y);

      // Save PDF
      doc.save(`Sales_${invoiceData.invoice_no}.pdf`);

      // alert('Invoice exported successfully!');
    } catch (error) {
      console.error('Error exporting invoice:', error);
      alert('Error exporting invoice: ' + error.message);
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Balance</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="12" className="p-8 text-center text-slate-400">
                  No sales invoices found
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

      {/* Preview Modal */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
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

            <div className="p-6">
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
                  <span className="font-semibold text-slate-600">Balance:</span>
                  <span className="text-slate-800">{previewInvoice.balance || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
