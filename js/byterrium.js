// BYTERRIUM (byterrium.html): the bots' world. The bots wander as they do in ByteFall (wanderers.js,
// their minds, the visitors, the weather), in a place you pick from TRAVEL that stays till you pick
// another (scenes.js in its world mode). The header says where they are, the time, the weather and
// the moon. Where you are is kept in this browser.
(() => {
  const $ = (id) => document.getElementById(id);
  const PLACES = [
    { id: null, name: 'THE GRID', note: 'Home: the bare grid, nothing but the bots.' },
    { id: 'meadow', name: 'MEADOW', note: 'Rolling hills, grass and flowers. Butterflies, bees, a rabbit.' },
    { id: 'lake', name: 'LAKE', note: 'A woodsy lake with a pier: they go fishing. A frog, a duck, dragonflies.' },
    { id: 'beach', name: 'BEACH', note: 'The sea, the sand, a pier for fishing. Gulls and a crab.' },
    { id: 'woodland', name: 'WOODLAND', note: 'Trees in the season\'s colors, a leafy path. A squirrel.' },
    { id: 'farm', name: 'FARM', note: 'A red barn, furrowed fields, pumpkins. A chicken.' },
    { id: 'city', name: 'CITY', note: 'A skyline, a sidewalk, lit windows at night. Pigeons.' },
    { id: 'desert', name: 'DESERT', note: 'Dunes and a mesa, a little cactus. A lizard.' },
    { id: 'snowfield', name: 'SNOWFIELD', note: 'Snowy hills and pines. A rabbit in the snow.' },
  ];
  const KEY = 'byterrium-place';
  const lane = $('world-lane');
  const bots = createWanderers(lane);
  let here;
  try { here = localStorage.getItem(KEY); } catch (e) { here = null; }
  if (here !== null && !PLACES.some((p) => p.id === here)) here = null;
  if (here === null) here = 'meadow'; // (a first visit: somewhere to start)
  if (here === '') here = null;
  const placeOf = (id) => PLACES.find((p) => p.id === id) || PLACES[0];

  function arrive(id) {
    here = id;
    try { localStorage.setItem(KEY, id || ''); } catch (e) {}
    bots.visit(id ? `sc-${id}` : 'sc-clear');
    $('place-name').textContent = `// ${placeOf(id).name}`;
    renderPlaces();
    info();
  }
  // Travel: a fade to black, the new place, the fade back (the bots come along)
  function travel(id) {
    closeMenu();
    if (id === here) return;
    const fade = $('fade');
    fade.classList.add('on');
    setTimeout(() => {
      arrive(id);
      setTimeout(() => fade.classList.remove('on'), 250);
    }, 650);
  }

  // The header's line: the time, the weather, the moon at night
  function info() {
    const d = new Date();
    const hh = d.getHours();
    const time = `${((hh + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
    const wx = bots.weather ? bots.weather() : null;
    const night = hh >= 20 || hh < 6;
    const bits = [time, wx ? WEATHER_NAMES[wx] : night ? 'CLEAR NIGHT' : 'FAIR'];
    if (night && typeof moonPhaseName === 'function') bits.push(moonPhaseName());
    $('world-info').textContent = bits.join(' · ');
  }
  setInterval(info, 5000);

  // The travel menu
  function renderPlaces() {
    const list = $('places');
    list.textContent = '';
    for (const p of PLACES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `byt-place-btn${p.id === here ? ' here' : ''}`;
      b.innerHTML = '<b></b><span></span>';
      b.firstChild.textContent = p.id === here ? `${p.name} · HERE` : p.name;
      b.lastChild.textContent = p.note;
      b.addEventListener('click', () => travel(p.id));
      list.appendChild(b);
    }
  }
  function openMenu() {
    renderPlaces();
    $('travel').hidden = false;
    const btn = $('places').querySelector('.here') || $('places').querySelector('button');
    if (btn) btn.focus();
  }
  function closeMenu() {
    if ($('travel').hidden) return;
    $('travel').hidden = true;
    $('travel-btn').focus({ preventScroll: true });
  }
  $('travel-btn').addEventListener('click', openMenu);
  $('travel-close').addEventListener('click', closeMenu);
  $('travel').addEventListener('click', (e) => { if (e.target === $('travel')) closeMenu(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    else if ((e.key === 't' || e.key === 'T') && $('travel').hidden) openMenu();
  });

  // SIDEWAYS: full screen, the screen locked to landscape where the browser allows (Android's
  // Chrome does, once full screen; installed from the manifest it opens sideways anyway)
  async function sideways() {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) {}
    try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) {}
  }
  $('full-btn').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else sideways(); });
  document.addEventListener('fullscreenchange', () => { $('full-btn').textContent = document.fullscreenElement ? 'EXIT FULL SCREEN' : 'FULL SCREEN'; });
  $('rotate-full').addEventListener('click', () => { sideways(); });
  $('rotate-stay').addEventListener('click', () => { document.documentElement.classList.add('upright-ok'); try { sessionStorage.setItem('byterrium-upright', '1'); } catch (e) {} });
  try { if (sessionStorage.getItem('byterrium-upright')) document.documentElement.classList.add('upright-ok'); } catch (e) {}

  arrive(here);
})();
