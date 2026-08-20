import DashboardCharts from './DashboardCharts';

function formatETB(amount) {
  return 'ETB ' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function MiddleGrid({ data, onNavigate }) {
  const activities = data?.recentActivities?.length > 0
    ? data.recentActivities
    : [{ icon: 'fa-circle-info', color: '#64748b', title: 'No recent activity', time: '' }];

  const notifications = data?.notifications?.length > 0
    ? data.notifications
    : [{ icon: 'fa-bell', color: '#64748b', title: 'No notifications', desc: '', time: '' }];

  const quickActions = [
    { icon: 'fa-user-plus', label: 'New Client', color: '#2563eb', page: 'clients' },
    { icon: 'fa-user-tag', label: 'New Lead', color: '#059669', page: 'leads' },
    { icon: 'fa-map-location-dot', label: 'New Visit', color: '#7c3aed', page: 'site visits' },
    { icon: 'fa-file-invoice', label: 'New Proforma', color: '#ea580c', page: 'proforma invoices' },
    { icon: 'fa-file-code', label: 'Design Req.', color: '#7c3aed', page: 'designs' },
    { icon: 'fa-industry', label: 'Job Order', color: '#ea580c', page: 'job orders' },
    { icon: 'fa-truck', label: 'Delivery', color: '#0891b2', page: 'delivery' },
    { icon: 'fa-money-bill-wave', label: 'Record Pay', color: '#059669', page: 'payments' }
  ];

  return (
    <div className="middle-grid">
      {/* Today's Activities */}
      <div className="content-card">
        <div className="card-title">
          <span>Today's Activities</span>
          <a className="view-all-link" onClick={() => onNavigate?.('orders')}>
            View All <i className="fa-solid fa-chevron-right" style={{ marginLeft: '4px', fontSize: '8px' }}></i>
          </a>
        </div>
        <ul className="activity-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {activities.map((activity, index) => (
            <li key={index} className="activity-item" style={{
              cursor: activity.title !== 'No recent activity' ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease'
            }}
            onClick={() => activity.title !== 'No recent activity' && onNavigate?.('orders')}
            onMouseEnter={(e) => { if (activity.title !== 'No recent activity') e.currentTarget.style.backgroundColor = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <div className="item-left">
                <div className="round-icon" style={{ backgroundColor: activity.color }}>
                  <i className={`fa-solid ${activity.icon}`}></i>
                </div>
                <div className="item-details">
                  <div>{activity.title}</div>
                </div>
              </div>
              <span className="time-text">{activity.time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Business Overview */}
      <div className="content-card">
        <div className="card-title">Business Overview</div>
        
        <div className="overview-stats">
          <div className="stat-box" onClick={() => onNavigate?.('sales invoices')}>
            <p>Sales (MTD)</p>
            <h5>{formatETB(data?.salesMtd ?? 0)}</h5>
            <span className="trend-up">↑ {data?.salesMtdTrend ?? 0}%</span>
          </div>
          <div className="stat-box" onClick={() => onNavigate?.('payments')}>
            <p>Receivables</p>
            <h5>{formatETB(data?.receivablesTotal ?? 0)}</h5>
            <span className="trend-down">↓ {Math.abs(data?.receivablesTrend ?? 0)}%</span>
          </div>
          <div className="stat-box" onClick={() => onNavigate?.('job orders')}>
            <p>Production Jobs</p>
            <h5>{data?.productionJobsCount ?? 0}</h5>
            <span className="trend-up">Active</span>
          </div>
          <div className="stat-box" onClick={() => onNavigate?.('design status')}>
            <p>Pending Approvals</p>
            <h5>{data?.pendingApprovalsCount ?? 0}</h5>
            <span style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>Designs</span>
          </div>
        </div>

        <DashboardCharts data={data} />
      </div>

      {/* Notifications & Quick Actions */}
      <div className="content-card">
        <div className="card-title">
          <span>Notifications</span>
          <a className="view-all-link" onClick={() => onNavigate?.('notifications')}>
            View All <i className="fa-solid fa-chevron-right" style={{ marginLeft: '4px', fontSize: '8px' }}></i>
          </a>
        </div>
        <ul className="notification-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {notifications.map((notif, index) => (
            <li key={index} className="notification-item" style={{
              cursor: notif.title !== 'No notifications' ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease'
            }}
            onClick={() => notif.title !== 'No notifications' && onNavigate?.('notifications')}
            onMouseEnter={(e) => { if (notif.title !== 'No notifications') e.currentTarget.style.backgroundColor = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <div className="item-left">
                <div className="round-icon" style={{ backgroundColor: notif.color }}>
                  <i className={`fa-solid ${notif.icon}`}></i>
                </div>
                <div className="item-details">
                  <div>{notif.title}</div>
                  <div>{notif.desc}</div>
                </div>
              </div>
              <span className="time-text">{notif.time}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '25px' }}>
          <div className="card-title" style={{ marginBottom: '5px' }}>Quick Actions</div>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <div key={index} className="action-btn" onClick={() => onNavigate?.(action.page)}>
                <i className={`fa-solid ${action.icon}`} style={{ color: action.color }}></i>
                {action.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}