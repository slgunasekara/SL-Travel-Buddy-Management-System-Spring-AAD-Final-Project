
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


Theme.init();
