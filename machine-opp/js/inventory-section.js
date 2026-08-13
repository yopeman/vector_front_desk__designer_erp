// inventory Section Component
// Renders the inventory section HTML

class InventorySection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-inventory');
        if (container) {
            container.innerHTML = `<!-- Header with stats summary -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-warehouse text-emerald-400"></i>
                            Inventory Management
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">
                            Manage stock items and track current inventory levels.
                        </p>
                    </div>
                </div>

                <!-- Stats Summary Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4" id="inventory-stats-container">
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-boxes-stacked text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Items</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="inventory-stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-cubes text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Quantity</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="inventory-stats-qty">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-triangle-exclamation text-amber-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Low Stock</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="inventory-stats-low">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-ban text-red-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inactive</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="inventory-stats-inactive">0</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Action Buttons Row -->
                    <div class="lg:col-span-12">
                        <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 shadow-lg hover:shadow-xl transition-shadow">
                            <div class="flex items-center gap-3 text-slate-400 text-xs">
                                <i class="fa-solid fa-bolt text-amber-400"></i>
                                <span class="font-medium">Quick Actions</span>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                                <button onclick="openInventoryModal()" class="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-plus text-xs"></i> <span>Add New Item</span>
                                </button>
                                <button onclick="openMovementModal('in')" class="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-arrow-down text-xs"></i> <span>Stock IN</span>
                                </button>
                                <button onclick="openMovementModal('out')" class="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm shadow-lg shadow-red-500/15 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-arrow-up text-xs"></i> <span>Stock OUT</span>
                                </button>
                                <button onclick="refreshInventory()" class="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-rotate text-xs"></i> <span>Refresh</span>
                                </button>
                            </div>
                        </div>
                    </div>
                        
                    <!-- Inventory Table Panel -->
                    <div class="lg:col-span-12 space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                                <i class="fa-solid fa-list text-blue-400 mr-2"></i>
                                Inventory Items List
                            </h3>
                            <div class="flex items-center gap-2">
                                <input type="text" id="inventory-search" placeholder="Search items..." class="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all w-48">
                            </div>
                        </div>
                        
                        <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                            <div class="table-wrapper max-h-[500px] overflow-y-auto">
                                <table class="w-full text-left border-collapse min-w-[900px]">
                                    <thead class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th class="p-3 text-center w-12">#</th>
                                            <th class="p-3">Item Code</th>
                                            <th class="p-3">Name</th>
                                            <th class="p-3">Category</th>
                                            <th class="p-3">Unit</th>
                                            <th class="p-3 text-center">Current Qty</th>
                                            <th class="p-3 text-center">Min Stock</th>
                                            <th class="p-3">Location</th>
                                            <th class="p-3">Status</th>
                                            <th class="p-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="inventory-items-body" class="divide-y divide-slate-800 text-sm text-slate-300">
                                        <!-- Dynamic rows will append here -->
                                        <tr id="inventory-empty-placeholder" class="text-slate-500 italic">
                                            <td colspan="10" class="p-8 text-center">No inventory items found. Click "Add New Item" to add items.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <!-- No results state -->
                            <div id="inventory-no-results" class="hidden flex flex-col items-center justify-center py-12 px-4">
                                <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                                    <i class="fa-solid fa-box-open text-2xl text-slate-500"></i>
                                </div>
                                <p class="text-slate-400 font-medium">No items found</p>
                                <p class="text-xs text-slate-500 mt-1">Try adjusting your search or add new items</p>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new InventorySection();
});
