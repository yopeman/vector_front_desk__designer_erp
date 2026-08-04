// Research Login Modal
export const researchModal = `
<div id="formModal-research" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Research Login Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="res_date" class="input-field" value="2026-06-01"></div>
                <div class="form-group"><label>Research Number</label><input type="text" id="res_no" class="input-field" value="RES-701"></div>
            </div>
            <div class="form-group"><label>Research Title</label><input type="text" id="res_title" class="input-field" value="Competitor Study"></div>
            <div class="form-group"><label>Research Reason</label><textarea id="res_reason" class="input-field" rows="5">Analyze competitors and market share</textarea></div>
            <div class="form-row">
                <div class="form-group"><label>Objective</label><input type="text" id="res_obj" class="input-field" value="Identify Gaps"></div>
                <div class="form-group"><label>Methodology</label><input type="text" id="res_method" class="input-field" value="Surveys & Data Mining"></div>
            </div>

            <div id="researchExistingAttachments" style="display:none; margin-bottom:15px; padding:12px; background:var(--input-bg); border-radius:8px; border:1px solid #233554;">
                <div style="font-size:12px; color:var(--text-gray); margin-bottom:8px;">Existing Attachment:</div>
                <div id="researchExistingFileLink" style="display:none; margin-bottom:8px;">
                    <a id="researchFileLink" href="#" target="_blank" style="color:var(--primary); font-size:12px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-file"></i>
                        <span id="researchFileLinkText">Open attached file</span>
                    </a>
                </div>
            </div>

            <div class="media-box">
                <button type="button" class="media-btn file-btn" onclick="document.getElementById('res_file').click()">📎 Attach Research Document</button>
                <input type="file" id="res_file" style="display:none;" onchange="handleFileSelect(event)">
                <span id="res_file_lbl" style="font-size:11px; color:var(--text-gray);"></span>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveResearch()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Research Login')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
