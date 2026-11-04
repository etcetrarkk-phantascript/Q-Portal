/* HISTORY: students see their own; admin picks a student from a dropdown to see that student's full history */
let HS = '', HC = [], WH = [];
VIEWS.hist = async (a) => {
  if (a && a.email) HS = a.email;
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  HC = (await api('history')).rows || [];
  WH = S.u.role === 'admin' ? [] : ((await api('wMine').catch(e => { if (e === '__stale') throw e; return { rows: [] }; })).rows || []);
  drawHist();
};
function drawHist() {
  const adm = S.u.role === 'admin', key = r => r.email || r.who, st = {}, cnt = {};
  HC.forEach(r => { st[key(r)] = r.who; cnt[key(r)] = (cnt[key(r)] || 0) + 1; });
  if (HS && !st[HS]) HS = '';
  const rows = adm && HS ? HC.filter(r => key(r) === HS) : HC, showUser = adm && !HS;
  const picker = adm ? `<select data-sel="hs" style="width:auto;min-width:220px;margin:0"><option value="">All students (${Object.keys(st).length})</option>
    ${Object.entries(st).sort((x, y) => x[1].localeCompare(y[1])).map(([e, n]) => `<option value="${esc(e)}" ${e === HS ? 'selected' : ''}>${esc(n)} — ${cnt[e]} exam(s)</option>`).join('')}</select>` : '';
  $('#app').innerHTML = `<div class="card"><div class="row"><div><h2>${adm ? (HS ? esc(st[HS]) + ' · history' : 'All attempts') : 'My exam history'}</h2>
  <p class="mu" style="margin:0">${rows.length} exam(s) · ${new Set(rows.map(r => r.setId || r.chapter)).size} different set(s)${rows.length ? ' · average ' + avg(rows.map(r => r.pct)).toFixed(1) + '%' : ''}</p></div>${picker}</div>
  <div class="tw" style="margin-top:10px"><table><tr><th>Date & time</th>${showUser ? '<th>User</th>' : ''}<th>Exam</th><th>Attempt</th><th>Result</th><th>Time taken</th><th>Result</th><th>Solution</th></tr>
  ${rows.map(r => `<tr><td class="mu">${fmtDT(r.ts)}</td>${showUser ? `<td>${esc(r.who)}</td>` : ''}
  <td><b>${esc(r.chapter)}</b> ${r.setName ? `<span class="pill">${esc(r.setName)}</span>` : ''}<div class="mu">${esc(r.cls)} · ${esc(r.subject)} · ${esc(r.paper)}</div></td>
  <td>#${r.no} <span class="mu">of ${r.of}</span></td>
  <td><b>${r.marks} / ${r.total}</b> <span class="pill ${r.pct >= 60 ? 'g' : r.pct >= 33 ? 'w' : 'r'}">${r.pct}%</span><div class="mu">✓${r.correct} ✕${r.wrong}</div></td>
  <td>${fmtT(r.secs)}</td>
  <td><button class="btn sm" data-a="rep" data-id="${r.id}" data-t="1">Result</button></td>
  <td>${r.solution === 'approved' ? `<button class="btn ok sm" data-a="rep" data-id="${r.id}" data-t="2">Solution</button>`
    : r.solution === 'requested' ? '<span class="pill w">Pending</span>' : `<button class="btn s sm" data-a="reqsol" data-id="${r.id}" data-h="1">Request</button>`}</td></tr>`).join('')
    || `<tr><td colspan="8" class="mu">No attempts yet.</td></tr>`}</table></div></div>`;
  if (typeof drawWHist === 'function') drawWHist();
}
document.addEventListener('change', e => { if (e.target.dataset.sel === 'hs') { HS = e.target.value; drawHist(); } });
