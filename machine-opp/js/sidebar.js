// Sidebar Navigation Component
// Handles sidebar navigation and HR submenu

// =============================================
// UPDATE SIDEBAR ROW COUNTS
// =============================================
function updateSidebarCounts() {
    const receivedCountEl = document.getElementById('sidebar-count-received');
    const reworkCountEl = document.getElementById('sidebar-count-rework');
    const completedCountEl = document.getElementById('sidebar-count-completed');

    if (receivedCountEl) {
        receivedCountEl.textContent = (typeof ordersData !== 'undefined' && Array.isArray(ordersData)) ? ordersData.length : 0;
    }
    if (reworkCountEl) {
        reworkCountEl.textContent = (typeof reworkData !== 'undefined' && Array.isArray(reworkData)) ? reworkData.length : 0;
    }
    if (completedCountEl) {
        completedCountEl.textContent = (typeof completedOrdersData !== 'undefined' && Array.isArray(completedOrdersData)) ? completedOrdersData.length : 0;
    }
}

class SidebarNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.attachEventListeners();
    }

    attachEventListeners() {
        // HR Submenu toggle
        const hrButton = document.querySelector('button[onclick="toggleHRSubmenu()"]');
        if (hrButton) {
            hrButton.addEventListener('click', (e) => {
                e.preventDefault();
                const submenu = document.getElementById('hr-submenu');
                const chevron = document.getElementById('hr-chevron');
                if (submenu && chevron) {
                    submenu.classList.toggle('open');
                    chevron.classList.toggle('open');
                }
            });
        }
    }

    // Method to set active navigation tab
    setActiveTab(tabId) {
        document.querySelectorAll('#main-nav button').forEach(btn => {
            btn.classList.remove('active-tab');
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderLeftColor = '';
        });
        
        const targetTab = document.getElementById(`tab-${tabId}`);
        if (targetTab) {
            targetTab.classList.add('active-tab');
        }
    }
}

// Initialize sidebar
const sidebarNav = new SidebarNavigation();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarNavigation;
}
