/* pages/financial.js — "Financial" page, currently home to the Bus Loan
   module (Add Loan / Monthly Payment / Check Loan Details). Structured so
   more Financial tools can be added as their own tabs later. */
function renderFinancialPage(container) {
  let activeTab = "addLoan";

  const busOptions = () => DB.readAll("buses").map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber}` }));

  /** Buses that have at least one loan on file — used to restrict the Bus
   *  select on the Monthly Payment tab to buses it actually makes sense to
   *  pay against. */
  const busesWithLoanOptions = () => {
    const loanBusIds = new Set(DB.readAll("busLoans").map(l => l.busId));
    return DB.readAll("buses").filter(b => loanBusIds.has(b.busId))
      .map(b => ({ value: b.busId, label: `${b.busId} — ${b.busNumber}` }));
  };

  const loanOptionsForBus = () => DB.readAll("busLoans").map(l => ({
    value: l.loanId,
    label: `#${l.loanId} — ${Q.busNumber(l.busId)} — ${l.financialBank} (${Fmt.money(l.loanAmount)})`
  }));

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthOptions = () => MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));

  function shell() {
    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>Financial</h2>
          <p class="muted">Bus loans — add a loan, record monthly payments, and check how each loan is progressing.</p>
        </div>
      </div>
      <div class="li-tabs">
        <button class="li-tab-btn" data-tab="addLoan">Add Loan</button>
        <button class="li-tab-btn" data-tab="monthlyPayment">Monthly Payment</button>
        <button class="li-tab-btn" data-tab="checkDetails">Check Loan Details</button>
      </div>
      <div id="tabBody"></div>
    `;
    qsa(".li-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => { activeTab = btn.dataset.tab; renderActiveTab(); });
    });
    renderActiveTab();
  }

  function renderActiveTab() {
    qsa(".li-tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === activeTab));
    const tabBody = qs("#tabBody");
    if (activeTab === "addLoan") renderAddLoanTab(tabBody);
    else if (activeTab === "monthlyPayment") renderMonthlyPaymentTab(tabBody);
    else renderCheckDetailsTab(tabBody);
  }

  function renderAddLoanTab(el) {
    renderCrudPage(el, {
      title: "Add Loan",
      subtitle: "Record a loan taken out for a bus purchase.",
      table: "busLoans",
      idField: "loanId",
      singular: "Loan",
      fields: [
        { name: "busId", label: "Bus", type: "select", required: true, options: busOptions() },
        { name: "loanAmount", label: "Loan Amount (Rs.)", type: "number", step: "0.01", required: true },
        { name: "financialBank", label: "Financial / Bank", required: true, placeholder: "e.g. Commercial Bank" },
        { name: "startDate", label: "Start Date", type: "date", required: true },
        { name: "endDate", label: "End Date", type: "date", required: true }
      ],
      columns: [
        { key: "loanId", label: "ID" },
        { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
        { key: "financialBank", label: "Bank" },
        { key: "loanAmount", label: "Loan Amount", render: r => Fmt.money(r.loanAmount) },
        { key: "startDate", label: "Start", render: r => Fmt.date(r.startDate) },
        { key: "endDate", label: "End", render: r => Fmt.date(r.endDate) },
        { key: "duration", label: "Duration", render: r => `${Q.loanTermMonths(r.startDate, r.endDate)} months` }
      ],
      searchKeys: [r => Q.busNumber(r.busId), "financialBank"],
      defaultSort: (a, b) => b.loanId - a.loanId,
      emptyText: "No loans recorded yet.",
      beforeSave(data) {
        if (!Validate.isPositiveNumber(data.loanAmount)) return { error: "Loan amount must be a valid positive amount." };
        if (data.startDate && data.endDate && data.startDate > data.endDate) return { error: "End date cannot be before the start date." };
        data.busId = Number(data.busId);
        return null;
      },
      onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); }
    });
  }

  function renderMonthlyPaymentTab(el) {
    const busesWithLoans = busesWithLoanOptions();
    if (busesWithLoans.length === 0) {
      el.innerHTML = `
        <div class="page-head"><div><h2>Monthly Payment</h2><p class="muted">Record a monthly installment against an existing loan.</p></div></div>
        <div class="card empty-state">${EMPTY_STATE_ICON}<p>No buses have a loan on file yet — add one under "Add Loan" first.</p></div>`;
      return;
    }
    renderCrudPage(el, {
      title: "Monthly Payment",
      subtitle: "Record a monthly installment against an existing loan. Only buses that have a loan on file are selectable.",
      table: "loanPayments",
      idField: "paymentId",
      singular: "Payment",
      fields: [
        { name: "busId", label: "Bus (loan on file)", type: "select", required: true, options: busesWithLoans },
        { name: "loanId", label: "Loan", type: "select", required: true, options: loanOptionsForBus() },
        { name: "forMonth", label: "Month", type: "select", required: true, options: monthOptions() },
        { name: "forYear", label: "Year", type: "number", required: true, placeholder: String(new Date().getFullYear()) },
        { name: "amountPaid", label: "Amount Paid (Rs.)", type: "number", step: "0.01", required: true },
        { name: "paidDate", label: "Paid Date", type: "date", required: true }
      ],
      columns: [
        { key: "paymentId", label: "ID" },
        { key: "busId", label: "Bus", render: r => Q.busNumber(r.busId) },
        { key: "loanId", label: "Loan", render: r => `#${r.loanId}` },
        { key: "period", label: "For", render: r => `${MONTH_NAMES[r.forMonth - 1] || r.forMonth} ${r.forYear}` },
        { key: "amountPaid", label: "Amount Paid", render: r => Fmt.money(r.amountPaid) },
        { key: "paidDate", label: "Paid On", render: r => Fmt.date(r.paidDate) }
      ],
      searchKeys: [r => Q.busNumber(r.busId)],
      defaultSort: (a, b) => b.paymentId - a.paymentId,
      emptyText: "No payments recorded yet.",
      beforeSave(data) {
        if (!Validate.isPositiveNumber(data.amountPaid)) return { error: "Amount paid must be a valid positive amount." };
        if (!data.loanId) return { error: "Please select which loan this payment is for." };
        data.busId = Number(data.busId);
        data.loanId = Number(data.loanId);
        data.forMonth = Number(data.forMonth);
        data.forYear = Number(data.forYear);
        return null;
      },
      onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); }
    });
  }

  function renderCheckDetailsTab(el) {
    const loans = DB.readAll("busLoans");
    if (loans.length === 0) {
      el.innerHTML = `
        <div class="page-head"><div><h2>Check Loan Details</h2><p class="muted">See how far along each bus's loan is.</p></div></div>
        <div class="card empty-state">${EMPTY_STATE_ICON}<p>No loans recorded yet.</p></div>`;
      return;
    }
    el.innerHTML = `
      <div class="page-head"><div><h2>Check Loan Details</h2><p class="muted">Click a bus to see its full loan &amp; payment history.</p></div></div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Bus</th><th>Bank</th><th>Loan Amount</th><th>Term</th><th>Months Paid</th><th>Months Remaining</th><th>Total Paid</th></tr></thead>
        <tbody>
          ${loans.map(l => {
            const term = Q.loanTermMonths(l.startDate, l.endDate);
            const s = Q.loanPaymentsSummary(l.loanId);
            const remaining = Math.max(0, term - s.monthsPaid);
            return `<tr class="clickable-row" data-loan-id="${l.loanId}">
              <td>${Fmt.escapeHtml(Q.busNumber(l.busId))}</td>
              <td>${Fmt.escapeHtml(l.financialBank)}</td>
              <td>${Fmt.money(l.loanAmount)}</td>
              <td>${term} months</td>
              <td>${s.monthsPaid}</td>
              <td>${remaining}</td>
              <td>${Fmt.money(s.totalPaid)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table></div>
      <div id="loanDetailPanel"></div>
    `;
    qsa(".clickable-row", el).forEach(row => {
      row.style.cursor = "pointer";
      row.addEventListener("click", () => showLoanDetail(Number(row.dataset.loanId)));
    });

    function showLoanDetail(loanId) {
      const loan = loans.find(l => l.loanId === loanId);
      if (!loan) return;
      const term = Q.loanTermMonths(loan.startDate, loan.endDate);
      const s = Q.loanPaymentsSummary(loanId);
      const remaining = Math.max(0, term - s.monthsPaid);
      qs("#loanDetailPanel", el).innerHTML = `
        <div class="card" style="margin-top:16px;">
          <h3>${Fmt.escapeHtml(Q.busNumber(loan.busId))} — Loan #${loan.loanId}</h3>
          <p class="muted">${Fmt.escapeHtml(loan.financialBank)} · ${Fmt.money(loan.loanAmount)} · ${Fmt.date(loan.startDate)} → ${Fmt.date(loan.endDate)} (${term} months)</p>
          <p><strong>${s.monthsPaid}</strong> of <strong>${term}</strong> months paid — <strong>${remaining}</strong> remaining. Total paid: <strong>${Fmt.money(s.totalPaid)}</strong></p>
          ${s.payments.length ? `
            <table class="data-table">
              <thead><tr><th>For</th><th>Amount</th><th>Paid On</th></tr></thead>
              <tbody>
                ${s.payments.sort((a, b) => (b.forYear - a.forYear) || (b.forMonth - a.forMonth)).map(p => `
                  <tr><td>${MONTH_NAMES[p.forMonth - 1] || p.forMonth} ${p.forYear}</td><td>${Fmt.money(p.amountPaid)}</td><td>${Fmt.date(p.paidDate)}</td></tr>
                `).join("")}
              </tbody>
            </table>` : `<p class="muted">No payments recorded against this loan yet.</p>`}
        </div>`;
    }
  }

  shell();
}
