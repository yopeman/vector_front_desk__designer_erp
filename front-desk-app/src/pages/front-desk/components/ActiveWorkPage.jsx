import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import ProductionChatPanel from '../../../components/ProductionChatPanel';

export default function ActiveWorkPage() {
  const { profile } = useAuth();
  const [productionOrders, setProductionOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('details');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [unreadProdChatIds, setUnreadProdChatIds] = useState(() => new Set());

  useEffect(() => {
    fetchActiveProductionOrders();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    const checkUnreadProdChat = async () => {
      const { data: activeOrders, error: orderError } = await supabase
        .from('production_orders')
        .select('id')
        .eq('status', 'In Progress');

      if (orderError) return;

      const activeIds = (activeOrders || []).map((o) => o.id);
      if (activeIds.length === 0) {
        setUnreadProdChatIds(new Set());
        return;
      }

      const { data, error } = await supabase
        .from('production_communications')
        .select('production_order_id')
        .eq('is_read', false)
        .neq('sender_id', profile.id)
        .in('production_order_id', activeIds);

      if (!error) {
        setUnreadProdChatIds(new Set((data || []).map((row) => row.production_order_id)));
      }
    };

    checkUnreadProdChat();
    const interval = setInterval(checkUnreadProdChat, 5000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  const fetchActiveProductionOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('production_orders')
        .select('*, orders(order_no, clients(name)), machines(name, machine_type), designer:users(username), job_order:job_orders(job_no)')
        .eq('status', 'In Progress')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductionOrders(data || []);
    } catch (error) {
      console.error('Error fetching active production orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (order) => {
    setSelectedOrder(order);
    setModalTab('details');
    setShowModal(true);

    if (order.attached_file_ids && order.attached_file_ids.length > 0) {
      try {
        const { data: files, error } = await supabase
          .from('files')
          .select('*')
          .in('id', order.attached_file_ids);

        if (error) throw error;
        setAttachedFiles(files || []);

        const urls = {};
        for (const file of files || []) {
          urls[file.id] = await getFileUrl(file.path);
        }
        setFileUrls(urls);
      } catch (error) {
        console.error('Error fetching files:', error);
        setAttachedFiles([]);
        setFileUrls({});
      }
    } else {
      setAttachedFiles([]);
      setFileUrls({});
    }
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

  const filteredOrders = productionOrders.filter((order) => {
    const matchesSearch =
      (order.task_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.orders?.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.orders?.clients?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.machines?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (order.designer?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Active Work - In Progress</h2>
          <p className="text-xs text-slate-500 mt-1">Production work currently being produced and its related communication</p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-sm flex items-center gap-2">
          <i className="fa-solid fa-industry text-blue-500"></i>
          <span>{productionOrders.length}</span> active jobs
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by task, order, client, machine, or designer..."
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
              <option value="In Progress">In Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          <i className="fa-solid fa-industry text-4xl mb-4"></i>
          <p className="text-sm">No active production work found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">#</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Order</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Task Type</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Material</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Machine</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Designer</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Priority</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="p-4 text-center text-xs font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map((order, index) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleOrderClick(order)}
                >
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">
                    <span className="flex items-center gap-2">
                      {unreadProdChatIds.has(order.id) && (
                        <span className="w-2 h-2 rounded-full bg-red-500" title="Unread chat"></span>
                      )}
                      {order.orders?.order_no || '-'}
                    </span>
                  </td>
                  <td className="p-4">{order.task_type || '-'}</td>
                  <td className="p-4">
                    {order.material || '-'}{order.thickness ? ` / ${order.thickness}` : ''}{order.color ? ` / ${order.color}` : ''}
                  </td>
                  <td className="p-4">
                    {order.machines?.name || '-'} {order.machines?.machine_type ? `(${order.machines.machine_type})` : ''}
                  </td>
                  <td className="p-4">{order.designer?.username || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.priority === 'High' ? 'bg-red-100 text-red-700' :
                      order.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOrderClick(order); }}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                      title="View Details"
                    >
                      <i className="fa-solid fa-eye"></i> Show
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 mt-16">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Active Work Details</h2>
                <p className="text-sm text-slate-500">
                  {selectedOrder.orders?.order_no || '-'} • {selectedOrder.material || '-'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                  setAttachedFiles([]);
                  setFileUrls({});
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="flex gap-2 px-6 pt-4 border-b border-slate-200">
              <button
                onClick={() => setModalTab('details')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${modalTab === 'details' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <i className="fa-solid fa-circle-info mr-1.5"></i> Details
              </button>
              <button
                onClick={() => setModalTab('communication')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${modalTab === 'communication' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <i className="fa-solid fa-comments mr-1.5"></i> Communication
              </button>
            </div>

            {modalTab === 'communication' ? (
              <div className="p-6">
                <ProductionChatPanel productionOrderId={selectedOrder.id} height="460px" />
              </div>
            ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Task Type</label>
                  <input
                    type="text"
                    value={selectedOrder.task_type || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Client</label>
                  <input
                    type="text"
                    value={selectedOrder.orders?.clients?.name || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Machine</label>
                  <input
                    type="text"
                    value={`${selectedOrder.machines?.name || '-'} ${selectedOrder.machines?.machine_type ? `(${selectedOrder.machines.machine_type})` : ''}`}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Designer</label>
                  <input
                    type="text"
                    value={selectedOrder.designer?.username || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Job No</label>
                  <input
                    type="text"
                    value={selectedOrder.job_order?.job_no || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <input
                    type="text"
                    value={selectedOrder.status || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Length</label>
                  <input
                    type="text"
                    value={selectedOrder.length || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Width</label>
                  <input
                    type="text"
                    value={selectedOrder.width || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Height</label>
                  <input
                    type="text"
                    value={selectedOrder.height || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Gram</label>
                  <input
                    type="text"
                    value={selectedOrder.gram || '-'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <textarea
                  value={selectedOrder.note || ''}
                  readOnly
                  rows="2"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 resize-none"
                  placeholder="No note"
                />
              </div>

              {/* Attached Files */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Attached Files</label>
                {attachedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {attachedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-file text-blue-500"></i>
                          {fileUrls[file.id] ? (
                            <a
                              href={fileUrls[file.id]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-slate-700 hover:text-blue-600 transition-colors"
                            >
                              {file.name}
                            </a>
                          ) : (
                            <span className="text-sm text-slate-700">{file.name}</span>
                          )}
                          <span className="text-xs text-slate-500">
                            ({(file.file_size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">No attached files</div>
                )}
              </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}