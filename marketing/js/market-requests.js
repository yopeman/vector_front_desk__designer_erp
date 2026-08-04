// Market Requests module for CRUD operations

let editingMarketRequestId = null;
let marketRequestsCache = [];
let usersCache = [];

// Load users into cache for "Assigned To" name resolution
async function loadUsersCache() {
    const { data, error } = await window.supabase
        .from('users')
        .select('id, username, email');
    if (error) { console.error('Error loading users:', error); return; }
    usersCache = data || [];
}

function getUserName(userId) {
    if (!userId) return '—';
    const u = usersCache.find(x => x.id === userId);
    return u ? (u.username || u.email || '—') : '—';
}

// Load market requests from Supabase and render the table
async function loadMarketRequests() {
    const tbody = document.getElementById('marketRequestTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">Loading market requests...</td></tr>';

    await loadUsersCache();

    const { data, error } = await window.supabase
        .from('mrk_market_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger);">Error loading: ${error.message}</td></tr>`;
        return;
    }

    marketRequestsCache = data || [];
    renderMarketRequests();
}

function renderMarketRequests() {
    const tbody = document.getElementById('marketRequestTableBody');
    if (marketRequestsCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">No market requests found.</td></tr>';
        return;
    }

    tbody.innerHTML = marketRequestsCache.map(r => {
        const statusClass = r.status === 'approved' ? 'success' : (r.status === 'rejected' ? 'pending' : 'pending');
        const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
        return `<tr>
            <td>${r.request_date || '—'}</td>
            <td>${r.request_no || '—'}</td>
            <td>${r.request_type || '—'}</td>
            <td>${r.priority || '—'}</td>
            <td>${getUserName(r.assigned_to)}</td>
            <td>${r.due_date || '—'}</td>
            <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
            <td>
                <button class="action-trigger btn-register" style="padding:6px 12px; font-size:11px; margin-right:5px;" onclick="editMarketRequest('${r.id}')">✏️ Edit</button>
            </td>
        </tr>`;
    }).join('');
}

// Helper function to show/hide admin-only fields based on user role
function updateAdminFieldsVisibility() {
    const user = MarketingAuth.getCurrentUser();
    const priorityGroup = document.getElementById('mkt_priority_group');
    const statusGroup = document.getElementById('mkt_status_group');
    if (priorityGroup) {
        priorityGroup.style.display = (user && user.role === 'admin_marketer') ? 'block' : 'none';
    }
    if (statusGroup) {
        statusGroup.style.display = (user && user.role === 'admin_marketer') ? 'block' : 'none';
    }
}

// Open the form in "create" mode (reset fields)
function openNewMarketRequestForm() {
    editingMarketRequestId = null;
    resetStorageState();
    document.getElementById('mkt_date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('mkt_no').value = '';
    document.getElementById('mkt_type').value = '';
    document.getElementById('mkt_desc').value = '';
    document.getElementById('mkt_priority').value = 'medium';
    document.getElementById('mkt_status').value = 'pending';
    document.getElementById('mkt_assign').value = '';
    document.getElementById('mkt_due').value = '';
    document.getElementById('mkt_file').value = '';
    document.getElementById('mkt_file_lbl').innerText = '';
    document.getElementById('existingAttachments').style.display = 'none';
    updateAdminFieldsVisibility();
    document.getElementById('formModal-marketRequest').style.display = 'flex';
}

// Open the form in "edit" mode, pre-filled with the record's data
async function editMarketRequest(id) {
    const { data, error } = await window.supabase
        .from('mrk_market_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error || !data) { alert("Error loading market request: " + (error?.message || 'not found')); return; }

    editingMarketRequestId = id;
    resetStorageState();
    document.getElementById('mkt_date').value = data.request_date || '';
    document.getElementById('mkt_no').value = data.request_no || '';
    document.getElementById('mkt_type').value = data.request_type || '';
    document.getElementById('mkt_desc').value = data.description || '';
    document.getElementById('mkt_priority').value = data.priority || 'medium';
    document.getElementById('mkt_status').value = data.status || 'pending';
    document.getElementById('mkt_assign').value = data.assigned_to || '';
    document.getElementById('mkt_due').value = data.due_date || '';
    document.getElementById('mkt_file').value = '';
    document.getElementById('mkt_file_lbl').innerText = '';

    // Show existing attachments
    const existingAttachmentsDiv = document.getElementById('existingAttachments');
    const existingFileLink = document.getElementById('existingFileLink');
    const existingVoiceLink = document.getElementById('existingVoiceLink');
    const fileLink = document.getElementById('fileLink');
    const voiceLink = document.getElementById('voiceLink');

    if (data.file_url || data.voice_note_url) {
        existingAttachmentsDiv.style.display = 'block';
        
        if (data.file_url) {
            existingFileLink.style.display = 'block';
            // Extract storage path from URL and get fresh URL
            const filePath = data.file_url.split('/documents/')[1]?.split('?')[0];
            if (filePath) {
                const freshUrl = await getFileUrl(filePath);
                fileLink.href = freshUrl || data.file_url;
            } else {
                fileLink.href = data.file_url;
            }
            document.getElementById('fileLinkText').textContent = 'Open attached file';
        } else {
            existingFileLink.style.display = 'none';
        }

        if (data.voice_note_url) {
            existingVoiceLink.style.display = 'block';
            // Extract storage path from URL and get fresh URL
            const voicePath = data.voice_note_url.split('/documents/')[1]?.split('?')[0];
            if (voicePath) {
                const freshVoiceUrl = await getFileUrl(voicePath);
                voiceLink.href = freshVoiceUrl || data.voice_note_url;
            } else {
                voiceLink.href = data.voice_note_url;
            }
            document.getElementById('voiceLinkText').textContent = 'Play voice note';
        } else {
            existingVoiceLink.style.display = 'none';
        }
    } else {
        existingAttachmentsDiv.style.display = 'none';
    }

    updateAdminFieldsVisibility();
    document.getElementById('formModal-marketRequest').style.display = 'flex';
}

// Create or update a market request
async function saveMarketRequest() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('mkt_date').value;
    const no = document.getElementById('mkt_no').value;
    const type = document.getElementById('mkt_type').value;
    const prio = document.getElementById('mkt_priority').value;
    const status = document.getElementById('mkt_status').value;
    const assign = document.getElementById('mkt_assign').value;
    const due = document.getElementById('mkt_due').value;

    if (!no || !type) { alert("Request Number and Request Type are required."); return; }

    const payload = {
        request_no: no,
        request_date: date,
        request_type: type,
        description: document.getElementById('mkt_desc').value,
        priority: prio,
        status: status,
        due_date: due,
    };

    const { attachedFiles, voiceRecordingBlob } = getStorageState();

    // Upload attached file (single file for now)
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

    // Upload voice recording if present
    if (voiceRecordingBlob) {
        try {
            const voiceFileName = `${Date.now()}_voice_recording.webm`;
            const { data: uploadData, error: uploadError } = await window.supabase.storage
                .from('documents')
                .upload(voiceFileName, voiceRecordingBlob);

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    alert('Storage bucket "documents" does not exist. Please create it in Supabase dashboard (Storage → Create new bucket → name it "documents")');
                    return;
                }
                throw uploadError;
            }

            // Get URL for the voice recording using helper
            const voiceUrl = await getFileUrl(uploadData.path);
            if (voiceUrl) {
                payload.voice_note_url = voiceUrl;
            }
        } catch (error) {
            console.error('Error uploading voice recording:', error);
            alert('Error uploading voice recording: ' + error.message);
            return;
        }
    }

    let error;
    if (editingMarketRequestId) {
        // UPDATE existing record
        ({ error } = await window.supabase
            .from('mrk_market_requests')
            .update(payload)
            .eq('id', editingMarketRequestId));
    } else {
        // CREATE new record
        payload.created_by = user.id;
        ({ error } = await window.supabase
            .from('mrk_market_requests')
            .insert(payload));
    }

    if (error) { alert("Error saving market request: " + error.message); return; }

    // Reset attachments
    resetStorageState();
    document.getElementById('mkt_file').value = '';
    document.getElementById('mkt_file_lbl').innerText = '';

    alert(editingMarketRequestId ? "Market request updated successfully!" : "Market request has been registered in the list!");
    closeAllModals();
    editingMarketRequestId = null;
    loadMarketRequests();
}
