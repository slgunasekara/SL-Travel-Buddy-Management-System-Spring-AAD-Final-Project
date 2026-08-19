/* pages/busTimeline.js — Per-Bus 360° View. Reached via the 🕒 icon on
   Manage Bus (bus.js -> onTimeline), navigating to
   #/bus-timeline?busId=<id>. Pulls trips + maintenance + parts + accidents
   + events for that bus into one chronological feed instead of hunting
   across separate pages. */
function renderBusTimelinePage(container) {
  const busId = Number(new URLSearchParams(location.hash.split("?")[1] || "").get("busId"));
  const bus = DB.readAll("buses").find(b => b.busId === busId);

  if (!bus) {
    container.innerHTML = `<div class="empty-state"><h3>Bus not found</h3><p>Go back to Manage Bus and click the 🕒 icon on a bus row.</p></div>`;
    return;
  }

  const events = [];
  DB.readAll("trips").filter(t => t.busId === busId).forEach(t =>
    events.push({ date: t.tripDate, type: "Trip", tone: "blue", text: `${t.startLocation} → ${t.endLocation} (${t.tripCategory}) — ${Fmt.money(t.totalIncome)}` }));
  DB.readAll("maintenance").filter(m => m.busId === busId).forEach(m =>
    events.push({ date: m.serviceDate, type: "Maintenance", tone: "amber", text: `${m.maintenanceType} — ${Fmt.money(m.cost)}${m.technician ? " · " + m.technician : ""}` }));
  DB.readAll("partPurchases").filter(p => p.busId === busId).forEach(p =>
    events.push({ date: p.date, type: "Part Purchase", tone: "amber", text: `${p.partName} × ${p.quantity} — ${Fmt.money(p.totalCost)}` }));
  DB.readAll("accidents").filter(a => a.busId === busId).forEach(a =>
    events.push({ date: a.accidentDate, type: "Accident", tone: "red", text: `${a.location || ""} — est. ${Fmt.money(a.estimatedCost)}` }));
  DB.readAll("events").filter(e => e.busId === busId).forEach(e =>
    events.push({ date: e.eventDate, type: "Event Booking", tone: "green", text: `${e.startLocation || ""} → ${e.endLocation || ""} — ${Fmt.money(e.eventValue)}` }));
  DB.readAll("insurances").filter(i => i.busId === busId).forEach(i =>
    events.push({ date: i.startDate, type: "Insurance", tone: "gray", text: `${i.insuranceCompany} — ${Fmt.money(i.amountPaid)} (expires ${Fmt.date(i.expireDate)})` }));
  DB.readAll("licenses").filter(l => l.busId === busId).forEach(l =>
    events.push({ date: l.startDate, type: "License Renewal", tone: "gray", text: `${Fmt.money(l.renewalCost)} (expires ${Fmt.date(l.expireDate)})` }));

  events.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const totalIncome = DB.readAll("trips").filter(t => t.busId === busId).reduce((s, t) => s + (Number(t.totalIncome) || 0), 0);

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h2>${Fmt.escapeHtml(bus.busNumber)} — Timeline</h2>
        <p class="muted">${Fmt.escapeHtml(bus.busBrandName || "")} · every trip, service, part purchase, accident, and document event for this bus, newest first.</p>
      </div>
      <button class="btn btn--secondary" id="btnBackToBuses">← Back to Manage Bus</button>
      <button class="btn btn--danger" id="btnRetireBus">Retire &amp; Sell This Bus</button>
    </div>
    <div class="li-summary-cards">
      <div class="li-summary-card"><span class="muted">Total Trips</span><span class="li-summary-card__value">${DB.readAll("trips").filter(t => t.busId === busId).length}</span></div>
      <div class="li-summary-card"><span class="muted">Lifetime Trip Income</span><span class="li-summary-card__value">${Fmt.money(totalIncome)}</span></div>
      <div class="li-summary-card"><span class="muted">Timeline Events</span><span class="li-summary-card__value">${events.length}</span></div>
    </div>
    <div class="timeline">
      ${events.length ? events.map(e => `
        <div class="timeline__item">
          <div class="timeline__dot badge--${e.tone}"></div>
          <div class="timeline__content">
            <div class="timeline__meta"><span class="badge badge--${e.tone}">${e.type}</span><span class="muted">${Fmt.date(e.date)}</span></div>
            <div>${Fmt.escapeHtml(e.text)}</div>
          </div>
        </div>`).join("") : `<div class="empty-state"><p>No activity recorded for this bus yet.</p></div>`}
    </div>`;

  qs("#btnBackToBuses").addEventListener("click", () => { location.hash = "#/buses"; });
  qs("#btnRetireBus").addEventListener("click", () => showRetireModal(bus));
}

function showRetireModal(bus) {
  // Bus Retirement/Sale Workflow — lifetime P&L is computed over the bus's
  // entire history (not just the current Reports date range), then the
  // sale is recorded permanently and the bus itself is soft-deleted
  // (same as any other "delete", so it disappears from active fleet
  // lists but is still recoverable from Settings → Recently Deleted).
  const lifetime = Q.profitPerBus("2000-01-01", DB.today()).find(r => r.busId === bus.busId)
    || { income: 0, expenses: 0, profit: 0 };

  openModal({
    title: `Retire & Sell ${bus.busNumber}`,
    bodyHtml: `
      <p class="muted">Lifetime trip income: <strong>${Fmt.money(lifetime.income)}</strong> · Lifetime costs: <strong>${Fmt.money(lifetime.expenses)}</strong> · Lifetime profit: <strong>${Fmt.money(lifetime.profit)}</strong></p>
      <div class="form-field"><label>Sale Price (Rs.)</label><input type="number" step="0.01" id="rt_salePrice" /></div>
      <div class="form-field"><label>Sale Date</label><input type="date" id="rt_saleDate" value="${DB.today()}" /></div>
      <p class="muted">This will remove ${bus.busNumber} from the active fleet. It can be restored later from Settings → Recently Deleted if needed.</p>`,
    footerHtml: `<button class="btn btn--secondary" id="rt_cancel">Cancel</button><button class="btn btn--danger" id="rt_confirm">Confirm Retirement</button>`,
    onMount(overlay, close) {
      qs("#rt_cancel", overlay).addEventListener("click", close);
      qs("#rt_confirm", overlay).addEventListener("click", async () => {
        const salePrice = Number(qs("#rt_salePrice", overlay).value);
        const saleDate = qs("#rt_saleDate", overlay).value;
        if (!Validate.isNonNegativeNumber(salePrice) || !saleDate) {
          Toast.error("Enter a valid sale price and date.");
          return;
        }
        const ok = await confirmDialog({ title: "Confirm Retirement", message: `Retire ${bus.busNumber} and record this sale? This cannot be easily undone.`, okText: "Retire Bus", danger: true });
        if (!ok) return;

        const saleRows = DB.readAll("busSaleRecords");
        const newSale = {
          saleId: DB.nextId("busSaleRecords"), busId: bus.busId, busNumberAtSale: bus.busNumber,
          salePrice, saleDate, lifetimeIncome: lifetime.income, lifetimeExpense: lifetime.expenses, lifetimeProfit: lifetime.profit,
          createdBy: Session.currentUser().userId, createdAt: DB.nowISO()
        };
        DB.writeAll("busSaleRecords", [...saleRows, newSale]);

        const remainingBuses = DB.readAll("buses").filter(b => b.busId !== bus.busId);
        DB.writeAll("buses", remainingBuses);

        Toast.success(`${bus.busNumber} retired and archived.`);
        close();
        location.hash = "#/buses";
      });
    }
  });
}
