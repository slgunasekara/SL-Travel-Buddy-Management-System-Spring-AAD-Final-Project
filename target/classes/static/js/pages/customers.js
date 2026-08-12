/* pages/customers.js — Customer Database (new, additive; does not change
   the Event Bookings page or its logic — just a dedicated place to keep
   customer records and see how many bookings they've made). */
function renderCustomersPage(container) {
  renderCrudPage(container, {
    title: "Customers",
    subtitle: "Keep track of repeat customers and their booking history.",
    table: "customers",
    idField: "customerId",
    singular: "Customer",
    fields: [
      { name: "name", label: "Full Name", required: true, placeholder: "Customer name" },
      { name: "contact", label: "Contact No.", required: true, placeholder: "10-digit number" },
      { name: "nic", label: "NIC No.", placeholder: "Optional" },
      { name: "email", label: "Email", type: "email", placeholder: "Optional" },
      { name: "address", label: "Address", type: "textarea", wide: true },
      { name: "notes", label: "Notes", type: "textarea", wide: true, placeholder: "Preferences, special requests, etc." }
    ],
    columns: [
      { key: "customerId", label: "ID" },
      { key: "name", label: "Name" },
      { key: "contact", label: "Contact" },
      { key: "nic", label: "NIC", render: r => r.nic || "-" },
      { key: "email", label: "Email", render: r => r.email || "-" },
      { key: "bookings", label: "Bookings", render: r => {
          const n = Q.customerBookingsCount(r);
          return n > 0 ? `<span class="badge badge--blue">${n} booking${n === 1 ? "" : "s"}</span>` : `<span class="badge badge--gray">No bookings yet</span>`;
        }
      }
    ],
    searchKeys: ["name", "contact", "nic", "email"],
    defaultSort: (a, b) => b.customerId - a.customerId,
    emptyText: "No customers yet — add your first customer above.",
    beforeSave(data) {
      if (data.contact && !Validate.isContact(data.contact)) return { error: "Contact number must be exactly 10 digits!" };
      if (data.nic && !Validate.isNic(data.nic)) return { error: "Invalid NIC format! Use 9 digits + V, or 12 digits." };
      if (data.email && !Validate.isEmail(data.email)) return { error: "Please enter a valid email address." };
      return null;
    },
    onCreate(row) { row.createdBy = Session.currentUser().userId; row.createdAt = DB.nowISO(); }
  });
}
