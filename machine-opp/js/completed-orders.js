// =============================================
// COMPLETED ORDERS MODULE
// =============================================

let completedOrdersLoaded = false;

// =============================================
// FETCH COMPLETED ORDERS FROM SUPABASE
// =============================================
async function fetchCompletedOrders() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .eq('status', 'Completed')
        .order('completed_at', { ascending: false });

    if (error) {
        console.error('Error fetching completed orders:', error);
        return;
    }

    // Fetch machines for name lookup
    const machines = await fetchMachines();
    const machinesMap = {};
    machines.forEach(m => {
        machinesMap[m.id] = m.name;
    });

    completedOrdersData = (data || []).map(row => {
        // Format date - try multiple fields
        let formattedDate = '';
        const dateValue = row.created_at || row.date || row.completed_at;
        
        if (dateValue) {
            try {
                // Handle ISO timestamp format like "2026-08-01T08:39:15.67197+00:00"
                const dateStr = String(dateValue).split('T')[0]; // Get "2026-08-01" part
                const [year, month, day] = dateStr.split('-');
                if (year && month && day) {
                    formattedDate = `${day}/${month}/${year.slice(-2)}`;
                } else {
                    formattedDate = dateValue;
                }
            } catch (e) {
                formattedDate = String(dateValue);
            }
        }

        return {
            id: row.id,
            no: row.id.slice(0, 8),
            date: formattedDate,
            taskType: row.task_type || 'task',
            orderNum: row.order_number || 'N/A',
            title: row.title || 'Untitled',
            machine: machinesMap[row.machine_id] || row.machine || 'N/A',
            material: row.material || 'N/A',
            thickness: row.thickness || 'N/A',
            color: row.color || 'N/A',
            length: row.length || 'N/A',
            width: row.width || 'N/A',
            area: row.area || 0,
            quality: row.quality || 'Pass',
            status: row.status || 'Completed',
            completedAt: row.completed_at
        };
    });

    completedOrdersLoaded = true;
}

// =============================================
// RENDER COMPLETED ORDERS TABLE
// =============================================
async function renderCompletedOrdersTable() {
    const tbody = document.getElementById('completed-orders-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Fetch data if not loaded
    if (!completedOrdersLoaded) {
        await fetchCompletedOrders();
    }

    if (completedOrdersData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" class="p-8 text-center text-slate-500 italic">No completed orders yet. Mark orders as complete from the Received Order Status popup.</td></tr>';
        return;
    }

    completedOrdersData.forEach((order, index) => {
        const row = document.createElement('tr');
        row.className = 'order-row hover:bg-blue-600/10 transition-colors';
        row.innerHTML = `
            <td class="p-4 text-center font-mono text-slate-500">${String(index + 1).padStart(2, '0')}</td>
            <td class="p-4 font-mono">${order.date}</td>
            <td class="p-4"><span class="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 capitalize">${order.taskType}</span></td>
            <td class="p-4 font-mono">${order.orderNum}</td>
            <td class="p-4 font-medium">${order.title}</td>
            <td class="p-4 font-mono text-xs">${order.machine}</td>
            <td class="p-4 text-slate-400">${order.material}</td>
            <td class="p-4 font-mono text-xs">${order.thickness}</td>
            <td class="p-4">${order.color}</td>
            <td class="p-4 font-mono text-xs">${order.length}</td>
            <td class="p-4 font-mono text-xs">${order.width}</td>
            <td class="p-4 font-mono text-xs">${order.area}</td>
            <td class="p-4 text-emerald-400 text-xs font-bold">${order.quality}</td>
            <td class="p-4"><span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20">${order.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// =============================================
// SAVE BATON
// =============================================
async function saveBaton() {
    if (currentOrderIndex < 0 || !ordersData[currentOrderIndex]) {
        alert('No order selected.');
        return;
    }

    const order = ordersData[currentOrderIndex];
    if (!order || !order.id) return;

    const updates = {
        status: order.status || 'New',
        started_at: order.startedAt || null,
        completed_at: order.completedAt || null,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('production_orders')
        .update(updates)
        .eq('id', order.id);

    if (error) {
        console.error('Error saving baton:', error);
        alert('Failed to save changes. Please try again.');
        return;
    }

    // Refresh local data from Supabase
    await fetchReceivedOrders();
    renderOrdersTable();

    // Close the modal
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }

    alert('Baton saved successfully! Order state has been updated.');
}

// =============================================
// FILTER COMPLETED ORDERS
// =============================================
function filterCompletedOrders(searchTerm) {
    const tbody = document.getElementById('completed-orders-body');
    if (!tbody) return;

    if (!searchTerm || searchTerm.trim() === '') {
        // Show all orders if search is empty
        renderCompletedOrdersTable();
        return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filteredOrders = completedOrdersData.filter(order => {
        return (
            order.date.toLowerCase().includes(term) ||
            order.taskType.toLowerCase().includes(term) ||
            String(order.orderNum).toLowerCase().includes(term) ||
            order.title.toLowerCase().includes(term) ||
            order.machine.toLowerCase().includes(term) ||
            order.material.toLowerCase().includes(term) ||
            order.thickness.toLowerCase().includes(term) ||
            order.color.toLowerCase().includes(term) ||
            String(order.length).toLowerCase().includes(term) ||
            String(order.width).toLowerCase().includes(term) ||
            String(order.area).toLowerCase().includes(term) ||
            order.quality.toLowerCase().includes(term) ||
            order.status.toLowerCase().includes(term)
        );
    });

    tbody.innerHTML = '';

    if (filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" class="p-8 text-center text-slate-500 italic">No matching orders found.</td></tr>';
        return;
    }

    filteredOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        row.className = 'order-row hover:bg-blue-600/10 transition-colors';
        row.innerHTML = `
            <td class="p-4 text-center font-mono text-slate-500">${String(index + 1).padStart(2, '0')}</td>
            <td class="p-4 font-mono">${order.date}</td>
            <td class="p-4"><span class="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 capitalize">${order.taskType}</span></td>
            <td class="p-4 font-mono">${order.orderNum}</td>
            <td class="p-4 font-medium">${order.title}</td>
            <td class="p-4 font-mono text-xs">${order.machine}</td>
            <td class="p-4 text-slate-400">${order.material}</td>
            <td class="p-4 font-mono text-xs">${order.thickness}</td>
            <td class="p-4">${order.color}</td>
            <td class="p-4 font-mono text-xs">${order.length}</td>
            <td class="p-4 font-mono text-xs">${order.width}</td>
            <td class="p-4 font-mono text-xs">${order.area}</td>
            <td class="p-4 text-emerald-400 text-xs font-bold">${order.quality}</td>
            <td class="p-4"><span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20">${order.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// =============================================
// INITIALIZE COMPLETED ORDERS
// =============================================
async function initCompletedOrders() {
    if (!completedOrdersLoaded) {
        await fetchCompletedOrders();
    }
    renderCompletedOrdersTable();

    // Add search event listener
    const searchInput = document.getElementById('completed-orders-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterCompletedOrders(e.target.value);
        });
    }
}

// =============================================
// EXPORT COMPLETED ORDERS TO PDF
// =============================================
function exportPDF() {
    const tableRows = document.querySelectorAll('#content-completed-orders tbody tr');
    if (tableRows.length === 0) {
        alert('No data available to export.');
        return;
    }

    // Build form-style HTML for each order
    let ordersHTML = '';
    tableRows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 14) {
            ordersHTML += `
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid;">
                    <div style="background: #0f172a; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #3b82f6;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #60a5fa;">Order #${cells[0].textContent.trim()} - ${cells[4].textContent.trim()}</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Date</label>
                            <span style="color: #e2e8f0; font-weight: 500;">${cells[1].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Task/Project</label>
                            <span style="color: #e2e8f0; font-weight: 500;">${cells[2].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Order Number</label>
                            <span style="color: #e2e8f0; font-weight: 500; font-family: monospace;">${cells[3].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Machine Used</label>
                            <span style="color: #e2e8f0; font-weight: 500; font-family: monospace;">${cells[5].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Material Used</label>
                            <span style="color: #e2e8f0; font-weight: 500;">${cells[6].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Thickness</label>
                            <span style="color: #e2e8f0; font-weight: 500; font-family: monospace;">${cells[7].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Color</label>
                            <span style="color: #e2e8f0; font-weight: 500;">${cells[8].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Dimensions (L×W)</label>
                            <span style="color: #e2e8f0; font-weight: 500; font-family: monospace;">${cells[9].textContent.trim()} × ${cells[10].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Area</label>
                            <span style="color: #e2e8f0; font-weight: 500; font-family: monospace;">${cells[11].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Quality</label>
                            <span style="color: #10b981; font-weight: 700;">${cells[12].textContent.trim()}</span>
                        </div>
                        <div style="background: #0f172a; padding: 8px; border-radius: 4px; grid-column: 1 / -1;">
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Status</label>
                            <span style="color: #10b981; font-weight: 700; text-transform: uppercase;">${cells[13].textContent.trim()}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    // Create wrapper div with header info
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div style="padding: 25px; font-family: 'Inter', sans-serif; background: #0f172a; color: #fff;">
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6;">
                <h1 style="font-size: 26px; font-weight: bold; margin: 0 0 8px 0; color: #fff;">Completed Order Status</h1>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">Generated on: ${new Date().toLocaleString()}</p>
                <p style="font-size: 10px; color: #64748b; margin: 5px 0 0 0;">Total Orders: ${tableRows.length}</p>
            </div>
            ${ordersHTML}
            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #334155; font-size: 10px; color: #64748b; text-align: center;">
                <p style="margin: 0;">ERP System v2.0 - Vector for Engineering</p>
                <p style="margin: 5px 0 0 0;">This is a computer-generated document. No signature required.</p>
            </div>
        </div>
    `;

    // PDF options
    const opt = {
        margin: 15,
        filename: `completed_orders_${new Date().toISOString().split('T')[0]}.pdf`,
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

    // Generate and download PDF
    exportToPDF(wrapper, `completed_orders_${new Date().toISOString().split('T')[0]}.pdf`);
}