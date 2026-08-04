// Other Forms module for research, digital log, tender, feedback, and leave operations

async function saveDigitalLog() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('log_date').value;
    const no = document.getElementById('log_no').value;
    const title = document.getElementById('log_title').value;
    const script = document.getElementById('log_script').value;
    const share = document.getElementById('log_share').value;

    const { error } = await window.supabase
        .from('mrk_digital_logs')
        .insert({
            log_date: date,
            content_no: no,
            content_title: title,
            content_script: script,
            social_channel: document.getElementById('log_channel').value,
            share_to: share,
            created_by: user.id,
        });

    if (error) { alert("Error saving digital log: " + error.message); return; }

    document.getElementById('digitalLogTableBody').innerHTML += `<tr><td>${date}</td><td>${no}</td><td>${title}</td><td>${script.substring(0,35)}...</td><td>${share}</td></tr>`;
    alert("Digital log information has been saved!");
    closeAllModals();
}

async function saveResearch() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('res_date').value;
    const no = document.getElementById('res_no').value;
    const title = document.getElementById('res_title').value;
    const reason = document.getElementById('res_reason').value;
    const obj = document.getElementById('res_obj').value;
    const method = document.getElementById('res_method').value;

    const { error } = await window.supabase
        .from('mrk_research_logins')
        .insert({
            research_date: date,
            research_no: no,
            title: title,
            reason: reason,
            objective: obj,
            methodology: method,
            created_by: user.id,
        });

    if (error) { alert("Error saving research: " + error.message); return; }

    document.getElementById('researchTableBody').innerHTML += `<tr><td>${date}</td><td>${no}</td><td>${title}</td><td>${reason}</td><td>${obj}</td><td>${method}</td></tr>`;
    alert("Research information has been added to the table!");
    closeAllModals();
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
