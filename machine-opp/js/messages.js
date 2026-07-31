// =============================================
// MESSAGES MODULE
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

// =============================================
// INITIALIZE MESSAGES DATA
// =============================================
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
            createMsg('Yes, Transparent Glossy 4mm is correct', 'me', timeStr(h, m - 5))
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
// RENDER USER LIST
// =============================================
function renderUserList() {
    const container = document.getElementById('msg-user-list');
    if (!container) return;
    container.innerHTML = '';

    const searchVal = (document.getElementById('msg-user-search')?.value || '').toLowerCase();
    const filtered = messagesData.filter(u => u.name.toLowerCase().includes(searchVal));

    if (filtered.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center py-8 px-4 text-slate-500"><i class="fa-solid fa-user-slash text-2xl mb-3"></i><p class="text-xs">No contacts found</p></div>`;
        return;
    }

    filtered.forEach(user => {
        const lastMsg = user.messages[user.messages.length - 1];
        const lastText = lastMsg ? lastMsg.text : '';
        const lastTime = lastMsg ? lastMsg.time : '';
        const isSelected = selectedMsgUserId === user.id;
        const hasUnread = !isSelected && user.messages.some(m => m.sender === 'them');

        const item = document.createElement('div');
        item.className = `msg-user-item ${selectedMsgUserId === user.id ? 'active' : ''}`;
        item.onclick = () => openChat(user.id);
        item.innerHTML = `
            <div class="msg-user-avatar ${user.avatarColor}">
                ${user.avatarInitials}
                <span class="online-dot ${user.online ? 'online' : 'offline'}"></span>
            </div>
            <div class="msg-user-info">
                <div class="msg-user-name">${user.name}</div>
                <div class="msg-user-last">${lastText ? lastText.substring(0, 35) + (lastText.length > 35 ? '...' : '') : 'No messages'}</div>
            </div>
            <div class="msg-user-meta">
                <span class="msg-user-time">${lastTime}</span>
                ${hasUnread ? '<div class="msg-unread-dot"></div>' : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

function filterUsers() {
    renderUserList();
}

function clearUserSearch() {
    const input = document.getElementById('msg-user-search');
    if (input) input.value = '';
    renderUserList();
}

// =============================================
// CHAT FUNCTIONS
// =============================================
function openChat(userId) {
    const user = messagesData.find(u => u.id === userId);
    if (!user) return;
    selectedMsgUserId = userId;

    const chatContainer = document.getElementById('msg-chat-container');
    const emptyState = document.getElementById('msg-empty-state');
    if (chatContainer) { chatContainer.classList.add('open'); chatContainer.classList.remove('hidden-chat'); }
    if (emptyState) emptyState.classList.remove('active');

    const avatar = document.getElementById('msg-chat-avatar');
    const name = document.getElementById('msg-chat-name');
    const status = document.getElementById('msg-chat-status');

    if (avatar) {
        avatar.className = `msg-chat-avatar ${user.avatarColor}`;
        avatar.textContent = user.avatarInitials;
    }
    if (name) name.textContent = user.name;
    if (status) status.textContent = user.online ? 'Online' : 'Offline';

    renderChatMessages();
    renderUserList();

    setTimeout(() => {
        const chatBody = document.getElementById('msg-chat-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 10);
}

function renderChatMessages() {
    const user = messagesData.find(u => u.id === selectedMsgUserId);
    if (!user) return;

    const body = document.getElementById('msg-chat-body');
    if (!body) return;

    body.innerHTML = '';

    user.messages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`;
        bubble.innerHTML = `
            <div>${escapeHtml(msg.text)}</div>
            <div class="msg-time">${msg.time}</div>
        `;

        body.appendChild(bubble);
    });

    setTimeout(() => {
        body.scrollTop = body.scrollHeight;
    }, 10);
}

function sendMessage() {
    if (!selectedMsgUserId) return;
    const input = document.getElementById('msg-chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const user = messagesData.find(u => u.id === selectedMsgUserId);
    if (!user) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    user.messages.push(createMsg(text, 'me', time));
    input.value = '';
    renderChatMessages();
    renderUserList();

    setTimeout(() => {
        const chatBody = document.getElementById('msg-chat-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 10);

    // Simulate reply after 1.2 seconds
    setTimeout(() => {
        const now2 = new Date();
        const replyTime = `${String(now2.getHours()).padStart(2,'0')}:${String(now2.getMinutes()).padStart(2,'0')}`;
        const replies = [
            'Got it, thanks!',
            'I will check on that right away.',
            'Sounds good, let me know if there are any changes.',
            'Understood, proceeding with it.',
            'Will do, sending an update shortly.'
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        user.messages.push(createMsg(reply, 'them', replyTime));
        renderChatMessages();
        renderUserList();
        setTimeout(() => {
            const chatBody = document.getElementById('msg-chat-body');
            if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
        }, 10);
    }, 1200);
}

function closeChat() {
    selectedMsgUserId = null;
    const chatContainer = document.getElementById('msg-chat-container');
    const emptyState = document.getElementById('msg-empty-state');
    if (chatContainer) { chatContainer.classList.remove('open'); chatContainer.classList.add('hidden-chat'); }
    if (emptyState) emptyState.classList.add('active');
    renderUserList();
}

// =============================================
// MESSAGE DROPDOWN
// =============================================
function renderMsgDropdown() {
    const list = document.getElementById('msg-dropdown-list');
    const badge = document.getElementById('msg-badge');
    if (!list) return;
    
    const unread = messagesData.reduce((count, u) => {
        return count + u.messages.filter(m => m.sender === 'them' && !m.read).length;
    }, 0);
    
    if (badge) {
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : unread;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
    
    if (messagesData.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">No messages</div>';
        return;
    }
    
    list.innerHTML = messagesData.slice(0, 10).map(u => {
        const lastMsg = u.messages[u.messages.length - 1];
        const unreadCount = u.messages.filter(m => m.sender === 'them' && !m.read).length;
        return `
            <div class="msg-dropdown-item ${unreadCount > 0 ? 'unread' : ''}" onclick="openChat(${u.id})">
                <div class="msg-avatar ${u.avatarColor} text-white text-xs font-bold flex items-center justify-center">${u.avatarInitials}</div>
                <div class="msg-content">
                    <div class="msg-title">${u.name} ${unreadCount > 0 ? '<span class="text-blue-400 font-semibold">(' + unreadCount + ')</span>' : ''}</div>
                    <div class="msg-preview">${lastMsg ? lastMsg.text : ''}</div>
                    <div class="msg-time">${lastMsg ? lastMsg.time : ''}</div>
                </div>
            </div>
        `;
    }).join('');
}

function markAllMsgRead() {
    messagesData.forEach(u => {
        u.messages.forEach(m => {
            if (m.sender === 'them') m.read = true;
        });
    });
    renderMsgDropdown();
}
