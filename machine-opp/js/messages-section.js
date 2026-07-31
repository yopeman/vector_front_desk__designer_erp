// messages Section Component
// Renders the messages section HTML

class MessagesSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-messages');
        if (container) {
            container.innerHTML = `<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-envelope text-blue-400"></i>
                            Message Center
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">Communicate with your team members in real time.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4" style="min-height: calc(100vh - 280px);">
                    <div class="lg:col-span-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
                        <div class="p-4 border-b border-slate-700/40">
                            <div class="relative">
                                <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-sm"></i>
                                <input type="text" id="msg-user-search" onkeyup="filterUsers()" placeholder="Search contacts..." class="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 input-glow">
                                <button onclick="clearUserSearch()" class="search-clear absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                    <i class="fa-solid fa-xmark text-xs"></i>
                                </button>
                            </div>
                        </div>
                        <div id="msg-user-list" class="flex-1 overflow-y-auto p-2 space-y-1">
                        </div>
                    </div>

                    <div class="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden" id="msg-chat-container">
                        <div class="p-4 border-b border-slate-700/40 flex items-center gap-3">
                            <div id="msg-chat-avatar" class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"></div>
                            <div class="min-w-0 flex-1">
                                <h3 id="msg-chat-name" class="text-sm font-semibold text-white truncate"></h3>
                                <p id="msg-chat-status" class="text-[10px] text-slate-400"></p>
                            </div>
                            <button onclick="closeChat()" class="w-8 h-8 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all flex items-center justify-center lg:hidden">
                                <i class="fa-solid fa-xmark text-xs"></i>
                            </button>
                        </div>
                        <div id="msg-chat-body" class="flex-1 overflow-y-auto p-4 space-y-4"></div>
                        <div class="p-4 border-t border-slate-700/40">
                            <div class="flex items-center gap-3">
                                <input type="text" id="msg-chat-input" onkeydown="if(event.key==='Enter')sendMessage()" placeholder="Type a message..." class="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 input-glow">
                                <button onclick="sendMessage()" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-600/20 shrink-0">
                                    <i class="fa-solid fa-paper-plane text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="msg-empty-state" class="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col items-center justify-center p-10">
                        <div class="w-16 h-16 rounded-full bg-slate-900/80 flex items-center justify-center mb-4">
                            <i class="fa-solid fa-comment-dots text-2xl text-slate-500"></i>
                        </div>
                        <p class="text-slate-400 font-medium">Select a conversation</p>
                        <p class="text-xs text-slate-500 mt-1">Choose a contact from the list to start messaging</p>
                    </div>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new MessagesSection();
});
