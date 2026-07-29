import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// ── Chart data processing helpers ──

function processStatusDistribution(orders) {
  const counts = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function processMonthlySales(invoices, sixMonthsAgo) {
  const months = {};
  const start = new Date(sixMonthsAgo);
  for (let i = 0; i < 6; i++) {
    const m = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = m.toISOString().slice(0, 7);
    months[key] = 0;
  }
  invoices.forEach(inv => {
    const key = (inv.issue_date || '').slice(0, 7);
    if (months[key] !== undefined) months[key] += inv.grand_total || 0;
  });
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return Object.entries(months).map(([key, val]) => {
    const [y, m] = key.split('-');
    return { month: monthNames[parseInt(m)-1], value: val };
  });
}

function processPaymentMethods(payments) {
  const counts = {};
  payments.forEach(p => {
    const method = p.payment_method || 'Unknown';
    counts[method] = (counts[method] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function processClientTypes(clients) {
  const counts = {};
  clients.forEach(c => {
    const type = c.client_type || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export default function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    // KpiGrid7
    leadsCount: 0,
    clientsCount: 0,
    itemsCount: 0,
    activeOrdersCount: 0,
    siteVisitsPending: 0,
    proformaInvoicesThisMonth: 0,
    salesInvoicesThisMonth: 0,

    // KpiGrid6
    todaySales: 0,
    outstandingReceivables: 0,
    activeProductionJobs: 0,
    pendingApprovals: 0,
    scheduledInstallations: 0,
    customerSatisfaction: 0,

    // MiddleGrid - Business Overview
    salesMtd: 0,
    salesMtdTrend: 0,
    receivablesTotal: 0,
    receivablesTrend: 0,
    productionJobsCount: 0,
    pendingApprovalsCount: 0,

    // MiddleGrid - Activities (recent items)
    recentActivities: [],

    // MiddleGrid - Notifications
    notifications: [],

    // BottomGrid - Notes
    notes: [],

    // BottomGrid - Horizon Metrics
    totalOrders: 0,
    inProduction: 0,
    deliveriesThisMonth: 0,
    installationsScheduled: 0,
    warrantyClaims: 0,
    averageRating: 0,

    // Chart data
    orderStatusDistribution: [],
    monthlySales: [],
    paymentMethodDistribution: [],
    clientTypeDistribution: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Run all queries in parallel
      // Chart data queries - parallel
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

      const [
        leadsRes,
        clientsRes,
        itemsRes,
        ordersActiveRes,
        siteVisitsPendingRes,
        proformaRes,
        salesInvoiceRes,
        todaySalesRes,
        invoicesUnpaidRes,
        productionJobsRes,
        designsPendingRes,
        installationsScheduledRes,
        feedbacksRes,
        salesMtdRes,
        recentClientsRes,
        notificationsRes,
        notesRes,
        warrantiesRes,
        deliveriesRes,
        totalOrdersRes,
        orderStatusRes,
        monthlySalesRes,
        paymentMethodsRes,
        clientTypesRes,
      ] = await Promise.all([
        // Leads count
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('client_type', 'lead'),
        // Clients count
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('client_type', 'client'),
        // Items count
        supabase.from('items').select('id', { count: 'exact', head: true }),
        // Active orders
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['New', 'In Progress', 'In Production']),
        // Pending site visits
        supabase.from('site_visits').select('id', { count: 'exact', head: true }).in('status', ['Pending', 'Scheduled', 'In Progress']),
        // Proforma invoices this month
        supabase.from('invoices').select('id', { count: 'exact', head: true })
          .eq('invoice_type', 'Proforma').gte('issue_date', monthStart),
        // Sales invoices this month
        supabase.from('invoices').select('id', { count: 'exact', head: true })
          .eq('invoice_type', 'Sales Invoice').gte('issue_date', monthStart),
        // Today's sales (invoices issued today)
        supabase.from('invoices').select('grand_total')
          .eq('invoice_type', 'Sales Invoice').gte('issue_date', todayStart),
        // Outstanding receivables (unpaid/partially paid invoices)
        supabase.from('invoices').select('balance')
          .in('status', ['Unpaid', 'Partially Paid']),
        // Active production jobs
        supabase.from('job_orders').select('id', { count: 'exact', head: true })
          .in('order_status', ['Pending', 'Started']),
        // Pending design approvals
        supabase.from('designs').select('id', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        // Scheduled installations
        supabase.from('installations').select('id', { count: 'exact', head: true })
          .in('status', ['Scheduled', 'In Progress']),
        // Feedbacks for average rating
        supabase.from('feedbacks').select('overall_rating'),
        // MTD sales (all sales invoices this month)
        supabase.from('invoices').select('grand_total')
          .eq('invoice_type', 'Sales Invoice').gte('issue_date', monthStart),
        // Recent clients (for activities)
        supabase.from('clients').select('name, client_type, created_at')
          .order('created_at', { ascending: false }).limit(5),
        // Notifications
        supabase.from('notifications').select('*')
          .order('created_at', { ascending: false }).limit(5),
        // Notes
        supabase.from('notes').select('title, content, color, pinned')
          .order('updated_at', { ascending: false }).limit(4),
        // Active warranty claims
        supabase.from('warranties').select('id', { count: 'exact', head: true })
          .in('status', ['New', 'In Progress']),
        // Deliveries this month
        supabase.from('deliveries').select('id', { count: 'exact', head: true })
          .gte('scheduled_date', monthStart),
        // Total orders
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        // Order status distribution
        supabase.from('orders').select('status'),
        // Monthly sales last 6 months
        supabase.from('invoices').select('issue_date, grand_total')
          .eq('invoice_type', 'Sales Invoice').gte('issue_date', sixMonthsAgo)
          .order('issue_date', { ascending: true }),
        // Payment methods distribution
        supabase.from('payments').select('payment_method'),
        // Client type distribution
        supabase.from('clients').select('client_type'),
      ]);

      // Calculate today's sales total
      const todaySalesTotal = (todaySalesRes.data || []).reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
      
      // Calculate outstanding receivables
      const outstandingTotal = (invoicesUnpaidRes.data || []).reduce((sum, inv) => sum + (inv.balance || 0), 0);
      
      // Calculate MTD sales
      const mtdSalesTotal = (salesMtdRes.data || []).reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
      
      // Calculate average customer satisfaction
      const ratings = feedbacksRes.data || [];
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, f) => {
            const ratingMap = { 'Excellent': 5, 'Good': 4, 'Average': 3, 'Poor': 2 };
            return sum + (ratingMap[f.overall_rating] || 0);
          }, 0) / ratings.length).toFixed(1)
        : 0;

      // Build recent activities
      const recentActivities = (recentClientsRes.data || []).map(c => ({
        icon: c.client_type === 'client' ? 'fa-user' : 'fa-user-plus',
        color: c.client_type === 'client' ? '#2563eb' : '#059669',
        title: c.client_type === 'client' ? 'New Client Registered' : 'New Lead Added',
        time: c.created_at ? new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
      }));

      // Build notifications
      const notifs = (notificationsRes.data || []).map(n => ({
        icon: n.icon || 'fa-bell',
        color: n.color || '#2563eb',
        title: n.title || '',
        desc: n.body || '',
        time: n.created_at ? new Date(n.created_at).toLocaleDateString() : '',
      }));

      // Build notes
      const noteItems = (notesRes.data || []).map(n => n.title || n.content || '');

      setData({
        leadsCount: leadsRes.count || 0,
        clientsCount: clientsRes.count || 0,
        itemsCount: itemsRes.count || 0,
        activeOrdersCount: ordersActiveRes.count || 0,
        siteVisitsPending: siteVisitsPendingRes.count || 0,
        proformaInvoicesThisMonth: proformaRes.count || 0,
        salesInvoicesThisMonth: salesInvoiceRes.count || 0,

        todaySales: todaySalesTotal,
        outstandingReceivables: outstandingTotal,
        activeProductionJobs: productionJobsRes.count || 0,
        pendingApprovals: designsPendingRes.count || 0,
        scheduledInstallations: installationsScheduledRes.count || 0,
        customerSatisfaction: parseFloat(avgRating),

        salesMtd: mtdSalesTotal,
        salesMtdTrend: 12, // placeholder
        receivablesTotal: outstandingTotal,
        receivablesTrend: -5, // placeholder
        productionJobsCount: productionJobsRes.count || 0,
        pendingApprovalsCount: designsPendingRes.count || 0,

        recentActivities,
        notifications: notifs,
        notes: noteItems,

        // Process order status distribution
        orderStatusDistribution: processStatusDistribution(orderStatusRes.data || []),
        // Process monthly sales
        monthlySales: processMonthlySales(monthlySalesRes.data || [], sixMonthsAgo),
        // Process payment methods
        paymentMethodDistribution: processPaymentMethods(paymentMethodsRes.data || []),
        // Process client types
        clientTypeDistribution: processClientTypes(clientTypesRes.data || []),

        totalOrders: totalOrdersRes.count || 0,
        inProduction: productionJobsRes.count || 0,
        deliveriesThisMonth: deliveriesRes.count || 0,
        installationsScheduled: installationsScheduledRes.count || 0,
        warrantyClaims: warrantiesRes.count || 0,
        averageRating: parseFloat(avgRating),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { loading, data, refetch: fetchData };
}