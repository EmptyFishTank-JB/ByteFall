// VISITORS: seasonal characters passing through the wanderers' lane (wanderers.js runs them).
// HALLOWEEN (seasons.js): Frankenstein's monster, a mummy, the creature from the black lagoon,
// Nosferatu, a floating ghost, a flock of bats, a crow or two and a spider on its thread; NOVEMBER:
// a turkey, the crows, and migrating birds (geese in a V, ducks, songbirds, swallows; now and then
// one lands, pecks about and calls to a bot; poked, the flock bolts). Every so often one comes by (one visit at a time), crosses the card
// and goes; the monsters give a bot they pass a fright. Each can be poked: FRANKENSTEIN roars and
// stomps, the MUMMY groans, the CREATURE gurgles and splashes, NOSFERATU hisses and turns into
// bats, the GHOST says BOO (every bot near it jumps) and fades, bats scatter, crows take off
// cawing, the SPIDER scurries back up and the TURKEY gobbles and runs.
// SCENERY: the scary tree a wanderer pushes onto the card (HALLOWEEN; makeScenery, wanderers.js does
// the pushing): black eyes and a frown. It stays for the visit, behind everything else; poked, it
// creaks and a bat flies out.
// WINTER (December and into January, under the holidays): snow falling, a penguin waddling by
// (poked: SQUAWK and a belly slide off) and a snowman pushed in. CHRISTMAS: reindeer trotting
// past (now and then the one with the glowing red nose; poked: a snort and a prance off) and a
// decorated evergreen with blinking lights. HANUKKAH: a dreidel spinning across and landing on a
// letter, and a menorah with that night's candles lit. KWANZAA: a kinara with that day's candles
// lit. NEW YEAR'S EVE and NEW YEAR: fireworks, and a sign with the year; at the player's own
// midnight on New Year's Eve the bots count down from ten and cheer.
// Stacked seasons (seasons.js) all send theirs; up to two pieces of scenery stand at once.
// Sprites are drawn as text: one letter a pixel (its color in `pal`, '.' left empty), in the bots'
// own pixel size, facing right; a second frame (b) steps the legs, flaps the wings or ripples a hem.
function createVisitors(api) {
  // The air: on the start screen the lane is the whole card, so what flies, falls or hangs
  // uses its full height (sky(f): that far up it, 0-1); in the game's short lane, the heights
  // it always had (`low`)
  const tall = () => (api.laneH ? api.laneH() : 0) > 150;
  const sky = (lo, hi, low) => (tall() ? rand(lo, hi) * api.laneH() : low());
  const ceiling = () => (tall() ? api.laneH() : 100);
  const U = 34 / 16; // (a pixel of the bots' 16-wide grid, in screen pixels)
  const swap = (rows, map) => rows.map((r) => r.replace(/./g, (c) => map[c] || c)); // (blinking: colors traded)
  const EVERGREEN = ['.......y.......', '......yyy......', '.......y.......', '.......g.......', '......ggG......', '.....grggG.....', '......ggG......', '.....gggoG.....', '....gggggGG....', '...gbggggggG...', '.....ggggG.....', '....ggrgggG....', '...gggggbggG...', '..gggoggggggG..', '....ggggggG....', '...ggbgggrgG...', '..gggggggggGG..', '.ggrggggoggggG.', 'gggggggggggggGG', '.RyR..ttT..ByB.', '.yyy..ttT..yyy.', '.RyR..ttT..ByB.'];
  const SPRITES = {
    frank: {
      pal: { h: '#1d1d1d', g: '#7fb069', G: '#5e8f4c', e: '#111111', b: '#a0a4aa', m: '#2a2a2a', s: '#2c3140', S: '#1e222d', p: '#3a3226', k: '#0d0d0d' },
      a: ['..hhhhhhhh..', '..hhhhhhhh..', '..gggggggg..', '..geeggeeg..', '..gggggggg..', '..gGmmmmGg..', '.b.gggggg.b.', '..SSssssSS..',
        '..sssssssggg', '..sssssssss.', '..SsssssssS.', '..ssssssss..', '..pppppppp..', '..ppp..ppp..', '..ppp..ppp..', '..ppp..ppp..', '.kkkk..kkkk.'],
      b: { 13: '..ppp..ppp..', 14: '.ppp....ppp.', 15: '.ppp....ppp.', 16: 'kkkk....kkkk' },
    },
    mummy: {
      pal: { w: '#e6dfc3', d: '#b3a88a', x: '#2a2418', y: '#ffd23f' },
      a: ['...wwwwww...', '..wwdwwwdw..', '..wxywwxyw..', '..wdwwwwdw..', '...wwddww...', '..dwwwwwwd..', '..wwwwwwwwww', '..wdwwwwdddw',
        '.dwwwdwwww..', '.d.wwwwdww..', 'd..wdwwwww..', '...wwwwdw...', '...ww..ww...', '...wd..dw...', '...ww..ww...', '..www..www..'],
      b: { 9: '..dwwwwdww..', 10: '.d.wdwwwww..', 13: '..wd....dw..', 14: '..ww....ww..', 15: '.www....www.' },
    },
    creature: {
      pal: { c: '#3f8f6b', l: '#6fcf9f', f: '#2a6b52', e: '#ffe066', k: '#10231a' },
      a: ['f.f.cccc.f.f', '.fffccccfff.', '..cccccccc..', '..cekccekc..', '..cccccccc..', '..ckkkkkkc..', '...cccccc...', '.cccllllccc.',
        'cc.cllllc.cc', 'c..cllllc..c', 'k..cllllc..k', '...cllllc...', '...cc..cc...', '...cc..cc...', '..ccc..ccc..', '.ffff..ffff.'],
      b: { 13: '..cc....cc..', 14: '.ccc....ccc.', 15: 'ffff....ffff' },
    },
    nosferatu: {
      pal: { p: '#d6d9c8', b: '#34324a', e: '#ff3b3b', t: '#ffffff', n: '#d6d9c8' },
      a: ['...pppp...', '..pppppp..', 'p.pppppp.p', '.ppeppepp.', '..pppppp..', '..ptpptp..', '...pppp...', '..bbbbbb..', '.bbbbbbbb.', '.bbbbbbbpn',
        '.bbbbbbb.n', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '..bbbbbb..', '..bb..bb..', '..bb..bb..', '.bbb..bbb.'],
    },
    ghost: {
      pal: { w: '#f2f6ff', e: '#1b1d2a' },
      a: ['...wwww...', '.wwwwwwww.', 'wwwwwwwwww', 'wweewweeww', 'wweewweeww', 'wwwwwwwwww', 'wwwweewwww', 'wwwweewwww', 'wwwwwwwwww', 'wwwwwwwwww', 'w.ww.ww.ww'],
      b: { 10: 'ww.ww.ww.w' },
    },
    bat: {
      pal: { k: '#4a3a5c', r: '#ff3b5c' },
      a: ['k.....k', 'kk.k.kk', '.kkkkk.', '..krk..'],
      b: ['.......', '..kkk..', 'kkkkkkk', 'k.krk.k'],
    },
    spider: {
      pal: { k: '#3a2f48', l: '#5a4d6c', r: '#ff3b3b' },
      a: ['..l...l..', '.l.kkk.l.', 'l.krkrk.l', '.lkkkkkl.', 'l.l...l.l'],
      b: ['l.......l', '.llkkkll.', '..krkrk..', 'llkkkkkll', '..l...l..'],
    },
    turkey: {
      pal: { o: '#c96a2b', r: '#a8322a', t: '#d9a35a', b: '#6b4226', h: '#8fa9c0', e: '#111111', y: '#f2b632', w: '#d62f2f' },
      a: ['..ooo.......', '.orrro...hh.', 'orttto...hey', 'orttto...hw.', '.orttbbb.h..', '..obbbbbbh..', '..bbbbbbbb..', '...bbbbbbb..',
        '....bbbbb...', '.....y.y....', '.....y.y....', '....yy.yy...'],
      b: { 1: '.orrro......', 2: 'orttto......', 3: 'orttto......', 4: '.orttbbb....', 5: '..obbbbbbhh.', 6: '..bbbbbbbhey', 7: '...bbbbbbbw.',
        9: '.....y..y...', 10: '....y...y...', 11: '...yy...yy..' },
    },
    tree: {
      pal: { t: '#4a3528', T: '#2e2019', b: '#5e4634', k: '#000000', m: '#0a0604' }, // (black eyes, a frown)
      a: ['......b............b....', '.......b..b.......b.....', '.......b.b.......b.b....', '.....b..b........b.b....', '.....b..b.......b..b...b', '.b...b...b......b...b.b.', '..b.b....b.....b....bb..', '...bb.....b....b....b...', '....b.....b...b....b....', '.....b.....b..b...b.....', '......b....b.b...b......', '.......b....Tt...b..bbb.', 'b.......b...Tt..bbbb...b', '.b.......b..Ttbb.......b', '..bb......bTt.b.........', '....bb.....Ttb..........', '......bb..Ttttt.........', '........bbTtttt.........', '..........Ttttt.........', '..........Tkttk.........', '..........Tkttk.........', '..........Ttttt.........', '..........Ttmmt.........', '..........Tmmmm.........', '..........Tmttm.........', '..........Ttttt.........', '..........Ttttt.........', '.........Ttttttt........', '.........Ttmtttt........', '.........Ttttttt........', '.........Ttttttt........', '.........Ttttttt........', '.......ttTtttttttt......', '.....ttttTtttttttttt....'],
    },
    crow: {
      pal: { k: '#2c313b', K: '#4a5566', e: '#e0e0e0', o: '#8a8f98' },
      a: ['......kk.', '.....kkeo', 'kk..kkkk.', '.kkkkkKk.', '..kkkkk..', '...k.k...', '...k.k...'],
      b: ['.........', '.........', 'kk.......', '.kkkkkkk.', '..kkkkkke', '...k.k..o', '...k.k...'],
      // (flying: its wings open, flapping up and down, legs tucked)
      c: ['.kkk.....', '..kkk....', '...kkk.k.', 'kk..kkkeo', '.kkkkkkK.', '.........', '.........'],
      d: ['.........', '.........', '.......k.', 'kk..kkkeo', '.kkkkkkK.', '...kkk...', '....kkk..'],
    },
    // NOVEMBER's migrating birds: a and b on the ground (standing, pecking), c and d flying (wings
    // up, wings down)
    goose: {
      pal: { g: '#8b7d6b', G: '#5e5245', k: '#1b1b1b', w: '#eeeeee' },
      a: ['.........kk.', '.........kw.', '.........k..', '.........k..', '..gggggggk..', '.GGGGgggg...', '..wwwwwww...', '....k..k....'],
      b: ['............', '............', '............', '............', '..gggggggk..', '.GGGGggggkk.', '..wwwwwwwkw.', '....k..k....'],
      c: ['............', '............', '....GGG.....', '.....GGG....', 'GgggggggkkkK', '..wwwww...w.', '............', '............'],
      d: ['............', '............', '............', '............', 'GgggggggkkkK', '..wwGGG...w.', '.....GGG....', '............'],
    },
    duck: {
      pal: { h: '#2f8f4e', y: '#e8b923', b: '#9a8f80', B: '#6d6458', w: '#f2f2f2', c: '#7a4a32', o: '#e8902a' },
      a: ['.......hh.', '.......hhy', '.......w..', '.bbbbbcc..', 'BBBBbbbc..', '.bbbbbb...', '...o..o...'],
      b: ['..........', '..........', '..........', '.bbbbbcc..', 'BBBBbbbchh', '.bbbbbb.hy', '...o..o...'],
      c: ['..........', '...BB.....', '....BB....', 'Bbbbbcwhhy', '.bbbbb....', '..........', '..........'],
      d: ['..........', '..........', '..........', 'Bbbbbcwhhy', '.bbBBb....', '....BB....', '..........'],
    },
    songbird: { // (its colors by kind: SONGBIRDS below)
      pal: { b: '#6b5a4e', c: '#e0662b', k: '#111111', y: '#e8b923', o: '#8a6a4a' },
      a: ['...bb.', '..bkby', 'bbbcc.', '.bccc.', '..o.o.'],
      b: ['......', '...bb.', 'bbbbky', '.bccc.', '..o.o.'],
      c: ['.bb...', '..bb..', 'bbbbky', '.ccc..', '......'],
      d: ['......', '......', 'bbbbky', '.cbb..', '..bb..'],
    },
    swallow: {
      pal: { n: '#24366b', r: '#c2462e', w: '#efe6d6', k: '#222222' },
      a: ['......nn.', '.....nnr.', 'nnnnnnnr.', 'n..wwww..', '....k.k..'],
      b: ['.........', '......nn.', 'nnnnnnnnr', 'n..wwww..', '....k.k..'],
      c: ['...nn....', '....nn...', 'n.nnnnnnr', '.n.www...', '.........'],
      d: ['.........', '.........', 'n.nnnnnnr', '.nwnnw...', '....nn...'],
    },
    penguin: { // (c: on its belly, sliding)
      pal: { k: '#1b1f27', w: '#f2f4f8', o: '#ff9a1f' },
      a: ['...kkkk....', '..kkkkkk...', '..kkkkwwk..', '..kkkkwkwoo', '..kkkkwwk..', '.kkkkwwwwk.', 'kkkkwwwwwk.', 'kkkkwwwwwk.', '.kkkwwwwwk.', '.kkkwwwwwk.', '..kkwwwwk..', '...oo..oo..'],
      b: { 11: '....oo.oo..' },
      c: ['...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '..kkkkkkkk.', 'okkkkkkkwko', 'okwwwwwwww.'],
    },
    reindeer: {
      pal: { b: '#8a5a2b', w: '#c8a27a', a: '#d9c49a', k: '#1a120b', n: '#2a1a10' },
      a: ['.........a...a..', '.........aa.aa..', '..........aaa...', '...........bbb..', '...........bkbb.', '...........bbbbn', '.w........bbb...', '.bbbbbbbbbbbb...', '.bbbbbbbbbbbb...', '..bwwwwwwwwb....', '..b.b....b.b....', '..b.b....b.b....', '..k.k....k.k....'],
      b: { 10: '..b..b..b..b....', 11: '.b...b..b...b...', 12: '.k...k..k...k...' },
    },
    dreidel: { // (spinning: its sides turning past)
      pal: { b: '#2a6fdb', L: '#6fa8ff', w: '#ffffff', h: '#d4a017' },
      a: ['...hh...', '...hh...', '.bbbbbb.', 'bLbwwbbb', 'bLbwbbbb', 'bLbwwbbb', '.bbbbbb.', '..bbbb..', '...bb...', '...b....'],
      b: { 3: 'bbbbLbwb', 4: 'bbbbLbwb', 5: 'bbbbLbww' },
    },
    snowman: {
      pal: { w: '#f2f4f8', s: '#b8c4d6', k: '#1b1f27', o: '#ff8a1f', h: '#1b1f27', r: '#d23a3a', b: '#6b4a2b' },
      a: ['....hhhhh....', '....hhhhh....', '...hhhhhhh...', '....wwwws....', '...wwkwkws...', '...wwwwwoooo.', '...wwkkkws...', '....wwwws....', '...rrrrrrr...', 'b.wwwwwrrws.b', '.bwwwkwrrwsb.', '..wwwwwwwss..', '..wwwkwwwss..', '...wwwwwss...', '..wwwwwwwss..', '.wwwwwwwwwss.', 'wwwwwwwwwwwss', 'wwwwwwwwwwwss', 'wwwwwwwwwwwss', '.wwwwwwwwwss.', '..wwwwwwwss..'],
    },
    evergreen: { // (its lights blink, its star twinkles; presents under it)
      pal: { g: '#1f8a44', G: '#135226', t: '#6b4a2b', T: '#4a3320', y: '#ffd23f', Y: '#fff6c2', r: '#ff3b3b', b: '#3bb8ff', o: '#ffb000', R: '#d23a3a', B: '#3a7bd5' },
      a: EVERGREEN,
      b: swap(EVERGREEN, { r: 'o', o: 'b', b: 'r', y: 'Y' }),
    },
    // (menorah, kinara and sign: drawn for the night, the day or the year; scenery())
  };
  // A menorah with this night's candles lit (the newest, leftmost, first... placed from the right),
  // and the shamash, raised in the middle, always
  function menorah(night) {
    const rows = Array.from({ length: 13 }, () => Array(19).fill('.'));
    const put = (x, y, c) => { rows[y][x] = c; };
    const lit = [17, 15, 13, 11, 7, 5, 3, 1].slice(0, night);
    for (const x of [1, 3, 5, 7, 11, 13, 15, 17]) {
      put(x, 7, 'm');
      if (lit.includes(x)) { put(x, 3, 'f'); put(x, 4, 'F'); put(x, 5, 'c'); put(x, 6, 'c'); }
    }
    put(9, 1, 'f'); put(9, 2, 'F'); put(9, 3, 'c'); put(9, 4, 'c'); put(9, 5, 'm'); put(9, 6, 'm'); put(9, 7, 'm');
    for (let x = 1; x <= 17; x++) put(x, 8, 'm');
    put(9, 9, 'm'); put(9, 10, 'm');
    for (let x = 6; x <= 12; x++) put(x, 11, 'M');
    for (let x = 5; x <= 13; x++) put(x, 12, 'M');
    const a = rows.map((r) => r.join(''));
    return { pal: { m: '#d4a017', M: '#a67c12', c: '#dfe8ff', f: '#ffd23f', F: '#ff8a1f' }, a, b: swap(a, { f: 'F', F: 'f' }) };
  }
  // A kinara: three red candles, the black one, three green; the black lit first, then from the
  // outside in, alternating (one more each day)
  function kinara(day) {
    const rows = Array.from({ length: 11 }, () => Array(15).fill('.'));
    const put = (x, y, c) => { rows[y][x] = c; };
    const lit = [7, 1, 13, 3, 11, 5, 9].slice(0, day);
    [1, 3, 5, 7, 9, 11, 13].forEach((x, i) => {
      const c = i < 3 ? 'r' : i === 3 ? 'k' : 'g';
      for (let y = 3; y <= 6; y++) put(x, y, c);
      put(x, 7, 'w');
      if (lit.includes(x)) { put(x, 1, 'f'); put(x, 2, 'F'); }
    });
    for (let x = 0; x <= 14; x++) put(x, 8, 'w');
    for (let x = 1; x <= 13; x++) put(x, 9, 'W');
    for (let x = 3; x <= 11; x++) put(x, 10, 'W');
    const a = rows.map((r) => r.join(''));
    return { pal: { r: '#d23a3a', k: '#3a3a42', g: '#1f9d4c', w: '#8a5a2b', W: '#6b4222', f: '#ffd23f', F: '#ff8a1f' }, a, b: swap(a, { f: 'F', F: 'f' }) };
  }
  // A sign with the year on it (its digits blink)
  const DIGITS = ['###,#.#,#.#,#.#,###', '.#.,##.,.#.,.#.,###', '###,..#,###,#..,###', '###,..#,.##,..#,###', '#.#,#.#,###,..#,..#',
    '###,#..,###,..#,###', '###,#..,###,#.#,###', '###,..#,..#,.#.,.#.', '###,#.#,###,#.#,###', '###,#.#,###,..#,###'].map((d) => d.split(','));
  function sign(year) {
    const rows = Array.from({ length: 14 }, () => Array(19).fill('.'));
    for (let y = 0; y < 9; y++) for (let x = 0; x < 19; x++) rows[y][x] = (y === 0 || y === 8 || x === 0 || x === 18) ? 'B' : 'b';
    String(year).slice(-4).split('').forEach((n, i) => {
      DIGITS[+n].forEach((line, y) => line.split('').forEach((c, x) => { if (c === '#') rows[2 + y][2 + i * 4 + x] = 'y'; }));
    });
    for (let y = 9; y < 14; y++) { rows[y][4] = 'p'; rows[y][14] = 'p'; }
    const a = rows.map((r) => r.join(''));
    return { pal: { b: '#20264a', B: '#b8c4d6', y: '#ffd23f', Y: '#ff7ad9', p: '#6b4a2b' }, a, b: swap(a, { y: 'Y' }) };
  }

  // Rows of letters into rects: runs of one color merged along each row
  function rects(rows, pal) {
    let out = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const c = row[x];
        let run = 1;
        while (x + run < row.length && row[x + run] === c) run++;
        if (c !== '.' && pal[c]) out += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${pal[c]}"/>`;
        x += run;
      }
    });
    return out;
  }
  function spriteEl(kind, pal) {
    const def = { ...SPRITES[kind], ...(pal ? { pal: { ...SPRITES[kind].pal, ...pal } } : {}) };
    const w = def.a[0].length;
    const h = def.a.length;
    const frameB = Array.isArray(def.b) ? def.b : def.a.map((row, i) => (def.b && def.b[i]) || row); // (one frame: the same twice)
    const el = document.createElement('div');
    el.className = `visitor visitor-${kind}`;
    el.style.width = `${w * U}px`;
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w * U}" height="${h * U}" shape-rendering="crispEdges" aria-hidden="true">`
      + `<g class="f-a">${rects(def.a, def.pal)}</g><g class="f-b">${rects(frameB, def.pal)}</g>`
      + `${def.c ? `<g class="f-c">${rects(def.c, def.pal)}</g>` : ''}${def.d ? `<g class="f-d">${rects(def.d, def.pal)}</g>` : ''}</svg>`
      + '<span class="walker-emote"></span>';
    return el;
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  // How each moves: pixels a second, the frame time, whether it shuffles and bobs, how high it goes
  const KINDS = {
    frank: { speed: 12, frameMs: 380, sway: 1, bob: 1, monster: true, poke: 'roar' },
    mummy: { speed: 9, frameMs: 460, sway: 1, bob: 1, monster: true, poke: 'groan' },
    creature: { speed: 14, frameMs: 300, sway: 1, bob: 1, monster: true, drips: true, poke: 'blub' },
    nosferatu: { speed: 10, frameMs: 0, sway: 0, bob: 0, monster: true, poke: 'hiss' },
    ghost: { speed: 16, frameMs: 420, sway: 0, bob: 0, float: 12, monster: true, poke: 'boo' },
    bat: { speed: 55, frameMs: 120, fly: true, poke: 'scatter' },
    crow: { speed: 20, frameMs: 0, hop: true, poke: 'caw' },
    spider: { speed: 40, frameMs: 260, poke: 'scurry' },
    turkey: { speed: 16, frameMs: 280, sway: 1, poke: 'gobble' },
    // (bird: wave, how far it rises and dips as it flies, over waveMs; beatMs, a wingbeat; call)
    goose: { speed: 42, frameMs: 0, bird: true, wave: 1.5, waveMs: 420, beatMs: 260, call: 'HONK!', poke: 'flush' },
    duck: { speed: 48, frameMs: 0, bird: true, wave: 2, waveMs: 300, beatMs: 140, call: 'QUACK!', poke: 'flush' },
    songbird: { speed: 40, frameMs: 0, bird: true, wave: 5, waveMs: 170, beatMs: 90, call: 'TWEET!', poke: 'flush' },
    swallow: { speed: 85, frameMs: 0, bird: true, wave: 8, waveMs: 520, beatMs: 110, call: 'CHIRP!', poke: 'flush' },
    tree: { speed: 0, frameMs: 0, poke: 'creak' },
    penguin: { speed: 13, frameMs: 240, sway: 1, bob: 1, poke: 'squawk' },
    reindeer: { speed: 30, frameMs: 180, poke: 'snort' },
    dreidel: { speed: 38, frameMs: 90, poke: 'spin' },
    snowman: { speed: 0, frameMs: 0, poke: 'brrr' },
    evergreen: { speed: 0, frameMs: 650, poke: 'jingle' },
    menorah: { speed: 0, frameMs: 220, fixed: true, poke: 'glow' },
    kinara: { speed: 0, frameMs: 240, fixed: true, poke: 'glow' },
    sign: { speed: 0, frameMs: 600, fixed: true, poke: 'cheer' },
  };
  // (fixed: never mirrored, its order matters: the candles, the year's digits)
  // What each season sends (one visit at a time)
  const VISITS = {
    halloween: ['frank', 'mummy', 'creature', 'nosferatu', 'ghost', 'bats', 'crows', 'spider'],
    november: ['turkey', 'turkey', 'crows', 'geese', 'ducks', 'songbirds', 'swallows'],
    winter: ['penguin'],
    christmas: ['reindeer', 'reindeer'],
    hanukkah: ['dreidel'],
  };
  // The scenery each season has pushed in (up to two pieces at once, one of each)
  const SCENERY = { halloween: 'tree', winter: 'snowman', christmas: 'evergreen', hanukkah: 'menorah', kwanzaa: 'kinara', nye: 'sign', newyear: 'sign' };
  const seasons = () => (typeof Season !== 'undefined' ? Season.active() : []);
  const visits = () => seasons().flatMap((id) => VISITS[id] || []);

  let list = [];
  let nextVisit = performance.now() + rand(6000, 15000);

  function add(kind, x, dir, extra = {}) {
    const el = spriteEl(kind, extra.pal);
    const v = {
      kind, el, emote: el.querySelector('.walker-emote'), x, y: 0, dir, age: 0, speed: KINDS[kind].speed * rand(0.85, 1.15),
      state: 'go', frame: 0, frameAt: 0, scared: new Set(), phase: rand(0, 6.28), ...extra,
    };
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      poke(v);
    });
    api.lane.insertBefore(el, api.lane.firstChild); // (behind the bots; bats and crows go on top, style.css)
    list.push(v);
    place(v);
    return v;
  }
  function say(v, text, ms = 1200) {
    v.emote.textContent = text;
    v.emote.classList.add('show');
    clearTimeout(v.sayTimer);
    v.sayTimer = setTimeout(() => v.emote.classList.remove('show'), ms);
  }
  // One visit: a monster, the ghost, a flock of bats or a crow or two, in from either side
  function visit(what = pick(visits().length ? visits() : VISITS.halloween)) {
    if (what === 'countdown') return countdown();
    if (what === 'fireworks') { for (let i = 0; i < 3; i++) setTimeout(firework, i * 450); return; }
    const W = api.laneW();
    const fromLeft = Math.random() < 0.5;
    const dir = fromLeft ? 1 : -1;
    const edge = (w) => (fromLeft ? -w - 4 : W + 4);
    api.botEvent(`visit-${what}`);
    if (what === 'bats') {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) add('bat', edge(16) - dir * k * rand(14, 30), dir, { fly: sky(0.2, 0.8, () => rand(14, 30)), speed: rand(45, 75) });
    } else if (what === 'crows') {
      const n = Math.random() < 0.6 ? 1 : 2;
      for (let k = 0; k < n; k++) add('crow', edge(20) - dir * k * 26, dir, { stopAt: rand(0.2, 0.7) * W + k * 20, life: rand(5000, 9000) });
    } else if (what === 'spider') { // (down from above on its thread, somewhere along the card)
      // (from the top of the card on the start screen, dropping behind the title)
      const s = add('spider', rand(0.15, 0.8) * W, 1, { y: tall() ? ceiling() : 110, hang: sky(0.3, 0.6, () => rand(12, 22)), life: rand(3000, 5500), state: 'down' });
      s.el.insertAdjacentHTML('afterbegin', '<i class="visitor-thread"></i>');
      s.el.style.setProperty('--thread', `${ceiling() + 60}px`);
    } else if (FLOCKS[what]) flock(what, dir, edge, W);
    else if (what === 'turkey') add('turkey', edge(12 * U), dir, { stopAt: rand(0.25, 0.65) * W, life: rand(2500, 4500) });
    else if (what === 'reindeer' || what === 'rudolph') { // (now and then, the one with the red nose)
      const red = what === 'rudolph' || Math.random() < 0.25;
      const r = add('reindeer', edge(16 * U), dir, red ? { pal: { n: '#ff2a2a' } } : {});
      if (red) { r.el.classList.add('v-rudolph'); api.botEvent('visit-rudolph'); }
    } else if (what === 'dreidel') add('dreidel', edge(8 * U), dir, { stopAt: rand(0.25, 0.7) * W });
    else add(what, edge(SPRITES[what].a[0].length * U), dir);
  }

  // NOVEMBER's migrating birds: a flock flying over (geese in a V, ducks in a line, a scatter of
  // songbirds, swallows swooping fast). Now and then one drops out to land, pecks about, chirps at
  // a bot near it (which reacts), and flies off after the others.
  const FLOCKS = { geese: { kind: 'goose', n: [5, 8] }, ducks: { kind: 'duck', n: [3, 5] }, songbirds: { kind: 'songbird', n: [4, 7] }, swallows: { kind: 'swallow', n: [3, 6] } };
  const SONGBIRDS = [
    { b: '#6b5a4e', c: '#e0662b' }, // (robins)
    { b: '#3b6fd1', c: '#d9874a' }, // (bluebirds)
    { b: '#e8c21f', c: '#f2d84a', o: '#6b5a2e' }, // (goldfinches)
    { b: '#d42a2a', c: '#b51f1f' }, // (cardinals)
  ];
  function flock(what, dir, edge, W) {
    const f = FLOCKS[what];
    const count = f.n[0] + Math.floor(Math.random() * (f.n[1] - f.n[0] + 1));
    const base = what === 'geese' ? sky(0.55, 0.85, () => rand(22, 28)) : what === 'swallows' ? sky(0.2, 0.5, () => rand(12, 22)) : sky(0.3, 0.7, () => rand(16, 28));
    const speed = KINDS[f.kind].speed * rand(0.9, 1.1);
    const pal = what === 'songbirds' ? pick(SONGBIRDS) : undefined;
    const lander = Math.random() < 0.35 ? 1 + Math.floor(Math.random() * (count - 1)) : -1; // (never the lead goose)
    const id = {};
    const w = SPRITES[f.kind].a[0].length * U;
    for (let k = 0; k < count; k++) {
      let x = edge(w);
      let y = base;
      let sp = speed;
      if (what === 'geese') { // (a V: the leader out front, the rest behind it on either side)
        const rank = Math.ceil(k / 2);
        x -= dir * rank * 24;
        y += (k % 2 ? 1 : -1) * rank * (tall() ? 6 : 2.5);
      } else if (what === 'ducks') { // (a line, stepping down)
        x -= dir * k * 18;
        y -= k * (tall() ? 5 : 2);
      } else { // (loose: each at its own height and pace)
        x -= dir * (k * rand(12, 26) + rand(0, 10));
        y += rand(-6, 6);
        sp *= rand(0.85, 1.15);
      }
      const b = add(f.kind, x, dir, { fly: Math.max(4, y), speed: sp, flock: id, lands: k === lander, stopAt: rand(0.2, 0.7) * W, life: rand(3500, 7000), ...(pal ? { pal } : {}) });
      b.el.classList.add('v-fly');
    }
  }
  // A landed bird calls to the nearest bot, which reacts
  function greet(v) {
    const k = KINDS[v.kind];
    say(v, k.call, 1000);
    let near = null;
    for (const b of api.walkers()) if (Math.abs(b.x - v.x) < 70 && (!near || Math.abs(b.x - v.x) < Math.abs(near.x - v.x))) near = b;
    if (near) setTimeout(() => { if (!near.leaving) api.say(near, pick(['happy', 'surprised', 'love']), true); }, 450);
  }
  function wingbeat(v, now, ms) {
    if (now - v.frameAt < ms) return;
    v.frameAt = now;
    v.frame = 1 - v.frame;
    v.el.classList.toggle('step', !!v.frame);
  }
  // The season's scenery, for a wanderer to push in (wanderers.js): off the card until it's moved.
  // Its spot is clear of any already standing (and of the path to them: it never passes through)
  const standing = () => list.filter((v) => v.state === 'scenery');
  function nextScenery() {
    const here = standing();
    if (here.length >= 2) return null;
    const kinds = [...new Set(seasons().map((id) => SCENERY[id]).filter(Boolean))].filter((k) => !here.some((v) => v.kind === k));
    return kinds.length ? pick(kinds) : null;
  }
  // (ok(x): whether its pusher, stopping at x beside it, has room there among the bots)
  function makeScenery(dir, ok = () => true) {
    const kind = nextScenery();
    if (!kind) return null;
    if (kind === 'menorah') SPRITES.menorah = menorah(Season.hanukkahNight() || 8);
    if (kind === 'kinara') SPRITES.kinara = kinara(Season.kwanzaaDay() || 7);
    if (kind === 'sign') SPRITES.sign = sign(Season.newYear());
    const w = SPRITES[kind].a[0].length * U;
    let lo = 16 + 34; // (room at the edge for its pusher, who stops beside it)
    let hi = api.laneW() - w - 16 - 34;
    for (const o of standing()) {
      const from = Math.min(o.x, o.spot);
      const to = Math.max(o.x, o.spot) + o.w;
      if (dir > 0) hi = Math.min(hi, from - w - 12);
      else lo = Math.max(lo, to + 12);
    }
    if (hi < lo) return null;
    const t = add(kind, -400, 1, { state: 'scenery' });
    t.el.classList.add('visitor-scenery');
    t.w = w;
    t.dir = KINDS[kind].fixed ? 1 : dir;
    const pusherAt = (spot) => (dir > 0 ? spot - (34 - 6) : spot + w - 6);
    t.spot = rand(lo, hi);
    for (let i = 0; i < 12 && !ok(pusherAt(t.spot)); i++) t.spot = rand(lo, hi);
    t.x = dir > 0 ? -w - 40 : api.laneW() + 40;
    return t;
  }
  function moveTree(t, x) {
    t.x = x;
    place(t);
  }

  function poke(v) {
    if (v.state === 'scenery') {
      const k = KINDS[v.kind];
      const cls = k.poke === 'glow' ? 'v-glow' : 'v-creak';
      v.el.classList.remove(cls);
      void v.el.offsetWidth;
      v.el.classList.add(cls);
      if (k.poke === 'creak') { // (creaks, and a bat flies out of it in the season)
        say(v, 'creeeak', 1000);
        if (Season.is('halloween')) add('bat', v.x + v.w / 2, pick([-1, 1]), { fly: 40, speed: rand(60, 90), bolt: true });
      } else if (k.poke === 'brrr') say(v, 'brrr!', 900);
      else if (k.poke === 'jingle') { say(v, 'jingle!', 900); v.el.classList.add('v-blink'); setTimeout(() => v.el.classList.remove('v-blink'), 1200); }
      else if (k.poke === 'cheer') { say(v, Season.is('nye') ? 'SOON!' : 'HAPPY NEW YEAR!', 1400); firework(); }
      api.botEvent(`${v.kind}-pokes`);
      return;
    }
    if (v.kind === 'spider') {
      if (v.state === 'up') return;
      api.botEvent('visitor-pokes');
      say(v, '!', 700);
      v.state = 'up';
      v.climb = 130;
      api.startle(v, 60); // (the bots near it don't like spiders)
      return;
    }
    if (v.state !== 'go' && v.state !== 'peck' && v.state !== 'land') return;
    api.botEvent('visitor-pokes');
    const k = KINDS[v.kind];
    if (k.poke === 'squawk') { // (a flap, then off on its belly)
      say(v, 'SQUAWK!', 900);
      v.state = 'slide';
      v.el.classList.add('v-slide');
      v.speed = 75;
      api.botEvent('penguin-slide');
      return;
    }
    if (k.poke === 'snort') { // (a snort, then a prance off at double time)
      say(v, 'SNORT!', 900);
      v.speed *= 2.2;
      v.prance = true;
      return;
    }
    if (k.poke === 'spin') { // (landed: spun again, on along the card, to land on another letter)
      if (v.state !== 'land') return;
      say(v, 'whirr', 700);
      const on = rand(30, 70);
      spin(v, v.dir > 0 ? v.x + on : api.laneW() - v.x + on); // (stopAt: from the side it came in)
      return;
    }
    if (k.poke === 'roar') { // (arms up and a stomp: nearby bots jump)
      say(v, 'RAAWR!');
      v.el.classList.add('v-stomp');
      setTimeout(() => v.el.classList.remove('v-stomp'), 700);
      api.startle(v, 80);
    } else if (k.poke === 'groan') {
      say(v, 'mmmMMPH');
      v.el.classList.add('v-wobble');
      setTimeout(() => v.el.classList.remove('v-wobble'), 900);
      v.speed *= 0.7;
    } else if (k.poke === 'blub') {
      say(v, 'BLUB!');
      for (let i = 0; i < 7; i++) drip(v, true);
    } else if (k.poke === 'hiss') { // (turns into bats)
      say(v, 'HSSSS', 700);
      v.el.classList.add('v-shake');
      v.state = 'leaving';
      setTimeout(() => {
        v.el.classList.add('v-vanish');
        for (let i = 0; i < 3; i++) add('bat', v.x + 4 + i * 6, pick([-1, 1]), { fly: rand(18, 30), speed: rand(70, 100), bolt: true });
        setTimeout(() => { v.gone = true; }, 450);
      }, 650);
    } else if (k.poke === 'boo') { // (every bot near it jumps, then it fades away)
      say(v, 'BOO!', 900);
      v.el.classList.add('v-boo');
      v.state = 'leaving';
      api.startle(v, 130);
      setTimeout(() => v.el.classList.add('v-fade'), 500);
      setTimeout(() => { v.gone = true; }, 1300);
    } else if (k.poke === 'scatter') { // (the whole flock bolts, up and away)
      for (const b of list) if (b.kind === 'bat') { b.speed *= 2; b.bolt = true; }
    } else if (k.poke === 'caw') {
      say(v, 'CAW!', 900);
      v.state = 'fly';
    } else if (k.poke === 'flush') { // (a call, and the whole flock bolts up and away)
      say(v, k.call, 900);
      for (const b of list) {
        if (b.flock !== v.flock) continue;
        b.bolt = true;
        b.speed *= 1.6;
        if (b.state !== 'go') { b.state = 'up'; b.el.classList.add('v-fly'); }
      }
    } else if (k.poke === 'gobble') { // (a flustered shake, then off at a run)
      say(v, 'GOBBLE!', 1000);
      v.el.classList.add('v-shake');
      setTimeout(() => v.el.classList.remove('v-shake'), 600);
      v.state = 'go';
      v.speed *= 3;
      v.ran = true;
    }
  }

  // Water off the creature: a drop falling from it (a splash of them when it's poked)
  function drip(v, splash = false) {
    const d = document.createElement('i');
    d.className = 'visitor-drip';
    const w = v.el.offsetWidth;
    d.style.left = `${rand(0.2, 0.8) * w}px`;
    d.style.setProperty('--dx', `${splash ? rand(-16, 16) : 0}px`);
    d.style.setProperty('--dy', `${splash ? rand(-18, -6) : rand(10, 16)}px`);
    v.el.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }

  // The dreidel: spinning along to a stop, a wobble, and it lands on a letter
  const LETTERS = ['NUN', 'GIMEL', 'HEY', 'SHIN'];
  function spin(v, stopAt) {
    v.state = 'go';
    v.still = false;
    v.stopAt = stopAt;
    v.speed = KINDS.dreidel.speed * rand(0.85, 1.15);
  }

  // WEATHER: snow in the winter (pixel flakes drifting down to the floor, a moment there, gone);
  // fireworks at the new year (a rocket up, bursting into pixel sparks that fall away)
  let flakes = [];
  let nextFlake = 0;
  let nextFirework = performance.now() + rand(2000, 5000);
  const snap = (n) => Math.round(n / U) * U;
  function snow(now, dt) {
    const W = api.laneW();
    if (now > nextFlake && flakes.length < (tall() ? 40 : 18)) {
      nextFlake = now + rand(180, 420);
      const el = document.createElement('i');
      el.className = 'visitor-flake';
      api.lane.appendChild(el);
      // (from the top of the card on the start screen, falling at the same pace across it)
      const scale = tall() ? api.laneH() / 96 : 1;
      flakes.push({ el, x: rand(0, W), y: sky(0.85, 1, () => rand(70, 96)), speed: rand(9, 16) * Math.min(scale, 4), phase: rand(0, 6.28), age: 0 });
    }
    for (const f of flakes) {
      f.age += dt * 1000;
      if (f.y > FLOOR) f.y = Math.max(FLOOR, f.y - f.speed * dt);
      else if (!f.landed) f.landed = now;
      const drift = Math.sin(f.age / 700 + f.phase) * 5;
      f.el.style.transform = `translate(${snap(f.x + drift).toFixed(1)}px, ${(-snap(f.y)).toFixed(1)}px)`;
      if (f.landed && now - f.landed > 900) f.gone = true;
    }
    flakes = flakes.filter((f) => {
      if (f.gone) f.el.remove();
      return !f.gone;
    });
  }
  const SPARKS = ['#ff3b5c', '#ffd23f', '#3bd1ff', '#7cff6b', '#b36bff', '#ff7ad9', '#ffffff'];
  function firework() {
    if (!api.lane.isConnected) return;
    const W = api.laneW();
    const x = snap(rand(0.12, 0.88) * W);
    const top = snap(sky(0.5, 0.85, () => rand(58, 84)));
    const c = pick(SPARKS);
    const piece = (cls) => {
      const el = document.createElement('i');
      el.className = cls;
      el.style.setProperty('--c', c);
      api.lane.appendChild(el);
      return el;
    };
    const rocket = piece('visitor-spark rocket');
    const up = rocket.animate([{ transform: `translate(${x}px, ${-FLOOR}px)` }, { transform: `translate(${x}px, ${-top}px)` }],
      { duration: 650, easing: `steps(${Math.round((top - FLOOR) / U / 2)}, end)`, fill: 'forwards' });
    up.onfinish = () => {
      rocket.remove();
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.15, 0.15);
        const r = rand(12, 20) * (tall() ? 1.6 : 1);
        const s = piece('visitor-spark');
        const frames = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6;
          const dx = Math.cos(a) * r * Math.sqrt(t);
          const dy = Math.sin(a) * r * Math.sqrt(t) - 10 * t * t; // (spreading, then falling)
          frames.push({ transform: `translate(${snap(x + dx)}px, ${snap(-top - dy)}px)`, opacity: k < 4 ? 1 : 1 - (k - 3) / 4, offset: t, easing: 'steps(1, end)' });
        }
        s.animate(frames, { duration: 950, fill: 'forwards' }).onfinish = () => s.remove();
      }
    };
  }

  // NEW YEAR'S EVE at the player's own midnight: the bots count down from ten and cheer, and the
  // sky fills with fireworks
  let counted = false;
  function countdown() {
    counted = true;
    for (let i = 10; i >= 1; i--) {
      setTimeout(() => api.walkers().forEach((w) => api.say(w, 'idle', String(i))), (10 - i) * 1000);
    }
    setTimeout(() => {
      const year = String(Season.newYear());
      api.walkers().forEach((w, i) => api.say(w, 'happy', i === 0 ? 'HAPPY NEW YEAR!' : pick(['WOOO!', 'YAY!', `${year}!`]))); // (one says it all)
      api.botEvent('countdown');
      for (let i = 0; i < 10; i++) setTimeout(firework, i * 320 + rand(0, 200));
    }, 10000);
    setTimeout(() => api.walkers().forEach((w) => api.say(w, 'idle', '')), 14000);
  }

  // (the lumbering in whole pixels of the sprite's grid: a pixel's shuffle side to side and a
  // pixel's bob, heights snapped to the grid too; no tilting). FLOOR: the bots' feet rest two
  // pixels of their grid above the lane's bottom edge (their 17-row grid ends two rows under the
  // legs), and every visitor stands on that same floor.
  const FLOOR = 2 * U;
  function place(v) {
    const k = KINDS[v.kind];
    const t = v.age / 1000;
    const going = v.state === 'go';
    const shuffle = k.sway && going ? Math.round(Math.sin(t * 5 + v.phase)) * U : 0;
    const bob = k.bob && going ? Math.round(Math.abs(Math.sin(t * 5 + v.phase)) * k.bob) * U : 0;
    const y = Math.round(v.y / U) * U;
    v.el.style.transform = `translate(${(v.x + shuffle).toFixed(1)}px, ${(-y - bob - FLOOR).toFixed(1)}px)`;
    v.el.querySelector('svg').style.transform = `scaleX(${v.dir})`;
  }

  function frame(now, dt) {
    const W = api.laneW();
    if (!list.some((v) => v.state !== 'scenery') && now > nextVisit && visits().length) {
      visit();
      nextVisit = now + rand(20000, 45000);
    }
    if (Season.is('winter') || flakes.length) snow(now, dt);
    if ((Season.is('nye') || Season.is('newyear')) && now > nextFirework) {
      firework();
      nextFirework = now + rand(Season.is('newyear') ? 3000 : 6000, 11000);
    }
    if (!counted && Season.is('nye')) { // (ten seconds to the player's midnight)
      const d = new Date();
      if (d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() >= 50) countdown();
    }
    for (const v of list) {
      const k = KINDS[v.kind];
      v.age += dt * 1000;
      if (k.frameMs && !v.still && v.state !== 'slide' && now - v.frameAt > (v.state === 'peck' ? 160 : k.frameMs)) {
        v.frameAt = now;
        v.frame = 1 - v.frame;
        v.el.classList.toggle('step', !!v.frame);
      }
      if (v.state === 'scenery') {
        // (scenery: pushed by a wanderer, or standing where it was left)
      } else if (v.kind === 'dreidel') { // (spins along, wobbles to a stop, lands on a letter; then on)
        if (v.state === 'go') {
          v.x += v.dir * v.speed * dt;
          if (v.stopAt !== null && ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt))) {
            v.state = 'wobble';
            v.until = now + 700;
            v.el.classList.add('v-shake');
          }
        } else if (v.state === 'wobble' && now > v.until) {
          v.el.classList.remove('v-shake');
          v.state = 'land';
          v.still = true;
          const letter = pick(LETTERS);
          say(v, `${letter}!`, 1800);
          if (letter === 'GIMEL') api.botEvent('gimel');
          v.until = now + 3200;
        } else if (v.state === 'land' && now > v.until) spin(v, null); // (and off it goes)
      } else if (v.kind === 'spider') { // (down its thread, a dangle, back up)
        if (v.state === 'down') {
          v.y -= 38 * dt;
          if (v.y <= v.hang) { v.y = v.hang; v.state = 'hang'; v.until = now + v.life; }
        } else if (v.state === 'hang') {
          v.y = v.hang + Math.sin(v.age / 380) * 2;
          if (now > v.until) { v.state = 'up'; v.climb = 32; }
        } else if (v.state === 'up') {
          v.y += v.climb * dt;
        }
      } else if (v.kind === 'turkey') { // (struts in, pecks a while, struts on out)
        if (v.state === 'go') {
          v.x += v.dir * v.speed * dt;
          if (!v.pecked && !v.ran && ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt))) { v.state = 'peck'; v.until = now + v.life; v.pecked = true; }
        } else if (v.state === 'peck' && now > v.until) v.state = 'go';
      } else if (k.bird) {
        if (v.state === 'go') { // (with the flock, across the sky)
          v.x += v.dir * v.speed * dt;
          v.y = v.fly + Math.sin(v.age / k.waveMs + v.phase) * k.wave + (v.bolt ? v.age / 50 : 0);
          wingbeat(v, now, k.beatMs);
          if (v.kind === 'goose' && Math.random() < dt * 0.15) say(v, k.call, 800); // (the odd honk)
          if (v.lands && !v.bolt && ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt))) v.state = 'down';
        } else if (v.state === 'down') { // (gliding down to land)
          v.x += v.dir * v.speed * 0.45 * dt;
          v.y -= (tall() ? 90 : 35) * dt;
          wingbeat(v, now, k.beatMs * 2);
          if (v.y <= 0) {
            v.y = 0;
            v.state = 'peck';
            v.until = now + v.life;
            v.el.classList.remove('v-fly', 'step');
            greet(v);
          }
        } else if (v.state === 'peck') { // (pecks about, now and then turning around)
          if (now - v.frameAt > (v.frame ? 220 : rand(300, 900))) {
            v.frameAt = now;
            v.frame = 1 - v.frame;
            v.el.classList.toggle('step', !!v.frame);
            if (!v.frame && Math.random() < 0.2) v.dir = -v.dir;
          }
          if (now > v.until) { v.state = 'up'; v.el.classList.add('v-fly'); }
        } else if (v.state === 'up') { // (off up and away)
          v.x += v.dir * v.speed * dt;
          v.y += (tall() ? 0.25 * api.laneH() : 40) * dt;
          wingbeat(v, now, k.beatMs);
        }
      } else if (k.fly) { // (bats: a wavering line through the air)
        v.x += v.dir * v.speed * dt;
        v.y = v.fly + Math.sin(v.age / 260 + v.phase) * 5 + (v.bolt ? v.age / 60 : 0);
      } else if (v.kind === 'crow') {
        if (v.state === 'go') {
          v.x += v.dir * v.speed * dt;
          v.y = Math.abs(Math.sin(v.age / 110)) * 3; // (hopping)
          if ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt)) { v.state = 'peck'; v.until = now + v.life; v.y = 0; }
        } else if (v.state === 'peck') {
          if (now > v.until) v.state = 'fly';
        } else if (v.state === 'fly') { // (off up and away)
          v.x += v.dir * 60 * dt;
          v.y += (tall() ? 0.22 * api.laneH() : 55) * dt; // (up across the card, and out)
          v.el.classList.add('v-fly');
          if (now - v.frameAt > 110) { // (a wingbeat)
            v.frameAt = now;
            v.frame = 1 - v.frame;
            v.el.classList.toggle('step', !!v.frame);
          }
        }
      } else if (v.state === 'go' || v.state === 'leaving' || v.state === 'slide') {
        if (v.state !== 'leaving') v.x += v.dir * v.speed * dt;
        if (v.prance) v.y = Math.abs(Math.sin(v.age / 110)) * 4;
        if (k.float) v.y = k.float + Math.sin(v.age / 500 + v.phase) * 4;
        if (k.drips && Math.random() < dt * 1.4) drip(v);
        // A monster passing a bot gives it a fright (once each)
        if (k.monster && v.state === 'go') {
          for (const b of api.walkers()) {
            if (v.scared.has(b) || Math.abs(b.x - v.x) > 40 || b.leaving || b.state === 'walk') continue;
            v.scared.add(b);
            if (Math.random() < 0.5) api.startle(v, 45);
          }
        }
      }
      place(v);
      if (v.state === 'scenery') continue; // (it stays)
      const w = v.el.offsetWidth || 30;
      if (v.x < -w - 40 || v.x > W + 40 || v.y > ceiling() + 40) v.gone = true;
    }
    list = list.filter((v) => {
      if (v.gone) v.el.remove();
      return !v.gone;
    });
  }
  function clear() {
    list.forEach((v) => v.el.remove());
    list = [];
    flakes.forEach((f) => f.el.remove());
    flakes = [];
  }
  return { frame, clear, visit, list: () => list, makeScenery, moveTree };
}
