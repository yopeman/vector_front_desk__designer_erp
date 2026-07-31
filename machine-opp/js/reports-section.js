// reports Section Component
// Renders the reports section HTML

class ReportsSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-reports');
        if (container) {
            container.innerHTML = `<!-- Header -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-chart-simple text-violet-400"></i>
                            Reports Center
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">Generate comprehensive reports with search, filtering, date range selection, and PDF export.</p>
                    </div>
                    <button onclick="exportReportPDF()" class="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-600/15">
                        <i class="fa-solid fa-file-pdf text-sm"></i> Export Report PDF
                    </button>
                </div>

                <!-- Stats Summary Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4" id="report-stats-container">
                    <div class="stat-card bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-database text-violet-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Records</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="report-stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-arrow-right-to-bracket text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Received</p>
                            <p class="text-2xl font-bold text-blue-400 mt-0.5" id="report-stats-received">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-circle-check text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
                            <p class="text-2xl font-bold text-emerald-400 mt-0.5" id="report-stats-completed">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-rotate text-amber-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rework</p>
                            <p class="text-2xl font-bold text-amber-400 mt-0.5" id="report-stats-rework">0</p>
                        </div>
                    </div>
                </div>

                <!-- Filters: Module Selection, Search, Date Range -->
                <div class="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50 shadow-lg">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <!-- Module Selection Dropdown -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <i class="fa-solid fa-layer-group text-slate-500 text-[10px]"></i> Module
                            </label>
                            <div class="relative" id="report-module-dropdown">
                                <button type="button" onclick="toggleModuleDropdown()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer flex items-center justify-between">
                                    <span id="report-module-selected-text">No Modules</span>
                                    <i class="fa-solid fa-chevron-down text-slate-500 text-xs"></i>
                                </button>
                                <div id="report-module-options" class="hidden absolute top-full left-0 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                                    <div class="p-2 space-y-1">
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="received-orders" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Received Orders</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="completed-orders" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Completed Orders</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="rework" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Rework Records</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="store-request" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Store Requests</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Search input -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <i class="fa-solid fa-magnifying-glass text-slate-500 text-[10px]"></i> Search
                            </label>
                            <div class="relative">
                                <i class="fa-solid fa-search absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                                <input type="text" id="report-search" onkeyup="filterReports()" placeholder="Search records..." 
                                       class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 placeholder-slate-500 input-glow">
                                <button id="report-search-clear" onclick="clearReportSearch()" class="search-clear absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                    <i class="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Date From -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <i class="fa-regular fa-calendar text-slate-500 text-[10px]"></i> From Date
                            </label>
                            <input type="date" id="report-date-from" onchange="filterReports()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 input-glow">
                        </div>

                        <!-- Date To -->
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <i class="fa-regular fa-calendar text-slate-500 text-[10px]"></i> To Date
                            </label>
                            <input type="date" id="report-date-to" onchange="filterReports()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500 input-glow">
                        </div>
                    </div>

                    <!-- Filter action buttons row -->
                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                        <div class="flex items-center gap-2 text-xs text-slate-500">
                            <i class="fa-regular fa-filter"></i>
                            <span>Showing: <strong id="report-filter-count" class="text-slate-300 font-semibold">0</strong> records</span>
                            <span class="text-slate-600 mx-1">|</span>
                            <span>Module: <strong id="report-active-module" class="text-violet-400 font-semibold">All</strong></span>
                        </div>
                        <button onclick="resetReportFilters()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
                            <i class="fa-solid fa-rotate-left"></i> Reset Filters
                        </button>
                    </div>
</div>

                 <!-- Column Visibility Checklist -->
                 <div class="px-4 py-2 border-b border-slate-700/50">
                     <div class="flex items-center justify-between mb-2">
                         <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Columns</span>
                         <button type="button" onclick="toggleAllColumns()" id="report-column-toggle-all" class="text-xs text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-1.5" title="Toggle all columns">
                             <i class="fa-solid fa-eye" id="report-column-toggle-all-icon"></i>
                             <span id="report-column-toggle-all-text">Show All</span>
                         </button>
                     </div>
                     <div id="report-column-checklist" class="flex flex-wrap gap-2">
                     </div>
                 </div>

                 <!-- Reports Table -->
                 <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                     <div class="table-wrapper max-h-[500px] overflow-y-auto">
                         <table class="w-full text-left border-collapse min-w-[700px]">
                             <thead class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider sticky top-0 z-10">
                                 <tr id="report-thead-row"></tr>
                             </thead>
                             <tbody id="report-records-body" class="divide-y divide-slate-800 text-sm text-slate-300">
                                 <!-- Dynamic rows rendered by JS -->
                             </tbody>
                         </table>
                     </div>
                    <!-- No results state -->
                    <div id="report-no-results" class="hidden flex flex-col items-center justify-center py-16 px-4">
                        <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                            <i class="fa-solid fa-chart-simple text-2xl text-slate-500"></i>
                        </div>
                        <p class="text-slate-400 font-medium">No records match your criteria</p>
                        <p class="text-xs text-slate-500 mt-1">Try adjusting the filters or date range</p>
                        <button onclick="resetReportFilters()" class="mt-4 text-xs bg-violet-600/20 hover:bg-violet-600 text-violet-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-violet-500/20">
                            <i class="fa-solid fa-rotate-left mr-1.5"></i> Reset Filters
                        </button>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new ReportsSection();
});
