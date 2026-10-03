// SEASONS: what time of year it is for the game's seasonal touches (wanderers.js's costumes and
// snacks, visitors.js's visitors, scenery and weather). By the player's own date, and STACKED:
// several can be on at once, each adding its touches (a bot picks a costume from any of them,
// visitors and scenery come from all of them).
//   HALLOWEEN  the whole of October (from the 1st, to set the mood)
//   NOVEMBER   the whole month
//   WINTER     December 1 to January 6 (the base under the December holidays: snow and all)
//   HANUKKAH   its eight nights (from the evening of its first night; the dates move each year)
//   CHRISTMAS  December 18 to 26
//   KWANZAA    December 26 to January 1 (one more kinara candle lit each day)
//   NYE        December 31 (a countdown at the player's own midnight)
//   NEWYEAR    January 1 and 2
// The dev page's SEASON switch (bytefall-dev-season), or ?season=christmas, forces one (with the
// base it sits on: WINTER under the December holidays).
const Season = (() => {
  // Hanukkah's first night (its evening), by year: [month (0-based), day]
  const HANUKKAH = {
    2025: [11, 14], 2026: [11, 4], 2027: [11, 24], 2028: [11, 12], 2029: [11, 1], 2030: [11, 20],
    2031: [11, 9], 2032: [10, 27], 2033: [11, 16], 2034: [11, 6], 2035: [11, 25],
  };
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Which night of Hanukkah it is (1 to 8), or 0 (last year's can run into January)
  function hanukkahNight(d = new Date()) {
    for (const y of [d.getFullYear(), d.getFullYear() - 1]) {
      const start = HANUKKAH[y];
      if (!start) continue;
      const n = Math.round((day(d) - new Date(y, start[0], start[1])) / 86400000) + 1;
      if (n >= 1 && n <= 8) return n;
    }
    return 0;
  }
  // Which day of Kwanzaa it is (1 to 7: December 26 to January 1), or 0
  function kwanzaaDay(d = new Date()) {
    if (d.getMonth() === 11 && d.getDate() >= 26) return d.getDate() - 25;
    if (d.getMonth() === 0 && d.getDate() === 1) return 7;
    return 0;
  }
  const SEASONS = {
    halloween: (d) => d.getMonth() === 9,
    november: (d) => d.getMonth() === 10,
    winter: (d) => d.getMonth() === 11 || (d.getMonth() === 0 && d.getDate() <= 6),
    hanukkah: (d) => hanukkahNight(d) > 0,
    christmas: (d) => d.getMonth() === 11 && d.getDate() >= 18 && d.getDate() <= 26,
    kwanzaa: (d) => kwanzaaDay(d) > 0,
    nye: (d) => d.getMonth() === 11 && d.getDate() === 31,
    newyear: (d) => d.getMonth() === 0 && d.getDate() <= 2,
  };
  const BASE = { hanukkah: 'winter', christmas: 'winter', kwanzaa: 'winter', nye: 'winter', newyear: 'winter' };
  const ORDER = ['nye', 'newyear', 'christmas', 'hanukkah', 'kwanzaa', 'halloween', 'november', 'winter'];
  function forced() {
    let v = new URLSearchParams(location.search).get('season');
    if (v === null) {
      try { v = localStorage.getItem('bytefall-dev-season'); } catch (e) { v = null; }
    }
    return v;
  }
  function active() {
    const f = forced();
    if (f === 'off') return [];
    if (f && SEASONS[f]) return BASE[f] ? [f, BASE[f]] : [f];
    const now = new Date();
    return ORDER.filter((id) => SEASONS[id](now));
  }
  return {
    active,
    is: (id) => active().includes(id),
    current: () => active()[0] || null, // (the leading one)
    // Candles to light (HANUKKAH; forced from the dev page: all eight)
    hanukkahNight: () => (forced() === 'hanukkah' ? 8 : hanukkahNight()),
    // Kinara candles to light (KWANZAA; forced: all seven)
    kwanzaaDay: () => (forced() === 'kwanzaa' ? 7 : kwanzaaDay()),
    // The year a new-year sign shows (on New Year's Eve, the one about to start)
    newYear: () => { const d = new Date(); return d.getFullYear() + (d.getMonth() === 11 ? 1 : 0); },
  };
})();
