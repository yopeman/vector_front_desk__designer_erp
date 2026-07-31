// notes Section Component
// Renders the notes section HTML

class NotesSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-notes');
        if (container) {
            container.innerHTML = `<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-note-sticky text-amber-400"></i>
                            Notes Center
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">Create, organize and track workspace notes with checklists, colors and pins.</p>
                    </div>
                    <button onclick="openNoteModal()" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/15 flex items-center gap-2 w-fit">
                        <i class="fa-solid fa-plus text-xs"></i> Add Note
                    </button>
                </div>

                <!-- Stats & Search/Filter -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div class="md:col-span-3 grid grid-cols-2 gap-3">
                        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-note-sticky text-blue-400 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                                <p class="text-lg font-bold text-white" id="notes-total">0</p>
                            </div>
                        </div>
                        <div class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                            <div class="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-thumbtack text-amber-400 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pinned</p>
                                <p class="text-lg font-bold text-white" id="notes-pinned">0</p>
                            </div>
                        </div>
                    </div>
                    <div class="md:col-span-9 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center">
                        <div class="relative flex-1 w-full">
                            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-sm"></i>
                            <input type="text" id="notes-search" onkeyup="renderNotes()" placeholder="Search notes by title or content..." class="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 input-glow">
                            <button onclick="clearNotesSearch()" class="search-clear absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <button onclick="setNotesFilter('all')" id="notes-filter-all" class="notes-filter-btn text-xs font-semibold px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 transition-all">All</button>
                            <button onclick="setNotesFilter('pinned')" id="notes-filter-pinned" class="notes-filter-btn text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all">Pinned</button>
                            <button onclick="setNotesFilter('unpinned')" id="notes-filter-unpinned" class="notes-filter-btn text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all">Unpinned</button>
                        </div>
                    </div>
                </div>

                <!-- Notes Grid -->
                <div id="notes-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <!-- Rendered by JS -->
                </div>

                <!-- Empty State -->
                <div id="notes-empty-state" class="hidden flex flex-col items-center justify-center py-16 px-4">
                    <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                        <i class="fa-solid fa-note-sticky text-2xl text-slate-500"></i>
                    </div>
                    <p class="text-slate-400 font-medium">No notes found</p>
                    <p class="text-xs text-slate-500 mt-1">Create your first note using the Add Note button</p>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new NotesSection();
});
