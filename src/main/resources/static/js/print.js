/* =========================================================================
   print.js — generates a clean, print-ready receipt in a new browser tab
   and triggers the native print dialog. No PDF library or backend needed;
   the person can "Save as PDF" from the browser's print dialog if they
   want a file.
   ========================================================================= */

const PrintReceipt = (() => {
  function open({ docTitle, heading, subheading, rows, totalLabel, totalValue, footerNote }) {
    const win = window.open("", "_blank", "width=480,height=720");
    if (!win) {
      Toast.error("Please allow pop-ups to print a receipt.");
      return;
    }

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
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0d2745; margin: 0; padding: 32px; background: #fff; }
  .pr-head { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #095dbd; }
  .pr-brand { font-size: 20px; font-weight: 800; color: #095dbd; margin-bottom: 2px; }
  .pr-heading { font-size: 15px; font-weight: 700; margin-top: 10px; }
  .pr-subheading { font-size: 12.5px; color: #667; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 18px 0; }
  td { padding: 8px 4px; font-size: 13px; border-bottom: 1px dashed #ccd; }
  .pr-label { color: #667; width: 45%; }
  .pr-value { font-weight: 600; text-align: right; }
  .pr-total { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 2px solid #095dbd; }
  .pr-total-label { font-size: 13px; font-weight: 700; }
  .pr-total-value { font-size: 20px; font-weight: 800; color: #095dbd; }
  .pr-footer { margin-top: 28px; text-align: center; font-size: 11px; color: #99a; }
  .pr-print-btn { display: block; margin: 24px auto 0; padding: 10px 22px; background: #095dbd; color: #fff; border: none;
    border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  @media print { .pr-print-btn { display: none; } }
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

  return { open, eventReceipt, tripReceipt };
})();
