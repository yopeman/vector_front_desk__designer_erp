// =============================================
// REWORK MODULE
// =============================================

// REWORK DATA
// (initialized in mock-data.js)

let reworkLoaded = false;

// Date formatting function
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

async function fetchReworkRecords() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    // Fetch only active statuses (exclude cancelled if needed)
    const { data, error } = await supabase
        .from('production_orders')
        .select('*, job_orders(job_no)')
        .eq('job_type', 'rework')
        .in('status', ['New', 'In Progress'])
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching rework records:', error);
        return;
    }

    reworkData = (data || []).map(row => ({
        id: row.id,
        taskType: row.task_type || 'task',
        date: formatDate(row.created_at || row.date),
        jobNum: row.job_orders?.job_no || '',
        job_order_id: row.job_order_id || '',
        material: row.material || 'N/A',
        thickness: row.thickness || 'N/A',
        color: row.color || 'N/A',
        machine: row.machine || '',
        machine_id: row.machine_id || '',
        length: row.length || 'N/A',
        width: row.width || 'N/A',
        height: row.height || 'N/A',
        gram: row.gram || 'N/A',
        reason: row.rework_reason || '',
        priority: row.priority === 'High' ? 'urgent' : (row.priority === 'Medium' ? 'normal' : 'normal'),
        status: row.status || 'in-progress',
        startTime: row.started_at,
        endTime: row.completed_at
    }));

    reworkIdCounter = Math.max(...reworkData.map(r => parseInt(r.id) || 0), 0) + 1;
    reworkLoaded = true;
    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
}

// =============================================
// ADD REWORK ENTRY
// =============================================
async function addReworkEntry() {
    const modal = document.getElementById('new-rework-modal');
    const editingId = modal ? modal.getAttribute('data-editing-id') : null;

    // If editing, call update function instead
    if (editingId) {
        await updateReworkEntry();
        return;
    }

    const taskType = document.getElementById('rework-task-type').value;
    const material = document.getElementById('rework-material').value;
    const thickness = document.getElementById('rework-thickness').value;
    const color = document.getElementById('rework-color').value;
    const machineSelect = document.getElementById('rework-machine');
    const machineId = machineSelect ? machineSelect.value : '';
    const length = document.getElementById('rework-length').value;
    const width = document.getElementById('rework-width').value;
    const height = document.getElementById('rework-height').value;
    const gram = document.getElementById('rework-gram').value;
    const reason = document.getElementById('rework-reason').value;
    const note = document.getElementById('rework-note').value;
    
    // Get attached file IDs
    const fileInput = document.getElementById('rework-file-input');
    const attachedFileIds = fileInput && fileInput.dataset.fileIds ? JSON.parse(fileInput.dataset.fileIds) : [];

    if (!taskType || !machineId) {
        alert('Please fill in at least Task Type and Machine Type.');
        return;
    }

    const jobOrderSelect = document.getElementById('rework-job-order');
    const jobOrderId = jobOrderSelect ? jobOrderSelect.value : '';

    const { data, error } = await supabase
        .from('production_orders')
        .insert({
            task_type: taskType,
            job_order_id: jobOrderId || null,
            material: material || 'N/A',
            thickness: thickness || 'N/A',
            color: color || 'N/A',
            machine_id: machineId,
            length: length || 'N/A',
            width: width || 'N/A',
            height: height || 'N/A',
            gram: gram || 'N/A',
            rework_reason: reason || '',
            note: note || '',
            attached_file_ids: attachedFileIds,
            status: 'New',
            job_type: 'rework'
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding rework entry:', error);
        alert('Failed to add rework entry. Please try again.');
        return;
    }

    await fetchReworkRecords();
    renderReworkRecords();
    updateReworkStats();

    // Clear form
    document.getElementById('rework-task-type').value = '';
    document.getElementById('rework-material').value = '';
    document.getElementById('rework-thickness').value = '';
    document.getElementById('rework-color').value = '';
    document.getElementById('rework-length').value = '';
    document.getElementById('rework-width').value = '';
    document.getElementById('rework-height').value = '';
    document.getElementById('rework-gram').value = '';
    document.getElementById('rework-reason').value = '';

    if (machineSelect) machineSelect.value = '';

    // Close the modal
    closeNewReworkModal();

    alert('Rework entry added successfully!');
}

// =============================================
// RENDER REWORK RECORDS TABLE
// =============================================
let machinesCache = [];

async function renderReworkRecords() {
    const tbody = document.getElementById('rework-records-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!reworkData.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="p-8 text-center text-slate-500 italic">No rework records yet. Add your first entry above.</td></tr>';
        return;
    }

    // Fetch machines if not cached
    if (machinesCache.length === 0) {
        machinesCache = await fetchMachines();
    }

    renderRows(tbody);
}

function renderRows(tbody) {
    const machineNames = new Set();
    reworkData.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = 'order-row hover:bg-blue-600/10 transition-colors';
        row.setAttribute('data-index', index);

        // Status badge with all statuses
        let statusBadge = '';
        const status = entry.status ? entry.status.toLowerCase().replace(/\s+/g, '-') : 'new';
        
        if (status === 'completed') {
            statusBadge = '<span class="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20">Completed</span>';
        } else if (status === 'in-progress') {
            statusBadge = '<span class="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded border border-amber-500/20">In Progress</span>';
        } else if (status === 'cancelled') {
            statusBadge = '<span class="px-2 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold rounded border border-rose-500/20">Cancelled</span>';
        } else {
            statusBadge = '<span class="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded border border-blue-500/20">New</span>';
        }

        // Find machine name by machine_id
        let machineName = 'N/A';
        if (entry.machine_id && machinesCache.length > 0) {
            const machine = machinesCache.find(m => m.id === entry.machine_id);
            if (machine) {
                machineName = machine.name;
            }
        } else if (entry.machine) {
            machineName = entry.machine;
        }

        if (machineName && machineName !== 'N/A') machineNames.add(machineName);

        row.setAttribute('data-priority', entry.priority || 'normal');
        row.setAttribute('data-machine', machineName || '');
        row.setAttribute('data-status', status);

        row.innerHTML = `
            <td class="p-4 text-center font-mono font-medium text-slate-400">${String(index + 1).padStart(2, '00')}</td>
            <td class="p-4 font-mono text-xs">${entry.date || entry.created_at || ''}</td>
            <td class="p-4 font-medium text-slate-200 capitalize">${entry.taskType}</td>
            <td class="p-4 font-mono text-xs text-slate-400">${entry.jobNum || '-'}</td>
            <td class="p-4 text-xs text-slate-400">${entry.material}</td>
            <td class="p-4 font-mono text-xs">${entry.thickness}</td>
            <td class="p-4 text-xs">${entry.color}</td>
            <td class="p-4 text-xs font-mono">${machineName}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-center">
                <button onclick="event.stopPropagation(); openProductionOrderInventoryModal('${entry.id}', 'rework')" class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all mr-2" title="Assign inventory items">
                    <i class="fa-solid fa-boxes-stacked mr-1"></i>Assign Items
                </button>
                <button onclick="editReworkEntry('${entry.id}')" class="text-blue-400 hover:text-blue-300 transition-colors text-xs" title="Edit">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    populateReworkMachineFilter([...machineNames]);

    const filterCountEl = document.getElementById('rework-filter-count');
    if (filterCountEl) filterCountEl.textContent = reworkData.length;
}

// =============================================
// POPULATE REWORK MACHINE FILTER OPTIONS
// =============================================
function populateReworkMachineFilter(machineNames) {
    const machineFilter = document.getElementById('rework-machine-filter');
    if (!machineFilter) return;

    const current = machineFilter.value;
    const machines = [...new Set(machineNames || [])].sort((a, b) => a.localeCompare(b));

    machineFilter.innerHTML = '<option value="all" class="text-slate-300">All Machines</option>';
    machines.forEach(machine => {
        const opt = document.createElement('option');
        opt.value = machine.toLowerCase();
        opt.textContent = machine;
        machineFilter.appendChild(opt);
    });

    if (current && [...machineFilter.options].some(o => o.value === current)) {
        machineFilter.value = current;
    } else {
        machineFilter.value = 'all';
    }
}

// =============================================
// EDIT REWORK ENTRY
// =============================================
async function editReworkEntry(entryId) {
    const entry = reworkData.find(r => r.id === entryId);
    if (!entry) {
        alert('Rework entry not found.');
        return;
    }

    // Populate the modal form with existing data
    document.getElementById('rework-task-type').value = entry.taskType || '';
    document.getElementById('rework-material').value = entry.material === 'N/A' ? '' : entry.material;
    document.getElementById('rework-thickness').value = entry.thickness === 'N/A' ? '' : entry.thickness;
    document.getElementById('rework-color').value = entry.color === 'N/A' ? '' : entry.color;
    document.getElementById('rework-length').value = entry.length === 'N/A' ? '' : entry.length;
    document.getElementById('rework-width').value = entry.width === 'N/A' ? '' : entry.width;
    document.getElementById('rework-height').value = entry.height === 'N/A' ? '' : entry.height;
    document.getElementById('rework-gram').value = entry.gram === 'N/A' ? '' : entry.gram;
    document.getElementById('rework-reason').value = entry.reason || '';
    document.getElementById('rework-note').value = entry.note || '';

    // Populate attachments
    await populateReworkAttachments(entry.id);

    // Set machine select
    const machineSelect = document.getElementById('rework-machine');
    if (machineSelect) {
        // Ensure machines are loaded and then select the correct one
        const loadAndSelectMachine = async () => {
            let machines = [];
            
            // Check if we need to fetch machines
            if (!machineSelect.options || machineSelect.options.length <= 1 || 
                (machineSelect.options[1]?.textContent === 'Loading machines...')) {
                machines = await fetchMachines();
                if (machineSelect) {
                    machineSelect.innerHTML = '<option value="">Select Machine</option>' +
                        machines.map(m => `<option value="${m.id}">${m.name} (${m.machine_type})</option>`).join('');
                }
            } else {
                // Machines already loaded, get them from the select options
                machines = Array.from(machineSelect.options)
                    .filter(opt => opt.value && opt.value !== '')
                    .map(opt => {
                        const text = opt.textContent.trim();
                        const match = text.match(/^(.+)\s\((.+)\)$/);
                        if (match) {
                            return {
                                id: opt.value,
                                name: match[1],
                                machine_type: match[2]
                            };
                        }
                        return null;
                    })
                    .filter(m => m !== null);
            }
            
            // Find and select the machine by matching the machine_id
            if (entry.machine_id && machines.length > 0) {
                const matchedMachine = machines.find(m => m.id === entry.machine_id);
                if (matchedMachine && machineSelect) {
                    machineSelect.value = matchedMachine.id;
                }
            }
        };
        
        await loadAndSelectMachine();
    }

    // Set job order select
    const jobOrderSelect = document.getElementById('rework-job-order');
    if (jobOrderSelect) {
        if (!jobOrderSelect.options || jobOrderSelect.options.length <= 1 ||
            jobOrderSelect.options[0].textContent === 'Loading job orders...') {
            await loadJobOrdersForRework();
        }
        jobOrderSelect.value = entry.job_order_id || '';
    }

    // Store the entry ID being edited
    const modal = document.getElementById('new-rework-modal');
    if (modal) {
        modal.setAttribute('data-editing-id', entryId);
        modal.setAttribute('data-mode', 'edit');
    }

    // Change modal title to indicate edit mode
    const modalTitle = document.querySelector('#new-rework-modal h3');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Rework Entry';
    }

    // Change submit button text
    const submitBtn = document.querySelector('#new-rework-modal button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-check text-xs"></i> Update Entry';
    }

    // Display status timeline for existing entry
    displayStatusTimeline(entry);

    // Open the modal
    openNewReworkModal();
}

// =============================================
// DISPLAY STATUS TIMELINE
// =============================================
function displayStatusTimeline(entry) {
    const statusTimeline = document.getElementById('rework-status-timeline');
    if (!statusTimeline) return;

    // Show the Status Timeline section
    statusTimeline.classList.remove('hidden');

    // Reset timeline first
    const stepInProgress = document.getElementById('rework-step-in-progress');
    const stepCompleted = document.getElementById('rework-step-completed');
    const progressText = document.getElementById('rework-step-progress-text');
    const completedText = document.getElementById('rework-step-completed-text');
    const startEl = document.getElementById('rework-start-time');
    const endEl = document.getElementById('rework-end-time');

    // Reset classes
    if (stepInProgress) {
        stepInProgress.classList.remove('active', 'completed');
    }
    if (stepCompleted) {
        stepCompleted.classList.remove('completed');
    }

    // Display start time if exists
    if (entry.startTime) {
        const startTime = new Date(entry.startTime);
        const timeString = startTime.toTimeString().split(' ')[0];
        if (startEl) {
            startEl.innerText = `Started at: ${timeString}`;
            startEl.className = "text-[11px] text-center font-mono text-amber-400 font-bold border border-amber-500/30 bg-amber-500/10 py-1.5 rounded-lg shadow";
        }
        if (stepInProgress) {
            stepInProgress.classList.add('active');
        }
        if (progressText) {
            progressText.innerHTML = `In Progress <span class="text-amber-400 font-mono">(${timeString})</span>`;
        }
    } else {
        if (startEl) {
            startEl.innerText = 'recorded start time';
            startEl.className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";
        }
    }

    // Display end time if exists
    if (entry.endTime) {
        const endTime = new Date(entry.endTime);
        const timeString = endTime.toTimeString().split(' ')[0];
        if (endEl) {
            endEl.innerText = `Ended at: ${timeString}`;
            endEl.className = "text-[11px] text-center font-mono text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 py-1.5 rounded-lg shadow";
        }
        if (stepInProgress) {
            stepInProgress.classList.remove('active');
            stepInProgress.classList.add('completed');
        }
        if (stepCompleted) {
            stepCompleted.classList.add('completed');
        }
        if (completedText) {
            completedText.innerHTML = `Completed <span class="text-emerald-400 font-mono">(${timeString})</span>`;
        }
    } else {
        if (endEl) {
            endEl.innerText = 'recorded end time';
            endEl.className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";
        }
    }
}

// =============================================
// UPDATE REWORK ENTRY
// =============================================
async function updateReworkEntry() {
    const modal = document.getElementById('new-rework-modal');
    const editingId = modal ? modal.getAttribute('data-editing-id') : null;

    if (!editingId) {
        // If no editing ID, it's a new entry
        await addReworkEntry();
        return;
    }

    const taskType = document.getElementById('rework-task-type').value;
    const material = document.getElementById('rework-material').value;
    const thickness = document.getElementById('rework-thickness').value;
    const color = document.getElementById('rework-color').value;
    const machineSelect = document.getElementById('rework-machine');
    const machineId = machineSelect ? machineSelect.value : '';
    const length = document.getElementById('rework-length').value;
    const width = document.getElementById('rework-width').value;
    const height = document.getElementById('rework-height').value;
    const gram = document.getElementById('rework-gram').value;
    const reason = document.getElementById('rework-reason').value;
    const note = document.getElementById('rework-note').value;
    
    // Get attached file IDs
    const fileInput = document.getElementById('rework-file-input');
    const attachedFileIds = fileInput && fileInput.dataset.fileIds ? JSON.parse(fileInput.dataset.fileIds) : [];

    if (!taskType || !machineId) {
        alert('Please fill in at least Task Type and Machine Type.');
        return;
    }

    const jobOrderSelect = document.getElementById('rework-job-order');
    const jobOrderId = jobOrderSelect ? jobOrderSelect.value : '';

    const { error } = await supabase
        .from('production_orders')
        .update({
            task_type: taskType,
            job_order_id: jobOrderId || null,
            material: material || 'N/A',
            thickness: thickness || 'N/A',
            color: color || 'N/A',
            machine_id: machineId,
            length: length || 'N/A',
            width: width || 'N/A',
            height: height || 'N/A',
            gram: gram || 'N/A',
            rework_reason: reason || '',
            note: note || '',
            attached_file_ids: attachedFileIds
        })
        .eq('id', editingId)
        .select()
        .single();

    if (error) {
        console.error('Error updating rework entry:', error);
        alert('Failed to update rework entry. Please try again.');
        return;
    }

    // Reset modal state
    if (modal) {
        modal.removeAttribute('data-editing-id');
        modal.removeAttribute('data-mode');
    }

    // Reset modal title
    const modalTitle = document.querySelector('#new-rework-modal h3');
    if (modalTitle) {
        modalTitle.textContent = 'New Rework Entry';
    }

    // Reset submit button text
    const submitBtn = document.querySelector('#new-rework-modal button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fa-solid fa-check text-xs"></i> Request Approval';
    }

    // Clear form
    document.getElementById('rework-task-type').value = '';
    document.getElementById('rework-material').value = '';
    document.getElementById('rework-thickness').value = '';
    document.getElementById('rework-color').value = '';
    document.getElementById('rework-length').value = '';
    document.getElementById('rework-width').value = '';
    document.getElementById('rework-height').value = '';
    document.getElementById('rework-gram').value = '';
    document.getElementById('rework-reason').value = '';
    if (machineSelect) machineSelect.value = '';

    closeNewReworkModal();
    await fetchReworkRecords();
    renderReworkRecords();
    updateReworkStats();

    alert('Rework entry updated successfully!');
}

// =============================================
// UPDATE REWORK STATS
// =============================================
function updateReworkStats() {
    const total = reworkData.length;
    const inProgress = reworkData.filter(r => r.status === 'in-progress').length;
    const completed = reworkData.filter(r => r.status === 'completed').length;

    let avgTime = 0;
    if (completed > 0) {
        const times = reworkData.filter(r => r.startTime && r.endTime).map(r => {
            const start = new Date(r.startTime);
            const end = new Date(r.endTime);
            return (end - start) / 1000 / 60;
        });
        avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    }

    const totalEl = document.getElementById('rework-stats-total');
    const progressEl = document.getElementById('rework-stats-progress');
    const completedEl = document.getElementById('rework-stats-completed');
    const avgTimeEl = document.getElementById('rework-stats-avgtime');

    if (totalEl) totalEl.textContent = total;
    if (progressEl) progressEl.textContent = inProgress;
    if (completedEl) completedEl.textContent = completed;
    if (avgTimeEl) avgTimeEl.textContent = avgTime + 'm';

    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
}

// =============================================
// FILTER REWORK RECORDS
// =============================================
function filterReworkRecords() {
    const searchVal = document.getElementById('rework-search');
    const priorityFilter = document.getElementById('rework-priority-filter');
    const machineFilter = document.getElementById('rework-machine-filter');
    const statusFilter = document.getElementById('rework-status-filter');
    const rows = document.querySelectorAll('#rework-records-body .order-row');
    const noResults = document.getElementById('rework-no-results');
    const clearBtn = document.getElementById('rework-search-clear');
    const filterCountEl = document.getElementById('rework-filter-count');

    if (!searchVal) return;

    const search = searchVal.value.toLowerCase();
    const priority = priorityFilter ? priorityFilter.value : 'all';
    const machine = machineFilter ? machineFilter.value : 'all';
    const status = statusFilter ? statusFilter.value : 'all';
    let visibleCount = 0;

    if (search.length > 0) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }

    rows.forEach(row => {
        const rowPriority = row.getAttribute('data-priority');
        const rowMachine = (row.getAttribute('data-machine') || '').toLowerCase();
        const rowStatus = row.getAttribute('data-status');
        const text = row.innerText.toLowerCase();

        const matchesPriority = (priority === 'all' || rowPriority === priority);
        const matchesMachine = (machine === 'all' || rowMachine === machine);
        const matchesStatus = (status === 'all' || rowStatus === status);
        const matchesSearch = text.includes(search);

        if (matchesPriority && matchesMachine && matchesStatus && matchesSearch) {
            row.classList.remove('hidden');
            visibleCount++;
        } else {
            row.classList.add('hidden');
        }
    });

    if (visibleCount === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }

    if (filterCountEl) filterCountEl.textContent = visibleCount;
}

function clearReworkSearch() {
    const searchInput = document.getElementById('rework-search');
    const clearBtn = document.getElementById('rework-search-clear');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    filterReworkRecords();
}

function resetReworkFilters() {
    const priorityFilter = document.getElementById('rework-priority-filter');
    const machineFilter = document.getElementById('rework-machine-filter');
    const statusFilter = document.getElementById('rework-status-filter');

    if (priorityFilter) priorityFilter.value = 'all';
    if (machineFilter) machineFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';

    clearReworkSearch();
}

// =============================================
// INITIALIZE REWORK DATA
// =============================================
async function initReworkData() {
    if (!reworkLoaded) {
        await fetchReworkRecords();
    }
    renderReworkRecords();
    updateReworkStats();
}

// =============================================
// FETCH MACHINES FROM DATABASE
// =============================================
async function fetchMachines() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return [];
    }

    const { data, error } = await supabase
        .from('machines')
        .select('id, name, machine_type')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching machines:', error);
        return [];
    }

    return data || [];
}

// =============================================
// MODAL FUNCTIONS
// =============================================
function openNewReworkModal() {
    const modal = document.getElementById('new-rework-modal');
    if (!modal) return;

    modal.classList.add('open');
    document.body.classList.add('modal-open');

    // Clear form fields for new entries
    const mode = modal.getAttribute('data-mode');
    if (mode !== 'edit') {
        document.getElementById('rework-task-type').value = '';
        document.getElementById('rework-material').value = '';
        document.getElementById('rework-thickness').value = '';
        document.getElementById('rework-color').value = '';
        document.getElementById('rework-length').value = '';
        document.getElementById('rework-width').value = '';
        document.getElementById('rework-height').value = '';
        document.getElementById('rework-gram').value = '';
        document.getElementById('rework-reason').value = '';
        document.getElementById('rework-note').value = '';
        
        // Clear job order select
        const jobOrderSelect = document.getElementById('rework-job-order');
        if (jobOrderSelect) jobOrderSelect.value = '';
        
        // Clear file upload
        const fileInput = document.getElementById('rework-file-input');
        if (fileInput) {
            fileInput.value = '';
            fileInput.dataset.fileIds = JSON.stringify([]);
        }
        const filesList = document.getElementById('rework-attached-files-list');
        if (filesList) {
            filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        }
        const fileCount = document.getElementById('rework-file-count');
        if (fileCount) {
            fileCount.textContent = '0 files selected';
        }
    }

    const machineSelect = document.getElementById('rework-machine');
    if (machineSelect && (!machineSelect.options || machineSelect.options.length <= 1 || machineSelect.options[0].value === '' && machineSelect.options[1]?.value === 'Loading machines...')) {
        fetchMachines().then(machines => {
            if (machineSelect) {
                machineSelect.innerHTML = '<option value="">Select Machine</option>' +
                    machines.map(m => `<option value="${m.id}">${m.name} (${m.machine_type})</option>`).join('');
            }
        });
    }

    // Hide Status Timeline section for new entries
    const statusTimeline = document.getElementById('rework-status-timeline');
    if (statusTimeline && mode !== 'edit') {
        statusTimeline.classList.add('hidden');
    }
}

function closeNewReworkModal(event) {
    if (event && event.target !== document.getElementById('new-rework-modal')) return;
    const modal = document.getElementById('new-rework-modal');
    if (modal) {
        modal.classList.remove('open');
        // Reset modal state when closing
        modal.removeAttribute('data-editing-id');
        modal.removeAttribute('data-mode');
        
        // Reset modal title
        const modalTitle = document.querySelector('#new-rework-modal h3');
        if (modalTitle) {
            modalTitle.textContent = 'New Rework Entry';
        }
        
        // Reset submit button text
        const submitBtn = document.querySelector('#new-rework-modal button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-check text-xs"></i> Request Approval';
        }

        // Clear all form fields
        document.getElementById('rework-task-type').value = '';
        document.getElementById('rework-material').value = '';
        document.getElementById('rework-thickness').value = '';
        document.getElementById('rework-color').value = '';
        document.getElementById('rework-length').value = '';
        document.getElementById('rework-width').value = '';
        document.getElementById('rework-height').value = '';
        document.getElementById('rework-gram').value = '';
        document.getElementById('rework-reason').value = '';
        const machineSelect = document.getElementById('rework-machine');
        if (machineSelect) machineSelect.value = '';
        const jobOrderSelect = document.getElementById('rework-job-order');
        if (jobOrderSelect) jobOrderSelect.value = '';

        // Reset and hide Status Timeline section
        const statusTimeline = document.getElementById('rework-status-timeline');
        if (statusTimeline) {
            statusTimeline.classList.add('hidden');
            
            // Reset timeline display
            const stepInProgress = document.getElementById('rework-step-in-progress');
            const stepCompleted = document.getElementById('rework-step-completed');
            const progressText = document.getElementById('rework-step-progress-text');
            const completedText = document.getElementById('rework-step-completed-text');
            const startEl = document.getElementById('rework-start-time');
            const endEl = document.getElementById('rework-end-time');
            
            if (stepInProgress) {
                stepInProgress.classList.remove('active', 'completed');
            }
            if (stepCompleted) {
                stepCompleted.classList.remove('completed');
            }
            if (progressText) {
                progressText.innerHTML = 'In Progress';
            }
            if (completedText) {
                completedText.innerHTML = 'Completed';
            }
            if (startEl) {
                startEl.innerText = 'recorded start time';
                startEl.className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";
            }
            if (endEl) {
                endEl.innerText = 'recorded end time';
                endEl.className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";
            }
        }
    }
    document.body.classList.remove('modal-open');
}

// =============================================
// LOG REWORK STATUS TIME
// =============================================
async function logReworkStatusTime(mode) {
    if (!reworkData.length) {
        alert('No rework entries available.');
        return;
    }

    // Check if we're editing an entry
    const modal = document.getElementById('new-rework-modal');
    const editingId = modal ? modal.getAttribute('data-editing-id') : null;
    
    // Use the editing entry if in edit mode, otherwise use the latest entry
    let targetEntry = null;
    if (editingId) {
        targetEntry = reworkData.find(r => r.id === editingId);
    }
    if (!targetEntry) {
        targetEntry = reworkData[reworkData.length - 1];
    }
    if (!targetEntry || !targetEntry.id) return;

    const now = new Date();
    const timestamp = now.toISOString();
    const timeString = now.toTimeString().split(' ')[0];

    const stepInProgress = document.getElementById('rework-step-in-progress');
    const stepCompleted = document.getElementById('rework-step-completed');

    if (mode === 'start') {
        const { error } = await supabase
            .from('production_orders')
            .update({
                started_at: timestamp,
                status: 'In Progress'
            })
            .eq('id', targetEntry.id);

        if (error) {
            console.error('Error saving start time:', error);
            alert('Failed to save start time. Please try again.');
            return;
        }

        // Update the entry in reworkData
        targetEntry.startTime = timestamp;
        targetEntry.status = 'In Progress';

        const startEl = document.getElementById('rework-start-time');
        if (startEl) {
            startEl.innerText = `Started at: ${timeString}`;
            startEl.className = "text-[11px] text-center font-mono text-amber-400 font-bold border border-amber-500/30 bg-amber-500/10 py-1.5 rounded-lg shadow";
        }

        if (stepInProgress) stepInProgress.classList.add('active');
        const progressText = document.getElementById('rework-step-progress-text');
        if (progressText) {
            progressText.innerHTML = 'In Progress <span class="text-amber-400 font-mono">(' + timeString + ')</span>';
        }

        alert('Rework started. Start time captured.');
    } else if (mode === 'end') {
        const { error } = await supabase
            .from('production_orders')
            .update({
                completed_at: timestamp,
                status: 'Completed'
            })
            .eq('id', targetEntry.id);

        if (error) {
            console.error('Error saving end time:', error);
            alert('Failed to save end time. Please try again.');
            return;
        }

        // Update the entry in reworkData
        targetEntry.endTime = timestamp;
        targetEntry.status = 'completed';

        const endEl = document.getElementById('rework-end-time');
        if (endEl) {
            endEl.innerText = `Ended at: ${timeString}`;
            endEl.className = "text-[11px] text-center font-mono text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 py-1.5 rounded-lg shadow";
        }

        if (stepInProgress) {
            stepInProgress.classList.remove('active');
            stepInProgress.classList.add('completed');
        }
        if (stepCompleted) stepCompleted.classList.add('completed');
        const completedText = document.getElementById('rework-step-completed-text');
        if (completedText) {
            completedText.innerHTML = 'Completed <span class="text-emerald-400 font-mono">(' + timeString + ')</span>';
        }

        renderReworkRecords();
        updateReworkStats();
        alert('Rework completed. End time captured.');
    }
}

// Populate rework attachments and note
async function populateReworkAttachments(entryId) {
    try {
        // Fetch production order with note and attached_file_ids
        const { data: productionOrder, error: orderError } = await supabase
            .from('production_orders')
            .select('note, attached_file_ids')
            .eq('id', entryId)
            .single();
        
        if (orderError) throw orderError;
        
        // Populate note
        const noteInput = document.getElementById('rework-note');
        if (noteInput) {
            noteInput.value = productionOrder.note || '';
        }
        
        // Fetch and populate attached files
        const filesList = document.getElementById('rework-attached-files-list');
        const countElement = document.getElementById('rework-file-count');
        
        if (filesList && productionOrder.attached_file_ids && productionOrder.attached_file_ids.length > 0) {
            const { data: files, error: filesError } = await supabase
                .from('files')
                .select('*')
                .in('id', productionOrder.attached_file_ids);
            
            if (filesError) throw filesError;
            
            if (files && files.length > 0) {
                const fileHtmlPromises = files.map(async file => {
                    const fileUrl = await getFileUrl(file.path);
                    
                    return `
                        <div class="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                            <div class="flex items-center gap-2 min-w-0">
                                <i class="fa-solid fa-file text-purple-400 text-xs shrink-0"></i>
                                <a href="${fileUrl}" target="_blank" class="text-xs text-slate-300 hover:text-blue-400 truncate max-w-[180px] transition-colors" title="Open in new tab">${file.name}</a>
                                <span class="text-[10px] text-slate-500 shrink-0">(${formatFileSize(file.file_size)})</span>
                            </div>
                            <button onclick="downloadFileById('${file.id}')" class="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1" title="Download without opening">
                                <i class="fa-solid fa-download text-[9px]"></i> Download
                            </button>
                        </div>
                    `;
                });
                filesList.innerHTML = (await Promise.all(fileHtmlPromises)).join('');
                countElement.textContent = `${files.length} file${files.length > 1 ? 's' : ''} attached`;
            } else {
                filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
                countElement.textContent = '0 files attached';
            }
        } else if (filesList) {
            filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
            countElement.textContent = '0 files attached';
        }
    } catch (error) {
        console.error('Error populating attachments:', error);
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

// Helper function to get file URL with fallback
async function getFileUrl(filePath) {
    try {
        console.log('Attempting to get signed URL for:', filePath);
        const { data, error } = await window.supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
        if (error) {
            console.error('Supabase signed URL error:', error);
            // Try public URL as fallback
            const { data: publicData, error: publicError } = await window.supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            if (publicError) {
                console.error('Public URL error:', publicError);
                return null;
            }
            console.log('Using public URL:', publicData.publicUrl);
            return publicData.publicUrl;
        }
        console.log('Signed URL generated:', data.signedUrl);
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting file URL:', error);
        return null;
    }
}

// Download a file by its record id (looks up path and name from files table)
async function downloadFileById(fileId) {
    try {
        const { data, error } = await window.supabase
            .from('files')
            .select('name, path')
            .eq('id', fileId)
            .single();
        if (error || !data) {
            throw error || new Error('File not found');
        }
        await downloadFile(data.path, data.name);
    } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file. Please try again.');
    }
}

// Download a file directly without opening it
async function downloadFile(filePath, fileName) {
    try {
        const { data, error } = await window.supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 60);
        if (error || !data?.signedUrl) {
            throw error || new Error('Failed to create download link');
        }
        const response = await fetch(data.signedUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file. Please try again.');
    }
}
