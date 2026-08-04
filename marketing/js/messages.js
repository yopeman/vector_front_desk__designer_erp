// =============================================
// MESSAGES MODULE - MARKETING ERP
// =============================================

// Global state
const MarketingMessages = {
    data: [],
    selectedUserId: null,
    currentUserId: null,
    users: [],
    channel: null
};

// =============================================
// INITIALIZE MESSAGES DATA
// =============================================
async function initMessagesData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error('No authenticated user found');
            return;
        }
        MarketingMessages.currentUserId = user.id;
        await fetchUsers();
    } catch (error) {
        console.error('Error initializing messages:', error);
    }
}

// =============================================
// FETCH USERS FROM SUPABASE
// =============================================
async function fetchUsers() {
    try {
        const { data, error } = await window.supabase
            .from('users')
            .select('id, username, email')
            .neq('id', MarketingMessages.currentUserId)
            .order('username', { ascending: true });

        if (error) {
            if (error.code === '42P01') {
                console.warn('Users table does not exist yet');
                MarketingMessages.users = [];
                renderUserList();
                return;
            }
            throw error;
        }

        MarketingMessages.users = data || [];
        MarketingMessages.data = MarketingMessages.users.map(user => ({
            id: user.id,
            name: user.username,
            avatarInitials: (user.username || '?').substring(0, 2).toUpperCase(),
            online: true,
            avatarColor: getAvatarColorForUser(user.id),
            messages: []
        }));

        renderUserList();
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

function getAvatarColorForUser(userId) {
    const colors = [
        'bg-blue', 'bg-emerald', 'bg-amber', 'bg-rose',
        'bg-purple', 'bg-cyan', 'bg-indigo', 'bg-pink'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

// =============================================
// FETCH MESSAGES FROM SUPABASE
// =============================================
async function fetchMessages(otherUserId) {
    try {
        const { data, error } = await window.supabase
            .from('messages')
            .select('*, sender:users!messages_sender_id_fkey(username, email), receiver:users!messages_receiver_id_fkey(username, email)')
            .or(`and(sender_id.eq.${MarketingMessages.currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${MarketingMessages.currentUserId})`)
            .order('sent_at', { ascending: true });

        if (error) throw error;

        const userIndex = MarketingMessages.data.findIndex(u => u.id === otherUserId);
        if (userIndex !== -1) {
            MarketingMessages.data[userIndex].messages = (data || []).map(msg => ({
                id: msg.id,
                text: msg.text,
                sender: msg.sender_id === MarketingMessages.currentUserId ? 'me' : 'them',
                time: formatMessageTime(msg.sent_at || msg.created_at),
                attached_file_ids: msg.attached_file_ids || [],
                senderData: msg.sender,
                receiverData: msg.receiver
            }));
        }

        renderChatMessages();
        renderUserList();
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
}

// =============================================
// SETUP REALTIME SUBSCRIPTION
// =============================================
function setupMessagesSubscription(otherUserId) {
    if (MarketingMessages.channel) {
        window.supabase.removeChannel(MarketingMessages.channel);
    }

    MarketingMessages.channel = window.supabase
        .channel('messages-channel')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `or(and(sender_id.eq.${MarketingMessages.currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${MarketingMessages.currentUserId}))`
            },
            async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const userIndex = MarketingMessages.data.findIndex(u => u.id === payload.new.sender_id || u.id === payload.new.receiver_id);
                    if (userIndex !== -1) {
                        MarketingMessages.data[userIndex].messages.push({
                            id: payload.new.id,
                            text: payload.new.text,
                            sender: payload.new.sender_id === MarketingMessages.currentUserId ? 'me' : 'them',
                            time: formatMessageTime(payload.new.sent_at || payload.new.created_at),
                            attached_file_ids: payload.new.attached_file_ids || [],
                            senderData: payload.new.sender,
                            receiverData: payload.new.receiver
                        });
                    }
                    if (payload.new.sender_id !== MarketingMessages.currentUserId) {
                        showNotification('New Message', 'You have a new message');
                    }
                }
            }
        )
        .subscribe();
}

// =============================================
// RENDER USER LIST
// =============================================
function renderUserList() {
    const container = document.getElementById('msg-user-list');
    if (!container) return;
    container.innerHTML = '';

    const searchVal = (document.getElementById('msg-user-search')?.value || '').toLowerCase();
    let filtered = MarketingMessages.data.filter(u => u.name.toLowerCase().includes(searchVal));

    if (filtered.length === 0) {
        container.innerHTML = `<div class="dropdown-empty">No contacts found</div>`;
        return;
    }

    MarketingMessages.data.forEach(user => {
        const lastMsg = user.messages[user.messages.length - 1];
        const lastText = lastMsg ? lastMsg.text : '';
        const lastTime = lastMsg ? lastMsg.time : '';
        const isSelected = MarketingMessages.selectedUserId === user.id;
        const hasUnread = !isSelected && user.messages.some(m => m.sender === 'them');

        const item = document.createElement('div');
        item.className = `msg-user-item ${isSelected ? 'active' : ''}`;
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
async function openChat(userId) {
    const user = MarketingMessages.data.find(u => u.id === userId);
    if (!user) return;
    MarketingMessages.selectedUserId = userId;

    const chatContainer = document.getElementById('msg-chat-container');
    const emptyState = document.getElementById('msg-empty-state');
    if (chatContainer) chatContainer.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';

    const avatar = document.getElementById('msg-chat-avatar');
    const name = document.getElementById('msg-chat-name');
    const status = document.getElementById('msg-chat-status');

    if (avatar) {
        avatar.className = `msg-chat-avatar ${user.avatarColor}`;
        avatar.textContent = user.avatarInitials;
    }
    if (name) name.textContent = user.name;
    if (status) status.textContent = user.online ? 'Online' : 'Offline';

    await fetchMessages(userId);
    setupMessagesSubscription(userId);
    renderUserList();

    setTimeout(() => {
        const chatBody = document.getElementById('msg-chat-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 10);
}

function renderChatMessages() {
    const user = MarketingMessages.data.find(u => u.id === MarketingMessages.selectedUserId);
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

async function sendMessage() {
    if (!MarketingMessages.selectedUserId) return;
    const input = document.getElementById('msg-chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    try {
        const { error } = await window.supabase
            .from('messages')
            .insert({
                sender_id: MarketingMessages.currentUserId,
                receiver_id: MarketingMessages.selectedUserId,
                text: text,
                sent_at: new Date().toISOString(),
            });

        if (error) throw error;

        input.value = '';
        await fetchMessages(MarketingMessages.selectedUserId);

        setTimeout(() => {
            const chatBody = document.getElementById('msg-chat-body');
            if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
        }, 10);
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message: ' + error.message);
    }
}

function closeChat() {
    MarketingMessages.selectedUserId = null;
    const chatContainer = document.getElementById('msg-chat-container');
    const emptyState = document.getElementById('msg-empty-state');
    if (chatContainer) chatContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';

    if (MarketingMessages.channel) {
        window.supabase.removeChannel(MarketingMessages.channel);
        MarketingMessages.channel = null;
    }

    renderUserList();
}

// =============================================
// MESSAGE DROPDOWN
// =============================================
async function renderMsgDropdown() {
    const list = document.getElementById('msg-dropdown-list');
    const badge = document.getElementById('msg-badge');
    if (!list) return;
    
    try {
        const { data, error } = await window.supabase
            .from('messages')
            .select('*, sender:users!messages_sender_id_fkey(username), receiver:users!messages_receiver_id_fkey(username)')
            .eq('receiver_id', MarketingMessages.currentUserId)
            .eq('is_read', false)
            .order('sent_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const unread = data || [];
        
        if (badge) {
            if (unread.length > 0) {
                badge.textContent = unread.length > 99 ? '99+' : unread.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        
        if (unread.length === 0) {
            list.innerHTML = '<div class="dropdown-empty">No messages</div>';
            return;
        }
        
        list.innerHTML = unread.map(msg => {
            const senderName = msg.sender?.username || 'Unknown';
            const senderInitials = senderName.substring(0, 2).toUpperCase();
            const senderColor = getAvatarColorForUser(msg.sender_id);
            return `
                <div class="msg-dropdown-item unread" onclick="openChat('${msg.sender_id}')">
                    <div class="msg-avatar ${senderColor}">${senderInitials}</div>
                    <div class="msg-content">
                        <div class="msg-title">${senderName}</div>
                        <div class="msg-preview">${msg.text || ''}</div>
                        <div class="msg-time">${formatMessageTime(msg.sent_at || msg.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering message dropdown:', error);
    }
}

async function markAllMsgRead() {
    try {
        const { error } = await window.supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);

        if (error) throw error;
        renderMsgDropdown();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Helper function to show notifications
function showNotification(title, message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expose functions to global scope for onclick handlers
window.filterUsers = filterUsers;
window.clearUserSearch = clearUserSearch;
window.openChat = openChat;
window.closeChat = closeChat;
window.sendMessage = sendMessage;
