/* BOOT */
document.title = CONFIG.APP_NAME;
$('#logo').textContent = 'Φ ' + CONFIG.APP_NAME;
go(S.t && S.u ? 'home' : 'auth');
