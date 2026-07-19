/* LIME site-wide accordion behavior. FINAL CALL #2, 2026-07-19, per Noal:
 * hovering a .part-label heading ("Precision Accurate AI Assisted
 * Investing Platform" under "Part A", etc.) must NEVER open any
 * <details> content -- it was tried today and Noal flagged it as still
 * not right: "roll over the top of any heading, it should not open
 * anything except the name of the subheadings." Individual <details>
 * sections open ONLY when their own summary is clicked -- that has
 * never changed. This is the same standing principle Part C was built
 * with from the start (reveal names on hover, click to actually open),
 * now restored for Part A and Part B too.
 *
 * Do NOT re-add mouseenter-opens-a-section anywhere in this file again
 * without Noal confirming directly, in-thread, after this note --
 * this is the second time it's been added and removed today.
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

  // Part-label headings ("Part A", "Part B", "Part C") -- tidy-up only.
  // Hovering a part-label heading does NOT open anything (see the file
  // header note above). This just makes sure nothing scoped to a part
  // is left open if the reader's mouse passes back over the heading
  // after clicking something open elsewhere on the part -- a safety
  // net, not an auto-open trigger.
  function wirePartLabels() {
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
      // No mouseenter handler -- hovering the heading must never open
      // content. mouseleave-closes stays as tidy-up only.
      label.addEventListener('mouseleave', function () { scoped.forEach(function (d) { d.open = false; }); });
    });
  }
  wirePartLabels();
  if (window.MutationObserver) {
    new MutationObserver(wirePartLabels).observe(document.body, { childList: true, subtree: true });
  }
})();
