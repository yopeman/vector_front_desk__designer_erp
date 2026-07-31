// StoreRequestModal Component
// Renders the store-request-modal HTML

class StoreRequestModal {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('store-request-modal-container');
        if (container) {
            container.innerHTML = `<div id="store-request-modal" class="modal-overlay" onclick="closeStoreRequestModal(event)">
                <div class="modal-container max-w-4xl" onclick="event.stopPropagation()">
                    <!-- Close button -->
                    <button onclick="closeStoreRequestModal()" class="modal-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                    <!-- Modal header -->
                    <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-4">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                            <i class="fa-solid fa-boxes-stacked text-white text-base"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white tracking-wide">New Store Request Entry</h3>
                            <p class="text-xs text-slate-400">Add items to store request inventory</p>
                        </div>
                    </div>

                    <!-- Form Content -->
                    <div class="space-y-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-hashtag text-slate-500 text-[10px]"></i> Task/Project Order Number
                                </label>
                                <input type="text" id="store-task-num" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-700" placeholder="e.g. 0001/09">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-heading text-slate-500 text-[10px]"></i> Project/Task Name/Title
                                </label>
                                <input type="text" id="store-project-title" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-700" placeholder="e.g. UV Acrylic Sign">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-regular fa-calendar text-slate-500 text-[10px]"></i> Date
                                </label>
                                <input type="date" id="store-date" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-cubes text-slate-500 text-[10px]"></i> Material Type
                                </label>
                                <input type="text" id="store-material" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-700" placeholder="e.g. Acrylic">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-ruler text-slate-500 text-[10px]"></i> Unit
                                </label>
                                <input type="text" id="store-unit" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-700" placeholder="e.g. Sheets">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-sort-numeric-up text-slate-500 text-[10px]"></i> Quantity
                                </label>
                                <input type="number" id="store-qty" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-700" placeholder="e.g. 5">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-ruler-vertical text-slate-500 text-[10px]"></i> Thickness
                                </label>
                                <input type="text" id="store-thickness" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-700" placeholder="e.g. 5mm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-palette text-slate-500 text-[10px]"></i> Color
                                </label>
                                <input type="text" id="store-color" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-700" placeholder="e.g. Black">
                            </div>
                        </div>

                        <!-- Dimension Block Layout -->
                        <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40 space-y-3">
                            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span class="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <i class="fa-solid fa-ruler-combined text-blue-400 text-[10px]"></i>
                                </span>
                                Dimensions (Size Layout Spec)
                            </span>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Length</label>
                                    <input type="text" id="store-length" placeholder="Length" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Width</label>
                                    <input type="text" id="store-width" placeholder="Width" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Height</label>
                                    <input type="text" id="store-height" placeholder="Height" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                                <div>
                                    <label class="block text-[11px] text-slate-400 mb-1">Gram</label>
                                    <input type="text" id="store-gram" placeholder="Gram" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                </div>
                            </div>
                        </div>

                        <!-- Buttons Row Actions -->
                        <div class="flex gap-4 pt-2">
                            <button onclick="addStoreItem()" class="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-plus text-xs"></i> <span>Add Item (መዝግብ)</span>
                            </button>
                            <button onclick="closeStoreRequestModal()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-slate-700/15">
                                <i class="fa-solid fa-xmark mr-2 text-xs"></i> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
}

// Initialize modal
document.addEventListener('DOMContentLoaded', () => {
    new StoreRequestModal();
});
