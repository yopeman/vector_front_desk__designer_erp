// Machine Maintenance Tab Component
class MachineMaintenanceTab {
    constructor() {
        this.init();
    }
    init() {
        // Machine maintenance initialization handled by machine-maintenance.js
    }
    activate() {
        if (typeof switchMachine === 'function') switchMachine('cnc');
    }
}
const machineMaintenanceTab = new MachineMaintenanceTab();