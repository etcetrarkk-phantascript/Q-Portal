/* BOOT: opens a shared link (#q=ID or #set=ID) after sign-in */
document.title = CONFIG.APP_NAME;
$('#logo').textContent = 'Φ ' + CONFIG.APP_NAME;
const _h = parseHash();
S.pendV = _h ? _h.v : null; S.pendId = _h ? _h.id : null;
go(S.t && S.u ? (S.pendV || 'home') : 'auth', S.pendId);
