/* pages/events.js — Event Bookings (mirrors EventController) */
function renderEventsPage(container) {
  const busOptions = () => DB.readAll("buses").map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber} (${b.busType})` }));

  // Only PRIVATE_TRIP trips are offered here — linking is purely a
  // reference (so you can see the actual trip record for this charter)
  // and never adds a second copy of its income to any report/dashboard
  // total. The option label already carries income/date/route so it's
  // visible right in the closed dropdown, no separate lookup needed.
  const tripOptions = () => DB.readAll("trips")
    .filter(t => t.tripCategory === "PRIVATE_TRIP")
    .map(t => ({ value: t.tripId, label: `#${t.tripId} — ${t.startLocation} → ${t.endLocation} · ${Fmt.money(t.totalIncome)} · ${Fmt.date(t.tripDate)}` }));

  function customerSuggestions() {
    const map = {};
    // Prefer records from the dedicated Customers page...
    DB.readAll("customers").forEach(c => {
      if (!c.name) return;
      map[c.name.trim().toLowerCase()] = { label: c.name, sub: c.contact || "", raw: c };
    });
    // ...and also offer anyone booked before but not yet added as a Customer record.
    DB.readAll("events").forEach(e => {
      const key = (e.customerName || "").trim().toLowerCase();
      if (key && !map[key]) {
        map[key] = { label: e.customerName, sub: e.customerContact || "", raw: { name: e.customerName, contact: e.customerContact, nic: e.customerNic, address: e.customerAddress } };
      }
    });
    return Object.values(map);
  }

  function fillCustomerFields(raw) {
    const set = (name, v) => { const el = qs("#f_" + name, container); if (el) el.value = v || ""; };
    set("customerContact", raw.contact);
    set("customerNic", raw.nic);
    set("customerAddress", raw.address);
    Toast.info(`Filled in details for ${raw.name}. Double-check before saving.`);
  }

  renderCrudPage(container, {
    title: "Event Bookings",
    subtitle: "Private hires — weddings, tours, corporate charters and more.",
    table: "events",
    idField: "eventId",
    singular: "Event booking",
    fields: [
      { name: "busId", label: "Bus", type: "select", required: true, options: busOptions() },
      { name: "linkedTripId", label: "Linked Trip (optional)", type: "select", options: tripOptions(), placeholder: "None — not linked to a Trip record" },
      { name: "startLocation", label: "Start Location", required: true, datalistOptions: SL_CITIES },
      { name: "endLocation", label: "End Location", required: true, datalistOptions: SL_CITIES },
      { name: "eventValue", label: "Booking Value (Rs.)", type: "number", step: "0.01", required: true },
      { name: "eventDate", label: "Event Date", type: "date", required: true },
      { name: "customerName", label: "Customer Name", required: true, type: "autocomplete", placeholder: "Start typing to search existing customers...", source: customerSuggestions, onPick: fillCustomerFields },
      { name: "customerContact", label: "Customer Contact", required: true, placeholder: "10-digit number" },
      { name: "customerNic", label: "Customer NIC", placeholder: "Optional" },
      { name: "customerAddress", label: "Customer Address", required: true, wide: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "eventCompleted", label: "Completed", type: "checkbox", checkLabel: "Mark this event as completed" }
    ],
    columns: [
      { key: "eventId", label: "ID" },
      { key: "customerName", label: "Customer" },
      { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
      { key: "linkedTripId", label: "Linked Trip", render: r => r.linkedTripId ? `#${r.linkedTripId}` : "-" },
      { key: "route", label: "Route", render: r => `${Fmt.escapeHtml(r.startLocation)} → ${Fmt.escapeHtml(r.endLocation)}` },
      { key: "eventDate", label: "Date", render: r => Fmt.date(r.eventDate) },
      { key: "eventValue", label: "Value", render: r => Fmt.money(r.eventValue) },
      { key: "eventCompleted", label: "Status", render: r => r.eventCompleted ? `<span class="badge badge--green">Completed</span>` : `<span class="badge badge--amber">Pending</span>` }
    ],
    searchKeys: ["customerName", "customerContact", "startLocation", "endLocation", r => Q.busNumber(r.busId)],
    defaultSort: (a, b) => b.eventDate.localeCompare(a.eventDate) || b.eventId - a.eventId,
    emptyText: "No event bookings yet.",
    beforeSave(data) {
      if (!Validate.isPositiveNumber(data.eventValue)) return { error: "Booking value must be a positive number." };
      if (!Validate.isContact(data.customerContact)) return { error: "Customer contact must be exactly 10 digits!" };
      if (data.customerNic && !Validate.isNic(data.customerNic)) return { error: "Invalid customer NIC format!" };
      data.busId = Number(data.busId);
      data.linkedTripId = data.linkedTripId === "" ? null : Number(data.linkedTripId);
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); row.updatedAt = DB.nowISO(); },
    onUpdate(row) { row.updatedAt = DB.nowISO(); },
    onPrint(row) { PrintReceipt.eventReceipt(row, Q.busNumber(row.busId)); }
  });
}
