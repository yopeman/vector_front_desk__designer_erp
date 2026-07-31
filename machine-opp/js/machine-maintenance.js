// =============================================
// MACHINE MAINTENANCE CHECKLISTS MODULE
// =============================================

// Machine checklist data
const machineData = {
    cnc: {
        name: "CNC Machine",
        daily: ["Clean dust and debris from the machine bed and work area", "Inspect spindle collet and tool holder for wear or dirt", "Check tool bits for sharpness (replace if needed)", "Verify proper air pressure (if pneumatic system is used)", "Inspect vacuum system or dust collector for blockages (if mounted)", "Check emergency stop and safety switches are working", "Lubricate moving parts if required (per manufacturer guidelines)"],
        weekly: ["Inspect spindle for unusual noise or vibration", "Check and tighten loose bolts, screws, or connections", "Inspect belts and pulleys for wear or misalignment", "Clean linear rails and ball screws; apply lubricant if needed", "Check coolant or lubrication levels (if applicable)", "Test machine homing and limit switches", "Inspect dust extraction hoses for leaks (if applicable)"],
        monthly: ["Check spindle runout and alignment", "Inspect motor couplings for looseness", "Clean electrical cabinet filters and fans", "Verify software/controller settings backup", "Check grounding and wiring connections", "Inspect tool changer (if equipped) for smooth operation", "Run a test job to ensure accuracy and repeatability"]
    },
    co2: {
        name: "CO2 Machine",
        daily: ["Check water chiller (temperature, water level, no bubbles, no leaks)", "Inspect water hoses for kinks, leaks, or blockages", "Clean mirrors and focusing lens with lens cleaner and lint-free swabs", "Verify air assist flow is strong and stable", "Check ventilation/exhaust system is working properly", "Remove dust/debris from work area", "Power on machine and confirm laser fires properly at low power test"],
        weekly: ["Inspect laser tube for cracks, condensation, or discoloration", "Check mirror alignment using tape test on all three mirrors", "Clean fan filters and dust from electronics cabinet", "Check belt tension (X & Y axis) and adjust if loose", "Inspect rails and bearings for dirt or wear", "Apply light lubricant to linear guides/rails (if manufacturer allows)", "Test emergency stop button and safety switches"],
        monthly: ["Check spindle runout and alignment", "Inspect motor couplings for looseness", "Clean electrical cabinet filters and fans", "Verify software/controller settings backup", "Check grounding and wiring connections", "Inspect tool changer (if equipped) for smooth operation", "Run a test job to ensure accuracy and repeatability"]
    },
    'fiber-cut': {
        name: "Fiber Cutting Machine",
        daily: ["Check power-on self-test — Ensure system initializes without error codes", "Clean lens and protective window — Use lens wipes or alcohol swabs; avoid fingerprints", "Inspect nozzle and cutting head — Remove dross or debris; check for damage", "Check focus lens alignment — Verify focus height is calibrated", "Check assist gas (O2/N2) pressure — Maintain within recommended levels", "Verify water chiller temperature — Keep between 20–25°C", "Drain water filter or separator — Remove condensed moisture", "Clean worktable and cutting bed — Remove slag and metal pieces", "Inspect fiber cable — Ensure no sharp bends or mechanical stress", "Test emergency stop button — Confirm it cuts power immediately"],
        weekly: ["Inspect air filters — Clean or replace if clogged", "Check lens alignment (optical path) — Verify beam center using alignment paper", "Lubricate linear guides and bearings — Use light machine oil or grease", "Tighten screws and connections — Especially around head, nozzle, and gantry", "Inspect exhaust and ventilation system — Remove dust or metal powder buildup", "Clean sensors (Z-axis/focus sensor) — Use dry air or soft cloth"],
        monthly: ["Check cooling water quality — Replace with deionized or distilled water", "Inspect water chiller filters — Clean or replace", "Inspect servo motor & belts — Check for wear or abnormal noise", "Check grounding and electrical terminals — Tighten and ensure good connection", "Update controller firmware (if needed) — Consult manufacturer before update", "Inspect laser protective glass — Replace if discolored or cracked"]
    },
    uv: {
        name: "UV Machine",
        daily: ["Power on printer and run nozzle check before printing", "Clean printhead surface with recommended cleaning solution", "Wipe capping station and wiper blade to remove ink buildup", "Shake UV ink bottles gently to prevent pigment settling", "Check ink levels and refill/replace if low", "Inspect UV lamp/LED curing unit for functionality", "Clean platen and work area from dust, ink, or debris"],
        weekly: ["Perform full printhead cleaning cycle", "Check ink lines and dampers for air bubbles or leaks", "Clean encoder strip and encoder wheel carefully", "Check and clean ventilation fans and filters", "Inspect carriage movement for smooth operation", "Run nozzle alignment test and adjust if needed"],
        monthly: ["Deep clean printhead and flush with cleaning solution (if required)", "Inspect capping station seals for wear or cracks", "Replace wiper blade if worn or damaged", "Check UV lamp/LED curing hours and replace if near end of life", "Verify RIP software and firmware are up to date", "Clean ink waste tank and reset waste counter if necessary"]
    },
    '3d-print': {
        name: "3D Printing Machine",
        daily: ["Check bed level and nozzle height before printing", "Clean print bed surface and remove any residue or filament", "Inspect filament spool for tangles or moisture", "Run nozzle purge before each print", "Check for proper first layer adhesion", "Wipe rails and rods to remove dust or filament debris"],
        weekly: ["Perform nozzle cleaning with needle or cleaning filament", "Inspect and clean the extruder gear teeth", "Check all belts for tension and signs of wear", "Clean cooling fans and ventilation openings", "Verify proper lubrication of linear rods or lead screws", "Inspect all wiring for loose or frayed connections"],
        monthly: ["Deep clean nozzle (cold pull or disassembly if needed)", "Calibrate bed leveling and nozzle offset manually", "Check and tighten all frame screws and bolts", "Inspect PTFE tubes for wear or blockage", "Clean build surface thoroughly or replace if worn", "Update firmware and slicer software if needed"]
    },
    'fiber-mark': {
        name: "Fiber Marking Machine",
        daily: ["Power on self-test execution validation", "Clean f-theta scan lens using optical wipes", "Verify workspace alignment laser works", "Clean structural external frame bed area"],
        weekly: ["Check electrical power plug connections stability", "Inspect software focus heights metrics verification"],
        monthly: ["Complete general backup calibrations profiling parameters log"]
    }
};

// Track current machine and checklist states
let currentMachine = 'cnc';
const checklistStates = { daily: {}, weekly: {}, monthly: {} };

// =============================================
// SWITCH MACHINE TAB
// =============================================
function switchMachine(key) {
    // Update tab button styles
    document.querySelectorAll('.machine-tab-btn').forEach(btn => {
        btn.className = "machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700/60 hover:scale-105";
    });
    const activeBtn = document.getElementById(`machinetab-${key}`);
    if (activeBtn) {
        activeBtn.className = "machine-tab-btn group relative px-4 py-3 rounded-xl text-sm font-medium transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105";
    }

    currentMachine = key;
    const data = machineData[key];
    const container = document.getElementById('checklist-container');
    if (!container || !data) return;
    
    container.innerHTML = '';

    // Update timestamp
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }

    // Reset checklist states for new machine
    checklistStates.daily = {};
    checklistStates.weekly = {};
    checklistStates.monthly = {};

    ['daily', 'weekly', 'monthly'].forEach(period => {
        const isDaily = period === 'daily';
        const isWeekly = period === 'weekly';
        const colorScheme = isDaily ? 'blue' : isWeekly ? 'amber' : 'purple';
        
        let checkItemsHtml = '';
        if(data[period] && data[period].length > 0) {
            data[period].forEach((item, idx) => {
                checklistStates[period][idx] = false;
                checkItemsHtml += `
                    <label class="checklist-item flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-900/80 cursor-pointer transition-all group border border-transparent hover:border-slate-700/50" data-period="${period}" data-index="${idx}">
                        <div class="relative mt-0.5">
                            <input type="checkbox" class="checklist-checkbox peer sr-only" onchange="updateProgress('${period}', ${idx}, this.checked)">
                            <div class="w-5 h-5 rounded-md border-2 border-slate-600 peer-checked:border-${colorScheme}-500 peer-checked:bg-${colorScheme}-500 transition-all flex items-center justify-center group-hover:border-${colorScheme}-400">
                                <i class="fa-solid fa-check text-[10px] text-white opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                            </div>
                        </div>
                        <span class="text-xs text-slate-300 group-hover:text-slate-100 transition-colors leading-relaxed flex-1">${item}</span>
                    </label>
                `;
            });
        } else {
            checkItemsHtml = `<p class="text-xs text-slate-500 italic p-4 text-center">No items listed for this period.</p>`;
        }

        const icon = isDaily ? 'fa-calendar-day' : isWeekly ? 'fa-calendar-week' : 'fa-calendar';
        const gradientFrom = isDaily ? 'from-blue-500' : isWeekly ? 'from-amber-500' : 'from-purple-500';
        const gradientTo = isDaily ? 'to-blue-600' : isWeekly ? 'to-amber-600' : 'to-purple-600';
        const shadowColor = isDaily ? 'shadow-blue-500/20' : isWeekly ? 'shadow-amber-500/20' : 'shadow-purple-500/20';
        const borderColor = isDaily ? 'border-blue-500/20' : isWeekly ? 'border-amber-500/20' : 'border-purple-500/20';
        const bgColor = isDaily ? 'bg-blue-500/5' : isWeekly ? 'bg-amber-500/5' : 'bg-purple-500/5';
        const textColor = isDaily ? 'text-blue-400' : isWeekly ? 'text-amber-400' : 'text-purple-400';
        const hoverBg = isDaily ? 'hover:bg-blue-600' : isWeekly ? 'hover:bg-amber-600' : 'hover:bg-purple-600';
        const borderBtn = isDaily ? 'border-blue-500/20' : isWeekly ? 'border-amber-500/20' : 'border-purple-500/20';

        container.innerHTML += `
            <div class="checklist-card bg-slate-800/40 ${borderColor} rounded-2xl p-5 flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 border">
                <div class="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center">
                            <i class="fa-solid ${icon} ${textColor} text-sm"></i>
                        </div>
                        <h3 class="text-sm font-bold uppercase tracking-wider ${textColor}">${period} Checklist</h3>
                    </div>
                    <span class="text-[10px] uppercase px-2.5 py-1 rounded-lg font-bold ${bgColor} ${textColor} border ${borderColor}">${data.name}</span>
                </div>
                
                <div class="space-y-2 flex-1 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    ${checkItemsHtml}
                </div>

                <div class="mt-4 pt-4 border-t border-slate-700/40 space-y-3">
                    <div class="flex items-center justify-between text-xs">
                        <span class="text-slate-400 font-medium">Progress</span>
                        <span class="font-mono font-bold ${textColor} period-progress-text">0%</span>
                    </div>
                    <div class="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden">
                        <div class="period-progress-bar h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full transition-all duration-500 ${shadowColor}" style="width: 0%"></div>
                    </div>
                    <button onclick="submitChecklist('${period}')" class="w-full ${bgColor} ${hoverBg} ${textColor} hover:text-white font-bold text-xs py-3 rounded-xl transition-all border ${borderBtn} flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                        <i class="fa-solid fa-paper-plane text-[10px]"></i>
                        Submit ${period.charAt(0).toUpperCase() + period.slice(1)} Checklist
                    </button>
                </div>
            </div>
        `;
    });

    // Initialize progress
    updateOverallProgress();
}

// =============================================
// UPDATE PROGRESS
// =============================================
function updateProgress(period, index, checked) {
    checklistStates[period][index] = checked;
    updateOverallProgress();
}

// =============================================
// UPDATE OVERALL PROGRESS
// =============================================
function updateOverallProgress() {
    const periods = ['daily', 'weekly', 'monthly'];
    let totalItems = 0;
    let checkedItems = 0;
    const periodStats = {};

    periods.forEach(period => {
        const periodData = machineData[currentMachine][period];
        const periodTotal = periodData ? periodData.length : 0;
        const periodChecked = Object.values(checklistStates[period]).filter(Boolean).length;
        
        totalItems += periodTotal;
        checkedItems += periodChecked;
        periodStats[period] = periodTotal > 0 ? Math.round((periodChecked / periodTotal) * 100) : 0;
    });

    const overallPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // Update overall progress bar
    const overallProgressBar = document.getElementById('overall-progress-bar');
    const overallProgressText = document.getElementById('overall-progress-text');
    if (overallProgressBar) overallProgressBar.style.width = overallPercent + '%';
    if (overallProgressText) overallProgressText.textContent = overallPercent + '% Complete';

    // Update individual period progress
    const dailyProgress = document.getElementById('daily-progress');
    const weeklyProgress = document.getElementById('weekly-progress');
    const monthlyProgress = document.getElementById('monthly-progress');
    
    if (dailyProgress) dailyProgress.textContent = periodStats.daily + '%';
    if (weeklyProgress) weeklyProgress.textContent = periodStats.weekly + '%';
    if (monthlyProgress) monthlyProgress.textContent = periodStats.monthly + '%';

    // Update period cards progress bars
    document.querySelectorAll('.checklist-card').forEach((card, index) => {
        const period = periods[index];
        const progressBar = card.querySelector('.period-progress-bar');
        const progressText = card.querySelector('.period-progress-text');
        if (progressBar && progressText) {
            progressBar.style.width = periodStats[period] + '%';
            progressText.textContent = periodStats[period] + '%';
        }
    });
}

// =============================================
// SUBMIT CHECKLIST
// =============================================
function submitChecklist(period) {
    const periodData = machineData[currentMachine][period];
    const totalItems = periodData ? periodData.length : 0;
    const checkedItems = Object.values(checklistStates[period]).filter(Boolean).length;
    
    if (checkedItems === 0) {
        alert(`Please complete at least one item in the ${period} checklist before submitting.`);
        return;
    }

    if (checkedItems < totalItems) {
        const confirmSubmit = confirm(`You have completed ${checkedItems} out of ${totalItems} items. Do you want to submit anyway?`);
        if (!confirmSubmit) return;
    }

    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
    });

    alert(`${period.toUpperCase()} checklist submitted successfully!\n\nMachine: ${machineData[currentMachine].name}\nCompleted: ${checkedItems}/${totalItems} items\nTime: ${timestamp}\nOperator: Admin User`);
    
    // Reset checkboxes for this period
    Object.keys(checklistStates[period]).forEach(idx => {
        checklistStates[period][idx] = false;
    });
    
    // Uncheck all checkboxes in this period
    document.querySelectorAll(`.checklist-item[data-period="${period}"] .checklist-checkbox`).forEach(cb => {
        cb.checked = false;
    });
    
    updateOverallProgress();
}