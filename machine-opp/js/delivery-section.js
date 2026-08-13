// Delivery Section Component
// Renders the delivery section HTML

class DeliverySection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-delivery');
        if (container) {
            container.innerHTML = `<div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight">Deliveries</h2>
                        <p class="text-sm text-slate-400">Manage delivery operations and schedules.</p>
                    </div>
                    <button onclick="openDeliveryModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center shadow-lg shadow-blue-600/10">
                        <i class="fa-solid fa-plus mr-2 text-sm"></i> New Delivery
                    </button>
                </div>

                <!-- Filters -->
                <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="relative w-full md:w-96">
                        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                        <input type="text" id="delivery-search" placeholder="Search deliveries..." class="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    </div>
                    <div class="flex gap-3">
                        <select id="delivery-status-filter" class="bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Delayed">Delayed</option>
                        </select>
                    </div>
                </div>

                <!-- Table Content Wrapper -->
                <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    <th class="p-4 text-center w-16">#</th>
                                    <th class="p-4">Delivery No</th>
                                    <th class="p-4">Job No</th>
                                    <th class="p-4">Client</th>
                                    <th class="p-4">Contact Person</th>
                                    <th class="p-4">Scheduled Date</th>
                                    <th class="p-4">Status</th>
                                    <th class="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="delivery-body" class="divide-y divide-slate-800 text-sm text-slate-300">
                                <tr class="hover:bg-slate-800/40 transition-colors">
                                    <td colspan="8" class="p-8 text-center text-slate-500">
                                        Loading deliveries...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Delivery Create/Edit Modal -->
                <div id="delivery-modal" class="modal-overlay" onclick="closeDeliveryModal(event)">
                    <div class="modal-container max-w-2xl" onclick="event.stopPropagation()">
                        <button onclick="closeDeliveryModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <h3 id="delivery-modal-title" class="text-xl font-bold text-white mb-6">New Delivery</h3>
                        
                        <form id="delivery-form" onsubmit="saveDelivery(event)">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Order *</label>
                                    <select id="delivery-job-order" required class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                        <option value="">Select Job Order</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Delivery No</label>
                                    <input type="text" id="delivery-no" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Delivery Address</label>
                                    <input type="text" id="delivery-address" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Person</label>
                                        <input type="text" id="delivery-contact-person" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Phone</label>
                                        <input type="text" id="delivery-contact-phone" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Items</label>
                                    <textarea id="delivery-items" rows="3" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"></textarea>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vehicle Driver</label>
                                    <input type="text" id="delivery-vehicle-driver" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Date</label>
                                        <input type="date" id="delivery-scheduled-date" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Time</label>
                                        <input type="time" id="delivery-scheduled-time" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Actual Delivery Time</label>
                                    <input type="date" id="delivery-actual-time" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                    <select id="delivery-status" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                        <option value="Pending">Pending</option>
                                        <option value="In Transit">In Transit</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Delayed">Delayed</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Received By</label>
                                    <input type="text" id="delivery-received-by" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Note</label>
                                    <textarea id="delivery-note" rows="3" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none" placeholder="Add any additional notes..."></textarea>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attached Files</label>
                                    <div class="border-2 border-dashed border-slate-700 rounded-xl p-4">
                                        <input type="file" id="delivery-files" multiple class="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20">
                                        <div id="delivery-existing-files" class="mt-3 space-y-2"></div>
                                        <div id="delivery-new-files" class="mt-3 space-y-2"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end gap-3 mt-6">
                                <button type="button" onclick="closeDeliveryModal()" class="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700/50 transition-all">Cancel</button>
                                <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all">
                                    <i class="fa-solid fa-check mr-2"></i><span id="delivery-submit-btn">Create</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Delivery Details Modal -->
                <div id="delivery-detail-modal" class="modal-overlay" onclick="closeDeliveryDetailModal(event)">
                    <div class="modal-container max-w-3xl" onclick="event.stopPropagation()">
                        <button onclick="closeDeliveryDetailModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <h3 class="text-xl font-bold text-white mb-6">Delivery Details</h3>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Delivery No</label>
                                <input type="text" id="detail-delivery-no" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job No</label>
                                <input type="text" id="detail-job-no" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client</label>
                                <input type="text" id="detail-client" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                <input type="text" id="detail-status" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Date</label>
                                <input type="text" id="detail-scheduled-date" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Time</label>
                                <input type="text" id="detail-scheduled-time" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Delivery Address</label>
                                <input type="text" id="detail-delivery-address" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Person</label>
                                <input type="text" id="detail-contact-person" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Phone</label>
                                <input type="text" id="detail-contact-phone" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Items</label>
                                <textarea id="detail-items" rows="3" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none resize-none"></textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vehicle Driver</label>
                                <input type="text" id="detail-vehicle-driver" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Received By</label>
                                <input type="text" id="detail-received-by" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Note</label>
                                <textarea id="detail-note" rows="3" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none resize-none"></textarea>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attached Files</label>
                                <div id="detail-attached-files-list" class="space-y-2">
                                    <div class="text-xs text-slate-500">No attached files</div>
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
    new DeliverySection();
    // Fetch and render deliveries from Supabase
    if (typeof initDeliveries === 'function') {
        initDeliveries();
    }
});
