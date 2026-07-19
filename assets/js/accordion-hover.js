/* LIME site-wide accordion behavior. FINAL CALL, 2026-07-19, per Noal
 * after live-testing on the real site: hover-to-open was tried twice
 * today and reverted both times -- it interferes with the page and
 * takes the choice away from the reader. Standing principle going
 * forward: sections open ONLY on click (native <details> behavior),
 * never on hover. "Let them decide what they want to look at."
 *
 * Do NOT re-add mouseenter-opens-a-section anywhere in this file again
 * without Noal confirming directly, in-thread, after this note.
 *
 * What this file still does: once a reader clicks a section open, it
 * auto-collapses again when they move off it (mouse leaves) -- that
 * part stays, since it's tidy-up, not an unwanted auto-reveal.
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

  // Part-label headings ("Part A", "Part B", "Part C") as master rollover
  // triggers: hovering the part title opens every <details> section that
  // belongs to that part (everything between this .part-label and the
  // next one, or end of <main> if it's the last part). Added 2026-07-19
  // per Noal -- same model across all three parts, added as each part's
  // .part-label shows up in the page (Part C isn't on the homepage yet;
  // this will pick it up automatically once it is, no extra wiring needed).
  function wirePartLabels() {
    document.querySelectorAll('.part-label').forEach(function (label) {
      if (label.dataset.rolloverWired) return;
      label.dataset.rolloverWired = '1';
      var scoped = [];
      var el = label.nextElementSibling;
      while (el && !el.classList.contains('part-label')) {
        if (el.matches('details')) scoped.push(el);
        el.querySelectorAll && scoped.push.apply(scoped, el.querySelectorAll('details'));
        el = el.nextElementSibling;
      }
      // Opening is click-only, per the standing principle above -- a
      // part-label heading no longer opens its sections on hover. It
      // still tidies up: moving off the part closes anything the reader
      // had open within it.
      label.addEventListener('mouseleave', function () { scoped.forEach(function (d) { d.open = false; }); });
    });
  }
  wirePartLabels();
  if (window.MutationObserver) {
    new MutationObserver(wirePartLabels).observe(document.body, { childList: true, subtree: true });
  }
})();
