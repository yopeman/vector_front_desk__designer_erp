// =============================================
// RECEIVED ORDERS MODULE
// =============================================

// =============================================
// RECEIVED ORDERS DATA
// =============================================

// =============================================
// RENDER RECEIVED ORDERS TABLE
// =============================================
function renderOrdersTable() {
    const tbody = document.getElementById('received-orders-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    ordersData.forEach((order, index) => {
        const isUrgent = order.priority === 'urgent';
        const seqNum = String(index + 1).padStart(2, '0');
        const row = document.createElement('tr');
        row.className = `order-row hover:bg-blue-600/10 transition-colors relative ${isUrgent ? 'bg-rose-500/5' : ''}`;
        row.setAttribute('data-priority', order.priority);
        row.setAttribute('data-index', index);
        row.innerHTML = `
            <td class="p-4 text-center font-mono font-medium ${isUrgent ? 'text-rose-400' : 'text-slate-400'} border-l-4 ${isUrgent ? 'border-rose-500' : 'border-slate-600'}">
                ${seqNum}
            </td>
            <td class="p-4 font-mono">${order.date}</td>
            <td class="p-4">
                <span class="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-medium border border-blue-500/20 capitalize">${order.taskType}</span>
            </td>
            <td class="p-4 font-mono text-slate-400">${order.orderNum}</td>
            <td class="p-4 ${isUrgent ? 'text-rose-300' : 'text-emerald-400'} font-medium">
                <span class="inline-flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'} inline-flex items-center justify-center text-[9px] font-bold shrink-0">${order.designer.charAt(0)}</span>
                    ${order.designer}
                </span>
            </td>
            <td class="p-4 ${isUrgent ? 'font-semibold' : ''}">${order.title}</td>
            <td class="p-4">
                ${isUrgent 
                    ? `<span class="badge-urgent inline-flex items-center gap-1 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
                          <i class="fa-solid fa-exclamation-circle text-[9px]"></i> urgent
                        </span>` 
                    : `<span class="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/60 text-slate-300 rounded-full text-xs font-semibold border border-slate-600/40">
                          <i class="fa-regular fa-circle-check text-[9px] text-emerald-400"></i> normal
                        </span>`
                }
            </td>
            <td class="p-4">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded-lg text-[11px] font-mono border border-slate-700/50">
                    <i class="fa-solid fa-microchip text-[8px] text-slate-500"></i>
                    ${order.machine}
                </span>
            </td>
        `;
        row.addEventListener('click', function() {
            openOrderDetails(index);
        });
        tbody.appendChild(row);
    });

    updateStats();
    updateFilterCount();
}

// =============================================
// UPDATE STATS CARDS
// =============================================
function updateStats() {
    const total = ordersData.length;
    const urgent = ordersData.filter(o => o.priority === 'urgent').length;
    const normal = ordersData.filter(o => o.priority === 'normal').length;

    const totalEl = document.getElementById('stats-total');
    const urgentEl = document.getElementById('stats-urgent');
    const normalEl = document.getElementById('stats-normal');
    
    if (totalEl) totalEl.textContent = total;
    if (urgentEl) urgentEl.textContent = urgent;
    if (normalEl) normalEl.textContent = normal;
}

// =============================================
// UPDATE FILTER COUNT
// =============================================
function updateFilterCount() {
    const filterValue = document.getElementById('priority-filter');
    const searchVal = document.getElementById('order-search');
    const filterCountEl = document.getElementById('filter-count');
    
    if (!filterValue || !searchVal || !filterCountEl) return;
    
    const visibleRows = document.querySelectorAll('.order-row:not(.hidden)');
    filterCountEl.textContent = visibleRows.length;
}

// =============================================
// SEARCH & FILTER ORDERS
// =============================================
function filterOrders() {
    const filterValue = document.getElementById('priority-filter');
    const searchVal = document.getElementById('order-search');
    const noResults = document.getElementById('no-results-state');
    const clearBtn = document.getElementById('search-clear-btn');
    const filterCountEl = document.getElementById('filter-count');
    
    if (!filterValue || !searchVal) return;

    const priority = filterValue.value;
    const search = searchVal.value.toLowerCase();
    const rows = document.querySelectorAll('.order-row');
    
    let visibleCount = 0;

    // Show/hide clear button
    if (search.length > 0) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }

    rows.forEach(row => {
        const rowPriority = row.getAttribute('data-priority');
        const text = row.innerText.toLowerCase();
        
        const matchesPriority = (priority === 'all' || rowPriority === priority);
        const matchesSearch = text.includes(search);
        
        if (matchesPriority && matchesSearch) {
            row.classList.remove('hidden');
            visibleCount++;
        } else {
            row.classList.add('hidden');
        }
    });

    // Show no results state if needed
    if (visibleCount === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
    }

    filterCountEl.textContent = visibleCount;
}

// =============================================
// CLEAR SEARCH
// =============================================
function clearSearch() {
    const searchInput = document.getElementById('order-search');
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    filterOrders();
}

// =============================================
// RESET FILTERS
// =============================================
function resetFilters() {
    const searchInput = document.getElementById('order-search');
    const priorityFilter = document.getElementById('priority-filter');
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (searchInput) searchInput.value = '';
    if (priorityFilter) priorityFilter.value = 'all';
    if (clearBtn) clearBtn.classList.remove('visible');
    filterOrders();
}

// =============================================
// OPEN ORDER MODAL
// =============================================
function openOrderDetails(index) {
    const order = ordersData[index];
    if (!order) return;

    currentOrderIndex = index;
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;
    
    // Populate all fields with order data
    document.getElementById('det-date').value = order.date;
    document.getElementById('det-title').value = `${order.title} (${order.orderNum})`;
    document.getElementById('det-material').value = order.material || 'Premium Acrylic';
    document.getElementById('det-thickness').value = order.thickness || '4mm';
    document.getElementById('det-color').value = order.color || 'Transparent Glossy';
    document.getElementById('det-machine').value = order.machine;
    document.getElementById('det-designer').value = order.designer;
    document.getElementById('det-order-num').value = order.orderNum;

    // Set dimension values using dedicated IDs
    document.getElementById('det-length').value = order.length || '600 mm';
    document.getElementById('det-width').value = order.width || '400 mm';
    document.getElementById('det-height').value = order.height || '12 mm';
    document.getElementById('det-gram').value = order.gram || '150 g';

    // Set priority bar
    const isUrgent = order.priority === 'urgent';
    const priorityBar = document.getElementById('detail-priority-bar');
    const priorityText = document.getElementById('detail-priority-text');

    if (isUrgent) {
        priorityBar.className = 'flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 border-rose-500 bg-rose-500/10 text-sm';
        priorityBar.querySelector('i').className = 'fa-solid fa-circle-exclamation text-rose-400 text-lg';
        priorityText.innerHTML = '<strong class="text-rose-400">URGENT</strong> — This order requires immediate attention and should be prioritized.';
    } else {
        priorityBar.className = 'flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 text-sm';
        priorityBar.querySelector('i').className = 'fa-solid fa-circle-info text-emerald-400 text-lg';
        priorityText.innerHTML = '<strong class="text-emerald-400">NORMAL</strong> — Standard priority order. Process according to normal workflow.';
    }

    // Reset timeline
    document.getElementById('ord-start-time').innerText = "recorded start time";
    document.getElementById('ord-start-time').className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";
    document.getElementById('ord-end-time').innerText = "recorded end time";
    document.getElementById('ord-end-time').className = "text-[11px] text-center font-mono text-slate-400 border border-slate-800 bg-slate-900/80 py-1 rounded-lg";

    // Reset timeline steps
    document.querySelectorAll('#order-detail-modal .timeline-step').forEach(step => {
        step.classList.remove('completed', 'active');
    });
    document.querySelectorAll('#order-detail-modal .timeline-step')[0].classList.add('completed');
    document.getElementById('step-progress-text').innerHTML = 'In Progress';
    document.getElementById('step-completed-text').innerHTML = 'Completed';

    // Open modal
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    
    // Reset modal scroll position
    modal.querySelector('.modal-container').scrollTop = 0;
}

// =============================================
// CLOSE ORDER MODAL
// =============================================
function closeOrderModal(event) {
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;
    
    // If event is passed and target is not the overlay itself, don't close
    if (event && event.target !== modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

// =============================================
// LOG ORDER STATUS TIME
// =============================================
function logOrderStatusTime(mode) {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    
    const stepInProgress = document.getElementById('step-in-progress');
    const stepCompleted = document.getElementById('step-completed');
    
    if(mode === 'start') {
        const startEl = document.getElementById('ord-start-time');
        startEl.innerText = `Started at: ${timestamp}`;
        startEl.className = "text-[11px] text-center font-mono text-amber-400 font-bold border border-amber-500/30 bg-amber-500/10 py-1 rounded-lg shadow";
        
        // Update timeline
        stepInProgress.classList.add('active');
        document.getElementById('step-progress-text').innerHTML = 'In Progress <span class="text-amber-400 font-mono">(' + timestamp + ')</span>';
        
        alert('Order active status triggered. Start time captured.');
    } else if(mode === 'end') {
        const endEl = document.getElementById('ord-end-time');
        endEl.innerText = `Ended at: ${timestamp}`;
        endEl.className = "text-[11px] text-center font-mono text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 py-1 rounded-lg shadow";
        
        // Update timeline
        stepInProgress.classList.remove('active');
        stepInProgress.classList.add('completed');
        stepCompleted.classList.add('completed');
        document.getElementById('step-completed-text').innerHTML = 'Completed <span class="text-emerald-400 font-mono">(' + timestamp + ')</span>';
        
        alert('Order shutdown execution completed. Termination time captured.');
    }
}

// =============================================
// TEXT NOTE MODAL
// =============================================
function openTextNoteModal() {
    const modal = document.getElementById('text-note-modal');
    const editor = document.getElementById('text-note-editor');
    if (!modal || !editor) return;
    
    editor.value = '';
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(() => editor.focus(), 300);
}

function closeTextNoteModal(event) {
    const modal = document.getElementById('text-note-modal');
    if (!modal) return;
    
    if (event && event.target !== modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
}

function saveTextNote() {
    const note = document.getElementById('text-note-editor').value.trim();
    if (!note) {
        alert('Please write a note before saving.');
        return;
    }
    const modal = document.getElementById('text-note-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
    }
    alert('Note saved successfully!');
}

// =============================================
// VOICE RECORDING
// =============================================
let mediaRecorder = null;
let audioChunks = [];
let voiceTimerInterval = null;
let voiceSeconds = 0;

function startVoiceRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported in this browser.');
        return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                const statusEl = document.getElementById('voice-recording-status');
                const statusTextEl = document.getElementById('voice-status-text');
                const timerEl = document.getElementById('voice-timer');
                
                if (statusEl) statusEl.classList.add('hidden');
                if (statusTextEl) statusTextEl.textContent = 'Recording...';
                if (timerEl) timerEl.textContent = '00:00';
                voiceSeconds = 0;
                clearInterval(voiceTimerInterval);
                
                alert('Voice recording saved! (' + Math.round(audioBlob.size / 1024) + ' KB recorded)');
            };
            
            mediaRecorder.start();
            
            // Show recording status
            const statusEl = document.getElementById('voice-recording-status');
            const statusTextEl = document.getElementById('voice-status-text');
            const timerEl = document.getElementById('voice-timer');
            
            if (statusEl) statusEl.classList.remove('hidden');
            if (statusTextEl) statusTextEl.textContent = 'Recording...';
            voiceSeconds = 0;
            if (timerEl) timerEl.textContent = '00:00';
            
            // Start timer
            clearInterval(voiceTimerInterval);
            voiceTimerInterval = setInterval(() => {
                voiceSeconds++;
                const mins = String(Math.floor(voiceSeconds / 60)).padStart(2, '0');
                const secs = String(voiceSeconds % 60).padStart(2, '0');
                if (timerEl) timerEl.textContent = mins + ':' + secs;
            }, 1000);
        })
        .catch(err => {
            alert('Microphone access denied. Please allow microphone permissions.');
        });
}

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}