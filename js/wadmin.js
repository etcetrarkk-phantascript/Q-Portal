/* WRITTEN EXAMS (admin): publish creative-question papers · manage · submissions list · "Exam Paper" marking page */
let WA = { sets: [], setId: '', qs: [], pm: [] };
const wParse = (t) => {
  t = t.trim().replace(/^return\s+/, '').replace(/;\s*$/, '');
  const i = t.indexOf('['), j = t.lastIndexOf(']'); if (i < 0 || j < 0) throw 'No [ ... ] array found';
  let a; try { a = JSON.parse(t.slice(i, j + 1)); } catch (e) { a = new Function('return ' + t.slice(i, j + 1))(); }
  if (!Array.isArray(a) || !a.length) throw 'Array is empty'; return a;
};
const wSetLabel = (s) => `${s.id} · ${s.cls} › ${s.subject} › ${s.paper} › ${s.chapter} › ${s.name} (${s.n} Q)`;

function drawWAdmin(sets) {
  WA.sets = sets.filter(s => s.type === 'written');
  const ws = WA.sets, opt = (sel) => ws.map(s => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc(wSetLabel(s))}</option>`).join('');
  $('#wAdmin').innerHTML = `
  <div class="card"><h2>1b · Publish written exam</h2><p class="mu">Creative questions: each has a context (<b>uddipok</b>) and parts ক, খ, গ, (ঘ). Same chapter + same set name = replaced (or tick Append).</p>
    <div class="g4" style="margin-top:10px"><div><label>Class</label><input id="wC" list="dC" value="${esc(CONFIG.CLASSES[0])}"></div><div><label>Subject</label><input id="wS" list="dS"></div>
    <div><label>Paper</label><select id="wP">${CONFIG.PAPERS.map(x => `<option>${esc(x)}</option>`).join('')}</select></div><div><label>Chapter</label><input id="wH" list="dH"></div>
    <div><label>Set name (required)</label><input id="wN" list="dN" placeholder="e.g. Written Set 1"></div>
    <div><label>Marks pattern</label><select id="wPat" data-sel="wpat">${Object.keys(CONFIG.PATTERNS).map(k => `<option value="${k}">${k[0].toUpperCase() + k.slice(1)} (${CONFIG.PATTERNS[k].join(', ')})</option>`).join('')}<option value="custom">Custom</option></select></div>
    <div><label>Part marks (ক, খ, গ, ঘ)</label><input id="wPM" value="${Object.values(CONFIG.PATTERNS)[0].join(',')}"></div>
    <div><label>Exam time (minutes)</label><input id="wM" type="number" value="${CONFIG.DEFAULT_WRITTEN_MINS}"></div>
    <div><label>Answer-upload window (minutes)</label><input id="wU" type="number" value="${CONFIG.DEFAULT_UPLOAD_MINS}"></div></div>
    <textarea id="wJ" placeholder='return [ { "uddipok": "উদ্দীপক… (একাধিক উদ্দীপক একই টেক্সটে লিখুন)", "ka": "…", "kha": "…", "ga": "…", "gha": "…" } ]  (math: only ka, kha, ga)'></textarea>
    <div class="row"><label><input type="checkbox" id="wA" style="width:auto;margin:0 6px 0 0">Append to existing set</label><button class="btn" data-a="wsave">Publish written exam</button></div></div>
  <div class="card"><h2>1c · Manage written questions</h2><div class="row"><select id="wmSet" style="flex:1;margin:0"><option value="">Choose written set…</option>${opt(WA.setId)}</select>
    <button class="btn s sm" data-a="wmLoad">Load</button><button class="btn del sm" data-a="wmDelSet">Delete set</button></div><div id="wmForm"></div><div id="wmList" style="margin-top:12px"></div></div>
  <div class="card"><h2>1d · Written submissions &amp; marking</h2><p class="mu">Pick a set, then open a student's <b>Exam Paper</b> to read the uploaded answer sheets and give marks.</p>
    <div class="row"><select id="wsSet" style="flex:1;margin:0"><option value="">All written sets</option>${opt('')}</select><button class="btn s sm" data-a="wsLoad">Show submissions</button></div><div id="wsList" style="margin-top:12px"></div></div>`;
}
function drawWm() {
  const s = WA.sets.find(x => x.id === WA.setId); if (!s) { $('#wmForm').innerHTML = ''; $('#wmList').innerHTML = ''; return; }
  const f = (id, l, v, t = 'text') => `<div><label>${l}</label><input id="${id}" type="${t}" value="${esc(v)}"></div>`;
  $('#wmForm').innerHTML = `<div class="card" style="background:var(--pl);margin:12px 0 0"><h3>Set details · ${esc(s.id)}</h3><div class="g4">${f('xC', 'Class', s.cls)}${f('xS', 'Subject', s.subject)}${f('xP', 'Paper', s.paper)}${f('xH', 'Chapter', s.chapter)}${f('xN', 'Set name', s.name)}
    ${f('xM', 'Exam time (min)', s.mins, 'number')}${f('xU', 'Upload window (min)', s.um, 'number')}${f('xPM', 'Part marks', JSON.parse(s.pm || '[]').join(','))}</div>
    <button class="btn ok sm" data-a="wmSaveSet">Save set details</button></div>`;
  $('#wmList').innerHTML = WA.qs.map((q, i) => `<div class="q" id="wq${i}"><div class="qh"><span><span class="qid">${esc(q.id)}</span><b>প্রশ্ন ${i + 1}</b></span>
    <span style="white-space:nowrap"><button class="btn s sm" data-a="wqEdit" data-i="${i}">Edit</button> <button class="btn del sm" data-a="wqDel" data-i="${i}">Delete</button></span></div>
    <div class="stem">${fq(q.stem)}</div>${q.parts.map((t, k) => `<div class="wp"><span class="lb">${WL[k]}</span><span class="tx">${fq(t)}</span><span class="sc">${WA.pm[k] ?? ''}</span></div>`).join('')}</div>`).join('') || '<p class="mu">No questions in this set.</p>';
}

/* ---- Exam Paper (marking) page ---- */
let WG = null;
VIEWS.wgrade = async (a) => {
  WG = await api('wGet', { id: a.id });
  const x = WG.a, st = { writing: 'Writing', upload: 'Uploading', submitted: 'Submitted', graded: 'Marked (not published)', published: 'Published' }[x.status];
  $('#app').innerHTML = `<div class="crumb"><a data-a="go" data-v="admin">← Admin</a></div>
  <div class="card"><div class="row" style="align-items:flex-start"><div><h2>Exam Paper · ${esc(x.name)}</h2><div style="font-weight:600">${esc(WG.set.cls)} · ${esc(WG.set.subject)} (${esc(WG.set.paper)}) · ${esc(WG.set.chapter)} · ${esc(WG.set.name)}</div>
    <div class="mu">Roll ${esc(x.roll)} · ${esc(x.email)} · Attempt #${x.no} · ${fmtDT(x.ts)}</div></div><div style="text-align:right"><span class="pill ${x.status === 'published' ? 'g' : 'w'}">${st}</span><div class="score" id="wTot">0 / ${x.total}</div></div></div></div>
  ${WG.qs.map(q => `<div class="card"><div class="row"><b>প্রশ্ন ${q.n}</b><span class="pill" id="qt${q.n}"></span></div><div class="stem">${fq(q.stem)}</div>
    ${q.parts.map((p, i) => { const mk = (WG.marks[q.n] || [])[i] || {};
      return `<div class="wp" style="flex-wrap:wrap"><span class="lb">${WL[i]}</span><span class="tx" style="min-width:60%">${fq(p.t)}</span>
      <span style="white-space:nowrap"><input type="number" data-wm="${q.n}" data-i="${i}" id="m${q.n}_${i}" min="0" max="${p.m}" step="0.25" value="${mk.m ?? ''}" placeholder="0"> / ${p.m}</span>
      <input id="r${q.n}_${i}" placeholder="Remark / comment (optional)" value="${esc(mk.r || '')}" style="width:100%;margin:0 0 0 36px"></div>`; }).join('')}
    ${WG.files[q.n] ? `<div style="margin-top:10px"><b class="mu">Submitted answer sheet</b><div><a class="pill" style="cursor:pointer;margin-top:4px" data-a="wshow" data-id="${esc(x.id)}" data-n="${q.n}">📄 Q${q.n} · ${kb(WG.files[q.n].size)}${(WG.files[q.n].names || []).length ? ' · ' + WG.files[q.n].names.length + ' file(s)' : ''} — click to view</a></div>${(WG.files[q.n].names || []).length ? `<div class="mu">${WG.files[q.n].names.map(esc).join(' · ')}</div>` : ''}</div><div id="sheet${q.n}"></div>` : '<div class="pill r" style="margin-top:10px">No answer sheet uploaded</div>'}</div>`).join('')}
  <div class="card row"><span class="mu">Students see marks &amp; remarks only after you publish.</span><span><button class="btn s" data-a="wmark" data-p="">Save draft</button> <button class="btn ok" data-a="wmark" data-p="1">Save &amp; publish result</button></span></div>`;
  wRecalc();
};
function wMarks() {
  const o = {}; WG.qs.forEach(q => { o[q.n] = q.parts.map((p, i) => ({ m: Math.min(p.m, Math.max(0, +val(`m${q.n}_${i}`) || 0)), r: val(`r${q.n}_${i}`).trim() })); }); return o;
}
function wRecalc() {
  let tot = 0; const mk = wMarks();
  WG.qs.forEach(q => { const g = mk[q.n].reduce((a, x) => a + x.m, 0); tot += g; const el = $('#qt' + q.n); if (el) el.textContent = g + ' / ' + q.parts.reduce((a, p) => a + p.m, 0); });
  $('#wTot').textContent = tot + ' / ' + WG.a.total;
}
document.addEventListener('input', (e) => { if (e.target.dataset && e.target.dataset.wm && WG) wRecalc(); });
document.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.sel === 'wpat') { const p = CONFIG.PATTERNS[e.target.value]; if (p) $('#wPM').value = p.join(','); } });

Object.assign(act, {
  wsave: async () => {
    if (!val('wN').trim()) throw 'Enter a Set name first';
    const pm = val('wPM').split(',').map(x => x.trim()).filter(Boolean).map(Number);
    const j = await api('wSave', { cls: val('wC').trim(), subject: val('wS').trim(), paper: val('wP'), chapter: val('wH').trim(), name: val('wN').trim(), mins: val('wM'), uploadMins: val('wU'),
      partMarks: pm, append: $('#wA').checked, qs: wParse(val('wJ')) });
    toast(`${j.replaced ? 'Replaced' : 'Saved'} written set ${j.setId}: ${j.added} creative question(s). Opening Exams…`); go('exams', { cls: j.cls, subject: j.subject });
  },
  wmLoad: async () => {
    WA.setId = val('wmSet'); if (!WA.setId) return toast('Choose a written set first');
    const j = await api('wListQs', { id: WA.setId }); WA.qs = j.qs; WA.pm = j.pm; drawWm();
  },
  wmSaveSet: async () => {
    const pm = val('xPM').split(',').map(x => x.trim()).filter(Boolean).map(Number);
    await api('editSet', { id: WA.setId, cls: val('xC'), subject: val('xS'), paper: val('xP'), chapter: val('xH'), name: val('xN'), mins: val('xM'), uploadMins: val('xU'), partMarks: JSON.stringify(pm) });
    toast('Set details saved'); go('admin');
  },
  wmDelSet: async () => {
    if (!WA.setId && !(WA.setId = val('wmSet'))) return toast('Choose a written set first');
    if (!confirm('Delete this written set and its questions? Submitted answer sheets stay in Drive.')) return;
    await api('delSet', { id: WA.setId }); WA.setId = ''; toast('Set deleted'); go('admin');
  },
  wqEdit: (d) => {
    const i = +d.i, q = WA.qs[i];
    $('#wq' + i).innerHTML = `<div class="mu" style="margin-bottom:6px"><span class="qid">${esc(q.id)}</span> editing</div><label>Context (uddipok)</label><textarea id="eqs" style="min-height:100px">${esc(q.stem)}</textarea>
    <label>Parts — one per line (ক, খ, গ, ঘ order; ${WA.pm.length} lines)</label><textarea id="eqp" style="min-height:110px">${esc(q.parts.join('\n'))}</textarea>
    <button class="btn ok sm" data-a="wqSave" data-i="${i}">Save</button> <button class="btn no sm" data-a="wqCancel">Cancel</button>`;
  },
  wqCancel: () => drawWm(),
  wqSave: async (d) => {
    const q = WA.qs[+d.i], parts = val('eqp').split('\n').map(s => s.trim()).filter(Boolean);
    await api('wEditQ', { id: q.id, stem: val('eqs'), parts }); WA.qs[+d.i] = { id: q.id, stem: val('eqs').trim(), parts }; toast('Saved ' + q.id); drawWm();
  },
  wqDel: async (d) => { const q = WA.qs[+d.i]; if (!confirm('Delete ' + q.id + '?')) return; await api('delQ', { id: q.id }); WA.qs.splice(+d.i, 1); toast('Deleted ' + q.id); drawWm(); },
  wsLoad: async () => {
    const j = await api('wSubs', { setId: val('wsSet') }), SW = { writing: 'Writing', upload: 'Uploading', submitted: 'Submitted', graded: 'Marked', published: 'Published' };
    $('#wsList').innerHTML = `<div class="tw"><table><tr><th>Student</th><th>Exam</th><th>Attempt</th><th>Status</th><th>Files</th><th>Marks</th><th></th></tr>
    ${j.rows.map(r => `<tr><td><b>${esc(r.who)}</b><div class="mu">${esc(r.roll)} · ${esc(r.email)}</div></td><td>${esc(r.chapter)} <span class="pill">${esc(r.setName)}</span></td><td>#${r.no}<div class="mu">${fmtDT(r.ts)}</div></td>
    <td><span class="pill ${r.status === 'published' ? 'g' : r.status === 'submitted' ? 'r' : 'w'}">${SW[r.status]}</span></td><td>${r.files}</td><td>${r.obtained != null ? r.obtained + ' / ' + r.total : '–'}</td>
    <td><button class="btn sm" data-a="wgrade" data-id="${r.id}">Exam Paper</button></td></tr>`).join('') || '<tr><td colspan="7" class="mu">No submissions yet.</td></tr>'}</table></div>`;
  },
  wgrade: (d) => go('wgrade', { id: d.id }),
  wmark: async (d) => {
    const pub = !!d.p; if (pub && !confirm('Publish this result? The student will see marks and remarks.')) return;
    const j = await api('wMark', { id: WG.a.id, marks: wMarks(), publish: pub }); toast(pub ? 'Result published (' + j.obtained + ')' : 'Draft saved (' + j.obtained + ')');
    if (pub) go('admin');
  }
});
