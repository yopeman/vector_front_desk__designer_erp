import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPayment, setPreviewPayment] = useState(null);
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount_paid: '',
    payment_method: 'Cash',
    bank_wallet: '',
    reference_number: '',
    received_by: ''
  });
  const [previewTab, setPreviewTab] = useState('details');
  const [documents, setDocuments] = useState([]);
  const [docFileUrls, setDocFileUrls] = useState({});
  const [extraNotes, setExtraNotes] = useState([]);
  const [noteAuthors, setNoteAuthors] = useState([]);
  const [newPaymentTab, setNewPaymentTab] = useState('details');
  const [newPaymentDocuments, setNewPaymentDocuments] = useState([]);
  const [newPaymentDocFileUrls, setNewPaymentDocFileUrls] = useState({});
  const [newPaymentNotes, setNewPaymentNotes] = useState([]);

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, [currentPage, itemsPerPage]);

  const fetchPayments = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('payments')
        .select('*, invoice:invoices(invoice_no, invoice_type, grand_total, balance), client:clients(name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`reference_number.ilike.%${searchQuery}%,invoice.invoice_no.ilike.%${searchQuery}%,client.name.ilike.%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'All') {
        query = query.eq('invoice_status', statusFilter);
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      setPayments(data || []);
      setTotalCount(count || 0);
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

    // if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
    //   alert('Please enter a valid amount');
    //   return;
    // }

    try {
      const invoice = invoices.find(inv => inv.id === selectedInvoice);
      if (!invoice) {
        alert('Invoice not found');
        return;
      }

      const amountPaid = parseFloat(formData.amount_paid);
      const grossAmount = invoice.grand_total || 0;

      // Upload documents and get file IDs
      const fileIds = [];
      for (const doc of newPaymentDocuments) {
        if (doc.file_id) {
          fileIds.push(doc.file_id);
        } else if (doc.file) {
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
          fileIds.push(fileData.id);
        }
      }

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
          processing_status: 'Succeeded',
          attached_file_ids: fileIds
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Save notes
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const filteredNotes = newPaymentNotes.filter(note => note.trim());
      const noteInserts = filteredNotes.map(note => ({
        entity_type: 'payments',
        entity_id: paymentData.id,
        user_id: userId,
        content: note,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      if (noteInserts.length > 0) {
        await supabase.from('notes').insert(noteInserts);
      }

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
      setNewPaymentTab('details');
      setNewPaymentDocuments([]);
      setNewPaymentDocFileUrls({});
      setNewPaymentNotes([]);
      await fetchPayments();
      await fetchInvoices();
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error creating payment: ' + error.message);
    }
  };

  const handleShow = async (payment) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, invoice:invoices(*, order:orders(*, client:clients(*))), client:clients(*)')
        .eq('id', payment.id)
        .single();

      if (error) throw error;
      setPreviewPayment(data);
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
        .eq('entity_type', 'payments')
        .eq('entity_id', payment.id)
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
      console.error('Error fetching payment details:', error);
      alert('Error fetching payment details: ' + error.message);
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

      // Update payment with new file_id
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          attached_file_ids: [...(previewPayment.attached_file_ids || []), fileData.id]
        })
        .eq('id', previewPayment.id);

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

  const savePaymentNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    await supabase.from('notes').delete().eq('entity_type', 'payments').eq('entity_id', previewPayment.id);
    const filteredNotes = extraNotes.filter(note => note.trim());
    const noteInserts = filteredNotes.map(note => ({
      entity_type: 'payments',
      entity_id: previewPayment.id,
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

  const handleSaveNewPaymentDocument = async (idx) => {
    const doc = newPaymentDocuments[idx];
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

      const newDocs = [...newPaymentDocuments];
      newDocs[idx].file_id = fileData.id;
      newDocs[idx].file_name = fileData.name;
      newDocs[idx].file_path = fileData.path;
      setNewPaymentDocuments(newDocs);

      const url = await getFileUrl(fileData.path);
      if (url) {
        setNewPaymentDocFileUrls(prev => ({ ...prev, [fileData.id]: url }));
      }

      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    }
  };

  const addNewPaymentNote = () => {
    setNewPaymentNotes([...newPaymentNotes, '']);
  };

  const updateNewPaymentNote = (index, value) => {
    const newNotes = [...newPaymentNotes];
    newNotes[index] = value;
    setNewPaymentNotes(newNotes);
  };

  const removeNewPaymentNote = (index) => {
    setNewPaymentNotes(newPaymentNotes.filter((_, i) => i !== index));
  };

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
        <>
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
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-slate-500 text-sm">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
                          {payment.invoice_status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleShow(payment)}
                          className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer"
                          title="Show"
                        >
                          <i className="fa-solid fa-eye"></i> Show
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="10" className="p-4 text-sm text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-slate-600">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} payments
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
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* New Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col mt-10">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
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
                  setNewPaymentTab('details');
                  setNewPaymentDocuments([]);
                  setNewPaymentDocFileUrls({});
                  setNewPaymentNotes([]);
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
                onClick={() => setNewPaymentTab('details')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  newPaymentTab === 'details'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setNewPaymentTab('documents')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  newPaymentTab === 'documents'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Documents
              </button>
              <button
                type="button"
                onClick={() => setNewPaymentTab('notes')}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                  newPaymentTab === 'notes'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Notes
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {newPaymentTab === 'details' && (
                <>
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
                          {invoice.invoice_no} - {invoice.order?.client?.name} (Unpaid Amount: {invoice.balance || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedInvoice && (
                    <>
                      <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-600 mb-4">
                        <p className="font-semibold mb-2">Invoice Details:</p>
                        {invoices.find(inv => inv.id === selectedInvoice) && (
                          <>
                            <p>Invoice No: {invoices.find(inv => inv.id === selectedInvoice).invoice_no}</p>
                            <p>Client: {invoices.find(inv => inv.id === selectedInvoice).order?.client?.name}</p>
                            <p>Grand Total: {invoices.find(inv => inv.id === selectedInvoice).grand_total}</p>
                            <p>Unpaid Amount: {invoices.find(inv => inv.id === selectedInvoice).balance}</p>
                          </>
                        )}
                      </div>

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
                          <option value="Credit">Credit</option>
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
                    </>
                  )}
                </>
              )}

              {/* TAB: Documents */}
              {newPaymentTab === 'documents' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Documents</h3>
                    <button
                      type="button"
                      onClick={() => setNewPaymentDocuments([...newPaymentDocuments, { description: '', file: null, file_id: null }])}
                      className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer bg-transparent border-none hover:text-blue-800"
                    >
                      <i className="fa-solid fa-plus"></i> Add Document
                    </button>
                  </div>
                  <div id="new-payment-documents-list" className="space-y-3">
                    {newPaymentDocuments.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4">No documents added yet. Click "+ Add Document" to add.</div>
                    ) : (
                      newPaymentDocuments.map((doc, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                            <input
                              type="text"
                              value={doc.description || ''}
                              onChange={(e) => {
                                const newDocs = [...newPaymentDocuments];
                                newDocs[idx].description = e.target.value;
                                setNewPaymentDocuments(newDocs);
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
                                    const newDocs = [...newPaymentDocuments];
                                    newDocs[idx].file = file;
                                    setNewPaymentDocuments(newDocs);
                                  }
                                }}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveNewPaymentDocument(idx)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none mt-5"
                            >
                              (+ save)
                            </button>
                          </div>
                          {doc.file_id && (
                            <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
                              {newPaymentDocFileUrls[doc.file_id] ? (
                                <a
                                  href={newPaymentDocFileUrls[doc.file_id]}
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
                                onClick={() => setNewPaymentDocuments(newPaymentDocuments.filter((_, i) => i !== idx))}
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
                                onClick={() => setNewPaymentDocuments(newPaymentDocuments.filter((_, i) => i !== idx))}
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
              {newPaymentTab === 'notes' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Notes</h3>
                    <button
                      type="button"
                      onClick={addNewPaymentNote}
                      className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer bg-transparent border-none hover:text-blue-800"
                    >
                      <i className="fa-solid fa-plus"></i> Add Note
                    </button>
                  </div>
                  <div id="new-payment-notes-container" className="space-y-3">
                    {newPaymentNotes.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4">No notes added yet. Click "+ Add Note" to add.</div>
                    ) : (
                      newPaymentNotes.map((note, index) => (
                        <div key={index} className="bg-white p-4 rounded-xl border border-slate-200">
                          <textarea
                            value={note}
                            onChange={(e) => updateNewPaymentNote(index, e.target.value)}
                            rows="3"
                            placeholder={`Additional note ${index + 1}…`}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => removeNewPaymentNote(index)}
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

              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end gap-3 z-10">
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
                    setNewPaymentTab('details');
                    setNewPaymentDocuments([]);
                    setNewPaymentDocFileUrls({});
                    setNewPaymentNotes([]);
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

      {/* Preview Modal */}
      {showPreviewModal && previewPayment && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-800">Payment Details</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewPayment(null);
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
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Invoice No:</span>
                        <span className="ml-2 font-medium">{previewPayment.invoice?.invoice_no || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Client:</span>
                        <span className="ml-2 font-medium">{previewPayment.client?.name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Payment Date:</span>
                        <span className="ml-2 font-medium">{previewPayment.payment_date || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Payment Method:</span>
                        <span className="ml-2 font-medium">{previewPayment.payment_method || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Bank/Wallet:</span>
                        <span className="ml-2 font-medium">{previewPayment.bank_wallet || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Reference Number:</span>
                        <span className="ml-2 font-medium">{previewPayment.reference_number || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Received By:</span>
                        <span className="ml-2 font-medium">{previewPayment.received_by || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Processing Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          previewPayment.processing_status === 'Succeeded' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {previewPayment.processing_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-600">Amount Paid:</span>
                      <span className="text-slate-800 font-medium">{previewPayment.amount_paid || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-600">Gross Amount:</span>
                      <span className="text-slate-800">{previewPayment.gross_amount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-600">Unpaid Amount:</span>
                      <span className="text-slate-800">{previewPayment.unpaid_amount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-lg border-t pt-2">
                      <span className="font-semibold text-slate-600">Invoice Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        previewPayment.invoice_status === 'Paid' ? 'bg-green-100 text-green-700' :
                        previewPayment.invoice_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {previewPayment.invoice_status}
                      </span>
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
                  <div id="payment-documents-list" className="space-y-3">
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
                  <div id="payment-extra-notes-container" className="space-y-3">
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
                      onClick={savePaymentNotes}
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
                  setPreviewPayment(null);
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
