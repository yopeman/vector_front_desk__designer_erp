import { useState, useEffect } from 'react';

export default function Sidebar({ onMenuClick, currentPage }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

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
      ] 
    },
    { 
      name: 'Sales', 
      icon: 'fa-cart-shopping', 
      active: false,
      submenu: [
        { name: 'Proforma Invoices', icon: 'fa-file-invoice' },
        { name: 'Payments', icon: 'fa-credit-card' },
        { name: 'Sales Invoices', icon: 'fa-file-invoice-dollar' },
      ] 
    },
    { 
      name: 'Production', 
      icon: 'fa-industry', 
      active: false,
      submenu: [
        { name: 'Job Orders', icon: 'fa-clipboard-list' },
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
        { name: 'Daily Report', icon: 'fa-calendar-day' },
        { name: 'Daily Finance Report', icon: 'fa-coins' },
        { name: 'Weekly Finance Report', icon: 'fa-chart-line' }
      ] 
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
    if (item.submenu) {
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
      backgroundColor: '#0d1b2e',
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
          <div style={{
            width: '8px',
            height: '22px',
            background: 'linear-gradient(180deg, #2563eb, #7c3aed)',
            borderRadius: '3px',
            flexShrink: 0
          }}></div>
          {!collapsed && 'VECTOR'}
        </div>
        {!collapsed && (
          <div className="logo-sub" style={{
            fontSize: '9.5px',
            color: '#4e6580',
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
                  color: activeMenu === item.name ? '#93bbff' : '#7a93ae',
                  borderLeft: activeMenu === item.name ? '3px solid #2563eb' : '3px solid transparent',
                  backgroundColor: activeMenu === item.name ? 'rgba(37,99,235,0.15)' : 'transparent',
                  margin: '1px 0',
                  fontSize: '12.5px',
                  transition: 'all 0.18s ease, transform 0.18s ease',
                  transformOrigin: 'left center'
                }}
                onMouseEnter={(e) => {
                  if (activeMenu !== item.name) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#c8d8e8';
                    e.currentTarget.style.borderLeftColor = 'rgba(37,99,235,0.4)';
                    e.currentTarget.style.transform = 'scaleX(1.03) scaleY(1.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeMenu !== item.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#7a93ae';
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
                    backgroundColor: 'rgba(0,0,0,0.12)',
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
                        color: activeSubmenu === subItem.name ? '#93bbff' : '#4e6580',
                        cursor: 'pointer',
                        transition: 'color 0.18s',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative',
                        zIndex: 10,
                        borderLeft: activeSubmenu === subItem.name ? '2px solid #2563eb' : '2px solid transparent',
                        paddingLeft: activeSubmenu === subItem.name ? '6px' : '0'
                      }}
                      onMouseEnter={(e) => {
                        if (activeSubmenu !== subItem.name) {
                          e.currentTarget.style.color = '#93bbff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeSubmenu !== subItem.name) {
                          e.currentTarget.style.color = '#4e6580';
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
          borderTop: '1px solid rgba(255,255,255,0.07)',
          textAlign: 'left',
          cursor: 'pointer',
          color: '#4e6580',
          transition: 'color 0.18s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#93bbff'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#4e6580'}
      >
        <i className={`fa-solid fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
      </div>
    </div>
  );
}