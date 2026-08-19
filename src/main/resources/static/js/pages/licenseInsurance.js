/* pages/licenseInsurance.js — "License & Insurance" (was a placeholder idea
   under Manage Bus; Insurance/License Expiry Date fields have been removed
   from Manage Bus and now live here instead, each with its own history —
   a bus can have several rows over the years as policies/licenses renew).

   Three tabs, each a normal renderCrudPage table:
     - Insurance        (add insurance / renewals per bus)
     - Insurance Claims  (claim against a bus's insurance, optionally tied to an Accident)
     - License           (yearly license renewal per bus)

   Expiry reminders: the topbar bell + Dashboard "Fleet Alerts" panel both
   read this data live via Q.fleetAlerts() (see queries.js). A daily email
   digest to Owner/Manager is also sent server-side — see
   ExpiryReminderTasks.java. */
function renderLicenseInsurancePage(container) {
  let activeTab = "insurance";

  const busOptions = () => DB.readAll("buses").map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber}` }));
  const accidentOptions = () => DB.readAll("accidents").map(a => ({
    value: a.accidentId,
    label: `#${a.accidentId} — ${Q.busNumber(a.busId)} — ${a.location || ""} (${Fmt.date(a.accidentDate)})`
  }));

  function expiryBadge(dateStr) {
    if (!dateStr) return "-";
    const expired = new Date(dateStr) < new Date(new Date().toDateString());
    const soon = !expired && new Date(dateStr) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const tone = expired ? "red" : soon ? "amber" : "green";
    return `<span class="badge badge--${tone}">${Fmt.date(dateStr)}</span>`;
  }

  function renewalCostSummary() {
    const thisYear = new Date().getFullYear();
    const inThisYear = dateStr => dateStr && new Date(dateStr).getFullYear() === thisYear;
    const insuranceTotal = DB.readAll("insurances").filter(i => inThisYear(i.startDate))
      .reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
    const licenseTotal = DB.readAll("licenses").filter(l => inThisYear(l.startDate))
      .reduce((sum, l) => sum + (Number(l.renewalCost) || 0), 0);
    const claimsTotal = DB.readAll("insuranceClaims").filter(c => inThisYear(c.claimDate))
      .reduce((sum, c) => sum + (Number(c.claimAmountReceived) || 0), 0);
    return `
      <div class="li-summary-cards">
        <div class="li-summary-card"><span class="muted">Insurance paid (${thisYear})</span><span class="li-summary-card__value">${Fmt.money(insuranceTotal)}</span></div>
        <div class="li-summary-card"><span class="muted">License renewal cost (${thisYear})</span><span class="li-summary-card__value">${Fmt.money(licenseTotal)}</span></div>
        <div class="li-summary-card"><span class="muted">Insurance claims received (${thisYear})</span><span class="li-summary-card__value">${Fmt.money(claimsTotal)}</span></div>
      </div>`;
  }

  function shell() {
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>License &amp; Insurance</h2>
          <p class="muted">Bus insurance policies, insurance claims, and yearly license renewals — with automatic expiry alerts.</p>
        </div>
      </div>
      <div id="renewalSummary"></div>
      <div class="li-tabs">
        <button class="li-tab-btn" data-tab="insurance">Insurance</button>
        <button class="li-tab-btn" data-tab="claims">Insurance Claim</button>
        <button class="li-tab-btn" data-tab="license">License</button>
      </div>
      <div id="tabBody"></div>
    `;
    qs("#renewalSummary").innerHTML = renewalCostSummary();
    qsa(".li-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => { activeTab = btn.dataset.tab; renderActiveTab(); });
    });
    renderActiveTab();
  }

  function renderActiveTab() {
    qsa(".li-tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === activeTab));
    qs("#renewalSummary").innerHTML = renewalCostSummary();
    const tabBody = qs("#tabBody");
    if (activeTab === "insurance") renderInsuranceTab(tabBody);
    else if (activeTab === "claims") renderClaimsTab(tabBody);
    else renderLicenseTab(tabBody);
  }

  function renderInsuranceTab(el) {
    renderCrudPage(el, {
      title: "Insurance",
      subtitle: "Add a new policy or renewal for a bus. The latest one (by expiry date) is treated as current.",
      table: "insurances",
      idField: "insuranceId",
      singular: "Insurance record",
      fields: [
        { name: "busId", label: "Bus", type: "select", required: true, options: busOptions() },
        { name: "insuranceCompany", label: "Insurance Company", required: true, placeholder: "e.g. Sri Lanka Insurance" },
        { name: "amountPaid", label: "Amount Paid (Rs.)", type: "number", step: "0.01", required: true },
        { name: "startDate", label: "Start Date", type: "date", required: true },
        { name: "expireDate", label: "Expire Date", type: "date", required: true }
      ],
      columns: [
        { key: "insuranceId", label: "ID" },
        { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
        { key: "insuranceCompany", label: "Company" },
        { key: "amountPaid", label: "Amount Paid", render: r => Fmt.money(r.amountPaid) },
        { key: "startDate", label: "Start", render: r => Fmt.date(r.startDate) },
        { key: "expireDate", label: "Expires", render: r => expiryBadge(r.expireDate) }
      ],
      searchKeys: [r => Q.busNumber(r.busId), "insuranceCompany"],
      defaultSort: (a, b) => (b.expireDate || "").localeCompare(a.expireDate || ""),
      emptyText: "No insurance records yet.",
      beforeSave(data) {
        if (!Validate.isNonNegativeNumber(data.amountPaid)) return { error: "Amount paid must be a valid non-negative amount." };
        if (data.startDate && data.expireDate && data.startDate > data.expireDate) return { error: "Expire date cannot be before the start date." };
        data.busId = Number(data.busId);
        return null;
      },
      onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); }
    });
  }

  function renderClaimsTab(el) {
    renderCrudPage(el, {
      title: "Insurance Claim",
      subtitle: "File a claim against a bus's insurance — link it to an Accident record if it came from one.",
      table: "insuranceClaims",
      idField: "claimId",
      singular: "Insurance claim",
      fields: [
        { name: "busId", label: "Bus", type: "select", required: true, options: busOptions() },
        { name: "accidentId", label: "Related Accident (optional)", type: "select", options: accidentOptions() },
        { name: "claimAmountReceived", label: "Claim Amount Received (Rs.)", type: "number", step: "0.01", required: true },
        { name: "claimDate", label: "Claim Date", type: "date", required: true },
        { name: "description", label: "Description", type: "textarea", wide: true, placeholder: "What the claim was for" }
      ],
      columns: [
        { key: "claimId", label: "ID" },
        { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
        { key: "company", label: "Insurance Company", render: r => { const ins = Q.latestInsurance(r.busId); return ins ? ins.insuranceCompany : "<span class=\"muted\">Not on file</span>"; } },
        { key: "accidentId", label: "Accident", render: r => r.accidentId ? `#${r.accidentId}` : "-" },
        { key: "claimAmountReceived", label: "Claim Amount", render: r => Fmt.money(r.claimAmountReceived) },
        { key: "claimDate", label: "Date", render: r => Fmt.date(r.claimDate) },
        { key: "description", label: "Description" }
      ],
      searchKeys: [r => Q.busNumber(r.busId), "description"],
      defaultSort: (a, b) => b.claimId - a.claimId,
      emptyText: "No insurance claims yet.",
      beforeSave(data) {
        if (!Validate.isNonNegativeNumber(data.claimAmountReceived)) return { error: "Claim amount must be a valid non-negative amount." };
        data.busId = Number(data.busId);
        data.accidentId = data.accidentId === "" ? null : Number(data.accidentId);
        if (!Q.latestInsurance(data.busId)) {
          Toast.warning("No insurance is on file for this bus yet — the claim will still be saved.", "No Insurance On File");
        }
        return null;
      },
      onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); }
    });
  }

  function renderLicenseTab(el) {
    renderCrudPage(el, {
      title: "License",
      subtitle: "Yearly license renewal per bus — the latest one (by expiry date) is treated as current.",
      table: "licenses",
      idField: "licenseId",
      singular: "License record",
      fields: [
        { name: "busId", label: "Bus", type: "select", required: true, options: busOptions() },
        { name: "renewalCost", label: "Renewal Cost (Rs.)", type: "number", step: "0.01", required: true },
        { name: "startDate", label: "Start Date", type: "date", required: true },
        { name: "expireDate", label: "Expire Date", type: "date", required: true }
      ],
      columns: [
        { key: "licenseId", label: "ID" },
        { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
        { key: "renewalCost", label: "Renewal Cost", render: r => Fmt.money(r.renewalCost) },
        { key: "startDate", label: "Start", render: r => Fmt.date(r.startDate) },
        { key: "expireDate", label: "Expires", render: r => expiryBadge(r.expireDate) }
      ],
      searchKeys: [r => Q.busNumber(r.busId)],
      defaultSort: (a, b) => (b.expireDate || "").localeCompare(a.expireDate || ""),
      emptyText: "No license records yet.",
      beforeSave(data) {
        if (!Validate.isNonNegativeNumber(data.renewalCost)) return { error: "Renewal cost must be a valid non-negative amount." };
        if (data.startDate && data.expireDate && data.startDate > data.expireDate) return { error: "Expire date cannot be before the start date." };
        data.busId = Number(data.busId);
        return null;
      },
      onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); }
    });
  }

  shell();
}
