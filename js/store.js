// STORE: the MENU's fourth tab. The DAILY DROP to claim (script.js's dailyDrop), the BOOSTERS
// bought with KEYS (script.js's BOOSTERS, Progress's wallet), STARTER EXPLOITS and BLACK BOXES
// bought with KEYS and RESOURCES (ECONOMY.md), and two purchases: REMOVE ADS (no ads, nothing unlocked) and FULL
// ACCESS (everything that unlocks by level, and no ads; for a REMOVE ADS owner, the upgrade at the
// difference), plus RESTORE PURCHASES. In the app's RELEASE edition they're Google Play's
// (billing.js), at its prices; elsewhere (the website, ByteFall Test) a preview: BUY and RESTORE
// say the store isn't open and charge nothing.
// A REMOVE ADS link sits at the foot of the menu's other tabs while there are ads.
const Store = (() => {
  // (the preview's prices; the RELEASE edition shows Google Play's, in the player's currency)
  const ITEMS = {
    'remove-ads': { price: '$1.99', product: Billing.REMOVE_ADS, owned: () => Unlocks.hasNoAds() },
    'full-access': { price: '$4.99', product: Billing.FULL, owned: () => Unlocks.hasFullAccess() },
  };
  const UPGRADE = { price: '$2.99', product: Billing.UPGRADE };
  // (FULL ACCESS for a REMOVE ADS owner: the upgrade, so nobody pays more than FULL ACCESS's price)
  const deal = (id) => (id === 'full-access' && Unlocks.hasNoAds() && !Unlocks.hasFullAccess() ? UPGRADE : ITEMS[id]);
  const priceOf = (d) => (Billing.on ? Billing.price(d.product) : d.price);
  const NAMES = { [Billing.REMOVE_ADS]: 'REMOVE ADS', [Billing.FULL]: 'FULL ACCESS', [Billing.UPGRADE]: 'FULL ACCESS' };
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
    item.innerHTML = `<h3><span class="store-ico bracketed"><span class="ico-br">[</span>${BOOSTER_SVG[id] || ''}<span class="ico-br">]</span></span><span class="store-name">${b.name}</span></h3><p class="store-desc">${b.desc}</p>`
      + `<div class="store-deal"><div class="store-terms"><div class="store-costs"></div><span class="booster-owned"></span></div><div class="store-btns"><button type="button" class="store-buy">${BUY_HTML(b.cost)}</button></div></div>`;
    item.querySelector('.store-buy').addEventListener('click', () => {
      if (!Progress.spendKeys(b.cost)) {
        SFX.play('denied');
        flashShort(item);
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
  // STARTER EXPLOITS and BLACK BOXES: each with its icon, its price in KEYS and RESOURCES
  // (Progress; ECONOMY.md), what's still short of it, how many are owned and BUY; an exploit short of
  // its price can take a MASTER KEY instead. The exploits in the order they unlock (the locked ones
  // show their level; BLACK BOX itself isn't sold); each BLACK BOX shows its odds
  function shopItem(id, parent) {
    const item = document.createElement('div');
    item.className = 'store-item booster-item starter-item';
    item.dataset.starter = id;
    const box = Progress.isBox(id);
    const odds = box ? Progress.boxOdds(id) : null;
    item.innerHTML = `<h3><span class="store-ico bracketed">${bracketIcon(id)}</span><span class="store-name">${itemName(id)}</span>`
      + `<span class="store-price">${box ? '' : `TIER ${Progress.tierOf(id) + 1}`}</span></h3>`
      + `<p class="store-desc">${itemDesc(id)}</p>`
      + (box ? `<p class="store-odds">TIER 1 EXPLOIT ${odds[0]}% // TIER 2 ${odds[1]}% // TIER 3 ${odds[2]}% // INFECTION ${odds[3]}%</p>` : '')
      // (the price and how many are owned as one block, BUY level with it; what's short pulses red)
      + `<div class="store-deal"><div class="store-terms"><div class="store-costs"></div><span class="booster-owned"></span></div><div class="store-btns">${box ? '' : `<button type="button" class="store-buy store-master" hidden title="Use a MASTER KEY in place of the price" aria-label="Use a MASTER KEY">USE ${RES_INFO.master.svg}</button>`}<button type="button" class="store-buy store-pay">${BUY_HTML(Progress.price(id).keys)}</button></div></div>`;
    const buy = (master) => {
      if (!box && !Progress.exploitInfo(id).unlocked) { SFX.play('denied'); return; }
      if (!Progress.payFor(id, master)) {
        SFX.play('denied');
        flashShort(item); // (what's short flashes; no words)
        return;
      }
      Progress.addStarter(id);
      SFX.play('egg');
      say(`BOUGHT // ${itemName(id)}${master ? ' WITH A MASTER KEY' : ''}: TAKE IT INTO A GAME FROM A STARTER SLOT ON THE MAIN MENU`);
      if (typeof showKeys === 'function') showKeys();
      if (typeof refreshStarterRow === 'function') refreshStarterRow();
      render();
    };
    item.querySelector('.store-pay').addEventListener('click', () => buy(false));
    const m = item.querySelector('.store-master');
    if (m) m.addEventListener('click', () => buy(true));
    parent.appendChild(item);
  }
  const starterShop = document.getElementById('starter-shop');
  for (const id of Progress.exploitOrder()) if (Progress.sellable(id)) shopItem(id, starterShop);
  const boxShop = document.getElementById('box-shop');
  for (const id of Progress.boxIds()) shopItem(id, boxShop);
  // (the BLACK MARKET's look: the currency sign's tilted, glowing sign in the corner)
  document.getElementById('store-sign').innerHTML = CURRENCY_SVG.repeat(3);
  const claimBtn = document.getElementById('daily-claim');
  claimBtn.addEventListener('click', () => {
    const got = !!(window.dailyDrop && window.dailyDrop.claim());
    render();
    if (got) { // (what it gave, right under CLAIM: no pop-up)
      const line = document.getElementById('daily-got');
      line.classList.remove('fresh');
      void line.offsetWidth;
      line.classList.add('fresh');
    }
  });

  function render() {
    const keys = Progress.keys();
    menu.querySelectorAll('.booster-item:not(.starter-item)').forEach((item) => {
      const b = boosters[item.dataset.booster];
      const n = Progress.boosters(item.dataset.booster);
      item.querySelector('.booster-owned').textContent = n ? `OWNED \u00d7${n}` : '';
      item.querySelector('.store-buy').innerHTML = BUY_HTML(b.cost); // (KEYS on BUY)
      item.querySelector('.store-buy').classList.toggle('short', keys < b.cost);
    });
    menu.querySelectorAll('.starter-item').forEach((item) => {
      const id = item.dataset.starter;
      const box = Progress.isBox(id);
      const info = box ? { unlocked: true } : Progress.exploitInfo(id);
      const n = Progress.starters(id);
      const missing = Progress.missing(id);
      item.classList.toggle('locked', !info.unlocked);
      item.querySelector('.booster-owned').textContent = !info.unlocked ? `UNLOCKS AT LV ${info.level}` : n ? `OWNED \u00d7${n}` : '';
      item.querySelector('.store-costs').innerHTML = costHtml(Progress.price(id), false); // (have / cost: green, enough of it; red, short; KEYS on BUY)
      item.querySelector('.store-pay').innerHTML = BUY_HTML(Progress.price(id).keys);
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
    const got = window.dailyDrop && window.dailyDrop.got ? window.dailyDrop.got() : '';
    const gotEl = document.getElementById('daily-got');
    gotEl.hidden = !got;
    gotEl.textContent = got ? `CLAIMED TODAY // ${got}` : '';
    if (window.dailyDrop) { // LOGIN STREAK: days in a row, a pip for each day of this run of 7
      const s = window.dailyDrop.streak();
      const pips = Array.from({ length: s.every }, (_, i) => `<i class="${i < s.into ? 'on' : ''}"></i>`).join('');
      document.getElementById('login-streak').innerHTML = `LOGIN STREAK <b>${s.days}</b> ${s.days === 1 ? 'DAY' : 'DAYS'} <span class="streak-pips">${pips}</span> ${s.paysToday ? `+${s.masters} MASTER KEYS TODAY` : s.into === s.every ? `+${s.masters} MASTER KEYS CLAIMED` : `${s.every - s.into} TO +${s.masters} MASTER KEYS`}`;
    }
    document.getElementById('store-key-count').innerHTML = `${KEY_SVG} ${keys.toLocaleString()}`;
    for (const [id, item] of Object.entries(ITEMS)) {
      const owned = item.owned();
      const d = deal(id);
      menu.querySelector(`.store-item[data-item="${id}"]`).classList.toggle('owned', owned);
      menu.querySelector(`[data-price="${id}"]`).textContent = owned ? 'OWNED' : priceOf(d);
      const btn = menu.querySelector(`[data-buy="${id}"]`);
      btn.textContent = owned ? 'OWNED ✓' : d === UPGRADE ? 'UPGRADE' : 'BUY';
      btn.disabled = owned;
    }
    upgradeNote.hidden = deal('full-access') !== UPGRADE;
    link.hidden = Unlocks.hasNoAds() || menuPane === 'store';
  }
  const upgradeNote = document.getElementById('store-upgrade');
  menu.querySelector('.store-preview').hidden = Billing.on;
  let asked = false; // (a BUY or RESTORE waiting on Google Play: only those hear it failed)
  function buy(id) {
    if (ITEMS[id].owned()) return;
    if (Billing.on) { asked = true; Billing.buy(deal(id).product); return; } // (Google Play's sheet; how it went: below)
    SFX.play('denied');
    say(window.BYTEFALL_APP ? 'PURCHASES ARE IN THE GOOGLE PLAY EDITION // NOTHING WAS CHARGED' : 'PURCHASES OPEN WITH THE APP // NOTHING WAS CHARGED');
  }
  function restore() {
    say('CHECKING YOUR PURCHASES...');
    SFX.play('dialup'); // (dialing in)
    if (Billing.on) { asked = true; Billing.restore(); return; } // (Google Play answers: below)
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
  // Google Play's answers (billing.js): the prices, and how a purchase or a restore went
  Billing.onEvent((e) => {
    if (e.type === 'products') render();
    else if (e.type === 'bought') {
      asked = false;
      if (e.owned.length) {
        SFX.play('egg');
        say(`THANK YOU // ${NAMES[e.owned[0]] || 'YOUR PURCHASE'} IS YOURS`);
      } else if (e.pending.length) say('PAYMENT PENDING // IT UNLOCKS ONCE GOOGLE PLAY HAS THE PAYMENT');
    } else if (e.type === 'owned' && e.restore) {
      asked = false;
      render();
      say(e.owned.length ? 'RESTORED // YOUR PURCHASES ARE BACK'
        : e.pending.length ? 'A PAYMENT IS STILL PENDING // IT UNLOCKS ONCE GOOGLE PLAY HAS IT'
          : 'NOTHING TO RESTORE // THIS GOOGLE ACCOUNT HASN\'T BOUGHT ANYTHING YET');
    } else if (e.type === 'failed' && asked) {
      asked = false;
      if (e.reason === 'canceled') say('CANCELED // NOTHING WAS CHARGED');
      else {
        SFX.play('denied');
        say('GOOGLE PLAY ISN\'T ANSWERING // TRY AGAIN IN A LITTLE WHILE');
      }
    }
  });
  render();
  return { render };
})();
