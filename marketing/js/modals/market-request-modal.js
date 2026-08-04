// Market Request Modal
export const marketRequestModal = `
<div id="formModal-marketRequest" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Market Request Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="mkt_date" class="input-field" value="2026-06-09"></div>
                <div class="form-group"><label>Request Number</label><input type="text" id="mkt_no" class="input-field" value="REQ-002"></div>
            </div>
            <div class="form-group"><label>Request Type</label><input type="text" id="mkt_type" class="input-field" value="Advertising and Branding Work"></div>
            <div class="form-group"><label>Description</label><textarea id="mkt_desc" class="input-field" rows="2">Prepare a new campaign advertisement for Vector Master</textarea></div>
            <div class="form-row">
                <div class="form-group"><label>Priority</label><select id="mkt_priority" class="input-field"><option selected>high</option><option>medium</option><option>low</option></select></div>
                <div class="form-group"><label>Assigned To</label><input type="text" id="mkt_assign" class="input-field" value="Abebe K."></div>
            </div>
            <div class="form-group"><label>Due Date</label><input type="date" id="mkt_due" class="input-field" value="2026-06-15"></div>
            
            <div id="existingAttachments" style="display:none; margin-bottom:15px; padding:12px; background:var(--input-bg); border-radius:8px; border:1px solid #233554;">
                <div style="font-size:12px; color:var(--text-gray); margin-bottom:8px;">Existing Attachments:</div>
                <div id="existingFileLink" style="display:none; margin-bottom:8px;">
                    <a id="fileLink" href="#" target="_blank" style="color:var(--primary); font-size:12px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-file"></i>
                        <span id="fileLinkText">Open attached file</span>
                    </a>
                </div>
                <div id="existingVoiceLink" style="display:none;">
                    <a id="voiceLink" href="#" target="_blank" style="color:var(--accent); font-size:12px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-microphone"></i>
                        <span id="voiceLinkText">Play voice note</span>
                    </a>
                </div>
            </div>

            <div class="media-box">
                <div>
                    <button type="button" class="media-btn file-btn" onclick="document.getElementById('mkt_file').click()">📎 Attach File</button>
                    <input type="file" id="mkt_file" style="display:none;" onchange="handleFileSelect(event)">
                    <span id="mkt_file_lbl" style="font-size:11px; margin-left:5px; color:var(--text-gray);"></span>
                    <button type="button" id="btnMktVoice" class="media-btn record" onclick="toggleVoiceRecording('btnMktVoice')">🎤 Record Voice</button>
                </div>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveMarketRequest()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Market Request')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
