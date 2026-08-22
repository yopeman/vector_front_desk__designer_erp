import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function OrdersPage({ onNavigateToProforma, prefillOrderData }) {
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientType, setSelectedClientType] = useState(null);
  const [upgradeLeadToClient, setUpgradeLeadToClient] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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
    sales_officer_id: '',
    currency: 'ETB',
    payment_terms: '',
    special_instructions: '',
    sales_type: 'direct_sales',
    order_items: []
  });
  const [editingId, setEditingId] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [attachmentFileUrls, setAttachmentFileUrls] = useState({});
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchClients();
    fetchDepartments();
    fetchItems();
    fetchCurrentUser();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchClients(clientSearchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [clientSearchQuery]);

  // Handle prefill order data from test proforma upgrade
  useEffect(() => {
    if (prefillOrderData) {
      setFormData({
        client_id: prefillOrderData.client_id || '',
        order_no: prefillOrderData.order_no || '',
        order_date: prefillOrderData.order_date || '',
        required_date: prefillOrderData.required_date || '',
        status: prefillOrderData.status || 'New',
        priority: prefillOrderData.priority || 'Medium',
        total_amount: 0,
        paid_amount: prefillOrderData.paid_amount || 0,
        balance: 0,
        sales_officer_id: currentUserId,
        currency: prefillOrderData.currency || 'ETB',
        payment_terms: prefillOrderData.payment_terms || '',
        special_instructions: prefillOrderData.special_instructions || '',
        sales_type: prefillOrderData.sales_type || 'direct_sales',
        order_items: prefillOrderData.order_items || []
      });
      setSelectedClientType(prefillOrderData.client_type || null);
      setClientSearchQuery(prefillOrderData.client_name ? `${prefillOrderData.client_name} (${prefillOrderData.client_type})` : '');
      setUpgradeLeadToClient(false);
      setEditingId(null);
      setShowModal(true);
    }
  }, [prefillOrderData, currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setFormData(prev => ({ ...prev, sales_officer_id: user.id }));
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('orders')
        .select('*, client:clients(name), sales_officer:users(username), department:departments(name), order_items(*)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`order_no.ilike.%${searchQuery}%,client.name.ilike.%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      // Apply priority filter
      if (priorityFilter !== 'All') {
        query = query.eq('priority', priorityFilter);
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
        sales_officer_id: formData.sales_officer_id,
        currency: formData.currency,
        payment_terms: formData.payment_terms,
        special_instructions: formData.special_instructions,
        sales_type: formData.sales_type,
        attachments: attachments.filter(att => att.file_id).map(att => att.file_id)
      };

      // Filter out empty fields
      if (!submitData.client_id) delete submitData.client_id;
      if (!submitData.order_no) delete submitData.order_no;
      if (!submitData.order_date) delete submitData.order_date;
      if (!submitData.required_date) delete submitData.required_date;
      if (!submitData.sales_officer_id) delete submitData.sales_officer_id;
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

      // Update client type from lead to client if checkbox is checked
      if (upgradeLeadToClient && formData.client_id && selectedClientType === 'lead') {
        const { error: clientUpdateError } = await supabase
          .from('clients')
          .update({ 
            client_type: 'client',
            converted_at: new Date().toISOString()
          })
          .eq('id', formData.client_id);
        if (clientUpdateError) throw clientUpdateError;
      }

      await fetchOrders();
      resetForm();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order: ' + error.message);
    }
  };

  const generateNextOrderNo = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('order_no')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].order_no) {
        const lastOrderNo = data[0].order_no;
        const match = lastOrderNo.match(/OR-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          return `OR-${String(nextNum).padStart(2, '0')}`;
        }
      }
      return 'OR-01';
    } catch (error) {
      console.error('Error generating order no:', error);
      return 'OR-01';
    }
  };

  const handleEdit = async (order) => {
    // Fetch client type and name for the selected client
    let clientType = null;
    let clientName = '';
    if (order.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('client_type, name')
        .eq('id', order.client_id)
        .single();
      if (clientData) {
        clientType = clientData.client_type;
        clientName = clientData.name;
      }
    }

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
      sales_officer_id: order.sales_officer_id || '',
      currency: order.currency || 'ETB',
      payment_terms: order.payment_terms || '',
      special_instructions: order.special_instructions || '',
      sales_type: order.sales_type || 'direct_sales',
      order_items: order.order_items || []
    });
    setAttachments([]);
    setSelectedClientType(clientType);
    setUpgradeLeadToClient(false);
    setClientSearchQuery(clientName ? `${clientName} (${clientType})` : '');
    setEditingId(order.id);
    setShowModal(true);

    if (order.attachments && order.attachments.length > 0) {
      const { data: files } = await supabase
        .from('files')
        .select('*')
        .in('id', order.attachments);
      if (files) {
        setAttachments(files.map(file => ({
          description: file.description || '',
          file: null,
          file_id: file.id,
          file_name: file.name,
          file_path: file.path
        })));

        const urls = { ...attachmentFileUrls };
        for (const file of files) {
          if (file.path) {
            const url = await getFileUrl(file.path);
            if (url) urls[file.id] = url;
          }
        }
        setAttachmentFileUrls(urls);
      }
    }
  };


  const resetForm = async () => {
    const nextOrderNo = await generateNextOrderNo();
    setFormData({
      client_id: '',
      order_no: nextOrderNo,
      order_date: '',
      required_date: '',
      status: 'New',
      priority: 'Medium',
      total_amount: 0,
      paid_amount: 0,
      balance: 0,
      sales_officer_id: currentUserId,
      currency: 'ETB',
      payment_terms: '',
      special_instructions: '',
      sales_type: 'direct_sales',
      order_items: []
    });
    setAttachments([]);
    setAttachmentFileUrls({});
    setSelectedClientType(null);
    setUpgradeLeadToClient(false);
    setClientSearchQuery('');
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

  const handleSaveAttachment = async (idx) => {
    const attachment = attachments[idx];
    if (!attachment.file) {
      alert('Please select a file to upload');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const fileName = `${Date.now()}_${attachment.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, attachment.file);

      if (uploadError) throw uploadError;

      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          name: attachment.file.name,
          path: uploadData.path,
          mime_type: attachment.file.type,
          file_size: attachment.file.size,
          uploaded_by: userId,
          description: attachment.description
        })
        .select()
        .single();

      if (fileError) throw fileError;

      const newAttachments = [...attachments];
      newAttachments[idx].file_id = fileData.id;
      newAttachments[idx].file_name = fileData.name;
      newAttachments[idx].file_path = fileData.path;
      setAttachments(newAttachments);

      const url = await getFileUrl(fileData.path);
      if (url) {
        setAttachmentFileUrls(prev => ({ ...prev, [fileData.id]: url }));
      }

    } catch (error) {
      console.error('Error saving attachment:', error);
      alert('Error saving attachment: ' + error.message);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter]);

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
          onClick={async () => {
            setEditingId(null);
            const nextOrderNo = await generateNextOrderNo();
            setFormData({
              client_id: '',
              order_no: nextOrderNo,
              order_date: '',
              required_date: '',
              status: 'New',
              priority: 'Medium',
              total_amount: 0,
              paid_amount: 0,
              balance: 0,
              sales_officer_id: currentUserId,
              currency: 'ETB',
              payment_terms: '',
              special_instructions: '',
              sales_type: 'direct_sales',
              order_items: []
            });
            setAttachments([]);
            setAttachmentFileUrls({});
            setSelectedClientType(null);
            setUpgradeLeadToClient(false);
            setClientSearchQuery('');
            setShowModal(true);
          }}
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
              {/* <option value="New">New</option> */}
              <option value="In Progress">In Progress</option>
              {/* <option value="In Production">In Production</option> */}
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
                    {/* <button
                      onClick={() => onNavigateToProforma?.(order.id)}
                      className="text-green-600 hover:text-green-800 bg-transparent border-none cursor-pointer"
                      title="Proforma Invoice"
                    >
                      <i className="fa-solid fa-file-invoice"></i> Proforma
                    </button> */}
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
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} orders
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
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Client <span className="text-red-500">*</span></label>
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
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                    {showClientDropdown && clients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {clients.map(client => (
                          <div
                            key={client.id}
                            onClick={() => {
                              setFormData({ ...formData, client_id: client.id });
                              setClientSearchQuery(`${client.name} (${client.client_type})`);
                              setSelectedClientType(client.client_type);
                              setUpgradeLeadToClient(false);
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
                    <label className="block text-xs font-medium text-slate-500 mb-1">Order No</label>
                    <input
                      type="text"
                      value={formData.order_no}
                      readOnly
                      disabled
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-100"
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
                      <input type="text" value={formData.status} readOnly disabled/>
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
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sales Type</label>
                    <select
                      value={formData.sales_type}
                      onChange={(e) => setFormData({ ...formData, sales_type: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="direct_sales">Direct Sales</option>
                      <option value="from_design">From Design</option>
                    </select>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Additional Information</h3>
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
                    {/* <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Paid Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.paid_amount}
                        onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div> */}
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
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Special Instructions</label>
                    <textarea
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      rows="14"
                      placeholder="Enter special instructions"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  {selectedClientType === 'lead' && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="upgradeLeadToClient"
                        checked={upgradeLeadToClient}
                        onChange={(e) => setUpgradeLeadToClient(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="upgradeLeadToClient"
                        className="text-xs font-medium text-slate-700 cursor-pointer"
                      >
                        Leads to client converted (Ready for payment)
                      </label>
                    </div>
                  )}
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
                          {/* <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tax %</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.tax_percent}
                              onChange={(e) => updateOrderItem(index, 'tax_percent', e.target.value)}
                              placeholder="0"
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div> */}
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              readOnly
                              disabled
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

              {/* Attachments */}
              <div className="mt-6 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Attachments</h3>
                  <button
                    type="button"
                    onClick={() => setAttachments([...attachments, { description: '', file: null, file_id: null }])}
                    className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer bg-transparent border-none hover:text-blue-800"
                  >
                    <i className="fa-solid fa-plus"></i> Add Attachment
                  </button>
                </div>
                <div className="space-y-3">
                  {attachments.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4">No attachments added yet. Click "+ Add Attachment" to add.</div>
                  ) : (
                    attachments.map((att, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                          <input
                            type="text"
                            value={att.description || ''}
                            onChange={(e) => {
                              const newAtts = [...attachments];
                              newAtts[idx].description = e.target.value;
                              setAttachments(newAtts);
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
                                  const newAtts = [...attachments];
                                  newAtts[idx].file = file;
                                  setAttachments(newAtts);
                                }
                              }}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveAttachment(idx)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer border-none mt-5"
                          >
                            (+ save)
                          </button>
                        </div>
                        {att.file_id && (
                          <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
                            {attachmentFileUrls[att.file_id] ? (
                              <a
                                href={attachmentFileUrls[att.file_id]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 no-underline flex items-center gap-1"
                              >
                                <i className="fa-solid fa-check text-green-700 mr-1"></i>
                                {att.file_name || att.file?.name || 'File saved'}
                                <i className="fa-solid fa-external-link text-blue-400 text-[10px]"></i>
                              </a>
                            ) : (
                              <span className="text-xs text-green-700">
                                <i className="fa-solid fa-check mr-1"></i>
                                {att.file_name || att.file?.name || 'File saved'}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer bg-transparent border-none"
                            >
                              <i className="fa-solid fa-trash"></i> Remove
                            </button>
                          </div>
                        )}
                        {!att.file_id && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
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
