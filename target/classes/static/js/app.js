/* app.js — registers all routes and boots the SPA shell.
   Now bootstraps the client-side cache from the Spring Boot backend
   (DB.bootstrap()) before the router renders anything, since every page
   still reads data synchronously via DB.readAll(). */
(function () {
  if (!Session.isLoggedIn()) {
    location.href = "index.html";
    return;
  }
  setAuthToken(Session.token());

  const loader = document.getElementById("bootLoader");

  DB.bootstrap().then(() => {
    Router.register("#/dashboard", renderDashboardPage);
    Router.register("#/buses", renderBusPage);
    Router.register("#/trips", renderTripsPage);
    Router.register("#/events", renderEventsPage);
    Router.register("#/customers", renderCustomersPage);
    Router.register("#/trip-expenses", renderTripExpensesPage);
    Router.register("#/employees", renderEmployeePage);
    Router.register("#/salaries", renderSalaryPage);
    Router.register("#/maintenance", renderMaintenancePage);
    Router.register("#/parts", renderPartsPage);
    Router.register("#/services", renderServicesPage);
    Router.register("#/prices", renderPricesPage);
    Router.register("#/reports", renderReportsPage);
    Router.register("#/tools", renderToolsPage);
    Router.register("#/users", renderUsersPage);
    Router.register("#/settings", renderSettingsPage);

    if (loader) loader.classList.add("hidden");
    Router.start();
    LoginWatch.start();
  }).catch(err => {
    if (loader) loader.classList.add("hidden");
    if (err && err.status === 401) {
      Session.clear();
      location.href = "index.html";
      return;
    }
    document.getElementById("app").innerHTML =
      '<div class="empty-state"><h3>Could not load data</h3><p>' +
      (apiErrorMessage(err, "Could not reach the server. Please check your connection and refresh.")) +
      '</p></div>';
  });
})();
