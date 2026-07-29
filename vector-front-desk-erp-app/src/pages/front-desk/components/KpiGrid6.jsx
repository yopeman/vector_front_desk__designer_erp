function formatETB(amount) {
  return 'ETB ' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function KpiGrid6({ data, onNavigate }) {
  const kpis = [
    { label: "Today's Sales", value: formatETB(data?.todaySales ?? 0), sublabel: 'Today', icon: 'fa-dollar-sign', color: '#ea580c', page: 'sales invoices' },
    { label: 'Outstanding Receivables', value: formatETB(data?.outstandingReceivables ?? 0), sublabel: 'Total Due', icon: 'fa-hand-holding-dollar', color: '#dc2626', page: 'payments' },
    { label: 'Active Production Jobs', value: data?.activeProductionJobs ?? 0, sublabel: 'In Progress', icon: 'fa-gears', color: '#2563eb', page: 'job orders' },
    { label: 'Pending Approvals', value: data?.pendingApprovals ?? 0, sublabel: 'Designs', icon: 'fa-circle-check', color: '#7c3aed', page: 'design status' },
    { label: 'Scheduled Installations', value: data?.scheduledInstallations ?? 0, sublabel: 'Upcoming', icon: 'fa-wrench', color: '#0891b2', page: 'installation' },
    { label: 'Customer Satisfaction', value: (data?.customerSatisfaction ?? 0) + '/5', sublabel: 'This Month', icon: 'fa-face-smile', color: '#059669', page: 'feedback' }
  ];

  return (
    <div className="kpi-grid-6">
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