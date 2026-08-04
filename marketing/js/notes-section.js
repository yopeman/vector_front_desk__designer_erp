// notes Section Component
// Renders the notes section HTML

class NotesSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('notes-section-container');
        if (container) {
            container.innerHTML = `<div class="section-header">
                    <div>
                        <h2 class="section-title">
                            <i class="fa-solid fa-note-sticky"></i>
                            Notes Center
                        </h2>
                        <p class="section-subtitle">Create, organize and track workspace notes with checklists, colors and pins.</p>
                    </div>
                    <button onclick="openNoteModal()" class="btn-primary">
                        <i class="fa-solid fa-plus"></i> Add Note
                    </button>
                </div>

                <!-- Stats & Search/Filter -->
                <div class="notes-toolbar">
                    <div class="notes-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fa-solid fa-note-sticky"></i>
                            </div>
                            <div class="stat-info">
                                <p class="stat-label">Total</p>
                                <p class="stat-value" id="notes-total">0</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon pinned">
                                <i class="fa-solid fa-thumbtack"></i>
                            </div>
                            <div class="stat-info">
                                <p class="stat-label">Pinned</p>
                                <p class="stat-value" id="notes-pinned">0</p>
                            </div>
                        </div>
                    </div>
                    <div class="notes-filters">
                        <div class="search-wrapper">
                            <i class="fa-solid fa-magnifying-glass search-icon"></i>
                            <input type="text" id="notes-search" onkeyup="renderNotes()" placeholder="Search notes by title or content..." class="search-input">
                            <button onclick="clearNotesSearch()" class="search-clear">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div class="filter-buttons">
                            <button onclick="setNotesFilter('all')" id="notes-filter-all" class="notes-filter-btn active">All</button>
                            <button onclick="setNotesFilter('pinned')" id="notes-filter-pinned" class="notes-filter-btn">Pinned</button>
                            <button onclick="setNotesFilter('unpinned')" id="notes-filter-unpinned" class="notes-filter-btn">Unpinned</button>
                        </div>
                    </div>
                </div>

                <!-- Notes Grid -->
                <div id="notes-grid" class="notes-grid">
                    <!-- Rendered by JS -->
                </div>

                <!-- Empty State -->
                <div id="notes-empty-state" class="empty-state hidden">
                    <div class="empty-icon">
                        <i class="fa-solid fa-note-sticky"></i>
                    </div>
                    <p class="empty-title">No notes found</p>
                    <p class="empty-subtitle">Create your first note using the Add Note button</p>
                </div>

                <!-- Note Modal -->
                <div id="note-modal" class="modal-overlay">
                    <div class="modal-content note-modal-content">
                        <div class="modal-header">
                            <h3 id="note-modal-title">Add Note</h3>
                            <button onclick="closeNoteModal()" class="modal-close">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Title</label>
                                <input type="text" id="note-title" class="form-input" placeholder="Note title...">
                            </div>
                            <div class="form-group">
                                <label>Content</label>
                                <textarea id="note-content" class="form-textarea" placeholder="Write your note here..." rows="4"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Color</label>
                                <div class="color-selector">
                                    <button type="button" class="note-color-btn active" data-color="slate" onclick="selectNoteColor('slate')">
                                        <span class="color-dot bg-slate"></span>
                                    </button>
                                    <button type="button" class="note-color-btn" data-color="blue" onclick="selectNoteColor('blue')">
                                        <span class="color-dot bg-blue"></span>
                                    </button>
                                    <button type="button" class="note-color-btn" data-color="emerald" onclick="selectNoteColor('emerald')">
                                        <span class="color-dot bg-emerald"></span>
                                    </button>
                                    <button type="button" class="note-color-btn" data-color="amber" onclick="selectNoteColor('amber')">
                                        <span class="color-dot bg-amber"></span>
                                    </button>
                                    <button type="button" class="note-color-btn" data-color="rose" onclick="selectNoteColor('rose')">
                                        <span class="color-dot bg-rose"></span>
                                    </button>
                                    <button type="button" class="note-color-btn" data-color="purple" onclick="selectNoteColor('purple')">
                                        <span class="color-dot bg-purple"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Checklist</label>
                                <div class="checklist-input-group">
                                    <input type="text" id="note-checklist-input" class="form-input" placeholder="Add checklist item...">
                                    <button onclick="addChecklistItemFromModal()" class="btn-secondary">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                                <div id="note-checklist-preview" class="checklist-preview">
                                    <!-- Rendered by JS -->
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button onclick="closeNoteModal()" class="btn-secondary">Cancel</button>
                            <button onclick="saveNoteFromModal()" class="btn-primary">Save Note</button>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new NotesSection();
});

// Helper function to select note color
function selectNoteColor(color) {
    MarketingNotes.selectedColor = color;
    document.querySelectorAll('.note-color-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.note-color-btn[data-color="${color}"]`)?.classList.add('active');
}

// Helper function to clear notes search
function clearNotesSearch() {
    const input = document.getElementById('notes-search');
    if (input) input.value = '';
    if (typeof MarketingNotes.render === 'function') MarketingNotes.render();
}

// Expose to global scope
window.selectNoteColor = selectNoteColor;
window.clearNotesSearch = clearNotesSearch;
