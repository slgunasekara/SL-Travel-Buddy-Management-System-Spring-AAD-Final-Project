/* =========================================================================
   theme.js — dark mode toggle. Pure presentation layer: sets
   `data-theme="dark"` on <html>, persisted in localStorage. All actual
   color changes live in CSS under [data-theme="dark"] selectors.
   ========================================================================= */

const Theme = (() => {
  const KEY = "bms_theme";

  function get() {
    return localStorage.getItem(KEY) || "light";
  }

  function apply(mode) {
    document.documentElement.setAttribute("data-theme", mode);
  }

  function set(mode) {
    localStorage.setItem(KEY, mode);
    apply(mode);
    document.dispatchEvent(new CustomEvent("themechange", { detail: { mode } }));
  }

  function toggle() {
    const next = get() === "dark" ? "light" : "dark";
    set(next);
    return next;
  }

  function init() {
    apply(get());
  }

  return { get, set, toggle, init };
})();

// Apply immediately (before paint) to avoid a flash of the wrong theme.
Theme.init();
