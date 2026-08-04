// Dashboard Section Component
// Renders the dashboard HTML with analytics charts and shortcut links

class DashboardSection {
    constructor() {
        this.supabase = window.supabase;
        this.analyticsData = {
            marketRequests: [],
            clients: [],
            invoices: [],
            researchLogins: [],
            digitalLogs: [],
            tenders: [],
            feedbacks: []
        };
        this.charts = {};
        this.render();
        this.loadAnalyticsData();
    }

    async refreshData() {
        await this.loadAnalyticsData();
    }

    async loadAnalyticsData() {
        try {
            // Load data from all mrk_* tables
            const [marketRequests, clients, invoices, researchLogins, digitalLogs, tenders, feedbacks] = await Promise.all([
                this.supabase.from('mrk_market_requests').select('*'),
                this.supabase.from('mrk_clients').select('*'),
                this.supabase.from('mrk_invoices').select('*'),
                this.supabase.from('mrk_research_logins').select('*'),
                this.supabase.from('mrk_digital_logs').select('*'),
                this.supabase.from('mrk_tenders').select('*'),
                this.supabase.from('mrk_feedbacks').select('*')
            ]);

            this.analyticsData.marketRequests = marketRequests.data || [];
            this.analyticsData.clients = clients.data || [];
            this.analyticsData.invoices = invoices.data || [];
            this.analyticsData.researchLogins = researchLogins.data || [];
            this.analyticsData.digitalLogs = digitalLogs.data || [];
            this.analyticsData.tenders = tenders.data || [];
            this.analyticsData.feedbacks = feedbacks.data || [];

            this.updateStats();
            this.renderCharts();
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }

    updateStats() {
        // Update stat cards with real data
        const stats = {
            totalRequests: this.analyticsData.marketRequests.length,
            pendingRequests: this.analyticsData.marketRequests.filter(r => r.status === 'pending').length,
            totalClients: this.analyticsData.clients.length,
            premiumClients: this.analyticsData.clients.filter(c => c.level === 'premium').length,
            totalInvoices: this.analyticsData.invoices.length,
            totalRevenue: this.analyticsData.invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0),
            totalDigitalLogs: this.analyticsData.digitalLogs.length,
            totalTenders: this.analyticsData.tenders.length,
            totalFeedbacks: this.analyticsData.feedbacks.length,
            avgFeedbackScore: this.analyticsData.feedbacks.length > 0
                ? (this.analyticsData.feedbacks.reduce((sum, f) => sum + (f.overall_score || 0), 0) / this.analyticsData.feedbacks.length).toFixed(1)
                : 0
        };

        // Update DOM elements
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        updateElement('stat-total-requests', stats.totalRequests);
        updateElement('stat-pending-requests', stats.pendingRequests);
        updateElement('stat-total-clients', stats.totalClients);
        updateElement('stat-premium-clients', stats.premiumClients);
        updateElement('stat-total-invoices', stats.totalInvoices);
        updateElement('stat-total-revenue', this.formatCurrency(stats.totalRevenue));
        updateElement('stat-digital-logs', stats.totalDigitalLogs);
        updateElement('stat-tenders', stats.totalTenders);
        updateElement('stat-feedbacks', stats.totalFeedbacks);
        updateElement('stat-avg-score', stats.avgFeedbackScore);
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2
        }).format(value || 0);
    }

    renderCharts() {
        this.renderRequestStatusChart();
        this.renderClientTypeChart();
        this.renderMonthlyRevenueChart();
        this.renderFeedbackGradeChart();
        this.renderDigitalChannelChart();
    }

    renderRequestStatusChart() {
        const ctx = document.getElementById('requestStatusChart');
        if (!ctx) return;

        if (this.charts.requestStatus) {
            this.charts.requestStatus.destroy();
        }

        const statusCounts = {
            pending: this.analyticsData.marketRequests.filter(r => r.status === 'pending').length,
            approved: this.analyticsData.marketRequests.filter(r => r.status === 'approved').length,
            rejected: this.analyticsData.marketRequests.filter(r => r.status === 'rejected').length
        };

        this.charts.requestStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                    data: [statusCounts.pending, statusCounts.approved, statusCounts.rejected],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { size: 11 } }
                    }
                }
            }
        });
    }

    renderClientTypeChart() {
        const ctx = document.getElementById('clientTypeChart');
        if (!ctx) return;

        if (this.charts.clientType) {
            this.charts.clientType.destroy();
        }

        const typeCounts = {
            organization: this.analyticsData.clients.filter(c => c.client_type === 'organization').length,
            personal: this.analyticsData.clients.filter(c => c.client_type === 'personal').length
        };

        this.charts.clientType = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Organization', 'Personal'],
                datasets: [{
                    data: [typeCounts.organization, typeCounts.personal],
                    backgroundColor: ['#2563eb', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { size: 11 } }
                    }
                }
            }
        });
    }

    renderMonthlyRevenueChart() {
        const ctx = document.getElementById('monthlyRevenueChart');
        if (!ctx) return;

        if (this.charts.monthlyRevenue) {
            this.charts.monthlyRevenue.destroy();
        }

        // Group invoices by month
        const monthlyData = {};
        this.analyticsData.invoices.forEach(inv => {
            const month = new Date(inv.invoice_date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!monthlyData[month]) monthlyData[month] = 0;
            monthlyData[month] += inv.grand_total || 0;
        });

        const labels = Object.keys(monthlyData).slice(-6);
        const data = labels.map(l => monthlyData[l]);

        this.charts.monthlyRevenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    label: 'Revenue (ETB)',
                    data: data.length ? data : [0],
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#233554' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderFeedbackGradeChart() {
        const ctx = document.getElementById('feedbackGradeChart');
        if (!ctx) return;

        if (this.charts.feedbackGrade) {
            this.charts.feedbackGrade.destroy();
        }

        const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
        this.analyticsData.feedbacks.forEach(f => {
            if (gradeCounts[f.grade] !== undefined) gradeCounts[f.grade]++;
        });

        this.charts.feedbackGrade = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Grade A', 'Grade B', 'Grade C', 'Grade D'],
                datasets: [{
                    label: 'Count',
                    data: [gradeCounts.A, gradeCounts.B, gradeCounts.C, gradeCounts.D],
                    backgroundColor: ['#10b981', '#2563eb', '#f59e0b', '#ef4444'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: '#233554' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderDigitalChannelChart() {
        const ctx = document.getElementById('digitalChannelChart');
        if (!ctx) return;

        if (this.charts.digitalChannel) {
            this.charts.digitalChannel.destroy();
        }

        const channelCounts = {};
        this.analyticsData.digitalLogs.forEach(d => {
            const channel = d.social_channel || 'Unspecified';
            if (!channelCounts[channel]) channelCounts[channel] = 0;
            channelCounts[channel]++;
        });

        const labels = Object.keys(channelCounts);
        const data = Object.values(channelCounts);

        this.charts.digitalChannel = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { size: 11 } }
                    }
                }
            }
        });
    }

    render() {
        const container = document.getElementById('view-dashboard');
        if (container) {
            container.innerHTML = `
    <div class="dashboard-container">
        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-clipboard-list"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Total Requests</p>
                    <h3 class="stat-value" id="stat-total-requests">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon amber"><i class="fas fa-clock"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Pending Requests</p>
                    <h3 class="stat-value" id="stat-pending-requests">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon violet"><i class="fas fa-users"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Total Clients</p>
                    <h3 class="stat-value" id="stat-total-clients">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon emerald"><i class="fas fa-crown"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Premium Clients</p>
                    <h3 class="stat-value" id="stat-premium-clients">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-file-invoice-dollar"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Total Invoices</p>
                    <h3 class="stat-value" id="stat-total-invoices">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon emerald"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Total Revenue</p>
                    <h3 class="stat-value" id="stat-total-revenue">ETB 0.00</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon violet"><i class="fas fa-share-alt"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Digital Logs</p>
                    <h3 class="stat-value" id="stat-digital-logs">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon amber"><i class="fas fa-briefcase"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Tenders</p>
                    <h3 class="stat-value" id="stat-tenders">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon rose"><i class="fas fa-star"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Feedbacks</p>
                    <h3 class="stat-value" id="stat-feedbacks">0</h3>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-chart-line"></i></div>
                <div class="stat-info">
                    <p class="stat-label">Avg Score</p>
                    <h3 class="stat-value" id="stat-avg-score">0</h3>
                </div>
            </div>
        </div>

        <!-- Shortcut Links -->
        <div class="shortcut-section">
            <h3 class="section-title"><i class="fas fa-bolt"></i> Quick Access</h3>
            <div class="shortcut-grid">
                <div class="shortcut-card" onclick="switchView('marketRequest')">
                    <div class="shortcut-icon blue"><i class="fas fa-clipboard-list"></i></div>
                    <h4>Market Requests</h4>
                    <span>Manage marketing requests</span>
                </div>
                <div class="shortcut-card" onclick="switchView('clientRegistry')">
                    <div class="shortcut-icon violet"><i class="fas fa-users"></i></div>
                    <h4>Client Registry</h4>
                    <span>View all clients</span>
                </div>
                <div class="shortcut-card" onclick="switchView('invoice')">
                    <div class="shortcut-icon emerald"><i class="fas fa-file-invoice-dollar"></i></div>
                    <h4>Invoices</h4>
                    <span>Billing & payments</span>
                </div>
                <div class="shortcut-card" onclick="switchView('research')">
                    <div class="shortcut-icon amber"><i class="fas fa-search"></i></div>
                    <h4>Research Login</h4>
                    <span>Research activities</span>
                </div>
                <div class="shortcut-card" onclick="switchView('digitalLog')">
                    <div class="shortcut-icon blue"><i class="fas fa-share-alt"></i></div>
                    <h4>Digital Log</h4>
                    <span>Content & social media</span>
                </div>
                <div class="shortcut-card" onclick="switchView('tender')">
                    <div class="shortcut-icon rose"><i class="fas fa-briefcase"></i></div>
                    <h4>Tenders</h4>
                    <span>Procurement bids</span>
                </div>
                <div class="shortcut-card" onclick="switchView('feedback')">
                    <div class="shortcut-icon emerald"><i class="fas fa-star"></i></div>
                    <h4>Feedback</h4>
                    <span>Client reviews</span>
                </div>
                <div class="shortcut-card" onclick="switchView('reports')">
                    <div class="shortcut-icon violet"><i class="fas fa-chart-bar"></i></div>
                    <h4>Reports</h4>
                    <span>Detailed analytics</span>
                </div>
            </div>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
            <div class="chart-card">
                <div class="panel-title">
                    <span>Request Status</span>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="chart-container">
                    <canvas id="requestStatusChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="panel-title">
                    <span>Client Types</span>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="chart-container">
                    <canvas id="clientTypeChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="panel-title">
                    <span>Monthly Revenue</span>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="chart-container">
                    <canvas id="monthlyRevenueChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="panel-title">
                    <span>Feedback Grades</span>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="chart-container">
                    <canvas id="feedbackGradeChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="panel-title">
                    <span>Digital Channels</span>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="chart-container">
                    <canvas id="digitalChannelChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="panel-title">
                    <span>Recent Activity</span>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <div class="activity-list" id="recentActivity">
                    <div class="activity-item">
                        <div class="activity-icon blue"><i class="fas fa-info-circle"></i></div>
                        <div class="activity-content">
                            <p class="activity-text">Loading data...</p>
                            <span class="activity-time">Please wait</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
        }
    }
}

// Initialize section
let dashboardInstance;
document.addEventListener('DOMContentLoaded', () => {
    dashboardInstance = new DashboardSection();
});
