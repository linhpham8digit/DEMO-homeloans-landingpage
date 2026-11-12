/* Lifted unchanged from kienphan.com.au js/main.js: the testimonials auto-scroll
   (with drag-to-scroll) and the scroll reveal. */

/* Testimonials: .reviews auto-scrolls continuously at a slow, steady speed.
   Hovering, touching or focusing inside the row slows it right down (not to a
   full stop) so a visitor can read a card or tap its link without the row
   sliding away from under them. A visitor can also grab the row with a mouse
   or a finger and drag it themselves; dragging fully pauses the auto-scroll
   for as long as the pointer is down.

   The row loops seamlessly: the original cards are cloned once and appended
   after themselves, so scrolling past the end of the originals slides
   straight into a pixel-identical copy. scrollLeft wraps by exactly the
   width of one set (originalWidth) instead of snapping back to 0, so the
   loop point is invisible. Cloned cards are aria-hidden and untabbable: they
   are a visual duplicate only, never a real destination. */
(function () {
  var track = document.querySelector('.reviews');
  if (!track) return;

  /* Reduced-motion visitors get no auto-scroll and no clones/drag wiring: the
     plain CSS fallback (.reviews { overflow-x: auto } further down this
     file's stylesheet) already lets them scroll the row natively with a
     trackpad, wheel or touch, which covers "manual control" without adding
     motion or doubling the content they land on. Kept deliberately, not
     replaced by the new drag handling. */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var originalEls = Array.prototype.slice.call(track.children);
  var originalCount = originalEls.length;
  originalEls.forEach(function (el) {
    var clone = el.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    track.appendChild(clone);
  });

  var originalWidth = 0;

  function measure() {
    if (originalCount < 1 || track.children.length < originalCount * 2) {
      originalWidth = 0;
      return;
    }
    var firstOriginal = track.children[0];
    var firstClone = track.children[originalCount];
    originalWidth = firstClone.offsetLeft - firstOriginal.offsetLeft;
  }

  measure();
  window.addEventListener('resize', measure);

  function normalize() {
    if (originalWidth <= 0) return;
    if (track.scrollLeft >= originalWidth) {
      track.scrollLeft -= originalWidth;
    }
  }

  var baseSpeed = 40; // pixels per second
  var slowSpeed = 8; // pixels per second, while hovered/touched/focused
  var slow = false;
  var dragging = false;
  var lastTime = null;

  function setSlow(value) {
    slow = value;
  }

  track.addEventListener('mouseenter', function () { setSlow(true); });
  track.addEventListener('mouseleave', function () { setSlow(false); });
  track.addEventListener('touchstart', function () { setSlow(true); }, { passive: true });
  track.addEventListener('touchend', function () { setSlow(false); });
  track.addEventListener('focusin', function () { setSlow(true); });
  track.addEventListener('focusout', function () { setSlow(false); });

  /* Drag-to-scroll via Pointer Events, which unify mouse/touch/pen. Dragging
     fully pauses the auto-scroll increment below. A drag that moves more
     than dragThreshold px marks the click that follows to be suppressed, so
     a real drag never accidentally triggers a card's link, while a plain
     tap/click with no real movement still navigates as normal. */
  var dragThreshold = 8; // pixels
  var dragStartX = 0;
  var dragStartScrollLeft = 0;
  var dragDistance = 0;
  var suppressClick = false;
  var activePointerId = null;

  track.addEventListener('pointerdown', function (e) {
    if (activePointerId !== null) return;
    /* Reset here, not just after a click: if the previous drag ended via
       pointercancel (no click ever follows), this keeps the flag from
       getting stuck true and eating the next unrelated click. */
    suppressClick = false;
    activePointerId = e.pointerId;
    dragging = true;
    setSlow(true);
    dragStartX = e.clientX;
    dragStartScrollLeft = track.scrollLeft;
    dragDistance = 0;
    track.classList.add('is-dragging');
    /* Guarded: some pointer ids (synthetic events, an already-released
       pointer) are rejected by the browser. The drag still works via the
       ordinary bubbling pointermove/pointerup either way; capture only makes
       it keep tracking if the pointer leaves the row's bounds. */
    try { track.setPointerCapture(e.pointerId); } catch (err) {}
  });

  track.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== activePointerId) return;
    var delta = e.clientX - dragStartX;
    dragDistance = Math.max(dragDistance, Math.abs(delta));
    track.scrollLeft = dragStartScrollLeft - delta;
    normalize();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    activePointerId = null;
    track.classList.remove('is-dragging');
    /* Slow is left as-is on purpose: a drag ending on top of the row still
       counts as "pointer is here", same as an ordinary hover/touch, until it
       actually leaves via mouseleave/touchend/focusout. */
    if (dragDistance > dragThreshold) {
      suppressClick = true;
    }
  }

  track.addEventListener('pointerup', function (e) {
    if (e.pointerId !== activePointerId) return;
    endDrag();
  });
  track.addEventListener('pointercancel', function (e) {
    if (e.pointerId !== activePointerId) return;
    endDrag();
  });

  /* Capturing, so this runs before the card anchor's own click/navigation. */
  track.addEventListener('click', function (e) {
    if (suppressClick) {
      e.preventDefault();
      suppressClick = false;
    }
  }, true);

  function step(time) {
    window.requestAnimationFrame(step);

    if (track.scrollWidth <= track.clientWidth) {
      lastTime = time;
      return;
    }

    if (lastTime === null) {
      lastTime = time;
      return;
    }

    var delta = time - lastTime;
    lastTime = time;

    if (!dragging) {
      var speed = slow ? slowSpeed : baseSpeed;
      track.scrollLeft += speed * (delta / 1000);
      normalize();
    }
  }

  window.requestAnimationFrame(step);
})();

/* Scroll-reveal: fade + rise sections into view as the user scrolls */
(function () {
  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach(function (el) { observer.observe(el); });
})();
