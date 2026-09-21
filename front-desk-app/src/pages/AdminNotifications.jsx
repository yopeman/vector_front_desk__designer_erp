import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

const AdminNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();

      try {
        subscriptionRef.current = supabase
          .channel('admin-notifications-channel')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications'
            },
            () => {
              loadNotifications();
              loadUnreadCount();
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Failed to set up notification subscription:', error);
      }
    }

    return () => {
      if (subscriptionRef.current) {
        try {
          supabase.removeChannel(subscriptionRef.current);
        } catch (error) {
          console.error('Failed to cleanup notification subscription:', error);
        }
      }
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getReadNotificationIds = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const currentUserId = authUser?.id;

    const { data } = await supabase
      .from('read_notifications')
      .select('notification_id')
      .eq('user_id', currentUserId);

    return new Set(data?.map((rn) => rn.notification_id) || []);
  };

  const loadNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const readNotifIds = await getReadNotificationIds();
      setNotifications(
        (data || []).map((n) => ({ ...n, is_read: readNotifIds.has(n.id), message: n.body || n.message }))
      );
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const { data } = await supabase.from('notifications').select('id');
      const readNotifIds = await getReadNotificationIds();
      setUnreadCount((data || []).filter((n) => !readNotifIds.has(n.id)).length);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const currentUserId = authUser?.id;

      const { data: existing } = await supabase
        .from('read_notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('notification_id', notificationId)
        .single();

      if (existing) {
        await supabase
          .from('read_notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('read_notifications')
          .insert({
            user_id: currentUserId,
            notification_id: notificationId,
            is_read: true,
            read_at: new Date().toISOString()
          });
      }

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: notificationsData } = await supabase.from('notifications').select('id');
      const readNotifIds = await getReadNotificationIds();
      const unreadNotifs = (notificationsData || []).filter((n) => !readNotifIds.has(n.id));

      for (const notif of unreadNotifs) {
        await handleMarkAsRead(notif.id);
      }

      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
      >
        <i className="fa-solid fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[500px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Notifications</h3>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px]">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <i className="fa-solid fa-bell-slash text-4xl mb-2 text-slate-300"></i>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) handleMarkAsRead(notification.id);
                  }}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition ${
                    !notification.is_read ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: notification.color || '#e2e8f0', color: '#fff' }}
                    >
                      <i className={`fa-solid ${notification.icon || 'fa-bell'}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-800 text-sm">{notification.title}</h4>
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="text-slate-400 hover:text-primary-500 transition"
                        >
                          <i className="fa-solid fa-times text-xs"></i>
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-400">{formatTime(notification.created_at)}</span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;