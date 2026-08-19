/* pages/busCalendar.js — Bus Booking Calendar View. Visual month grid
   supplementing the Manage Trip table view — quickly see which bus is
   busy on which day (from both Trips and Event Bookings) to avoid
   double-booking a bus for the same day. */
function renderBusCalendarPage(container) {
  let cursor = new Date(); cursor.setDate(1);

  function bookingsForMonth(year, month) {
    // month is 0-indexed
    const pad = n => String(n).padStart(2, "0");
    const prefix = `${year}-${pad(month + 1)}-`;
    const byDay = {};
    DB.readAll("trips").filter(t => (t.tripDate || "").startsWith(prefix)).forEach(t => {
      const day = Number(t.tripDate.slice(8, 10));
      (byDay[day] || (byDay[day] = [])).push({ kind: "Trip", busId: t.busId, text: `${t.startLocation} → ${t.endLocation}` });
    });
    DB.readAll("events").filter(e => (e.eventDate || "").startsWith(prefix)).forEach(e => {
      const day = Number(e.eventDate.slice(8, 10));
      (byDay[day] || (byDay[day] = [])).push({ kind: "Event", busId: e.busId, text: `${e.startLocation || ""} → ${e.endLocation || ""}` });
    });
    return byDay;
  }

  function render() {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay = bookingsForMonth(year, month);
    const today = new Date();
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push("<div class=\"cal-cell cal-cell--empty\"></div>");
    for (let d = 1; d <= daysInMonth; d++) {
      const bookings = byDay[d] || [];
      const busNumbers = [...new Set(bookings.map(b => Q.busNumber(b.busId)))];
      cells.push(`
        <div class="cal-cell ${isToday(d) ? "cal-cell--today" : ""}" data-day="${d}">
          <div class="cal-cell__date">${d}</div>
          <div class="cal-cell__chips">
            ${busNumbers.slice(0, 3).map(n => `<span class="badge badge--blue" style="font-size:10px;">${Fmt.escapeHtml(n)}</span>`).join("")}
            ${busNumbers.length > 3 ? `<span class="muted" style="font-size:10px;">+${busNumbers.length - 3} more</span>` : ""}
          </div>
        </div>`);
    }

    container.innerHTML = `
      <div class="page-head">
        <div><h2>Bus Booking Calendar</h2><p class="muted">Trips and event bookings by day — click a day to see who's booked.</p></div>
      </div>
      <div class="card">
        <div class="table-toolbar">
          <button class="btn btn--secondary btn--sm" id="calPrev">← Prev</button>
          <h3 style="margin:0;">${monthLabel}</h3>
          <button class="btn btn--secondary btn--sm" id="calNext">Next →</button>
        </div>
        <div class="cal-weekdays">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div>${d}</div>`).join("")}</div>
        <div class="cal-grid">${cells.join("")}</div>
      </div>
      <div id="calDayDetail"></div>`;

    qs("#calPrev").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() - 1); render(); });
    qs("#calNext").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() + 1); render(); });
    qsa(".cal-cell[data-day]", container).forEach(cell => {
      cell.addEventListener("click", () => showDayDetail(Number(cell.dataset.day), byDay[Number(cell.dataset.day)] || [], year, month));
    });
  }

  function showDayDetail(day, bookings, year, month) {
    const dateLabel = new Date(year, month, day).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    qs("#calDayDetail").innerHTML = `
      <div class="card" style="margin-top:14px;">
        <div class="card__head"><h3>${dateLabel}</h3></div>
        <div style="padding:0 16px 16px;">
          ${bookings.length ? bookings.map(b => `
            <div style="display:flex; align-items:center; gap:10px; padding:6px 0; border-bottom:1px solid var(--border-soft);">
              <span class="badge badge--${b.kind === "Trip" ? "blue" : "green"}">${b.kind}</span>
              <strong>${Fmt.escapeHtml(Q.busNumber(b.busId))}</strong>
              <span class="muted">${Fmt.escapeHtml(b.text)}</span>
            </div>`).join("") : `<p class="muted">No bookings this day.</p>`}
        </div>
      </div>`;
  }

  render();
}
