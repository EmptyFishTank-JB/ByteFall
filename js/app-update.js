// IN-APP UPDATES (the Google Play release only: MainActivity's updateCheck / updateStart /
// updateRestart, Google Play's in-app updates). A newer version on the player's track shows UPDATE
// beside TUTORIAL on the main menu, with a notice once per version. A tap opens Google Play's own
// sheet; the download runs while the game goes on (UPDATING n%), and once it's in, RESTART TO UPDATE
// has Google Play install it and start the game again. The website and ByteFall Test show none.
(() => {
  const app = window.BytefallAndroid;
  if (!(window.BYTEFALL_APP && window.BYTEFALL_APP.release && app && app.updateCheck)) return;
  const btn = document.getElementById('home-update');
  const row = btn.parentElement;
  const TOLD_KEY = 'bytefall-update-told';
  let state = null;
  const toast = (text) => { if (typeof showToast === 'function') showToast(text); };
  function show(text, live = true) {
    btn.hidden = false;
    row.classList.remove('home-row-single'); // (TUTORIAL and UPDATE, two across)
    btn.textContent = text;
    btn.disabled = !live;
    if (typeof fitHome === 'function') fitHome();
  }
  window.bytefallUpdate = (e) => {
    if (e.state === 'available') {
      show('UPDATE');
      let told = '';
      try { told = localStorage.getItem(TOLD_KEY) || ''; } catch (err) {}
      if (told !== String(e.version)) { // (said once per version; the button stays till it's done)
        toast('UPDATE AVAILABLE // TAP UPDATE ON THE MAIN MENU');
        try { localStorage.setItem(TOLD_KEY, String(e.version)); } catch (err) {}
      }
    } else if (e.state === 'downloading') {
      show(`UPDATING ${e.percent || 0}%`, false);
    } else if (e.state === 'ready') {
      show('RESTART TO UPDATE');
      btn.classList.add('ready');
      if (state !== 'ready') toast('UPDATE READY // TAP RESTART TO UPDATE ON THE MAIN MENU');
    } else if (e.state === 'failed') {
      show('UPDATE');
    }
    state = e.state;
  };
  btn.addEventListener('click', () => {
    if (typeof SFX !== 'undefined') SFX.play('click');
    if (state === 'ready') app.updateRestart();
    else if (state === 'available' || state === 'failed') app.updateStart();
  });
  app.updateCheck();
})();
