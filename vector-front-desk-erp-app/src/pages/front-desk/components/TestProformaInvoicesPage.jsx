import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

export default function TestProformaInvoicesPage() {
  const [clients, setClients] = useState([]);
  const [applyVat, setApplyVat] = useState(true);
  const [vatAmount, setVatAmount] = useState(15);
  const [testInvoiceData, setTestInvoiceData] = useState({
    invoice_no: `TEST-INV-${Math.floor(10000 + Math.random() * 90000)}`,
    order_no: '',
    client_name: '',
    items: []
  });
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchClients(clientSearchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [clientSearchQuery]);

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

  const handleOpenTestInvoiceModal = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setTestInvoiceData({
      invoice_no: `TEST-INV-${randomNum}`,
      order_no: '',
      client_name: '',
      items: []
    });
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

  const handleExportTestInvoice = () => {
    try {
      const subtotal = testInvoiceData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      const vatValue = applyVat ? (subtotal * (vatAmount / 100)) : 0;
      const grandTotal = subtotal + vatValue;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFORMA INVOICE (TEST)', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Invoice details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${testInvoiceData.invoice_no}`, 20, y);
      y += 8;
      doc.text(`Order No: ${testInvoiceData.order_no || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Client: ${testInvoiceData.client_name || 'N/A'}`, 20, y);
      y += 8;
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, y);
      y += 15;

      // Items table header
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, y);
      doc.text('Quantity', 100, y);
      doc.text('Unit Price', 130, y);
      doc.text('Total', 160, y);
      y += 8;

      // Draw line
      doc.setDrawColor(0);
      doc.line(20, y - 2, 190, y - 2);
      y += 5;

      // Items
      doc.setFont('helvetica', 'normal');
      testInvoiceData.items.forEach(item => {
        const description = item.description || 'N/A';
        doc.text(description.substring(0, 40), 20, y);
        doc.text(String(item.quantity), 100, y);
        doc.text(String(item.unit_price), 130, y);
        doc.text(String(item.total.toFixed(2)), 160, y);
        y += 8;
      });

      y += 10;

      // Totals
      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 130, y);
      y += 8;
      if (applyVat) {
        doc.text(`VAT (${vatAmount}%): ${vatValue.toFixed(2)}`, 130, y);
        y += 8;
      }
      doc.text(`Grand Total: ${grandTotal.toFixed(2)}`, 130, y);

      // Save PDF
      doc.save(`Test_Proforma_${testInvoiceData.invoice_no}.pdf`);
    } catch (error) {
      console.error('Error exporting test invoice:', error);
      alert('Error exporting test invoice: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Test Proforma Invoices</h2>
        <button
          onClick={handleOpenTestInvoiceModal}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> Create Test Invoice
        </button>
      </div>

      {/* Test Invoice Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="space-y-4">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleOpenTestInvoiceModal}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleExportTestInvoice}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium cursor-pointer"
            >
              <i className="fa-solid fa-download mr-2"></i>Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
