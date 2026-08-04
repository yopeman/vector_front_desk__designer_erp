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
                            <i class="fa-regular fa-filter"></i>
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

// Placeholder for PDF export function
function exportReportPDF() {
    alert('PDF export functionality will be implemented with jsPDF library');
}
