import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function Sidebar({ onMenuClick, currentPage, collapsed, setCollapsed }) {
  const { profile } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [hasUnreadDesignChat, setHasUnreadDesignChat] = useState(false);
  const [hasUnreadProdChat, setHasUnreadProdChat] = useState(false);

  // Poll for unread design communications to show a red dot
  useEffect(() => {
    if (!profile?.id) return;

    const checkUnreadDesignChat = async () => {
      const { data: activeDesigns, error: designError } = await supabase
        .from('designs')
        .select('id')
        .eq('status', 'In Progress');

      if (designError) return;

      const activeIds = (activeDesigns || []).map((d) => d.id);
      if (activeIds.length === 0) {
        setHasUnreadDesignChat(false);
        return;
      }

      const { count, error } = await supabase
        .from('design_communications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', profile.id)
        .in('design_id', activeIds);

      if (!error) setHasUnreadDesignChat((count || 0) > 0);
    };

    checkUnreadDesignChat();
    const interval = setInterval(checkUnreadDesignChat, 5000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  // Poll for unread production communications to show red dots
  useEffect(() => {
    if (!profile?.id) return;

    const checkUnreadProdChat = async () => {
      const { count, error } = await supabase
        .from('production_communications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', profile.id);

      if (!error) setHasUnreadProdChat((count || 0) > 0);
    };

    checkUnreadProdChat();
    const interval = setInterval(checkUnreadProdChat, 5000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  // Determine which menu contains the current page
  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: 'fa-house', 
      active: false,
      submenu: null 
    },
    { 
      name: 'CRM', 
      icon: 'fa-users', 
      active: false,
      submenu: [
        { name: 'Leads', icon: 'fa-user-tag' },
        { name: 'Clients', icon: 'fa-user-check' },
        { name: 'Site Visits', icon: 'fa-location-dot' },
        { name: 'Items', icon: 'fa-archive' },
        { name: 'Orders', icon: 'fa-box' },
      ] 
    },
    { 
      name: 'Design', 
      icon: 'fa-pen-to-square', 
      active: false,
      submenu: [
        { name: 'Designs', icon: 'fa-file-code' },
        { name: 'Design Status', icon: 'fa-spinner' },
        { name: 'Design Library', icon: 'fa-book' },
      ] 
    },
    { 
      name: 'Sales', 
      icon: 'fa-cart-shopping', 
      active: false,
      submenu: [
        { name: 'Proforma Invoices', icon: 'fa-flask' },
        { name: 'Sales Invoices', icon: 'fa-file-invoice' },
        { name: 'Payments', icon: 'fa-credit-card' },
        { name: 'Sales Invoices Status', icon: 'fa-file-invoice-dollar' },
      ] 
    },
    { 
      name: 'Production', 
      icon: 'fa-industry', 
      active: false,
      submenu: [
        { name: 'Job Orders', icon: 'fa-clipboard-list' },
        { name: 'Active Work', icon: 'fa-industry' },
        { name: 'Production Status', icon: 'fa-chart-line' },
      ] 
    },
    { 
      name: 'Logistics & Installation', 
      icon: 'fa-truck', 
      active: false,
      submenu: [
        { name: 'Delivery', icon: 'fa-truck-fast' },
        { name: 'Installation', icon: 'fa-screwdriver-wrench' }
      ] 
    },
    { 
      name: 'Customer Care', 
      icon: 'fa-headset', 
      active: false,
      submenu: [
        { name: 'Feedback', icon: 'fa-comments' },
        { name: 'Complaints', icon: 'fa-triangle-exclamation' },
        { name: 'Warranty', icon: 'fa-shield-halved' }
      ] 
    },
    { 
      name: 'Reports', 
      icon: 'fa-chart-bar', 
      active: false,
      submenu: [
        { name: 'Report', icon: 'fa-calendar-day' },
        { name: 'Daily Finance Report', icon: 'fa-coins' },
        { name: 'Weekly Finance Report', icon: 'fa-chart-line' }
      ] 
    },
    {
      name: 'AI Agent',
      icon: 'fa-robot',
      active: false,
      submenu: null
    },
    { 
      name: 'Communication', 
      icon: 'fa-comment', 
      active: false,
      submenu: [
        { name: 'Messages', icon: 'fa-envelope' },
        { name: 'Notifications', icon: 'fa-bell' }
      ] 
    },
    { 
      name: 'Notes', 
      icon: 'fa-sticky-note', 
      active: false,
      submenu: null 
    },
    { 
      name: 'HR Requests', 
      icon: 'fa-user-tie', 
      active: false,
      submenu: null,
      externalUrl: 'https://vectoradvert.com/erp/hr'
    },
    { 
      name: 'Settings', 
      icon: 'fa-gear', 
      active: false,
      submenu: null 
    }
  ];

  // Find active menu and submenu based on currentPage
  const getActiveMenu = () => {
    for (const item of menuItems) {
      if (item.name.toLowerCase() === currentPage) {
        return { menu: item.name, submenu: null };
      }
      if (item.submenu) {
        const subItem = item.submenu.find(sub => sub.name.toLowerCase() === currentPage);
        if (subItem) {
          return { menu: item.name, submenu: subItem.name };
        }
      }
    }
    return { menu: null, submenu: null };
  };

  const { menu: activeMenu, submenu: activeSubmenu } = getActiveMenu();

  // Auto-expand menu if it contains the active submenu
  useEffect(() => {
    if (activeSubmenu && !expandedMenus[activeMenu]) {
      setExpandedMenus(prev => ({ ...prev, [activeMenu]: true }));
    }
  }, [activeMenu, activeSubmenu]);

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const handleItemClick = (item) => {
    if (item.externalUrl) {
      window.location.href = item.externalUrl;
    } else if (item.submenu) {
      toggleMenu(item.name);
    } else if (onMenuClick) {
      onMenuClick(item.name.toLowerCase());
    }
  };

  const handleSubItemClick = (subItem) => {
    if (onMenuClick) {
      onMenuClick(subItem.name.toLowerCase());
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{
      width: collapsed ? '60px' : '240px',
      backgroundColor: '#00ced1',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.3s ease'
    }}>
      <div className="logo-area" style={{
        padding: '22px 18px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden'
      }}>
        <div className="logo-title" style={{
          fontSize: '20px',
          fontWeight: 800,
          letterSpacing: '2px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '24px',
            color: '#ffffff',
            flexShrink: 0
          }}>{collapsed && 'V'}</span>
          {!collapsed && 'V☰CTOR'}
        </div>
        {!collapsed && (
          <div className="logo-sub" style={{
            fontSize: '9.5px',
            color: 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginTop: '5px',
            paddingLeft: '16px'
          }}>
            Advert & Manufacturing ERP
          </div>
        )}
      </div>

      {!collapsed && (
        <ul className="menu-list" style={{
          listStyle: 'none',
          padding: '10px 0',
          flexGrow: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin'
        }}>
          {menuItems.map((item, index) => (
            <li key={index}>
              <div 
                className="menu-item"
                style={{
                  padding: '9px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: activeMenu === item.name ? '#ffffff' : 'rgba(255,255,255,0.9)',
                  borderLeft: activeMenu === item.name ? '3px solid #ffffff' : '3px solid transparent',
                  backgroundColor: activeMenu === item.name ? 'rgba(255,255,255,0.2)' : 'transparent',
                  margin: '1px 0',
                  fontSize: '12.5px',
                  transition: 'all 0.18s ease, transform 0.18s ease',
                  transformOrigin: 'left center'
                }}
                onMouseEnter={(e) => {
                  if (activeMenu !== item.name) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderLeftColor = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.transform = 'scaleX(1.03) scaleY(1.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeMenu !== item.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                    e.currentTarget.style.transform = 'scaleX(1) scaleY(1)';
                  }
                }}
                onClick={(e) => handleItemClick(item, e)}
              >
                <div className="menu-link" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <i className={`fa-solid ${item.icon}`} style={{ width: '16px', textAlign: 'center', fontSize: '13px' }}></i>
                  <span>{item.name}</span>
                </div>
                {item.submenu && (
                  <i className={`fa-solid fa-chevron-${expandedMenus[item.name] ? 'down' : 'right'}`} style={{ fontSize: '10px' }}></i>
                )}
              </div>
              
              {item.submenu && expandedMenus[item.name] && (
                <ul 
                  className="submenu-list" 
                  style={{
                    listStyle: 'none',
                    paddingLeft: '45px',
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  {item.submenu.map((subItem, subIndex) => (
                    <li 
                      key={subIndex} 
                      className="submenu-item"
                      style={{
                        padding: '7px 0',
                        color: activeSubmenu === subItem.name ? '#ffffff' : 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                        transition: 'color 0.18s',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative',
                        zIndex: 10,
                        borderLeft: activeSubmenu === subItem.name ? '2px solid #ffffff' : '2px solid transparent',
                        paddingLeft: activeSubmenu === subItem.name ? '6px' : '0'
                      }}
                      onMouseEnter={(e) => {
                        if (activeSubmenu !== subItem.name) {
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeSubmenu !== subItem.name) {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                        }
                      }}
                      onClick={() => handleSubItemClick(subItem)}
                    >
                      <i className={`fa-solid ${subItem.icon}`} style={{ 
                        width: '12px', 
                        textAlign: 'center', 
                        fontSize: '10px',
                        opacity: 0.7 
                      }}></i>
                      <span>{subItem.name}</span>
                      {(subItem.name === 'Design Status' && hasUnreadDesignChat) || (subItem.name === 'Active Work' && hasUnreadProdChat) || (subItem.name === 'Production Status' && hasUnreadProdChat) ? (
                        <span
                          title="Unread production chat"
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            flexShrink: 0
                          }}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <div 
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          textAlign: 'left',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.85)',
          transition: 'color 0.18s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
      >
        <i className={`fa-solid fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
      </div>
    </div>
  );
}