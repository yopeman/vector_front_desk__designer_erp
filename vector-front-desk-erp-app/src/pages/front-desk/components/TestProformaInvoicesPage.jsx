import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

export default function TestProformaInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [clients, setClients] = useState([]);
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

  useEffect(() => {
    fetchInvoices();
    fetchClients();
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

  const generateInvoiceNumber = async () => {
    try {
      const { data: lastInvoice } = await supabase
        .from('test_proforma_invoices')
        .select('invoice_no')
        .ilike('invoice_no', 'TEST-INV%')
        .order('invoice_no', { ascending: false })
        .limit(1)
        .single();
      
      let nextNumber = 1;
      if (lastInvoice) {
        const lastNum = parseInt(lastInvoice.invoice_no.split('-')[2]);
        nextNumber = lastNum + 1;
      }
      return `TEST-INV-${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      return `TEST-INV-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    }
  };

  const handleOpenCreateModal = async () => {
    const invoiceNo = await generateInvoiceNumber();
    setTestInvoiceData({
      id: null,
      invoice_no: invoiceNo,
      order_no: '',
      client_name: '',
      items: []
    });
    setApplyVat(true);
    setVatAmount(15);
    setClientSearchQuery('');
    setShowFormModal(true);
  };

  const handleEdit = (invoice) => {
    setTestInvoiceData({
      id: invoice.id,
      invoice_no: invoice.invoice_no,
      order_no: invoice.order_no || '',
      client_name: invoice.client_name,
      items: invoice.items || []
    });
    setApplyVat(invoice.apply_vat);
    setVatAmount(invoice.vat_percentage || 15);
    setClientSearchQuery(invoice.client_name);
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

      const invoiceData = {
        invoice_no: testInvoiceData.invoice_no,
        order_no: testInvoiceData.order_no,
        client_name: testInvoiceData.client_name,
        subtotal: subtotal,
        vat_amount: vatValue,
        vat_percentage: vatAmount,
        grand_total: grandTotal,
        apply_vat: applyVat,
        items: testInvoiceData.items
      };

      let error;
      if (testInvoiceData.id) {
        const { error: updateError } = await supabase
          .from('test_proforma_invoices')
          .update(invoiceData)
          .eq('id', testInvoiceData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('test_proforma_invoices')
          .insert([invoiceData]);
        error = insertError;
      }

      if (error) throw error;
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
        { id: Date.now(), description: '', quantity: 1, unit_price: 0, total: 0 }
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
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unit_price || 0);
        }
        return updatedItem;
      }
      return item;
    });
    setTestInvoiceData({ ...testInvoiceData, items: updatedItems });
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
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-500 hover:text-red-700 border-none bg-transparent cursor-pointer"
                        title="Delete"
                      >
                        {/* <i className="fa-solid fa-trash"></i> */}
                      </button>
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

            <div className="p-6 space-y-4">
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
