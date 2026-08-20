import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SelfUpdateForm from './client-portal/SelfUpdateForm';
import OrdersPage from './client-portal/OrdersPage';

export default function ClientPage() {
  const { client_id } = useParams();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteVisitSearch, setSiteVisitSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [selectedSiteVisit, setSelectedSiteVisit] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Feedback form
  const [fbOverall, setFbOverall] = useState('');
  const [fbComment, setFbComment] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  useEffect(() => {
    if (client_id) fetchClientData();
  }, [client_id]);

  async function fetchClientData() {
    setLoading(true);
    const [clientRes, ordersRes, feedbacksRes, visitsRes, itemsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', client_id).single(),
      supabase.from('orders').select('*').eq('client_id', client_id).order('created_at', { ascending: false }),
      supabase.from('feedbacks').select('*').eq('client_id', client_id).order('created_at', { ascending: false }),
      supabase.from('site_visits').select('*').eq('client_id', client_id).order('created_at', { ascending: false }),
      supabase.from('items').select('*').order('name', { ascending: true }),
    ]);
    if (clientRes.data) setClient(clientRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (feedbacksRes.data) setFeedbacks(feedbacksRes.data);
    if (visitsRes.data) setSiteVisits(visitsRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
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
      <header className="px-6 py-4" style={{ backgroundColor: '#00ced1' }}>
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-xl font-bold text-white text-center">V☰CTOR Advert & Manufacturing</h1>
            </div>
          </div>
      </header>

        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-700 mt-2">{client.name}</h2>
          <p className="text-sm text-gray-500">
            {client.company_name && `${client.company_name} · `}
            {client.city && `${client.city}`}
            {client.phone && ` · ${client.phone}`}
          </p>
        </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Self-update form (respects allow_self_update + client_type) */}
        <SelfUpdateForm client={client} onUpdated={fetchClientData} />

        {/* Site Visits */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4">
            <h2 className="text-base font-bold text-gray-800">Site Visits</h2>
            <input
              type="text"
              placeholder="Search site visits..."
              value={siteVisitSearch}
              onChange={(e) => setSiteVisitSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Request No</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Purpose</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">City</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Priority</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {siteVisits.filter(v => 
                  (v.request_no?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.visit_purpose?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.city?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.detailed_address?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.contact_person?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase())
                ).map((v, index) => (
                  <tr key={v.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 text-center text-gray-500">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{v.request_no || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{v.visit_purpose || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{v.city || '-'}</td>
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
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setSelectedSiteVisit(v)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {siteVisits.filter(v => 
                  (v.request_no?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.visit_purpose?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.city?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.detailed_address?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase()) ||
                  (v.contact_person?.toLowerCase() || '').includes(siteVisitSearch.toLowerCase())
                ).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No site visits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4">
            <h2 className="text-base font-bold text-gray-800">Items</h2>
            <input
              type="text"
              placeholder="Search items..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Name</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Pcs</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Kilo</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Care</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Liter</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Meter</th>
                  <th className="px-6 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(item => 
                  (item.name?.toLowerCase() || '').includes(itemSearch.toLowerCase())
                ).map((item, index) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-6 py-3 text-center text-gray-500">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{item.name || '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{item.pcs || 0}</td>
                    <td className="px-6 py-3 text-gray-600">{item.kilo || 0}</td>
                    <td className="px-6 py-3 text-gray-600">{item.care || 0}</td>
                    <td className="px-6 py-3 text-gray-600">{item.liter || 0}</td>
                    <td className="px-6 py-3 text-gray-600">{item.meter || 0}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {items.filter(item => 
                  (item.name?.toLowerCase() || '').includes(itemSearch.toLowerCase())
                ).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders */}
        <OrdersPage clientId={client_id} />

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

      {/* Site Visit Details Modal */}
      {selectedSiteVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Site Visit Details</h3>
              <button
                onClick={() => setSelectedSiteVisit(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Request No</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.request_no || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Purpose</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.visit_purpose || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">City</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.city || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Detailed Address</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.detailed_address || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Requested Date</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.requested_date || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Preferred Date</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.preferred_date || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Preferred Time</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.preferred_time || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Requested By</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.requested_by || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Installation Team</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.installation_team || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Contact Person</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.contact_person || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Phone</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Email</label>
                  <p className="text-sm text-gray-800">{selectedSiteVisit.email || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Status</label>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    {selectedSiteVisit.status}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Priority</label>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">
                    {selectedSiteVisit.priority}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Equipment Review</label>
                <p className="text-sm text-gray-800">{selectedSiteVisit.equipment_review || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Special Instructions</label>
                <p className="text-sm text-gray-800">{selectedSiteVisit.special_instructions || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Item Details</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">Name</label>
                <p className="text-sm text-gray-800">{selectedItem.name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Pcs</label>
                  <p className="text-sm text-gray-800">{selectedItem.pcs || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Kilo</label>
                  <p className="text-sm text-gray-800">{selectedItem.kilo || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Care</label>
                  <p className="text-sm text-gray-800">{selectedItem.care || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Liter</label>
                  <p className="text-sm text-gray-800">{selectedItem.liter || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Meter</label>
                  <p className="text-sm text-gray-800">{selectedItem.meter || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Pack</label>
                  <p className="text-sm text-gray-800">{selectedItem.pack || 0}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Gram</label>
                  <p className="text-sm text-gray-800">{selectedItem.gram || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
