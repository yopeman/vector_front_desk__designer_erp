import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [formData, setFormData] = useState({
    assigned_to: '',
    resolution: '',
    status: 'New'
  });

  useEffect(() => {
    fetchComplaints();
  }, [currentPage, itemsPerPage]);

  const fetchComplaints = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('complaints')
        .select('*, order:orders(order_no), client:clients(name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`client.name.ilike.%${searchQuery}%,order.order_no.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      setComplaints(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get current user (simplified - in real app, use auth context)
      const currentUser = localStorage.getItem('username') || 'Admin';

      const { error } = await supabase
        .from('complaints')
        .update({
          assigned_to: formData.assigned_to,
          resolution: formData.resolution,
          status: formData.status,
          resolved_at: formData.status === 'Resolved' || formData.status === 'Closed' ? new Date().toISOString() : null
        })
        .eq('id', editingComplaint.id);

      if (error) throw error;
      alert('Complaint updated successfully!');

      setShowModal(false);
      setEditingComplaint(null);
      setFormData({
        assigned_to: '',
        resolution: '',
        status: 'New'
      });
      await fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Error updating complaint: ' + error.message);
    }
  };

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      assigned_to: complaint.assigned_to || '',
      resolution: complaint.resolution || '',
      status: complaint.status || 'New'
    });
    setShowModal(true);
  };

  const handleShow = (complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      assigned_to: complaint.assigned_to || '',
      resolution: complaint.resolution || '',
      status: complaint.status || 'New'
    });
    setShowModal(true);
  };

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Complaints</h2>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by client, order no, or subject..."
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
              <option value="Resolved">Resolved</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Subject</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Category</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Assigned To</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400">
                  No complaints found
                </td>
              </tr>
            ) : (
              complaints.map((complaint, index) => (
                <tr key={complaint.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-4">{complaint.client?.name || '-'}</td>
                  <td className="p-4">{complaint.order?.order_no || '-'}</td>
                  <td className="p-4">{complaint.subject || '-'}</td>
                  <td className="p-4">{complaint.category || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-green-100 text-green-700' :
                      complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="p-4">{complaint.assigned_to || '-'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleShow(complaint)}
                      className="text-purple-600 hover:text-purple-800 bg-transparent border-none cursor-pointer mr-2"
                      title="Show"
                    >
                      <i className="fa-solid fa-eye"></i> Show
                    </button>
                    <button
                      onClick={() => handleEdit(complaint)}
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

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} complaints
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
      {showModal && editingComplaint && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg mt-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                Complaint Details
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingComplaint(null);
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
                      <span className="ml-2 font-medium">{editingComplaint.client?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Order No:</span>
                      <span className="ml-2 font-medium">{editingComplaint.order?.order_no || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Logged At:</span>
                      <span className="ml-2 font-medium">{editingComplaint.logged_at ? new Date(editingComplaint.logged_at).toLocaleString() : '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Complaint Details</h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Subject:</span>
                      <span className="ml-2 font-medium">{editingComplaint.subject || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <span className="ml-2 font-medium">{editingComplaint.category || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Severity:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        editingComplaint.severity === 'High' ? 'bg-red-100 text-red-700' :
                        editingComplaint.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {editingComplaint.severity}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Description:</span>
                      <p className="mt-1 text-slate-700">{editingComplaint.description || '-'}</p>
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
                    <option value="Resolved">Resolved</option>
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
                    setEditingComplaint(null);
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
