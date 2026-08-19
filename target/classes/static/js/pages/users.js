/* pages/users.js — Manage User (Owner only, mirrors UserManagementController) */
function renderUsersPage(container) {
  if (!Session.isOwner()) {
    container.innerHTML = `<div class="empty-state"><h3>Access denied</h3><p>Only the Owner role can manage system users.</p></div>`;
    return;
  }

  renderCrudPage(container, {
    title: "Manage Users",
    subtitle: "System accounts for owners, managers and admins. (Owner access only)",
    table: "users",
    idField: "userId",
    singular: "User",
    fields: [
      { name: "username", label: "Username", required: true },
      { name: "password", label: "Password", type: "password", required: true },
      { name: "name", label: "Full Name", required: true },
      { name: "role", label: "Role", type: "select", required: true, options: ["Owner", "Manager", "Admin"] },
      { name: "contact", label: "Contact No.", placeholder: "10-digit number" },
      { name: "nic", label: "NIC No." },
      { name: "email", label: "Email", type: "email", required: true }
    ],
    columns: [
      { key: "userId", label: "ID" },
      { key: "username", label: "Username" },
      { key: "name", label: "Name" },
      { key: "role", label: "Role", render: r => `<span class="badge badge--${r.role === "Owner" ? "amber" : "blue"}">${r.role}</span>` },
      { key: "contact", label: "Contact" },
      { key: "email", label: "Email" },
      { key: "createdAt", label: "Created", render: r => Fmt.date((r.createdAt || "").slice(0, 10)) }
    ],
    searchKeys: ["username", "name", "role", "email"],
    defaultSort: (a, b) => a.userId - b.userId,
    emptyText: "No users found.",
    beforeSave(data, isEdit, id) {
      const users = DB.readAll("users");
      if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase() && (!isEdit || u.userId !== id))) {
        return { error: "Username already exists!" };
      }
      if (!Validate.isEmail(data.email)) return { error: "Please enter a valid email address." };
      if (data.contact && !Validate.isContact(data.contact)) return { error: "Contact number must be exactly 10 digits!" };
      return null;
    },
    canDelete(id) {
      if (id === Session.currentUser().userId) return { blocked: true, reason: "You cannot delete your own account while logged in." };
      return { blocked: false };
    }
  });
}
