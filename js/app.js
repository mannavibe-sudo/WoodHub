// ============================================================
// WoodHub — app shell, routing & views
// ============================================================

const state = {
  materialType: "euca_chips", // 'euca_chips' | 'euco_wood' — used on Entry & Dashboard
  editingId: null,
  cache: { euca_chips: [], euco_wood: [], assessment: [] },
};

// ---------------- helpers ----------------

function fmtMoney(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtNum(n, suffix = "") {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-IN", { maximumFractionDigits: 3 }) + suffix;
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return d;
  }
}

function showToast(msg, ms = 2500) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (el.style.display = "none"), ms);
}

function materialLabel(type) {
  return type === "euca_chips" ? "Euca Chips" : "Euco Wood";
}

// ---------------- routing ----------------

const ROUTES = ["dashboard", "entry", "history", "assessment"];

function currentRoute() {
  const hash = (location.hash || "#dashboard").slice(1);
  return ROUTES.includes(hash) ? hash : "dashboard";
}

function setActiveTab(route) {
  document.querySelectorAll("#tabbar a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === route);
  });
}

async function render() {
  if (!SupaLite.isLoggedIn()) {
    showLogin();
    return;
  }
  showApp();
  const route = currentRoute();
  setActiveTab(route);
  const view = document.getElementById("view");
  view.innerHTML = `<div class="empty-state"><span class="spinner-inline" style="border-top-color:#6b4a30;border-color:rgba(107,74,48,0.25);"></span>Loading…</div>`;

  try {
    if (route === "dashboard") await renderDashboard(view);
    else if (route === "entry") await renderEntry(view);
    else if (route === "history") await renderHistory(view);
    else if (route === "assessment") await renderAssessment(view);
  } catch (err) {
    view.innerHTML = `<div class="error-banner">${escapeHtml(err.message)}</div>`;
  }
}

function showLogin() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app-shell").style.display = "none";
}

function showApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "block";
}

function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------------- data loading (with light in-memory cache) ----------------

async function fetchLogEntries(type, force = false) {
  if (!force && state.cache[type].length) return state.cache[type];
  const rows = await SupaLite.list("log_entries", {
    filters: `log_type=eq.${type}`,
    order: "dispatch_date.desc.nullslast,created_at.desc",
  });
  state.cache[type] = rows || [];
  return state.cache[type];
}

async function fetchAssessment(force = false) {
  if (!force && state.cache.assessment.length) return state.cache.assessment;
  const rows = await SupaLite.list("assessment_log", { order: "sr_no.asc.nullslast,created_at.desc" });
  state.cache.assessment = rows || [];
  return state.cache.assessment;
}

// ---------------- Dashboard ----------------

async function renderDashboard(view) {
  const [chips, wood] = await Promise.all([fetchLogEntries("euca_chips"), fetchLogEntries("euco_wood")]);

  const sum = (rows, key) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  const count = (rows) => rows.length;

  const totalTrucks = count(chips) + count(wood);
  const totalMargin = sum(chips, "margin_pnl") + sum(wood, "margin_pnl");
  const totalReceived = sum(chips, "total_amount_received_itc") + sum(wood, "total_amount_received_itc");
  const totalBilled = sum(chips, "bill_amount_raised_itc") + sum(wood, "bill_amount_raised_itc");
  const pending = totalBilled - totalReceived;
  const totalGst = sum(chips, "gst_amount") + sum(wood, "gst_amount");

  const now = new Date();
  const isThisMonth = (r) => {
    if (!r.dispatch_date) return false;
    const d = new Date(r.dispatch_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const thisMonthTrucks = chips.filter(isThisMonth).length + wood.filter(isThisMonth).length;

  view.innerHTML = `
    <div class="section-title">Overview</div>
    <div class="stat-grid">
      <div class="stat-tile"><div class="label">Total Trucks</div><div class="value">${totalTrucks}</div></div>
      <div class="stat-tile"><div class="label">This Month</div><div class="value">${thisMonthTrucks}</div></div>
      <div class="stat-tile"><div class="label">Total Margin</div><div class="value ${totalMargin >= 0 ? "positive" : "negative"}">${fmtMoney(totalMargin)}</div></div>
      <div class="stat-tile"><div class="label">Pending from ITC</div><div class="value ${pending > 0 ? "negative" : ""}">${fmtMoney(pending)}</div></div>
      <div class="stat-tile"><div class="label">Total Received</div><div class="value">${fmtMoney(totalReceived)}</div></div>
      <div class="stat-tile"><div class="label">Total Billed</div><div class="value">${fmtMoney(totalBilled)}</div></div>
      <div class="stat-tile"><div class="label">Total GST</div><div class="value">${fmtMoney(totalGst)}</div></div>
      <div class="stat-tile"><div class="label">Euca Chips / Euco Wood</div><div class="value" style="font-size:1rem;">${count(chips)} / ${count(wood)}</div></div>
    </div>

    <div class="section-title">Recent Entries</div>
    ${renderEntryCards([...chips.slice(0, 3), ...wood.slice(0, 3)].sort((a, b) => new Date(b.dispatch_date || 0) - new Date(a.dispatch_date || 0)).slice(0, 5))}
  `;
}

// ---------------- Entry form ----------------

async function renderEntry(view, editRow = null) {
  const type = editRow ? editRow.log_type : state.materialType;
  const isEdit = !!editRow;

  const sectionsHtml = LOG_ENTRY_SECTIONS.map((section, i) => {
    const fieldsHtml = section.fields
      .map((f) => {
        const val = editRow ? editRow[f.key] ?? "" : "";
        return `
          <div class="field">
            <label for="f-${f.key}">${f.label}</label>
            <input id="f-${f.key}" name="${f.key}" type="${f.type}" ${f.step ? `step="${f.step}"` : ""} value="${escapeHtml(val)}" ${f.required ? "required" : ""} />
          </div>`;
      })
      .join("");
    return `
      <details class="form-section" ${i === 0 ? "open" : ""}>
        <summary>${section.title}</summary>
        <div class="fields">${fieldsHtml}</div>
      </details>`;
  }).join("");

  view.innerHTML = `
    <div class="section-title">${isEdit ? "Edit Entry" : "New Log Entry"}</div>
    <div class="material-toggle">
      <button type="button" data-type="euca_chips" class="${type === "euca_chips" ? "active" : ""}">Euca Chips</button>
      <button type="button" data-type="euco_wood" class="${type === "euco_wood" ? "active" : ""}">Euco Wood</button>
    </div>
    <form id="entry-form">
      ${sectionsHtml}
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" id="entry-submit">${isEdit ? "Save Changes" : "Add Entry"}</button>
        ${isEdit ? `<button type="button" class="btn btn-danger" id="entry-delete">Delete</button>` : ""}
      </div>
    </form>
  `;

  let activeType = type;
  view.querySelectorAll(".material-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeType = btn.dataset.type;
      view.querySelectorAll(".material-toggle button").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // auto-calc weight loss
  const piInput = view.querySelector("#f-weight_pi_yard_mt");
  const itcInput = view.querySelector("#f-weight_itc_yard");
  const lossInput = view.querySelector("#f-weight_loss");
  const recalcLoss = () => {
    const pi = parseFloat(piInput.value);
    const itc = parseFloat(itcInput.value);
    if (!Number.isNaN(pi) && !Number.isNaN(itc)) lossInput.value = (pi - itc).toFixed(3);
  };
  if (piInput && itcInput) {
    piInput.addEventListener("input", recalcLoss);
    itcInput.addEventListener("input", recalcLoss);
  }

  // auto-calc margin
  const recalcMargin = () => {
    const received = parseFloat(view.querySelector("#f-total_amount_received_itc").value) || 0;
    const materialCost = parseFloat(view.querySelector("#f-material_cost").value) || 0;
    const transportPaid = parseFloat(view.querySelector("#f-total_payment_to_transport").value) || 0;
    const gst = parseFloat(view.querySelector("#f-gst_amount").value) || 0;
    const marginInput = view.querySelector("#f-margin_pnl");
    if (received) marginInput.value = (received - materialCost - transportPaid - gst).toFixed(2);
  };
  ["total_amount_received_itc", "material_cost", "total_payment_to_transport", "gst_amount"].forEach((key) => {
    const el = view.querySelector(`#f-${key}`);
    if (el) el.addEventListener("change", recalcMargin);
  });

  view.querySelector("#entry-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("entry-submit");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-inline"></span>Saving…`;
    try {
      const payload = { log_type: activeType };
      allLogEntryFields().forEach((f) => {
        const el = view.querySelector(`#f-${f.key}`);
        let v = el.value;
        if (v === "") v = null;
        else if (f.type === "number") v = Number(v);
        payload[f.key] = v;
      });

      if (isEdit) {
        await SupaLite.update("log_entries", editRow.id, payload);
        showToast("Entry updated ✓");
      } else {
        await SupaLite.insert("log_entries", payload);
        showToast("Entry added ✓");
      }
      state.cache.euca_chips = [];
      state.cache.euco_wood = [];
      state.materialType = activeType;
      location.hash = "#history";
    } catch (err) {
      showToast(err.message, 4000);
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? "Save Changes" : "Add Entry";
    }
  });

  const delBtn = view.querySelector("#entry-delete");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this entry? This can't be undone.")) return;
      try {
        await SupaLite.remove("log_entries", editRow.id);
        state.cache.euca_chips = [];
        state.cache.euco_wood = [];
        showToast("Entry deleted");
        location.hash = "#history";
      } catch (err) {
        showToast(err.message, 4000);
      }
    });
  }
}

// ---------------- History ----------------

function renderEntryCards(rows) {
  if (!rows.length) return `<div class="empty-state">Koi entry nahi mili.</div>`;
  return rows
    .map(
      (r) => `
    <div class="entry-card" data-id="${r.id}" data-type="${r.log_type}">
      <div class="row1">
        <span class="truck">${escapeHtml(r.truck_number || "—")}</span>
        <span class="material-tag">${materialLabel(r.log_type)}</span>
      </div>
      <div class="meta">${escapeHtml(r.transporter_name || "")} • Dispatch: ${fmtDate(r.dispatch_date)}</div>
      <div class="figures">
        <div><span class="f-label">Weight:</span><span class="f-value">${fmtNum(r.weight_itc_yard, " MT")}</span></div>
        <div><span class="f-label">Margin:</span><span class="f-value">${fmtMoney(r.margin_pnl)}</span></div>
        <div><span class="f-label">Received:</span><span class="f-value">${fmtMoney(r.total_amount_received_itc)}</span></div>
      </div>
    </div>`
    )
    .join("");
}

async function renderHistory(view) {
  const [chips, wood] = await Promise.all([fetchLogEntries("euca_chips"), fetchLogEntries("euco_wood")]);

  view.innerHTML = `
    <div class="section-title">History</div>
    <div class="filters">
      <select id="filter-type">
        <option value="all">All Materials</option>
        <option value="euca_chips">Euca Chips</option>
        <option value="euco_wood">Euco Wood</option>
      </select>
      <input id="filter-search" type="search" placeholder="Truck no. / transporter" />
    </div>
    <div id="history-list"></div>
  `;

  const listEl = view.querySelector("#history-list");
  const typeSel = view.querySelector("#filter-type");
  const searchInput = view.querySelector("#filter-search");

  const draw = () => {
    let rows = [...chips, ...wood];
    if (typeSel.value !== "all") rows = rows.filter((r) => r.log_type === typeSel.value);
    const q = searchInput.value.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) => (r.truck_number || "").toLowerCase().includes(q) || (r.transporter_name || "").toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => new Date(b.dispatch_date || 0) - new Date(a.dispatch_date || 0));
    listEl.innerHTML = renderEntryCards(rows);
    listEl.querySelectorAll(".entry-card").forEach((card) => {
      card.addEventListener("click", async () => {
        const id = card.dataset.id;
        const type = card.dataset.type;
        const rows = await fetchLogEntries(type);
        const row = rows.find((r) => String(r.id) === String(id));
        if (row) {
          location.hash = "#entry";
          setTimeout(() => renderEntry(document.getElementById("view"), row), 0);
        }
      });
    });
  };

  typeSel.addEventListener("change", draw);
  searchInput.addEventListener("input", draw);
  draw();
}

// ---------------- Assessment ----------------

async function renderAssessment(view) {
  const rows = await fetchAssessment();
  view.innerHTML = `
    <div class="section-title">Assessment Log</div>
    <div class="card">
      <form id="assessment-form">
        <div class="fields" style="display:grid; gap:12px;">
          ${ASSESSMENT_FIELDS.map(
            (f) => `
            <div class="field">
              <label for="a-${f.key}">${f.label}</label>
              <input id="a-${f.key}" type="${f.type}" ${f.step ? `step="${f.step}"` : ""} />
            </div>`
          ).join("")}
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Add Row</button>
        </div>
      </form>
    </div>
    <div class="section-title">Entries (${rows.length})</div>
    <div id="assessment-list">
      ${
        rows.length
          ? rows
              .map(
                (r) => `
        <div class="entry-card">
          <div class="row1"><span class="truck">${escapeHtml(r.truck_number || "—")}</span><span class="material-tag">Sr ${r.sr_no ?? "—"}</span></div>
          <div class="meta">${escapeHtml(r.material_loaded || "")} • ${fmtDate(r.dispatch_date)}</div>
          <div class="figures">
            <div><span class="f-label">Weight Loss:</span><span class="f-value">${fmtNum(r.weight_loss_mt, " MT")}</span></div>
            <div><span class="f-label">Received:</span><span class="f-value">${fmtMoney(r.total_amount_received)}</span></div>
            <div><span class="f-label">Diff:</span><span class="f-value">${fmtMoney(r.difference_in_credit)}</span></div>
          </div>
        </div>`
              )
              .join("")
          : `<div class="empty-state">Koi row nahi hai abhi.</div>`
      }
    </div>
  `;

  view.querySelector("#assessment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {};
    ASSESSMENT_FIELDS.forEach((f) => {
      const el = view.querySelector(`#a-${f.key}`);
      let v = el.value;
      if (v === "") v = null;
      else if (f.type === "number") v = Number(v);
      payload[f.key] = v;
    });
    try {
      await SupaLite.insert("assessment_log", payload);
      state.cache.assessment = [];
      showToast("Row added ✓");
      renderAssessment(view);
    } catch (err) {
      showToast(err.message, 4000);
    }
  });
}

// ---------------- login / logout wiring ----------------

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errBox = document.getElementById("login-error");
  const btn = document.getElementById("login-submit");
  errBox.style.display = "none";
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-inline"></span>Logging in…`;
  try {
    await SupaLite.login(email, password);
    render();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Log in";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  SupaLite.logout();
  state.cache = { euca_chips: [], euco_wood: [], assessment: [] };
  render();
});

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);

if (document.readyState !== "loading") render();
