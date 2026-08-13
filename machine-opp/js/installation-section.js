// Installation Section Component
// Renders the installation section HTML

class InstallationSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-installation');
        if (container) {
            container.innerHTML = `<div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight">Installations</h2>
                        <p class="text-sm text-slate-400">Manage installation operations and schedules.</p>
                    </div>
                    <button onclick="openInstallationModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center shadow-lg shadow-blue-600/10">
                        <i class="fa-solid fa-plus mr-2 text-sm"></i> New Installation
                    </button>
                </div>

                <!-- Filters -->
                <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div class="relative w-full md:w-96">
                        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                        <input type="text" id="installation-search" placeholder="Search installations..." class="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    </div>
                    <div class="flex gap-3">
                        <select id="installation-status-filter" class="bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                            <option value="All">All Status</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
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
                                    <th class="p-4">Installation No</th>
                                    <th class="p-4">Job No</th>
                                    <th class="p-4">Client</th>
                                    <th class="p-4">Contact Person</th>
                                    <th class="p-4">Scheduled Date</th>
                                    <th class="p-4">Status</th>
                                    <th class="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="installation-body" class="divide-y divide-slate-800 text-sm text-slate-300">
                                <tr class="hover:bg-slate-800/40 transition-colors">
                                    <td colspan="8" class="p-8 text-center text-slate-500">
                                        Loading installations...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Installation Create/Edit Modal -->
                <div id="installation-modal" class="modal-overlay" onclick="closeInstallationModal(event)">
                    <div class="modal-container max-w-2xl" onclick="event.stopPropagation()">
                        <button onclick="closeInstallationModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <h3 id="installation-modal-title" class="text-xl font-bold text-white mb-6">New Installation</h3>
                        
                        <form id="installation-form" onsubmit="saveInstallation(event)">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Order *</label>
                                    <select id="installation-job-order" required class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                        <option value="">Select Job Order</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Installation No</label>
                                    <input type="text" id="installation-no" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Site Address</label>
                                    <input type="text" id="installation-site-address" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Person</label>
                                        <input type="text" id="installation-contact-person" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Phone</label>
                                        <input type="text" id="installation-contact-phone" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Items Installed</label>
                                    <textarea id="installation-items-installed" rows="3" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"></textarea>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team</label>
                                        <input type="text" id="installation-team" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Lead</label>
                                        <input type="text" id="installation-team-lead" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Date</label>
                                        <input type="date" id="installation-scheduled-date" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Scheduled Time</label>
                                        <input type="time" id="installation-scheduled-time" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Completion Time</label>
                                    <input type="date" id="installation-completion-time" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                                    <select id="installation-status" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Signed Off By</label>
                                    <input type="text" id="installation-signed-off-by" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Note</label>
                                    <textarea id="installation-note" rows="3" class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none" placeholder="Add any additional notes..."></textarea>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attached Files</label>
                                    <div class="border-2 border-dashed border-slate-700 rounded-xl p-4">
                                        <input type="file" id="installation-files" multiple class="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20">
                                        <div id="installation-existing-files" class="mt-3 space-y-2"></div>
                                        <div id="installation-new-files" class="mt-3 space-y-2"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-end gap-3 mt-6">
                                <button type="button" onclick="closeInstallationModal()" class="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700/50 transition-all">Cancel</button>
                                <button type="submit" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all">
                                    <i class="fa-solid fa-check mr-2"></i><span id="installation-submit-btn">Create</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Installation Details Modal -->
                <div id="installation-detail-modal" class="modal-overlay" onclick="closeInstallationDetailModal(event)">
                    <div class="modal-container max-w-3xl" onclick="event.stopPropagation()">
                        <button onclick="closeInstallationDetailModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <h3 class="text-xl font-bold text-white mb-6">Installation Details</h3>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Installation No</label>
                                <input type="text" id="detail-installation-no" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
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
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Site Address</label>
                                <input type="text" id="detail-site-address" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
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
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Items Installed</label>
                                <textarea id="detail-items-installed" rows="3" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none resize-none"></textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team</label>
                                <input type="text" id="detail-team" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Team Lead</label>
                                <input type="text" id="detail-team-lead" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Completion Time</label>
                                <input type="text" id="detail-completion-time" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Signed Off By</label>
                                <input type="text" id="detail-signed-off-by" readonly class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none">
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
    new InstallationSection();
    // Fetch and render installations from Supabase
    if (typeof initInstallations === 'function') {
        initInstallations();
    }
});
