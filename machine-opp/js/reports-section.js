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
                    <div class="flex items-center gap-3" id="report-generate-actions">
                        <button onclick="openSaveReportModal()" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/15">
                            <i class="fa-solid fa-plus text-sm"></i> Save Report
                        </button>
                        <button onclick="exportReportPDF()" class="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-600/15">
                            <i class="fa-solid fa-file-pdf text-sm"></i> Export Report PDF
                        </button>
                    </div>
                </div>

                <!-- Report Tabs -->
                <div class="flex gap-2 border-b border-slate-700/60">
                    <button type="button" id="report-tab-generate" onclick="switchReportTab('generate')"
                        class="flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer border-violet-500 text-violet-300 bg-violet-500/10">
                        <i class="fa-solid fa-file-pen"></i> Generate Report
                    </button>
                    <button type="button" id="report-tab-saved" onclick="switchReportTab('saved')"
                        class="flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/20">
                        <i class="fa-solid fa-folder-open"></i> Saved Reports
                        <span id="report-tab-saved-count" style="display:none" class="ml-0.5 grid min-w-4 h-4 px-1 place-items-center rounded-full bg-violet-600 text-white text-[10px] font-semibold leading-none"></span>
                    </button>
                </div>

                <div id="report-generate-panel">
                <!-- Stats Summary Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-5 gap-4" id="report-stats-container">
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
                    <div class="stat-card bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-wrench text-rose-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Maintenance</p>
                            <p class="text-2xl font-bold text-rose-400 mt-0.5" id="report-stats-maintenance">0</p>
                        </div>
                    </div>
                </div>

                <!-- Filters: Module Selection, Search, Date Range -->
                <div class="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50 shadow-lg my-4">
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
                                            <span>Received Order</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="rework" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Rework Recording</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="completed-orders" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Completed Order</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="delivery" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Delivery</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="installation" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Installation</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="machine-maintenance" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Machine Maintenance Logs</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="inventory" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Inventory</span>
                                        </label>
                                        <label class="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/30 rounded cursor-pointer">
                                            <input type="checkbox" value="stock-movement" onchange="updateModuleSelection()" class="module-checkbox">
                                            <span>Stock Movement</span>
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
                            <i class="fa-solid fa-filter"></i>
                            <span>Showing: <strong id="report-filter-count" class="text-slate-300 font-semibold">0</strong> records</span>
                            <span class="text-slate-600 mx-1">|</span>
                            <span>Module: <strong id="report-active-module" class="text-violet-400 font-semibold">All</strong></span>
                        </div>
                        <button onclick="resetReportFilters()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
                            <i class="fa-solid fa-rotate-left"></i> Reset Filters
                        </button>
                    </div>
</div>

                 <!-- Loading indicator -->
                 <div id="report-loading" class="hidden flex flex-col items-center justify-center py-16 px-4">
                     <div class="w-12 h-12 rounded-full border-4 border-slate-700 border-t-violet-500 animate-spin"></div>
                     <p class="text-slate-400 font-medium mt-4">Loading report data…</p>
                     <p class="text-xs text-slate-500 mt-1">Fetching records from the database</p>
                 </div>

                 <!-- Reports Tables Container -->
                 <div id="report-tables-container">
                     <!-- Dynamic tables will be rendered here by JS -->
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
                </div>

                 <!-- Saved Reports -->
                 <div id="report-saved-panel" class="hidden">
                     <div class="flex items-center justify-between mb-4 mt-6">
                         <h3 class="text-sm font-bold text-white flex items-center gap-2">
                             <i class="fa-solid fa-folder-open text-violet-400"></i> Saved Reports
                             <span id="report-saved-count" class="text-xs text-slate-400 font-normal"></span>
                         </h3>
                         <button onclick="fetchSavedReports()" class="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
                             <i class="fa-solid fa-rotate"></i> Refresh
                         </button>
                     </div>
                     <div id="report-saved-loading" class="hidden flex flex-col items-center justify-center py-12">
                         <div class="w-10 h-10 rounded-full border-4 border-slate-700 border-t-violet-500 animate-spin"></div>
                         <p class="text-slate-400 text-sm mt-3">Loading saved reports…</p>
                     </div>
                     <div id="report-saved-list"></div>
                 </div>

                 <!-- Save Report Modal -->
                 <div id="save-report-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
                     <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl" onclick="event.stopPropagation()">
                         <div class="flex justify-between items-center px-6 py-4 border-b border-slate-700">
                             <div>
                                 <h3 class="text-lg font-bold text-white">Save Report</h3>
                                 <p class="text-xs text-slate-400 mt-0.5">
                                     Machine Report · Department: <span class="text-slate-200 font-medium">production</span>
                                     · User: <span id="save-report-user-id">(resolving…)</span>
                                 </p>
                             </div>
                             <button onclick="closeSaveReportModal()" class="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                                 <i class="fa-solid fa-xmark"></i>
                             </button>
                         </div>

                         <div class="p-6 space-y-5">
                             <div class="grid grid-cols-3 gap-4">
                                 <div>
                                     <label class="block text-xs font-semibold text-slate-300 mb-1.5">From Date</label>
                                     <input type="date" id="save-report-from" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500">
                                 </div>
                                 <div>
                                     <label class="block text-xs font-semibold text-slate-300 mb-1.5">To Date</label>
                                     <input type="date" id="save-report-to" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500">
                                 </div>
                                 <div>
                                     <label class="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                                     <input type="text" value="production" disabled class="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500">
                                 </div>
                             </div>

                             <div>
                                 <label class="block text-xs font-semibold text-slate-300 mb-1.5">Report Content</label>
                                 <textarea id="save-report-markdown" rows="10" placeholder="# Report title&#10;&#10;Write your report in Markdown…&#10;&#10;- bullet points&#10;- **bold** and *italic*"
                                     class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"></textarea>
                                 <div class="mt-2">
                                     <span class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Live Preview</span>
                                     <div id="save-report-preview" class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 max-h-40 overflow-y-auto report-md"></div>
                                 </div>
                                 <p class="text-[11px] text-slate-500 mt-1.5">Markdown supported with live preview. You can also drag &amp; drop, select, or paste (Ctrl+V) files into the drop zone below.</p>
                             </div>

                             <div>
                                 <label class="block text-xs font-semibold text-slate-300 mb-1.5">Attached Files</label>
                                 <div id="save-report-dropzone"
                                     ondragenter="reportDragOver(event)" ondragover="reportDragOver(event)" ondragleave="reportDragLeave(event)" ondrop="reportDrop(event)"
                                     onclick="document.getElementById('save-report-file-input').click()"
                                     class="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-violet-500">
                                     <input type="file" id="save-report-file-input" multiple class="hidden" onchange="reportFilesSelected(event)">
                                     <div class="text-sm text-slate-300 mb-1">
                                         <i class="fa-solid fa-cloud-arrow-up text-violet-400 mr-1.5"></i>
                                         Drag &amp; drop files here, click to select, or paste (Ctrl+V)
                                     </div>
                                     <div class="text-xs text-slate-500">Multiple files supported</div>
                                 </div>
                                 <div id="save-report-file-list" class="mt-3 space-y-2"></div>
                             </div>
                         </div>

                         <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                             <button onclick="closeSaveReportModal()" class="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors">
                                 Cancel
                             </button>
                             <button id="save-report-submit" onclick="handleSaveReport()"
                                 class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all">
                                 <i class="fa-solid fa-floppy-disk"></i> Save Report
                             </button>
                         </div>
                     </div>
                 </div>

                 <!-- View Saved Report Modal -->
                 <div id="view-report-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onclick="closeViewReportModal()">
                     <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl" onclick="event.stopPropagation()">
                         <div class="flex justify-between items-center px-6 py-4 border-b border-slate-700">
                             <div>
                                 <h3 class="text-lg font-bold text-white">Saved Report</h3>
                                 <p id="view-report-meta" class="text-xs text-slate-400 mt-0.5"></p>
                             </div>
                             <button onclick="closeViewReportModal()" class="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                                 <i class="fa-solid fa-xmark"></i>
                             </button>
                         </div>
                         <div class="p-6 space-y-5">
                             <div>
                                 <label class="block text-xs font-semibold text-slate-300 mb-1.5">Report Content</label>
                                 <div id="view-report-content" class="bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 report-md"></div>
                             </div>
                             <div id="view-report-files-wrap" class="hidden">
                                 <label class="block text-xs font-semibold text-slate-300 mb-1.5">Attached Files</label>
                                 <div id="view-report-files" class="space-y-2"></div>
                             </div>
                         </div>
                         <div class="px-6 py-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-end">
                             <button onclick="closeViewReportModal()" class="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors">
                                 Close
                             </button>
                         </div>
                     </div>
                 </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new ReportsSection();
});
