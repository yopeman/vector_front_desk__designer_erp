import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SelfUpdateForm from './client-portal/SelfUpdateForm';

export default function ClientPage() {
  const { client_id } = useParams();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback form
  const [fbOverall, setFbOverall] = useState('');
  const [fbComment, setFbComment] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  useEffect(() => {
    if (client_id) fetchClientData();
  }, [client_id]);

  async function fetchClientData() {
    setLoading(true);
    const [clientRes, ordersRes, feedbacksRes, visitsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', client_id).single(),
      supabase.from('orders').select('*').eq('client_id', client_id).order('created_at', { ascending: false }),
      supabase.from('feedbacks').select('*').eq('client_id', client_id).order('created_at', { ascending: false }),
      supabase.from('site_visits').select('*').eq('client_id', client_id).order('created_at', { ascending: false }),
    ]);
    if (clientRes.data) setClient(clientRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (feedbacksRes.data) setFeedbacks(feedbacksRes.data);
    if (visitsRes.data) setSiteVisits(visitsRes.data);
    setLoading(false);
  }

  async function submitFeedback(e) {
    e.preventDefault();
    if (!fbOverall || !fbComment.trim()) return;
    setFbSubmitting(true);
    await supabase.from('feedbacks').insert({
      client_id,
      order_id: null,
      overall_rating: fbOverall,
      quality_rating: fbOverall,
      delivery_rating: fbOverall,
      staff_service_rating: fbOverall,
      comments: fbComment,
      recommend: 'Yes',
    });
    setFbOverall('');
    setFbComment('');
    setFbSubmitting(false);
    fetchClientData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <a href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </a>
          <h1 className="text-xl font-bold text-gray-800 mt-2">{client.name}</h1>
          <p className="text-sm text-gray-500">
            {client.company_name && `${client.company_name} · `}
            {client.city && `${client.city}`}
            {client.phone && ` · ${client.phone}`}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Self-update form (respects allow_self_update + client_type) */}
        <SelfUpdateForm client={client} onUpdated={fetchClientData} />

        {/* Orders */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Orders</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600">Order No</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="px-6 py-3 font-medium text-gray-800">{o.order_no}</td>
                  <td className="px-6 py-3 text-gray-600">{o.order_date || '-'}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    ETB {Number(o.total_amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Site Visits */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Site Visits</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600">Purpose</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Priority</th>
              </tr>
            </thead>
            <tbody>
              {siteVisits.map((v) => (
                <tr key={v.id} className="border-t border-gray-100">
                  <td className="px-6 py-3 font-medium text-gray-800">{v.visit_purpose || '-'}</td>
                  <td className="px-6 py-3 text-gray-600">{v.requested_date || '-'}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">
                      {v.priority}
                    </span>
                  </td>
                </tr>
              ))}
              {siteVisits.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No site visits yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Feedbacks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submit Feedback */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-base font-bold text-gray-800 mb-4">Submit Feedback</h2>
            <form onSubmit={submitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Overall Rating
                </label>
                <select
                  value={fbOverall}
                  onChange={(e) => setFbOverall(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Select rating</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Comments
                </label>
                <textarea
                  value={fbComment}
                  onChange={(e) => setFbComment(e.target.value)}
                  placeholder="Share your feedback..."
                  rows={4}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={fbSubmitting}
                className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                {fbSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>

          {/* Feedback History */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-base font-bold text-gray-800 mb-4">Feedback History</h2>
            {feedbacks.length === 0 && (
              <p className="text-sm text-gray-400">No feedback yet.</p>
            )}
            <div className="space-y-3">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">
                      {fb.overall_rating}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{fb.comments}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}