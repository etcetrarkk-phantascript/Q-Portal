/* QUICK EDIT (admin): ✎ pen icons open a pop-up editor for a whole set — edit/delete questions, hide/show, set details.
   Pen icons appear in: Exams list, Result/Solution sheets, the CQ marking page and shared question pages. */
function closeQ(refresh) { const el = $('#qov'); if (el) { el.remove(); if (refresh && V === 'exams') go('exams'); } }
function adminRefresh() { if (V === 'exams') go('exams'); else if (V === 'admin') go('admin'); else { closeQ(false); toast('Saved.'); } }
act.qclose = () => closeQ(true);
act.qedit = async (d) => {
  if (S.u.role !== 'admin') return;
  S.sets = (await api('catalog')).sets;
  const s = S.sets.find(x => x.id === d.id); if (!s) throw 'This set was not found (deleted?)';
  closeQ(false); const cq = s.type === 'written';
  $('#app').insertAdjacentHTML('beforeend', `<div class="ov" id="qov"><div class="ovb"><div class="row"><h2>✎ ${esc(s.chapter)} · ${esc(s.name)} <span class="pill">${cq ? 'CQ' : 'MCQ'}</span></h2><button class="btn no sm" data-a="qclose">✕ Close</button></div>
    ${cq ? '<div id="wmForm"></div><div id="wmList" style="margin-top:12px"></div>' : '<div id="mSetForm"></div><div id="mList" style="margin-top:12px"></div>'}</div></div>`);
  if (cq) { WA.sets = S.sets.filter(x => x.type === 'written'); WA.setId = s.id; const j = await api('wListQs', { id: s.id }); WA.qs = j.qs; WA.pm = j.pm; drawWm(); }
  else { AD.sets = S.sets; AD.setId = s.id; AD.qs = (await api('listQs', { id: s.id })).qs; drawSetForm(); drawQs(); }
  if (d.q) {   // jump straight into editing the clicked question
    const arr = cq ? WA.qs : AD.qs, i = arr.findIndex(x => x.id === d.q);
    if (i >= 0) { (cq ? act.wqEdit : act.mEdit)({ i }); const el = $('#' + (cq ? 'wq' : 'mq') + i); if (el) el.scrollIntoView({ block: 'center' }); }
  }
};
