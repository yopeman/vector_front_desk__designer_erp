import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount_paid: '',
    payment_method: 'Cash',
    bank_wallet: '',
    reference_number: '',
    received_by: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, invoice:invoices(invoice_no, invoice_type, grand_total, balance), client:clients(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, order:orders(*, client:clients(name))')
        .eq('invoice_type', 'Proforma')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedInvoice) {
      alert('Please select an invoice');
      return;
    }

    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const invoice = invoices.find(inv => inv.id === selectedInvoice);
      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      const amountPaid = parseFloat(formData.amount_paid);
      const grossAmount = invoice.grand_total || 0;

      // Fetch all existing payments for this invoice
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('invoice_id', selectedInvoice);

      if (paymentsError) throw paymentsError;

      // Calculate total paid amount from all payments
      const totalPaidFromExisting = existingPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
      const newTotalPaid = totalPaidFromExisting + amountPaid;
      const newBalance = grossAmount - newTotalPaid;
      const invoiceStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';

      // Insert payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          invoice_id: selectedInvoice,
          client_id: invoice.order?.client_id,
          payment_date: formData.payment_date,
          amount_paid: amountPaid,
          gross_amount: grossAmount,
          unpaid_amount: newBalance,
          payment_method: formData.payment_method,
          bank_wallet: formData.bank_wallet,
          reference_number: formData.reference_number,
          received_by: formData.received_by,
          invoice_status: invoiceStatus,
          processing_status: 'Succeeded'
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update invoice paid_amount and balance
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          paid_amount: newTotalPaid,
          balance: newBalance,
          status: newBalance <= 0 ? 'Paid' : 'Partially Paid'
        })
        .eq('id', selectedInvoice);

      if (updateError) throw updateError;

      // Convert Proforma to Sales Invoice if payment is successful
      if (invoice.invoice_type === 'Proforma') {
        // Generate new invoice number for Sales Invoice
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
        const salesInvoiceNo = `INV-${String(nextNumber).padStart(5, '0')}`;

        // Create Sales Invoice
        const { data: salesInvoiceData, error: salesError } = await supabase
          .from('invoices')
          .insert([{
            order_id: invoice.order_id,
            invoice_no: salesInvoiceNo,
            invoice_type: 'Sales Invoice',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: invoice.due_date,
            subtotal: invoice.subtotal,
            vat_amount: invoice.vat_amount,
            grand_total: invoice.grand_total,
            paid_amount: newTotalPaid,
            balance: newBalance,
            status: newBalance <= 0 ? 'Paid' : 'Partially Paid'
          }])
          .select()
          .single();

        if (salesError) throw salesError;

        // Copy invoice items to new Sales Invoice
        const { data: invoiceItems, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', selectedInvoice);

        if (itemsError) throw itemsError;

        for (const item of invoiceItems || []) {
          await supabase.from('invoice_items').insert([{
            invoice_id: salesInvoiceData.id,
            item_id: item.item_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total
          }]);
        }

        // Update original Proforma invoice status
        await supabase
          .from('invoices')
          .update({ status: 'Converted' })
          .eq('id', selectedInvoice);
      }

      alert('Payment recorded successfully!');
      setShowModal(false);
      setSelectedInvoice('');
      setFormData({
        payment_date: new Date().toISOString().split('T')[0],
        amount_paid: '',
        payment_method: 'Cash',
        bank_wallet: '',
        reference_number: '',
        received_by: ''
      });
      await fetchPayments();
      await fetchInvoices();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error creating payment: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      await fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error deleting payment: ' + error.message);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.invoice?.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || payment.invoice_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Payments</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> New Payment
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by invoice no or client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option value="All">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Invoice No</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Payment Date</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-600">Amount Paid</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-600">Gross Amount</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-600">Unpaid Amount</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Payment Method</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-500 text-sm">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="p-4 text-center">{index + 1}</td>
                    <td className="p-4 font-medium">{payment.invoice?.invoice_no || '-'}</td>
                    <td className="p-4">{payment.client?.name || '-'}</td>
                    <td className="p-4">{payment.payment_date || '-'}</td>
                    <td className="p-4 text-right">{payment.amount_paid || 0}</td>
                    <td className="p-4 text-right">{payment.gross_amount || 0}</td>
                    <td className="p-4 text-right">{payment.unpaid_amount || 0}</td>
                    <td className="p-4">{payment.payment_method || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.invoice_status === 'Paid' ? 'bg-green-100 text-green-700' :
                        payment.invoice_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.invoice_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-600 hover:text-red-800 bg-transparent border-none cursor-pointer"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg mt-10">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">New Payment</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedInvoice('');
                  setFormData({
                    payment_date: new Date().toISOString().split('T')[0],
                    amount_paid: '',
                    payment_method: 'Cash',
                    bank_wallet: '',
                    reference_number: '',
                    received_by: ''
                  });
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Select Invoice <span className="text-red-500">*</span></label>
                <select
                  value={selectedInvoice}
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">Select an invoice</option>
                  {invoices.map(invoice => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_no} - {invoice.order?.client?.name} (Balance: {invoice.balance || 0})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-600 mb-4">
                  <p className="font-semibold mb-2">Invoice Details:</p>
                  {invoices.find(inv => inv.id === selectedInvoice) && (
                    <>
                      <p>Invoice No: {invoices.find(inv => inv.id === selectedInvoice).invoice_no}</p>
                      <p>Client: {invoices.find(inv => inv.id === selectedInvoice).order?.client?.name}</p>
                      <p>Grand Total: {invoices.find(inv => inv.id === selectedInvoice).grand_total}</p>
                      <p>Balance: {invoices.find(inv => inv.id === selectedInvoice).balance}</p>
                    </>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Payment Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Amount Paid <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Payment Method <span className="text-red-500">*</span></label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Card">Card</option>
                  <option value="E-commerce">E-commerce</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Bank/Wallet</label>
                <input
                  type="text"
                  value={formData.bank_wallet}
                  onChange={(e) => setFormData({ ...formData, bank_wallet: e.target.value })}
                  placeholder="Enter bank or wallet name"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Reference Number</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="Enter reference number"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">Received By</label>
                <input
                  type="text"
                  value={formData.received_by}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  placeholder="Enter receiver name"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedInvoice('');
                    setFormData({
                      payment_date: new Date().toISOString().split('T')[0],
                      amount_paid: '',
                      payment_method: 'Cash',
                      bank_wallet: '',
                      reference_number: '',
                      received_by: ''
                    });
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
                >
                  <i className="fa-solid fa-check mr-2"></i>Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
