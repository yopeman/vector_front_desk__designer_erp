// =============================================
// NOTES MODULE - MARKETING ERP
// =============================================

// Global state
const MarketingNotes = {
    data: [],
    filter: 'all',
    tempChecklist: [],
    selectedColor: 'slate',
    currentUserId: null
};

// =============================================
// INITIALIZE NOTES DATA
// =============================================
async function initNotesData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error('No authenticated user found');
            return;
        }
        MarketingNotes.currentUserId = user.id;
        await fetchNotes();
    } catch (error) {
        console.error('Error initializing notes:', error);
    }
}

// =============================================
// FETCH NOTES FROM SUPABASE
// =============================================
async function fetchNotes() {
    try {
        const { data, error } = await window.supabase
            .from('notes')
            .select('*')
            .eq('user_id', MarketingNotes.currentUserId)
            .order('pinned', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                console.warn('Notes table does not exist yet');
                MarketingNotes.data = [];
                MarketingNotes.render();
                return;
            }
            throw error;
        }

        MarketingNotes.data = (data || []).map(note => ({
            id: note.id,
            title: note.title || 'Untitled',
            content: note.content || '',
            color: note.color || 'slate',
            pinned: note.pinned || false,
            checklist: note.checklist || [],
            entity_type: note.entity_type,
            entity_id: note.entity_id,
            createdAt: formatNoteTime(note.created_at),
            updatedAt: formatNoteTime(note.updated_at)
        }));

        MarketingNotes.render();
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
}

function formatNoteTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    });
}

// =============================================
// RENDER NOTES
// =============================================
MarketingNotes.render = function() {
    const grid = document.getElementById('notes-grid');
    const empty = document.getElementById('notes-empty-state');
    const searchVal = document.getElementById('notes-search').value.toLowerCase();

    let filtered = MarketingNotes.data;

    if (MarketingNotes.filter === 'pinned') {
        filtered = filtered.filter(n => n.pinned);
    } else if (MarketingNotes.filter === 'unpinned') {
        filtered = filtered.filter(n => !n.pinned);
    }

    if (searchVal) {
        filtered = filtered.filter(n => (n.title + ' ' + n.content).toLowerCase().includes(searchVal));
    }

    if (!grid) return;
    grid.innerHTML = '';

    if (filtered.length === 0) {
        if (empty) empty.classList.remove('hidden');
    } else {
        if (empty) empty.classList.add('hidden');
    }

    filtered.forEach((note) => {
        const card = document.createElement('div');
        card.className = `note-card`;

        const colorMap = {
            slate: 'border-slate',
            blue: 'border-blue',
            emerald: 'border-emerald',
            amber: 'border-amber',
            rose: 'border-rose',
            purple: 'border-purple'
        };
        const colorBorder = colorMap[note.color] || colorMap.slate;

        const headerColorMap = {
            slate: 'bg-slate',
            blue: 'bg-blue',
            emerald: 'bg-emerald',
            amber: 'bg-amber',
            rose: 'bg-rose',
            purple: 'bg-purple'
        };
        const headerColor = headerColorMap[note.color] || headerColorMap.slate;

        const completedCount = note.checklist.filter(i => i.done).length;
        const progress = note.checklist.length ? Math.round((completedCount / note.checklist.length) * 100) : 0;

        let checklistHtml = '';
        if (note.checklist.length) {
            checklistHtml += `<div class="note-checklist">`;
            note.checklist.forEach((item, i) => {
                checklistHtml += `
                    <label class="checklist-item">
                        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleNoteChecklist('${note.id}', ${i})">
                        <span class="${item.done ? 'done' : ''}">${escapeHtml(item.text)}</span>
                    </label>
                `;
            });
            checklistHtml += `</div>
            <div class="checklist-progress">
                <div class="progress-bar ${headerColor}" style="width:${progress}%"></div>
            </div>
            <p class="checklist-count">${completedCount}/${note.checklist.length} done</p>`;
        }

        card.innerHTML = `
            <div class="note-actions">
                <button onclick="togglePinNote('${note.id}')" class="note-action-btn ${note.pinned ? 'pinned' : ''}" title="Pin note">
                    <i class="fa-solid fa-thumbtack"></i>
                </button>
                <button onclick="editNote('${note.id}')" class="note-action-btn" title="Edit note">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteNote('${note.id}')" class="note-action-btn delete" title="Delete note">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="note-content">
                <h4>${escapeHtml(note.title)}</h4>
                <p>${escapeHtml(note.content)}</p>
            </div>
            <div class="note-footer">
                ${checklistHtml}
            </div>
            <div class="note-meta">
                <span class="note-date">${note.createdAt}</span>
                <span class="note-color-indicator">
                    <span class="color-dot ${headerColor}"></span>
                    <span class="color-name">${note.color}</span>
                </span>
            </div>
        `;
        grid.appendChild(card);
    });

    MarketingNotes.updateStats();
}

// =============================================
// UPDATE NOTES STATS
// =============================================
MarketingNotes.updateStats = function() {
    const totalEl = document.getElementById('notes-total');
    const pinnedEl = document.getElementById('notes-pinned');
    const total = MarketingNotes.data.length;
    const pinned = MarketingNotes.data.filter(n => n.pinned).length;
    if (totalEl) totalEl.textContent = total;
    if (pinnedEl) pinnedEl.textContent = pinned;
}

// =============================================
// NOTES FILTER
// =============================================
function setNotesFilter(filter) {
    MarketingNotes.filter = filter;
    document.querySelectorAll('.notes-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`notes-filter-${MarketingNotes.filter}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    if (typeof MarketingNotes.render === 'function') MarketingNotes.render();
}

// =============================================
// NOTE MODAL OPERATIONS
// =============================================
function openNoteModal(noteId) {
    const modal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const modalTitle = document.getElementById('note-modal-title');

    MarketingNotes.tempChecklist = [];
    MarketingNotes.selectedColor = 'slate';
    document.querySelectorAll('.note-color-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.note-color-btn[data-color="slate"]')?.classList.add('active');

    if (noteId) {
        const note = MarketingNotes.data.find(n => n.id === noteId);
        if (note) {
            titleInput.value = note.title;
            contentInput.value = note.content;
            MarketingNotes.selectedColor = note.color || 'slate';
            MarketingNotes.tempChecklist = [...(note.checklist || [])];
            modalTitle.textContent = 'Edit Note';
            modal.setAttribute('data-edit-id', noteId);
            document.querySelectorAll('.note-color-btn').forEach(b => {
                if (b.getAttribute('data-color') === MarketingNotes.selectedColor) {
                    b.classList.add('active');
                }
            });
        }
    } else {
        titleInput.value = '';
        contentInput.value = '';
        modalTitle.textContent = 'Add Note';
        modal.removeAttribute('data-edit-id');
    }

    MarketingNotes.renderChecklistPreview();
    modal.style.display = 'flex';
    setTimeout(() => titleInput.focus(), 300);
}

function closeNoteModal() {
    const modal = document.getElementById('note-modal');
    if (modal) modal.style.display = 'none';
}

function addChecklistItemFromModal() {
    const input = document.getElementById('note-checklist-input');
    const text = input.value.trim();
    if (!text) return;
    MarketingNotes.tempChecklist.push({ text, done: false });
    input.value = '';
    MarketingNotes.renderChecklistPreview();
}

function removeTempChecklistItem(index) {
    MarketingNotes.tempChecklist.splice(index, 1);
    MarketingNotes.renderChecklistPreview();
}

function toggleTempChecklistItem(index) {
    MarketingNotes.tempChecklist[index].done = !MarketingNotes.tempChecklist[index].done;
    MarketingNotes.renderChecklistPreview();
}

MarketingNotes.renderChecklistPreview = function() {
    const container = document.getElementById('note-checklist-preview');
    if (!container) return;
    container.innerHTML = '';
    MarketingNotes.tempChecklist.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'checklist-preview-item';
        row.innerHTML = `
            <label class="checklist-item">
                <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleTempChecklistItem(${i})">
                <span class="${item.done ? 'done' : ''}">${escapeHtml(item.text)}</span>
            </label>
            <button onclick="removeTempChecklistItem(${i})" class="remove-checklist-item">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(row);
    });
}

async function saveNoteFromModal() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const modal = document.getElementById('note-modal');
    const editId = modal.getAttribute('data-edit-id');

    if (!title && !content) {
        alert('Please add a title or content for the note.');
        return;
    }

    const color = MarketingNotes.selectedColor || 'slate';

    try {
        if (editId) {
            const { error } = await window.supabase
                .from('notes')
                .update({
                    title: title || 'Untitled Note',
                    content: content || '',
                    color: color,
                    checklist: MarketingNotes.tempChecklist,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', editId);

            if (error) throw error;
        } else {
            const { error } = await window.supabase
                .from('notes')
                .insert({
                    user_id: MarketingNotes.currentUserId,
                    title: title || 'Untitled Note',
                    content: content || '',
                    color: color,
                    checklist: MarketingNotes.tempChecklist,
                    pinned: false,
                });

            if (error) throw error;
        }

        MarketingNotes.tempChecklist = [];
        closeNoteModal();
        await fetchNotes();
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Error saving note: ' + error.message);
    }
}

function editNote(noteId) {
    openNoteModal(noteId);
}

async function deleteNote(noteId) {
    if (!confirm('Delete this note?')) return;
    
    try {
        const { error } = await window.supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) throw error;

        MarketingNotes.data = MarketingNotes.data.filter(n => n.id !== noteId);
        MarketingNotes.render();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note: ' + error.message);
    }
}

async function togglePinNote(noteId) {
    try {
        const note = MarketingNotes.data.find(n => n.id === noteId);
        if (!note) return;

        const { error } = await window.supabase
            .from('notes')
            .update({ pinned: !note.pinned })
            .eq('id', noteId);

        if (error) throw error;

        await fetchNotes();
    } catch (error) {
        console.error('Error toggling pin:', error);
    }
}

async function toggleNoteChecklist(noteId, itemIndex) {
    try {
        const note = MarketingNotes.data.find(n => n.id === noteId);
        if (!note) return;

        note.checklist[itemIndex].done = !note.checklist[itemIndex].done;

        const { error } = await window.supabase
            .from('notes')
            .update({ checklist: note.checklist, updated_at: new Date().toISOString() })
            .eq('id', noteId);

        if (error) throw error;

        MarketingNotes.render();
    } catch (error) {
        console.error('Error toggling checklist item:', error);
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose functions to global scope for onclick handlers
window.openNoteModal = openNoteModal;
window.closeNoteModal = closeNoteModal;
window.addChecklistItemFromModal = addChecklistItemFromModal;
window.removeTempChecklistItem = removeTempChecklistItem;
window.toggleTempChecklistItem = toggleTempChecklistItem;
window.saveNoteFromModal = saveNoteFromModal;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.togglePinNote = togglePinNote;
window.toggleNoteChecklist = toggleNoteChecklist;
window.setNotesFilter = setNotesFilter;
window.renderNotes = function() {
    if (typeof MarketingNotes.render === 'function') MarketingNotes.render();
};
