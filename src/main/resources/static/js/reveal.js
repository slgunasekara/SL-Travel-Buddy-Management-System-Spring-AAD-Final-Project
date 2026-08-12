/* =========================================================================
   reveal.js — lightweight scroll/entrance reveal animation utility.
   Pure visual layer: adds/observes a ".reveal" class, no app logic involved.
   ========================================================================= */

const Reveal = (() => {
  let io = null;

  function ensureObserver() {
    if (io) return io;
    io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    return io;
  }

  // Scans a container for the main visual blocks and fades/slides them in,
  // staggered slightly, either immediately (above the fold) or on scroll.
  function scan(root) {
    if (!root) return;
    const obs = ensureObserver();
    const selectors = ".card, .stat-card, .page-head, .tool-card";
    const els = root.querySelectorAll(selectors);
    els.forEach((el, i) => {
      if (el.classList.contains("reveal")) return; // already wired once
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i * 35, 260) + "ms";
      obs.observe(el);
    });
  }

  return { scan };
})();
