/* ADMIN: publish (JSON) · manage questions (edit/delete by ID) · approvals */
let AD = { sets: [], setId: '', qs: [] };
function parseQs(t) {
  t = t.trim().replace(/^return\s+/, '').replace(/;\s*$/, '');
  const i = t.indexOf('['), j = t.lastIndexOf(']');
  if (i < 0 || j < 0) throw 'No [ ... ] array found';
  let a; try { a = JSON.parse(t.slice(i, j + 1)); } catch (e) { a = new Function('return ' + t.slice(i, j + 1))(); }
  if (!Array.isArray(a) || !a.length) throw 'Array is empty';
  return a;
}
VIEWS.admin = async () => {
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  const [p, c] = await Promise.all([api('pending'), api('catalog')]);
  AD.sets = c.sets;
  const dl = (id, arr) => `<datalist id="${id}">${[...new Set(arr)].map(v => `<option value="${esc(v)}">`).join('')}</datalist>`;
  $('#app').innerHTML = `
  <div class="card"><h2>1 · Publish questions</h2><p class="mu">Paste the Gemini array. <b>Set name</b> tells sets apart: same chapter + same name = replaced (or tick Append to add); a new name = a separate set. Leave it empty to auto-name "Set 2", "Set 3"… IDs are assigned automatically.</p>
    <div class="g4" style="margin-top:10px"><div><label>Class</label><input id="aC" list="dC" value="${esc(CONFIG.CLASSES[0])}"></div><div><label>Subject</label><input id="aS" list="dS" placeholder="Physics"></div>
    <div><label>Paper</label><select id="aP">${CONFIG.PAPERS.map(x => `<option>${esc(x)}</option>`).join('')}</select></div><div><label>Chapter</label><input id="aH" list="dH" placeholder="Chapter 2: Static Electricity"></div>
    <div><label>Set name (required)</label><input id="aN" list="dN" placeholder="e.g. Set 1, Model Test"></div>
    <div><label>Time (minutes)</label><input id="aM" type="number" value="${CONFIG.DEFAULT_MINS}"></div><div><label>Marks / correct</label><input id="aPo" type="number" step=".25" value="${CONFIG.DEFAULT_POS}"></div><div><label>Negative / wrong</label><input id="aNe" type="number" step=".05" value="${CONFIG.DEFAULT_NEG}"></div></div>
    ${dl('dC', [...CONFIG.CLASSES, ...c.sets.map(s => s.cls)])}${dl('dS', c.sets.map(s => s.subject))}${dl('dH', c.sets.map(s => s.chapter))}${dl('dN', c.sets.map(s => s.name))}
    <textarea id="aJ" placeholder='return [ { "q": "1. ...", "options": ["(a) ...","(b) ...","(c) ...","(d) ..."], "ans": 0 } ]'></textarea>
    <div class="row"><label><input type="checkbox" id="aA" style="width:auto;margin:0 6px 0 0">Append to existing chapter</label><button class="btn" data-a="save">Publish</button></div></div>
  <div class="card"><h2>2 · Manage questions</h2><div class="row"><select id="mSet" style="flex:1;margin:0"><option value="">Choose chapter…</option>
    ${c.sets.map(s => `<option value="${esc(s.id)}" ${s.id === AD.setId ? 'selected' : ''}>${esc(s.id)} · ${esc(s.cls)} › ${esc(s.subject)} › ${esc(s.paper)} › ${esc(s.chapter)} › ${esc(s.name)} (${s.n})</option>`).join('')}</select>
    <button class="btn s sm" data-a="mLoad">Load</button><button class="btn del sm" data-a="mDelSet">Delete chapter</button></div><div id="mList" style="margin-top:12px"></div></div>
  <div class="card"><h3>Solution requests (${p.reqs.length})</h3><div class="tw"><table>${p.reqs.map(x => `<tr><td><b>${esc(x.who)}</b><div class="mu">${esc(x.email)}</div></td><td>Attempt #${x.no} · ${x.marks}/${x.total}</td>
    <td style="text-align:right"><button class="btn ok sm" data-a="dec" data-k="sol" data-id="${x.id}" data-y="1">Approve</button> <button class="btn no sm" data-a="dec" data-k="sol" data-id="${x.id}">Reject</button></td></tr>`).join('') || '<tr><td class="mu">Nothing pending.</td></tr>'}</table></div></div>
  <div class="card"><h3>Registration approvals (${p.users.length})</h3><div class="tw"><table>${p.users.map(x => `<tr><td><b>${esc(x.name)}</b><div class="mu">${esc(x.email)}</div></td><td class="mu">${esc(x.cls)} · ${esc(x.roll)}</td>
    <td style="text-align:right"><button class="btn ok sm" data-a="dec" data-k="user" data-id="${x.email}" data-y="1">Approve</button> <button class="btn no sm" data-a="dec" data-k="user" data-id="${x.email}">Reject</button></td></tr>`).join('') || '<tr><td class="mu">Nothing pending.</td></tr>'}</table></div></div>`;
  if (AD.setId) act.mLoad();
};
function drawQs() {
  $('#mList').innerHTML = AD.qs.map((q, i) => `<div class="q" id="mq${i}"><div class="qh"><span><span class="qid">${esc(q.id)}</span>${esc(q.q)}</span>
    <span style="white-space:nowrap"><button class="btn s sm" data-a="mEdit" data-i="${i}">Edit</button> <button class="btn del sm" data-a="mDel" data-i="${i}">Delete</button></span></div>
    <div class="os two">${q.options.map((o, k) => `<div class="o ${k === q.ans ? 'y' : ''}"><i class="b">${L[k]}</i><span>${esc(clean(o))}</span></div>`).join('')}</div></div>`).join('') || '<p class="mu">No questions in this chapter.</p>';
}
Object.assign(act, {
  save: async () => {
    if (!val('aN').trim()) throw 'Enter a Set name first (e.g. Set 1, Model Test)';
    const qs = parseQs(val('aJ')), cls = val('aC').trim(), subject = val('aS').trim(), paper = val('aP'), chapter = val('aH').trim();
    const j = await api('saveSet', { cls, subject, paper, chapter, name: val('aN').trim(), mins: val('aM'), pos: val('aPo'), neg: val('aNe'), append: $('#aA').checked, qs });
    toast(`${j.replaced ? 'Replaced' : 'Saved'} “${j.name}” (${j.setId}): ${j.added} questions. Opening Exams…`);
    go('exams', { cls: j.cls, subject: j.subject });
  },
  mLoad: async () => {
    AD.setId = val('mSet'); if (!AD.setId) return toast('Choose a chapter first');
    AD.qs = (await api('listQs', { id: AD.setId })).qs; drawQs();
  },
  mEdit: (d) => {
    const i = +d.i, q = AD.qs[i];
    $('#mq' + i).innerHTML = `<div class="mu" style="margin-bottom:6px"><span class="qid">${esc(q.id)}</span> editing</div><label>Question</label><textarea id="eq" style="min-height:70px">${esc(q.q)}</textarea>
    <label>Options (one per line)</label><textarea id="eo" style="min-height:90px">${esc(q.options.join('\n'))}</textarea><label>Correct option number (1 = first)</label><input id="ea" type="number" min="1" value="${q.ans + 1}">
    <button class="btn ok sm" data-a="mSave" data-i="${i}">Save</button> <button class="btn no sm" data-a="mCancel">Cancel</button>`;
  },
  mCancel: () => drawQs(),
  mSave: async (d) => {
    const q = AD.qs[+d.i], options = val('eo').split('\n').map(s => s.trim()).filter(Boolean);
    await api('editQ', { id: q.id, q: val('eq'), options, ans: (+val('ea')) - 1 });
    AD.qs[+d.i] = { id: q.id, q: val('eq').trim(), options, ans: (+val('ea')) - 1 }; toast('Saved ' + q.id); drawQs();
  },
  mDel: async (d) => { const q = AD.qs[+d.i]; if (!confirm('Delete ' + q.id + '?')) return; await api('delQ', { id: q.id }); AD.qs.splice(+d.i, 1); toast('Deleted ' + q.id); drawQs(); },
  mDelSet: async () => {
    if (!AD.setId && !(AD.setId = val('mSet'))) return toast('Choose a chapter first');
    if (!confirm('Delete the whole chapter and all its questions? Past results stay in History but their sheets will no longer open.')) return;
    await api('delSet', { id: AD.setId }); AD.setId = ''; AD.qs = []; toast('Chapter deleted'); go('admin');
  },
  dec: async (d) => { await api('decide', { kind: d.k, id: d.id, yes: !!d.y }); toast('Done.'); go('admin'); }
});
