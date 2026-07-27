export default function KpiGrid7() {
  const kpis = [
    { label: 'Leads', value: '24', sublabel: 'New Leads', icon: 'fa-user-plus', color: '#059669' },
    { label: 'Clients', value: '156', sublabel: 'Total Clients', icon: 'fa-users', color: '#7c3aed' },
    { label: 'Items', value: '89', sublabel: 'Total Items', icon: 'fa-archive', color: '#d97706' },
    { label: 'Orders', value: '42', sublabel: 'Active Orders', icon: 'fa-box', color: '#ea580c' },
    { label: 'Site Visits', value: '12', sublabel: 'Active Requests', icon: 'fa-location-dot', color: '#0891b2' },
    { label: 'Proforma Invoices', value: '8', sublabel: 'This Month', icon: 'fa-file-invoice', color: '#2563eb' },
    { label: 'Sales Invoices', value: '15', sublabel: 'This Month', icon: 'fa-file-invoice-dollar', color: '#059669' }
  ];

  return (
    <div className="kpi-grid-7" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '14px'
    }}>
      {kpis.map((kpi, index) => (
        <div key={index} className="kpi-card" style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px 16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '13px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #e8edf3',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="kpi-icon" style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '17px',
            flexShrink: 0,
            background: `linear-gradient(135deg, ${kpi.color}, ${kpi.color}dd)`
          }}>
            <i className={`fa-solid ${kpi.icon}`}></i>
          </div>
          <div className="kpi-info">
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '0.1px', margin: 0 }}>{kpi.label}</p>
            <h4 style={{ fontSize: '19px', fontWeight: 700, margin: '2px 0 1px', color: '#1e293b', letterSpacing: '-0.3px' }}>{kpi.value}</h4>
            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>{kpi.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}