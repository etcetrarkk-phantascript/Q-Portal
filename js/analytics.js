/* PERFORMANCE ANALYSIS: score trend line, subject bars, chapter progress (pure SVG, no libraries) */
function lineChart(vals) {
  const W = 640, H = 220, pl = 34, pr = 10, pt = 10, pb = 22, n = vals.length;
  const x = i => pl + (n === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1)), y = v => pt + (H - pt - pb) * (1 - Math.max(0, Math.min(100, v)) / 100);
  const grid = [0, 25, 50, 75, 100].map(g => `<line x1="${pl}" x2="${W - pr}" y1="${y(g)}" y2="${y(g)}" stroke="#e4e1ee"/><text x="${pl - 6}" y="${y(g) + 4}" font-size="10" text-anchor="end" fill="#6b6785">${g}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${grid}
    <polyline fill="none" stroke="#5b3cc4" stroke-width="2.5" points="${vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>
    ${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#5b3cc4"><title>Test ${i + 1}: ${v}%</title></circle>`).join('')}
    <text x="${W / 2}" y="${H - 4}" font-size="10" text-anchor="middle" fill="#6b6785">Test number (oldest → latest)</text></svg>`;
}
VIEWS.perf = async (a) => {
  const em = a && a.email, who = em ? esc(a.name) + ' · ' : '', back = em ? '<div class="crumb"><a data-a="go" data-v="admin">← Admin</a></div>' : '';
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  const r = (await api('history', { email: em })).rows.filter(x => x.mine).sort((a, b) => new Date(a.ts) - new Date(b.ts));
  if (!r.length) { $('#app').innerHTML = back + `<div class="card"><h2>${who}Performance Analysis</h2><p class="mu">${em ? 'No exams taken yet.' : 'Take your first exam to see your growth here.'}</p></div>`; return; }
  const p = r.map(x => x.pct), last = p.slice(-5), prev = p.slice(-10, -5);
  const trend = prev.length ? avg(last) - avg(prev) : null;
  const cor = r.reduce((a, x) => a + x.correct, 0), wr = r.reduce((a, x) => a + x.wrong, 0);
  const bySub = {}; r.forEach(x => (bySub[x.subject] = bySub[x.subject] || []).push(x.pct));
  const byCh = {}; r.forEach(x => (byCh[x.chapter + (x.setName ? ' · ' + x.setName : '')] = byCh[x.chapter + (x.setName ? ' · ' + x.setName : '')] || []).push(x.pct));
  const prog = Object.entries(byCh).filter(([, v]) => v.length > 1);
  $('#app').innerHTML = `${back}<div class="card"><h2>${who}Performance Analysis</h2><div class="strip" style="color:var(--tx)">
    ${[[r.length, 'Tests'], [avg(p).toFixed(1) + '%', 'Average'], [Math.max(...p) + '%', 'Best'], [(cor + wr ? (cor / (cor + wr) * 100).toFixed(0) : 0) + '%', 'Accuracy (attempted)'], [fmtT(avg(r.map(x => x.secs))), 'Avg time'],
      [trend == null ? '–' : (trend >= 0 ? '▲ ' : '▼ ') + Math.abs(trend).toFixed(1), 'Trend (last 5 vs before)']].map(([a, b]) => `<div style="background:var(--pl)"><b>${a}</b><span class="mu">${b}</span></div>`).join('')}</div></div>
  <div class="card"><h3>Score growth (%)</h3>${lineChart(p)}</div>
  <div class="card bars"><h3>Average by subject</h3>${Object.entries(bySub).map(([s, v]) => `<div class="br"><span>${esc(s)}</span><div class="tr"><div class="fl" style="width:${Math.max(2, avg(v))}%"></div></div><b>${avg(v).toFixed(1)}%</b></div>`).join('')}</div>
  <div class="card"><h3>Chapter progress (first → latest)</h3>${prog.map(([c, v]) => { const d = v[v.length - 1] - v[0];
    return `<div class="row" style="padding:6px 0;border-top:1px solid var(--bd)"><span>${esc(c)} <span class="mu">(${v.length} tries)</span></span><span>${v[0]}% → <b>${v[v.length - 1]}%</b> <span class="pill ${d >= 0 ? 'g' : 'r'}">${d >= 0 ? '+' : ''}${d.toFixed(1)}</span></span></div>`; }).join('') || '<p class="mu">Retake a chapter to see your improvement here.</p>'}</div>`;
};
