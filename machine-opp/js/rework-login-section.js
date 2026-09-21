// rework-login Section Component
// Renders the rework-login section HTML

class ReworkloginSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('content-rework-login');
        if (container) {
            container.innerHTML = `<!-- Header with stats summary -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-arrows-rotate text-amber-400"></i>
                            Rework Recording
                        </h2>
                        <p class="text-sm text-slate-400 mt-1">
                            Track and manage rework jobs.
                            <span class="text-slate-500">(የስራ እንደገና ማስተካከያ ምዝገባ)</span>
                        </p>
                    </div>
                    <button onclick="openNewReworkModal()" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-amber-500/15 flex items-center gap-2">
                        <i class="fa-solid fa-plus text-xs"></i> New Rework
                    </button>
                </div>

                <!-- ===== Stats Summary Cards ===== -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6" id="rework-stats-container">
                    <div class="stat-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-clipboard-list text-blue-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                            <p class="text-2xl font-bold text-white mt-0.5" id="rework-stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-spinner text-amber-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
                            <p class="text-2xl font-bold text-amber-400 mt-0.5" id="rework-stats-progress">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-check-circle text-emerald-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
                            <p class="text-2xl font-bold text-emerald-400 mt-0.5" id="rework-stats-completed">0</p>
                        </div>
                    </div>
                    <div class="stat-card bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-clock text-purple-400 text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Time</p>
                            <p class="text-2xl font-bold text-purple-400 mt-0.5" id="rework-stats-avgtime">0m</p>
                        </div>
                    </div>
                </div>

                <!-- Search/Filter Header -->
                <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-center justify-between mt-6">
                    <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <!-- Search input -->
                        <div class="relative w-full md:w-80">
                            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-sm"></i>
                            <input type="text" id="rework-search" onkeyup="filterReworkRecords()" placeholder="Search rework records..." 
                                   class="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 input-glow">
                            <button id="rework-search-clear" onclick="clearReworkSearch()" class="search-clear absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                                <i class="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>
                        <!-- Priority Dropdown -->
                        <div class="relative w-full md:w-44">
                            <select id="rework-priority-filter" onchange="filterReworkRecords()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all" class="text-slate-300">All Priorities</option>
                                <option value="urgent" class="text-rose-400 font-bold">Urgent Only</option>
                                <option value="normal" class="text-slate-300 font-medium">Normal Only</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <!-- Machine Dropdown -->
                        <div class="relative w-full md:w-44">
                            <select id="rework-machine-filter" onchange="filterReworkRecords()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all" class="text-slate-300">All Machines</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <!-- Status Dropdown -->
                        <div class="relative w-full md:w-44">
                            <select id="rework-status-filter" onchange="filterReworkRecords()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
                                <option value="all" class="text-slate-300">All Status</option>
                                <option value="new">New</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <i class="fa-solid fa-chevron-down absolute right-3 top-3.5 text-slate-500 pointer-events-none text-[10px]"></i>
                        </div>
                        <!-- Filter results count -->
                        <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-700/50">
                            <i class="fa-solid fa-filter"></i>
                            <span>Showing: <strong id="rework-filter-count" class="text-slate-300 font-semibold">0</strong></span>
                        </div>
                    </div>
                    <button onclick="resetReworkFilters()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/30">
                        <i class="fa-solid fa-rotate-left"></i> Reset
                    </button>
                </div>

                <!-- Table Content -->
                <div class="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl mt-6">
                    <div class="table-wrapper">
                        <table class="orders-table w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr class="bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    <th class="p-4 text-center w-16">
                                        <span class="flex items-center justify-center gap-1">
                                            <i class="fa-solid fa-hashtag text-[10px] text-slate-500"></i>
                                            No
                                        </span>
                                    </th>
                                    <th class="p-4">
                                        <span class="flex items-center gap-1.5">
                                            <i class="fa-regular fa-calendar text-[10px] text-slate-500"></i>
                                            Date
                                        </span>
                                    </th>
                                    <th class="p-4">Task Type</th>
                                    <th class="p-4">Job Order</th>
                                    <th class="p-4">Material</th>
                                    <th class="p-4">Thickness</th>
                                    <th class="p-4">Color</th>
                                    <th class="p-4">Machine</th>
                                    <th class="p-4">Status</th>
                                    <th class="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800 text-sm text-slate-300" id="rework-records-body">
                                <!-- Rows will be dynamically rendered by JavaScript -->
                            </tbody>
                        </table>
                    </div>

                    <!-- No results state -->
                    <div id="rework-no-results" class="hidden flex flex-col items-center justify-center py-16 px-4">
                        <div class="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
                            <i class="fa-solid fa-search-minus text-2xl text-slate-500"></i>
                        </div>
                        <p class="text-slate-400 font-medium">No rework records match your search</p>
                        <p class="text-xs text-slate-500 mt-1">Try adjusting your search or filter settings</p>
                        <button onclick="resetReworkFilters()" class="mt-4 text-xs bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-amber-500/20">
                            <i class="fa-solid fa-rotate-left mr-1.5"></i> Reset
                        </button>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- NEW REWORK MODAL OVERLAY                                     -->
                <!-- ============================================================ -->
                <div id="new-rework-modal" class="modal-overlay" onclick="closeNewReworkModal(event)">
                    <div class="modal-container max-w-3xl" onclick="event.stopPropagation()">
                        <button onclick="closeNewReworkModal()" class="modal-close-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>

                        <!-- Modal header -->
                        <div class="flex items-center gap-3 border-b border-slate-700/60 pb-4 mb-6">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                                <i class="fa-solid fa-plus text-white text-base"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white tracking-wide">New Rework Entry</h3>
                                <p class="text-xs text-slate-400">Log a new rework request with details</p>
                            </div>
                        </div>

                        <!-- Form -->
                        <form onsubmit="event.preventDefault(); addReworkEntry();" class="space-y-5">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-list-check text-slate-500 text-[10px]"></i> Task Type
                                    </label>
                                    <select id="rework-task-type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow cursor-pointer">
                                        <option value="">Select Type</option>
                                        <option value="project">Project</option>
                                        <option value="task">Task</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-cubes text-slate-500 text-[10px]"></i> Material Type
                                    </label>
                                    <input type="text" id="rework-material" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. Acrylic, Metal">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-ruler-vertical text-slate-500 text-[10px]"></i> Thickness
                                    </label>
                                    <input type="text" id="rework-thickness" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. 5mm">
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-palette text-slate-500 text-[10px]"></i> Color
                                    </label>
                                    <input type="text" id="rework-color" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow" placeholder="e.g. Black, Clear">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-microchip text-slate-500 text-[10px]"></i> Machine Type
                                    </label>
                                    <select id="rework-machine" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow cursor-pointer">
                                        <option value="">Loading machines...</option>
                                    </select>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <i class="fa-solid fa-barcode text-slate-500 text-[10px]"></i> Job Order
                                    </label>
                                    <select id="rework-job-order" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 input-glow cursor-pointer">
                                        <option value="">Loading job orders...</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Size Layout Sub-grid -->
                            <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40 space-y-3">
                                <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <i class="fa-solid fa-ruler-combined text-blue-400 text-[10px]"></i>
                                    </span>
                                    Dimensions (Size Layout Spec)
                                </span>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Length</label>
                                        <input type="text" id="rework-length" placeholder="Length" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Width</label>
                                        <input type="text" id="rework-width" placeholder="Width" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Height</label>
                                        <input type="text" id="rework-height" placeholder="Height" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                    </div>
                                    <div>
                                        <label class="block text-[11px] text-slate-400 mb-1">Gram</label>
                                        <input type="text" id="rework-gram" placeholder="Gram" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 input-glow">
                                    </div>
                                </div>
                            </div>

                            <!-- Attachments Section -->
                            <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                                <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <i class="fa-solid fa-paperclip text-purple-400 text-[10px]"></i>
                                    </span>
                                    Attached Files
                                </span>
                                <div class="flex items-center gap-2">
                                    <input type="file" id="rework-file-input" multiple class="hidden" onchange="handleAttachedFiles(this, 'rework-attached-files-list')">
                                    <button type="button" onclick="document.getElementById('rework-file-input').click()" class="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs py-2 px-3 rounded-lg transition-all flex items-center gap-2">
                                        <i class="fa-solid fa-upload"></i> Upload Files
                                    </button>
                                    <span id="rework-file-count" class="text-xs text-slate-500">0 files selected</span>
                                </div>
                                <div id="rework-attached-files-list" class="space-y-2">
                                    <div class="text-xs text-slate-500">No attached files</div>
                                </div>
                            </div>

                            <!-- Note Section -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-note-sticky text-slate-500 text-[10px]"></i> Notes
                                </label>
                                <textarea id="rework-note" rows="3" placeholder="Add additional notes..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none"></textarea>
                            </div>

                            <!-- Rework Reason text area -->
                            <div>
                                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <i class="fa-solid fa-comment-dots text-slate-500 text-[10px]"></i> Rework Reason
                                </label>
                                <textarea id="rework-reason" rows="3" placeholder="Enter detailed reason for rework..." class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 resize-none"></textarea>
                            </div>

                            <!-- Status Timeline -->
                            <div id="rework-status-timeline" class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                                <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <i class="fa-solid fa-circle-notch text-emerald-400 text-[10px]"></i>
                                    </span>
                                    Status Timeline
                                </span>

                                <!-- Timeline visualization -->
                                <div class="space-y-1 mb-3">
                                    <div class="timeline-step active">
                                        <span class="dot"></span>
                                        <p class="text-xs text-slate-400">Order Received</p>
                                    </div>
                                    <div class="timeline-step" id="rework-step-in-progress">
                                        <span class="dot active"></span>
                                        <p class="text-xs text-slate-500" id="rework-step-progress-text">In Progress</p>
                                    </div>
                                    <div class="timeline-step" id="rework-step-completed">
                                        <span class="dot"></span>
                                        <p class="text-xs text-slate-500" id="rework-step-completed-text">Completed</p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <button type="button" onclick="logReworkStatusTime('start')" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-2 rounded-lg text-xs transition-all text-center tracking-wide shadow-md uppercase flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-play text-[10px]"></i> Start
                                        </button>
                                        <div id="rework-start-time" class="text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg">recorded start time</div>
                                    </div>
                                    <div class="space-y-2">
                                        <button type="button" onclick="logReworkStatusTime('end')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-2 rounded-lg text-xs transition-all text-center tracking-wide shadow-md uppercase flex items-center justify-center gap-1.5">
                                            <i class="fa-solid fa-stop text-[10px]"></i> End
                                        </button>
                                        <div id="rework-end-time" class="text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg">recorded end time</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <div class="flex justify-end pt-2">
                                <button type="submit" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-amber-500/15 flex items-center gap-2">
                                    <i class="fa-solid fa-check text-xs"></i> Request Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
        }
    }
}

// Handle attached files
async function handleAttachedFiles(input, listId) {
    const files = input.files;
    const listElement = document.getElementById(listId);
    const countElement = document.getElementById(input.id.replace('-input', '-count'));
    
    if (files.length > 0) {
        listElement.innerHTML = '';
        const uploadedFileIds = [];
        
        for (const file of files) {
            // Upload file to storage
            const fileData = await uploadFile(file);
            
            if (fileData && fileData.id) {
                uploadedFileIds.push(fileData.id);
            }
            
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2';
            
            if (fileData && fileData.url) {
                fileItem.innerHTML = `
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-file text-purple-400 text-xs"></i>
                        <a href="${fileData.url}" target="_blank" class="text-xs text-slate-300 hover:text-blue-400 truncate max-w-[200px] transition-colors">${file.name}</a>
                        <span class="text-[10px] text-slate-500">(${formatFileSize(file.size)})</span>
                    </div>
                    <button type="button" onclick="removeFile(this, '${input.id}')" class="text-slate-500 hover:text-red-400 transition-colors">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                `;
            } else {
                fileItem.innerHTML = `
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-file-exclamation text-red-400 text-xs"></i>
                        <span class="text-xs text-red-400 truncate max-w-[200px]">${file.name} (upload failed)</span>
                    </div>
                    <button type="button" onclick="removeFile(this, '${input.id}')" class="text-slate-500 hover:text-red-400 transition-colors">
                        <i class="fa-solid fa-xmark text-xs"></i>
                    </button>
                `;
            }
            listElement.appendChild(fileItem);
        }
        
        // Store file IDs on the input element for later retrieval
        input.dataset.fileIds = JSON.stringify(uploadedFileIds);
        
        countElement.textContent = `${files.length} file${files.length > 1 ? 's' : ''} selected`;
    } else {
        listElement.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        countElement.textContent = '0 files selected';
        input.dataset.fileIds = JSON.stringify([]);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Remove file from list
function removeFile(button, inputId) {
    const input = document.getElementById(inputId);
    const fileItem = button.closest('.flex.items-center.justify-between');
    const listElement = fileItem.parentElement;
    const countElement = document.getElementById(inputId.replace('-input', '-count'));
    
    fileItem.remove();
    
    const remainingFiles = listElement.querySelectorAll('.flex.items-center.justify-between').length;
    if (remainingFiles === 0) {
        listElement.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        countElement.textContent = '0 files selected';
        input.value = '';
    } else {
        countElement.textContent = `${remainingFiles} file${remainingFiles > 1 ? 's' : ''} selected`;
    }
}

// Upload file to storage
async function uploadFile(file) {
    try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await window.supabase.storage
            .from('documents')
            .upload(fileName, file);
        
        if (error) {
            if (error.message.includes('Bucket not found')) {
                alert('Storage bucket "documents" does not exist. Please create it in Supabase dashboard (Storage → Create new bucket → name it "documents")');
                return null;
            }
            throw error;
        }
        
        // Get public URL
        const { data: { publicUrl } } = window.supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
        
        // Insert file record into files table
        const { data: fileRecord, error: insertError } = await window.supabase
            .from('files')
            .insert({
                name: file.name,
                path: data.path,
                mime_type: file.type,
                file_size: file.size
            })
            .select()
            .single();
        
        if (insertError) {
            console.error('Error inserting file record:', insertError);
            throw insertError;
        }
        
        return { id: fileRecord.id, url: publicUrl, name: file.name };
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file: ' + error.message);
        return null;
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new ReworkloginSection();
    if (typeof initReworkData === 'function') {
        initReworkData();
    }
    // Load machines for the dropdown
    loadMachinesForRework();
    loadJobOrdersForRework();
});

// Load job orders for rework dropdown
async function loadJobOrdersForRework() {
    const jobOrderSelect = document.getElementById('rework-job-order');
    if (!jobOrderSelect) return;

    try {
        const { data: jobOrders, error } = await window.supabase
            .from('job_orders')
            .select('*, invoice:invoices(invoice_no, order:orders(order_no, clients(name)))')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (jobOrders && jobOrders.length > 0) {
            jobOrderSelect.innerHTML = '<option value="">Select Job Order (Optional)</option>' +
                jobOrders.map(jo => `<option value="${jo.id}">${jo.job_no} - ${jo.invoice?.order?.clients?.name || 'Unknown Client'}</option>`).join('');
        } else {
            jobOrderSelect.innerHTML = '<option value="">No job orders available</option>';
        }
    } catch (error) {
        console.error('Error loading job orders:', error);
        jobOrderSelect.innerHTML = '<option value="">Error loading job orders</option>';
    }
}

// Load machines for rework dropdown
async function loadMachinesForRework() {
    const machineSelect = document.getElementById('rework-machine');
    if (!machineSelect) return;

    try {
        const { data: machines, error } = await window.supabase
            .from('machines')
            .select('*')
            .order('name');

        if (error) throw error;

        if (machines && machines.length > 0) {
            machineSelect.innerHTML = '<option value="">Select Machine</option>' +
                machines.map(m => `<option value="${m.id}">${m.name} (${m.machine_type})</option>`).join('');
        } else {
            machineSelect.innerHTML = '<option value="">No machines available</option>';
        }
    } catch (error) {
        console.error('Error loading machines:', error);
        machineSelect.innerHTML = '<option value="">Error loading machines</option>';
    }
}
