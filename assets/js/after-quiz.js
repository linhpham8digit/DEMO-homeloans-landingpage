/* After-quiz landing page: the headline confirms the visitor's details were received, with the
   first name the quiz kept for this tab (see lead.js). The usual "See ..." headline never shows on
   this page. On kienphan.com.au the page is served with this headline already in its HTML; this
   script adds the name and covers the demo pages, where one landing page serves both versions.
   Written with textContent only. */
(function () {
  "use strict";
  var html = document.documentElement;
  if (!html.classList.contains("from-quiz")) return;
  var title = document.getElementById("heroTitle");
  if (!title) { html.classList.remove("greet-pending"); return; }
  var lead = {};
  try { lead = JSON.parse(sessionStorage.getItem("kp_lead") || "{}") || {}; } catch (e) { /* no name */ }
  var name = String(lead.first_name || "").trim().slice(0, 20);
  title.textContent = "";
  title.appendChild(document.createTextNode(name ? "Done, thanks " + name + "." : "Done, thanks."));
  title.appendChild(document.createElement("br"));
  title.appendChild(document.createTextNode(" We have your details."));
  html.classList.remove("greet-pending");
})();
