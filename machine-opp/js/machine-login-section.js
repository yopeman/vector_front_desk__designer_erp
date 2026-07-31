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
                                <p class="text-xs font-semibold text-slate-200">Admin User</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Machine Selector Tabs - Modern Card Style -->
                <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-2 shadow-lg">
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        <button onclick="switchMachine('cnc')" id="machinetab-cnc" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105">
                            <div class="flex flex-col items-center gap-1.5">
                                <i class="fa-solid fa-microchip text-lg group-hover:scale-110 transition-transform"></i>
                                <span class="text-xs font-semibold">CNC</span>
                            </div>
                            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        </button>
                        <button onclick="switchMachine('co2')" id="machinetab-co2" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105">
                            <div class="flex flex-col items-center gap-1.5">
                                <i class="fa-solid fa-fire text-lg group-hover:scale-110 transition-transform"></i>
                                <span class="text-xs font-semibold">CO2</span>
                            </div>
                            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        </button>
                        <button onclick="switchMachine('fiber-cut')" id="machinetab-fiber-cut" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105">
                            <div class="flex flex-col items-center gap-1.5">
                                <i class="fa-solid fa-scissors text-lg group-hover:scale-110 transition-transform"></i>
                                <span class="text-xs font-semibold">Fiber Cut</span>
                            </div>
                            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        </button>
                        <button onclick="switchMachine('uv')" id="machinetab-uv" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105">
                            <div class="flex flex-col items-center gap-1.5">
                                <i class="fa-solid fa-sun text-lg group-hover:scale-110 transition-transform"></i>
                                <span class="text-xs font-semibold">UV Print</span>
                            </div>
                            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        </button>
                        <button onclick="switchMachine('3d-print')" id="machinetab-3d-print" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105">
                            <div class="flex flex-col items-center gap-1.5">
                                <i class="fa-solid fa-cube text-lg group-hover:scale-110 transition-transform"></i>
                                <span class="text-xs font-semibold">3D Print</span>
                            </div>
                            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        </button>
                        <button onclick="switchMachine('fiber-mark')" id="machinetab-fiber-mark" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105">
                            <div class="flex flex-col items-center gap-1.5">
                                <i class="fa-solid fa-stamp text-lg group-hover:scale-110 transition-transform"></i>
                                <span class="text-xs font-semibold">Fiber Mark</span>
                            </div>
                            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                        </button>
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

                <!-- Dynamic Checklist Cards Container -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" id="checklist-container"></div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new MachineloginSection();
});
