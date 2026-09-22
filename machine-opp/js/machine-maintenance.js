// =============================================
// MACHINE MAINTENANCE CHECKLISTS MODULE
// =============================================

let machinesLoaded = false;

// =============================================
// FETCH MACHINES AND CHECKLISTS FROM SUPABASE
// =============================================
async function fetchMachinesAndChecklists() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    try {
        // Fetch all machines (all statuses)
        const { data: machines, error: machinesError } = await supabase
            .from('machines')
            .select('id, name, machine_type, status')
            .order('name', { ascending: true });

        if (machinesError) {
            console.error('Error fetching machines:', machinesError);
            return;
        }

        // Fetch all checklists
        const { data: checklists, error: checklistsError } = await supabase
            .from('machine_maintenance_checklists')
            .select('*')
            .order('checklist_type', { ascending: true });

        if (checklistsError) {
            console.error('Error fetching checklists:', checklistsError);
            return;
        }

        // Organize data by machine id (unique key per machine)
        machines.forEach(machine => {
            const key = machine.id;
            machineData[key] = {
                id: machine.id,
                name: machine.name,
                machine_type: machine.machine_type,
                status: machine.status || 'active',
                daily: [],
                weekly: [],
                monthly: []
            };
        });

        // Populate checklists for each machine
        checklists.forEach(checklist => {
            const machine = machines.find(m => m.id === checklist.machine_id);
            if (machine) {
                const key = machine.id;
                if (machineData[key] && checklist.checklist_items) {
                    machineData[key][checklist.checklist_type] = checklist.checklist_items;
                }
            }
        });

        machinesLoaded = true;
        
        // Render machine tabs dynamically from database
        renderMachineTabs();
    } catch (error) {
        console.error('Error loading machine data:', error);
    }
}

// =============================================
// RENDER MACHINE TABS DYNAMICALLY
// =============================================
function renderMachineTabs() {
    const container = document.getElementById('machine-tabs-container');
    if (!container) return;

    const machineKeys = Object.keys(machineData);
    
    if (machineKeys.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-500 text-center py-6 col-span-6">No machines found in database. Click "Add Machine" to create one.</div>';
        return;
    }

    // Icon mapping for machine types
    const machineIcons = {
        'cnc': 'fa-microchip',
        'co2': 'fa-fire',
        'fiber-cut': 'fa-scissors',
        'uv': 'fa-sun',
        '3d-print': 'fa-cube',
        'fiber-mark': 'fa-stamp'
    };

    // Status color mapping
    const statusColors = {
        'active': {
            bg: 'bg-emerald-600',
            text: 'text-white',
            shadow: 'shadow-emerald-500/20',
            hover: 'hover:bg-emerald-500',
            badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        },
        'maintenance': {
            bg: 'bg-amber-600',
            text: 'text-white',
            shadow: 'shadow-amber-500/20',
            hover: 'hover:bg-amber-500',
            badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        },
        'inactive': {
            bg: 'bg-rose-600',
            text: 'text-white',
            shadow: 'shadow-rose-500/20',
            hover: 'hover:bg-rose-500',
            badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }
    };

    container.innerHTML = machineKeys.map((key, idx) => {
        const machine = machineData[key];
        const icon = machineIcons[machine.machine_type] || 'fa-gears';
        const displayName = (machine.name || key).toUpperCase();
        const status = machine.status || 'active';
        const colors = statusColors[status] || statusColors.active;
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        
        return `
            <button onclick="switchMachine('${key}')" id="machinetab-${key}" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105 hover:scale-105">
                <div class="flex flex-col items-center gap-1.5">
                    <i class="fa-solid ${icon} text-lg group-hover:scale-110 transition-transform"></i>
                    <span class="text-xs font-semibold">${displayName}</span>
                    <span class="text-[8px] uppercase tracking-wider text-slate-500">${statusLabel}</span>
                </div>
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            </button>
        `;
    }).join('');
}


// =============================================
// FILTER MACHINES BY STATUS
// =============================================
function filterMachinesByStatus(status) {
    const container = document.getElementById('machine-tabs-container');
    if (!container) return;

    const machineKeys = Object.keys(machineData);
    
    if (machineKeys.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-500 text-center py-6 col-span-6">No machines found in database. Click "Add Machine" to create one.</div>';
        return;
    }

    // Filter machines by status
    const filteredKeys = status === 'all' 
        ? machineKeys 
        : machineKeys.filter(key => machineData[key].status === status);

    if (filteredKeys.length === 0) {
        container.innerHTML = `<div class="text-xs text-slate-500 text-center py-6 col-span-6">No machines with status "${status}" found.</div>`;
        return;
    }

    // Icon mapping for machine types
    const machineIcons = {
        'cnc': 'fa-microchip',
        'co2': 'fa-fire',
        'fiber-cut': 'fa-scissors',
        'uv': 'fa-sun',
        '3d-print': 'fa-cube',
        'fiber-mark': 'fa-stamp'
    };

    // Status color mapping
    const statusColors = {
        'active': {
            bg: 'bg-emerald-600',
            text: 'text-white',
            shadow: 'shadow-emerald-500/20',
            hover: 'hover:bg-emerald-500'
        },
        'maintenance': {
            bg: 'bg-amber-600',
            text: 'text-white',
            shadow: 'shadow-amber-500/20',
            hover: 'hover:bg-amber-500'
        },
        'inactive': {
            bg: 'bg-rose-600',
            text: 'text-white',
            shadow: 'shadow-rose-500/20',
            hover: 'hover:bg-rose-500'
        }
    };

    container.innerHTML = filteredKeys.map((key, idx) => {
        const machine = machineData[key];
        const icon = machineIcons[machine.machine_type] || 'fa-gears';
        const displayName = (machine.name || key).toUpperCase();
        const machineStatus = machine.status || 'active';
        const colors = statusColors[machineStatus] || statusColors.active;
        const statusLabel = machineStatus.charAt(0).toUpperCase() + machineStatus.slice(1);
        
        return `
            <button onclick="switchMachine('${key}')" id="machinetab-${key}" class="machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105 hover:scale-105">
                <div class="flex flex-col items-center gap-1.5">
                    <i class="fa-solid ${icon} text-lg group-hover:scale-110 transition-transform"></i>
                    <span class="text-xs font-semibold">${displayName}</span>
                    <span class="text-[8px] uppercase tracking-wider text-slate-500">${statusLabel}</span>
                </div>
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
            </button>
        `;
    }).join('');
}

// =============================================
// SWITCH MACHINE TAB
// =============================================
async function switchMachine(key) {
    // Status color mapping for selected tab
    const statusColors = {
        'active': {
            bg: 'bg-emerald-600',
            text: 'text-white',
            shadow: 'shadow-emerald-500/20',
            hover: 'hover:bg-emerald-500'
        },
        'maintenance': {
            bg: 'bg-amber-600',
            text: 'text-white',
            shadow: 'shadow-amber-500/20',
            hover: 'hover:bg-amber-500'
        },
        'inactive': {
            bg: 'bg-rose-600',
            text: 'text-white',
            shadow: 'shadow-rose-500/20',
            hover: 'hover:bg-rose-500'
        }
    };

    // Update tab button styles
    document.querySelectorAll('.machine-tab-btn').forEach(btn => {
        btn.className = "machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105";
    });
    const activeBtn = document.getElementById(`machinetab-${key}`);
    if (activeBtn) {
        const machine = machineData[key];
        const status = machine ? machine.status : 'active';
        const colors = statusColors[status] || statusColors.active;
        activeBtn.className = `machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all ${colors.bg} ${colors.text} shadow-lg ${colors.shadow} ${colors.hover} hover:scale-105`;
    }

    currentMachine = key;
    
    // Load data if not loaded
    if (!machinesLoaded) {
        await fetchMachinesAndChecklists();
    }
    
    const data = machineData[key];
    const container = document.getElementById('checklist-container');
    if (!container || !data) return;
    
    container.innerHTML = '';

    // Check if machine is active - only show checklists for active machines
    if (data.status !== 'active') {
        const statusLabel = data.status.charAt(0).toUpperCase() + data.status.slice(1);
        const statusColor = data.status === 'maintenance' ? 'amber' : 'rose';
        container.innerHTML = `
            <div class="col-span-3 bg-slate-800/40 border border-${statusColor}-500/20 rounded-2xl p-8 text-center">
                <div class="w-16 h-16 rounded-full bg-${statusColor}-500/10 flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-triangle-exclamation text-${statusColor}-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Machine ${statusLabel}</h3>
                <p class="text-sm text-slate-400">This machine is currently ${statusLabel.toLowerCase()}. Checklists are only available for active machines.</p>
            </div>
        `;
        return;
    }

    // Update timestamp
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }

    // Reset checklist states for new machine
    checklistStates.daily = {};
    checklistStates.weekly = {};
    checklistStates.monthly = {};

    ['daily', 'weekly', 'monthly'].forEach(period => {
        const isDaily = period === 'daily';
        const isWeekly = period === 'weekly';
        const colorScheme = isDaily ? 'blue' : isWeekly ? 'amber' : 'purple';
        
        let checkItemsHtml = '';
        if(data[period] && data[period].length > 0) {
            data[period].forEach((item, idx) => {
                checklistStates[period][idx] = false;
                checkItemsHtml += `
                    <div class="checklist-item flex items-start gap-2 p-3 rounded-xl hover:bg-slate-900/80 transition-all group border border-transparent hover:border-slate-700/50" data-period="${period}" data-index="${idx}">
                        <label class="flex items-start space-x-3 cursor-pointer flex-1">
                            <div class="relative mt-0.5">
                                <input type="checkbox" class="checklist-checkbox peer sr-only" onchange="updateProgress('${period}', ${idx}, this.checked)">
                                <div class="w-5 h-5 rounded-md border-2 border-slate-600 peer-checked:border-${colorScheme}-500 peer-checked:bg-${colorScheme}-500 transition-all flex items-center justify-center group-hover:border-${colorScheme}-400">
                                    <i class="fa-solid fa-check text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                                </div>
                            </div>
                            <span class="text-xs text-slate-300 group-hover:text-slate-100 transition-colors leading-relaxed flex-1">${item}</span>
                        </label>
                        <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="openEditChecklistItemModal('${period}', ${idx})" class="text-amber-400 hover:text-amber-300 transition-colors text-xs" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteChecklistItem('${period}', ${idx})" class="text-rose-400 hover:text-rose-300 transition-colors text-xs" title="Delete">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            checkItemsHtml = `<p class="text-xs text-slate-500 italic p-4 text-center">No items listed for this period.</p>`;
        }

        const icon = isDaily ? 'fa-calendar-day' : isWeekly ? 'fa-calendar-week' : 'fa-calendar';
        const gradientFrom = isDaily ? 'from-blue-500' : isWeekly ? 'from-amber-500' : 'from-purple-500';
        const gradientTo = isDaily ? 'to-blue-600' : isWeekly ? 'to-amber-600' : 'to-purple-600';
        const shadowColor = isDaily ? 'shadow-blue-500/20' : isWeekly ? 'shadow-amber-500/20' : 'shadow-purple-500/20';
        const borderColor = isDaily ? 'border-blue-500/20' : isWeekly ? 'border-amber-500/20' : 'border-purple-500/20';
        const bgColor = isDaily ? 'bg-blue-500/5' : isWeekly ? 'bg-amber-500/5' : 'bg-purple-500/5';
        const textColor = isDaily ? 'text-blue-400' : isWeekly ? 'text-amber-400' : 'text-purple-400';
        const hoverBg = isDaily ? 'hover:bg-blue-600' : isWeekly ? 'hover:bg-amber-600' : 'hover:bg-purple-600';
        const borderBtn = isDaily ? 'border-blue-500/20' : isWeekly ? 'border-amber-500/20' : 'border-purple-500/20';

        container.innerHTML += `
            <div class="checklist-card bg-slate-800/40 ${borderColor} rounded-2xl p-5 flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 border">
                <div class="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center">
                            <i class="fa-solid ${icon} ${textColor} text-sm"></i>
                        </div>
                        <h3 class="text-sm font-bold uppercase tracking-wider ${textColor}">${period} Checklist</h3>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] uppercase px-2.5 py-1 rounded-lg font-bold ${bgColor} ${textColor} border ${borderColor}">${data.name}</span>
                        <button onclick="openAddChecklistItemModal('${period}')" class="text-[10px] ${textColor} hover:text-white transition-colors" title="Add Item">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button onclick="deleteChecklist('${period}')" class="text-[10px] text-rose-400 hover:text-rose-300 transition-colors" title="Delete Checklist">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-2 flex-1 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    ${checkItemsHtml}
                </div>

                <div class="mt-4 pt-4 border-t border-slate-700/40 space-y-3">
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-slate-400 font-medium">Progress</span>
                        <span class="font-mono font-bold ${textColor} period-progress-text">0%</span>
                    </div>
                    <div class="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden">
                        <div class="period-progress-bar h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full transition-all duration-500 ${shadowColor}" style="width: 0%"></div>
                    </div>
                    <button onclick="submitChecklist('${period}')" class="w-full ${bgColor} ${hoverBg} ${textColor} hover:text-white font-bold text-xs py-3 rounded-xl transition-all border ${borderBtn} flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                        <i class="fa-solid fa-paper-plane text-[10px]"></i>
                        Submit ${period.charAt(0).toUpperCase() + period.slice(1)} Checklist
                    </button>
                </div>
            </div>
        `;
    });

    // Initialize progress
    updateOverallProgress();
}

// =============================================
// UPDATE PROGRESS
// =============================================
function updateProgress(period, index, checked) {
    checklistStates[period][index] = checked;
    updateOverallProgress();
}

// =============================================
// UPDATE OVERALL PROGRESS
// =============================================
function updateOverallProgress() {
    const periods = ['daily', 'weekly', 'monthly'];
    let totalItems = 0;
    let checkedItems = 0;
    const periodStats = {};

    periods.forEach(period => {
        const periodData = machineData[currentMachine][period];
        const periodTotal = periodData ? periodData.length : 0;
        const periodChecked = Object.values(checklistStates[period]).filter(Boolean).length;
        
        totalItems += periodTotal;
        checkedItems += periodChecked;
        periodStats[period] = periodTotal > 0 ? Math.round((periodChecked / periodTotal) * 100) : 0;
    });

    const overallPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // Update overall progress bar
    const overallProgressBar = document.getElementById('overall-progress-bar');
    const overallProgressText = document.getElementById('overall-progress-text');
    if (overallProgressBar) overallProgressBar.style.width = overallPercent + '%';
    if (overallProgressText) overallProgressText.textContent = overallPercent + '% Complete';

    // Update individual period progress
    const dailyProgress = document.getElementById('daily-progress');
    const weeklyProgress = document.getElementById('weekly-progress');
    const monthlyProgress = document.getElementById('monthly-progress');
    
    if (dailyProgress) dailyProgress.textContent = periodStats.daily + '%';
    if (weeklyProgress) weeklyProgress.textContent = periodStats.weekly + '%';
    if (monthlyProgress) monthlyProgress.textContent = periodStats.monthly + '%';

    // Update period cards progress bars
    document.querySelectorAll('.checklist-card').forEach((card, index) => {
        const period = periods[index];
        const progressBar = card.querySelector('.period-progress-bar');
        const progressText = card.querySelector('.period-progress-text');
        if (progressBar && progressText) {
            progressBar.style.width = periodStats[period] + '%';
            progressText.textContent = periodStats[period] + '%';
        }
    });
}

// =============================================
// SUBMIT CHECKLIST
// =============================================
async function submitChecklist(period) {
    const periodData = machineData[currentMachine][period];
    const totalItems = periodData ? periodData.length : 0;
    const checkedItems = Object.values(checklistStates[period]).filter(Boolean).length;
    
    if (checkedItems === 0) {
        alert(`Please complete at least one item in the ${period} checklist before submitting.`);
        return;
    }

    if (checkedItems < totalItems) {
        const confirmSubmit = confirm(`You have completed ${checkedItems} out of ${totalItems} items. Do you want to submit anyway?`);
        if (!confirmSubmit) return;
    }

    // Get checked item texts
    const checkedItemTexts = [];
    document.querySelectorAll(`.checklist-item[data-period="${period}"]`).forEach((item, idx) => {
        const cb = item.querySelector('.checklist-checkbox');
        if (cb && cb.checked) {
            checkedItemTexts.push(item.querySelector('span').textContent.trim());
        }
    });

    // Insert maintenance log to database
    if (typeof supabase !== 'undefined' && machineData[currentMachine]) {
        // Get current user
        let currentUserId = null;
        let currentUserName = 'Admin User';
        if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
            const currentUser = Auth.getCurrentUser();
            if (currentUser) {
                currentUserId = currentUser.id;
                currentUserName = currentUser.username || currentUser.email || 'Admin User';
            }
        }

        // Fetch the checklist ID from the database
        const { data: checklistData, error: checklistError } = await supabase
            .from('machine_maintenance_checklists')
            .select('id')
            .eq('machine_id', machineData[currentMachine].id)
            .eq('checklist_type', period)
            .maybeSingle();

        if (checklistError) {
            console.error('Error fetching checklist ID:', checklistError);
            alert('Failed to find checklist. Please try again.');
            return;
        }

        if (!checklistData) {
            alert('No checklist found for this machine and period.');
            return;
        }

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('machine_maintenance_logs')
            .insert({
                checklist_id: checklistData.id,
                machine_id: machineData[currentMachine].id,
                performed_by: currentUserId,
                performed_at: now,
                checklist_results: checkedItemTexts || [],
                notes: `${period} checklist submitted for ${machineData[currentMachine].name}`,
                status: checkedItems === totalItems ? 'completed' : 'partial'
            });

        if (error) {
            console.error('Error saving maintenance log:', error);
            alert('Failed to save maintenance log. Please try again.');
            return;
        }

        // Update header displays
        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = new Date(now).toLocaleTimeString('en-US', { hour12: false });
        }
        const operatorEl = document.getElementById('operator-name');
        if (operatorEl) {
            operatorEl.textContent = currentUserName;
        }
    }

    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
    });

    alert(`${period.toUpperCase()} checklist submitted successfully!\n\nMachine: ${machineData[currentMachine].name}\nCompleted: ${checkedItems}/${totalItems} items\nTime: ${timestamp}`);
    
    // Reset checkboxes for this period
    Object.keys(checklistStates[period]).forEach(idx => {
        checklistStates[period][idx] = false;
    });
    
    // Uncheck all checkboxes in this period
    document.querySelectorAll(`.checklist-item[data-period="${period}"] .checklist-checkbox`).forEach(cb => {
        cb.checked = false;
    });
    
    updateOverallProgress();
}

// =============================================
// CRUD: MACHINE MAINTENANCE LOGS
// =============================================

// Fetch logs for a machine
async function fetchMaintenanceLogs(machineId) {
    if (typeof supabase === 'undefined') return [];
    
    const { data, error } = await supabase
        .from('machine_maintenance_logs')
        .select('*')
        .eq('machine_id', machineId)
        .order('performed_at', { ascending: false });

    if (error) {
        console.error('Error fetching maintenance logs:', error);
        return [];
    }

    return data || [];
}

// Show logs modal for current machine
async function showMaintenanceLogs() {
    const machine = machineData[currentMachine];
    if (!machine) return;

    const logs = await fetchMaintenanceLogs(machine.id);
    
    // Fetch user names for performers if we have logs
    let userNames = {};
    if (logs.length > 0 && typeof supabase !== 'undefined') {
        const performerIds = [...new Set(logs.map(l => l.performed_by).filter(Boolean))];
        if (performerIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id, username')
                .in('id', performerIds);
            
            (users || []).forEach(u => {
                userNames[u.id] = u.username || u.email || 'Unknown';
            });
        }
    }
    
    const modal = document.getElementById('machine-logs-modal');
    if (!modal) return;
    
    const logsContainer = document.getElementById('machine-logs-list');
    if (!logsContainer) return;

    const machineNameEl = document.getElementById('machine-logs-title');
    if (machineNameEl) machineNameEl.textContent = `${machine.name} - Maintenance Logs`;

    if (logs.length === 0) {
        logsContainer.innerHTML = '<div class="text-xs text-slate-500 text-center py-8">No maintenance logs found for this machine.</div>';
    } else {
        logsContainer.innerHTML = logs.map(log => `
            <div class="bg-slate-900/80 rounded-xl p-4 border border-slate-700/50">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold ${log.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}">
                        ${log.status === 'completed' ? 'Completed' : 'Partial'}
                    </span>
                    <span class="text-[10px] font-mono text-slate-500">${formatLogDate(log.performed_at)}</span>
                </div>
                <div class="flex items-center gap-2 mb-2">
                    <i class="fa-solid fa-user-circle text-slate-500 text-xs"></i>
                    <span class="text-[11px] text-slate-400">${log.performed_by ? userNames[log.performed_by] || 'Admin User' : 'Admin User'}</span>
                </div>
                <p class="text-xs text-slate-300 mb-2">${log.notes || 'No notes'}</p>
                ${log.checklist_results && log.checklist_results.length > 0 ? `
                    <div class="space-y-1 mt-2 pt-2 border-t border-slate-800">
                        ${log.checklist_results.map(item => `
                            <div class="flex items-center gap-2 text-[11px] text-slate-400">
                                <i class="fa-solid fa-check text-emerald-500 text-[8px]"></i>
                                ${item}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="flex gap-2 mt-3 pt-2 border-t border-slate-800">
                    <button onclick="deleteMaintenanceLog('${log.id}')" class="text-[10px] text-rose-400 hover:text-rose-300 transition-colors">
                        <i class="fa-solid fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

function closeMachineLogsModal() {
    const modal = document.getElementById('machine-logs-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

// Delete a maintenance log
async function deleteMaintenanceLog(logId) {
    if (!confirm('Are you sure you want to delete this maintenance log?')) return;

    const { error } = await supabase
        .from('machine_maintenance_logs')
        .delete()
        .eq('id', logId);

    if (error) {
        console.error('Error deleting maintenance log:', error);
        alert('Failed to delete maintenance log.');
        return;
    }

    showMaintenanceLogs();
}

// =============================================
// CRUD: MACHINES
// =============================================

// Open add machine modal
function openAddMachineModal() {
    const modal = document.getElementById('machine-crud-modal');
    if (!modal) return;
    
    document.getElementById('machine-crud-title').textContent = 'Add New Machine';
    document.getElementById('machine-name').value = '';
    document.getElementById('machine-type').value = '';
    document.getElementById('machine-status').value = 'active';
    modal.removeAttribute('data-editing-id');
    
    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

// Open edit machine modal
async function openEditMachineModal() {
    const machine = machineData[currentMachine];
    if (!machine) return;
    
    const modal = document.getElementById('machine-crud-modal');
    if (!modal) return;
    
    document.getElementById('machine-crud-title').textContent = 'Edit Machine';
    document.getElementById('machine-name').value = machine.name;
    document.getElementById('machine-type').value = machine.machine_type;
    document.getElementById('machine-status').value = 'active';
    modal.setAttribute('data-editing-id', machine.id);
    
    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

// Close machine CRUD modal
function closeMachineCrudModal() {
    const modal = document.getElementById('machine-crud-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

// Save machine (create or update)
async function saveMachine() {
    const name = document.getElementById('machine-name').value.trim();
    const machineType = document.getElementById('machine-type').value.trim();
    const status = document.getElementById('machine-status').value;
    const modal = document.getElementById('machine-crud-modal');
    const editingId = modal ? modal.getAttribute('data-editing-id') : null;

    if (!name || !machineType) {
        alert('Please fill in Machine Name and Machine Type.');
        return;
    }

    if (editingId) {
        // Update
        const { error } = await supabase
            .from('machines')
            .update({ name, machine_type: machineType, status, updated_at: new Date().toISOString() })
            .eq('id', editingId);

        if (error) {
            console.error('Error updating machine:', error);
            alert('Failed to update machine.');
            return;
        }
    } else {
        // Create
        const { error } = await supabase
            .from('machines')
            .insert({ name, machine_type: machineType, status });

        if (error) {
            console.error('Error creating machine:', error);
            alert('Failed to create machine.');
            return;
        }
    }

    closeMachineCrudModal();
    machinesLoaded = false;
    await fetchMachinesAndChecklists();
    
    // Reload current machine tab if it exists
    if (machineData[currentMachine]) {
        switchMachine(currentMachine);
    }
    
    alert(editingId ? 'Machine updated successfully!' : 'Machine added successfully!');
}

// Delete machine
async function deleteMachine() {
    const machine = machineData[currentMachine];
    if (!machine) return;
    
    if (!confirm(`Are you sure you want to delete machine "${machine.name}"? This will also delete its checklists and logs.`)) return;

    const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', machine.id);

    if (error) {
        console.error('Error deleting machine:', error);
        alert('Failed to delete machine.');
        return;
    }

    machinesLoaded = false;
    delete machineData[currentMachine];
    
    // Switch to first available machine
    const firstKey = Object.keys(machineData)[0] || 'cnc';
    currentMachine = firstKey;
    await fetchMachinesAndChecklists();
    switchMachine(firstKey);
    
    alert('Machine deleted successfully!');
}

// =============================================
// CRUD: MACHINE MAINTENANCE CHECKLISTS
// =============================================

// Open add checklist item modal
function openAddChecklistItemModal(period) {
    const modal = document.getElementById('checklist-item-modal');
    if (!modal) return;
    
    document.getElementById('checklist-item-title').textContent = `Add ${period.charAt(0).toUpperCase() + period.slice(1)} Checklist Item`;
    document.getElementById('checklist-item-text').value = '';
    document.getElementById('checklist-item-period').value = period;
    modal.removeAttribute('data-editing-id');
    
    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

// Open edit checklist item modal
function openEditChecklistItemModal(period, index) {
    const machine = machineData[currentMachine];
    if (!machine) return;
    
    const items = machine[period] || [];
    const itemText = items[index];
    if (!itemText) return;
    
    const modal = document.getElementById('checklist-item-modal');
    if (!modal) return;
    
    document.getElementById('checklist-item-title').textContent = `Edit ${period.charAt(0).toUpperCase() + period.slice(1)} Checklist Item`;
    document.getElementById('checklist-item-text').value = itemText;
    document.getElementById('checklist-item-period').value = period;
    modal.setAttribute('data-editing-id', index);
    
    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

// Close checklist item modal
function closeChecklistItemModal() {
    const modal = document.getElementById('checklist-item-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

// Save checklist item (create or update)
async function saveChecklistItem() {
    const period = document.getElementById('checklist-item-period').value;
    const itemText = document.getElementById('checklist-item-text').value.trim();
    const modal = document.getElementById('checklist-item-modal');
    const editingIndex = modal ? modal.getAttribute('data-editing-id') : null;
    const machine = machineData[currentMachine];
    
    if (!itemText || !machine) return;

    // Get machine's checklist id from database
    const { data: checklist, error: fetchError } = await supabase
        .from('machine_maintenance_checklists')
        .select('id, checklist_items')
        .eq('machine_id', machine.id)
        .eq('checklist_type', period)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching checklist:', fetchError);
        return;
    }

    let items = [];
    if (editingIndex !== null) {
        // Edit existing item
        items = [...(machine[period] || [])];
        items[parseInt(editingIndex)] = itemText;
    } else {
        // Add new item
        items = [...(machine[period] || []), itemText];
    }

    if (checklist) {
        // Update existing checklist
        const { error } = await supabase
            .from('machine_maintenance_checklists')
            .update({ 
                checklist_items: items, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', checklist.id);

        if (error) {
            console.error('Error updating checklist:', error);
            alert('Failed to save checklist item.');
            return;
        }
    } else {
        // Create new checklist
        const { error } = await supabase
            .from('machine_maintenance_checklists')
            .insert({
                machine_id: machine.id,
                checklist_type: period,
                checklist_name: `${machine.name} ${period.charAt(0).toUpperCase() + period.slice(1)} Checklist`,
                checklist_items: items
            });

        if (error) {
            console.error('Error creating checklist:', error);
            alert('Failed to save checklist item.');
            return;
        }
    }

    // Refresh data behind the modal
    machinesLoaded = false;
    await fetchMachinesAndChecklists();
    switchMachine(currentMachine);

    if (editingIndex !== null) {
        // Editing mode: close the modal
        closeChecklistItemModal();
    } else {
        // Add mode: keep modal open to allow adding more items
        document.getElementById('checklist-item-text').value = '';
        document.getElementById('checklist-item-text').focus();
    }
}

// Delete checklist item
async function deleteChecklistItem(period, index) {
    const machine = machineData[currentMachine];
    if (!machine) return;
    
    if (!confirm('Are you sure you want to delete this checklist item?')) return;

    const items = [...(machine[period] || [])];
    items.splice(index, 1);

    const { data: checklist, error: fetchError } = await supabase
        .from('machine_maintenance_checklists')
        .select('id')
        .eq('machine_id', machine.id)
        .eq('checklist_type', period)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching checklist:', fetchError);
        return;
    }

    if (checklist) {
        const { error } = await supabase
            .from('machine_maintenance_checklists')
            .update({ 
                checklist_items: items, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', checklist.id);

        if (error) {
            console.error('Error deleting checklist item:', error);
            alert('Failed to delete checklist item.');
            return;
        }
    }

    machinesLoaded = false;
    await fetchMachinesAndChecklists();
    switchMachine(currentMachine);
}

// Delete entire checklist for a period
async function deleteChecklist(period) {
    const machine = machineData[currentMachine];
    if (!machine) return;
    
    if (!confirm(`Are you sure you want to delete the entire ${period} checklist for "${machine.name}"?`)) return;

    const { data: checklist, error: fetchError } = await supabase
        .from('machine_maintenance_checklists')
        .select('id')
        .eq('machine_id', machine.id)
        .eq('checklist_type', period)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching checklist:', fetchError);
        return;
    }

    if (checklist) {
        const { error } = await supabase
            .from('machine_maintenance_checklists')
            .delete()
            .eq('id', checklist.id);

        if (error) {
            console.error('Error deleting checklist:', error);
            alert('Failed to delete checklist.');
            return;
        }
    }

    machinesLoaded = false;
    await fetchMachinesAndChecklists();
    switchMachine(currentMachine);
    
    alert(`${period.charAt(0).toUpperCase() + period.slice(1)} checklist deleted successfully!`);
}

// Helper to format log date
function formatLogDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// =============================================
// CRUD: MACHINE OPERATOR ASSIGNMENTS
// =============================================

// Open assign user modal
async function openAssignUserModal() {
    const machine = machineData[currentMachine];
    if (!machine) {
        alert('Please select a machine first.');
        return;
    }

    const modal = document.getElementById('assign-user-modal');
    if (!modal) return;

    const titleEl = document.getElementById('assign-user-title');
    if (titleEl) titleEl.textContent = `Assign Operators - ${machine.name}`;

    modal.classList.add('open');
    document.body.classList.add('modal-open');

    await Promise.all([loadAssignableUsers(), loadAssignedUsers()]);
}

function closeAssignUserModal() {
    const modal = document.getElementById('assign-user-modal');
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

// Fetch already-assigned user ids for the current machine
async function fetchAssignedUserIds() {
    const machine = machineData[currentMachine];
    if (!machine || typeof supabase === 'undefined') return new Set();

    const { data, error } = await supabase
        .from('machine_operator_users')
        .select('user_id')
        .eq('machine_id', machine.id);

    if (error || !data) return new Set();
    return new Set(data.map(a => a.user_id));
}

// Load users eligible for assignment (machine_operator / admin_machine_operator)
async function loadAssignableUsers() {
    const select = document.getElementById('assign-user-select');
    if (!select) return;

    if (typeof supabase === 'undefined') {
        select.innerHTML = '<option value="">Supabase not available</option>';
        return;
    }

    const assigned = await fetchAssignedUserIds();

    const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role')
        .in('role', ['machine_operator', 'admin_machine_operator'])
        .order('username', { ascending: true });

    if (error) {
        console.error('Error fetching assignable users:', error);
        select.innerHTML = '<option value="">Failed to load users</option>';
        return;
    }

    const available = (data || []).filter(u => !assigned.has(u.id));

    if (available.length === 0) {
        select.innerHTML = '<option value="">No unassigned operators available</option>';
        return;
    }

    select.innerHTML = '<option value="">Select an operator...</option>' + available.map(u =>
        `<option value="${u.id}">${(u.username || u.email || 'Unknown')}${u.role === 'admin_machine_operator' ? ' (Admin)' : ''}</option>`
    ).join('');
}

// Load and render assigned users for the current machine
async function loadAssignedUsers() {
    const container = document.getElementById('assigned-users-list');
    if (!container) return;

    const machine = machineData[currentMachine];
    if (!machine) return;

    if (typeof supabase === 'undefined') {
        container.innerHTML = '<div class="text-xs text-slate-500 text-center py-6">Supabase not available</div>';
        return;
    }

    const { data, error } = await supabase
        .from('machine_operator_users')
        .select('id, user_id, users(id, username, email, role)')
        .eq('machine_id', machine.id);

    if (error) {
        console.error('Error fetching assigned users:', error);
        container.innerHTML = '<div class="text-xs text-rose-400 text-center py-6">Failed to load assigned users</div>';
        return;
    }

    const assignments = data || [];

    if (assignments.length === 0) {
        container.innerHTML = '<div class="text-xs text-slate-500 text-center py-6">No users assigned to this machine yet.</div>';
        return;
    }

    container.innerHTML = assignments.map(a => {
        const user = a.users || {};
        const name = user.username || user.email || 'Unknown user';
        const roleLabel = user.role === 'admin_machine_operator' ? 'Admin' : 'Operator';
        const roleColor = user.role === 'admin_machine_operator' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20';
        return `
            <div class="bg-slate-900/80 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-user text-slate-300 text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-200 truncate">${name}</p>
                        <p class="text-[10px] text-slate-500 truncate">${user.email || ''}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="text-[10px] uppercase px-2.5 py-1 rounded-lg font-bold border ${roleColor}">${roleLabel}</span>
                    <button onclick="unassignUserFromMachine('${a.id}')" class="text-rose-400 hover:text-rose-300 transition-colors text-sm p-1" title="Remove user">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Assign selected user to current machine
async function assignUserToMachine() {
    const machine = machineData[currentMachine];
    if (!machine) {
        alert('Please select a machine first.');
        return;
    }

    const select = document.getElementById('assign-user-select');
    const userId = select ? select.value : '';
    if (!userId) {
        alert('Please select a user to assign.');
        return;
    }

    const { error } = await supabase
        .from('machine_operator_users')
        .insert({ machine_id: machine.id, user_id: userId });

    if (error) {
        console.error('Error assigning user:', error);
        alert('Failed to assign user. They may already be assigned.');
        return;
    }

    await Promise.all([loadAssignableUsers(), loadAssignedUsers()]);
}

// Remove user assignment
async function unassignUserFromMachine(assignmentId) {
    if (!confirm('Are you sure you want to remove this user from the machine?')) return;

    const { error } = await supabase
        .from('machine_operator_users')
        .delete()
        .eq('id', assignmentId);

    if (error) {
        console.error('Error removing user assignment:', error);
        alert('Failed to remove user.');
        return;
    }

    await Promise.all([loadAssignableUsers(), loadAssignedUsers()]);
}
