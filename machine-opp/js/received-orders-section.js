// received-orders Section Component
// Renders the received-orders section HTML

class ReceivedordersSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-received-orders');
        if (container) {
            container.innerHTML = `<!-- Header with stats summary -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-list-check text-blue-400"></i>
                            Received Order Status
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">
                            Track and manage incoming tasks. 
                            <span class="text-slate-500">(ዝርዝሩን ለማየት መስመሩን ይጫኑ)</span>
                        </p>
                    </div>
                </div>

                <!-- ===== NEW: Stats Summary Cards ===== -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="orders-stats-container">
                    <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-clipboard-list text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-exclamation-triangle text-rose-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urgent</p>
                            <p class="text-2xl font-bold text-rose-400 mt-0.5" id="stats-urgent">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-check-circle text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Normal</p>
                            <p class="text-2xl font-bold text-emerald-400 mt-0.5" id="stats-normal">0</p>
                        </div>
                    </div>
                </div>

                <!-- Search/Filter Header (Enhanced for Priority Filter) -->
                <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <!-- Search input with clear button -->
                        <div class="relative w-full md:w-80">
                            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                            <input type="text" id="order-search" onkeyup="filterOrders()" placeholder="Search by order #, title, designer, machine..." 
                                   class="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 input-glow">
                            <button id="search-clear-btn" onclick="clearSearch()" class="search-clear absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                        <!-- Priority Dropdown -->
                        <div class="relative w-full md:w-44">
                            <select id="priority-filter" onchange="filterOrders()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all" class="text-slate-300">All Priorities</option>
                                <option value="urgent" class="text-rose-400 font-bold">Urgent Only</option>
                                <option value="normal" class="text-slate-300 font-medium">Normal Only</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <!-- Machine Dropdown -->
                        <div class="relative w-full md:w-44">
                            <select id="machine-filter" onchange="filterOrders()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all" class="text-slate-300">All Machines</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <!-- Status Dropdown -->
                        <div class="relative w-full md:w-44">
                            <select id="status-filter" onchange="filterOrders()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all" class="text-slate-300">All Status</option>
                                <option value="new">New</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <!-- Filter results count -->
                        <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-700/50">
                            <i class="fa-solid fa-filter"></i>
                            <span>Showing: <strong id="filter-count" class="text-slate-300 font-semibold">0</strong></span>
                        </div>
                    </div>
                    <button onclick="resetFilters()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
                        <i class="fa-solid fa-rotate-left"></i> Reset
                    </button>
                </div>

                <!-- Table Content -->
                <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                    <div class="table-wrapper">
                        <table class="orders-table w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    <th class="p-4 text-center w-16">
                                        <span class="flex items-center justify-center gap-1">
                                            <i class="fa-solid fa-hashtag text-[10px] text-slate-500"></i>
                                            No
                                        </span>
                                    </th>
                                    <th class="p-4">
                                        <span class="flex items-center gap-1.5">
                                            <i class="fa-regular fa-calendar text-[10px] text-slate-500"></i>
                                            Date
                                        </span>
                                    </th>
                                    <th class="p-4">Task/Project</th>
                                    <th class="p-4">Job Order Number</th>
                                    <th class="p-4">Designer</th>
                                    <th class="p-4">Project/Task Name/Title</th>
                                    <th class="p-4">Priority</th>
                                    <th class="p-4 text-center">
                                        <span class="flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-circle-info text-[10px] text-slate-500"></i>
                                            Status
                                        </span>
                                    </th>
                                    <th class="p-4">Machine Type</th>
                                    <th class="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800 text-sm text-slate-300 cursor-pointer" id="received-orders-body">
                                <!-- Rows will be dynamically rendered by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                    <!-- No results state -->
                    <div id="no-results-state" class="hidden flex flex-col items-center justify-center py-16 px-4">
                        <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                            <i class="fa-solid fa-search-minus text-2xl text-slate-500"></i>
                        </div>
                        <p class="text-slate-400 font-medium">No orders match your search criteria</p>
                        <p class="text-xs text-slate-500 mt-1">Try adjusting your search or filter settings</p>
                        <button onclick="resetFilters()" class="mt-4 text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-blue-500/20">
                            <i class="fa-solid fa-rotate-left mr-1.5"></i> Reset Filters
                        </button>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- ORDER DETAIL MODAL OVERLAY (popup style)                    -->
                <!-- ============================================================ -->
                <div id="order-detail-modal" class="modal-overlay" onclick="closeOrderModal(event)">
                    <div class="modal-container" onclick="event.stopPropagation()">
                        <!-- Close button -->
                        <button onclick="closeOrderModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>

                        <!-- Modal header -->
                        <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-2">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                <i class="fa-solid fa-folder-open text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">Order Details & Execution Framework</h3>
                                <p class="text-xs text-slate-400">Review and manage the selected order</p>
                            </div>
                        </div>

                        <!-- Priority indicator alert bar -->
                        <div id="detail-priority-bar" class="flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 bg-slate-900/50 text-sm mb-6">
                            <i class="fa-solid fa-circle-info text-lg"></i>
                            <span id="detail-priority-text" class="font-medium">Priority information</span>
                        </div><br>

                        <!-- Meta Inputs Matrix Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-regular fa-calendar text-slate-500"></i> Date
                                </label>
                                <input id="det-date" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-solid fa-heading text-slate-500 text-[10px]"></i> Project/Task Name/Title
                                </label>
                                <input id="det-title" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-solid fa-cubes text-slate-500 text-[10px]"></i> Material Type
                                </label>
                                <input id="det-material" type="text" readonly class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-solid fa-arrows-left-right text-slate-500 text-[10px]"></i> Thickness
                                </label>
                                <input id="det-thickness" type="text" readonly class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-solid fa-palette text-slate-500 text-[10px]"></i> Color
                                </label>
                                <input id="det-color" type="text" readonly class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-solid fa-industry text-slate-500 text-[10px]"></i> Machine Type
                                </label>
                                <input id="det-machine" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-solid fa-user text-slate-500 text-[10px]"></i> Designer
                                </label>
                                <input id="det-designer" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <i class="fa-solid fa-barcode text-slate-500 text-[10px]"></i> Job Order Number
                                </label>
                                <input id="det-order-num" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                            </div>
                        </div>

                        <!-- Size Breakdown Layout Matrix -->
                        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <i class="fa-solid fa-ruler-combined text-blue-400 text-[10px]"></i>
                                </span>
                                Dimensions (Size Layout Spec)
                            </span>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Length</label>
                                    <input id="det-length" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Width</label>
                                    <input id="det-width" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Height</label>
                                    <input id="det-height" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Gram</label>
                                    <input id="det-gram" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                            </div>
                        </div>

                        <!-- Attachments Section -->
                        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <i class="fa-solid fa-paperclip text-purple-400 text-[10px]"></i>
                                </span>
                                Attached Files
                            </span>
                            <div class="flex items-center gap-2">
                                <input type="file" id="det-file-input" multiple class="hidden" onchange="handleAttachedFiles(this, 'attached-files-list')">
                                <button onclick="document.getElementById('det-file-input').click()" class="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs py-2 px-3 rounded-lg transition-all flex items-center gap-2">
                                    <i class="fa-solid fa-upload"></i> Upload Files
                                </button>
                                <span id="det-file-count" class="text-xs text-slate-500">0 files selected</span>
                            </div>
                            <div id="attached-files-list" class="space-y-2">
                                <div class="text-xs text-slate-500">No attached files</div>
                            </div>
                        </div>

                        <!-- Note Section -->
                        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                    <i class="fa-solid fa-note-sticky text-teal-400 text-[10px]"></i>
                                </span>
                                Notes
                            </span>
                            <textarea id="det-note" rows="3" placeholder="Add notes about this order..." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none"></textarea>
                        </div>

                         <!-- Bottom Functional Blocks Grid -->
                         <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                              <!-- Shared Design File Element Block -->
                              <div class="bg-slate-900/30 border border-slate-700/50 p-4 rounded-xl space-y-3">

                                 <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                     <span class="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                         <i class="fa-solid fa-share-nodes text-indigo-400 text-[10px]"></i>
                                     </span>
                                     Shared Design File
                                 </span>
                                 <div id="shared-versions-list" class="space-y-2">
                                     <div class="text-xs text-slate-500">Loading approved versions...</div>
                                 </div>
                                 <div id="shared-file-meta" class="flex items-center text-[10px] text-slate-400 font-medium bg-slate-900/30 p-1 px-2 rounded w-max border border-slate-700/30 hidden">
                                 </div>
                             </div>

                            <!-- Message Interaction Blocks Segment -->
                            <div class="bg-slate-900/30 border border-slate-700/50 p-4 rounded-xl space-y-3">
                                 <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                     <span class="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center">
                                         <i class="fa-solid fa-comments text-sky-400 text-[10px]"></i>
                                     </span>
                                     Designer Chat
                                 </span>
                                 <button onclick="openDesignerChat()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs py-2.5 rounded-lg text-center font-medium transition-all flex items-center justify-center gap-2">
                                     <i class="fa-solid fa-message text-sky-400"></i> Open Chat
                                 </button>
                                 <button onclick="openProductionChat()" class="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs py-2.5 rounded-lg text-center font-medium transition-all flex items-center justify-center gap-2">
                                     <i class="fa-solid fa-industry text-emerald-400"></i> Production Chat
                                 </button>
                             </div>

                            <!-- Status Update Operations with Timeline -->
                            <div class="bg-slate-900/30 border border-slate-700/50 p-4 rounded-xl space-y-3">
                                <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <i class="fa-solid fa-circle-notch text-amber-400 text-[10px] animate-spin"></i>
                                    </span>
                                    Status Timeline
                                </span>
                                
                                <!-- Timeline visualization -->
                                <div class="space-y-1 mb-3">
                                    <div class="timeline-step active">
                                        <span class="dot"></span>
                                        <p class="text-xs text-slate-400">Order Received</p>
                                    </div>
                                    <div class="timeline-step" id="step-in-progress">
                                        <span class="dot active"></span>
                                        <p class="text-xs text-slate-500" id="step-progress-text">In Progress</p>
                                    </div>
                                    <div class="timeline-step" id="step-completed">
                                        <span class="dot"></span>
                                        <p class="text-xs text-slate-500" id="step-completed-text">Completed</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/40">
                                    <div class="space-y-2">
                                        <button onclick="logOrderStatusTime('start')" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-2 rounded-lg text-xs transition-all text-center tracking-wide shadow-md uppercase flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-play text-[10px]"></i> start order
                                        </button>
                                        <div id="ord-start-time" class="text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg">recorded start time</div>
                                    </div>
                                    <div class="space-y-2">
                                        <button onclick="logOrderStatusTime('end')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded-lg text-xs transition-all text-center tracking-wide shadow-md uppercase flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-stop text-[10px]"></i> End order
                                        </button>
                                        <div id="ord-end-time" class="text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg">recorded end time</div>
                                    </div>
                                </div>
                            </div>

                              <!-- Save Button -->
                              <div class="bg-slate-900/30 border border-slate-700/50 p-4 rounded-xl space-y-3 flex flex-col justify-center">
                                  <button onclick="saveOrderChanges()" class="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2">
                                      <i class="fa-solid fa-bolt text-xs"></i> Save Changes
                                  </button>
                                  <p class="text-[10px] text-slate-500 text-center">Save current changes including attachments and notes</p>
                              </div>
                        </div>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- TEXT NOTE MODAL (for Message Panel text button)              -->
                <!-- ============================================================ -->
                <div id="text-note-modal" class="modal-overlay" onclick="closeTextNoteModal(event)">
                    <div class="modal-container max-w-lg" onclick="event.stopPropagation()">
                        <button onclick="closeTextNoteModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                                <i class="fa-solid fa-pen text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">Write Note</h3>
                                <p class="text-xs text-slate-400">Add a note for this order</p>
                            </div>
                        </div>
                        <textarea id="text-note-editor" rows="5" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none" placeholder="Type your note here..."></textarea>
                        <div class="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-700/50">
                            <button onclick="closeTextNoteModal()" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
                            <button onclick="saveTextNote()" class="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl transition-all shadow-lg shadow-sky-500/15 flex items-center gap-1.5">
                                <i class="fa-solid fa-floppy-disk"></i> Save Note
                            </button>
                         </div>
                     </div>
                 </div>

                 <!-- ============================================================ -->
                 <!-- DESIGNER CHAT MODAL                                             -->
                 <!-- ============================================================ -->
                 <div id="designer-chat-modal" class="modal-overlay" onclick="closeDesignerChatModal(event)">
                     <div class="modal-container max-w-2xl" onclick="event.stopPropagation()">
                         <button onclick="closeDesignerChatModal()" class="modal-close-btn">
                             <i class="fa-solid fa-xmark"></i>
                         </button>
                         <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-4">
                             <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                                 <i class="fa-solid fa-comments text-white text-base"></i>
                             </div>
                             <div>
                                 <h3 class="text-lg font-bold text-white tracking-wide">Designer Chat</h3>
                                 <p id="designer-chat-subtitle" class="text-xs text-slate-400">Loading conversation...</p>
                             </div>
                         </div>
                         <div id="designer-chat-messages" class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 h-80 overflow-y-auto space-y-3 mb-4">
                             <div class="text-xs text-slate-500 text-center py-8">Loading messages...</div>
                         </div>
                         <div class="flex gap-3 pt-3 border-t border-slate-700/50">
                             <input id="designer-chat-input" type="text" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600" placeholder="Type a message to the designer...">
                             <button onclick="sendDesignerMessage()" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                                 <i class="fa-solid fa-paper-plane text-[10px]"></i> Send
                             </button>
                         </div>
                     </div>
                 </div>

                 <!-- ============================================================ -->
                 <!-- PRODUCTION CHAT MODAL                                        -->
                 <!-- ============================================================ -->
                 <div id="production-chat-modal" class="modal-overlay" onclick="closeProductionChatModal(event)">
                     <div class="modal-container max-w-2xl" onclick="event.stopPropagation()">
                         <button onclick="closeProductionChatModal()" class="modal-close-btn">
                             <i class="fa-solid fa-xmark"></i>
                         </button>
                         <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-4">
                             <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                 <i class="fa-solid fa-industry text-white text-base"></i>
                             </div>
                             <div>
                                 <h3 class="text-lg font-bold text-white tracking-wide">Production Chat</h3>
                                 <p id="production-chat-subtitle" class="text-xs text-slate-400">Loading conversation...</p>
                             </div>
                         </div>
                         <div id="production-chat-messages" class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 h-80 overflow-y-auto space-y-3 mb-4">
                             <div class="text-xs text-slate-500 text-center py-8">Loading messages...</div>
                         </div>
                         <div class="flex gap-3 pt-3 border-t border-slate-700/50">
                             <input id="production-chat-input" type="text" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600" placeholder="Type a message about this work...">
                             <button onclick="sendProductionMessage()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                                 <i class="fa-solid fa-paper-plane text-[10px]"></i> Send
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
          </aside>`;
        }
    }
}

// Handle attached files
function handleAttachedFiles(input, listId) {
    const files = input.files;
    const listElement = document.getElementById(listId);
    const countElement = document.getElementById(input.id.replace('-input', '-count'));
    
    if (files.length > 0) {
        listElement.innerHTML = '';
        Array.from(files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2';
            fileItem.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-file text-purple-400 text-xs"></i>
                    <span class="text-xs text-slate-300 truncate max-w-[200px]">${file.name}</span>
                    <span class="text-[10px] text-slate-500">(${formatFileSize(file.size)})</span>
                </div>
                <button type="button" onclick="removeFile(this, '${input.id}')" class="text-slate-500 hover:text-red-400 transition-colors">
                    <i class="fa-solid fa-xmark text-xs"></i>
                </button>
            `;
            listElement.appendChild(fileItem);
        });
        countElement.textContent = `${files.length} file${files.length > 1 ? 's' : ''} selected`;
    } else {
        listElement.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        countElement.textContent = '0 files selected';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Remove file from list
function removeFile(button, inputId) {
    const input = document.getElementById(inputId);
    const fileItem = button.closest('.flex.items-center.justify-between');
    const listElement = fileItem.parentElement;
    const countElement = document.getElementById(inputId.replace('-input', '-count'));
    
    fileItem.remove();
    
    const remainingFiles = listElement.querySelectorAll('.flex.items-center.justify-between').length;
    if (remainingFiles === 0) {
        listElement.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        countElement.textContent = '0 files selected';
        input.value = '';
    } else {
        countElement.textContent = `${remainingFiles} file${remainingFiles > 1 ? 's' : ''} selected`;
    }
}

// Save order changes
async function saveOrderChanges() {
    const note = document.getElementById('det-note').value;
    const fileInput = document.getElementById('det-file-input');
    const orderId = document.getElementById('det-order-num').dataset.orderId;
    
    console.log('Saving order changes:', { note, orderId, fileCount: fileInput.files.length });
    
    if (!orderId) {
        alert('No order selected');
        return;
    }
    
    try {
        // Upload files and get their IDs
        const fileIds = [];
        if (fileInput.files.length > 0) {
            console.log('Uploading files:', fileInput.files.length);
            for (const file of fileInput.files) {
                console.log('Uploading file:', file.name);
                const fileData = await uploadFile(file);
                console.log('File upload result:', fileData);
                if (fileData && fileData.id) {
                    fileIds.push(fileData.id);
                }
            }
        }
        
        console.log('File IDs to save:', fileIds);
        
        // Update production order with note and attached file IDs
        const updateData = {
            note: note || null,
            attached_file_ids: fileIds.length > 0 ? fileIds : null
        };
        
        console.log('Updating production order with data:', updateData);
        
        const { data, error } = await supabase
            .from('production_orders')
            .update(updateData)
            .eq('id', orderId)
            .select();
        
        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }
        
        console.log('Update successful:', data);
        
        alert('Changes saved successfully');
        closeOrderModal();
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Failed to save changes: ' + error.message);
    }
}

// Upload file to storage
async function uploadFile(file) {
    try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(fileName, file);
        
        if (error) {
            if (error.message.includes('Bucket not found')) {
                alert('Storage bucket "documents" does not exist. Please create it in Supabase dashboard (Storage → Create new bucket → name it "documents")');
                return null;
            }
            throw error;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
        
        // Insert file record into files table
        const { data: fileRecord, error: insertError } = await supabase
            .from('files')
            .insert({
                name: file.name,
                path: data.path,
                mime_type: file.type,
                file_size: file.size
            })
            .select()
            .single();
        
        if (insertError) {
            console.error('Error inserting file record:', insertError);
            throw insertError;
        }
        
        return { id: fileRecord.id, url: publicUrl, name: file.name };
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file: ' + error.message);
        return null;
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new ReceivedordersSection();
});
