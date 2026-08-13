// Inventory Movements Tab Component
class InventoryMovementsTab {
    constructor() {
        this.init();
    }
    init() {
        // Inventory movements initialization handled by inventory-movements.js
    }
    activate() {
        if (typeof renderInventoryMovementsTable === 'function') renderInventoryMovementsTable();
    }
}
const inventoryMovementsTab = new InventoryMovementsTab();
