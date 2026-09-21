// =============================================
// REPORTS MODULE
// =============================================



// =============================================
// BUILD REPORT DATA FROM ALL MODULES
// =============================================
async function getReportData() {
    const records = [];

    // Ensure data is fetched from Supabase
    if (typeof fetchReceivedOrders === 'function') {
        await fetchReceivedOrders();
    }
    if (typeof fetchCompletedOrders === 'function') {
        await fetchCompletedOrders();
    }
    if (typeof fetchReworkRecords === 'function') {
        await fetchReworkRecords();
    }
    if (typeof fetchDeliveries === 'function') {
        await fetchDeliveries();
    }
    if (typeof fetchInstallations === 'function') {
        await fetchInstallations();
    }
    if (typeof loadInventoryItems === 'function') {
        await loadInventoryItems();
    }
    if (typeof loadInventoryMovements === 'function') {
        await loadInventoryMovements();
    }

    // Add received orders
    ordersData.forEach(order => {
        const orderDate = order.order_date ? new Date(order.order_date) : null;
        const formattedDate = orderDate ? orderDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }) : '-';
        records.push({
            module: 'received-orders',
            moduleLabel: 'Received Order',
            order_date: formattedDate,
            job_no: order.jobNum || order.orderNum || '-',
            required_date: order.required_date || '-',
            priority: order.priority || 'Medium',
            total_amount: order.total_amount || '-',
            paid_amount: order.paid_amount || '-',
            status: order.status || 'New',
            statusColor: order.status === 'Completed' ? 'text-emerald-400' : order.status === 'In Progress' ? 'text-amber-400' : 'text-slate-400',
            statusBg: order.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20' : order.status === 'In Progress' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-700/60 border-slate-600/40'
        });
    });

    // Add completed orders
    // Fetch machines to get machine names
    let completedMachineNames = {};
    const completedMachineIds = [...new Set(completedOrdersData.map(o => o.machine_id).filter(Boolean))];
    if (completedMachineIds.length > 0 && typeof supabase !== 'undefined') {
        try {
            const { data: machines } = await supabase
                .from('machines')
                .select('id, name')
                .in('id', completedMachineIds);
            
            (machines || []).forEach(m => {
                completedMachineNames[m.id] = m.name || 'Unknown Machine';
            });
        } catch (error) {
            console.error('Error fetching machines:', error);
        }
    }

    completedOrdersData.forEach(order => {
        const completedDate = order.completed_at ? new Date(order.completed_at) : null;
        const formattedDate = completedDate ? completedDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }) : '-';
        const machineName = order.machine_id ? (completedMachineNames[order.machine_id] || 'Unknown Machine') : '-';
        records.push({
            module: 'completed-orders',
            moduleLabel: 'Completed Order',
            completed_at: formattedDate,
            task_type: order.task_type || '-',
            machine_id: machineName,
            material: order.material || '-',
            quality_status: order.quality_status || '-',
            priority: order.priority || 'Medium',
            status: order.status || 'Completed',
            statusColor: 'text-emerald-400',
            statusBg: 'bg-emerald-500/10 border-emerald-500/20'
        });
    });

    // Add rework records
    if (typeof reworkData !== 'undefined' && reworkData.length > 0) {
        // Fetch machines to get machine names
        let machineNames = {};
        const machineIds = [...new Set(reworkData.map(r => r.machine_id).filter(Boolean))];
        if (machineIds.length > 0 && typeof supabase !== 'undefined') {
            try {
                const { data: machines } = await supabase
                    .from('machines')
                    .select('id, name')
                    .in('id', machineIds);
                
                (machines || []).forEach(m => {
                    machineNames[m.id] = m.name || 'Unknown Machine';
                });
            } catch (error) {
                console.error('Error fetching machines:', error);
            }
        }

        reworkData.forEach(entry => {
            const createdDate = entry.created_at ? new Date(entry.created_at) : null;
            const formattedDate = createdDate ? createdDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            const machineName = entry.machine_id ? (machineNames[entry.machine_id] || 'Unknown Machine') : '-';
            records.push({
                module: 'rework',
                moduleLabel: 'Rework Recording',
                created_at: formattedDate,
                task_type: entry.task_type || '-',
                machine_id: machineName,
                material: entry.material || '-',
                quality_status: entry.quality_status || '-',
                priority: entry.priority || 'Medium',
                status: entry.status || 'New',
                statusColor: entry.status === 'completed' ? 'text-emerald-400' : entry.status === 'In Progress' ? 'text-amber-400' : 'text-slate-400',
                statusBg: entry.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : entry.status === 'In Progress' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-700/60 border-slate-600/40'
            });
        });
    }

    // Add machine maintenance logs from Supabase
    if (typeof supabase !== 'undefined') {
        try {
            const { data: logs, error } = await supabase
                .from('machine_maintenance_logs')
                .select('*, machine:machines(name, machine_type), performed_by_user:users(username)')
                .order('performed_at', { ascending: false });

            if (!error && logs && logs.length > 0) {
                // Fetch user names for performers
                const performerIds = [...new Set(logs.map(l => l.performed_by).filter(Boolean))];
                let userNames = {};
                if (performerIds.length > 0) {
                    const { data: users } = await supabase
                        .from('users')
                        .select('id, username')
                        .in('id', performerIds);
                    
                    (users || []).forEach(u => {
                        userNames[u.id] = u.username || u.email || 'Unknown';
                    });
                }

                logs.forEach(log => {
                    const logDate = log.performed_at ? new Date(log.performed_at) : null;
                    const formattedDate = logDate ? logDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    }) : '-';
                    const createdDate = log.created_at ? new Date(log.created_at) : null;
                    const formattedCreated = createdDate ? createdDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    }) : '-';

                    const machineName = log.machine?.name || 'Unknown Machine';
                    const performerName = log.performed_by ? (userNames[log.performed_by] || 'Unknown') : 'System';

                    records.push({
                        module: 'machine-maintenance',
                        moduleLabel: 'Machine Maintenance Logs',
                        performed_at: formattedDate,
                        machine_id: log.machine_id?.substring(0, 8).toUpperCase() || '-',
                        checklist_id: log.checklist_id?.substring(0, 8).toUpperCase() || '-',
                        performed_by: performerName,
                        status: log.status === 'completed' ? 'Completed' : log.status === 'partial' ? 'Partial' : 'Pending',
                        statusColor: log.status === 'completed' ? 'text-emerald-400' : log.status === 'partial' ? 'text-amber-400' : 'text-slate-400',
                        statusBg: log.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : log.status === 'partial' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-700/60 border-slate-600/40',
                        notes: log.notes || '-',
                        created_at: formattedCreated
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching machine maintenance logs:', error);
        }
    }

    // Add delivery records from Supabase
    if (typeof deliveriesData !== 'undefined' && deliveriesData.length > 0) {
        deliveriesData.forEach(entry => {
            const scheduledDate = entry.scheduled_date ? new Date(entry.scheduled_date) : null;
            const formattedDate = scheduledDate ? scheduledDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            const actualDate = entry.actual_delivery_time ? new Date(entry.actual_delivery_time) : null;
            const formattedActual = actualDate ? actualDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            records.push({
                module: 'delivery',
                moduleLabel: 'Delivery',
                scheduled_date: formattedDate,
                delivery_no: entry.delivery_no || '-',
                delivery_address: entry.delivery_address || '-',
                contact_person: entry.contact_person || '-',
                vehicle_driver: entry.vehicle_driver || '-',
                actual_delivery_time: formattedActual,
                status: entry.status || 'Pending',
                statusColor: entry.status === 'Delivered' ? 'text-emerald-400' : entry.status === 'In Transit' ? 'text-amber-400' : 'text-slate-400',
                statusBg: entry.status === 'Delivered' ? 'bg-emerald-500/10 border-emerald-500/20' : entry.status === 'In Transit' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-700/60 border-slate-600/40'
            });
        });
    }

    // Add installation records from Supabase
    if (typeof installationsData !== 'undefined' && installationsData.length > 0) {
        installationsData.forEach(entry => {
            const scheduledDate = entry.scheduled_date ? new Date(entry.scheduled_date) : null;
            const formattedDate = scheduledDate ? scheduledDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            const completionDate = entry.completion_time ? new Date(entry.completion_time) : null;
            const formattedCompletion = completionDate ? completionDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            records.push({
                module: 'installation',
                moduleLabel: 'Installation',
                scheduled_date: formattedDate,
                installation_no: entry.installation_no || '-',
                site_address: entry.site_address || '-',
                contact_person: entry.contact_person || '-',
                team: entry.team || '-',
                completion_time: formattedCompletion,
                status: entry.status || 'Scheduled',
                statusColor: entry.status === 'Completed' ? 'text-emerald-400' : entry.status === 'In Progress' ? 'text-amber-400' : 'text-slate-400',
                statusBg: entry.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20' : entry.status === 'In Progress' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-700/60 border-slate-600/40'
            });
        });
    }

    // Add inventory records from Supabase
    if (typeof inventoryItems !== 'undefined' && inventoryItems.length > 0) {
        inventoryItems.forEach(entry => {
            const createdDate = entry.created_at ? new Date(entry.created_at) : null;
            const formattedDate = createdDate ? createdDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            const updatedDate = entry.updated_at ? new Date(entry.updated_at) : null;
            const formattedUpdated = updatedDate ? updatedDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            records.push({
                module: 'inventory',
                moduleLabel: 'Inventory',
                created_at: formattedDate,
                id: entry.id?.substring(0, 8).toUpperCase() || '-',
                name: entry.name || '-',
                pcs: entry.pcs || '-',
                kilo: entry.kilo || '-',
                meter: entry.meter || '-',
                updated_at: formattedUpdated,
                status: 'In Stock',
                statusColor: 'text-emerald-400',
                statusBg: 'bg-emerald-500/10 border-emerald-500/20'
            });
        });
    }

    // Add stock movement records from Supabase
    if (typeof inventoryMovements !== 'undefined' && inventoryMovements.length > 0) {
        inventoryMovements.forEach(entry => {
            const createdDate = entry.created_at ? new Date(entry.created_at) : null;
            const formattedDate = createdDate ? createdDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            }) : '-';
            records.push({
                module: 'stock-movement',
                moduleLabel: 'Stock Movement',
                created_at: formattedDate,
                id: entry.id?.substring(0, 8).toUpperCase() || '-',
                movement_type: entry.movement_type || '-',
                item_id: entry.item_id?.substring(0, 8).toUpperCase() || '-',
                quantity: entry.quantity || '-',
                location: entry.location || '-',
                status: 'Completed',
                statusColor: 'text-emerald-400',
                statusBg: 'bg-emerald-500/10 border-emerald-500/20'
            });
        });
    }

    return records;
}

// =============================================
// DATE PARSING UTILITIES
// =============================================
function parseReportDate(dateStr) {
    if (!dateStr || dateStr === '-') return null;
    // Try DD/MM/YY format
    const parts1 = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (parts1) {
        return new Date('20' + parts1[3], parts1[1] - 1, parts1[2]);
    }
    // Try YYYY-MM-DD format
    const parts2 = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (parts2) {
        return new Date(parts2[1], parts2[2] - 1, parts2[3]);
    }
    return null;
}

function formatDateForCompare(dateStr) {
    const d = parseReportDate(dateStr);
    if (!d) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// =============================================
// RENDER TABLE HEADER
// =============================================
function renderReportHeader(columns) {
    return columns.map(col => `<th class="p-4 ${col.cls}">${col.label}</th>`).join('');
}

// =============================================
// COLUMN VISIBILITY FUNCTIONS
// =============================================
function renderColumnChecklist() {
    // This function is deprecated - column visibility is now per-table
    // Kept for backward compatibility but does nothing
    const container = document.getElementById('report-column-checklist');
    if (!container) return; // Exit if container doesn't exist
    
    const selectedModules = getSelectedModules();
    const columns = getMergedColumnConfig(selectedModules);
    container.innerHTML = '';
    
    columns.forEach(col => {
        if (col.key === '__src__') return;
        const isVisible = columnVisibility[col.key] !== false;
        const icon = isVisible ? 'fa-eye' : 'fa-eye-slash';
        const iconColor = isVisible ? 'text-emerald-400' : 'text-slate-500';
        const badgeCls = isVisible ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-slate-700/30 text-slate-500 border-slate-600/20';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${badgeCls}`;
        btn.innerHTML = `<i class="fa-solid ${icon} text-[10px] ${iconColor}"></i> ${col.label}`;
        btn.onclick = () => toggleColumnVisibility(col.key);
        container.appendChild(btn);
    });

    // Update toggle all button state
    const allVisible = columns.every(col => col.key === '__src__' || columnVisibility[col.key] !== false);
    const toggleIcon = document.getElementById('report-column-toggle-all-icon');
    const toggleText = document.getElementById('report-column-toggle-all-text');
    if (toggleIcon && toggleText) {
        if (allVisible) {
            toggleIcon.className = 'fa-solid fa-eye';
            toggleText.textContent = 'Show All';
        } else {
            toggleIcon.className = 'fa-solid fa-eye-slash';
            toggleText.textContent = 'Hide All';
        }
    }
}

function toggleColumnVisibility(colKey) {
    columnVisibility[colKey] = columnVisibility[colKey] === false ? true : false;
    renderColumnChecklist();
    filterReports();
}

function toggleAllColumns() {
    const selectedModules = getSelectedModules();
    const columns = getMergedColumnConfig(selectedModules);
    const allVisible = columns.every(col => col.key === '__src__' || columnVisibility[col.key] !== false);
    columns.forEach(col => {
        if (col.key !== '__src__') {
            columnVisibility[col.key] = !allVisible;
        }
    });
    const icon = document.getElementById('report-column-toggle-all-icon');
    const text = document.getElementById('report-column-toggle-all-text');
    if (allVisible) {
        icon.className = 'fa-solid fa-eye-slash';
        text.textContent = 'Show All';
    } else {
        icon.className = 'fa-solid fa-eye';
        text.textContent = 'Hide All';
    }
    renderColumnChecklist();
    filterReports();
}

function getVisibleColumns(columns) {
    return columns.filter(col => col.key === '__src__' || columnVisibility[col.key] !== false);
}

function getMergedColumnConfig(selectedModules) {
    if (selectedModules.length === 0) return [];
    const merged = [];
    selectedModules.forEach(mod => {
        const cols = reportColumnConfigs[mod] || [];
        merged.push({ key: '__src__', label: moduleLabels[mod] || mod, cls: 'text-center w-16', isSource: true, moduleKey: mod });
        cols.forEach(col => {
            merged.push(col);
        });
    });
    return merged;
}

// =============================================
// FILTER AND RENDER REPORTS
// =============================================
async function filterReports() {
    const selectedModules = getSelectedModules();
    const searchVal = document.getElementById('report-search').value.toLowerCase();
    const dateFrom = document.getElementById('report-date-from').value;
    const dateTo = document.getElementById('report-date-to').value;
    const noResults = document.getElementById('report-no-results');

    // Render column checklist
    renderColumnChecklist();
    const clearBtn = document.getElementById('report-search-clear');
    const filterCount = document.getElementById('report-filter-count');
    const activeModule = document.getElementById('report-active-module');

    // Show/hide clear button
    if (searchVal.length > 0) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }

    // Update active module label
    if (selectedModules.length === 0) {
        activeModule.textContent = 'None';
    } else {
        activeModule.textContent = selectedModules.map(m => moduleLabels[m] || m).join(', ');
    }

    // If no modules selected, show no results
    if (selectedModules.length === 0) {
        const tablesContainer = document.getElementById('report-tables-container');
        if (tablesContainer) tablesContainer.innerHTML = '';
        noResults.classList.remove('hidden');
        filterCount.textContent = '0';
        await updateReportStats();
        return;
    }

    // Get merged columns and filter by visibility
    const allColumns = getMergedColumnConfig(selectedModules);
    const columns = getVisibleColumns(allColumns);

    if (columns.length === 0) {
        const tablesContainer = document.getElementById('report-tables-container');
        if (tablesContainer) tablesContainer.innerHTML = '';
        noResults.classList.remove('hidden');
        filterCount.textContent = '0';
        await updateReportStats();
        return;
    }

    // Get all records
    const allRecords = await getReportData();
    let filtered = allRecords;

    // Apply multi-module filter
    if (selectedModules.length > 0) {
        filtered = filtered.filter(r => selectedModules.includes(r.module));
    }

    // Apply search filter
    if (searchVal) {
        filtered = filtered.filter(r =>
            (r.title + ' ' + r.orderNum + ' ' + r.designer + ' ' + r.material + ' ' + r.machine + ' ' + r.status).toLowerCase().includes(searchVal)
        );
    }

    // Apply date range filter
    if (dateFrom) {
        filtered = filtered.filter(r => {
            const d = formatDateForCompare(r.date);
            return d && d >= dateFrom;
        });
    }
    if (dateTo) {
        filtered = filtered.filter(r => {
            const d = formatDateForCompare(r.date);
            return d && d <= dateTo;
        });
    }

    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
        filterCount.textContent = '0';
        await updateReportStats();
        return;
    }

    noResults.classList.add('hidden');
    filterCount.textContent = filtered.length;

    // Render separate tables for each selected module
    const tablesContainer = document.getElementById('report-tables-container');
    tablesContainer.innerHTML = '';

    selectedModules.forEach(module => {
        const moduleRecords = filtered.filter(r => r.module === module);

        const moduleColumns = getMergedColumnConfig([module]);
        const visibleColumns = getVisibleColumns(moduleColumns);
        const allColumns = moduleColumns.filter(col => col.key !== '__src__' && col.key !== 'no');

        // Get or initialize table state
        const tableSearch = tableSearchQueries[module] || '';
        const currentPage = tableCurrentPages[module] || 1;
        
        // Apply per-table search filter
        let tableFiltered = moduleRecords;
        if (tableSearch) {
            tableFiltered = moduleRecords.filter(r => 
                visibleColumns.some(col => {
                    if (col.key === 'no' || col.key === '__src__') return false;
                    let value = r[col.key] || '-';
                    return String(value).toLowerCase().includes(tableSearch.toLowerCase());
                })
            );
        }

        // Pagination
        const totalPages = Math.ceil(tableFiltered.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedRecords = tableFiltered.slice(startIndex, endIndex);

        // Create table wrapper
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl mb-6';

        // Create table header with module name and controls
        const tableHeader = document.createElement('div');
        tableHeader.className = 'p-4 border-b border-slate-700/50 bg-slate-800/80';
        tableHeader.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-table text-violet-400"></i>
                    ${moduleLabels[module] || module}
                    <span class="text-xs text-slate-400 font-normal">(${tableFiltered.length} records)</span>
                </h3>
            </div>
            <div class="flex gap-3 items-center">
                <div class="flex-1">
                    <input type="text" 
                           placeholder="Search ${moduleLabels[module]}..." 
                           value="${tableSearch}"
                           oninput="updateTableSearch('${module}', this.value)"
                           class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 placeholder-slate-500">
                </div>
                <div class="flex flex-wrap gap-2">
                    ${allColumns.map(col => {
                        const visibilityKey = module + '_' + col.key;
                        const isVisible = columnVisibility[visibilityKey] !== false;
                        return `
                        <button type="button" 
                                onclick="toggleTableColumn('${module}', '${col.key}')"
                                class="flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-colors ${
                                    isVisible
                                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800'
                                }">
                            <i class="fa-solid ${isVisible ? 'fa-eye' : 'fa-eye-slash'} text-[10px]"></i>
                            <span>${col.label}</span>
                        </button>
                    `}).join('')}
                </div>
            </div>
        `;
        tableWrapper.appendChild(tableHeader);

        // Create table
        const tableDiv = document.createElement('div');
        tableDiv.className = 'table-wrapper max-h-[400px] overflow-y-auto';

        const table = document.createElement('table');
        table.className = 'w-full text-left border-collapse min-w-[700px]';

        // Table head
        const thead = document.createElement('thead');
        thead.className = 'bg-slate-800/80 border-b border-slate-700/60 text-xs font-semibold text-slate-300 uppercase tracking-wider sticky top-0 z-10';
        const theadRow = document.createElement('tr');
        theadRow.innerHTML = renderReportHeader(visibleColumns);
        thead.appendChild(theadRow);
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        tbody.className = 'divide-y divide-slate-800 text-sm text-slate-300';

        paginatedRecords.forEach((record, index) => {
            const row = document.createElement('tr');
            row.className = 'order-row hover:bg-violet-600/10 transition-colors';

            visibleColumns.forEach(col => {
                let value = record[col.key] || '-';
                let cellCls = 'p-4';
                if (col.cls) cellCls += ' ' + col.cls;

                const cell = document.createElement('td');
                cell.className = cellCls;

                if (col.key === '__src__') {
                    cell.innerHTML = `<span class="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded border border-violet-500/20 font-medium">${value}</span>`;
                } else if (col.key === 'no') {
                    cell.textContent = String(startIndex + index + 1).padStart(2, '0') + ' -';
                    cell.classList.add('font-mono', 'font-medium', 'text-slate-400');
                } else if (col.key === 'status') {
                    cell.innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${record.statusBg} ${record.statusColor} border">${value}</span>`;
                } else {
                    cell.textContent = value;
                    if (col.key === 'date') {
                        cell.classList.add('font-mono', 'text-xs');
                    } else {
                        cell.classList.add('text-xs', 'text-slate-300');
                    }
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableDiv.appendChild(table);
        tableWrapper.appendChild(tableDiv);

        // Add pagination controls
        if (totalPages > 1 || tableFiltered.length > 0) {
            const paginationDiv = document.createElement('div');
            paginationDiv.className = 'p-4 border-t border-slate-700/50 bg-slate-800/80 flex justify-between items-center';
            paginationDiv.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="text-xs text-slate-400">
                        Page ${currentPage} of ${totalPages} (${tableFiltered.length} total)
                    </div>
                    <select onchange="changeTableItemsPerPage('${module}', this.value)" 
                            class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-violet-500">
                        <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                        <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                        <option value="25" ${itemsPerPage === 25 ? 'selected' : ''}>25</option>
                        <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                    </select>
                </div>
                <div class="flex gap-2">
                    <button type="button" 
                            onclick="changeTablePage('${module}', ${currentPage - 1})"
                            ${currentPage === 1 ? 'disabled' : ''}
                            class="px-3 py-1 rounded border border-slate-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
                        Previous
                    </button>
                    <div class="flex gap-1">
                        ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return `<button type="button" 
                                            onclick="changeTablePage('${module}', ${pageNum})"
                                            class="px-3 py-1 rounded border text-xs cursor-pointer transition-colors ${
                                                currentPage === pageNum
                                                    ? 'bg-violet-600 text-white border-violet-600'
                                                    : 'border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white'
                                            }">
                                        ${pageNum}
                                    </button>`;
                        }).join('')}
                    </div>
                    <button type="button" 
                            onclick="changeTablePage('${module}', ${currentPage + 1})"
                            ${currentPage === totalPages ? 'disabled' : ''}
                            class="px-3 py-1 rounded border border-slate-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
                        Next
                    </button>
                </div>
            `;
            tableWrapper.appendChild(paginationDiv);
        }

        tablesContainer.appendChild(tableWrapper);
    });

    await updateReportStats();
}

// =============================================
// UPDATE REPORT STATS
// =============================================
async function updateReportStats() {
    const allRecords = await getReportData();
    const total = allRecords.length;
    const received = allRecords.filter(r => r.module === 'received-orders').length;
    const completed = allRecords.filter(r => r.module === 'completed-orders').length;
    const rework = allRecords.filter(r => r.module === 'rework').length;
    const maintenance = allRecords.filter(r => r.module === 'machine-maintenance').length;
    const delivery = allRecords.filter(r => r.module === 'delivery').length;
    const installation = allRecords.filter(r => r.module === 'installation').length;
    const inventory = allRecords.filter(r => r.module === 'inventory').length;
    const stockMovement = allRecords.filter(r => r.module === 'stock-movement').length;

    const totalEl = document.getElementById('report-stats-total');
    const receivedEl = document.getElementById('report-stats-received');
    const completedEl = document.getElementById('report-stats-completed');
    const reworkEl = document.getElementById('report-stats-rework');
    const maintenanceEl = document.getElementById('report-stats-maintenance');
    
    if (totalEl) totalEl.textContent = total;
    if (receivedEl) receivedEl.textContent = received;
    if (completedEl) completedEl.textContent = completed;
    if (reworkEl) reworkEl.textContent = rework;
    if (maintenanceEl) maintenanceEl.textContent = maintenance;
}

// =============================================
// CLEAR AND RESET FILTERS
// =============================================
function clearReportSearch() {
    const searchInput = document.getElementById('report-search');
    const clearBtn = document.getElementById('report-search-clear');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    filterReports();
}

function resetReportFilters() {
    const search = document.getElementById('report-search');
    const dateFrom = document.getElementById('report-date-from');
    const dateTo = document.getElementById('report-date-to');
    const clearBtn = document.getElementById('report-search-clear');
    
    if (search) search.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    
    document.querySelectorAll('.module-checkbox').forEach(cb => cb.checked = false);
    filterReports();
}

// =============================================
// EXPORT REPORT TO PDF
// =============================================
async function exportReportPDF() {
    const selectedModules = getSelectedModules();
    if (selectedModules.length === 0) {
        alert('No modules selected. Please select at least one module to export.');
        return;
    }

    const dateFrom = document.getElementById('report-date-from').value;
    const dateTo = document.getElementById('report-date-to').value;

    // Get all filtered data
    const allRecords = await getReportData();
    const searchVal = document.getElementById('report-search').value.toLowerCase();
    let filtered = allRecords;

    // Apply filters (same as filterReports)
    if (selectedModules.length > 0) {
        filtered = filtered.filter(r => selectedModules.includes(r.module));
    }
    if (searchVal) {
        filtered = filtered.filter(r =>
            (r.title + ' ' + r.orderNum + ' ' + r.designer + ' ' + r.material + ' ' + r.machine + ' ' + r.status).toLowerCase().includes(searchVal)
        );
    }
    if (dateFrom) {
        filtered = filtered.filter(r => {
            const d = formatDateForCompare(r.date);
            return d && d >= dateFrom;
        });
    }
    if (dateTo) {
        filtered = filtered.filter(r => {
            const d = formatDateForCompare(r.date);
            return d && d <= dateTo;
        });
    }

    if (filtered.length === 0) {
        alert('No data available to export. Please adjust your filters.');
        return;
    }

    let moduleName = selectedModules.map(m => moduleLabels[m] || m).join(', ');

    // Use jsPDF directly for left/right split layout
    try {
        // jsPDF is loaded via CDN as UMD module
        const jsPDFLib = window.jspdf.jsPDF;
        const doc = new jsPDFLib();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const leftMargin = 15;
        const rightMargin = pageWidth / 2 + 10;
        const lineHeight = 7;
        let y = 20;

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Report', pageWidth / 2, y, { align: 'center' });
        y += 10;

        // Date range
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('From: ' + dateFrom + '  To: ' + dateTo, pageWidth / 2, y, { align: 'center' });
        y += 10;

        // Process each selected module
        selectedModules.forEach((module, moduleIndex) => {
            const moduleRecords = filtered.filter(r => r.module === module);
            if (moduleRecords.length === 0) return;

            const moduleColumns = getMergedColumnConfig([module]);
            const visibleColumns = getVisibleColumns(moduleColumns);

            // Add section header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(moduleLabels[module] + ' (' + moduleRecords.length + ')', leftMargin, y);
            y += 8;

            // Split data into left and right sections
            const midPoint = Math.ceil(moduleRecords.length / 2);
            const leftData = moduleRecords.slice(0, midPoint);
            const rightData = moduleRecords.slice(midPoint);

            // Left section
            let leftY = y;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Section 1', leftMargin, leftY);
            leftY += 6;

            leftData.forEach((record, index) => {
                if (leftY > pageHeight - 20) {
                    doc.addPage();
                    leftY = 20;
                }

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Record ' + (index + 1) + ':', leftMargin, leftY);
                leftY += 5;

                visibleColumns.forEach(col => {
                    if (leftY > pageHeight - 15) {
                        doc.addPage();
                        leftY = 20;
                    }
                    let value = record[col.key] || '-';
                    if (value && typeof value === 'object') {
                        value = value.name || value.order_no || value.invoice_no || '';
                    }
                    doc.setFont('helvetica', 'normal');
                    doc.text(col.label + ':', leftMargin, leftY);
                    doc.text(String(value), leftMargin + 35, leftY);
                    leftY += 4;
                });
                leftY += 3;
            });

            // Right section (new page if needed)
            let rightY = y;
            if (leftY > pageHeight / 2) {
                doc.addPage();
                rightY = 20;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Section 2', rightMargin, rightY);
            rightY += 6;

            rightData.forEach((record, index) => {
                if (rightY > pageHeight - 20) {
                    doc.addPage();
                    rightY = 20;
                }

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('Record ' + (midPoint + index + 1) + ':', rightMargin, rightY);
                rightY += 5;

                visibleColumns.forEach(col => {
                    if (rightY > pageHeight - 15) {
                        doc.addPage();
                        rightY = 20;
                    }
                    let value = record[col.key] || '-';
                    if (value && typeof value === 'object') {
                        value = value.name || value.order_no || value.invoice_no || '';
                    }
                    doc.setFont('helvetica', 'normal');
                    doc.text(col.label + ':', rightMargin, rightY);
                    doc.text(String(value), rightMargin + 35, rightY);
                    rightY += 4;
                });
                rightY += 3;
            });

            // Add page break between modules
            if (moduleIndex < selectedModules.length - 1) {
                doc.addPage();
                y = 20;
            } else {
                y = rightY + 10;
            }
        });

        doc.save('Report_' + selectedModules.join('_').replace(/\s+/g, '_') + '_' + dateFrom + '_to_' + dateTo + '.pdf');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting PDF: ' + error.message);
    }
}

// =============================================
// TABLE CONTROL FUNCTIONS
// =============================================
function updateTableSearch(module, value) {
    tableSearchQueries[module] = value;
    tableCurrentPages[module] = 1; // Reset to first page
    filterReports();
}

function changeTablePage(module, page) {
    tableCurrentPages[module] = page;
    filterReports();
}

function toggleTableColumn(module, colKey) {
    // Use module-specific column visibility
    const visibilityKey = module + '_' + colKey;
    columnVisibility[visibilityKey] = columnVisibility[visibilityKey] === false ? true : false;
    filterReports();
}

// Override getVisibleColumns to support per-module column visibility
function getVisibleColumns(columns) {
    return columns.filter(col => {
        if (col.key === '__src__') return true;
        // Check if there's a module-specific visibility setting
        const sourceCol = columns.find(c => c.isSource && c.moduleKey);
        const module = sourceCol ? sourceCol.moduleKey : null;
        if (module) {
            const visibilityKey = module + '_' + col.key;
            if (columnVisibility[visibilityKey] !== undefined) {
                return columnVisibility[visibilityKey] !== false;
            }
        }
        return columnVisibility[col.key] !== false;
    });
}

function changeItemsPerPage() {
    const select = document.getElementById('report-items-per-page');
    if (select) {
        itemsPerPage = parseInt(select.value);
        // Reset all pages
        tableCurrentPages = {};
        filterReports();
    }
}

function changeTableItemsPerPage(module, value) {
    itemsPerPage = parseInt(value);
    tableCurrentPages[module] = 1; // Reset to first page
    filterReports();
}

// =============================================
// MODULE DROPDOWN FUNCTIONS (extracted from inline script)
// =============================================
function toggleModuleDropdown() {
    const dropdown = document.getElementById('report-module-options');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function updateModuleSelection() {
    const checkboxes = document.querySelectorAll('.module-checkbox');
    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    const textEl = document.getElementById('report-module-selected-text');
    if (selected.length === 0) {
        textEl.textContent = 'No Modules';
    } else {
        const labels = {
            'received-orders': 'Received Order',
            'completed-orders': 'Completed Order',
            'rework': 'Rework Recording',
            'machine-maintenance': 'Machine Maintenance Logs',
            'delivery': 'Delivery',
            'installation': 'Installation',
            'inventory': 'Inventory',
            'stock-movement': 'Stock Movement'
        };
        textEl.textContent = selected.map(m => labels[m] || m).join(', ');
    }
    document.getElementById('report-module-options').classList.add('hidden');
    filterReports();
}

function getSelectedModules() {
    return Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
}

// Click outside dropdown to close
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('report-module-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        const options = document.getElementById('report-module-options');
        if (options) options.classList.add('hidden');
    }
});