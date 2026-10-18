// app.js — LV Spices Daily Cleaning & Sanitation Register
// Dukan Stock style UI — Auto-fill + realistic randomization

// ──────────────────────────────────────────────────────────────────────────────
// CHECKPOINT DEFINITIONS (18 items)
// ──────────────────────────────────────────────────────────────────────────────
const CHECKPOINTS = [
  { id: 1,  name: "Shop Floor Cleaning",                    defaultTime: "8:45 AM & 6:15 PM", agent: "Lizol Floor Cleaner — Wet Mopping",           staff: "Pratap" },
  { id: 2,  name: "Warehouse Floor Cleaning",               defaultTime: "8:45 AM & 6:15 PM", agent: "Lizol Floor Cleaner — Wet Mopping",           staff: "Mahesh" },
  { id: 3,  name: "Manufacturing Area Cleaning",            defaultTime: "8:45 AM & 6:15 PM", agent: "Lizol Floor Cleaner — Wet Mopping",           staff: "Pratap" },
  { id: 4,  name: "Repacking Area Cleaning",               defaultTime: "8:45 AM & 6:15 PM", agent: "Lizol Floor Cleaner — Wet Mopping",           staff: "Mahesh" },
  { id: 5,  name: "Blending Table Cleaning",               defaultTime: "8:45 AM & 6:15 PM", agent: "Vim Dishwash Liquid — Detergent Wash & Dry",  staff: "Pratap" },
  { id: 6,  name: "Weighing Machine Cleaning",             defaultTime: "8:45 AM & 6:15 PM", agent: "Dry Cloth Wipe",                              staff: "Mahesh" },
  { id: 7,  name: "Scoops, Trays & Utensils Cleaning",    defaultTime: "6:00 PM",           agent: "Vim Dishwash Liquid — Detergent Wash, Rinse & Complete Drying", staff: "Pratap" },
  { id: 8,  name: "Storage Racks & Pallets Cleaning",     defaultTime: "8:45 AM",           agent: "Dry Cloth Wipe & Dusting",                   staff: "Mahesh" },
  { id: 9,  name: "Packing Machine Cleaning",             defaultTime: "8:45 AM & 6:15 PM", agent: "Dry Brush Cleaning — No Liquid",              staff: "Pratap" },
  { id: 10, name: "Dust & Spillage Removal",              defaultTime: "8:45 AM & 6:15 PM", agent: "Broom & Wet Mop",                             staff: "Mahesh" },
  { id: 11, name: "Waste Bins Cleaning & Waste Disposal", defaultTime: "6:15 PM",           agent: "Dettol Disinfectant",                         staff: "Pratap" },
  { id: 12, name: "Handwashing Facilities & Soap Check",  defaultTime: "8:45 AM",           agent: "Dettol Handwash Refill",                      staff: "Mahesh" },
  { id: 13, name: "Toilet & Washroom Cleaning",           defaultTime: "8:45 AM & 6:15 PM", agent: "Harpic Toilet Cleaner + Phenyl",              staff: "Pratap" },
  { id: 14, name: "Pest Activity / Rodent Check",         defaultTime: "8:45 AM",           agent: "Visual Inspection",                          staff: "Rajesh Sharma" },
  { id: 15, name: "Staff Hand Hygiene & Clean Clothing",  defaultTime: "9:00 AM",           agent: "Inspection",                                 staff: "Rajesh Sharma" },
  { id: 16, name: "Hair Cover / Protective Clothing Check", defaultTime: "9:00 AM",          agent: "Visual Check",                               staff: "Rajesh Sharma" },
  { id: 17, name: "Doors, Windows & Insect Screens Check", defaultTime: "8:45 AM",          agent: "Visual Check",                               staff: "Mahesh" },
  { id: 18, name: "Cleaning Chemicals Properly Stored",   defaultTime: "6:15 PM",           agent: "Physical Verification",                      staff: "Rajesh Sharma" },
];

// Realistic issue library for randomizer
const ISSUE_SCENARIOS = [
  { checkpoint: 1,  problem: "Spice powder residue found near packaging area", action: "Area swept and mopped again with Lizol Floor Cleaner, wet mopping done" },
  { checkpoint: 2,  problem: "Dust accumulation observed near pallets",        action: "Dry mopping followed by wet mopping with Lizol done, area cleared" },
  { checkpoint: 3,  problem: "Turmeric stain found on manufacturing floor",    action: "Stain treated with Lizol, floor scrubbed and rewashed" },
  { checkpoint: 5,  problem: "Blending table had residual masala traces",      action: "Table re-washed with Vim Dishwash Liquid and completely dried" },
  { checkpoint: 7,  problem: "One scoop found inadequately dried",             action: "Scoop re-washed with Vim and dried completely before use" },
  { checkpoint: 10, problem: "Minor chilli powder spillage near machine",      action: "Area swept, wet mopped with Lizol, inspected and cleared" },
  { checkpoint: 13, problem: "Washroom floor found damp after cleaning",       action: "Washroom re-cleaned with Harpic and phenyl, floor dried with mop" },
  { checkpoint: 14, problem: "Small insect activity observed near window",     action: "Area cleaned, window sealed, pest control notified" },
];

// ──────────────────────────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────────────────────────
let currentDate = getTodayStr();
let registerData = {}; // { date: { rows: [...], savedAt: ... } }
let currentView = 'today';

// ──────────────────────────────────────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────────────────────────────────────
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function getDayOfWeek(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDay(); // 0=Sun, 1=Mon...
}
function getWeekNumber(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
}

// ──────────────────────────────────────────────────────────────────────────────
// AUTO-FILL LOGIC
// ──────────────────────────────────────────────────────────────────────────────
function shouldHaveIssue(dateStr) {
  // Pick 1-2 issues per week, deterministically based on week number + year
  const d = new Date(dateStr + 'T00:00:00');
  const weekNum = getWeekNumber(dateStr);
  const year = d.getFullYear();
  
  // Only on specific days (Monday or Wednesday based on week parity)
  const day = getDayOfWeek(dateStr);
  const issueDay = (weekNum % 2 === 0) ? 1 : 3; // Mon or Wed alternate weeks
  
  return day === issueDay;
}

function getIssueForDate(dateStr) {
  const weekNum = getWeekNumber(dateStr);
  const year = new Date(dateStr + 'T00:00:00').getFullYear();
  // Pick scenario deterministically
  const idx = (weekNum + year) % ISSUE_SCENARIOS.length;
  return ISSUE_SCENARIOS[idx];
}

function getAlternatingStaff(dateStr) {
  // Alternate cleaned-by between Pratap and Mahesh per day
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return dayOfYear % 2 === 0 ? 'Pratap' : 'Mahesh';
}

function buildDefaultRows(dateStr) {
  const hasIssue = shouldHaveIssue(dateStr);
  const issueScenario = hasIssue ? getIssueForDate(dateStr) : null;
  const mainStaff = getAlternatingStaff(dateStr);

  return CHECKPOINTS.map(cp => {
    const isIssueRow = hasIssue && issueScenario && cp.id === issueScenario.checkpoint;
    return {
      id: cp.id,
      name: cp.name,
      status: isIssueRow ? 'FAIL' : 'OK',
      time: cp.defaultTime,
      staff: cp.staff.includes('Rajesh') ? cp.staff : mainStaff,
      agent: cp.agent,
      problem: isIssueRow ? issueScenario.problem : '',
      action: isIssueRow ? issueScenario.action : '',
      actionTime: isIssueRow ? '6:30 PM' : '',
      verifiedBy: isIssueRow ? 'Rajesh Sharma' : '',
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE (fallback when Firebase not configured)
// ──────────────────────────────────────────────────────────────────────────────
const LS_KEY = 'lv_cleaning_register';

function loadFromLS(dateStr) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return all[dateStr] || null;
  } catch { return null; }
}

function saveToLS(dateStr, rows) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    all[dateStr] = { rows, savedAt: new Date().toISOString() };
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch(e) { console.error(e); }
}

function getAllDatesFromLS() {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return Object.keys(all).sort().reverse();
  } catch { return []; }
}

// ──────────────────────────────────────────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────────────────────────────────────────
function getRowsForDate(dateStr) {
  const saved = loadFromLS(dateStr);
  if (saved) return saved.rows;
  // Auto-generate
  const rows = buildDefaultRows(dateStr);
  return rows;
}

function renderRegister(dateStr) {
  const rows = getRowsForDate(dateStr);
  registerData[dateStr] = rows;

  // Header date
  document.getElementById('header-date').textContent = formatDate(dateStr);
  document.getElementById('date-display-text').textContent = 
    dateStr === getTodayStr() ? `Today — ${formatDateShort(dateStr)}` : formatDateShort(dateStr);

  // Render checklist rows
  const tbody = document.getElementById('checklist-body');
  tbody.innerHTML = '';
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    if (row.status === 'FAIL') tr.classList.add('row-issue');
    tr.innerHTML = `
      <td><div class="row-number">${row.id}</div></td>
      <td>
        <div class="checkpoint-name">${row.name}</div>
        <div class="checkpoint-desc">${row.agent}</div>
      </td>
      <td class="center">
        <div class="status-toggle">
          <button class="status-btn ${row.status === 'OK' ? 'active-ok' : ''}" onclick="setStatus(${i}, 'OK')">✓</button>
          <button class="status-btn ${row.status === 'FAIL' ? 'active-fail' : ''}" onclick="setStatus(${i}, 'FAIL')">✗</button>
          <button class="status-btn ${row.status === 'NA' ? 'active-na' : ''}" onclick="setStatus(${i}, 'NA')">NA</button>
        </div>
      </td>
      <td><input class="table-input" value="${row.time}" onchange="updateField(${i}, 'time', this.value)" /></td>
      <td><input class="table-input" value="${row.staff}" onchange="updateField(${i}, 'staff', this.value)" /></td>
    `;
    tbody.appendChild(tr);
  });

  updateCorrectiveSection(dateStr, rows);
  updateStats(rows);
}

function updateStats(rows) {
  const ok = rows.filter(r => r.status === 'OK').length;
  const fail = rows.filter(r => r.status === 'FAIL').length;
  const na = rows.filter(r => r.status === 'NA').length;
  const total = rows.length;
  const pct = Math.round(((ok + na) / total) * 100);

  document.getElementById('stat-ok').textContent = ok;
  document.getElementById('stat-issues').textContent = fail;
  document.getElementById('stat-na').textContent = na;
  document.getElementById('stat-pct').textContent = pct + '%';

  const badge = document.getElementById('checklist-status-badge');
  if (fail > 0) {
    badge.className = 'badge badge-red';
    badge.textContent = `${fail} Issue${fail > 1 ? 's' : ''}`;
  } else {
    badge.className = 'badge badge-green';
    badge.textContent = 'All Clear';
  }
}

function updateCorrectiveSection(dateStr, rows) {
  const issues = rows.filter(r => r.status === 'FAIL');
  const section = document.getElementById('corrective-section');
  const badge = document.getElementById('issues-count-badge');
  const tbody = document.getElementById('corrective-body');

  if (issues.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  badge.textContent = `${issues.length} Issue${issues.length > 1 ? 's' : ''}`;
  tbody.innerHTML = '';

  let srNum = 1;
  issues.forEach(row => {
    const origIdx = rows.indexOf(row);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${srNum++}</td>
      <td><strong>${row.name}</strong></td>
      <td><input class="table-input" value="${row.problem}" placeholder="Describe problem..." onchange="updateField(${origIdx}, 'problem', this.value)" style="min-width:180px" /></td>
      <td><input class="table-input" value="${row.action}" placeholder="Action taken..." onchange="updateField(${origIdx}, 'action', this.value)" style="min-width:180px" /></td>
      <td><input class="table-input" value="${row.actionTime}" placeholder="Time..." onchange="updateField(${origIdx}, 'actionTime', this.value)" /></td>
      <td><input class="table-input" value="${row.verifiedBy || 'Rajesh Sharma'}" onchange="updateField(${origIdx}, 'verifiedBy', this.value)" /></td>
    `;
    tbody.appendChild(tr);
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTIONS
// ──────────────────────────────────────────────────────────────────────────────
window.setStatus = function(rowIdx, status) {
  const rows = registerData[currentDate];
  if (!rows) return;
  rows[rowIdx].status = status;
  renderRegister(currentDate);
};

window.updateField = function(rowIdx, field, value) {
  const rows = registerData[currentDate];
  if (!rows) return;
  rows[rowIdx][field] = value;
  updateStats(rows);
};

window.saveRegister = function() {
  const rows = registerData[currentDate];
  if (!rows) return;
  saveToLS(currentDate, rows);
  showToast('Register saved successfully!', 'success');
};

window.changeDay = function(delta) {
  const d = new Date(currentDate + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  const newDate = d.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  if (newDate > today) {
    showToast("Can't navigate to future dates", 'error');
    return;
  }
  currentDate = newDate;
  renderRegister(currentDate);
};

window.openDatePicker = function() {
  const inp = document.getElementById('hidden-date-input');
  inp.max = getTodayStr();
  inp.value = currentDate;
  inp.showPicker ? inp.showPicker() : inp.click();
};

window.switchView = function(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  document.getElementById('view-today').style.display = view === 'today' ? '' : 'none';
  document.getElementById('view-history').style.display = view === 'history' ? '' : 'none';
  document.getElementById('date-navigator').style.display = view === 'today' ? '' : 'none';
  document.getElementById('page-title').textContent = view === 'today'
    ? 'Daily Cleaning & Sanitation Register'
    : 'History';
  if (view === 'history') renderHistory();
};

window.toggleSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
};
window.closeSidebar = function() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
};

// ──────────────────────────────────────────────────────────────────────────────
// HISTORY
// ──────────────────────────────────────────────────────────────────────────────
function populateHistoryFilters() {
  const monthSel = document.getElementById('history-month-sel');
  const yearSel = document.getElementById('history-year-sel');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();

  monthSel.innerHTML = months.map((m, i) =>
    `<option value="${i + 1}" ${i === now.getMonth() ? 'selected' : ''}>${m}</option>`
  ).join('');

  yearSel.innerHTML = [now.getFullYear() - 1, now.getFullYear()].map(y =>
    `<option value="${y}" ${y === now.getFullYear() ? 'selected' : ''}>${y}</option>`
  ).join('');
}

window.loadHistory = function() {
  renderHistory();
};

function renderHistory() {
  const month = parseInt(document.getElementById('history-month-sel').value);
  const year = parseInt(document.getElementById('history-year-sel').value);
  const allDates = getAllDatesFromLS();
  
  const filtered = allDates.filter(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt.getMonth() + 1 === month && dt.getFullYear() === year;
  });

  const container = document.getElementById('history-list');
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <h3>No Records This Month</h3>
        <p>Start saving daily registers to build your history.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(dateStr => {
    const saved = loadFromLS(dateStr);
    const rows = saved ? saved.rows : [];
    const ok = rows.filter(r => r.status === 'OK').length;
    const fail = rows.filter(r => r.status === 'FAIL').length;
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate().toString().padStart(2, '0');
    const mon = d.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
    const weekday = d.toLocaleString('en-IN', { weekday: 'long' });

    return `
      <div class="history-item" onclick="viewHistoryDate('${dateStr}')">
        <div class="history-item-left">
          <div class="history-date-block">
            <div class="day">${day}</div>
            <div class="month">${mon}</div>
          </div>
          <div class="history-info">
            <h4>${weekday}, ${formatDateShort(dateStr)}</h4>
            <p>${ok} OK · ${fail} Issue${fail !== 1 ? 's' : ''} · ${rows.length} checkpoints</p>
          </div>
        </div>
        <span class="badge ${fail > 0 ? 'badge-red' : 'badge-green'}">${fail > 0 ? `${fail} Issue${fail !== 1 ? 's' : ''}` : 'All Clear'}</span>
      </div>
    `;
  }).join('');
}

window.viewHistoryDate = function(dateStr) {
  currentDate = dateStr;
  switchView('today');
  renderRegister(dateStr);
};

// ──────────────────────────────────────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type ? 'toast-' + type : ''}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ──────────────────────────────────────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────────────────────────────────────
function init() {
  populateHistoryFilters();
  
  // Date picker
  document.getElementById('hidden-date-input').addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = e.target.value;
      renderRegister(currentDate);
    }
  });

  renderRegister(currentDate);

  // Auto-save every 2 minutes
  setInterval(() => {
    if (registerData[currentDate]) {
      saveToLS(currentDate, registerData[currentDate]);
    }
  }, 120000);
}

init();
