/* =========================================================================
   utils.js — formatting helpers, validators, toast + confirm dialog system
   (replaces JavaFX Alert dialogs from the desktop app)
   ========================================================================= */

/** Master Routes List — every major Sri Lankan city/town, spelled one
 *  consistent way. Wired in as a <datalist> on Start/End Location fields
 *  (Manage Trip, Manage Bus route permit, Events) so "Colombo" and
 *  "colombo" collapse to the same value instead of drifting into separate
 *  free-text variants that then double-count in Reports → Leaderboard →
 *  Top Routes. Plain browser-native suggestion, no server round-trip. */
const SL_CITIES = [
  "Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Sri Jayawardenepura Kotte", "Negombo",
  "Kandy", "Galle", "Jaffna", "Trincomalee", "Batticaloa", "Kalmunai", "Kurunegala",
  "Ratnapura", "Badulla", "Matara", "Anuradhapura", "Polonnaruwa", "Puttalam", "Kegalle",
  "Nuwara Eliya", "Gampaha", "Kalutara", "Panadura", "Wattala", "Ja-Ela", "Kadawatha",
  "Kelaniya", "Homagama", "Maharagama", "Kesbewa", "Piliyandala", "Kotikawatta",
  "Beruwala", "Aluthgama", "Hikkaduwa", "Ambalangoda", "Weligama", "Tangalle", "Hambantota",
  "Tissamaharama", "Embilipitiya", "Balangoda", "Avissawella", "Hatton", "Nawalapitiya",
  "Gampola", "Katugastota", "Peradeniya", "Wattegama", "Akurana", "Matale", "Dambulla",
  "Sigiriya", "Kalawana", "Elpitiya", "Baddegama", "Ampara", "Kalawanchikudy", "Eravur",
  "Valachchenai", "Chavakachcheri", "Point Pedro", "Vavuniya", "Mannar", "Kilinochchi",
  "Mullaitivu", "Chilaw", "Wennappuwa", "Marawila", "Nattandiya", "Bandarawela", "Haputale",
  "Welimada", "Mahiyanganaya", "Monaragala", "Wellawaya", "Deniyaya", "Akuressa",
  "Bentota", "Horana", "Ingiriya", "Bandaragama", "Wadduwa", "Minuwangoda", "Divulapitiya",
  "Katunayake", "Seeduwa", "Ratmalana", "Kollupitiya", "Bambalapitiya", "Wellawatte",
  "Nugegoda", "Rajagiriya", "Battaramulla", "Malabe", "Kaduwela", "Athurugiriya",
  "Ja-Ela", "Kiribathgoda", "Ragama", "Kandana", "Wennappuwa", "Puttalam", "Anamaduwa"
];

const Fmt = {
  money(n) {
    n = Number(n) || 0;
    return "Rs. " + n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  num(n) {
    n = Number(n) || 0;
    return n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  date(d) {
    if (!d) return "-";
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  },
  dateTime(iso) {
    if (!iso) return "-";
    const dt = new Date(iso);
    if (isNaN(dt)) return iso;
    return dt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  },
  monthLabel(ym) { // ym = "2025-01"
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  },
  escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
};

const Validate = {
  isEmpty(v) { return v === null || v === undefined || String(v).trim() === ""; },
  isPositiveNumber(v) { return !isNaN(v) && Number(v) > 0; },
  isNonNegativeNumber(v) { return !isNaN(v) && Number(v) >= 0; },
  isNic(v) { return /^([0-9]{9}[vVxX]|[0-9]{12})$/.test(String(v).trim()); },
  isContact(v) { return /^\d{10}$/.test(String(v).trim()); },
  isEmail(v) { return /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(v).trim()); },
  isFutureDate(v) { return v && new Date(v) > new Date(new Date().toDateString()); }
};

/* ---------------------------- Toast system ---------------------------- */
const Toast = (() => {
  let container;
  function ensure() {
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-stack";
      document.body.appendChild(container);
    }
  }
  function show(message, type = "info", title = null) {
    ensure();
    const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <div class="toast__body">
        ${title ? `<div class="toast__title">${Fmt.escapeHtml(title)}</div>` : ""}
        <div class="toast__msg">${Fmt.escapeHtml(message)}</div>
      </div>
      <button class="toast__close" aria-label="Close">&times;</button>`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast--show"));
    const remove = () => {
      el.classList.remove("toast--show");
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector(".toast__close").addEventListener("click", remove);
    setTimeout(remove, type === "error" ? 5500 : 3800);
  }
  return {
    success: (msg, title = "Success") => show(msg, "success", title),
    error: (msg, title = "Error") => show(msg, "error", title),
    warning: (msg, title = "Warning") => show(msg, "warning", title),
    info: (msg, title = "Notice") => show(msg, "info", title)
  };
})();

/* -------------------------- Confirm dialog ----------------------------- */
function confirmDialog({ title = "Please confirm", message = "Are you sure?", okText = "Confirm", cancelText = "Cancel", danger = false } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal modal--sm" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3>${Fmt.escapeHtml(title)}</h3>
        </div>
        <div class="modal__body"><p>${Fmt.escapeHtml(message)}</p></div>
        <div class="modal__footer">
          <button class="btn btn--ghost" data-act="cancel">${Fmt.escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? "btn--danger" : "btn--primary"}" data-act="ok">${Fmt.escapeHtml(okText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("show"));
    function close(result) {
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 180);
      resolve(result);
    }
    overlay.addEventListener("click", e => { if (e.target === overlay) close(false); });
    overlay.querySelector('[data-act="cancel"]').addEventListener("click", () => close(false));
    overlay.querySelector('[data-act="ok"]').addEventListener("click", () => close(true));
  });
}

/* ----------------------------- Modal form ------------------------------ */
function openModal({ title, bodyHtml, footerHtml, onMount = null, size = "" }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true">
      <div class="modal__header">
        <h3>${Fmt.escapeHtml(title)}</h3>
        <button class="modal__x" data-act="x" aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal__footer">${footerHtml}</div>` : ""}
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));
  function close() {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 180);
  }
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  overlay.querySelectorAll('[data-act="x"]').forEach(el => el.addEventListener("click", close));
  if (onMount) onMount(overlay, close);
  return { overlay, close };
}

function debounce(fn, ms = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
