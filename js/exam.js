/* EXAM: timed test, then Result / Solution sheets (browser print → Save as PDF) */
let E = null, timer = null;
VIEWS.exam = () => {
  const q = E.qs;
  $('#app').innerHTML = `<div class="stick"><span style="font-size:13px">${esc(E.set.chapter)} · ${esc(E.set.name)}</span><b id="tm"></b><button class="btn sm" style="background:#fff;color:var(--p)" data-a="submit">Submit</button></div>
  <div class="card"><div class="mu" style="margin-bottom:8px">Answered: <b id="cnt">0</b> / ${q.length} (yellow = answered)</div>
  <div class="pal">${q.map((_, i) => `<a id="p${i}" data-a="jump" data-i="${i}">${i + 1}</a>`).join('')}</div></div>
  ${q.map((x, i) => `<div class="q" id="q${i}"><div class="qh"><span><span class="qid">${esc(x.id)}</span>${fq(x.q)}</span><span class="sc">+${E.set.pos}</span></div>
  <div class="os">${x.options.map((o, k) => `<button class="o" data-a="pick" data-i="${i}" data-k="${k}"><i class="b">${L[k]}</i><span>${fopt(o)}</span></button>`).join('')}</div></div>`).join('')}
  <div class="card row"><span class="mu">Unanswered questions carry no penalty. Auto-submits at 00:00.</span>
  <span><button class="btn s" data-a="exit">Exit</button> <button class="btn" data-a="submit">Submit exam</button></span></div>`;
  clearInterval(timer);
  const tick = () => {
    const s = Math.max(0, Math.ceil((E.end - Date.now()) / 1000));
    if ($('#tm')) $('#tm').textContent = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':');
    if (s <= 0) { clearInterval(timer); act.submit({}, null, true); }
  };
  tick(); timer = setInterval(tick, 500);
};

VIEWS.report = async ({ id, type = 1 }) => {
  const j = await api('report', { id, type });
  const m = j.meta, k = j.type === 2, adm = S.u.role === 'admin';
  document.title = `${CONFIG.APP_NAME}_${m.chapter}_${m.setName}_Attempt${m.no}_${k ? 'Solution' : 'Result'}`;
  const state = adm || m.solution === 'approved' ? '<span class="pill g">Solution unlocked</span>' : m.solution === 'requested' ? '<span class="pill w">Solution pending admin</span>'
    : `<button class="btn s sm" data-a="reqsol" data-id="${m.id}">Request Solution</button>`;
  $('#app').innerHTML = `<div class="card noprint row"><div>
    <button class="btn ${k ? 's' : ''} sm" data-a="rep" data-id="${m.id}" data-t="1">Result</button>
    <button class="btn ${k ? '' : 's'} sm" data-a="rep" data-id="${m.id}" data-t="2">Solution</button> ${state}</div>
    <div><button class="btn ok sm" data-a="print">⬇ Download PDF</button> <button class="btn no sm" data-a="go" data-v="hist">History</button></div></div>
  <div class="sheet report"><div class="frame"></div>
    <div class="row" style="align-items:flex-start"><div><div class="mu" style="font-weight:700;color:var(--p);text-transform:uppercase;letter-spacing:.06em">${k ? 'Solution sheet' : 'Result sheet'}</div>
    <h2>${esc(m.cls)} · ${esc(m.subject)} (${esc(m.paper)})</h2><div style="font-weight:600">${esc(m.chapter)} · ${esc(m.setName)}</div>
    <div class="mu">${esc(m.name)} · Roll ${esc(m.roll)} · ${esc(m.email)}<br>Attempt #${m.no} · ${fmtDT(m.ts)} · Time taken ${fmtT(m.secs)}</div></div>
    <div style="text-align:right"><div class="mu">Obtained marks</div><div class="score">${m.marks} / ${m.total}</div>
    <div class="mu">Correct ${m.correct} (+${m.correct * m.pos}) · Wrong ${m.wrong} (−${m.wrong * m.neg}) · Skipped ${m.skipped} · ${m.pct}%</div></div></div>
    <div class="leg"><span><span class="pill g">ক</span> Right</span><span><span class="pill r">খ</span> Wrong</span>
    ${k ? '<span><span class="pill" style="background:var(--y);color:#713f12">গ</span> Correct option</span>' : ''}</div><hr style="border:0;border-top:1px solid var(--bd);margin:14px 0">
    ${j.items.map(it => {
      const st = it.pick == null ? '' : it.right ? 'ok' : 'bad';
      return `<div class="q ${st}"><div class="qh"><span><span class="qid">${esc(it.id)}</span>${fq(it.q)}</span><span class="sc ${st}">${it.right ? '+' + m.pos : it.pick == null ? '0' : '−' + m.neg}</span></div><div class="os two">
      ${it.options.map((o, x) => { const c = it.pick === x ? (it.right ? 'g' : 'r') : (k && it.ans === x ? 'y' : '');
        return `<div class="o ${c}"><i class="b">${L[x]}</i><span>${fopt(o)}</span></div>`; }).join('')}</div></div>`;
    }).join('')}</div>`;
};

Object.assign(act, {
  jump: d => $('#q' + d.i).scrollIntoView({ behavior: 'smooth', block: 'center' }),
  print: () => window.print(),
  exit: () => { if (confirm('Leave this exam? Your answers will be lost.')) { clearInterval(timer); E = null; go('exams'); } },
  start: async (d) => { const j = await api('start', { id: d.id }); E = { ...j, ans: {}, end: Date.now() + j.sec * 1000 }; go('exam'); },
  pick: (d) => {
    const i = +d.i, k = +d.k, id = E.qs[i].id;
    if (E.ans[id] === k) delete E.ans[id]; else E.ans[id] = k;
    document.querySelectorAll(`#q${i} .o`).forEach((b, x) => b.classList.toggle('sel', E.ans[id] === x));
    $('#p' + i).classList.toggle('d', E.ans[id] !== undefined);
    $('#cnt').textContent = Object.keys(E.ans).length;
  },
  submit: async (d, b, auto) => {
    if (!E) return;
    const left = E.qs.length - Object.keys(E.ans).length;
    if (!auto && left && !confirm(left + ' question(s) unanswered. Submit anyway?')) return;
    clearInterval(timer);
    const id = E.set.id, ans = E.ans; E = null;
    try { const j = await api('submit', { id, ans }); toast(auto ? 'Time over — auto-submitted.' : 'Exam submitted.'); go('report', { id: j.id, type: 1 }); }
    catch (e) { toast(e); go('exams'); }
  },
  rep: (d) => go('report', { id: d.id, type: +d.t }),
  reqsol: async (d) => { await api('requestSolution', { id: d.id }); toast('Solution request sent to admin.'); d.h ? go('hist') : go('report', { id: d.id, type: 1 }); }
});
window.addEventListener('beforeunload', (e) => { if (E) { e.preventDefault(); e.returnValue = ''; } });
