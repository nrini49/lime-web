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
      label.addEventListener('mouseenter', function () { scoped.forEach(function (d) { d.open = true; }); });
      label.addEventListener('mouseleave', function () { scoped.forEach(function (d) { d.open = false; }); });
    });
  }
  wirePartLabels();
  if (window.MutationObserver) {
    new MutationObserver(wirePartLabels).observe(document.body, { childList: true, subtree: true });
  }
})();
