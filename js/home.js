/* HOME dashboard + EXAMS browser (Class → Subject → Chapter). Always re-fetches the catalog so new questions appear. */
VIEWS.home = async () => {
  const T = [['exams', '📝', 'Exams', 'Pick a chapter and test yourself'], ['hist', '🕘', 'History', 'Attempts, results & solutions'],
    ['perf', '📈', 'Performance', 'Track your growth over time'], ['lb', '🏆', 'Leaderboard', 'See where you stand']];
  $('#app').innerHTML = `<div class="hero"><div style="opacity:.8;font-size:13px">স্বাগতম · Welcome back</div><h1>Hello, ${esc(S.u.name.split(' ')[0])} 👋</h1>
    <p>Practice, measure, improve.</p><div class="strip" id="strip"></div></div>
    <div class="tiles">${T.map(t => `<a class="card pick" data-a="go" data-v="${t[0]}"><div class="tile">${t[1]}</div><h3>${t[2]}</h3><div class="mu">${t[3]}</div></a>`).join('')}</div>`;
  const r = ((await api('history')).rows || []).filter(x => x.mine);
  $('#strip').innerHTML = [[r.length, 'Tests taken'], [r.length ? avg(r.map(x => x.pct)).toFixed(1) + '%' : '–', 'Average score'],
    [r.length ? Math.max(...r.map(x => x.pct)) + '%' : '–', 'Best score'], [r.length ? fmtT(avg(r.map(x => x.secs))) : '–', 'Avg time']]
    .map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('');
};

let EX = { cls: null, subject: null };
VIEWS.exams = async (a) => {
  if (a) EX = { cls: a.cls || null, subject: a.subject || null };
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  S.sets = (await api('catalog')).sets;
  drawExams();
};
function drawExams() {
  const sets = S.sets, uniq = (arr) => [...new Set(arr)];
  const crumb = `<div class="crumb"><a data-a="exOpen">All classes</a>${EX.cls ? ` › <a data-a="exOpen" data-c="${esc(EX.cls)}">${esc(EX.cls)}</a>` : ''}${EX.subject ? ` › <b>${esc(EX.subject)}</b>` : ''}<span style="flex:1"></span><a data-a="exRefresh">↻ Refresh</a></div>`;
  let body = '';
  if (!sets.length) body = '<div class="card"><h3>No exams yet</h3><p class="mu">Questions will appear here once the admin publishes them.</p></div>';
  else if (!EX.cls) {
    const cl = uniq(sets.map(s => s.cls)).sort((a, b) => (CONFIG.CLASSES.indexOf(a) + 99) % 99 - (CONFIG.CLASSES.indexOf(b) + 99) % 99);
    body = `<div class="grid">${cl.map(c => { const x = sets.filter(s => s.cls === c);
      return `<a class="card pick" data-a="exOpen" data-c="${esc(c)}"><h2>${esc(c)}</h2><div class="mu">${uniq(x.map(s => s.subject)).length} subjects · ${x.length} chapters</div></a>`; }).join('')}</div>`;
  } else if (!EX.subject) {
    const x = sets.filter(s => s.cls === EX.cls);
    body = `<div class="grid">${uniq(x.map(s => s.subject)).map(su => { const y = x.filter(s => s.subject === su);
      return `<a class="card pick" data-a="exOpen" data-c="${esc(EX.cls)}" data-s="${esc(su)}"><h2>${esc(su)}</h2><div class="mu">${y.length} chapters · ${y.reduce((a, s) => a + s.n, 0)} questions</div></a>`; }).join('')}</div>`;
  } else {
    const x = sets.filter(s => s.cls === EX.cls && s.subject === EX.subject);
    const papers = uniq(x.map(s => s.paper)).sort((a, b) => CONFIG.PAPERS.indexOf(a) - CONFIG.PAPERS.indexOf(b));
    const wTotal = s => JSON.parse(s.pm || '[]').reduce((a, b) => a + b, 0) * s.n;
    const row = s => s.type === 'written' ? `<div class="row" style="padding:8px 0 0 10px"><div><b style="color:var(--p);font-size:16px">${esc(s.name)}</b> <span class="mu">${s.n} creative question(s) · ${s.mins} min · ${wTotal(s)} marks · upload window ${s.um || 10} min</span><br>
        <span class="pill w">${s.tries ? 'Taken ' + s.tries + '×' : 'New'}</span></div>
        <span style="white-space:nowrap"><button class="btn s sm" data-a="copyset" data-id="${esc(s.id)}">🔗 Share</button> ${s.n ? `<button class="btn" data-a="wstart" data-id="${esc(s.id)}">✍ Start written</button>` : '<span class="pill r">No questions</span>'}</span></div>`
      : `<div class="row" style="padding:8px 0 0 10px"><div><b style="color:var(--p);font-size:16px">${esc(s.name)}</b> <span class="mu">${s.n} questions · ${s.mins} min · +${s.pos} / −${s.neg}</span><br>
        <span class="pill w">${s.tries ? 'Taken ' + s.tries + '×' : 'New'}</span> ${s.best != null ? `<span class="pill g">Best ${s.best}%</span>` : ''}</div>
        <span style="white-space:nowrap"><button class="btn s sm" data-a="copyset" data-id="${esc(s.id)}" title="Copy link to this exam">🔗 Share</button> ${s.n ? `<button class="btn" data-a="start" data-id="${esc(s.id)}">▶ Start</button>` : '<span class="pill r">No questions</span>'}</span></div>`;
    const sec = (t, a) => a.length ? `<div class="mu" style="margin:10px 0 0 10px;font-weight:700">${t}</div>${a.map(row).join('')}` : '';
    body = papers.map(p => { const inP = x.filter(s => s.paper === p);
      return `<div class="card"><h3>${esc(p)}</h3>${uniq(inP.map(s => s.chapter)).map(c => { const rs = inP.filter(s => s.chapter === c);
        return `<div style="padding:10px 0;border-top:1px solid var(--bd)"><b>${esc(c)}</b>${sec('MCQ', rs.filter(s => s.type !== 'written'))}${sec('Written (creative)', rs.filter(s => s.type === 'written'))}</div>`; }).join('')}</div>`; }).join('');
  }
  $('#app').innerHTML = crumb + body;
}
act.exOpen = d => { EX = { cls: d.c || null, subject: d.s || null }; drawExams(); };
act.exRefresh = () => VIEWS.exams();
