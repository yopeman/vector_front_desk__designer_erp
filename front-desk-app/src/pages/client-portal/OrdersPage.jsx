import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function OrdersPage({ clientId: propClientId }) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailTab, setDetailTab] = useState('items');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Connected entities state
  const [orderDesigns, setOrderDesigns] = useState([]);
  const [designVersions, setDesignVersions] = useState({});
  const [orderProformaInvoices, setOrderProformaInvoices] = useState([]);
  const [orderPayments, setOrderPayments] = useState([]);
  const [orderSalesInvoices, setOrderSalesInvoices] = useState([]);
  const [orderJobOrders, setOrderJobOrders] = useState([]);
  const [orderFeedback, setOrderFeedback] = useState([]);
  const [orderComplaints, setOrderComplaints] = useState([]);
  const [orderWarranty, setOrderWarranty] = useState([]);
  const [jobOrderDeliveries, setJobOrderDeliveries] = useState([]);
  const [jobOrderInstallations, setJobOrderInstallations] = useState([]);
  
  // Design version editing state
  const [editingDesignVersion, setEditingDesignVersion] = useState(null);
  const [designVersionForm, setDesignVersionForm] = useState({
    status: '',
    comment: ''
  });

  // Feedback/Complaints/Warranty form state
  const [feedbackForm, setFeedbackForm] = useState({
    overall_rating: '',
    quality_rating: '',
    staff_service_rating: '',
    delivery_rating: '',
    recommend: '',
    comments: ''
  });
  const [complaintForm, setComplaintForm] = useState({
    subject: '',
    description: '',
    category: 'General'
  });
  const [warrantyForm, setWarrantyForm] = useState({
    product_name: '',
    serial_no: '',
    claim_type: '',
    defect_description: ''
  });
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editingWarranty, setEditingWarranty] = useState(null);

  // Get current client ID from auth or prop
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    if (propClientId) {
      setClientId(propClientId);
      fetchOrders(propClientId).finally(() => setLoading(false));
    } else {
      getCurrentClient();
    }
  }, [propClientId]);

  const getCurrentClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        setClientId(clientData?.id);
        if (clientData?.id) {
          fetchOrders(clientData.id);
        }
      }
    } catch (error) {
      console.error('Error fetching current client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (currentClientId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('client_id', currentClientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch connected entities for order detail
  const fetchOrderDesigns = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*, assigned_designer:users(username)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrderDesigns(data || []);

      // Fetch design versions for each design
      if (data && data.length > 0) {
        const versionsMap = {};
        for (const design of data) {
          const { data: versions, error: versionsError } = await supabase
            .from('design_versions')
            .select('*, file:files(name, path)')
            .eq('design_id', design.id)
            .order('version_number', { ascending: true });
          if (!versionsError && versions) {
            versionsMap[design.id] = versions;
          }
        }
        setDesignVersions(versionsMap);
      }
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  };

  const fetchOrderProformaInvoices = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*, item:items(name))')
        .eq('order_id', orderId)
        .eq('invoice_type', 'Proforma')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrderProformaInvoices(data || []);
    } catch (error) {
      console.error('Error fetching proforma invoices:', error);
    }
  };

  const fetchOrderPayments = async (orderId) => {
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', orderId)
        .eq('invoice_type', 'Proforma');
      
      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map(i => i.id);
        const { data, error } = await supabase
          .from('payments')
          .select('*, invoice:invoices(invoice_no, invoice_type)')
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setOrderPayments(data || []);
      } else {
        setOrderPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchOrderSalesInvoices = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*, item:items(name))')
        .eq('order_id', orderId)
        .eq('invoice_type', 'Sales Invoice')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrderSalesInvoices(data || []);
    } catch (error) {
      console.error('Error fetching sales invoices:', error);
    }
  };

  const fetchOrderJobOrders = async (orderId) => {
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('order_id', orderId)
        .eq('invoice_type', 'Sales Invoice');
      
      if (invoices && invoices.length > 0) {
        const invoiceIds = invoices.map(i => i.id);
        const { data, error } = await supabase
          .from('job_orders')
          .select('*, invoice:invoices(invoice_no, invoice_type)')
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setOrderJobOrders(data || []);
      } else {
        setOrderJobOrders([]);
      }
    } catch (error) {
      console.error('Error fetching job orders:', error);
    }
  };

  const fetchOrderFeedback = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrderFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchOrderComplaints = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrderComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const fetchOrderWarranty = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrderWarranty(data || []);
    } catch (error) {
      console.error('Error fetching warranties:', error);
    }
  };

  const fetchJobOrderDeliveries = async (jobOrderId) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('job_order_id', jobOrderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobOrderDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const fetchJobOrderInstallations = async (jobOrderId) => {
    try {
      const { data, error } = await supabase
        .from('installations')
        .select('*')
        .eq('job_order_id', jobOrderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobOrderInstallations(data || []);
    } catch (error) {
      console.error('Error fetching installations:', error);
    }
  };

  // Get signed URL for file
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

  // Handle opening file in new tab
  const handleOpenFile = async (filePath) => {
    const url = await getFileUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Error opening file');
    }
  };

  // Design version handlers
  const handleEditDesignVersion = (version) => {
    setEditingDesignVersion(version);
    setDesignVersionForm({
      status: version.status || '',
      comment: version.comment || ''
    });
  };

  const handleSaveDesignVersion = async () => {
    try {
      const { error } = await supabase
        .from('design_versions')
        .update({
          status: designVersionForm.status,
          comment: designVersionForm.comment
        })
        .eq('id', editingDesignVersion.id);
      
      if (error) throw error;

      // Refresh design versions for the affected design
      const designId = editingDesignVersion.design_id;
      const { data: versions, error: versionsError } = await supabase
        .from('design_versions')
        .select('*, file:files(name, path)')
        .eq('design_id', designId)
        .order('version_number', { ascending: true });
      
      if (!versionsError && versions) {
        setDesignVersions(prev => ({
          ...prev,
          [designId]: versions
        }));
      }

      setEditingDesignVersion(null);
      setDesignVersionForm({ status: '', comment: '' });
      alert('Design version updated successfully!');
    } catch (error) {
      console.error('Error updating design version:', error);
      alert('Error updating design version: ' + error.message);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    setDetailTab('items');
    
    // Fetch all connected entities
    await Promise.all([
      fetchOrderDesigns(order.id),
      fetchOrderProformaInvoices(order.id),
      fetchOrderPayments(order.id),
      fetchOrderSalesInvoices(order.id),
      fetchOrderJobOrders(order.id),
      fetchOrderFeedback(order.id),
      fetchOrderComplaints(order.id),
      fetchOrderWarranty(order.id)
    ]);
  };

  // Feedback handlers
  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        overall_rating: feedbackForm.overall_rating,
        quality_rating: feedbackForm.quality_rating,
        staff_service_rating: feedbackForm.staff_service_rating,
        delivery_rating: feedbackForm.delivery_rating,
        recommend: feedbackForm.recommend,
        comments: feedbackForm.comments,
        order_id: selectedOrder.id,
        client_id: clientId
      };

      if (editingFeedback) {
        const { error } = await supabase.from('feedbacks').update(payload).eq('id', editingFeedback.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('feedbacks').insert([payload]);
        if (error) throw error;
      }

      await fetchOrderFeedback(selectedOrder.id);
      setFeedbackForm({ overall_rating: '', quality_rating: '', staff_service_rating: '', delivery_rating: '', recommend: '', comments: '' });
      setEditingFeedback(null);
      alert('Feedback saved successfully!');
    } catch (error) {
      console.error('Error saving feedback:', error);
      alert('Error saving feedback: ' + error.message);
    }
  };

  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback);
    setFeedbackForm({
      overall_rating: feedback.overall_rating || '',
      quality_rating: feedback.quality_rating || '',
      staff_service_rating: feedback.staff_service_rating || '',
      delivery_rating: feedback.delivery_rating || '',
      recommend: feedback.recommend || '',
      comments: feedback.comments || ''
    });
  };

  // Complaint handlers
  const handleSaveComplaint = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        subject: complaintForm.subject,
        description: complaintForm.description,
        category: complaintForm.category,
        order_id: selectedOrder.id,
        client_id: clientId,
        status: 'New'
      };

      if (editingComplaint) {
        const { error } = await supabase.from('complaints').update(payload).eq('id', editingComplaint.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('complaints').insert([payload]);
        if (error) throw error;
      }

      await fetchOrderComplaints(selectedOrder.id);
      setComplaintForm({ subject: '', description: '', category: 'General' });
      setEditingComplaint(null);
      alert('Complaint saved successfully!');
    } catch (error) {
      console.error('Error saving complaint:', error);
      alert('Error saving complaint: ' + error.message);
    }
  };

  const handleEditComplaint = (complaint) => {
    setEditingComplaint(complaint);
    setComplaintForm({
      subject: complaint.subject || '',
      description: complaint.description || '',
      category: complaint.category || 'General'
    });
  };

  // Warranty handlers
  const handleSaveWarranty = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_name: warrantyForm.product_name,
        serial_no: warrantyForm.serial_no,
        claim_type: warrantyForm.claim_type,
        defect_description: warrantyForm.defect_description,
        order_id: selectedOrder.id,
        client_id: clientId,
        status: 'New'
      };

      if (editingWarranty) {
        const { error } = await supabase.from('warranties').update(payload).eq('id', editingWarranty.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('warranties').insert([payload]);
        if (error) throw error;
      }

      await fetchOrderWarranty(selectedOrder.id);
      setWarrantyForm({ product_name: '', serial_no: '', claim_type: '', defect_description: '' });
      setEditingWarranty(null);
      alert('Warranty saved successfully!');
    } catch (error) {
      console.error('Error saving warranty:', error);
      alert('Error saving warranty: ' + error.message);
    }
  };

  const handleEditWarranty = (warranty) => {
    setEditingWarranty(warranty);
    setWarrantyForm({
      product_name: warranty.product_name || '',
      serial_no: warranty.serial_no || '',
      claim_type: warranty.claim_type || '',
      defect_description: warranty.defect_description || ''
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">My Orders</h2>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search by order no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="In Production">In Production</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden thead lg:block hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Total</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Unpaid Amount</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">{order.order_no || '-'}</td>
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
                  <td className="p-4">{order.total_amount || 0} {order.currency || 'ETB'}</td>
                  <td className="p-4">{order.balance || 0} {order.currency || 'ETB'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer"
                      title="View Details"
                    >
                      <i className="fa-solid fa-eye"></i> Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            No orders found
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-slate-800">{order.order_no || '-'}</h3>
                  <p className="text-xs text-slate-500 mt-1">Date: {order.order_date || '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                  order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  order.status === 'In Production' ? 'bg-purple-100 text-purple-700' :
                  order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-slate-400">Total:</span>
                  <span className="ml-1 text-slate-600">{order.total_amount || 0} {order.currency || 'ETB'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Unpaid Amount:</span>
                  <span className="ml-1 text-slate-600">{order.balance || 0} {order.currency || 'ETB'}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleViewDetails(order)}
                  className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer text-xs font-medium"
                >
                  <i className="fa-solid fa-eye mr-1"></i> View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-16">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Order Details</h2>
                <p className="text-sm text-slate-500">{selectedOrder.order_no}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrder(null);
                  setDetailTab('items');
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'items', label: 'Order Items', icon: 'fa-box' },
                { id: 'designs', label: 'Designs', icon: 'fa-pen-ruler' },
                { id: 'proforma', label: 'Proforma Invoices', icon: 'fa-file-invoice' },
                { id: 'payments', label: 'Payments', icon: 'fa-credit-card' },
                { id: 'sales', label: 'Sales Invoices', icon: 'fa-file-invoice-dollar' },
                { id: 'joborders', label: 'Job Orders', icon: 'fa-briefcase' },
                { id: 'feedback', label: 'Feedback', icon: 'fa-star' },
                { id: 'complaints', label: 'Complaints', icon: 'fa-exclamation-triangle' },
                { id: 'warranty', label: 'Warranty', icon: 'fa-shield-halved' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors border-none cursor-pointer ${
                    detailTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon}`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Order Items Tab */}
              {detailTab === 'items' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Order Items</h3>
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Item</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Description</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Quantity</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Unit</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Unit Price</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Discount %</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Tax %</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {selectedOrder.order_items.map((item, index) => (
                              <tr key={index}>
                                <td className="p-3">{item.item?.name || '-'}</td>
                                <td className="p-3">{item.description || '-'}</td>
                                <td className="p-3">{item.quantity || 0}</td>
                                <td className="p-3">{item.unit || '-'}</td>
                                <td className="p-3">{item.unit_price || 0}</td>
                                <td className="p-3">{item.discount_percent || 0}%</td>
                                <td className="p-3">{item.tax_percent || 0}%</td>
                                <td className="p-3 font-medium">{item.amount || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No order items found</p>
                  )}
                </div>
              )}

              {/* Designs Tab */}
              {detailTab === 'designs' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Designs</h3>
                  {orderDesigns.length > 0 ? (
                    <div className="space-y-4">
                      {orderDesigns.map(design => (
                        <div key={design.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-200 p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-slate-800 text-sm">{design.design_type || '-'}</span>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                                  design.priority === 'High' ? 'bg-red-100 text-red-700' :
                                  design.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>{design.priority}</span>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                                  design.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                  design.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>{design.status}</span>
                              </div>
                              <div className="text-xs text-slate-600">
                                {design.assigned_designer?.username || '-'} | {design.required_date || '-'}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{design.purpose || '-'}</p>
                          </div>
                          
                          {/* Design Versions */}
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Design Versions</h4>
                            {designVersions[design.id] && designVersions[design.id].length > 0 ? (
                              <div className="bg-slate-50 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[700px]">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                      <tr>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-600">Version</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-600">Description</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-600">Sent On</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-600">Sent By</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-600">Comment</th>
                                        <th className="p-2 text-left text-xs font-semibold text-slate-600">File</th>
                                        <th className="p-2 text-center text-xs font-semibold text-slate-600">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-xs">
                                      {designVersions[design.id].map(version => (
                                        <tr key={version.id}>
                                          <td className="p-2 font-medium">v{version.version_number}</td>
                                          <td className="p-2">{version.description || '-'}</td>
                                          <td className="p-2">{version.sent_on ? new Date(version.sent_on).toLocaleDateString() : '-'}</td>
                                          <td className="p-2">{version.sent_by || '-'}</td>
                                          <td className="p-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              version.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                              version.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                              version.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                                              'bg-slate-100 text-slate-700'
                                            }`}>{version.status}</span>
                                          </td>
                                          <td className="p-2">{version.comment || '-'}</td>
                                          <td className="p-2">
                                            {version.file ? (
                                              <button
                                                onClick={() => handleOpenFile(version.file.path)}
                                                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                title="Open file in new tab"
                                              >
                                                {version.file.name}
                                              </button>
                                            ) : '-'}
                                          </td>
                                          <td className="p-2 text-center">
                                            <button
                                              onClick={() => handleEditDesignVersion(version)}
                                              className="text-purple-600 hover:text-purple-800 cursor-pointer"
                                              title="Edit"
                                            >
                                              <i className="fa-solid fa-pen"></i>
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 text-xs">No design versions found</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No designs found</p>
                  )}
                </div>
              )}

              {/* Proforma Invoices Tab */}
              {detailTab === 'proforma' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Proforma Invoices</h3>
                  {orderProformaInvoices.length > 0 ? (
                    <div className="space-y-4">
                      {orderProformaInvoices.map(invoice => (
                        <div key={invoice.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-800">{invoice.invoice_no}</h4>
                              <p className="text-xs text-slate-500">Issue Date: {invoice.issue_date || '-'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-800">{invoice.grand_total || 0} {invoice.currency || 'ETB'}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                invoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{invoice.status}</span>
                            </div>
                          </div>
                          {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                            <div className="overflow-x-auto mt-3">
                              <table className="w-full min-w-[400px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Item</th>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Qty</th>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Unit Price</th>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                  {invoice.invoice_items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2">{item.item?.name || '-'}</td>
                                      <td className="p-2">{item.quantity || 0}</td>
                                      <td className="p-2">{item.unit_price || 0}</td>
                                      <td className="p-2">{item.total || 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No proforma invoices found</p>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {detailTab === 'payments' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Payments</h3>
                  {orderPayments.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Payment Date</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Amount</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Method</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Reference</th>
                              <th className="p-3 text-left text-xs font-semibold text-slate-600">Invoice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {orderPayments.map(payment => (
                              <tr key={payment.id}>
                                <td className="p-3">{payment.payment_date || '-'}</td>
                                <td className="p-3 font-medium">{payment.amount_paid || 0}</td>
                                <td className="p-3">{payment.payment_method || '-'}</td>
                                <td className="p-3">{payment.reference_number || '-'}</td>
                                <td className="p-3">{payment.invoice?.invoice_no || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No payments found</p>
                  )}
                </div>
              )}

              {/* Sales Invoices Tab */}
              {detailTab === 'sales' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales Invoices</h3>
                  {orderSalesInvoices.length > 0 ? (
                    <div className="space-y-4">
                      {orderSalesInvoices.map(invoice => (
                        <div key={invoice.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-800">{invoice.invoice_no}</h4>
                              <p className="text-xs text-slate-500">Issue Date: {invoice.issue_date || '-'}</p>
                              <p className="text-xs text-slate-500">Due Date: {invoice.due_date || '-'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-800">{invoice.grand_total || 0} {invoice.currency || 'ETB'}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                invoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{invoice.status}</span>
                            </div>
                          </div>
                          {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                            <div className="overflow-x-auto mt-3">
                              <table className="w-full min-w-[500px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Item</th>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Description</th>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Qty</th>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Unit Price</th>
                                    <th className="p-2 text-left text-xs font-semibold text-slate-600">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                  {invoice.invoice_items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2">{item.item?.name || '-'}</td>
                                      <td className="p-2">{item.description || '-'}</td>
                                      <td className="p-2">{item.quantity || 0}</td>
                                      <td className="p-2">{item.unit_price || 0}</td>
                                      <td className="p-2">{item.total || 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No sales invoices found</p>
                  )}
                </div>
              )}

              {/* Job Orders Tab */}
              {detailTab === 'joborders' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Job Orders</h3>
                  {orderJobOrders.length > 0 ? (
                    <div className="space-y-4">
                      {orderJobOrders.map(jobOrder => (
                        <div key={jobOrder.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-800">{jobOrder.job_no}</h4>
                              <p className="text-xs text-slate-500">Invoice: {jobOrder.invoice?.invoice_no || '-'}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                                jobOrder.order_status === 'Completed' ? 'bg-green-100 text-green-700' :
                                jobOrder.order_status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{jobOrder.order_status}</span>
                              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                                jobOrder.delivery_status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{jobOrder.delivery_status}</span>
                            </div>
                          </div>
                          
                          {/* Deliveries */}
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-slate-700 mb-2">Deliveries</h5>
                            <button
                              onClick={() => fetchJobOrderDeliveries(jobOrder.id)}
                              className="text-blue-600 text-xs hover:underline mb-2 border-none bg-transparent cursor-pointer"
                            >
                              Load Deliveries
                            </button>
                            {jobOrderDeliveries.length > 0 && (
                              <div className="bg-slate-50 rounded-lg p-3">
                                {jobOrderDeliveries.map(delivery => (
                                  <div key={delivery.id} className="text-xs mb-2 last:mb-0">
                                    <span className="font-medium">{delivery.delivery_no}</span> - {delivery.status} - {delivery.scheduled_date || '-'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Installations */}
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-slate-700 mb-2">Installations</h5>
                            <button
                              onClick={() => fetchJobOrderInstallations(jobOrder.id)}
                              className="text-blue-600 text-xs hover:underline mb-2 border-none bg-transparent cursor-pointer"
                            >
                              Load Installations
                            </button>
                            {jobOrderInstallations.length > 0 && (
                              <div className="bg-slate-50 rounded-lg p-3">
                                {jobOrderInstallations.map(installation => (
                                  <div key={installation.id} className="text-xs mb-2 last:mb-0">
                                    <span className="font-medium">{installation.installation_no}</span> - {installation.status} - {installation.scheduled_date || '-'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No job orders found</p>
                  )}
                </div>
              )}

              {/* Feedback Tab */}
              {detailTab === 'feedback' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Feedback</h3>
                    <button
                      onClick={() => {
                        setEditingFeedback(null);
                        setFeedbackForm({ overall_rating: '', product_quality: '', service_quality: '', delivery_timeliness: '', recommend: '', comments: '' });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> Add Feedback
                    </button>
                  </div>

                  {/* Feedback Form */}
                  {(editingFeedback || !orderFeedback.length) && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                      <form onSubmit={handleSaveFeedback}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Overall Rating</label>
                            <select
                              value={feedbackForm.overall_rating}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, overall_rating: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              required
                            >
                              <option value="">Select rating</option>
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Average">Average</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Quality Rating</label>
                            <select
                              value={feedbackForm.quality_rating}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, quality_rating: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                              <option value="">Select rating</option>
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Average">Average</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Staff Service Rating</label>
                            <select
                              value={feedbackForm.staff_service_rating}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, staff_service_rating: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                              <option value="">Select rating</option>
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Average">Average</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Delivery Rating</label>
                            <select
                              value={feedbackForm.delivery_rating}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, delivery_rating: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                              <option value="">Select rating</option>
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Average">Average</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Would Recommend</label>
                            <select
                              value={feedbackForm.recommend}
                              onChange={(e) => setFeedbackForm({ ...feedbackForm, recommend: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                              <option value="">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Comments</label>
                          <textarea
                            value={feedbackForm.comments}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                            rows="3"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="submit"
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                          >
                            {editingFeedback ? 'Update' : 'Submit'} Feedback
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFeedback(null);
                              setFeedbackForm({ overall_rating: '', product_quality: '', service_quality: '', delivery_timeliness: '', recommend: '', comments: '' });
                            }}
                            className="flex-1 sm:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Feedback List */}
                  {orderFeedback.length > 0 && (
                    <div className="space-y-3">
                      {orderFeedback.map(feedback => (
                        <div key={feedback.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{feedback.overall_rating}</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{feedback.recommend}</span>
                            </div>
                            <button
                              onClick={() => handleEditFeedback(feedback)}
                              className="text-blue-600 hover:text-blue-800 text-xs border-none bg-transparent cursor-pointer"
                            >
                              <i className="fa-solid fa-pen"></i> Edit
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{feedback.comments || '-'}</p>
                          <p className="text-xs text-slate-400">Submitted: {new Date(feedback.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Complaints Tab */}
              {detailTab === 'complaints' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Complaints</h3>
                    <button
                      onClick={() => {
                        setEditingComplaint(null);
                        setComplaintForm({ subject: '', description: '', priority: 'Medium' });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> Add Complaint
                    </button>
                  </div>

                  {/* Complaint Form */}
                  {(editingComplaint || !orderComplaints.length) && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                      <form onSubmit={handleSaveComplaint}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
                            <input
                              type="text"
                              value={complaintForm.subject}
                              onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                            <select
                              value={complaintForm.category}
                              onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                              <option value="General">General</option>
                              <option value="Product">Product</option>
                              <option value="Service">Service</option>
                              <option value="Delivery">Delivery</option>
                              <option value="Billing">Billing</option>
                            </select>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                          <textarea
                            value={complaintForm.description}
                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                            rows="3"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="submit"
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                          >
                            {editingComplaint ? 'Update' : 'Submit'} Complaint
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingComplaint(null);
                              setComplaintForm({ subject: '', description: '', priority: 'Medium' });
                            }}
                            className="flex-1 sm:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Complaints List */}
                  {orderComplaints.length > 0 && (
                    <div className="space-y-3">
                      {orderComplaints.map(complaint => (
                        <div key={complaint.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">{complaint.subject}</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{complaint.category || 'General'}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{complaint.status}</span>
                            </div>
                            <button
                              onClick={() => handleEditComplaint(complaint)}
                              className="text-blue-600 hover:text-blue-800 text-xs border-none bg-transparent cursor-pointer"
                            >
                              <i className="fa-solid fa-pen"></i> Edit
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{complaint.description || '-'}</p>
                          {complaint.resolution && (
                            <p className="text-xs text-slate-600 mb-2"><strong>Resolution:</strong> {complaint.resolution}</p>
                          )}
                          <p className="text-xs text-slate-400">Submitted: {new Date(complaint.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Warranty Tab */}
              {detailTab === 'warranty' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Warranty</h3>
                    <button
                      onClick={() => {
                        setEditingWarranty(null);
                        setWarrantyForm({ product_name: '', serial_no: '', issue_description: '', warranty_type: '' });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> Add Warranty Claim
                    </button>
                  </div>

                  {/* Warranty Form */}
                  {(editingWarranty || !orderWarranty.length) && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                      <form onSubmit={handleSaveWarranty}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Product Name</label>
                            <input
                              type="text"
                              value={warrantyForm.product_name}
                              onChange={(e) => setWarrantyForm({ ...warrantyForm, product_name: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Serial Number</label>
                            <input
                              type="text"
                              value={warrantyForm.serial_no}
                              onChange={(e) => setWarrantyForm({ ...warrantyForm, serial_no: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Claim Type</label>
                            <select
                              value={warrantyForm.claim_type}
                              onChange={(e) => setWarrantyForm({ ...warrantyForm, claim_type: e.target.value })}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            >
                              <option value="">Select type</option>
                              <option value="Defect">Defect</option>
                              <option value="Damage">Damage</option>
                              <option value="Malfunction">Malfunction</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Defect Description</label>
                          <textarea
                            value={warrantyForm.defect_description}
                            onChange={(e) => setWarrantyForm({ ...warrantyForm, defect_description: e.target.value })}
                            rows="3"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="submit"
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                          >
                            {editingWarranty ? 'Update' : 'Submit'} Warranty Claim
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWarranty(null);
                              setWarrantyForm({ product_name: '', serial_no: '', issue_description: '', warranty_type: '' });
                            }}
                            className="flex-1 sm:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-medium border-none cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Warranty List */}
                  {orderWarranty.length > 0 && (
                    <div className="space-y-3">
                      {orderWarranty.map(warranty => (
                        <div key={warranty.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">{warranty.product_name}</span>
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">{warranty.serial_no || '-'}</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{warranty.claim_type || '-'}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                warranty.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                warranty.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                warranty.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{warranty.status}</span>
                            </div>
                            <button
                              onClick={() => handleEditWarranty(warranty)}
                              className="text-blue-600 hover:text-blue-800 text-xs border-none bg-transparent cursor-pointer"
                            >
                              <i className="fa-solid fa-pen"></i> Edit
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{warranty.defect_description || '-'}</p>
                          {warranty.resolution && (
                            <p className="text-xs text-slate-600 mb-2"><strong>Resolution:</strong> {warranty.resolution}</p>
                          )}
                          <p className="text-xs text-slate-400">Submitted: {new Date(warranty.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Design Version Edit Modal */}
      {editingDesignVersion && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">Edit Design Version v{editingDesignVersion.version_number}</h3>
              <button
                onClick={() => {
                  setEditingDesignVersion(null);
                  setDesignVersionForm({ status: '', comment: '' });
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select
                  value={designVersionForm.status}
                  onChange={(e) => setDesignVersionForm({ ...designVersionForm, status: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select status</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Comment</label>
                <textarea
                  value={designVersionForm.comment}
                  onChange={(e) => setDesignVersionForm({ ...designVersionForm, comment: e.target.value })}
                  rows={3}
                  placeholder="Add your comments..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setEditingDesignVersion(null);
                    setDesignVersionForm({ status: '', comment: '' });
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDesignVersion}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
