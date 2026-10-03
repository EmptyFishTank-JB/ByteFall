// THE BOTS' PIXEL ART: BOT, GRIFTER, BUNKER and GLITCH on one 16x17 grid (their shapes, every
// face, the sweat and the teeth; style.css shows the ones a bot, level and mood call for). Put into
// the VS CPU's face (#cpu-face) as the page loads; minibot.js copies it for the wanderers and the
// tutorial's narrator. Kept here, not in index.html, so the dev page's bot sandbox draws the same.
const BOT_SVG = `
<svg class="cpu-bot" viewBox="0 0 16 17" shape-rendering="crispEdges">
  <defs>
    <!-- Mosaic filters for switching bots: sample one pixel per 1.5 / 2 unit block, grow it to fill the block -->
    <filter id="bot-pix2" x="-3" y="-3" width="22" height="23" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
      <feFlood x="0" y="0" width="1" height="1" flood-color="#000"/>
      <feComposite width="1.5" height="1.5"/>
      <feTile result="grid"/>
      <feComposite in="SourceGraphic" in2="grid" operator="in"/>
      <feMorphology operator="dilate" radius="0.75"/>
    </filter>
    <filter id="bot-pix4" x="-3" y="-3" width="22" height="23" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">
      <feFlood x="0" y="0" width="1" height="1" flood-color="#000"/>
      <feComposite width="2" height="2"/>
      <feTile result="grid"/>
      <feComposite in="SourceGraphic" in2="grid" operator="in"/>
      <feMorphology operator="dilate" radius="1"/>
    </filter>
  </defs>
  <g class="bot-swap">
  <g class="bot">
    <g class="bot-body">
      <g class="shape shape-bot">
        <rect x="2" y="3" width="12" height="10"/>
        <g class="arm arm-l"><rect x="0" y="6" width="2" height="1"/><rect x="0" y="9" width="2" height="1"/></g>
        <g class="arm arm-r"><rect x="14" y="6" width="2" height="1"/><rect x="14" y="9" width="2" height="1"/></g>
        <rect x="5" y="1" width="1" height="2"/><rect x="10" y="1" width="1" height="2"/>
      </g>
      <g class="shape shape-grifter">
        <rect x="2" y="3" width="12" height="10"/>
        <rect class="arm arm-l" x="0" y="7" width="2" height="2"/><rect class="arm arm-r" x="14" y="7" width="2" height="2"/>
        <rect x="2" y="1" width="1" height="2"/><rect x="3" y="2" width="1" height="1"/>
        <rect x="13" y="1" width="1" height="2"/><rect x="12" y="2" width="1" height="1"/>
      </g>
      <g class="shape shape-bunker">
        <rect x="1" y="4" width="14" height="9"/>
        <rect x="3" y="2" width="10" height="2"/>
        <rect class="arm arm-l" x="0" y="8" width="1" height="3"/><rect class="arm arm-r" x="15" y="8" width="1" height="3"/>
      </g>
      <g class="shape shape-glitch">
        <rect class="slice slice-a" x="2" y="3" width="12" height="3"/>
        <rect class="slice slice-b" x="2" y="6" width="12" height="4"/>
        <rect class="slice slice-c" x="2" y="10" width="12" height="3"/>
        <rect class="arm arm-l" x="0" y="5" width="2" height="1"/><rect class="arm arm-r" x="14" y="10" width="2" height="1"/>
        <rect x="8" y="1" width="1" height="2"/>
      </g>
      <rect x="4" y="13" width="1" height="2" class="leg leg-a"/><rect x="6" y="13" width="1" height="2" class="leg leg-b"/>
      <rect x="9" y="13" width="1" height="2" class="leg leg-a"/><rect x="11" y="13" width="1" height="2" class="leg leg-b"/>
    </g>
    <g class="bot-face">
      <g class="eyes eyes-open"><rect x="5" y="6" width="2" height="2"/><rect x="9" y="6" width="2" height="2"/></g>
      <g class="eyes eyes-happy"><rect x="5" y="7" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/></g>
      <g class="eyes eyes-x"><rect x="5" y="5" width="1" height="1"/><rect x="7" y="5" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/></g>
      <g class="eyes eyes-squint"><rect x="5" y="7" width="2" height="1"/><rect x="9" y="7" width="2" height="1"/></g>
      <g class="eyes eyes-hit"><rect x="5" y="5" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/></g>
      <g class="eyes eyes-wide"><rect x="5" y="5" width="2" height="3"/><rect x="9" y="5" width="2" height="3"/></g>
      <g class="eyes eyes-devious"><rect x="4" y="5" width="3" height="1"/><rect x="11" y="4" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="5" y="7" width="2" height="1"/><rect x="9" y="7" width="2" height="1"/></g>
      <g class="eyes eyes-annoyed"><rect x="4" y="7" width="3" height="1"/><rect x="9" y="7" width="3" height="1"/></g>
      <g class="eyes eyes-angry"><rect x="4" y="5" width="1" height="1"/><rect x="5" y="6" width="2" height="1"/><rect x="5" y="7" width="2" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="9" y="6" width="2" height="1"/><rect x="9" y="7" width="2" height="1"/></g>
      <rect class="mouth mouth-open" x="7" y="10" width="2" height="1"/>
      <rect class="mouth mouth-smirk" x="8" y="10" width="3" height="1"/>
      <rect class="mouth mouth-flat" x="6" y="10" width="4" height="1"/>
      <g class="mouth mouth-smile"><rect x="5" y="10" width="1" height="1"/><rect x="6" y="11" width="4" height="1"/><rect x="10" y="10" width="1" height="1"/></g>
      <g class="mouth mouth-frown"><rect x="5" y="11" width="1" height="1"/><rect x="6" y="10" width="4" height="1"/><rect x="10" y="11" width="1" height="1"/></g>
      <rect class="mouth mouth-under" x="7" y="11" width="2" height="1"/>
      <g class="mouth mouth-grin"><rect x="4" y="9" width="1" height="1"/><rect x="5" y="10" width="6" height="1"/><rect x="11" y="9" width="1" height="1"/></g>
      <g class="mouth mouth-teeth"><rect x="5" y="10" width="6" height="2"/></g>
      <!-- More faces (the start screen's wanderers, and anywhere else): tired, love, pant, wavy, O -->
      <g class="eyes eyes-tired"><rect x="5" y="7" width="2" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="9" y="7" width="2" height="1"/><rect x="11" y="8" width="1" height="1"/></g>
      <g class="eyes eyes-heart"><rect x="4" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="4" y="6" width="3" height="1"/><rect x="5" y="7" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="9" y="6" width="3" height="1"/><rect x="10" y="7" width="1" height="1"/></g>
      <g class="mouth mouth-pant"><rect x="6" y="10" width="4" height="1"/><rect class="pant-low" x="6" y="11" width="4" height="1"/></g>
      <g class="mouth mouth-wavy"><rect x="5" y="11" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/><rect x="10" y="10" width="1" height="1"/></g>
      <rect class="mouth mouth-o" x="7" y="10" width="2" height="2"/>
      <!-- Skeptical: one eye narrowed under a low brow, the other wide under a raised one -->
      <g class="eyes eyes-brow"><rect x="4" y="6" width="3" height="1"/><rect x="5" y="7" width="2" height="1"/><rect x="9" y="4" width="3" height="1"/><rect x="9" y="6" width="2" height="2"/></g>
    </g>
    <rect class="sweat" x="13" y="3" width="1" height="2"/>
    <g class="teeth"><rect x="6" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="10" y="10" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/></g>
  </g>
  </g>
</svg>
`;
document.querySelectorAll('#cpu-face').forEach((el) => {
  if (!el.querySelector('.cpu-bot')) el.insertAdjacentHTML('afterbegin', BOT_SVG);
});
