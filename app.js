/* BOOT: opens a shared question link (#q=ID) after sign-in */
document.title = CONFIG.APP_NAME;
$('#logo').textContent = 'Φ ' + CONFIG.APP_NAME;
const _m = location.hash.match(/^#q=(.+)$/);
S.pendQ = _m ? decodeURIComponent(_m[1]) : null;
go(S.t && S.u ? (S.pendQ ? 'q' : 'home') : 'auth', S.pendQ);
