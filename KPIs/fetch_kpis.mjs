import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ quiet: true })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE key in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const now = new Date()
const today = now.toISOString().slice(0, 10)
const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

// Fetch rows and swallow errors so one failing module doesn't break the script
const safe = async (name, fn) => {
  try {
    const { data, error } = await fn()
    if (error) {
      console.error(`[${name}] ${error.message}`)
      return []
    }
    return data || []
  } catch (err) {
    console.error(`[${name}] ${err.message}`)
    return []
  }
}

const countBy = (rows, key) => {
  const counts = {}
  rows.forEach((r) => {
    const value = r[key] || 'Unknown'
    counts[value] = (counts[value] || 0) + 1
  })
  return counts
}

const sum = (rows, key) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)

const pct = (part, total) => (total ? Number(((part / total) * 100).toFixed(1)) : 0)

const fetchKpis = async () => {
  // Shared raw data used by multiple departments
  const [clients, orders, invoices, designs, designVersions, jobOrders, productionOrders,
    machines, maintenanceLogs, payments, siteVisits] = await Promise.all([
    safe('clients', () => supabase.from('clients').select('client_type, status, followup_date, created_at')),
    safe('orders', () => supabase.from('orders').select('status, order_date, total_amount, created_at')),
    safe('invoices', () => supabase.from('invoices').select('invoice_type, status, issue_date, grand_total, paid_amount, balance, created_at')),
    safe('designs', () => supabase.from('designs').select('status, requested_date, required_date, created_at')),
    safe('design_versions', () => supabase.from('design_versions').select('status, version_number, created_at')),
    safe('job_orders', () => supabase.from('job_orders').select('order_status, expected_date, delivery_time, created_at')),
    safe('production_orders', () => supabase.from('production_orders').select('status, job_type, quality_status, machine_id, completed_at, created_at')),
    safe('machines', () => supabase.from('machines').select('id, name, status')),
    safe('machine_maintenance_logs', () => supabase.from('machine_maintenance_logs').select('status, performed_at, notes')),
    safe('payments', () => supabase.from('payments').select('payment_date, amount_paid, created_at')),
    safe('site_visits', () => supabase.from('site_visits').select('status, created_at')),
  ])

  const invoicesLists = {
    proforma: invoices.filter((i) => i.invoice_type === 'Proforma'),
    sales: invoices.filter((i) => i.invoice_type === 'Sales Invoice'),
  }

  const leads = clients.filter((c) => c.client_type === 'lead')
  const leadsCount = leads.length
  const clientsCount = clients.filter((c) => c.client_type === 'client').length

  // ── Marketing: Campaigns, leads, conversion, marketing performance ──
  const [mrktCampaigns, mrktProposals, mrktTenders, mrktTargets, mrktActivities, mrkClients] = await Promise.all([
    safe('mrkt_campaigns', () => supabase.from('mrkt_campaigns').select('status, start_date, end_date')),
    safe('mrkt_proposals', () => supabase.from('mrkt_proposals').select('status, amount, created_at')),
    safe('mrkt_tenders', () => supabase.from('mrkt_tenders').select('status, amount, created_at')),
    safe('mrkt_campaign_targets', () => supabase.from('mrkt_campaign_targets').select('metric, target_value, actual_value')),
    safe('mrkt_activities', () => supabase.from('mrkt_activities').select('status')),
    safe('mrk_clients', () => supabase.from('mrk_clients').select('id')),
  ])

  const campaignStatus = countBy(mrktCampaigns, 'status')
  const proposalStatus = countBy(mrktProposals, 'status')
  const tenderStatus = countBy(mrktTenders, 'status')
  const convertedProposals = (proposalStatus.accepted || 0)
  const submittedProposals = (proposalStatus.submitted || 0) + convertedProposals

  const marketing = {
    campaigns: {
      total: mrktCampaigns.length,
      byStatus: campaignStatus,
    },
    leads: {
      leads: leadsCount,
      totalClients: clientsCount,
      marketingLeads: mrkClients.length,
    },
    conversion: {
      proposalsSubmitted: submittedProposals,
      proposalsAccepted: convertedProposals,
      proposalConversionRate: pct(convertedProposals, submittedProposals),
      tendersAwarded: tenderStatus.awarded || 0,
      tendersSubmitted: (tenderStatus.submitted || 0) + (tenderStatus.follow_up || 0) + (tenderStatus.awarded || 0),
      campaignTargets: mrktTargets.map((t) => ({
        metric: t.metric,
        target: Number(t.target_value) || 0,
        actual: Number(t.actual_value) || 0,
        attainment: pct(Number(t.actual_value) || 0, Number(t.target_value) || 0),
      })),
    },
    performance: {
      activeCampaigns: campaignStatus.active || 0,
      campaignTargetAchieved: mrktTargets.filter((t) => (Number(t.actual_value) || 0) >= (Number(t.target_value) || 0)).length,
      activities: {
        total: mrktActivities.length,
        byStatus: countBy(mrktActivities, 'status'),
      },
    },
  }

  // ── Front Desk: Inquiries, quotations, orders, approvals, follow-ups ──
  const orderStatus = countBy(orders, 'status')
  const proformaThisMonth = invoicesLists.proforma.filter((i) => (i.issue_date || '') >= monthStart).length
  const pendingFollowUps = clients.filter((c) => c.followup_date && c.followup_date >= today).length

  const frontDesk = {
    inquiries: {
      leads: leadsCount,
      totalClients: clients.length,
      siteVisits: siteVisits.length,
    },
    quotations: {
      total: invoicesLists.proforma.length,
      thisMonth: proformaThisMonth,
    },
    orders: {
      total: orders.length,
      thisMonth: orders.filter((o) => (o.order_date || '') >= monthStart).length,
      byStatus: orderStatus,
    },
    approvals: {
      pendingDesigns: designs.filter((d) => d.status === 'Pending').length,
      pendingProformaInvoices: invoices.filter((i) => i.status === 'Pending').length,
    },
    followUps: {
      due: pendingFollowUps,
      pendingSiteVisits: siteVisits.filter((v) => ['Pending', 'Scheduled'].includes(v.status)).length,
    },
  }

  // ── Production: Active jobs, progress, output, delays ──
  const activeJobOrders = jobOrders.filter((j) => ['Pending', 'Started'].includes(j.order_status)).length
  const activeProduction = productionOrders.filter((p) => ['New', 'In Progress'].includes(p.status)).length
  const completedProduction = productionOrders.filter((p) => p.status === 'Completed').length
  const delayedJobOrders = jobOrders.filter((j) => j.expected_date && j.expected_date < today && j.order_status !== 'Completed').length

  const production = {
    activeJobs: activeJobOrders + activeProduction,
    activeJobOrders,
    activeProductionOrders: activeProduction,
    progress: {
      inProgress: productionOrders.filter((p) => p.status === 'In Progress').length,
      inProduction: jobOrders.filter((j) => j.order_status === 'Started').length,
    },
    output: {
      completedJobs: jobOrders.filter((j) => j.order_status === 'Completed').length,
      completedProductionOrders: completedProduction,
      completedThisMonth: productionOrders.filter((p) => p.status === 'Completed' && (p.completed_at || '').slice(0, 7) >= monthStart.slice(0, 7)).length,
    },
    delays: delayedJobOrders,
  }

  // ── Machine: Utilization, output, downtime, material waste ──
  const machineMap = {}
  machines.forEach((m) => { machineMap[m.id] = m.name || 'Unknown' })

  const machineBatches = {}
  productionOrders.forEach((p) => {
    const key = p.machine_id
    if (!key) return
    if (!machineBatches[key]) machineBatches[key] = []
    machineBatches[key].push(p)
  })

  const machineStatus = countBy(machines, 'status')
  const maintenanceThisMonth = maintenanceLogs.filter((l) => (l.performed_at || '').slice(0, 7) >= monthStart.slice(0, 7)).length

  const machine = {
    utilization: {
      total: machines.length,
      byStatus: machineStatus,
      active: machines.filter((m) => m.status === 'active').length,
    },
    output: Object.entries(machineBatches).map(([machineId, orders2]) => ({
      machine: machineMap[machineId] || machineId,
      jobs: orders2.length,
      completed: orders2.filter((o) => o.status === 'Completed').length,
    })),
    downtime: {
      machinesInMaintenance: machineStatus.maintenance || 0,
      maintenanceLogs: maintenanceLogs.length,
      skippedMaintenance: maintenanceLogs.filter((l) => l.status === 'skipped').length,
    },
    waste: {
      failedQuality: productionOrders.filter((p) => p.quality_status === 'Fail').length,
      reworkJobs: productionOrders.filter((p) => p.job_type === 'rework').length,
    },
  }

  // ── Design: Requests, revisions, approvals, delayed designs ──
  const designStatus = countBy(designs, 'status')
  const versionStatus = countBy(designVersions, 'status')
  const delayedDesigns = designs.filter((d) => d.required_date && d.required_date < today && !['Completed', 'Cancelled'].includes(d.status)).length

  const design = {
    requests: {
      total: designs.length,
      byStatus: designStatus,
      thisMonth: designs.filter((d) => (d.created_at || '').slice(0, 7) >= monthStart.slice(0, 7)).length,
    },
    revisions: {
      total: designVersions.length,
      byStatus: versionStatus,
      averagePerDesign: designs.length ? Number((designVersions.length / designs.length).toFixed(1)) : 0,
    },
    approvals: {
      approvedVersions: versionStatus.Approved || 0,
      pendingDesigns: designStatus.Pending || 0,
    },
    delays: delayedDesigns,
  }

  // ── Creative Product Development: Ideas, prototypes, testing, launches ──
  const [ideaHub, prototypeRequests, designBom] = await Promise.all([
    safe('crt_idea_hub', () => supabase.from('crt_idea_hub').select('status, created_at')),
    safe('crt_prototype_requests', () => supabase.from('crt_prototype_requests').select('status, created_at')),
    safe('crt_design_bom', () => supabase.from('crt_design_bom').select('status, created_at')),
  ])

  const creative = {
    ideas: {
      total: ideaHub.length,
      byStatus: countBy(ideaHub, 'status'),
    },
    prototypes: {
      total: prototypeRequests.length,
      byStatus: countBy(prototypeRequests, 'status'),
    },
    testing: {
      total: designBom.length,
      byStatus: countBy(designBom, 'status'),
    },
    launches: {
      launched: prototypeRequests.filter((p) => p.status === 'Completed').length,
    },
  }

  // ── Maintenance: Preventive, breakdowns, downtime, repair costs ──
  const maintenance = {
    preventive: {
      totalLogs: maintenanceLogs.length,
      byStatus: countBy(maintenanceLogs, 'status'),
      thisMonth: maintenanceThisMonth,
    },
    breakdowns: machineStatus.maintenance || 0,
    downtime: {
      machinesInMaintenance: machineStatus.maintenance || 0,
      skippedMaintenance: maintenanceLogs.filter((l) => l.status === 'skipped').length,
      maintenanceLogs: maintenanceLogs.length,
    },
    repairCosts: null, // repair costs are not tracked in the database yet
  }

  // ── Finishing Team: Progress, quality control, rework, completed ──
  const finishing = {
    progress: {
      inProgress: productionOrders.filter((p) => p.status === 'In Progress').length,
      pending: productionOrders.filter((p) => p.status === 'New').length,
    },
    qualityControl: {
      byResult: countBy(productionOrders, 'quality_status'),
      passRate: pct(
        productionOrders.filter((p) => p.quality_status === 'Pass').length,
        productionOrders.filter((p) => p.quality_status).length
      ),
    },
    rework: {
      total: productionOrders.filter((p) => p.job_type === 'rework').length,
    },
    completed: completedProduction,
  }

  // ── Finance: Revenue, expenses, receivables, payables, cash flow ──
  const [mrktExpenses, financeSales, financePurchases] = await Promise.all([
    safe('mrkt_expenses', () => supabase.from('mrkt_expenses').select('amount, expense_date, approval_status')),
    safe('finance_sales', () => supabase.from('finance_sales').select('total_amount, net_amount, sales_date, status')),
    safe('finance_purchases', () => supabase.from('finance_purchases').select('total_amount, purchase_date, status, purchase_type')),
  ])

  const salesRevenue = sum(invoicesLists.sales, 'grand_total')
  const salesRevenueThisMonth = sum(
    invoicesLists.sales.filter((i) => (i.issue_date || '') >= monthStart),
    'grand_total'
  )
  const financeSalesTotal = sum(financeSales, 'net_amount')
  const receivables = invoices.filter((i) => ['Unpaid', 'Partially Paid'].includes(i.status))
  const approvedExpenses = mrktExpenses.filter((e) => e.approval_status === 'approved')
  const purchasesTotal = sum(financePurchases, 'total_amount')
  const cashIn = sum(payments, 'amount_paid')
  const purchasesThisMonth = sum(
    financePurchases.filter((p) => (p.purchase_date || '') >= monthStart),
    'total_amount'
  )
  const paymentsThisMonth = sum(
    payments.filter((p) => (p.payment_date || '').slice(0, 7) >= monthStart.slice(0, 7)),
    'amount_paid'
  )

  const finance = {
    revenue: {
      invoiced: salesRevenue,
      invoicedThisMonth: salesRevenueThisMonth,
      financeSales: financeSalesTotal,
      total: salesRevenue + financeSalesTotal,
    },
    expenses: {
      marketingExpenses: sum(approvedExpenses, 'amount'),
      purchases: purchasesTotal,
      total: sum(approvedExpenses, 'amount') + purchasesTotal,
    },
    receivables: {
      count: receivables.length,
      total: sum(receivables, 'balance'),
    },
    payables: {
      purchases: purchasesTotal,
    },
    cashFlow: {
      cashIn: cashIn,
      cashOut: purchasesTotal,
      net: cashIn - purchasesTotal,
      thisMonth: {
        cashIn: paymentsThisMonth,
        cashOut: purchasesThisMonth,
        net: paymentsThisMonth - purchasesThisMonth,
      },
    },
  }

  return {
    generated_at: now.toISOString(),
    departments: {
      marketing,
      frontDesk,
      production,
      machine,
      design,
      creative,
      maintenance,
      finishing,
      finance,
    },
  }
}

const kpis = await fetchKpis()
console.log(JSON.stringify(kpis, null, 2))