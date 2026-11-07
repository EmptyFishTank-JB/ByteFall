// BOT ITEMS: what the player's own bot wears. The player picks one of the four bots (BOT, GRIFTER,
// BUNKER, GLITCH: the CUSTOMIZE card, script.js) and dresses it from the items bought in the STORE's
// BOT tab (store.js): a HAT, EYES and a NECK piece, one of each at a time. Drawn as the seasonal
// costumes are (wanderers.js), in the bots' own 16x17 pixel grid, so one set fits all four bodies
// with only where each one's head starts (TOP) to go by. The hat and the neck piece go over the body
// and under the face; the eyes' piece over the face. What's owned and worn is kept by Progress
// (botItems, botLook). The wandering bots (wanderers.js) show your bot, always first to walk in,
// in what it's wearing.
const BotItems = (() => {
  const TOP = { bot: 3, grifter: 3, bunker: 2, glitch: 3 }; // (where each body's head starts)
  const px = (cells, fill, extra = '') => cells.map(([x, y, w = 1, h = 1]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`).join('');
  const SLOTS = [['hat', 'HAT'], ['eyes', 'EYES'], ['neck', 'NECK']];
  // price: in KEYS (a typical game earns about 57); t: the top of the head, in the art's own rows
  const ITEMS = {
    cap: {
      slot: 'hat', name: 'CAP', price: 40, desc: 'A blue cap, brim out to the side.',
      art: (t) => px([[4, t - 3, 8, 1], [3, t - 2, 10, 1], [3, t - 1, 10, 1]], '#2f6fd1') + px([[11, t - 1, 5, 1]], '#1b4a9c') + px([[7, t - 4, 2, 1]], '#1b4a9c'),
    },
    beanie: {
      slot: 'hat', name: 'BEANIE', price: 50, desc: 'Knitted, with a pom.',
      art: (t) => px([[3, t - 1, 10, 1]], '#d23a3a') + px([[4, t - 2, 8, 1], [5, t - 3, 6, 1]], '#f2f2f2') + px([[4, t - 2], [7, t - 2], [10, t - 2], [6, t - 3], [9, t - 3]], '#d23a3a') + px([[7, t - 4, 2, 1]], '#ffffff'),
    },
    tophat: {
      slot: 'hat', name: 'TOP HAT', price: 90, desc: 'Very formal. Very black.',
      art: (t) => px([[2, t - 1, 12, 1], [4, t - 5, 8, 4]], '#15151c') + px([[4, t - 2, 8, 1]], '#c0392b') + px([[5, t - 4, 1, 2]], '#34343f'),
    },
    wizard: {
      slot: 'hat', name: 'WIZARD HAT', price: 140, desc: 'Pointed, starry, a little too big.',
      art: (t) => px([[1, t - 1, 14, 1]], '#4b2a8a') + px([[4, t - 2, 8, 1], [5, t - 3, 6, 1], [6, t - 4, 5, 1], [7, t - 5, 4, 1], [8, t - 6, 3, 1], [9, t - 7, 2, 1]], '#5b36b0') + px([[4, t - 2, 8, 1]], '#f2c94c') + px([[6, t - 4], [9, t - 6]], '#ffe27a'),
    },
    halo: {
      slot: 'hat', name: 'HALO', price: 220, desc: 'Floats over its head. Nobody asked.',
      art: (t) => px([[5, t - 4, 6, 1], [4, t - 3], [11, t - 3], [5, t - 2, 6, 1]], '#ffe680'),
    },
    crown: {
      slot: 'hat', name: 'CROWN', price: 300, desc: 'Gold, with jewels. It knows.',
      art: (t) => px([[4, t - 2, 8, 2], [4, t - 4, 1, 2], [7, t - 4, 2, 2], [11, t - 4, 1, 2]], '#f2c94c') + px([[5, t - 1], [10, t - 1]], '#d23a3a') + px([[8, t - 1]], '#3b8bff'),
    },
    glasses: {
      slot: 'eyes', name: 'GLASSES', price: 40, desc: 'White frames, the lenses clear.',
      art: () => px([[4, 5, 8, 1], [4, 8, 8, 1], [4, 6, 1, 2], [7, 6, 2, 2], [11, 6, 1, 2], [3, 6], [12, 6]], '#f4f4f4'),
    },
    shades: {
      slot: 'eyes', name: 'SHADES', price: 80, desc: 'Dark lenses. Eyes? What eyes.',
      art: () => px([[3, 5, 10, 1], [4, 6, 4, 2], [8, 6, 4, 2]], '#0b0b10') + px([[5, 6], [9, 6]], '#5a5f70'),
    },
    monocle: {
      slot: 'eyes', name: 'MONOCLE', price: 120, desc: 'One gold ring, on a chain.',
      art: () => px([[9, 5, 2, 1], [8, 6, 1, 2], [11, 6, 1, 2], [9, 8, 2, 1], [12, 8], [12, 9], [12, 10], [13, 11]], '#e0b43a'),
    },
    visor: {
      slot: 'eyes', name: 'VISOR', price: 160, desc: 'A cyan scanner strip. For show.',
      art: () => `<g opacity="0.6">${px([[3, 6, 10, 2]], '#35e0ff')}</g>` + px([[3, 6, 10, 1]], '#bff8ff', ' opacity="0.8"') + px([[3, 7], [12, 7]], '#1b8ea6'),
    },
    bowtie: {
      slot: 'neck', name: 'BOW TIE', price: 40, desc: 'Blue, and neatly done.',
      art: () => px([[5, 12, 2, 2], [9, 12, 2, 2]], '#3a5bd9') + px([[7, 12, 2, 2]], '#1f2f8c'),
    },
    tie: {
      slot: 'neck', name: 'TIE', price: 50, desc: 'For meetings.',
      art: () => px([[7, 12, 2, 1]], '#1f2f8c') + px([[7, 13, 2, 2]], '#3a5bd9') + px([[8, 14]], '#1f2f8c'),
    },
    scarf: {
      slot: 'neck', name: 'SCARF', price: 70, desc: 'Blue and white, one end trailing.',
      art: () => px([[1, 12, 14, 2]], '#3a7bd5') + px([[3, 12], [3, 13], [7, 12], [7, 13], [11, 12], [11, 13]], '#f2f2f2') + px([[10, 14, 2, 2]], '#3a7bd5') + px([[10, 15, 2, 1]], '#f2f2f2'),
    },
    chain: {
      slot: 'neck', name: 'CHAIN', price: 200, desc: 'Silver, heavy, with a square pendant.',
      art: () => px([[3, 12], [4, 13], [5, 13], [6, 14], [9, 14], [10, 13], [11, 13], [12, 12]], '#f4f7ff') + px([[7, 14, 2, 2]], '#1b2a6b') + px([[7, 14, 1, 1]], '#f4f7ff'),
    },
  };
  const order = Object.keys(ITEMS);
  const ids = (slot) => order.filter((id) => ITEMS[id].slot === slot);
  const slotName = (slot) => (SLOTS.find(([s]) => s === slot) || [])[1] || slot.toUpperCase();
  const svg = (id, bot) => (ITEMS[id] ? ITEMS[id].art(TOP[bot] || 3) : '');

  // A bot's element (minibot.js's miniBot, the wanderers') wearing a look: { hat, eyes, neck }. The hat and
  // the neck piece under the face, the eyes' over it; a hat hides the antennas and ear tips under it
  function dress(el, bot, look) {
    const had = 'worn' in el.dataset; // (a seasonal hat's data-hat isn't ours to clear)
    el.querySelectorAll('.bot-items').forEach((g) => g.remove());
    if (had) { delete el.dataset.hat; delete el.dataset.worn; }
    const under = ['hat', 'neck'].map((s) => look[s] && ITEMS[look[s]] && svg(look[s], bot)).filter(Boolean).join('');
    const over = look.eyes && ITEMS[look.eyes] ? svg(look.eyes, bot) : '';
    if (!under && !over) return false;
    if (under) el.querySelector('.bot-body').insertAdjacentHTML('afterend', `<g class="bot-items">${under}</g>`);
    if (over) el.querySelector('.bot-face').insertAdjacentHTML('afterend', `<g class="bot-items">${over}</g>`);
    if (look.hat && ITEMS[look.hat]) el.dataset.hat = '';
    el.dataset.worn = '';
    return true;
  }
  // A still picture of a bot wearing one piece or a look, for the STORE's rows and the CUSTOMIZE card's
  // chips: a plain body in the card's own color (currentColor), two eyes, its legs. look: an item's id, or
  // { hat, eyes, neck }
  function preview(look, bot = 'bot') {
    const l = typeof look === 'string' ? { [ITEMS[look].slot]: look } : look;
    const body = bot === 'bunker' ? '<rect x="1" y="4" width="14" height="9"/><rect x="3" y="2" width="10" height="2"/>' : '<rect x="2" y="3" width="12" height="10"/>';
    const ears = bot === 'bunker' ? '' : bot === 'glitch' ? '<rect x="8" y="1" width="1" height="2"/>' : '<rect x="5" y="1" width="1" height="2"/><rect x="10" y="1" width="1" height="2"/>';
    const legs = '<rect x="4" y="13" width="1" height="2"/><rect x="6" y="13" width="1" height="2"/><rect x="9" y="13" width="1" height="2"/><rect x="11" y="13" width="1" height="2"/>';
    const eyes = '<rect x="5" y="6" width="2" height="2" fill="#0b0b10" opacity="0.85"/><rect x="9" y="6" width="2" height="2" fill="#0b0b10" opacity="0.85"/>';
    const worn = ['hat', 'neck', 'eyes'].map((s) => (l[s] ? svg(l[s], bot) : '')).join('');
    return `<svg class="bot-pic" viewBox="-1 -6 18 23" shape-rendering="crispEdges" aria-hidden="true"><g fill="currentColor">${l.hat ? '' : ears}${body}${legs}</g>${eyes}${worn}</svg>`;
  }
  return { ITEMS, SLOTS, order, ids, slotName, svg, dress, preview, TOP };
})();
