// NoteModal Component
// Renders the note-modal HTML

class NoteModal {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('note-modal-container');
        if (container) {
            container.innerHTML = `<div id="note-modal" class="modal-overlay" onclick="closeNoteModal(event)">
                <div class="modal-container max-w-2xl" onclick="event.stopPropagation()">
                    <button onclick="closeNoteModal()" class="modal-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-5">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                            <i class="fa-solid fa-pen text-white text-base"></i>
                        </div>
                        <div>
                            <h3 id="note-modal-title" class="text-lg font-bold text-white tracking-wide">Add Note</h3>
                            <p class="text-xs text-slate-400">Create a new note with title, content and checklist</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                            <input type="text" id="note-title" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-600" placeholder="Enter note title">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Content</label>
                            <textarea id="note-content" rows="4" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none" placeholder="Write your note..."></textarea>
                        </div>

                        <!-- Color Picker -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Color</label>
                            <div class="flex items-center gap-2 flex-wrap" id="note-color-picker">
                                <button type="button" data-color="slate" class="note-color-btn w-8 h-8 rounded-full bg-slate-600 border-2 border-transparent hover:scale-110 transition-all"></button>
                                <button type="button" data-color="blue" class="note-color-btn w-8 h-8 rounded-full bg-blue-500 border-2 border-transparent hover:scale-110 transition-all"></button>
                                <button type="button" data-color="emerald" class="note-color-btn w-8 h-8 rounded-full bg-emerald-500 border-2 border-transparent hover:scale-110 transition-all"></button>
                                <button type="button" data-color="amber" class="note-color-btn w-8 h-8 rounded-full bg-amber-500 border-2 border-transparent hover:scale-110 transition-all"></button>
                                <button type="button" data-color="rose" class="note-color-btn w-8 h-8 rounded-full bg-rose-500 border-2 border-transparent hover:scale-110 transition-all"></button>
                                <button type="button" data-color="purple" class="note-color-btn w-8 h-8 rounded-full bg-purple-500 border-2 border-transparent hover:scale-110 transition-all"></button>
                            </div>
                        </div>

                        <!-- Checklist -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Checklist</label>
                            <div id="note-checklist-preview" class="space-y-2 mb-2"></div>
                            <div class="flex gap-2">
                                <input type="text" id="note-checklist-input" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600" placeholder="Add checklist item and press Enter">
                                <button onclick="addChecklistItemFromModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Add</button>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-700/50">
                        <button onclick="closeNoteModal()" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
                        <button onclick="saveNoteFromModal()" class="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl transition-all shadow-lg shadow-amber-500/15 flex items-center gap-1.5">
                            <i class="fa-solid fa-floppy-disk text-[10px]"></i> Save Note
                        </button>
                    </div>
                </div>
            </div>`;
        }
    }
}

// Initialize modal
document.addEventListener('DOMContentLoaded', () => {
    new NoteModal();
});
