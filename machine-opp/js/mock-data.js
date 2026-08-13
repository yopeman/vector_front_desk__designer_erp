// =============================================
// MOCK DATA MODULE
// Machine Operation ERP System - Sample Data
// =============================================

// =============================================
// RECEIVED ORDERS DATA
// =============================================
let ordersData = [];
window.ordersData = ordersData;

// =============================================
// COMPLETED ORDERS DATA
// =============================================
let completedOrdersData = [];
window.completedOrdersData = completedOrdersData;

// =============================================
// REWORK RECORDS DATA
// =============================================
let reworkData = [
    { id: 1, date: '15/01/25', taskType: 'Edge Polishing', machine: 'CNC-01', material: 'Granite', status: 'completed' },
    { id: 2, date: '16/01/25', taskType: 'Cut Correction', machine: 'CNC-02', material: 'Marble', status: 'in-progress' },
    { id: 3, date: '17/01/25', taskType: 'Surface Refinishing', machine: 'CNC-01', material: 'Quartz', status: 'completed' }
];
let reworkIdCounter = 4;
window.reworkData = reworkData;
window.reworkIdCounter = reworkIdCounter;

// =============================================
// DELIVERY DATA
// =============================================
let deliveryData = [
    { id: 1, date: '18/01/25', orderNum: 'ORD-001', deliveryType: 'Standard', driver: 'John Smith', vehicle: 'TRK-101', location: 'Warehouse A', status: 'completed' },
    { id: 2, date: '19/01/25', orderNum: 'ORD-002', deliveryType: 'Express', driver: 'Jane Doe', vehicle: 'TRK-102', location: 'Site B', status: 'in-transit' },
    { id: 3, date: '20/01/25', orderNum: 'ORD-003', deliveryType: 'Standard', driver: 'Mike Johnson', vehicle: 'TRK-103', location: 'Warehouse A', status: 'pending' }
];
window.deliveryData = deliveryData;

// =============================================
// INSTALLATION DATA
// =============================================
let installationData = [
    { id: 1, date: '21/01/25', orderNum: 'ORD-004', installationType: 'Kitchen Counter', technician: 'Tom Wilson', equipment: 'Kit-001', siteLocation: '123 Main St', status: 'completed' },
    { id: 2, date: '22/01/25', orderNum: 'ORD-005', installationType: 'Bathroom Vanity', technician: 'Sarah Lee', equipment: 'Kit-002', siteLocation: '456 Oak Ave', status: 'in-progress' },
    { id: 3, date: '23/01/25', orderNum: 'ORD-006', installationType: 'Floor Tiling', technician: 'Bob Brown', equipment: 'Kit-003', siteLocation: '789 Pine Rd', status: 'pending' }
];
window.installationData = installationData;

// =============================================
// INVENTORY DATA
// =============================================
let inventoryData = [
    { id: 1, date: '24/01/25', itemId: 'INV-001', itemName: 'Granite Slab', category: 'Raw Material', sku: 'GRN-001', location: 'Zone A', status: 'in-stock' },
    { id: 2, date: '25/01/25', itemId: 'INV-002', itemName: 'Marble Block', category: 'Raw Material', sku: 'MRB-002', location: 'Zone B', status: 'low-stock' },
    { id: 3, date: '26/01/25', itemId: 'INV-003', itemName: 'Quartz Sheet', category: 'Finished Product', sku: 'QTZ-003', location: 'Zone C', status: 'in-stock' }
];
window.inventoryData = inventoryData;

// =============================================
// STOCK MOVEMENT DATA
// =============================================
let stockMovementData = [
    { id: 1, date: '27/01/25', movementId: 'MOV-001', movementType: 'Transfer In', item: 'Granite Slab', quantity: '50 pcs', fromTo: 'From: Supplier', status: 'completed' },
    { id: 2, date: '28/01/25', movementId: 'MOV-002', movementType: 'Transfer Out', item: 'Marble Block', quantity: '20 pcs', fromTo: 'To: Production', status: 'completed' },
    { id: 3, date: '29/01/25', movementId: 'MOV-003', movementType: 'Adjustment', item: 'Quartz Sheet', quantity: '+5 pcs', fromTo: 'Zone A → Zone C', status: 'completed' }
];
window.stockMovementData = stockMovementData;

// =============================================
// STORE REQUEST DATA
// =============================================
let localStoreItemsList = [];
window.localStoreItemsList = localStoreItemsList;

// =============================================
// MACHINE CHECKLISTS DATA
// =============================================
let machineData = {};
window.machineData = machineData;

// =============================================
// MESSAGES DATA
// =============================================
let messagesData = [];
let selectedMsgUserId = null;
let msgIdCounter = 1;
let msgUserIdCounter = 1;

const avatarColors = [
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-purple-500 to-violet-600',
    'bg-gradient-to-br from-cyan-500 to-blue-600',
    'bg-gradient-to-br from-lime-500 to-green-600',
    'bg-gradient-to-br from-fuchsia-500 to-purple-600'
];

function getAvatarColor(index) {
    return avatarColors[index % avatarColors.length];
}

function createMsgUser(name, avatarInitials, online, messages) {
    const id = msgUserIdCounter++;
    return {
        id,
        name,
        avatarInitials,
        online,
        avatarColor: getAvatarColor(id),
        messages
    };
}

function createMsg(text, sender, time) {
    return { id: msgIdCounter++, text, sender, time };
}

// initMessagesData is now in messages.js with Supabase integration

// =============================================
// NOTIFICATIONS DATA
// =============================================
let notificationsData = [];
let notifIdCounter = 1;

// initNotificationsData is now in notifications.js with Supabase integration

// =============================================
// NOTES DATA
// =============================================
let notesData = [];
let notesIdCounter = 1;

// =============================================
// REPORTS COLUMN CONFIGURATIONS
// =============================================
const reportColumnConfigs = {
    'received-orders': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Order #', cls: 'font-mono' },
        { key: 'title', label: 'Work Type', cls: '' },
        { key: 'designer', label: 'Designer', cls: 'text-xs' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'machine', label: 'Machine', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'rework': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'title', label: 'Work Type', cls: '' },
        { key: 'designer', label: 'Machine', cls: 'text-xs' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'completed-orders': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Order #', cls: 'font-mono' },
        { key: 'title', label: 'Work Type', cls: '' },
        { key: 'designer', label: 'Machine', cls: 'text-xs' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'machine', label: 'Equipment', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'machine-maintenance': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Log ID', cls: 'font-mono' },
        { key: 'title', label: 'Machine', cls: '' },
        { key: 'designer', label: 'Performed By', cls: 'text-xs' },
        { key: 'material', label: 'Type', cls: 'text-xs' },
        { key: 'machine', label: 'Machine Name', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' },
        { key: 'checklistCount', label: 'Items', cls: 'text-center' },
        { key: 'notes', label: 'Notes', cls: 'text-xs' }
    ],
    'delivery': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Order #', cls: 'font-mono' },
        { key: 'title', label: 'Delivery Type', cls: '' },
        { key: 'designer', label: 'Driver', cls: 'text-xs' },
        { key: 'material', label: 'Vehicle', cls: 'text-xs' },
        { key: 'machine', label: 'Location', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'installation': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Order #', cls: 'font-mono' },
        { key: 'title', label: 'Installation Type', cls: '' },
        { key: 'designer', label: 'Technician', cls: 'text-xs' },
        { key: 'material', label: 'Equipment', cls: 'text-xs' },
        { key: 'machine', label: 'Site Location', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'inventory': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Item ID', cls: 'font-mono' },
        { key: 'title', label: 'Item Name', cls: '' },
        { key: 'designer', label: 'Category', cls: 'text-xs' },
        { key: 'material', label: 'SKU', cls: 'text-xs' },
        { key: 'machine', label: 'Location', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'stock-movement': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Movement ID', cls: 'font-mono' },
        { key: 'title', label: 'Movement Type', cls: '' },
        { key: 'designer', label: 'Item', cls: 'text-xs' },
        { key: 'material', label: 'Quantity', cls: 'text-xs' },
        { key: 'machine', label: 'From/To', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ]
};

const moduleLabels = {
    'received-orders': 'Received Order',
    'rework': 'Rework Recording',
    'completed-orders': 'Completed Order',
    'delivery': 'Delivery',
    'installation': 'Installation',
    'machine-maintenance': 'Machine Maintenance Logs',
    'inventory': 'Inventory',
    'stock-movement': 'Stock Movement'
};

// =============================================
// STATE VARIABLES
// =============================================
let currentOrderIndex = -1;
let currentMachine = 'cnc';
const checklistStates = { daily: {}, weekly: {}, monthly: {} };
let columnVisibility = {};
let currentNoteFilter = 'all';
let tempNoteChecklist = [];
let selectedNoteColor = 'slate';
let itemsPerPage = 10;
let tableSearchQueries = {};
let tableCurrentPages = {};
let currentUserId = null;
