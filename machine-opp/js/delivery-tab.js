// Delivery Tab Component
class DeliveryTab {
    constructor() {
        this.init();
    }
    init() {
        // Delivery initialization handled by delivery.js
    }
    activate() {
        if (typeof renderDeliveryTable === 'function') renderDeliveryTable();
    }
}
const deliveryTab = new DeliveryTab();
