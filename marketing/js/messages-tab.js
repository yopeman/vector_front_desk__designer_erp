// Messages Tab Component
class MessagesTab {
    constructor() {
        this.init();
    }
    init() {
        // Messages initialization handled by messages.js
    }
    activate() {
        if (typeof initMessagesData === 'function') initMessagesData();
        if (typeof renderUserList === 'function') renderUserList();
    }
}
const messagesTab = new MessagesTab();
