/* HISTORY: MCQ + CQ (written) with an All / MCQ / CQ filter. Admin also picks a student from a dropdown. */
let HS = '', HC = [], WH = [], HT = 'all';
const WSTAT = { writing: 'Writing', upload: 'Uploading answers', submitted: 'Submitted · awaiting marking', graded: 'Marked · not published', published: 'Result published' };
VIEWS.hist = async (a) => {
  if (a && a.email) HS = a.email;
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  const adm = S.u.role === 'admin', keep = e => { if (e === '__stale') throw e; return { rows: [] }; };
  HC = (await api('history')).rows || [];
  WH = (await api(adm ? 'wSubs' : 'wMine', {}).catch(keep)).rows || [];
  drawHist();
};
function drawHist() {
  const adm = S.u.role === 'admin', key = r => r.email || r.who, st = {}, cnt = {};
  [...HC, ...(adm ? WH : [])].forEach(r => { st[key(r)] = r.who; cnt[key(r)] = (cnt[key(r)] || 0) + 1; });
  if (HS && !st[HS]) HS = '';
  const showM = HT !== 'cq', showW = HT !== 'mcq', showUser = adm && !HS;
  const mrows = adm && HS ? HC.filter(r => key(r) === HS) : HC, wrows = adm && HS ? WH.filter(r => key(r) === HS) : WH;
  const picker = adm ? `<select data-sel="hs" style="width:auto;min-width:220px;margin:0"><option value="">All students (${Object.keys(st).length})</option>
    ${Object.entries(st).sort((x, y) => x[1].localeCompare(y[1])).map(([e, n]) => `<option value="${esc(e)}" ${e === HS ? 'selected' : ''}>${esc(n)} — ${cnt[e]} exam(s)</option>`).join('')}</select>` : '';
  const seg = [['all', 'All'], ['mcq', 'MCQ'], ['cq', 'CQ (written)']].map(([k, l]) => `<button class="btn ${HT === k ? '' : 's'} sm" data-a="hfilter" data-t="${k}">${l}</button>`).join(' ');
  let html = `<div class="card"><div class="row"><div><h2>${adm ? (HS ? esc(st[HS]) + ' · history' : 'All attempts') : 'My exam history'}</h2>
    <p class="mu" style="margin:0">${mrows.length} MCQ · ${wrows.length} CQ${mrows.length ? ' · MCQ average ' + avg(mrows.map(r => r.pct)).toFixed(1) + '%' : ''}</p></div>${picker}</div>
    <div style="margin-top:10px">${seg}</div></div>`;
  if (showM) html += `<div class="card"><h3>MCQ exams</h3><div class="tw"><table><tr><th>Date & time</th>${showUser ? '<th>User</th>' : ''}<th>Exam</th><th>Attempt</th><th>Result</th><th>Time taken</th><th>Result</th><th>Solution</th></tr>
  ${mrows.map(r => `<tr><td class="mu">${fmtDT(r.ts)}</td>${showUser ? `<td>${esc(r.who)}</td>` : ''}
  <td><b>${esc(r.chapter)}</b> ${r.setName ? `<span class="pill">${esc(r.setName)}</span>` : ''}<div class="mu">${esc(r.cls)} · ${esc(r.subject)} · ${esc(r.paper)}</div></td>
  <td>#${r.no} <span class="mu">of ${r.of}</span></td>
  <td><b>${r.marks} / ${r.total}</b> <span class="pill ${r.pct >= 60 ? 'g' : r.pct >= 33 ? 'w' : 'r'}">${r.pct}%</span><div class="mu">✓${r.correct} ✕${r.wrong}</div></td>
  <td>${fmtT(r.secs)}</td>
  <td><button class="btn sm" data-a="rep" data-id="${r.id}" data-t="1">Result</button></td>
  <td>${r.solution === 'approved' ? `<button class="btn ok sm" data-a="rep" data-id="${r.id}" data-t="2">Solution</button>`
    : r.solution === 'requested' ? '<span class="pill w">Pending</span>' : `<button class="btn s sm" data-a="reqsol" data-id="${r.id}" data-h="1">Request</button>`}</td></tr>`).join('')
    || `<tr><td colspan="8" class="mu">No MCQ attempts yet.</td></tr>`}</table></div></div>`;
  if (showW) html += `<div class="card"><h3>CQ (written) exams</h3><div class="tw"><table><tr><th>Date & time</th>${showUser ? '<th>User</th>' : ''}<th>Exam</th><th>Attempt</th><th>Status</th><th>Marks</th><th></th></tr>
  ${wrows.map(r => `<tr><td class="mu">${fmtDT(r.ts)}</td>${showUser ? `<td>${esc(r.who)}</td>` : ''}
  <td><b>${esc(r.chapter)}</b> <span class="pill">${esc(r.setName)}</span><div class="mu">${esc(r.cls)} · ${esc(r.subject)} · ${esc(r.paper)}</div></td><td>#${r.no}</td>
  <td><span class="pill ${r.status === 'published' ? 'g' : r.status === 'submitted' && adm ? 'r' : 'w'}">${WSTAT[r.status] || r.status}</span></td>
  <td>${r.obtained != null ? `<b>${r.obtained} / ${r.total}</b>` : '–'}</td>
  <td style="white-space:nowrap">${adm ? `<button class="btn sm" data-a="wgrade" data-id="${r.id}">Exam Paper</button> ` : ''}${r.status === 'published' ? `<button class="btn ok sm" data-a="wres" data-id="${r.id}">View result</button>`
    : !adm && (r.status === 'writing' || r.status === 'upload') ? `<button class="btn sm" data-a="wstart" data-id="${r.setId}">Continue</button>` : ''}</td></tr>`).join('')
    || `<tr><td colspan="7" class="mu">No written exams yet.</td></tr>`}</table></div></div>`;
  $('#app').innerHTML = html;
}
act.hfilter = d => { HT = d.t; drawHist(); };
document.addEventListener('change', e => { if (e.target.dataset.sel === 'hs') { HS = e.target.value; drawHist(); } });
