/* Smooth page scrolling for mouse and trackpad (a light take on what Lenis does).
   The wheel moves a target, and every animation frame the page covers a share of the
   distance left, so it glides and settles instead of jumping, at the screen's own frame
   rate. In-page links, the keyboard and the form's "move on" use an ease-in-out glide.
   Touch screens, reduced motion, pinch zoom and scroll areas inside the page keep the
   browser's own scrolling. */
(function () {
  "use strict";
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var html = document.documentElement;

  var current = window.scrollY, target = current;
  var raf = null, last = 0, tween = null;
  var SMOOTH = 8.5;   // how fast the page catches up with the wheel (higher is snappier)

  function maxY() { return Math.max(0, html.scrollHeight - window.innerHeight); }
  function clamp(y) { return Math.max(0, Math.min(maxY(), y)); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function frame(now) {
    var dt = last ? Math.min(64, now - last) / 1000 : 1 / 60;
    last = now;
    if (tween) {
      var t = Math.max(0, Math.min(1, (now - tween.start) / tween.dur));
      current = target = tween.from + (tween.to - tween.from) * easeInOut(t);
      if (t >= 1) tween = null;
    } else {
      // frame-rate independent ease-out: the same feel at 60, 120 or 144 Hz
      current += (target - current) * (1 - Math.exp(-SMOOTH * dt));
      if (Math.abs(target - current) < .4) current = target;
    }
    window.scrollTo(0, current);
    if (tween || current !== target) raf = requestAnimationFrame(frame);
    else { raf = null; last = 0; }
  }
  function run() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() {
    tween = null;
    if (raf) { cancelAnimationFrame(raf); raf = null; last = 0; }
    current = target = window.scrollY;
  }

  // Glide to an element or a y position with an ease-in-out curve.
  function to(dest, opts) {
    opts = opts || {};
    var y = typeof dest === "number" ? dest : dest.getBoundingClientRect().top + window.scrollY;
    y = clamp(y + (opts.offset || 0));
    if (reduce) { stop(); window.scrollTo(0, y); current = target = y; return; }
    var from = window.scrollY;
    var dist = Math.abs(y - from);
    tween = { from: from, to: y, start: performance.now(),
              dur: opts.duration || Math.min(1500, Math.max(650, dist * .7)) };
    current = from;
    run();
  }
  window.KPScroll = { to: to, stop: stop };

  if (reduce || !mq("(hover: hover) and (pointer: fine)")) return;

  // From here on this script moves the page; the CSS smooth scroll would fight every step.
  html.style.scrollBehavior = "auto";

  // Does something inside the page (a text box, a list) still have room to scroll that way?
  function scrollsInside(el, dy) {
    for (; el && el !== document.body && el !== html; el = el.parentElement) {
      if (el.nodeType !== 1) continue;
      var oy = window.getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
      }
    }
    return false;
  }

  function nudge(dy) {
    if (tween) tween = null;
    if (!raf) current = target = window.scrollY;
    target = clamp(target + dy);
    run();
  }

  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey || e.defaultPrevented) return;          // pinch or ctrl+wheel zoom
    var dy = e.deltaY;
    if (Math.abs(e.deltaX) > Math.abs(dy)) return;        // sideways: leave it alone
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    if (scrollsInside(e.target, dy)) return;
    e.preventDefault();
    nudge(dy);
  }, { passive: false });

  // Keyboard paging glides too, except while typing in the form.
  window.addEventListener("keydown", function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var el = document.activeElement;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName))) return;
    var page = window.innerHeight * .85;
    var dy = { ArrowDown: 110, ArrowUp: -110, PageDown: page, PageUp: -page,
               " ": e.shiftKey ? -page : page }[e.key];
    if (e.key === "Home") { e.preventDefault(); to(0); return; }
    if (e.key === "End") { e.preventDefault(); to(maxY()); return; }
    if (dy === undefined || (e.shiftKey && e.key !== " ")) return;
    e.preventDefault();
    nudge(dy);
  });

  // In-page links (#book, #next) glide to their section.
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var dest = id && document.getElementById(id);
    if (!dest) return;
    e.preventDefault();
    to(dest);
    if (window.history && history.pushState) history.pushState(null, "", "#" + id);
  });

  // Anything else that moves the page (scrollbar drag, find in page) takes over cleanly.
  window.addEventListener("mousedown", function (e) { if (e.target === html) stop(); });
  window.addEventListener("scroll", function () {
    if (!raf) { current = target = window.scrollY; }
    else if (Math.abs(window.scrollY - current) > 3) stop();
  }, { passive: true });
  window.addEventListener("resize", function () { target = clamp(target); });
})();
