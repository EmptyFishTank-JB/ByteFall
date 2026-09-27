// STORE: the MENU's fourth tab. Two purchases: REMOVE ADS (no ads, nothing unlocked) and FULL
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
  function render() {
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
    setTimeout(() => {
      render();
      say(Unlocks.hasNoAds() || Unlocks.hasFullAccess()
        ? 'RESTORED // YOUR PURCHASES ARE BACK'
        : 'NOTHING TO RESTORE YET // PURCHASES OPEN WITH THE APP');
    }, 700);
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
