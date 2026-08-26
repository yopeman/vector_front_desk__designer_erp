import React, { useState, useEffect, useRef } from 'react';
import { getCreativeNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteCreativeNotification, subscribeToCreativeNotifications, unsubscribeFromNotifications } from '../lib/creativeNotificationService';
import { useCreativeAuth } from '../contexts/CreativeAuthContext';

const NotificationsTab = ({ isActive }) => {
  const { user } = useCreativeAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (user && isActive) {
      loadNotifications();
      loadUnreadCount();
      
      try {
        subscriptionRef.current = subscribeToCreativeNotifications(user.id, (payload) => {
          loadNotifications();
          loadUnreadCount();
        });
      } catch (error) {
        console.error('Failed to set up notification subscription:', error);
      }
    }

    return () => {
      if (subscriptionRef.current) {
        try {
          unsubscribeFromNotifications(subscriptionRef.current);
        } catch (error) {
          console.error('Failed to cleanup notification subscription:', error);
        }
      }
    };
  }, [user, isActive]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getCreativeNotifications(user.id, 50);
      setNotifications(data || []);
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
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await deleteCreativeNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.action_url) {
      console.log('Navigate to:', notification.action_url);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'prototype':
        return 'fa-flask';
      case 'idea':
        return 'fa-lightbulb';
      case 'design':
        return 'fa-compass-drafting';
      case 'leave':
        return 'fa-user-clock';
      case 'resignation':
        return 'fa-user-minus';
      case 'experience':
        return 'fa-briefcase';
      case 'transfer':
        return 'fa-arrow-right-arrow-left';
      case 'promotion':
        return 'fa-arrow-up';
      case 'hire':
        return 'fa-user-plus';
      case 'budget':
        return 'fa-wallet';
      default:
        return 'fa-bell';
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

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
          <p className="text-slate-600">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
            <p className="text-lg">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fa-solid fa-bell-slash text-6xl mb-4 text-slate-300"></i>
            <p className="text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-6 hover:bg-slate-50 cursor-pointer transition ${
                  !notification.is_read ? 'bg-primary-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-primary-100 shrink-0`}>
                    <i className={`fa-solid ${getCategoryIcon(notification.category)} text-primary-600 text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-slate-800 text-lg">{notification.title}</h3>
                    </div>
                    <p className="text-slate-600 mt-2">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-sm text-slate-400">{formatTime(notification.created_at)}</span>
                      {!notification.is_read && (
                        <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded-full font-medium">New</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
