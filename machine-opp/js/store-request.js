// =============================================
// STORE REQUEST MODULE
// =============================================

// Sample data for store items
let localStoreItemsList = [
    {
        taskNum: '0001/09',
        title: 'UV Print Acrylic Sign',
        date: '2026-06-02',
        material: 'Acrylic',
        unit: 'Sheets',
        qty: '5',
        thickness: '4mm',
        color: 'Transparent Glossy',
        length: '600',
        width: '400',
        height: '12',
        gram: '150'
    },
    {
        taskNum: '0003/09',
        title: 'Acrylic Signage Project',
        date: '2026-06-03',
        material: 'Cast Acrylic',
        unit: 'Sheets',
        qty: '3',
        thickness: '6mm',
        color: 'White Glossy',
        length: '900',
        width: '450',
        height: '15',
        gram: '320'
    },
    {
        taskNum: '0005/09',
        title: 'Steel Bracket Cutting',
        date: '2026-06-04',
        material: 'Mild Steel',
        unit: 'Sheets',
        qty: '2',
        thickness: '8mm',
        color: 'Raw Metal',
        length: '500',
        width: '300',
        height: '8',
        gram: '950'
    }
];

// =============================================
// ADD STORE ITEM
// =============================================
function addStoreItem() {
    const taskNum = document.getElementById('store-task-num').value;
    const title = document.getElementById('store-project-title').value;
    const date = document.getElementById('store-date').value;
    const material = document.getElementById('store-material').value;
    const unit = document.getElementById('store-unit').value;
    const qty = document.getElementById('store-qty').value;
    const thickness = document.getElementById('store-thickness').value;
    const color = document.getElementById('store-color').value;
    const length = document.getElementById('store-length').value;
    const width = document.getElementById('store-width').value;
    const height = document.getElementById('store-height').value;
    const gram = document.getElementById('store-gram').value;

    // Simple validation to check that order number and title are present
    if (!taskNum || !title) {
        alert('Please enter at least Order Number and Project Title!');
        return;
    }

    // Create item object representation
    const item = { taskNum, title, date, material, unit, qty, thickness, color, length, width, height, gram };
    localStoreItemsList.push(item);

    // Redraw dynamic list table
    renderStoreItemsTable();

    // Auto Reset Form Fields for next input
    document.getElementById('store-task-num').value = '';
    document.getElementById('store-project-title').value = '';
    document.getElementById('store-date').value = '';
    document.getElementById('store-material').value = '';
    document.getElementById('store-unit').value = '';
    document.getElementById('store-qty').value = '';
    document.getElementById('store-thickness').value = '';
    document.getElementById('store-color').value = '';
    document.getElementById('store-length').value = '';
    document.getElementById('store-width').value = '';
    document.getElementById('store-height').value = '';
    document.getElementById('store-gram').value = '';

    // Focus on first element for next clean writing sequence
    document.getElementById('store-task-num').focus();
}

// =============================================
// UPDATE STORE STATS
// =============================================
function updateStoreStats() {
    const total = localStoreItemsList.length;
    const totalQty = localStoreItemsList.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
    
    const totalEl = document.getElementById('store-stats-total');
    const qtyEl = document.getElementById('store-stats-qty');
    const pendingEl = document.getElementById('store-stats-pending');
    
    if (totalEl) totalEl.textContent = total;
    if (qtyEl) qtyEl.textContent = totalQty;
    if (pendingEl) pendingEl.textContent = total;
    
    // Update dispatch count badge dynamically
    const dispatchBadge = document.getElementById('dispatch-count-badge');
    if (dispatchBadge) {
        dispatchBadge.textContent = total;
        if (total > 0) {
            dispatchBadge.classList.remove('hidden');
        } else {
            dispatchBadge.classList.add('hidden');
        }
    }
}

// =============================================
// RENDER STORE ITEMS TABLE
// =============================================
function renderStoreItemsTable() {
    const tbody = document.getElementById('store-added-items-body');
    const badge = document.getElementById('store-counter-badge');
    
    if (!tbody || !badge) {
        return;
    }
    
    const noResults = document.getElementById('store-no-results');
    
    if (localStoreItemsList.length === 0) {
        // Show placeholder, hide no results
        tbody.innerHTML = `
            <tr id="store-empty-placeholder" class="text-slate-500 italic">
                <td colspan="7" class="p-8 text-center">No items registered yet. Please fill the form on the right and click "Add Item".</td>
            </tr>
        `;
        if (noResults) noResults.classList.add('hidden');
        badge.innerText = "0 Items";
        updateStoreStats();
        return;
    }

    // Build table content
    let tableContent = '';
    localStoreItemsList.forEach((item, index) => {
        tableContent += `
            <tr class="order-row hover:bg-blue-600/10 transition-colors relative" data-index="${index}">
                <td class="p-3 text-center font-mono font-medium text-slate-400">${String(index + 1).padStart(2, '0')}</td>
                <td class="p-3 font-mono text-xs">${item.date || '-'}</td>
                <td class="p-3 font-mono font-semibold text-blue-400">${item.taskNum}</td>
                <td class="p-3 text-slate-100 font-medium">${item.title}</td>
                <td class="p-3 text-slate-300">${item.material || '-'} ${item.thickness ? `<span class="text-slate-500">(${item.thickness})</span>` : ''} - <span class="text-slate-500">${item.color || '-'}</span></td>
                <td class="p-3 text-center">
                    <span class="inline-flex items-center justify-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                        ${item.qty || '0'} <span class="text-[10px] text-slate-500 ml-1">${item.unit || 'pcs'}</span>
                    </span>
                </td>
                <td class="p-3 font-mono text-slate-400 text-[10px]">${item.length || '-'} × ${item.width || '-'} × ${item.height || '-'} | ${item.gram || '-'}g</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = tableContent;
    if (noResults) noResults.classList.add('hidden');
    badge.innerText = `${localStoreItemsList.length} Item${localStoreItemsList.length > 1 ? 's' : ''}`;

    updateStoreStats();
}

// =============================================
// SUBMIT STORE REQUEST FINAL
// =============================================
function submitStoreRequestFinal() {
    if (localStoreItemsList.length === 0) {
        alert('No items registered. Please add items first!');
        return;
    }
    const totalQty = localStoreItemsList.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);
    alert(`Store request for ${localStoreItemsList.length} items (Total quantity: ${totalQty}) has been successfully dispatched to the store department!`);
    localStoreItemsList = [];
    renderStoreItemsTable();
    
    // Reset dispatch badge after dispatch
    const dispatchBadge = document.getElementById('dispatch-count-badge');
    if (dispatchBadge) {
        dispatchBadge.textContent = '0';
        dispatchBadge.classList.add('hidden');
    }
}