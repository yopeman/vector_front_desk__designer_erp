// =============================================
// NOTES MODULE
// =============================================

let notesData = [];
let notesIdCounter = 1;
let currentNoteFilter = 'all';
let tempNoteChecklist = [];
let selectedNoteColor = 'slate';

// =============================================
// RENDER NOTES
// =============================================
function renderNotes() {
    const grid = document.getElementById('notes-grid');
    const empty = document.getElementById('notes-empty-state');
    const searchVal = document.getElementById('notes-search').value.toLowerCase();

    let filtered = notesData;

    if (currentNoteFilter === 'pinned') {
        filtered = filtered.filter(n => n.pinned);
    } else if (currentNoteFilter === 'unpinned') {
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

    filtered.forEach((note, idx) => {
        const realIndex = notesData.indexOf(note);
        const card = document.createElement('div');
        card.className = `note-card bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-xl relative overflow-hidden`;

        const colorMap = {
            slate: 'border-slate-500/40',
            blue: 'border-blue-500/40',
            emerald: 'border-emerald-500/40',
            amber: 'border-amber-500/40',
            rose: 'border-rose-500/40',
            purple: 'border-purple-500/40'
        };
        const colorBorder = colorMap[note.color] || colorMap.slate;

        const headerColorMap = {
            slate: 'bg-slate-500',
            blue: 'bg-blue-500',
            emerald: 'bg-emerald-500',
            amber: 'bg-amber-500',
            rose: 'bg-rose-500',
            purple: 'bg-purple-500'
        };
        const headerColor = headerColorMap[note.color] || headerColorMap.slate;

        const completedCount = note.checklist.filter(i => i.done).length;
        const progress = note.checklist.length ? Math.round((completedCount / note.checklist.length) * 100) : 0;

        let checklistHtml = '';
        if (note.checklist.length) {
            checklistHtml += `<div class="space-y-1.5">`;
            note.checklist.forEach((item, i) => {
                checklistHtml += `
                    <label class="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleNoteChecklist(${realIndex}, ${i})" class="mt-0.5 rounded border-slate-600 text-blue-500 focus:ring-blue-500/30 bg-slate-900">
                        <span class="${item.done ? 'line-through text-slate-500' : ''}">${escapeHtml(item.text)}</span>
                    </label>
                `;
            });
            checklistHtml += `</div>
            <div class="w-full bg-slate-900/80 rounded-full h-1.5 mt-2 overflow-hidden">
                <div class="h-full ${headerColor} rounded-full transition-all duration-500" style="width:${progress}%"></div>
            </div>
            <p class="text-[10px] text-slate-500 font-mono">${completedCount}/${note.checklist.length} done</p>`;
        }

        card.innerHTML = `
            <div class="absolute top-3 right-3 flex items-center gap-1.5">
                <button onclick="togglePinNote(${realIndex})" class="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center justify-center" title="Pin note">
                    <i class="fa-solid fa-thumbtack text-[10px] ${note.pinned ? 'text-amber-400' : ''}"></i>
                </button>
                <button onclick="editNote(${realIndex})" class="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center justify-center" title="Edit note">
                    <i class="fa-solid fa-pen text-[10px]"></i>
                </button>
                <button onclick="deleteNote(${realIndex})" class="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center" title="Delete note">
                    <i class="fa-solid fa-trash text-[10px]"></i>
                </button>
            </div>
            <div class="pr-24">
                <h4 class="text-sm font-bold text-white leading-tight line-clamp-2">${escapeHtml(note.title)}</h4>
                <p class="text-xs text-slate-400 mt-1 line-clamp-3 whitespace-pre-wrap">${escapeHtml(note.content)}</p>
            </div>
            <div class="border-t border-slate-700/50 pt-2.5">
                ${checklistHtml}
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span class="font-mono">${note.createdAt}</span>
                <span class="inline-flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full ${headerColor}"></span>
                    <span class="capitalize">${note.color}</span>
                </span>
            </div>
        `;
        grid.appendChild(card);
    });

    updateNotesStats();
}

// =============================================
// UPDATE NOTES STATS
// =============================================
function updateNotesStats() {
    const totalEl = document.getElementById('notes-total');
    const pinnedEl = document.getElementById('notes-pinned');
    if (totalEl) totalEl.textContent = notesData.length;
    if (pinnedEl) pinnedEl.textContent = notesData.filter(n => n.pinned).length;
}

// =============================================
// NOTES FILTER
// =============================================
function setNotesFilter(filter) {
    currentNoteFilter = filter;
    document.querySelectorAll('.notes-filter-btn').forEach(btn => {
        btn.className = 'notes-filter-btn text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all';
    });
    const activeBtn = document.getElementById(`notes-filter-${filter}`);
    if (activeBtn) {
        activeBtn.className = 'notes-filter-btn text-xs font-semibold px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 transition-all';
    }
    renderNotes();
}

function clearNotesSearch() {
    const search = document.getElementById('notes-search');
    if (search) search.value = '';
    renderNotes();
}

// =============================================
// NOTE MODAL OPERATIONS
// =============================================
function openNoteModal(noteIndex) {
    const modal = document.getElementById('note-modal');
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const modalTitle = document.getElementById('note-modal-title');

    tempNoteChecklist = [];
    selectedNoteColor = 'slate';
    document.querySelectorAll('.note-color-btn').forEach(b => b.classList.remove('ring-2', 'ring-white'));
    document.querySelector('.note-color-btn[data-color="slate"]')?.classList.add('ring-2', 'ring-white');

    if (noteIndex !== undefined && noteIndex !== null && notesData[noteIndex]) {
        const note = notesData[noteIndex];
        titleInput.value = note.title;
        contentInput.value = note.content;
        selectedNoteColor = note.color || 'slate';
        tempNoteChecklist = [...(note.checklist || [])];
        modalTitle.textContent = 'Edit Note';
        modal.setAttribute('data-edit-index', noteIndex);
        document.querySelectorAll('.note-color-btn').forEach(b => {
            if (b.getAttribute('data-color') === selectedNoteColor) {
                b.classList.add('ring-2', 'ring-white');
            }
        });
    } else {
        titleInput.value = '';
        contentInput.value = '';
        modalTitle.textContent = 'Add Note';
        modal.removeAttribute('data-edit-index');
    }

    renderNoteChecklistPreview();
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(() => titleInput.focus(), 300);
}

function closeNoteModal(event) {
    const modal = document.getElementById('note-modal');
    if (!modal) return;
    
    if (event && event.target !== modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

function addChecklistItemFromModal() {
    const input = document.getElementById('note-checklist-input');
    const text = input.value.trim();
    if (!text) return;
    tempNoteChecklist.push({ text, done: false });
    input.value = '';
    renderNoteChecklistPreview();
}

function removeTempChecklistItem(index) {
    tempNoteChecklist.splice(index, 1);
    renderNoteChecklistPreview();
}

function toggleTempChecklistItem(index) {
    tempNoteChecklist[index].done = !tempNoteChecklist[index].done;
    renderNoteChecklistPreview();
}

function renderNoteChecklistPreview() {
    const container = document.getElementById('note-checklist-preview');
    if (!container) return;
    container.innerHTML = '';
    tempNoteChecklist.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between bg-slate-900/70 border border-slate-700/50 rounded-lg px-3 py-2';
        row.innerHTML = `
            <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer flex-1">
                <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleTempChecklistItem(${i})" class="rounded border-slate-600 text-blue-500 focus:ring-blue-500/30 bg-slate-900">
                <span class="${item.done ? 'line-through text-slate-500' : ''}">${escapeHtml(item.text)}</span>
            </label>
            <button onclick="removeTempChecklistItem(${i})" class="text-slate-500 hover:text-rose-400 transition-colors ml-2">
                <i class="fa-solid fa-xmark text-[10px]"></i>
            </button>
        `;
        container.appendChild(row);
    });
}

function saveNoteFromModal() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const modal = document.getElementById('note-modal');
    const editIndex = modal.getAttribute('data-edit-index');

    if (!title && !content) {
        alert('Please add a title or content for the note.');
        return;
    }

    const color = selectedNoteColor || 'slate';

    if (editIndex !== null) {
        const note = notesData[parseInt(editIndex)];
        note.title = title;
        note.content = content;
        note.color = color;
        note.checklist = [...tempNoteChecklist];
    } else {
        const now = new Date();
        const createdAt = now.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        notesData.unshift({
            id: notesIdCounter++,
            title: title || 'Untitled Note',
            content: content || '',
            color,
            checklist: [...tempNoteChecklist],
            pinned: false,
            createdAt
        });
    }

    tempNoteChecklist = [];
    closeNoteModal();
    renderNotes();
}

function editNote(index) {
    openNoteModal(index);
}

function deleteNote(index) {
    if (!confirm('Delete this note?')) return;
    notesData.splice(index, 1);
    renderNotes();
}

function togglePinNote(index) {
    notesData[index].pinned = !notesData[index].pinned;
    renderNotes();
}

function toggleNoteChecklist(noteIndex, itemIndex) {
    notesData[noteIndex].checklist[itemIndex].done = !notesData[noteIndex].checklist[itemIndex].done;
    renderNotes();
}