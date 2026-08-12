/* pages/tools.js — mirrors BusManagementToolsController */
function renderToolsPage(container) {
  container.innerHTML = `
    <div class="page-head">
      <div><h2>Bus Management Tools</h2><p class="muted">Handy calculators for day-to-day fleet operations.</p></div>
    </div>

    <div class="grid-2">
      <div class="card tool-card">
        <div class="card__head"><h3>${icon("tool")} Quick Calculator</h3></div>
        <div class="calc-display" id="calcDisplay">0</div>
        <div class="calc-grid" id="calcGrid"></div>
      </div>

      <div class="card tool-card">
        <div class="card__head"><h3>${icon("route")} Fuel Cost Calculator</h3></div>
        <div class="form-grid">
          <div class="form-field"><label>Distance (km)</label><input type="number" id="fuelDistance" step="0.01" placeholder="e.g. 250" /></div>
          <div class="form-field"><label>Fuel Efficiency (km/l)</label><input type="number" id="fuelEfficiency" step="0.01" placeholder="e.g. 5" /></div>
          <div class="form-field"><label>Fuel Price per Litre (Rs.)</label><input type="number" id="fuelPrice" step="0.01" placeholder="e.g. 450" /></div>
        </div>
        <button class="btn btn--primary btn--sm" id="btnFuelCalc">Calculate</button>
        <div class="tool-result" id="fuelResult"></div>
      </div>

      <div class="card tool-card">
        <div class="card__head"><h3>${icon("wallet")} Profit Calculator</h3></div>
        <div class="form-grid">
          <div class="form-field"><label>Total Income (Rs.)</label><input type="number" id="profitIncome" step="0.01" /></div>
          <div class="form-field"><label>Total Expenses (Rs.)</label><input type="number" id="profitExpense" step="0.01" /></div>
        </div>
        <button class="btn btn--primary btn--sm" id="btnProfitCalc">Calculate</button>
        <div class="tool-result" id="profitResult"></div>
      </div>

      <div class="card tool-card">
        <div class="card__head"><h3>${icon("calendar")} Time Duration Calculator</h3></div>
        <div class="form-grid">
          <div class="form-field"><label>Start Time</label><input type="time" id="timeStart" /></div>
          <div class="form-field"><label>End Time</label><input type="time" id="timeEnd" /></div>
        </div>
        <button class="btn btn--primary btn--sm" id="btnTimeCalc">Calculate</button>
        <div class="tool-result" id="timeResult"></div>
      </div>

      <div class="card tool-card">
        <div class="card__head"><h3>${icon("shield")} Route Finder</h3></div>
        <div class="form-grid">
          <div class="form-field"><label>From</label><input type="text" id="routeFrom" placeholder="e.g. Colombo" /></div>
          <div class="form-field"><label>To</label><input type="text" id="routeTo" placeholder="e.g. Kandy" /></div>
        </div>
        <button class="btn btn--primary btn--sm" id="btnRoute">Open in Google Maps</button>
        <p class="muted tool-note">Opens driving directions in a new tab (requires internet access).</p>
      </div>
    </div>`;

  /* ---- Quick calculator ---- */
  let expr = "";
  const display = qs("#calcDisplay");
  const keys = ["7","8","9","÷","4","5","6","×","1","2","3","-","0",".","C","+","=",""];
  qs("#calcGrid").innerHTML = ["7","8","9","÷","4","5","6","×","1","2","3","-","C","0",".","+","="]
    .map(k => `<button class="calc-btn ${["÷","×","-","+","="].includes(k) ? "calc-btn--op" : ""} ${k === "C" ? "calc-btn--clear" : ""}" data-k="${k}">${k}</button>`).join("");

  function updateDisplay() { display.textContent = expr === "" ? "0" : expr; }
  qsa("#calcGrid .calc-btn").forEach(btn => btn.addEventListener("click", () => {
    const k = btn.dataset.k;
    if (k === "C") { expr = ""; }
    else if (k === "=") {
      try {
        const safe = expr.replace(/÷/g, "/").replace(/×/g, "*");
        if (!/^[0-9+\-*/.() ]+$/.test(safe)) throw new Error("bad");
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict";return (${safe})`)();
        expr = String(Math.round(result * 100) / 100);
      } catch { expr = "Error"; }
    } else {
      expr = (expr === "Error" ? "" : expr) + k;
    }
    updateDisplay();
  }));
  updateDisplay();

  /* ---- Fuel cost calculator ---- */
  qs("#btnFuelCalc").addEventListener("click", () => {
    const distance = Number(qs("#fuelDistance").value);
    const eff = Number(qs("#fuelEfficiency").value);
    const price = Number(qs("#fuelPrice").value);
    if (!distance || !eff || !price) { Toast.warning("Please fill in all three fields."); return; }
    const litres = distance / eff;
    const cost = litres * price;
    qs("#fuelResult").innerHTML = `
      <div class="result-row"><span>Fuel Required</span><strong>${litres.toFixed(2)} L</strong></div>
      <div class="result-row"><span>Estimated Cost</span><strong>${Fmt.money(cost)}</strong></div>`;
  });

  /* ---- Profit calculator ---- */
  qs("#btnProfitCalc").addEventListener("click", () => {
    const income = Number(qs("#profitIncome").value);
    const expense = Number(qs("#profitExpense").value);
    if (qs("#profitIncome").value === "" || qs("#profitExpense").value === "") { Toast.warning("Please fill in both fields."); return; }
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    qs("#profitResult").innerHTML = `
      <div class="result-row"><span>Net Profit</span><strong class="${profit >= 0 ? "text-success" : "text-danger"}">${Fmt.money(profit)}</strong></div>
      <div class="result-row"><span>Profit Margin</span><strong>${margin.toFixed(2)}%</strong></div>`;
  });

  /* ---- Time duration calculator ---- */
  qs("#btnTimeCalc").addEventListener("click", () => {
    const start = qs("#timeStart").value;
    const end = qs("#timeEnd").value;
    if (!start || !end) { Toast.warning("Please select both start and end times."); return; }
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60), m = mins % 60;
    qs("#timeResult").innerHTML = `<div class="result-row"><span>Duration</span><strong>${h}h ${m}m</strong></div>`;
  });

  /* ---- Route finder (opens Google Maps, like Desktop.getDesktop().browse) ---- */
  qs("#btnRoute").addEventListener("click", () => {
    const from = qs("#routeFrom").value.trim();
    const to = qs("#routeTo").value.trim();
    if (!from || !to) { Toast.warning("Please enter both locations."); return; }
    const url = `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
    window.open(url, "_blank");
  });
}
