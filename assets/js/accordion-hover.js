/* LIME site-wide accordion behavior (added 2026-07-19, per Noal).
 * Every <details> section on the site: heading (<summary>) always visible,
 * body collapsed by default, expands on rollover (mouse hover) rather than
 * requiring a click. Consistent across every page that includes this file.
 *
 * Touch/no-hover devices (phones, tablets) keep the native <details> click
 * behavior untouched -- rollover doesn't exist there, so we don't fight it.
 */
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return; // touch device: leave native click-to-open <details> behavior alone
  }

  function wire(details) {
    if (details.dataset.rolloverWired) return;
    details.dataset.rolloverWired = '1';
    details.addEventListener('mouseenter', function () { details.open = true; });
    details.addEventListener('mouseleave', function () { details.open = false; });
  }

  function wireAll() {
    document.querySelectorAll('details').forEach(wire);
  }

  wireAll();

  // Pages that build cards/sections dynamically (e.g. rotating Keeper
  // content) may add <details> after load -- catch those too.
  if (window.MutationObserver) {
    new MutationObserver(wireAll).observe(document.body, { childList: true, subtree: true });
  }
})();
