// =============================================
// INVENTORY MOVEMENTS MODULE
// =============================================

let inventoryMovements = [];
let inventoryItemsList = [];

// =============================================
// LOAD INVENTORY MOVEMENTS FROM SUPABASE
// =============================================
async function loadInventoryMovements() {
    try {
        const { data, error } = await supabase
            .from('inventory_movements')
            .select(`
                *,
                inventory:inventory_id(name, item_code),
                machines:machine_id(name),
                production_orders:production_order_id(id),
                users:performed_by(username)
            `)
            .order('movement_date', { ascending: false });

        if (error) throw error;
        
        inventoryMovements = data || [];
        renderMovementsTable();
        updateMovementsStats();
    } catch (error) {
        console.error('Error loading movements:', error);
        alert('Failed to load stock movements');
    }
}

// =============================================
// LOAD INVENTORY ITEMS FOR SELECT
// =============================================
async function loadInventoryItemsForSelect() {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('id, name, item_code, current_quantity')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;
        
        inventoryItemsList = data || [];
    } catch (error) {
        console.error('Error loading inventory items:', error);
    }
}

// =============================================
// RENDER MOVEMENTS TABLE
// =============================================
function renderMovementsTable() {
    const tbody = document.getElementById('movements-body');
    const searchTerm = document.getElementById('movement-search')?.value?.toLowerCase() || '';
    const filterType = document.getElementById('movement-filter-type')?.value || '';
    
    if (!tbody) return;

    const noResults = document.getElementById('movements-no-results');
    
    // Filter movements based on search and type
    const filteredMovements = inventoryMovements.filter(movement => {
        const matchesSearch = 
            (movement.inventory?.name?.toLowerCase() || '').includes(searchTerm) ||
            (movement.reference_type?.toLowerCase() || '').includes(searchTerm) ||
            (movement.notes?.toLowerCase() || '').includes(searchTerm);
        
        const matchesType = !filterType || movement.movement_type === filterType;
        
        return matchesSearch && matchesType;
    });

    if (filteredMovements.length === 0) {
        tbody.innerHTML = `
            <tr id="movements-empty-placeholder" class="text-slate-500 italic">
                <td colspan="10" class="p-8 text-center">No stock movements found. Click "Stock IN" or "Stock OUT" to record movements.</td>
            </tr>
        `;
        if (noResults) noResults.classList.remove('hidden');
        return;
    }

    let tableContent = '';
    filteredMovements.forEach((movement, index) => {
        const isIn = movement.movement_type === 'in';
        const typeClass = isIn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
        const typeIcon = isIn ? 'fa-arrow-down' : 'fa-arrow-up';
        const date = new Date(movement.movement_date).toLocaleDateString();
        
        tableContent += `
            <tr class="hover:bg-blue-600/10 transition-colors">
                <td class="p-3 text-center font-mono font-medium text-slate-400">${String(index + 1).padStart(2, '0')}</td>
                <td class="p-3 font-mono text-xs text-slate-300">${date}</td>
                <td class="p-3 text-slate-100 font-medium">
                    ${movement.inventory?.name || 'Unknown'}
                    ${movement.inventory?.item_code ? `<span class="text-slate-500 text-xs ml-1">(${movement.inventory.item_code})</span>` : ''}
                </td>
                <td class="p-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${typeClass}">
                        <i class="fa-solid ${typeIcon}"></i>
                        ${movement.movement_type.toUpperCase()}
                    </span>
                </td>
                <td class="p-3 text-center">
                    <span class="inline-flex items-center justify-center px-2.5 py-1 bg-slate-700/50 text-slate-200 rounded-lg text-xs font-bold border border-slate-600/30">
                        ${movement.quantity}
                    </span>
                </td>
                <td class="p-3 text-slate-300">${movement.reference_type || '-'}</td>
                <td class="p-3 text-slate-400 text-xs">${movement.users?.username || '-'}</td>
                <td class="p-3 text-slate-400 text-xs max-w-[150px] truncate">${movement.notes || '-'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = tableContent;
    if (noResults) noResults.classList.add('hidden');
}

// =============================================
// UPDATE MOVEMENTS STATS
// =============================================
function updateMovementsStats() {
    const totalIn = inventoryMovements.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
    const totalOut = inventoryMovements.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
    
    const today = new Date().toDateString();
    const todayMovements = inventoryMovements.filter(m => new Date(m.movement_date).toDateString() === today).length;
    const totalMovements = inventoryMovements.length;

    const inEl = document.getElementById('movements-stats-in');
    const outEl = document.getElementById('movements-stats-out');
    const todayEl = document.getElementById('movements-stats-today');
    const totalEl = document.getElementById('movements-stats-total');

    if (inEl) inEl.textContent = totalIn;
    if (outEl) outEl.textContent = totalOut;
    if (todayEl) todayEl.textContent = todayMovements;
    if (totalEl) totalEl.textContent = totalMovements;
}

// =============================================
// OPEN MOVEMENT MODAL
// =============================================
async function openMovementModal(type, preselectedItemId = null) {
    await loadInventoryItemsForSelect();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.id = 'movement-modal';
    
    const isIn = type === 'in';
    const typeClass = isIn ? 'from-emerald-600 to-emerald-700' : 'from-red-500 to-red-600';
    const typeIcon = isIn ? 'fa-arrow-down' : 'fa-arrow-up';

    // Build inventory options
    const inventoryOptions = inventoryItemsList.map(item => 
        `<option value="${item.id}" ${item.id === preselectedItemId ? 'selected' : ''}>${item.name} ${item.item_code ? `(${item.item_code})` : ''}</option>`
    ).join('');

    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-lg shadow-2xl">
            <div class="p-6 border-b border-slate-700/50">
                <h3 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid ${typeIcon} text-${isIn ? 'emerald' : 'red'}-400"></i>
                    Record Stock ${type.toUpperCase()}
                </h3>
            </div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Item *</label>
                    <select id="mov-inventory-id" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-${isIn ? 'emerald' : 'red'}-500 focus:ring-1 focus:ring-${isIn ? 'emerald' : 'red'}-500/20 transition-all">
                        <option value="">Select an item...</option>
                        ${inventoryOptions}
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quantity *</label>
                        <input type="number" id="mov-quantity" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-${isIn ? 'emerald' : 'red'}-500 focus:ring-1 focus:ring-${isIn ? 'emerald' : 'red'}-500/20 transition-all" placeholder="0" min="0">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reference Type</label>
                        <select id="mov-reference-type" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-${isIn ? 'emerald' : 'red'}-500 focus:ring-1 focus:ring-${isIn ? 'emerald' : 'red'}-500/20 transition-all">
                            <option value="">Select type...</option>
                            <option value="received">Received</option>
                            <option value="rework">Rework</option>
                            <option value="delivery">Delivery</option>
                            <option value="installation">Installation</option>
                            <option value="adjustment">Adjustment</option>
                            <option value="return">Return</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                    <textarea id="mov-notes" rows="2" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-${isIn ? 'emerald' : 'red'}-500 focus:ring-1 focus:ring-${isIn ? 'emerald' : 'red'}-500/20 transition-all resize-none" placeholder="Optional notes..."></textarea>
                </div>
            </div>
            <div class="p-6 border-t border-slate-700/50 flex justify-end gap-3">
                <button onclick="closeMovementModal()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all">Cancel</button>
                <button onclick="saveMovement('${type}')" class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r ${typeClass} hover:opacity-90 text-white shadow-lg shadow-${isIn ? 'emerald' : 'red'}-500/15 transition-all">
                    Record Movement
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeMovementModal();
    });
}

// =============================================
// CLOSE MOVEMENT MODAL
// =============================================
function closeMovementModal() {
    const modal = document.getElementById('movement-modal');
    if (modal) modal.remove();
}

// =============================================
// SAVE MOVEMENT
// =============================================
async function saveMovement(type) {
    const inventoryId = document.getElementById('mov-inventory-id').value;
    const quantity = document.getElementById('mov-quantity').value;
    const referenceType = document.getElementById('mov-reference-type').value;
    const notes = document.getElementById('mov-notes').value;

    if (!inventoryId || !quantity) {
        alert('Please select an item and enter quantity');
        return;
    }

    try {
        const currentUser = Auth.getCurrentUser();
        
        const movementData = {
            inventory_id: inventoryId,
            movement_type: type,
            quantity: parseFloat(quantity),
            reference_type: referenceType || null,
            performed_by: currentUser?.id || null,
            notes: notes || null,
            movement_date: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        // Insert movement
        const { error: movementError } = await supabase
            .from('inventory_movements')
            .insert([movementData]);

        if (movementError) throw movementError;

        // Update inventory quantity
        const currentItem = inventoryItemsList.find(i => i.id === inventoryId);
        if (currentItem) {
            const currentQty = parseFloat(currentItem.current_quantity) || 0;
            const newQty = type === 'in' ? currentQty + parseFloat(quantity) : currentQty - parseFloat(quantity);
            
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ 
                    current_quantity: newQty,
                    updated_at: new Date().toISOString()
                })
                .eq('id', inventoryId);

            if (updateError) throw updateError;
        }

        closeMovementModal();
        loadInventoryMovements();
        
        // Also reload inventory to update quantities
        if (typeof loadInventoryItems === 'function') {
            loadInventoryItems();
        }
    } catch (error) {
        console.error('Error saving movement:', error);
        alert('Failed to record stock movement');
    }
}

// =============================================
// REFRESH MOVEMENTS
// =============================================
function refreshMovements() {
    loadInventoryMovements();
}

// =============================================
// SEARCH AND FILTER HANDLERS
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('movement-search');
    const filterSelect = document.getElementById('movement-filter-type');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderMovementsTable);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', renderMovementsTable);
    }
    
    // Load movements on page load
    loadInventoryMovements();
});
