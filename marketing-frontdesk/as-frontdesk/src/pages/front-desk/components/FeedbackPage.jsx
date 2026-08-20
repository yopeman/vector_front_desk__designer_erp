import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [previewFeedback, setPreviewFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage, itemsPerPage]);

  const fetchFeedbacks = async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('feedbacks')
        .select('*, order:orders(order_no), client:clients(name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`client.name.ilike.%${searchQuery}%,order.order_no.ilike.%${searchQuery}%`);
      }

      // Apply rating filter
      if (ratingFilter !== 'All') {
        query = query.eq('overall_rating', ratingFilter);
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      setFeedbacks(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = (feedback) => {
    setPreviewFeedback(feedback);
    setShowPreviewModal(true);
  };

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ratingFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Feedback</h2>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by client or order no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="All">All Ratings</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Overall Rating</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Recommend</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Submitted At</th>
              <th className="p-4 text-center text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  No feedback found
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback, index) => (
                <tr key={feedback.id} className="hover:bg-slate-50">
                  <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-4">{feedback.client?.name || '-'}</td>
                  <td className="p-4">{feedback.order?.order_no || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feedback.overall_rating === 'Excellent' ? 'bg-green-100 text-green-700' :
                      feedback.overall_rating === 'Good' ? 'bg-blue-100 text-blue-700' :
                      feedback.overall_rating === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {feedback.overall_rating}
                    </span>
                  </td>
                  <td className="p-4">{feedback.recommend || '-'}</td>
                  <td className="p-4">{feedback.submitted_at ? new Date(feedback.submitted_at).toLocaleDateString() : '-'}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleShow(feedback)}
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
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
        <div className="text-sm text-slate-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} feedback
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

      {/* Preview Modal */}
      {showPreviewModal && previewFeedback && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Feedback Details</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewFeedback(null);
                }}
                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Client:</span>
                    <span className="ml-2 font-medium">{previewFeedback.client?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Order No:</span>
                    <span className="ml-2 font-medium">{previewFeedback.order?.order_no || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Submitted At:</span>
                    <span className="ml-2 font-medium">{previewFeedback.submitted_at ? new Date(previewFeedback.submitted_at).toLocaleString() : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Ratings</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Overall Rating:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      previewFeedback.overall_rating === 'Excellent' ? 'bg-green-100 text-green-700' :
                      previewFeedback.overall_rating === 'Good' ? 'bg-blue-100 text-blue-700' :
                      previewFeedback.overall_rating === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {previewFeedback.overall_rating}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Delivery Rating:</span>
                    <span className="ml-2 font-medium">{previewFeedback.delivery_rating || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Quality Rating:</span>
                    <span className="ml-2 font-medium">{previewFeedback.quality_rating || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Staff Service Rating:</span>
                    <span className="ml-2 font-medium">{previewFeedback.staff_service_rating || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Recommend:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      previewFeedback.recommend === 'Yes' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {previewFeedback.recommend}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Comments</h3>
                <p className="text-sm text-slate-700">{previewFeedback.comments || 'No comments provided'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
