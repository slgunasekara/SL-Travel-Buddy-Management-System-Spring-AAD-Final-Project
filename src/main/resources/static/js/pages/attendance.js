/* pages/attendance.js — Manager Attendance / Leave Tracking. One row per
   employee per day. Works for any employee (not just Managers), since the
   same daily present/absent/leave pattern is useful fleet-wide. */
function renderAttendancePage(container) {
  const empOptions = () => DB.readAll("employees").filter(e => e.empStatus !== "RETIRED")
    .map(e => ({ value: e.empId, label: `${e.empId} — ${e.empName} (${e.empCategory})` }));

  renderCrudPage(container, {
    title: "Attendance & Leave",
    subtitle: "Daily attendance and leave requests per employee.",
    table: "attendance",
    idField: "attendanceId",
    singular: "Attendance record",
    fields: [
      { name: "empId", label: "Employee", type: "select", required: true, options: empOptions() },
      { name: "date", label: "Date", type: "date", required: true, default: DB.today() },
      { name: "attendanceStatus", label: "Status", type: "select", required: true, default: "PRESENT", options: ["PRESENT", "ABSENT", "ON_LEAVE", "HALF_DAY"] },
      { name: "leaveType", label: "Leave Type (if on leave)", type: "select", options: ["CASUAL", "MEDICAL", "ANNUAL", "UNPAID"] },
      { name: "notes", label: "Notes", type: "textarea", wide: true }
    ],
    columns: [
      { key: "attendanceId", label: "ID" },
      { key: "empId", label: "Employee", render: r => Q.empName(r.empId) },
      { key: "date", label: "Date", render: r => Fmt.date(r.date) },
      { key: "attendanceStatus", label: "Status", render: r => `<span class="badge badge--${attendanceStatusTone(r.attendanceStatus)}">${r.attendanceStatus.replace("_", " ")}</span>` },
      { key: "leaveType", label: "Leave Type", render: r => r.leaveType || "-" },
      { key: "notes", label: "Notes", render: r => r.notes || "-" }
    ],
    searchKeys: [r => Q.empName(r.empId), "attendanceStatus", "leaveType"],
    defaultSort: (a, b) => (b.date || "").localeCompare(a.date || ""),
    emptyText: "No attendance records yet.",
    beforeSave(data, isEdit, editingId) {
      data.empId = Number(data.empId);
      if (data.attendanceStatus !== "ON_LEAVE") data.leaveType = "";
      const dup = DB.readAll("attendance").find(a => a.empId === data.empId && a.date === data.date && a.attendanceId !== editingId);
      if (dup) return { error: "An attendance record already exists for this employee on this date." };
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); }
  });
}

function attendanceStatusTone(status) {
  return { PRESENT: "green", ABSENT: "red", ON_LEAVE: "amber", HALF_DAY: "blue" }[status] || "gray";
}
