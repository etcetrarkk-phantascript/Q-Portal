/* MATH: shows plain/unicode math (ε₀, x², (a / b)^(1/3), √x, ∝ …) as real KaTeX formulas automatically.
   Text that already contains $...$ (or comes from qLatex/optionsLatex) is left untouched.
   Best results: ask Gemini for $...$ LaTeX inside "q"/"options" (see js/config.js). */
const GREEK = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'varepsilon', ζ: 'zeta', η: 'eta', θ: 'theta', κ: 'kappa', λ: 'lambda', μ: 'mu', ν: 'nu', ξ: 'xi', π: 'pi', ρ: 'rho', σ: 'sigma', τ: 'tau', φ: 'phi', χ: 'chi', ψ: 'psi', ω: 'omega', Γ: 'Gamma', Δ: 'Delta', Θ: 'Theta', Λ: 'Lambda', Π: 'Pi', Σ: 'Sigma', Φ: 'Phi', Ω: 'Omega' };
const OPS = { '∝': '\\propto ', '≈': '\\approx ', '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '∞': '\\infty ', '×': '\\times ', '·': '\\cdot ', '±': '\\pm ', '→': '\\to ', '°': '^\\circ ', '−': '-', '′': "'", '∴': '\\therefore ' };
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
const MATHCH = "A-Za-z0-9_+\\-*/=<>^()\\[\\]{}'|%\\u0370-\\u03FF\\u2070-\\u22FF\\u00B0-\\u00B9\\u00D7";
const UNIT = `(?:[${MATHCH}]|\\.(?=\\d))+`;                       // "." only inside numbers like 1.6
const RUN = new RegExp(`${UNIT}(?: +${UNIT})*`, 'g');
const BN = /[\u0980-\u09FF]/, MS = /[0-9^=+*\/<>_\u0370-\u03FF\u2070-\u22FF\u00B0-\u00B9\u00D7]/;
const TOK = 'A-Za-z0-9\\u0370-\\u03FF\\u2070-\\u209F\\u00B2\\u00B3\\u00B9';

function unwrap(x) {   // "(a+b)" → "a+b" when one pair of brackets wraps everything
  if (!/^[(\[]/.test(x) || !/[)\]]$/.test(x)) return x;
  let d = 0;
  for (let i = 0; i < x.length; i++) { if ('(['.includes(x[i])) d++; else if (')]'.includes(x[i])) { d--; if (!d && i < x.length - 1) return x; } }
  return x.slice(1, -1);
}
function frac(s) {   // "A / B" (spaced slash) → \dfrac, recursing into ( ) and [ ]
  let parts = [], cur = '', dd = 0;                       // split at top-level relations (= ∝ ≈ ≤ ≥ ≠ < >) first
  for (const c of s) {
    if ('([{'.includes(c)) dd++; else if (')]}'.includes(c)) dd--;
    if (dd === 0 && '=∝≈≤≥≠<>'.includes(c)) { parts.push(cur, c); cur = ''; } else cur += c;
  }
  if (parts.length) { parts.push(cur); return parts.map(p => '=∝≈≤≥≠<>'.includes(p) && p.length === 1 ? p : frac(p.trim())).join(' '); }
  let d = 0, idx = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--;
    else if (c === '/' && d === 0 && s[i - 1] === ' ' && s[i + 1] === ' ') { idx = i; break; }
  }
  if (idx > 0) return '\\dfrac{' + unwrap(frac(s.slice(0, idx).trim())) + '}{' + unwrap(frac(s.slice(idx + 1).trim())) + '}';
  let out = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '(' || c === '[') {
      let d2 = 0, j = i;
      for (; j < s.length; j++) { if ('(['.includes(s[j])) d2++; else if (')]'.includes(s[j])) { d2--; if (!d2) break; } }
      if (j >= s.length) { out += s.slice(i); break; }
      const fi = frac(s.slice(i + 1, j));
      out += fi.includes('\\dfrac') ? '\\left' + c + fi + '\\right' + s[j] : c + fi + s[j];
      i = j + 1;
    } else { out += c; i++; }
  }
  return out;
}
function toTex(s) {
  s = s.replace(/\^\(([^()]*)\)/g, '^{$1}');
  s = frac(s);
  s = s.replace(/√\\left\(([\s\S]*?)\\right\)/g, '\\sqrt{$1}').replace(/√\(([^()]*)\)/g, '\\sqrt{$1}').replace(/√([A-Za-z0-9_]+)/g, '\\sqrt{$1}');
  s = s.replace(new RegExp(`([${TOK}]+)/([${TOK}]+)`, 'g'), '\\tfrac{$1}{$2}');
  s = s.replace(/\b(sin|cos|tan|cot|sec|ln|log|exp)(?![a-zA-Z])/g, '\\$1');
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, m => '^{' + [...m].map(c => SUP[c]).join('') + '}');
  s = s.replace(/[₀-₉₋₊]+/g, m => '_{' + [...m].map(c => c === '₋' ? '-' : c === '₊' ? '+' : String.fromCharCode(c.charCodeAt(0) - 0x2050)).join('') + '}');
  s = s.replace(/[α-ωΑ-Ω]/g, c => GREEK[c] ? '\\' + GREEK[c] + ' ' : c);
  s = s.replace(/[∝≈≤≥≠∞×·±→°−′∴]/g, c => OPS[c]);
  return s.replace(/\*/g, ' \\cdot ').replace(/\s+/g, ' ').trim();
}
const isText = (c) => !MS.test(c) && !/(^|[^A-Za-z])[A-Za-z]{1,2}($|[^A-Za-z])/.test(c.replace(/[()\-]/g, ' '));
const cnt = (s, ch) => s.split(ch).length - 1;
function wrapRun(run) {
  let lead = '', trail = '', core = run;
  for (let k = 0; k < 40; k++) {
    const f = core[0], l = core[core.length - 1];
    if (f && ' .,;:?!'.includes(f)) { lead += f; core = core.slice(1); }
    else if (f === '(' && cnt(core, '(') > cnt(core, ')')) { lead += f; core = core.slice(1); }
    else if (f === '[' && cnt(core, '[') > cnt(core, ']')) { lead += f; core = core.slice(1); }
    else if (l && ' .,;:?!'.includes(l)) { trail = l + trail; core = core.slice(0, -1); }
    else if ((l === '(' || l === '[') && core.length > 1) { trail = l + trail; core = core.slice(0, -1); }
    else if ((f === ')' || f === ']') && core.length > 1) { lead += f; core = core.slice(1); }
    else if (l === ')' && cnt(core, ')') > cnt(core, '(')) { trail = l + trail; core = core.slice(0, -1); }
    else if (l === ']' && cnt(core, ']') > cnt(core, '[')) { trail = l + trail; core = core.slice(0, -1); }
    else break;
  }
  if (!/[A-Za-z0-9\u0370-\u03FF\u2070-\u22FF]/.test(core) || isText(core)) return run;
  return lead + '$' + toTex(core) + '$' + trail;
}
function mathify(t, isOpt) {
  t = String(t == null ? '' : t);
  if (t.includes('$')) return t;
  let pre = ''; const m = t.match(/^\s*\d+\.\s+/); if (m) { pre = m[0]; t = t.slice(pre.length); }
  const keep = []; t = t.replace(/\((?:[A-Za-z]{3,})(?:[ \-][A-Za-z]{3,})*\)/g, m => { keep.push(m); return String.fromCharCode(0xE000 + keep.length - 1); });   // keep (English phrases) as text
  const back = (x) => x.replace(/[\uE000-\uF8FF]/g, c => keep[c.charCodeAt(0) - 0xE000]);
  if (!BN.test(t)) { if (!isOpt) return pre + back(t); const c = t.trim(); return isText(c) ? pre + back(t) : '$' + toTex(c) + '$'; }
  return pre + back(t.replace(RUN, wrapRun));
}
const fq = (s) => esc(mathify(s, false));                 // question text → safe HTML with $…$
const fopt = (o) => esc(mathify(clean(o), true));          // option text → safe HTML with $…$
if (typeof module !== 'undefined') module.exports = { mathify, toTex };
