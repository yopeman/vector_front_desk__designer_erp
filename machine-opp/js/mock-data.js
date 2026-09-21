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
let reworkData = [];
let reworkIdCounter = 4;
window.reworkData = reworkData;
window.reworkIdCounter = reworkIdCounter;

// =============================================
// DELIVERY DATA
// =============================================
let deliveryData = [];
window.deliveryData = deliveryData;

// =============================================
// INSTALLATION DATA
// =============================================
let installationData = [];
window.installationData = installationData;

// =============================================
// INVENTORY DATA
// =============================================
let inventoryData = [];
window.inventoryData = inventoryData;

// =============================================
// STOCK MOVEMENT DATA
// =============================================
let stockMovementData = [];
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
        { key: 'order_date', label: 'Order Date', cls: '' },
        { key: 'job_no', label: 'Job Order #', cls: 'font-mono' },
        { key: 'required_date', label: 'Required Date', cls: '' },
        { key: 'priority', label: 'Priority', cls: 'text-xs' },
        { key: 'total_amount', label: 'Total Amount', cls: 'text-xs' },
        { key: 'paid_amount', label: 'Paid Amount', cls: 'text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'rework': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'created_at', label: 'Date', cls: '' },
        { key: 'task_type', label: 'Task Type', cls: '' },
        { key: 'machine_id', label: 'Machine', cls: 'text-xs' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'quality_status', label: 'Quality', cls: 'text-xs' },
        { key: 'priority', label: 'Priority', cls: 'text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'completed-orders': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'completed_at', label: 'Completed Date', cls: '' },
        { key: 'task_type', label: 'Task Type', cls: '' },
        { key: 'machine_id', label: 'Machine', cls: 'text-xs' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'quality_status', label: 'Quality', cls: 'text-xs' },
        { key: 'priority', label: 'Priority', cls: 'text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'machine-maintenance': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'performed_at', label: 'Date', cls: '' },
        { key: 'machine_id', label: 'Machine ID', cls: 'font-mono' },
        { key: 'checklist_id', label: 'Checklist', cls: '' },
        { key: 'performed_by', label: 'Performed By', cls: 'text-xs' },
        { key: 'status', label: 'Status', cls: 'text-xs' },
        { key: 'notes', label: 'Notes', cls: 'text-xs' },
        { key: 'created_at', label: 'Created', cls: 'font-mono text-xs' }
    ],
    'delivery': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'scheduled_date', label: 'Scheduled Date', cls: '' },
        { key: 'delivery_no', label: 'Delivery #', cls: 'font-mono' },
        { key: 'delivery_address', label: 'Address', cls: '' },
        { key: 'contact_person', label: 'Contact', cls: 'text-xs' },
        { key: 'vehicle_driver', label: 'Driver', cls: 'text-xs' },
        { key: 'actual_delivery_time', label: 'Delivered', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'installation': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'scheduled_date', label: 'Scheduled Date', cls: '' },
        { key: 'installation_no', label: 'Installation #', cls: 'font-mono' },
        { key: 'site_address', label: 'Site Address', cls: '' },
        { key: 'contact_person', label: 'Contact', cls: 'text-xs' },
        { key: 'team', label: 'Team', cls: 'text-xs' },
        { key: 'completion_time', label: 'Completed', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'inventory': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'created_at', label: 'Created', cls: '' },
        { key: 'id', label: 'Item ID', cls: 'font-mono' },
        { key: 'name', label: 'Item Name', cls: '' },
        { key: 'pcs', label: 'Pieces', cls: 'text-xs' },
        { key: 'kilo', label: 'Kilograms', cls: 'text-xs' },
        { key: 'meter', label: 'Meters', cls: 'font-mono text-xs' },
        { key: 'updated_at', label: 'Updated', cls: '' }
    ],
    'stock-movement': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'created_at', label: 'Date', cls: '' },
        { key: 'id', label: 'Movement ID', cls: 'font-mono' },
        { key: 'movement_type', label: 'Movement Type', cls: '' },
        { key: 'item_id', label: 'Item', cls: 'text-xs' },
        { key: 'quantity', label: 'Quantity', cls: 'text-xs' },
        { key: 'location', label: 'From/To', cls: 'font-mono text-xs' },
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
