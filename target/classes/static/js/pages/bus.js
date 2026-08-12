/* pages/bus.js — Manage Bus (mirrors ManageBusController) */
function renderBusPage(container) {
  renderCrudPage(container, {
    title: "Manage Bus",
    subtitle: "Add, update and track your fleet.",
    table: "buses",
    idField: "busId",
    singular: "Bus",
    fields: [
      { name: "busBrandName", label: "Brand Name", required: true, placeholder: "e.g. Tata, Ashok Leyland" },
      { name: "busNumber", label: "Bus Number", required: true, placeholder: "e.g. NC-1234" },
      { name: "busType", label: "Bus Type", type: "select", required: true, options: ["Non-AC", "AC", "Semi Luxury", "Luxury"] },
      { name: "noOfSeats", label: "No. of Seats", type: "number", required: true, placeholder: "e.g. 52" },
      { name: "busStatus", label: "Bus Status", type: "select", required: true, default: "Active", options: ["Active", "Maintenance", "Inactive", "Sold"] },
      { name: "manufactureDate", label: "Manufacture Date", type: "date", required: true },
      { name: "insuranceExpiryDate", label: "Insurance Expiry Date", type: "date" },
      { name: "licenseRenewalDate", label: "License Renewal Date", type: "date" },
      { name: "currentMileage", label: "Current Mileage (km)", type: "number" },
      { name: "fuelEfficiency", label: "Fuel Efficiency (km/l)", type: "number", step: "0.01", placeholder: "e.g. 5" },
      { name: "routePermitNo", label: "Route Permit No.", placeholder: "e.g. WP-NC-1234 (leave blank for charter-only buses)" },
      { name: "permitStartLocation", label: "Permit Route — Start", placeholder: "e.g. Galle" },
      { name: "permitEndLocation", label: "Permit Route — End", placeholder: "e.g. Colombo" }
    ],
    columns: [
      { key: "busId", label: "ID" },
      { key: "busBrandName", label: "Brand" },
      { key: "busNumber", label: "Number" },
      { key: "busType", label: "Type" },
      { key: "noOfSeats", label: "Seats" },
      { key: "busStatus", label: "Status", render: r => `<span class="badge badge--${statusTone(r.busStatus)}">${r.busStatus}</span>` },
      { key: "routePermit", label: "Route Permit", render: r => r.routePermitNo ? `<span class="badge badge--blue" title="${Fmt.escapeHtml(r.routePermitNo)}">${Fmt.escapeHtml(r.permitStartLocation)} → ${Fmt.escapeHtml(r.permitEndLocation)}</span>` : `<span class="muted">Charter only</span>` },
      { key: "insuranceExpiryDate", label: "Insurance", render: r => insuranceCell(r) },
      { key: "currentMileage", label: "Mileage", render: r => `${Number(r.currentMileage || 0).toLocaleString()} km` },
      { key: "fuelEfficiency", label: "Fuel Eff.", render: r => r.fuelEfficiency ? `${r.fuelEfficiency} km/l` : "-" }
    ],
    searchKeys: ["busBrandName", "busNumber", "busType", "busStatus"],
    defaultSort: (a, b) => b.busId - a.busId,
    emptyText: "No buses yet — add your first bus above.",
    csvImport: true,
    beforeSave(data, isEdit, id) {
      if (Validate.isEmpty(data.busNumber)) return { error: "Bus number is required." };
      const buses = DB.readAll("buses");
      const dup = buses.some(b => b.busNumber.toLowerCase() === data.busNumber.toLowerCase() && (!isEdit || b.busId !== id));
      if (dup) return { error: "Bus number already exists!" };
      if (!Validate.isPositiveNumber(data.noOfSeats)) return { error: "Number of seats must be a positive number." };
      if (data.manufactureDate && new Date(data.manufactureDate) > new Date()) return { error: "Manufacture date cannot be in the future!" };
      if (data.currentMileage !== "" && !Validate.isNonNegativeNumber(data.currentMileage)) return { error: "Mileage cannot be negative." };
      if (data.fuelEfficiency !== "" && !Validate.isPositiveNumber(data.fuelEfficiency)) return { error: "Fuel efficiency must be a positive number." };
      const hasPermitNo = !Validate.isEmpty(data.routePermitNo);
      const hasPermitRoute = !Validate.isEmpty(data.permitStartLocation) && !Validate.isEmpty(data.permitEndLocation);
      if (hasPermitNo && !hasPermitRoute) return { error: "Please fill in both the Permit Route start and end locations." };
      if (!hasPermitNo && (data.permitStartLocation || data.permitEndLocation)) return { error: "Please enter the Route Permit No. as well, or clear the permit route fields." };
      if (data.insuranceExpiryDate && new Date(data.insuranceExpiryDate) < new Date(new Date().toDateString())) {
        Toast.warning("Insurance expiry date is in the past — please renew the insurance.", "Insurance Warning");
      }
      if (data.licenseRenewalDate && new Date(data.licenseRenewalDate) < new Date(new Date().toDateString())) {
        Toast.warning("License renewal date is in the past — please renew the license.", "License Warning");
      }
      data.currentMileage = data.currentMileage === "" ? 0 : data.currentMileage;
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); row.updatedAt = DB.nowISO(); },
    onUpdate(row) { row.updatedAt = DB.nowISO(); },
    canDelete(id) {
      const usedByTrip = DB.readAll("trips").some(t => t.busId === id);
      const usedByEvent = DB.readAll("events").some(e => e.busId === id);
      const usedByMaintenance = DB.readAll("maintenance").some(m => m.busId === id);
      const usedByParts = DB.readAll("partPurchases").some(p => p.busId === id);
      const usedByServices = DB.readAll("otherServices").some(s => s.busId === id);
      if (usedByTrip || usedByEvent || usedByMaintenance || usedByParts || usedByServices) {
        return { blocked: true, reason: "Cannot delete this bus — it has linked trips, event bookings, maintenance records, part purchases, or other-service records." };
      }
      return { blocked: false };
    },
    onPrint(row) { PrintReceipt.busReceipt(row); }
  });
}

function statusTone(status) {
  return { Active: "green", Maintenance: "amber", Inactive: "gray", Sold: "red" }[status] || "gray";
}

function insuranceCell(r) {
  if (!r.insuranceExpiryDate) return "-";
  const expired = new Date(r.insuranceExpiryDate) < new Date(new Date().toDateString());
  return `<span class="${expired ? "text-danger" : ""}">${Fmt.date(r.insuranceExpiryDate)}${expired ? " ⚠" : ""}</span>`;
}
