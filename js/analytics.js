/* PERFORMANCE: student sees own growth; admin sees ALL students' condition + per-set participation chart (pure SVG, no libraries) */
function lineChart(vals) {
  const W = 640, H = 220, pl = 34, pr = 10, pt = 10, pb = 22, n = vals.length;
  const x = i => pl + (n === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1)), y = v => pt + (H - pt - pb) * (1 - Math.max(0, Math.min(100, v)) / 100);
  const grid = [0, 25, 50, 75, 100].map(g => `<line x1="${pl}" x2="${W - pr}" y1="${y(g)}" y2="${y(g)}" stroke="#e4e1ee"/><text x="${pl - 6}" y="${y(g) + 4}" font-size="10" text-anchor="end" fill="#6b6785">${g}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${grid}
    <polyline fill="none" stroke="#5b3cc4" stroke-width="2.5" points="${vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>
    ${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#5b3cc4"><title>Test ${i + 1}: ${v}%</title></circle>`).join('')}
    <text x="${W / 2}" y="${H - 4}" font-size="10" text-anchor="middle" fill="#6b6785">Test number (oldest → latest)</text></svg>`;
}
function spark(vals) {
  const v = vals.slice(-10), W = 90, H = 26, n = v.length; if (!n) return '';
  const x = i => n === 1 ? W / 2 : 2 + i * (W - 4) / (n - 1), y = p => H - 2 - (H - 4) * Math.max(0, Math.min(100, p)) / 100;
  return `<svg width="${W}" height="${H}"><polyline fill="none" stroke="#5b3cc4" stroke-width="2" points="${v.map((p, i) => x(i) + ',' + y(p)).join(' ')}"/><circle cx="${x(n - 1)}" cy="${y(v[n - 1])}" r="2.5" fill="#5b3cc4"/></svg>`;
}
let PA = [], PS = '';
VIEWS.perf = async (a) => {
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  const em = a && a.email, rows = (await api('history', { email: em })).rows || [];
  if (S.u.role === 'admin' && !em) { PA = rows; drawAll(); } else perfOne(rows.filter(x => x.mine), a);
};

function perfOne(rows, a) {
  const em = a && a.email, who = em ? esc(a.name) + ' · ' : '', back = em ? '<div class="crumb"><a data-a="go" data-v="admin">← Admin</a></div>' : '';
  const r = rows.sort((x, y) => new Date(x.ts) - new Date(y.ts));
  if (!r.length) { $('#app').innerHTML = back + `<div class="card"><h2>${who}Performance Analysis</h2><p class="mu">${em ? 'No exams taken yet.' : 'Take your first exam to see your growth here.'}</p></div>`; return; }
  const p = r.map(x => x.pct), last = p.slice(-5), prev = p.slice(-10, -5), trend = prev.length ? avg(last) - avg(prev) : null;
  const cor = r.reduce((s, x) => s + x.correct, 0), wr = r.reduce((s, x) => s + x.wrong, 0);
  const bySub = {}; r.forEach(x => (bySub[x.subject] = bySub[x.subject] || []).push(x.pct));
  const byCh = {}, ck = x => x.chapter + (x.setName ? ' · ' + x.setName : ''); r.forEach(x => (byCh[ck(x)] = byCh[ck(x)] || []).push(x.pct));
  const prog = Object.entries(byCh).filter(([, v]) => v.length > 1);
  $('#app').innerHTML = `${back}<div class="card"><h2>${who}Performance Analysis</h2><div class="strip" style="color:var(--tx)">
    ${[[r.length, 'Tests'], [avg(p).toFixed(1) + '%', 'Average'], [Math.max(...p) + '%', 'Best'], [(cor + wr ? (cor / (cor + wr) * 100).toFixed(0) : 0) + '%', 'Accuracy (attempted)'], [fmtT(avg(r.map(x => x.secs))), 'Avg time'],
      [trend == null ? '–' : (trend >= 0 ? '▲ ' : '▼ ') + Math.abs(trend).toFixed(1), 'Trend (last 5 vs before)']].map(([x, y]) => `<div style="background:var(--pl)"><b>${x}</b><span class="mu">${y}</span></div>`).join('')}</div></div>
  <div class="card"><h3>Score growth (%)</h3>${lineChart(p)}</div>
  <div class="card bars"><h3>Average by subject</h3>${Object.entries(bySub).map(([s, v]) => `<div class="br"><span>${esc(s)}</span><div class="tr"><div class="fl" style="width:${Math.max(2, avg(v))}%"></div></div><b>${avg(v).toFixed(1)}%</b></div>`).join('')}</div>
  <div class="card"><h3>Set progress (first → latest)</h3>${prog.map(([c, v]) => { const d = v[v.length - 1] - v[0];
    return `<div class="row" style="padding:6px 0;border-top:1px solid var(--bd)"><span>${esc(c)} <span class="mu">(${v.length} tries)</span></span><span>${v[0]}% → <b>${v[v.length - 1]}%</b> <span class="pill ${d >= 0 ? 'g' : 'r'}">${d >= 0 ? '+' : ''}${d.toFixed(1)}</span></span></div>`; }).join('') || '<p class="mu">Retake a set to see your improvement here.</p>'}</div>`;
}

/* ----- admin: all students ----- */
const FLAGC = { Weak: 'r', Declining: 'r', Inactive: 'w', Improving: 'g', Steady: '' };
function drawAll() {
  const rows = PA.filter(r => !r.mine), key = r => r.email || r.who, g = {};
  rows.forEach(r => (g[key(r)] = g[key(r)] || { email: r.email, name: r.who, r: [] }).r.push(r));
  const us = Object.values(g).map(o => {
    o.r.sort((x, y) => new Date(x.ts) - new Date(y.ts));
    const p = o.r.map(x => x.pct), last = p.slice(-5), prev = p.slice(-10, -5), cor = o.r.reduce((s, x) => s + x.correct, 0), wr = o.r.reduce((s, x) => s + x.wrong, 0);
    o.p = p; o.tests = p.length; o.avg = avg(p); o.best = Math.max(...p); o.acc = cor + wr ? cor / (cor + wr) * 100 : 0;
    o.trend = prev.length ? avg(last) - avg(prev) : null; o.days = (Date.now() - new Date(o.r[o.r.length - 1].ts)) / 864e5;
    o.flag = o.avg < 40 ? 'Weak' : o.trend != null && o.trend < -5 ? 'Declining' : o.days > 7 ? 'Inactive' : o.trend != null && o.trend > 5 ? 'Improving' : 'Steady';
    return o;
  }).sort((x, y) => x.avg - y.avg);
  if (!us.length) { $('#app').innerHTML = '<div class="card"><h2>Performance · all students</h2><p class="mu">No student has taken an exam yet.</p></div>'; return; }
  const sets = {}; rows.forEach(r => { sets[r.setId || r.chapter] = `${r.chapter} · ${r.setName || ''} (${r.subject})`; });
  if (!sets[PS]) PS = Object.keys(sets)[0];
  const sr = rows.filter(r => (r.setId || r.chapter) === PS), gg = {};
  sr.forEach(r => (gg[key(r)] = gg[key(r)] || { name: r.who, p: [] }).p.push(r.pct));
  const part = Object.values(gg).sort((x, y) => y.p.length - x.p.length), mx = Math.max(1, ...part.map(o => o.p.length));
  const absent = us.filter(o => !gg[key(o.r[0])]).map(o => o.name);
  const bySub = {}; rows.forEach(r => (bySub[r.subject] = bySub[r.subject] || []).push(r.pct));
  $('#app').innerHTML = `<div class="card"><h2>Performance · all students</h2><div class="strip">
    ${[[us.length, 'Active students'], [rows.length, 'Total tests'], [avg(rows.map(r => r.pct)).toFixed(1) + '%', 'Overall average'], [us.filter(o => ['Weak', 'Declining', 'Inactive'].includes(o.flag)).length, 'Need attention']]
      .map(([x, y]) => `<div style="background:var(--pl);color:var(--tx)"><b>${x}</b><span class="mu">${y}</span></div>`).join('')}</div></div>
  <div class="card"><h3>Student condition <span class="mu">(weakest first)</span></h3><div class="tw"><table><tr><th>Student</th><th>Tests</th><th>Avg %</th><th>Best %</th><th>Accuracy</th><th>Last 10</th><th>Trend</th><th>Status</th><th></th></tr>
  ${us.map(o => `<tr><td><b>${esc(o.name)}</b><div class="mu">last exam ${Math.floor(o.days)}d ago</div></td><td>${o.tests}</td><td><b>${o.avg.toFixed(1)}</b></td><td>${o.best}</td><td>${o.acc.toFixed(0)}%</td><td>${spark(o.p)}</td>
  <td>${o.trend == null ? '–' : (o.trend >= 0 ? '▲ ' : '▼ ') + Math.abs(o.trend).toFixed(1)}</td><td><span class="pill ${FLAGC[o.flag]}">${o.flag}</span></td>
  <td style="white-space:nowrap">${o.email ? `<button class="btn s sm" data-a="uHist" data-e="${esc(o.email)}" data-n="${esc(o.name)}">History</button> <button class="btn sm" data-a="uPerf" data-e="${esc(o.email)}" data-n="${esc(o.name)}">Details</button>` : ''}</td></tr>`).join('')}</table></div>
  <p class="mu">Weak = average below 40% · Declining = last 5 tests 5+ points below the 5 before · Inactive = no exam for 7+ days · Improving = up 5+ points.</p></div>
  <div class="card bars"><div class="row"><h3 style="margin:0">Who attended this set, and how many times</h3>
    <select data-sel="sp" style="width:auto;max-width:100%;margin:0">${Object.entries(sets).map(([k, v]) => `<option value="${esc(k)}" ${k === PS ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
    <p class="mu">${sr.length} attempt(s) by ${part.length} student(s)</p>
    ${part.map(o => `<div class="br"><span title="${esc(o.name)}">${esc(o.name)}</span><div class="tr"><div class="fl" style="width:${o.p.length / mx * 100}%"></div></div><b>${o.p.length}×</b><span class="mu">best ${Math.max(...o.p)}% · avg ${avg(o.p).toFixed(1)}%</span></div>`).join('')}
    ${absent.length ? `<p class="mu">Not attended yet: ${absent.map(esc).join(', ')}</p>` : ''}</div>
  <div class="card bars"><h3>Class average by subject</h3>${Object.entries(bySub).map(([s, v]) => `<div class="br"><span>${esc(s)}</span><div class="tr"><div class="fl" style="width:${Math.max(2, avg(v))}%"></div></div><b>${avg(v).toFixed(1)}%</b></div>`).join('')}</div>`;
}
document.addEventListener('change', e => { if (e.target.dataset.sel === 'sp') { PS = e.target.value; drawAll(); } });
