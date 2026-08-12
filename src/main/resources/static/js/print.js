/* =========================================================================
   print.js — generates a clean, print-ready receipt in a new browser tab
   and triggers the native print dialog. No PDF library or backend needed;
   the person can "Save as PDF" from the browser's print dialog if they
   want a file.
   ========================================================================= */

const PrintReceipt = (() => {
  const SHARED_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0d2745; margin: 0; padding: 32px; background: #fff; }
  .pr-head { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #095dbd; }
  .pr-brand { font-size: 20px; font-weight: 800; color: #095dbd; margin-bottom: 2px; }
  .pr-heading { font-size: 15px; font-weight: 700; margin-top: 10px; }
  .pr-subheading { font-size: 12.5px; color: #667; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 18px 0; }
  .pr-total { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 2px solid #095dbd; }
  .pr-total-label { font-size: 13px; font-weight: 700; }
  .pr-total-value { font-size: 20px; font-weight: 800; color: #095dbd; }
  .pr-footer { margin-top: 28px; text-align: center; font-size: 11px; color: #99a; }
  .pr-print-btn { display: block; margin: 24px auto 0; padding: 10px 22px; background: #095dbd; color: #fff; border: none;
    border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  @media print { .pr-print-btn { display: none; } }`;

  function openWindow(width, height) {
    const win = window.open("", "_blank", `width=${width},height=${height}`);
    if (!win) Toast.error("Please allow pop-ups to print a receipt.");
    return win;
  }

  /** Single-record receipt: label/value rows + optional total. */
  function open({ docTitle, heading, subheading, rows, totalLabel, totalValue, footerNote }) {
    const win = openWindow(480, 720);
    if (!win) return;

    const rowsHtml = rows.map(r => `
      <tr>
        <td class="pr-label">${Fmt.escapeHtml(r.label)}</td>
        <td class="pr-value">${Fmt.escapeHtml(r.value)}</td>
      </tr>`).join("");

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${Fmt.escapeHtml(docTitle)}</title>
<style>
  ${SHARED_STYLE}
  td { padding: 8px 4px; font-size: 13px; border-bottom: 1px dashed #ccd; }
  .pr-label { color: #667; width: 45%; }
  .pr-value { font-weight: 600; text-align: right; }
</style>
</head>
<body>
  <div class="pr-head">
    <div class="pr-brand">SL Travel Buddy</div>
    <div class="pr-heading">${Fmt.escapeHtml(heading)}</div>
    ${subheading ? `<div class="pr-subheading">${Fmt.escapeHtml(subheading)}</div>` : ""}
  </div>
  <table>${rowsHtml}</table>
  ${totalLabel ? `<div class="pr-total"><span class="pr-total-label">${Fmt.escapeHtml(totalLabel)}</span><span class="pr-total-value">${Fmt.escapeHtml(totalValue)}</span></div>` : ""}
  <div class="pr-footer">${footerNote ? Fmt.escapeHtml(footerNote) : "Thank you for choosing SL Travel Buddy!"}<br>Generated ${new Date().toLocaleString("en-GB")}</div>
  <button class="pr-print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`);
    win.document.close();
    win.focus();
  }

  /** Multi-row table receipt, for Reports (a list of records, not one). */
  function tablePrint({ docTitle, heading, subheading, columns, rows, totalLabel, totalValue }) {
    const win = openWindow(760, 820);
    if (!win) return;

    const headHtml = columns.map(c => `<th>${Fmt.escapeHtml(c)}</th>`).join("");
    const bodyHtml = rows.length
      ? rows.map(r => `<tr>${r.map(v => `<td>${Fmt.escapeHtml(String(v ?? "-"))}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${columns.length}" style="text-align:center;color:#99a;padding:20px;">No data in this range.</td></tr>`;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${Fmt.escapeHtml(docTitle)}</title>
<style>
  ${SHARED_STYLE}
  th, td { padding: 7px 8px; font-size: 12px; border-bottom: 1px solid #e0e6ee; text-align: left; }
  th { background: #eef6ff; color: #095dbd; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; }
  tr:nth-child(even) td { background: #fafcff; }
</style>
</head>
<body>
  <div class="pr-head">
    <div class="pr-brand">SL Travel Buddy</div>
    <div class="pr-heading">${Fmt.escapeHtml(heading)}</div>
    ${subheading ? `<div class="pr-subheading">${Fmt.escapeHtml(subheading)}</div>` : ""}
  </div>
  <table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>
  ${totalLabel ? `<div class="pr-total"><span class="pr-total-label">${Fmt.escapeHtml(totalLabel)}</span><span class="pr-total-value">${Fmt.escapeHtml(totalValue)}</span></div>` : ""}
  <div class="pr-footer">Generated ${new Date().toLocaleString("en-GB")}</div>
  <button class="pr-print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`);
    win.document.close();
    win.focus();
  }

  function eventReceipt(ev, busNumber) {
    open({
      docTitle: `Booking Receipt - ${ev.customerName}`,
      heading: "Event Booking Receipt",
      subheading: `Booking #${ev.eventId}`,
      rows: [
        { label: "Customer Name", value: ev.customerName },
        { label: "Contact", value: ev.customerContact },
        { label: "NIC", value: ev.customerNic },
        { label: "Address", value: ev.customerAddress },
        { label: "Bus", value: busNumber },
        { label: "Route", value: `${ev.startLocation} → ${ev.endLocation}` },
        { label: "Event Date", value: Fmt.date(ev.eventDate) },
        { label: "Status", value: ev.eventCompleted ? "Completed" : "Pending" },
        ...(ev.description ? [{ label: "Notes", value: ev.description }] : [])
      ],
      totalLabel: "Booking Value",
      totalValue: Fmt.money(ev.eventValue)
    });
  }

  function tripReceipt(trip, busNumber, crewNames) {
    open({
      docTitle: `Trip Receipt - #${trip.tripId}`,
      heading: "Trip Summary Receipt",
      subheading: `Trip #${trip.tripId}`,
      rows: [
        { label: "Category", value: trip.tripCategory },
        { label: "Bus", value: busNumber },
        { label: "Route", value: `${trip.startLocation} → ${trip.endLocation}` },
        { label: "Distance", value: trip.distance ? `${trip.distance} km` : "-" },
        { label: "Trip Date", value: Fmt.date(trip.tripDate) },
        { label: "Crew", value: crewNames || "Unassigned" },
        ...(trip.description ? [{ label: "Notes", value: trip.description }] : [])
      ],
      totalLabel: "Total Income",
      totalValue: Fmt.money(trip.totalIncome)
    });
  }

  function busReceipt(b) {
    open({
      docTitle: `Bus Record - ${b.busNumber}`,
      heading: "Bus Record",
      subheading: `Bus #${b.busId}`,
      rows: [
        { label: "Brand", value: b.busBrandName },
        { label: "Bus Number", value: b.busNumber },
        { label: "Type", value: b.busType },
        { label: "Seats", value: String(b.noOfSeats) },
        { label: "Status", value: b.busStatus },
        { label: "Manufacture Date", value: Fmt.date(b.manufactureDate) },
        { label: "Insurance Expiry", value: b.insuranceExpiryDate ? Fmt.date(b.insuranceExpiryDate) : "-" },
        { label: "License Renewal", value: b.licenseRenewalDate ? Fmt.date(b.licenseRenewalDate) : "-" },
        { label: "Current Mileage", value: `${Number(b.currentMileage || 0).toLocaleString()} km` }
      ]
    });
  }

  function employeeReceipt(e) {
    open({
      docTitle: `Employee Record - ${e.empName}`,
      heading: "Employee Record",
      subheading: `Employee #${e.empId}`,
      rows: [
        { label: "Name", value: e.empName },
        { label: "Category", value: e.empCategory },
        { label: "Contact", value: e.contactNo },
        { label: "NIC", value: e.nicNo },
        { label: "Address", value: e.address },
        { label: "NTC No.", value: e.ntcNo || "-" },
        { label: "Driving Licence", value: e.drivingLicenceNo || "-" },
        { label: "Join Date", value: Fmt.date(e.joinDate) },
        { label: "Status", value: e.empStatus.replace(/_/g, " ") }
      ]
    });
  }

  function salaryReceipt(s, empName) {
    open({
      docTitle: `Salary Payment - ${empName}`,
      heading: "Salary Payment Receipt",
      subheading: `Payment #${s.salaryId}`,
      rows: [
        { label: "Employee", value: empName },
        { label: "Trip", value: s.tripId ? `#${s.tripId}` : "General (not trip-linked)" },
        { label: "Date", value: Fmt.date(s.date) },
        ...(s.description ? [{ label: "Notes", value: s.description }] : [])
      ],
      totalLabel: "Amount Paid",
      totalValue: Fmt.money(s.amount)
    });
  }

  function maintenanceReceipt(m, busNumber) {
    open({
      docTitle: `Maintenance Record - ${busNumber}`,
      heading: "Maintenance Record",
      subheading: `Record #${m.maintId}`,
      rows: [
        { label: "Bus", value: busNumber },
        { label: "Type", value: (m.maintenanceType || "").replace(/_/g, " ") },
        { label: "Service Date", value: Fmt.date(m.serviceDate) },
        { label: "Mileage", value: m.mileage ? `${Number(m.mileage).toLocaleString()} km` : "-" },
        { label: "Maintained By", value: m.technician || "-" },
        ...(m.description ? [{ label: "Notes", value: m.description }] : [])
      ],
      totalLabel: "Cost",
      totalValue: Fmt.money(m.cost)
    });
  }

  function partPurchaseReceipt(p, busNumber) {
    open({
      docTitle: `Part Purchase - ${p.partName}`,
      heading: "Part Purchase Receipt",
      subheading: `Purchase #${p.purchaseId}`,
      rows: [
        { label: "Bus", value: busNumber },
        { label: "Part Name", value: p.partName },
        { label: "Quantity", value: String(p.quantity) },
        { label: "Unit Price", value: Fmt.money(p.unitPrice) },
        { label: "Supplier", value: p.supplierName },
        { label: "Date", value: Fmt.date(p.date) },
        ...(p.partDescription ? [{ label: "Notes", value: p.partDescription }] : [])
      ],
      totalLabel: "Total Cost",
      totalValue: Fmt.money(p.totalCost)
    });
  }

  function otherServiceReceipt(s, busNumber) {
    open({
      docTitle: `Service Record - ${s.serviceName}`,
      heading: "Other Service Receipt",
      subheading: `Record #${s.serviceId}`,
      rows: [
        { label: "Service", value: s.serviceName },
        ...(busNumber ? [{ label: "Bus", value: busNumber }] : []),
        ...(s.tripId ? [{ label: "Trip", value: `#${s.tripId}` }] : []),
        { label: "Date", value: Fmt.date(s.date) },
        ...(s.description ? [{ label: "Notes", value: s.description }] : [])
      ],
      totalLabel: "Cost",
      totalValue: Fmt.money(s.cost)
    });
  }

  function priceUpdateReceipt(p) {
    open({
      docTitle: `Price Update - ${p.updateType}`,
      heading: "Price Update Record",
      subheading: `Record #${p.updatePricesId}`,
      rows: [
        { label: "Type", value: p.updateType },
        { label: "Change", value: p.changeType },
        { label: "Previous Value", value: Fmt.money(p.previousValue) },
        { label: "New Value", value: Fmt.money(p.newValue) },
        { label: "Change Amount", value: Fmt.money(p.changeAmount) },
        { label: "% Change", value: `${Number(p.percentageChange).toFixed(2)}%` },
        { label: "Date", value: Fmt.date(p.changeDate) },
        ...(p.description ? [{ label: "Notes", value: p.description }] : [])
      ]
    });
  }

  function tripExpenseReceipt(e, tripLabel) {
    open({
      docTitle: `Trip Expense - ${e.tripExpType}`,
      heading: "Trip Expense Receipt",
      subheading: `Record #${e.tripExpId}`,
      rows: [
        { label: "Trip", value: tripLabel },
        { label: "Type", value: e.tripExpType },
        { label: "Date", value: Fmt.date(e.date) },
        ...(e.description ? [{ label: "Notes", value: e.description }] : [])
      ],
      totalLabel: "Amount",
      totalValue: Fmt.money(e.amount)
    });
  }

  return {
    open, tablePrint,
    eventReceipt, tripReceipt, busReceipt, employeeReceipt, salaryReceipt,
    maintenanceReceipt, partPurchaseReceipt, otherServiceReceipt,
    priceUpdateReceipt, tripExpenseReceipt
  };
})();
