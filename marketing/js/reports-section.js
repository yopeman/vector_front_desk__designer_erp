// reports Section Component
// Renders the reports section HTML

class ReportsSection {
    constructor() {
        this.render();
    }
    
    render() {
        const container = document.getElementById('reports-section-container');
        if (container) {
            container.innerHTML = `<div class="section-header">
                    <div>
                        <h2 class="section-title">
                            <i class="fa-solid fa-chart-simple"></i>
                            Reports Center
                        </h2>
                        <p class="section-subtitle">Generate comprehensive reports with search, filtering, date range selection, and PDF export.</p>
                    </div>
                    <button onclick="exportReportPDF()" class="btn-primary">
                        <i class="fa-solid fa-file-pdf"></i> Export Report PDF
                    </button>
                </div>

                <!-- Stats Summary Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon violet">
                            <i class="fa-solid fa-database"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Total Records</p>
                            <p class="stat-value" id="report-stats-total">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon blue">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Market Requests</p>
                            <p class="stat-value" id="report-stats-market">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon emerald">
                            <i class="fa-solid fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Clients</p>
                            <p class="stat-value" id="report-stats-clients">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon amber">
                            <i class="fa-solid fa-file-invoice"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Invoices</p>
                            <p class="stat-value" id="report-stats-invoices">0</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon rose">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </div>
                        <div class="stat-info">
                            <p class="stat-label">Research</p>
                            <p class="stat-value" id="report-stats-research">0</p>
                        </div>
                    </div>
                </div>

                <!-- Filters: Module Selection, Search, Date Range -->
                <div class="filter-bar">
                    <div class="filter-group">
                        <!-- Module Selection Dropdown -->
                        <div class="select-wrapper" id="report-module-dropdown">
                            <button type="button" onclick="toggleModuleDropdown()" class="dropdown-btn">
                                <span id="report-module-selected-text">No Modules</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                            <div id="report-module-options" class="dropdown-options hidden">
                                <label class="checkbox-item">
                                    <input type="checkbox" value="market-requests" onchange="updateModuleSelection()" class="module-checkbox">
                                    <span>Market Requests</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" value="clients" onchange="updateModuleSelection()" class="module-checkbox">
                                    <span>Clients</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" value="invoices" onchange="updateModuleSelection()" class="module-checkbox">
                                    <span>Invoices</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" value="research" onchange="updateModuleSelection()" class="module-checkbox">
                                    <span>Research</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" value="digital-logs" onchange="updateModuleSelection()" class="module-checkbox">
                                    <span>Digital Logs</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" value="tenders" onchange="updateModuleSelection()" class="module-checkbox">
                                    <span>Tenders</span>
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" value="feedback" onchange="updateModuleSelection()" class="module-checkbox">
                                    <span>Feedback</span>
                                </label>
                            </div>
                        </div>

                        <!-- Search input -->
                        <div class="search-wrapper">
                            <i class="fa-solid fa-magnifying-glass search-icon"></i>
                            <input type="text" id="report-search" onkeyup="filterReports()" placeholder="Search records..." class="search-input">
                            <button id="report-search-clear" onclick="clearReportSearch()" class="search-clear">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <!-- Date From -->
                        <div class="date-wrapper">
                            <label>From Date</label>
                            <input type="date" id="report-date-from" oninput="filterReports()" onchange="filterReports()" onblur="filterReports()" class="date-input">
                            <button onclick="clearDateFrom()" class="date-clear">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <!-- Date To -->
                        <div class="date-wrapper">
                            <label>To Date</label>
                            <input type="date" id="report-date-to" oninput="filterReports()" onchange="filterReports()" onblur="filterReports()" class="date-input">
                            <button onclick="clearDateTo()" class="date-clear">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Filter action buttons row -->
                    <div class="filter-actions">
                        <div class="filter-count">
                            <i class="fa-solid fa-filter"></i>
                            <span>Showing: <strong id="report-filter-count">0</strong> records</span>
                            <span class="separator">|</span>
                            <span>Module: <strong id="report-active-module" class="active-module">All</strong></span>
                        </div>
                        <button onclick="resetReportFilters()" class="btn-secondary">
                            <i class="fa-solid fa-rotate-left"></i> Reset Filters
                        </button>
                    </div>
                </div>

                <!-- Reports Tables Container -->
                <div id="report-tables-container">
                    <!-- Dynamic tables will be rendered here by JS -->
                </div>
                
                <!-- No results state -->
                <div id="report-no-results" class="empty-state hidden">
                    <div class="empty-icon">
                        <i class="fa-solid fa-chart-simple"></i>
                    </div>
                    <p class="empty-title">No records match your criteria</p>
                    <p class="empty-subtitle">Try adjusting the filters or date range</p>
                    <button onclick="resetReportFilters()" class="btn-secondary">
                        <i class="fa-solid fa-rotate-left"></i> Reset Filters
                    </button>
                </div>`;
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new ReportsSection();
});

// Expose exportReportPDF to global scope
window.exportReportPDF = exportReportPDF;

// PDF export function
async function exportReportPDF() {
    const selectedModules = Array.from(document.querySelectorAll('.module-checkbox:checked')).map(cb => cb.value);
    if (selectedModules.length === 0) {
        alert('No modules selected. Please select at least one module to export.');
        return;
    }

    const dateFrom = document.getElementById('report-date-from').value || '';
    const dateTo = document.getElementById('report-date-to').value || '';

    // Get all filtered data
    const allRecords = await window.getReportData();
    const searchVal = document.getElementById('report-search').value.toLowerCase();
    let filtered = allRecords;

    // Apply filters (same as filterReports)
    if (selectedModules.length > 0) {
        filtered = filtered.filter(r => selectedModules.includes(r.module));
    }
    if (searchVal) {
        filtered = filtered.filter(r =>
            JSON.stringify(r).toLowerCase().includes(searchVal)
        );
    }
    if (dateFrom || dateTo) {
        filtered = filtered.filter(r => {
            const dateValue = r.dateRaw || r.date;
            if (!dateValue || dateValue === '-') return false;
            const recordDate = new Date(dateValue);
            if (isNaN(recordDate.getTime())) return false;

            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                if (recordDate < fromDate) return false;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (recordDate > toDate) return false;
            }
            return true;
        });
    }

    if (filtered.length === 0) {
        alert('No data available to export. Please adjust your filters.');
        return;
    }

    let moduleName;
    if (selectedModules.length === 7) {
        moduleName = 'All Modules';
    } else {
        moduleName = selectedModules.map(m => window.moduleLabels[m] || m).join(', ');
    }

    // Use jsPDF directly for left/right split layout
    try {
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
        doc.text('Marketing Report', pageWidth / 2, y, { align: 'center' });
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

            const moduleColumns = window.getMergedColumnConfig([module]);
            const visibleColumns = window.getVisibleColumns(moduleColumns);

            // Add section header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(window.moduleLabels[module] + ' (' + moduleRecords.length + ')', leftMargin, y);
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

        doc.save('Marketing_Report_' + selectedModules.join('_').replace(/\s+/g, '_') + '_' + dateFrom + '_to_' + dateTo + '.pdf');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting PDF: ' + error.message);
    }
}
