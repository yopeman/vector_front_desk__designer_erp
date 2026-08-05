// Other Forms module for research, digital log, tender, feedback, and leave operations

let editingResearchId = null;
let researchCache = [];
let editingDigitalLogId = null;
let digitalLogCache = [];
let editingTenderId = null;
let tenderCache = [];
let editingFeedbackId = null;
let feedbackCache = [];

// Load research from Supabase and render the table
async function loadResearch() {
    const tbody = document.getElementById('researchTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-gray);">Loading research...</td></tr>';

    const { data, error } = await window.supabase
        .from('mrk_research_logins')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger);">Error loading: ${error.message}</td></tr>`;
        return;
    }

    researchCache = data || [];
    renderResearch();
}

function renderResearch() {
    const tbody = document.getElementById('researchTableBody');
    if (researchCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-gray);">No research found.</td></tr>';
        return;
    }

    tbody.innerHTML = researchCache.map(r => {
        return `<tr>
            <td>${r.research_date || '—'}</td>
            <td>${r.research_no || '—'}</td>
            <td>${r.title || '—'}</td>
            <td>${r.reason || '—'}</td>
            <td>${r.objective || '—'}</td>
            <td>${r.methodology || '—'}</td>
            <td>
                <button class="action-trigger btn-register" style="padding:6px 12px; font-size:11px;" onclick="editResearch('${r.id}')">✏️ Edit</button>
            </td>
        </tr>`;
    }).join('');
}

// Load digital logs from Supabase and render the table
async function loadDigitalLogs() {
    const tbody = document.getElementById('digitalLogTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-gray);">Loading digital logs...</td></tr>';

    const { data, error } = await window.supabase
        .from('mrk_digital_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Error loading: ${error.message}</td></tr>`;
        return;
    }

    digitalLogCache = data || [];
    renderDigitalLogs();
}

function renderDigitalLogs() {
    const tbody = document.getElementById('digitalLogTableBody');
    if (digitalLogCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-gray);">No digital logs found.</td></tr>';
        return;
    }

    tbody.innerHTML = digitalLogCache.map(log => {
        return `<tr>
            <td>${log.log_date || '—'}</td>
            <td>${log.content_no || '—'}</td>
            <td>${log.content_title || '—'}</td>
            <td>${log.content_script ? log.content_script.substring(0, 35) + '...' : '—'}</td>
            <td>${log.share_to || '—'}</td>
            <td>
                <button class="action-trigger btn-register" style="padding:6px 12px; font-size:11px;" onclick="editDigitalLog('${log.id}')">✏️ Edit</button>
            </td>
        </tr>`;
    }).join('');
}

// Open the form in "create" mode (reset fields)
function openNewResearchForm() {
    editingResearchId = null;
    resetStorageState();
    document.getElementById('res_date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('res_no').value = '';
    document.getElementById('res_title').value = '';
    document.getElementById('res_reason').value = '';
    document.getElementById('res_obj').value = '';
    document.getElementById('res_method').value = '';
    document.getElementById('researchExistingAttachments').style.display = 'none';
    document.getElementById('formModal-research').style.display = 'flex';
}

function openNewDigitalLogForm() {
    editingDigitalLogId = null;
    resetStorageState();
    document.getElementById('log_date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('log_no').value = '';
    document.getElementById('log_title').value = '';
    document.getElementById('log_script').value = '';
    document.getElementById('log_channel').value = '';
    document.getElementById('log_share').value = 'marketing_manager';
    document.getElementById('digitalLogExistingAttachments').style.display = 'none';
    document.getElementById('formModal-digitalLog').style.display = 'flex';
}

// Open the form in "edit" mode, pre-filled with the record's data
async function editResearch(id) {
    const { data, error } = await window.supabase
        .from('mrk_research_logins')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error || !data) { alert("Error loading research: " + (error?.message || 'not found')); return; }

    editingResearchId = id;
    resetStorageState();
    document.getElementById('res_date').value = data.research_date || '';
    document.getElementById('res_no').value = data.research_no || '';
    document.getElementById('res_title').value = data.title || '';
    document.getElementById('res_reason').value = data.reason || '';
    document.getElementById('res_obj').value = data.objective || '';
    document.getElementById('res_method').value = data.methodology || '';

    // Show existing attachment
    const existingAttachmentsDiv = document.getElementById('researchExistingAttachments');
    const existingFileLink = document.getElementById('researchExistingFileLink');
    const fileLink = document.getElementById('researchFileLink');

    if (data.file_url) {
        existingAttachmentsDiv.style.display = 'block';
        existingFileLink.style.display = 'block';
        const filePath = data.file_url.split('/documents/')[1]?.split('?')[0];
        if (filePath) {
            const freshUrl = await getFileUrl(filePath);
            fileLink.href = freshUrl || data.file_url;
        } else {
            fileLink.href = data.file_url;
        }
        document.getElementById('researchFileLinkText').textContent = 'Open attached file';
    } else {
        existingAttachmentsDiv.style.display = 'none';
    }

    document.getElementById('formModal-research').style.display = 'flex';
}

async function editDigitalLog(id) {
    const { data, error } = await window.supabase
        .from('mrk_digital_logs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error || !data) { alert("Error loading digital log: " + (error?.message || 'not found')); return; }

    editingDigitalLogId = id;
    resetStorageState();
    document.getElementById('log_date').value = data.log_date || '';
    document.getElementById('log_no').value = data.content_no || '';
    document.getElementById('log_title').value = data.content_title || '';
    document.getElementById('log_script').value = data.content_script || '';
    document.getElementById('log_channel').value = data.social_channel || '';
    document.getElementById('log_share').value = data.share_to || 'marketing_manager';

    // Show existing attachments
    const existingAttachmentsDiv = document.getElementById('digitalLogExistingAttachments');
    const existingFileLink = document.getElementById('digitalLogExistingFileLink');
    const existingVoiceLink = document.getElementById('digitalLogExistingVoiceLink');
    const fileLink = document.getElementById('digitalLogFileLink');
    const voiceLink = document.getElementById('digitalLogVoiceLink');

    if (data.file_url || data.voice_url) {
        existingAttachmentsDiv.style.display = 'block';
        
        if (data.file_url) {
            existingFileLink.style.display = 'block';
            const filePath = data.file_url.split('/documents/')[1]?.split('?')[0];
            if (filePath) {
                const freshUrl = await getFileUrl(filePath);
                fileLink.href = freshUrl || data.file_url;
            } else {
                fileLink.href = data.file_url;
            }
            document.getElementById('digitalLogFileLinkText').textContent = 'Open attached file';
        } else {
            existingFileLink.style.display = 'none';
        }

        if (data.voice_url) {
            existingVoiceLink.style.display = 'block';
            const voicePath = data.voice_url.split('/documents/')[1]?.split('?')[0];
            if (voicePath) {
                const freshUrl = await getFileUrl(voicePath);
                voiceLink.href = freshUrl || data.voice_url;
            } else {
                voiceLink.href = data.voice_url;
            }
            document.getElementById('digitalLogVoiceLinkText').textContent = 'Play voice note';
        } else {
            existingVoiceLink.style.display = 'none';
        }
    } else {
        existingAttachmentsDiv.style.display = 'none';
    }

    document.getElementById('formModal-digitalLog').style.display = 'flex';
}

// Create or update research
async function saveResearch() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('res_date').value;
    const no = document.getElementById('res_no').value;
    const title = document.getElementById('res_title').value;
    const reason = document.getElementById('res_reason').value;
    const obj = document.getElementById('res_obj').value;
    const method = document.getElementById('res_method').value;

    if (!no) { alert("Research Number is required."); return; }
    if (!title) { alert("Research Title is required."); return; }

    const payload = {
        research_date: date,
        research_no: no,
        title: title,
        reason: reason,
        objective: obj,
        methodology: method,
    };

    const { attachedFiles } = getStorageState();

    // Upload attached file if present
    if (attachedFiles.length > 0) {
        try {
            const file = attachedFiles[0];
            const fileName = `research_${Date.now()}_${file.name}`;
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
    if (editingResearchId) {
        // UPDATE existing record
        ({ error } = await window.supabase
            .from('mrk_research_logins')
            .update(payload)
            .eq('id', editingResearchId));
    } else {
        // CREATE new record
        payload.created_by = user.id;
        ({ error } = await window.supabase
            .from('mrk_research_logins')
            .insert(payload));
    }

    if (error) { alert("Error saving research: " + error.message); return; }

    // Reset attachments
    resetStorageState();

    alert(editingResearchId ? "Research updated successfully!" : "Research information has been added to the table!");
    closeAllModals();
    editingResearchId = null;
    loadResearch();
}

// Create or update digital log
async function saveDigitalLog() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('log_date').value;
    const no = document.getElementById('log_no').value;
    const title = document.getElementById('log_title').value;
    const script = document.getElementById('log_script').value;
    const channel = document.getElementById('log_channel').value;
    const share = document.getElementById('log_share').value;

    if (!no) { alert("Content Number is required."); return; }
    if (!title) { alert("Content Title is required."); return; }

    const payload = {
        log_date: date,
        content_no: no,
        content_title: title,
        content_script: script,
        social_channel: channel,
        share_to: share,
    };

    const { attachedFiles } = getStorageState();
    const { voiceRecordingBlob } = getStorageState();

    // Upload attached file if present
    if (attachedFiles.length > 0) {
        try {
            const file = attachedFiles[0];
            const fileName = `digital_log_${Date.now()}_${file.name}`;
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

    // Upload voice note if present
    if (voiceRecordingBlob) {
        try {
            const voiceFileName = `digital_log_voice_${Date.now()}.webm`;
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

            const voiceUrl = await getFileUrl(uploadData.path);
            if (voiceUrl) {
                payload.voice_url = voiceUrl;
            }
        } catch (error) {
            console.error('Error uploading voice note:', error);
            alert('Error uploading voice note: ' + error.message);
            return;
        }
    }

    let error;
    if (editingDigitalLogId) {
        // UPDATE existing record
        ({ error } = await window.supabase
            .from('mrk_digital_logs')
            .update(payload)
            .eq('id', editingDigitalLogId));
    } else {
        // CREATE new record
        payload.created_by = user.id;
        ({ error } = await window.supabase
            .from('mrk_digital_logs')
            .insert(payload));
    }

    if (error) { alert("Error saving digital log: " + error.message); return; }

    // Reset attachments
    resetStorageState();

    alert(editingDigitalLogId ? "Digital log updated successfully!" : "Digital log information has been saved!");
    closeAllModals();
    editingDigitalLogId = null;
    loadDigitalLogs();
}

// Load tenders from Supabase and render the table
async function loadTenders() {
    const tbody = document.getElementById('tenderTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">Loading tenders...</td></tr>';

    const { data, error } = await window.supabase
        .from('mrk_tenders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger);">Error loading: ${error.message}</td></tr>`;
        return;
    }

    tenderCache = data || [];
    renderTenders();
}

function renderTenders() {
    const tbody = document.getElementById('tenderTableBody');
    if (tenderCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">No tenders found.</td></tr>';
        return;
    }

    tbody.innerHTML = tenderCache.map(t => {
        return `<tr>
            <td>${t.tender_date || '—'}</td>
            <td>${t.company_name || '—'}</td>
            <td>${t.tender_no || '—'}</td>
            <td>${t.item_service || '—'}</td>
            <td>${t.cpo_amount ? t.cpo_amount.toLocaleString() + ' ETB' : '—'}</td>
            <td>${t.total_price ? t.total_price.toLocaleString() + ' ETB' : '—'}</td>
            <td>${t.vat_status === 'with_vat' ? 'With VAT' : 'Without VAT'}</td>
            <td>
                <button class="action-trigger btn-register" style="padding:6px 12px; font-size:11px;" onclick="editTender('${t.id}')">✏️ Edit</button>
            </td>
        </tr>`;
    }).join('');
}

// Open the form in "create" mode (reset fields)
function openNewTenderForm() {
    editingTenderId = null;
    resetStorageState();
    document.getElementById('ten_date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('ten_company').value = '';
    document.getElementById('ten_no').value = '';
    document.getElementById('ten_item').value = '';
    document.getElementById('ten_cpo').value = '';
    document.getElementById('ten_total').value = '';
    document.getElementById('ten_vat_status').value = 'with_vat';
    document.getElementById('tenderExistingAttachments').style.display = 'none';
    document.getElementById('formModal-tender').style.display = 'flex';
}

// Open the form in "edit" mode, pre-filled with the record's data
async function editTender(id) {
    const { data, error } = await window.supabase
        .from('mrk_tenders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error || !data) { alert("Error loading tender: " + (error?.message || 'not found')); return; }

    editingTenderId = id;
    resetStorageState();
    document.getElementById('ten_date').value = data.tender_date || '';
    document.getElementById('ten_company').value = data.company_name || '';
    document.getElementById('ten_no').value = data.tender_no || '';
    document.getElementById('ten_item').value = data.item_service || '';
    document.getElementById('ten_cpo').value = data.cpo_amount || '';
    document.getElementById('ten_total').value = data.total_price || '';
    document.getElementById('ten_vat_status').value = data.vat_status || 'with_vat';

    // Show existing attachment
    const existingAttachmentsDiv = document.getElementById('tenderExistingAttachments');
    const existingFileLink = document.getElementById('tenderExistingFileLink');
    const fileLink = document.getElementById('tenderFileLink');

    if (data.file_url) {
        existingAttachmentsDiv.style.display = 'block';
        existingFileLink.style.display = 'block';
        const filePath = data.file_url.split('/documents/')[1]?.split('?')[0];
        if (filePath) {
            const freshUrl = await getFileUrl(filePath);
            fileLink.href = freshUrl || data.file_url;
        } else {
            fileLink.href = data.file_url;
        }
        document.getElementById('tenderFileLinkText').textContent = 'Open attached file';
    } else {
        existingAttachmentsDiv.style.display = 'none';
    }

    document.getElementById('formModal-tender').style.display = 'flex';
}

// Create or update tender
async function saveTender() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('ten_date').value;
    const comp = document.getElementById('ten_company').value;
    const no = document.getElementById('ten_no').value;
    const item = document.getElementById('ten_item').value;
    const cpo = parseFloat(document.getElementById('ten_cpo').value.replace(/[^0-9.]/g, '')) || null;
    const tot = parseFloat(document.getElementById('ten_total').value.replace(/[^0-9.]/g, '')) || null;
    const vatStatus = document.getElementById('ten_vat_status').value;

    if (!comp) { alert("Company Name is required."); return; }
    if (!no) { alert("Tender Number is required."); return; }

    const payload = {
        tender_date: date,
        company_name: comp,
        tender_no: no,
        item_service: item,
        cpo_amount: cpo,
        total_price: tot,
        vat_status: vatStatus,
    };

    const { attachedFiles } = getStorageState();

    // Upload attached file if present
    if (attachedFiles.length > 0) {
        try {
            const file = attachedFiles[0];
            const fileName = `tender_${Date.now()}_${file.name}`;
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
    if (editingTenderId) {
        // UPDATE existing record
        ({ error } = await window.supabase
            .from('mrk_tenders')
            .update(payload)
            .eq('id', editingTenderId));
    } else {
        // CREATE new record
        payload.created_by = user.id;
        ({ error } = await window.supabase
            .from('mrk_tenders')
            .insert(payload));
    }

    if (error) { alert("Error saving tender: " + error.message); return; }

    // Reset attachments
    resetStorageState();

    alert(editingTenderId ? "Tender updated successfully!" : "Tender information has been registered!");
    closeAllModals();
    editingTenderId = null;
    loadTenders();
}

// Load feedbacks from Supabase and render the table
async function loadFeedbacks() {
    const tbody = document.getElementById('feedbackTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">Loading feedbacks...</td></tr>';

    const { data, error } = await window.supabase
        .from('mrk_feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger);">Error loading: ${error.message}</td></tr>`;
        return;
    }

    feedbackCache = data || [];
    renderFeedbacks();
}

function renderFeedbacks() {
    const tbody = document.getElementById('feedbackTableBody');
    if (feedbackCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">No feedbacks found.</td></tr>';
        return;
    }

    tbody.innerHTML = feedbackCache.map(f => {
        return `<tr>
            <td>${f.feedback_date || '—'}</td>
            <td>${f.client_name || '—'}</td>
            <td>${f.project_name || '—'}</td>
            <td>${f.project_no || '—'}</td>
            <td>${f.overall_score !== null ? f.overall_score : '—'}</td>
            <td>${f.service_score !== null ? f.service_score : '—'}</td>
            <td>${f.grade || '—'}</td>
            <td>
                <button class="action-trigger btn-register" style="padding:6px 12px; font-size:11px;" onclick="editFeedback('${f.id}')">✏️ Edit</button>
            </td>
        </tr>`;
    }).join('');
}

// Open the form in "create" mode (reset fields)
function openNewFeedbackForm() {
    editingFeedbackId = null;
    resetStorageState();
    document.getElementById('fb_date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('fb_client').value = '';
    document.getElementById('fb_proj').value = '';
    document.getElementById('fb_proj_no').value = '';
    document.getElementById('fb_score1').value = '';
    document.getElementById('fb_score2').value = '';
    document.getElementById('feedbackExistingAttachments').style.display = 'none';
    document.getElementById('formModal-feedback').style.display = 'flex';
}

// Open the form in "edit" mode, pre-filled with the record's data
async function editFeedback(id) {
    const { data, error } = await window.supabase
        .from('mrk_feedbacks')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error || !data) { alert("Error loading feedback: " + (error?.message || 'not found')); return; }

    editingFeedbackId = id;
    resetStorageState();
    document.getElementById('fb_date').value = data.feedback_date || '';
    document.getElementById('fb_client').value = data.client_name || '';
    document.getElementById('fb_proj').value = data.project_name || '';
    document.getElementById('fb_proj_no').value = data.project_no || '';
    document.getElementById('fb_score1').value = data.overall_score || '';
    document.getElementById('fb_score2').value = data.service_score || '';

    // Show existing attachment
    const existingAttachmentsDiv = document.getElementById('feedbackExistingAttachments');
    const existingFileLink = document.getElementById('feedbackExistingFileLink');
    const fileLink = document.getElementById('feedbackFileLink');

    if (data.file_url) {
        existingAttachmentsDiv.style.display = 'block';
        existingFileLink.style.display = 'block';
        const filePath = data.file_url.split('/documents/')[1]?.split('?')[0];
        if (filePath) {
            const freshUrl = await getFileUrl(filePath);
            fileLink.href = freshUrl || data.file_url;
        } else {
            fileLink.href = data.file_url;
        }
        document.getElementById('feedbackFileLinkText').textContent = 'Open attached file';
    } else {
        existingAttachmentsDiv.style.display = 'none';
    }

    document.getElementById('formModal-feedback').style.display = 'flex';
}

// Create or update feedback
async function saveFeedback() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('fb_date').value;
    const client = document.getElementById('fb_client').value;
    const proj = document.getElementById('fb_proj').value;
    const no = document.getElementById('fb_proj_no').value;
    const s1 = parseInt(document.getElementById('fb_score1').value) || null;
    const s2 = parseInt(document.getElementById('fb_score2').value) || null;

    if (!client) { alert("Client Name is required."); return; }

    const payload = {
        feedback_date: date,
        client_name: client,
        project_name: proj,
        project_no: no,
        overall_score: s1,
        service_score: s2,
    };

    const { attachedFiles } = getStorageState();

    // Upload attached file if present
    if (attachedFiles.length > 0) {
        try {
            const file = attachedFiles[0];
            const fileName = `feedback_${Date.now()}_${file.name}`;
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
    if (editingFeedbackId) {
        // UPDATE existing record
        ({ error } = await window.supabase
            .from('mrk_feedbacks')
            .update(payload)
            .eq('id', editingFeedbackId));
    } else {
        // CREATE new record
        payload.created_by = user.id;
        ({ error } = await window.supabase
            .from('mrk_feedbacks')
            .insert(payload));
    }

    if (error) { alert("Error saving feedback: " + error.message); return; }

    // Reset attachments
    resetStorageState();

    alert(editingFeedbackId ? "Feedback updated successfully!" : "Client feedback has been recorded!");
    closeAllModals();
    editingFeedbackId = null;
    loadFeedbacks();
}

function saveLeave() {
    const date = document.getElementById('leave_date').value;
    const start = document.getElementById('leave_start').value;
    const end = document.getElementById('leave_end').value;
    const reason = document.getElementById('leave_reason').value;
    const rem = document.getElementById('leave_rem').value;

    document.getElementById('leaveTableBody').innerHTML += `<tr><td>${date}</td><td>${start} - ${end}</td><td>${reason}</td><td>Attached</td><td>${rem}</td><td><span class="status-pill pending">Pending</span></td></tr>`;
    alert("Leave request has been sent to the manager!");
    closeAllModals();
}

function downloadFormPDF(formName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let formData = {};
    let title = '';
    
    // Helper function to check if modal is visible
    function isModalVisible(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return false;
        const display = window.getComputedStyle(modal).display;
        return display === 'flex';
    }
    
    // Detect which modal is open and extract data
    if (isModalVisible('formModal-research')) {
        title = 'Research Form';
        formData = {
            'Date': document.getElementById('res_date')?.value || '',
            'Research No': document.getElementById('res_no')?.value || '',
            'Title': document.getElementById('res_title')?.value || '',
            'Reason': document.getElementById('res_reason')?.value || '',
            'Objective': document.getElementById('res_obj')?.value || '',
            'Methodology': document.getElementById('res_method')?.value || ''
        };
    } else if (isModalVisible('formModal-digitalLog')) {
        title = 'Digital Log Form';
        formData = {
            'Date': document.getElementById('log_date')?.value || '',
            'Content No': document.getElementById('log_no')?.value || '',
            'Content Title': document.getElementById('log_title')?.value || '',
            'Content Script': document.getElementById('log_script')?.value || '',
            'Social Channel': document.getElementById('log_channel')?.value || '',
            'Share To': document.getElementById('log_share')?.value || ''
        };
    } else if (isModalVisible('formModal-tender')) {
        title = 'Tender Form';
        formData = {
            'Date': document.getElementById('ten_date')?.value || '',
            'Company Name': document.getElementById('ten_company')?.value || '',
            'Tender No': document.getElementById('ten_no')?.value || '',
            'Item/Service': document.getElementById('ten_item')?.value || '',
            'CPO Amount': document.getElementById('ten_cpo')?.value || '',
            'Total Price': document.getElementById('ten_total')?.value || '',
            'VAT Status': document.getElementById('ten_vat_status')?.value || ''
        };
    } else if (isModalVisible('formModal-feedback')) {
        title = 'Feedback Form';
        formData = {
            'Date': document.getElementById('fb_date')?.value || '',
            'Client Name': document.getElementById('fb_client')?.value || '',
            'Project Name': document.getElementById('fb_proj')?.value || '',
            'Project No': document.getElementById('fb_proj_no')?.value || '',
            'Overall Score': document.getElementById('fb_score1')?.value || '',
            'Service Score': document.getElementById('fb_score2')?.value || ''
        };
    } else if (isModalVisible('formModal-leave')) {
        title = 'Leave Form';
        formData = {
            'Date': document.getElementById('leave_date')?.value || '',
            'Start Date': document.getElementById('leave_start')?.value || '',
            'End Date': document.getElementById('leave_end')?.value || '',
            'Reason': document.getElementById('leave_reason')?.value || '',
            'Remarks': document.getElementById('leave_rem')?.value || ''
        };
    } else if (isModalVisible('formModal-marketRequest')) {
        title = 'Market Request Form';
        formData = {
            'Date': document.getElementById('mkt_date')?.value || '',
            'Request Number': document.getElementById('mkt_no')?.value || '',
            'Request Type': document.getElementById('mkt_type')?.value || '',
            'Description': document.getElementById('mkt_desc')?.value || '',
            'Priority': document.getElementById('mkt_priority')?.value || '',
            'Status': document.getElementById('mkt_status')?.value || '',
            'Assigned To': document.getElementById('mkt_assign')?.value || '',
            'Due Date': document.getElementById('mkt_due')?.value || ''
        };
    } else if (isModalVisible('formModal-clientRegistry')) {
        title = 'Client Registry Form';
        formData = {
            'Date': document.getElementById('cli_date')?.value || '',
            'Client/Company Name': document.getElementById('cli_name')?.value || '',
            'Customer Type': document.getElementById('cli_type')?.value || '',
            'Business Sector': document.getElementById('cli_sector')?.value || '',
            'TIN Number': document.getElementById('cli_tin')?.value || '',
            'Discovery': document.getElementById('cli_discovery')?.value || ''
        };
    } else if (isModalVisible('formModal-invoice')) {
        title = 'Invoice Form';
        const vatToggle = document.getElementById('inv_vat_toggle')?.checked;
        formData = {
            'Date': document.getElementById('inv_date')?.value || '',
            'Invoice Number': document.getElementById('inv_no')?.value || '',
            'Client Name': document.getElementById('inv_client')?.value || '',
            'Reference Number': document.getElementById('inv_ref')?.value || '',
            'Item/Service Type': document.getElementById('inv_item')?.value || '',
            'Subtotal Amount': document.getElementById('inv_subtotal')?.value || '',
            'Company TIN Number': document.getElementById('inv_tin')?.value || '',
            'Payment Term': document.getElementById('inv_term')?.value || '',
            'Include VAT': vatToggle ? 'Yes' : 'No',
            'VAT Amount': document.getElementById('displayVatAmount')?.textContent || '',
            'Grand Total': document.getElementById('displayGrandTotal')?.textContent || ''
        };
    } else {
        alert('No form modal is currently open.');
        return;
    }
    
    // Generate PDF
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    doc.setFontSize(12);
    let yPosition = 35;
    
    for (const [key, value] of Object.entries(formData)) {
        if (value) {
            const label = `${key}:`;
            const text = `${value}`;
            
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, yPosition);
            
            doc.setFont(undefined, 'normal');
            doc.text(text, 60, yPosition);
            
            yPosition += 10;
        }
    }
    
    // Add timestamp
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition + 10);
    
    // Save PDF
    const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    // alert(`The complete document for [ ${formName} ] has been converted to PDF and download has started!`);
}
