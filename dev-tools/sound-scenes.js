// THE AUDIO COMPENDIUM's sounds (audio.html): every sound the game makes, each SOUND THEME's take
// on it, where the game plays it, and a scene of the moment: a little board (or card) acting it
// out, the sound played at the instant the game plays it, its name lit as it sounds. A scene
// runs at the game's own timings (STEP_MS, the chain, the new layer...) or 4x slower.
const SOUND_LIST = [
  {
    id: 'click', name: 'TYPING CLICK', scene: 'drop',
    moment: 'A [3] dropped in column 3: a tick for every row it falls through, its pitch wandering a little.',
    desc: 'A 25 ms burst of noise through a bandpass filter. Short and dry, so it can repeat quickly.',
    params: ['dur 25ms', 'noise', 'bandpass 3000–4000Hz', 'pitch 0.85–1.17x while falling'],
    takes: {
      terminal: 'A typing click.',
      handshake: 'A thin, high tick (a 12.5% pulse).', haunted: 'A dry wooden tick.', icicle: 'A tiny, high glass tick.', sweetheart: 'A tiny harp pluck.',
      birdsong: 'A raindrop.', island: 'A shaker.', schoolyard: 'A pencil tap.',
    },
    uses: [
      'Every row a dropped bit or exploit falls through, its pitch wandering a little each tick',
      'Every row bits fall after a decrypt (the gaps closing)',
      'Aiming a bit at a column, PIVOT picking a side, SWAP picking a bit, PACKET SNIFFER',
      'RNG: each flicker of the bits\' numbers',
      'VS: each block of an attack landing on your board',
      'The BLACK MARKET reel ticking round; opening a slot\'s or a patch slot\'s shop; a BLACK BOX opening',
      'Closing a SCAREWARE pop-up; GAME SETTINGS opening and closing; GO DEEPER',
      'A first tap on an exploit to buy (lit to confirm); TEST PURCHASES switching',
      'The tutorial: a tap it asked for, BACK; the main menu\'s UPDATE',
    ],
  },
  {
    id: 'enter', name: 'ENTER / SUBMIT', scene: 'drop',
    moment: 'The same drop: the thump as the bit lands in its column.',
    desc: 'A louder, low-passed thump.',
    params: ['dur 55ms', 'noise', 'lowpass 800Hz', '1.2× volume'],
    buzz: '8ms',
    takes: {
      terminal: 'A keyboard thump.',
      handshake: 'A wave-channel thud and a tick of noise.', haunted: 'A low thud and a creak.', icicle: 'A soft thud in the snow, a puff of powder.',
      sweetheart: 'A heartbeat: lub-dub.', birdsong: 'A low marimba note and a drop.', island: 'A bongo.', schoolyard: 'A locker thunk.',
    },
    uses: [
      'A bit or exploit lands in its column',
      'An exploit finishing its work: BUFFER OVERFLOW, RNG or BITFLIP changing the board, LOGIC BOMB or HONEYPOT set on the board, PACKET SNIFFER and KEYLOGGER switching on',
    ],
  },
  {
    id: 'burst', name: 'DATA BURST', scene: 'burst',
    moment: 'A [3] lands in a row of 3 and decrypts: the burst as it breaks apart.',
    desc: 'A quiet retro 8-bit explosion: grainy sample-and-hold noise under a falling lowpass, plus a quick square-wave pitch drop. The pitch varies slightly each time so chains don\'t repeat exactly.',
    params: ['dur 280ms', 'S&H noise', 'lowpass 3200 → 260Hz', 'square 520–660 → 70Hz', '0.2× volume'],
    buzz: '18ms',
    takes: {
      terminal: 'An 8-bit crunch.',
      handshake: 'The noise channel\'s metallic crunch, falling, and a blip on a note of C minor, a different one each time: a chain plays a little tune.',
      haunted: 'A ghostly whoosh and a glass chime, a different note of A harmonic minor each time.', icicle: 'A hiss of frost and a glass note of D lydian.',
      sweetheart: 'A harp note of F major and a sparkle.', birdsong: 'A marimba note of G major and a drip.', island: 'A shaker hiss and a steel pan note of C major.',
      schoolyard: 'A chalk scratch and a xylophone note of A major.',
    },
    uses: [
      'Each step of a chain, as its bits decrypt',
      'WORM VIRUS or TROJAN wiping out its blocks',
      'LOGIC BOMB detonating (with ACCESS DENIED)',
      'The board melting at game over (a few of them)',
      'A RANSOMWARE ransom or an infection\'s demand paid off',
    ],
  },
  {
    id: 'egg', name: 'EASTER EGG TONE', scene: 'chain',
    moment: 'A chain: the [3] decrypts, the [5] falls into a full row and decrypts too. The tone comes at 2X, over the burst.',
    desc: 'Two rising sine pings (660Hz then 880Hz), a bright "found something" chime.',
    params: ['660 → 880Hz sine', 'stagger 90ms'],
    buzz: '14 · 30 · 14ms',
    takes: {
      terminal: 'Two rising pings.',
      handshake: 'The item-get arpeggio up C minor, a quieter echo just behind.', haunted: 'The music box, up the harmonic minor.', icicle: 'A glassy run up D lydian.',
      sweetheart: 'A harp run up F major.', birdsong: 'A marimba run up G major, and a chirp.', island: 'A steel pan run up C major.', schoolyard: 'A xylophone run up A major.',
    },
    uses: [
      'Every chain step from 2X up, over the burst',
      'A BYTE, NIBBLE or packet decrypted (the bonus)',
      'EXPLOIT READY (the CHAIN METER full); an exploit armed from a slot, a BLACK BOX or the free one',
      'An INFECTED BIT quarantined, or caught by ANTIVIRUS',
      'SECOND CHANCE clearing the board',
      'The BLACK MARKET opening; buying from a slot or a patch slot; a BLACK BOX\'s prize',
      'A ransom or demand paid off: the infection gone',
      'An achievement or unlock (the notice, and EARNED on the result screen)',
      'A puzzle solved; KEYS claimed; the LOGIN STREAK paid',
      'STORE: a purchase, the DAILY DROP, buying an exploit to keep',
      'Picking a SOUND THEME in SETTINGS (a sample of it)',
    ],
  },
  {
    id: 'backspace', name: 'BACKSPACE', scene: 'peel',
    moment: 'A decrypt beside a layer: the layer cracks from [=] to [-].',
    desc: 'A duller, double-filtered noise tick.',
    params: ['dur 32ms', 'bandpass 900–1200Hz', 'lowpass 1800Hz'],
    buzz: '10ms',
    takes: {
      terminal: 'A dull key tick.',
      handshake: 'A scrape and a falling blip.', haunted: 'A scrape.', icicle: 'Ice cracking.', sweetheart: 'A soft swish.',
      birdsong: 'A rustle.', island: 'A splash.', schoolyard: 'Chalk.',
    },
    uses: [
      'A decrypt peels a neighboring layer from [=] to [-]',
      'An exploit cracking layers (DICTIONARY ATTACK)',
      'PUZZLE\'s UNDO',
    ],
  },
  {
    id: 'punct', name: 'PUNCTUATION CLICK', scene: 'reveal',
    moment: 'A decrypt beside a cracked layer: the last layer comes off and the bit under it shows.',
    desc: 'A soft triangle-wave blip at 200Hz.',
    params: ['200Hz triangle', 'dur 40ms', '0.55× volume'],
    buzz: '14ms',
    takes: {
      terminal: 'A soft blip.',
      handshake: 'A little rising chirp.', haunted: 'A cold glass ping, a tritone over it.', icicle: 'A glass ping with a bright ring.', sweetheart: 'A kiss.',
      birdsong: 'A bird\'s chirp.', island: 'A high steel pan note.', schoolyard: 'A high xylophone note.',
    },
    uses: [
      'The last layer peels off and shows the bit under it (instead of the backspace)',
      'SETTINGS: SOUND on (as confirmation), EFFECTS, CRT DISPLAY, SOUND OUTPUT; the GOAL and INFECTIONS switches',
      'The score landing on its total on the result screen',
      'PUZZLE\'s HINT',
      'The tutorial: each new card',
      'VS: your attack going over; the CPU\'s blocks done landing on your board',
    ],
  },
  {
    id: 'alert', name: 'ALERT (TWO-TONE)', scene: 'layer',
    moment: 'ENCRYPTION // NEW LAYER: the warning, then a row of layers rises under the bits.',
    desc: 'Two falling sawtooth tones, a classic warning beep.',
    params: ['440 → 330Hz saw', 'stagger 120ms'],
    buzz: '40ms',
    takes: {
      terminal: 'A two-tone warning beep.',
      handshake: 'The battle\'s low-HP alarm: four quick beeps.', haunted: 'The church bell tolls twice.', icicle: 'Bells: four quick strikes.', sweetheart: 'A racing heart.',
      birdsong: 'A bird alarmed: three chirps.', island: 'Steel pan: four quick notes.', schoolyard: 'The school bell.',
    },
    uses: [
      'ENCRYPTION // NEW LAYER, just before a row of layers rises',
      'RESTART or QUIT asking CONFIRM?',
      'VS: the CPU\'s attack crossing to your board',
    ],
  },
  {
    id: 'static', name: 'LINE STATIC', scene: 'exploit',
    moment: 'A WORM VIRUS dropped in column 3: WORM VIRUS // EXECUTING, then its column bursts.',
    desc: 'A brief high-passed noise pop.',
    params: ['dur 35ms', 'highpass 2000Hz', '0.75× volume'],
    takes: {
      terminal: 'A pop of static.',
      handshake: 'A falling whoosh of noise.', haunted: 'A gust of cold wind.', icicle: 'A cold wind.', sweetheart: 'A harp glissando.',
      birdsong: 'A spring breeze and a chirp.', island: 'A wave rolling in.', schoolyard: 'Pages turning.',
    },
    uses: [
      'An exploit starting: ... // EXECUTING',
      'PIVOT or SWAP trading places',
      'A new run: RESTART, NEW SESSION, a VS match starting',
      'PAUSE opening and closing',
      'Going from the main menu into a game; START on the start screen',
      'A puzzle loading; the PUZZLES list opening',
    ],
  },
  {
    id: 'denied', name: 'ACCESS DENIED', scene: 'trace',
    moment: 'Game over: a bit lands over the red line and the trace completes.',
    desc: 'Three noise bursts that get quieter, each with a short high static tick.',
    params: ['3× burst', 'bandpass 320Hz', 'tick 3500Hz', 'vol 0.9 → 0.35 → 0.12'],
    buzz: '60 · 40 · 90ms',
    takes: {
      terminal: 'Three fading bursts of noise.',
      handshake: 'A low buzz, bumping down.', haunted: 'A dissonant organ chord, cut short.', icicle: 'A falling tone and a crackle.', sweetheart: 'Aww: two sliding sighs.',
      birdsong: 'Two low marimba notes, falling.', island: 'Two low steel pan notes, falling.', schoolyard: 'Two low xylophone notes, falling.',
    },
    uses: [
      'Game over: TRACE COMPLETE, TIME\'S UP (DISCONNECT has the dial-up)',
      'A drop that can\'t happen: a full column, ADWARE\'s blocked column, SWAP still picking, PIVOT\'s wrong side, VS before START',
      'Something locked, or short of the price (STORE, slots, exploits, BLACK BOXES)',
      'An infection striking, an INFECTED BIT going off, a SCAREWARE pop-up appearing',
      'LOGIC BOMB detonating (with the burst)',
      'A puzzle failed; HINT with none left',
      'The tutorial\'s -_- (a tap it didn\'t ask for)',
      'RESTORE PURCHASES finding nothing; a purchase that fails',
    ],
  },
  {
    id: 'button', name: 'BUTTON', scene: 'button',
    moment: 'Buttons tapped: the tick comes as the finger lifts on the button.',
    desc: 'A short, clear square-wave tick, falling a little in pitch: every button is heard.',
    params: ['dur 35ms', 'square 1250 → 900Hz', 'lowpass 3000Hz', '0.22× volume'],
    buzz: '12ms (every button)',
    takes: {
      terminal: 'A clear square tick.',
      handshake: 'The menu\'s select blip: two quick notes.', haunted: 'A hollow knock.', icicle: 'Two glass pings.', sweetheart: 'Two harp plucks.',
      birdsong: 'A woodblock.', island: 'Two steel pan notes.', schoolyard: 'Two xylophone notes.',
    },
    uses: [
      'Any button tapped (on release, not a touch that slides off), but the drop buttons, which have the drop\'s own sounds',
      'VIBRATION turned on',
    ],
  },
  {
    id: 'dialup', name: 'DIAL-UP', scene: 'disconnect', own: true,
    moment: 'DISCONNECT on the CLASSIC goal card: the line hangs up, ENCRYPTION CRACKED.',
    desc: 'A little dial-up modem, never quite the same twice: 4 to 7 touch-tone digits at their own pace, the answer tone, the carrier warbling between two pitches under bursts of static, then the kshhht as the line opens up.',
    params: ['about 1.5-2s', 'DTMF pairs 60-90ms apart', '~2100Hz answer', 'square ~1550-1700 / +380-500Hz warble', 'band-passed static', 'high-passed static wash (the kshhht)'],
    uses: [
      'DISCONNECT on the CLASSIC goal card (ENCRYPTION CRACKED)',
      'RESTORE PURCHASES in the STORE, while it checks',
    ],
  },
  {
    id: 'blip', name: 'BOT\'S VOICE', scene: 'bot', own: true,
    moment: 'The tutorial\'s BOT talking: a blip on every other letter, resting at punctuation.',
    desc: 'One short square-wave blip, falling a little, through a lowpass: Animalese-style talking. Its pitch wanders between 430 and 600Hz.',
    params: ['dur 50ms', 'square 430–600Hz → 0.82x', 'lowpass 2600Hz', 'a letter 18ms', 'rests 190ms (. ! ? :) / 110ms (, ;)'],
    uses: ['The tutorial: BOT\'s lines typing out, a blip every other letter'],
  },
  {
    id: 'count', name: 'SCORE COUNT', scene: 'count', own: true,
    moment: 'The result screen: the score counting up to its total, then PUNCTUATION as it lands.',
    desc: 'A tiny square-wave tick every 45ms, higher as the count nears the total.',
    params: ['dur 28ms', 'square 880 → 1580Hz', 'every 45ms', 'up to 1.4s'],
    uses: ['The result screen: the score racking up (a tap skips to the total)'],
  },
  {
    id: 'xpFill', name: 'LEVEL METER', scene: 'xp', own: true,
    moment: 'The result screen: the level meter filling with the game\'s bits.',
    desc: 'A held square tone sliding up as the meter fills: its pitch is how full the level is.',
    params: ['square 320 → 1220Hz (empty → full)', 'lowpass 2600Hz', '0.1× volume'],
    uses: ['The result screen: the level meter filling, after the score'],
  },
  {
    id: 'levelUp', name: 'LEVEL UP', scene: 'levelup', own: true,
    moment: 'The meter reaching the end of the level: LEVEL UP.',
    desc: 'A quick climb of four square notes, then a held top note with vibrato over a third below.',
    params: ['G C E G', 'held C with 7Hz vibrato', 'over a G'],
    uses: ['The result screen: the level meter reaching a new level (again for each level, if a game earns several)'],
  },
];

const SoundScenes = (() => {
  const COLS = 5;
  const ROWS = 5; // (the playable rows; one more over the red line)
  const MAX = 6;
  const STEP_MS = 35; // (the game's per-row fall)
  const STOP = {};
  const NAME = Object.fromEntries(SOUND_LIST.map((s) => [s.id, s.name]));
  const fallPitch = () => 0.85 + Math.random() * 0.32;
  let opts = { slow: 1, whole: false };

  // A stage: the message line, the view (a board, a card), the sound's tag under it
  function make() {
    const el = document.createElement('div');
    el.className = 'scene';
    el.innerHTML = '<div class="sc-msg"></div><div class="sc-view"></div><div class="sc-tag"></div>';
    return { el, msg: el.querySelector('.sc-msg'), view: el.querySelector('.sc-view'), tag: el.querySelector('.sc-tag'), run: 0, tagTimer: 0 };
  }

  // One run of a scene: its waits (stopped if the scene starts again), its sounds, its drawing
  function runner(st, sound, theme) {
    const run = ++st.run;
    const S = {
      async wait(ms) {
        await new Promise((r) => setTimeout(r, ms * opts.slow));
        if (st.run !== run) throw STOP;
      },
      snd(id, ...args) {
        const mine = id === sound.id;
        if (mine || opts.whole) SFX.preview(id, theme, ...args);
        st.tag.textContent = `♪ ${NAME[id] || id.toUpperCase()}`;
        st.tag.className = `sc-tag on${mine ? ' mine' : ''}${!mine && !opts.whole ? ' silent' : ''}`;
        clearTimeout(st.tagTimer);
        st.tagTimer = setTimeout(() => { st.tag.className = 'sc-tag'; }, 450 * opts.slow);
      },
      say(text, kind = '') { st.msg.textContent = text; st.msg.className = `sc-msg ${kind}`; },
      cols: null,
      board(cols, extra = {}) { S.cols = cols; draw(st, cols, extra); },
      cell: (r, c) => st.view.querySelector(`[data-rc="${r},${c}"]`),
      async press(c) {
        const b = st.view.querySelectorAll('.sc-btns button')[c];
        if (!b) return;
        b.classList.add('down');
        await S.wait(110);
        b.classList.remove('down');
      },
      // (a piece falling down column c, a tick a row, and landing: as attemptDrop)
      async fall(c, piece, extra = {}) {
        const landing = S.cols[c].length;
        for (let r = MAX - 1; r > landing; r--) {
          draw(st, S.cols, { ...extra, falling: { r, c, piece } });
          S.snd('click', fallPitch());
          await S.wait(STEP_MS);
        }
        S.cols[c].push(piece);
        draw(st, S.cols, { ...extra, landed: { r: landing, c } });
        S.snd('enter');
        await S.wait(60);
        return landing;
      },
      // (bits decrypting: the flash, the pieces flying, the burst)
      async pop(list, extra = {}) {
        draw(st, S.cols, { ...extra, pops: list });
        for (const p of list) sparks(st, S.cell(p.r, p.c));
        S.snd('burst');
      },
      // (the gaps closing a row a step, a tick a step: as collapse)
      async collapse(extra = {}) {
        for (;;) {
          let moved = false;
          for (const col of S.cols) {
            const i = col.indexOf(null);
            if (i >= 0 && col.slice(i + 1).some(Boolean)) { col.splice(i, 1); moved = true; }
            while (col.length && col[col.length - 1] === null) col.pop();
          }
          if (!moved) return;
          draw(st, S.cols, extra);
          S.snd('click', fallPitch());
          await S.wait(STEP_MS);
        }
      },
      remove(list) { for (const p of list) S.cols[p.c][p.r] = null; },
    };
    return S;
  }

  function cellHtml(piece) {
    if (!piece) return ['', ''];
    const t = piece[0];
    const v = piece.slice(1);
    if (t === 'n') return [' bit', `[${v}]`];
    if (t === 'w') return [v === '1' ? ' layer cracked' : ' layer', v === '1' ? '[-]' : '[=]'];
    return [' hack', `[${v}]`];
  }
  // The board: columns of pieces ('n5' a bit, 'w2' / 'w1' a layer, 'x§' an exploit), the red line
  // over the top row, the ===== line under the bits and the drop buttons
  function draw(st, cols, { falling = null, pops = [], landed = null, flash = null, layerNext = false, dead = false } = {}) {
    const hot = cols.some((c) => c.length >= ROWS);
    let html = `<div class="sc-board${dead ? ' dead' : ''}">`;
    for (let r = MAX - 1; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        let piece = cols[c][r] || null;
        if (falling && falling.r === r && falling.c === c) piece = falling.piece;
        const [cls, inner] = cellHtml(piece);
        let more = r >= ROWS ? ' over' : '';
        if (pops.some((p) => p.r === r && p.c === c)) more += ' pop';
        if (landed && landed.r === r && landed.c === c) more += ' landed';
        if (flash && flash.r === r && flash.c === c) more += ' flash';
        html += `<div class="sc-cell${cls}${more}" data-rc="${r},${c}">${inner}</div>`;
      }
      if (r === ROWS) html += `<div class="sc-line${hot ? ' hot' : ''}">${'='.repeat(40)}</div>`;
    }
    html += `<div class="sc-layerline${layerNext ? ' next' : ''}">${'='.repeat(40)}</div></div>`;
    html += `<div class="sc-btns">${Array.from({ length: COLS }, (_, c) => `<button type="button" tabindex="-1">${c + 1}</button>`).join('')}</div>`;
    st.view.innerHTML = html;
  }
  // (the burst's pieces: little squares flying off the bit, as fx.js throws them)
  function sparks(st, cell) {
    if (!cell || !cell.animate) return;
    const box = st.el.getBoundingClientRect();
    const r = cell.getBoundingClientRect();
    const x = r.left - box.left + r.width / 2;
    const y = r.top - box.top + r.height / 2;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('i');
      p.className = 'sc-spark';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      st.el.appendChild(p);
      const a = Math.random() * Math.PI * 2;
      const d = 14 + Math.random() * 22;
      p.animate([{ transform: 'translate(-50%, -50%)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 6}px)) scale(0.4)`, opacity: 0 }], { duration: 420 * opts.slow, easing: 'ease-out' }).onfinish = () => p.remove();
    }
  }
  // A card in the view (the goal card, the result screen, BOT's banner, the main menu)
  const card = (st, html) => { st.view.innerHTML = `<div class="sc-card">${html}</div>`; return st.view.firstChild; };
  const fmt = (n) => n.toLocaleString('en-US');

  // Each scene: its still picture (still), and the moment played out (play)
  const SCENES = {
    drop: {
      still: () => [['n4', 'n6'], ['n7'], [], ['n5', 'n4', 'n6'], ['n4']],
      async play(S) {
        S.say('');
        await S.wait(250);
        await S.press(2);
        await S.fall(2, 'n3');
      },
    },
    burst: {
      still: () => [[], ['n7', 'n4'], [], ['n5', 'n6', 'n4'], []],
      async play(S) {
        S.say('');
        await S.wait(250);
        await S.press(2);
        await S.fall(2, 'n3');
        const hit = [{ r: 0, c: 2 }];
        await S.pop(hit);
        S.say('CHAIN 1X');
        await S.wait(160);
        S.remove(hit);
        S.board(S.cols);
        await S.collapse();
      },
    },
    chain: {
      still: () => [['n6'], ['n7'], ['n3', 'n5'], ['n4'], ['n2']],
      async play(S) {
        S.say('');
        await S.wait(250);
        await S.press(2);
        await S.fall(2, 'n6');
        const hit = [{ r: 0, c: 2 }];
        await S.pop(hit);
        S.say('CHAIN 1X');
        await S.wait(160);
        S.remove(hit);
        await S.collapse();
        await S.wait(40);
        await S.pop(hit);
        S.snd('egg');
        S.say('CHAIN 2X', 'byte');
        await S.wait(160);
        S.remove(hit);
        await S.collapse();
      },
    },
    peel: {
      still: () => [[], ['w2', 'n6'], [], ['n5', 'n7'], []],
      async play(S) {
        S.say('');
        await S.wait(250);
        await S.press(2);
        await S.fall(2, 'n3');
        const hit = [{ r: 0, c: 2 }];
        S.cols[1][0] = 'w1';
        await S.pop(hit, { flash: { r: 0, c: 1 } });
        S.snd('backspace');
        await S.wait(160);
        S.remove(hit);
        await S.collapse();
      },
    },
    reveal: {
      still: () => [[], ['w1', 'n6'], [], ['n5', 'n7'], []],
      async play(S) {
        S.say('');
        await S.wait(250);
        await S.press(2);
        await S.fall(2, 'n3');
        const hit = [{ r: 0, c: 2 }];
        S.cols[1][0] = 'n4';
        await S.pop(hit, { flash: { r: 0, c: 1 } });
        S.snd('punct');
        await S.wait(160);
        S.remove(hit);
        await S.collapse();
      },
    },
    layer: {
      still: () => [['n6'], ['n7', 'n4'], [], ['n5', 'n6'], ['n3']],
      stillOpts: { layerNext: true },
      async play(S) {
        S.say('');
        S.board(S.cols, { layerNext: true });
        await S.wait(300);
        S.say('ENCRYPTION // NEW LAYER', 'alarm');
        S.snd('alert');
        await S.wait(800);
        for (const col of S.cols) col.unshift('w2');
        S.board(S.cols);
        await S.wait(200);
        S.say('');
      },
    },
    exploit: {
      still: () => [['n6'], ['n7'], ['n5', 'n4'], ['n3'], []],
      async play(S) {
        S.say('');
        await S.wait(250);
        await S.press(2);
        const row = await S.fall(2, 'x§');
        S.say('WORM VIRUS // EXECUTING');
        S.snd('static');
        const hits = S.cols[2].map((_, r) => ({ r, c: 2 }));
        await S.pop(hits);
        await S.wait(160);
        S.remove(hits);
        await S.collapse();
        await S.wait(400);
        S.say('');
      },
    },
    trace: {
      still: () => [['n7'], ['n6', 'n7'], ['n7', 'n4', 'n7', 'n4', 'n7'], ['n4', 'n6'], ['n7']],
      async play(S) {
        S.say('');
        await S.wait(250);
        await S.press(2);
        await S.fall(2, 'n2');
        await S.wait(80);
        S.board(S.cols, { dead: true });
        S.say('TRACE COMPLETE', 'danger');
        S.snd('denied');
        await S.wait(1200);
      },
    },
    button: {
      still: (st) => card(st, '<div class="sc-menu"><button type="button" tabindex="-1">PLAY</button><button type="button" tabindex="-1">STORE</button><button type="button" tabindex="-1">SETTINGS</button></div>'),
      async play(S, st) {
        S.say('');
        const bs = st.view.querySelectorAll('.sc-menu button');
        for (const i of [0, 2, 1]) {
          await S.wait(260);
          bs[i].classList.add('down');
          await S.wait(120);
          bs[i].classList.remove('down');
          S.snd('button');
        }
      },
    },
    disconnect: {
      still: (st) => card(st, '<p class="sc-title">// 128-BIT CRACKED</p><p class="sc-note">+40 KEYS</p><div class="sc-menu"><button type="button" tabindex="-1" class="go">GO DEEPER</button><button type="button" tabindex="-1">DISCONNECT</button></div>'),
      async play(S, st) {
        S.say('');
        await S.wait(400);
        const b = st.view.querySelectorAll('.sc-menu button')[1];
        b.classList.add('down');
        await S.wait(120);
        b.classList.remove('down');
        S.snd('button');
        card(st, '<p class="sc-title">ENCRYPTION CRACKED</p><p class="sc-note">128-BIT broken. You got out clean.</p>');
        S.snd('dialup');
        await S.wait(2000);
      },
    },
    bot: {
      still: (st) => card(st, '<p class="sc-bot"><b>[^_^]</b> <span class="said">WELCOME TO BYTEFALL. TAP A COLUMN TO DROP THE BIT!</span><span class="unsaid"></span></p>'),
      async play(S, st) {
        S.say('');
        const text = 'WELCOME TO BYTEFALL. TAP A COLUMN TO DROP THE BIT!';
        const said = st.view.querySelector('.said');
        const unsaid = st.view.querySelector('.unsaid');
        said.textContent = '';
        unsaid.textContent = text;
        await S.wait(300);
        for (let i = 1; i <= text.length; i++) {
          const ch = text[i - 1];
          said.textContent = text.slice(0, i);
          unsaid.textContent = text.slice(i);
          if (/[A-Za-z0-9]/.test(ch) && i % 2) S.snd('blip', 430 + Math.random() * 170);
          await S.wait(/[.!?:]/.test(ch) ? 190 : /[,;]/.test(ch) ? 110 : 18);
        }
      },
    },
    count: {
      still: (st) => card(st, '<p class="sc-title danger">TRACE COMPLETE</p><p class="sc-label">SCORE</p><p class="sc-score">1,250</p>'),
      async play(S, st) {
        S.say('');
        const el = st.view.querySelector('.sc-score');
        el.textContent = '0';
        await S.wait(400);
        const total = 1250;
        const ms = Math.min(1400, 400 + Math.log10(total + 1) * 280) * opts.slow;
        const t0 = performance.now();
        let lastTick = 0;
        for (;;) {
          const now = performance.now();
          const p = Math.min(1, (now - t0) / ms);
          const eased = 1 - Math.pow(1 - p, 2);
          el.textContent = fmt(Math.round(total * eased));
          if (now - lastTick > 45 * opts.slow && p < 1) { lastTick = now; S.snd('count', eased); }
          if (p >= 1) break;
          await S.wait(16 / opts.slow);
        }
        S.snd('punct');
      },
    },
    xp: {
      still: (st) => card(st, '<p class="sc-label">LV 11</p><div class="sc-xp"><i style="width: 30%"></i></div><p class="sc-note">+50 BITS</p>'),
      async play(S, st) {
        S.say('');
        const bar = st.view.querySelector('.sc-xp i');
        bar.style.transition = 'none';
        bar.style.width = '30%';
        await S.wait(400);
        const dur = 1.1;
        S.snd('xpFill', 0.3, 0.8, dur * opts.slow);
        bar.style.transition = `width ${dur * opts.slow}s linear`;
        bar.style.width = '80%';
        await S.wait(dur * 1000 + 200);
      },
    },
    levelup: {
      still: (st) => card(st, '<p class="sc-label">LV 11</p><div class="sc-xp"><i style="width: 70%"></i></div><p class="sc-note">+40 BITS</p>'),
      async play(S, st) {
        S.say('');
        const label = st.view.querySelector('.sc-label');
        const bar = st.view.querySelector('.sc-xp i');
        label.textContent = 'LV 11';
        label.classList.remove('up');
        bar.style.transition = 'none';
        bar.style.width = '70%';
        await S.wait(400);
        const dur = 0.5;
        S.snd('xpFill', 0.7, 1, dur * opts.slow);
        bar.style.transition = `width ${dur * opts.slow}s linear`;
        bar.style.width = '100%';
        await S.wait(dur * 1000);
        label.textContent = 'LEVEL UP // LV 12';
        label.classList.add('up');
        S.snd('levelUp');
        await S.wait(750);
        bar.style.transition = 'none';
        bar.style.width = '0%';
        label.textContent = 'LV 12';
        label.classList.remove('up');
      },
    },
  };

  // A stage set to its still picture
  function still(st, sound) {
    st.run++;
    const sc = SCENES[sound.scene];
    st.msg.textContent = '';
    st.msg.className = 'sc-msg';
    st.tag.className = 'sc-tag';
    const pic = sc.still(st);
    if (Array.isArray(pic)) draw(st, pic, sc.stillOpts || {});
  }
  async function play(st, sound, theme) {
    still(st, sound);
    const sc = SCENES[sound.scene];
    const S = runner(st, sound, theme);
    if (st.view.querySelector('.sc-board')) S.cols = sc.still(st);
    try {
      await sc.play(S, st);
    } catch (e) {
      if (e !== STOP) throw e;
    }
  }
  return {
    make,
    still,
    play,
    set(o) { opts = { ...opts, ...o }; },
  };
})();
