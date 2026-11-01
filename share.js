/* SHARE: every question has a link like  https://your-site/#q=S1-Q003  (sign-in required; answers are never shown to students) */
const qLink = (id) => location.origin + location.pathname + '#q=' + encodeURIComponent(id);
VIEWS.q = async (id) => {
  S.pendQ = null;
  const j = await api('getQ', { id }), q = j.q, s = j.set, adm = S.u.role === 'admin';
  $('#app').innerHTML = `<div class="card"><div class="row"><span><span class="qid">${esc(q.id)}</span> <span class="mu">${esc(s.cls)} › ${esc(s.subject)} › ${esc(s.paper)} › ${esc(s.chapter)} · ${esc(s.name)}</span></span>
    <button class="btn s sm" data-a="copyq" data-id="${esc(q.id)}">🔗 Copy link</button></div>
    <div class="qh" style="margin-top:12px"><span>${esc(q.q)}</span></div>
    <div class="os">${q.options.map((o, k) => `<div class="o ${adm && q.ans === k ? 'y' : ''}"><i class="b">${L[k]}</i><span>${esc(clean(o))}</span></div>`).join('')}</div>
    <p class="mu">${adm ? 'Admin view: the correct option is highlighted.' : 'Answers are not shown here. Take the exam to test yourself.'}</p>
    <button class="btn" data-a="start" data-id="${esc(s.id)}">▶ Start this exam (${esc(s.name)})</button></div>`;
};
act.copyq = async (d) => {
  const u = qLink(d.id);
  try { await navigator.clipboard.writeText(u); toast('Link copied: ' + u); } catch (e) { prompt('Copy this link:', u); }
};
window.addEventListener('hashchange', () => { const m = location.hash.match(/^#q=(.+)$/); if (m && S.u) go('q', decodeURIComponent(m[1])); });
