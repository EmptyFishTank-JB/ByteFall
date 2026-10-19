// TUTORIAL.md's cards, written from the lesson as it plays: every card's words, what it opens and
// frames, the board and bits it sets up, and after a drop what it says and the points it shows.
// Plays the TUTORIAL through in a headless browser (Playwright), card by card, as a player would, then
// each RULES section's own lesson (from its page's TUTORIAL button), the same way
// (NEXT, the framed thing to tap, the framed column to drop in), and replaces everything in
// TUTORIAL.md from its "## Welcome" heading on. The intro above it is kept, to write by hand.
//   node tools/tutorial-doc.js   (Playwright installed; PW_CHROMIUM=path to use a given Chromium)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const DOC = path.join(ROOT, 'TUTORIAL.md');
// What each selector a card names is, in words
const NAMES = {
  '.stat-current': 'the CURRENT panel',
  '#score-stat': 'SCORE',
  '#chain-stat': 'CHAIN',
  '#pulse-stat': 'ENCRYPT IN',
  '#exploit-btn': 'the EXPLOIT button',
  '.chain-meter': 'the CHAIN METER',
  '.exploit-row': 'the row under the drop buttons',
  '.side-slot': 'the slots',
  '.patch-slot': 'the PATCH SLOTS',
  '.side-slot:not(.patch-slot)': 'the EXPLOIT SLOTS',
  '.side-slot.market': 'the BLACK MARKET slot',
  '#records-btn': 'PAUSE, at the top right',
  '#pause-records': 'RULES & RECORDS on the pause screen',
  '#pause-exploits': 'EXPLOITS on the pause screen',
  '#pause-settings': 'SETTINGS on the pause screen',
  '#pause-resume': 'RESUME on the pause screen',
  '.card-back[data-close="records"]': '← BACK',
  '.card-back[data-close="settings"]': '← BACK',
  '.menu-tabs [data-pane="rules"]': 'the RULES tab',
  '.menu-tabs [data-pane="records"]': 'the RECORDS tab',
  '.menu-tabs [data-pane="notices"]': 'the NOTICES tab',
  '.menu-tabs [data-pane="archive"]': 'the ARCHIVE tab',
  '.records-tabs': "RECORDS' own tabs (UNLOCKS, ACHIEVEMENTS, STATS, HISTORY)",
  '.rec-level': 'the level and DECRYPTOR rank box',
  '.archive-story.on': 'the story being decrypted',
  '#slot-info': 'the loadout slots',
  '.hack-item': 'the exploit cards',
  '#store-res': 'YOUR RESOURCES',
  '#price-gauge': 'PRICES TODAY',
  '.store-daily': 'the DAILY DROP',
  '.store-sub[data-sec="patches"]': 'PATCHES',
  '.store-sub[data-sec="starters"]': 'TIER I EXPLOITS',
  '.store-sub[data-sec="boxes"]': 'BLACK BOXES',
  '#store-support': 'SUPPORT THE GAME (REMOVE ADS, FULL ACCESS)',
  '#settings-panel': 'the top of SETTINGS',
  '#settings-display': 'DISPLAY',
  '#settings-extras': 'EXTRAS',
  '#game-mode-label': 'the line under BYTEFALL',
  '#goal-bar': 'the bar along the bottom of SCORE',
  '#story-row': 'the story button on the main menu',
  '.modes button[data-mode="classic"]': 'CLASSIC / STORY on the main menu',
  '#booster-row': 'PATCHES on the main menu',
  '#starter-row': 'EXPLOITS on the main menu',
};
const PANES = {
  rules: 'RULES & RECORDS, on its RULES tab',
  records: 'RULES & RECORDS, on its RECORDS tab',
  notices: 'RULES & RECORDS, on its NOTICES tab',
  archive: 'RULES & RECORDS, on its ARCHIVE tab (the list of stories)',
  exploits: 'EXPLOITS (the loadout)',
  store: 'the STORE',
};
const name = (sel) => NAMES[sel] || sel;
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const ord = (n) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
// A board as the doc draws it: top row first, [n] a bit, [=] / [-] a layer (cracked), . empty
function boardText(board) {
  const h = Math.max(1, ...board.map((c) => c.length));
  const rows = [];
  for (let r = h - 1; r >= 0; r--) {
    rows.push(board.map((col) => {
      const b = col[r];
      if (b === undefined) return ' . ';
      if (typeof b === 'number') return `[${b}]`;
      return Number(b.slice(1).split(':')[0]) < 2 ? '[-]' : '[=]';
    }).join(''));
  }
  return rows.join('\n');
}
function sits(s) {
  if (s.home) return 'over the main menu, from the top of the EXPLOITS / STORE row down';
  if (s.float === 'middle') return 'the middle of the screen, over the open page';
  if (s.float) return 'the bottom of the screen, over the open page';
  if (s.place === 'bottom' || s.intro) return "under the board's middle";
  return 'top of the board';
}

(async () => {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 384, height: 823 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('bytefall-mode', 'classic');
    localStorage.setItem('bytefall-wanderers', 'off');
    sessionStorage.setItem('bytefall-launched', '1');
    sessionStorage.setItem('bytefall-started', '1');
  });
  await page.goto(`file://${path.join(ROOT, 'bytefall.html')}?season=off&weather=sunny`);
  await page.waitForTimeout(1500);
  // One lesson played through, card by card: 'main' (the main menu's TUTORIAL) or a RULES section's
  async function play(lesson) {
    if (lesson === 'main') {
      await page.evaluate(() => window.showHome());
      await page.click('#home-tutorial');
    } else {
      await page.evaluate((id) => { window.showHome(); window.openRules(id); }, lesson);
      await page.click(`.rules-sec[data-sec="${lesson}"] [data-lesson]`);
    }
    await page.waitForTimeout(1200);
    const steps = await page.evaluate(() => Tutorial.steps().map((s) => ({ ...s, explain: s.explain ? true : false })));
    const cards = [];
    for (let guard = 0; guard < steps.length * 3; guard++) {
      await page.evaluate(() => { const c = document.querySelector('#tut-banner .tut-card'); if (c) c.click(); }); // (the words said)
      await page.waitForTimeout(200);
      const at = await page.evaluate(() => Tutorial.at());
      if (at < 0) break;
      const s = steps[at];
      const live = await page.evaluate(() => ({
        buttons: [...document.querySelectorAll('#tut-banner .tut-actions button')].map((b) => b.textContent),
      }));
      const card = { at, s, buttons: live.buttons };
      cards[at] = card;
      if (s.done) { // (out: its MAIN MENU, or RULES back to the section's page)
        await page.click(`#tut-banner .tut-actions button:has-text("${s.done === 'rules' ? 'RULES' : 'MAIN MENU'}")`);
        await page.waitForTimeout(800);
        if (s.done === 'rules' && !(await page.evaluate((id) => !document.getElementById('records').hidden && document.getElementById('rules-panel').dataset.sec === id, lesson))) throw new Error(`${lesson}: RULES didn't open its page`);
        break;
      }
      const next = live.buttons.find((t) => t === 'NEXT' || t === 'BEGIN');
      if (next) {
        await page.click(`#tut-banner .tut-actions button:has-text("${next}")`);
        await page.waitForTimeout(600);
        continue;
      }
      const did = await page.evaluate(() => {
        const col = document.querySelector('#column-buttons button.tut-pulse');
        if (col) { col.click(); return 'drop'; }
        const t = [...document.querySelectorAll('.tut-pulse')].find((e) => e.getClientRects().length && !e.classList.contains('cell'));
        if (t) { t.click(); return 'tap'; }
        return null;
      });
      if (!did) throw new Error(`${lesson}: stuck on card ${at}`);
      if (did === 'drop') { // (what it says after, and the points)
        await page.waitForFunction(() => [...document.querySelectorAll('#tut-banner .tut-actions button')].some((b) => b.textContent === 'NEXT'), null, { timeout: 15000 });
        await page.evaluate(() => { const c = document.querySelector('#tut-banner .tut-card'); if (c) c.click(); });
        await page.waitForTimeout(300);
        Object.assign(card, await page.evaluate(() => ({
          after: document.querySelector('#tut-banner .tut-text').getAttribute('aria-label') || document.querySelector('#tut-banner .tut-text').textContent,
          points: [...document.querySelectorAll('#tut-banner .tut-points > div')].map((d) => d.textContent),
          scoreAfter: document.getElementById('score').textContent,
        })));
        await page.click('#tut-banner .tut-actions button:has-text("NEXT")');
      }
      await page.waitForTimeout(800);
    }
    cards.forEach((c, i) => { if (!c) throw new Error(`${lesson}: card ${i} never came up`); });
    if (cards.length !== steps.length) throw new Error(`${lesson}: ${cards.length} of ${steps.length} cards came up`);
    return { steps, cards };
  }
  const lessons = await page.evaluate(() => Tutorial.lessons());
  const played = {};
  for (const id of lessons) played[id] = await play(id);
  const titles = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.rules-sec')].map((el) => [el.dataset.sec, el.querySelector('.rules-sub').firstChild.textContent.replace(/^\/\/\s*/, '').trim()])));
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));

  // A card in the doc: h, its heading's level; first, the lesson's welcome (the main one's)
  function cardText({ steps, cards }, i, h, welcome) {
    const c = cards[i];
    const s = c.s;
    let out = `${h} ${welcome && !i ? 'Welcome' : `Card ${welcome ? i : i + 1}`}\n\n- **Heading**: \`// TUTORIAL\`\n`;
    out += `- **Card sits**: ${sits(s)}; **BOT**: ${s.mood || 'resting'}${s.explain ? `, then ${s.explainMood || 'resting'} after the drop` : ''}\n`;
    out += `- **Buttons**: ${['EXIT', ...c.buttons.filter((b) => b !== 'NEXT' || !s.explain)].join(', ')}\n`;
    const opens = [];
    if (s.paused && !s.pane && !s.settings && !s.closeMenus) opens.push('the pause screen');
    if (s.paused && s.closeMenus) opens.push('the pause screen');
    if (s.pane) opens.push(PANES[s.pane] + (s.recTab ? ` (${s.recTab.toUpperCase()})` : ''));
    if (s.settings) opens.push('SETTINGS');
    if (s.home) opens.push("the main menu (CLASSIC's panel)");
    if (s.scroll) opens.push(`scrolled to ${name(s.scroll)}`);
    if (opens.length) out += `- **Opens**: ${opens.join(', ')}\n`;
    if (s.bits && s.bits.length) out += `- **Bits**: CURRENT [${s.bits[0]}]${s.bits.length > 1 ? `, then ${s.bits.slice(1).map((b) => `[${b}]`).join(' ')}` : ''}\n`;
    if (s.held) out += `- **Waiting in the EXPLOIT button**: ${s.held.map((x) => x.toUpperCase().replace(/-/g, ' ')).join(', ')}\n`;
    if (s.meter !== undefined) out += `- **CHAIN METER**: ${s.meter} bars lit as it begins\n`;
    if (s.board && s.board.some((col) => col.length)) out += `- **Board**:\n\n\`\`\`\n${boardText(s.board)}\n\`\`\`\n`;
    out += `\n**Says:**\n\n> ${s.text.replace(/\n/g, '\n> ')}\n\n`;
    const drops = s.drop === undefined ? [] : [].concat(s.drop).map((d) => d + 1);
    const asks = s.intro ? 'Tap BEGIN.' : s.done === 'rules' ? 'Tap RULES (back to its page in RULES).' : s.done ? 'Tap MAIN MENU (out to the main menu).'
      : drops.length ? `Drop into column ${drops.join(' or ')}.`
      : s.tap ? `Tap ${name(s.tap)}.` : 'Tap NEXT.';
    out += `- **Asks you to**: ${asks}\n`;
    const lit = [];
    for (const sel of s.focus || []) lit.push(`${name(sel)} (in focus)`);
    for (const sel of s.pulse || []) lit.push(name(sel));
    if (s.tap && !(s.focus || []).includes(s.tap)) lit.push(`${name(s.tap)} (in focus)`);
    for (const [r, col] of s.cells || []) lit.push(`the block in column ${col + 1}, ${ord(r + 1)} from the bottom`);
    if (drops.length) lit.push(`the drop button${drops.length > 1 ? 's' : ''} for column ${drops.join(' or ')}`);
    if (s.line) lit.push('the ======== line');
    if (s.demo) lit.push({ slots: 'the bottom row\'s slots, shown locked (for the lesson)', market: 'a sample BLACK MARKET slot (for the lesson)', goal: 'a sample ENCRYPTION STRENGTH line and SCORE bar (for the lesson)' }[s.demo]);
    out += `- **Lights up**: ${lit.length ? list(lit) : 'nothing'}\n`;
    if (c.after) {
      out += `\n**After the drop, says:**\n\n> ${c.after.replace(/\n/g, '\n> ')}\n\n`;
      if (c.points && c.points.length) out += `**Points shown:**\n\n\`\`\`\n${c.points.join('\n')}\n\`\`\`\n`;
      out += `- **Score after**: ${c.scoreAfter}\n`;
    }
    const notes = [];
    if (s.home && i && !steps[i - 1].home) notes.push('No BACK on this card: the lesson\'s board is gone.');
    if (s.done === 'rules') notes.push('RULES ends the lesson and opens its section\'s page in RULES (EXIT does too).');
    else if (s.done) notes.push('MAIN MENU ends the lesson and earns HELLO, WORLD (an achievement, +10 KEYS).');
    out += `- **Notes**: ${notes.join(' ')}\n\n---\n\n`;
    return out;
  }
  let out = '';
  played.main.cards.forEach((c, i) => { out += cardText(played.main, i, '##', true); });
  out += "# RULES' own lessons\n\nEach section's page in RULES has its own TUTORIAL button (where it has one): the lesson below, then RULES back to that page.\n\n";
  for (const id of lessons.filter((l) => l !== 'main')) {
    out += `## ${titles[id] || id.toUpperCase()}\n\n`;
    played[id].cards.forEach((c, i) => { out += cardText(played[id], i, '###', false); });
  }
  const doc = fs.readFileSync(DOC, 'utf8');
  const head = doc.slice(0, doc.indexOf('## Welcome'));
  fs.writeFileSync(DOC, head + out.replace(/\n---\n\n$/, '\n'));
  console.log(`TUTORIAL.md: ${lessons.map((id) => `${id} ${played[id].cards.length}`).join(', ')}`);
})().catch((e) => { console.error(e); process.exit(1); });
