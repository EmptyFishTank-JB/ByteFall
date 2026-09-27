// Small copies of the CPU's pixel face (index.html's #cpu-face) for the tutorial's narrator and
// the start screen's wanderers: the same shapes, colors, moods and animations (style.css's
// .cpu-face rules), set by data-bot, data-level and data-mood.
function miniBot(bot = 'bot', level = 'normal') {
  const el = document.createElement('div');
  el.className = 'cpu-face mini-bot';
  el.dataset.bot = bot;
  el.dataset.level = level;
  el.dataset.mood = 'idle';
  el.setAttribute('aria-hidden', 'true');
  const svg = document.querySelector('#cpu-face .cpu-bot').cloneNode(true);
  const defs = svg.querySelector('defs'); // (the swap filters: one copy on the page is enough)
  if (defs) defs.remove();
  el.appendChild(svg);
  return el;
}
