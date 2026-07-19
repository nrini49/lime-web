/* LIME site-wide accordion behavior (added 2026-07-19, revised same day per Noal).
 * REVISED: opening on hover was tried and reverted -- Noal's standing rule
 * stays in force: every section starts collapsed, heading always visible,
 * and the reader clicks (native <details>/<summary> behavior) to choose
 * what to open. Do NOT auto-open on hover again without Noal confirming
 * directly in-thread -- this exact feature was added and reverted once
 * already today.
 *
 * What this file *does* do: once a reader opens a section by clicking,
 * it auto-collapses again when they move off it (mouse leaves), so
 * sections don't pile up open. Nothing opens automatically, ever.
 *
 * Touch/no-hover devices (phones, tablets) keep plain native <details>
 * click-to-open / click-to-close behavior untouched -- there's no "moving
 * off it" gesture on touch, so auto-collapse-on-leave doesn't apply there.
 */
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return; // touch device: leave native <details> click behavior alone
  }

  function wire(details) {
    if (details.dataset.rolloverWired) return;
    details.dataset.rolloverWired = '1';
    // Close automatically once the reader moves off a section they opened.
    // Never opens on hover -- opening is click-only, per standing rule.
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
