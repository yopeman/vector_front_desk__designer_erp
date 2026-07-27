export default function MiddleGrid() {
  const activities = [
    { icon: 'fa-user', color: '#2563eb', title: 'New Client Registered', time: '09:15 AM' },
    { icon: 'fa-file-invoice', color: '#059669', title: '5 Proforma Invoices Created', time: '09:45 AM' },
    { icon: 'fa-pen', color: '#7c3aed', title: '3 Designs Waiting Approval', time: '10:30 AM' },
    { icon: 'fa-industry', color: '#ea580c', title: '7 Jobs Under Production', time: '11:00 AM' },
    { icon: 'fa-truck', color: '#0891b2', title: '2 Deliveries Scheduled', time: '01:00 PM' },
    { icon: 'fa-wrench', color: '#2563eb', title: '1 Installation Planned', time: '02:30 PM' }
  ];

  const notifications = [
    { icon: 'fa-dollar-sign', color: '#ea580c', title: 'Payment Due Reminder', desc: 'Mesob Project - ETB 75,000', time: '10:20 AM' },
    { icon: 'fa-file-pen', color: '#2563eb', title: 'Design Approval Pending', desc: '3 Designs waiting customer approval', time: '09:50 AM' },
    { icon: 'fa-triangle-exclamation', color: '#dc2626', title: 'Low Stock Alert', desc: 'Acrylic Sheet - 5 pcs remaining', time: '09:10 AM' },
    { icon: 'fa-calendar-check', color: '#059669', title: 'Installation Scheduled', desc: 'Lemi Stadium - May 28, 2025', time: 'Yesterday' },
    { icon: 'fa-circle-exclamation', color: '#dc2626', title: 'Customer Complaint Follow-up', desc: '2 complaints require response', time: 'Yesterday' }
  ];

  const quickActions = [
    { icon: 'fa-user-plus', label: 'New Client', color: '#2563eb' },
    { icon: 'fa-user-tag', label: 'New Lead', color: '#059669' },
    { icon: 'fa-map-location-dot', label: 'New Visit', color: '#7c3aed' },
    { icon: 'fa-file-invoice', label: 'New Proforma', color: '#ea580c' },
    { icon: 'fa-file-code', label: 'Design Req.', color: '#7c3aed' },
    { icon: 'fa-industry', label: 'Job Order', color: '#ea580c' },
    { icon: 'fa-truck', label: 'Delivery', color: '#0891b2' },
    { icon: 'fa-money-bill-wave', label: 'Record Pay', color: '#059669' }
  ];

  return (
    <div className="middle-grid" style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '18px'
    }}>
      {/* Today's Activities */}
      <div className="content-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e8edf3',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="card-title" style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: '#334155',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Today's Activities</span>
          <a className="view-all-link" style={{
            color: '#2563eb',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>View All</a>
        </div>
        <ul className="activity-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {activities.map((activity, index) => (
            <li key={index} className="activity-item" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #e8edf3'
            }}>
              <div className="item-left" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div className="round-icon" style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  flexShrink: 0,
                  backgroundColor: activity.color
                }}>
                  <i className={`fa-solid ${activity.icon}`}></i>
                </div>
                <div className="item-details">
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '12.5px' }}>{activity.title}</div>
                </div>
              </div>
              <span className="time-text" style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap' }}>{activity.time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Business Overview */}
      <div className="content-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e8edf3',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="card-title" style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: '#334155',
          marginBottom: '16px'
        }}>Business Overview</div>
        
        <div className="overview-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          textAlign: 'center',
          borderBottom: '1px solid #e8edf3',
          paddingBottom: '14px',
          marginBottom: '14px'
        }}>
          <div className="stat-box" style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '8px 6px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0 }}>Sales (MTD)</p>
            <h5 style={{ fontSize: '13px', fontWeight: 700, margin: '3px 0 2px', color: '#1e293b' }}>ETB 2.5M</h5>
            <span className="trend-up" style={{ color: '#059669', fontSize: '10.5px', fontWeight: 600 }}>↑ 12%</span>
          </div>
          <div className="stat-box" style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '8px 6px'
          }}>
            <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0 }}>Receivables</p>
            <h5 style={{ fontSize: '13px', fontWeight: 700, margin: '3px 0 2px', color: '#1e293b' }}>ETB 450K</h5>
            <span className="trend-down" style={{ color: '#dc2626', fontSize: '10.5px', fontWeight: 600 }}>↓ 5%</span>
          </div>
          <div className="stat-box" style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '8px 6px'
          }}>
            <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0 }}>Production Jobs</p>
            <h5 style={{ fontSize: '13px', fontWeight: 700, margin: '3px 0 2px', color: '#1e293b' }}>18</h5>
            <span className="trend-up" style={{ color: '#059669', fontSize: '10.5px', fontWeight: 600 }}>↑ 3</span>
          </div>
          <div className="stat-box" style={{
            background: '#f8fafc',
            borderRadius: '8px',
            padding: '8px 6px'
          }}>
            <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0 }}>Pending Approvals</p>
            <h5 style={{ fontSize: '13px', fontWeight: 700, margin: '3px 0 2px', color: '#1e293b' }}>7</h5>
            <span style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>→ 0</span>
          </div>
        </div>

        <div className="charts-container" style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center'
        }}>
          <div style={{ flex: '1.2' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', color: '#64748b' }}>Sales vs Target (MTD)</div>
            <div className="chart-box-wrapper" style={{
              position: 'relative',
              height: '160px',
              width: '100%',
              background: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '12px'
            }}>
              Chart Placeholder
            </div>
          </div>
          <div style={{ flex: '0.8' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '5px', textTransform: 'uppercase', color: '#64748b' }}>Order Status</div>
            <div className="chart-box-wrapper" style={{
              position: 'relative',
              height: '160px',
              width: '100%',
              background: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '12px'
            }}>
              Chart Placeholder
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & Quick Actions */}
      <div className="content-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e8edf3',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="card-title" style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: '#334155',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Notifications</span>
          <a className="view-all-link" style={{
            color: '#2563eb',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>View All</a>
        </div>
        <ul className="notification-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {notifications.map((notif, index) => (
            <li key={index} className="notification-item" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #e8edf3'
            }}>
              <div className="item-left" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div className="round-icon" style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  flexShrink: 0,
                  backgroundColor: notif.color
                }}>
                  <i className={`fa-solid ${notif.icon}`}></i>
                </div>
                <div className="item-details">
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '12.5px' }}>{notif.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{notif.desc}</div>
                </div>
              </div>
              <span className="time-text" style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap' }}>{notif.time}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '25px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px', color: '#334155' }}>Quick Actions</div>
          <div className="quick-actions-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginTop: '14px'
          }}>
            {quickActions.map((action, index) => (
              <div key={index} className="action-btn" style={{
                border: '1px solid #e8edf3',
                borderRadius: '9px',
                padding: '10px 5px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                fontSize: '10.5px',
                fontWeight: 500,
                color: '#475569',
                transition: 'all 0.18s'
              }}>
                <i className={`fa-solid ${action.icon}`} style={{
                  display: 'block',
                  fontSize: '15px',
                  marginBottom: '5px',
                  color: action.color
                }}></i>
                {action.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}