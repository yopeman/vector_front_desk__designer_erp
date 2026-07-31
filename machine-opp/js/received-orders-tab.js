// Received Orders Tab Component
class ReceivedOrdersTab {
    constructor() {
        this.init();
    }
    init() {
        // Received orders initialization handled by received-orders.js
    }
    activate() {
        if (typeof renderOrdersTable === 'function') renderOrdersTable();
    }
}
const receivedOrdersTab = new ReceivedOrdersTab();