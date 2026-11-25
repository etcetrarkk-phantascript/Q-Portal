/* ADMIN REVIEW QUEUE — flag chart: what needs attention (evaluation, publishing, solution requests, registrations) + one-click Evaluate */
let QD = { ws: [], p: { users: [], reqs: [] } }, QF = 'action', QS = '';
const QFL = { submitted: ['🔴', 'Needs evaluation', 'r'], graded: ['🟠', 'Marked · publish pending', 'w'], upload: ['🟡', 'Uploading answers', ''], writing: ['⚪', 'Writing exam', ''],
  published: ['🟢', 'Published', 'g'], sol: ['🔓', 'Solution request', 'w'], user: ['👤', 'Registration', 'w'] };
const QPRI = { submitted: 0, graded: 1, sol: 2, user: 3, upload: 4, writing: 5, published: 6 };
function drawQueue(ws, p) { QD = { ws, p }; renderQueue(); }
function renderQueue() {
  const { ws, p } = QD, c = k => ws.filter(r => r.status === k).length;
  const items = [
    ...ws.map(r => ({ k: r.status, t: 'cq', who: r.who, sub: r.subject, where: `${r.cls} · ${r.paper} · ${r.chapter}`, set: r.setName, att: '#' + r.no, ts: r.ts, files: r.files, id: r.id, ob: r.obtained, tot: r.total })),
    ...p.reqs.map(x => ({ k: 'sol', t: 'sol', who: x.who, sub: x.subject || '', where: `${x.cls || ''} · ${x.paper || ''} · ${x.chapter || ''}`, set: x.setName, att: '#' + x.no + ' · MCQ ' + x.marks + '/' + x.total, ts: '', id: x.id })),
    ...p.users.map(u => ({ k: 'user', t: 'user', who: u.name, sub: '', where: u.cls + ' · Roll ' + u.roll, set: u.email, att: '', ts: '', id: u.email }))];
  const F = { action: i => ['submitted', 'graded', 'sol', 'user'].includes(i.k), submitted: i => i.k === 'submitted', graded: i => i.k === 'graded', progress: i => ['upload', 'writing'].includes(i.k),
    sol: i => i.k === 'sol', user: i => i.k === 'user', published: i => i.k === 'published', all: i => i.t === 'cq' };
  const chips = [['action', 'Needs action', items.filter(F.action).length], ['submitted', '🔴 To evaluate', c('submitted')], ['graded', '🟠 Publish pending', c('graded')], ['progress', '🟡 In progress', c('upload') + c('writing')],
    ['sol', '🔓 Solution requests', p.reqs.length], ['user', '👤 Registrations', p.users.length], ['published', '🟢 Published', c('published')], ['all', 'All CQ', ws.length]];
  const subs = [...new Set(items.filter(i => i.sub).map(i => i.sub))];
  const view = items.filter(F[QF]).filter(i => !QS || i.sub === QS).sort((a, b) => QPRI[a.k] - QPRI[b.k] || new Date(a.ts || 0) - new Date(b.ts || 0));
  const tot = ws.length || 1, seg = (k, col) => c(k) ? `<span title="${QFL[k][1]}: ${c(k)}" style="width:${c(k) / tot * 100}%;background:${col}"></span>` : '';
  const act_ = i => i.t === 'cq' ? (i.k === 'submitted' ? `<button class="btn sm" data-a="wgrade" data-id="${i.id}">✍ Evaluate</button>` : i.k === 'graded' ? `<button class="btn ok sm" data-a="wgrade" data-id="${i.id}">Review &amp; publish</button>`
      : i.k === 'published' ? `<button class="btn s sm" data-a="wgrade" data-id="${i.id}">View / edit marks</button>` : '<span class="mu">Waiting for student</span>')
    : `<button class="btn ok sm" data-a="dec" data-k="${i.t === 'sol' ? 'sol' : 'user'}" data-id="${esc(i.id)}" data-y="1">Approve</button> <button class="btn no sm" data-a="dec" data-k="${i.t === 'sol' ? 'sol' : 'user'}" data-id="${esc(i.id)}">Reject</button>`;
  $('#wQueue').innerHTML = `<h2 class="sec">🚩 Review queue</h2><div class="card"><div class="chips">${chips.map(([k, l, n]) => `<a class="chip ${QF === k ? 'on' : ''}" data-a="qfilter" data-f="${k}">${l} <b>${n}</b></a>`).join('')}</div>
    <div class="mu">CQ papers: 🔴 ${c('submitted')} to evaluate · 🟠 ${c('graded')} publish pending · 🟡 ${c('upload') + c('writing')} in progress · 🟢 ${c('published')} published</div>
    <div class="flagbar">${seg('submitted', '#dc2626')}${seg('graded', '#f59e0b')}${seg('upload', '#facc15')}${seg('writing', '#cbd5e1')}${seg('published', '#16a34a')}</div>
    <div class="row" style="margin:8px 0"><span class="mu">${view.length} item(s) · oldest first</span>
      <select data-sel="qs" style="width:auto;margin:0"><option value="">All subjects</option>${subs.map(s => `<option ${s === QS ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
    <div class="tw"><table><tr><th>Flag</th><th>Student</th><th>Subject · where</th><th>Set</th><th>Attempt</th><th></th></tr>
    ${view.map(i => `<tr><td><span class="pill ${QFL[i.k][2]}">${QFL[i.k][0]} ${QFL[i.k][1]}</span>${i.t === 'cq' && i.k === 'submitted' && !i.files ? '<div class="mu">⚠ no files uploaded</div>' : ''}</td>
      <td><b>${esc(i.who)}</b></td><td>${i.sub ? `<b>${esc(i.sub)}</b>` : ''}<div class="mu">${esc(i.where)}</div></td><td>${esc(i.set || '')}</td>
      <td>${esc(i.att)}${i.ts ? `<div class="mu">${fmtDT(i.ts)}</div>` : ''}${i.k === 'published' && i.ob != null ? `<div class="mu">${i.ob} / ${i.tot}</div>` : ''}</td><td style="white-space:nowrap">${act_(i)}</td></tr>`).join('')
      || '<tr><td colspan="6" class="mu">🎉 Nothing here — all clear.</td></tr>'}</table></div></div>`;
}
act.qfilter = d => { QF = d.f; renderQueue(); };
document.addEventListener('change', e => { if (e.target.dataset.sel === 'qs') { QS = e.target.value; renderQueue(); } });
