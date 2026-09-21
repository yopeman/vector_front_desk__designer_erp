import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { getOpenDesignChat } from '../lib/designChatState';

const POLL_INTERVAL = 5000;

export default function DesignMessageNotifier() {
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

    const isRelevant = (design, row, me) => {
      const isDesignerForDesign = design?.assigned_designer_id === me.id;
      const isReceiver = row.receiver_id === me.id;
      const isOverseer =
        me.role === 'front_desk' ||
        me.role === 'admin' ||
        me.role === 'admin_marketer';
      return isDesignerForDesign || isReceiver || isOverseer;
    };

    const buildNotice = async (row, me) => {
      // Already handled by the open design detail modal
      if (getOpenDesignChat() === row.design_id) return null;

      const { data: design } = await supabase
        .from('designs')
        .select('id, design_type, status, assigned_designer_id, order_id')
        .eq('id', row.design_id)
        .maybeSingle();

      if (!isRelevant(design, row, me)) return null;

      const { data: sender } = await supabase
        .from('users')
        .select('username')
        .eq('id', row.sender_id)
        .maybeSingle();

      let orderNo = null;
      if (design?.order_id) {
        const { data: order } = await supabase
          .from('orders')
          .select('order_no')
          .eq('id', design.order_id)
          .maybeSingle();
        orderNo = order?.order_no || null;
      }

      return {
        id: row.id,
        designId: row.design_id,
        senderName: sender?.username || 'Unknown',
        message: row.message,
        orderNo,
        designType: design?.design_type || null,
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
          .from('design_communications')
          .select('id, design_id, sender_id, receiver_id, message, is_read, created_at')
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
        console.error('Error checking new design messages:', error);
      } finally {
        checkingRef.current = false;
      }
    };

    checkForNewMessages();
    const interval = setInterval(checkForNewMessages, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [profile?.id]);

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
        className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-comment-dots text-blue-600 text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">New message in active design</p>
            {(notice.orderNo || notice.designType) && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {notice.orderNo ? `Order ${notice.orderNo}` : ''}
                {notice.orderNo && notice.designType ? ' • ' : ''}
                {notice.designType || ''}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1 break-words">
              {notice.senderName}: {notice.message}
            </p>
            <div className="flex gap-2 mt-3">
              {/* <button
                type="button"
                onClick={handleView}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer"
              >
                View
              </button> */}
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
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
