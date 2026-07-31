// Completed Orders Tab Component
class CompletedOrdersTab {
    constructor() {
        this.init();
    }
    init() {
        // Completed orders initialization handled by completed-orders.js
    }
    activate() {
        if (typeof renderCompletedOrdersTable === 'function') renderCompletedOrdersTable();
    }
}
const completedOrdersTab = new CompletedOrdersTab();