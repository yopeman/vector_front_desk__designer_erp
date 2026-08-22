// ── Pure SVG Charts Dashboard – no external deps ──

const STATUS_COLORS = {
  'New': '#2563eb',
  'In Progress': '#ea580c',
  'In Production': '#7c3aed',
  'Completed': '#059669',
  'Cancelled': '#dc2626',
};
const STATUS_COLORS_LIST = ['#2563eb','#ea580c','#7c3aed','#059669','#dc2626','#0891b2','#d97706','#64748b'];

function formatETB(v) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toString();
}

// ── Horizontal Bar Chart for Monthly Sales ──
function SalesBarChart({ data, width = 320, height = 180 }) {
  if (!data || data.length === 0) {
    return <div style={{height, display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:'12px',background:'#f8fafc',borderRadius:'8px'}}>No sales data</div>;
  }
  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const pad = 40, rowH = Math.min(24, (height - 20) / data.length);
  const barH = Math.max(8, rowH - 6);

  return (
    <svg width={width} height={height} style={{display:'block'}}>
      {data.map((d, i) => {
        const y = pad + i * rowH;
        const barW = (d.value / maxVal) * (width - pad - 60);
        return (
          <g key={i}>
            <text x={0} y={y + barH / 2 + 4} fontSize="9" fill="#64748b" textAnchor="start">{d.month}</text>
            <rect x={pad} y={y} width={Math.max(barW, 2)} height={barH} rx={3} fill={STATUS_COLORS_LIST[i % STATUS_COLORS_LIST.length]} />
            <text x={pad + Math.max(barW, 2) + 4} y={y + barH / 2 + 4} fontSize="9" fill="#475569" textAnchor="start">
              ETB {formatETB(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ──
function DonutChart({ data, size = 160, thickness = 30, colors = STATUS_COLORS_LIST }) {
  if (!data || data.reduce((s, d) => s + d.value, 0) === 0) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f1f5f9', color: '#94a3b8', fontSize: '11px'
      }}>
        No data
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = (size - thickness) / 2;
  let cumulative = 0;

  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * 360 - 90;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 360 - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = d.value / total > 0.5 ? 1 : 0;

    return (
      <path key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={colors[i % colors.length]}
        opacity="0.9"
      />
    );
  });

  return (
    <svg width={size} height={size} style={{display:'block'}}>
      {slices}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="#fff" />
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#64748b">Total</text>
    </svg>
  );
}

// ── Donut Legend ──
function DonutLegend({ data, colors = STATUS_COLORS_LIST }) {
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:'6px 12px', marginTop:'8px'}}>
      {data.map((d, i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', color:'#475569'}}>
          <span style={{width:'10px', height:'10px', borderRadius:'3px', background: colors[i % colors.length], flexShrink:0}}></span>
          <span>{d.name}: {d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Summary KPI strip ──
function KpiStrip({ metrics }) {
  return (
    <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          flex:1, minWidth:'80px', background:'#f8fafc', borderRadius:'8px',
          padding:'8px 10px', textAlign:'center'
        }}>
          <div style={{fontSize:'9px', color:'#64748b', textTransform:'uppercase', fontWeight:600}}>{m.label}</div>
          <div style={{fontSize:'16px', fontWeight:700, color:'#1e293b', margin:'2px 0'}}>{m.value}</div>
          <div style={{fontSize:'9px', color:m.color || '#94a3b8'}}>{m.sublabel}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Chart Dashboard ──
export default function DashboardCharts({ data }) {
  const orderStatus = data?.orderStatusDistribution || [];
  const monthlySales = data?.monthlySales || [];
  const paymentMethods = data?.paymentMethodDistribution || [];
  const clientTypes = data?.clientTypeDistribution || [];

  const totalSales = monthlySales.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
      {/* KPI strip */}
      <KpiStrip metrics={[
        {label:'Total Orders', value: data?.totalOrders ?? 0, sublabel:'All time', color:'#2563eb'},
        {label:'MTD Sales', value: 'ETB ' + formatETB(data?.salesMtd ?? 0), sublabel:'This month', color:'#059669'},
        {label:'Avg Rating', value: (data?.averageRating ?? 0) + '/5', sublabel:'Feedback', color:'#7c3aed'},
        {label:'Production', value: data?.inProduction ?? 0, sublabel:'Active jobs', color:'#ea580c'},
      ]} />

      {/* Sales Bar Chart */}
      <div style={{background:'#ffffff', borderRadius:'10px', padding:'16px', border:'1px solid #e8edf3'}}>
        <div style={{fontSize:'11px', fontWeight:700, textTransform:'uppercase', color:'#334155', marginBottom:'10px'}}>
          Monthly Sales Trend (Last 6 Months)
        </div>
        <div style={{display:'flex', alignItems:'flex-start', gap:'16px', flexWrap:'wrap'}}>
          <SalesBarChart data={monthlySales} width={340} height={Math.max(140, (monthlySales.length || 1) * 24 + 30)} />
          <div style={{minWidth:'120px'}}>
            <div style={{fontSize:'28px', fontWeight:700, color:'#1e293b'}}>ETB {formatETB(totalSales)}</div>
            <div style={{fontSize:'10px', color:'#64748b'}}>Total last 6 months</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
        {/* Order Status Donut */}
        <div style={{background:'#ffffff', borderRadius:'10px', padding:'16px', border:'1px solid #e8edf3'}}>
          <div style={{fontSize:'11px', fontWeight:700, textTransform:'uppercase', color:'#334155', marginBottom:'8px'}}>Order Status</div>
          <div style={{display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap'}}>
            <DonutChart data={orderStatus} size={130} thickness={26} />
            <DonutLegend data={orderStatus} />
          </div>
        </div>

        {/* Client Types Donut */}
        <div style={{background:'#ffffff', borderRadius:'10px', padding:'16px', border:'1px solid #e8edf3'}}>
          <div style={{fontSize:'11px', fontWeight:700, textTransform:'uppercase', color:'#334155', marginBottom:'8px'}}>Clients / Leads</div>
          <div style={{display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap'}}>
            <DonutChart data={clientTypes} size={130} thickness={26} colors={['#2563eb','#7c3aed','#d97706']} />
            <DonutLegend data={clientTypes} colors={['#2563eb','#7c3aed','#d97706']} />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{background:'#ffffff', borderRadius:'10px', padding:'16px', border:'1px solid #e8edf3'}}>
        <div style={{fontSize:'11px', fontWeight:700, textTransform:'uppercase', color:'#334155', marginBottom:'8px'}}>Payment Methods</div>
        <div style={{display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap'}}>
          <DonutChart data={paymentMethods} size={120} thickness={22} />
          <DonutLegend data={paymentMethods} />
        </div>
      </div>
    </div>
  );
}