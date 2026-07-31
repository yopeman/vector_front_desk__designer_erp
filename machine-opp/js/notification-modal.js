// NotificationModal Component
// Renders the notification-modal HTML

class NotificationModal {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('notification-modal-container');
        if (container) {
            container.innerHTML = `<div id="notification-modal" class="modal-overlay" onclick="closeNotificationModal(event)">
                <div class="modal-container max-w-2xl" onclick="event.stopPropagation()">
                    <button onclick="closeNotificationModal()" class="modal-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-5">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                            <i class="fa-solid fa-bell text-white text-base"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white tracking-wide">Create Notification</h3>
                            <p class="text-xs text-slate-400">Send a new notification to the system</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                            <input type="text" id="notif-title" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow placeholder-slate-600" placeholder="Enter notification title">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                            <textarea id="notif-message" rows="4" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none" placeholder="Write notification message..."></textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                                <select id="notif-priority" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                                <select id="notif-category" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="system">System</option>
                                    <option value="order">Order</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="hr">HR</option>
                                    <option value="store">Store</option>
                                    <option value="general">General</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-700/50">
                        <button onclick="closeNotificationModal()" class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
                        <button onclick="saveNotification()" class="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 rounded-xl transition-all shadow-lg shadow-rose-500/15 flex items-center gap-1.5">
                            <i class="fa-solid fa-paper-plane text-[10px]"></i> Send Notification
                        </button>
                    </div>
                </div>
            </div>`;
        }
    }
}

// Initialize modal
document.addEventListener('DOMContentLoaded', () => {
    new NotificationModal();
});
