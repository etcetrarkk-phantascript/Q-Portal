/*
 ╔══════════════════════════════════════════════════════════════════════════╗
 ║   Q-PORTAL · WEBSITE · ★ ADMIN-DEFINED SETTINGS (EDIT ONLY THIS FILE) ★  ║
 ╚══════════════════════════════════════════════════════════════════════════╝

 REPOSITORY LAYOUT (upload exactly like this to GitHub, then Settings → Pages → main branch)
   index.html        page shell (loads the chunks below)
   css/style.css     all styling
   js/config.js      ← this file: your settings
   js/core.js        helpers · API call · router · navigation
   js/math.js        plain/unicode math → KaTeX formulas automatically
   js/auth.js        register / sign in / reset
   js/home.js        Home dashboard + Exams (class → subject → chapter)
   js/exam.js        timed exam + Result / Solution sheets (print to PDF)
   js/history.js     attempt history
   js/analytics.js   Performance Analysis charts
   js/leaderboard.js Leaderboard
   js/share.js       shareable question links (#q=S1-Q003)
   js/admin.js       publish / edit / delete questions · approvals
   js/app.js         boot (starts the app)

 STEPS
   1. Deploy the Apps Script backend first (see apps-script/00_Config.gs).
   2. Paste its Web App /exec URL into API_URL below, commit, wait ~1 min for GitHub Pages.
   3. Hard-refresh the site (Ctrl+Shift+R) after every update so the browser drops cached chunks.

 QUESTION JSON FORMAT (Admin → Publish; generate it with Gemini)
   return [ { "q": "1. Question text", "options": ["(a) ..","(b) ..","(c) ..","(d) .."], "ans": 0 }, ... ]
   Math: write LaTeX between $...$ in "q"/"options", or give "qLatex"/"optionsLatex" (used automatically if present).
   "ans" = index of the right option (0 = first). IDs (S1-Q001 …) are assigned automatically and never change.
*/
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbyM0W_IW83xR0m9SoR4YJaUHl09QteMr1iUMghPfYXzZwS6lGsYX0Kx2teYgTTCxdRI0g/exec",                                   // ← https://script.google.com/macros/s/XXXX/exec
  APP_NAME: "Q-Portal",
  CLASSES: ["HSC", "SSC", "Admission"],          // suggestions in Admin & registration
  PAPERS: ["1st Paper", "2nd Paper"],
  DEFAULT_MINS: 30,                              // defaults in the Publish form
  DEFAULT_POS: 2,
  DEFAULT_NEG: 0.25,
  LEADERBOARD_TOP: 20
};
