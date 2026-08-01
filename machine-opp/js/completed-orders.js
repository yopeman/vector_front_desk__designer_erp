// =============================================
// COMPLETED ORDERS MODULE
// =============================================



// =============================================
// RENDER COMPLETED ORDERS TABLE
// =============================================
function renderCompletedOrdersTable() {
    const tbody = document.getElementById('completed-orders-body');
    if (!tbody) return;

    tbody.innerHTML = '';

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
                <h1 style="font-size: 26px; font-weight: bold; margin: 0 0 8px 0; color: #fff;">Completed Order Status List</h1>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">Generated on: ${new Date().toLocaleString()}</p>
                <p style="font-size: 10px; color: #64748b; margin: 5px 0 0 0;">Total Orders: ${tableRows.length}</p>
            </div>
            ${ordersHTML}
            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #334155; font-size: 10px; color: #64748b; text-align: center;">
                <p style="margin: 0;">ERP System v2.0 - Machine Operation Management</p>
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