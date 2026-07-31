// =============================================
// DASHBOARD MODULE
// =============================================

// Dashboard data references (populated from mock-data.js and other modules)

// =============================================
// DASHBOARD STATS UPDATE
// =============================================
function updateDashboardStats() {
    const total = ordersData.length;
    const urgent = ordersData.filter(o => o.priority === 'urgent').length;
    const completed = completedOrdersData.length;
    const storeItems = localStoreItemsList ? localStoreItemsList.length : 0;
    
    const totalEl = document.getElementById('dash-stats-total');
    const urgentEl = document.getElementById('dash-stats-urgent');
    const completedEl = document.getElementById('dash-stats-completed');
    const storeEl = document.getElementById('dash-stats-store');
    
    if (totalEl) totalEl.textContent = total;
    if (urgentEl) urgentEl.textContent = urgent;
    if (completedEl) completedEl.textContent = completed;
    if (storeEl) storeEl.textContent = storeItems;
}

// =============================================
// DASHBOARD CHARTS RENDERING
// =============================================
function renderDashboardCharts() {
    const priorityColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const priorityData = [
        { label: 'Urgent', value: ordersData.filter(o => o.priority === 'urgent').length },
        { label: 'Normal', value: ordersData.filter(o => o.priority === 'normal').length },
        { label: 'Low', value: ordersData.filter(o => o.priority === 'low').length }
    ];
    drawPieChart('chart-priority', priorityData, priorityColors);

    const moduleColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const moduleData = [
        { label: 'Received', value: ordersData.filter(o => o.module === 'received-orders').length },
        { label: 'Completed', value: completedOrdersData.length },
        { label: 'Rework', value: ordersData.filter(o => o.module === 'rework').length },
        { label: 'Store', value: localStoreItemsList ? localStoreItemsList.length : 0 }
    ];
    drawBarChart('chart-module', moduleData, moduleColors);

    const storeColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    const storeData = [
        { label: 'Brass', value: localStoreItemsList ? localStoreItemsList.filter(i => (i.material || '').toLowerCase().includes('brass')).length : 0 },
        { label: 'Steel', value: localStoreItemsList ? localStoreItemsList.filter(i => (i.material || '').toLowerCase().includes('steel')).length : 0 },
        { label: 'Acrylic', value: localStoreItemsList ? localStoreItemsList.filter(i => (i.material || '').toLowerCase().includes('acrylic')).length : 0 },
        { label: 'Other', value: localStoreItemsList ? localStoreItemsList.filter(i => !['brass','steel','acrylic'].some(m => (i.material || '').toLowerCase().includes(m))).length : 0 }
    ];
    drawPieChart('chart-store', storeData, storeColors);
}

// =============================================
// DASHBOARD INITIALIZATION
// =============================================
function initDashboard() {
    updateDashboardStats();
    renderDashboardCharts();
}