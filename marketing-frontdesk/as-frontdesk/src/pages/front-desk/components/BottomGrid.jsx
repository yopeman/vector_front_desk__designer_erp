export default function BottomGrid({ data, onNavigate }) {
  const notes = data?.notes?.length > 0
    ? data.notes
    : ['No notes yet'];

  const horizonMetrics = [
    { label: 'Total Orders', value: data?.totalOrders ?? 0, sublabel: 'Total Orders', icon: 'fa-file-invoice', color: '#2563eb', page: 'orders' },
    { label: 'In Production', value: data?.inProduction ?? 0, sublabel: 'Active Jobs', icon: 'fa-industry', color: '#ea580c', page: 'job orders' },
    { label: 'Deliveries', value: data?.deliveriesThisMonth ?? 0, sublabel: 'This Month', icon: 'fa-truck', color: '#0891b2', page: 'delivery' },
    { label: 'Installations', value: data?.installationsScheduled ?? 0, sublabel: 'Scheduled', icon: 'fa-screwdriver-wrench', color: '#2563eb', page: 'installation' },
    { label: 'Warranty Claims', value: data?.warrantyClaims ?? 0, sublabel: 'Active', icon: 'fa-shield-halved', color: '#dc2626', page: 'warranty' },
    { label: 'Feedback Score', value: data?.averageRating ?? 0, sublabel: 'Average Rating', icon: 'fa-star', color: '#059669', page: 'feedback' }
  ];

  return (
    <div className="bottom-grid">
      <div className="content-card notes-card">
        <div className="card-title">
          <span><i className="fa-solid fa-clipboard-list" style={{ color: '#ea580c', marginRight: '5px' }}></i> NOTES</span>
          <a className="view-all-link" style={{ textTransform: 'none' }} onClick={() => onNavigate?.('notes')}>
            View All Notes <i className="fa-solid fa-chevron-right" style={{ marginLeft: '4px', fontSize: '8px' }}></i>
          </a>
        </div>
        <ul>
          {notes.map((note, index) => (
            <li key={index} style={{
              cursor: note !== 'No notes yet' ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease'
            }}
            onClick={() => note !== 'No notes yet' && onNavigate?.('notes')}
            onMouseEnter={(e) => { if (note !== 'No notes yet') e.currentTarget.style.background = '#eef2f7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}>
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="horizon-metrics">
        {horizonMetrics.map((metric, index) => (
          <div key={index} className="horizon-card" onClick={() => onNavigate?.(metric.page)}>
            <div>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{metric.label}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0', color: '#1e293b' }}>{metric.value}</h3>
              <div style={{ fontSize: '9px', color: '#64748b' }}>{metric.sublabel}</div>
            </div>
            <i className={`fa-solid ${metric.icon}`} style={{ color: metric.color, fontSize: '20px' }}></i>
          </div>
        ))}
      </div>
    </div>
  );
}