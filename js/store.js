// STORE: the MENU's fourth tab. The DAILY DROP to claim (script.js's dailyDrop), the BOOSTERS
// bought with KEYS (script.js's BOOSTERS, Progress's wallet), RESERVE EXPLOITS and BLACK BOXES
// bought with KEYS and RESOURCES (ECONOMY.md), and two purchases: REMOVE ADS (no ads, nothing unlocked) and FULL
// ACCESS (everything that unlocks by level, and no ads), plus RESTORE PURCHASES. A preview for
// now: BUY and RESTORE say the store isn't open and charge nothing. The app will swap buy() and
// restore() for Google Play's billing, then tell Unlocks what's owned (Unlocks.set / setNoAds).
// A REMOVE ADS link sits at the foot of the menu's other tabs while there are ads.
const Store = (() => {
  // (placeholder prices: the store sets the real ones, in the player's currency)
  const ITEMS = {
    'remove-ads': { price: '$2.99', owned: () => Unlocks.hasNoAds() },
    'full-access': { price: '$4.99', owned: () => Unlocks.hasFullAccess() },
  };
  const menu = document.getElementById('records');
  const msgEl = document.getElementById('store-msg');
  const link = document.getElementById('store-shortcut');
  let msgTimer = 0;

  function say(text) {
    msgEl.textContent = text;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msgEl.textContent = ''; }, 5000);
  }
  // BOOSTERS: each with what it does, how many are owned, and BUY for its price in KEYS
  const shop = document.getElementById('booster-shop');
  const boosters = window.BOOSTERS || {};
  for (const [id, b] of Object.entries(boosters)) {
    const item = document.createElement('div');
    item.className = 'store-item booster-item';
    item.dataset.booster = id;
    item.innerHTML = `<h3>${b.name} <span class="store-price">${b.cost} KEYS</span></h3><p>${b.desc}</p>`
      + '<div class="booster-buy-row"><span class="booster-owned"></span><button type="button" class="store-buy">BUY</button></div>';
    item.querySelector('.store-buy').addEventListener('click', () => {
      if (!Progress.spendKeys(b.cost)) {
        SFX.play('denied');
        say(`NOT ENOUGH KEYS // ${b.name} IS ${b.cost} KEYS`);
        return;
      }
      Progress.addBooster(id);
      SFX.play('egg');
      say(`BOUGHT // ${b.name}`);
      if (typeof showKeys === 'function') showKeys();
      render();
    });
    shop.appendChild(item);
  }
  // RESERVE EXPLOITS and BLACK BOXES: each with its icon, its price in KEYS and RESOURCES
  // (Progress; ECONOMY.md), what's still short of it, how many are owned and BUY; an exploit short of
  // its price can take a MASTER KEY instead. The exploits in the order they unlock (the locked ones
  // show their level; BLACK BOX itself isn't sold); each BLACK BOX shows its odds
  function shopItem(id, parent) {
    const item = document.createElement('div');
    item.className = 'store-item booster-item reserve-item';
    item.dataset.reserve = id;
    const box = Progress.isBox(id);
    const odds = box ? Progress.boxOdds(id) : null;
    item.innerHTML = `<h3><span class="store-ico bracketed">${bracketIcon(id)}</span><span class="store-name">${itemName(id)}</span>`
      + `<span class="store-price">${box ? '' : `TIER ${Progress.tierOf(id) + 1}`}</span></h3>`
      + `<p class="store-desc">${itemDesc(id)}</p>`
      + `<p class="store-cost">${priceHtml(Progress.price(id))}</p>`
      + (box ? `<p class="store-odds">TIER 1 EXPLOIT ${odds[0]}% // TIER 2 ${odds[1]}% // TIER 3 ${odds[2]}% // ANTI-EXPLOIT ${odds[3]}%</p>` : '')
      + '<p class="store-need"></p>'
      + `<div class="booster-buy-row"><span class="booster-owned"></span>${box ? '' : '<button type="button" class="store-buy store-master" hidden>USE A MASTER KEY</button>'}<button type="button" class="store-buy store-pay">BUY</button></div>`;
    const buy = (master) => {
      if (!box && !Progress.exploitInfo(id).unlocked) { SFX.play('denied'); return; }
      if (!Progress.payFor(id, master)) {
        SFX.play('denied');
        say(`NOT ENOUGH // ${itemName(id)} NEEDS ${Progress.missing(id).map(([res, n]) => `${n} MORE ${RES_INFO[res].name}`).join(', ')}`);
        return;
      }
      Progress.addReserve(id);
      SFX.play('egg');
      say(`BOUGHT // ${itemName(id)}${master ? ' WITH A MASTER KEY' : ''}: TAKE IT INTO A GAME FROM A RESERVE SLOT ON THE MAIN MENU`);
      if (typeof showKeys === 'function') showKeys();
      if (typeof refreshReserveRow === 'function') refreshReserveRow();
      render();
    };
    item.querySelector('.store-pay').addEventListener('click', () => buy(false));
    const m = item.querySelector('.store-master');
    if (m) m.addEventListener('click', () => buy(true));
    parent.appendChild(item);
  }
  const reserveShop = document.getElementById('reserve-shop');
  for (const id of Progress.exploitOrder()) if (Progress.sellable(id)) shopItem(id, reserveShop);
  const boxShop = document.getElementById('box-shop');
  for (const id of Progress.boxIds()) shopItem(id, boxShop);
  // (the BLACK MARKET's look: the currency sign's tilted, glowing sign in the corner)
  document.getElementById('store-sign').innerHTML = CURRENCY_SVG.repeat(3);
  const claimBtn = document.getElementById('daily-claim');
  claimBtn.addEventListener('click', () => {
    if (window.dailyDrop && window.dailyDrop.claim()) say('CLAIMED // YOUR FREE EXPLOIT IS ON THE EXPLOIT BUTTON');
    render();
  });

  function render() {
    const keys = Progress.keys();
    menu.querySelectorAll('.booster-item:not(.reserve-item)').forEach((item) => {
      const b = boosters[item.dataset.booster];
      const n = Progress.boosters(item.dataset.booster);
      item.querySelector('.booster-owned').textContent = n ? `OWNED \u00d7${n}` : '';
      item.querySelector('.store-buy').classList.toggle('short', keys < b.cost);
    });
    menu.querySelectorAll('.reserve-item').forEach((item) => {
      const id = item.dataset.reserve;
      const box = Progress.isBox(id);
      const info = box ? { unlocked: true } : Progress.exploitInfo(id);
      const n = Progress.reserves(id);
      const missing = Progress.missing(id);
      item.classList.toggle('locked', !info.unlocked);
      item.querySelector('.booster-owned').textContent = !info.unlocked ? `UNLOCKS AT LV ${info.level}` : n ? `OWNED \u00d7${n}` : '';
      item.querySelector('.store-need').textContent = info.unlocked && missing.length
        ? `NEED ${missing.map(([res, k]) => `${k} MORE ${RES_INFO[res].name}`).join(', ')}` : '';
      const btn = item.querySelector('.store-pay');
      btn.disabled = !info.unlocked;
      btn.classList.toggle('short', missing.length > 0);
      const m = item.querySelector('.store-master');
      if (m) m.hidden = !info.unlocked || !missing.length || Progress.res('master') < 1;
    });
    const claimable = !!(window.dailyDrop && window.dailyDrop.claimable());
    claimBtn.disabled = !claimable;
    claimBtn.textContent = claimable ? 'CLAIM' : 'CLAIMED \u2713';
    document.getElementById('daily-drop-state').textContent = claimable ? 'READY' : 'BACK TOMORROW';
    document.getElementById('store-key-count').innerHTML = `${KEY_SVG} ${keys.toLocaleString()}`;
    for (const [id, item] of Object.entries(ITEMS)) {
      const owned = item.owned();
      menu.querySelector(`.store-item[data-item="${id}"]`).classList.toggle('owned', owned);
      menu.querySelector(`[data-price="${id}"]`).textContent = owned ? 'OWNED' : item.price;
      const btn = menu.querySelector(`[data-buy="${id}"]`);
      btn.textContent = owned ? 'OWNED ✓' : 'BUY';
      btn.disabled = owned;
    }
    link.hidden = Unlocks.hasNoAds() || menuPane === 'store';
  }
  // (the preview: the store opens with the app)
  function buy(id) {
    if (ITEMS[id].owned()) return;
    SFX.play('denied');
    say('PURCHASES OPEN WITH THE APP // NOTHING WAS CHARGED');
  }
  function restore() {
    say('CHECKING YOUR PURCHASES...');
    SFX.play('dialup'); // (dialing in)
    setTimeout(() => {
      render();
      say(Unlocks.hasNoAds() || Unlocks.hasFullAccess()
        ? 'RESTORED // YOUR PURCHASES ARE BACK'
        : 'NOTHING TO RESTORE YET // PURCHASES OPEN WITH THE APP');
    }, 2000);
  }

  menu.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => buy(b.dataset.buy)));
  document.getElementById('store-restore').addEventListener('click', restore);
  // REMOVE ADS (the other tabs): over to the STORE, the item lit up for a moment
  link.addEventListener('click', () => {
    showMenuPane('store');
    const item = menu.querySelector('.store-item[data-item="remove-ads"]');
    item.classList.remove('flash');
    void item.offsetWidth;
    item.classList.add('flash');
  });
  // A purchase (or a restore) redraws the store and earns INDIE SUPPORTER
  Unlocks.onChange(() => {
    render();
    announce(Progress.check());
  });
  render();
  return { render };
})();
