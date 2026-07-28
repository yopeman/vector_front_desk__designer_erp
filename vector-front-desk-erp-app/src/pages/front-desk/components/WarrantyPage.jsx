import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState(null);
  const [formData, setFormData] = useState({
    assigned_to: '',
    resolution: '',
    status: 'New'
  });

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .select('*, order:orders(order_no), client:clients(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarranties(data || []);
    } catch (error) {
      console.error('Error fetching warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('warranties')
        .update({
          assigned_to: formData.assigned_to,
          resolution: formData.resolution,
          status: formData.status,
          closed_at: formData.status === 'Approved' || formData.status === 'Rejected' || formData.status === 'Closed' ? new Date().toISOString() : null
        })
        .eq('id', editingWarranty.id);

      if (error) throw error;
      alert('Warranty updated successfully!');

      setShowModal(false);
      setEditingWarranty(null);
      setFormData({
        assigned_to: '',
        resolution: '',
        status: 'New'
      });
      await fetchWarranties();
    } catch (error) {
      console.error('Error updating warranty:', error);
      alert('Error updating warranty: ' + error.message);
    }
  };

  const handleEdit = (warranty) => {
    setEditingWarranty(warranty);
    setFormData({
      assigned_to: warranty.assigned_to || '',
      resolution: warranty.resolution || '',
      status: warranty.status || 'New'
    });
    setShowModal(true);
  };

  const handleShow = (warranty) => {
    setEditingWarranty(warranty);
    setFormData({
      assigned_to: warranty.assigned_to || '',
      resolution: warranty.resolution || '',
      status: warranty.status || 'New'
    });
    setShowModal(true);
  };

  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = warranty.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         warranty.order?.order_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         warranty.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         warranty.serial_no?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || warranty.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Warranty</h2>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by client, order no, product, or serial no..."
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
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Client</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Order No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Product Name</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Serial No</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Claim Type</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Assigned To</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredWarranties.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-400">
                  No warranties found
                </td>
              </tr>
            ) : (
              filteredWarranties.map((warranty, index) => (
                <tr key={warranty.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4">{warranty.client?.name || '-'}</td>
                  <td className="p-4">{warranty.order?.order_no || '-'}</td>
                  <td className="p-4">{warranty.product_name || '-'}</td>
                  <td className="p-4">{warranty.serial_no || '-'}</td>
                  <td className="p-4">{warranty.claim_type || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      warranty.status === 'Approved' || warranty.status === 'Closed' ? 'bg-green-100 text-green-700' :
                      warranty.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      warranty.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {warranty.status}
                    </span>
                  </td>
                  <td className="p-4">{warranty.assigned_to || '-'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleShow(warranty)}
                      className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Show"
                    >
                      <i className="fa-solid fa-eye"></i> Show
                    </button>
                    <button
                      onClick={() => handleEdit(warranty)}
                      className="text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && editingWarranty && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg mt-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                Warranty Details
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingWarranty(null);
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Client:</span>
                      <span className="ml-2 font-medium">{editingWarranty.client?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Order No:</span>
                      <span className="ml-2 font-medium">{editingWarranty.order?.order_no || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Filed At:</span>
                      <span className="ml-2 font-medium">{editingWarranty.filed_at ? new Date(editingWarranty.filed_at).toLocaleString() : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Product Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Product Name:</span>
                      <span className="ml-2 font-medium">{editingWarranty.product_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Serial No:</span>
                      <span className="ml-2 font-medium">{editingWarranty.serial_no || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Purchase Date:</span>
                      <span className="ml-2 font-medium">{editingWarranty.purchase_date || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Warranty Expiry:</span>
                      <span className="ml-2 font-medium">{editingWarranty.warranty_expiry || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Claim Details</h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Claim Type:</span>
                      <span className="ml-2 font-medium">{editingWarranty.claim_type || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Defect Description:</span>
                      <p className="mt-1 text-slate-700">{editingWarranty.defect_description || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Resolution</label>
                  <textarea
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    rows="4"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingWarranty(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
                >
                  <i className="fa-solid fa-check mr-2"></i>Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
