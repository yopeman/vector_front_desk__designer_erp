// Tender Modal
export const tenderModal = `
<div id="formModal-tender" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Tender Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="ten_date" class="input-field" value="2026-05-20"></div>
                <div class="form-group"><label>Company Name</label><input type="text" id="ten_company" class="input-field" value="Gov Telecom"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Tender No</label><input type="text" id="ten_no" class="input-field" value="TEN-401"></div>
                <div class="form-group"><label>Item/Service</label><input type="text" id="ten_item" class="input-field" value="Network Hardware Setup"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>CPO Amount</label><input type="text" id="ten_cpo" class="input-field" value="50,000 ETB"></div>
                <div class="form-group"><label>Total Price</label><input type="text" id="ten_total" class="input-field" value="57,500 ETB"></div>
            </div>

            <div class="form-group"><label>VAT Status</label><select id="ten_vat_status" class="input-field"><option selected>with_vat</option><option>without_vat</option></select></div>

            <div id="tenderExistingAttachments" style="display:none; margin-bottom:15px; padding:12px; background:var(--input-bg); border-radius:8px; border:1px solid #233554;">
                <div style="font-size:12px; color:var(--text-gray); margin-bottom:8px;">Existing Attachment:</div>
                <div id="tenderExistingFileLink" style="display:none; margin-bottom:8px;">
                    <a id="tenderFileLink" href="#" target="_blank" style="color:var(--primary); font-size:12px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-file"></i>
                        <span id="tenderFileLinkText">Open attached file</span>
                    </a>
                </div>
            </div>

            <div class="media-box">
                <button type="button" class="media-btn file-btn" onclick="document.getElementById('ten_file').click()">📎 Attach Tender Document/CPO</button>
                <input type="file" id="ten_file" style="display:none;" onchange="handleFileSelect(event)">
                <span id="ten_file_lbl" style="font-size:11px; color:var(--text-gray);"></span>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveTender()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Tender')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
