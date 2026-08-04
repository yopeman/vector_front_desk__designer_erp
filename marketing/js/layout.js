// Layout module - dynamically injects sidebar and main content into the DOM

const layoutHTML = `
<div class="app-layout">
<div class="erp-header-tree">
    <div class="menu-node active" id="node-dashboard" onclick="switchView('dashboard')">
        <h4>Dashboard</h4><span>Overview</span>
    </div>
    <div class="menu-node" id="node-marketRequest" onclick="switchView('marketRequest')">
        <h4>Market Request</h4><span>Marketing</span>
    </div>
    <div class="menu-node" id="node-clientRegistry" onclick="switchView('clientRegistry')">
        <h4>Client Registry</h4><span>Customers</span>
    </div>
    <div class="menu-node" id="node-invoice" onclick="switchView('invoice')">
        <h4>Invoice</h4><span>Billing</span>
    </div>
    <div class="menu-node" id="node-research" onclick="switchView('research')">
        <h4>Research Login</h4><span>Research</span>
    </div>
    <div class="menu-node" id="node-digitalLog" onclick="switchView('digitalLog')">
        <h4>Digital Log</h4><span>Content</span>
    </div>
    <div class="menu-node" id="node-tender" onclick="switchView('tender')">
        <h4>Tender</h4><span>Procurement</span>
    </div>
    <div class="menu-node" id="node-feedback" onclick="switchView('feedback')">
        <h4>Feed Back</h4><span>Reviews</span>
    </div>
    <div class="menu-node" id="node-leave" onclick="switchView('leave')">
        <h4>Leave Request</h4><span>HR</span>
    </div>
</div>

<div class="main-content">
<div class="action-container">
    <div class="search-group">
        <input type="text" class="search-input-field" id="mainSearchInput" placeholder="🔍 Search here... (number, name, or sector)" onkeyup="filterDataBySearch()">
        <div class="filter-tags-wrapper">
            <div class="filter-tag active-tag" id="tag-all" onclick="setSearchFilter('all')">All</div>
            <div class="filter-tag" id="tag-date" onclick="setSearchFilter('date')">Date</div>
            <div class="filter-tag" id="tag-name" onclick="setSearchFilter('name')">Name</div>
            <div class="filter-tag" id="tag-sector" onclick="setSearchFilter('sector')">Sector</div>
            <div class="filter-tag" id="tag-type" onclick="setSearchFilter('type')">Type</div>
        </div>
    </div>
    <button class="add-action-btn" onclick="triggerCurrentForm()">
        <span>+</span> Add New
    </button>
</div>

<div id="view-dashboard" class="view-section active-view">
    <div class="dashboard-grid">
        <div class="panel-card">
            <div class="panel-title">Presence</div>
            <div class="presence-grid">
                <button class="presence-btn in" onclick="toggleClock(true)">Clock In</button>
                <button class="presence-btn out" onclick="toggleClock(false)">Clock Out</button>
            </div>
            <div class="presence-grid" style="font-size:12px; text-align:center; color: var(--text-gray);">
                <div id="clockInTime">In: --:--:--</div><div id="clockOutTime">Out: --:--:--</div>
            </div>
            <div class="clock-counter" id="livePresenceTimer">00:00:00</div>
        </div>
        <div class="panel-card">
            <div class="panel-title">Order Status</div>
            <div style="height:120px; background:var(--input-bg); border-radius:8px; display:flex; align-items:flex-end; padding:15px; gap:20px;">
                <div style="flex:1; height:85%; background:var(--primary); position:relative;"><span style="position:absolute; top:-20px; font-size:11px; width:100%; text-align:center;">85%</span></div>
                <div style="flex:1; height:40%; background:var(--success); position:relative;"><span style="position:absolute; top:-20px; font-size:11px; width:100%; text-align:center;">40%</span></div>
            </div>
        </div>
        <div class="panel-card">
            <div class="panel-title">Notification</div>
            <p style="font-size:12px; color:var(--warning); line-height:1.6;">⚠️ Note: When the client's payment is completed, the status will automatically update and the client will be included in the list.</p>
        </div>
    </div>
</div>

<div id="view-marketRequest" class="view-section">
    <h3>Market Request List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>Request Number</th><th>Request Type</th><th>Priority</th><th>Assigned To</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="marketRequestTableBody">
                <tr><td colspan="8" style="text-align:center; color:var(--text-gray);">Loading market requests...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div id="view-clientRegistry" class="view-section">
    <h3>Client & Leads Registry List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>Client Name</th><th>Type</th><th>Business Sector</th><th>TIN Number</th><th>Address</th><th>Discovery</th><th>Level</th><th>Actions</th></tr></thead>
            <tbody id="clientTableBody">
                <tr><td colspan="9" style="text-align:center; color:var(--text-gray);">Loading clients...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div id="view-invoice" class="view-section">
    <h3>Invoice List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>Invoice Number</th><th>Client Name</th><th>Reference Number</th><th>Item / Service</th><th>Subtotal (Excl. VAT)</th><th>VAT (15%)</th><th>Grand Total</th><th>Actions</th></tr></thead>
            <tbody id="invoiceTableBody">
                <tr><td colspan="9" style="text-align:center; color:var(--text-gray);">Loading invoices...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div id="view-research" class="view-section">
    <h3>Research Login List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>Research Number</th><th>Title</th><th>Reason</th><th>Objective</th><th>Methodology</th><th>Actions</th></tr></thead>
            <tbody id="researchTableBody">
                <tr><td colspan="7" style="text-align:center; color:var(--text-gray);">Loading research...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div id="view-digitalLog" class="view-section">
    <h3>Digital Log List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>Content Number</th><th>Content Title</th><th>Content Script / Idea</th><th>Shared To</th><th>Actions</th></tr></thead>
            <tbody id="digitalLogTableBody">
                <tr><td colspan="6" style="text-align:center; color:var(--text-gray);">Loading digital logs...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div id="view-tender" class="view-section">
    <h3>Tender List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>Company Name</th><th>Tender No</th><th>Item/Service</th><th>CPO Amount</th><th>Total Price</th><th>VAT Status</th></tr></thead>
            <tbody id="tenderTableBody">
                <tr><td>2026-05-20</td><td>Gov Telecom</td><td>TEN-401</td><td>Network Setup</td><td>50,000 ETB</td><td>57,500 ETB</td><td>With VAT</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div id="view-feedback" class="view-section">
    <h3>Feedback List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>Company Name</th><th>Project Name</th><th>Project Number</th><th>Overall Evaluation</th><th>Service Quality</th><th>Grade</th></tr></thead>
            <tbody id="feedbackTableBody">
                <tr><td>2026-06-02</td><td>Commercial Bank</td><td>App Campaign</td><td>PRJ-77</td><td>Excellent (100)</td><td>Very Satisfied (100)</td><td>A (95%+)</td></tr>
            </tbody>
        </table>
    </div>
</div>

<div id="view-leave" class="view-section">
    <h3>Leave & Requests List</h3>
    <div class="table-container">
        <table class="data-table">
            <thead><tr><th>Date</th><th>From Date - To Date</th><th>Leave Type / Reason</th><th>Other Request Letter</th><th>Remarks</th><th>Status</th></tr></thead>
            <tbody id="leaveTableBody">
                <tr><td>2026-06-09</td><td>2026-07-01 - 2026-07-15</td><td>Annual Leave</td><td>None</td><td>Annual Vacation</td><td><span class="status-pill pending">Pending</span></td></tr>
            </tbody>
        </table>
    </div>
</div>
</div>
</div>
`;

// Inject layout into DOM when page loads
function injectLayout() {
    const layoutContainer = document.createElement('div');
    layoutContainer.innerHTML = layoutHTML;
    document.body.appendChild(layoutContainer);
}

// Call injection on load
injectLayout();
