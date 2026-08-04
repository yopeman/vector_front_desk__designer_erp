// Digital Log Modal
export const digitalLogModal = `
<div id="formModal-digitalLog" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Digital Log Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="log_date" class="input-field" value="2026-06-08"></div>
                <div class="form-group"><label>Content Number</label><input type="text" id="log_no" class="input-field" value="LOG-05"></div>
            </div>
            <div class="form-group"><label>Content Title</label><input type="text" id="log_title" class="input-field" value="TikTok Promo Video & Product Pitch"></div>
            
            <div class="form-group"><label>Content Script / Idea Description (Text Script)</label>
                <textarea id="log_script" class="input-field" rows="3">Short video script idea and marketing strategy description prepared to promote Vector Master ERP to the international market.</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group"><label>Social Media Channel</label><input type="text" id="log_channel" class="input-field" value="TikTok & Telegram Official"></div>
                <div class="form-group"><label>Share To</label><select id="log_share" class="input-field"><option selected>marketing manager</option><option>management</option></select></div>
            </div>

            <div id="digitalLogExistingAttachments" style="display:none; margin-bottom:15px; padding:12px; background:var(--input-bg); border-radius:8px; border:1px solid #233554;">
                <div style="font-size:12px; color:var(--text-gray); margin-bottom:8px;">Existing Attachments:</div>
                <div id="digitalLogExistingFileLink" style="display:none; margin-bottom:8px;">
                    <a id="digitalLogFileLink" href="#" target="_blank" style="color:var(--primary); font-size:12px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-file"></i>
                        <span id="digitalLogFileLinkText">Open attached file</span>
                    </a>
                </div>
                <div id="digitalLogExistingVoiceLink" style="display:none;">
                    <a id="digitalLogVoiceLink" href="#" target="_blank" style="color:var(--accent); font-size:12px; text-decoration:none; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-microphone"></i>
                        <span id="digitalLogVoiceLinkText">Play voice note</span>
                    </a>
                </div>
            </div>

            <div class="media-box">
                <div>
                    <button type="button" class="media-btn file-btn" onclick="document.getElementById('log_file').click()">📎 Attach Media File</button>
                    <input type="file" id="log_file" style="display:none;" onchange="handleFileSelect(event)">
                    <span id="log_file_lbl" style="font-size:11px; color:var(--text-gray);"></span>
                    <button type="button" id="btnLogVoice" class="media-btn record" onclick="toggleVoiceRecording('btnLogVoice')">🎤 Record Voice Script</button>
                </div>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveDigitalLog()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Digital Log')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
