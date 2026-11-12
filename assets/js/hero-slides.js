/* Hero photographs: one at a time, each dissolving into the next (a soft blur and
   fade), with a slow push-in while it is on screen. Pauses while the tab is hidden.
   Under reduced motion only the first photograph shows. */
(function () {
  "use strict";
  var box = document.getElementById("heroSlides");
  if (!box) return;
  var slides = box.querySelectorAll(".hero__slide");
  if (slides.length < 2) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var active = 0;
  var timer = null;

  function show(i) {
    Array.prototype.forEach.call(slides, function (el, n) {
      el.classList.toggle("is-active", n === i);
    });
    active = i;
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(function () { show((active + 1) % slides.length); }, 6000);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) clearInterval(timer); else start();
  });

  // the first photograph also comes in out of the blur on load
  slides[0].classList.remove("is-active");
  setTimeout(function () { show(0); }, 40);
  start();
})();
