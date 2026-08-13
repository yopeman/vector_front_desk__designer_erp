// =============================================
// INVENTORY MODULE
// =============================================

let inventoryItems = [];

// =============================================
// LOAD INVENTORY ITEMS FROM SUPABASE
// =============================================
async function loadInventoryItems() {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        inventoryItems = data || [];
        renderInventoryTable();
        updateInventoryStats();
    } catch (error) {
        console.error('Error loading inventory:', error);
        alert('Failed to load inventory items');
    }
}

// =============================================
// RENDER INVENTORY TABLE
// =============================================
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-items-body');
    const searchTerm = document.getElementById('inventory-search')?.value?.toLowerCase() || '';
    
    if (!tbody) return;

    const noResults = document.getElementById('inventory-no-results');
    
    // Filter items based on search
    const filteredItems = inventoryItems.filter(item => 
        (item.item_code?.toLowerCase() || '').includes(searchTerm) ||
        (item.name?.toLowerCase() || '').includes(searchTerm) ||
        (item.category?.toLowerCase() || '').includes(searchTerm)
    );

    if (filteredItems.length === 0) {
        tbody.innerHTML = `
            <tr id="inventory-empty-placeholder" class="text-slate-500 italic">
                <td colspan="10" class="p-8 text-center">No inventory items found. Click "Add New Item" to add items.</td>
            </tr>
        `;
        if (noResults) noResults.classList.remove('hidden');
        return;
    }

    let tableContent = '';
    filteredItems.forEach((item, index) => {
        const isLowStock = item.current_quantity <= item.minimum_stock;
        const statusClass = item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
        
        tableContent += `
            <tr class="hover:bg-blue-600/10 transition-colors">
                <td class="p-3 text-center font-mono font-medium text-slate-400">${String(index + 1).padStart(2, '0')}</td>
                <td class="p-3 font-mono text-xs text-blue-400">${item.item_code || '-'}</td>
                <td class="p-3 text-slate-100 font-medium">${item.name}</td>
                <td class="p-3 text-slate-300">${item.category || '-'}</td>
                <td class="p-3 text-slate-300">${item.unit_of_measure || '-'}</td>
                <td class="p-3 text-center">
                    <span class="inline-flex items-center justify-center px-2.5 py-1 ${isLowStock ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} rounded-lg text-xs font-bold border">
                        ${item.current_quantity || 0}
                    </span>
                </td>
                <td class="p-3 text-center text-slate-400">${item.minimum_stock || 0}</td>
                <td class="p-3 text-slate-400">${item.location || '-'}</td>
                <td class="p-3">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${statusClass}">
                        ${item.status || 'active'}
                    </span>
                </td>
                <td class="p-3 text-center">
                    <button onclick="openMovementModal('in', '${item.id}')" class="text-emerald-400 hover:text-emerald-300 mr-2 transition-colors" title="Stock IN">
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                    <button onclick="openMovementModal('out', '${item.id}')" class="text-red-400 hover:text-red-300 mr-2 transition-colors" title="Stock OUT">
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button onclick="editInventoryItem('${item.id}')" class="text-blue-400 hover:text-blue-300 mr-2 transition-colors" title="Edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <!-- <button onclick="deleteInventoryItem('${item.id}')" class="text-red-400 hover:text-red-300 transition-colors" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button> -->
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = tableContent;
    if (noResults) noResults.classList.add('hidden');
}

// =============================================
// UPDATE INVENTORY STATS
// =============================================
function updateInventoryStats() {
    const totalItems = inventoryItems.length;
    const totalQty = inventoryItems.reduce((sum, item) => sum + (parseFloat(item.current_quantity) || 0), 0);
    const lowStock = inventoryItems.filter(item => item.current_quantity <= item.minimum_stock).length;
    const inactive = inventoryItems.filter(item => item.status === 'inactive').length;

    const totalEl = document.getElementById('inventory-stats-total');
    const qtyEl = document.getElementById('inventory-stats-qty');
    const lowEl = document.getElementById('inventory-stats-low');
    const inactiveEl = document.getElementById('inventory-stats-inactive');

    if (totalEl) totalEl.textContent = totalItems;
    if (qtyEl) qtyEl.textContent = totalQty;
    if (lowEl) lowEl.textContent = lowStock;
    if (inactiveEl) inactiveEl.textContent = inactive;
}

// =============================================
// OPEN INVENTORY MODAL (ADD/EDIT)
// =============================================
function openInventoryModal(itemId = null) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.id = 'inventory-modal';
    
    const isEdit = itemId !== null;
    const item = isEdit ? inventoryItems.find(i => i.id === itemId) : null;

    modal.innerHTML = `
        <div class="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-lg shadow-2xl">
            <div class="p-6 border-b border-slate-700/50">
                <h3 class="text-xl font-bold text-white flex items-center gap-3">
                    <i class="fa-solid fa-${isEdit ? 'pen-to-square' : 'plus'} text-emerald-400"></i>
                    ${isEdit ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                </h3>
            </div>
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Item Code</label>
                        <input type="text" id="inv-item-code" value="${item?.item_code || ''}" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="e.g., MAT-001">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                        <input type="text" id="inv-category" value="${item?.category || ''}" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="e.g., Raw Material">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name *</label>
                    <input type="text" id="inv-name" value="${item?.name || ''}" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="Item name">
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Unit</label>
                        <input type="text" id="inv-unit" value="${item?.unit_of_measure || ''}" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="pcs, kg, m">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Qty</label>
                        <input type="number" id="inv-current-qty" value="${item?.current_quantity || 0}" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="0">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Stock</label>
                        <input type="number" id="inv-min-stock" value="${item?.minimum_stock || 0}" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="0">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                    <input type="text" id="inv-location" value="${item?.location || ''}" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="Storage location">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                    <textarea id="inv-description" rows="2" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none" placeholder="Item description">${item?.description || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <select id="inv-status" class="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all">
                        <option value="active" ${item?.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${item?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </div>
            <div class="p-6 border-t border-slate-700/50 flex justify-end gap-3">
                <button onclick="closeInventoryModal()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all">Cancel</button>
                <button onclick="saveInventoryItem('${itemId || ''}')" class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/15 transition-all">
                    ${isEdit ? 'Update' : 'Add'} Item
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeInventoryModal();
    });
}

// =============================================
// CLOSE INVENTORY MODAL
// =============================================
function closeInventoryModal() {
    const modal = document.getElementById('inventory-modal');
    if (modal) modal.remove();
}

// =============================================
// SAVE INVENTORY ITEM
// =============================================
async function saveInventoryItem(itemId) {
    const itemCode = document.getElementById('inv-item-code').value;
    const name = document.getElementById('inv-name').value;
    const category = document.getElementById('inv-category').value;
    const unit = document.getElementById('inv-unit').value;
    const currentQty = document.getElementById('inv-current-qty').value;
    const minStock = document.getElementById('inv-min-stock').value;
    const location = document.getElementById('inv-location').value;
    const description = document.getElementById('inv-description').value;
    const status = document.getElementById('inv-status').value;

    if (!name) {
        alert('Please enter item name');
        return;
    }

    try {
        const itemData = {
            item_code: itemCode || null,
            name,
            category: category || null,
            description: description || null,
            unit_of_measure: unit || null,
            current_quantity: parseFloat(currentQty) || 0,
            minimum_stock: parseFloat(minStock) || 0,
            location: location || null,
            status,
            updated_at: new Date().toISOString()
        };

        if (itemId) {
            // Update existing
            const { error } = await supabase
                .from('inventory')
                .update(itemData)
                .eq('id', itemId);
            
            if (error) throw error;
        } else {
            // Insert new
            const { error } = await supabase
                .from('inventory')
                .insert([{ ...itemData, created_at: new Date().toISOString() }]);
            
            if (error) throw error;
        }

        closeInventoryModal();
        loadInventoryItems();
    } catch (error) {
        console.error('Error saving inventory item:', error);
        alert('Failed to save inventory item');
    }
}

// =============================================
// EDIT INVENTORY ITEM
// =============================================
function editInventoryItem(itemId) {
    openInventoryModal(itemId);
}

// =============================================
// DELETE INVENTORY ITEM
// =============================================
async function deleteInventoryItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        loadInventoryItems();
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        alert('Failed to delete inventory item');
    }
}

// =============================================
// REFRESH INVENTORY
// =============================================
function refreshInventory() {
    loadInventoryItems();
}

// =============================================
// OPEN MOVEMENT MODAL (re-exported from inventory-movements.js)
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
    const inventoryOptions = inventoryItems.map(item => 
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
// LOAD INVENTORY ITEMS FOR SELECT (helper function)
// =============================================
async function loadInventoryItemsForSelect() {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('id, name, item_code, current_quantity')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;
        
        inventoryItems = data || [];
    } catch (error) {
        console.error('Error loading inventory items:', error);
    }
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
        const currentItem = inventoryItems.find(i => i.id === inventoryId);
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
        loadInventoryItems();
        
        // Also reload movements if the function exists
        if (typeof loadInventoryMovements === 'function') {
            loadInventoryMovements();
        }
    } catch (error) {
        console.error('Error saving movement:', error);
        alert('Failed to record stock movement');
    }
}

// =============================================
// INITIALIZATION
// =============================================
window.initInventory = function() {
    // Add event listener for search
    const searchInput = document.getElementById('inventory-search');
    if (searchInput) {
        searchInput.addEventListener('input', renderInventoryTable);
    }
    
    // Load inventory
    loadInventoryItems();
}
