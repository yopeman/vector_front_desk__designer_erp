// Store Request Tab Component
class StoreRequestTab {
    constructor() {
        this.init();
    }
    init() {
        // Store request initialization handled by store-request.js
    }
    activate() {
        if (typeof renderStoreItemsTable === 'function') renderStoreItemsTable();
    }
}
const storeRequestTab = new StoreRequestTab();