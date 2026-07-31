// dashboard Section Component
// Renders the dashboard section HTML

class DashboardSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-dashboard');
        if (container) {
            container.innerHTML = `<div class="flex justify-between items-center">
                     <div>
                         <h2 class="text-2xl font-bold text-white tracking-tight">System Dashboard</h2>
                         <p class="text-sm text-slate-400">Real-time overview of all modules and activities.</p>
                     </div>
                 </div>

                 <!-- Presence & Clock Section -->
                 <div class="clock-panel flex items-center space-x-5 px-5 py-3 rounded-2xl shadow-lg shadow-black/5">
                     <div class="flex items-center space-x-2.5">
                         <span class="relative flex h-2.5 w-2.5">
                             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                             <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                         </span>
                         <span class="text-[11px] font-medium text-slate-400">Presence</span>
                     </div>
                     <div class="flex items-center gap-2">
                         <button onclick="toggleClock('in')" id="btnClockIn" class="clock-btn px-3.5 py-1.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5">
                             <i class="fa-solid fa-sign-in-alt text-[10px]"></i> Clock In
                         </button>
                         <span id="clockInTime" class="text-xs font-mono text-slate-300 min-w-[5rem] text-center tabular-nums bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-700/40">--:--:--</span>
                     </div>
                     <div class="w-px h-8 bg-slate-700/40"></div>
                     <div class="flex items-center gap-2">
                         <button onclick="toggleClock('out')" id="btnClockOut" class="clock-btn px-3.5 py-1.5 text-[11px] font-semibold bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5">
                             <i class="fa-solid fa-sign-out-alt text-[10px]"></i> Clock Out
                         </button>
                         <span id="clockOutTime" class="text-xs font-mono text-slate-300 min-w-[5rem] text-center tabular-nums bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-700/40">--:--:--</span>
                     </div>
                 </div>

                 <!-- Summary Cards -->
                 <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-container">
                     <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                         <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-clipboard-list text-blue-400 text-xl"></i>
                         </div>
                         <div>
                             <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
                             <p class="text-2xl font-bold text-white mt-0.5" id="dash-stats-total">0</p>
                         </div>
                     </div>
                     <div class="stat-card bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-4">
                         <div class="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-exclamation-triangle text-rose-400 text-xl"></i>
                         </div>
                         <div>
                             <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Urgent Orders</p>
                             <p class="text-2xl font-bold text-white mt-0.5" id="dash-stats-urgent">0</p>
                         </div>
                     </div>
                     <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                         <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-check-circle text-emerald-400 text-xl"></i>
                         </div>
                         <div>
                             <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
                             <p class="text-2xl font-bold text-white mt-0.5" id="dash-stats-completed">0</p>
                         </div>
                     </div>
                     <div class="stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                         <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-box text-amber-400 text-xl"></i>
                         </div>
                         <div>
                             <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Store Items</p>
                             <p class="text-2xl font-bold text-white mt-0.5" id="dash-stats-store">0</p>
                         </div>
                     </div>
                 </div>

                 <!-- Charts Row -->
                 <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <!-- Orders by Priority Chart -->
                     <div class="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                         <h3 class="text-sm font-semibold text-white mb-4">Orders by Priority</h3>
                         <div class="flex items-center justify-center">
                             <canvas id="chart-priority" width="220" height="220"></canvas>
                         </div>
                     </div>
                     <!-- Orders by Module Chart -->
                     <div class="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                         <h3 class="text-sm font-semibold text-white mb-4">Orders by Module</h3>
                         <div class="flex items-center justify-center">
                             <canvas id="chart-module" width="220" height="220"></canvas>
                         </div>
                     </div>
                     <!-- Store Items Chart -->
                     <div class="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                         <h3 class="text-sm font-semibold text-white mb-4">Store Items by Category</h3>
                         <div class="flex items-center justify-center">
                             <canvas id="chart-store" width="220" height="220"></canvas>
                         </div>
                     </div>
                 </div>

                 <!-- Module Links -->
                 <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <a href="#" onclick="switchTab('received-orders'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-clipboard-list text-blue-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">Received Orders</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Track incoming tasks</p>
                         </div>
                     </a>
                     <a href="#" onclick="switchTab('completed-orders'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-check-double text-emerald-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">Completed Orders</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Review finished work</p>
                         </div>
                     </a>
                     <a href="#" onclick="switchTab('store-request'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-box text-amber-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">Store</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Manage inventory</p>
                         </div>
                     </a>
                     <a href="#" onclick="switchTab('notifications'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-bell text-rose-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">Notifications</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Alerts & updates</p>
                         </div>
                     </a>
                     <a href="#" onclick="switchTab('messages'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-envelope text-indigo-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">Messages</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Team communication</p>
                         </div>
                     </a>
                     <a href="#" onclick="switchTab('notes'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-sticky-note text-purple-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">Notes</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Quick notes & checklist</p>
                         </div>
                     </a>
                     <a href="#" onclick="return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-users text-teal-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">HR Requests</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Leave & requests</p>
                         </div>
                     </a>
                     <a href="#" onclick="switchTab('settings'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-slate-500/30 hover:bg-slate-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-slate-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-gear text-slate-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-slate-400 transition-colors">Settings</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Configure system</p>
                         </div>
                     </a>
                 </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new DashboardSection();
});
