// store-request Section Component
// Renders the store-request section HTML

class StorerequestSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-store-request');
        if (container) {
            container.innerHTML = `<!-- Header with stats summary -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-boxes-stacked text-emerald-400"></i>
                            Store Request (የዕቃዎች መጠየቂያ ፎርም)
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">
                            Request and track raw material inventory. 
                            <span class="text-slate-500">(አድ ሲሉት መዝግቦ ከታች ያሳያል፤ ፎርሙም ይጸዳል)</span>
                        </p>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                        <i class="fa-regular fa-clock text-slate-400"></i>
                        <span>Order Sequence: Date <i class="fa-solid fa-chevron-right mx-1.5 text-[10px]"></i> Order # <i class="fa-solid fa-chevron-right mx-1.5 text-[10px]"></i> Title <i class="fa-solid fa-chevron-right mx-1.5 text-[10px]"></i> Material</span>
                    </div>
                </div>

                <!-- ===== NEW: Stats Summary Cards ===== -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="store-stats-container">
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-boxes-stacked text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Items</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="store-stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-cubes text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Quantity</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="store-stats-qty">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-layer-group text-amber-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Dispatch</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="store-stats-pending">0</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <!-- Action Buttons Row -->
                    <div class="lg:col-span-12">
                        <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 shadow-lg hover:shadow-xl transition-shadow">
                            <div class="flex items-center gap-3 text-slate-400 text-xs">
                                <i class="fa-solid fa-bolt text-amber-400"></i>
                                <span class="font-medium">Quick Actions</span>
                            </div>
                            <div class="hidden sm:block w-px h-6 bg-slate-700/50"></div>
                            <div class="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                                <button onclick="openStoreRequestModal()" class="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-2 px-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-plus text-xs"></i> <span>New Store Request Entry</span>
                                </button>
                                <button onclick="submitStoreRequestFinal()" class="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold py-2 px-4 rounded-xl transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-paper-plane text-xs"></i> <span>Dispatch All Items</span>
                                    <span id="dispatch-count-badge" class="inline-flex items-center justify-center px-1.5 py-0.5 bg-slate-900/30 text-slate-900 font-mono text-xs rounded-full min-w-[1.25rem] h-5">0</span>
                                </button>
                            </div>
                        </div>
                    </div>
                        
                    <!-- Live Added Items Table Panel -->
                    <div class="lg:col-span-12 space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                                <i class="fa-solid fa-layer-group text-blue-400 mr-2"></i>
                                Realtime Registered Items List (የተመዘገቡ እቃዎች ዝርዝር)
                            </h3>
                            <span id="store-counter-badge" class="count-badge px-2.5 py-1 bg-blue-500/15 text-blue-400 rounded-full text-xs font-semibold border border-blue-500/30">0 Items</span>
                        </div>
                        
                        <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                            <div class="table-wrapper max-h-[500px] overflow-y-auto">
                                <table class="w-full text-left border-collapse min-w-[700px]">
                                    <thead class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th class="p-3 text-center w-12">No</th>
                                            <th class="p-3">Date</th>
                                            <th class="p-3">Order No</th>
                                            <th class="p-3">Name / Title</th>
                                            <th class="p-3">Material (Color)</th>
                                            <th class="p-3 text-center">Qty</th>
                                            <th class="p-3">Dimensions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="store-added-items-body" class="divide-y divide-slate-800 text-sm text-slate-300">
                                        <!-- Dynamic rows from addStoreItem() will append here -->
                                        <tr id="store-empty-placeholder" class="text-slate-500 italic">
                                            <td colspan="7" class="p-8 text-center">ምንም ዕቃ አልተመዘገበም፤ እባክዎ በስተግራ ያለውን ፎርም ሞልተው "Add Item" የሚለውን ይጫኑ።</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <!-- No results state -->
                            <div id="store-no-results" class="hidden flex flex-col items-center justify-center py-12 px-4">
                                <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                                    <i class="fa-solid fa-box-open text-2xl text-slate-500"></i>
                                </div>
                                <p class="text-slate-400 font-medium">No items registered yet</p>
                                <p class="text-xs text-slate-500 mt-1">Add items using the form to see them here</p>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new StorerequestSection();
});
