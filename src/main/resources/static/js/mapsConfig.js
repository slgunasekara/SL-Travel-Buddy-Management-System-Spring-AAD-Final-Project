/* =========================================================================
   mapsConfig.js — driving-distance lookup via the Google Maps JavaScript
   API (Distance Matrix Service), used by the Tools page's Distance
   Checker.

   WHY A CONFIG FILE:
   Same reasoning as js/emailConfig.js — a Google Maps *browser* API key
   is designed to be used client-side (unlike an SMTP password), but it
   should still be restricted in the Google Cloud Console to your own
   domain(s) so nobody else can rack up usage on your billing account.

   SETUP (one-time):
   1. Go to https://console.cloud.google.com/ and create/select a project.
   2. APIs & Services → Library → enable "Maps JavaScript API" and
      "Distance Matrix API".
   3. APIs & Services → Credentials → Create Credentials → API key.
   4. Click the new key → under "Application restrictions" choose
      "Websites" and add the domain(s) you'll host this app on (or
      "localhost" while testing).
   5. Paste the key below.
   Note: Google requires billing to be enabled on the project, though
   Distance Matrix usage is very cheap for typical fleet-management use
   and Google's free monthly credit covers most small businesses.

   Until a real key is set, the Distance Checker automatically falls
   back to opening Google Maps directions in a new tab instead — it
   never breaks, it just can't show the number in-page yet.
   ========================================================================= */

const MapsConfig = {
  GOOGLE_MAPS_API_KEY: "PASTE_GOOGLE_MAPS_API_KEY_HERE"
};

function mapsConfigured() {
  return !MapsConfig.GOOGLE_MAPS_API_KEY.startsWith("PASTE_");
}

let mapsLoadPromise = null;
function loadGoogleMaps() {
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = new Promise((resolve, reject) => {
    if (!mapsConfigured()) { reject(new Error("not_configured")); return; }
    if (window.google && window.google.maps) { resolve(); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MapsConfig.GOOGLE_MAPS_API_KEY)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("load_failed"));
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

/**
 * Resolves to the driving distance in kilometres between two place names.
 * Throws with .message one of: "not_configured", "load_failed", or a
 * Google Distance Matrix status code (e.g. "NOT_FOUND", "ZERO_RESULTS").
 */
async function getDrivingDistanceKm(origin, destination) {
  await loadGoogleMaps();
  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC
    }, (response, status) => {
      if (status !== "OK") { reject(new Error(status)); return; }
      const el = response.rows[0].elements[0];
      if (el.status !== "OK") { reject(new Error(el.status)); return; }
      resolve(el.distance.value / 1000); // metres -> km
    });
  });
}
