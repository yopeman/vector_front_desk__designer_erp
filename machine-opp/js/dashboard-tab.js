// Dashboard Tab Component
class DashboardTab {
    constructor() {
        this.init();
    }
    init() {
        // Dashboard initialization handled by dashboard.js
    }
    activate() {
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
    }
}
const dashboardTab = new DashboardTab();