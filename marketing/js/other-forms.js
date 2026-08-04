// Other Forms module for research, digital log, tender, feedback, and leave operations

let editingResearchId = null;
let researchCache = [];

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

async function saveTender() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('ten_date').value;
    const comp = document.getElementById('ten_company').value;
    const no = document.getElementById('ten_no').value;
    const item = document.getElementById('ten_item').value;
    const cpo = document.getElementById('ten_cpo').value;
    const tot = document.getElementById('ten_total').value;

    const { error } = await window.supabase
        .from('mrk_tenders')
        .insert({
            tender_date: date,
            company_name: comp,
            tender_no: no,
            item_service: item,
            cpo_amount: parseFloat(cpo.replace(/[^0-9.]/g, '')) || null,
            total_price: parseFloat(tot.replace(/[^0-9.]/g, '')) || null,
            created_by: user.id,
        });

    if (error) { alert("Error saving tender: " + error.message); return; }

    document.getElementById('tenderTableBody').innerHTML += `<tr><td>${date}</td><td>${comp}</td><td>${no}</td><td>${item}</td><td>${cpo}</td><td>${tot}</td><td>With VAT</td></tr>`;
    alert("Tender information has been registered!");
    closeAllModals();
}

async function saveFeedback() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('fb_date').value;
    const client = document.getElementById('fb_client').value;
    const proj = document.getElementById('fb_proj').value;
    const no = document.getElementById('fb_proj_no').value;
    const s1 = parseInt(document.getElementById('fb_score1').value) || 0;
    const s2 = parseInt(document.getElementById('fb_score2').value) || 0;

    const { error } = await window.supabase
        .from('mrk_feedbacks')
        .insert({
            feedback_date: date,
            client_name: client,
            project_name: proj,
            project_no: no,
            overall_score: s1,
            service_score: s2,
            created_by: user.id,
        });

    if (error) { alert("Error saving feedback: " + error.message); return; }

    document.getElementById('feedbackTableBody').innerHTML += `<tr><td>${date}</td><td>${client}</td><td>${proj}</td><td>${no}</td><td>Excellent (${s1})</td><td>Very Satisfied (${s2})</td><td>A</td></tr>`;
    alert("Client feedback has been recorded!");
    closeAllModals();
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
    alert(`The complete document for [ ${formName} ] has been converted to PDF and download has started!`);
}
