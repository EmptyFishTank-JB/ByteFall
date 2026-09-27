// PLACE: a refresh puts you back where you were. As the page goes, what's open is kept for this
// tab: the MENU (and its tab, RECORDS' sub-tab and how far it's scrolled), SETTINGS, the MUSIC
// PLAYER, or the TUTORIAL at the step it's on (tutorial.js). The start screen does its own part:
// it shows again on a refresh until START is pressed (index.html's head script, start.js).
(() => {
  const KEY = 'bytefall-place';
  const player = document.getElementById('music-player');
  window.addEventListener('pagehide', () => {
    const place = {};
    if (!player.hidden) Object.assign(place, { panel: 'player', scroll: player.scrollTop });
    else if (!settingsEl.hidden) Object.assign(place, { panel: 'settings', scroll: settingsEl.scrollTop });
    else if (!recordsEl.hidden) Object.assign(place, { panel: 'menu', pane: menuPane, tab: recordsTab, scroll: recordsEl.scrollTop });
    if (mode === 'tutorial') place.tutorial = Tutorial.state();
    try { sessionStorage.setItem(KEY, JSON.stringify(place)); } catch (e) {}
  });

  let place = null;
  try { place = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
  if (!place || startScreenUp()) return;
  const scrollTo = (el) => requestAnimationFrame(() => { el.scrollTop = place.scroll || 0; });
  if (place.tutorial) { // (the lesson opens and shuts the menus itself)
    mode = 'tutorial';
    daily = false;
    Tutorial.resumeAt(place.tutorial);
    resetNow();
    return;
  }
  if (place.panel === 'menu') {
    if (place.tab) recordsTab = place.tab;
    setRecordsOpen(true, place.pane);
    scrollTo(recordsEl);
  } else if (place.panel === 'settings') {
    setSettingsOpen(true);
    scrollTo(settingsEl);
  } else if (place.panel === 'player') {
    document.getElementById('open-player-btn').click();
    scrollTo(player);
  }
})();
