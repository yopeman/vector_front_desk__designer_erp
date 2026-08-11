// completed-orders Section Component
// Renders the completed-orders section HTML

class CompletedordersSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-completed-orders');
        if (container) {
            container.innerHTML = `<div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight">Completed Order Status</h2>
                        <p class="text-sm text-slate-400">Overview of completed operations with data export options.</p>
                    </div>
                    <button onclick="exportPDF()" class="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center shadow-lg shadow-rose-600/10">
                        <i class="fa-solid fa-file-pdf mr-2 text-sm"></i> Export PDF
                    </button>
                </div>

                <!-- Filters -->
                <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="relative w-full md:w-96">
                        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                        <input type="text" id="completed-orders-search" placeholder="Search logs..." class="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    </div>
                </div>

                <!-- Table Content Wrapper -->
                <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    <th class="p-4 text-center w-16">No</th>
                                    <th class="p-4">Date</th>
                                    <th class="p-4">Task/Project</th>
                                    <th class="p-4">Order Number</th>
                                    <th class="p-4">Project/Task Name/Title</th>
                                    <th class="p-4">Machine Used</th>
                                    <th class="p-4">Material Used</th>
                                    <th class="p-4">Thickness</th>
                                    <th class="p-4">Color</th>
                                    <th class="p-4">Length</th>
                                    <th class="p-4">Width</th>
                                    <th class="p-4">Area</th>
                                    <th class="p-4">Quality</th>
                                    <th class="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody id="completed-orders-body" class="divide-y divide-slate-800 text-sm text-slate-300">
                                <tr class="hover:bg-slate-800/40 transition-colors">
                                    <td class="p-4 text-center font-mono text-slate-500">1</td>
                                    <td class="p-4 font-mono">03/06/26</td>
                                    <td class="p-4"><span class="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">Task</span></td>
                                    <td class="p-4 font-mono">0842</td>
                                    <td class="p-4 font-medium">Engraving Sign</td>
                                    <td class="p-4 font-mono text-xs">CNC-01</td>
                                    <td class="p-4 text-slate-400">Acrylic</td>
                                    <td class="p-4 font-mono text-xs">5mm</td>
                                    <td class="p-4">Clear</td>
                                    <td class="p-4 font-mono text-xs">120</td>
                                    <td class="p-4 font-mono text-xs">60</td>
                                    <td class="p-4 font-mono text-xs">7200</td>
                                    <td class="p-4 text-emerald-400 text-xs font-bold">Pass</td>
                                    <td class="p-4"><span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20">Completed</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new CompletedordersSection();
    // Fetch and render completed orders from Supabase
    if (typeof initCompletedOrders === 'function') {
        initCompletedOrders();
    }
});
