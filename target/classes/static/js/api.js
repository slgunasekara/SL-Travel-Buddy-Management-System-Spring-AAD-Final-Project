var _authToken = null;

function setAuthToken(token) {
    _authToken = token;
}

function clearAuthToken() {
    _authToken = null;
}


var API_BASE_URL = (function () {
    try {
        if (location.protocol === "file:") return "http://localhost:8080";
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
            if (location.port && location.port !== "8080") return "http://localhost:8080";
        }
        return "";
    } catch (e) {
        return "http://localhost:8080";
    }
})();

function apiUrl(url) {
    return /^https?:\/\//i.test(url) ? url : API_BASE_URL + url;
}


function apiRequest(method, url, data) {
    return new Promise(function (resolve, reject) {
        var settings = {
            url: apiUrl(url),
            method: method,
            contentType: "application/json",
            dataType: "json",
            headers: {}
        };
        if (_authToken) settings.headers["Authorization"] = "Bearer " + _authToken;
        if (data !== undefined) settings.data = JSON.stringify(data);

        $.ajax(settings)
            .done(function (payload) {
                resolve(payload);
            })
            .fail(function (jqXHR) {
                if (jqXHR.status === 0) {

                    reject({status: 0, message: "Could not reach the server. Please check your connection."});
                    return;
                }
                if (jqXHR.status === 401 && typeof Session !== "undefined" && Session.isLoggedIn()) {

                    Session.clear();
                    location.href = "index.html";
                }
                var message = (jqXHR.responseJSON && jqXHR.responseJSON.message) || ("Request failed (" + jqXHR.status + ")");
                reject({status: jqXHR.status, message: message});
            });
    });
}

function apiErrorMessage(err, fallback) {
    if (err && err.message) return err.message;
    return fallback || "Something went wrong. Please try again.";
}


function apiUploadFile(url, file) {
    return new Promise(function (resolve, reject) {
        var formData = new FormData();
        formData.append("file", file);
        var settings = {
            url: apiUrl(url),
            method: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {}
        };
        if (_authToken) settings.headers["Authorization"] = "Bearer " + _authToken;

        $.ajax(settings)
            .done(function (payload) {
                resolve(payload);
            })
            .fail(function (jqXHR) {
                var message = (jqXHR.responseJSON && jqXHR.responseJSON.message) || ("Upload failed (" + jqXHR.status + ")");
                reject({status: jqXHR.status, message: message});
            });
    });
}


function apiFetchBlob(url) {
    return new Promise(function (resolve, reject) {
        var settings = {
            url: apiUrl(url),
            method: "GET",
            xhrFields: {responseType: "blob"},
            headers: {}
        };
        if (_authToken) settings.headers["Authorization"] = "Bearer " + _authToken;

        $.ajax(settings)
            .done(function (blob) {
                resolve(blob);
            })
            .fail(function (jqXHR) {
                reject({status: jqXHR.status, message: "Failed to load the photo (" + jqXHR.status + ")"});
            });
    });
}

/* ---- Auth endpoints ---- */
var AuthApi = {
    login: function (username, password) {
        return apiRequest("POST", "/v1/auth/login", {username: username, password: password});
    },
    requestOtp: function (email) {
        return apiRequest("POST", "/v1/auth/forgot/request", {email: email});
    },
    verifyOtp: function (email, code) {
        return apiRequest("POST", "/v1/auth/forgot/verify", {email: email, code: code});
    },
    resetPassword: function (userId, email, code, newPassword) {
        return apiRequest("POST", "/v1/auth/forgot/reset", {
            userId: userId,
            email: email,
            code: code,
            newPassword: newPassword
        });
    },
    changePassword: function (currentPassword, newPassword) {
        return apiRequest("POST", "/v1/auth/change-password", {
            currentPassword: currentPassword,
            newPassword: newPassword
        });
    }
};


var RESOURCE_MAP = {
    users: {base: "/v1/user", id: "userId"},
    buses: {base: "/v1/bus", id: "busId"},
    employees: {base: "/v1/employee", id: "empId"},
    trips: {base: "/v1/trip", id: "tripId"},
    tripEmployees: {base: "/v1/trip-employee", id: "tripEmpId"},
    tripExpenses: {base: "/v1/trip-expense", id: "tripExpId"},
    employeeSalaries: {base: "/v1/salary", id: "salaryId"},
    maintenance: {base: "/v1/maintenance", id: "maintId"},
    partPurchases: {base: "/v1/part-purchase", id: "purchaseId"},
    otherServices: {base: "/v1/other-service", id: "serviceId"},
    events: {base: "/v1/event", id: "eventId"},
    updatePrices: {base: "/v1/price", id: "updatePricesId"},
    customers: {base: "/v1/customer", id: "customerId"}
};

var LoginEventApi = {
    recent: function () {
        return apiRequest("GET", "/v1/login-events/recent");
    }
};

function resourceApi(base) {
    return {
        getAll: function () {
            return apiRequest("GET", base + "/all");
        },
        add: function (payload) {
            return apiRequest("POST", base, payload);
        },
        update: function (id, payload) {
            return apiRequest("PUT", base + "/" + encodeURIComponent(id), payload);
        },
        delete: function (id) {
            return apiRequest("DELETE", base + "/" + encodeURIComponent(id));
        }
    };
}
