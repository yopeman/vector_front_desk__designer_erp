// Client Registry Modal
export const clientRegistryModal = `
<div id="formModal-clientRegistry" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Register Client Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="cli_date" class="input-field" value="2026-06-05"></div>
                <div class="form-group"><label>Client/Company Name</label><input type="text" id="cli_name" class="input-field" value="Vector Advert Corp"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Customer Type</label><select id="cli_type" class="input-field"><option selected>organization</option><option>personal</option></select></div>
                <div class="form-group"><label>Business Sector</label><select id="cli_sector" class="input-field"><option selected>advertising</option><option>manufacturing</option><option>financial</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>TIN Number</label><input type="text" id="cli_tin" class="input-field" value="0059144267"></div>
                <div class="form-group"><label>Discovery</label><select id="cli_discovery" class="input-field"><option selected>telegram</option><option>tiktok</option><option>facebook</option></select></div>
            </div>

            <div id="clientExistingAttachments" style="display:none; margin-bottom:15px; padding:12px; background:var(--input-bg); border-radius:8px; border:1px solid #233554;">
                <div style="font-size:12px; color:var(--text-gray); margin-bottom:8px;">Existing Attachment:</div>
                <div id="clientExistingFileLink" style="display:none; margin-bottom:8px;">
                    <a id="clientFileLink" href="#" target="_blank" style="color:var(--primary); font-size:12px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-file"></i>
                        <span id="clientFileLinkText">Open attached file</span>
                    </a>
                </div>
            </div>

            <div class="media-box">
                <button type="button" class="media-btn file-btn" onclick="document.getElementById('cli_file').click()">📎 Attach Business License Document</button>
                <input type="file" id="cli_file" style="display:none;" onchange="handleFileSelect(event)">
                <span id="cli_file_lbl" style="font-size:11px; color:var(--text-gray);"></span>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveClient()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Client Registry')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
