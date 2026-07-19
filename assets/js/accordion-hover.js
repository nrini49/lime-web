/* LIME site-wide accordion behavior. UPDATED 2026-07-19, per Noal --
 * confirmed directly in-thread after the click-only "final call":
 * individual <details> sections (opened by clicking their own summary,
 * e.g. "The Bezalel Promise") stay click-only -- that part is unchanged.
 *
 * But the .part-label heading itself ("Precision Accurate AI Assisted
 * Investing Platform" under "Part A", etc.) is once again a rollover
 * trigger: hovering it opens every <details> section scoped to that
 * part, and moving off closes them again. Noal wants this specific
 * interaction back -- "when you do a rollover of precision accurate,
 * that's when the promise and the harbor show up." Complex to build,
 * simple for the reader: a rollover, like a dance.
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
  // per Noal -- this model applies to Part A and Part B. Part C (added
  // 2026-07-19) intentionally opts out via data-reveal-only -- see the
  // exclusion below and the HTML comment above the Part C block.
  function wirePartLabels() {
    // :not([data-reveal-only]) excludes Part C's label -- it uses a
    // separate, pure-CSS reveal-on-hover pattern (see index.html) instead
    // of this hover-opens-content behavior. Per Noal, 2026-07-19.
    document.querySelectorAll('.part-label:not([data-reveal-only])').forEach(function (label) {
      if (label.dataset.rolloverWired) return;
      label.dataset.rolloverWired = '1';
      var scoped = [];
      var el = label.nextElementSibling;
      while (el && !el.classList.contains('part-label')) {
        if (el.matches('details')) scoped.push(el);
        el.querySelectorAll && scoped.push.apply(scoped, el.querySelectorAll('details'));
        el = el.nextElementSibling;
      }
      // Hover the part-label heading -> open everything scoped to that
      // part. Move off -> close it back up. Re-confirmed by Noal in-thread,
      // 2026-07-19.
      label.addEventListener('mouseenter', function () { scoped.forEach(function (d) { d.open = true; }); });
      label.addEventListener('mouseleave', function () { scoped.forEach(function (d) { d.open = false; }); });
    });
  }
  wirePartLabels();
  if (window.MutationObserver) {
    new MutationObserver(wirePartLabels).observe(document.body, { childList: true, subtree: true });
  }
})();
