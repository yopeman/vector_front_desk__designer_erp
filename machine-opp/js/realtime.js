// =============================================
// REALTIME.JS - Live Data Sync (no page reload)
// =============================================
// Subscribes to Supabase Realtime (postgres_changes) and refreshes only the
// active tab via window.refreshActiveTabData. A gentle 30s poll acts as a
// fallback in case realtime is not enabled on a table or a websocket drops.

(function () {
    if (typeof window.supabase === 'undefined') return;

    var WATCH_TABLES = [
        'production_orders',
        'job_orders',
        'machines',
        'inventory',
        'inventory_movements',
        'deliveries',
        'installations',
        'notes',
        'messages',
        'notifications',
        'read_notifications',
        'users',
        'files',
        'designs',
        'production_communications',
        'machine_maintenance_logs',
        'machine_maintenance_checklists'
    ];

    var REFRESH_DEBOUNCE_MS = 1500;
    var POLL_MS = 30000;

    var debounceTimer = null;
    var suppressRefresh = false;

    function isModalOpen() {
        return document.body.classList.contains('modal-open');
    }

    function refreshActiveTab() {
        // Never interrupt the user while they are typing in a modal/form
        if (suppressRefresh || isModalOpen()) return;
        if (typeof window.refreshActiveTabData === 'function') {
            try {
                window.refreshActiveTabData();
            } catch (error) {
                console.error('Realtime refresh error:', error);
            }
        }
    }

    function scheduleRefresh() {
        if (document.hidden) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            debounceTimer = null;
            refreshActiveTab();
        }, REFRESH_DEBOUNCE_MS);
    }

    function startRealtime() {
        var channel = window.supabase.channel('machine-opp-realtime');

        WATCH_TABLES.forEach(function (table) {
            channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table },
                function () {
                    scheduleRefresh();
                }
            );
        });

        channel.subscribe();

        // Fallback gentle polling: keeps the active tab fresh even if realtime
        // is not enabled on a table (no full page reload).
        setInterval(function () {
            refreshActiveTab();
        }, POLL_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startRealtime);
    } else {
        startRealtime();
    }
})();