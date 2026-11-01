/* AUTH: sign in / register (Gmail 2FA) / reset */
let AU = { m: 'login', em: '' };
VIEWS.auth = (m) => {
  if (typeof m === 'string') AU.m = m;
  const em = esc(AU.em);
  const F = {
    login: `<h2>Sign in</h2><p class="mu">${S.pendQ ? 'Sign in to open the shared question ' + esc(S.pendQ) : 'Use your registered Gmail account.'}</p>
      <label>Gmail</label><input id="e" type="email" value="${em}"><label>Password</label><input id="p" type="password">
      <button class="btn" data-a="login" style="width:100%">Sign in</button>
      <p class="lk mu"><a data-a="auth" data-m="reg">Create account</a> &nbsp;·&nbsp; <a data-a="auth" data-m="forgot">Forgot password?</a></p>`,
    reg: `<h2>Register</h2><p class="mu">Gmail 2FA, then admin approval.</p>
      <label>Full name</label><input id="n"><label>Roll / College ID</label><input id="r">
      <label>Class</label><select id="c">${CONFIG.CLASSES.map(c => `<option>${esc(c)}</option>`).join('')}</select>
      <label>Gmail</label><input id="e" type="email"><label>Password (6+)</label><input id="p" type="password">
      <button class="btn" data-a="register" style="width:100%">Send verification code</button>
      <p class="lk mu"><a data-a="auth" data-m="login">Back to sign in</a></p>`,
    otp: `<h2>Verify Gmail</h2><p class="mu">We sent a 6-digit code to <b>${em}</b>.</p>
      <input id="c" inputmode="numeric" maxlength="6" placeholder="123456" style="text-align:center;font-size:22px;letter-spacing:6px">
      <button class="btn" data-a="verify" style="width:100%">Verify</button>`,
    forgot: `<h2>Reset password</h2><p class="mu">We will email a 6-digit code.</p>
      <label>Gmail</label><input id="e" type="email" value="${em}">
      <button class="btn" data-a="forgot" style="width:100%">Send code</button>
      <p class="lk mu"><a data-a="auth" data-m="login">Back</a></p>`,
    reset: `<h2>New password</h2><p class="mu">Code sent to <b>${em}</b>.</p>
      <label>6-digit code</label><input id="c" inputmode="numeric" maxlength="6"><label>New password (6+)</label><input id="p" type="password">
      <button class="btn" data-a="reset" style="width:100%">Update password</button>`
  };
  $('#app').innerHTML = `<div class="card auth">${F[AU.m]}</div>`;
};
Object.assign(act, {
  auth: d => VIEWS.auth(d.m),
  login: async () => {
    const j = await api('login', { email: val('e'), pass: val('p') });
    S.t = j.token; S.u = j.user; localStorage.setItem('qp_t', j.token); localStorage.setItem('qp_u', JSON.stringify(j.user)); go(S.pendQ ? 'q' : 'home', S.pendQ);
  },
  register: async () => {
    AU.em = val('e').trim().toLowerCase();
    await api('register', { name: val('n'), roll: val('r'), cls: val('c'), email: AU.em, pass: val('p') });
    VIEWS.auth('otp');
  },
  verify: async () => { await api('verify', { email: AU.em, code: val('c') }); toast('Verified! Waiting for admin approval.'); VIEWS.auth('login'); },
  forgot: async () => { AU.em = val('e').trim().toLowerCase(); await api('forgot', { email: AU.em }); toast('If the account exists, a code was sent.'); VIEWS.auth('reset'); },
  reset: async () => { await api('reset', { email: AU.em, code: val('c'), pass: val('p') }); toast('Password updated. Sign in now.'); VIEWS.auth('login'); }
});
