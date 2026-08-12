/* pages/tools.js — mirrors BusManagementToolsController.
   Note: the standalone "Quick Calculator" that used to live here was
   removed since the topbar now has a global quick-access calculator
   available on every page. */
function renderToolsPage(container) {
  container.innerHTML = `
    <div class="page-head">
      <div><h2>Bus Management Tools</h2><p class="muted">Handy calculators for day-to-day fleet operations.</p></div>
    </div>

    <div class="grid-2">
      <div class="card tool-card">
        <div class="card__head"><h3>${icon("shield")} Distance Checker</h3></div>
        <div class="form-grid">
          <div class="form-field"><label>From</label><input type="text" id="distFrom" placeholder="e.g. Colombo" /></div>
          <div class="form-field"><label>To</label><input type="text" id="distTo" placeholder="e.g. Kandy" /></div>
        </div>
        <button class="btn btn--primary btn--sm" id="btnCheckDistance">Check Distance</button>
        <div class="tool-result" id="distanceResult"></div>
        <p class="muted tool-note">Looks up the driving distance via Google Maps and fills it straight into the Fuel Cost Calculator on the right.</p>
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
        <p class="muted tool-note">Opens turn-by-turn driving directions in a new tab (requires internet access).</p>
      </div>
    </div>

    <p class="muted" style="text-align:center; margin-top: 4px;">
      Need a plain calculator? Use the ${icon("tool")} icon in the top bar — it's available on every page.
    </p>`;

  /* ---- Distance Checker (stays in-page; auto-fills Fuel Cost Calculator) ---- */
  qs("#btnCheckDistance").addEventListener("click", async () => {
    const from = qs("#distFrom").value.trim();
    const to = qs("#distTo").value.trim();
    if (!from || !to) { Toast.warning("Please enter both locations."); return; }

    const btn = qs("#btnCheckDistance");
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Checking...";

    try {
      const km = await getDrivingDistanceKm(from, to);
      qs("#distanceResult").innerHTML = `
        <div class="result-row"><span>Driving Distance</span><strong>${km.toFixed(1)} km</strong></div>`;
      const fuelDistanceEl = qs("#fuelDistance");
      if (fuelDistanceEl) fuelDistanceEl.value = km.toFixed(1);
      Toast.success("Distance found and filled into the Fuel Cost Calculator!");
    } catch (err) {
      if (err.message === "not_configured") {
        Toast.warning("Distance Checker needs a Google Maps API key (see js/mapsConfig.js). Opening Google Maps instead.");
        window.open(`https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}`, "_blank");
      } else if (err.message === "load_failed") {
        Toast.error("Couldn't reach Google Maps. Check your internet connection and try again.");
      } else {
        Toast.error("Couldn't find a distance for those locations — double-check the spelling and try again.");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });

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
