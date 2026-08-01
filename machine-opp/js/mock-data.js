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

function initMessagesData() {
    const now = new Date();
    const timeStr = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const h = now.getHours();
    const m = now.getMinutes(); 

    messagesData = [
        createMsgUser('Abeba', 'AB', true, [
            createMsg('Hey, the uv print job is ready for review', 'them', timeStr(h, m - 12)),
            createMsg('Great, I will check it now', 'me', timeStr(h, m - 10)),
            createMsg('Please confirm the color settings before printing', 'them', timeStr(h, m - 8)),
            createMsg('Yes,Transparent Glossy 4mm is correct', 'me', timeStr(h, m - 5))
        ]),
        createMsgUser('Tigist', 'TG', true, [
            createMsg('The cnc machine needs calibration after the shift', 'them', timeStr(h, m - 20)),
            createMsg('I will handle that before the next job', 'me', timeStr(h, m - 18)),
        ]),
        createMsgUser('Biruk', 'BR', false, [
            createMsg('Metal nameplate order is ready for delivery', 'them', timeStr(h, m - 45)),
            createMsg('Thanks, I will update the status', 'me', timeStr(h, m - 40)),
        ]),
        createMsgUser('Meron', 'ME', true, [
            createMsg('The fiber cut steel bracket passed QA', 'them', timeStr(h, m - 60)),
            createMsg('Excellent! Moving to the next phase', 'me', timeStr(h, m - 55)),
            createMsg('Client needs the dimensions confirmed', 'them', timeStr(h, m - 50)),
            createMsg('Length 500mm, width 300mm, height 8mm confirmed', 'me', timeStr(h, m - 48)),
        ]),
        createMsgUser('Operations Supervisor', 'OS', true, [
            createMsg('Please ensure all checklists are completed before switching shifts', 'them', timeStr(h, m - 90)),
            createMsg('Noted, I will make sure everything is in order', 'me', timeStr(h, m - 85)),
        ]),
        createMsgUser('Addis', 'AD', false, [
            createMsg('The store request for brass sheets has been approved', 'them', timeStr(h, m - 120)),
        ]),
    ];
}

// =============================================
// NOTIFICATIONS DATA
// =============================================
let notificationsData = [];
let notifIdCounter = 1;

function initNotificationsData() {
    const now = new Date();
    const timeStr = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const h = now.getHours();
    const m = now.getMinutes();

    notificationsData = [
        {
            id: notifIdCounter++,
            title: 'System Update Complete',
            message: 'The ERP system has been updated to version 2.0. All modules are now available.',
            priority: 'normal',
            category: 'system',
            read: false,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 30)}`
        },
        {
            id: notifIdCounter++,
            title: 'Urgent: CNC Maintenance Required',
            message: 'CNC Machine #01 has exceeded 500 operating hours. Schedule maintenance immediately.',
            priority: 'high',
            category: 'maintenance',
            read: false,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 60)}`
        },
        {
            id: notifIdCounter++,
            title: 'New Order Received',
            message: 'Order #0006/09 has been received from Abeba. UV print job for acrylic signage.',
            priority: 'normal',
            category: 'order',
            read: false,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 120)}`
        },
        {
            id: notifIdCounter++,
            title: 'Store Request Approved',
            message: 'The store request for brass sheets (Order #0004/09) has been approved and dispatched.',
            priority: 'low',
            category: 'store',
            read: true,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 180)}`
        },
        {
            id: notifIdCounter++,
            title: 'HR: Leave Request Update',
            message: 'Your leave request has been processed and approved by the HR department.',
            priority: 'normal',
            category: 'hr',
            read: true,
            createdAt: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr(h, m - 240)}`
        }
    ];
}

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
