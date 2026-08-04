// Settings Tab Component
class SettingsTab {
    constructor() {
        this.init();
    }
    init() {
        // Settings initialization handled by settings.js
    }
    activate() {
        if (typeof initSettings === 'function') initSettings();
        if (typeof loadProfile === 'function') loadProfile();
        if (typeof loadNotificationSettings === 'function') loadNotificationSettings();
        if (typeof loadAppearanceSettings === 'function') loadAppearanceSettings();
    }
}
const settingsTab = new SettingsTab();
