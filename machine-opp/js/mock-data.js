// =============================================
// MOCK DATA MODULE
// Machine Operation ERP System - Sample Data
// =============================================

// =============================================
// RECEIVED ORDERS DATA
// =============================================
let ordersData = [];

// =============================================
// COMPLETED ORDERS DATA
// =============================================
let completedOrdersData = [
    {
        no: 1,
        date: '02/06/26',
        taskType: 'project',
        orderNum: '0001/09',
        title: 'uv print',
        machine: 'co2',
        material: 'Premium Acrylic',
        thickness: '4mm',
        color: 'Transparent Glossy',
        length: '600 mm',
        width: '400 mm',
        area: 240000,
        quality: 'Pass',
        status: 'Completed',
        completedAt: '2026-06-02T14:30:00.000Z'
    },
    {
        no: 2,
        date: '03/06/26',
        taskType: 'task',
        orderNum: '0003/09',
        title: 'Acrylic Signage',
        machine: 'cnc',
        material: 'Cast Acrylic',
        thickness: '6mm',
        color: 'White Glossy',
        length: '900 mm',
        width: '450 mm',
        area: 405000,
        quality: 'Pass',
        status: 'Completed',
        completedAt: '2026-06-03T16:45:00.000Z'
    },
    {
        no: 3,
        date: '04/06/26',
        taskType: 'task',
        orderNum: '0005/09',
        title: 'Fiber Cut Steel Bracket',
        machine: 'fiber-cut',
        material: 'Mild Steel',
        thickness: '8mm',
        color: 'Raw Metal',
        length: '500 mm',
        width: '300 mm',
        area: 150000,
        quality: 'Pass',
        status: 'Completed',
        completedAt: '2026-06-04T11:20:00.000Z'
    },
    {
        no: 4,
        date: '05/06/26',
        taskType: 'project',
        orderNum: '0006/09',
        title: 'Office Directory Sign',
        machine: 'uv',
        material: 'Premium Acrylic',
        thickness: '5mm',
        color: 'Frosted White',
        length: '1200 mm',
        width: '300 mm',
        area: 360000,
        quality: 'Pass',
        status: 'Completed',
        completedAt: '2026-06-05T09:15:00.000Z'
    },
    {
        no: 5,
        date: '06/06/26',
        taskType: 'project',
        orderNum: '0007/09',
        title: 'Brass Memorial Plaque',
        machine: 'fiber-mark',
        material: 'Brass',
        thickness: '3mm',
        color: 'Gold',
        length: '400 mm',
        width: '250 mm',
        area: 100000,
        quality: 'Pass',
        status: 'Completed',
        completedAt: '2026-06-06T13:00:00.000Z'
    }
];

// =============================================
// REWORK RECORDS DATA
// =============================================
let reworkData = [
    {
        id: 1,
        title: 'UV Print Color Calibration',
        date: '2026-06-03',
        material: 'Premium Acrylic',
        thickness: '4mm',
        color: 'Transparent Glossy',
        machine: 'uv',
        length: '600 mm',
        width: '400 mm',
        height: '12 mm',
        gram: '150 g',
        reason: 'Color mismatch on first print run - required recalibration of UV ink density',
        status: 'completed',
        startTime: '2026-06-03T09:15:00.000Z',
        endTime: '2026-06-03T10:30:00.000Z'
    },
    {
        id: 2,
        title: 'CNC Cut Precision Adjustment',
        date: '2026-06-04',
        material: 'Cast Acrylic',
        thickness: '6mm',
        color: 'White Glossy',
        machine: 'cnc',
        length: '900 mm',
        width: '450 mm',
        height: '15 mm',
        gram: '320 g',
        reason: 'Edge finish quality below standard - adjusted cutting speed and feed rate',
        status: 'completed',
        startTime: '2026-06-04T14:00:00.000Z',
        endTime: '2026-06-04T15:45:00.000Z'
    },
    {
        id: 3,
        title: 'Fiber Mark Font Alignment',
        date: '2026-06-05',
        material: 'Brass',
        thickness: '3mm',
        color: 'Gold',
        machine: 'fiber-mark',
        length: '400 mm',
        width: '250 mm',
        height: '3 mm',
        gram: '100 g',
        reason: 'Text alignment shifted on memorial plaque - recalibrated laser focus and position',
        status: 'in-progress',
        startTime: '2026-06-05T11:20:00.000Z',
        endTime: null
    }
];
let reworkIdCounter = 4;

// =============================================
// STORE REQUEST DATA
// =============================================
let localStoreItemsList = [
    {
        taskNum: '0001/09',
        title: 'UV Print Acrylic Sign',
        date: '2026-06-02',
        material: 'Acrylic',
        unit: 'Sheets',
        qty: '5',
        thickness: '4mm',
        color: 'Transparent Glossy',
        length: '600',
        width: '400',
        height: '12',
        gram: '150'
    },
    {
        taskNum: '0003/09',
        title: 'Acrylic Signage Project',
        date: '2026-06-03',
        material: 'Cast Acrylic',
        unit: 'Sheets',
        qty: '3',
        thickness: '6mm',
        color: 'White Glossy',
        length: '900',
        width: '450',
        height: '15',
        gram: '320'
    },
    {
        taskNum: '0005/09',
        title: 'Steel Bracket Cutting',
        date: '2026-06-04',
        material: 'Mild Steel',
        unit: 'Sheets',
        qty: '2',
        thickness: '8mm',
        color: 'Raw Metal',
        length: '500',
        width: '300',
        height: '8',
        gram: '950'
    }
];

// =============================================
// MACHINE CHECKLISTS DATA
// =============================================
let machineData = {};

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
        { key: 'title', label: 'Title', cls: '' },
        { key: 'designer', label: 'Designer', cls: 'text-xs' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'machine', label: 'Machine', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'completed-orders': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Order #', cls: 'font-mono' },
        { key: 'title', label: 'Title', cls: '' },
        { key: 'designer', label: 'Machine', cls: 'text-xs' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'machine', label: 'Equipment', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'rework': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'title', label: 'Rework Item', cls: '' },
        { key: 'material', label: 'Material', cls: 'text-xs' },
        { key: 'machine', label: 'Machine', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ],
    'store-request': [
        { key: 'no', label: 'No', cls: 'text-center w-16' },
        { key: 'date', label: 'Date', cls: '' },
        { key: 'orderNum', label: 'Task #', cls: 'font-mono' },
        { key: 'title', label: 'Item', cls: '' },
        { key: 'designer', label: 'Material', cls: 'text-xs' },
        { key: 'material', label: 'Spec', cls: 'text-xs' },
        { key: 'machine', label: 'Unit', cls: 'font-mono text-xs' },
        { key: 'status', label: 'Status', cls: '' }
    ]
};

const moduleLabels = {
    'received-orders': 'Received Orders',
    'completed-orders': 'Completed Orders',
    'rework': 'Rework Records',
    'store-request': 'Store Requests'
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