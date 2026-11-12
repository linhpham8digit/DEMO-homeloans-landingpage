# KP Home loans landing page

The Fundwise Capital home loans landing page for Kien Phan (version A of the home loans ad test): the full form at `/`. Sending the form turns it into a done-and-thank-you card and, a second later, scrolls on to the rest of the page.
Arriving with `?from=quiz` (from the quiz) shows the same page with no form and no thank-you: the Kien Phan block takes the form's place on the right (`assets/js/mode.js` sets this before the page draws). Reloading that version goes back to the quiz: its address is the `kp-quiz` meta tag in `index.html`, currently `https://demo-homeloans-quizz.vercel.app/`.
Static HTML, CSS and JS, no build step. Deploy on Vercel as a static site (framework preset "Other").

Run locally: `npx -y serve -l 3010 .` then open http://localhost:3010

The form is not connected yet: sending it does not send the lead anywhere (see `assets/js/lead.js`).
The quiz version lives in `linhpham8digit/DEMO-homeloans-quizz`.
