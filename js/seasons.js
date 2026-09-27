// SEASONS: what time of year it is for the game's seasonal touches (wanderers.js's costumes, and
// the visitors to come). By the player's own date: HALLOWEEN runs October 15 to 31. The dev page's
// SEASON switch (bytefall-dev-season: auto / off / halloween), or ?season=halloween, forces one.
const Season = (() => {
  const SEASONS = {
    halloween: (d) => d.getMonth() === 9 && d.getDate() >= 15,
  };
  function forced() {
    let v = new URLSearchParams(location.search).get('season');
    if (v === null) {
      try { v = localStorage.getItem('bytefall-dev-season'); } catch (e) { v = null; }
    }
    return v;
  }
  function current() {
    const f = forced();
    if (f === 'off') return null;
    if (f && SEASONS[f]) return f;
    const now = new Date();
    return Object.keys(SEASONS).find((id) => SEASONS[id](now)) || null;
  }
  return { current, is: (id) => current() === id };
})();
