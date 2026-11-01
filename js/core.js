/* CORE: helpers, API call, router, navigation */
const $ = (s) => document.querySelector(s);
const val = (id) => ($('#' + id) || {}).value || '';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const L = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const clean = (o) => String(o).replace(/^\s*\(?[a-dA-D]\)\s*/, '');
const fmtDT = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtT = (s) => Math.floor(s / 60) + 'm ' + String(Math.round(s % 60)).padStart(2, '0') + 's';
const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

let S = { t: localStorage.getItem('qp_t'), u: JSON.parse(localStorage.getItem('qp_u') || 'null'), sets: [] };
let V = 'auth';
const VIEWS = {}, act = {};
let NAVID = 0;   // bumps on every page change; late responses of an old page are ignored (fixes random 'Cannot read properties' errors)

function typeset() {   // KaTeX: renders $...$ in the page (safe to call any time)
  if (!window.renderMathInElement) return;
  try { renderMathInElement($('#app'), { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) {}
}
let _mt; const _mo = new MutationObserver((ms) => {
  if (ms.every(m => m.target.id === 'tm')) return;           // ignore the ticking timer
  clearTimeout(_mt); _mt = setTimeout(() => { _mo.disconnect(); typeset(); _mo.observe($('#app'), { childList: true, subtree: true }); }, 60);
});
document.addEventListener('DOMContentLoaded', () => _mo.observe($('#app'), { childList: true, subtree: true }));
window.addEventListener('load', () => { if (!window.renderMathInElement) toast('Math library (KaTeX) could not load. Check your internet / ad-blocker.'); typeset(); });

function toast(m) { if (m === '__stale') return; const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(t.h); t.h = setTimeout(() => t.style.display = 'none', 4000); }

async function api(a, b = {}) {
  if (!CONFIG.API_URL) throw 'Set API_URL in js/config.js first.';
  const nv = NAVID;
  const r = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ a, t: S.t, ...b }) });
  const j = await r.json();
  if (nv !== NAVID) throw '__stale';
  if (j.auth) logout();
  if (!j.ok) throw j.error;
  return j;
}

function logout() { S.t = null; S.u = null; localStorage.removeItem('qp_t'); localStorage.removeItem('qp_u'); if (typeof E !== 'undefined') E = null; go('auth'); }

function nav() {
  const n = $('#nav');
  if (!S.u) { n.innerHTML = ''; return; }
  const t = [['home', 'Home'], ['exams', 'Exams'], ['hist', 'History'], ['perf', 'Performance'], ['lb', 'Leaderboard'], ...(S.u.role === 'admin' ? [['admin', 'Admin']] : [])];
  n.innerHTML = t.map(([k, l]) => `<a data-a="go" data-v="${k}" class="${V === k ? 'on' : ''}">${l}</a>`).join('') + `<a data-a="logout">Sign out</a>`;
}

function go(v, arg) {
  V = v; NAVID++; window.scrollTo(0, 0); nav();
  Promise.resolve(VIEWS[v](arg)).catch(e => toast(typeof e === 'string' ? e : (e.message || 'Something went wrong')));
}

act.go = d => {
  if (typeof E !== 'undefined' && E) { if (!confirm('An exam is in progress. Leave and lose your answers?')) return; clearInterval(timer); E = null; }
  go(d.v);
};
act.logout = () => logout();

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-a]');
  if (!b || !act[b.dataset.a]) return;
  e.preventDefault(); b.classList.add('busy');
  try { await act[b.dataset.a](b.dataset, b); } catch (x) { toast(typeof x === 'string' ? x : (x.message || 'Something went wrong')); }
  b.classList.remove('busy');
});
