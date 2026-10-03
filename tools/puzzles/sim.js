// PUZZLE mode's rules, as script.js plays them (resolveChains, collapse, overflowed), for the
// puzzle generator and checker: no exploits, no rising layers.
// A board: columns, bottom to top; a cell is a number (a bit) or [level, hidden] (a layer).
function parse(board) {
  return board.map((col) => col.map((b) => (typeof b === 'number' ? b : (([l, h]) => [l, h])(b.slice(1).split(':').map(Number)))));
}
function format(cols) {
  return cols.map((col) => col.map((b) => (typeof b === 'number' ? b : `L${b[0]}:${b[1]}`)));
}
const clone = (cols) => cols.map((c) => c.map((b) => (typeof b === 'number' ? b : [b[0], b[1]])));

// One drop and everything it sets off; returns the new columns, or null if the column was full
function drop(cols, col, val, size) {
  const MAX = size + 1;
  if (cols[col].length >= MAX) return null;
  const next = clone(cols);
  next[col].push(val);
  resolve(next, size);
  return next;
}
function resolve(cols, size) {
  const MAX = size + 1;
  const W = cols.length;
  const at = (r, c) => (c >= 0 && c < W && r >= 0 && r < MAX ? cols[c][r] : undefined);
  for (;;) {
    const run = (r, c, dr, dc) => {
      let n = 1;
      for (let rr = r + dr, cc = c + dc; at(rr, cc) != null; rr += dr, cc += dc) n++;
      for (let rr = r - dr, cc = c - dc; at(rr, cc) != null; rr -= dr, cc -= dc) n++;
      return n;
    };
    const pops = [];
    for (let r = 0; r < MAX; r++) {
      for (let c = 0; c < W; c++) {
        const b = at(r, c);
        if (typeof b !== 'number') continue;
        if (b === run(r, c, 1, 0) || b === run(r, c, 0, 1)) pops.push([r, c]);
      }
    }
    if (!pops.length) return;
    for (const [r, c] of pops) {
      for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
        const b = at(nr, nc);
        if (b == null || typeof b === 'number') continue;
        b[0]--;
        if (b[0] <= 0) cols[nc][nr] = b[1];
      }
    }
    for (const [r, c] of pops) cols[c][r] = null;
    for (let c = 0; c < W; c++) cols[c] = cols[c].filter((b) => b !== null);
  }
}
const empty = (cols) => cols.every((c) => !c.length);
const over = (cols, size) => cols.some((c) => c.length > size);

// Every way to clear the board with the pieces in order: { solutions (column sequences that
// clear it on the last drop), early (it clears before the last), stuck }
function solve(board, pieces, size, cap = 50) {
  const out = { solutions: [], early: false };
  const go = (cols, k, path) => {
    if (out.solutions.length > cap || out.early) return;
    for (let c = 0; c < cols.length; c++) {
      const next = drop(cols, c, pieces[k], size);
      if (!next || over(next, size)) continue;
      if (empty(next)) {
        if (k === pieces.length - 1) out.solutions.push([...path, c]);
        else { out.early = true; return; }
        continue;
      }
      if (k < pieces.length - 1) go(next, k + 1, [...path, c]);
    }
  };
  go(parse(board), 0, []);
  return out;
}

module.exports = { parse, format, drop, resolve, solve, empty, over, clone };
