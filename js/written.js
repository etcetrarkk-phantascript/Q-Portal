/* WRITTEN EXAMS (student): paper → compressed answer-sheet upload (PDF per question) → result after admin publishes */
let WE = null, WT = null, WF = {};
const WL = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
const wtime = (s) => { s = Math.max(0, Math.ceil(s)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':'); };
const kb = (n) => Math.max(1, Math.round(n / 1024)) + ' KB';
const WST = { writing: 'Writing', upload: 'Uploading answers', submitted: 'Submitted · awaiting marking', graded: 'Under evaluation', published: 'Result published' };

function paperHtml(qs) {
  return qs.map(q => `<div class="q"><div class="row"><b>প্রশ্ন ${q.n}</b><span class="pill">${q.parts.reduce((a, p) => a + p.m, 0)} marks</span></div>
    <div class="stem">${fq(q.stem)}</div>${q.parts.map((p, i) => `<div class="wp"><span class="lb">${WL[i]}</span><span class="tx">${fq(p.t)}</span><span class="sc">${p.m}</span></div>`).join('')}</div>`).join('');
}

/* ---- compression: photos / PDFs → one small PDF ---- */
async function filesToPdf(files, say) {
  const Q = CONFIG.COMPRESS, pages = [];
  const addCanvas = (src, w, h) => {
    const k = Math.min(1, Q.maxSide / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0, c.width, c.height);
    pages.push({ url: c.toDataURL('image/jpeg', Q.quality), w: c.width, h: c.height });
  };
  for (const f of files) {
    if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
      if (!window.pdfjsLib) throw 'PDF reader could not load. Upload photos (JPG/PNG) instead.';
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
      for (let i = 1; i <= doc.numPages; i++) {
        say(`Compressing ${f.name} (${i}/${doc.numPages})…`);
        const pg = await doc.getPage(i), v0 = pg.getViewport({ scale: 1 }), v = pg.getViewport({ scale: Math.min(3, Q.maxSide / Math.max(v0.width, v0.height)) });
        const c = document.createElement('canvas'); c.width = v.width; c.height = v.height;
        await pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise; addCanvas(c, c.width, c.height);
      }
    } else {
      say(`Compressing ${f.name}…`);
      let bmp; try { bmp = await createImageBitmap(f, { imageOrientation: 'from-image' }); }
      catch (e) {   // SVG and some formats: fall back to an <img>
        bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f); })
          .catch(() => { throw f.name + ': this image format is not supported (iPhone HEIC?). Use JPG/PNG/SVG or a PDF.'; });
      }
      addCanvas(bmp, bmp.naturalWidth || bmp.width || 1200, bmp.naturalHeight || bmp.height || 1600);
    }
  }
  if (!pages.length) throw 'No pages found in the selected file(s)';
  const { jsPDF } = window.jspdf, W = 595; let pdf;
  pages.forEach((p, i) => {
    const H = Math.round(W * p.h / p.w), o = W > H ? 'l' : 'p';
    if (i === 0) pdf = new jsPDF({ unit: 'pt', format: [W, H], orientation: o, compress: true }); else pdf.addPage([W, H], o);
    pdf.addImage(p.url, 'JPEG', 0, 0, W, H, undefined, 'FAST');
  });
  const out = pdf.output('datauristring'), b64 = out.slice(out.lastIndexOf(',') + 1);
  if (b64.length * 0.75 > Q.maxMB * 1048576) throw `Compressed file is ${kb(b64.length * 0.75)} (limit ${Q.maxMB} MB). Send fewer pages or clearer, smaller photos.`;
  return b64;
}

/* ---- exam screen (read-only paper) + "Submit Answer Sheet" pop-up ---- */
VIEWS.wexam = () => {
  clearInterval(WT);
  const st = WE.status, set = WE.set;
  if (st === 'writing') {
    $('#app').innerHTML = `<div class="stick"><span style="font-size:13px">${esc(set.chapter)} · ${esc(set.name)}</span><b id="wtm"></b><button class="btn sm" style="background:#fff;color:var(--p)" data-a="wend">Submit Answer Sheet</button></div>
    ${paperHtml(WE.qs)}<div class="card row"><span class="mu">Write your answers on paper. When you finish (or time ends) upload photos/PDFs of your answer sheet — you get ${set.um} minutes for the upload.</span><button class="btn" data-a="wend">Submit Answer Sheet</button></div>`;
    const end = Date.now() + WE.secLeft * 1000;
    const tick = () => { const s = (end - Date.now()) / 1000; if ($('#wtm')) $('#wtm').textContent = wtime(s); if (V !== 'wexam') clearInterval(WT); else if (s <= 0) { clearInterval(WT); act.wend({}, null, true); } };
    tick(); WT = setInterval(tick, 500);
  } else if (st === 'upload') {
    $('#app').innerHTML = `<div class="ov"><div class="ovb"><div class="row"><h2>Submit Answer Sheet</h2><span class="tmb" id="wtm"></span></div>
    <p class="mu">Add one or more photos (JPG, PNG, SVG…) or PDFs for each question. They are compressed and saved automatically when you press Submit.</p>
    ${WE.qs.map(q => `<div class="card"><div class="row"><b>প্রশ্ন ${q.n}</b><span class="mu" id="ws${q.n}">${WE.files[q.n] ? '✓ Already uploaded (' + kb(WE.files[q.n].size) + ') — choose files to replace' : 'No file yet'}</span></div>
      <input type="file" multiple hidden id="wi${q.n}" accept="image/*,.svg,application/pdf,.pdf" data-wn="${q.n}"><div id="wl${q.n}"></div><button class="btn s sm" data-a="wadd" data-n="${q.n}">＋ Add photo / PDF</button></div>`).join('')}
    <details class="card"><summary><b>View question paper</b></summary>${paperHtml(WE.qs)}</details>
    <div class="row"><span class="mu">Upload time left is shown at the top right.</span><button class="btn" data-a="wsubmit">Submit</button></div></div></div>`;
    const end = Date.now() + WE.upLeft * 1000;
    const tick = () => { const s = (end - Date.now()) / 1000; if ($('#wtm')) $('#wtm').textContent = wtime(s); if (V !== 'wexam') clearInterval(WT); else if (s <= 0) { clearInterval(WT); toast('Upload time is over.'); go('hist'); } };
    tick(); WT = setInterval(tick, 500);
  } else { toast('This exam is already submitted.'); go('hist'); }
};
const wlist = (n) => { const el = $('#wl' + n); if (el) el.innerHTML = (WF[n] || []).map((f, i) => `<div class="row" style="padding:4px 0"><span>📎 ${esc(f.name)} <span class="mu">(${kb(f.size)})</span></span><a data-a="wrm" data-n="${n}" data-i="${i}" style="cursor:pointer;color:var(--r);font-weight:700">✕</a></div>`).join(''); };
document.addEventListener('change', (e) => {   // each "+ Add" appends to the list for that question
  const n = e.target.dataset && e.target.dataset.wn; if (!n) return;
  WF[n] = (WF[n] || []).concat([...e.target.files]); e.target.value = ''; wlist(n);
});
const wsay = (n, m) => { const el = $('#ws' + n); if (el) el.textContent = m; };

/* ---- result ---- */
VIEWS.wresult = async (a) => {
  const j = await api('wResult', { id: a.id }), m = j.meta;
  $('#app').innerHTML = `<div class="card"><div class="row" style="align-items:flex-start"><div><div class="mu" style="font-weight:700;color:var(--p);text-transform:uppercase">Written result</div>
    <h2>${esc(m.cls)} · ${esc(m.subject)} (${esc(m.paper)})</h2><div style="font-weight:600">${esc(m.chapter)} · ${esc(m.setName)}</div><div class="mu">${esc(m.name)} · Roll ${esc(m.roll)} · Attempt #${m.no} · ${fmtDT(m.ts)}</div></div>
    <div style="text-align:right"><div class="mu">Obtained marks</div><div class="score">${m.obtained} / ${m.total}</div></div></div></div>
  ${j.qs.map(q => { const mk = j.marks[q.n] || [], got = mk.reduce((a, x) => a + (x.m || 0), 0), max = q.parts.reduce((a, p) => a + p.m, 0);
    return `<div class="card"><div class="row"><b>প্রশ্ন ${q.n}</b><span class="pill ${got / max >= .6 ? 'g' : got / max >= .33 ? 'w' : 'r'}">${got} / ${max}</span></div><div class="stem">${fq(q.stem)}</div>
    ${q.parts.map((p, i) => `<div class="wp"><span class="lb">${WL[i]}</span><span class="tx">${fq(p.t)}${mk[i] && mk[i].r ? `<div class="rmk">💬 ${esc(mk[i].r)}</div>` : ''}</span><b style="white-space:nowrap">${mk[i] ? mk[i].m : 0} / ${p.m}</b></div>`).join('')}
    ${j.files[q.n] ? `<button class="btn s sm" data-a="wshow" data-id="${esc(a.id)}" data-n="${q.n}">View my answer sheet</button><div id="sheet${q.n}"></div>` : ''}</div>`; }).join('')}`;
};
async function loadSheet(id, n) {
  const j = await api('wSheet', { id, n }), bin = atob(j.data), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  $('#sheet' + n).innerHTML = `<p><a class="btn sm" href="${url}" target="_blank">Open / download PDF</a> <span class="mu">${esc(j.name)} · ${kb(bytes.length)}</span></p><iframe src="${url}" style="width:100%;height:520px;border:1px solid var(--bd);border-radius:10px"></iframe>`;
}

/* ---- History section ---- */
function drawWHist() {
  if (S.u.role === 'admin' || !WH.length) return;
  $('#app').insertAdjacentHTML('beforeend', `<div class="card"><h2>Written exams</h2><div class="tw"><table><tr><th>Date</th><th>Exam</th><th>Attempt</th><th>Status</th><th>Marks</th><th></th></tr>
  ${WH.map(r => `<tr><td class="mu">${fmtDT(r.ts)}</td><td><b>${esc(r.chapter)}</b> <span class="pill">${esc(r.setName)}</span><div class="mu">${esc(r.cls)} · ${esc(r.subject)} · ${esc(r.paper)}</div></td><td>#${r.no}</td>
  <td><span class="pill ${r.status === 'published' ? 'g' : 'w'}">${WST[r.status] || r.status}</span></td><td>${r.obtained != null ? `<b>${r.obtained} / ${r.total}</b>` : '–'}</td>
  <td>${r.status === 'published' ? `<button class="btn ok sm" data-a="wres" data-id="${r.id}">View result</button>` : (r.status === 'writing' || r.status === 'upload') ? `<button class="btn sm" data-a="wstart" data-id="${r.setId}">Continue</button>` : ''}</td></tr>`).join('')}</table></div></div>`);
}

Object.assign(act, {
  wstart: async (d) => { WE = await api('wStart', { id: d.id }); WF = {}; go('wexam'); },
  wend: async (d, bt, auto) => {
    if (!auto && !confirm('Submit your answer sheet now? Writing time ends and the ' + WE.set.um + '-minute upload window starts.')) return;
    clearInterval(WT); WE = await api('wEnd', { id: WE.attempt.id }); WF = {}; go('wexam');
  },
  wadd: (d) => $('#wi' + d.n).click(),
  wrm: (d) => { WF[d.n].splice(+d.i, 1); wlist(d.n); },
  wsubmit: async () => {
    const ns = WE.qs.map(q => q.n), todo = ns.filter(n => WF[n] && WF[n].length), miss = ns.filter(n => !todo.includes(n) && !WE.files[n]);
    if (!todo.length && miss.length === ns.length) throw 'Add at least one photo or PDF first';
    if (miss.length && !confirm('No answer added for question ' + miss.join(', ') + '. Submit anyway?')) return;
    let bad = 0;
    for (const n of todo) {
      try {
        wsay(n, 'Compressing…'); const b64 = await filesToPdf(WF[n], m => wsay(n, m)); wsay(n, 'Uploading ' + kb(b64.length * 0.75) + '…');
        const j = await api('wUpload', { id: WE.attempt.id, n, data: b64, names: WF[n].map(f => f.name) }); WE.files = j.files; WF[n] = []; wlist(n); wsay(n, '✓ Uploaded ' + kb(j.files[n].size));
      } catch (e) { bad++; wsay(n, '⚠ ' + (typeof e === 'string' ? e : e.message)); }
    }
    if (bad) throw 'Some files failed — fix them and press Submit again.';
    clearInterval(WT); await api('wFinish', { id: WE.attempt.id }); WE = null; toast('Answer sheet submitted. Marks appear after the admin publishes the result.'); go('hist');
  },
  wres: (d) => go('wresult', { id: d.id }),
  wshow: (d) => loadSheet(d.id, d.n)
});
