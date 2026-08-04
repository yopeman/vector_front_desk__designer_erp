// Invoices module for invoice operations

let editingInvoiceId = null;
let invoicesCache = [];

// Load invoices from Supabase and render the table
async function loadInvoices() {
    const tbody = document.getElementById('invoiceTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">Loading invoices...</td></tr>';

    const { data, error } = await window.supabase
        .from('mrk_invoices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger);">Error loading: ${error.message}</td></tr>`;
        return;
    }

    invoicesCache = data || [];
    renderInvoices();
}

function renderInvoices() {
    const tbody = document.getElementById('invoiceTableBody');
    if (invoicesCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-gray);">No invoices found.</td></tr>';
        return;
    }

    tbody.innerHTML = invoicesCache.map(inv => {
        return `<tr>
            <td>${inv.invoice_date || '—'}</td>
            <td>${inv.invoice_no || '—'}</td>
            <td>${inv.client_name || '—'}</td>
            <td>${inv.reference_no || '—'}</td>
            <td>${inv.item_service || '—'}</td>
            <td>${inv.subtotal ? inv.subtotal.toLocaleString() + ' ETB' : '—'}</td>
            <td>${inv.vat_amount ? inv.vat_amount.toLocaleString() + ' ETB' : '—'}</td>
            <td>${inv.grand_total ? inv.grand_total.toLocaleString() + ' ETB' : '—'}</td>
            <td>
                <button class="action-trigger btn-register" style="padding:6px 12px; font-size:11px;" onclick="editInvoice('${inv.id}')">✏️ Edit</button>
            </td>
        </tr>`;
    }).join('');
}

function calculateInvoiceTotal() {
    const sub = parseFloat(document.getElementById('inv_subtotal').value) || 0;
    const vat = document.getElementById('inv_vat_toggle').checked ? sub * 0.15 : 0;
    document.getElementById('displayVatAmount').innerText = vat.toLocaleString();
    document.getElementById('displayGrandTotal').innerText = (sub + vat).toLocaleString();
}

// Open the form in "create" mode (reset fields)
function openNewInvoiceForm() {
    editingInvoiceId = null;
    resetStorageState();
    document.getElementById('inv_date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('inv_no').value = '';
    document.getElementById('inv_client').value = '';
    document.getElementById('inv_ref').value = '';
    document.getElementById('inv_item').value = '';
    document.getElementById('inv_subtotal').value = '';
    document.getElementById('inv_tin').value = '';
    document.getElementById('inv_term').value = '';
    document.getElementById('inv_vat_toggle').checked = true;
    calculateInvoiceTotal();
    document.getElementById('invoiceExistingAttachments').style.display = 'none';
    document.getElementById('formModal-invoice').style.display = 'flex';
}

// Open the form in "edit" mode, pre-filled with the record's data
async function editInvoice(id) {
    const { data, error } = await window.supabase
        .from('mrk_invoices')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error || !data) { alert("Error loading invoice: " + (error?.message || 'not found')); return; }

    editingInvoiceId = id;
    resetStorageState();
    document.getElementById('inv_date').value = data.invoice_date || '';
    document.getElementById('inv_no').value = data.invoice_no || '';
    document.getElementById('inv_client').value = data.client_name || '';
    document.getElementById('inv_ref').value = data.reference_no || '';
    document.getElementById('inv_item').value = data.item_service || '';
    document.getElementById('inv_subtotal').value = data.subtotal || '';
    document.getElementById('inv_tin').value = data.company_tin || '';
    document.getElementById('inv_term').value = data.payment_term || '';
    document.getElementById('inv_vat_toggle').checked = data.vat_included !== false;
    calculateInvoiceTotal();

    // Show existing attachments
    const existingAttachmentsDiv = document.getElementById('invoiceExistingAttachments');
    const existingFileLink = document.getElementById('invoiceExistingFileLink');
    const existingVoiceLink = document.getElementById('invoiceExistingVoiceLink');
    const fileLink = document.getElementById('invoiceFileLink');
    const voiceLink = document.getElementById('invoiceVoiceLink');

    if (data.file_url || data.voice_note_url) {
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
            document.getElementById('invoiceFileLinkText').textContent = 'Open attached file';
        } else {
            existingFileLink.style.display = 'none';
        }

        if (data.voice_note_url) {
            existingVoiceLink.style.display = 'block';
            const voicePath = data.voice_note_url.split('/documents/')[1]?.split('?')[0];
            if (voicePath) {
                const freshUrl = await getFileUrl(voicePath);
                voiceLink.href = freshUrl || data.voice_note_url;
            } else {
                voiceLink.href = data.voice_note_url;
            }
            document.getElementById('invoiceVoiceLinkText').textContent = 'Play voice note';
        } else {
            existingVoiceLink.style.display = 'none';
        }
    } else {
        existingAttachmentsDiv.style.display = 'none';
    }

    document.getElementById('formModal-invoice').style.display = 'flex';
}

// Create or update an invoice
async function saveInvoice() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('inv_date').value;
    const no = document.getElementById('inv_no').value;
    const client = document.getElementById('inv_client').value;
    const ref = document.getElementById('inv_ref').value;
    const item = document.getElementById('inv_item').value;
    const sub = parseFloat(document.getElementById('inv_subtotal').value) || 0;
    const vatIncluded = document.getElementById('inv_vat_toggle').checked;

    if (!no) { alert("Invoice Number is required."); return; }
    if (!client) { alert("Client Name is required."); return; }

    const payload = {
        invoice_date: date,
        invoice_no: no,
        client_name: client,
        reference_no: ref,
        item_service: item,
        subtotal: sub,
        vat_included: vatIncluded,
        company_tin: document.getElementById('inv_tin').value,
        payment_term: document.getElementById('inv_term').value,
    };

    const { attachedFiles } = getStorageState();
    const { voiceRecordingBlob } = getStorageState();

    // Upload attached file if present
    if (attachedFiles.length > 0) {
        try {
            const file = attachedFiles[0];
            const fileName = `invoice_${Date.now()}_${file.name}`;
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
            const voiceFileName = `invoice_voice_${Date.now()}.webm`;
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
                payload.voice_note_url = voiceUrl;
            }
        } catch (error) {
            console.error('Error uploading voice note:', error);
            alert('Error uploading voice note: ' + error.message);
            return;
        }
    }

    let error;
    if (editingInvoiceId) {
        // UPDATE existing record
        ({ error } = await window.supabase
            .from('mrk_invoices')
            .update(payload)
            .eq('id', editingInvoiceId));
    } else {
        // CREATE new record
        payload.created_by = user.id;
        ({ error } = await window.supabase
            .from('mrk_invoices')
            .insert(payload));
    }

    if (error) { alert("Error saving invoice: " + error.message); return; }

    // Reset attachments
    resetStorageState();

    alert(editingInvoiceId ? "Invoice updated successfully!" : "New invoice has been added to the list!");
    closeAllModals();
    editingInvoiceId = null;
    loadInvoices();
}

