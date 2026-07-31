// rework-login Section Component
// Renders the rework-login section HTML

class ReworkloginSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-rework-login');
        if (container) {
            container.innerHTML = `<!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-arrows-rotate text-amber-400"></i>
                            Rework Recording
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">
                            Log rework requests, update job statuses, and track time recordings.
                            <span class="text-slate-500">(የስራ እንደገና ማስተካከያ ምዝገባ)</span>
                        </p>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <!-- Input Form -->
                    <div class="xl:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-5 shadow-xl">
                        <div class="flex items-center gap-2 pb-3 border-b border-slate-700/60">
                            <div class="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-plus text-amber-400 text-sm"></i>
                            </div>
                            <h3 class="text-sm font-bold text-white uppercase tracking-wider">New Rework Entry</h3>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-heading text-slate-500 text-[10px]"></i> Project/Task Name/Title
                                </label>
                                <input type="text" id="rework-title" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="Enter project name">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-regular fa-calendar text-slate-500 text-[10px]"></i> Date
                                </label>
                                <input type="date" id="rework-date" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-cubes text-slate-500 text-[10px]"></i> Material Type
                                </label>
                                <input type="text" id="rework-material" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. Acrylic, Metal">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-ruler-vertical text-slate-500 text-[10px]"></i> Thickness
                                </label>
                                <input type="text" id="rework-thickness" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. 5mm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-palette text-slate-500 text-[10px]"></i> Color
                                </label>
                                <input type="text" id="rework-color" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. Black, Clear">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-microchip text-slate-500 text-[10px]"></i> Machine Type
                                </label>
                                <select id="rework-machine" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow cursor-pointer">
                                    <option value="">Select Machine</option>
                                    <option value="CNC">CNC Machine</option>
                                    <option value="CO2">CO2 Machine</option>
                                    <option value="UV">UV Printer</option>
                                    <option value="Fiber Cut">Fiber Cutting</option>
                                    <option value="3D Print">3D Printing</option>
                                    <option value="Fiber Mark">Fiber Marking</option>
                                </select>
                            </div>
                        </div>

                        <!-- Size Layout Sub-grid -->
                        <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40 space-y-3">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <i class="fa-solid fa-ruler-combined text-blue-400 text-[10px]"></i>
                                </span>
                                Dimensions (Size Layout Spec)
                            </span>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Length</label>
                                    <input type="text" id="rework-length" placeholder="Length" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Width</label>
                                    <input type="text" id="rework-width" placeholder="Width" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Height</label>
                                    <input type="text" id="rework-height" placeholder="Height" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Gram</label>
                                    <input type="text" id="rework-gram" placeholder="Gram" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                            </div>
                        </div>

                        <!-- Rework Reason text area -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <i class="fa-solid fa-comment-dots text-slate-500 text-[10px]"></i> Rework Reason
                            </label>
                            <textarea id="rework-reason" rows="3" placeholder="Enter detailed reason for rework..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none"></textarea>
                        </div>

                        <!-- Submit Button -->
                        <div class="flex justify-end pt-2">
                            <button onclick="alert('Rework Approval Requested')" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-amber-500/15 flex items-center gap-2">
                                <i class="fa-solid fa-check text-xs"></i> Request Approval
                            </button>
                        </div>
                    </div>

                    <!-- Status Controls Panel -->
                    <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <div class="flex items-center gap-2 pb-3 border-b border-slate-700/60 mb-4">
                            <div class="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                <i class="fa-solid fa-circle-notch text-emerald-400 text-sm"></i>
                            </div>
                            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Status Timeline</h3>
                        </div>

                        <!-- Timeline visualization -->
                        <div class="space-y-1 mb-5">
                            <div class="timeline-step">
                                <span class="dot"></span>
                                <p class="text-xs text-slate-400">Order Received</p>
                            </div>
                            <div class="timeline-step active" id="rework-step-in-progress">
                                <span class="dot"></span>
                                <p class="text-xs text-slate-300 font-medium" id="rework-step-progress-text">In Progress</p>
                            </div>
                            <div class="timeline-step" id="rework-step-completed">
                                <span class="dot"></span>
                                <p class="text-xs text-slate-500" id="rework-step-completed-text">Completed</p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <button onclick="logReworkStatusTime('start')" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition-all text-center tracking-wide shadow-md uppercase flex items-center justify-center gap-2">
                                <i class="fa-solid fa-play text-[10px]"></i> Start Rework
                            </button>
                            <div id="rework-start-time" class="text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1.5 rounded-lg">Recorded start time will appear here</div>

                            <div class="pt-3 border-t border-slate-700/60 space-y-3">
                                <button onclick="logReworkStatusTime('end')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all text-center tracking-wide shadow-md uppercase flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-stop text-[10px]"></i> End Rework
                                </button>
                                <div id="rework-end-time" class="text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1.5 rounded-lg">Recorded end time will appear here</div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new ReworkloginSection();
});
