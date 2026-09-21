// sidebar-section.js

// Sidebar Section Component
// Renders the sidebar navigation HTML

class SidebarSection {
    constructor() {
        this.render();
    }

    async render() {
        await Auth.initPromise;
        const container = document.getElementById('sidebar-container');
        const currentUser = Auth.getCurrentUser();
        const isFinishRole = false; //currentUser && currentUser.role === 'finish';

        if (container) {
            container.innerHTML = `<aside class="w-[18rem] bg-[#00CED1] border-r border-white/20 p-5 flex flex-col justify-between overflow-y-auto relative">
            <!-- Subtle gradient overlay at bottom of sidebar -->
            <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
            
            <div class="space-y-6">
                <!-- Main Modules Section -->
                <div>
                    <div class="flex items-center justify-between px-3 mb-3">
                        <span class="text-[10px] font-bold text-white/80 uppercase tracking-[0.15em]">Navigation</span>
                        <span class="text-[10px] text-white/60 font-mono">17 modules</span>
                    </div>
                    <nav class="space-y-0.5" id="main-nav">
                        <button onclick="switchTab('dashboard')" id="tab-dashboard" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all active-tab">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-chart-pie w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Dashboard</span>
                        </button>
                        <button onclick="switchTab('received-orders')" id="tab-received-orders" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-list-check w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Received Order</span>
                            <span id="sidebar-count-received" class="ml-auto text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full min-w-6 text-center">0</span>
                        </button>
                        <button onclick="switchTab('rework-login')" id="tab-rework-login" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-arrows-rotate w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Rework Recording</span>
                            <span id="sidebar-count-rework" class="ml-auto text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full min-w-6 text-center">0</span>
                        </button>
                        <button onclick="switchTab('completed-orders')" id="tab-completed-orders" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-circle-check w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Completed Order</span>
                        </button>
                        <button onclick="switchTab('delivery')" id="tab-delivery" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-truck w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Delivery</span>
                        </button>
                        <button onclick="switchTab('installation')" id="tab-installation" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-screwdriver-wrench w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Installation</span>
                        </button>
                        ${!isFinishRole ? `<button onclick="switchTab('machine-login')" id="tab-machine-login" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-desktop w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Machine Maintenance</span>
                        </button>` : ''}
                        <!-- <button onclick="switchTab('store-request')" id="tab-store-request" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all"> -->
                        <button onclick="window.location.href = 'https://vectoradvert.com/erp/store'; " id="tab-store-request" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-boxes-stacked w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Store Request</span>
                        </button>
                        <button onclick="switchTab('inventory')" id="tab-inventory" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-warehouse w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Inventory</span>
                        </button>
                        <button onclick="switchTab('inventory-movements')" id="tab-inventory-movements" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-arrow-right-arrow-left w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Stock Movements</span>
                        </button>
                        <button onclick="switchTab('reports')" id="tab-reports" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-chart-simple w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Report</span>
                        </button>
                        <button onclick="switchTab('ai-agent')" id="tab-ai-agent" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-robot w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">AI Agent</span>
                        </button>
                        <button onclick="switchTab('messages')" id="tab-messages" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-envelope w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Message</span>
                        </button>
                        <button onclick="switchTab('notifications')" id="tab-notifications" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-bell w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Notification</span>
                        </button>
                        <button onclick="switchTab('notes')" id="tab-notes" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-sticky-note w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Note</span>
                        </button>
                        <button onclick="window.location.href='https://vectoradvert.com/erp/hr'" id="tab-hr-requests" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-users-gear w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">HR Request</span>
                        </button>
                        <button onclick="switchTab('settings')" id="tab-settings" class="nav-item w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-white rounded-xl transition-all">
                            <span class="active-indicator"></span>
                            <i class="fa-solid fa-gear w-5 text-left text-base shrink-0"></i>
                            <span class="truncate font-medium">Setting</span>
                        </button>
                    </nav>
                </div>

                <!-- Divider -->
                <div class="section-divider"></div>

                <!-- HR Leave Submenu - Modernized with Collapsible -->
                <!-- <div>
                    <button onclick="toggleHRSubmenu()" class="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] hover:text-slate-300 transition-colors group">
                        <span class="flex items-center gap-2">
                            <i class="fa-solid fa-users-gear text-slate-600 group-hover:text-slate-400 transition-colors"></i>
                            Requests & HR
                        </span>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-600 rotate-icon transition-transform group-hover:text-slate-400" id="hr-chevron"></i>
                    </button>
                    <div id="hr-submenu" class="submenu-collapsible mt-2">
                        <div class="bg-slate-900/60 rounded-2xl p-3 border border-slate-800/60 space-y-2.5 shadow-inner shadow-black/10">
                            <select id="hr-request-type" class="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none">
                                <option value="leave">✈️ Leave Request</option>
                                <option value="resignation">📄 Letter of Resignation</option>
                                <option value="experience">📋 Letter of Experience</option>
                                <option value="transfer">🔄 Letter of Transfer</option>
                                <option value="promotion">⬆️ Letter of Promotion</option>
                                <option value="hire">✅ Letter of Hire</option>
                                <option value="other">📝 Other Request</option>
                            </select>
                            <button onclick="submitHRRequest()" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-paper-plane text-[10px]"></i>
                                Submit HR Request
                            </button>
                        </div>
                    </div>
                </div> -->
            </div>
        </aside>`;
        }
    }
}

// Initialize sidebar section
document.addEventListener('DOMContentLoaded', () => {
    new SidebarSection();
});
