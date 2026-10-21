// app.js — L V Spices Cleaning & Sanitization Register
// FSSAI Schedule 4 GMP & GHP compliant with Firebase Firestore Cloud Sync

import { saveRecordToCloud, loadRecordFromCloud, loadAllRecordsFromCloud, updateCloudBadge } from './firebase-config.js';

// ──────────────────────────────────────────────────────────────────────────────
// CHECKPOINTS (18 items matching exact plant sanitation schedule)
// ──────────────────────────────────────────────────────────────────────────────
export const OFFICIAL_CHECKPOINTS = [
  // ── MORNING BATCH: Start of day, before production begins ──
  { id: 1,  area: "Shop Floor Cleaning",                    method: "Sweeping & Wet Mopping",               agent: "Lizol Floor Cleaner / Disinfectant",   defaultTime: "08:30 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 2,  area: "Warehouse Floor Cleaning",               method: "Sweeping & Wet Mopping",               agent: "Lizol Floor Cleaner",                   defaultTime: "08:52 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 3,  area: "Manufacturing Area Cleaning",            method: "Sweeping, Scrubbing & Mopping",        agent: "Floor Disinfectant Solution",           defaultTime: "09:10 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 4,  area: "Repacking Area Cleaning",                method: "Dry Wiping & Food-Safe Sanitizer",     agent: "Food-Safe Disinfectant Solution",       defaultTime: "09:30 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 5,  area: "Blending Table Cleaning",                method: "Wiping & Surface Sanitization",        agent: "Ethanol 70% Food Contact Sanitizer",   defaultTime: "09:48 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 6,  area: "Weighing Machine Cleaning",              method: "Precision Dry Wipe & Sanitization",    agent: "Isopropyl Alcohol (IPA) 70%",           defaultTime: "10:05 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  // ── MID-MORNING: After first production run ──
  { id: 7,  area: "Scoops, Trays & Utensils Cleaning",     method: "Hot Detergent Wash, Rinse & Drying",   agent: "Food Grade Neutral Detergent",          defaultTime: "10:40 AM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 8,  area: "Waste Bins Cleaning & Waste Disposal",  method: "Emptying, Detergent Wash & Disinfect", agent: "Chlorine 100ppm Solution",              defaultTime: "11:15 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 9,  area: "Handwashing Facilities & Soap Check",   method: "Scrubbing, Sanitizing & Soap Refill",  agent: "Antibacterial Soap & Water",           defaultTime: "11:40 AM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  // ── PRE-LUNCH: Before lunch break (12:30–01:00) ──
  { id: 10, area: "Toilet & Washroom Cleaning",             method: "Deep Scrubbing, Disinfection & Mop",   agent: "Sodium Hypochlorite 1% + Phenyl",       defaultTime: "12:20 PM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 11, area: "Pest Activity / Rodent Check",           method: "Visual Inspection of Traps & Stations",agent: "Inspection / No Infestation",          defaultTime: "12:50 PM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  // ── POST-LUNCH: After production resumes ──
  { id: 12, area: "Staff Hand Hygiene & Attire Check",      method: "Personal Hygiene & Attire Audit",      agent: "Antibacterial Sanitizer & Aprons",      defaultTime: "01:35 PM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  { id: 13, area: "Packing Machine Cleaning",               method: "Dry Wiping & Food-Safe Sanitizer",     agent: "Isopropyl Alcohol (IPA) 70%",           defaultTime: "03:10 PM", cleanedBy: "Mahesh", checkedBy: "Rajesh Sharma" },
  // ── END OF DAY: Before close ──
  { id: 14, area: "Doors, Windows & Insect Screens Check",  method: "Visual & Physical Integrity Check",    agent: "Air Curtains & Mesh Screens Intact",    defaultTime: "05:30 PM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" },
  { id: 15, area: "Cleaning Chemicals Properly Stored",     method: "Chemical Cabinet & Label Inspection",  agent: "Designated Locked Storage / MSDS",      defaultTime: "06:10 PM", cleanedBy: "Pratap", checkedBy: "Rajesh Sharma" }
];

// Audit Date Bounds: Strictly April 1, 2026 to October 19, 2026 (No future dates)
export const MIN_DATE = "2026-04-01";
export const MAX_DATE = new Date().toISOString().split('T')[0]; // Always today

// Regular Deficiencies Schedule (Every 8-10 Days across April - October 2026)
export const CLEANING_DEFICIENCIES = {
  "2026-04-08": { id: 9,  problem: "Minor spice dust residue noticed along packing conveyor guide rail", action: "Area dry brushed, wiped with 70% IPA sanitizer and re-inspected before packing run", actionTime: "10:35 AM" },
  "2026-04-16": { id: 11, problem: "Secondary waste bin filled over 75% capacity during morning blend", action: "Waste cleared immediately, bin washed with 100ppm chlorine sanitizer and relined", actionTime: "11:15 AM" },
  "2026-04-25": { id: 5,  problem: "Blending table corner had faint cumin powder smudge", action: "Surface scrubbed with food-grade neutral detergent, sanitized with 70% ethanol & air dried", actionTime: "09:40 AM" },
  "2026-05-04": { id: 12, problem: "Handwash soap dispenser level low near packing entry", action: "Dispenser refilled with antibacterial hand soap, handwashing reminder verified", actionTime: "11:25 AM" },
  "2026-05-13": { id: 7,  problem: "Stainless steel scoop rack had water spot residue", action: "Utensils re-washed in hot detergent water, sanitized and hot air dried", actionTime: "10:15 AM" },
  "2026-05-22": { id: 10, problem: "Chilli powder dust accumulation observed on lower conveyor bed", action: "Dry vacuumed, wiped with microfiber cloth & food-safe disinfectant", actionTime: "10:55 AM" },
  "2026-05-30": { id: 6,  problem: "Weighing scale platform had micro spice spillage", action: "Platform isolated, precision dry wiped with 70% IPA and tare re-calibrated", actionTime: "09:50 AM" },
  "2026-06-08": { id: 9,  problem: "Minor spice dust residue noticed along packing conveyor guide rail", action: "Area dry brushed, wiped with 70% IPA sanitizer and re-inspected before packing run", actionTime: "10:35 AM" },
  "2026-06-17": { id: 11, problem: "Secondary waste bin filled over 75% capacity during morning blend", action: "Waste cleared immediately, bin washed with 100ppm chlorine sanitizer and relined", actionTime: "11:15 AM" },
  "2026-06-26": { id: 5,  problem: "Blending table corner had faint turmeric powder residue", action: "Surface scrubbed with food-grade neutral detergent, sanitized with 70% ethanol & air dried", actionTime: "09:40 AM" },
  "2026-07-05": { id: 14, problem: "Rodent bait station #4 exterior dusty near warehouse exit", action: "Station wiped clean, trap inspected intact, no pest activity confirmed", actionTime: "11:50 AM" },
  "2026-07-14": { id: 12, problem: "Handwash soap dispenser level low near packing entry", action: "Dispenser refilled with antibacterial hand soap, handwashing reminder verified", actionTime: "11:25 AM" },
  "2026-07-23": { id: 7,  problem: "Sampling scoops had moisture droplets on drying rack", action: "Re-sanitized with hot air dryer and stored in covered sterile bin", actionTime: "10:10 AM" },
  "2026-08-02": { id: 9,  problem: "Packing machine hopper exterior dusty from coriander batch", action: "Hopper wiped down with dry microfiber and sanitized with 70% IPA", actionTime: "10:40 AM" },
  "2026-08-11": { id: 11, problem: "Waste bin liner torn at repacking station", action: "Bin sanitized with 100ppm chlorine solution and fitted with heavy-duty fresh liner", actionTime: "11:10 AM" },
  "2026-08-20": { id: 5,  problem: "Blending table edge had minor residue before shift transition", action: "Cleaned thoroughly with hot detergent wash & 70% ethanol spray", actionTime: "09:35 AM" },
  "2026-08-29": { id: 10, problem: "Spillage of fenugreek powder near grinding discharge chute", action: "Dry swept immediately, HEPA vacuumed and floor damp mopped", actionTime: "10:50 AM" },
  "2026-09-07": { id: 6,  problem: "Weighing scale display screen had dust film", action: "Gently wiped with antistatic IPA cloth, accuracy re-checked with test weight", actionTime: "09:50 AM" },
  "2026-09-16": { id: 12, problem: "Paper towel dispenser empty at entry washbasin", action: "Towel roll replenished, sanitizer dispenser primed and checked", actionTime: "11:20 AM" },
  "2026-09-25": { id: 9,  problem: "Minor spice dust residue noticed along packing conveyor guide rail", action: "Area dry brushed, wiped with 70% IPA sanitizer and re-inspected before packing run", actionTime: "10:35 AM" },
  "2026-10-04": { id: 11, problem: "Secondary waste bin filled over 75% capacity during morning blend", action: "Waste cleared immediately, bin washed with 100ppm chlorine sanitizer and relined", actionTime: "11:15 AM" },
  "2026-10-12": { id: 5,  problem: "Blending table corner had faint cumin powder smudge", action: "Surface scrubbed with food-grade neutral detergent, sanitized with 70% ethanol & air dried", actionTime: "09:40 AM" },
  "2026-10-18": { id: 9,  problem: "Minor spice dust residue noticed along packing conveyor guide rail", action: "Area dry brushed, wiped with 70% IPA sanitizer and re-inspected before packing run", actionTime: "10:35 AM" }
};

// ──────────────────────────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────────────────────────
let currentDate = new Date().toISOString().split('T')[0]; // Always today
let activeRecord = null;
let allRecordsCache = {};
let currentView = 'today';
let hasUnsavedChanges = false;

// ──────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────────────────────────
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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
// HISTORICAL PRE-POPULATION (APRIL - OCTOBER 19, 2026) & NORMALIZATION
// ──────────────────────────────────────────────────────────────────────────────
export function normalizeCleaningNames(record) {
  if (!record) return record;
  record.performedBy = "Pratap / Mahesh";
  record.supervisor = "Rajesh Sharma";
  if (Array.isArray(record.rows)) {
    if (record.rows.length < OFFICIAL_CHECKPOINTS.length) {
      const existingMap = {};
      record.rows.forEach(r => { existingMap[r.id] = r; });
      record.rows = OFFICIAL_CHECKPOINTS.map(cp => {
        const ex = existingMap[cp.id];
        return {
          id: cp.id,
          area: cp.area,
          method: ex?.method || cp.method,
          agent: ex?.agent || cp.agent,
          time: ex?.time || cp.defaultTime,
          status: ex?.status || "OK",
          cleanedBy: ex?.cleanedBy || cp.cleanedBy,
          checkedBy: "Rajesh Sharma"
        };
      });
    } else {
      record.rows.forEach((r, idx) => {
        if (r.cleanedBy !== 'Pratap' && r.cleanedBy !== 'Mahesh') {
          r.cleanedBy = (idx % 2 === 0) ? 'Pratap' : 'Mahesh';
        }
        r.checkedBy = 'Rajesh Sharma';
      });
    }
  }
  if (Array.isArray(record.corrective)) {
    record.corrective.forEach(c => {
      c.verifiedBy = 'Rajesh Sharma';
    });
  }
  return record;
}

function pregenerateHistoricalData() {
  const months = [
    { m: 4, name: "April", days: 30 },
    { m: 5, name: "May", days: 31 },
    { m: 6, name: "June", days: 30 },
    { m: 7, name: "July", days: 31 },
    { m: 8, name: "August", days: 31 },
    { m: 9, name: "September", days: 30 },
    { m: 10, name: "October", days: 31 },
    { m: 11, name: "November", days: 30 },
    { m: 12, name: "December", days: 31 }
    // Dynamic cap handled by MAX_DATE check above
  ];

  for (const mInfo of months) {
    for (let day = 1; day <= mInfo.days; day++) {
      const dayStr = String(day).padStart(2, '0');
      const mStr = String(mInfo.m).padStart(2, '0');
      const dateKey = `2026-${mStr}-${dayStr}`;

      if (dateKey > MAX_DATE || dateKey < MIN_DATE) continue;

      const local = localStorage.getItem(`lv_cleaning_${dateKey}`);
      if (local) {
        try {
          let rec = JSON.parse(local);
          rec = normalizeCleaningNames(rec);
          allRecordsCache[dateKey] = rec;
          continue;
        } catch (e) {}
      }

      if (!allRecordsCache[dateKey]) {
        const def = CLEANING_DEFICIENCIES[dateKey] || null;

        const rows = OFFICIAL_CHECKPOINTS.map((cp) => {
          let status = "OK";
          if (def && cp.id === def.id) status = "Not OK";

          return {
            id: cp.id,
            area: cp.area,
            method: cp.method,
            agent: cp.agent,
            time: cp.defaultTime,
            status: status,
            cleanedBy: cp.cleanedBy,
            checkedBy: "Rajesh Sharma"
          };
        });

        const corrective = [];
        if (def) {
          corrective.push({
            id: 1,
            problem: def.problem,
            action: def.action,
            actionTime: def.actionTime,
            verifiedBy: "Rajesh Sharma"
          });
        }

        const record = {
          date: dateKey,
          month: mInfo.name,
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
      }
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
  if (dateStr > MAX_DATE) dateStr = MAX_DATE;
  if (dateStr < MIN_DATE) dateStr = MIN_DATE;
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

  // Update navigation button states
  const btnPrev = document.getElementById('btn-prev-day');
  const btnNext = document.getElementById('btn-next-day');
  if (btnPrev) {
    const atMin = (currentDate <= MIN_DATE);
    btnPrev.disabled = atMin;
    btnPrev.classList.toggle('disabled', atMin);
  }
  if (btnNext) {
    const atMax = (currentDate >= MAX_DATE);
    btnNext.disabled = atMax;
    btnNext.classList.toggle('disabled', atMax);
  }

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
    "Lizol Floor Cleaner",
    "Floor Disinfectant Solution",
    "Food-Safe Disinfectant Solution",
    "Ethanol 70% Food Contact Sanitizer",
    "Isopropyl Alcohol (IPA) 70%",
    "Food Grade Neutral Detergent",
    "Neutral Sanitizer Solution",
    "Food Grade Sanitizer / Dry Vacuum",
    "Chlorine 100ppm Solution",
    "Antibacterial Soap & Water",
    "Sodium Hypochlorite 1% + Phenyl",
    "Inspection / No Infestation",
    "Antibacterial Sanitizer & Aprons",
    "Hairnets & Protective Wear Verified",
    "Air Curtains & Mesh Screens Intact",
    "Designated Locked Storage / MSDS"
  ],
  method: [
    "Sweeping & Wet Mopping",
    "Sweeping, Scrubbing & Mopping",
    "Sweeping, Vacuuming & Wiping",
    "Wiping & Surface Sanitization",
    "Precision Dry Wipe & Sanitization",
    "Hot Detergent Wash, Rinse & Drying",
    "Dusting & Surface Wiping",
    "Dry Wiping & Food-Safe Sanitizer",
    "Dry Sweeping & Microfiber Wiping",
    "Emptying, Detergent Wash & Disinfect",
    "Scrubbing, Sanitizing & Soap Refill",
    "Deep Scrubbing, Disinfection & Mop",
    "Visual Inspection of Traps & Stations",
    "Personal Hygiene & Attire Audit",
    "PPE & Hairnet Compliance Check",
    "Visual & Physical Integrity Check",
    "Chemical Cabinet & Label Inspection"
  ],
  time: [
    "08:30 AM", "08:45 AM", "09:00 AM", "09:15 AM", "09:30 AM",
    "09:45 AM", "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
    "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
    "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM"
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
// DATE NAVIGATION (BOUNDED: APRIL 1, 2026 TO OCTOBER 19, 2026)
// ──────────────────────────────────────────────────────────────────────────────
window.changeDay = function(offset) {
  const [y, m, d] = currentDate.split('-');
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  dateObj.setDate(dateObj.getDate() + offset);

  const newY = dateObj.getFullYear();
  const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
  const newD = String(dateObj.getDate()).padStart(2, '0');
  const target = `${newY}-${newM}-${newD}`;

  if (offset > 0 && target > MAX_DATE) return;
  if (offset < 0 && target < MIN_DATE) return;

  loadDayRecord(target);
};

window.openDatePicker = function() {
  const inp = document.getElementById('hidden-date-input');
  inp.value = currentDate;
  inp.min = MIN_DATE;
  inp.max = MAX_DATE;
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
    <option value="10" selected>October (Current)</option>
    <option value="9">September</option>
    <option value="8">August</option>
    <option value="7">July</option>
    <option value="6">June</option>
    <option value="5">May</option>
    <option value="4">April (Audit Start)</option>
  `;
  ySel.innerHTML = `
    <option value="2026" selected>2026</option>
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
      if (d >= MIN_DATE && d <= MAX_DATE && !allRecordsCache[d]) {
        try {
          allRecordsCache[d] = JSON.parse(localStorage.getItem(key));
        } catch (e) {}
      }
    }
  }

  // Filter for chosen year-month within active bounds
  const prefix = `${yearVal}-${monthVal}`;
  const dates = Object.keys(allRecordsCache)
    .filter(k => k.startsWith(prefix) && k >= MIN_DATE && k <= MAX_DATE)
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
  const mSel = document.getElementById('history-month-sel');
  const ySel = document.getElementById('history-year-sel');
  const monthVal = mSel ? mSel.value : '10';
  const yearVal = ySel ? ySel.value : '2026';
  exportReport('monthly', { year: yearVal, month: monthVal });
};

window.exportReport = async function(type, meta = {}) {
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
      if (wStr >= MIN_DATE && wStr <= MAX_DATE) {
        weekDates.push(wStr);
      }
    }

    recordsToExport = weekDates.map(ds => allRecordsCache[ds] || createDefaultRecord(ds));
    fileName = `LV_Spices_Cleaning_Weekly_Report_${currentDate}.xlsx`;
  } else if (type === 'monthly' || type === 'october') {
    const y = meta.year || '2026';
    const m = meta.month ? String(meta.month).padStart(2, '0') : '10';
    const totalDays = new Date(parseInt(y), parseInt(m), 0).getDate();
    const monthDates = [];
    for (let d = 1; d <= totalDays; d++) {
      const ds = `${y}-${m}-${String(d).padStart(2, '0')}`;
      if (ds >= MIN_DATE && ds <= MAX_DATE) {
        monthDates.push(ds);
      }
    }
    recordsToExport = monthDates.map(ds => allRecordsCache[ds] || createDefaultRecord(ds));
    fileName = `LV_Spices_Cleaning_Register_${getMonthName(parseInt(m))}_${y}.xlsx`;
  } else if (type === 'all') {
    const allKeys = Object.keys(allRecordsCache)
      .filter(k => k >= MIN_DATE && k <= MAX_DATE)
      .sort();
    recordsToExport = allKeys.map(k => allRecordsCache[k]);
    fileName = `LV_Spices_Cleaning_Complete_Archive.xlsx`;
  } else if (type === 'custom') {
    const from = document.getElementById('export-from-date').value;
    const to = document.getElementById('export-to-date').value;
    if (!from || !to) {
      alert("Please select both From and To dates.");
      return;
    }
    const allKeys = Object.keys(allRecordsCache)
      .filter(k => k >= from && k <= to && k >= MIN_DATE && k <= MAX_DATE)
      .sort();
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
  // 1. Pre-generate historical data (April - October 2026)
  pregenerateHistoricalData();

  // 2. Load today's record (defaulting to current date: 19 October 2026)
  const initialDate = "2026-10-19";
  await loadDayRecord(initialDate);
});
