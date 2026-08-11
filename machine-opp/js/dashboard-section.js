// dashboard Section Component
// Renders the dashboard section HTML

class DashboardSection {
    constructor() {
        this.render();
    }

    async render() {
        await Auth.initPromise;
        const container = document.getElementById('content-dashboard');
        const currentUser = Auth.getCurrentUser();
        const isFinishRole = currentUser && currentUser.role === 'finish';
        console.log(currentUser);

        if (container) {
            container.innerHTML = `<div class="flex justify-between items-center">
                     <div>
                         <h2 class="text-2xl font-bold text-white tracking-tight">System Dashboard</h2>
                         <p class="text-sm text-slate-400">Real-time overview of all modules and activities.</p>
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
                     <div class="stat-card bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4">
                         <div class="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-wrench text-violet-400 text-xl"></i>
                         </div>
                         <div>
                             <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Maintenance</p>
                             <p class="text-2xl font-bold text-white mt-0.5" id="dash-stats-maintenance">0</p>
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
                     <!-- Machine Maintenance Chart -->
                     <div class="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                         <h3 class="text-sm font-semibold text-white mb-4">Maintenance by Status</h3>
                         <div class="flex items-center justify-center">
                             <canvas id="chart-maintenance" width="220" height="220"></canvas>
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
                     ${!isFinishRole ? `<a href="#" onclick="switchTab('machine-login'); return false;" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
                         <div class="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                             <i class="fa-solid fa-wrench text-violet-400 text-lg"></i>
                         </div>
                         <div>
                             <p class="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">Machine Maintenance</p>
                             <p class="text-[11px] text-slate-400 mt-0.5">Checklists & logs</p>
                         </div>
                     </a>` : ''}
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
                     <a href="https://vectoradvert.com/erp/hr" class="group bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all duration-200 flex items-center gap-4 no-underline">
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
