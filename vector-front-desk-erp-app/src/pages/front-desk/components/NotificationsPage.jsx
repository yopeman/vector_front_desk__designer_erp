import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notificationModal, setNotificationModal] = useState({
    show: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchNotifications();
    fetchReadNotifications();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setNotificationModal({
            show: true,
            title: payload.new.title,
            message: payload.new.body
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchReadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const { data, error } = await supabase
        .from('read_notifications')
        .select('*')
        .eq('user_id', currentUserId);

      if (error) throw error;
      setReadNotifications(data || []);
    } catch (error) {
      console.error('Error fetching read notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRead = (notifId) => {
    return readNotifications.some(
      (rn) => rn.notification_id === notifId && rn.is_read
    );
  };

  const unreadCount = notifications.filter((n) => !isRead(n.id)).length;

  const markAsRead = async (notifId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const existing = readNotifications.find(
        (rn) => rn.notification_id === notifId && rn.user_id === currentUserId
      );

      if (existing) {
        const { error } = await supabase
          .from('read_notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('read_notifications')
          .insert({
            user_id: currentUserId,
            notification_id: notifId,
            is_read: true,
            read_at: new Date().toISOString(),
          });
        if (error) throw error;
      }

      setReadNotifications((prev) => [
        ...prev.filter((rn) => rn.notification_id !== notifId),
        { id: existing?.id || crypto.randomUUID(), user_id: currentUserId, notification_id: notifId, is_read: true, read_at: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const unreadNotifs = notifications.filter((n) => !isRead(n.id));

      await Promise.all(
        unreadNotifs.map(async (notif) => {
          const existing = readNotifications.find(
            (rn) => rn.notification_id === notif.id && rn.user_id === currentUserId
          );

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
                notification_id: notif.id,
                is_read: true,
                read_at: new Date().toISOString(),
              });
          }
        })
      );

      setReadNotifications((prev) => [
        ...prev,
        ...unreadNotifs.map((notif) => ({
          id: crypto.randomUUID(),
          user_id: currentUserId,
          notification_id: notif.id,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
      ]);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleShowClick = (notif) => {
    setSelectedNotif(notif);
    setShowModal(true);
    if (!isRead(notif.id)) {
      markAsRead(notif.id);
    }
  };

  return (
    <div style={{ padding: '16px 24px' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors border-none cursor-pointer"
          >
            <i className="fa-solid fa-check-double"></i>
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Summary Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div className="flex gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="font-medium text-slate-700">Total:</span>
            <span className="text-slate-600">{notifications.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="font-medium text-slate-700">Unread:</span>
            <span className="text-slate-600">{unreadCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="font-medium text-slate-700">Read:</span>
            <span className="text-slate-600">{notifications.length - unreadCount}</span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <i className="fa-regular fa-bell-slash text-4xl text-slate-300 mb-4"></i>
          <p className="text-sm font-medium text-slate-500">No notifications</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => {
              const read = isRead(notif.id);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleShowClick(notif)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    backgroundColor: read ? '#fff' : '#f8faff',
                    borderLeft: read ? '3px solid transparent' : '3px solid #2563eb',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!read) e.currentTarget.style.backgroundColor = '#f0f4ff';
                  }}
                  onMouseLeave={(e) => {
                    if (!read) e.currentTarget.style.backgroundColor = '#f8faff';
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: notif.color || '#e2e8f0',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '14px',
                    }}
                  >
                    <i className={`fa-solid ${notif.icon || 'fa-bell'}`}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: read ? '400' : '600',
                          color: read ? '#64748b' : '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {notif.title}
                      </span>
                      {!read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '11px',
                        color: '#8898aa',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notif.body}
                    </p>
                  </div>
                  <span style={{ fontSize: '10px', color: '#bbb', flexShrink: 0, marginTop: '2px' }}>
                    {formatTime(notif.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedNotif && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            setSelectedNotif(null);
          }}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 w-full max-w-lg mt-10 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Notification Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedNotif(null);
                }}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer text-lg"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: selectedNotif.color || '#e2e8f0',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  <i className={`fa-solid ${selectedNotif.icon || 'fa-bell'}`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{selectedNotif.title}</h3>
                  <span className="text-xs text-slate-400">
                    {formatTime(selectedNotif.created_at)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-slate-700 leading-relaxed">{selectedNotif.body}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                {!isRead(selectedNotif.id) ? (
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <i className="fa-solid fa-circle text-[6px]"></i> Unread
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <i className="fa-solid fa-check text-[8px]"></i> Read
                  </span>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => {
                  markAsRead(selectedNotif.id);
                  setShowModal(false);
                  setSelectedNotif(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-xs cursor-pointer border-none"
              >
                <i className="fa-solid fa-check mr-2"></i>Mark as Read
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModal.show && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setNotificationModal({ ...notificationModal, show: false })}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <i className="fa-solid fa-bell text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{notificationModal.title}</h3>
                  <p className="text-sm text-slate-600">{notificationModal.message}</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationModal({ ...notificationModal, show: false })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm cursor-pointer border-none transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}