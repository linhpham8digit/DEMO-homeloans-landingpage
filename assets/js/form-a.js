/* Version A: the full form beside the headline. */
(function () {
  "use strict";
  var form = document.getElementById("leadForm");
  if (!form || !window.KPLead) return;
  var L = window.KPLead;
  var status = form.querySelector("[data-form-status]");

  // The form never carries anything over from the quiz: it always opens empty.
  // (Clear any answers an earlier version of the quiz may have left in this tab.)
  try { sessionStorage.removeItem("kp_prefill"); } catch (e) { /* storage blocked: nothing to clear */ }
  // Coming back to this page with the browser's Back button must not show old answers either.
  window.addEventListener("pageshow", function (e) { if (e.persisted) form.reset(); });

  function fieldOf(name) {
    var el = form.elements[name];
    return el && el.closest ? el.closest(".f") : null;
  }

  function setError(name, msg) {
    var f = fieldOf(name);
    if (!f) return;
    f.classList.toggle("is-error", Boolean(msg));
    var err = f.querySelector(".f__error");
    if (msg) {
      if (!err) {
        err = document.createElement("span");
        err.className = "f__error";
        f.appendChild(err);
      }
      err.textContent = msg;
    } else if (err) {
      err.remove();
    }
  }

  form.addEventListener("input", function (e) {
    if (e.target && e.target.name) setError(e.target.name, "");
  });
  form.addEventListener("change", function (e) {
    if (e.target && e.target.name) setError(e.target.name, "");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    if (!form.reportValidity()) return;

    var mobile = form.elements.mobile.value;
    if (!L.isAuMobile(mobile)) {
      setError("mobile", "Please enter an Australian mobile, for example 0412 345 678.");
      form.elements.mobile.focus();
      return;
    }
    if (form.elements._gotcha && form.elements._gotcha.value) return;

    var page = form.dataset.page;
    var rec = L.blankRecord(page, "a", "full_form");
    var data = new FormData(form);
    data.forEach(function (v, k) {
      if (k in rec && typeof v === "string") rec[k] = v.trim();
    });

    if (page === "smsf") {
      // SMSF goal also fills today's purpose field.
      rec.enquiry_type = rec.smsf_goal === "Refinance my SMSF’s existing loan"
        ? L.PURPOSE.refinance : L.PURPOSE.commercial;
    }

    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.classList.add("is-loading");
    btn.setAttribute("aria-busy", "true");
    // Not connected yet: when it is, the record goes to /api/submit-lead here (see lead.js).
    setTimeout(function () { showDone(rec.first_name, true); }, REDUCE ? 0 : 450);
  });

  /* ---------- done: the form card turns into a thank-you, then the page moves on ---------- */
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var autoScroll = null;   // pending "move on" timer
  var gliding = null;      // running scroll animation

  // A slow, eased scroll (1.4 to 2 s) instead of the browser's quick smooth scroll.
  // Any wheel, touch or key from the visitor stops it, so it never fights them.
  function glideTo(target) {
    if (!target) return;
    // the page-wide smooth scroll (smooth-scroll.js) does the gliding when it is loaded
    if (window.KPScroll) { window.KPScroll.to(target, { offset: -16, duration: 1500 }); return; }
    var startY = window.pageYOffset;
    var endY = target.getBoundingClientRect().top + startY - 16;
    if (REDUCE) { window.scrollTo(0, endY); return; }
    var distance = endY - startY;
    var duration = Math.min(2000, Math.max(1400, Math.abs(distance) * 1.6));
    var start = null;
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function stop() { if (gliding) { cancelAnimationFrame(gliding); gliding = null; } removeStops(); }
    function removeStops() { ["wheel", "touchstart", "keydown"].forEach(function (ev) { window.removeEventListener(ev, stop); }); }
    ["wheel", "touchstart", "keydown"].forEach(function (ev) { window.addEventListener(ev, stop, { passive: true }); });
    var html = document.documentElement;
    var oldBehaviour = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";   // the page's CSS smooth scroll would fight each step
    function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + distance * ease(t));
      if (t < 1) { gliding = requestAnimationFrame(step); }
      else { gliding = null; html.style.scrollBehavior = oldBehaviour; removeStops(); }
    }
    gliding = requestAnimationFrame(step);
  }

  // If the visitor starts moving on their own before the automatic move, let them.
  function cancelAutoScroll() {
    if (autoScroll) { clearTimeout(autoScroll); autoScroll = null; }
    ["wheel", "touchstart", "keydown"].forEach(function (ev) { window.removeEventListener(ev, cancelAutoScroll); });
  }

  function showDone(firstName, thenScroll) {
    var card = form.closest(".form-card");
    if (!card) return;
    // keep the form (and its heading) in the page, just hidden, so it can come back
    // (the logo stays on the card)
    var kept = Array.prototype.slice.call(card.children).filter(function (el) { return !el.classList.contains("form-card__logo"); });
    kept.forEach(function (el) { el.hidden = true; });
    card.classList.add("is-done");

    var done = document.createElement("div");
    done.className = "form-done";
    done.setAttribute("role", "status");

    var tick = document.createElement("span");
    tick.className = "quiz-done__tick";
    tick.setAttribute("aria-hidden", "true");
    done.appendChild(tick);

    var title = document.createElement("h2");
    title.className = "form-card__title form-done__title";
    title.tabIndex = -1;
    title.textContent = firstName ? "Done, thank you " + firstName + "." : "Done, thank you.";
    done.appendChild(title);

    var text = document.createElement("p");
    text.className = "form-done__text";
    text.textContent = "We’ve got your details. Kien’s team will call you within 15 minutes in business hours to set up your free 45-minute strategy session.";
    done.appendChild(text);

    var actions = document.createElement("div");
    actions.className = "form-done__actions";

    var again = document.createElement("button");
    again.type = "button";
    again.className = "btn btn--ghost form-done__again";
    again.textContent = "Fill in the form again";
    again.addEventListener("click", function () {
      cancelAutoScroll();
      if (gliding) { cancelAnimationFrame(gliding); gliding = null; }
      if (window.KPScroll) window.KPScroll.stop();
      done.remove();
      card.classList.remove("is-done");
      kept.forEach(function (el) { el.hidden = false; });
      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll(".is-error"), function (n) { n.classList.remove("is-error"); });
      Array.prototype.forEach.call(form.querySelectorAll(".f__error"), function (n) { n.remove(); });
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = false;
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-busy");
      if (card.getBoundingClientRect().top < 0) glideTo(card.closest(".hero") || card);
      form.elements.first_name.focus({ preventScroll: true });
    });
    actions.appendChild(again);

    var next = document.getElementById("next");
    if (next) {
      var more = document.createElement("a");
      more.className = "link-arrow form-done__more";
      more.href = "#next";
      more.textContent = "Keep reading ";
      var arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↓";
      more.appendChild(arrow);
      more.addEventListener("click", function (e) { e.preventDefault(); cancelAutoScroll(); glideTo(next); });
      actions.appendChild(more);
    }
    done.appendChild(actions);

    card.appendChild(done);
    title.focus({ preventScroll: true });

    // After a moment to read it, glide down to the rest of the page.
    if (thenScroll && next) {
      ["wheel", "touchstart", "keydown"].forEach(function (ev) { window.addEventListener(ev, cancelAutoScroll, { passive: true }); });
      autoScroll = setTimeout(function () { cancelAutoScroll(); glideTo(next); }, REDUCE ? 600 : 1000);
    }
  }

  // Arriving from the quiz (?from=quiz) is handled before the page draws: mode.js marks the
  // page and landing.css leaves the form out, so nothing here needs to run for it.
})();
