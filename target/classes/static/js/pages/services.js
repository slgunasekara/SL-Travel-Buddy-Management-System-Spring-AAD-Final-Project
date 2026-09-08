async function renderServicesPage(container) {

    let busesCache = [];
    let tripsCache = [];
    try {
        const [bRes, tRes] = await Promise.all([
            apiRequest("GET", "/v1/bus/all"),
            apiRequest("GET", "/v1/trip/all")
        ]);
        busesCache = bRes.body || [];
        tripsCache = tRes.body || [];
    } catch (err) {
        Toast.error(apiErrorMessage(err, "Failed to load buses/trips."));
    }
    const busOptions = () => busesCache.map(b => ({value: b.busId, label: `${b.busId} — ${b.busNumber}`}));

    function busNumber(busId) {
        const b = busesCache.find(x => x.busId === busId);
        return b ? Fmt.escapeHtml(b.busNumber) : "-";
    }

    const tripOptions = () => tripsCache.map(t => ({
        value: t.tripId,
        label: `#${t.tripId} — ${t.startLocation} → ${t.endLocation} (${Fmt.date(t.tripDate)})`
    }));

    renderCrudPage(container, {
        title: "Other Services",
        subtitle: "Cleaning, permits, decorations and any miscellaneous cost — linked to a trip (its date is used automatically).",
        table: "otherServices",
        idField: "serviceId",
        singular: "Service",
        api: {base: "/v1/other-service"},
        fields: [
            {name: "tripId", label: "Trip", type: "select", required: true, options: tripOptions()},
            {name: "busId", label: "Bus (optional)", type: "select", options: busOptions()},
            {name: "serviceName", label: "Service Name", required: true, placeholder: "e.g. Interior Cleaning"},
            {name: "cost", label: "Cost (Rs.)", type: "number", step: "0.01", required: true},
            {name: "description", label: "Description", type: "textarea", wide: true}
        ],
        columns: [
            {key: "serviceId", label: "ID"},
            {key: "serviceName", label: "Service"},
            {key: "tripId", label: "Trip", render: r => `#${r.tripId}`},
            {key: "busId", label: "Bus", render: r => r.busId ? busNumber(r.busId) : "-"},
            {key: "cost", label: "Cost", render: r => Fmt.money(r.cost)},
            {key: "date", label: "Date", render: r => Fmt.date(r.date)}
        ],
        searchKeys: ["serviceName", "description", r => busNumber(r.busId)],
        defaultSort: (a, b) => b.serviceId - a.serviceId,
        emptyText: "No other-service records yet.",
        beforeSave(data) {
            if (!Validate.isNonNegativeNumber(data.cost)) return {error: "Cost must be a valid non-negative amount."};
            if (!data.tripId) return {error: "Please select a trip — the service date is taken from it."};
            const trip = tripsCache.find(t => t.tripId === Number(data.tripId));
            if (!trip) return {error: "Selected trip could not be found."};
            data.tripId = Number(data.tripId);
            data.busId = data.busId === "" ? null : Number(data.busId);
            data.date = trip.tripDate;
            return null;
        },
        onCreate(row) {
            row.createdBy = Session.currentUser().userId;
        },
        onPrint(row) {
            PrintReceipt.otherServiceReceipt(row, row.busId ? busNumber(row.busId) : null);
        }
    });
}
