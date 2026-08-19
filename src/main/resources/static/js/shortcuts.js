/* shortcuts.js — Keyboard Shortcuts. A small registry of named actions
   (default keybinding + what they do), editable per logged-in user from
   Settings. Other modules call Shortcuts.matches(actionName, keydownEvent)
   inside their own keydown listener instead of hardcoding a key, so the
   binding stays configurable in one place. Bindings are a device/browser
   preference (like theme), so they're stored in localStorage, scoped by
   username so a shared computer doesn't mix users' preferences. */
const Shortcuts = (() => {
  const DEFAULTS = {
    search: { key: "k", ctrl: true, label: "Open Search" },
    newRecord: { key: "n", ctrl: true, label: "Focus \"Add New\" form on the current page" }
  };

  function storageKey() {
    const user = (typeof Session !== "undefined") ? Session.currentUser() : null;
    return "bms_shortcuts_" + (user ? user.username || user.userId : "guest");
  }

  function all() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(storageKey())) || {}; } catch (e) { /* ignore */ }
    const merged = {};
    Object.keys(DEFAULTS).forEach(name => {
      merged[name] = { ...DEFAULTS[name], ...(stored[name] || {}) };
    });
    return merged;
  }

  function set(name, key, ctrl) {
    if (!DEFAULTS[name]) return;
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(storageKey())) || {}; } catch (e) { /* ignore */ }
    stored[name] = { key: key.toLowerCase(), ctrl: !!ctrl };
    localStorage.setItem(storageKey(), JSON.stringify(stored));
  }

  function resetAll() {
    localStorage.removeItem(storageKey());
  }

  /** True if this keydown event matches the current binding for `name`. */
  function matches(name, e) {
    const binding = all()[name];
    if (!binding) return false;
    const ctrlOk = binding.ctrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
    return ctrlOk && e.key.toLowerCase() === binding.key;
  }

  function label(binding) {
    return `${binding.ctrl ? "Ctrl+" : ""}${binding.key.toUpperCase()}`;
  }

  // Ctrl+N — focus the first field of the currently visible "Add New" form,
  // if the current page has one (every renderCrudPage-based page does).
  document.addEventListener("keydown", (e) => {
    if (!matches("newRecord", e)) return;
    const grid = document.getElementById("formGrid");
    if (!grid) return;
    const firstField = grid.querySelector("input:not([type=hidden]):not([disabled]), select, textarea");
    if (firstField) { e.preventDefault(); firstField.focus(); }
  });

  return { all, set, resetAll, matches, label, DEFAULTS };
})();
