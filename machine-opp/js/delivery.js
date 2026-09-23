// =============================================
// DELIVERY MODULE
// =============================================

let deliveriesLoaded = false;
let deliveriesData = [];
let editingDeliveryId = null;
let existingDeliveryFileIds = [];
let existingDeliveryFiles = [];

function todayISODate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// =============================================
// FETCH DELIVERIES FROM SUPABASE
// =============================================
async function fetchDeliveries() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    const { data, error } = await supabase
        .from('deliveries')
        .select('*, job_order:job_orders(job_no), client:clients(name), attached_file_ids, note')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching deliveries:', error);
        return;
    }

    deliveriesData = data || [];
    deliveriesLoaded = true;
    renderDeliveryTable();
}

// =============================================
// FETCH JOB ORDERS FOR DROPDOWN
// =============================================
async function fetchJobOrdersForDelivery() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    const { data, error } = await supabase
        .from('job_orders')
        .select('*, invoice:invoices(*, order:orders(*, client:clients(*)))')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching job orders:', error);
        return;
    }

    const select = document.getElementById('delivery-job-order');
    if (select) {
        select.innerHTML = '<option value="">Select Job Order</option>';
        (data || []).forEach(jobOrder => {
            const option = document.createElement('option');
            option.value = jobOrder.id;
            option.textContent = `${jobOrder.job_no || 'No Job No'} - ${jobOrder.invoice?.order?.client?.name || 'Unknown Client'}`;
            select.appendChild(option);
        });
    }
}

// =============================================
// RENDER DELIVERY TABLE
// =============================================
function renderDeliveryTable() {
    const tbody = document.getElementById('delivery-body');
    if (!tbody) return;

    // Get filter values
    const searchTerm = document.getElementById('delivery-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('delivery-status-filter')?.value || 'All';

    // Filter deliveries
    const filteredDeliveries = deliveriesData.filter(delivery => {
        // Status filter
        if (statusFilter !== 'All' && delivery.status !== statusFilter) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const searchableText = [
                delivery.delivery_no || '',
                delivery.job_order?.job_no || '',
                delivery.client?.name || '',
                delivery.contact_person || '',
                delivery.scheduled_date || ''
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    if (filteredDeliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-slate-500">No deliveries found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredDeliveries.map((delivery, index) => {
        const statusClass = delivery.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                           delivery.status === 'In Transit' ? 'bg-blue-500/10 text-blue-400' :
                           delivery.status === 'Delayed' ? 'bg-red-500/10 text-red-400' :
                           'bg-yellow-500/10 text-yellow-400';

        return `<tr class="hover:bg-slate-800/40 transition-colors">
            <td class="p-4 text-center font-mono text-slate-500">${index + 1}</td>
            <td class="p-4 font-mono">${delivery.delivery_no || '-'}</td>
            <td class="p-4 font-mono">${delivery.job_order?.job_no || '-'}</td>
            <td class="p-4">${delivery.client?.name || '-'}</td>
            <td class="p-4">${delivery.contact_person || '-'}</td>
            <td class="p-4 font-mono">${delivery.scheduled_date || '-'}</td>
            <td class="p-4"><span class="px-2 py-0.5 ${statusClass} text-xs font-bold rounded border border-current/20">${delivery.status}</span></td>
            <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="viewDeliveryDetails('${delivery.id}')" class="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10">
                        <i class="fa-solid fa-eye"></i> Show
                    </button>
                    <button onclick="editDelivery('${delivery.id}')" class="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// =============================================
// OPEN DELIVERY MODAL
// =============================================
window.openDeliveryModal = function() {
    editingDeliveryId = null;
    existingDeliveryFileIds = [];
    existingDeliveryFiles = [];
    
    document.getElementById('delivery-modal-title').textContent = 'New Delivery';
    document.getElementById('delivery-submit-btn').textContent = 'Create';
    document.getElementById('delivery-form').reset();
    document.getElementById('delivery-scheduled-date').value = todayISODate();
    document.getElementById('delivery-scheduled-time').value = currentTime();
    document.getElementById('delivery-actual-time').value = todayISODate();
    document.getElementById('delivery-existing-files').innerHTML = '';
    document.getElementById('delivery-new-files').innerHTML = '';
    
    document.getElementById('delivery-modal').classList.add('active');
    fetchJobOrdersForDelivery();
}

// =============================================
// CLOSE DELIVERY MODAL
// =============================================
window.closeDeliveryModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('delivery-modal').classList.remove('active');
    editingDeliveryId = null;
    existingDeliveryFileIds = [];
    existingDeliveryFiles = [];
}

// =============================================
// EDIT DELIVERY
// =============================================
window.editDelivery = async function(id) {
    const delivery = deliveriesData.find(d => d.id === id);
    if (!delivery) return;

    editingDeliveryId = id;
    existingDeliveryFileIds = delivery.attached_file_ids || [];
    existingDeliveryFiles = [];

    document.getElementById('delivery-modal-title').textContent = 'Edit Delivery';
    document.getElementById('delivery-submit-btn').textContent = 'Update';

    // Fetch job orders first to populate dropdown
    await fetchJobOrdersForDelivery();

    // Populate form
    document.getElementById('delivery-job-order').value = delivery.job_order_id || '';
    document.getElementById('delivery-no').value = delivery.delivery_no || '';
    document.getElementById('delivery-address').value = delivery.delivery_address || '';
    document.getElementById('delivery-contact-person').value = delivery.contact_person || '';
    document.getElementById('delivery-contact-phone').value = delivery.contact_phone || '';
    document.getElementById('delivery-items').value = delivery.items || '';
    document.getElementById('delivery-vehicle-driver').value = delivery.vehicle_driver || '';
    document.getElementById('delivery-scheduled-date').value = delivery.scheduled_date || todayISODate();
    document.getElementById('delivery-scheduled-time').value = delivery.scheduled_time || currentTime();
    document.getElementById('delivery-actual-time').value = delivery.actual_delivery_time ? delivery.actual_delivery_time.split('T')[0] : todayISODate();
    document.getElementById('delivery-status').value = delivery.status || 'Pending';
    document.getElementById('delivery-received-by').value = delivery.received_by || '';
    document.getElementById('delivery-note').value = delivery.note || '';

    // Fetch existing files
    if (delivery.attached_file_ids && delivery.attached_file_ids.length > 0) {
        await fetchDeliveryExistingFiles(delivery.attached_file_ids);
    }

    document.getElementById('delivery-modal').classList.add('active');
}

// =============================================
// FETCH EXISTING FILES FOR DELIVERY
// =============================================
async function fetchDeliveryExistingFiles(fileIds) {
    if (typeof supabase === 'undefined') return;

    const { data, error } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds);

    if (error) {
        console.error('Error fetching files:', error);
        return;
    }

    existingDeliveryFiles = data || [];
    renderDeliveryExistingFiles();
}

// =============================================
// RENDER EXISTING FILES
// =============================================
function renderDeliveryExistingFiles() {
    const container = document.getElementById('delivery-existing-files');
    if (!container) return;

    if (existingDeliveryFiles.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `<p class="text-xs font-semibold text-slate-500">Existing files:</p>` +
        existingDeliveryFiles.map(file => `
            <div class="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-file text-blue-400"></i>
                    <span class="text-sm text-slate-300">${file.name}</span>
                    <span class="text-xs text-slate-500">(${(file.file_size / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" onclick="removeDeliveryExistingFile('${file.id}')" class="text-slate-400 hover:text-red-400 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');
}

// =============================================
// REMOVE EXISTING FILE
// =============================================
window.removeDeliveryExistingFile = function(fileId) {
    existingDeliveryFiles = existingDeliveryFiles.filter(f => f.id !== fileId);
    existingDeliveryFileIds = existingDeliveryFileIds.filter(id => id !== fileId);
    renderDeliveryExistingFiles();
}

// =============================================
// HANDLE FILE INPUT CHANGE
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('delivery-files');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const container = document.getElementById('delivery-new-files');
            if (!container) return;

            if (this.files.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = `<p class="text-xs font-semibold text-slate-500">New files to upload:</p>` +
                Array.from(this.files).map((file, index) => `
                    <div class="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-file text-blue-400"></i>
                            <span class="text-sm text-slate-300">${file.name}</span>
                            <span class="text-xs text-slate-500">(${(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button type="button" onclick="removeDeliveryNewFile(${index})" class="text-slate-400 hover:text-red-400 transition-colors">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                `).join('');
        });
    }
});

// =============================================
// REMOVE NEW FILE
// =============================================
window.removeDeliveryNewFile = function(index) {
    const fileInput = document.getElementById('delivery-files');
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change'));
}

// =============================================
// UPLOAD FILE
// =============================================
async function uploadDeliveryFile(file) {
    if (typeof supabase === 'undefined') {
        throw new Error('Supabase client not initialized');
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

    if (error) throw error;

    // Insert file record
    const { data: fileRecord, error: insertError } = await supabase
        .from('files')
        .insert({
            name: file.name,
            path: data.path,
            mime_type: file.type,
            file_size: file.size,
            uploaded_by: null
        })
        .select()
        .single();

    if (insertError) throw insertError;
    return fileRecord.id;
}

// =============================================
// SAVE DELIVERY
// =============================================
window.saveDelivery = async function(event) {
    event.preventDefault();

    const jobOrderId = document.getElementById('delivery-job-order').value;
    if (!jobOrderId) {
        alert('Please select a job order');
        return;
    }

    // Get client_id from job order using: job_order -> invoice -> order -> client
    const { data: jobOrder, error: jobOrderError } = await supabase
        .from('job_orders')
        .select('*, invoices!inner(*, orders!inner(*))')
        .eq('id', jobOrderId)
        .single();
    
    if (jobOrderError || !jobOrder) {
        console.error('Error fetching job order:', jobOrderError);
        alert('Error fetching job order');
        return;
    }
    
    const clientId = jobOrder.invoices?.orders?.client_id;

    if (!clientId) {
        alert('Could not determine client_id from job order');
        return;
    }

    const fileInput = document.getElementById('delivery-files');
    const fileIds = [];

    // Upload new files
    for (const file of fileInput.files) {
        try {
            const fileId = await uploadDeliveryFile(file);
            fileIds.push(fileId);
        } catch (error) {
            console.error('Error uploading file:', file.name, error);
            alert(`Failed to upload file: ${file.name}`);
        }
    }

    // Combine existing and new file IDs
    const allFileIds = [...existingDeliveryFileIds, ...fileIds];

    const deliveryData = {
        job_order_id: jobOrderId,
        client_id: clientId,
        delivery_no: document.getElementById('delivery-no').value,
        delivery_address: document.getElementById('delivery-address').value,
        contact_person: document.getElementById('delivery-contact-person').value,
        contact_phone: document.getElementById('delivery-contact-phone').value,
        items: document.getElementById('delivery-items').value,
        vehicle_driver: document.getElementById('delivery-vehicle-driver').value,
        scheduled_date: document.getElementById('delivery-scheduled-date').value || null,
        scheduled_time: document.getElementById('delivery-scheduled-time').value || null,
        actual_delivery_time: document.getElementById('delivery-actual-time').value || null,
        status: document.getElementById('delivery-status').value,
        received_by: document.getElementById('delivery-received-by').value,
        note: document.getElementById('delivery-note').value,
        attached_file_ids: allFileIds
    };

    try {
        if (editingDeliveryId) {
            // Update
            const { error } = await supabase
                .from('deliveries')
                .update(deliveryData)
                .eq('id', editingDeliveryId);

            if (error) throw error;
            alert('Delivery updated successfully!');
        } else {
            // Create
            const { error } = await supabase
                .from('deliveries')
                .insert([deliveryData]);

            if (error) throw error;
            alert('Delivery created successfully!');
        }

        closeDeliveryModal();
        fetchDeliveries();
    } catch (error) {
        console.error('Error saving delivery:', error);
        alert('Error saving delivery: ' + error.message);
    }
}

// =============================================
// VIEW DELIVERY DETAILS
// =============================================
window.viewDeliveryDetails = async function(id) {
    const delivery = deliveriesData.find(d => d.id === id);
    if (!delivery) return;

    // Populate detail modal
    document.getElementById('detail-delivery-no').value = delivery.delivery_no || '-';
    document.getElementById('detail-job-no').value = delivery.job_order?.job_no || '-';
    document.getElementById('detail-client').value = delivery.client?.name || '-';
    document.getElementById('detail-status').value = delivery.status || '-';
    document.getElementById('detail-scheduled-date').value = delivery.scheduled_date || '-';
    document.getElementById('detail-scheduled-time').value = delivery.scheduled_time || '-';
    document.getElementById('detail-delivery-address').value = delivery.delivery_address || '-';
    document.getElementById('detail-contact-person').value = delivery.contact_person || '-';
    document.getElementById('detail-contact-phone').value = delivery.contact_phone || '-';
    document.getElementById('detail-items').value = delivery.items || '-';
    document.getElementById('detail-vehicle-driver').value = delivery.vehicle_driver || '-';
    document.getElementById('detail-received-by').value = delivery.received_by || '-';
    document.getElementById('detail-note').value = delivery.note || '-';

    // Fetch and display attached files
    const filesList = document.getElementById('detail-attached-files-list');
    if (delivery.attached_file_ids && delivery.attached_file_ids.length > 0) {
        const { data: files, error } = await supabase
            .from('files')
            .select('*')
            .in('id', delivery.attached_file_ids);

        if (error) {
            console.error('Error fetching files:', error);
            filesList.innerHTML = '<div class="text-xs text-slate-500">Error loading files</div>';
            return;
        }

        if (files && files.length > 0) {
            const fileHtmlPromises = files.map(async (file) => {
                const url = await getDeliveryFileUrl(file.path);
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                    <i class="fa-solid fa-file text-blue-400"></i>
                    <span class="text-sm text-slate-300">${file.name}</span>
                    <span class="text-xs text-slate-500">(${(file.file_size / 1024).toFixed(1)} KB)</span>
                    <i class="fa-solid fa-external-link text-xs text-slate-400 ml-auto"></i>
                </a>`;
            });

            filesList.innerHTML = await Promise.all(fileHtmlPromises).then(htmls => htmls.join(''));
        } else {
            filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        }
    } else {
        filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
    }

    document.getElementById('delivery-detail-modal').classList.add('active');
}

// =============================================
// GET FILE URL
// =============================================
async function getDeliveryFileUrl(filePath) {
    try {
        const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 3600);
        if (error) throw error;
        return data.signedUrl;
    } catch (error) {
        console.error('Error creating signed URL:', error);
        const { data } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
        return data.publicUrl;
    }
}

// =============================================
// CLOSE DELIVERY DETAIL MODAL
// =============================================
window.closeDeliveryDetailModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('delivery-detail-modal').classList.remove('active');
}

// =============================================
// INITIALIZATION
// =============================================
window.initDeliveries = function() {
    fetchDeliveries();
    
    // Add event listeners for filters
    const searchInput = document.getElementById('delivery-search');
    const statusFilter = document.getElementById('delivery-status-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderDeliveryTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', renderDeliveryTable);
    }
}
