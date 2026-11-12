/* Runs in <head>, before the page is drawn. A visitor sent here by the quiz has already
   given their details, so the page shows without the form (see .from-quiz in landing.css).
   Doing it this early means the form never flashes up and disappears.
   Reloading that version goes back to the quiz (its address is the kp-quiz meta tag). */
(function () {
  try {
    if (new URLSearchParams(window.location.search).get("from") !== "quiz") return;
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var meta = document.querySelector('meta[name="kp-quiz"]');
    if (nav && nav.type === "reload" && meta && meta.content) {
      window.location.replace(meta.content);
      return;
    }
    document.documentElement.classList.add("from-quiz");
  } catch (e) { /* old browser: the page simply shows as normal */ }
})();
