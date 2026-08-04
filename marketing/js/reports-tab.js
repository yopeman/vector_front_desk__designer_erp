// Reports Tab Component
class ReportsTab {
    constructor() {
        this.init();
    }
    init() {
        // Reports initialization handled by reports.js
    }
    activate() {
        if (typeof filterReports === 'function') filterReports();
    }
}
const reportsTab = new ReportsTab();
