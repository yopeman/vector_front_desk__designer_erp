// =============================================
// MAIN.JS - Common Functions & Utilities
// =============================================

// =============================================
// TAB ROUTING & NAVIGATION
// =============================================
window.activeTabId = null;

// Refetch/refresh data for a given tab without a full page reload
const TAB_REFRESH_FUNCTIONS = {
    'dashboard': async () => {
        if (typeof updateDashboardStats === 'function') await updateDashboardStats();
        if (typeof renderDashboardCharts === 'function') await renderDashboardCharts();
    },
    'received-orders': async () => {
        if (typeof fetchReceivedOrders === 'function') {
            await fetchReceivedOrders();
        }
        if (typeof renderOrdersTable === 'function') renderOrdersTable();
    },
    'active-work': async () => {
        if (typeof renderActiveWorkTable === 'function') {
            await renderActiveWorkTable();
        }
    },
    'rework-login': async () => {
        if (typeof fetchReworkRecords === 'function') {
            await fetchReworkRecords();
        }
        if (typeof renderReworkRecords === 'function') renderReworkRecords();
    },
    'completed-orders': () => {
        if (typeof renderCompletedOrdersTable === 'function') renderCompletedOrdersTable();
    },
    'delivery': () => {
        if (typeof renderDeliveryTable === 'function') renderDeliveryTable();
    },
    'installation': () => {
        if (typeof renderInstallationTable === 'function') renderInstallationTable();
    },
    'machine-login': () => {
        if (typeof switchMachine === 'function') {
            const currentMachineKey = typeof currentMachine !== 'undefined' ? currentMachine : 'cnc';
            switchMachine(currentMachineKey);
        }
    },
    'store-request': () => {
        if (typeof renderStoreItemsTable === 'function') renderStoreItemsTable();
    },
    'inventory': () => {
        if (typeof loadInventoryItems === 'function') loadInventoryItems();
    },
    'inventory-movements': () => {
        if (typeof loadInventoryMovements === 'function') loadInventoryMovements();
    },
    'notes': async () => {
        if (typeof fetchNotes === 'function') await fetchNotes();
    },
    'messages': async () => {
        if (typeof renderUserList === 'function') renderUserList();
        if (typeof renderMsgDropdown === 'function') await renderMsgDropdown();
    },
    'notifications': async () => {
        if (typeof renderNotifications === 'function') renderNotifications();
        if (typeof renderNotifDropdown === 'function') await renderNotifDropdown();
    },
    'reports': () => {
        if (typeof filterReports === 'function') filterReports();
    },
    'ai-agent': () => {
        if (typeof AIAgent !== 'undefined' && typeof AIAgent.loadSessions === 'function') {
            AIAgent.loadSessions();
        }
    },
    'settings': async () => {
        if (typeof loadProfile === 'function') await loadProfile();
        if (typeof loadNotificationSettings === 'function') loadNotificationSettings();
        if (typeof loadAppearanceSettings === 'function') loadAppearanceSettings();
    }
};

window.refreshActiveTabData = function(targetId) {
    const tabId = targetId || window.activeTabId;
    if (!tabId) return;
    const refreshFn = TAB_REFRESH_FUNCTIONS[tabId];
    if (typeof refreshFn !== 'function') return;
    try {
        refreshFn();
    } catch (error) {
        console.error(`Error refreshing ${tabId} tab:`, error);
    }
};

function switchTab(targetId) {
    // Check if user is trying to navigate away from public reports without auth
    if (window.location.hash === '#machine-public-report' && targetId !== 'reports') {
        // Redirect to login if not authenticated
        if (!Auth.isAuthenticated()) {
            document.getElementById('auth-overlay').classList.remove('hidden');
            document.body.classList.add('modal-open');
            window.location.hash = '';
            return;
        }
    }

    document.querySelectorAll('.container-tab').forEach(el => el.classList.add('hidden'));

    const targetContent = document.getElementById(`content-${targetId}`);
    if (targetContent) targetContent.classList.remove('hidden');

    document.querySelectorAll('#main-nav button').forEach(btn => {
        btn.classList.remove('active-tab');
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderLeftColor = '';
    });
    const targetTab = document.getElementById(`tab-${targetId}`);
    if (targetTab) {
        targetTab.classList.add('active-tab');
    }

    // Remember the active tab for realtime refreshes
    window.activeTabId = targetId;

    // Refetch/refresh data when switching tabs
    window.refreshActiveTabData(targetId);
}

// =============================================
// CLOCK IN/OUT PRESENCE TRACKER
// =============================================
function toggleClock(type) {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    if (type === 'in') {
        document.getElementById('clockInTime').innerText = timeString;
    } else {
        document.getElementById('clockOutTime').innerText = timeString;
    }
}

// =============================================
// CHART DRAWING UTILITIES
// =============================================
function drawPieChart(canvasId, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 220;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    const radius = Math.max(1, size / 2 - 20);
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data', cx, cy + 4);
        return;
    }
    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
        const sliceAngle = (d.value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        startAngle += sliceAngle;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, radius * 0.55), 0, Math.PI * 2);
    ctx.fillStyle = '#1e1d2a';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 5);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Total', cx, cy + 18);
}

function drawBarChart(canvasId, data, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = 280;
    const height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.max(1, chartW / data.length - 8);
    const gap = 8;
    data.forEach((d, i) => {
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const barH = Math.max(1, (d.value / maxVal) * chartH);
        const y = padding.top + chartH - barH;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, height - 8);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(d.value, x + barWidth / 2, y - 6);
    });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================
// HR REQUEST HANDLING
// =============================================
function submitHRRequest() {
    const requestVal = document.getElementById('hr-request-type').value;
    alert(`Your request for [${requestVal.toUpperCase()}] has been dispatched.`);
}

function toggleHRSubmenu() {
    const submenu = document.getElementById('hr-submenu');
    const chevron = document.getElementById('hr-chevron');
    submenu.classList.toggle('open');
    chevron.classList.toggle('open');
}

// =============================================
// STORE REQUEST MODAL FUNCTIONS
// =============================================
function openStoreRequestModal() {
    const modal = document.getElementById('store-request-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.classList.add('modal-open');
    }
}

function closeStoreRequestModal(event) {
    const modal = document.getElementById('store-request-modal');
    if (event && event.target !== modal) return;
    if (modal) {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }
}

// =============================================
// FILE UPLOAD & DOWNLOAD
// =============================================
function triggerFileUpload() {
    document.getElementById('file-upload-input').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    uploadedFile = file;
    document.getElementById('uploaded-file-name').textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
    document.getElementById('uploaded-file-info').classList.remove('hidden');
    
    event.target.value = '';
}

function removeUploadedFile() {
    uploadedFile = null;
    document.getElementById('uploaded-file-info').classList.add('hidden');
    document.getElementById('uploaded-file-name').textContent = '';
}

async function downloadSharedFile() {
    if (typeof currentSharedFile !== 'undefined' && currentSharedFile && typeof supabase !== 'undefined') {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(currentSharedFile.filePath, 60);

            if (error || !data?.signedUrl) {
                throw error || new Error('Failed to create download link');
            }

            const a = document.createElement('a');
            a.href = data.signedUrl;
            a.download = currentSharedFile.fileName;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        } catch (err) {
            console.error('Download failed, falling back to sample:', err);
        }
    }

    const sampleContent = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
30
0.0
11
100.0
21
100.0
31
0.0
0
ENDSEC
0
EOF`;
    
    const blob = new Blob([sampleContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vector_blueprint.dxf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Downloading vector_blueprint.dxf...');
}

// =============================================
// PDF EXPORT UTILITIES
// =============================================
function exportToPDF(wrapper, filename) {
    const opt = {
        margin: 15,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#0f172a'
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };

    html2pdf().set(opt).from(wrapper).save()
        .then(() => {
            console.log('PDF exported successfully');
        })
        .catch((err) => {
            console.error('PDF export error:', err);
            alert('Error exporting PDF. Please try again.');
        });
}

// =============================================
// AUTH UI FUNCTIONS
// =============================================
function toggleAuthPassword() {
    const pw = document.getElementById('auth-password');
    const icon = document.getElementById('auth-toggle-icon');
    if (pw && pw.type === 'password') {
        pw.type = 'text';
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    } else if (pw) {
        pw.type = 'password';
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    }
}

function clearAuthErrors() {
    document.querySelectorAll('.auth-error').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.auth-input').forEach(el => el.classList.remove('error'));
}

async function handleAuthLogin(event) {
    event.preventDefault();
    clearAuthErrors();

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const rememberMe = document.getElementById('auth-remember').checked;

    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('auth-email').classList.add('error');
        document.getElementById('auth-email-error').classList.add('visible');
        valid = false;
    }

    if (!password || password.length < 8) {
        document.getElementById('auth-password').classList.add('error');
        document.getElementById('auth-password-error').classList.add('visible');
        valid = false;
    }

    if (!valid) return false;

    const result = await Auth.login(email, password);

    if (!result.success) {
        showAuthToast(result.error, 'error');
        return false;
    }

    if (rememberMe) {
        localStorage.setItem('vector_erp_remembered_email', email);
    } else {
        localStorage.removeItem('vector_erp_remembered_email');
    }

    showAuthToast('Login successful!', 'success');

    setTimeout(() => {
        updateAuthUI();
        document.getElementById('auth-overlay').classList.add('hidden');
        document.body.classList.remove('modal-open');
    }, 800);

    return false;
}

function updateAuthUI() {
    const userInfoBadge = document.getElementById('user-info-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const avatar = document.getElementById('topbar-avatar');
    const username = document.getElementById('topbar-username');

    if (Auth.isAuthenticated()) {
        const user = Auth.getCurrentUser();
        if (user) {
            userInfoBadge.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            if (avatar) {
                const initials = user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                avatar.textContent = initials;
            }
            if (username) username.textContent = user.name;
        }
    } else {
        userInfoBadge.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
}

function showAuthToast(message, type) {
    const existing = document.getElementById('auth-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'auth-toast';
    toast.style.cssText = `
        position: fixed; top: 1.5rem; right: 1.5rem; z-index: 10000;
        padding: 0.75rem 1.25rem; border-radius: 0.75rem;
        font-size: 0.875rem; font-weight: 500;
        backdrop-filter: blur(12px);
        transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        ${type === 'error'
            ? 'background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5;'
            : 'background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7;'}
    `;
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function checkAuthOnLoad() {
    if (Auth.isAuthenticated()) {
        updateAuthUI();
        document.getElementById('auth-overlay').classList.add('hidden');
        document.body.classList.remove('modal-open');
    } else {
        document.getElementById('auth-overlay').classList.remove('hidden');
        document.body.classList.add('modal-open');
        const remembered = localStorage.getItem('vector_erp_remembered_email');
        if (remembered) {
            document.getElementById('auth-email').value = remembered;
            document.getElementById('auth-remember').checked = true;
        }
    }
}

// =============================================
// SETTINGS FUNCTIONS
// =============================================
// Settings functions are now in settings.js with Supabase integration

// =============================================
// MODULE DROPDOWN (FOR REPORTS)
// =============================================
function toggleModuleDropdown() {
    const dropdown = document.getElementById('report-module-options');
    dropdown.classList.toggle('hidden');
}

function updateModuleSelection() {
    const checkboxes = document.querySelectorAll('.module-checkbox');
    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    const textEl = document.getElementById('report-module-selected-text');
    if (selected.length === 0) {
        textEl.textContent = 'No Modules';
    } else if (selected.length === 8) {
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
    if (typeof filterReports === 'function') {
        filterReports();
    }
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

// =============================================
// INITIALIZATION ON PAGE LOAD
// =============================================
window.onload = async function() {
    // Check for public report URL handler
    if (window.location.hash === '#machine-public-report') {
        // Bypass auth and show reports tab directly
        document.getElementById('auth-overlay').classList.add('hidden');
        document.body.classList.remove('modal-open');
        
        // Show reports tab
        switchTab('reports');
        
        // Initialize reports data
        if (typeof filterReports === 'function') filterReports();
        
        return;
    }

    if (Auth?.initPromise) {
        await Auth.initPromise;
    }

    // Auth initialization
    if (typeof checkAuthOnLoad === 'function') checkAuthOnLoad();
    
    // Dashboard initialization
    if (typeof updateDashboardStats === 'function') await updateDashboardStats();
    if (typeof renderDashboardCharts === 'function') await renderDashboardCharts();
    
    // Received Orders initialization
    if (typeof renderOrdersTable === 'function') renderOrdersTable();
    
    // Active Work initialization (sidebar count + data)
    if (typeof fetchActiveWork === 'function') await fetchActiveWork();
    
    // Production chat unread indicator
    if (typeof startProductionUnreadPoll === 'function') startProductionUnreadPoll();
    
    // Machine Maintenance initialization
    if (typeof switchMachine === 'function') switchMachine('cnc');
    
    // Store Request initialization
    if (typeof renderStoreItemsTable === 'function') renderStoreItemsTable();
    
    // Completed Orders initialization
    if (typeof renderCompletedOrdersTable === 'function') renderCompletedOrdersTable();
    
    // Delivery initialization
    if (typeof initDeliveries === 'function') initDeliveries();
    
    // Installation initialization
    if (typeof initInstallations === 'function') initInstallations();
    
    // Machine Maintenance initialization with Supabase
    if (typeof initNotesData === 'function') await initNotesData();
    if (typeof setNotesFilter === 'function') setNotesFilter('all');
    
    // Notifications initialization with Supabase
    if (typeof initNotificationsData === 'function') await initNotificationsData();
    
    // Messages initialization with Supabase
    if (typeof initMessagesData === 'function') await initMessagesData();
    if (typeof renderMsgDropdown === 'function') await renderMsgDropdown();
    
    // Settings initialization with Supabase
    if (typeof initSettings === 'function') await initSettings();
    
    // Messages UI state
    const chatContainer = document.getElementById('msg-chat-container');
    const emptyState = document.getElementById('msg-empty-state');
    if (chatContainer) chatContainer.classList.add('hidden-chat');
    if (emptyState) emptyState.classList.add('active');
    
    // Note color picker initialization
    const noteColorButtons = document.querySelectorAll('.note-color-btn');
    if (noteColorButtons.length > 0) {
        noteColorButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                if (typeof selectedNoteColor !== 'undefined') {
                    selectedNoteColor = this.getAttribute('data-color');
                    noteColorButtons.forEach(b => b.classList.remove('ring-2', 'ring-white'));
                    this.classList.add('ring-2', 'ring-white');
                }
            });
        });
    }
    
    // Note checklist input handler
    const noteChecklistInput = document.getElementById('note-checklist-input');
    if (noteChecklistInput) {
        noteChecklistInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof addChecklistItemFromModal === 'function') addChecklistItemFromModal();
            }
        });
    }
    
    // Password strength checker
    const newPwdInput = document.getElementById('settings-new-password');
    if (newPwdInput) {
        newPwdInput.addEventListener('input', function() {
            if (typeof checkPasswordStrength === 'function') {
                checkPasswordStrength(this.value);
            }
        });
    }
};
