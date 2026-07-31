// Notes Tab Component
class NotesTab {
    constructor() {
        this.init();
    }
    init() {
        // Notes initialization handled by notes.js
    }
    activate() {
        if (typeof renderNotes === 'function') renderNotes();
        if (typeof setNotesFilter === 'function') setNotesFilter('all');
    }
}
const notesTab = new NotesTab();