function renderSettingsPage(container) {
    container.innerHTML = `
    <div class="page-head">
      <div><h2>Settings</h2><p class="muted">Appearance and data management for this device.</p></div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Appearance</h4>
        <p class="muted">Choose how SL Travel Buddy looks on this device.</p>
      </div>
      <div class="settings-actions">
        <button class="btn btn--secondary" id="btnLight">☀️ Light Mode</button>
        <button class="btn btn--secondary" id="btnDark">🌙 Dark Mode</button>
      </div>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>Change Password</h4>
        <p class="muted">Update your own login password. You'll need your current password to confirm it's you.</p>
      </div>
      <form id="changePasswordForm" class="form-grid" style="padding:0 16px 16px;">
        <div class="form-field">
          <label for="cpCurrent">Current Password</label>
          <input type="password" id="cpCurrent" autocomplete="current-password" required />
        </div>
        <div class="form-field">
          <label for="cpNew">New Password</label>
          <input type="password" id="cpNew" autocomplete="new-password" required />
        </div>
        <div class="form-field">
          <label for="cpConfirm">Confirm New Password</label>
          <input type="password" id="cpConfirm" autocomplete="new-password" required />
        </div>
        <div class="settings-actions" style="grid-column:1/-1;">
          <button type="submit" class="btn btn--primary">Update Password</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="settings-section">
        <h4>About</h4>
      </div>
      <p class="muted">SL Travel Buddy — Bus Management System (Web Edition). Logged in as
        <strong>${Fmt.escapeHtml(Session.currentUser().name)}</strong> (${Fmt.escapeHtml(Session.currentUser().role)}).</p>
    </div>`;

    qs("#btnLight").addEventListener("click", () => {
        Theme.set("light");
        Toast.success("Switched to light mode.");
    });
    qs("#btnDark").addEventListener("click", () => {
        Theme.set("dark");
        Toast.success("Switched to dark mode.");
    });

    qs("#changePasswordForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const current = qs("#cpCurrent").value;
        const next = qs("#cpNew").value;
        const confirm = qs("#cpConfirm").value;
        if (!current) {
            Toast.warning("Please enter your current password.");
            return;
        }
        if (next.length < 6) {
            Toast.warning("New password must be at least 6 characters.");
            return;
        }
        if (next !== confirm) {
            Toast.warning("New password and confirmation don't match.");
            return;
        }
        if (next === current) {
            Toast.warning("New password must be different from your current password.");
            return;
        }
        const btn = qs("#changePasswordForm button[type=submit]");
        btn.disabled = true;
        try {
            await AuthApi.changePassword(current, next);
            Toast.success("Password updated! Use your new password next time you sign in.");
            qs("#changePasswordForm").reset();
        } catch (err) {
            Toast.error(apiErrorMessage(err, "Could not update your password. Please check your current password and try again."));
        } finally {
            btn.disabled = false;
        }
    });
}
