// active-work Section Component
// Renders the active-work section HTML (In Progress production orders)

class ActiveworkSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-active-work');
        if (container) {
            container.innerHTML = `<!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-industry text-cyan-400"></i>
                            Active Work
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">
                            Production orders currently in progress. 
                            <span class="text-slate-500">(በስራ ላይ ያሉ የምርት ኦርደሮች)</span>
                        </p>
                    </div>
                </div>

                <!-- Stats Summary -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="stat-card bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-play text-cyan-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Orders</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="aw-stats-active">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-exclamation-triangle text-rose-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urgent</p>
                            <p class="text-2xl font-bold text-rose-400 mt-0.5" id="aw-stats-urgent">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-comments text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unread Chats</p>
                            <p class="text-2xl font-bold text-emerald-400 mt-0.5" id="aw-stats-unread">0</p>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                    <div class="table-wrapper">
                        <table class="orders-table w-full text-left border-collapse min-w-[1000px]">
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
                            <tbody class="divide-y divide-slate-800 text-sm text-slate-300 cursor-pointer" id="active-work-body">
                                <!-- Rows will be dynamically rendered by JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- ACTIVE WORK DETAIL MODAL (tabbed: Details / Communication)   -->
                <!-- ============================================================ -->
                <div id="aw-detail-modal" class="modal-overlay" onclick="awCloseDetailModal(event)">
                    <div class="modal-container" onclick="event.stopPropagation()">
                        <!-- Close button -->
                        <button onclick="awCloseDetailModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>

                        <!-- Modal header -->
                        <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-2">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                                <i class="fa-solid fa-industry text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">Active Work Details</h3>
                                <p class="text-xs text-slate-400">Review the order and communicate about it</p>
                            </div>
                        </div>

                        <!-- Tab switcher -->
                        <div class="flex gap-2 border-b border-slate-700/60 pb-3 mb-4">
                            <button onclick="awSwitchTab('details')" id="aw-tab-details" class="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 text-white transition-all">
                                <i class="fa-solid fa-circle-info mr-1.5"></i>Details
                            </button>
                            <button onclick="awSwitchTab('communication')" id="aw-tab-communication" class="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all">
                                <i class="fa-solid fa-comments mr-1.5"></i>Communication
                            </button>
                        </div>

                        <!-- Details pane -->
                        <div id="aw-pane-details" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Task Type</label>
                                    <input id="aw-det-task-type" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Job Order Number</label>
                                    <input id="aw-det-order-num" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                                    <input id="aw-det-date" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project/Task Title</label>
                                    <input id="aw-det-title" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Designer</label>
                                    <input id="aw-det-designer" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Machine Type</label>
                                    <input id="aw-det-machine" type="text" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none">
                                </div>
                            </div>

                            <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                                <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                        <i class="fa-solid fa-cubes text-cyan-400 text-[10px]"></i>
                                    </span>
                                    Material & Dimensions
                                </span>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Material / Thickness / Color</label>
                                        <input id="aw-det-material" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Length</label>
                                        <input id="aw-det-length" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Width</label>
                                        <input id="aw-det-width" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Height / Gram</label>
                                        <input id="aw-det-height-gram" type="text" readonly class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
                                    </div>
                                </div>
                            </div>

                            <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                                <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                        <i class="fa-solid fa-paperclip text-cyan-400 text-[10px]"></i>
                                    </span>
                                    Attached Files
                                </span>
                                <div id="aw-det-attached-files" class="space-y-2">
                                    <div class="text-xs text-slate-500">No attached files</div>
                                </div>
                            </div>

                            <button onclick="awSwitchTab('communication')" class="w-full bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 text-xs py-2.5 rounded-lg text-center font-medium transition-all flex items-center justify-center gap-2">
                                <i class="fa-solid fa-comments text-cyan-400"></i> Open Communication
                            </button>
                        </div>

                        <!-- Communication pane -->
                        <div id="aw-pane-communication" class="hidden">
                            <div id="aw-chat-messages" class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 h-80 overflow-y-auto space-y-3 mb-4">
                                <div class="text-xs text-slate-500 text-center py-8">Loading messages...</div>
                            </div>
                            <div id="aw-chat-pending-files" class="flex flex-wrap gap-2 mb-3 hidden"></div>
                            <div class="flex gap-3 pt-3 border-t border-slate-700/50">
                                <input type="file" id="aw-chat-file-input" multiple class="hidden" onchange="awOnFileSelect(this)">
                                <button onclick="document.getElementById('aw-chat-file-input').click()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5" title="Attach files">
                                    <i class="fa-solid fa-paperclip text-[10px]"></i>
                                </button>
                                <input id="aw-chat-input" type="text" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-600" placeholder="Type a message about this work..." onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); awSendMessage(); }">
                                <button onclick="awSendMessage()" class="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                                    <i class="fa-solid fa-paper-plane text-[10px]"></i> Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new ActiveworkSection();
});