import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import CalendarModal from './CalendarModal';

export default function TopHeader({ onToggleSidebar, onNavigate, menuItems: customMenuItems }) {
  const { profile } = useAuth();
  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const [messageDropdown, setMessageDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [searchDropdown, setSearchDropdown] = useState(false);
  const [calendarModal, setCalendarModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const searchInputRef = useRef(null);

  const defaultMenuItems = [
    { name: 'Dashboard', icon: 'fa-house', path: 'dashboard' },
    { name: 'Leads', icon: 'fa-user-tag', path: 'leads' },
    { name: 'Clients', icon: 'fa-user-check', path: 'clients' },
    { name: 'Site Visits', icon: 'fa-location-dot', path: 'site visits' },
    { name: 'Items', icon: 'fa-archive', path: 'items' },
    { name: 'Orders', icon: 'fa-box', path: 'orders' },
    { name: 'Designs', icon: 'fa-file-code', path: 'designs' },
    { name: 'Design Status', icon: 'fa-spinner', path: 'design status' },
    { name: 'Proforma Invoices', icon: 'fa-file-invoice', path: 'proforma invoices' },
    { name: 'Payments', icon: 'fa-credit-card', path: 'payments' },
    { name: 'Sales Invoices', icon: 'fa-file-invoice-dollar', path: 'sales invoices' },
    { name: 'Job Orders', icon: 'fa-clipboard-list', path: 'job orders' },
    { name: 'Delivery', icon: 'fa-truck-fast', path: 'delivery' },
    { name: 'Installation', icon: 'fa-screwdriver-wrench', path: 'installation' },
    { name: 'Feedback', icon: 'fa-comments', path: 'feedback' },
    { name: 'Complaints', icon: 'fa-triangle-exclamation', path: 'complaints' },
    { name: 'Warranty', icon: 'fa-shield-halved', path: 'warranty' },
    { name: 'Report', icon: 'fa-calendar-day', path: 'report' },
    { name: 'Daily Finance Report', icon: 'fa-coins', path: 'daily finance report' },
    { name: 'Weekly Finance Report', icon: 'fa-chart-line', path: 'weekly finance report' },
    { name: 'Messages', icon: 'fa-envelope', path: 'messages' },
    { name: 'Notifications', icon: 'fa-bell', path: 'notifications' },
    { name: 'Notes', icon: 'fa-sticky-note', path: 'notes' },
    { name: 'Settings', icon: 'fa-gear', path: 'settings' },
  ];

  const menuItems = customMenuItems || defaultMenuItems;

  useEffect(() => {
    fetchNotifications();
    fetchMessages();

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchDropdown(false);
        setNotificationDropdown(false);
        setMessageDropdown(false);
        setProfileDropdown(false);
      }
    };

    const handleClickOutside = (e) => {
      if (!e.target.closest('.icon-badge') && !e.target.closest('.user-profile') && !e.target.closest('.search-box')) {
        setSearchDropdown(false);
        setNotificationDropdown(false);
        setMessageDropdown(false);
        setProfileDropdown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const { data: readData } = await supabase
        .from('read_notifications')
        .select('notification_id')
        .eq('user_id', currentUserId);

      const readIds = readData?.map(r => r.notification_id) || [];

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const unread = notifData?.filter(n => !readIds.includes(n.id)) || [];
      setNotifications(notifData || []);
      setUnreadNotifications(unread.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const { data: msgData } = await supabase
        .from('messages')
        .select('*, sender:users(username)')
        .eq('receiver_id', currentUserId)
        .order('sent_at', { ascending: false })
        .limit(5);

      setMessages(msgData || []);
      setUnreadMessages(msgData?.length || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markNotificationAsRead = async (notifId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      await supabase
        .from('read_notifications')
        .insert({
          user_id: currentUserId,
          notification_id: notifId,
          is_read: true,
          read_at: new Date().toISOString(),
        });

      setUnreadNotifications(prev => Math.max(0, prev - 1));
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markMessageAsRead = async (msgId) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', msgId);

      setUnreadMessages(prev => Math.max(0, prev - 1));
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="top-header" style={{
      backgroundColor: '#ffffff',
      height: '62px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      borderBottom: '1px solid #e8edf3',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      position: 'sticky',
      top: 0,
      zIndex: 300
    }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div 
          onClick={onToggleSidebar}
          style={{ fontSize: '16px', cursor: 'pointer', color: '#64748b' }}
        >
          <i className="fa-solid fa-bars"></i>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>Dashboard</h2>
        <div className="search-box" style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{
            position: 'absolute',
            left: '13px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontSize: '12px',
            pointerEvents: 'none'
          }}></i>
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search modules... (Ctrl+K)" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchDropdown(e.target.value.length > 0);
            }}
            onFocus={() => setSearchDropdown(searchQuery.length > 0)}
            onBlur={() => setTimeout(() => setSearchDropdown(false), 200)}
            style={{
              width: '300px',
              padding: '8px 14px 8px 34px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              outline: 'none',
              fontSize: '12.5px',
              color: '#1e293b'
            }}
          />
          {searchDropdown && filteredMenuItems.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '45px',
              left: '0',
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '8px'
            }}>
              {filteredMenuItems.map((item, index) => (
                <div
                  key={item.path}
                  onClick={() => {
                    onNavigate?.(item.path);
                    setSearchQuery('');
                    setSearchDropdown(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: '#1e293b',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <i className={`fa-solid ${item.icon}`} style={{ color: '#64748b', fontSize: '14px', width: '20px' }}></i>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div className="icon-badge" style={{
          position: 'relative',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#64748b',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}
        onClick={() => setCalendarModal(true)}
        >
          <i className="fa-solid fa-calendar-days"></i>
          <span className="badge" style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff'
          }}>0</span>
        </div>

        <div className="icon-badge" style={{
          position: 'relative',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#64748b',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}
        onClick={() => setNotificationDropdown(!notificationDropdown)}
        >
          <i className="fa-solid fa-bell"></i>
          <span className="badge" style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff'
          }}>{unreadNotifications}</span>

          {notificationDropdown && (
            <div style={{
              position: 'absolute',
              top: '45px',
              right: '0',
              width: '320px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>Notifications</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{unreadNotifications} unread</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
                  No notifications
                </div>
              ) : (
                <>
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '6px',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onClick={() => markNotificationAsRead(notif.id)}
                    >
                      <div style={{ fontWeight: 500, fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}>{notif.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>{notif.body}</div>
                    </div>
                  ))}
                  <button
                    onClick={() => window.location.href = '#notifications'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: '#00ced1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Show All
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="icon-badge" style={{
          position: 'relative',
          cursor: 'pointer',
          fontSize: '16px',
          color: '#64748b',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}
        onClick={() => setMessageDropdown(!messageDropdown)}
        >
          <i className="fa-solid fa-envelope"></i>
          <span className="badge" style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff'
          }}>{unreadMessages}</span>

          {messageDropdown && (
            <div style={{
              position: 'absolute',
              top: '45px',
              right: '0',
              width: '320px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>Messages</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{unreadMessages} unread</span>
              </div>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
                  No messages
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '6px',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onClick={() => markMessageAsRead(msg.id)}
                    >
                      <div style={{ fontWeight: 500, fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}>
                        {msg.sender?.username || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                        {msg.text || 'No text'}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => window.location.href = '#messages'}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: '#00ced1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Show All
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="header-divider" style={{
          width: '1px',
          height: '24px',
          background: '#e2e8f0',
          margin: '0 6px'
        }}></div>

        <div className="user-profile" style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 10px 5px 6px',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'background 0.18s'
        }}
        onClick={() => setProfileDropdown(!profileDropdown)}
        >
          <div className="avatar" style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #00ced1, #00b8bb)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px'
          }}>
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b' }}>
              {profile?.username || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Front Desk Officer</div>
          </div>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}></i>

          {profileDropdown && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              width: '200px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              padding: '8px'
            }}>
              <div
                onClick={() => onNavigate?.('settings')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#1e293b',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fa-solid fa-gear" style={{ color: '#64748b', fontSize: '14px' }}></i>
                <span>Settings</span>
              </div>
              <div
                onClick={handleLogout}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#ef4444',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fa-solid fa-right-from-bracket" style={{ fontSize: '14px' }}></i>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <CalendarModal show={calendarModal} onClose={() => setCalendarModal(false)} />
    </header>
  );
}