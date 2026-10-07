// INFECTION TESTER (the dev page's link: index.html?inftest): the game straight in, a board of bits,
// and a panel along the bottom: a button for each infection to set it off on the grid, the LOOK it
// shows (or RANDOM), a DROP that counts one drop down without dropping, FILL for a fresh board, and
// CLEAR. The column buttons still drop bits as in a game, so the infections can be played against too.
// Nothing's saved (index.html keeps the page's writes in memory), and BANNERS switches off the
// UNLOCKED / ACHIEVEMENT pop-ups (remembered for the tab).
(() => {
  if (!/[?&]inftest\b/.test(location.search)) return;
  const IDS = ['adware', 'spyware', 'ransomware', 'malware', 'cryptojacker', 'scareware'];
  const LOOK_KEY = { adware: 'ad', spyware: 'spy', ransomware: 'ransom', malware: 'malware', cryptojacker: 'jack', scareware: 'scare' };
  let look = -1; // (-1: RANDOM)
  const QUIET = 'bytefall-inftest-quiet';
  let quiet = false;
  try { quiet = sessionStorage.getItem(QUIET) === '1'; } catch (e) {}
  window.infTestQuiet = () => quiet;
  const run = (code) => (0, eval)(code); // (the game's own globals: its lets live in the global scope)
  function fill() {
    run(`columns = Array.from({ length: COLS }, (_, c) => Array.from({ length: 3 + ((c * 5) % 4) }, (_, r) => ({ type: 'number', val: 1 + ((r * 3 + c * 2) % 7) })));
      render(); updateHud();`);
  }
  function clearAll() {
    run(`adware = null; spywareLeft = 0; malwareLeft = 0; jackLeft = 0; scareLeft = 0;
      columns.forEach((col) => col.forEach((cell) => { if (cell) { delete cell.locked; delete cell.lockAt; } }));
      Infections.clear(); render(); updateHud(); updateColumnButtons();`);
  }
  function strike(id) {
    if (run('gameOver')) { run('resetNow()'); fill(); }
    const f = {};
    if (look >= 0) f[LOOK_KEY[id]] = look;
    Infections.force(look >= 0 ? f : null);
    run(`runAnti('${id}')`);
    Infections.force(null);
  }
  async function tickDrop() { // (as after a drop: every count one down)
    run(`if (spywareLeft > 0) spywareLeft--; if (adware && --adware.left <= 0) adware = null; if (jackLeft > 0) jackLeft--;`);
    await run('tickInfections()');
    run('updateHud(); updateColumnButtons();');
  }
  const panel = document.createElement('div');
  panel.className = 'inftest';
  panel.innerHTML = `<div class="inftest-head"><b>INFECTION TESTER</b><button type="button" data-act="hide">HIDE</button></div>
    <div class="inftest-body">
      <div class="inftest-row">${IDS.map((id) => `<button type="button" data-inf="${id}">${id === 'cryptojacker' ? 'CRYPTOJACK' : id.toUpperCase()}</button>`).join('')}</div>
      <div class="inftest-row"><span>LOOK</span>${['RANDOM', '1', '2', '3', '4', '5', '6'].map((l, i) => `<button type="button" data-look="${i - 1}"${i ? '' : ' class="on"'}>${l}</button>`).join('')}</div>
      <div class="inftest-row"><button type="button" data-act="drop">DROP (COUNT DOWN)</button><button type="button" data-act="fill">FILL GRID</button><button type="button" data-act="clear">CLEAR</button><button type="button" data-act="banners"></button><a href="dev-tools/audio.html">DEV PAGE</a></div>
      <p class="inftest-note">NOT SAVED: nothing played here touches your progress. Infections stack: tap more than one. RANSOMWARE has 5 looks, MALWARE 6, the rest 4 (a look past theirs picks at random). The column buttons still drop bits.</p>
    </div>`;
  document.body.appendChild(panel);
  const bannersBtn = panel.querySelector('[data-act="banners"]');
  const showBanners = () => { bannersBtn.textContent = `BANNERS: ${quiet ? 'OFF' : 'ON'}`; bannersBtn.classList.toggle('on', quiet); };
  showBanners();
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.inf) strike(b.dataset.inf);
    else if (b.dataset.look !== undefined) {
      look = +b.dataset.look;
      panel.querySelectorAll('[data-look]').forEach((x) => x.classList.toggle('on', x === b));
    } else if (b.dataset.act === 'drop') tickDrop();
    else if (b.dataset.act === 'fill') { if (run('gameOver')) run('resetNow()'); fill(); }
    else if (b.dataset.act === 'clear') clearAll();
    else if (b.dataset.act === 'banners') {
      quiet = !quiet;
      try { sessionStorage.setItem(QUIET, quiet ? '1' : '0'); } catch (e) {}
      if (quiet) document.querySelectorAll('.toast').forEach((t) => { t.hidden = true; }); // (any up now, gone)
      showBanners();
    }
    else if (b.dataset.act === 'hide') { panel.classList.toggle('min'); b.textContent = panel.classList.contains('min') ? 'SHOW' : 'HIDE'; }
  });
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  // In: the menu closed, a board to test on
  addEventListener('load', () => setTimeout(() => {
    if (window.homeIsOpen && window.homeIsOpen()) run('hideHome()');
    fill();
  }, 300));
})();
