// Clients module for client registry operations

async function saveClient() {
    const user = await getCurrentUser();
    if (!user) { alert("Please sign in first."); return; }

    const date = document.getElementById('cli_date').value;
    const name = document.getElementById('cli_name').value;
    const type = document.getElementById('cli_type').value;
    const sector = document.getElementById('cli_sector').value;
    const tin = document.getElementById('cli_tin').value;
    const disc = document.getElementById('cli_discovery').value;

    const { error } = await window.supabase
        .from('mrk_clients')
        .insert({
            client_date: date,
            client_name: name,
            client_type: type,
            business_sector: sector,
            tin_number: tin,
            discovery: disc,
            created_by: user.id,
        });

    if (error) { alert("Error saving client: " + error.message); return; }

    document.getElementById('clientTableBody').innerHTML += `<tr><td>${date}</td><td>${name}</td><td>${type}</td><td>${sector}</td><td>${tin}</td><td>Addis Ababa</td><td>${disc}</td><td>premium</td></tr>`;
    alert("Client has been registered successfully!");
    closeAllModals();
}
