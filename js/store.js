// STORE: the MENU's fourth tab. The DAILY DROP to claim (script.js's dailyDrop), the PATCHES
// bought with KEYS (script.js's BOOSTERS, Progress's wallet), STARTER EXPLOITS and BLACK BOXES
// bought with KEYS and RESOURCES (ECONOMY.md), and two purchases: REMOVE ADS (no ads, nothing unlocked) and FULL
// ACCESS (everything that unlocks by level, and no ads; for a REMOVE ADS owner, the upgrade at the
// difference), plus RESTORE PURCHASES. In the app's RELEASE edition they're Google Play's
// (billing.js), at its prices; on the website a preview: BUY and RESTORE say the store isn't open
// and charge nothing. In ByteFall Test (with test ads) BUY pretends: TEST PURCHASES, below.
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

  // (a section brought into view at the top of the STORE's list: patches, starters, boxes)
  function show(sec) {
    const scroll = menu.querySelector('.store-scroll');
    const head = sec && menu.querySelector(`.store-sub[data-sec="${sec}"]`);
    if (!scroll) return;
    requestAnimationFrame(() => {
      scroll.scrollTop = head ? Math.max(0, scroll.scrollTop + head.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 8) : 0;
    });
  }
  // PRICES TODAY: a gauge from LOW to HIGH and why (the day's sale or HIGH DEMAND, YOUR DEAL), and
  // each section's head its kind's change
  function renderPrices() {
    const p = Progress.pricing();
    const el = document.getElementById('price-gauge');
    const pos = p.overall < 0.8 ? 0 : p.overall < 0.95 ? 1 : p.overall <= 1.05 ? 2 : p.overall <= 1.15 ? 3 : 4;
    const why = [p.label && `${p.label} // ${p.note}`, p.deal && `YOUR DEAL // ${Math.round(p.deal * 100)}% OFF`].filter(Boolean).join(' + ') || 'NORMAL PRICES TODAY';
    const rank = p.rankUp ? ` (DECRYPTOR +${p.rankUp}%)` : ''; // (a rank's prices: up to match what it earns)
    el.className = `price-gauge pos-${pos}`;
    el.innerHTML = `<span class="pg-row"><span class="pg-label">PRICES</span><span class="pg-end">LOW</span><span class="pg-bar">${[0, 1, 2, 3, 4].map((i) => `<i${i === pos ? ' class="on"' : ''}></i>`).join('')}</span><span class="pg-end">HIGH</span></span><span class="pg-why">${why}${rank}</span>`;
    el.setAttribute('aria-label', `Prices today: ${why}`);
    for (const h of menu.querySelectorAll('.store-sub[data-kind]')) {
      let tag = h.querySelector('.sub-tag');
      const pct = Math.round((p.mults[h.dataset.kind] - 1) * 100);
      if (!pct) { if (tag) tag.remove(); continue; }
      if (!tag) { tag = document.createElement('b'); tag.className = 'sub-tag'; h.appendChild(tag); }
      tag.textContent = `${pct > 0 ? '+' : ''}${pct}%`;
      tag.classList.toggle('up', pct > 0);
    }
  }
  function say(text) {
    msgEl.textContent = text;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msgEl.textContent = ''; }, 5000);
  }
  // WATCH AD (the Android app: ads.js's RewardAd): a patch with adPerDay (RESTORE POINT) is free for
  // a rewarded ad, that many a day (the UTC day, as the dailies), so its KEYS price still means
  // something. Given only once the ad's watched through
  const AD_KEY = 'bytefall-ad-rewards';
  const adsOn = () => !!(window.RewardAd && window.RewardAd.available());
  const adCounts = () => {
    try {
      const v = JSON.parse(localStorage.getItem(AD_KEY) || '{}');
      return v.day === todayKey() ? v.n || {} : {};
    } catch (e) { return {}; }
  };
  const adLeft = (id) => Math.max(0, (boosters[id].adPerDay || 0) - (adCounts()[id] || 0));
  const adUsed = (id) => {
    const n = adCounts();
    n[id] = (n[id] || 0) + 1;
    try { localStorage.setItem(AD_KEY, JSON.stringify({ day: todayKey(), n })); } catch (e) {}
  };
  let adLoading = false;
  const PLAY_SVG = '<svg class="key-ico" viewBox="0 0 7 9" aria-hidden="true"><path d="M1 0h1v1h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1v1H1z" fill="currentColor"/></svg>';
  const AD_HTML = (left) => `<span class="buy-word">${PLAY_SVG} WATCH AD</span><span class="buy-keys ad-left">${adLoading ? 'LOADING...' : left ? `FREE // ${left} TODAY` : 'TOMORROW'}</span>`;

  // PATCHES (BOOSTERS in the code): each with what it does, how many are owned, and BUY for its price in KEYS
  const shop = document.getElementById('booster-shop');
  const boosters = window.BOOSTERS || {};
  for (const [id, b] of Object.entries(boosters)) {
    const item = document.createElement('div');
    item.className = 'store-item booster-item';
    item.dataset.booster = id;
    item.innerHTML = `<h3><span class="store-ico bracketed"><span class="ico-br">[</span>${BOOSTER_SVG[id] || ''}<span class="ico-br">]</span></span><span class="store-name">${b.name}</span></h3><p class="store-desc">${b.desc}</p>`
      // (no resources in a patch's price: WATCH AD, where there is one, takes that room on the left, level with BUY)
      + `<div class="store-deal"><div class="store-terms${b.adPerDay ? ' with-ad' : ''}">${b.adPerDay ? '<button type="button" class="store-buy store-ad" hidden></button>' : ''}<span class="booster-owned"></span></div><div class="store-btns"><button type="button" class="store-buy store-pay">${BUY_HTML(Progress.cost('patch', b.cost))}</button></div></div>`;
    const adBtn = item.querySelector('.store-ad');
    if (adBtn) {
      adBtn.addEventListener('click', async () => {
        if (adLoading || adLeft(id) <= 0) { SFX.play('denied'); return; }
        adLoading = true;
        render();
        const r = await window.RewardAd.watch();
        adLoading = false;
        if (r.earned) {
          adUsed(id);
          Progress.addBooster(id);
          SFX.play('egg');
          say(`EARNED // ${b.name}`);
        } else say(r.error ? 'NO AD RIGHT NOW // TRY AGAIN LATER' : 'AD CLOSED EARLY // NO REWARD');
        render();
      });
    }
    item.querySelector('.store-pay').addEventListener('click', () => {
      if (!Progress.spendKeys(Progress.cost('patch', b.cost))) {
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
    renderPrices();
    const keys = Progress.keys();
    menu.querySelectorAll('.booster-item:not(.starter-item)').forEach((item) => {
      const b = boosters[item.dataset.booster];
      const n = Progress.boosters(item.dataset.booster);
      item.querySelector('.booster-owned').textContent = n ? `OWNED \u00d7${n}` : '';
      const cost = Progress.cost('patch', b.cost); // (today's price)
      item.querySelector('.store-pay').innerHTML = BUY_HTML(cost); // (KEYS on BUY)
      item.querySelector('.store-pay').classList.toggle('short', keys < cost);
      const ad = item.querySelector('.store-ad');
      if (ad) { // (only in the app, where ads.js, loaded after this, has made RewardAd)
        const left = adLeft(item.dataset.booster);
        ad.hidden = !adsOn();
        ad.innerHTML = AD_HTML(left);
        ad.disabled = adLoading || !left;
      }
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
    renderBuyTest();
    link.hidden = Unlocks.hasNoAds() || menuPane === 'store';
  }
  const upgradeNote = document.getElementById('store-upgrade');
  const preview = menu.querySelector('.store-preview');
  preview.hidden = Billing.on;
  let asked = false; // (a BUY or RESTORE waiting on Google Play: only those hear it failed)
  // TEST PURCHASES (SETTINGS' // TEST PURCHASES, builds with test ads only, js/ads-config.js's testing):
  // in the Google Play build, BUY is Google Play's (a license tester pays with the test card, nothing
  // charged) and RESET TEST PURCHASES uses up what's owned so it can be bought again; in ByteFall
  // Test, BUY pretends (owned at once, nothing charged) and RESET takes it back. Never in a release
  // with real ads, nor on the website
  const testing = () => !!(window.BYTEFALL_APP && window.BYTEFALL_ADS && window.BYTEFALL_ADS.testing);
  const pretending = () => testing() && !Billing.on;
  let resetting = false;
  function renderBuyTest() {
    const box = document.getElementById('buy-test');
    if (!box) return;
    box.hidden = !testing();
    if (pretending()) preview.textContent = 'TEST // BUY PRETENDS: NOTHING IS CHARGED';
    if (box.hidden) return;
    const has = (yes, name) => `${name}: ${yes ? 'OWNED' : 'NOT OWNED'}`;
    document.getElementById('buy-test-status').textContent = resetting ? 'Using up the test purchases...'
      : `${Billing.on ? 'Google Play says' : 'Pretend purchases'}: ${has(Unlocks.hasFullAccess(), 'FULL ACCESS')}, ${has(Unlocks.owned().noAds || Unlocks.hasFullAccess(), 'REMOVE ADS')}.`;
    document.getElementById('buy-test-note').textContent = Billing.on
      ? 'BUY in the STORE is Google Play\'s: on a license tester\'s account, pay with the test card and nothing is charged. RESET uses up what\'s owned so it can be bought again (REMOVE ADS, then FULL ACCESS as the UPGRADE).'
      : 'BUY in the STORE owns it at once here, nothing charged. RESET takes it back, ads and all.';
  }
  document.getElementById('buy-test-reset').addEventListener('click', () => {
    if (!testing()) return;
    SFX.play('click');
    if (Billing.on) {
      if (!Billing.reset()) { say('TEST // THIS BUILD CAN\'T RESET PURCHASES'); return; }
      resetting = true;
      asked = true;
    } else Unlocks.pretend(false, false);
    renderBuyTest();
  });
  function buy(id) {
    if (ITEMS[id].owned()) return;
    if (Billing.on) { asked = true; Billing.buy(deal(id).product); return; } // (Google Play's sheet; how it went: below)
    if (pretending()) { // (ByteFall Test: owned at once, nothing charged; the UPGRADE as FULL ACCESS)
      const name = id === 'full-access' ? (deal(id) === UPGRADE ? 'FULL ACCESS (UPGRADE)' : 'FULL ACCESS') : 'REMOVE ADS';
      Unlocks.pretend(id === 'full-access' || Unlocks.hasFullAccess(), id === 'remove-ads' || Unlocks.owned().noAds);
      SFX.play('egg');
      say(`TEST // ${name} IS YOURS // NOTHING WAS CHARGED`);
      return;
    }
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
    requestAnimationFrame(() => item.scrollIntoView({ block: 'center' }));
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
      if (resetting) { // (TEST PURCHASES: used up, so they can be bought again)
        resetting = false;
        render();
        say(e.owned.length ? 'TEST // SOME PURCHASES ARE STILL OWNED' : 'TEST // PURCHASES RESET: BUY THEM AGAIN');
        return;
      }
      render();
      say(e.owned.length ? 'RESTORED // YOUR PURCHASES ARE BACK'
        : e.pending.length ? 'A PAYMENT IS STILL PENDING // IT UNLOCKS ONCE GOOGLE PLAY HAS IT'
          : 'NOTHING TO RESTORE // THIS GOOGLE ACCOUNT HASN\'T BOUGHT ANYTHING YET');
    } else if (e.type === 'failed' && asked) {
      asked = false;
      if (resetting) { resetting = false; renderBuyTest(); }
      if (e.reason === 'canceled') say('CANCELED // NOTHING WAS CHARGED');
      else if (e.reason === 'missing') { // (the product isn't made, or isn't active, in Play Console)
        SFX.play('denied');
        say(testing() ? 'TEST // NOT SET UP IN PLAY CONSOLE YET (OR NOT ACTIVE)' : 'NOT FOR SALE RIGHT NOW // NOTHING WAS CHARGED');
      }
      else {
        SFX.play('denied');
        say('GOOGLE PLAY ISN\'T ANSWERING // TRY AGAIN IN A LITTLE WHILE');
      }
    }
  });
  render();
  // (js/ads-config.js, which says whether this build has test ads, loads after this)
  document.addEventListener('DOMContentLoaded', renderBuyTest);
  return { render, show };
})();
