// Feedback Modal
export const feedbackModal = `
<div id="formModal-feedback" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Feedback Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="fb_date" class="input-field" value="2026-06-02"></div>
                <div class="form-group"><label>Client Name</label><input type="text" id="fb_client" class="input-field" value="Commercial Bank of Ethiopia"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Project Name</label><input type="text" id="fb_proj" class="input-field" value="Mobile App Marketing Campaign"></div>
                <div class="form-group"><label>Project Number</label><input type="text" id="fb_proj_no" class="input-field" value="PRJ-77"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Overall Evaluation (0-100)</label><input type="number" id="fb_score1" class="input-field" value="100"></div>
                <div class="form-group"><label>Service Quality (0-100)</label><input type="number" id="fb_score2" class="input-field" value="100"></div>
            </div>

            <div class="media-box">
                <button type="button" class="media-btn file-btn" onclick="document.getElementById('fb_file').click()">📎 Attach Signed Form</button>
                <input type="file" id="fb_file" style="display:none;" onchange="handleFileSelect(event)">
                <span id="fb_file_lbl" style="font-size:11px; color:var(--text-gray);"></span>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveFeedback()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Feedback')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
