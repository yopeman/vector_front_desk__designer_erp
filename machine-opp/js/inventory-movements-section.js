// inventory-movements Section Component
// Renders the inventory movements section HTML

class InventoryMovementsSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-inventory-movements');
        if (container) {
            container.innerHTML = `<!-- Header with stats summary -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-arrow-right-arrow-left text-blue-400"></i>
                            Stock Movements
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">
                            Track all stock in/out transactions.
                        </p>
                    </div>
                </div>

                <!-- Stats Summary Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4" id="movements-stats-container">
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-arrow-down text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total IN</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="movements-stats-in">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-arrow-up text-red-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total OUT</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="movements-stats-out">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-clock-rotate-left text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="movements-stats-today">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-list-check text-purple-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Movements</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="movements-stats-total">0</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Movements Table Panel -->
                    <div class="lg:col-span-12 space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                                <i class="fa-solid fa-list text-blue-400 mr-2"></i>
                                Stock Movement History
                            </h3>
                            <div class="flex items-center gap-2">
                                <select id="movement-filter-type" class="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all">
                                    <option value="">All Types</option>
                                    <option value="in">IN Only</option>
                                    <option value="out">OUT Only</option>
                                </select>
                                <input type="text" id="movement-search" placeholder="Search..." class="bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all w-40">
                            </div>
                        </div>
                        
                        <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                            <div class="table-wrapper max-h-[500px] overflow-y-auto">
                                <table class="w-full text-left border-collapse min-w-[1000px]">
                                    <thead class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th class="p-3 text-center w-12">#</th>
                                            <th class="p-3">Date</th>
                                            <th class="p-3">Item</th>
                                            <th class="p-3">Type</th>
                                            <th class="p-3 text-center">Quantity</th>
                                            <th class="p-3">Reference Type</th>
                                            <th class="p-3">Performed By</th>
                                            <th class="p-3">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody id="movements-body" class="divide-y divide-slate-800 text-sm text-slate-300">
                                        <!-- Dynamic rows will append here -->
                                        <tr id="movements-empty-placeholder" class="text-slate-500 italic">
                                            <td colspan="10" class="p-8 text-center">No stock movements found. Click "Stock IN" or "Stock OUT" to record movements.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <!-- No results state -->
                            <div id="movements-no-results" class="hidden flex flex-col items-center justify-center py-12 px-4">
                                <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                                    <i class="fa-solid fa-box-open text-2xl text-slate-500"></i>
                                </div>
                                <p class="text-slate-400 font-medium">No movements found</p>
                                <p class="text-xs text-slate-500 mt-1">Try adjusting your filters or add new movements</p>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new InventoryMovementsSection();
    // Initialize inventory movements module
    if (typeof initInventoryMovements === 'function') {
        initInventoryMovements();
    }
});
