/**
 * MineSafe - Safety Review & Incident Prioritisation System
 * Operational control logic, risk scoring engine, and industrial emergency siren manager
 */

// --- Hazard Assessment Lexicons & Rules ---
const RULES = [
  {
    type: "Gas leak",
    words: ["gas", "smell", "methane", "fumes", "ventilation", "ch4", "odor", "odour", "sulfur", "airflow"],
    points: 40,
    action: "Evacuate the work area immediately, test the atmosphere, and inspect ventilation equipment.",
    checklist: [
      "Withdraw personnel upwind at least 150m from heading",
      "Deploy calibrated 4-gas optical detector to verify LEL < 1.0%",
      "Inspect auxiliary plenum dampers and duct pressure"
    ]
  },
  {
    type: "Fall risk",
    words: ["fall", "edge", "ladder", "slip", "unprotected", "drop", "scaffold", "harness", "lanyard", "bench"],
    points: 28,
    action: "Secure the area and install appropriate fall protection before work resumes.",
    checklist: [
      "Install dual-rail rigid perimeter guardrails with toe-boards",
      "Mandate 100% tie-off using shock-absorbing lifelines",
      "Assign a safety spotter during work within 2m of unsupported edges"
    ]
  },
  {
    type: "Missing PPE",
    words: ["not wearing", "without ppe", "without respirator", "no helmet", "no hardhat", "no goggles", "earplugs", "high-vis"],
    points: 20,
    action: "Stop work and ensure all required personal protective equipment is available.",
    checklist: [
      "Issue fit-tested particulate/gas cartridge respirators",
      "Review mandatory PPE matrix sign-off with work crew shift lead",
      "Log safety compliance infraction in shift logbook"
    ]
  },
  {
    type: "Electrical hazard",
    words: ["electrical", "cable", "wire", "spark", "shock", "frayed", "short circuit", "arc flash", "substation", "transformer"],
    points: 31,
    action: "Isolate the equipment and request inspection by a qualified electrician.",
    checklist: [
      "Trip main upstream breaker and verify zero energy state",
      "Apply Lockout/Tagout (LOTO) safety padlock and danger tag",
      "Inspect trailing cable insulation for sheath pinch or copper fraying"
    ]
  },
  {
    type: "Roof instability",
    words: ["roof", "crack", "rockfall", "collapse", "pillar", "cave-in", "spalling", "sloughing", "bolt", "seismic", "unstable"],
    points: 36,
    action: "Barricade access heading and request geotechnical ground support assessment.",
    checklist: [
      "Erect red danger barricade across access heading drift",
      "Inspect resin-grouted cable bolts and extensometer gauges",
      "Verify microseismic sensor logs for seismic burst energy"
    ]
  }
];

// --- Incident Samples for Quick Review ---
const SAMPLES = [
  {
    location: "North Shaft · Drilling Bay 4",
    text: "Strong gas odour and sulfur smell near drilling bay 4. Ventilation fan #2 has stopped and workers report headaches without respirators."
  },
  {
    location: "East Pit · Loading Area",
    text: "Unprotected open highwall edge at the loading area. Guardrails were removed by contractors and operators are working near the drop without harnesses."
  },
  {
    location: "Processing Plant · Substation 3",
    text: "Damaged high-voltage electrical cable with visible copper fraying. Sparks observed when loader drove over conduit near the damp wash bay."
  },
  {
    location: "South Ramp · Level 12 Stope",
    text: "Severe roof crack and rock popping along the hanging wall. Multiple split-set rock bolts sheared and loose rockfall debris is accumulating."
  },
  {
    location: "Conveyor Gallery 08",
    text: "Three contractors observed working in dusty transfer chute without particulate respirators or eye protection."
  }
];

// --- Priority Reports Store ---
let reports = [
  {
    id: "MS-2048",
    name: "Gas odour near drilling bay",
    location: "North Shaft",
    hazard: "Gas leak",
    score: 96,
    severity: "critical",
    status: "Assigned",
    rawText: "Heavy gas smell near the drilling heading. Ventilation stopped and workers experiencing headaches.",
    action: "Evacuate the work area, test the atmosphere, and inspect ventilation equipment."
  },
  {
    id: "MS-2047",
    name: "Unprotected edge at loading area",
    location: "East Pit",
    hazard: "Fall risk",
    score: 88,
    severity: "critical",
    status: "Under review",
    rawText: "30-meter open bench drop without guardrails. Operators walking within 1 meter without harnesses.",
    action: "Secure the area and install appropriate fall protection before work resumes."
  },
  {
    id: "MS-2046",
    name: "Damaged electrical cable",
    location: "Processing Plant",
    hazard: "Electrical hazard",
    score: 84,
    severity: "high",
    status: "Assigned",
    rawText: "Trailing 4160V power cable has exposed copper wire and sparks when wet.",
    action: "Isolate the equipment and request inspection by a qualified electrician."
  },
  {
    id: "MS-2045",
    name: "Hanging wall rock spalling",
    location: "South Ramp",
    hazard: "Roof instability",
    score: 86,
    severity: "critical",
    status: "Assigned",
    rawText: "Visible cracks in hanging wall stope with loose slabs falling after production blast.",
    action: "Barricade access drift and perform geotechnical scaling."
  },
  {
    id: "MS-2044",
    name: "Missing respirator in crusher bay",
    location: "Conveyor Gallery 08",
    hazard: "Missing PPE",
    score: 48,
    severity: "medium",
    status: "Resolved",
    rawText: "Contractors working in dusty conveyor transfer point without respirators.",
    action: "Stop work and ensure required personal protective equipment is provided."
  }
];

// State Variables
let currentFilter = "all";
let currentAssessment = null;

// Emergency Siren State
let isSirenPlaying = false;
let isMuted = false;
let sirenLoopTimer = null;
let currentOscillator = null;
let currentGainNode = null;
let audioContext = null;

// --- Initialization ---
function initApp() {
  renderTable();
  updateKPIs();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// ============================================================================
// Web Audio API: Industrial Two-Tone Emergency Evacuation Siren
// Pattern: Continuous alternating High/Low warble (880 Hz / 587 Hz) in a loop
// Continues indefinitely until explicitly stopped or muted by user.
// ============================================================================

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function startEmergencySiren() {
  if (isMuted) {
    updateSirenUIState(true);
    return;
  }

  if (isSirenPlaying) {
    return; // Already looping
  }

  try {
    const ctx = getAudioContext();
    isSirenPlaying = true;
    updateSirenUIState(true);

    // Continuous Two-Tone Siren Cycle
    // Step 1: High tone (880 Hz, 280ms)
    // Step 2: Low tone (587 Hz, 280ms)
    // Repeats every 560ms
    function playSirenCycle() {
      if (!isSirenPlaying || isMuted) {
        stopAudioNodes();
        return;
      }

      stopAudioNodes(); // Clean previous tone nodes if any

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Industrial alert wave profile: sawtooth filtered for piercing authority
      osc.type = "sawtooth";

      // Low-pass filter to eliminate harsh harshness while keeping industrial punch
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, now);

      // Schedule two-tone frequency steps
      osc.frequency.setValueAtTime(880, now); // High alert tone
      osc.frequency.setValueAtTime(587, now + 0.28); // Low alert tone

      // Master volume envelope
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.setValueAtTime(0.16, now + 0.54);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.56);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      currentOscillator = osc;
      currentGainNode = gain;

      osc.start(now);
      osc.stop(now + 0.56);
    }

    // Immediate first cycle
    playSirenCycle();

    // Schedule continuous repeating loop every 560ms
    clearInterval(sirenLoopTimer);
    sirenLoopTimer = setInterval(() => {
      if (isSirenPlaying && !isMuted) {
        playSirenCycle();
      } else {
        clearInterval(sirenLoopTimer);
      }
    }, 560);

  } catch (err) {
    console.error("Unable to start emergency siren:", err);
  }
}

function stopAudioNodes() {
  if (currentOscillator) {
    try {
      currentOscillator.stop();
      currentOscillator.disconnect();
    } catch (e) {
      // Ignored if already stopped
    }
    currentOscillator = null;
  }
  if (currentGainNode) {
    try {
      currentGainNode.disconnect();
    } catch (e) {
      // Ignored
    }
    currentGainNode = null;
  }
}

function stopEmergencySiren() {
  isSirenPlaying = false;
  clearInterval(sirenLoopTimer);
  sirenLoopTimer = null;
  stopAudioNodes();
  updateSirenUIState(false);
}

// User-Facing Mute Siren Button
function muteSiren() {
  if (isSirenPlaying) {
    stopEmergencySiren();
    isMuted = true;
    showToast("Emergency siren muted by supervisor.", "info");
  } else if (isMuted) {
    isMuted = false;
    showToast("Siren unmuted. Ready for critical alarms.", "info");
  } else {
    // If siren not playing, toggle default mute state
    isMuted = true;
    showToast("Siren muted.", "info");
  }

  updateMuteButtonLabels();
}

function testSiren() {
  // Always unmute for explicit user test action
  isMuted = false;
  updateMuteButtonLabels();

  // Show the fixed red banner
  showCriticalAlertBanner();

  // Start the industrial two-tone siren loop
  startEmergencySiren();

  showToast("Testing emergency two-tone siren. Click 'Mute Siren' to stop.", "danger");
}

function updateSirenUIState(active) {
  const pulseDot = document.getElementById("siren-pulse-dot");
  const headerMuteBtn = document.getElementById("btn-header-mute");
  const bannerMuteBtn = document.getElementById("btn-banner-mute");

  if (active && !isMuted) {
    if (pulseDot) pulseDot.classList.add("siren-active");
    if (headerMuteBtn) headerMuteBtn.classList.add("siren-btn-active");
    if (bannerMuteBtn) bannerMuteBtn.textContent = "Mute Siren";
  } else {
    if (pulseDot) pulseDot.classList.remove("siren-active");
    if (headerMuteBtn) headerMuteBtn.classList.remove("siren-btn-active");
    if (bannerMuteBtn) bannerMuteBtn.textContent = isMuted ? "Siren Muted" : "Mute Siren";
  }

  updateMuteButtonLabels();
}

function updateMuteButtonLabels() {
  const muteLabel = document.getElementById("mute-label");
  const bannerMuteBtn = document.getElementById("btn-banner-mute");

  const labelText = isSirenPlaying ? "Mute Siren" : (isMuted ? "Unmute Siren" : "Mute Siren");

  if (muteLabel) muteLabel.textContent = labelText;
  if (bannerMuteBtn) bannerMuteBtn.textContent = isSirenPlaying ? "Mute Siren" : (isMuted ? "Siren Muted" : "Mute Siren");
}

// Critical Alert Banner Controls
function showCriticalAlertBanner() {
  const banner = document.getElementById("critical-alert-banner");
  if (banner) {
    banner.classList.remove("hidden");
  }
}

function dismissCriticalAlert() {
  stopEmergencySiren();
  const banner = document.getElementById("critical-alert-banner");
  if (banner) {
    banner.classList.add("hidden");
  }
}

function jumpToAssessment() {
  const workspace = document.getElementById("assessment-workspace");
  if (workspace) {
    workspace.scrollIntoView({ behavior: "smooth" });
  }
}

// --- Navigation Tabs ---
function switchNav(tabId) {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === `#${tabId}`);
  });

  if (tabId === "reports") {
    document.querySelector(".table-panel").scrollIntoView({ behavior: "smooth" });
  } else if (tabId === "review") {
    document.querySelector(".main-content").scrollIntoView({ behavior: "smooth" });
  } else {
    showToast(`Navigated to ${tabId.charAt(0).toUpperCase() + tabId.slice(1)} view.`);
  }
}

// --- Sample Presets Loader ---
function loadSample(index) {
  const sample = SAMPLES[index];
  if (!sample) return;

  document.getElementById("location").value = sample.location;
  const textarea = document.getElementById("report");
  textarea.value = sample.text;
  handleReportInput();

  showToast(`Loaded sample report: ${sample.location}`);
}

function clearForm() {
  document.getElementById("report").value = "";
  handleReportInput();
  resetResultView();
}

function handleReportInput() {
  const text = document.getElementById("report").value;
  document.getElementById("char-count").textContent = `${text.length} characters`;
}

// ============================================================================
// Core Assessment & Risk Scoring Algorithm
// Triggered strictly upon user action (clicking "Assess report")
// ============================================================================

function assessReport(isUserInitiated = false) {
  const reportInput = document.getElementById("report");
  const reportText = reportInput.value.trim();

  if (!reportText) {
    reportInput.focus();
    return;
  }

  const lowerText = reportText.toLowerCase();

  // Match against predefined safety rules
  const matches = RULES
    .map(rule => ({
      ...rule,
      hits: rule.words.filter(word => lowerText.includes(word))
    }))
    .filter(rule => rule.hits.length > 0);

  // Calculate score: base + rule points + density bonus
  let score = 12 + matches.reduce((total, rule) => total + rule.points + (rule.hits.length - 1) * 2, 0);

  // Specific urgency boosters
  const urgentWords = ["smoke", "trapped", "danger", "burst", "fire", "emergency", "injured", "siren", "fatal"];
  const matchedUrgent = urgentWords.filter(w => lowerText.includes(w));
  score += matchedUrgent.length * 6;

  score = Math.min(Math.max(score, 18), 99);

  // Severity Level
  let severity = "low";
  let severityTitle = "Low Risk Advisory";
  let slaText = "Standard shift review within 24 hours";

  if (score >= 85) {
    severity = "critical";
    severityTitle = "Critical Risk";
    slaText = "Immediate supervisor review & evacuation assessment";
  } else if (score >= 65) {
    severity = "high";
    severityTitle = "High Risk";
    slaText = "Corrective intervention required within 30 minutes";
  } else if (score >= 40) {
    severity = "medium";
    severityTitle = "Medium Risk";
    slaText = "Shift supervisor inspection within 2 hours";
  }

  const action = matches[0]
    ? matches[0].action
    : "Send this report to the safety supervisor for manual assessment.";

  const checklist = matches[0] && matches[0].checklist
    ? matches[0].checklist
    : ["Verify environmental air monitoring sensors", "Log report into shift safety logbook"];

  currentAssessment = {
    score,
    severity,
    severityTitle,
    slaText,
    action,
    checklist,
    matches,
    text: reportText,
    location: document.getElementById("location").value
  };

  // Render assessment in the right-hand panel
  renderAssessmentView(currentAssessment);

  // ==========================================================================
  // CRITICAL EMERGENCY ALARM RULE:
  // - ONLY for Critical severity (score >= 85)
  // - Show fixed red banner: "CRITICAL SAFETY RISK DETECTED — IMMEDIATE ACTION REQUIRED."
  // - Start looping two-tone emergency siren if user clicked "Assess report"
  // - NEVER play siren for High, Medium, or Low reports.
  // ==========================================================================
  if (severity === "critical") {
    showCriticalAlertBanner();
    if (isUserInitiated) {
      startEmergencySiren();
    }
  } else {
    // Stop siren immediately if a non-critical assessment is run
    stopEmergencySiren();
    dismissCriticalAlert();
  }
}

// --- Render Assessment View ---
function renderAssessmentView(data) {
  const emptyState = document.getElementById("empty-state");
  const activeResult = document.getElementById("active-result");
  const resultBadge = document.getElementById("result-badge");
  const scoreNum = document.getElementById("res-score");
  const severityTitle = document.getElementById("res-severity-title");
  const slaText = document.getElementById("res-sla");
  const hazardsList = document.getElementById("res-hazards");
  const actionText = document.getElementById("res-action");
  const checklist = document.getElementById("res-checklist");

  emptyState.classList.add("hidden");
  activeResult.classList.remove("hidden");

  // Update top panel badge
  resultBadge.className = `badge badge-${data.severity}`;
  resultBadge.textContent = data.severity.toUpperCase();

  // Score display
  scoreNum.textContent = data.score;
  scoreNum.style.color = (data.severity === "critical") ? "var(--red)" :
                         (data.severity === "high") ? "var(--amber)" :
                         (data.severity === "medium") ? "var(--blue)" : "var(--green)";

  severityTitle.textContent = data.severityTitle;
  severityTitle.style.color = (data.severity === "critical") ? "var(--red-dark)" : "var(--text-main)";
  slaText.textContent = data.slaText;

  // Render detected hazards list
  if (data.matches.length > 0) {
    hazardsList.innerHTML = data.matches.map(m => `
      <div class="hazard-item">
        <div class="hazard-title-row">
          <span>${escapeHtml(m.type)}</span>
          <span class="badge badge-${data.severity}">+${m.points} pts</span>
        </div>
        <div class="hazard-hits-text">
          Trigger words: ${m.hits.map(h => `<span class="matched-word">${escapeHtml(h)}</span>`).join("")}
        </div>
      </div>
    `).join("");
  } else {
    hazardsList.innerHTML = `
      <div class="hazard-item">
        <div class="hazard-title-row"><span>General Observation</span></div>
        <div class="hazard-hits-text">No specific hazard dictionary matches detected. Manual triage recommended.</div>
      </div>
    `;
  }

  // Recommended action & checklist
  actionText.textContent = data.action;
  checklist.innerHTML = data.checklist.map(step => `
    <li>${escapeHtml(step)}</li>
  `).join("");
}

function resetResultView() {
  document.getElementById("empty-state").classList.remove("hidden");
  document.getElementById("active-result").classList.add("hidden");
  const resultBadge = document.getElementById("result-badge");
  resultBadge.className = "badge badge-neutral";
  resultBadge.textContent = "Ready";
  currentAssessment = null;
  stopEmergencySiren();
}

// --- Add to Priority Table ---
function addReportToTable() {
  const text = document.getElementById("report").value.trim();
  const location = document.getElementById("location").value;

  if (!text) {
    showToast("Please enter a safety report observation first.", "danger");
    document.getElementById("report").focus();
    return;
  }

  if (!currentAssessment) {
    assessReport(true);
  }

  const nextNumber = 2049 + reports.length - 5;
  const newId = `MS-${nextNumber}`;
  const shortTitle = text.length > 44 ? text.substring(0, 41) + "..." : text;

  const newReport = {
    id: newId,
    name: shortTitle,
    location: location.split("·")[0].trim(),
    hazard: currentAssessment.matches.length > 0 ? currentAssessment.matches[0].type : "General hazard",
    score: currentAssessment.score,
    severity: currentAssessment.severity,
    status: "Assigned",
    rawText: text,
    action: currentAssessment.action
  };

  reports.unshift(newReport);
  renderTable();
  updateKPIs();

  showToast(`Report ${newId} logged and added to Priority Reports table.`, "success");
}

// --- Priority Reports Table Rendering ---
function renderTable() {
  const tbody = document.getElementById("table-body");
  if (!tbody) return;

  const searchTerm = (document.getElementById("table-search")?.value || "").toLowerCase().trim();

  const filtered = reports.filter(r => {
    const matchesFilter = (currentFilter === "all") || (r.severity === currentFilter);
    const matchesSearch = !searchTerm || 
      r.name.toLowerCase().includes(searchTerm) || 
      r.id.toLowerCase().includes(searchTerm) || 
      r.location.toLowerCase().includes(searchTerm) || 
      r.hazard.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No reports found matching the selected filter or search term.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>
        <span class="report-title">${escapeHtml(r.name)}</span>
        <span class="report-code">${r.id}</span>
      </td>
      <td>${escapeHtml(r.location)}</td>
      <td>${escapeHtml(r.hazard)}</td>
      <td><b>${r.score} / 100</b></td>
      <td><span class="badge badge-${r.severity}">${r.severity.toUpperCase()}</span></td>
      <td>
        <select class="status-dropdown" onchange="updateReportStatus('${r.id}', this.value)">
          <option value="Assigned" ${r.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
          <option value="Under review" ${r.status === 'Under review' ? 'selected' : ''}>Under review</option>
          <option value="Resolved" ${r.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </td>
      <td>
        <button class="btn-row-review" onclick="reviewReport('${r.id}')">Review</button>
      </td>
    </tr>
  `).join("");
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll(".btn-filter").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  renderTable();
}

function updateReportStatus(id, newStatus) {
  const report = reports.find(r => r.id === id);
  if (report) {
    report.status = newStatus;
    updateKPIs();
    showToast(`${id} status updated to ${newStatus}.`, newStatus === "Resolved" ? "success" : "info");
  }
}

function reviewReport(id) {
  const report = reports.find(r => r.id === id);
  if (!report) return;

  const locSelect = document.getElementById("location");
  for (let i = 0; i < locSelect.options.length; i++) {
    if (locSelect.options[i].text.includes(report.location)) {
      locSelect.selectedIndex = i;
      break;
    }
  }

  const textarea = document.getElementById("report");
  textarea.value = report.rawText || report.name;
  handleReportInput();
  assessReport(false);

  jumpToAssessment();
  showToast(`Loaded ${id} into the assessment form.`);
}

// --- KPI Metric Cards Update ---
function updateKPIs() {
  const total = 20 + reports.length;
  const critical = reports.filter(r => r.severity === "critical" && r.status !== "Resolved").length;
  const high = reports.filter(r => r.severity === "high" && r.status !== "Resolved").length;
  const resolved = 14 + reports.filter(r => r.status === "Resolved").length;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-critical").textContent = critical;
  document.getElementById("kpi-high").textContent = high;
  document.getElementById("kpi-resolved").textContent = resolved;
}

// --- Helper Functions ---
function copyResultSummary() {
  if (!currentAssessment) return;
  const summary = `[MINESAFE SAFETY REVIEW]\nLocation: ${currentAssessment.location}\nRisk Score: ${currentAssessment.score}/100 (${currentAssessment.severity.toUpperCase()})\nHazards: ${currentAssessment.matches.map(m => m.type).join(", ")}\nRecommended Action: ${currentAssessment.action}`;
  navigator.clipboard.writeText(summary).then(() => {
    showToast("Assessment summary copied to clipboard.");
  }).catch(() => {
    showToast("Failed to copy summary.", "danger");
  });
}

function logImmediateIncident() {
  if (!currentAssessment) return;
  showCriticalAlertBanner();
  startEmergencySiren();
  showToast(`Logged Critical Incident for ${currentAssessment.location}. Safety teams notified.`, "danger");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-msg ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease";
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Expose functions globally to window for inline HTML event handlers in Vite production bundle
if (typeof window !== "undefined") {
  Object.assign(window, {
    muteSiren,
    testSiren,
    startEmergencySiren,
    stopEmergencySiren,
    dismissCriticalAlert,
    jumpToAssessment,
    switchNav,
    loadSample,
    clearForm,
    handleReportInput,
    assessReport,
    addReportToTable,
    renderTable,
    setFilter,
    updateReportStatus,
    reviewReport,
    updateKPIs,
    copyResultSummary,
    logImmediateIncident,
    showToast,
    showCriticalAlertBanner,
    resetResultView,
    escapeHtml,
    initApp
  });
}
