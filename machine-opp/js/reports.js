// =============================================
// REPORTS MODULE
// =============================================



// =============================================
// BUILD REPORT DATA FROM ALL MODULES
// =============================================
function getReportData() {
    const records = [];

    // Add received orders
    ordersData.forEach(order => {
        records.push({
            module: 'received-orders',
            moduleLabel: 'Received Orders',
            date: order.date,
            orderNum: order.orderNum,
            title: order.title,
            designer: order.designer,
            material: order.material || '-',
            machine: order.machine,
            status: order.priority === 'urgent' ? 'Urgent' : 'Normal',
            statusColor: order.priority === 'urgent' ? 'text-rose-400' : 'text-emerald-400',
            statusBg: order.priority === 'urgent' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-700/60 border-slate-600/40'
        });
    });

    // Add completed orders
    completedOrdersData.forEach(order => {
        records.push({
            module: 'completed-orders',
            moduleLabel: 'Completed Orders',
            date: order.date,
            orderNum: order.orderNum,
            title: order.title,
            designer: order.machine,
            material: order.material || '-',
            machine: order.machine,
            status: 'Completed',
            statusColor: 'text-emerald-400',
            statusBg: 'bg-emerald-500/10 border-emerald-500/20'
        });
    });

    // Add rework records
    reworkData.forEach(entry => {
        records.push({
            module: 'rework',
            moduleLabel: 'Rework Records',
            date: entry.date,
            orderNum: '-',
            title: entry.title,
            designer: entry.machine,
            material: entry.material || '-',
            machine: entry.machine,
            status: entry.status === 'completed' ? 'Completed' : 'In Progress',
            statusColor: entry.status === 'completed' ? 'text-emerald-400' : 'text-amber-400',
            statusBg: entry.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
        });
    });

    // Add store request items
    localStoreItemsList.forEach(item => {
        records.push({
            module: 'store-request',
            moduleLabel: 'Store Requests',
            date: item.date || '-',
            orderNum: item.taskNum,
            title: item.title,
            designer: item.material || '-',
            material: (item.material || '-') + ' ' + (item.color ? '(' + item.color + ')' : ''),
            machine: item.unit || 'pcs',
            status: 'Pending',
            statusColor: 'text-amber-400',
            statusBg: 'bg-amber-500/10 border-amber-500/20'
        });
    });

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
    const container = document.getElementById('report-column-checklist');
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
        merged.push({ key: '__src__', label: moduleLabels[mod] || mod, cls: 'text-center w-16', isSource: true });
        cols.forEach(col => {
            merged.push(col);
        });
    });
    return merged;
}

// =============================================
// FILTER AND RENDER REPORTS
// =============================================
function filterReports() {
    const selectedModules = getSelectedModules();
    const searchVal = document.getElementById('report-search').value.toLowerCase();
    const dateFrom = document.getElementById('report-date-from').value;
    const dateTo = document.getElementById('report-date-to').value;
    const tbody = document.getElementById('report-records-body');
    const theadRow = document.getElementById('report-thead-row');
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
    } else if (selectedModules.length === 4) {
        activeModule.textContent = 'All Modules';
    } else {
        activeModule.textContent = selectedModules.map(m => moduleLabels[m] || m).join(', ');
    }

    // If no modules selected, show no results
    if (selectedModules.length === 0) {
        theadRow.innerHTML = '';
        tbody.innerHTML = '';
        noResults.classList.remove('hidden');
        filterCount.textContent = '0';
        updateReportStats();
        return;
    }

    // Get merged columns and filter by visibility
    const allColumns = getMergedColumnConfig(selectedModules);
    const columns = getVisibleColumns(allColumns);

    if (columns.length === 0) {
        theadRow.innerHTML = '';
        tbody.innerHTML = '';
        noResults.classList.remove('hidden');
        filterCount.textContent = '0';
        updateReportStats();
        return;
    }

    // Render table header dynamically
    theadRow.innerHTML = renderReportHeader(columns);

    // Render table body
    tbody.innerHTML = '';

    const allRecords = getReportData();
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
        updateReportStats();
        return;
    }

    noResults.classList.add('hidden');
    filterCount.textContent = filtered.length;

    filtered.forEach((record, index) => {
        const row = document.createElement('tr');
        row.className = 'order-row hover:bg-violet-600/10 transition-colors';

        // Render dynamic columns
        columns.forEach(col => {
            let value = record[col.key] || '-';
            let cellCls = 'p-4';
            if (col.cls) cellCls += ' ' + col.cls;

            const cell = document.createElement('td');
            cell.className = cellCls;

            if (col.key === '__src__') {
                cell.innerHTML = `<span class="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded border border-violet-500/20 font-medium">${value}</span>`;
            } else if (col.key === 'no') {
                cell.textContent = String(index + 1).padStart(2, '0') + ' -';
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

    updateReportStats();
}

// =============================================
// UPDATE REPORT STATS
// =============================================
function updateReportStats() {
    const allRecords = getReportData();
    const total = allRecords.length;
    const received = allRecords.filter(r => r.module === 'received-orders').length;
    const completed = allRecords.filter(r => r.module === 'completed-orders').length;
    const rework = allRecords.filter(r => r.module === 'rework').length;

    const totalEl = document.getElementById('report-stats-total');
    const receivedEl = document.getElementById('report-stats-received');
    const completedEl = document.getElementById('report-stats-completed');
    const reworkEl = document.getElementById('report-stats-rework');
    
    if (totalEl) totalEl.textContent = total;
    if (receivedEl) receivedEl.textContent = received;
    if (completedEl) completedEl.textContent = completed;
    if (reworkEl) reworkEl.textContent = rework;
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
function exportReportPDF() {
    const tbody = document.getElementById('report-records-body');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) {
        alert('No data available to export. Please adjust your filters.');
        return;
    }

    const selectedModules = getSelectedModules();
    if (selectedModules.length === 0) {
        alert('No modules selected. Please select at least one module to export.');
        return;
    }
    
    let moduleName;
    if (selectedModules.length === 4) {
        moduleName = 'All Modules';
    } else {
        moduleName = selectedModules.map(m => moduleLabels[m] || m).join(', ');
    }
    
    const dateFrom = document.getElementById('report-date-from').value;
    const dateTo = document.getElementById('report-date-to').value;

    const allColumns = getMergedColumnConfig(selectedModules);
    const columns = getVisibleColumns(allColumns);
    if (columns.length === 0) {
        alert('No columns are visible. Please enable at least one column to export.');
        return;
    }
    const allColumnLabels = columns.map(c => c.label);

    // Build form HTML for PDF
    let recordsHtml = '';
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 1) {
            const srcCell = cells[0];
            const srcLabel = srcCell.textContent.trim();
            let fieldsHtml = '';
            cells.forEach((cell, ci) => {
                if (ci === 0) return;
                const col = columns[ci];
                if (!col) return;
                const label = col.label;
                const value = cell.textContent.trim();
                fieldsHtml += [
                    '<div style="display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #1e293b;">',
                    '<span style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; min-width: 80px;">' + label + '</span>',
                    '<span style="color: #e2e8f0; font-size: 11px;">' + value + '</span>',
                    '</div>'
                ].join('');
            });
            recordsHtml += [
                '<div style="background: ' + (index % 2 === 0 ? '#1e293b' : '#0f172a') + '; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 10px;">',
                '<div style="font-size: 10px; color: #a78bfa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #334155;">',
                'Record #' + (index + 1) + ' &mdash; ' + srcLabel,
                '</div>',
                fieldsHtml,
                '</div>'
            ].join('');
        }
    });

    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        '<div style="padding: 30px; font-family: Inter, Segoe UI, sans-serif; background: #0f172a; color: #fff;">',
        '<div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #8b5cf6;">',
        '<h1 style="font-size: 24px; font-weight: bold; margin: 0 0 5px 0; color: #fff;">ERP System Report</h1>',
        '<p style="font-size: 12px; color: #94a3b8; margin: 0;">Machine Operation Management</p>',
        '<div style="margin-top: 12px; display: flex; justify-content: center; gap: 20px; font-size: 11px; color: #64748b;">',
        '<span>Module: <strong style="color: #a78bfa;">' + moduleName + '</strong></span>',
        (dateFrom ? '<span>From: <strong style="color: #e2e8f0;">' + dateFrom + '</strong></span>' : ''),
        (dateTo ? '<span>To: <strong style="color: #e2e8f0;">' + dateTo + '</strong></span>' : ''),
        '<span>Records: <strong style="color: #e2e8f0;">' + rows.length + '</strong></span>',
        '</div>',
        '</div>',
        '<div style="margin-bottom: 20px;">',
        recordsHtml,
        '</div>',
        '<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #334155; font-size: 10px; color: #64748b; text-align: center;">',
        '<p style="margin: 0;">Generated on: ' + new Date().toLocaleString() + '</p>',
        '<p style="margin: 5px 0 0 0;">ERP System v2.0 &mdash; This is a computer-generated document. No signature required.</p>',
        '</div>',
        '</div>'
    ].join('');

    const opt = {
        margin: 12,
        filename: 'erp_report_' + new Date().toISOString().split('T')[0] + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#0f172a'
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape'
        }
    };

    exportToPDF(wrapper, 'erp_report_' + new Date().toISOString().split('T')[0] + '.pdf');
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
    } else if (selected.length === 4) {
        textEl.textContent = 'All Modules';
    } else {
        const labels = {
            'received-orders': 'Received Orders',
            'completed-orders': 'Completed Orders',
            'rework': 'Rework Records',
            'store-request': 'Store Requests'
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