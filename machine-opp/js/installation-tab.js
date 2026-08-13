// Installation Tab Component
class InstallationTab {
    constructor() {
        this.init();
    }
    init() {
        // Installation initialization handled by installation.js
    }
    activate() {
        if (typeof renderInstallationTable === 'function') renderInstallationTable();
    }
}
const installationTab = new InstallationTab();
