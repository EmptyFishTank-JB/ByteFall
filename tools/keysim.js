// KEYS balance: plays CLASSIC games on the VS CPU's own board code (js/cpu.js) at three skill levels
// and estimates KEYS earned per game and over 30 days of play (node tools/keysim.js).
const fs = require('fs'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname, '../js/cpu.js'), 'utf8') + '\nthis.CpuBoard = CpuBoard;', ctx);
const { CpuBoard } = ctx;
function game(level, layerEvery) {
  let seed = Math.random();
  const rnd = () => Math.random();
  const size = CpuBoard.sizeFor(level);
  const b = CpuBoard.create(level, rnd, () => 1 + Math.floor(Math.random() * size), layerEvery, 'bot', false);
  let drops = 0, bits = 0, c5 = 0, c7 = 0;
  while (!b.isDead() && drops < 3000) {
    b.step(); drops++;
    let maxChain = 0;
    for (const f of b.takeFrames()) { if (f.pops && f.chain) { bits += f.pops.length; maxChain = Math.max(maxChain, f.chain); } }
    if (maxChain >= 5) c5++; if (maxChain >= 7) c7++;
  }
  return { drops, bits, c5, c7, score: b.score() };
}
const N = 300;
for (const [label, level, layer] of [['CASUAL (easy-CPU skill, NORMAL rules)', 'easy', 8], ['AVERAGE (normal-CPU skill)', 'normal', 8], ['GOOD (hard-CPU skill, 8x8, layers every 6)', 'hard', 6]]) {
  const rs = Array.from({ length: N }, () => game(level, layer));
  const avg = (k) => rs.reduce((a, r) => a + r[k], 0) / N;
  const med = (k) => rs.map((r) => r[k]).sort((a, b) => a - b)[N >> 1];
  const keys = rs.map((r) => Math.floor(r.bits / 10) + r.c5 * 2 + r.c7 * 5 + Math.floor(r.bits / 100) * 10);
  const kAvg = keys.reduce((a, b) => a + b, 0) / N;
  console.log(`${label}: drops avg ${avg('drops').toFixed(0)} (median ${med('drops')}), bits avg ${avg('bits').toFixed(0)} (median ${med('bits')}), chains>=5 ${avg('c5').toFixed(2)}, >=7 ${avg('c7').toFixed(2)} | keys/game ~${kAvg.toFixed(1)} (incl. level-ups at 10 per 100 bits)`);
}

// ── 30 days of play, by profile: what they'd earn, and what they could spend ──
const perGame = (level) => { const r = game(level, level === 'hard' ? 6 : 8); return Math.floor(r.bits / 10) + r.c5 * 2 + r.c7 * 5 + Math.floor(r.bits / 100) * 10; };
const ACH_TOTAL = 148, ACH_WINDOW = 400; // (achievements: ~10 keys each, most of them in the first few hundred games)
for (const [name, gamesPerDay, level, puzzlesPerDay] of [['CASUAL', 3, 'easy', 0.5], ['REGULAR', 8, 'normal', 2], ['HEAVY', 20, 'normal', 4]]) {
  let keys = 0, games = 0; const days = [];
  for (let day = 1; day <= 30; day++) {
    keys += 10; // daily game + DAILY DROP
    keys += Math.round(puzzlesPerDay * 4); // first solves (avg 4)
    for (let g = 0; g < gamesPerDay; g++) { keys += perGame(level); games++; if (games <= ACH_WINDOW) keys += (ACH_TOTAL * 0.7 / ACH_WINDOW) * 10; }
    if ([1, 7, 30].includes(day)) days.push(`day ${day}: ${Math.round(keys)}`);
  }
  console.log(`${name} (${gamesPerDay} games/day): ${days.join(', ')}  -> ~${Math.round(keys / (30 * gamesPerDay))} keys per game played, all in`);
}
