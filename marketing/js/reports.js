// =============================================
// REPORTS MODULE - MARKETING ERP
// =============================================

// Global state
let reportColumnConfigs = {
    'market-requests': [
        { key: 'date', label: 'Date', cls: 'text-center w-28' },
        { key: 'requestNum', label: 'Request #', cls: 'text-center w-24' },
        { key: 'title', label: 'Request Type', cls: 'w-48' },
        { key: 'priority', label: 'Priority', cls: 'text-center w-24' },
        { key: 'assignedTo', label: 'Assigned To', cls: 'w-32' },
        { key: 'dueDate', label: 'Due Date', cls: 'text-center w-28' },
        { key: 'status', label: 'Status', cls: 'text-center w-24' }
    ],
    'clients': [
        { key: 'date', label: 'Date', cls: 'text-center w-28' },
        { key: 'clientName', label: 'Client Name', cls: 'w-40' },
        { key: 'type', label: 'Type', cls: 'text-center w-24' },
        { key: 'sector', label: 'Business Sector', cls: 'w-32' },
        { key: 'tin', label: 'TIN Number', cls: 'text-center w-28' },
        { key: 'level', label: 'Level', cls: 'text-center w-24' }
    ],
    'invoices': [
        { key: 'date', label: 'Date', cls: 'text-center w-28' },
        { key: 'invoiceNum', label: 'Invoice #', cls: 'text-center w-24' },
        { key: 'clientName', label: 'Client Name', cls: 'w-40' },
        { key: 'item', label: 'Item / Service', cls: 'w-48' },
        { key: 'subtotal', label: 'Subtotal', cls: 'text-right w-28' },
        { key: 'vat', label: 'VAT (15%)', cls: 'text-right w-24' },
        { key: 'total', label: 'Grand Total', cls: 'text-right w-28' }
    ],
    'research': [
        { key: 'date', label: 'Date', cls: 'text-center w-28' },
        { key: 'researchNum', label: 'Research #', cls: 'text-center w-24' },
        { key: 'title', label: 'Title', cls: 'w-48' },
        { key: 'reason', label: 'Reason', cls: 'w-40' },
        { key: 'objective', label: 'Objective', cls: 'w-48' }
    ],
    'digital-logs': [
        { key: 'date', label: 'Date', cls: 'text-center w-28' },
        { key: 'contentNum', label: 'Content #', cls: 'text-center w-24' },
        { key: 'title', label: 'Content Title', cls: 'w-48' },
        { key: 'script', label: 'Script / Idea', cls: 'w-64' },
        { key: 'sharedTo', label: 'Shared To', cls: 'w-32' }
    ],
    'tenders': [
        { key: 'date', label: 'Date', cls: 'text-center w-28' },
        { key: 'companyName', label: 'Company Name', cls: 'w-40' },
        { key: 'tenderNo', label: 'Tender #', cls: 'text-center w-24' },
        { key: 'item', label: 'Item/Service', cls: 'w-48' },
        { key: 'cpoAmount', label: 'CPO Amount', cls: 'text-right w-28' },
        { key: 'totalPrice', label: 'Total Price', cls: 'text-right w-28' }
    ],
    'feedback': [
        { key: 'date', label: 'Date', cls: 'text-center w-28' },
        { key: 'companyName', label: 'Company Name', cls: 'w-40' },
        { key: 'projectName', label: 'Project Name', cls: 'w-48' },
        { key: 'projectNum', label: 'Project #', cls: 'text-center w-24' },
        { key: 'evaluation', label: 'Overall Evaluation', cls: 'text-center w-32' },
        { key: 'grade', label: 'Grade', cls: 'text-center w-24' }
    ]
};

let moduleLabels = {
    'market-requests': 'Market Requests',
    'clients': 'Clients',
    'invoices': 'Invoices',
    'research': 'Research',
    'digital-logs': 'Digital Logs',
    'tenders': 'Tenders',
    'feedback': 'Feedback'
};

let columnVisibility = {};
let tableSearchQueries = {};
let tableCurrentPages = {};
let itemsPerPage = 10;

// =============================================
// BUILD REPORT DATA FROM ALL MODULES
// =============================================
async function getReportData() {
    const records = [];

    // Add market requests
    try {
        const { data, error } = await window.supabase
            .from('mrk_market_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                console.warn('mrk_market_requests table does not exist yet');
            } else {
                throw error;
            }
        }

        if (data) {
            data.forEach(req => {
                records.push({
                    module: 'market-requests',
                    moduleLabel: 'Market Request',
                    date: formatDate(req.created_at),
                    requestNum: req.request_no || '-',
                    title: req.request_type || '-',
                    priority: req.priority || '-',
                    assignedTo: req.assigned_to || '-',
                    dueDate: req.due_date ? formatDate(req.due_date) : '-',
                    status: req.status || '-'
                });
            });
        }
    } catch (error) {
        console.error('Error fetching market requests:', error);
    }

    // Add clients
    try {
        const { data: clients, error } = await window.supabase
            .from('mrk_clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                console.warn('mrk_clients table does not exist yet');
            } else {
                throw error;
            }
        }

        if (clients) {
            clients.forEach(client => {
                records.push({
                    module: 'clients',
                    moduleLabel: 'Client',
                    date: formatDate(client.created_at),
                    clientName: client.client_name || '-',
                    type: client.client_type || '-',
                    sector: client.business_sector || '-',
                    tin: client.tin_number || '-',
                    level: client.level || '-',
                    status: 'Active',
                    statusColor: 'text-emerald',
                    statusBg: 'bg-emerald'
                });
            });
        }
    } catch (error) {
        console.error('Error fetching clients:', error);
    }

    // Add invoices
    try {
        const { data: invoices, error } = await window.supabase
            .from('mrk_invoices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                console.warn('mrk_invoices table does not exist yet');
            } else {
                throw error;
            }
        }

        if (invoices) {
            invoices.forEach(inv => {
                records.push({
                    module: 'invoices',
                    moduleLabel: 'Invoice',
                    date: formatDate(inv.created_at),
                    invoiceNum: inv.invoice_no || '-',
                    clientName: inv.client_name || '-',
                    item: inv.item_service || '-',
                    subtotal: inv.subtotal || 0,
                    vat: inv.vat_amount || 0,
                    total: inv.grand_total || 0,
                    status: 'paid',
                    statusColor: 'text-emerald',
                    statusBg: 'bg-emerald'
                });
            });
        }
    } catch (error) {
        console.error('Error fetching invoices:', error);
    }

    return records;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// =============================================
// RENDER TABLE HEADER
// =============================================
function renderReportHeader(columns) {
    return columns.map(col => `<th class="p-4 ${col.cls}">${col.label}</th>`).join('');
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

    const clearBtn = document.getElementById('report-search-clear');
    const filterCount = document.getElementById('report-filter-count');
    const activeModule = document.getElementById('report-active-module');

    if (searchVal.length > 0) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }

    if (selectedModules.length === 0) {
        activeModule.textContent = 'None';
    } else if (selectedModules.length === 7) {
        activeModule.textContent = 'All Modules';
    } else {
        activeModule.textContent = selectedModules.map(m => moduleLabels[m] || m).join(', ');
    }

    if (selectedModules.length === 0) {
        const tablesContainer = document.getElementById('report-tables-container');
        if (tablesContainer) tablesContainer.innerHTML = '';
        noResults.classList.remove('hidden');
        filterCount.textContent = '0';
        await updateReportStats();
        return;
    }

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

    const allRecords = await getReportData();
    let filtered = allRecords;

    if (selectedModules.length > 0) {
        filtered = filtered.filter(r => selectedModules.includes(r.module));
    }

    if (searchVal) {
        filtered = filtered.filter(r =>
            JSON.stringify(r).toLowerCase().includes(searchVal)
        );
    }

    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
        filterCount.textContent = '0';
        await updateReportStats();
        return;
    }

    noResults.classList.add('hidden');
    filterCount.textContent = filtered.length;

    const tablesContainer = document.getElementById('report-tables-container');
    tablesContainer.innerHTML = '';

    selectedModules.forEach(module => {
        const moduleRecords = filtered.filter(r => r.module === module);
        if (moduleRecords.length === 0) return;

        const moduleColumns = getMergedColumnConfig([module]);
        const visibleColumns = getVisibleColumns(moduleColumns);

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'report-table-wrapper';

        const tableHeader = document.createElement('div');
        tableHeader.className = 'table-header';
        tableHeader.innerHTML = `
            <h3>${moduleLabels[module] || module} (${moduleRecords.length} records)</h3>
        `;
        tableWrapper.appendChild(tableHeader);

        const tableDiv = document.createElement('div');
        tableDiv.className = 'table-wrapper';

        const table = document.createElement('table');
        table.className = 'data-table';

        const thead = document.createElement('thead');
        const theadRow = document.createElement('tr');
        theadRow.innerHTML = renderReportHeader(visibleColumns);
        thead.appendChild(theadRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.className = 'table-body';

        moduleRecords.forEach((record, index) => {
            const row = document.createElement('tr');
            row.className = 'table-row';

            visibleColumns.forEach(col => {
                let value = record[col.key] || '-';
                let cellCls = 'p-4';
                if (col.cls) cellCls += ' ' + col.cls;

                const cell = document.createElement('td');
                cell.className = cellCls;

                if (col.key === 'status') {
                    cell.innerHTML = `<span class="status-pill ${record.statusBg} ${record.statusColor}">${value}</span>`;
                } else if (col.key === 'priority') {
                    const priorityClass = value === 'high' ? 'high' : value === 'normal' ? 'normal' : 'low';
                    cell.innerHTML = `<span class="priority-pill ${priorityClass}">${value}</span>`;
                } else {
                    cell.textContent = value;
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableDiv.appendChild(table);
        tableWrapper.appendChild(tableDiv);
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
    const marketRequests = allRecords.filter(r => r.module === 'market-requests').length;
    const clients = allRecords.filter(r => r.module === 'clients').length;
    const invoices = allRecords.filter(r => r.module === 'invoices').length;
    const research = allRecords.filter(r => r.module === 'research').length;

    const totalEl = document.getElementById('report-stats-total');
    const marketEl = document.getElementById('report-stats-market');
    const clientEl = document.getElementById('report-stats-clients');
    const invoiceEl = document.getElementById('report-stats-invoices');
    const researchEl = document.getElementById('report-stats-research');
    
    if (totalEl) totalEl.textContent = total;
    if (marketEl) marketEl.textContent = marketRequests;
    if (clientEl) clientEl.textContent = clients;
    if (invoiceEl) invoiceEl.textContent = invoices;
    if (researchEl) researchEl.textContent = research;
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
// COLUMN VISIBILITY FUNCTIONS
// =============================================
function getVisibleColumns(columns) {
    return columns.filter(col => columnVisibility[col.key] !== false);
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

function toggleColumnVisibility(colKey) {
    columnVisibility[colKey] = columnVisibility[colKey] === false ? true : false;
    filterReports();
}

// =============================================
// MODULE SELECTION
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
    } else if (selected.length === 7) {
        textEl.textContent = 'All Modules';
    } else {
        textEl.textContent = selected.map(m => moduleLabels[m] || m).join(', ');
    }
    const optionsEl = document.getElementById('report-module-options');
    if (optionsEl) optionsEl.classList.add('hidden');
    filterReports();
}

function getSelectedModules() {
    return Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
}

// Close module dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('report-module-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        const options = document.getElementById('report-module-options');
        if (options) options.classList.add('hidden');
    }
});

// Expose functions to global scope for onclick handlers
window.filterReports = filterReports;
window.clearReportSearch = clearReportSearch;
window.resetReportFilters = resetReportFilters;
window.toggleModuleDropdown = toggleModuleDropdown;
window.updateModuleSelection = updateModuleSelection;
window.toggleColumnVisibility = toggleColumnVisibility;
