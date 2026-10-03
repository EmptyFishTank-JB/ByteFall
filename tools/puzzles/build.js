// Builds js/data/puzzles.js: PUZZLE mode's three sets of 100.
//   node tools/puzzles/build.js
// - EASY (7x7): 1 to 3 drops, a few layers in the later ones, up to 4 ways to solve each
// - NORMAL (7x7): the original 60 (unchanged, so saved progress still lines up), then 20 of 4
//   drops and 20 of 5, grown from the originals, layers up to level 2
// - HARD (8x8, bits 1-8): 2 to 5 drops, layers up to level 2, at most 2 ways to solve the longer ones
// Random boards (gen.js) for the short ones, grown from shorter ones (grow.js) for the long ones;
// every puzzle checked by the solver (js/puzzle-sim.js): solvable, never in fewer drops. Seeded: the same
// file every time. Each set is ordered easiest first.
const fs = require('fs');
const path = require('path');
const S = require('../../js/puzzle-sim.js');
const { generate, TIERS } = require('./gen.js');
const { grow } = require('./grow.js');

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const meta = (p, size) => {
  const r = S.solve(p.board, p.pieces, size, 50);
  return { drops: p.pieces.length, layers: p.board.flat().filter((b) => typeof b !== 'number').length, sols: r.solutions.length, cells: p.board.flat().length };
};
// (harder: more drops, more blocks and layers, fewer ways to solve it)
const weight = (m) => m.drops * 100 + m.cells + 4 * m.layers - 3 * m.sols;
const order = (list) => list.slice().sort((a, b) => weight(a.meta) - weight(b.meta));
// n from a pool: about half with layers when there are enough
function pick(pool, n, withLayers = 0.5) {
  const lay = pool.filter((p) => p.meta.layers);
  const plain = pool.filter((p) => !p.meta.layers);
  const k = Math.min(lay.length, Math.round(n * withLayers));
  return lay.slice(0, k).concat(plain.slice(0, n - k)).concat(lay.slice(k)).slice(0, n);
}

const t0 = Date.now();
const log = (s) => process.stderr.write(`${s} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);

// EASY
const easy = generate(TIERS.easy, 7);
log('easy: 100');

// NORMAL: the original 60, then 40 grown from them
const src = fs.readFileSync(path.join(__dirname, '../../js/data/puzzles.js'), 'utf8');
const ORIGINAL = (() => {
  const m = /const PUZZLES = (\[[\s\S]*?\n\]);/.exec(src) || /normal: (\[[\s\S]*?\n  \]),/.exec(src);
  return eval(m[1]).slice(0, 60);
})();
const originals = ORIGINAL.map((p) => ({ ...p, meta: meta(p, 7) }));
const seenN = new Set(originals.map((p) => JSON.stringify([p.board, p.pieces])));
const Rn = rng(11);
const n4 = grow(originals.filter((p) => p.pieces.length === 3), 4, 50, 7, Rn, { layers: 2, sols: 3, seen: seenN });
const n5 = grow(originals.filter((p) => p.pieces.length === 4).concat(n4), 5, 50, 7, Rn, { layers: 2, sols: 2, seen: seenN });
const normal = originals.map(({ board, pieces }) => ({ board, pieces })).concat(order(pick(n4, 20)), order(pick(n5, 20)));
log('normal: 100');

// HARD: 1-drop seeds, grown
const Rh = rng(13);
const seenH = new Set();
const ones = generate([{ n: 60, drops: 1, size: 8, layers: 1, sols: 3, cells: [4, 12] }], 17, seenH);
const h2 = grow(ones, 2, 60, 8, Rh, { layers: 1, sols: 3, seen: seenH });
const h3 = grow(h2, 3, 60, 8, Rh, { layers: 2, sols: 3, seen: seenH });
const h4 = grow(h3, 4, 70, 8, Rh, { layers: 2, sols: 2, seen: seenH });
const h5 = grow(h4, 5, 60, 8, Rh, { layers: 2, sols: 2, seen: seenH });
const hard = order(pick(h2, 20, 0.3)).concat(order(pick(h3, 25, 0.4)), order(pick(h4, 30, 0.5)), order(pick(h5, 25, 0.6)));
log('hard: 100');

// Checked again, as they'll be played
for (const [name, list, size] of [['easy', easy, 7], ['normal', normal, 7], ['hard', hard, 8]]) {
  if (list.length !== 100) throw new Error(`${name}: ${list.length} puzzles`);
  list.forEach((p, i) => {
    const r = S.solve(p.board, p.pieces, size, 50);
    if (!r.solutions.length || r.early) throw new Error(`${name} ${i + 1}: not a puzzle`);
  });
}

const line = (p) => `    { board: ${JSON.stringify(p.board)}, pieces: ${JSON.stringify(p.pieces)} },`;
const out = `// PUZZLE mode boards: clear the whole board using exactly the bits given, in order. Three sets
// of 100, each played in order (script.js): EASY and NORMAL on the 7x7 grid (bits 1-7), HARD on
// the 8x8 (bits 1-8). Each column lists its blocks bottom to top: a number is a bit; 'L2:5' is an
// encryption layer at level 2 hiding a [5] (revealed when it's peeled to 0).
// Built by tools/puzzles/build.js and checked by brute force against the game's rules: every one
// solvable, none in fewer drops. EASY: 1-3 drops, up to 4 solutions. NORMAL: the original 60 (1-4
// drops, 1-3 solutions), then 4 and 5 drops. HARD: 2-5 drops. Each set easiest first.
const PUZZLES = {
  easy: [
${easy.map(line).join('\n')}
  ],
  normal: [
${normal.map(line).join('\n')}
  ],
  hard: [
${hard.map(line).join('\n')}
  ],
};
`;
fs.writeFileSync(path.join(__dirname, '../../js/data/puzzles.js'), out);
log('js/data/puzzles.js written');
