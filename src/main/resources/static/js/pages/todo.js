/* pages/todo.js — Internal To-Do List. Owner assigns tasks to any user;
   everyone sees their own assigned tasks and can move them through
   PENDING -> IN_PROGRESS -> COMPLETED. Owner additionally sees every task
   and can edit/delete. Custom page (not renderCrudPage) since the two
   roles need genuinely different views, not just different default filters. */
function renderTodoPage(container) {
  const STATUS_TONE = { PENDING: "amber", IN_PROGRESS: "blue", COMPLETED: "green" };
  const me = Session.currentUser();

  function render() {
    const all = DB.readAll("todos");
    const mine = all.filter(t => t.assignedToUserId === me.userId);
    const others = Session.isOwner() ? all.filter(t => t.assignedToUserId !== me.userId) : [];

    container.innerHTML = `
      <div class="page-head">
        <div>
          <h2>To-Do List</h2>
          <p class="muted">${Session.isOwner() ? "Assign tasks to your team and track everything in one place." : "Tasks assigned to you."}</p>
        </div>
        ${Session.isOwner() ? `<button class="btn btn--primary" id="btnNewTask">+ New Task</button>` : ""}
      </div>

      <div class="card">
        <div class="card__head"><h3>${Session.isOwner() ? "Assigned to Me" : "My Tasks"}</h3></div>
        <div id="mineHost" style="padding:0 16px 16px;"></div>
      </div>

      ${Session.isOwner() ? `
      <div class="card">
        <div class="card__head"><h3>Assigned to Others</h3></div>
        <div id="othersHost" style="padding:0 16px 16px;"></div>
      </div>` : ""}
    `;

    renderTaskList(qs("#mineHost"), mine, true);
    if (Session.isOwner()) renderTaskList(qs("#othersHost"), others, false);

    if (Session.isOwner()) qs("#btnNewTask").addEventListener("click", () => showTaskModal(null));
  }

  function renderTaskList(host, rows, canUpdateStatus) {
    if (!rows.length) {
      host.innerHTML = `<p class="muted">Nothing here.</p>`;
      return;
    }
    const sorted = [...rows].sort((a, b) => (a.todoStatus === "COMPLETED") - (b.todoStatus === "COMPLETED") || (a.dueDate || "").localeCompare(b.dueDate || ""));
    host.innerHTML = `
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Task</th><th>${Session.isOwner() ? "Assigned To" : "Assigned By"}</th><th>Due</th><th>Status</th>${Session.isOwner() ? "<th></th>" : ""}</tr></thead>
        <tbody>${sorted.map(t => `
          <tr>
            <td><strong>${Fmt.escapeHtml(t.title)}</strong>${t.description ? `<div class="muted" style="font-size:12px;">${Fmt.escapeHtml(t.description)}</div>` : ""}</td>
            <td>${Fmt.escapeHtml(Session.isOwner() ? (t.assignedToName || "-") : (t.assignedByName || "-"))}</td>
            <td>${t.dueDate ? Fmt.date(t.dueDate) : "-"}</td>
            <td>
              ${canUpdateStatus ? `
                <select class="todoStatusSelect" data-todo-id="${t.todoId}">
                  <option value="PENDING" ${t.todoStatus === "PENDING" ? "selected" : ""}>Pending</option>
                  <option value="IN_PROGRESS" ${t.todoStatus === "IN_PROGRESS" ? "selected" : ""}>In Progress</option>
                  <option value="COMPLETED" ${t.todoStatus === "COMPLETED" ? "selected" : ""}>Completed</option>
                </select>` : `<span class="badge badge--${STATUS_TONE[t.todoStatus] || "gray"}">${(t.todoStatus || "").replace("_", " ")}</span>`}
            </td>
            ${Session.isOwner() ? `<td>
              <button class="icon-btn" data-edit-id="${t.todoId}" title="Edit">✎</button>
              <button class="icon-btn icon-btn--danger" data-del-id="${t.todoId}" title="Delete">🗑</button>
            </td>` : ""}
          </tr>`).join("")}</tbody>
      </table></div>`;

    qsa(".todoStatusSelect", host).forEach(sel => {
      sel.addEventListener("change", () => updateStatus(Number(sel.dataset.todoId), sel.value));
    });
    qsa("[data-edit-id]", host).forEach(btn => {
      btn.addEventListener("click", () => showTaskModal(DB.readAll("todos").find(t => t.todoId === Number(btn.dataset.editId))));
    });
    qsa("[data-del-id]", host).forEach(btn => {
      btn.addEventListener("click", async () => {
        const ok = await confirmDialog({ title: "Delete Task", message: "Delete this task?", okText: "Delete", danger: true });
        if (!ok) return;
        const remaining = DB.readAll("todos").filter(t => t.todoId !== Number(btn.dataset.delId));
        DB.writeAll("todos", remaining);
        render();
      });
    });
  }

  function updateStatus(todoId, newStatus) {
    const rows = DB.readAll("todos").map(t => t.todoId === todoId ? { ...t, todoStatus: newStatus } : t);
    DB.writeAll("todos", rows);
    Toast.success("Status updated.");
    render();
  }

  function showTaskModal(existing) {
    const isEdit = !!existing;
    const assignees = DB.readAll("users").filter(u => u.userId !== me.userId);
    openModal({
      title: isEdit ? "Edit Task" : "New Task",
      bodyHtml: `
        <div class="form-field"><label>Title</label><input type="text" id="td_title" value="${Fmt.escapeHtml(existing?.title || "")}" /></div>
        <div class="form-field"><label>Description (optional)</label><textarea id="td_desc" rows="3">${Fmt.escapeHtml(existing?.description || "")}</textarea></div>
        <div class="form-field"><label>Assign To</label>
          <select id="td_assignee" ${isEdit ? "disabled" : ""}>
            ${assignees.map(u => `<option value="${u.userId}" ${existing?.assignedToUserId === u.userId ? "selected" : ""}>${Fmt.escapeHtml(u.name)} (${u.role})</option>`).join("")}
          </select>
        </div>
        <div class="form-field"><label>Due Date (optional)</label><input type="date" id="td_due" value="${existing?.dueDate || ""}" /></div>`,
      footerHtml: `<button class="btn btn--secondary" id="td_cancel">Cancel</button><button class="btn btn--primary" id="td_save">${isEdit ? "Save" : "Assign Task"}</button>`,
      onMount(overlay, close) {
        qs("#td_cancel", overlay).addEventListener("click", close);
        qs("#td_save", overlay).addEventListener("click", () => {
          const title = qs("#td_title", overlay).value.trim();
          if (!title) { Toast.error("Enter a task title."); return; }
          const rows = DB.readAll("todos");

          if (isEdit) {
            const updated = rows.map(t => t.todoId === existing.todoId ? {
              ...t, title, description: qs("#td_desc", overlay).value.trim(), dueDate: qs("#td_due", overlay).value || null
            } : t);
            DB.writeAll("todos", updated);
          } else {
            const assigneeId = Number(qs("#td_assignee", overlay).value);
            const assignee = assignees.find(u => u.userId === assigneeId);
            if (!assignee) { Toast.error("Select who to assign this to."); return; }
            const newTask = {
              todoId: DB.nextId("todos"),
              assignedByUserId: me.userId, assignedToUserId: assigneeId,
              assignedByName: me.name, assignedToName: assignee.name,
              title, description: qs("#td_desc", overlay).value.trim(),
              dueDate: qs("#td_due", overlay).value || null,
              todoStatus: "PENDING",
              createdBy: me.userId, createdAt: DB.nowISO()
            };
            DB.writeAll("todos", [...rows, newTask]);
          }
          Toast.success(isEdit ? "Task updated." : "Task assigned.");
          close();
          render();
        });
      }
    });
  }

  render();
}
