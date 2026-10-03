// The PUZZLE generator: random boards and bits, kept when the brute-force solver (js/puzzle-sim.js) finds
// they clear in exactly that many drops (never fewer) and in only a few ways.
//   node tools/puzzles/gen.js <tier> <count> <seed>   (prints the puzzles as JSON)
// Each tier is a list of bands: { n (puzzles), drops, size, layers (none / 1 / 1-2), sols (most
// solutions allowed), cells ([min, max] blocks on the board) }
const S = require('../../js/puzzle-sim.js');

const TIERS = {
  easy: [
    { n: 40, drops: 1, size: 7, layers: 0, sols: 4, cells: [3, 9] },
    { n: 25, drops: 2, size: 7, layers: 0, sols: 4, cells: [4, 11] },
    { n: 15, drops: 2, size: 7, layers: 1, sols: 4, cells: [4, 11] },
    { n: 20, drops: 3, size: 7, layers: 1, sols: 4, cells: [5, 13] },
  ],
  normal: [ // (after the original 60)
    { n: 20, drops: 4, size: 7, layers: 2, sols: 3, cells: [8, 18] },
    { n: 20, drops: 5, size: 7, layers: 2, sols: 3, cells: [9, 20] },
  ],
  hard: [
    { n: 20, drops: 2, size: 8, layers: 1, sols: 3, cells: [5, 14] },
    { n: 25, drops: 3, size: 8, layers: 2, sols: 3, cells: [7, 18] },
    { n: 30, drops: 4, size: 8, layers: 2, sols: 2, cells: [9, 22] },
    { n: 25, drops: 5, size: 8, layers: 2, sols: 2, cells: [10, 24] },
  ],
};

function rng(seed) { // (mulberry32)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function candidate(band, R) {
  const { size, drops, layers } = band;
  const int = (a, b) => a + Math.floor(R() * (b - a + 1));
  const cells = int(band.cells[0], band.cells[1]);
  const cols = Array.from({ length: size }, () => []);
  const maxH = size - 2; // (room to drop on top)
  for (let k = 0; k < cells; k++) {
    const open = cols.map((c, i) => i).filter((i) => cols[i].length < maxH);
    if (!open.length) break;
    // (columns that already have blocks get more, so there are runs to line up)
    const weighted = open.flatMap((i) => Array(1 + cols[i].length).fill(i));
    const c = weighted[int(0, weighted.length - 1)];
    const v = int(1, size);
    const layered = layers && R() < 0.22 ? [layers === 2 && R() < 0.4 ? 2 : 1, v] : null;
    cols[c].push(layered || v);
  }
  const stable = S.clone(cols);
  S.resolve(stable, size);
  if (JSON.stringify(stable) !== JSON.stringify(cols)) return null; // (nothing decrypts before the first drop)
  if (layers && !cols.some((c) => c.some((b) => typeof b !== 'number'))) return null;
  const pieces = Array.from({ length: drops }, () => int(1, size));
  return { board: S.format(cols), pieces };
}

function generate(bands, seed, seen = new Set()) {
  const R = rng(seed);
  const out = [];
  for (const band of bands) {
    let made = 0;
    let tries = 0;
    while (made < band.n) {
      tries++;
      const p = candidate(band, R);
      if (!p) continue;
      const key = JSON.stringify(p);
      if (seen.has(key)) continue;
      const r = S.solve(p.board, p.pieces, band.size, band.sols);
      if (r.early || !r.solutions.length || r.solutions.length > band.sols) continue;
      seen.add(key);
      const layers = p.board.flat().filter((b) => typeof b !== 'number').length;
      out.push({ ...p, meta: { drops: band.drops, layers, sols: r.solutions.length, cells: p.board.flat().length } });
      made++;
    }
    process.stderr.write(`band drops ${band.drops} layers ${band.layers}: ${band.n} in ${tries} tries\n`);
  }
  return out;
}

if (require.main === module) {
  const [tier, , seed] = process.argv.slice(2);
  const t0 = Date.now();
  const out = generate(TIERS[tier], Number(seed) || 1);
  process.stderr.write(`${tier}: ${out.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  console.log(JSON.stringify(out));
}
module.exports = { TIERS, generate };
