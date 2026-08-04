// messages Section Component
// Renders the messages section HTML

class MessagesSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('messages-section-container');
        if (container) {
            container.innerHTML = `<div class="section-header">
                    <div>
                        <h2 class="section-title">
                            <i class="fa-solid fa-envelope"></i>
                            Message Center
                        </h2>
                        <p class="section-subtitle">Communicate with your team members in real time.</p>
                    </div>
                </div>

                <div class="messages-layout">
                    <div class="messages-sidebar">
                        <div class="sidebar-search">
                            <i class="fa-solid fa-magnifying-glass search-icon"></i>
                            <input type="text" id="msg-user-search" onkeyup="filterUsers()" placeholder="Search contacts..." class="search-input">
                            <button onclick="clearUserSearch()" class="search-clear">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div id="msg-user-list" class="user-list">
                        </div>
                    </div>

                    <div class="messages-chat-wrapper">
                        <div id="msg-empty-state" class="messages-empty">
                            <div class="empty-icon">
                                <i class="fa-solid fa-comment-dots"></i>
                            </div>
                            <p class="empty-title">Select a conversation</p>
                            <p class="empty-subtitle">Choose a contact from the list to start messaging</p>
                        </div>

                        <div class="messages-chat" id="msg-chat-container" style="display: none;">
                            <div class="chat-header">
                                <div id="msg-chat-avatar" class="chat-avatar"></div>
                                <div class="chat-user-info">
                                    <h3 id="msg-chat-name"></h3>
                                    <p id="msg-chat-status"></p>
                                </div>
                                <button onclick="closeChat()" class="chat-close-btn">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div id="msg-chat-body" class="chat-body"></div>
                            <div class="chat-footer">
                                <div class="chat-input-group">
                                    <input type="text" id="msg-chat-input" onkeydown="if(event.key==='Enter')sendMessage()" placeholder="Type a message..." class="chat-input">
                                    <button onclick="sendMessage()" class="send-btn">
                                        <i class="fa-solid fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new MessagesSection();
});
