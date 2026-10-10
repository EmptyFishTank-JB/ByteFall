// SOUND TESTER (the dev page's link: index.html?sfxtest): the game straight in on a board of bits,
// every sound it makes named as it plays. A caption flashes over the board (the sound, and what set
// it off, read from the code that played it); a panel along the bottom, folded to a line naming the
// latest till SHOW opens it, keeps the last few, every
// sound with how often it's been heard (tap one to hear it alone), and a SOUND THEME to play the
// game in (any of them, locked or not). FILL GRID and NEW LAYER set things going; the column
// buttons drop bits as in a game. Nothing's saved (index.html keeps the page's writes in memory,
// as for the INFECTION TESTER), and SOUND is on whatever the game's setting.
(() => {
  if (!/[?&]sfxtest\b/.test(location.search)) return;
  const NAMES = {
    click: 'TYPING CLICK', enter: 'ENTER', burst: 'DATA BURST', egg: 'EASTER EGG', backspace: 'BACKSPACE', punct: 'PUNCTUATION',
    alert: 'ALERT', static: 'LINE STATIC', denied: 'ACCESS DENIED', button: 'BUTTON', dialup: 'DIAL-UP',
    blip: "BOT'S VOICE", count: 'SCORE COUNT', xpFill: 'LEVEL METER', levelUp: 'LEVEL UP',
  };
  // What set a sound off: the function that played it (and the sound, where one function plays
  // several), in words
  const WHY = {
    'attemptDrop:click': 'the bit falling a row', 'attemptDrop:enter': 'the bit landing', 'attemptDrop:denied': "a drop that can't happen",
    'collapse:click': 'bits falling into a gap, a row', 'resolveChains:burst': 'a chain step: bits decrypting', 'resolveChains:egg': 'the chain at 2X or more',
    'resolveChains:backspace': 'a layer cracked: [=] to [-]', 'resolveChains:punct': 'the last layer off: a bit shows',
    injectPulse: 'ENCRYPTION // NEW LAYER', awardPackets: 'a BYTE / NIBBLE bonus', awardHack: 'EXPLOIT READY: the chain meter full',
    'tickBombs:burst': 'LOGIC BOMB detonating', 'tickBombs:denied': 'LOGIC BOMB detonating', sniff: 'PACKET SNIFFER picking a bit',
    'runHack:static': 'an exploit executing (or PIVOT / SWAP trading places)', 'runHack:burst': 'an exploit wiping out blocks',
    'runHack:backspace': 'an exploit cracking layers', 'runHack:punct': 'an exploit peeling the last layers', 'runHack:enter': "an exploit's work done",
    scrambleBits: "RNG's flicker", meltBoard: 'the board melting at game over', 'endGame:denied': 'game over', 'endGame:dialup': 'DISCONNECT: the line hangs up',
    resetNow: 'a new run', armReset: 'RESTART / QUIT asking CONFIRM?', openGoal: 'the CLASSIC goal reached: its card and KEYS',
    updateGoalBtn: 'GOAL switched', 'updateInfectBtn:punct': 'INFECTIONS switched', 'updateInfectBtn:denied': "a setting that can't change now",
    openModeSettings: 'GAME SETTINGS opening', closeModeSettings: 'GAME SETTINGS closing', cardNotice: "a card's notice: not now",
    stepVsGoal: 'the VS target stepped', 'releaseAttacks:punct': 'your VS attack going over', 'releaseAttacks:alert': "the CPU's attack crossing",
    'takeGarbage:click': "the CPU's blocks landing", 'takeGarbage:punct': "the CPU's blocks all landed", startMatch: 'a VS match starting',
    openPause: 'PAUSE', resumeMatch: 'PAUSE closed', hideHome: 'into a game from the main menu', updateSoundBtn: 'SOUND on',
    updateEffectsBtn: 'EFFECTS switched', updateCrtBtn: 'CRT DISPLAY switched', updateOutputBtn: 'SOUND OUTPUT switched',
    setAim: 'aiming a bit at a column', 'pickSwapBit:click': 'SWAP picking a bit', 'pickSwapBit:denied': 'SWAP: not a bit',
    choosePivot: 'PIVOT asking which side', updateSfxThemeBtn: "a SOUND THEME picked: its sample", updateVibrateBtn: 'VIBRATION on',
    streakPays: 'the LOGIN STREAK paid', secondChance: 'SECOND CHANCE', useTool: 'a PUZZLE tool used up', 'puzzleHint:punct': 'PUZZLE HINT',
    'puzzleHint:denied': 'PUZZLE HINT: none left', puzzleUndo: 'PUZZLE UNDO', turnSlot: 'the BLACK MARKET reel turning',
    openMarket: 'the BLACK MARKET opening', slotTap: "a slot that can't be used now", openShop: "a slot's shop opening", openPatchShop: "a patch slot's shop opening",
    'patchBuy:egg': 'a patch bought', 'patchBuy:denied': 'a patch: short of the price', 'shopBuy:egg': 'bought from a slot', 'shopBuy:denied': 'a slot: short of the price',
    'openBox:click': 'a BLACK BOX opening', 'openBox:egg': "a BLACK BOX's prize", 'openBox:denied': "a BLACK BOX that can't open",
    'payRansom:burst': 'a ransom paid', 'payRansom:egg': 'the ransom paid off', 'payRansom:denied': 'a ransom: no KEYS to pay',
    'payInfection:burst': "an infection's demand paid", 'payInfection:egg': 'the demand paid off: the infection gone', 'payInfection:denied': 'a demand: no KEYS to pay',
    'runAnti:denied': 'an infection striking', 'runAnti:click': 'a SCAREWARE pop-up closed', popWin: 'a SCAREWARE pop-up appearing',
    infect: 'a bit infected', tickInfectedBit: 'an INFECTED BIT quarantined', 'armExploit:egg': 'an exploit armed', 'armExploit:denied': 'no exploit to arm',
    announce: 'an achievement or unlock', showEarned: 'EARNED on the result screen', 'rackScore:count': 'the score counting up',
    'rackScore:punct': 'the score landing on its total', 'playXpMeter:xpFill': 'the level meter filling', 'playXpMeter:levelUp': 'LEVEL UP',
    'buyExploitTap:click': 'an exploit to buy: tap again to confirm', 'buyExploitTap:egg': 'an exploit bought to keep', 'buyExploitTap:denied': 'an exploit: short of the price',
    setPuzzle: 'a puzzle loading', renderPuzzleSelect: 'the PUZZLES list', 'showPuzzleResult:egg': 'a puzzle solved', 'showPuzzleResult:denied': 'a puzzle failed',
    'say:blip': 'BOT talking', 'say:egg': 'the STORE: done', 'say:denied': "the STORE: can't", 'shopItem:egg': 'bought in the STORE', 'shopItem:denied': 'the STORE: short of the price',
    lockedTap: 'a locked STORE item', 'buy:egg': 'a purchase', 'buy:denied': 'a purchase that failed', 'restore:dialup': 'RESTORE PURCHASES checking',
    'restore:egg': 'purchases restored', 'restore:denied': 'nothing to restore', renderBuyTest: 'TEST PURCHASES switched',
    'tick:blip': 'BOT talking', 'frame:count': 'the score counting up', 'frame:punct': 'the score landing on its total',
    'step:xpFill': 'the level meter filling', 'tick:levelUp': 'LEVEL UP',
    annoyed: "BOT's -_-: not that", onTap: 'a tap the tutorial asked for', 'show:punct': 'a tutorial card', 'show:click': 'the UPDATE button', back: 'the tutorial BACK', start: 'START',
  };
  // (what each means where the code can't tell: a tap's own handler)
  const PLAIN = {
    click: 'a tick', enter: 'a landing', burst: 'something decrypting', egg: 'a reward', backspace: 'a layer cracked',
    punct: 'a switch or a reveal', alert: 'a warning', static: 'a new screen', denied: "can't do that", button: 'a button tapped',
    dialup: 'the modem', blip: 'BOT talking', count: 'the score counting', xpFill: 'the level meter', levelUp: 'LEVEL UP',
  };
  const caller = () => {
    const lines = (new Error().stack || '').split('\n');
    for (const l of lines) {
      if (/sfx-test\.js/.test(l) || !/\.js/.test(l)) continue;
      const m = /at (?:async )?([\w$.<>]+) \(/.exec(l) || /^\s*([\w$.<>]*)@/.exec(l);
      const fn = m ? m[1].split('.').pop() : '';
      return fn && fn !== '<anonymous>' ? fn : '';
    }
    return '';
  };
  const why = (name, fn) => WHY[`${fn}:${name}`] || WHY[fn] || PLAIN[name];

  const counts = {};
  const log = [];
  let capTimer = 0;
  let countTold = 0;
  function heard(name, fn) {
    const ev = window.event; // (the tick of the tester's own buttons: not the game's)
    if (name === 'button' && ev && ev.target && ev.target.closest && ev.target.closest('.sfxtest')) return;
    counts[name] = (counts[name] || 0) + 1;
    // (the score's ticks and the voice's blips come in dozens: one line for a run of them)
    const last = log[0];
    if (last && last.name === name && last.fn === fn && performance.now() - last.at < 400) { last.n++; last.at = performance.now(); } else {
      log.unshift({ name, fn, n: 1, at: performance.now() });
      log.length = Math.min(log.length, 4);
    }
    if (name === 'count' && performance.now() - countTold < 300) { showPanel(); return; }
    if (name === 'count') countTold = performance.now();
    showPanel();
    caption(name, why(name, fn));
  }

  // The sounds: each wrapped to be heard and named (after the game's own wrap, for VIBRATION)
  const play = SFX.play;
  SFX.play = (name, pitch) => { heard(name, caller()); play(name, pitch); };
  for (const k of ['blip', 'count', 'xpFill', 'levelUp']) {
    const own = SFX[k];
    SFX[k] = (...args) => { heard(k, caller()); own(...args); };
  }
  if (SFX.isMuted()) SFX.toggle(); // (on here: the saved setting isn't touched)

  // The caption: over the top of the board, a moment
  const cap = document.createElement('div');
  cap.className = 'sfxtest-cap';
  cap.hidden = true;
  document.body.appendChild(cap);
  function caption(name, text) {
    const board = document.getElementById('board');
    const r = board && board.getBoundingClientRect();
    if (!r || !r.width) return;
    cap.innerHTML = `<b>♪ ${NAMES[name] || name}</b><span>${text}</span>`;
    cap.style.left = `${r.left + r.width / 2}px`;
    cap.style.top = `${r.top + 8}px`;
    cap.hidden = false;
    cap.classList.remove('on');
    void cap.offsetWidth;
    cap.classList.add('on');
    clearTimeout(capTimer);
    capTimer = setTimeout(() => { cap.hidden = true; }, 1100);
  }

  const run = (code) => (0, eval)(code); // (the game's own globals: its lets live in the global scope)
  function fill() {
    run(`columns = Array.from({ length: COLS }, (_, c) => Array.from({ length: 2 + ((c * 5) % 4) }, (_, r) => ({ type: 'number', val: 1 + ((r * 3 + c * 2) % 7) })));
      render(); updateHud();`);
  }
  const THEMES = SFX.themes();
  let theme = null;
  const panel = document.createElement('div');
  panel.className = 'inftest sfxtest min'; // (folded to its head at first: the drop buttons stay clear)
  panel.innerHTML = `<div class="inftest-head"><b>SOUND TESTER</b><span class="sfxtest-now"></span><button type="button" data-act="hide">SHOW</button></div>
    <div class="inftest-body">
      <div class="sfxtest-log"></div>
      <div class="inftest-row sfxtest-heard">${Object.keys(NAMES).map((k) => `<button type="button" data-snd="${k}">${NAMES[k]} <i>0</i></button>`).join('')}</div>
      <div class="inftest-row"><span>THEME</span>${THEMES.map((t) => `<button type="button" data-theme="${t.id}">${t.name}</button>`).join('')}</div>
      <div class="inftest-row"><button type="button" data-act="fill">FILL GRID</button><button type="button" data-act="layer">NEW LAYER</button><button type="button" data-act="reset">CLEAR COUNTS</button><a href="dev-tools/audio.html#effects">COMPENDIUM</a></div>
      <p class="inftest-note">NOT SAVED: nothing played here touches your progress. Every sound the game plays is named over the board and listed here with what set it off; the counts show which you've heard (tap one to hear it alone, in the theme picked). SOUND is on here whatever the game's setting. The column buttons drop bits as in a game.</p>
    </div>`;
  document.body.appendChild(panel);
  const nowEl = panel.querySelector('.sfxtest-now');
  const logEl = panel.querySelector('.sfxtest-log');
  function showPanel() {
    const top = log[0];
    nowEl.textContent = top ? `♪ ${NAMES[top.name] || top.name}: ${why(top.name, top.fn)}` : 'PLAY: EACH SOUND SHOWS HERE';
    logEl.innerHTML = log.map((e) => `<p><b>${NAMES[e.name] || e.name}${e.n > 1 ? ` x${e.n}` : ''}</b> ${why(e.name, e.fn)}</p>`).join('') || '<p>Play: every sound shows here.</p>';
    panel.querySelectorAll('[data-snd]').forEach((b) => {
      const n = counts[b.dataset.snd] || 0;
      b.querySelector('i').textContent = n;
      b.classList.toggle('heard', n > 0);
    });
  }
  const showTheme = () => {
    const id = theme || SFX.theme();
    panel.querySelectorAll('[data-theme]').forEach((b) => b.classList.toggle('on', b.dataset.theme === id));
  };
  showPanel();
  showTheme();
  const SAMPLE = { blip: [520], count: [0.6], xpFill: [0.2, 0.8, 0.8], levelUp: [] };
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.snd) SFX.preview(b.dataset.snd, theme || SFX.theme(), ...(SAMPLE[b.dataset.snd] || []));
    else if (b.dataset.theme) { theme = b.dataset.theme; SFX.devTheme(theme); showTheme(); SFX.preview('egg', theme); }
    else if (b.dataset.act === 'fill') { if (run('gameOver')) run('resetNow()'); fill(); }
    else if (b.dataset.act === 'layer') { if (!run('busy') && !run('gameOver')) run('injectPulse().then(() => { render(); updateHud(); })'); }
    else if (b.dataset.act === 'reset') { for (const k in counts) delete counts[k]; log.length = 0; showPanel(); }
    else if (b.dataset.act === 'hide') { panel.classList.toggle('min'); b.textContent = panel.classList.contains('min') ? 'SHOW' : 'HIDE'; }
  });
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  // In: the menu closed, a board to play on
  addEventListener('load', () => setTimeout(() => {
    if (window.homeIsOpen && window.homeIsOpen()) run('hideHome()');
    fill();
  }, 300));
})();
