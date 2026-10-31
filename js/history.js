/* HISTORY: when, which, how many times, result, time taken, request Solution */
VIEWS.hist = async () => {
  $('#app').innerHTML = '<p class="mu">Loading…</p>';
  const rows = (await api('history')).rows, adm = S.u.role === 'admin', mine = rows.filter(r => r.mine);
  $('#app').innerHTML = `<div class="card"><h2>${adm ? 'All attempts' : 'My exam history'}</h2>
  <p class="mu">${mine.length} exam(s) taken · ${new Set(mine.map(r => r.chapter + r.subject)).size} different chapter(s)</p>
  <div class="tw"><table><tr><th>Date & time</th>${adm ? '<th>User</th>' : ''}<th>Exam</th><th>Attempt</th><th>Result</th><th>Time taken</th><th>Result</th><th>Solution</th></tr>
  ${rows.map(r => `<tr><td class="mu">${fmtDT(r.ts)}</td>${adm ? `<td>${esc(r.who)}</td>` : ''}
  <td><b>${esc(r.chapter)}</b><div class="mu">${esc(r.cls)} · ${esc(r.subject)} · ${esc(r.paper)}</div></td>
  <td>#${r.no} <span class="mu">of ${r.of}</span></td>
  <td><b>${r.marks} / ${r.total}</b> <span class="pill ${r.pct >= 60 ? 'g' : r.pct >= 33 ? 'w' : 'r'}">${r.pct}%</span><div class="mu">✓${r.correct} ✕${r.wrong}</div></td>
  <td>${fmtT(r.secs)}</td>
  <td><button class="btn sm" data-a="rep" data-id="${r.id}" data-t="1">Result</button></td>
  <td>${r.solution === 'approved' ? `<button class="btn ok sm" data-a="rep" data-id="${r.id}" data-t="2">Solution</button>`
    : r.solution === 'requested' ? '<span class="pill w">Pending</span>' : `<button class="btn s sm" data-a="reqsol" data-id="${r.id}" data-h="1">Request</button>`}</td></tr>`).join('')
    || `<tr><td colspan="8" class="mu">No attempts yet. Take an exam from the Exams tab.</td></tr>`}</table></div></div>`;
};
