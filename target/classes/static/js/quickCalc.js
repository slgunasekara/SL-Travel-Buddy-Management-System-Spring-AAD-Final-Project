const QuickCalc = (() => {
    let panelEl = null;
    let expr = "";

    function ensurePanel() {
        if (panelEl) return panelEl;

        panelEl = document.createElement("div");
        panelEl.className = "quick-calc";
        panelEl.innerHTML = `
      <div class="quick-calc__head">
        <span class="quick-calc__title">${icon("tool")} Quick Calculator</span>
        <button type="button" class="quick-calc__close" aria-label="Close calculator">&times;</button>
      </div>
      <div class="quick-calc__display" id="qcDisplay">0</div>
      <div class="quick-calc__grid" id="qcGrid"></div>`;
        document.body.appendChild(panelEl);

        const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "C", "0", ".", "+", "="];
        qs("#qcGrid", panelEl).innerHTML = keys.map(k =>
            `<button type="button" class="qc-btn ${["÷", "×", "-", "+", "="].includes(k) ? "qc-btn--op" : ""} ${k === "C" ? "qc-btn--clear" : ""}" data-k="${k}">${k}</button>`
        ).join("");

        qsa(".qc-btn", panelEl).forEach(btn => btn.addEventListener("click", () => pressKey(btn.dataset.k)));
        qs(".quick-calc__close", panelEl).addEventListener("click", close);
        panelEl.addEventListener("click", e => e.stopPropagation());

        return panelEl;
    }

    function updateDisplay() {
        const d = qs("#qcDisplay", panelEl);
        if (d) d.textContent = expr === "" ? "0" : expr;
    }

    function pressKey(k) {
        if (k === "C") {
            expr = "";
        } else if (k === "=") {
            try {
                const safe = expr.replace(/÷/g, "/").replace(/×/g, "*");
                if (!/^[0-9+\-*/.() ]+$/.test(safe) || safe.trim() === "") throw new Error("bad");
                const result = Function(`"use strict";return (${safe})`)();
                expr = String(Math.round(result * 1e8) / 1e8);
            } catch {
                expr = "Error";
            }
        } else {
            expr = (expr === "Error" ? "" : expr) + k;
        }
        updateDisplay();
    }

    function positionPanel(triggerEl) {
        const rect = triggerEl.getBoundingClientRect();
        const panelWidth = 280;
        let right = Math.max(12, window.innerWidth - rect.right);
        if (window.innerWidth - right - panelWidth < 8) right = Math.max(8, window.innerWidth - panelWidth - 8);
        panelEl.style.top = (rect.bottom + 12) + "px";
        panelEl.style.right = right + "px";
    }

    function onDocClick(e) {
        if (panelEl && !panelEl.contains(e.target)) close();
    }

    function onKeydown(e) {
        if (e.key === "Escape") close();
    }

    function onResize() {
        close();
    }

    function open(triggerEl) {
        ensurePanel();
        expr = "";
        updateDisplay();
        positionPanel(triggerEl);
        requestAnimationFrame(() => panelEl.classList.add("open"));
        document.addEventListener("click", onDocClick, true);
        document.addEventListener("keydown", onKeydown);
        window.addEventListener("resize", onResize);
    }

    function close() {
        if (!panelEl) return;
        panelEl.classList.remove("open");
        document.removeEventListener("click", onDocClick, true);
        document.removeEventListener("keydown", onKeydown);
        window.removeEventListener("resize", onResize);
    }

    function toggle(triggerEl) {
        if (panelEl && panelEl.classList.contains("open")) {
            close();
            return;
        }
        open(triggerEl);
    }

    return {toggle, close};
})();
