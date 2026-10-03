// STORE: the MENU's fourth tab. The DAILY DROP to claim (script.js's dailyDrop), the BOOSTERS
// bought with KEYS (script.js's BOOSTERS, Progress's wallet), and two purchases: REMOVE ADS (no ads, nothing unlocked) and FULL
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
  const claimBtn = document.getElementById('daily-claim');
  claimBtn.addEventListener('click', () => {
    if (window.dailyDrop && window.dailyDrop.claim()) say('CLAIMED // YOUR FREE EXPLOIT IS ON THE EXPLOIT BUTTON');
    render();
  });

  function render() {
    const keys = Progress.keys();
    menu.querySelectorAll('.booster-item').forEach((item) => {
      const b = boosters[item.dataset.booster];
      const n = Progress.boosters(item.dataset.booster);
      item.querySelector('.booster-owned').textContent = n ? `OWNED \u00d7${n}` : '';
      item.querySelector('.store-buy').classList.toggle('short', keys < b.cost);
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
    }, 1300);
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
