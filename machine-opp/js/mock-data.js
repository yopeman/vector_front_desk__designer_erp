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
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'machine', label: 'Machine', cls: 'font-mono text-xs' },
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
    ]
};

const moduleLabels = {
    'received-orders': 'Received Order',
    'rework': 'Rework Recording',
    'completed-orders': 'Completed Order',
    'machine-maintenance': 'Machine Maintenance Logs'
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
