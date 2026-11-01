/* LEADERBOARD: ranked by score = avg% + number of tests + speed (weights in apps-script/00_Config.gs) */
let LBS = '';
VIEWS.lb = async () => {
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  const j = await api('leaderboard', { subject: LBS }), top = CONFIG.LEADERBOARD_TOP;
  const me = j.rows.find(r => r.me), show = j.rows.slice(0, top); if (me && me.rank > top) show.push(me);
  $('#app').innerHTML = `<div class="card row"><div><h2>Leaderboard</h2><p class="mu" style="margin:0">${me ? `Your position: <b>#${me.rank}</b> of ${j.rows.length}` : 'Take an exam to get ranked.'}</p></div>
  <select id="lbs" data-sel="lb" style="width:auto;margin:0"><option value="">All subjects</option>${j.subjects.map(s => `<option ${s === LBS ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
  <div class="card"><div class="tw"><table><tr><th>#</th><th>Name</th><th>Tests</th><th>Avg %</th><th>Best %</th><th>Avg time</th><th>Score</th></tr>
  ${show.map(r => `<tr class="${r.me ? 'me' : ''}"><td><b>${r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</b></td><td>${esc(r.name)}${r.me ? ' <span class="pill">You</span>' : ''}</td><td>${r.tests}</td><td>${r.avg}</td><td>${r.best}</td><td>${fmtT(r.avgSecs)}</td><td><b>${r.score}</b></td></tr>`).join('')
    || '<tr><td colspan="7" class="mu">No ranked attempts yet.</td></tr>'}</table></div>
  <p class="mu">Score (out of 100) rewards a high average, more tests taken, and finishing faster.</p></div>`;
};
document.addEventListener('change', e => { if (e.target.dataset.sel === 'lb') { LBS = e.target.value; go('lb'); } });
