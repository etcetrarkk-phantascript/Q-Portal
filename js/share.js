/* SHARE: links to a question (#q=S1-Q003) or a whole exam set (#set=S1). Sign-in required; answers are never shown to students. */
const base = () => location.origin + location.pathname;
function parseHash() { const m = location.hash.match(/^#(q|set)=(.+)$/); return m ? { v: m[1], id: decodeURIComponent(m[2]) } : null; }
VIEWS.q = async (id) => {
  S.pendV = S.pendId = null;
  const j = await api('getQ', { id }), q = j.q, s = j.set, adm = S.u.role === 'admin';
  $('#app').innerHTML = `<div class="card"><div class="row"><span><span class="qid">${esc(q.id)}</span> <span class="mu">${esc(s.cls)} › ${esc(s.subject)} › ${esc(s.paper)} › ${esc(s.chapter)} · ${esc(s.name)}</span></span>
    <button class="btn s sm" data-a="copyq" data-id="${esc(q.id)}">🔗 Copy link</button></div>
    <div class="qh" style="margin-top:12px"><span>${fq(q.q)}</span></div>
    <div class="os">${q.options.map((o, k) => `<div class="o ${adm && q.ans === k ? 'y' : ''}"><i class="b">${L[k]}</i><span>${fopt(o)}</span></div>`).join('')}</div>
    <p class="mu">${adm ? 'Admin view: the correct option is highlighted.' : 'Answers are not shown here. Take the exam to test yourself.'}</p>
    <button class="btn" data-a="start" data-id="${esc(s.id)}">▶ Start this exam (${esc(s.name)})</button></div>`;
};
VIEWS.set = async (id) => {
  S.pendV = S.pendId = null;
  const s = (await api('catalog')).sets.find(x => x.id === id);
  if (!s) throw 'This exam was not found (it may have been deleted).';
  $('#app').innerHTML = `<div class="card"><div class="mu">${esc(s.cls)} › ${esc(s.subject)} › ${esc(s.paper)} › ${esc(s.chapter)}</div><h2 style="margin-top:6px">${esc(s.name)}</h2>
    <p class="mu">${s.n} questions · ${s.mins} min · +${s.pos} / −${s.neg}</p>
    <button class="btn" data-a="start" data-id="${esc(s.id)}">▶ Start exam</button> <button class="btn s" data-a="copyset" data-id="${esc(s.id)}">🔗 Copy link</button></div>`;
};
const copyLink = async (u) => { try { await navigator.clipboard.writeText(u); toast('Link copied: ' + u); } catch (e) { prompt('Copy this link:', u); } };
act.copyq = (d) => copyLink(base() + '#q=' + encodeURIComponent(d.id));
act.copyset = (d) => copyLink(base() + '#set=' + encodeURIComponent(d.id));
window.addEventListener('hashchange', () => { const h = parseHash(); if (h && S.u) go(h.v, h.id); });
