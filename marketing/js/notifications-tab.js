// Notifications Tab Component
class NotificationsTab {
    constructor() {
        this.init();
    }
    init() {
        // Notifications initialization handled by notifications.js
    }
    activate() {
        if (typeof initNotificationsData === 'function') initNotificationsData();
        if (typeof renderNotifications === 'function') renderNotifications();
    }
}
const notificationsTab = new NotificationsTab();
