import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCreativeNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteCreativeNotification, subscribeToCreativeNotifications, unsubscribeFromNotifications } from '../lib/creativeNotificationService';
import { useCreativeAuth } from '../contexts/CreativeAuthContext';

const Notifications = ({ onTabSwitch }) => {
  const { user } = useCreativeAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      
      // Subscribe to real-time notifications
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
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getCreativeNotifications(user.id, 10);
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
      // Navigate to action URL (this would need to be integrated with your routing)
      console.log('Navigate to:', notification.action_url);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle text-primary-500';
      case 'warning':
        return 'fa-exclamation-triangle text-primary-500';
      case 'error':
        return 'fa-times-circle text-primary-500';
      default:
        return 'fa-info-circle text-primary-500';
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
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

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[500px] overflow-hidden">
          {/* Header */}
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

          {/* Notifications List */}
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
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition ${
                    !notification.is_read ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg`} style={{ backgroundColor: notification.color || '#e2e8f0', color: '#fff' }}>
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
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.body || notification.message}</p>
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

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
              <button
                onClick={() => {
                  loadNotifications();
                  setIsOpen(false);
                  if (onTabSwitch) {
                    onTabSwitch('notificationsTab');
                  }
                }}
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;