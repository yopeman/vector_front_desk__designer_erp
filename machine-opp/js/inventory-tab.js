// Inventory Tab Component
class InventoryTab {
    constructor() {
        this.init();
    }
    init() {
        // Inventory initialization handled by inventory.js
    }
    activate() {
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
    }
}
const inventoryTab = new InventoryTab();
