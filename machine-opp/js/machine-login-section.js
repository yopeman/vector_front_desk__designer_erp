// machine-login Section Component
// Renders the machine-login section HTML

class MachineloginSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-machine-login');
        if (container) {
            container.innerHTML = `<!-- Modern Header with Stats -->
                <div class="bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <i class="fa-solid fa-screwdriver-wrench text-white text-lg"></i>
                                </div>
                                Machine Maintenance Checklists
                            </h2>
                            <p class="text-sm text-slate-400 mt-2 ml-[52px]">Select a machine terminal to execute and track checklist validation tasks with real-time progress monitoring.</p>
                        </div>
                        <div class="flex items-center gap-3 ml-[52px] lg:ml-0">
                            <div class="bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700/50">
                                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Last Updated</p>
                                <p class="text-xs font-mono text-slate-200" id="last-updated">--:--:--</p>
                            </div>
                            <div class="bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700/50">
                                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Operator</p>
                                <p class="text-xs font-semibold text-slate-200" id="operator-name">-</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Machine Selector Tabs - Dynamic from Database -->
                <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-2 shadow-lg">
                    <div class="flex items-center justify-between mb-3 px-2">
                        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Machines</span>
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-filter text-slate-500 text-xs"></i>
                            <select id="machine-status-filter" onchange="filterMachinesByStatus(this.value)" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" id="machine-tabs-container">
                        <div class="text-xs text-slate-500 text-center py-6 col-span-6">Loading machines...</div>
                    </div>
                </div>

                <!-- Overall Progress Dashboard -->
                <div class="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20 rounded-2xl p-5 shadow-lg">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-chart-line text-blue-400"></i>
                            Overall Completion Progress
                        </h3>
                        <span class="text-xs font-mono text-slate-400" id="overall-progress-text">0% Complete</span>
                    </div>
                    <div class="w-full bg-slate-900/60 rounded-full h-3 overflow-hidden border border-slate-700/50">
                        <div id="overall-progress-bar" class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/50" style="width: 0%"></div>
                    </div>
                    <div class="grid grid-cols-3 gap-3 mt-4">
                        <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Daily</p>
                            <p class="text-lg font-bold text-blue-400" id="daily-progress">0%</p>
                        </div>
                        <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Weekly</p>
                            <p class="text-lg font-bold text-amber-400" id="weekly-progress">0%</p>
                        </div>
                        <div class="bg-slate-900/60 rounded-xl p-3 border border-slate-700/40">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Monthly</p>
                            <p class="text-lg font-bold text-purple-400" id="monthly-progress">0%</p>
                        </div>
                    </div>
                </div>

                <!-- CRUD Action Buttons -->
                <div class="flex flex-wrap items-center gap-2 mt-4">
                    <button onclick="openAddMachineModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10">
                        <i class="fa-solid fa-plus text-[10px]"></i> Add Machine
                    </button>
                    <button onclick="openEditMachineModal()" class="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10">
                        <i class="fa-solid fa-pen text-[10px]"></i> Edit Machine
                    </button>
                    <button onclick="deleteMachine()" class="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-500/10">
                        <i class="fa-solid fa-trash text-[10px]"></i> Delete Machine
                    </button>
                    <button onclick="showMaintenanceLogs()" class="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/10">
                        <i class="fa-solid fa-history text-[10px]"></i> View Maintenance Logs
                    </button>
                </div>

                <!-- Dynamic Checklist Cards Container -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" id="checklist-container"></div>

                <!-- ============================================================ -->
                <!-- MACHINE CRUD MODAL                                            -->
                <!-- ============================================================ -->
                <div id="machine-crud-modal" class="modal-overlay" onclick="closeMachineCrudModal(event)">
                    <div class="modal-container max-w-md" onclick="event.stopPropagation()">
                        <button onclick="closeMachineCrudModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-6">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <i class="fa-solid fa-gears text-white text-base"></i>
                            </div>
                            <div>
                                <h3 id="machine-crud-title" class="text-lg font-bold text-white tracking-wide">Add New Machine</h3>
                                <p class="text-xs text-slate-400">Manage machine details</p>
                            </div>
                        </div>
                        <form onsubmit="event.preventDefault(); saveMachine();" class="space-y-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Machine Name</label>
                                <input type="text" id="machine-name" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. CNC-02">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Machine Type</label>
                                <input type="text" id="machine-type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. cnc, co2, uv">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                <select id="machine-status" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow cursor-pointer">
                                    <option value="active">Active</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div class="flex justify-end pt-2">
                                <button type="submit" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/15 flex items-center gap-2">
                                    <i class="fa-solid fa-check text-xs"></i> Save Machine
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- CHECKLIST ITEM CRUD MODAL                                      -->
                <!-- ============================================================ -->
                <div id="checklist-item-modal" class="modal-overlay" onclick="closeChecklistItemModal(event)">
                    <div class="modal-container max-w-md" onclick="event.stopPropagation()">
                        <button onclick="closeChecklistItemModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-6">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                <i class="fa-solid fa-list-check text-white text-base"></i>
                            </div>
                            <div>
                                <h3 id="checklist-item-title" class="text-lg font-bold text-white tracking-wide">Add Checklist Item</h3>
                                <p class="text-xs text-slate-400">Add or edit checklist items</p>
                            </div>
                        </div>
                        <form onsubmit="event.preventDefault(); saveChecklistItem();" class="space-y-4">
                            <input type="hidden" id="checklist-item-period" value="daily">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Checklist Item</label>
                                <textarea id="checklist-item-text" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 input-glow resize-none" placeholder="Enter checklist item description..."></textarea>
                            </div>
                            <div class="flex justify-end pt-2">
                                <button type="submit" class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/15 flex items-center gap-2">
                                    <i class="fa-solid fa-check text-xs"></i> Save Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- MAINTENANCE LOGS MODAL                                         -->
                <!-- ============================================================ -->
                <div id="machine-logs-modal" class="modal-overlay" onclick="closeMachineLogsModal(event)">
                    <div class="modal-container max-w-2xl" onclick="event.stopPropagation()">
                        <button onclick="closeMachineLogsModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-6">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                                <i class="fa-solid fa-history text-white text-base"></i>
                            </div>
                            <div>
                                <h3 id="machine-logs-title" class="text-lg font-bold text-white tracking-wide">Maintenance Logs</h3>
                                <p class="text-xs text-slate-400">Recorded maintenance history for this machine</p>
                            </div>
                        </div>
                        <div id="machine-logs-list" class="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                            <div class="text-xs text-slate-500 text-center py-8">Loading logs...</div>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', async () => {
    new MachineloginSection();
    // Load machine data from database but do not select any machine by default
    if (typeof fetchMachinesAndChecklists === 'function') {
        await fetchMachinesAndChecklists();
        
        // Show message that no machine is selected
        const container = document.getElementById('checklist-container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center">
                    <div class="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-screwdriver-wrench text-slate-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">No Machine Selected</h3>
                    <p class="text-sm text-slate-400">Please select a machine from the tabs above to view and manage its maintenance checklists.</p>
                </div>
            `;
        }
    }
});
