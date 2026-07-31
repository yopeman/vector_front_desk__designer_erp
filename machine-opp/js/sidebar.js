// Sidebar Navigation Component
// Handles sidebar navigation and HR submenu

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
