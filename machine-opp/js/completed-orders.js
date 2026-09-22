// =============================================
// COMPLETED ORDERS MODULE
// =============================================

let completedOrdersLoaded = false;

// =============================================
// FETCH MACHINES FROM DATABASE
// =============================================
async function fetchMachines() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return [];
    }

    const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching machines:', error);
        return [];
    }

    return data || [];
}

// =============================================
// FETCH COMPLETED ORDERS FROM SUPABASE
// =============================================
async function fetchCompletedOrders() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    const machineIds = typeof Auth !== 'undefined' && Auth.getAssignedMachineIds ? await Auth.getAssignedMachineIds() : null;

    let query = supabase
        .from('production_orders')
        .select(`
            id,
            task_type,
            priority,
            status,
            job_type,
            material,
            thickness,
            color,
            length,
            width,
            height,
            area,
            gram,
            started_at,
            completed_at,
            created_at,
            note,
            attached_file_ids,
            quality_status,
            machine_id,
            users!designer_id(username),
            machines(name, machine_type),
            orders(id, order_no, order_date),
            job_orders(job_no)
        `);

    let chain = query.eq('status', 'Completed');

    if (machineIds) {
        chain = chain.in('machine_id', machineIds);
    }

    const { data, error } = await chain.order('completed_at', { ascending: false });

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
            orderNum: row.job_orders?.job_no || row.orders?.order_no || row.id.slice(0, 8),
            title: row.job_type || 'Untitled',
            machine: machinesMap[row.machine_id] || row.machines?.machine_type || row.machines?.name || row.machine || 'N/A',
            material: row.material || 'N/A',
            thickness: row.thickness || 'N/A',
            color: row.color || 'N/A',
            length: row.length || 'N/A',
            width: row.width || 'N/A',
            area: row.area || 0,
            quality: row.quality_status || 'Pass',
            status: row.status || 'Completed',
            completedAt: row.completed_at,
            note: row.note || '',
            attachedFileIds: row.attached_file_ids || []
        };
    });

    completedOrdersLoaded = true;
    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
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
        tbody.innerHTML = '<tr><td colspan="15" class="p-8 text-center text-slate-500 italic">No completed orders yet. Mark orders as complete from the Received Order Status popup.</td></tr>';
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
            <td class="p-4 text-center">
                <button onclick="viewCompletedOrderDetails(${index})" class="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
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
                            <label style="color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px;">Job Order Number</label>
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

    // Generate PDF
    html2pdf().set(opt).from(wrapper).save();
}

// =============================================
// VIEW COMPLETED ORDER DETAILS
// =============================================
async function viewCompletedOrderDetails(index) {
    const order = completedOrdersData[index];
    if (!order) return;

    const modal = document.getElementById('completed-order-modal');
    if (!modal) return;

    // Populate modal with order details
    document.getElementById('comp-date').value = order.date;
    document.getElementById('comp-order-num').value = order.orderNum;
    document.getElementById('comp-title').value = order.title;
    document.getElementById('comp-machine').value = order.machine;
    document.getElementById('comp-material').value = order.material;
    document.getElementById('comp-thickness').value = order.thickness;
    document.getElementById('comp-color').value = order.color;
    document.getElementById('comp-length').value = order.length;
    document.getElementById('comp-width').value = order.width;
    document.getElementById('comp-height').value = order.height || 'N/A';
    document.getElementById('comp-area').value = order.area;
    document.getElementById('comp-quality').value = order.quality;
    
    // Format completed at timestamp
    let completedAt = 'N/A';
    if (order.completedAt) {
        try {
            const date = new Date(order.completedAt);
            completedAt = date.toLocaleString();
        } catch (e) {
            completedAt = order.completedAt;
        }
    }
    document.getElementById('comp-completed-at').value = completedAt;
    document.getElementById('comp-task-type').value = order.taskType;
    document.getElementById('comp-note').value = order.note || '';

    // Populate attached files
    await populateCompletedOrderAttachments(order.attachedFileIds);

    // Open modal
    modal.classList.add('open');
    document.body.classList.add('modal-open');
}

// =============================================
// CLOSE COMPLETED ORDER MODAL
// =============================================
function closeCompletedOrderModal(event) {
    if (event && event.target !== document.getElementById('completed-order-modal')) return;
    const modal = document.getElementById('completed-order-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }
}

// =============================================
// POPULATE COMPLETED ORDER ATTACHMENTS
// =============================================
async function populateCompletedOrderAttachments(attachedFileIds) {
    const filesList = document.getElementById('comp-attached-files-list');
    
    if (!filesList) return;
    
    if (attachedFileIds && attachedFileIds.length > 0) {
        const { data: files, error } = await supabase
            .from('files')
            .select('*')
            .in('id', attachedFileIds);
        
        if (error) {
            console.error('Error fetching files:', error);
            filesList.innerHTML = '<div class="text-xs text-slate-500">Error loading files</div>';
            return;
        }
        
        if (files && files.length > 0) {
            const fileHtmlPromises = files.map(async file => {
                const fileUrl = await getFileUrl(file.path);
                
                return `
                    <div class="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                        <div class="flex items-center gap-2 min-w-0">
                            <i class="fa-solid fa-file text-purple-400 text-xs shrink-0"></i>
                            <a href="${fileUrl}" target="_blank" class="text-xs text-slate-300 hover:text-blue-400 truncate max-w-[180px] transition-colors" title="Open in new tab">${file.name}</a>
                            <span class="text-[10px] text-slate-500 shrink-0">(${formatFileSize(file.file_size)})</span>
                        </div>
                        <button onclick="downloadFileById('${file.id}')" class="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1" title="Download without opening">
                            <i class="fa-solid fa-download text-[9px]"></i> Download
                        </button>
                    </div>
                `;
            });
            filesList.innerHTML = (await Promise.all(fileHtmlPromises)).join('');
        } else {
            filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        }
    } else {
        filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
    }
}

// =============================================
// FORMAT FILE SIZE
// =============================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// =============================================
// GET FILE URL WITH FALLBACK
// =============================================
async function getFileUrl(filePath) {
    try {
        console.log('Attempting to get signed URL for:', filePath);
        const { data, error } = await window.supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 3600);
        if (error) {
            console.error('Supabase signed URL error:', error);
            const { data: publicData, error: publicError } = await window.supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            if (publicError) {
                console.error('Public URL error:', publicError);
                return null;
            }
            console.log('Using public URL:', publicData.publicUrl);
            return publicData.publicUrl;
        }
        console.log('Signed URL generated:', data.signedUrl);
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting file URL:', error);
        return null;
    }
}

// =============================================
// DOWNLOAD FILE BY ID
// =============================================
async function downloadFileById(fileId) {
    try {
        const { data, error } = await window.supabase
            .from('files')
            .select('name, path')
            .eq('id', fileId)
            .single();
        if (error || !data) {
            throw error || new Error('File not found');
        }
        await downloadFile(data.path, data.name);
    } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file. Please try again.');
    }
}

// =============================================
// DOWNLOAD FILE DIRECTLY
// =============================================
async function downloadFile(filePath, fileName) {
    try {
        const { data, error } = await window.supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 60);
        if (error || !data?.signedUrl) {
            throw error || new Error('Failed to create download link');
        }
        const response = await fetch(data.signedUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file. Please try again.');
    }
}