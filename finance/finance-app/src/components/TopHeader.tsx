import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { financeClient } from '../services/supabaseClients';

interface MenuItem {
  name: string;
  icon: string;
  path: string;
}

interface TopHeaderProps {
  onToggleSidebar: () => void;
  onNavigate?: (path: string) => void;
  menuItems?: MenuItem[];
}

export default function TopHeader({ onToggleSidebar, onNavigate, menuItems: customMenuItems }: TopHeaderProps) {
  const { profile } = useAuth();
  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const [messageDropdown, setMessageDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [searchDropdown, setSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const defaultMenuItems: MenuItem[] = [
    { name: 'Dashboard', icon: 'fa-house', path: '/' },
    { name: 'Purchases', icon: 'fa-shopping-cart', path: '/purchases' },
    { name: 'Sales', icon: 'fa-dollar-sign', path: '/sales' },
    { name: 'Chart of Accounts', icon: 'fa-book', path: '/chart-of-accounts' },
    { name: 'Inventory', icon: 'fa-box', path: '/inventory' },
    { name: 'General Journal', icon: 'fa-file-lines', path: '/general-journal' },
    { name: 'Payroll', icon: 'fa-users', path: '/payroll' },
    { name: 'Reports', icon: 'fa-chart-bar', path: '/reports' },
    { name: 'Messages', icon: 'fa-envelope', path: '/messages' },
    { name: 'Notifications', icon: 'fa-bell', path: '/notifications' },
    { name: 'Notes', icon: 'fa-sticky-note', path: '/notes' },
    { name: 'Settings', icon: 'fa-gear', path: '/settings' },
  ];

  const menuItems = customMenuItems || defaultMenuItems;

  useEffect(() => {
    fetchNotifications();
    fetchMessages();

    const handleKeyDown = (e: KeyboardEvent) => {
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

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.icon-badge') && !target.closest('.user-profile') && !target.closest('.search-box')) {
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
      const { data: { user } } = await financeClient.auth.getUser();
      const currentUserId = user?.id;

      const { data: readData } = await financeClient
        .from('read_notifications')
        .select('notification_id')
        .eq('user_id', currentUserId);

      const readIds = readData?.map((r: any) => r.notification_id) || [];

      const { data: notifData } = await financeClient
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const unread = notifData?.filter((n: any) => !readIds.includes(n.id)) || [];
      setNotifications(notifData || []);
      setUnreadNotifications(unread.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await financeClient.auth.getUser();
      const currentUserId = user?.id;

      const { data: msgData } = await financeClient
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

  const markNotificationAsRead = async (notifId: string) => {
    try {
      const { data: { user } } = await financeClient.auth.getUser();
      const currentUserId = user?.id;

      await financeClient
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

  const markMessageAsRead = async (msgId: string) => {
    try {
      await financeClient
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
    await financeClient.auth.signOut();
    window.location.href = '#/login';
  };

  return (
    <header className="top-header" style={{
      backgroundColor: '#00CED1',
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
        <div className="search-box" style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{
            position: 'absolute',
            left: '13px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#ffffff',
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
              backgroundColor: '#ffffff',
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
              {filteredMenuItems.map((item) => (
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
          color: '#ffffff',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}
        onClick={() => setNotificationDropdown(!notificationDropdown)}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#00CED1';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
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
                  {notifications.map((notif) => (
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
                    onClick={() => onNavigate?.('/notifications')}
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
          color: '#ffffff',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          transition: 'background 0.18s, color 0.18s'
        }}
        onClick={() => setMessageDropdown(!messageDropdown)}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#00CED1';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
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
                  {messages.map((msg) => (
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
                    onClick={() => onNavigate?.('/messages')}
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
          transition: 'background 0.18s',
          border: 'solid 3px white'
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
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#ffffff' }}>
              {profile?.username || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: '#e0f7fa' }}>Finance Manager</div>
          </div>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', color: '#ffffff', marginLeft: '4px' }}></i>

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
                onClick={() => onNavigate?.('/settings')}
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
    </header>
  );
}
