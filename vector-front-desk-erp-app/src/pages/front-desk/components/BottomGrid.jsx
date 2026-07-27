export default function BottomGrid() {
  const notes = [
    'Follow up Mesob Project',
    'Confirm Design Approval - Wegagen Bank',
    'Delivery Schedule - Lemi Stadium',
    'Customer Visit at 2:00 PM'
  ];

  const horizonMetrics = [
    { label: 'Total Orders', value: '156', sublabel: 'This Month', icon: 'fa-file-invoice', color: '#2563eb' },
    { label: 'In Production', value: '18', sublabel: 'Active Jobs', icon: 'fa-industry', color: '#ea580c' },
    { label: 'Deliveries', value: '24', sublabel: 'This Month', icon: 'fa-truck', color: '#0891b2' },
    { label: 'Installations', value: '12', sublabel: 'Scheduled', icon: 'fa-screwdriver-wrench', color: '#2563eb' },
    { label: 'Warranty Claims', value: '3', sublabel: 'Active', icon: 'fa-shield-halved', color: '#dc2626' },
    { label: 'Feedback Score', value: '4.8', sublabel: 'Average Rating', icon: 'fa-star', color: '#059669' }
  ];

  return (
    <div className="bottom-grid" style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '18px'
    }}>
      {/* Notes and Horizon Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '18px'
      }}>
        {/* Notes Card */}
        <div className="content-card notes-card" style={{
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
            <span><i className="fa-solid fa-clipboard-list" style={{ color: '#ea580c', marginRight: '5px' }}></i> NOTES</span>
            <a className="view-all-link" style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'none'
            }}>View All Notes</a>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notes.map((note, index) => (
              <li key={index} style={{
                position: 'relative',
                padding: '7px 8px 7px 14px',
                marginBottom: '4px',
                color: '#334155',
                fontSize: '12px',
                background: '#f8fafc',
                borderRadius: '6px',
                borderLeft: '2px solid #bfdbfe'
              }}>
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* Horizon Metrics */}
        <div className="horizon-metrics" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {horizonMetrics.map((metric, index) => (
            <div key={index} className="horizon-card" style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              padding: '14px 15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #e8edf3',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <div>
                <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{metric.label}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0', color: '#1e293b' }}>{metric.value}</h3>
                <div style={{ fontSize: '9px', color: '#64748b' }}>{metric.sublabel}</div>
              </div>
              <i className={`fa-solid ${metric.icon}`} style={{
                color: metric.color,
                fontSize: '20px'
              }}></i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}