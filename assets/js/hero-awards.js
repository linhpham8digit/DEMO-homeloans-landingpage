/* Rotating award badges in the hero, like the Awards band on kienphan.com.au:
   one group at a time, a new group every 3.5 seconds, dots to jump. The rotation
   pauses while the pointer or keyboard focus is on it, and does not run at all for
   anyone who asks for reduced motion. */
(function () {
  "use strict";
  var stage = document.getElementById("heroAwards");
  if (!stage) return;
  var sets = stage.querySelectorAll(".hero-awards__set");
  var dots = document.querySelectorAll(".hero-awards__dot");
  if (sets.length < 2) return;

  var active = 0;
  var timer = null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(i) {
    active = i;
    Array.prototype.forEach.call(sets, function (el, n) {
      el.classList.toggle("is-active", n === i);
      if (n === i) el.removeAttribute("aria-hidden"); else el.setAttribute("aria-hidden", "true");
    });
    Array.prototype.forEach.call(dots, function (el, n) {
      el.classList.toggle("is-active", n === i);
      el.setAttribute("aria-pressed", String(n === i));
    });
  }

  function start() {
    if (reduce) return;
    clearInterval(timer);
    timer = setInterval(function () { show((active + 1) % sets.length); }, 3500);
  }
  function stop() { clearInterval(timer); }

  Array.prototype.forEach.call(dots, function (dot) {
    dot.addEventListener("click", function () {
      show(parseInt(dot.getAttribute("data-goto"), 10) || 0);
      start();
    });
  });

  var box = stage.parentNode;
  box.addEventListener("mouseenter", stop);
  box.addEventListener("mouseleave", start);
  box.addEventListener("focusin", stop);
  box.addEventListener("focusout", start);

  start();
})();
