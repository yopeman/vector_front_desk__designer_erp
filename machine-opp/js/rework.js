// =============================================
// REWORK MODULE
// =============================================

// REWORK DATA
// (initialized in mock-data.js)

// =============================================
// ADD REWORK ENTRY
// =============================================
function addReworkEntry() {
    const title = document.getElementById('rework-title').value;
    const date = document.getElementById('rework-date').value;
    const material = document.getElementById('rework-material').value;
    const thickness = document.getElementById('rework-thickness').value;
    const color = document.getElementById('rework-color').value;
    const machine = document.getElementById('rework-machine').value;
    const length = document.getElementById('rework-length').value;
    const width = document.getElementById('rework-width').value;
    const height = document.getElementById('rework-height').value;
    const gram = document.getElementById('rework-gram').value;
    const reason = document.getElementById('rework-reason').value;

    // Validation
    if (!title || !date || !machine) {
        alert('Please fill in at least Project Title, Date, and Machine Type.');
        return;
    }

    const entry = {
        id: reworkIdCounter++,
        title,
        date,
        material: material || 'N/A',
        thickness: thickness || 'N/A',
        color: color || 'N/A',
        machine,
        length: length || 'N/A',
        width: width || 'N/A',
        height: height || 'N/A',
        gram: gram || 'N/A',
        reason: reason || '',
        status: 'in-progress',
        startTime: null,
        endTime: null
    };

    reworkData.push(entry);
    renderReworkRecords();
    updateReworkStats();
    
    // Clear form
    document.getElementById('rework-title').value = '';
    document.getElementById('rework-date').value = '';
    document.getElementById('rework-material').value = '';
    document.getElementById('rework-thickness').value = '';
    document.getElementById('rework-color').value = '';
    document.getElementById('rework-machine').value = '';
    document.getElementById('rework-length').value = '';
    document.getElementById('rework-width').value = '';
    document.getElementById('rework-height').value = '';
    document.getElementById('rework-gram').value = '';
    document.getElementById('rework-reason').value = '';

    alert('Rework entry added successfully!');
}

// =============================================
// RENDER REWORK RECORDS TABLE
// =============================================
function renderReworkRecords() {
    const tbody = document.getElementById('rework-records-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (reworkData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="p-8 text-center text-slate-500 italic">No rework records yet. Add your first entry above.</td></tr>';
        return;
    }

    reworkData.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = 'order-row hover:bg-blue-600/10 transition-colors';
        row.setAttribute('data-index', index);
        
        const statusBadge = entry.status === 'completed' 
            ? '<span class="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20">Completed</span>'
            : '<span class="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded border border-amber-500/20">In Progress</span>';

        row.innerHTML = `
            <td class="p-4 text-center font-mono font-medium text-slate-400">${String(index + 1).padStart(2, '0')}</td>
            <td class="p-4 font-mono text-xs">${entry.date}</td>
            <td class="p-4 font-medium text-slate-200">${entry.title}</td>
            <td class="p-4 text-xs text-slate-400">${entry.material}</td>
            <td class="p-4 font-mono text-xs">${entry.thickness}</td>
            <td class="p-4 text-xs">${entry.color}</td>
            <td class="p-4 text-xs font-mono">${entry.machine}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-center">
                <button onclick="deleteReworkEntry(${index})" class="text-rose-400 hover:text-rose-300 transition-colors text-xs">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    const filterCountEl = document.getElementById('rework-filter-count');
    if (filterCountEl) filterCountEl.textContent = reworkData.length;
}

// =============================================
// DELETE REWORK ENTRY
// =============================================
function deleteReworkEntry(index) {
    if (confirm('Are you sure you want to delete this rework record?')) {
        reworkData.splice(index, 1);
        renderReworkRecords();
        updateReworkStats();
    }
}

// =============================================
// UPDATE REWORK STATS
// =============================================
function updateReworkStats() {
    const total = reworkData.length;
    const inProgress = reworkData.filter(r => r.status === 'in-progress').length;
    const completed = reworkData.filter(r => r.status === 'completed').length;
    
    // Calculate average time (simplified)
    let avgTime = 0;
    if (completed > 0) {
        const times = reworkData.filter(r => r.startTime && r.endTime).map(r => {
            const start = new Date(r.startTime);
            const end = new Date(r.endTime);
            return (end - start) / 1000 / 60; // minutes
        });
        avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    }

    const totalEl = document.getElementById('rework-stats-total');
    const progressEl = document.getElementById('rework-stats-progress');
    const completedEl = document.getElementById('rework-stats-completed');
    const avgTimeEl = document.getElementById('rework-stats-avgtime');
    
    if (totalEl) totalEl.textContent = total;
    if (progressEl) progressEl.textContent = inProgress;
    if (completedEl) completedEl.textContent = completed;
    if (avgTimeEl) avgTimeEl.textContent = avgTime + 'm';
}

// =============================================
// LOG REWORK STATUS TIME
// =============================================
function logReworkStatusTime(mode) {
    const now = new Date();
    const timestamp = now.toISOString();
    
    const stepInProgress = document.getElementById('rework-step-in-progress');
    const stepCompleted = document.getElementById('rework-step-completed');
    
    if (mode === 'start') {
        // Find the most recent in-progress entry
        const latestEntry = reworkData[reworkData.length - 1];
        if (latestEntry && latestEntry.status === 'in-progress') {
            latestEntry.startTime = timestamp;
        }
        
        const startEl = document.getElementById('rework-start-time');
        const timeString = now.toTimeString().split(' ')[0];
        if (startEl) {
            startEl.innerText = `Started at: ${timeString}`;
            startEl.className = "text-[11px] text-center font-mono text-amber-400 font-bold border border-amber-500/30 bg-amber-500/10 py-1.5 rounded-lg shadow";
        }
        
        // Update timeline
        if (stepInProgress) stepInProgress.classList.add('active');
        const progressText = document.getElementById('rework-step-progress-text');
        if (progressText) {
            progressText.innerHTML = 'In Progress <span class="text-amber-400 font-mono">(' + timeString + ')</span>';
        }
        
        alert('Rework started. Start time captured.');
    } else if (mode === 'end') {
        const latestEntry = reworkData[reworkData.length - 1];
        if (latestEntry && latestEntry.status === 'in-progress') {
            latestEntry.endTime = timestamp;
            latestEntry.status = 'completed';
            renderReworkRecords();
            updateReworkStats();
        }
        
        const endEl = document.getElementById('rework-end-time');
        const timeString = now.toTimeString().split(' ')[0];
        if (endEl) {
            endEl.innerText = `Ended at: ${timeString}`;
            endEl.className = "text-[11px] text-center font-mono text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 py-1.5 rounded-lg shadow";
        }
        
        // Update timeline
        if (stepInProgress) {
            stepInProgress.classList.remove('active');
            stepInProgress.classList.add('completed');
        }
        if (stepCompleted) stepCompleted.classList.add('completed');
        const completedText = document.getElementById('rework-step-completed-text');
        if (completedText) {
            completedText.innerHTML = 'Completed <span class="text-emerald-400 font-mono">(' + timeString + ')</span>';
        }
        
        alert('Rework completed. End time captured.');
    }
}

// =============================================
// FILTER REWORK RECORDS
// =============================================
function filterReworkRecords() {
    const searchVal = document.getElementById('rework-search');
    const rows = document.querySelectorAll('#rework-records-body .order-row');
    const noResults = document.getElementById('rework-no-results');
    const clearBtn = document.getElementById('rework-search-clear');
    const filterCountEl = document.getElementById('rework-filter-count');
    
    if (!searchVal) return;
    
    const search = searchVal.value.toLowerCase();
    let visibleCount = 0;

    if (search.length > 0) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(search)) {
            row.classList.remove('hidden');
            visibleCount++;
        } else {
            row.classList.add('hidden');
        }
    });

    if (visibleCount === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }

    if (filterCountEl) filterCountEl.textContent = visibleCount;
}

function clearReworkSearch() {
    const searchInput = document.getElementById('rework-search');
    const clearBtn = document.getElementById('rework-search-clear');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    filterReworkRecords();
}

function resetReworkFilters() {
    clearReworkSearch();
}