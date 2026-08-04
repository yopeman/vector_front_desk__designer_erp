// Leave Request Modal
export const leaveModal = `
<div id="formModal-leave" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Leave Request Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="leave_date" class="input-field" value="2026-06-09"></div>
                <div class="form-group"><label>Reason Type</label>
                    <select id="leave_reason" class="input-field"><option selected>Annual Leave</option><option>Medical Leave</option></select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>From Date</label><input type="date" id="leave_start" class="input-field" value="2026-07-01"></div>
                <div class="form-group"><label>To Date</label><input type="date" id="leave_end" class="input-field" value="2026-07-15"></div>
            </div>
            <div class="form-group"><label>Remarks</label><input type="text" id="leave_rem" class="input-field" value="Annual Vacation Plan"></div>

            <div class="media-box">
                <button type="button" class="media-btn file-btn" onclick="document.getElementById('leave_file').click()">📎 Attach Letter/Application</button>
                <input type="file" id="leave_file" style="display:none;" onchange="handleFileSelect(event)">
                <span id="leave_file_lbl" style="font-size:11px; color:var(--text-gray);"></span>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveLeave()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Leave Request')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
