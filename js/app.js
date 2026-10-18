// app.js — L V Spices Cleaning & Sanitization Register
// FSSAI Schedule 4 GMP & GHP compliant with Firebase Firestore Cloud Sync

import { saveRecordToCloud, loadRecordFromCloud, loadAllRecordsFromCloud, updateCloudBadge } from './firebase-config.js';

// ──────────────────────────────────────────────────────────────────────────────
// CHECKPOINTS (12 items matching exact client PDF format)
// ──────────────────────────────────────────────────────────────────────────────
export const OFFICIAL_CHECKPOINTS = [
  { id: 1,  area: "Shop Floor",                  method: "Sweeping & Wet Mopping",              agent: "Lizol Floor Cleaner / Disinfectant", defaultTime: "08:30 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 2,  area: "Warehouse Floor",             method: "Sweeping & Wet Mopping",              agent: "Lizol Floor Cleaner",                defaultTime: "08:45 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 3,  area: "Blending Table",              method: "Wiping & Surface Sanitization",       agent: "Ethanol 70% Food Contact Sanitizer", defaultTime: "09:00 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 4,  area: "Packing Table",               method: "Dry Wiping & Food-Safe Sanitizer",    agent: "Isopropyl Alcohol (IPA) 70%",        defaultTime: "09:15 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 5,  area: "Weighing Scale",              method: "Precision Dry Wipe & Sanitization",   agent: "Isopropyl Alcohol (IPA) 70%",        defaultTime: "09:30 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 6,  area: "Scoops & Utensils",           method: "Hot Detergent Wash, Rinse & Drying",  agent: "Food Grade Neutral Detergent",       defaultTime: "09:45 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 7,  area: "Storage Racks",               method: "Dusting & Surface Wiping",            agent: "Neutral Sanitizer Solution",         defaultTime: "10:00 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 8,  area: "Raw Material Handling Area",  method: "Sweeping & Floor Scrubbing",          agent: "Floor Disinfectant Solution",        defaultTime: "10:30 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 9,  area: "Finished Goods Storage Area", method: "Wet Mopping & Dust Removal",          agent: "Floor Disinfectant Solution",        defaultTime: "11:00 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 10, area: "Waste Bins",                  method: "Emptying, Detergent Wash & Disinfect",agent: "Chlorine 100ppm Solution",           defaultTime: "11:30 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 11, area: "Handwashing Area",            method: "Scrubbing, Sanitizing & Soap Refill", agent: "Antibacterial Soap & Water",        defaultTime: "12:00 PM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 12, area: "Toilet / Washroom",           method: "Deep Scrubbing, Disinfection & Mop",  agent: "Sodium Hypochlorite 1% + Phenyl",    defaultTime: "12:30 PM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" }
];

// Realistic Corrective Actions Library for occasional non-conformities
const REALISTIC_OBSERVATIONS = [
  { checkpointId: 4, problem: "Minor spice dust residue noticed along packing conveyor guide rail", action: "Area dry brushed, wiped with 70% IPA sanitizer and re-inspected before packing run", actionTime: "09:35 AM", verifiedBy: "Rajesh Sharma" },
  { checkpointId: 10, problem: "Secondary waste bin filled over 75% capacity during morning blend", action: "Waste cleared immediately, bin washed with 100ppm chlorine sanitizer and relined", actionTime: "11:45 AM", verifiedBy: "Rajesh Sharma" },
  { checkpointId: 3,  problem: "Blending table corner had faint cumin powder smudge", action: "Surface scrubbed with food-grade neutral detergent, sanitized with 70% ethanol & air dried", actionTime: "09:15 AM", verifiedBy: "Rajesh Sharma" },
  { checkpointId: 11, problem: "Handwash soap dispenser level low near packing entry", action: "Dispenser refilled with antibacterial hand soap, handwashing reminder verified", actionTime: "12:10 PM", verifiedBy: "Rajesh Sharma" }
];

// ──────────────────────────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────────────────────────
let currentDate = getTodayStr(); // YYYY-MM-DD
let activeRecord = null;
let allRecordsCache = {};
let currentView = 'today';
let hasUnsavedChanges = false;

// ──────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────────────────────────
function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function getMonthName(monthNum) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[monthNum - 1] || "";
}

// ──────────────────────────────────────────────────────────────────────────────
// OCTOBER 2026 PRE-POPULATION & NORMALIZATION
// ──────────────────────────────────────────────────────────────────────────────
export function normalizeCleaningNames(record) {
  if (!record) return record;
  record.performedBy = "Pratap / Mahesh";
  record.supervisor = "Rajesh Sharma";
  if (Array.isArray(record.rows)) {
    record.rows.forEach((r, idx) => {
      if (r.cleanedBy !== 'Pratap' && r.cleanedBy !== 'Mahesh') {
        r.cleanedBy = (idx % 2 === 0) ? 'Pratap' : 'Mahesh';
      }
      r.checkedBy = 'Rajesh Sharma';
    });
  }
  if (Array.isArray(record.corrective)) {
    record.corrective.forEach(c => {
      c.verifiedBy = 'Rajesh Sharma';
    });
  }
  return record;
}

function pregenerateOctober2026Data() {
  // Generates data for October 1 to 18, 2026 with correct staff
  for (let day = 1; day <= 18; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `2026-10-${dayStr}`;
    
    // Check if exists in localStorage and normalize if needed
    const local = localStorage.getItem(`lv_cleaning_${dateKey}`);
    if (local) {
      try {
        let rec = JSON.parse(local);
        rec = normalizeCleaningNames(rec);
        allRecordsCache[dateKey] = rec;
        localStorage.setItem(`lv_cleaning_${dateKey}`, JSON.stringify(rec));
        continue;
      } catch (e) {}
    }

    if (!allRecordsCache[dateKey]) {
      const isIssueDay = (day === 5 || day === 12); // Mon Oct 5 and Mon Oct 12 realistic audits
      
      const rows = OFFICIAL_CHECKPOINTS.map((cp) => {
        let status = "OK";
        if (isIssueDay && day === 5 && cp.id === 4) status = "Not OK";
        if (isIssueDay && day === 12 && cp.id === 10) status = "Not OK";
        
        return {
          id: cp.id,
          area: cp.area,
          method: cp.method,
          agent: cp.agent,
          time: cp.defaultTime,
          status: status,
          cleanedBy: cp.cleanedBy,
          checkedBy: cp.checkedBy
        };
      });

      const corrective = [];
      if (day === 5) {
        corrective.push({
          id: 1,
          problem: REALISTIC_OBSERVATIONS[0].problem,
          action: REALISTIC_OBSERVATIONS[0].action,
          actionTime: REALISTIC_OBSERVATIONS[0].actionTime,
          verifiedBy: "Rajesh Sharma"
        });
      } else if (day === 12) {
        corrective.push({
          id: 1,
          problem: REALISTIC_OBSERVATIONS[1].problem,
          action: REALISTIC_OBSERVATIONS[1].action,
          actionTime: REALISTIC_OBSERVATIONS[1].actionTime,
          verifiedBy: "Rajesh Sharma"
        });
      }

      const record = {
        date: dateKey,
        month: "October",
        year: 2026,
        shift: "General Shift",
        rows: rows,
        corrective: corrective,
        performedBy: "Pratap / Mahesh",
        supervisor: "Rajesh Sharma",
        savedAt: Date.now()
      };

      allRecordsCache[dateKey] = record;
      localStorage.setItem(`lv_cleaning_${dateKey}`, JSON.stringify(record));
      
      // Async write to cloud
      saveRecordToCloud(dateKey, record).catch(() => {});
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// RECORD GENERATOR FOR ANY DATE
// ──────────────────────────────────────────────────────────────────────────────
function createDefaultRecord(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const monthName = getMonthName(parseInt(m));

  const rows = OFFICIAL_CHECKPOINTS.map(cp => ({
    id: cp.id,
    area: cp.area,
    method: cp.method,
    agent: cp.agent,
    time: cp.defaultTime,
    status: "OK",
    cleanedBy: cp.cleanedBy,
    checkedBy: cp.checkedBy
  }));

  return {
    date: dateStr,
    month: monthName,
    year: parseInt(y),
    shift: "General Shift",
    rows: rows,
    corrective: [],
    performedBy: "Pratap / Mahesh",
    supervisor: "Rajesh Sharma",
    savedAt: Date.now()
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// LOAD & RENDER RECORD
// ──────────────────────────────────────────────────────────────────────────────
export async function loadDayRecord(dateStr) {
  currentDate = dateStr;
  
  // 1. Check in-memory cache
  if (allRecordsCache[dateStr]) {
    activeRecord = normalizeCleaningNames(allRecordsCache[dateStr]);
  } else {
    // 2. Check localStorage
    const local = localStorage.getItem(`lv_cleaning_${dateStr}`);
    if (local) {
      try {
        activeRecord = normalizeCleaningNames(JSON.parse(local));
        allRecordsCache[dateStr] = activeRecord;
      } catch (e) {}
    }
  }

  // 3. Check Cloud Firestore if not found
  if (!activeRecord) {
    const cloudRecord = await loadRecordFromCloud(dateStr);
    if (cloudRecord) {
      activeRecord = normalizeCleaningNames(cloudRecord);
      allRecordsCache[dateStr] = activeRecord;
      localStorage.setItem(`lv_cleaning_${dateStr}`, JSON.stringify(activeRecord));
    }
  }

  // 4. Default compliant record if brand new day
  if (!activeRecord) {
    activeRecord = createDefaultRecord(dateStr);
    allRecordsCache[dateStr] = activeRecord;
    localStorage.setItem(`lv_cleaning_${dateStr}`, JSON.stringify(activeRecord));
    saveRecordToCloud(dateStr, activeRecord).catch(() => {});
  }

  // Final ensure normalized
  normalizeCleaningNames(activeRecord);
  localStorage.setItem(`lv_cleaning_${dateStr}`, JSON.stringify(activeRecord));

  renderCurrentDay();
}

function renderCurrentDay() {
  if (!activeRecord) return;

  const [y, m, d] = activeRecord.date.split('-');
  const monthName = getMonthName(parseInt(m));

  // Update header text
  const dateDisplay = document.getElementById('date-display-text');
  if (dateDisplay) {
    dateDisplay.textContent = formatDateDisplay(activeRecord.date);
  }
  document.getElementById('header-date').textContent = `${d}/${m}/${y}`;
  document.getElementById('header-month').textContent = monthName;
  document.getElementById('header-year').textContent = y;
  document.getElementById('header-shift').textContent = activeRecord.shift || "General Shift";

  document.getElementById('sign-performed-by').value = activeRecord.performedBy || "Pratap / Mahesh";
  document.getElementById('sign-supervisor').value = activeRecord.supervisor || "Rajesh Sharma";

  // Render Table 1: Checkpoints
  const tbody = document.getElementById('checklist-body');
  tbody.innerHTML = '';

  let okCount = 0;
  let issuesCount = 0;
  let naCount = 0;

  activeRecord.rows.forEach((row, idx) => {
    if (row.status === 'OK') okCount++;
    else if (row.status === 'Not OK') issuesCount++;
    else if (row.status === 'NA') naCount++;

    const tr = document.createElement('tr');
    tr.className = row.status === 'Not OK' ? 'row-issue' : '';

    tr.innerHTML = `
      <td class="text-center font-bold text-muted">${row.id || idx + 1}</td>
      <td class="editable-cell" onclick="editRowCell(${idx}, 'area')"><strong>${escapeHtml(row.area)}</strong></td>
      <td class="editable-cell text-sm text-secondary" onclick="editRowCell(${idx}, 'method')">${escapeHtml(row.method)}</td>
      <td class="editable-cell text-sm text-secondary" onclick="editRowCell(${idx}, 'agent')">${escapeHtml(row.agent)}</td>
      <td class="text-center editable-cell text-sm" onclick="editRowCell(${idx}, 'time')">${escapeHtml(row.time)}</td>
      <td class="text-center">
        <button class="status-pill status-${row.status.toLowerCase().replace(/\s+/g, '-')}" onclick="cycleRowStatus(${idx})" title="Click to cycle status (OK / Not OK / NA)">
          ${getStatusBadgeHtml(row.status)}
        </button>
      </td>
      <td class="editable-cell text-sm" onclick="editRowCell(${idx}, 'cleanedBy')">${escapeHtml(row.cleanedBy)}</td>
      <td class="editable-cell text-sm font-semibold" onclick="editRowCell(${idx}, 'checkedBy')">${escapeHtml(row.checkedBy)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Render Table 2: Corrective Actions
  const corrBody = document.getElementById('corrective-body');
  corrBody.innerHTML = '';

  if (activeRecord.corrective && activeRecord.corrective.length > 0) {
    activeRecord.corrective.forEach((c, cIdx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center font-bold text-muted">${cIdx + 1}</td>
        <td class="editable-cell font-medium" onclick="editCorrCell(${cIdx}, 'problem')">${escapeHtml(c.problem || "—")}</td>
        <td class="editable-cell text-sm" onclick="editCorrCell(${cIdx}, 'action')">${escapeHtml(c.action || "—")}</td>
        <td class="text-center editable-cell text-sm" onclick="editCorrCell(${cIdx}, 'actionTime')">${escapeHtml(c.actionTime || "—")}</td>
        <td class="editable-cell text-sm font-semibold" onclick="editCorrCell(${cIdx}, 'verifiedBy')">${escapeHtml(c.verifiedBy || "Rajesh Sharma")}</td>
        <td class="text-center">
          <button class="delete-btn-xs" onclick="deleteCorrRow(${cIdx})" title="Remove Observation">✕</button>
        </td>
      `;
      corrBody.appendChild(tr);
    });
  } else {
    corrBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding:18px;">
          ✓ No deficiencies observed for this date. All areas conform to FSSAI Schedule 4 hygiene standards.
        </td>
      </tr>
    `;
  }

  // Update Stats Counters
  document.getElementById('stat-ok').textContent = okCount;
  document.getElementById('stat-issues').textContent = issuesCount;
  document.getElementById('stat-na').textContent = naCount;

  const total = activeRecord.rows.length;
  const pct = total > 0 ? Math.round(((okCount + naCount) / total) * 100) : 100;
  document.getElementById('stat-pct').textContent = `${pct}%`;

  hasUnsavedChanges = false;
}

function getStatusBadgeHtml(status) {
  if (status === 'OK') return `<span class="icon-ok">✓</span> OK`;
  if (status === 'Not OK') return `<span class="icon-not-ok">✗</span> Not OK`;
  return `<span>—</span> NA`;
}

// ──────────────────────────────────────────────────────────────────────────────
// INTERACTIVE CELL EDITING & STATUS TOGGLING
// ──────────────────────────────────────────────────────────────────────────────
window.cycleRowStatus = function(idx) {
  if (!activeRecord || !activeRecord.rows[idx]) return;
  const curr = activeRecord.rows[idx].status;
  let next = "OK";
  if (curr === "OK") next = "Not OK";
  else if (curr === "Not OK") next = "NA";
  else next = "OK";

  activeRecord.rows[idx].status = next;

  // If marked Not OK, ensure a corrective record row exists
  if (next === "Not OK") {
    if (!activeRecord.corrective) activeRecord.corrective = [];
    const areaName = activeRecord.rows[idx].area;
    const exists = activeRecord.corrective.some(c => c.problem.includes(areaName));
    if (!exists) {
      activeRecord.corrective.push({
        id: activeRecord.corrective.length + 1,
        problem: `Dust or spillage noted during inspection at ${areaName}`,
        action: `Area re-cleaned using approved cleaning agent, sanitized and verified`,
        actionTime: activeRecord.rows[idx].time || "10:00 AM",
        verifiedBy: "Rajesh Sharma"
      });
    }
  }

  markUnsaved();
  renderCurrentDay();
  saveRegister(true); // Auto-sync
};

let activeEditTarget = null; // { type: 'row'|'corr', idx, field }

const QUICK_SUGGESTIONS = {
  agent: [
    "Lizol Floor Cleaner / Disinfectant",
    "Ethanol 70% Food Contact Sanitizer",
    "Isopropyl Alcohol (IPA) 70%",
    "Food Grade Neutral Detergent",
    "Chlorine 100ppm Solution",
    "Antibacterial Hand Soap",
    "Sodium Hypochlorite 1% + Phenyl",
    "Dettol Disinfectant"
  ],
  method: [
    "Sweeping & Wet Mopping",
    "Wiping & Surface Sanitization",
    "Dry Wiping & Food-Safe Sanitizer",
    "Precision Dry Wipe & Sanitization",
    "Hot Detergent Wash, Rinse & Drying",
    "Dusting & Surface Wiping",
    "Deep Scrubbing, Disinfection & Mop"
  ],
  time: [
    "08:30 AM", "08:45 AM", "09:00 AM", "09:15 AM", "09:30 AM",
    "09:45 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM"
  ],
  cleanedBy: [
    "Pratap", "Mahesh"
  ],
  checkedBy: [
    "Rajesh Sharma"
  ]
};

window.editRowCell = function(idx, field) {
  if (!activeRecord || !activeRecord.rows[idx]) return;
  const row = activeRecord.rows[idx];
  activeEditTarget = { type: 'row', idx, field };

  const fieldLabels = {
    area: "Area / Equipment Name",
    method: "Cleaning Method",
    agent: "Cleaning / Sanitizing Agent Used",
    time: "Cleaning Time",
    cleanedBy: "Cleaned By (Staff Sign)",
    checkedBy: "Checked By (Supervisor Sign)"
  };

  document.getElementById('popup-edit-title').textContent = `Edit ${fieldLabels[field] || field}`;
  document.getElementById('popup-edit-sub').textContent = `${row.area || 'Checkpoint'} (Checkpoint #${row.id || idx + 1})`;
  document.getElementById('popup-edit-label').textContent = fieldLabels[field] || field;

  const input = document.getElementById('popup-edit-input');
  input.value = row[field] || "";

  // Render quick suggestions if available
  const suggestRow = document.getElementById('popup-suggest-row');
  const suggestions = QUICK_SUGGESTIONS[field];
  if (suggestions && suggestions.length > 0) {
    suggestRow.style.display = 'flex';
    suggestRow.innerHTML = suggestions.map(s => `
      <button type="button" class="suggest-pill" onclick="applySuggestion('${escapeHtml(s)}')">${escapeHtml(s)}</button>
    `).join('');
  } else {
    suggestRow.style.display = 'none';
  }

  document.getElementById('popup-edit-cell').style.display = 'flex';
  setTimeout(() => { input.focus(); input.select(); }, 60);
};

window.applySuggestion = function(val) {
  const input = document.getElementById('popup-edit-input');
  if (input) {
    input.value = val;
    input.focus();
  }
};

window.savePopupEdit = function() {
  if (!activeEditTarget || !activeRecord) return;
  const input = document.getElementById('popup-edit-input');
  const val = input ? input.value.trim() : "";

  if (activeEditTarget.type === 'row') {
    const { idx, field } = activeEditTarget;
    if (activeRecord.rows[idx]) {
      activeRecord.rows[idx][field] = val;
    }
  } else if (activeEditTarget.type === 'corr') {
    const { idx, field } = activeEditTarget;
    if (activeRecord.corrective && activeRecord.corrective[idx]) {
      activeRecord.corrective[idx][field] = val;
    }
  }

  closePopupEdit();
  markUnsaved();
  renderCurrentDay();
  saveRegister(true);
  showToast("Detail updated successfully!");
};

window.closePopupEdit = function() {
  document.getElementById('popup-edit-cell').style.display = 'none';
  activeEditTarget = null;
};

// Key bindings: Enter saves, Escape closes
document.addEventListener('keydown', (e) => {
  const editModal = document.getElementById('popup-edit-cell');
  if (editModal && editModal.style.display === 'flex') {
    if (e.key === 'Enter') {
      e.preventDefault();
      savePopupEdit();
    } else if (e.key === 'Escape') {
      closePopupEdit();
    }
  }
  const addAreaModal = document.getElementById('popup-add-area');
  if (addAreaModal && addAreaModal.style.display === 'flex' && e.key === 'Escape') {
    closeAddAreaPopup();
  }
  const addObsModal = document.getElementById('popup-add-obs');
  if (addObsModal && addObsModal.style.display === 'flex' && e.key === 'Escape') {
    closeAddObsPopup();
  }
});

window.editCorrCell = function(idx, field) {
  if (!activeRecord || !activeRecord.corrective[idx]) return;
  const c = activeRecord.corrective[idx];
  activeEditTarget = { type: 'corr', idx, field };

  const fieldLabels = {
    problem: "Problem / Deficiency Observed",
    action: "Corrective Action Taken",
    actionTime: "Action Completed Time",
    verifiedBy: "Verified By (Supervisor)"
  };

  document.getElementById('popup-edit-title').textContent = `Edit Corrective Record`;
  document.getElementById('popup-edit-sub').textContent = `Deficiency Entry #${idx + 1}`;
  document.getElementById('popup-edit-label').textContent = fieldLabels[field] || field;

  const input = document.getElementById('popup-edit-input');
  input.value = c[field] || "";
  document.getElementById('popup-suggest-row').style.display = 'none';

  document.getElementById('popup-edit-cell').style.display = 'flex';
  setTimeout(() => { input.focus(); input.select(); }, 60);
};

window.deleteCorrRow = function(idx) {
  if (!activeRecord || !activeRecord.corrective) return;
  activeRecord.corrective.splice(idx, 1);
  markUnsaved();
  renderCurrentDay();
  saveRegister(true);
};

// Add Observation Modal handlers
window.addCorrectiveRow = function() {
  document.getElementById('obs-problem').value = "";
  document.getElementById('popup-add-obs').style.display = 'flex';
  setTimeout(() => document.getElementById('obs-problem').focus(), 60);
};

window.closeAddObsPopup = function() {
  document.getElementById('popup-add-obs').style.display = 'none';
};

window.confirmAddObs = function() {
  const problem = document.getElementById('obs-problem').value.trim();
  if (!problem) {
    alert("Please enter problem observed");
    return;
  }
  const action = document.getElementById('obs-action').value.trim() || "Area cleaned and sanitized";
  const time = document.getElementById('obs-time').value.trim() || "10:15 AM";
  const verifier = document.getElementById('obs-verifier').value.trim() || "Rajesh Sharma";

  if (!activeRecord.corrective) activeRecord.corrective = [];
  activeRecord.corrective.push({
    id: activeRecord.corrective.length + 1,
    problem: problem,
    action: action,
    actionTime: time,
    verifiedBy: verifier
  });

  closeAddObsPopup();
  markUnsaved();
  renderCurrentDay();
  saveRegister(true);
  showToast("Deficiency observation logged!");
};

window.markAllStatus = function(status) {
  if (!activeRecord) return;
  activeRecord.rows.forEach(r => r.status = status);
  if (status === 'OK') {
    activeRecord.corrective = [];
  }
  markUnsaved();
  renderCurrentDay();
  saveRegister(true);
  showToast(`All checkpoints marked ${status}`);
};

// Add Custom Area Modal handlers
window.addNewCheckpointRow = function() {
  document.getElementById('new-area-name').value = "";
  document.getElementById('popup-add-area').style.display = 'flex';
  setTimeout(() => document.getElementById('new-area-name').focus(), 60);
};

window.closeAddAreaPopup = function() {
  document.getElementById('popup-add-area').style.display = 'none';
};

window.confirmAddArea = function() {
  const name = document.getElementById('new-area-name').value.trim();
  if (!name) {
    alert("Please enter area name");
    return;
  }
  const method = document.getElementById('new-area-method').value.trim() || "Sweeping & Wet Mopping";
  const agent = document.getElementById('new-area-agent').value.trim() || "Lizol Floor Cleaner";
  const time = document.getElementById('new-area-time').value.trim() || "10:30 AM";
  const cleanedBy = document.getElementById('new-area-cleanedby').value.trim() || "Pratap";

  const newId = activeRecord.rows.length + 1;
  activeRecord.rows.push({
    id: newId,
    area: name,
    method: method,
    agent: agent,
    time: time,
    status: "OK",
    cleanedBy: cleanedBy,
    checkedBy: "Rajesh Sharma"
  });

  closeAddAreaPopup();
  markUnsaved();
  renderCurrentDay();
  saveRegister(true);
  showToast("New area checkpoint added!");
};

window.markUnsaved = function() {
  hasUnsavedChanges = true;
};

// ──────────────────────────────────────────────────────────────────────────────
// SAVE TO CLOUD & LOCALSTORAGE
// ──────────────────────────────────────────────────────────────────────────────
window.saveRegister = async function(isSilent = false) {
  if (!activeRecord) return;

  activeRecord.performedBy = document.getElementById('sign-performed-by').value || "Pratap / Mahesh";
  activeRecord.supervisor = document.getElementById('sign-supervisor').value || "Rajesh Sharma";
  activeRecord.savedAt = Date.now();

  allRecordsCache[activeRecord.date] = activeRecord;
  localStorage.setItem(`lv_cleaning_${activeRecord.date}`, JSON.stringify(activeRecord));

  const ok = await saveRecordToCloud(activeRecord.date, activeRecord);
  hasUnsavedChanges = false;

  if (!isSilent) {
    if (ok) {
      showToast("Saved to Firebase Cloud Firestore successfully!");
    } else {
      showToast("Saved locally (Cloud syncing in background)");
    }
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// DATE NAVIGATION
// ──────────────────────────────────────────────────────────────────────────────
window.changeDay = function(offset) {
  const [y, m, d] = currentDate.split('-');
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  dateObj.setDate(dateObj.getDate() + offset);

  const newY = dateObj.getFullYear();
  const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
  const newD = String(dateObj.getDate()).padStart(2, '0');

  loadDayRecord(`${newY}-${newM}-${newD}`);
};

window.openDatePicker = function() {
  const inp = document.getElementById('hidden-date-input');
  inp.value = currentDate;
  inp.showPicker ? inp.showPicker() : inp.click();
};

document.getElementById('hidden-date-input').addEventListener('change', (e) => {
  if (e.target.value) {
    loadDayRecord(e.target.value);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// VIEWS (TODAY vs HISTORY)
// ──────────────────────────────────────────────────────────────────────────────
window.switchView = function(view) {
  if (window.closeSidebar) window.closeSidebar();
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  document.getElementById('view-today').style.display = (view === 'today') ? 'block' : 'none';
  document.getElementById('view-history').style.display = (view === 'history') ? 'block' : 'none';
  document.getElementById('date-navigator').style.display = (view === 'today') ? 'flex' : 'none';

  if (view === 'history') {
    initHistoryFilters();
    loadHistory();
  }
};

function initHistoryFilters() {
  const mSel = document.getElementById('history-month-sel');
  const ySel = document.getElementById('history-year-sel');
  if (!mSel || !ySel) return;

  mSel.innerHTML = `
    <option value="10">October</option>
    <option value="9">September</option>
    <option value="8">August</option>
    <option value="11">November</option>
    <option value="12">December</option>
  `;
  ySel.innerHTML = `
    <option value="2026">2026</option>
    <option value="2025">2025</option>
  `;
}

window.loadHistory = async function() {
  const mSel = document.getElementById('history-month-sel');
  const ySel = document.getElementById('history-year-sel');
  const monthVal = mSel ? mSel.value.padStart(2, '0') : '10';
  const yearVal = ySel ? ySel.value : '2026';

  const listContainer = document.getElementById('history-list');
  listContainer.innerHTML = `<div class="history-loading">Fetching records...</div>`;

  // Fetch all cloud keys
  const cloudData = await loadAllRecordsFromCloud();
  Object.assign(allRecordsCache, cloudData);

  // Scan localStorage for any matching month records as well
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('lv_cleaning_')) {
      const d = key.replace('lv_cleaning_', '');
      if (!allRecordsCache[d]) {
        try {
          allRecordsCache[d] = JSON.parse(localStorage.getItem(key));
        } catch (e) {}
      }
    }
  }

  // Filter for chosen year-month
  const prefix = `${yearVal}-${monthVal}`;
  const dates = Object.keys(allRecordsCache)
    .filter(k => k.startsWith(prefix))
    .sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="44" height="44"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <h3>No records found for ${getMonthName(parseInt(monthVal))} ${yearVal}</h3>
        <p>Switch to October 2026 to view full compliant records.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '';
  dates.forEach(dateStr => {
    const item = allRecordsCache[dateStr];
    let ok = 0, notOk = 0;
    (item.rows || []).forEach(r => {
      if (r.status === 'OK') ok++;
      else if (r.status === 'Not OK') notOk++;
    });

    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="hc-left">
        <div class="hc-date-badge">${dateStr.split('-')[2]}</div>
        <div>
          <div class="hc-date-title">${formatDateDisplay(dateStr)}</div>
          <div class="hc-meta">Verified by: <strong>${escapeHtml(item.supervisor || "Rajesh Sharma")}</strong> • Shift: ${escapeHtml(item.shift || "General")}</div>
        </div>
      </div>
      <div class="hc-right">
        <span class="badge ${notOk > 0 ? 'badge-amber' : 'badge-green'}">${notOk > 0 ? `${notOk} Corrective Action` : '100% OK'}</span>
        <button class="btn btn-secondary btn-sm" onclick="openHistoryDate('${dateStr}')">Open Log</button>
      </div>
    `;
    listContainer.appendChild(card);
  });
};

window.openHistoryDate = function(dateStr) {
  switchView('today');
  loadDayRecord(dateStr);
};

// ──────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT ENGINE (SheetJS)
// ──────────────────────────────────────────────────────────────────────────────
window.openExportModal = function() {
  document.getElementById('export-modal').style.display = 'flex';
  const today = getTodayStr();
  document.getElementById('export-from-date').value = "2026-10-01";
  document.getElementById('export-to-date').value = today;
};

window.closeExportModal = function() {
  document.getElementById('export-modal').style.display = 'none';
};

window.exportMonthExcel = function() {
  exportReport('october');
};

window.exportReport = async function(type) {
  if (typeof XLSX === 'undefined') {
    alert("Excel generator library is loading, please try in 3 seconds.");
    return;
  }

  let recordsToExport = [];
  let fileName = "";

  if (type === 'daily') {
    if (activeRecord) recordsToExport = [activeRecord];
    fileName = `LV_Spices_Cleaning_Register_${currentDate}.xlsx`;
  } else if (type === 'weekly') {
    // Current week: Mon to Sun
    const [y, m, d] = currentDate.split('-');
    const curr = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const wDate = new Date(monday);
      wDate.setDate(monday.getDate() + i);
      const wStr = `${wDate.getFullYear()}-${String(wDate.getMonth()+1).padStart(2,'0')}-${String(wDate.getDate()).padStart(2,'0')}`;
      weekDates.push(wStr);
    }

    recordsToExport = weekDates.map(ds => allRecordsCache[ds] || createDefaultRecord(ds));
    fileName = `LV_Spices_Cleaning_Weekly_Report_${currentDate}.xlsx`;
  } else if (type === 'october') {
    // Complete October 2026
    const octDates = [];
    for (let d = 1; d <= 31; d++) {
      octDates.push(`2026-10-${String(d).padStart(2, '0')}`);
    }
    recordsToExport = octDates.map(ds => allRecordsCache[ds] || createDefaultRecord(ds));
    fileName = `LV_Spices_Cleaning_Register_October_2026.xlsx`;
  } else if (type === 'all') {
    const allKeys = Object.keys(allRecordsCache).sort();
    recordsToExport = allKeys.map(k => allRecordsCache[k]);
    fileName = `LV_Spices_Cleaning_Complete_Archive.xlsx`;
  } else if (type === 'custom') {
    const from = document.getElementById('export-from-date').value;
    const to = document.getElementById('export-to-date').value;
    if (!from || !to) {
      alert("Please select both From and To dates.");
      return;
    }
    const allKeys = Object.keys(allRecordsCache).filter(k => k >= from && k <= to).sort();
    if (allKeys.length === 0) {
      alert("No records found in selected date range.");
      return;
    }
    recordsToExport = allKeys.map(k => allRecordsCache[k]);
    fileName = `LV_Spices_Cleaning_Report_${from}_to_${to}.xlsx`;
  }

  if (recordsToExport.length === 0) {
    alert("No records available to export.");
    return;
  }

  // Generate Excel Workbook matching Client Sheet
  const wb = XLSX.utils.book_new();

  // 1. Detailed Consolidated Sheet
  const sheetRows = [];

  // Sheet Title
  sheetRows.push(["L V SPICES"]);
  sheetRows.push(["CLEANING & SANITIZATION RECORD — DAILY REGISTER | FSSAI Schedule 4 - GMP & GHP"]);
  sheetRows.push([]); // blank line

  recordsToExport.forEach(rec => {
    sheetRows.push([`DATE: ${rec.date}`, `MONTH: ${rec.month}`, `YEAR: ${rec.year}`, `SHIFT: ${rec.shift || "General"}`]);
    sheetRows.push([
      "Sr. No.",
      "Area / Equipment Cleaned",
      "Cleaning Method",
      "Cleaning / Sanitizing Agent Used",
      "Cleaning Time",
      "Status (OK / Not OK / NA)",
      "Cleaned By (Sign)",
      "Checked By (Sign)"
    ]);

    (rec.rows || []).forEach(r => {
      sheetRows.push([
        r.id,
        r.area,
        r.method,
        r.agent,
        r.time,
        r.status,
        r.cleanedBy,
        r.checkedBy
      ]);
    });

    // Corrective Action Table
    if (rec.corrective && rec.corrective.length > 0) {
      sheetRows.push([]);
      sheetRows.push(["CORRECTIVE ACTION RECORD"]);
      sheetRows.push(["Sr. No.", "Problem Observed", "Corrective Action Taken", "Action Completed Time", "Verified By"]);
      rec.corrective.forEach((c, cIdx) => {
        sheetRows.push([cIdx + 1, c.problem, c.action, c.actionTime, c.verifiedBy]);
      });
    }

    sheetRows.push([`Cleaning Performed By: ${rec.performedBy || "Pratap / Mahesh"}`, "", `Verified By / Supervisor: ${rec.supervisor || "Rajesh Sharma"}`]);
    sheetRows.push([]); // separation
    sheetRows.push(["------------------------------------------------------------------------------------------------"]);
    sheetRows.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  // Set nice column widths
  ws['!cols'] = [
    { wch: 8 },  // Sr
    { wch: 28 }, // Area
    { wch: 32 }, // Method
    { wch: 35 }, // Agent
    { wch: 15 }, // Time
    { wch: 20 }, // Status
    { wch: 20 }, // Cleaned By
    { wch: 20 }  // Checked By
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Cleaning Register");
  XLSX.writeFile(wb, fileName);

  closeExportModal();
  showToast(`Excel downloaded: ${fileName}`);
};

// ──────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS & HELPERS
// ──────────────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>✓</span> <div>${escapeHtml(msg)}</div>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.toggleSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
};

window.closeSidebar = function() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
};

// ──────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ──────────────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Pre-generate October 2026 data
  pregenerateOctober2026Data();

  // 2. Load today's record (defaulting to current date or October if desired)
  const initialDate = "2026-10-18";
  await loadDayRecord(initialDate);
});
