/* LIME site-wide accordion behavior (added 2026-07-19, re-confirmed same
 * day per Noal after live walkthrough: rollover opens a section, moving
 * off it closes it again. Heading (<summary>) always visible either way.
 *
 * Note for whoever picks this up next: this exact on/off call was made
 * twice in one session (removed, then restored) based on Noal's direct
 * live testing feedback -- if it needs to change again, confirm with him
 * in-thread first rather than assuming either direction is settled.
 *
 * Touch/no-hover devices (phones, tablets) keep plain native <details>
 * click-to-open / click-to-close behavior untouched -- there's no hover
 * gesture on touch, so this rollover behavior doesn't apply there.
 */
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return; // touch device: leave native <details> click behavior alone
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
