// =============================================
// DASHBOARD MODULE
// =============================================

// Dashboard data references (populated from Supabase)

// =============================================
// FETCH DASHBOARD DATA FROM SUPABASE
// =============================================
async function fetchDashboardData() {
    // Fetch received orders
    if (typeof fetchReceivedOrders === 'function') {
        await fetchReceivedOrders();
    }
    
    // Fetch completed orders
    if (typeof fetchCompletedOrders === 'function') {
        await fetchCompletedOrders();
    }
    
    // Fetch machine maintenance data
    if (typeof fetchMachinesAndChecklists === 'function') {
        await fetchMachinesAndChecklists();
    }
}

// =============================================
// DASHBOARD STATS UPDATE
// =============================================
async function updateDashboardStats() {
    // Ensure data is fetched first
    await fetchDashboardData();
    
    const total = ordersData.length;
    const urgent = ordersData.filter(o => o.priority === 'urgent').length;
    const completed = completedOrdersData.length;
    
    // Calculate maintenance stats from machineData
    let maintenanceCount = 0;
    const machineKeys = Object.keys(machineData);
    machineKeys.forEach(key => {
        const machine = machineData[key];
        if (machine && machine.status === 'maintenance') {
            maintenanceCount++;
        }
    });
    
    const totalEl = document.getElementById('dash-stats-total');
    const urgentEl = document.getElementById('dash-stats-urgent');
    const completedEl = document.getElementById('dash-stats-completed');
    const maintenanceEl = document.getElementById('dash-stats-maintenance');
    
    if (totalEl) totalEl.textContent = total;
    if (urgentEl) urgentEl.textContent = urgent;
    if (completedEl) completedEl.textContent = completed;
    if (maintenanceEl) maintenanceEl.textContent = maintenanceCount;
}

// =============================================
// DASHBOARD CHARTS RENDERING
// =============================================
async function renderDashboardCharts() {
    // Ensure data is fetched first
    await fetchDashboardData();
    
    const priorityColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const priorityData = [
        { label: 'Urgent', value: ordersData.filter(o => o.priority === 'urgent').length },
        { label: 'Normal', value: ordersData.filter(o => o.priority === 'normal').length },
        { label: 'Low', value: ordersData.filter(o => o.priority === 'low').length }
    ];
    drawPieChart('chart-priority', priorityData, priorityColors);

    const moduleColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const moduleData = [
        { label: 'Received', value: ordersData.length },
        { label: 'Completed', value: completedOrdersData.length },
        { label: 'Rework', value: 0 }, // Rework data not yet integrated
        { label: 'Store', value: localStoreItemsList ? localStoreItemsList.length : 0 }
    ];
    drawBarChart('chart-module', moduleData, moduleColors);

    // Machine maintenance chart by status
    const maintenanceColors = ['#10b981', '#f59e0b', '#ef4444'];
    let activeCount = 0;
    let maintenanceCount = 0;
    let inactiveCount = 0;
    
    const machineKeys = Object.keys(machineData);
    machineKeys.forEach(key => {
        const machine = machineData[key];
        if (machine) {
            if (machine.status === 'active') activeCount++;
            else if (machine.status === 'maintenance') maintenanceCount++;
            else if (machine.status === 'inactive') inactiveCount++;
        }
    });
    
    const maintenanceData = [
        { label: 'Active', value: activeCount },
        { label: 'Maintenance', value: maintenanceCount },
        { label: 'Inactive', value: inactiveCount }
    ];
    drawPieChart('chart-maintenance', maintenanceData, maintenanceColors);
}

// =============================================
// DASHBOARD INITIALIZATION
// =============================================
async function initDashboard() {
    await updateDashboardStats();
    await renderDashboardCharts();
}