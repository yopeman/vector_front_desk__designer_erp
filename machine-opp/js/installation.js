// =============================================
// INSTALLATION MODULE
// =============================================

let installationsLoaded = false;
let installationsData = [];
let editingInstallationId = null;
let existingInstallationFileIds = [];
let existingInstallationFiles = [];

// =============================================
// FETCH INSTALLATIONS FROM SUPABASE
// =============================================
async function fetchInstallations() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not initialized');
        return;
    }

    const { data, error } = await supabase
        .from('installations')
        .select('*, job_order:job_orders(job_no), client:clients(name), attached_file_ids, note')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching installations:', error);
        return;
    }

    installationsData = data || [];
    installationsLoaded = true;
    renderInstallationTable();
}

// =============================================
// FETCH JOB ORDERS FOR DROPDOWN
// =============================================
async function fetchJobOrdersForInstallation() {
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

    const select = document.getElementById('installation-job-order');
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
// RENDER INSTALLATION TABLE
// =============================================
function renderInstallationTable() {
    const tbody = document.getElementById('installation-body');
    if (!tbody) return;

    // Get filter values
    const searchTerm = document.getElementById('installation-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('installation-status-filter')?.value || 'All';

    // Filter installations
    const filteredInstallations = installationsData.filter(installation => {
        // Status filter
        if (statusFilter !== 'All' && installation.status !== statusFilter) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const searchableText = [
                installation.installation_no || '',
                installation.job_order?.job_no || '',
                installation.client?.name || '',
                installation.contact_person || '',
                installation.scheduled_date || ''
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    if (filteredInstallations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-slate-500">No installations found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredInstallations.map((installation, index) => {
        const statusClass = installation.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                           installation.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                           installation.status === 'Cancelled' ? 'bg-red-500/10 text-red-400' :
                           'bg-yellow-500/10 text-yellow-400';

        return `<tr class="hover:bg-slate-800/40 transition-colors">
            <td class="p-4 text-center font-mono text-slate-500">${index + 1}</td>
            <td class="p-4 font-mono">${installation.installation_no || '-'}</td>
            <td class="p-4 font-mono">${installation.job_order?.job_no || '-'}</td>
            <td class="p-4">${installation.client?.name || '-'}</td>
            <td class="p-4">${installation.contact_person || '-'}</td>
            <td class="p-4 font-mono">${installation.scheduled_date || '-'}</td>
            <td class="p-4"><span class="px-2 py-0.5 ${statusClass} text-xs font-bold rounded border border-current/20">${installation.status}</span></td>
            <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="viewInstallationDetails('${installation.id}')" class="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10">
                        <i class="fa-solid fa-eye"></i> Show
                    </button>
                    <button onclick="editInstallation('${installation.id}')" class="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// =============================================
// OPEN INSTALLATION MODAL
// =============================================
window.openInstallationModal = function() {
    editingInstallationId = null;
    existingInstallationFileIds = [];
    existingInstallationFiles = [];
    
    document.getElementById('installation-modal-title').textContent = 'New Installation';
    document.getElementById('installation-submit-btn').textContent = 'Create';
    document.getElementById('installation-form').reset();
    document.getElementById('installation-existing-files').innerHTML = '';
    document.getElementById('installation-new-files').innerHTML = '';
    
    document.getElementById('installation-modal').classList.add('active');
    fetchJobOrdersForInstallation();
}

// =============================================
// CLOSE INSTALLATION MODAL
// =============================================
window.closeInstallationModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('installation-modal').classList.remove('active');
    editingInstallationId = null;
    existingInstallationFileIds = [];
    existingInstallationFiles = [];
}

// =============================================
// EDIT INSTALLATION
// =============================================
window.editInstallation = async function(id) {
    const installation = installationsData.find(i => i.id === id);
    if (!installation) return;

    editingInstallationId = id;
    existingInstallationFileIds = installation.attached_file_ids || [];
    existingInstallationFiles = [];

    document.getElementById('installation-modal-title').textContent = 'Edit Installation';
    document.getElementById('installation-submit-btn').textContent = 'Update';

    // Fetch job orders first to populate dropdown
    await fetchJobOrdersForInstallation();

    // Populate form
    document.getElementById('installation-job-order').value = installation.job_order_id || '';
    document.getElementById('installation-no').value = installation.installation_no || '';
    document.getElementById('installation-site-address').value = installation.site_address || '';
    document.getElementById('installation-contact-person').value = installation.contact_person || '';
    document.getElementById('installation-contact-phone').value = installation.contact_phone || '';
    document.getElementById('installation-items-installed').value = installation.items_installed || '';
    document.getElementById('installation-team').value = installation.team || '';
    document.getElementById('installation-team-lead').value = installation.team_lead || '';
    document.getElementById('installation-scheduled-date').value = installation.scheduled_date || '';
    document.getElementById('installation-scheduled-time').value = installation.scheduled_time || '';
    document.getElementById('installation-completion-time').value = installation.completion_time ? installation.completion_time.split('T')[0] : '';
    document.getElementById('installation-status').value = installation.status || 'Scheduled';
    document.getElementById('installation-signed-off-by').value = installation.signed_off_by || '';
    document.getElementById('installation-note').value = installation.note || '';

    // Fetch existing files
    if (installation.attached_file_ids && installation.attached_file_ids.length > 0) {
        await fetchInstallationExistingFiles(installation.attached_file_ids);
    }

    document.getElementById('installation-modal').classList.add('active');
}

// =============================================
// FETCH EXISTING FILES FOR INSTALLATION
// =============================================
async function fetchInstallationExistingFiles(fileIds) {
    if (typeof supabase === 'undefined') return;

    const { data, error } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds);

    if (error) {
        console.error('Error fetching files:', error);
        return;
    }

    existingInstallationFiles = data || [];
    renderInstallationExistingFiles();
}

// =============================================
// RENDER EXISTING FILES
// =============================================
function renderInstallationExistingFiles() {
    const container = document.getElementById('installation-existing-files');
    if (!container) return;

    if (existingInstallationFiles.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `<p class="text-xs font-semibold text-slate-500">Existing files:</p>` +
        existingInstallationFiles.map(file => `
            <div class="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-file text-blue-400"></i>
                    <span class="text-sm text-slate-300">${file.name}</span>
                    <span class="text-xs text-slate-500">(${(file.file_size / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" onclick="removeInstallationExistingFile('${file.id}')" class="text-slate-400 hover:text-red-400 transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');
}

// =============================================
// REMOVE EXISTING FILE
// =============================================
window.removeInstallationExistingFile = function(fileId) {
    existingInstallationFiles = existingInstallationFiles.filter(f => f.id !== fileId);
    existingInstallationFileIds = existingInstallationFileIds.filter(id => id !== fileId);
    renderInstallationExistingFiles();
}

// =============================================
// HANDLE FILE INPUT CHANGE
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('installation-files');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const container = document.getElementById('installation-new-files');
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
                        <button type="button" onclick="removeInstallationNewFile(${index})" class="text-slate-400 hover:text-red-400 transition-colors">
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
window.removeInstallationNewFile = function(index) {
    const fileInput = document.getElementById('installation-files');
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
async function uploadInstallationFile(file) {
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
// SAVE INSTALLATION
// =============================================
window.saveInstallation = async function(event) {
    event.preventDefault();

    const jobOrderId = document.getElementById('installation-job-order').value;
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

    const fileInput = document.getElementById('installation-files');
    const fileIds = [];

    // Upload new files
    for (const file of fileInput.files) {
        try {
            const fileId = await uploadInstallationFile(file);
            fileIds.push(fileId);
        } catch (error) {
            console.error('Error uploading file:', file.name, error);
            alert(`Failed to upload file: ${file.name}`);
        }
    }

    // Combine existing and new file IDs
    const allFileIds = [...existingInstallationFileIds, ...fileIds];

    const installationData = {
        job_order_id: jobOrderId,
        client_id: clientId,
        installation_no: document.getElementById('installation-no').value,
        site_address: document.getElementById('installation-site-address').value,
        contact_person: document.getElementById('installation-contact-person').value,
        contact_phone: document.getElementById('installation-contact-phone').value,
        items_installed: document.getElementById('installation-items-installed').value,
        team: document.getElementById('installation-team').value,
        team_lead: document.getElementById('installation-team-lead').value,
        scheduled_date: document.getElementById('installation-scheduled-date').value || null,
        scheduled_time: document.getElementById('installation-scheduled-time').value || null,
        completion_time: document.getElementById('installation-completion-time').value || null,
        status: document.getElementById('installation-status').value,
        signed_off_by: document.getElementById('installation-signed-off-by').value,
        note: document.getElementById('installation-note').value,
        attached_file_ids: allFileIds
    };

    try {
        if (editingInstallationId) {
            // Update
            const { error } = await supabase
                .from('installations')
                .update(installationData)
                .eq('id', editingInstallationId);

            if (error) throw error;
            alert('Installation updated successfully!');
        } else {
            // Create
            const { error } = await supabase
                .from('installations')
                .insert([installationData]);

            if (error) throw error;
            alert('Installation created successfully!');
        }

        closeInstallationModal();
        fetchInstallations();
    } catch (error) {
        console.error('Error saving installation:', error);
        alert('Error saving installation: ' + error.message);
    }
}

// =============================================
// VIEW INSTALLATION DETAILS
// =============================================
window.viewInstallationDetails = async function(id) {
    const installation = installationsData.find(i => i.id === id);
    if (!installation) return;

    // Populate detail modal
    document.getElementById('detail-installation-no').value = installation.installation_no || '-';
    document.getElementById('detail-job-no').value = installation.job_order?.job_no || '-';
    document.getElementById('detail-client').value = installation.client?.name || '-';
    document.getElementById('detail-status').value = installation.status || '-';
    document.getElementById('detail-scheduled-date').value = installation.scheduled_date || '-';
    document.getElementById('detail-scheduled-time').value = installation.scheduled_time || '-';
    document.getElementById('detail-site-address').value = installation.site_address || '-';
    document.getElementById('detail-contact-person').value = installation.contact_person || '-';
    document.getElementById('detail-contact-phone').value = installation.contact_phone || '-';
    document.getElementById('detail-items-installed').value = installation.items_installed || '-';
    document.getElementById('detail-team').value = installation.team || '-';
    document.getElementById('detail-team-lead').value = installation.team_lead || '-';
    document.getElementById('detail-completion-time').value = installation.completion_time || '-';
    document.getElementById('detail-signed-off-by').value = installation.signed_off_by || '-';
    document.getElementById('detail-note').value = installation.note || '-';

    // Fetch and display attached files
    const filesList = document.getElementById('installation-detail-attached-files-list');
    if (installation.attached_file_ids && installation.attached_file_ids.length > 0) {

        const { data: files, error } = await supabase
            .from('files')
            .select('*')
            .in('id', installation.attached_file_ids);

        if (error) {
            console.error('Error fetching files:', error);
            filesList.innerHTML = '<div class="text-xs text-slate-500">Error loading files</div>';
            return;
        }

        if (files && files.length > 0) {
            const fileHtmlPromises = files.map(async (file) => {
                const url = await getInstallationFileUrl(file.path);
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                    <i class="fa-solid fa-file text-blue-400"></i>
                    <span class="text-sm text-slate-300">${file.name}</span>
                    <span class="text-xs text-slate-500">(${(file.file_size / 1024).toFixed(1)} KB)</span>
                    <i class="fa-solid fa-external-link text-xs text-slate-400 ml-auto"></i>
                </a>`;
            });

            let allFileHtmlLinks =  await Promise.all(fileHtmlPromises).then(htmls => htmls.join(''));
            filesList.innerHTML = allFileHtmlLinks;
        } else {
            filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
        }
    } else {
        filesList.innerHTML = '<div class="text-xs text-slate-500">No attached files</div>';
    }

    document.getElementById('installation-detail-modal').classList.add('active');
}

// =============================================
// GET FILE URL
// =============================================
async function getInstallationFileUrl(filePath) {
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
// CLOSE INSTALLATION DETAIL MODAL
// =============================================
window.closeInstallationDetailModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('installation-detail-modal').classList.remove('active');
}

// =============================================
// INITIALIZATION
// =============================================
window.initInstallations = function() {
    fetchInstallations();
    
    // Add event listeners for filters
    const searchInput = document.getElementById('installation-search');
    const statusFilter = document.getElementById('installation-status-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', renderInstallationTable);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', renderInstallationTable);
    }
}
