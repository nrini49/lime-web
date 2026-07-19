/* LIME site-wide accordion behavior. STANDING RULE, confirmed multiple
 * times in-thread by Noal, most recently 2026-07-19:
 *
 * .part-label headings ("Precision Accurate AI Assisted Investing
 * Platform" under Part A, "3 Readers and 1 Door" under Part B, "The LIME
 * Universe Bridge" under Part C) have NO hover behavior whatsoever --
 * they never open or reveal anything. All subheadings (Introduction,
 * Chapter I/II/III, Conclusion) are permanently visible across every
 * part -- no hide/reveal wrapper of any kind.
 *
 * The only hover effect anywhere is: hovering a subheading's own summary
 * bar directly turns it green (CSS below, details.collapsible >
 * summary:hover). Content only ever opens via an explicit click on that
 * summary -- this has never changed. Viewers should never lose track of
 * the homepage: everything opens in place, nothing navigates away.
 *
 * Do NOT add any mouseenter/hover-opens-a-section or hover-reveals-a-
 * section logic anywhere in this file without Noal confirming directly,
 * in-thread, after this note -- this exact behavior has been added and
 * removed multiple times today.
 *
 * Touch/no-hover devices (phones, tablets) keep plain native <details>
 * click-to-open / click-to-close behavior untouched -- no change there.
 */
(function () {
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return; // touch device: leave native <details> click behavior alone
  }

  function wire(details) {
    if (details.dataset.rolloverWired) return;
    details.dataset.rolloverWired = '1';
    // Opening is click-only (native <details>/<summary>). Closing on
    // mouse-leave is the only automatic behavior here.
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

  // .part-label headings intentionally have zero JS wiring -- see the file
  // header note above. Nothing left to do here for them.
})();
