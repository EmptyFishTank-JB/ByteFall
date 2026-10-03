// Longer puzzles grown from shorter ones: a puzzle that takes k drops becomes one that takes k+1
// by adding blocks that a new first bit clears (or simply sits on): the new first drop, wherever
// it's meant to go, rebuilds the k-drop board, and the rest is the old puzzle. Every one is then
// checked by the solver (sim.js) for its number of solutions and that it can't clear sooner.
const S = require('./sim.js');

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// One k+1 drop puzzle from a k drop one, or null. R: random 0-1; layers: 0, 1 or 2 (highest level)
function growOnce(p, size, R, layers, sols) {
  const int = (a, b) => a + Math.floor(R() * (b - a + 1));
  const base = S.parse(p.board);
  const W = base.length;
  const b2 = S.clone(base);
  const extra = int(1, 4);
  for (let k = 0; k < extra; k++) {
    const c = int(0, W - 1);
    if (b2[c].length >= size - 1) continue;
    const at = int(0, b2[c].length);
    const v = int(1, size);
    b2[c].splice(at, 0, layers && R() < 0.15 ? [layers === 2 && R() < 0.4 ? 2 : 1, v] : v);
  }
  const col = int(0, W - 1);
  const p0 = int(1, size);
  const stable = S.clone(b2);
  S.resolve(stable, size);
  if (!same(stable, b2)) return null; // (nothing decrypts before the first drop)
  const after = S.drop(b2, col, p0, size);
  if (!after || !same(after, base)) return null;
  const q = { board: S.format(b2), pieces: [p0, ...p.pieces] };
  const r = S.solve(q.board, q.pieces, size, sols);
  if (r.early || !r.solutions.length || r.solutions.length > sols) return null;
  q.meta = { drops: q.pieces.length, layers: b2.flat().filter((b) => typeof b !== 'number').length, sols: r.solutions.length, cells: b2.flat().length };
  return q;
}

// n puzzles of `drops` drops, grown step by step from the seeds (puzzles of fewer drops)
function grow(seeds, drops, n, size, R, { layers = 0, sols = 3, seen = new Set(), maxTries = 4e6 } = {}) {
  let pool = seeds.slice();
  for (let d = Math.min(...seeds.map((s) => s.pieces.length)) + 1; d <= drops; d++) {
    const want = d === drops ? n : Math.max(n, 40);
    const next = [];
    let tries = 0;
    const from = pool.filter((s) => s.pieces.length === d - 1);
    while (next.length < want && tries < maxTries) {
      tries++;
      const q = growOnce(from[Math.floor(R() * from.length)], size, R, layers, sols);
      if (!q) continue;
      const key = JSON.stringify([q.board, q.pieces]);
      if (seen.has(key)) continue;
      seen.add(key);
      next.push(q);
    }
    process.stderr.write(`  ${d} drops: ${next.length} in ${tries} tries\n`);
    pool = pool.concat(next);
  }
  return pool.filter((s) => s.pieces.length === drops).slice(0, n);
}

module.exports = { grow, growOnce };
