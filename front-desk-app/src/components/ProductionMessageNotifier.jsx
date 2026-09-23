import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { getOpenProductionChat } from '../lib/productionChatState';

const POLL_INTERVAL = 5000;

export default function ProductionMessageNotifier() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const knownIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const checkingRef = useRef(false);
  const profileRef = useRef(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;
    if (profile.role !== 'designer' && profile.role !== 'front_desk') return;

    const isRelevant = (order, row, me) => {
      if (me.role === 'designer') {
        return order?.designer_id === me.id;
      }
      if (me.role === 'front_desk') {
        return true;
      }
      return false;
    };

    const buildNotice = async (row, me) => {
      // Already handled by the open Active Work chat modal
      if (getOpenProductionChat() === row.production_order_id) return null;

      const { data: order } = await supabase
        .from('production_orders')
        .select('id, task_type, status, material, designer_id, order_id')
        .eq('id', row.production_order_id)
        .maybeSingle();

      if (!isRelevant(order, row, me)) return null;
      if (order?.status !== 'In Progress') return null;

      const { data: sender } = await supabase
        .from('users')
        .select('username')
        .eq('id', row.sender_id)
        .maybeSingle();

      let orderNo = null;
      if (order?.order_id) {
        const { data: o } = await supabase
          .from('orders')
          .select('order_no')
          .eq('id', order.order_id)
          .maybeSingle();
        orderNo = o?.order_no || null;
      }

      return {
        id: row.id,
        productionOrderId: row.production_order_id,
        senderName: sender?.username || 'Unknown',
        message: row.message,
        orderNo,
        material: order?.material || null,
      };
    };

    const handleRow = async (row) => {
      const me = profileRef.current;
      if (!me?.id || row.sender_id === me.id) return;
      const built = await buildNotice(row, me);
      if (built) setNotice(built);
    };

    const checkForNewMessages = async () => {
      const me = profileRef.current;
      if (!me?.id || checkingRef.current) return;
      checkingRef.current = true;
      try {
        const { data, error } = await supabase
          .from('production_communications')
          .select('id, production_order_id, sender_id, message, is_read, created_at')
          .neq('sender_id', me.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error || !data) return;

        // First run: remember existing messages, only surface the latest unread
        if (!initializedRef.current) {
          data.forEach((row) => knownIdsRef.current.add(row.id));
          initializedRef.current = true;
          const latestUnread = data.find((row) => !row.is_read);
          if (latestUnread) await handleRow(latestUnread);
          return;
        }

        const fresh = data.filter((row) => !knownIdsRef.current.has(row.id));
        fresh.forEach((row) => knownIdsRef.current.add(row.id));

        // Oldest first so the newest notice wins
        for (const row of fresh.reverse()) {
          await handleRow(row);
        }
      } catch (error) {
        console.error('Error checking new production messages:', error);
      } finally {
        checkingRef.current = false;
      }
    };

    checkForNewMessages();
    const interval = setInterval(checkForNewMessages, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [profile?.id, profile?.role]);

  if (!notice) return null;

  const handleView = () => {
    navigate(profile?.role === 'designer' ? '/designers' : '/frontdesk');
    setNotice(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={() => setNotice(null)}
    >
      <div
        className="w-full max-w-sm bg-red-600 border border-red-700 rounded-xl shadow-xl p-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-comment-dots text-white text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">New message on active work</p>
            {(notice.orderNo || notice.material) && (
              <p className="text-[11px] text-red-100 mt-0.5">
                {notice.orderNo ? `Order ${notice.orderNo}` : ''}
                {notice.orderNo && notice.material ? ' • ' : ''}
                {notice.material || ''}
              </p>
            )}
            <p className="text-xs text-red-50 mt-1 break-words">
              {notice.senderName}: {notice.message}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={handleView}
                className="bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="bg-transparent border border-white/60 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}