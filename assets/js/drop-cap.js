/* Drop-cap heading style, site-wide.
   Per Noal, 2026-07-20 ~6:23pm: he pointed at the "AI-Assisted Investing
   Strategies and Tactics" subtitle link (hand-marked-up with individual
   <span class="drop-cap"> letters) and asked for that same look --
   first letter of each word sized up -- on all headings and subheadings.

   Rather than hand-wrapping every heading's first letters in markup (what
   the original subtitle line does), this walks the DOM once on load and
   wraps them automatically, so any future heading gets the treatment for
   free. Reuses the existing .drop-cap CSS class/size (1.4em) from that
   original line.

   Deliberately conservative about what it touches:
   - Only elements matching TARGET_SELECTOR below.
   - Skips any element that already has child elements (protects headings
     that contain icons, links, or already-hand-marked-up spans, like the
     original subtitle line itself -- re-processing it would double up).
   - Splits on whitespace only, not hyphens -- so a compound like
     "AI-Assisted" gets one enlarged letter (the "A"), not two like the
     hand-built example. Simpler and safer for a generic pass across many
     headings with varied punctuation.
   - Marks processed elements with data-drop-cap="done" so re-running
     (e.g. after other scripts touch the DOM) never double-wraps. */
(function () {
  // h1 excluded on purpose: the page's only h1 is an 11-word full-sentence
  // tagline ("Lime Harbor is where inner posture merges with disciplined
  // action."), not a short heading -- drop-capping every word in a run-on
  // sentence looked busy rather than elegant. h2/h3/.part-title are all
  // short, discrete headings/subheadings, where the effect reads clean.
  var TARGET_SELECTOR = 'h2, h3, .part-title';

  function dropCapifyElement(el) {
    if (el.getAttribute('data-drop-cap') === 'done') return;
    if (el.children.length > 0) return; // mixed content -- leave untouched
    var text = el.textContent;
    if (!text || !text.trim()) return;

    var tokens = text.split(/(\s+)/); // keep whitespace runs as their own tokens
    var frag = document.createDocumentFragment();
    tokens.forEach(function (tok) {
      if (tok === '') return;
      if (/^\s+$/.test(tok)) {
        frag.appendChild(document.createTextNode(tok));
        return;
      }
      var span = document.createElement('span');
      span.className = 'drop-cap';
      span.textContent = tok.charAt(0);
      frag.appendChild(span);
      if (tok.length > 1) frag.appendChild(document.createTextNode(tok.slice(1)));
    });

    el.replaceChildren(frag);
    el.setAttribute('data-drop-cap', 'done');
  }

  function run() {
    document.querySelectorAll(TARGET_SELECTOR).forEach(dropCapifyElement);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
