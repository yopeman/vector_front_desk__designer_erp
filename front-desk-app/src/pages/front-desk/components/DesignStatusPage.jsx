import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import DesignDetailModal from './DesignDetailModal';

export default function DesignStatusPage() {
  const { profile } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [unreadDesignChatIds, setUnreadDesignChatIds] = useState(() => new Set());

  useEffect(() => {
    fetchInProgressDesigns();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    const checkUnreadDesignChat = async () => {
      const { data, error } = await supabase
        .from('design_communications')
        .select('design_id')
        .eq('is_read', false)
        .neq('sender_id', profile.id);

      if (!error) {
        setUnreadDesignChatIds(new Set((data || []).map((row) => row.design_id)));
      }
    };

    checkUnreadDesignChat();
    const interval = setInterval(checkUnreadDesignChat, 5000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  const fetchInProgressDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*, order:orders(order_no, clients(name)), assigned_designer:users(username), design_versions(*)')
        .eq('status', 'In Progress')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching in-progress designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = 
      (design.design_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.purpose?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.order?.order_no?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (design.order?.clients?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleDesignClick = (design) => {
    setSelectedDesign(design);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDesign(null);
  };

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
        <h2 className="text-xl font-bold text-slate-800">Design Status - In Progress</h2>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by type, purpose, order no, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
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
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Design Type</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Purpose</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Requested Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Required Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Priority</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600">Assigned Designer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredDesigns.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-8 text-center text-slate-400">
                  No in-progress designs found
                </td>
              </tr>
            ) : (
              filteredDesigns.map((design, index) => (
                <tr 
                  key={design.id} 
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleDesignClick(design)}
                >
                  <td className="p-4 text-center">{index + 1}</td>
                  <td className="p-4 font-medium">
                    <span className="flex items-center gap-2">
                      {unreadDesignChatIds.has(design.id) && (
                        <span className="w-2 h-2 rounded-full bg-red-500" title="Unread chat"></span>
                      )}
                      {design.order?.order_no || '-'}
                    </span>
                  </td>
                  <td className="p-4">{design.order?.clients?.name || '-'}</td>
                  <td className="p-4">{design.design_type || '-'}</td>
                  <td className="p-4">{design.purpose || '-'}</td>
                  <td className="p-4">{design.requested_date || '-'}</td>
                  <td className="p-4">{design.required_date || '-'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {design.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      design.priority === 'High' ? 'bg-red-100 text-red-700' :
                      design.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {design.priority}
                    </span>
                  </td>
                  <td className="p-4">{design.assigned_designer?.username || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Design Detail Modal */}
      {showModal && selectedDesign && (
        <DesignDetailModal design={selectedDesign} onClose={handleCloseModal} />
      )}
    </div>
  );
}
