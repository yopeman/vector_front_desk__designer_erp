// Main module for view switching and initialization

let currentActiveView = 'dashboard';
let liveTimer;
let secondsCounter = 0;
let activeFilterType = 'all';

function switchView(viewId) {
    currentActiveView = viewId;
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active-view'));
    document.querySelectorAll('.menu-node').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active-view');
    document.getElementById('node-' + viewId).classList.add('active');

    // Load data from Supabase whenever the view is shown
    if (viewId === 'marketRequest') {
        loadMarketRequests();
    } else if (viewId === 'clientRegistry') {
        loadClients();
    } else if (viewId === 'invoice') {
        loadInvoices();
    } else if (viewId === 'research') {
        loadResearch();
    } else if (viewId === 'digitalLog') {
        loadDigitalLogs();
    } else if (viewId === 'tender') {
        loadTenders();
    } else if (viewId === 'feedback') {
        loadFeedbacks();
    }
}

function triggerCurrentForm() {
    if(currentActiveView === 'dashboard') {
        document.getElementById('formModal-clientRegistry').style.display = 'flex';
        openNewClientForm();
    } else if (currentActiveView === 'marketRequest') {
        openNewMarketRequestForm();
    } else if (currentActiveView === 'clientRegistry') {
        openNewClientForm();
    } else if (currentActiveView === 'invoice') {
        openNewInvoiceForm();
    } else if (currentActiveView === 'research') {
        openNewResearchForm();
    } else if (currentActiveView === 'digitalLog') {
        openNewDigitalLogForm();
    } else if (currentActiveView === 'tender') {
        openNewTenderForm();
    } else if (currentActiveView === 'feedback') {
        openNewFeedbackForm();
    } else {
        const modal = document.getElementById('formModal-' + currentActiveView);
        if(modal) modal.style.display = 'flex';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
}

function setSearchFilter(filterType) {
    activeFilterType = filterType;
    document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active-tag'));
    document.getElementById('tag-' + filterType).classList.add('active-tag');
    filterDataBySearch();
}

function filterDataBySearch() {
    const query = document.getElementById('mainSearchInput').value.toLowerCase();
    if(currentActiveView === 'dashboard') return;
    
    const tableBody = document.querySelector(`#view-${currentActiveView} tbody`);
    if(!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? '' : 'none';
    });
}

function toggleClock(inbound) {
    const time = new Date().toLocaleTimeString();
    if(inbound) {
        document.getElementById('clockInTime').innerText = "In: " + time;
        clearInterval(liveTimer);
        liveTimer = setInterval(() => {
            secondsCounter++;
            let h = Math.floor(secondsCounter / 3600).toString().padStart(2, '0');
            let m = Math.floor((secondsCounter % 3600) / 60).toString().padStart(2, '0');
            let s = (secondsCounter % 60).toString().padStart(2, '0');
            document.getElementById('livePresenceTimer').innerText = `${h}:${m}:${s}`;
        }, 1000);
    } else {
        document.getElementById('clockOutTime').innerText = "Out: " + time;
        clearInterval(liveTimer);
    }
}

// Close modals when clicking outside
window.onclick = function(e) { 
    if (e.target.classList.contains('modal-overlay')) closeAllModals(); 
}
