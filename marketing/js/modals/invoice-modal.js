// Invoice Modal
export const invoiceModal = `
<div id="formModal-invoice" class="modal-overlay">
    <div class="modal-body">
        <button class="close-btn" onclick="closeAllModals()">&times;</button>
        <div class="form-title">Invoice Form</div>
        <form>
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" id="inv_date" class="input-field" value="2026-06-09"></div>
                <div class="form-group"><label>Invoice Number</label><input type="text" id="inv_no" class="input-field" value="INV-201"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Client Name</label><input type="text" id="inv_client" class="input-field" value="Abyssinia Hotel"></div>
                <div class="form-group"><label>Reference Number</label><input type="text" id="inv_ref" class="input-field" value="REF-990"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Item / Service Type (Text)</label><input type="text" id="inv_item" class="input-field" value="Marketing & Software ERP Integration Service"></div>
                <div class="form-group"><label>Subtotal Amount (Excl. VAT)</label><input type="number" id="inv_subtotal" class="input-field" oninput="calculateInvoiceTotal()" value="10000"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Company TIN Number</label><input type="text" id="inv_tin" class="input-field" value="0043128954"></div>
                <div class="form-group"><label>Payment Term</label><input type="text" id="inv_term" class="input-field" value="Bank Transfer / 100% Advanced"></div>
            </div>

            <div class="form-group" style="margin-top:10px;">
                <label style="cursor:pointer; color:var(--success); font-weight:600;">
                    <input type="checkbox" id="inv_vat_toggle" checked onchange="calculateInvoiceTotal()" style="width:18px; height:18px; vertical-align:middle; margin-right:8px;">
                    🟦 Include 15% VAT
                </label>
            </div>
            
            <div style="background:var(--input-bg); padding:15px; border-radius:8px; margin-top:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>VAT Amount (15%):</span><span id="displayVatAmount">1,500</span> ETB</div>
                <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--warning);"><span>GRAND TOTAL:</span><span id="displayGrandTotal">11,500</span> ETB</div>
            </div>

            <div class="media-box">
                <div>
                    <button type="button" class="media-btn file-btn" onclick="document.getElementById('inv_file').click()">📎 Attach Stamp/Signature</button>
                    <input type="file" id="inv_file" style="display:none;" onchange="handleFileSelect(event)">
                    <span id="inv_file_lbl" style="font-size:11px; color:var(--text-gray);"></span>
                    <button type="button" id="btnInvVoice" class="media-btn record" onclick="toggleVoiceRecording('btnInvVoice')">🎤 Voice Note</button>
                </div>
            </div>

            <div class="flex-buttons">
                <button type="button" class="action-trigger btn-register" onclick="saveInvoice()">Save</button>
                <button type="button" class="action-trigger btn-pdf" onclick="downloadFormPDF('Invoice')">Download PDF</button>
            </div>
        </form>
    </div>
</div>
`;
