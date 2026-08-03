// notifications Section Component
// Renders the notifications section HTML

class NotificationsSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-notifications');
        if (container) {
            container.innerHTML = `<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-bell text-rose-400"></i>
                            Notification Center
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">Manage system notifications, mark as read/unread, search, filter, and delete.</p>
                    </div>
                </div>

                <!-- Stats Summary Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4" id="notif-stats-container">

                    <div class="stat-card bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-bell text-rose-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="notif-stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-envelope-open text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unread</p>
                            <p class="text-2xl font-bold text-blue-400 mt-0.5" id="notif-stats-unread">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-check-circle text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Read</p>
                            <p class="text-2xl font-bold text-emerald-400 mt-0.5" id="notif-stats-read">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-exclamation-triangle text-amber-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">High Priority</p>
                            <p class="text-2xl font-bold text-amber-400 mt-0.5" id="notif-stats-high">0</p>
                        </div>
                    </div>
                </div>

                <!-- Search & Filter Bar -->
                <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div class="relative w-full md:w-72">
                            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                            <input type="text" id="notif-search" onkeyup="filterNotifications()" placeholder="Search notifications..." 
                                   class="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 input-glow">
                            <button id="notif-search-clear" onclick="clearNotifSearch()" class="search-clear absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                        <div class="relative w-full md:w-44">
                            <select id="notif-status-filter" onchange="filterNotifications()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all">All Status</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <div class="relative w-full md:w-44">
                            <select id="notif-priority-filter" onchange="filterNotifications()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all">All Priority</option>
                                <option value="high">High</option>
                                <option value="normal">Normal</option>
                                <option value="low">Low</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-700/50">
                            <i class="fa-regular fa-filter"></i>
                            <span>Showing: <strong id="notif-filter-count" class="text-slate-300 font-semibold">0</strong></span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="topNav.markAllNotifRead()" class="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-blue-500/10">
                            <i class="fa-solid fa-check-double"></i> Mark All Read
                        </button>
                        <button onclick="resetNotifFilters()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
                            <i class="fa-solid fa-rotate-left"></i> Reset
                        </button>
                    </div>
                </div>

                <!-- Notifications List -->
                <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                    <div id="notifications-list" class="divide-y divide-slate-800">
                        <!-- Rendered by JS -->
                    </div>
                    <!-- No results state -->
                    <div id="notif-no-results" class="hidden flex flex-col items-center justify-center py-16 px-4">
                        <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                            <i class="fa-solid fa-bell-slash text-2xl text-slate-500"></i>
                        </div>
                        <p class="text-slate-400 font-medium">No notifications found</p>
                        <p class="text-xs text-slate-500 mt-1">Try adjusting your search or filter settings</p>
                        <button onclick="resetNotifFilters()" class="mt-4 text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-blue-500/20">
                            <i class="fa-solid fa-rotate-left mr-1.5"></i> Reset Filters
                        </button>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new NotificationsSection();
});
