// Invoices module for invoice operations

function calculateInvoiceTotal() {
    const sub = parseFloat(document.getElementById('inv_subtotal').value) || 0;
    const vat = document.getElementById('inv_vat_toggle').checked ? sub * 0.15 : 0;
    document.getElementById('displayVatAmount').innerText = vat.toLocaleString();
    document.getElementById('displayGrandTotal').innerText = (sub + vat).toLocaleString();
}

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
    const vat = document.getElementById('displayVatAmount').innerText;
    const tot = document.getElementById('displayGrandTotal').innerText;

    const { error } = await window.supabase
        .from('mrk_invoices')
        .insert({
            invoice_date: date,
            invoice_no: no,
            client_name: client,
            reference_no: ref,
            item_service: item,
            subtotal: sub,
            vat_included: vatIncluded,
            company_tin: document.getElementById('inv_tin').value,
            payment_term: document.getElementById('inv_term').value,
            created_by: user.id,
        });

    if (error) { alert("Error saving invoice: " + error.message); return; }

    document.getElementById('invoiceTableBody').innerHTML += `<tr><td>${date}</td><td>${no}</td><td>${client}</td><td>${ref}</td><td>${item}</td><td>${sub} ETB</td><td>${vat} ETB</td><td>${tot} ETB</td></tr>`;
    alert("New invoice has been added to the list!");
    closeAllModals();
}
