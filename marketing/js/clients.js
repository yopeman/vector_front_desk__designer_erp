// Clients module for client registry operations

let editingClientId = null;
let clientsCache = [];

// Load clients from Supabase and render the table
async function loadClients() {
    const tbody = document.getElementById('clientTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">Loading clients...</td></tr>';

    const { data, error } = await window.supabase
        .from('mrk_clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger);">Error loading: ${error.message}</td></tr>`;
        return;
    }

    clientsCache = data || [];
    renderClients();
}

function renderClients() {
    const tbody = document.getElementById('clientTableBody');
    if (clientsCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">No clients found.</td></tr>';
        return;
    }

    tbody.innerHTML = clientsCache.map(c => {
        return `<tr>
            <td>${c.client_date || '—'}</td>
            <td>${c.client_name || '—'}</td>
            <td>${c.client_type || '—'}</td>
            <td>${c.business_sector || '—'}</td>
            <td>${c.tin_number || '—'}</td>
            <td>${c.address || 'Addis Ababa'}</td>
            <td>${c.discovery || '—'}</td>
            <td>${c.level || 'standard'}</td>
            <td>
                <button class="action-trigger btn-register" style="padding:6px 12px; font-size:11px;" onclick="editClient('${c.id}')">✏️ Edit</button>
            </td>
        </tr>`;
    }).join('');
}

// Open the form in "create" mode (reset fields)
function openNewClientForm() {
    editingClientId = null;
    resetStorageState();
    document.getElementById('cli_date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('cli_name').value = '';
    document.getElementById('cli_type').value = 'organization';
    document.getElementById('cli_sector').value = 'advertising';
    document.getElementById('cli_tin').value = '';
    document.getElementById('cli_discovery').value = 'telegram';
    document.getElementById('clientExistingAttachments').style.display = 'none';
    document.getElementById('formModal-clientRegistry').style.display = 'flex';
}

// Open the form in "edit" mode, pre-filled with the record's data
async function editClient(id) {
    const { data, error } = await window.supabase
        .from('mrk_clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error || !data) { alert("Error loading client: " + (error?.message || 'not found')); return; }

    editingClientId = id;
    resetStorageState();
    document.getElementById('cli_date').value = data.client_date || '';
    document.getElementById('cli_name').value = data.client_name || '';
    document.getElementById('cli_type').value = data.client_type || 'organization';
    document.getElementById('cli_sector').value = data.business_sector || '';
    document.getElementById('cli_tin').value = data.tin_number || '';
    document.getElementById('cli_discovery').value = data.discovery || '';

    // Show existing attachment
    const existingAttachmentsDiv = document.getElementById('clientExistingAttachments');
    const existingFileLink = document.getElementById('clientExistingFileLink');
    const fileLink = document.getElementById('clientFileLink');

    if (data.file_url) {
        existingAttachmentsDiv.style.display = 'block';
        existingFileLink.style.display = 'block';
        // Extract storage path from URL and get fresh URL
        const filePath = data.file_url.split('/documents/')[1]?.split('?')[0];
        if (filePath) {
            const freshUrl = await getFileUrl(filePath);
            fileLink.href = freshUrl || data.file_url;
        } else {
            fileLink.href = data.file_url;
        }
        document.getElementById('clientFileLinkText').textContent = 'Open attached file';
    } else {
        existingAttachmentsDiv.style.display = 'none';
    }

    document.getElementById('formModal-clientRegistry').style.display = 'flex';
}

// Create or update a client
async function saveClient() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('cli_date').value;
    const name = document.getElementById('cli_name').value;
    const type = document.getElementById('cli_type').value;
    const sector = document.getElementById('cli_sector').value;
    const tin = document.getElementById('cli_tin').value;
    const disc = document.getElementById('cli_discovery').value;

    if (!name) { alert("Client Name is required."); return; }

    const payload = {
        client_date: date,
        client_name: name,
        client_type: type,
        business_sector: sector,
        tin_number: tin,
        discovery: disc,
    };

    const { attachedFiles } = getStorageState();

    // Upload attached file if present
    if (attachedFiles.length > 0) {
        try {
            const file = attachedFiles[0];
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await window.supabase.storage
                .from('documents')
                .upload(fileName, file);

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    alert('Storage bucket "documents" does not exist. Please create it in Supabase dashboard (Storage → Create new bucket → name it "documents")');
                    return;
                }
                throw uploadError;
            }

            // Get URL for the uploaded file using helper
            const fileUrl = await getFileUrl(uploadData.path);
            if (fileUrl) {
                payload.file_url = fileUrl;
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file: ' + error.message);
            return;
        }
    }

    let error;
    if (editingClientId) {
        // UPDATE existing record
        ({ error } = await window.supabase
            .from('mrk_clients')
            .update(payload)
            .eq('id', editingClientId));
    } else {
        // CREATE new record
        payload.created_by = user.id;
        ({ error } = await window.supabase
            .from('mrk_clients')
            .insert(payload));
    }

    if (error) { alert("Error saving client: " + error.message); return; }

    // Reset attachments
    resetStorageState();

    alert(editingClientId ? "Client updated successfully!" : "Client has been registered successfully!");
    closeAllModals();
    editingClientId = null;
    loadClients();
}

