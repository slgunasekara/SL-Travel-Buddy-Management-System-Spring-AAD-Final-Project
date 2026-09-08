(function () {
    if (!Session.isLoggedIn()) {
        location.href = "index.html";
        return;
    }
    setAuthToken(Session.token());

    const loader = document.getElementById("bootLoader");

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
    if (typeof Chat !== "undefined") Chat.init();
})();
