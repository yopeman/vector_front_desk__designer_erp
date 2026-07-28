import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function OrdersPage({ onNavigateToProforma }) {
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    order_no: '',
    order_date: '',
    required_date: '',
    status: 'New',
    priority: 'Medium',
    total_amount: 0,
    paid_amount: 0,
    balance: 0,
    reference_po: '',
    sales_officer_id: '',
    department_id: '',
    currency: 'ETB',
    payment_terms: '',
    special_instructions: '',
    order_items: []
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchClients();
    fetchUsers();
    fetchDepartments();
    fetchItems();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, client:clients(name), sales_officer:users(username), department:departments(name), order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('client_type', 'client')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
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

  const calculateOrderTotal = (orderItems) => {
    return orderItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const discount = parseFloat(item.discount_percent) || 0;
      const tax = parseFloat(item.tax_percent) || 0;
      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * (discount / 100);
      const taxAmount = (subtotal - discountAmount) * (tax / 100);
      return total + subtotal - discountAmount + taxAmount;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderTotal = calculateOrderTotal(formData.order_items);
      const submitData = {
        client_id: formData.client_id,
        order_no: formData.order_no,
        order_date: formData.order_date,
        required_date: formData.required_date,
        status: formData.status,
        priority: formData.priority,
        total_amount: orderTotal,
        paid_amount: formData.paid_amount || 0,
        balance: orderTotal - (formData.paid_amount || 0),
        reference_po: formData.reference_po,
        sales_officer_id: formData.sales_officer_id,
        department_id: formData.department_id,
        currency: formData.currency,
        payment_terms: formData.payment_terms,
        special_instructions: formData.special_instructions
      };

      // Filter out empty fields
      if (!submitData.client_id) delete submitData.client_id;
      if (!submitData.order_no) delete submitData.order_no;
      if (!submitData.order_date) delete submitData.order_date;
      if (!submitData.required_date) delete submitData.required_date;
      if (!submitData.reference_po) delete submitData.reference_po;
      if (!submitData.sales_officer_id) delete submitData.sales_officer_id;
      if (!submitData.department_id) delete submitData.department_id;
      if (!submitData.payment_terms) delete submitData.payment_terms;
      if (!submitData.special_instructions) delete submitData.special_instructions;

      let orderId;
      if (editingId) {
        const { error } = await supabase
          .from('orders')
          .update(submitData)
          .eq('id', editingId);
        if (error) throw error;
        orderId = editingId;

        // Delete existing order items and create new ones
        await supabase.from('order_items').delete().eq('order_id', orderId);
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert([submitData])
          .select();
        if (error) throw error;
        orderId = data[0].id;
      }

      // Insert order items
      const validOrderItems = formData.order_items.filter(item => item.item_id && item.quantity > 0);
      for (const item of validOrderItems) {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const discount = parseFloat(item.discount_percent) || 0;
        const tax = parseFloat(item.tax_percent) || 0;
        const subtotal = quantity * unitPrice;
        const discountAmount = subtotal * (discount / 100);
        const taxAmount = (subtotal - discountAmount) * (tax / 100);
        const amount = subtotal - discountAmount + taxAmount;

        await supabase.from('order_items').insert([{
          order_id: orderId,
          item_id: item.item_id,
          quantity: quantity,
          description: item.description,
          unit: item.unit,
          unit_price: unitPrice,
          discount_percent: discount,
          tax_percent: tax,
          amount: amount
        }]);
      }

      await fetchOrders();
      resetForm();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order: ' + error.message);
    }
  };

  const handleEdit = (order) => {
    setFormData({
      client_id: order.client_id || '',
      order_no: order.order_no || '',
      order_date: order.order_date || '',
      required_date: order.required_date || '',
      status: order.status || 'New',
      priority: order.priority || 'Medium',
      total_amount: order.total_amount || 0,
      paid_amount: order.paid_amount || 0,
      balance: order.balance || 0,
      reference_po: order.reference_po || '',
      sales_officer_id: order.sales_officer_id || '',
      department_id: order.department_id || '',
      currency: order.currency || 'ETB',
      payment_terms: order.payment_terms || '',
      special_instructions: order.special_instructions || '',
      order_items: order.order_items || []
    });
    setEditingId(order.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this order? This will also delete all order items.')) return;
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order: ' + error.message);
    }
  };

  const handleCreateInvoice = async (order, invoiceType) => {
    try {
      // Fetch order with items
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', order.id)
        .single();

      if (orderError) throw orderError;

      // Calculate totals
      const subtotal = calculateOrderTotal(orderData.order_items || []);
      const vatAmount = subtotal * 0.15; // Assuming 15% VAT
      const grandTotal = subtotal + vatAmount;

      // Generate invoice number
      const prefix = invoiceType === 'Proforma' ? 'PROF' : 'INV';
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_no')
        .ilike('invoice_no', `${prefix}%`)
        .order('invoice_no', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastInvoice?.invoice_no) {
        const lastNum = parseInt(lastInvoice.invoice_no.split('-')[1]);
        nextNumber = lastNum + 1;
      }
      const invoiceNo = `${prefix}-${String(nextNumber).padStart(5, '0')}`;

      // Insert invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          order_id: order.id,
          invoice_no: invoiceNo,
          invoice_type: invoiceType,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal: subtotal,
          vat_amount: vatAmount,
          grand_total: grandTotal,
          paid_amount: 0,
          balance: grandTotal,
          status: 'Unpaid'
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      for (const item of orderData.order_items || []) {
        await supabase.from('invoice_items').insert([{
          invoice_id: invoiceData.id,
          item_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.amount
        }]);
      }

      alert(`${invoiceType} created successfully! Invoice No: ${invoiceNo}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      order_no: '',
      order_date: '',
      required_date: '',
      status: 'New',
      priority: 'Medium',
      total_amount: 0,
      paid_amount: 0,
      balance: 0,
      reference_po: '',
      sales_officer_id: '',
      department_id: '',
      currency: 'ETB',
      payment_terms: '',
      special_instructions: '',
      order_items: []
    });
    setEditingId(null);
    setShowModal(false);
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      order_items: [
        ...formData.order_items,
        {
          item_id: '',
          quantity: 1,
          description: '',
          unit: '',
          unit_price: 0,
          discount_percent: 0,
          tax_percent: 0,
          amount: 0
        }
      ]
    });
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...formData.order_items];
    updatedItems[index][field] = value;
    
    // Recalculate amount if quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent' || field === 'tax_percent') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const unitPrice = parseFloat(updatedItems[index].unit_price) || 0;
      const discount = parseFloat(updatedItems[index].discount_percent) || 0;
      const tax = parseFloat(updatedItems[index].tax_percent) || 0;
      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * (discount / 100);
      const taxAmount = (subtotal - discountAmount) * (tax / 100);
      updatedItems[index].amount = subtotal - discountAmount + taxAmount;
    }
    
    setFormData({ ...formData, order_items: updatedItems });
  };

  const removeOrderItem = (index) => {
    setFormData({
      ...formData,
      order_items: formData.order_items.filter((_, i) => i !== index)
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.client?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.reference_po?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
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
        <h2 className="text-xl font-bold text-slate-800">Orders</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> New Order
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by order no, client, or PO..."
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
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="In Production">In Production</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Priority</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Total</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Balance</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">{order.order_no || '-'}</td>
                  <td className="p-4">{order.client?.name || '-'}</td>
                  <td className="p-4">{order.order_date || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'In Production' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.priority === 'High' ? 'bg-red-100 text-red-700' :
                      order.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="p-4">{order.total_amount || 0} {order.currency || 'ETB'}</td>
                  <td className="p-4">{order.balance || 0} {order.currency || 'ETB'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(order)}
                      className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button
                      onClick={() => onNavigateToProforma?.(order.id)}
                      className="text-green-600 hover:text-green-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Proforma Invoice"
                    >
                      <i className="fa-solid fa-file-invoice"></i> Proforma
                    </button>
                    <button
                      onClick={() => handleCreateInvoice(order, 'Sales Invoice')}
                      className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Sales Invoice"
                    >
                      <i className="fa-solid fa-file-invoice-dollar"></i> Sales Invoice
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Order' : 'New Order'}
              </h2>
              <button
                onClick={resetForm}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Order Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Client <span className="text-red-500">*</span></label>
                    <select
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Order No</label>
                    <input
                      type="text"
                      value={formData.order_no}
                      onChange={(e) => setFormData({ ...formData, order_no: e.target.value })}
                      placeholder="Enter order number"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Order Date</label>
                      <input
                        type="date"
                        value={formData.order_date}
                        onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Required Date</label>
                      <input
                        type="date"
                        value={formData.required_date}
                        onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="In Production">In Production</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Additional Information</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Reference PO</label>
                    <input
                      type="text"
                      value={formData.reference_po}
                      onChange={(e) => setFormData({ ...formData, reference_po: e.target.value })}
                      placeholder="Enter PO reference"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sales Officer</label>
                    <select
                      value={formData.sales_officer_id}
                      onChange={(e) => setFormData({ ...formData, sales_officer_id: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select sales officer</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                      <input
                        type="text"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        placeholder="ETB"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Paid Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.paid_amount}
                        onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Payment Terms</label>
                    <input
                      type="text"
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                      placeholder="Enter payment terms"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Special Instructions</label>
                    <textarea
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      rows="3"
                      placeholder="Enter special instructions"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Order Items</h3>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-colors border-none cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Add Item
                  </button>
                </div>

                {formData.order_items.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">No items added yet</p>
                ) : (
                  <div className="space-y-3">
                    {formData.order_items.map((item, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Item</label>
                            <select
                              value={item.item_id}
                              onChange={(e) => updateOrderItem(index, 'item_id', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                              <option value="">Select item</option>
                              {items.map(itemOption => (
                                <option key={itemOption.id} value={itemOption.id}>{itemOption.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateOrderItem(index, 'unit_price', e.target.value)}
                              placeholder="0"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Discount %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.discount_percent}
                              onChange={(e) => updateOrderItem(index, 'discount_percent', e.target.value)}
                              placeholder="0"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tax %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.tax_percent}
                              onChange={(e) => updateOrderItem(index, 'tax_percent', e.target.value)}
                              placeholder="0"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              readOnly
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-slate-100 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateOrderItem(index, 'description', e.target.value)}
                              placeholder="Enter description"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateOrderItem(index, 'unit', e.target.value)}
                              placeholder="Enter unit"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="mt-3 text-red-600 hover:text-red-800 text-xs bg-transparent border-none cursor-pointer"
                        >
                          <i className="fa-solid fa-trash"></i> Remove Item
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Total */}
                {formData.order_items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">
                        Order Total: {calculateOrderTotal(formData.order_items).toFixed(2)} {formData.currency}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-colors border-none cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
