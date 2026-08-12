/* pages/events.js — Event Bookings (mirrors EventController) */
function renderEventsPage(container) {
  const busOptions = () => DB.readAll("buses").map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber} (${b.busType})` }));

  renderCrudPage(container, {
    title: "Event Bookings",
    subtitle: "Private hires — weddings, tours, corporate charters and more.",
    table: "events",
    idField: "eventId",
    singular: "Event booking",
    fields: [
      { name: "busId", label: "Bus", type: "select", required: true, options: busOptions() },
      { name: "startLocation", label: "Start Location", required: true },
      { name: "endLocation", label: "End Location", required: true },
      { name: "eventValue", label: "Booking Value (Rs.)", type: "number", step: "0.01", required: true },
      { name: "eventDate", label: "Event Date", type: "date", required: true },
      { name: "customerName", label: "Customer Name", required: true },
      { name: "customerContact", label: "Customer Contact", required: true, placeholder: "10-digit number" },
      { name: "customerNic", label: "Customer NIC", required: true },
      { name: "customerAddress", label: "Customer Address", required: true, wide: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "eventCompleted", label: "Completed", type: "checkbox", checkLabel: "Mark this event as completed" }
    ],
    columns: [
      { key: "eventId", label: "ID" },
      { key: "customerName", label: "Customer" },
      { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
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
      if (!Validate.isNic(data.customerNic)) return { error: "Invalid customer NIC format!" };
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); row.updatedAt = DB.nowISO(); },
    onUpdate(row) { row.updatedAt = DB.nowISO(); }
  });
}
