// WEATHER: the year's weather over the wanderers' lane (the game card's and the start screen's;
// visitors.js runs one per lane). Every few minutes a spell of it may come, from the time of
// year's (and the time of day's) own: the date's seed gives each day a character (a wet day, a
// dry one, a stormy one, a calm one), so a day leans one way.
//   WINTER (Dec-Feb)  SNOW (settling on the floor), a BLIZZARD (sideways, a whiteout), SLEET, a
//                     crisp SUNNY day, and on clear nights the AURORA
//   SPRING (Mar-May)  DRIZZLE, RAIN (puddles, the bots' umbrellas), a THUNDERSTORM, a SUNSHOWER,
//                     WIND (blossom petals blowing), HAIL, SUNNY, a misty morning (the FOG), and a
//                     RAINBOW after the rain now and then
//   SUMMER (Jun-Aug)  SUNNY (a heat haze; the bots puff), THUNDERSTORMS, a SUNSHOWER, a dry WIND
//                     (dust and a tumbleweed), FIREFLIES in the evening, shooting stars at night
//                     (a METEOR SHOWER: the most in August)
//   AUTUMN (Sep-Nov)  WIND (falling leaves), DRIZZLE, RAIN, a THUNDERSTORM, HAIL, the FOG on a
//                     morning, SUNNY
// The rain, snow, hail, leaves and the rest are pixels in the bots' own size, on two canvases: one
// behind the bots, one in front. The game card's lane also gets its clouds (visitors.js's
// overcast) for the rain, the snow and the storms. The bots react: umbrellas up in the rain, a
// flinch at the thunder, an "ow" in the hail, a "phew" in the heat.
// The dev page's WEATHER (or ?weather=) brings it OFTEN, in a season, or one kind to stay.
const WEATHER_KINDS = ['drizzle', 'rain', 'storm', 'sunshower', 'hail', 'sleet', 'snow', 'blizzard', 'wind', 'sunny', 'rainbow', 'aurora', 'fireflies', 'meteors', 'fog'];
const WEATHER_NAMES = { drizzle: 'DRIZZLE', rain: 'RAIN', storm: 'THUNDERSTORM', sunshower: 'SUNSHOWER', hail: 'HAIL', sleet: 'SLEET', snow: 'SNOW', blizzard: 'BLIZZARD', wind: 'WIND', sunny: 'SUNNY', rainbow: 'RAINBOW', aurora: 'AURORA', fireflies: 'FIREFLIES', meteors: 'METEOR SHOWER', fog: 'FOG' };
const WEATHER_SEASONS = ['winter', 'spring', 'summer', 'autumn'];
// (what the dev page or the address asks for: auto, often, a season, or a kind)
function weatherForced() {
  let v = null;
  try { v = new URLSearchParams(location.search).get('weather') || localStorage.getItem('bytefall-dev-weather'); } catch (e) { v = null; }
  return v && v !== 'auto' ? v : null;
}
// The time of year's weather (the dev page's SEASON leans it: HALLOWEEN and NOVEMBER are autumn,
// the winter holidays winter)
function weatherSeason() {
  const f = weatherForced();
  if (WEATHER_SEASONS.includes(f)) return f;
  let s = null;
  try { s = new URLSearchParams(location.search).get('season') || localStorage.getItem('bytefall-dev-season'); } catch (e) { s = null; }
  if (s === 'halloween' || s === 'november') return 'autumn';
  if (['winter', 'hanukkah', 'christmas', 'kwanzaa', 'nye', 'newyear'].includes(s)) return 'winter';
  const m = new Date().getMonth();
  return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
}

function createWeather(api) {
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const P = 34 / 16; // (a pixel of the bots' 16-wide grid)
  // (the game card's lane: its open sky is the lower part, under the board; the start screen's is the whole card)
  const game = () => api.lane.classList.contains('game-walkers');
  const lowFx = () => document.documentElement.classList.contains('low-fx');
  const light = () => ['paper', 'daylight'].includes(document.documentElement.dataset.theme);
  const calm = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hour = () => new Date().getHours();
  const isDay = () => hour() >= 7 && hour() < 19;
  const isNight = () => hour() >= 20 || hour() < 6;
  const isEvening = () => hour() >= 19 || hour() < 1;
  const isMorning = () => hour() >= 5 && hour() < 11;

  // What each kind brings (rain, snow, hail: how heavy; wind: how hard; clouds: their tone)
  const KIND = {
    drizzle: { rain: 0.35, len: 2, speed: [230, 290], clouds: 'grey', umbrellas: 0.45, puddles: 0.4 },
    rain: { rain: 1, len: 3, speed: [380, 460], clouds: 'grey', umbrellas: 0.8, puddles: 1, rainbow: 0.45 },
    storm: { rain: 1.8, len: 5, speed: [520, 640], wind: 0.35, clouds: 'storm', lightning: true, umbrellas: 0.9, puddles: 1.3, rainbow: 0.35 },
    sunshower: { rain: 0.55, len: 3, speed: [360, 430], sun: true, umbrellas: 0.5, puddles: 0.4, rainbow: 0.9 },
    hail: { hail: 1, rain: 0.35, len: 3, speed: [420, 500], clouds: 'storm', umbrellas: 0.8 },
    sleet: { rain: 0.45, len: 2, speed: [300, 360], snow: 0.6, clouds: 'snow', umbrellas: 0.5, puddles: 0.3 },
    snow: { snow: 1.7, clouds: 'snow', settle: true },
    blizzard: { snow: 5, wind: 1.3, clouds: 'snow', settle: true, white: true },
    wind: { wind: 0.9, blown: true },
    sunny: { sun: true },
    rainbow: { rainbowNow: true, sun: true },
    aurora: { aurora: true, night: true },
    fireflies: { fireflies: true, night: true },
    meteors: { meteors: true, night: true },
  };
  // The year's: [kind, weight, when it can come]
  const TABLE = {
    winter: [['snow', 4], ['blizzard', 1], ['sleet', 1.2], ['sunny', 1, 'day'], ['aurora', 2, 'night'], ['drizzle', 0.5]],
    spring: [['drizzle', 2], ['rain', 3], ['storm', 1], ['sunshower', 1.2, 'day'], ['wind', 2], ['sunny', 2, 'day'], ['hail', 0.5], ['fog', 0.6, 'morning']],
    summer: [['sunny', 4, 'day'], ['storm', 2], ['sunshower', 1, 'day'], ['wind', 1], ['rain', 1], ['fireflies', 2.5, 'evening'], ['meteors', 1.5, 'night']],
    autumn: [['wind', 3], ['drizzle', 2], ['rain', 2], ['storm', 0.6], ['hail', 0.4], ['fog', 1, 'morning'], ['sunny', 1, 'day']],
  };
  const WHEN = { day: isDay, night: isNight, evening: isEvening, morning: isMorning };
  const WET = ['drizzle', 'rain', 'storm', 'sunshower', 'sleet', 'snow'];
  const DRY = ['sunny', 'wind', 'fireflies', 'meteors', 'aurora'];
  // The day's character, from the date: the same for everyone that day
  function dayCharacter() {
    const d = new Date();
    let h = 2166136261;
    for (const c of `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-wx`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return ['normal', 'normal', 'wet', 'dry', 'stormy', 'calm'][h % 6];
  }
  function choose() {
    const f = weatherForced();
    if (WEATHER_KINDS.includes(f)) return f;
    const season = weatherSeason();
    const character = dayCharacter();
    const forced = !!f; // (the dev page's OFTEN or a season: any time of day)
    const opts = TABLE[season].filter(([k, , when]) => forced || !when || WHEN[when]())
      .filter(([k]) => !(light() && KIND[k] && KIND[k].night)) // (the light themes keep their card: no night sky)
      .filter(([k]) => !(api.foggy() && !['drizzle', 'rain', 'storm', 'wind', 'sleet', 'snow'].includes(k))) // (in the fog: only what falls or blows)
      .map(([k, w]) => [k, w * (character === 'wet' && WET.includes(k) ? 2 : character === 'dry' && DRY.includes(k) ? 2 : character === 'stormy' && ['storm', 'hail', 'blizzard'].includes(k) ? 2.5 : 1)
        * (season === 'summer' && k === 'meteors' && new Date().getMonth() === 7 ? 3 : 1)]);
    let r = Math.random() * opts.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of opts) if ((r -= w) <= 0) return k;
    return opts.length ? opts[0][0] : null;
  }

  let wx = null; // (the weather now: its kind, its level 0-1 as it comes and goes)
  let layers = null; // (the canvases and overlays, while anything's out)
  let drops = []; // rain
  let flakes = []; // snow
  let pellets = []; // hail
  let bits = []; // leaves, petals, dust
  let splashes = [];
  let puddles = [];
  let ground = []; // (the settled snow, a column per pixel)
  let flies = [];
  let meteors = [];
  let stars = [];
  let bolt = null;
  let rainbow = null; // { at, until, canvas }
  let tumble = null;
  let haze = [];
  const forcedNow = () => weatherForced();
  const often = () => !!forcedNow();
  let nextCheck = performance.now() + (often() ? rand(2000, 4000) : rand(40000, 90000));
  let drawn = 0;

  function el(tag, cls) {
    const e = document.createElement(tag);
    e.className = cls;
    e.setAttribute('aria-hidden', 'true');
    api.lane.appendChild(e);
    return e;
  }
  function ensureLayers() {
    if (layers) return layers;
    layers = { back: el('canvas', 'wx-layer wx-back'), front: el('canvas', 'wx-layer wx-front'), glow: el('div', 'wx-glow'), night: el('div', 'wx-night'), white: el('div', 'wx-white'), flash: el('div', 'wx-flash') };
    return layers;
  }
  function dropLayers() {
    if (!layers) return;
    Object.values(layers).forEach((e) => e.remove());
    layers = null;
  }
  const size = () => {
    const c = layers.back;
    return { W: c.clientWidth, H: c.clientHeight };
  };
  const areaK = () => { const { W, H } = size(); return Math.max(0.4, Math.min(3, (W * H) / (360 * 240))); };

  function start(kind, ms) {
    if (wx) end(true);
    if (!kind) return;
    if (kind === 'fog') { api.fog(); api.botEvent('weather-fog'); return; }
    const k = KIND[kind];
    if (!k) return;
    ensureLayers();
    const now = performance.now();
    wx = { kind, k, at: now, level: 0, phase: 'in', until: now + (ms || (k.night ? rand(200000, 380000) : rand(150000, 330000))), dir: Math.random() < 0.5 ? 1 : -1, nextBolt: now + rand(3000, 7000), nextSay: now + rand(4000, 9000), nextTumble: now + rand(4000, 12000), nextMeteor: now + rand(800, 2500) };
    if (k.clouds) api.clouds(k.clouds);
    if (k.rainbowNow) rainbowIn(now, wx.until - now);
    if (k.night || k.aurora || k.meteors) makeStars();
    if (k.fireflies) { const n = Math.round(14 * areaK()); flies = Array.from({ length: n }, () => newFly()); }
    if (k.sun) wx.sunSide = Math.random() < 0.5 ? 0.12 : 0.88;
    if (!k.clouds) api.releaseClouds(true); // (a clear sky: what's left of the last spell's clouds lifts)
    if (k.umbrellas) setTimeout(() => umbrellasUp(k.umbrellas), rand(1200, 3000));
    api.botEvent(`weather-${kind}`);
  }
  // (on its way out: a few seconds to clear; now, at once)
  function end(now = false) {
    if (!wx) return;
    if (!now) { wx.phase = 'out'; wx.at = performance.now(); return; }
    if (wx.k.clouds) api.releaseClouds();
    umbrellasDown();
    if (wx.k.rainbow && Math.random() < wx.k.rainbow && isDay() && !light()) rainbowIn(performance.now(), rand(40000, 60000));
    wx = null;
  }
  function clear() {
    if (wx && wx.k.clouds) api.releaseClouds();
    wx = null;
    umbrellasDown(true);
    drops = []; flakes = []; pellets = []; bits = []; splashes = []; puddles = []; ground = []; flies = []; meteors = []; stars = []; bolt = null; rainbow = null; tumble = null; haze = [];
    dropLayers();
  }

  // UMBRELLAS: the bots in the rain put one up (most of them), and down again after
  const TOP = { bot: 3, grifter: 3, bunker: 2, glitch: 3 };
  const UMBRELLA_COLORS = [['#e0455f', '#f7f2e8'], ['#ffd23f', '#e08a1e'], ['#3a7bd5', '#9fd0ff'], ['#2f9e5a', '#c8f0c8'], ['#b36bff', '#f0dcff'], ['#26303a', '#4a5866']];
  function umbrellaSvg(bot, [a, b]) {
    const t = (TOP[bot] || 3) - 1;
    const r = (x, y, w, c) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c}"/>`;
    // (a dome of stripes, its scalloped edge, the tip and a short handle down to the head)
    let s = r(7, t - 9, 2, '#2b2f36');
    s += r(5, t - 8, 6, a) + r(7, t - 8, 2, b);
    s += r(3, t - 7, 10, a) + r(6, t - 7, 1, b) + r(9, t - 7, 1, b);
    s += r(1, t - 6, 14, a) + r(4, t - 6, 2, b) + r(10, t - 6, 2, b);
    s += r(0, t - 5, 16, a) + r(3, t - 5, 2, b) + r(11, t - 5, 2, b) + r(7, t - 5, 2, b);
    s += r(0, t - 4, 1, a) + r(5, t - 4, 1, a) + r(10, t - 4, 1, a) + r(15, t - 4, 1, a);
    s += `<rect x="7.5" y="${t - 4}" width="1" height="4" fill="#2b2f36"/>`;
    return `<g class="umbrella">${s}</g>`;
  }
  function umbrellaOn(w) {
    if (w.umbrella || !w.el) return;
    const svg = w.el.querySelector('svg');
    if (!svg) return;
    w.umbrella = true;
    svg.insertAdjacentHTML('beforeend', umbrellaSvg(w.bot, pick(UMBRELLA_COLORS)));
  }
  function umbrellaOff(w) {
    if (!w.umbrella) return;
    w.umbrella = false;
    const u = w.el && w.el.querySelector('.umbrella');
    if (u) u.remove();
  }
  function umbrellasUp(odds) {
    if (!wx || !wx.k.umbrellas) return;
    for (const w of api.walkers()) if (!w.umbrellaRolled) { w.umbrellaRolled = true; if (Math.random() < odds) setTimeout(() => wx && umbrellaOn(w), rand(0, 2500)); }
  }
  function umbrellasDown(now = false) {
    for (const w of api.walkers()) {
      w.umbrellaRolled = false;
      if (now) umbrellaOff(w);
      else setTimeout(() => { if (!wx || !wx.k.umbrellas) umbrellaOff(w); }, rand(1500, 6000));
    }
  }

  // RAIN, SNOW, HAIL: spawned at the top, falling to the floor (the back layer's land a little
  // further off: higher up the floor)
  function rainColor(a) { return light() ? `rgba(70, 95, 130, ${a})` : `rgba(150, 178, 214, ${a})`; }
  const snowColor = () => (light() ? '#b8c4d6' : '#eef2f8');
  function spawnFalling(dt, W, H) {
    const k = wx.k;
    const L = wx.level;
    const area = areaK() * (lowFx() ? 0.5 : 1);
    const wind = (k.wind || 0) * wx.dir;
    if (k.rain) {
      const n = poisson(k.rain * 120 * L * area * dt);
      for (let i = 0; i < n; i++) {
        const vy = rand(k.speed[0], k.speed[1]);
        drops.push({ x: rand(-60, W + 60), y: rand(-30, 0), vx: wind * vy * 0.45 + (k.wind ? rand(-15, 15) : 0), vy, len: k.len, front: Math.random() < 0.3, floor: H - (Math.random() < 0.3 ? 0 : rand(P, P * 7)) });
      }
    }
    if (k.snow) {
      const n = poisson(k.snow * 22 * L * area * dt);
      for (let i = 0; i < n; i++) flakes.push({
        // (blown hard: half come in from the side the wind's from, at any height)
        ...(k.wind && Math.random() < 0.5 ? { x: wx.dir > 0 ? rand(-40, -4) : rand(W + 4, W + 40), y: rand(0, H * 0.9) } : { x: rand(-80, W + 80), y: rand(-20, 0) }), vx: wind * rand(120, 200), vy: rand(22, 42) * (k.wind ? 1.8 : 1), sway: rand(0, 6.28), front: Math.random() < 0.35, floor: H - (Math.random() < 0.4 ? 0 : rand(P, P * 6)), big: Math.random() < 0.15 });
    }
    if (k.hail) {
      const n = poisson(k.hail * 40 * L * area * dt);
      for (let i = 0; i < n; i++) pellets.push({ x: rand(-20, W + 20), y: rand(-20, 0), vx: rand(-20, 20), vy: rand(420, 560), bounces: 0, rest: 0, front: Math.random() < 0.35, floor: H - (Math.random() < 0.4 ? 0 : rand(P, P * 5)), big: Math.random() < 0.2 });
    }
  }
  function poisson(m) { // (how many this frame, for a rate: whole ones and the chance of one more)
    let n = Math.floor(m);
    if (Math.random() < m - n) n++;
    return n;
  }
  function moveFalling(dt, W, H, now) {
    for (const d of drops) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y >= d.floor) {
        d.gone = true;
        const p = puddles.find((q) => d.front && Math.abs(q.x - d.x) < q.w / 2);
        if (p) splashes.push({ ring: true, x: d.x, y: H - P * 0.5, age: 0, life: 0.45, front: true });
        else if (Math.random() < 0.5) for (let i = 0; i < 2; i++) splashes.push({ x: d.x, y: d.floor, vx: rand(-50, 50), vy: -rand(40, 90), age: 0, life: 0.25, front: d.front });
      }
    }
    drops = drops.filter((d) => !d.gone);
    for (const f of flakes) {
      f.sway += dt * 2;
      f.x += (f.vx + Math.sin(f.sway) * 10) * dt;
      f.y += f.vy * dt;
      if (f.y >= f.floor) {
        f.gone = true;
        if (wx && wx.k.settle && f.front !== undefined) settle(f.x, W);
      }
    }
    flakes = flakes.filter((f) => !f.gone && f.x > -120 && f.x < W + 120);
    for (const p of pellets) {
      if (p.rest) { p.rest -= dt; if (p.rest <= 0) p.gone = true; continue; }
      p.vy += 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y >= p.floor) {
        p.y = p.floor;
        if (p.bounces < 2) { p.vy = -p.vy * 0.33; p.vx += rand(-50, 50); p.bounces++; } else p.rest = rand(2, 5);
      }
    }
    pellets = pellets.filter((p) => !p.gone);
    for (const s of splashes) {
      s.age += dt;
      if (!s.ring) { s.vy += 600 * dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    }
    splashes = splashes.filter((s) => s.age < s.life);
    if (drops.length > 900) drops.splice(0, drops.length - 900);
    void now;
  }
  // (the snow settling: a column a pixel wide grows where a flake lands, spilling to its neighbors)
  function settle(x, W) {
    const n = Math.ceil(W / P);
    if (ground.length !== n) ground = Array.from({ length: n }, (_, i) => ground[i] || 0);
    const i = Math.max(0, Math.min(n - 1, Math.floor(x / P)));
    const cap = api.tall() ? 5 : 3;
    ground[i] = Math.min(cap, ground[i] + 0.22);
    for (const j of [i - 1, i + 1]) if (j >= 0 && j < n && ground[i] - ground[j] > 1) { ground[i] -= 0.1; ground[j] += 0.1; }
  }

  // PUDDLES: in the rain, a few along the floor, spreading; drops ring them; after, they dry up
  function puddleTick(dt, W) {
    const k = wx && wx.k;
    const raining = k && k.puddles && wx.phase !== 'out';
    if (raining && puddles.length < Math.round(3 * (k.puddles || 0) * Math.max(1, W / 360)) && Math.random() < dt * 0.3) {
      const x = rand(W * 0.05, W * 0.95);
      if (!puddles.some((p) => Math.abs(p.x - x) < 40)) puddles.push({ x, w: 0, max: rand(8, 20) * P });
    }
    for (const p of puddles) p.w = raining ? Math.min(p.max, p.w + dt * 3 * (k.puddles || 1)) : p.w - dt * 2.2;
    puddles = puddles.filter((p) => p.w > 0);
  }

  // WIND: leaves (autumn), blossom petals (spring), dust and now and then a tumbleweed (summer),
  // the snow in winter's
  const BLOWN = {
    autumn: ['#d2691e', '#e8a33c', '#b8401f', '#8c5a2b', '#c9a227', '#a0522d'],
    spring: ['#f7b8d0', '#ffe4ef', '#f39ac0', '#ffffff'],
    summer: ['#c8b48a', '#b39d70', '#d9c9a0'],
    winter: ['#eef2f8'],
  };
  function blowTick(dt, W, H, now) {
    const season = weatherSeason();
    const blowing = wx && wx.k.blown && wx.phase !== 'out';
    if (blowing) {
      const rate = (season === 'summer' ? 26 : 9) * wx.level * areaK() * (lowFx() ? 0.5 : 1);
      for (let i = poisson(rate * dt); i > 0; i--) {
        const dust = season === 'summer';
        bits.push({
          x: wx.dir > 0 ? rand(-30, -4) : rand(W + 4, W + 30), y: dust ? rand(H * 0.45, H - 2) : rand(0, H * 0.75),
          vx: wx.dir * (dust ? rand(160, 260) : rand(60, 150)), vy: dust ? rand(-6, 6) : rand(10, 34), c: pick(BLOWN[season]),
          spin: rand(0, 6.28), dust, front: Math.random() < 0.4, life: 0,
        });
      }
      if (season === 'summer' && !tumble && now > wx.nextTumble) {
        wx.nextTumble = now + rand(12000, 26000);
        tumble = { x: wx.dir > 0 ? -16 : W + 16, y: H - 6 * P, vy: 0, rot: 0 };
      }
    }
    for (const b of bits) {
      b.life += dt;
      b.spin += dt * 6;
      if (b.landed) { b.vx *= 0.97; b.x += b.vx * dt; b.landed -= dt; if (b.landed <= 0) b.gone = true; continue; }
      b.x += b.vx * dt;
      b.y += (b.vy + (b.dust ? 0 : Math.sin(b.spin) * 18)) * dt;
      if (b.y >= H - P && !b.dust) { b.y = H - P; b.landed = rand(3, 7); b.vx *= 0.5; }
      if (b.x < -60 || b.x > W + 60) b.gone = true;
    }
    bits = bits.filter((b) => !b.gone);
    if (tumble) { // (rolling and bouncing across)
      tumble.vy += 500 * dt;
      tumble.y += tumble.vy * dt;
      if (tumble.y >= H - 6 * P) { tumble.y = H - 6 * P; tumble.vy = -rand(60, 160); }
      tumble.x += wx ? wx.dir * 110 * dt : 110 * dt;
      tumble.rot += dt * 8;
      if (tumble.x < -40 || tumble.x > W + 40) tumble = null;
    }
  }

  // LIGHTNING: a bolt down from the sky, its flash, and the bots flinching at the thunder
  function strike(W, H, now) {
    const pts = [];
    let x = rand(W * 0.08, W * 0.92);
    let y = 0;
    const to = Math.random() < 0.55 ? H - P : rand(H * 0.35, H * 0.7);
    while (y < to) { pts.push([x, y]); y += rand(2, 4) * P; x += rand(-2.5, 2.5) * P; }
    pts.push([x, to]);
    const fork = pts.length > 6 && Math.random() < 0.6 ? (() => { const i = Math.floor(rand(2, pts.length / 2)); let [fx, fy] = pts[i]; const d = Math.random() < 0.5 ? -1 : 1; const f = []; for (let j = 0; j < 5; j++) { f.push([fx, fy]); fy += rand(2, 3.5) * P; fx += d * rand(1, 3) * P; } return f; })() : null;
    bolt = { pts, fork, at: now, x };
    if (!calm()) {
      const flick = (ms, off) => setTimeout(() => { if (!layers) return; api.lane.classList.add('lightning'); layers.flash.classList.add('on'); setTimeout(() => { api.lane.classList.remove('lightning'); if (layers) layers.flash.classList.remove('on'); }, off); }, ms);
      flick(0, 80);
      flick(150, 60);
    }
    setTimeout(() => { // (the thunder: a bot or two flinch)
      for (const w of api.walkers()) if (Math.random() < 0.35) api.say(w, Math.random() < 0.5 ? 'scared' : 'surprised', pick(['!', '!!', 'eek']));
    }, rand(400, 1400));
  }

  // RAINBOW: drawn once (bands of pixels) and faded in and out
  function rainbowIn(now, ms) {
    ensureLayers();
    rainbow = { at: now, until: now + ms, canvas: null };
  }
  function rainbowCanvas(W, H) {
    const cell = P * 1.5;
    const cw = Math.ceil(W / cell);
    const ch = Math.ceil(H / cell);
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    const img = g.createImageData(cw, ch);
    const cx = cw * rand(0.35, 0.65);
    const cy = ch * 1.15;
    const R = Math.min(cw * 0.45, ch * (game() ? 0.75 : 0.8));
    const BANDS = [[228, 64, 64], [240, 150, 50], [244, 220, 70], [90, 200, 90], [70, 140, 230], [110, 80, 200], [160, 90, 210]];
    const band = Math.max(1, R * 0.035);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const d = Math.hypot(x - cx, y - cy);
        const i = Math.floor((R - d) / band);
        if (i < 0 || i >= BANDS.length) continue;
        const k = (y * cw + x) * 4;
        const fade = Math.min(1, (ch - y) / (ch * 0.25)); // (its feet fading into the air)
        img.data[k] = BANDS[i][0]; img.data[k + 1] = BANDS[i][1]; img.data[k + 2] = BANDS[i][2];
        img.data[k + 3] = Math.round(110 * fade);
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // NIGHT: stars, the AURORA's curtains, FIREFLIES, METEORS
  function makeStars() {
    if (stars.length) return;
    const n = Math.round(34 * areaK());
    stars = Array.from({ length: n }, () => ({ x: Math.random(), y: game() ? rand(0.5, 0.8) : rand(0.03, 0.45), tw: rand(0, 6.28), sp: rand(1, 3) }));
  }
  function newFly() { return { x: Math.random(), y: rand(0.4, 0.95), vx: rand(-0.02, 0.02), vy: rand(-0.02, 0.02), on: 0, next: rand(0.2, 3) }; }

  function frame(now, dt) {
    // (a spell now and then; the dev page's: sooner, or one kind kept on)
    const f = forcedNow();
    if (!wx && now > nextCheck) {
      nextCheck = now + (often() ? rand(3000, 6000) : rand(90000, 220000));
      const go = often() || Math.random() < (dayCharacter() === 'calm' ? 0.3 : 0.55);
      if (go) start(choose(), WEATHER_KINDS.includes(f) ? 1e9 : (often() ? rand(40000, 70000) : 0));
    }
    if (wx) {
      const age = now - wx.at;
      if (wx.phase === 'in') { wx.level = Math.min(1, age / 8000); if (wx.level >= 1) wx.phase = 'on'; }
      else if (wx.phase === 'on') { if (now > wx.until) { wx.phase = 'out'; wx.at = now; } }
      else if (wx.phase === 'out') { wx.level = Math.max(0, 1 - age / 10000); if (wx.level <= 0) end(true); }
    }
    if (!layers) return;
    const { W, H } = size();
    if (!W || !H) return;
    if (wx) spawnFalling(dt, W, H);
    moveFalling(dt, W, H, now);
    puddleTick(dt, W);
    blowTick(dt, W, H, now);
    if (wx && wx.k.lightning && wx.phase === 'on' && now > wx.nextBolt) { wx.nextBolt = now + rand(4000, 12000); strike(W, H, now); }
    if (bolt && now - bolt.at > 260) bolt = null;
    if (wx && now > wx.nextSay) { // (the bots: an "ow" in the hail, a "phew" in the heat)
      wx.nextSay = now + rand(5000, 12000);
      const w = pick(api.walkers());
      if (w && wx.kind === 'hail') api.say(w, 'annoyed', pick(['ow!', 'ow', 'hey!']));
      else if (w && wx.kind === 'sunny' && weatherSeason() === 'summer') api.say(w, 'tired', pick(['phew', 'hot', '...']));
      else if (w && wx.kind === 'blizzard') api.say(w, 'surprised', pick(['brrr', '!?']));
    }
    if (wx && wx.k.umbrellas && wx.phase !== 'out') for (const w of api.walkers()) if (!w.umbrellaRolled) { w.umbrellaRolled = true; if (Math.random() < wx.k.umbrellas) umbrellaOn(w); }
    if (wx && wx.k.fireflies) for (const fl of flies) {
      fl.vx = Math.max(-0.03, Math.min(0.03, fl.vx + rand(-0.02, 0.02) * dt));
      fl.vy = Math.max(-0.03, Math.min(0.03, fl.vy + rand(-0.02, 0.02) * dt));
      fl.x = Math.max(0, Math.min(1, fl.x + fl.vx * dt));
      fl.y = Math.max(0.35, Math.min(0.97, fl.y + fl.vy * dt));
      fl.next -= dt;
      if (fl.next <= 0) { fl.on = 0.45; fl.next = rand(1.2, 4); }
      fl.on = Math.max(0, fl.on - dt);
    }
    if (wx && wx.k.meteors && wx.phase === 'on' && now > wx.nextMeteor) {
      wx.nextMeteor = now + rand(1500, 5000);
      const d = Math.random() < 0.5 ? -1 : 1;
      meteors.push({ x: rand(W * 0.15, W * 0.85), y: game() ? rand(H * 0.5, H * 0.65) : rand(0, H * 0.25), vx: d * rand(260, 380), vy: rand(130, 200), age: 0, life: rand(0.5, 0.9) });
    }
    for (const m of meteors) { m.age += dt; m.x += m.vx * dt; m.y += m.vy * dt; }
    meteors = meteors.filter((m) => m.age < m.life);
    if (wx && wx.kind === 'sunny' && weatherSeason() === 'summer' && Math.random() < dt * 3) haze.push({ x: rand(0, W), y: H - rand(0, P * 3), age: 0, w: rand(3, 7) });
    for (const h of haze) h.age += dt;
    haze = haze.filter((h) => h.age < 2.2);
    if (!wx || !wx.k.settle) for (let i = 0; i < ground.length; i++) ground[i] = Math.max(0, ground[i] - dt * 0.04);
    if (rainbow && now > rainbow.until + 6000) rainbow = null;

    // (overlays: the sun's warmth, the night sky, the whiteout)
    const L = wx ? wx.level : 0;
    layers.glow.style.opacity = (wx && wx.k.sun ? 0.85 * L : 0).toFixed(2);
    if (wx && wx.k.sun) layers.glow.style.setProperty('--sx', `${(wx.sunSide * 100).toFixed(0)}%`);
    layers.night.style.opacity = (wx && wx.k.night ? 0.8 * L : 0).toFixed(2);
    layers.white.style.opacity = (wx && wx.k.white ? 0.3 * L : 0).toFixed(2);

    const lowfx = lowFx();
    if (now - drawn < (lowfx ? 50 : 0)) return;
    drawn = now;
    draw(W, H, now);
    // (nothing left out: put the layers away)
    if (!wx && !drops.length && !flakes.length && !pellets.length && !bits.length && !splashes.length && !puddles.length && !ground.some((g) => g > 0.05) && !rainbow && !tumble && !meteors.length) dropLayers();
  }

  function prep(cv, W, H) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(W * dpr);
    const h = Math.round(H * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.imageSmoothingEnabled = false;
    return g;
  }
  const px = (g, x, y, w = 1, h = 1) => g.fillRect(Math.round(x / P) * P, Math.round(y / P) * P, w * P, h * P);

  function draw(W, H, now) {
    const back = prep(layers.back, W, H);
    const front = prep(layers.front, W, H);
    const L = wx ? wx.level : 0;
    const t = now / 1000;
    // the night sky: stars
    if (wx && wx.k.night && stars.length) {
      for (const s of stars) {
        const a = (0.35 + 0.35 * Math.sin(t * s.sp + s.tw)) * L;
        back.fillStyle = `rgba(240, 240, 255, ${a.toFixed(2)})`;
        px(back, s.x * W, s.y * H);
      }
    }
    // the aurora: curtains rippling across the sky, green below, violet above
    if (wx && wx.k.aurora) {
      const cell = P * 2;
      for (let x = 0; x < W; x += cell) {
        for (const [i, off] of [[0, 0], [1, 2.1]]) {
          const base = H * ((game() ? 0.66 : 0.34) + 0.06 * Math.sin(x * 0.011 + t * 0.25 + off) + 0.04 * Math.sin(x * 0.029 - t * 0.4 + off * 2));
          const len = H * (game() ? 0.5 : 1) * (0.16 + 0.1 * Math.sin(x * 0.02 + t * 0.6 + off));
          const glow = (0.3 + 0.3 * Math.sin(x * 0.045 + t * 0.9 + off * 3)) * L * (i ? 0.7 : 1);
          if (glow <= 0.02) continue;
          for (let k = 0; k < len; k += P) {
            const f = k / len;
            const a = glow * (1 - f) * (f < 0.12 ? f / 0.12 : 1);
            const c = f < 0.5 ? [90, 255, 160] : f < 0.8 ? [80, 220, 220] : [150, 110, 255];
            back.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${(Math.ceil(a * 5) / 5 * 0.6).toFixed(2)})`;
            back.fillRect(Math.round(x), Math.round((base - k) / P) * P, cell, P);
          }
        }
      }
    }
    // the sun: a disc of pixels and its rays, turning
    if (wx && wx.k.sun && !light()) {
      const r = game() ? 5 : 9;
      const cx = Math.round((wx.sunSide * W) / P) * P;
      const cy = Math.round((H * (game() ? 0.64 : 0.16)) / P) * P; // (the game's: low, in the open sky under the board)
      back.globalAlpha = L;
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const d = x * x + y * y;
        if (d > r * r + 1) continue;
        back.fillStyle = d < (r - 2) * (r - 2) ? '#fff3a0' : '#ffd23f';
        back.fillRect(cx + x * P, cy + y * P, P, P);
      }
      back.fillStyle = '#ffd23f';
      const turn = Math.floor(t * 2) % 2;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + (turn ? Math.PI / 8 : 0);
        for (let k = r + 2; k < r + 2 + (i % 2 ? 2 : 3); k++) back.fillRect(cx + Math.round(Math.cos(ang) * k) * P, cy + Math.round(Math.sin(ang) * k) * P, P, P);
      }
      back.globalAlpha = 1;
    }
    // the rainbow
    if (rainbow) {
      if (!rainbow.canvas) rainbow.canvas = rainbowCanvas(W, H);
      const a = Math.min(1, (now - rainbow.at) / 8000) * Math.min(1, Math.max(0, (rainbow.until + 6000 - now) / 6000));
      back.globalAlpha = a * (light() ? 0.45 : 0.6);
      back.drawImage(rainbow.canvas, 0, 0, W, H);
      back.globalAlpha = 1;
    }
    // meteors: a bright head and a fading tail
    for (const m of meteors) {
      const a = 1 - m.age / m.life;
      for (let i = 0; i < 10; i++) {
        back.fillStyle = `rgba(255, 250, 220, ${(a * (1 - i / 10)).toFixed(2)})`;
        px(back, m.x - (m.vx / 60) * i * 0.6, m.y - (m.vy / 60) * i * 0.6);
      }
    }
    // the bolt
    if (bolt) {
      const g = bolt.at && now - bolt.at < 90 ? 1 : 0.55;
      for (const line of [bolt.pts, bolt.fork].filter(Boolean)) {
        back.fillStyle = `rgba(255, 252, 220, ${g})`;
        for (let i = 0; i < line.length - 1; i++) {
          const [x1, y1] = line[i];
          const [x2, y2] = line[i + 1];
          const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / P));
          for (let j = 0; j <= n; j++) px(back, x1 + ((x2 - x1) * j) / n, y1 + ((y2 - y1) * j) / n);
        }
      }
    }
    // heat haze over the floor
    for (const h of haze) {
      back.fillStyle = `rgba(255, 240, 210, ${(0.12 * (1 - h.age / 2.2)).toFixed(2)})`;
      px(back, h.x + Math.sin(h.age * 5) * P, h.y - h.age * 14, h.w);
    }
    // rain: streaks along their fall
    for (const d of drops) {
      const g = d.front ? front : back;
      g.fillStyle = rainColor(d.front ? 0.55 : 0.4);
      const sx = d.vx / d.vy;
      for (let i = 0; i < d.len; i++) g.fillRect(Math.round(d.x - sx * i * P), Math.round(d.y - i * P), Math.max(1, P * 0.5), P);
    }
    for (const s of splashes) {
      const g = s.front ? front : back;
      const a = 1 - s.age / s.life;
      g.fillStyle = rainColor(0.6 * a);
      if (s.ring) { const r = 1 + s.age * 8; g.fillRect(Math.round(s.x - r * P), Math.round(s.y), P, Math.max(1, P * 0.5)); g.fillRect(Math.round(s.x + r * P), Math.round(s.y), P, Math.max(1, P * 0.5)); }
      else g.fillRect(Math.round(s.x), Math.round(s.y), Math.max(1, P * 0.5), Math.max(1, P * 0.5));
    }
    // snow
    for (const f of flakes) {
      const g = f.front ? front : back;
      g.fillStyle = snowColor();
      g.globalAlpha = f.front ? 0.9 : 0.65;
      px(g, f.x, f.y, f.big ? 2 : 1, f.big ? 2 : 1);
    }
    front.globalAlpha = 1; back.globalAlpha = 1;
    // hail
    for (const p of pellets) {
      const g = p.front ? front : back;
      g.fillStyle = light() ? '#9fb4cc' : '#e8f4ff';
      g.globalAlpha = p.rest ? Math.min(1, p.rest) : 1;
      px(g, p.x, p.y - P, p.big ? 2 : 1, p.big ? 2 : 1);
    }
    front.globalAlpha = 1; back.globalAlpha = 1;
    // leaves, petals, dust
    for (const b of bits) {
      const g = b.front ? front : back;
      g.fillStyle = b.c;
      g.globalAlpha = b.dust ? 0.45 : b.landed ? Math.min(1, b.landed) : 0.95;
      const flat = Math.sin(b.spin) > 0;
      px(g, b.x, b.y, b.dust || !flat ? 1 : 2, 1);
    }
    front.globalAlpha = 1; back.globalAlpha = 1;
    // a tumbleweed: a ragged ring of twigs, turning as it rolls
    if (tumble) {
      front.fillStyle = '#9a7a4a';
      for (let i = 0; i < 14; i++) {
        const a = tumble.rot + (i / 14) * Math.PI * 2;
        const r = 2.5 + (i % 3 === 0 ? 0.6 : 0);
        px(front, tumble.x + Math.cos(a) * r * P, tumble.y + Math.sin(a) * r * P);
      }
      front.fillStyle = '#7a5c34';
      px(front, tumble.x + Math.cos(tumble.rot * 1.3) * P, tumble.y + Math.sin(tumble.rot * 1.3) * P);
    }
    // fireflies: a glow and a bright heart, blinking
    if (wx && wx.k.fireflies) for (const fl of flies) {
      if (fl.on <= 0) continue;
      const a = Math.min(1, fl.on / 0.15) * L;
      const x = fl.x * W;
      const y = fl.y * H;
      front.fillStyle = `rgba(214, 255, 120, ${(0.25 * a).toFixed(2)})`;
      px(front, x - P, y - P, 3, 3);
      front.fillStyle = `rgba(246, 255, 176, ${a.toFixed(2)})`;
      px(front, x, y);
    }
    // puddles on the floor: a flat dark pool with a glint
    for (const p of puddles) {
      const w = Math.max(P, p.w);
      front.fillStyle = light() ? 'rgba(80, 100, 130, 0.35)' : 'rgba(110, 140, 180, 0.35)';
      front.fillRect(Math.round((p.x - w / 2) / P) * P, H - P, Math.round(w / P) * P, P);
      front.fillStyle = light() ? 'rgba(255, 255, 255, 0.5)' : 'rgba(200, 220, 255, 0.35)';
      front.fillRect(Math.round((p.x - w / 4) / P) * P, H - P, P * 2, Math.max(1, P * 0.5));
    }
    // the settled snow
    if (ground.length) {
      front.fillStyle = snowColor();
      for (let i = 0; i < ground.length; i++) {
        const h = Math.ceil(ground[i] - 0.15);
        if (h > 0) front.fillRect(i * P, H - h * P, P, h * P);
      }
    }
  }

  return { frame, clear, start: (kind) => start(kind), stop: () => end(), current: () => (wx ? wx.kind : null) };
}
