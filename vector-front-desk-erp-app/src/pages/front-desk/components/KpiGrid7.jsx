export default function KpiGrid7({ data, onNavigate }) {
  const kpis = [
    { label: 'Leads', value: data?.leadsCount ?? 0, sublabel: 'New Leads', icon: 'fa-user-plus', color: '#059669', page: 'leads' },
    { label: 'Clients', value: data?.clientsCount ?? 0, sublabel: 'Total Clients', icon: 'fa-users', color: '#7c3aed', page: 'clients' },
    { label: 'Items', value: data?.itemsCount ?? 0, sublabel: 'Total Items', icon: 'fa-archive', color: '#d97706', page: 'items' },
    { label: 'Orders', value: data?.activeOrdersCount ?? 0, sublabel: 'Active Orders', icon: 'fa-box', color: '#ea580c', page: 'orders' },
    { label: 'Site Visits', value: data?.siteVisitsPending ?? 0, sublabel: 'Active Requests', icon: 'fa-location-dot', color: '#0891b2', page: 'site visits' },
    { label: 'Proforma Invoices', value: data?.proformaInvoicesThisMonth ?? 0, sublabel: 'This Month', icon: 'fa-file-invoice', color: '#2563eb', page: 'proforma invoices' },
    { label: 'Sales Invoices', value: data?.salesInvoicesThisMonth ?? 0, sublabel: 'This Month', icon: 'fa-file-invoice-dollar', color: '#059669', page: 'sales invoices' }
  ];

  return (
    <div className="kpi-grid-7">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="kpi-card"
          style={{ '--kpi-accent': kpi.color }}
          onClick={() => onNavigate?.(kpi.page)}
        >
          <div className="kpi-icon" style={{
            background: `linear-gradient(135deg, ${kpi.color}, ${kpi.color}dd)`
          }}>
            <i className={`fa-solid ${kpi.icon}`}></i>
          </div>
          <div className="kpi-info">
            <p>{kpi.label}</p>
            <h4>{kpi.value}</h4>
            <p>{kpi.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}