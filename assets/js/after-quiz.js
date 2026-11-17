/* After-quiz landing page: the headline confirms the visitor's details were received,
   using the first name the quiz kept for this tab (see lead.js). With no name on hand
   (the page opened directly) the usual headline stays. Written with textContent only. */
(function () {
  "use strict";
  if (!document.documentElement.classList.contains("from-quiz")) return;
  var lead = {};
  try { lead = JSON.parse(sessionStorage.getItem("kp_lead") || "{}") || {}; } catch (e) { return; }
  var name = String(lead.first_name || "").trim().slice(0, 20);
  var title = document.getElementById("heroTitle");
  if (!name || !title) return;
  title.textContent = "";
  title.appendChild(document.createTextNode("Done, thanks " + name + "."));
  title.appendChild(document.createElement("br"));
  title.appendChild(document.createTextNode(" We have your details."));
})();
