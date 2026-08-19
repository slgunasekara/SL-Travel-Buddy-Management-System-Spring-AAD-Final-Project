/* =========================================================================
   api.js — AJAX client that talks to the SL Travel Buddy Spring Boot
   backend (JWT-secured REST API), mirroring the api.js pattern used in the
   AMG Super Mart Spring Boot project. Every call carries the JWT (if any)
   as an Authorization: Bearer header. The token is kept in a plain JS
   variable for the lifetime of the page and restored from sessionStorage
   on load (see auth.js) so a refresh doesn't require re-typing it, but a
   closed tab still ends the session — same lifetime as Session already had.
   ========================================================================= */

var _authToken = null;

function setAuthToken(token) { _authToken = token; }
function clearAuthToken() { _authToken = null; }

/**
 * Fires an AJAX request against the backend and returns a Promise that
 * resolves to the parsed CommonResponse body ({status, body, message}),
 * or rejects with { status, message } on failure.
 */
function apiRequest(method, url, data) {
  const opts = {
    method: method,
    headers: { "Content-Type": "application/json" }
  };
  if (_authToken) opts.headers["Authorization"] = "Bearer " + _authToken;
  if (data !== undefined) opts.body = JSON.stringify(data);

  return fetch(url, opts).then(async (res) => {
    let payload = null;
    try { payload = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) {
      const message = (payload && payload.message) || ("Request failed (" + res.status + ")");
      return Promise.reject({ status: res.status, message: message });
    }
    return payload;
  }).catch((err) => {
    if (err && err.status !== undefined) return Promise.reject(err);
    // Network-level failure (server unreachable, CORS, offline, etc.)
    return Promise.reject({ status: 0, message: "Could not reach the server. Please check your connection." });
  });
}

function apiErrorMessage(err, fallback) {
  if (err && err.message) return err.message;
  return fallback || "Something went wrong. Please try again.";
}

/* ---- Auth endpoints ---- */
var AuthApi = {
  login: function (username, password) {
    return apiRequest("POST", "/v1/auth/login", { username: username, password: password });
  },
  requestOtp: function (email) {
    return apiRequest("POST", "/v1/auth/forgot/request", { email: email });
  },
  verifyOtp: function (email, code) {
    return apiRequest("POST", "/v1/auth/forgot/verify", { email: email, code: code });
  },
  resetPassword: function (userId, email, code, newPassword) {
    return apiRequest("POST", "/v1/auth/forgot/reset", { userId: userId, email: email, code: code, newPassword: newPassword });
  },
  changePassword: function (currentPassword, newPassword) {
    return apiRequest("POST", "/v1/auth/change-password", { currentPassword: currentPassword, newPassword: newPassword });
  },
  verifyTwoFactor: function (username, code) {
    return apiRequest("POST", "/v1/auth/2fa/verify", { username: username, code: code });
  },
  toggleTwoFactor: function (enabled) {
    return apiRequest("POST", "/v1/auth/2fa/toggle", { enabled: enabled });
  }
};

/**
 * Maps every localStorage-era table name to its REST resource — used by
 * db.js to transparently sync DB.readAll()/DB.writeAll() calls to the
 * backend without any of the page files needing to change.
 */
var RESOURCE_MAP = {
  users: { base: "/v1/user", id: "userId" },
  buses: { base: "/v1/bus", id: "busId" },
  employees: { base: "/v1/employee", id: "empId" },
  trips: { base: "/v1/trip", id: "tripId" },
  tripEmployees: { base: "/v1/trip-employee", id: "tripEmpId" },
  tripExpenses: { base: "/v1/trip-expense", id: "tripExpId" },
  employeeSalaries: { base: "/v1/salary", id: "salaryId" },
  maintenance: { base: "/v1/maintenance", id: "maintId" },
  partPurchases: { base: "/v1/part-purchase", id: "purchaseId" },
  otherServices: { base: "/v1/other-service", id: "serviceId" },
  events: { base: "/v1/event", id: "eventId" },
  updatePrices: { base: "/v1/price", id: "updatePricesId" },
  customers: { base: "/v1/customer", id: "customerId" },
  accidents: { base: "/v1/accident", id: "accidentId" },
  insurances: { base: "/v1/insurance", id: "insuranceId" },
  insuranceClaims: { base: "/v1/insurance-claim", id: "claimId" },
  licenses: { base: "/v1/license", id: "licenseId" },
  busLoans: { base: "/v1/bus-loan", id: "loanId" },
  loanPayments: { base: "/v1/loan-payment", id: "paymentId" },
  budgetCaps: { base: "/v1/budget-cap", id: "capId" },
  attendance: { base: "/v1/attendance", id: "attendanceId" },
  busSaleRecords: { base: "/v1/bus-sale-record", id: "saleId" },
  todos: { base: "/v1/todo", id: "todoId" }
};

var SessionsApi = {
  active: function () { return apiRequest("GET", "/v1/sessions/active"); },
  revoke: function (userId) { return apiRequest("POST", "/v1/sessions/revoke/" + encodeURIComponent(userId)); }
};

var AuditLogApi = {
  recent: function () { return apiRequest("GET", "/v1/audit-log/all"); }
};

var CompanySettingsApi = {
  get: function () { return apiRequest("GET", "/v1/company-settings"); },
  update: function (data) { return apiRequest("PUT", "/v1/company-settings", data); }
};

var RecycleBinApi = {
  all: function () { return apiRequest("GET", "/v1/recycle-bin/all"); },
  restore: function (repoBean, entityId) { return apiRequest("POST", "/v1/recycle-bin/restore", { repoBean: repoBean, entityId: entityId }); }
};

var SalaryRateHistoryApi = {
  byEmployee: function (empId) { return apiRequest("GET", "/v1/salary-rate-history/by-employee/" + encodeURIComponent(empId)); }
};

var AdminApi = {
  resetDemoData: function () { return apiRequest("POST", "/v1/admin/reset-demo-data"); }
};

var LoginEventApi = {
  recent: function () { return apiRequest("GET", "/v1/login-events/recent"); }
};

/** Uploads a single file (image/pdf) and resolves to its public URL
 *  (e.g. "/uploads/xxxx.jpg") — used for Accident photos, Insurance/
 *  License documents, and Employee/Bus document photos. */
function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const opts = { method: "POST", headers: {}, body: form };
  if (_authToken) opts.headers["Authorization"] = "Bearer " + _authToken;
  return fetch("/v1/files/upload", opts).then(async (res) => {
    let payload = null;
    try { payload = await res.json(); } catch (e) {}
    if (!res.ok) {
      const message = (payload && payload.message) || ("Upload failed (" + res.status + ")");
      return Promise.reject({ status: res.status, message: message });
    }
    return payload.body.url;
  }).catch((err) => {
    if (err && err.status !== undefined) return Promise.reject(err);
    return Promise.reject({ status: 0, message: "Could not reach the server to upload the file." });
  });
}

function resourceApi(base) {
  return {
    getAll: function () { return apiRequest("GET", base + "/all"); },
    add: function (payload) { return apiRequest("POST", base, payload); },
    update: function (id, payload) { return apiRequest("PUT", base + "/" + encodeURIComponent(id), payload); },
    delete: function (id) { return apiRequest("DELETE", base + "/" + encodeURIComponent(id)); }
  };
}
