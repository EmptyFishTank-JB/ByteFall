// VISITORS: seasonal characters passing through the wanderers' lane (wanderers.js runs them).
// HALLOWEEN (seasons.js): Frankenstein's monster, a mummy, the creature from the black lagoon,
// Nosferatu, a floating ghost, a flock of bats and a crow or two. Every so often one comes by (one
// at a time), crosses the card and goes; the monsters give a bot they pass a fright. Each can be
// poked: FRANKENSTEIN roars and stomps, the MUMMY groans, the CREATURE gurgles and splashes,
// NOSFERATU hisses and turns into bats, the GHOST says BOO (every bot near it jumps) and fades,
// bats scatter and crows take off cawing.
// Sprites are drawn as text: one letter a pixel (its color in `pal`, '.' left empty), in the bots'
// own pixel size, facing right; a second frame (b) steps the legs, flaps the wings or ripples a hem.
function createVisitors(api) {
  const U = 34 / 16; // (a pixel of the bots' 16-wide grid, in screen pixels)
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
    crow: {
      pal: { k: '#2c313b', K: '#4a5566', e: '#e0e0e0', o: '#8a8f98' },
      a: ['......kk.', '.....kkeo', 'kk..kkkk.', '.kkkkkKk.', '..kkkkk..', '...k.k...', '...k.k...'],
      b: ['.........', '.........', 'kk.......', '.kkkkkkk.', '..kkkkkke', '...k.k..o', '...k.k...'],
    },
  };

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
  function spriteEl(kind) {
    const def = SPRITES[kind];
    const w = def.a[0].length;
    const h = def.a.length;
    const frameB = Array.isArray(def.b) ? def.b : def.a.map((row, i) => (def.b && def.b[i]) || row); // (one frame: the same twice)
    const el = document.createElement('div');
    el.className = `visitor visitor-${kind}`;
    el.style.width = `${w * U}px`;
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w * U}" height="${h * U}" shape-rendering="crispEdges" aria-hidden="true">`
      + `<g class="f-a">${rects(def.a, def.pal)}</g><g class="f-b">${rects(frameB, def.pal)}</g></svg>`
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
  };
  const VISITS = ['frank', 'mummy', 'creature', 'nosferatu', 'ghost', 'bats', 'crows'];

  let list = [];
  let nextVisit = performance.now() + rand(6000, 15000);

  function add(kind, x, dir, extra = {}) {
    const el = spriteEl(kind);
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
  function visit(what = pick(VISITS)) {
    const W = api.laneW();
    const fromLeft = Math.random() < 0.5;
    const dir = fromLeft ? 1 : -1;
    const edge = (w) => (fromLeft ? -w - 4 : W + 4);
    api.botEvent(`visit-${what}`);
    if (what === 'bats') {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) add('bat', edge(16) - dir * k * rand(14, 30), dir, { fly: rand(14, 30), speed: rand(45, 75) });
    } else if (what === 'crows') {
      const n = Math.random() < 0.6 ? 1 : 2;
      for (let k = 0; k < n; k++) add('crow', edge(20) - dir * k * 26, dir, { stopAt: rand(0.2, 0.7) * W + k * 20, life: rand(5000, 9000) });
    } else add(what, edge(SPRITES[what].a[0].length * U), dir);
  }

  function poke(v) {
    if (v.state !== 'go' && v.state !== 'peck') return;
    api.botEvent('visitor-pokes');
    const k = KINDS[v.kind];
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

  // (the lumbering in whole pixels of the sprite's grid: a pixel's shuffle side to side and a
  // pixel's bob, heights snapped to the grid too; no tilting)
  function place(v) {
    const k = KINDS[v.kind];
    const t = v.age / 1000;
    const going = v.state === 'go';
    const shuffle = k.sway && going ? Math.round(Math.sin(t * 5 + v.phase)) * U : 0;
    const bob = k.bob && going ? Math.round(Math.abs(Math.sin(t * 5 + v.phase)) * k.bob) * U : 0;
    const y = Math.round(v.y / U) * U;
    v.el.style.transform = `translate(${(v.x + shuffle).toFixed(1)}px, ${(-y - bob).toFixed(1)}px)`;
    v.el.firstChild.style.transform = `scaleX(${v.dir})`;
  }

  function frame(now, dt) {
    const W = api.laneW();
    if (!list.length && now > nextVisit && typeof Season !== 'undefined' && Season.is('halloween')) {
      visit();
      nextVisit = now + rand(20000, 45000);
    }
    for (const v of list) {
      const k = KINDS[v.kind];
      v.age += dt * 1000;
      if (k.frameMs && now - v.frameAt > (v.state === 'peck' ? 160 : k.frameMs)) {
        v.frameAt = now;
        v.frame = 1 - v.frame;
        v.el.classList.toggle('step', !!v.frame);
      }
      if (k.fly) { // (bats: a wavering line through the air)
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
          v.y += 55 * dt;
          v.el.classList.remove('step');
        }
      } else if (v.state === 'go' || v.state === 'leaving') {
        if (v.state === 'go') v.x += v.dir * v.speed * dt;
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
      const w = v.el.offsetWidth || 30;
      if (v.x < -w - 40 || v.x > W + 40 || v.y > 140) v.gone = true;
    }
    list = list.filter((v) => {
      if (v.gone) v.el.remove();
      return !v.gone;
    });
  }
  function clear() {
    list.forEach((v) => v.el.remove());
    list = [];
  }
  return { frame, clear, visit, list: () => list };
}
