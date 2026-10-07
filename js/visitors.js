// VISITORS: seasonal characters passing through the wanderers' lane (wanderers.js runs them).
// HALLOWEEN (seasons.js): Frankenstein's monster, a mummy, the creature from the black lagoon,
// Nosferatu, a floating ghost, a flock of bats, a crow or two and a spider on its thread; NOVEMBER:
// a turkey, the crows, and migrating birds (geese in a V, ducks, songbirds, swallows; now and then
// one lands, pecks about and calls to a bot; poked, the flock bolts). Any time of year, rarely: the
// VIRUSES (the PHAGE, the BUG, the TROJAN, the WORM, RANSOMWARE, SPYWARE, ADWARE and the LOGIC BOMB: below), and
// numbered BITs a wanderer pushes in (makeScenery). The PHAGE, a bacteriophage (taller than the bots), walks in or pixelates in on the card, scuttles from spot to spot, glitching, and makes any bot it nears
// jump; poked, it's DELETED (pixelates out). Every so often one comes by (one visit at a time), crosses the card
// and goes; the monsters give a bot they pass a fright. Each can be poked: FRANKENSTEIN roars and
// stomps, the MUMMY groans, the CREATURE gurgles and splashes, NOSFERATU hisses and turns into
// bats, the GHOST says BOO (every bot near it jumps) and fades, bats scatter, crows take off
// cawing, the SPIDER scurries back up and the TURKEY gobbles and runs. The GREMLIN scurries up to
// the bots one after another to prank them (hehehe; they jump), then runs off; poked, it screeches
// and bolts. The BIG SPIDER scuttles and leaps about the card; poked, it hisses and leaps away.
// SCENERY: the scary tree a wanderer pushes onto the card (HALLOWEEN; makeScenery, wanderers.js does
// the pushing): black eyes and a frown. It stays for the visit, behind everything else; poked, it
// creaks and a bat flies out.
// WINTER (December and into January, under the holidays): snow falling, a penguin waddling by
// (poked: SQUAWK and a belly slide off) and a snowman pushed in. CHRISTMAS: reindeer trotting
// past (now and then the one with the glowing red nose; poked: a snort and a prance off) and a
// decorated evergreen with blinking lights. HANUKKAH: a dreidel spinning across and landing on a
// letter, and a menorah with that night's candles lit. KWANZAA: a kinara with that day's candles
// lit. NEW YEAR'S EVE and NEW YEAR: fireworks, and a sign with the year; at the player's own
// midnight on New Year's Eve the bots count down from ten and cheer.
// Stacked seasons (seasons.js) all send theirs; up to two pieces of scenery stand at once.
// Sprites are drawn as text: one letter a pixel (its color in `pal`, '.' left empty), in the bots'
// own pixel size, facing right; a second frame (b) steps the legs, flaps the wings or ripples a hem.
let hauntedForest = false; // (OCTOBER's HAUNTED FOREST, once it's come: up on every card, visitors.js)
try { localStorage.removeItem('bytefall-forest-month'); } catch (e) {} // (not kept between visits)
function createVisitors(api) {
  // The air: on the start screen the lane is the whole card, so what flies, falls or hangs
  // uses its full height (sky(f): that far up it, 0-1); in the game's short lane, the heights
  // it always had (`low`)
  const tall = () => (api.laneH ? api.laneH() : 0) > 150;
  const sky = (lo, hi, low) => (tall() ? rand(lo, hi) * api.laneH() : low());
  const ceiling = () => (tall() ? api.laneH() : 100);
  const U = 34 / 16; // (a pixel of the bots' 16-wide grid, in screen pixels)
  const swap = (rows, map) => rows.map((r) => r.replace(/./g, (c) => map[c] || c)); // (blinking: colors traded)
  const EVERGREEN = ['.......y.......', '......yyy......', '.......y.......', '.......g.......', '......ggG......', '.....grggG.....', '......ggG......', '.....gggoG.....', '....gggggGG....', '...gbggggggG...', '.....ggggG.....', '....ggrgggG....', '...gggggbggG...', '..gggoggggggG..', '....ggggggG....', '...ggbgggrgG...', '..gggggggggGG..', '.ggrggggoggggG.', 'gggggggggggggGG', '.RyR..ttT..ByB.', '.yyy..ttT..yyy.', '.RyR..ttT..ByB.'];
  const SPRITES = {
    frank: {
      pal: { h: '#1d1d1d', g: '#7fb069', G: '#5e8f4c', e: '#111111', b: '#a0a4aa', m: '#2a2a2a', s: '#2c3140', S: '#1e222d', p: '#3a3226', k: '#0d0d0d' },
      a: ['..hhhhhhhh..', '..hhhhhhhh..', '..gggggggg..', '..geeggeeg..', '..gggggggg..', '..gGmmmmGg..', '.b.gggggg.b.', '..SSssssSS..',
        '..sssssssggg', '..sssssssss.', '..SsssssssS.', '..ssssssss..', '..pppppppp..', '..ppp..ppp..', '..ppp..ppp..', '..ppp..ppp..', '.kkkk..kkkk.'],
      b: { 13: '..ppp..ppp..', 14: '.ppp....ppp.', 15: '.ppp....ppp.', 16: 'kkkk....kkkk' },
    },
    mummy: {
      pal: { w: '#e6dfc3', d: '#b3a88a', x: '#2a2418', y: '#ffd23f' },
      a: ['...wwwwww...', '..wwdwwwdw..', '..wxywwxyw..', '..wdwwwwdw..', '...wwddww...', '..dwwwwwwd..', '..wwwwwwwwww', '..wdwwwwdddw',
        '.dwwwdwwww..', '.d.wwwwdww..', 'd..wdwwwww..', '...wwwwdw...', '...ww..ww...', '...wd..dw...', '...ww..ww...', '..www..www..'],
      b: { 9: '..dwwwwdww..', 10: '.d.wdwwwww..', 13: '..wd....dw..', 14: '..ww....ww..', 15: '.www....www.' },
    },
    creature: {
      pal: { c: '#3f8f6b', l: '#6fcf9f', f: '#2a6b52', e: '#ffe066', k: '#10231a' },
      a: ['f.f.cccc.f.f', '.fffccccfff.', '..cccccccc..', '..cekccekc..', '..cccccccc..', '..ckkkkkkc..', '...cccccc...', '.cccllllccc.',
        'cc.cllllc.cc', 'c..cllllc..c', 'k..cllllc..k', '...cllllc...', '...cc..cc...', '...cc..cc...', '..ccc..ccc..', '.ffff..ffff.'],
      b: { 13: '..cc....cc..', 14: '.ccc....ccc.', 15: 'ffff....ffff' },
    },
    nosferatu: {
      pal: { p: '#d6d9c8', b: '#34324a', e: '#ff3b3b', t: '#ffffff', n: '#d6d9c8' },
      a: ['...pppp...', '..pppppp..', 'p.pppppp.p', '.ppeppepp.', '..pppppp..', '..ptpptp..', '...pppp...', '..bbbbbb..', '.bbbbbbbb.', '.bbbbbbbpn',
        '.bbbbbbb.n', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '.bbbbbbb..', '..bbbbbb..', '..bb..bb..', '..bb..bb..', '.bbb..bbb.'],
    },
    ghost: {
      pal: { w: '#f2f6ff', e: '#1b1d2a' },
      a: ['...wwww...', '.wwwwwwww.', 'wwwwwwwwww', 'wweewweeww', 'wweewweeww', 'wwwwwwwwww', 'wwwweewwww', 'wwwweewwww', 'wwwwwwwwww', 'wwwwwwwwww', 'w.ww.ww.ww'],
      b: { 10: 'ww.ww.ww.w' },
    },
    bat: {
      pal: { k: '#4a3a5c', r: '#ff3b5c' },
      a: ['k.....k', 'kk.k.kk', '.kkkkk.', '..krk..'],
      b: ['.......', '..kkk..', 'kkkkkkk', 'k.krk.k'],
    },
    spider: {
      pal: { k: '#3a2f48', l: '#5a4d6c', r: '#ff3b3b' },
      a: ['..l...l..', '.l.kkk.l.', 'l.krkrk.l', '.lkkkkkl.', 'l.l...l.l'],
      b: ['l.......l', '.llkkkll.', '..krkrk..', 'llkkkkkll', '..l...l..'],
    },
    turkey: {
      pal: { o: '#c96a2b', r: '#a8322a', t: '#d9a35a', b: '#6b4226', h: '#8fa9c0', e: '#111111', y: '#f2b632', w: '#d62f2f' },
      a: ['..ooo.......', '.orrro...hh.', 'orttto...hey', 'orttto...hw.', '.orttbbb.h..', '..obbbbbbh..', '..bbbbbbbb..', '...bbbbbbb..',
        '....bbbbb...', '.....y.y....', '.....y.y....', '....yy.yy...'],
      b: { 1: '.orrro......', 2: 'orttto......', 3: 'orttto......', 4: '.orttbbb....', 5: '..obbbbbbhh.', 6: '..bbbbbbbhey', 7: '...bbbbbbbw.',
        9: '.....y..y...', 10: '....y...y...', 11: '...yy...yy..' },
    },
    tree: {
      pal: { t: '#4a3528', T: '#2e2019', b: '#5e4634', k: '#000000', m: '#0a0604' }, // (black eyes, a frown)
      a: ['......b............b....', '.......b..b.......b.....', '.......b.b.......b.b....', '.....b..b........b.b....', '.....b..b.......b..b...b', '.b...b...b......b...b.b.', '..b.b....b.....b....bb..', '...bb.....b....b....b...', '....b.....b...b....b....', '.....b.....b..b...b.....', '......b....b.b...b......', '.......b....Tt...b..bbb.', 'b.......b...Tt..bbbb...b', '.b.......b..Ttbb.......b', '..bb......bTt.b.........', '....bb.....Ttb..........', '......bb..Ttttt.........', '........bbTtttt.........', '..........Ttttt.........', '..........Tkttk.........', '..........Tkttk.........', '..........Ttttt.........', '..........Ttmmt.........', '..........Tmmmm.........', '..........Tmttm.........', '..........Ttttt.........', '..........Ttttt.........', '.........Ttttttt........', '.........Ttmtttt........', '.........Ttttttt........', '.........Ttttttt........', '.........Ttttttt........', '.......ttTtttttttt......', '.....ttttTtttttttttt....'],
    },
    crow: {
      pal: { k: '#2c313b', K: '#4a5566', e: '#e0e0e0', o: '#8a8f98' },
      a: ['......kk.', '.....kkeo', 'kk..kkkk.', '.kkkkkKk.', '..kkkkk..', '...k.k...', '...k.k...'],
      b: ['.........', '.........', 'kk.......', '.kkkkkkk.', '..kkkkkke', '...k.k..o', '...k.k...'],
      // (flying: its wings open, flapping up and down, legs tucked)
      c: ['.kkk.....', '..kkk....', '...kkk.k.', 'kk..kkkeo', '.kkkkkkK.', '.........', '.........'],
      d: ['.........', '.........', '.......k.', 'kk..kkkeo', '.kkkkkkK.', '...kkk...', '....kkk..'],
    },
    // The VIRUS (any time of year, rarely): a bacteriophage, taller than the bots. A hexagonal head
    // with its DNA coiled inside (and eyes), a neck, a striped tail sheath, a base plate with pins,
    // and kinked tail fibers it walks on (all four stepping, in turn)
    virus: {
      pal: { h: '#5b7fd6', H: '#c9d8ff', d: '#ff4f86', k: '#111111', n: '#8fd0ff', t: '#a7a7a7', T: '#6a6a6a', p: '#4aa3d8', g: '#5fd35f', f: '#e3c23a' },
      a: ['.....hhhhh.....', '....hHHHHHh....', '...hHdHHdHHh...', '..hHHddHdHHHh..', '..hHdHHdHdHHh..', '..hHkHddHHkHh..', '..hHHdHHddHHh..', '...hHHddHdHh...', '....hHHHHHh....', '.....hhhhh.....',
        '......nnn......', '......tTt......', '......TtT......', '......tTt......', '......TtT......', '...f..tTt..f...', '..f.f.TtT.f.f..', '..f..ppppp..f..', '.f..f.g.g.f..f.', '.f..f.....f..f.', 'f...f.....f...f', 'f.............f'],
      // (the four fibers step in turn: a, the outer pair planted and the inner pair lifted; b, the
      // inner pair planted and the outer pair lifted)
      b: { 20: '.f.f.......f.f.', 21: '...f.......f...' },
    },
    // The BUG: the first virus, a spiky little red one that scuttles fast, lurching
    // HALLOWEEN's BIG SPIDER: the size of the viruses, seen from the front: a round body with a red
    // hourglass, red eyes, and four bent legs each side, the pairs lifting and reaching in turn
    bigspider: {
      pal: { b: '#2b2236', m: '#e0283e', h: '#3d3150', r: '#ff3030', l: '#6a5a84' },
      a: ['..l....bbbbb....l..', '..lll.bbbbbbb.lll..', '..ll.bbbmmmbbb.ll..', '.l.llbbbbmbbbbll.l.', '.l.l.bbbmmmbbb.l.l.', '.l.l.lbbbbbbbl.l.l.', '.l.l.llhhhhhll.l.l.', 'l..ll.hhrhrhh.ll..l', 'l..ll..hhhhh..ll..l', 'l..ll..l...l..ll..l'],
      b: ['..ll...bbbbb...ll..', '..l.l.bbbbbbb.l.l..', '..l..bbbmmmbbb..l..', '..lllbbbbmbbbblll..', '.l.l.bbbmmmbbb.l.l.', '.l.l.lbbbbbbbl.l.l.', '.ll..llhhhhhll..ll.', '.ll..lhhrhrhhl..ll.', '.ll..llhhhhhll..ll.', '.ll..ll.....ll..ll.'],
    },
    // The other VIRUSES: the WORM (segments that bunch and stretch as it inches), RANSOMWARE (a
    // padlock on legs), SPYWARE (a floating eye, its pupil darting), ADWARE (a pop-up window) and
    // the LOGIC BOMB (a walking bomb, its fuse sparking)
    worm: {
      pal: { g: '#7ed957', G: '#4e9e35', k: '#111111' },
      a: ['...............gg.', 'GgG.GgG.GgG.GgGgkg', 'GgG.GgG.GgG.GgGggg'],
      b: { 0: '......GgG.....gg..', 1: '...GgG...GgGGgGgkg', 2: '...GgG...GgGGgGggg' },
    },
    ransomware: {
      pal: { s: '#c0c6cf', S: '#7d848f', b: '#e8b923', B: '#a57f12', k: '#111111', r: '#ff3030', l: '#5a4a12' },
      a: ['...ssssss...', '..sS....Ss..', '..s......s..', '..s......s..', '.bbbbbbbbbb.', '.bBbbbbbbBb.', '.bbrbbbbrbb.', '.bbbbkkbbbb.', '.bbbbkkbbbb.', '.bbbbbkbbbb.', '.bBbbbbbbBb.', '.bbbbbbbbbb.', '..l......l..', '.l........l.'],
      b: { 12: '...l....l...', 13: '..l......l..' },
    },
    spyware: {
      pal: { W: '#c9ccd6', w: '#f2f2f2', i: '#2f7de0', k: '#111111', v: '#c92a3a' },
      a: ['..WWWWW..', '.WwwwvwW.', 'WwwiiiwwW', 'WwikkkiwW', 'WwikkkivW', 'WwikkkiwW', 'WwwiiiwwW', '.WwvwwwW.', '..WWWWW..'],
      b: { 3: 'WikkkiwwW', 4: 'WikkkivwW', 5: 'WikkkiwwW' },
    },
    adware: {
      pal: { t: '#1f3fbf', x: '#ff3b3b', F: '#808080', w: '#ffffff' },
      a: ['tttttttttttttttxxt', 'tttttttttttttttxxt', 'FwwwwwwwwwwwwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FFFFFFFFFFFFFFFFFF'],
    },
    logicbomb: {
      pal: { k: '#1b1b22', K: '#4a4a5c', f: '#b88a4a', s: '#ffd23f', S: '#ff7a1f', w: '#ffffff' },
      a: ['........s..', '.......sSs.', '......f.s..', '.....f.....', '....kkk....', '..kkkkkkk..', '.kKkkkkkkk.', 'kKkkkkkkkkk', 'kkkwkkkwkkk', 'kkkkkkkkkkk', '.kkkkkkkkk.', '..kkkkkkk..', '..k.....k..'],
      b: { 0: '.......s...', 1: '......SsS..', 12: '...k...k...' },
    },
    bug: {
      pal: { v: '#ff3b6b', s: '#c41f4a', o: '#ffd23f', w: '#ffffff', k: '#111111', m: '#3a0a14', l: '#c41f4a' },
      a: ['.....o.....', '..o..s..o..', '...svvvs...', '..vvvvvvv..', 'osvwkvwkvso', '..vvvvvvv..', '..vvmmmvv..', '...svvvs...', '..o.l.l.o..', '....l.l....'],
      b: { 8: '..o.l..lo..', 9: '...l...l...' },
    },
    // The TROJAN: under its disguise (a bot, wandering with the others), a wooden horse on wheels
    // with a red eye
    trojan: {
      pal: { w: '#9a6a35', W: '#5e3a18', r: '#ff2a2a', k: '#8a8a8a', g: '#d8d8d8' },
      a: ['......WW......', '.....WwwWW....', '....WwwwwwW...', '...WwwwrwwwW..', '...WwwwwwwwwWW', '...WwwwwWWwwww', '..WwwwwW..WWWW', '..WwwwwW......', '.WwwwwwwW.....', '.WwwwwwwwWWW..',
        'WwwwwwwwwwwwW.', 'WwwwwwwwwwwwW.', 'WWWWWWWWWWWWW.', '.kk.......kk..', 'kggk.....kggk.', '.kk.......kk..'],
      b: { 13: '.kk.......kk..', 14: 'kgkk.....kgkk.', 15: '.kk.......kk..' },
    },
    // The GREMLIN (HALLOWEEN): big ears, red eyes, a toothy grin; scurries up to the bots to
    // prank them
    gremlin: {
      pal: { g: '#5aa64a', G: '#3d7a32', e: '#ff3030', k: '#111111', w: '#ffffff', b: '#a8d08d' },
      a: ['g..........g', 'gg........gg', '.ggg.gg.ggg.', '..gGggggGg..', '..ggeggegg..', '..gggggggg..', '..gkwkwkwg..', '...gbbbbg...', '..g.bbbb.g..', '....g..g....', '...gg..gg...'],
      b: { 8: '...gbbbbg...', 9: '...g....g...', 10: '..gg....gg..' },
    },
    // HALLOWEEN's JACK O' LANTERN (pushed in, like the scary tree): a carved grin lit from inside,
    // the candle flickering (a and b)
    jacklantern: {
      pal: { o: '#ff8a1f', O: '#c4580a', s: '#3f8f3a', l: '#6cc24a', y: '#ffd23f', Y: '#ff9d00' },
      a: ['......ss......', '.....ssl......', '...OOOsOOO....', '..OooOoOooO...', '.OoyyoOoyyoO..', '.OoyyoOoyyoO..', 'OooooOyOoooOO.', 'OooooYYYooooO.', 'OoyoooooooyoO.', 'OoyyYyYyYyyoO.', '.OoyyyyyyyoO..', '..OooOoOooO...', '...OOOOOOO....'],
      b: { 4: '.OoYYoOoYYoO..', 5: '.OoYYoOoYYoO..', 7: 'OooooyyyooooO.', 9: 'OoYYyYyYyYYoO.', 10: '.OoYYYYYYYoO..' },
    },
    // NOVEMBER's FOG: the trees that show through it (dark silhouettes against the mist) and the
    // FOG WANDERER, a pale hooded figure with glowing eyes, its hem trailing
    pine: {
      pal: { t: '#1e262b', T: '#2d383e' },
      a: ['....t....', '....t....', '...ttt...', '..ttTtt..', '...ttt...', '..ttttt..', '.ttTtttt.', '..ttttt..', '.ttttttt.', 'ttttTtttt', '.ttttttt.', 'ttttttttt', 'tttTttttt', 'ttttttttt', '....t....', '....t....', '....t....', '...ttt...'],
    },
    baretree: {
      pal: { t: '#1e262b' },
      a: ['..t.....t....', '...t...t..t..', 't..t..t..t...', '.t.t..t.t....', '..tt.t..t..t.', '...tt...t.t..', '....t..tt....', '....tt.t.....', '.....ttt.....', '.....tt......', '.....tt......', '.....tt......', '.....tt......', '.....tt......', '.....tt......', '.....tt......', '....tttt.....', '...tttttt....'],
    },
    wraith: {
      pal: { c: '#b8c0cc', C: '#8a94a2', h: '#262c36', e: '#e8fbff' },
      a: ['...cccc...', '..cCCCCc..', '.cChhhhCc.', '.cCehheCc.', '.cChhhhCc.', '..cChhCc..', '.cccCCccc.', 'ccCcccCccc', 'cCccccccCc', 'cccccccccc', 'cCcccccCcc', 'cccccccccc', 'ccCccccCcc', 'cccccccccc', '.ccCcccccc', '.cccccCcc.', '.c.cc.cc.c', 'c..c..c..c'],
      b: { 16: '.cc.cc.cc.', 17: '.c..c..c..' },
    },
    // OCTOBER's HAUNTED FOREST: the big gnarled trees in front of everything (dark, near the edges,
    // framing the path), and the glowing eyes between the trees at the back
    oak: {
      pal: { t: '#07090b', T: '#12171c' },
      a: [
        '..........tt.t....t.....t...........', '....t...tt..tt.tt..t...t..t.t.......', '...t.t.t..ttt.t..tt.t.t.tt...t.t....', '..t...ttt...tttt...ttt.t..tt..t..t..', '.t..t..tt.tt..tttt..t.tt.t..tt..t..t', 't..tt.t.ttt....tttttt..tt..t..t..t..',
        '..t.ttt..tt.tt...ttttttt.t.t.tt..t..', '.t..t.ttt.ttt..t....tttttt...t..t..t', '..tt.t..tTtt...t.......tttt..t..t...', '....tt.tTtt..tt.........ttt...t..t..', '.t...tttTtt.t............tt.t.t.....', '..t..tTttt.t..............t...t..t..',
        '...tttTttt.................t..t.....', '.....tTttt..................t.......', '....ttTtttt.........................', '.....tTttt..........................', '.....tTtt...........................', '.....tTtt...........................',
        '....ttTtt...........................', '....tTttt...........................', '....tTtttt..........................', '....tTtttt..........................', '...ttTtttt..........................', '...tTttttt..........................',
        '...tTtttttt.........................', '...tTtttttt.........................', '..ttTttttttt........................', '..tTtttttttt........................', '.ttTttttttttt.......................', '.tTtttttttttt.......................',
        '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................',
        'tttTtttttttttt......................', 'tt.tTttttt.tttttt...................', 't..tt.ttt..tt...ttt.................'],
    },
    // (the other kind of big tree in front, now and then instead of the oaks: the same crown on a
    // slim, gnarled trunk)
    gnarl: {
      pal: { t: '#07090b', T: '#12171c' },
      a: [
        '..........tt.t....t.....t...........', '....t...tt..tt.tt..t...t..t.t.......', '...t.t.t..ttt.t..tt.t.t.tt...t.t....', '..t...ttt...tttt...ttt.t..tt..t..t..', '.t..t..tt.tt..tttt..t.tt.t..tt..t..t', 't..tt.t.ttt....tttttt..tt..t..t..t..',
        '..t.ttt..tt.tt...ttttttt.t.t.tt..t..', '.t..t.ttt.ttt..t....tttttt...t..t..t', '..tt.t..tTtt...t.......tttt..t..t...', '....tt.tTtt..tt.........ttt...t..t..', '.t...tttTtt.t............tt.t.t.....', '..t..tTttt.t..............t...t..t..',
        '...tttTttt.................t..t.....', '.....tTttt..................t.......', '....ttTttt..........................', '.....tTtt...........................', '.....tTt............................', '.....tTt............................',
        '.....tTtt...........................', '.....tTtt...........................', '.....tTtt...........................', '.....tTtt...........................', '....ttTtt...........................', '....tTttt...........................',
        '....tTttt...........................', '....tTttt...........................', '....tTtttt..........................', '...ttTtttt..........................', '...tTttttt..........................', '...tTttttt..........................',
        '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................',
        '..ttTtttttt.........................', '.tt.tTtt.tt.........................', 't..tt.tt...tt.......................'],
    },
    // (the second crown, so the trees at the two edges are never one tree and its mirror)
    oak2: {
      pal: { t: '#07090b', T: '#12171c' },
      a: [
        '.......t....t..t.........t..........', '......t.t..t..t.t...t...t.t...t.....', '.....t...tt..tt...t.t.tt...t.t.t....', '....tt..t.tttt..tt.ttt..tt..t...t...', '...t..tt.t.tt.tt..tttttt..tt.t...t..', '..t..t..tt.ttt..ttt...tttt..t.tt..t.',
        '.t..t.ttt..tt.tt.......ttttt...t.t..', '...t.t.tt.tTt............tttt...t..t', '..t..ttt.tTtt..............ttt..t.t.', '.t...t..ttTt.................tt.t..t', '..t.t...tTtt..................t..t..', '...t..ttTtt....................t..t.',
        '....tttTtt.......................t..', '.....tTttt.........................t', '....ttTtttt.........................', '.....tTttt..........................', '.....tTtt...........................', '.....tTtt...........................',
        '....ttTtt...........................', '....tTttt...........................', '....tTtttt..........................', '....tTtttt..........................', '...ttTtttt..........................', '...tTttttt..........................',
        '...tTtttttt.........................', '...tTtttttt.........................', '..ttTttttttt........................', '..tTtttttttt........................', '.ttTttttttttt.......................', '.tTtttttttttt.......................',
        '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................', '.tTtttttttttt.......................',
        'tttTtttttttttt......................', 'tt.tTttttt.tttttt...................', 't..tt.ttt..tt...ttt.................'],
    },
    gnarl2: {
      pal: { t: '#07090b', T: '#12171c' },
      a: [
        '.......t....t..t.........t..........', '......t.t..t..t.t...t...t.t...t.....', '.....t...tt..tt...t.t.tt...t.t.t....', '....tt..t.tttt..tt.ttt..tt..t...t...', '...t..tt.t.tt.tt..tttttt..tt.t...t..', '..t..t..tt.ttt..ttt...tttt..t.tt..t.',
        '.t..t.ttt..tt.tt.......ttttt...t.t..', '...t.t.tt.tTt............tttt...t..t', '..t..ttt.tTtt..............ttt..t.t.', '.t...t..ttTt.................tt.t..t', '..t.t...tTtt..................t..t..', '...t..ttTtt....................t..t.',
        '....tttTtt.......................t..', '.....tTttt.........................t', '....ttTttt..........................', '.....tTtt...........................', '.....tTt............................', '.....tTt............................',
        '.....tTtt...........................', '.....tTtt...........................', '.....tTtt...........................', '.....tTtt...........................', '....ttTtt...........................', '....tTttt...........................',
        '....tTttt...........................', '....tTttt...........................', '....tTtttt..........................', '...ttTtttt..........................', '...tTttttt..........................', '...tTttttt..........................',
        '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................', '...tTttttt..........................',
        '..ttTtttttt.........................', '.tt.tTtt.tt.........................', 't..tt.tt...tt.......................'],
    },
    // (now and then, between them: the HOLLOW, a dead tree with a face in its trunk, two red eyes
    // and a gaping mouth you can see through)
    hollow: {
      pal: { t: '#07090b', T: '#12171c', e: '#a3221a' },
      a: [
        '..............t...tt....t...............', '.........t..t..t.tt..tt..t...t..........', '......t..tt..tt.tt.t..t.tt..tt..t.......', '....t..tt..ttt..ttttttt..ttt..tt..t.....', '...t.tt..ttt..tttt..t.tttt..ttt..tt.t...', '..t..t.ttt..ttt..tttttt..ttt..ttt.t..t..',
        '.t..tt..t.tt...ttt.tt.ttt...tt.t..tt..t.', 't..t...tt.t...t..tttTtt..t...t.tt...t..t', '..t..tt..t...t.....tTtt.....t...t.tt..t.', '.t..t...t..........tTtt..........t...t..', '..t...tt...........tTtt...........tt..t.', '.t..t..............tTt..............t..t',
        '..t................tTt..............t...', '..................ttTtttt...............', '..................tTttttt...............', '.................ttTttttt...............', '.................tTteetet...............', '.................tTtttttt...............',
        '.................tTtt..tt...............', '.................tTt....t...............', '.................tTtt..tt...............', '.................tTttttttt..............', '................ttTttttttt..............', '................tTtttttttt..............',
        '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............',
        '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............', '................tTtttttttt..............',
        '...............ttTttttttttt.............', '..............t.tTtttt.tttt.............', '.............t..tt.ttt..t..tt...........'],
    },
    // The HEADLESS HORSEMAN (OCTOBER): a black horse at a gallop, red-eyed, its rider cloaked and
    // headless, holding up a flaming jack o' lantern
    horseman: {
      pal: { H: '#141417', h: '#2a2a30', e: '#ff3b2f', m: '#07070a', c: '#120e16', C: '#2a2032', n: '#7a1010', s: '#4a1c1c', j: '#ff8c1a', J: '#3a1a00', f: '#ffd23f' },
      a: [
        '..................ff......', '.................ffff.....', '.................jjjj.....', '................jJjJj.....', '.......n........jjjjj.....', '......ccc........JJj......',
        '.....cCccc.......c........', '.....cCcccc.....c.........', '....ccCccccc..cc......mm..', '....cCccccccccc......mHHH.', '...ccCcccccc........mHHeH.', '...cccccccss.......mHHHHHH',
        '..cccHHHsssssHHHHHHHHH.HH.', '.c.HHHHHHHHHHHHHHHHHH.....', 'mm.HhHHHHHHHHHHHHHHH......', 'm..HHHHHHHHHHHHHHHHH......', '...HHH.HHH....HHH.HHH.....', '...HH...HH....HH...HH.....',
        '..HH.....HH...HH....HH....', '..H.......H..HH......H....', '.HH.......HH.H.......HH...', '.ss........s.ss.......s...'],
      b: { 16: '...HHH.HHH....HHHHHH......', 17: '....HHHH......HHHH........', 18: '....HH.HH....HH..HH.......', 19: '...HH...HH..HH....HH......', 20: '...H.....H..H......H......', 21: '..ss.....ss.ss.....ss.....' },
    },
    // A ZOMBIE (OCTOBER, in a horde): grey-green, its arms out, shuffling; c and d, the THRILLER
    // (claws up to one side, then the other)
    zombie: {
      pal: { h: '#2b2420', k: '#8aa279', e: '#f4f1b0', m: '#2a1a1a', c: '#5a4a6e', C: '#3e3350', K: '#6d8560', p: '#3b3a33', s: '#1b1b1b' },
      a: [
        '...hhhhh....', '..hkkkkkh...', '..kkekkek...', '..kkkkkkk...', '..kkmmmkk...', '...kkkkk....',
        '..CcccccC...', '.CcccccccKKK', '.ccccccc....', '.Ccccc.cKKK.', '..ccccc.....', '..pppppp....',
        '..pp..pp....', '..pp..pp....', '..pp..pp....', '.sss..sss...'],
      b: { 12: '..pp...pp...', 13: '.pp....pp...', 14: '.pp....pp...', 15: 'sss...sss...' },
      c: [
        '...hhhhh..KK', '..hkkkkkh.K.', '..kkekkekc..', '..kkkkkkkc..', '..kkmmmkkc..', '...kkkkkcKK.',
        '..CcccccC.K.', '.CccccccC...', '.ccccccc....', '..ccccc.....', '..ccccc.....', '..pppppp....',
        '.pp...pp....', 'pp.....pp...', 'pp......pp..', 'ss......sss.'],
      d: [
        'KK..hhhhh...', '.K.hkkkkkh..', '..ckekkekk..', '..ckkkkkkk..', '..ckkmmmkk..', '.KKckkkkk...',
        '.K.CcccccC..', '...CccccccC.', '....ccccccc.', '.....ccccc..', '.....ccccc..', '....pppppp..',
        '....pp...pp.', '...pp.....pp', '..pp......pp', '.sss......ss'],
    },
    eyes: { pal: { e: '#ffd23f' }, a: ['ee...ee', 'ee...ee'] },
    // The WEREWOLF (under OCTOBER's full moon): the old movie kind, a man gone to fur: pointed ears,
    // a furred face, yellow eyes, a dark nose and fangs, in his work shirt and trousers, clawed hands
    // and bare furred feet; c, its howl (eyes shut, mouth wide)
    werewolf: {
      pal: { F: '#4a3426', f: '#8a6a4e', e: '#ffd23f', n: '#111111', t: '#f2f2f2', s: '#3b4560', S: '#2a3146', p: '#4a3d30', c: '#e3dccb' },
      a: ['..........F.F...', '.........FfFf...', '........Fffffff.', '........ffeffffn', '........ffffffff', '.......Fffffftft', '......FFfffff...', '....FFFfffffF...', '...FfffffffffF..', '..Fffff.ffffff..', '..ff.ff.Fffffcc.', '.cc..ff.Ffff....', '.....pppppp.....', '.....pPpppPp....', '.....pp..pp.....', '.....ff..ff.....', '....fff..fff....', '...cff..cff.....'],
      b: { 14: '.....pp..pp.....', 15: '....ff....ff....', 16: '...fff....fff...', 17: '..cff....cff....' },
      a: ['.F........F.', '.FF......FF.', '.FFFFFFFFFF.', '.FFFffffFFF.', '.FFffffffFF.', '.FfeffffefF.', '.FffffffffF.', '.FFffnnffFF.', '..FftfftfF..', '...FFFFFF...', '..sssSSsss..', '.ssssSSssss.', '.ssssssssss.', '.ssssssssss.', '.f.ssssss.f.', '.c.pppppp.c.', '...pp..pp...', '...pp..pp...', '..FFF..FFF..'],
      b: { 16: '..pp....pp..', 17: '..pp....pp..', 18: '.FFF....FFF.' },
      c: ['............', '.F........F.', '.FF......FF.', '.FFFFFFFFFF.', '.FFFffffFFF.', '.FnnffffnnF.', '.FffffffffF.', '.FFftnntfFF.', '..FfnnnnfF..', '...FnnnnF...', '..sssSSsss..', '.ssssSSssss.', '.ssssssssss.', '.ssssssssss.', '.f.ssssss.f.', '.c.pppppp.c.', '...pp..pp...', '...pp..pp...', '..FFF..FFF..'],
    },
    // The HAND from under the floor: reaching (a), grabbing (b)
    hand: {
      pal: { h: '#7d9576', H: '#55694f', n: '#d8d0b0', s: '#3a2f26', S: '#241c16' },
      a: ['.n.n.n..', '.h.h.h..', '.h.h.h.n', '.hhhhh.h', '.hhhhhhh', '.hhhhhh.', '..hhhh..', '..hHhh..', '..ssss..', '..sSss..', '..ssss..'],
      b: ['........', '........', '..nnn...', '.hhhhhn.', '.hhhhhhh', '.hhhhhh.', '..hhhh..', '..hHhh..', '..ssss..', '..sSss..', '..ssss..'],
    },
    // The little ghost shaken out of a POSSESSED bot
    spirit: { pal: { p: '#e8f0ff', k: '#1a1f2a' }, a: ['..ppp..', '.ppppp.', 'pkpppkp', 'ppppppp', 'ppkkppp', 'ppppppp', '.p.p.p.', 'p..p..p'], b: { 6: 'p.p.p.p', 7: '.p..p..' } },
    // NOVEMBER's migrating birds: a and b on the ground (standing, pecking), c and d flying (wings
    // up, wings down)
    goose: {
      pal: { g: '#8b7d6b', G: '#5e5245', k: '#1b1b1b', w: '#eeeeee' },
      a: ['.........kk.', '.........kw.', '.........k..', '.........k..', '..gggggggk..', '.GGGGgggg...', '..wwwwwww...', '....k..k....'],
      b: ['............', '............', '............', '............', '..gggggggk..', '.GGGGggggkk.', '..wwwwwwwkw.', '....k..k....'],
      c: ['............', '............', '....GGG.....', '.....GGG....', 'GgggggggkkkK', '..wwwww...w.', '............', '............'],
      d: ['............', '............', '............', '............', 'GgggggggkkkK', '..wwGGG...w.', '.....GGG....', '............'],
    },
    duck: {
      pal: { h: '#2f8f4e', y: '#e8b923', b: '#9a8f80', B: '#6d6458', w: '#f2f2f2', c: '#7a4a32', o: '#e8902a' },
      a: ['.......hh.', '.......hhy', '.......w..', '.bbbbbcc..', 'BBBBbbbc..', '.bbbbbb...', '...o..o...'],
      b: ['..........', '..........', '..........', '.bbbbbcc..', 'BBBBbbbchh', '.bbbbbb.hy', '...o..o...'],
      c: ['..........', '...BB.....', '....BB....', 'Bbbbbcwhhy', '.bbbbb....', '..........', '..........'],
      d: ['..........', '..........', '..........', 'Bbbbbcwhhy', '.bbBBb....', '....BB....', '..........'],
    },
    songbird: { // (its colors by kind: SONGBIRDS below)
      pal: { b: '#6b5a4e', c: '#e0662b', k: '#111111', y: '#e8b923', o: '#8a6a4a' },
      a: ['...bb.', '..bkby', 'bbbcc.', '.bccc.', '..o.o.'],
      b: ['......', '...bb.', 'bbbbky', '.bccc.', '..o.o.'],
      c: ['.bb...', '..bb..', 'bbbbky', '.ccc..', '......'],
      d: ['......', '......', 'bbbbky', '.cbb..', '..bb..'],
    },
    swallow: {
      pal: { n: '#24366b', r: '#c2462e', w: '#efe6d6', k: '#222222' },
      a: ['......nn.', '.....nnr.', 'nnnnnnnr.', 'n..wwww..', '....k.k..'],
      b: ['.........', '......nn.', 'nnnnnnnnr', 'n..wwww..', '....k.k..'],
      c: ['...nn....', '....nn...', 'n.nnnnnnr', '.n.www...', '.........'],
      d: ['.........', '.........', 'n.nnnnnnr', '.nwnnw...', '....nn...'],
    },
    penguin: { // (c: on its belly, sliding)
      pal: { k: '#1b1f27', w: '#f2f4f8', o: '#ff9a1f' },
      a: ['...kkkk....', '..kkkkkk...', '..kkkkwwk..', '..kkkkwkwoo', '..kkkkwwk..', '.kkkkwwwwk.', 'kkkkwwwwwk.', 'kkkkwwwwwk.', '.kkkwwwwwk.', '.kkkwwwwwk.', '..kkwwwwk..', '...oo..oo..'],
      b: { 11: '....oo.oo..' },
      c: ['...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '..kkkkkkkk.', 'okkkkkkkwko', 'okwwwwwwww.'],
    },
    reindeer: {
      pal: { b: '#8a5a2b', w: '#c8a27a', a: '#d9c49a', k: '#1a120b', n: '#2a1a10' },
      a: ['.........a...a..', '.........aa.aa..', '..........aaa...', '...........bbb..', '...........bkbb.', '...........bbbbn', '.w........bbb...', '.bbbbbbbbbbbb...', '.bbbbbbbbbbbb...', '..bwwwwwwwwb....', '..b.b....b.b....', '..b.b....b.b....', '..k.k....k.k....'],
      b: { 10: '..b..b..b..b....', 11: '.b...b..b...b...', 12: '.k...k..k...k...' },
    },
    dreidel: { // (spinning: its sides turning past)
      pal: { b: '#2a6fdb', L: '#6fa8ff', w: '#ffffff', h: '#d4a017' },
      a: ['...hh...', '...hh...', '.bbbbbb.', 'bLbwwbbb', 'bLbwbbbb', 'bLbwwbbb', '.bbbbbb.', '..bbbb..', '...bb...', '...b....'],
      b: { 3: 'bbbbLbwb', 4: 'bbbbLbwb', 5: 'bbbbLbww' },
    },
    snowman: {
      pal: { w: '#f2f4f8', s: '#b8c4d6', k: '#1b1f27', o: '#ff8a1f', h: '#1b1f27', r: '#d23a3a', b: '#6b4a2b' },
      a: ['....hhhhh....', '....hhhhh....', '...hhhhhhh...', '....wwwws....', '...wwkwkws...', '...wwwwwoooo.', '...wwkkkws...', '....wwwws....', '...rrrrrrr...', 'b.wwwwwrrws.b', '.bwwwkwrrwsb.', '..wwwwwwwss..', '..wwwkwwwss..', '...wwwwwss...', '..wwwwwwwss..', '.wwwwwwwwwss.', 'wwwwwwwwwwwss', 'wwwwwwwwwwwss', 'wwwwwwwwwwwss', '.wwwwwwwwwss.', '..wwwwwwwss..'],
    },
    evergreen: { // (its lights blink, its star twinkles; presents under it)
      pal: { g: '#1f8a44', G: '#135226', t: '#6b4a2b', T: '#4a3320', y: '#ffd23f', Y: '#fff6c2', r: '#ff3b3b', b: '#3bb8ff', o: '#ffb000', R: '#d23a3a', B: '#3a7bd5' },
      a: EVERGREEN,
      b: swap(EVERGREEN, { r: 'o', o: 'b', b: 'r', y: 'Y' }),
    },
    // (menorah, kinara and sign: drawn for the night, the day or the year; scenery())
  };
  // A menorah with this night's candles lit (the newest, leftmost, first... placed from the right),
  // and the shamash, raised in the middle, always
  function menorah(night) {
    const rows = Array.from({ length: 13 }, () => Array(19).fill('.'));
    const put = (x, y, c) => { rows[y][x] = c; };
    const lit = [17, 15, 13, 11, 7, 5, 3, 1].slice(0, night);
    for (const x of [1, 3, 5, 7, 11, 13, 15, 17]) {
      put(x, 7, 'm');
      if (lit.includes(x)) { put(x, 3, 'f'); put(x, 4, 'F'); put(x, 5, 'c'); put(x, 6, 'c'); }
    }
    put(9, 1, 'f'); put(9, 2, 'F'); put(9, 3, 'c'); put(9, 4, 'c'); put(9, 5, 'm'); put(9, 6, 'm'); put(9, 7, 'm');
    for (let x = 1; x <= 17; x++) put(x, 8, 'm');
    put(9, 9, 'm'); put(9, 10, 'm');
    for (let x = 6; x <= 12; x++) put(x, 11, 'M');
    for (let x = 5; x <= 13; x++) put(x, 12, 'M');
    const a = rows.map((r) => r.join(''));
    return { pal: { m: '#d4a017', M: '#a67c12', c: '#dfe8ff', f: '#ffd23f', F: '#ff8a1f' }, a, b: swap(a, { f: 'F', F: 'f' }) };
  }
  // A kinara: three red candles, the black one, three green; the black lit first, then from the
  // outside in, alternating (one more each day)
  function kinara(day) {
    const rows = Array.from({ length: 11 }, () => Array(15).fill('.'));
    const put = (x, y, c) => { rows[y][x] = c; };
    const lit = [7, 1, 13, 3, 11, 5, 9].slice(0, day);
    [1, 3, 5, 7, 9, 11, 13].forEach((x, i) => {
      const c = i < 3 ? 'r' : i === 3 ? 'k' : 'g';
      for (let y = 3; y <= 6; y++) put(x, y, c);
      put(x, 7, 'w');
      if (lit.includes(x)) { put(x, 1, 'f'); put(x, 2, 'F'); }
    });
    for (let x = 0; x <= 14; x++) put(x, 8, 'w');
    for (let x = 1; x <= 13; x++) put(x, 9, 'W');
    for (let x = 3; x <= 11; x++) put(x, 10, 'W');
    const a = rows.map((r) => r.join(''));
    return { pal: { r: '#d23a3a', k: '#3a3a42', g: '#1f9d4c', w: '#8a5a2b', W: '#6b4222', f: '#ffd23f', F: '#ff8a1f' }, a, b: swap(a, { f: 'F', F: 'f' }) };
  }
  // A sign with the year on it (its digits blink)
  const DIGITS = ['###,#.#,#.#,#.#,###', '.#.,##.,.#.,.#.,###', '###,..#,###,#..,###', '###,..#,.##,..#,###', '#.#,#.#,###,..#,..#',
    '###,#..,###,..#,###', '###,#..,###,#.#,###', '###,..#,..#,.#.,.#.', '###,#.#,###,#.#,###', '###,#.#,###,..#,###'].map((d) => d.split(','));
  function sign(year) {
    const rows = Array.from({ length: 14 }, () => Array(19).fill('.'));
    for (let y = 0; y < 9; y++) for (let x = 0; x < 19; x++) rows[y][x] = (y === 0 || y === 8 || x === 0 || x === 18) ? 'B' : 'b';
    String(year).slice(-4).split('').forEach((n, i) => {
      DIGITS[+n].forEach((line, y) => line.split('').forEach((c, x) => { if (c === '#') rows[2 + y][2 + i * 4 + x] = 'y'; }));
    });
    for (let y = 9; y < 14; y++) { rows[y][4] = 'p'; rows[y][14] = 'p'; }
    const a = rows.map((r) => r.join(''));
    return { pal: { b: '#20264a', B: '#b8c4d6', y: '#ffd23f', Y: '#ff7ad9', p: '#6b4a2b' }, a, b: swap(a, { y: 'Y' }) };
  }

  // Rows of letters into rects: runs of one color merged along each row
  function rects(rows, pal) {
    let out = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const c = row[x];
        let run = 1;
        while (x + run < row.length && row[x + run] === c) run++;
        if (c !== '.' && pal[c]) out += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${pal[c]}"/>`;
        x += run;
      }
    });
    return out;
  }
  // Visitors drawn frame by frame in the frame editor (js/bigart.js; none at the moment), at the
  // bots' pixels or half pixels at res 2; one <g> a frame, only the one showing drawn
  const ART = window.BIG_ART || {};
  const artPx = (kind) => U / (ART[kind].res || 1); // (a pixel of its frames, in screen pixels)
  const artRows = (rows) => rows.map((r) => r.replace(/(\d+)(.)/g, (m, n, c) => c.repeat(Number(n))));
  function artEl(kind) {
    const d = ART[kind];
    const px = artPx(kind);
    const el = document.createElement('div');
    el.className = `visitor visitor-${kind}`;
    el.style.width = `${d.w * px}px`;
    const groups = d.anims.map((name, n) => d[name].map((f, i) => `<g class="art-${name}${i}" style="display: ${!n && !i ? 'inline' : 'none'}">${rects(artRows(f.rows), d.pal)}</g>`).join('')).join('');
    el.innerHTML = `<svg viewBox="0 0 ${d.w} ${d.h}" width="${d.w * px}" height="${d.h * px}" shape-rendering="crispEdges" aria-hidden="true">${groups}</svg><span class="walker-emote"></span>`;
    return el;
  }
  function spriteEl(kind, pal) {
    if (ART[kind]) return artEl(kind);
    const def = { ...SPRITES[kind], ...(pal ? { pal: { ...SPRITES[kind].pal, ...pal } } : {}) };
    const w = def.a[0].length;
    const h = def.a.length;
    const frameB = Array.isArray(def.b) ? def.b : def.a.map((row, i) => (def.b && def.b[i]) || row); // (one frame: the same twice)
    const el = document.createElement('div');
    el.className = `visitor visitor-${kind}`;
    el.style.width = `${w * U}px`;
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w * U}" height="${h * U}" shape-rendering="crispEdges" aria-hidden="true">`
      + `<g class="f-a">${rects(def.a, def.pal)}</g><g class="f-b">${rects(frameB, def.pal)}</g>`
      + `${def.c ? `<g class="f-c">${rects(def.c, def.pal)}</g>` : ''}${def.d ? `<g class="f-d">${rects(def.d, def.pal)}</g>` : ''}</svg>`
      + '<span class="walker-emote"></span>';
    return el;
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  // How each moves: pixels a second, the frame time, whether it shuffles and bobs, how high it goes
  const KINDS = {
    frank: { speed: 12, frameMs: 380, sway: 1, bob: 1, monster: true, poke: 'roar' },
    mummy: { speed: 9, frameMs: 460, sway: 1, bob: 1, monster: true, poke: 'groan' },
    creature: { speed: 14, frameMs: 300, sway: 1, bob: 1, monster: true, drips: true, poke: 'blub' },
    nosferatu: { speed: 10, frameMs: 0, sway: 0, bob: 0, monster: true, poke: 'hiss' },
    ghost: { speed: 16, frameMs: 420, sway: 0, bob: 0, float: 12, monster: true, poke: 'boo' },
    bat: { speed: 55, frameMs: 120, fly: true, poke: 'scatter' },
    crow: { speed: 20, frameMs: 0, hop: true, poke: 'caw' },
    spider: { speed: 40, frameMs: 260, poke: 'scurry' },
    turkey: { speed: 16, frameMs: 280, sway: 1, poke: 'gobble' },
    // (bird: wave, how far it rises and dips as it flies, over waveMs; beatMs, a wingbeat; call)
    virus: { speed: 24, frameMs: 160, poke: 'delete' },
    bug: { speed: 34, frameMs: 120, poke: 'delete' },
    worm: { speed: 16, frameMs: 260, poke: 'delete' },
    ransomware: { speed: 22, frameMs: 180, poke: 'delete' },
    spyware: { speed: 30, frameMs: 700, poke: 'delete' },
    adware: { speed: 0, frameMs: 0, poke: 'delete' },
    logicbomb: { speed: 20, frameMs: 140, poke: 'delete' },
    bigspider: { speed: 32, frameMs: 140, poke: 'hiss' },
    trojan: { speed: 18, frameMs: 200, poke: 'delete' },
    pine: { speed: 0, frameMs: 0 },
    baretree: { speed: 0, frameMs: 0 },
    oak: { speed: 0, frameMs: 0 },
    gnarl: { speed: 0, frameMs: 0 },
    oak2: { speed: 0, frameMs: 0 },
    gnarl2: { speed: 0, frameMs: 0 },
    hollow: { speed: 0, frameMs: 0 },
    horseman: { speed: 78, frameMs: 120, monster: true, poke: 'laugh' },
    zombie: { speed: 9, frameMs: 520, sway: 1, monster: true, poke: 'braains' },
    eyes: { speed: 0, frameMs: 0, fixed: true, poke: 'blink' },
    werewolf: { speed: 30, frameMs: 200, sway: 1, monster: true, poke: 'growl' },
    hand: { speed: 0, frameMs: 0, poke: 'sink' },
    spirit: { speed: 0, frameMs: 300, poke: 'mist' },
    wraith: { speed: 9, frameMs: 520, poke: 'mist' },
    gremlin: { speed: 34, frameMs: 130, poke: 'skree' },
    goose: { speed: 42, frameMs: 0, bird: true, wave: 1.5, waveMs: 420, beatMs: 260, call: 'HONK!', poke: 'flush' },
    duck: { speed: 48, frameMs: 0, bird: true, wave: 2, waveMs: 300, beatMs: 140, call: 'QUACK!', poke: 'flush' },
    songbird: { speed: 40, frameMs: 0, bird: true, wave: 5, waveMs: 170, beatMs: 90, call: 'TWEET!', poke: 'flush' },
    swallow: { speed: 85, frameMs: 0, bird: true, wave: 8, waveMs: 520, beatMs: 110, call: 'CHIRP!', poke: 'flush' },
    tree: { speed: 0, frameMs: 0, poke: 'creak' },
    jacklantern: { speed: 0, frameMs: 260, poke: 'cackle' },
    penguin: { speed: 13, frameMs: 240, sway: 1, bob: 1, poke: 'squawk' },
    reindeer: { speed: 30, frameMs: 180, poke: 'snort' },
    dreidel: { speed: 38, frameMs: 90, poke: 'spin' },
    snowman: { speed: 0, frameMs: 0, poke: 'brrr' },
    evergreen: { speed: 0, frameMs: 650, poke: 'jingle' },
    menorah: { speed: 0, frameMs: 220, fixed: true, poke: 'glow' },
    kinara: { speed: 0, frameMs: 240, fixed: true, poke: 'glow' },
    sign: { speed: 0, frameMs: 600, fixed: true, poke: 'cheer' },
    bit: { speed: 0, frameMs: 0, fixed: true, poke: 'decrypt' },
  };
  // (fixed: never mirrored, its order matters: the candles, the year's digits)
  // What each season sends (one visit at a time)
  const VISITS = {
    halloween: ['frank', 'mummy', 'creature', 'nosferatu', 'ghost', 'bats', 'crows', 'spider', 'gremlin', 'bigspider', 'werewolf', 'lightsout', 'hand', 'possessed', 'horseman', 'zombies'],
    november: ['turkey', 'turkey', 'crows', 'geese', 'ducks', 'songbirds', 'swallows'],
    winter: ['penguin'],
    christmas: ['reindeer', 'reindeer'],
    hanukkah: ['dreidel'],
  };
  // The scenery each season has pushed in (up to two pieces at once, one of each)
  const SCENERY = { halloween: ['tree', 'jacklantern'], winter: 'snowman', christmas: 'evergreen', hanukkah: 'menorah', kwanzaa: 'kinara', nye: 'sign', newyear: 'sign' };
  const seasons = () => (typeof Season !== 'undefined' ? Season.active() : []);
  const visits = () => seasons().flatMap((id) => VISITS[id] || []);

  const VIRUS_ODDS = 0.06; // (each time a visit comes due: one every ten minutes or so)
  // (the dev page's VIRUSES: OFTEN, or ?virus=1: one every visit, the kinds in turn, visits sooner)
  const virusOften = () => { try { return localStorage.getItem('bytefall-dev-virus') === 'on' || /[?&]virus=1/.test(location.search); } catch (e) { return false; } };
  let list = [];
  let nextVisit = performance.now() + rand(6000, 15000);

  function add(kind, x, dir, extra = {}) {
    const el = spriteEl(kind, extra.pal);
    const v = {
      kind, el, emote: el.querySelector('.walker-emote'), x, y: 0, dir, age: 0, speed: KINDS[kind].speed * rand(0.85, 1.15),
      state: 'go', frame: 0, frameAt: 0, scared: new Set(), phase: rand(0, 6.28), ...extra,
    };
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      poke(v);
    });
    api.lane.insertBefore(el, api.lane.firstChild); // (behind the bots; bats and crows go on top, style.css)
    const kk = KINDS[kind];
    if (kk && (kk.bird || kk.fly || kind === 'crow')) setAlt(v, Math.floor(Math.random() * 3)); // (its depth among the clouds)
    list.push(v);
    place(v);
    return v;
  }
  function say(v, text, ms = 1200) {
    v.emote.textContent = text;
    v.emote.classList.add('show');
    clearTimeout(v.sayTimer);
    v.sayTimer = setTimeout(() => v.emote.classList.remove('show'), ms);
  }
  // One visit: a monster, the ghost, a flock of bats or a crow or two, in from either side
  function visit(what = pick(visits().length ? visits() : VISITS.halloween)) {
    if (what === 'countdown') return countdown();
    if (what === 'sc-fish') return scenes && (scenes.current() === 'lake' || scenes.current() === 'beach' || scenes.start('lake'), scenes.fish());
    if (typeof what === 'string' && what.startsWith('sc-')) return scenes && (what === 'sc-clear' ? scenes.clear() : scenes.start(what.slice(3)));
    if (typeof what === 'string' && what.startsWith('wx-')) return weather && (what === 'wx-clear' ? weather.clear() : weather.start(what.slice(3)));
    if (what === 'fog') return startFog();
    if (what === 'overcast') return startClouds();
    // (OCTOBER: the HAUNTED FOREST and what happens in it; the dev page brings each any time)
    if (what === 'forest') return forest();
    if (what === 'eyes') return forest() && eyesIn();
    if (what === 'swell') return forest() && swell();
    if (what === 'bloodfog') { const f = forest(); if (f.phase === 'light') bloodFog(); return; }
    if (what === 'lightsout') return lightsOut();
    if (lights) return; // (nothing else while the lights are out)
    if (what === 'hand') return handVisit();
    if (what === 'zombies') return hordeVisit();
    if (what === 'possessed') return possessVisit();
    if (what === 'gremlin') { // (in, a few pranks, off at a run)
      add('gremlin', (Math.random() < 0.5 ? -1 : 1) > 0 ? -30 : api.laneW() + 4, 1, { state: 'go', target: rand(0.2, 0.8) * api.laneW(), pranks: 2 + Math.floor(Math.random() * 2) });
      const g = list[list.length - 1];
      if (g.x > 0) g.dir = -1;
      api.botEvent('visit-gremlin');
      return;
    }
    if (what === 'fireworks') { for (let i = 0; i < 3; i++) setTimeout(firework, i * 450); return; }
    const W = api.laneW();
    const fromLeft = Math.random() < 0.5;
    const dir = fromLeft ? 1 : -1;
    const edge = (w) => (fromLeft ? -w - 4 : W + 4);
    api.botEvent(`visit-${what}`);
    if (what === 'bats') {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) add('bat', edge(16) - dir * k * rand(14, 30), dir, { fly: sky(0.2, 0.8, () => rand(14, 30)), speed: rand(45, 75) });
    } else if (what === 'crows') {
      const n = Math.random() < 0.6 ? 1 : 2;
      for (let k = 0; k < n; k++) add('crow', edge(20) - dir * k * 26, dir, { stopAt: rand(0.2, 0.7) * W + k * 20, life: rand(5000, 9000) });
    } else if (what === 'spider') { // (down from above on its thread, somewhere along the card)
      // (from the top of the card on the start screen, dropping behind the title)
      const s = add('spider', rand(0.15, 0.8) * W, 1, { y: tall() ? ceiling() : 110, hang: sky(0.3, 0.6, () => rand(12, 22)), life: rand(3000, 5500), state: 'down' });
      s.el.insertAdjacentHTML('afterbegin', '<i class="visitor-thread"></i>');
      s.el.style.setProperty('--thread', `${ceiling() + 60}px`);
    } else if (FLOCKS[what]) flock(what, dir, edge, W);
    else if (what === 'virus') virusVisit(nextVirus(), dir, edge, W); // (or one by name, for tests: phage, bug, trojan)
    else if (['phage', 'bug', 'trojan', 'worm', 'ransomware', 'spyware', 'adware', 'logicbomb'].includes(what)) virusVisit(what === 'phage' ? 'virus' : what, dir, edge, W);
    else if (what === 'bigspider') { // (in from the side, about the card in scuttles and leaps, out)
      const v = add('bigspider', edge(SPRITES.bigspider.a[0].length * U), dir, { state: 'roam', target: rand(0.15, 0.85) * W, stops: 3 + Math.floor(Math.random() * 3) });
      api.botEvent('visit-bigspider');
      if (v.x > W / 2) v.dir = -1;
    }
    else if (what === 'werewolf') werewolfVisit(dir, edge, W);
    else if (what === 'horseman') { // (at a gallop, a laugh as it comes)
      const v = add('horseman', edge(26 * U), dir, { prance: true });
      say(v, 'HAHAHA!', 1400);
    }
    else if (what === 'turkey') add('turkey', edge(12 * U), dir, { stopAt: rand(0.25, 0.65) * W, life: rand(2500, 4500) });
    else if (what === 'reindeer' || what === 'rudolph') { // (now and then, the one with the red nose)
      const red = what === 'rudolph' || Math.random() < 0.25;
      const r = add('reindeer', edge(16 * U), dir, red ? { pal: { n: '#ff2a2a' } } : {});
      if (red) { r.el.classList.add('v-rudolph'); api.botEvent('visit-rudolph'); }
    } else if (what === 'dreidel') add('dreidel', edge(8 * U), dir, { stopAt: rand(0.25, 0.7) * W });
    else add(what, edge(SPRITES[what].a[0].length * U), dir);
  }

  // FOG (NOVEMBER and HALLOWEEN, now and then; on HALLOWEEN scarier: bare, twisted trees only and the
  // wanderer's eyes glowing red, most bots it nears bolting; the dev page's FOG: OFTEN, or ?fog=1, brings it every visit). A
  // heavy fog rolls in from one side and fills the lane; with THE WOODS (late in the year: below),
  // trees fade in through it, dark against the mist (some further back, fainter). Once it's built, the FOG WANDERER comes out of the mist,
  // drifts from spot to spot (any bot it nears is scared: it jumps, or bolts) and fades back into
  // the trees. Then the fog thins to a light mist, the trees standing in it, for a couple of
  // minutes, and lifts. While it's heavy nothing else comes by, and the bots keep to themselves
  // (no meetings, snacks or hops; wanderers.js asks foggy()), bumping into each other now and then.
  // The fog is drawn in coarse pixels: two canvases (one behind the trees, a thinner one in front
  // of everything), from drifting noise.
  const fogOften = () => { try { return localStorage.getItem('bytefall-dev-fog') === 'on' || /[?&]fog=1/.test(location.search); } catch (e) { return false; } };
  const spooky = () => typeof Season !== 'undefined' && Season.is('halloween'); // (its scarier version)
  const FOG_ODDS = 0.15; // (each NOVEMBER visit: a fog instead)
  const FOREST_FIRST_ODDS = 0.45; // (OCTOBER, till the HAUNTED FOREST has come this visit: sooner)
  let fog = null;
  const NG = 64;
  const grid = Float32Array.from({ length: NG * NG }, () => Math.random());
  const smooth = (t) => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = smooth(x - xi);
    const fy = smooth(y - yi);
    const at = (i, j) => grid[(((j % NG) + NG) % NG) * NG + (((i % NG) + NG) % NG)];
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * fx;
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * fx;
    return a + (b - a) * fy;
  }
  function fogCanvas(cls) {
    const c = document.createElement('canvas');
    c.className = `fog-layer ${cls}`;
    c.setAttribute('aria-hidden', 'true');
    api.lane.appendChild(c);
    return c;
  }
  // THE FOREST FLOOR (the HAUNTED FOREST's): a silhouetted ground along the lane's foot, in front of
  // the bots' feet, down to the card's edge: earth, grass tufts, stones, fallen twigs and leaves,
  // dark as the trees, laid out afresh each time the forest comes
  function groundIn() {
    const c = document.createElement('canvas');
    c.className = 'forest-ground';
    c.setAttribute('aria-hidden', 'true');
    foreLayer().appendChild(c);
    drawGround(c);
    requestAnimationFrame(() => { c.style.opacity = '1'; });
    return c;
  }
  function drawGround(c) {
    const P = U; // (the bots' own pixel)
    const below = laneBelow(); // (the lane's foot to the card's)
    const hPx = below + FLOOR + 6 * P;
    const W = api.laneW();
    const cw = Math.ceil(W / P);
    const ch = Math.ceil(hPx / P);
    c.width = cw;
    c.height = ch;
    c.style.height = `${ch * P}px`;
    c.style.bottom = `${-below}px`;
    const ctx = c.getContext('2d');
    const px = (x, y, col) => { if (x >= 0 && x < cw && y >= 0 && y < ch) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); } };
    const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const top = ch - Math.round((below + FLOOR) / P); // (the ground's surface: where the bots stand)
    const surf = [];
    let h = 0;
    for (let x = 0; x < cw; x++) { // (earth, its surface a little uneven, specked)
      if (Math.random() < 0.18) h = Math.max(-1, Math.min(1, h + (Math.random() < 0.5 ? -1 : 1)));
      surf[x] = top + h;
      for (let y = surf[x]; y < ch; y++) px(x, y, Math.random() < 0.08 ? '#0e1217' : '#06080a');
    }
    for (let k = 0, n = Math.round(cw / 26); k < n; k++) { // (stones, lit a little on top)
      const x0 = ri(0, cw - 6);
      const w = ri(3, 6);
      const sh = ri(2, 3);
      for (let x = x0; x < x0 + w; x++) {
        const s0 = surf[x] - sh + (x === x0 || x === x0 + w - 1 ? 1 : 0);
        for (let y = s0; y <= surf[x]; y++) px(x, y, y === s0 ? '#1a2128' : '#10151a');
      }
    }
    for (let k = 0, n = Math.round(cw / 40); k < n; k++) { // (fallen twigs, a side shoot or two)
      const x0 = ri(0, cw - 12);
      const len = ri(6, 11);
      const tilt = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1);
      for (let i = 0; i < len; i++) px(x0 + i, surf[x0 + i] - 1 + (tilt && i > len / 2 ? tilt : 0), '#0d1115');
      const b = x0 + ri(2, len - 2);
      px(b + 1, surf[b] - 2, '#0d1115');
      px(b + 2, surf[b] - 3, '#0d1115');
    }
    for (let k = 0, n = Math.round(cw / 6); k < n; k++) { // (grass tufts: a few blades, leaning)
      const x0 = ri(0, cw - 1);
      for (let b = 0, nb = ri(2, 4); b < nb; b++) {
        let x = x0 + b - 1;
        const tall = ri(2, 5);
        const lean = Math.random() < 0.5 ? -1 : 1;
        for (let i = 1; i <= tall; i++) {
          if (i > 2 && Math.random() < 0.4) x += lean;
          px(x, surf[Math.max(0, Math.min(cw - 1, x0))] - i, '#0a0e11');
        }
      }
    }
    for (let k = 0, n = Math.round(cw / 5); k < n; k++) { // (leaves: dead red-brown and olive, here and there)
      const x = ri(0, cw - 2);
      const col = pick(['#2a1416', '#22200f', '#1f1012', '#18160c']);
      px(x, surf[x] - (Math.random() < 0.3 ? 1 : 0), col);
      if (Math.random() < 0.5) px(x + 1, surf[x], col);
    }
  }
  // (a big tree in front, sunk: its foot past the screen's, roots (its last 3 rows) out of sight)
  function sinkTree(t) {
    const svgH = parseFloat(t.el.querySelector('svg').getAttribute('height'));
    const rows = SPRITES[t.kind].a.length;
    const below = Math.max(0, innerHeight - api.lane.getBoundingClientRect().bottom);
    t.y = -Math.round(below + (svgH / rows) * 3);
  }
  // The big trees' layer: over the lane, its box the lane's, cut off at the sides as the lane is
  // but open below (the lane cuts off at its floor, for what comes up through it)
  // (from the lane's foot to the card's inside edge: 6px on the game card, more on the start screen)
  function laneBelow() {
    const card = api.lane.offsetParent;
    if (!card) return 6;
    const cs = getComputedStyle(card);
    return Math.max(0, Math.round(card.getBoundingClientRect().bottom - (parseFloat(cs.borderBottomWidth) || 0) - api.lane.getBoundingClientRect().bottom));
  }
  function foreLayer() {
    let f = api.lane.nextElementSibling;
    if (!f || !f.classList.contains('lane-fore')) {
      f = document.createElement('div');
      f.className = 'lane-fore';
      f.setAttribute('aria-hidden', 'true');
      api.lane.after(f);
      const sync = () => {
        const l = api.lane;
        // (from the card's top down to the lane's foot: the canopies have room above, and the layer
        // clips what's sunk below the card, so it never makes the page scroll)
        Object.assign(f.style, { left: `${l.offsetLeft}px`, top: '0px', width: `${l.offsetWidth}px`, height: `${l.offsetTop + l.offsetHeight}px` });
        f.style.setProperty('--below', `${laneBelow()}px`); // (down to the card's edge, wherever the lane stops)
      };
      sync();
      window.addEventListener('resize', sync);
      if (window.ResizeObserver) new ResizeObserver(sync).observe(api.lane);
    }
    return f;
  }
  // (a tree, drawn k times its size)
  function scaleTree(t, k) {
    if (k === 1) return;
    const svg = t.el.querySelector('svg');
    svg.setAttribute('width', svg.getAttribute('width') * k);
    svg.setAttribute('height', svg.getAttribute('height') * k);
    t.el.style.width = `${svg.getAttribute('width')}px`;
    t.boxW = 0;
  }
  // instant: the HAUNTED FOREST put back as it stood (already up: back on this card, or on another);
  // THE WOODS (a backdrop): the fog is fog alone; the trees standing in it come with it only in the
  // last part of the year (OCTOBER's own HAUNTED FOREST, NOVEMBER, the winter), not the spring or
  // summer mornings' mists (weather.js). And the FOG WANDERER doesn't always come: every OCTOBER fog
  // has its wanderer (or a monster), NOVEMBER's half the time, the winter's now and then, the rest of
  // the year's never (a quiet mist)
  const woodsSeason = () => typeof Season !== 'undefined' && (Season.is('halloween') || Season.is('november') || Season.is('winter'));
  const wandererOdds = () => (spooky() ? 1 : Season.is('november') ? 0.5 : Season.is('winter') ? 0.3 : 0);
  // haunted: OCTOBER's forest (the dev page's FOREST brings it any time); trees: the woods with it
  function startFog(instant = false, haunted = spooky(), trees = haunted || woodsSeason()) {
    if (fog) return;
    const now = performance.now();
    // (dark: the twinkling background behind the lane fading to black under the fog)
    const dark = document.createElement('div');
    dark.className = 'fog-dark';
    dark.setAttribute('aria-hidden', 'true');
    api.lane.appendChild(dark);
    fog = { phase: 'in', at: now, level: 0, front: 0, dir: Math.random() < 0.5 ? 1 : -1, dark, back: fogCanvas('fog-back'), fore: fogCanvas('fog-fore'), trees: [], drawn: 0, t: 0, haunted, forced: haunted && !spooky(), red: 0 };
    if (haunted) {
      hauntedForest = true;
      fog.nextEyes = now + rand(6000, 14000);
      if (Math.random() < 0.75) startClouds(true); // (and a sky to match, most of the time)
      fog.ground = groundIn();
    }
    if (!instant) api.botEvent(haunted ? 'visit-forest' : 'visit-fog');
    const W = api.laneW();
    const big = tall(); // (read before the trees go in: a layout read in between would start their fade from full)
    const n = !trees ? 0 : Math.max(haunted ? 5 : 4, Math.round(W / (haunted ? 55 : 70)));
    for (let i = 0; i < n; i++) { // (spread along the card, each nudged a little: some far, some near)
      // (NOVEMBER: mostly pines; the HAUNTED FOREST: pines and bare, twisted trees, bigger)
      const kind = Math.random() < (haunted ? 0.45 : 0.6) ? 'pine' : 'baretree';
      const far = Math.random() < 0.5;
      const x = ((i + 0.2 + Math.random() * 0.6) / n) * W - 12;
      // (the HAUNTED FOREST's a shade lighter: its trees show against the dark, not only the mist)
      const t = add(kind, x, Math.random() < 0.5 ? 1 : -1, { state: 'fogtree', ...(haunted ? { pal: { t: '#34414a', T: '#46555f' } } : {}) });
      t.el.style.opacity = '0';
      t.el.classList.add('fog-tree', far ? 'far' : 'near');
      if (big) scaleTree(t, far ? 2.2 : 3); // (on the start screen's tall lane: bigger)
      else if (haunted) scaleTree(t, far ? 1.2 : 1.45);
      t.depth = far ? 0.45 : 0.85;
      t.lag = rand(0.08, 0.2); // (it shows once the fog's well past it: fading in with it, not ahead of it)
      fog.trees.push(t);
    }
    if (haunted) { // (the big ones in front, by either edge: the path between them; the oaks, or now and then the slim, gnarled ones)
      const foreKind = Math.random() < 0.5 ? 'oak' : 'gnarl';
      const swap = Math.random() < 0.5; // (which edge gets which crown: never the same tree mirrored)
      for (const side of [0, 1]) {
        const t = add((side === 1) !== swap ? `${foreKind}2` : foreKind, 0, side ? -1 : 1, { state: 'fogtree' });
        scaleTree(t, big ? 3.6 : 1.1);
        const w = parseFloat(t.el.style.width);
        const trunk = 8 / 36; // (where its trunk stands across it: its canopy arches in over the lane, toward the middle)
        t.x = side ? W - W * rand(0, 0.06) - w * (1 - trunk) : W * rand(0, 0.06) - w * trunk;
        t.el.style.opacity = '0';
        t.el.classList.add('fog-tree', 'fore');
        t.depth = 1;
        t.lag = side ? (fog.dir > 0 ? 0.3 : 0) : (fog.dir > 0 ? 0 : 0.3);
        t.fore = true;
        // (on a layer of its own over the lane, open below: its trunk runs on down past the lane's
        // foot and the card's edge to the screen's, roots out of sight, framing the scene; the
        // bots pass behind a solid trunk)
        foreLayer().appendChild(t.el);
        sinkTree(t);
        place(t);
        fog.trees.push(t);
      }
      // (less often, about one forest in three: the HOLLOW, big as they are, somewhere between them)
      if (Math.random() < 0.35) {
        const h = add('hollow', 0, Math.random() < 0.5 ? 1 : -1, { state: 'fogtree' });
        scaleTree(h, big ? 3.6 : 1.1);
        const hw = parseFloat(h.el.style.width);
        h.x = W * rand(0.28, 0.72) - hw / 2;
        h.el.style.opacity = '0';
        h.el.classList.add('fog-tree', 'fore');
        h.depth = 1;
        h.lag = rand(0.1, 0.25);
        h.fore = true;
        foreLayer().appendChild(h.el);
        sinkTree(h);
        place(h);
        fog.trees.push(h);
      }
    }
    if (instant) { // (as it stands: thinned to its mist, every tree up)
      fog.phase = 'light';
      fog.front = 1;
      fog.level = 0.35;
      fog.trees.forEach((t) => { t.shown = true; t.el.style.opacity = String(t.depth); });
    }
  }
  const FOG_IN_MS = 6000;
  const forestStays = (f) => f.haunted && (f.forced || spooky()); // (the HAUNTED FOREST never lifts in its month)
  function fogFrame(now) {
    const f = fog;
    const age = now - f.at;
    if (f.phase === 'in') {
      f.front = Math.min(1, age / FOG_IN_MS);
      f.level = f.front;
      if (age > FOG_IN_MS + 2000) {
        f.phase = 'thick';
        f.at = now;
        if (f.haunted || Math.random() < wandererOdds()) wraithIn();
        else f.quietUntil = now + rand(9000, 16000); // (no one comes: it hangs heavy a while, then thins)
      }
    } else if (f.phase === 'swell') { // (the HAUNTED FOREST's mist thickening again, for its wanderer)
      f.level = f.from + (1 - f.from) * Math.min(1, age / 5000);
      if (age > 6500) { f.phase = 'thick'; f.at = now; wraithIn(); }
    } else if (f.phase === 'thick') { // (until the wanderer's gone)
      if (f.wraithGone || (f.quietUntil && now > f.quietUntil)) { f.phase = 'thin'; f.at = now; f.quietUntil = 0; }
    } else if (f.phase === 'thin') {
      f.level = 1 - 0.65 * Math.min(1, age / 5000);
      if (age > 5000) { f.phase = 'light'; f.at = now; }
    } else if (f.phase === 'blood') {
      bloodFrame(f, now, age);
    } else if (f.phase === 'light') {
      if (forestStays(f)) { // (its mist breathing: thickening a little, thinning out)
        f.level = 0.3 + 0.1 * Math.sin(age / 9000) + 0.04 * Math.sin(age / 2300 + 1);
        forestFrame(f, now);
      } else if (age > (fogOften() ? 20000 : 120000)) {
        f.phase = 'lift';
        f.at = now;
        f.trees.forEach((t) => { t.el.style.opacity = '0'; });
      }
    } else if (f.phase === 'lift') {
      f.level = 0.35 * (1 - Math.min(1, age / 8000));
      if (age > 8000) return endFog();
    }
    f.dark.style.opacity = Math.min(1, f.level * 1.4).toFixed(2);
    if (f.phase === 'in') { // (the trees fade in as the bank reaches each one)
      const W = api.laneW();
      for (const t of f.trees) {
        if (t.shown) continue;
        const at = (f.dir > 0 ? t.x : W - t.x) / W;
        if (f.front * 1.35 - at > t.lag + 0.25) { t.shown = true; t.el.style.opacity = String(t.depth); }
      }
    } else f.trees.forEach((t) => { if (!t.shown && f.phase !== 'lift') { t.shown = true; t.el.style.opacity = String(t.depth); } });
    const low = document.documentElement.classList.contains('low-fx');
    // (its mist, redrawn: less often while it only breathes)
    if (now - f.drawn < (low ? 220 : 110) * (f.phase === 'light' ? 2 : 1)) return;
    f.t += (now - (f.drawn || now)) / 1000;
    f.drawn = now;
    drawFog(f.back, f, 0.78, 0, low);
    drawFog(f.fore, f, f.phase === 'in' || f.phase === 'thick' || f.phase === 'swell' || f.phase === 'blood' ? 0.42 : 0.16, 31, low);
  }
  // THE HAUNTED FOREST (OCTOBER): once its fog has rolled in, it stays (on every card, all month):
  // the trees stand, the big ones in front, and the mist thins and thickens. Between the trees, now
  // and then, glowing eyes blink; the mist
  // swells again for the wanderer; and rarely the BLOOD FOG rolls in, the mist turning red as a
  // blood moon rises behind the trees, and the wanderer comes out of it after a bot.
  function forestFrame(f, now) {
    if (now > f.nextEyes) {
      f.nextEyes = now + rand(14000, 32000);
      if (!list.some((v) => v.kind === 'eyes')) eyesIn();
    }
  }
  // (forest(): the HAUNTED FOREST up, at once if it isn't already: what needs it calls this first)
  function forest() {
    if (fog && !fog.haunted) endFog();
    if (!fog) startFog(true, true);
    return fog;
  }
  // GLOWING EYES between the trees: a pair or three, blinking, watching the bots; then gone
  function eyesIn(n = 1 + Math.floor(Math.random() * 3)) {
    const W = api.laneW();
    const now = performance.now();
    const col = pick(['#ffd23f', '#ff2a2a', '#9dff5a', '#ffd23f']);
    for (let i = 0; i < n; i++) {
      const v = add('eyes', rand(0.06, 0.88) * W, 1, { state: 'eyes', y: tall() ? rand(0.05, 0.3) * api.laneH() : rand(10, 34), until: now + rand(3500, 7000) + i * 600, blinkAt: now + rand(500, 2000), pal: { e: col } });
      v.el.classList.add('fog-eyes');
      if (tall() && !cloudLane()) scaleTree(v, 2); // (doubled on the start screen's whole-card lane only: on the game card, the bots' own size)
      v.el.style.color = col;
      v.el.style.opacity = '0';
      setTimeout(() => { v.el.style.opacity = '1'; }, i * 600);
    }
    api.botEvent('visit-eyes');
  }
  function eyesFrame(v, now) {
    if (now > v.blinkAt) { // (a blink)
      v.el.classList.add('blink');
      setTimeout(() => v.el.classList.remove('blink'), 140);
      v.blinkAt = now + rand(900, 2600);
    }
    const b = nearest(v);
    if (b) v.x += Math.sign(b.x - v.x) * Math.min(Math.abs(b.x - v.x), 2) * 0.02; // (following a bot, a little)
    if (now > v.until && v.state === 'eyes') {
      v.state = 'shut';
      v.el.style.opacity = '0';
      setTimeout(() => { v.gone = true; }, 900);
    }
  }
  // THE WALKING TREE's legs (not in the game for now: its frames are in the frame editor, to draw
  // from): its own pixel art with the foot of its trunk turned into roots, in
  // four frames: planted (spread wide), the back root lifted and swung forward, passing (gathered
  // under the trunk), the front root lifted and reaching ahead. Made from each kind's sprite: the
  // trunk found a few rows up, the roots grown out of it (thicker on a thick trunk)
  const ROOT_ROWS = 6;
  const ROOT_PAD = 5;
  function rootFrames(kind) {
    const rows = SPRITES[kind].a;
    const h = rows.length;
    const probe = rows[h - 4];
    let c0 = probe.search(/[^.]/);
    let c1 = probe.length - 1 - [...probe].reverse().join('').search(/[^.]/);
    const ch = probe[Math.floor((c0 + c1) / 2)];
    const body = rows.slice(0, h - 2).map((r) => '.'.repeat(ROOT_PAD) + r + '.'.repeat(ROOT_PAD));
    c0 += ROOT_PAD;
    c1 += ROOT_PAD;
    const width = body[0].length;
    const thick = c1 - c0 >= 3 ? 2 : 1;
    const R = ROOT_ROWS;
    const out = (n) => Math.round(n);
    // (each leg: its x on each root row, or null where it's off the ground; + is forward)
    const FRAMES = [
      [(r) => c0 - out(r * 0.9), (r) => c1 + out(r * 0.9)], // planted
      [(r) => (r <= 3 ? c0 + out(r * 0.8) : null), (r) => c1 + out(r * 0.45)], // back root swung forward
      [(r) => c0 - out(r * 0.3), (r) => c1 + out(r * 0.3)], // passing
      [(r) => c0 - out(r * 0.45), (r) => (r <= 3 ? c1 + 1 + out(r * 1.1) : null)], // front root reaching
    ];
    return FRAMES.map(([left, right], f) => {
      const roots = [];
      for (let r = 0; r < R; r++) {
        const row = Array(width).fill('.');
        if (r === 0) for (let x = c0; x <= c1; x++) row[x] = ch; // (the trunk, on into its roots)
        else {
          for (const [leg, inward] of [[left, 1], [right, -1]]) {
            const x = leg(r);
            if (x === null) continue;
            for (let k = 0; k < thick; k++) if (row[x + k * inward] !== undefined) row[x + k * inward] = ch;
            const planted = (f === 0 || f === 2 || (f === 1 && leg === right) || (f === 3 && leg === left));
            if (planted && r === R - 1 && row[x - inward] !== undefined) row[x - inward] = ch; // (a toe, gripping)
            if (r === 2 && row[x - inward] !== undefined && f !== 2) row[x - inward] = ch; // (a rootlet off it)
          }
        }
        roots.push(row.join(''));
      }
      return body.concat(roots);
    });
  }
  function drawFog(c, f, maxA, seed, low) {
    const cell = low ? 6 : 4;
    const W = c.clientWidth;
    const H = c.clientHeight;
    const cw = Math.max(1, Math.ceil(W / cell));
    const ch = Math.max(1, Math.ceil(H / cell));
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(cw, ch);
    const light = ['paper', 'daylight'].includes(document.documentElement.dataset.theme);
    const [r0, g0, b0] = light ? [110, 118, 128] : [200, 208, 220];
    const red = f.red || 0; // (the BLOOD FOG: the mist turning red)
    const [r, g, b] = [r0 + (170 - r0) * red, g0 + (14 - g0) * red, b0 + (24 - b0) * red].map(Math.round);
    const band = H > 150 ? 0.42 : 1;
    const sides = api.lane.classList.contains('saver-lane'); // (the screen saver's lane: fading out at its ends too)
    const sx = cell / 22;
    const sy = cell / 12;
    for (let y = 0; y < ch; y++) {
      // (thinning out toward the top: no hard edge; on the start screen's tall lane, only its
      // lower part, clear of the title)
      const rise = Math.max(0, Math.min(1, ((y / ch) - (1 - band)) / band * 1.8));
      if (!rise) continue; // (clear air: nothing to draw)
      for (let x = 0; x < cw; x++) {
        const px = f.dir > 0 ? x / cw : 1 - x / cw;
        const edge = Math.max(0, Math.min(1, (f.front * 1.35 - px) * 4)); // (the bank rolling in)
        if (!edge) continue;
        const side = sides ? Math.min(1, Math.min(x, cw - 1 - x) / (cw * 0.12)) : 1;
        const n = 0.65 * noise(x * sx + seed + f.t * 0.35 * f.dir, y * sy + seed) + 0.35 * noise(x * sx * 2.3 + seed + f.t * 0.6 * f.dir, y * sy * 2.3 + f.t * 0.1);
        const d = Math.max(0, Math.min(1, (n * 1.1 + 0.25 + (y / ch) * 0.25) * f.level - 0.15)) * edge * rise * rise * side;
        const i = (y * cw + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = Math.round(255 * maxA * d);
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function endFog() {
    if (fog.ground) fog.ground.remove();
    fog.back.remove();
    fog.fore.remove();
    fog.dark.remove();
    if (fog.moon) fog.moon.remove();
    fog.trees.forEach((t) => { t.gone = true; });
    fog = null;
  }
  // THE OVERCAST (OCTOBER and NOVEMBER, now and then; over the HAUNTED FOREST most of the time it
  // stands; the game card's lane): three layers of pixel cloud across the sky, rolling in from one
  // side. The far one darkest and slowest, the near one lightest, quickest and patchiest; each
  // drawn in masses with lit tops and dark undersides, so their stacking and thickness show where
  // they overlap. The birds and bats fly at one of three depths among them (behind the middle
  // layer, between, or in front of them all) and now and then climb or dip a layer, so they fly in
  // and out of the cloud. In OCTOBER it's purple-grey, and lightning flickers inside it now and
  // then, lighting it from within. After a few minutes it lifts (over the forest it stays).
  const CLOUD_ODDS = 0.25; // (each OCTOBER or NOVEMBER visit that comes due: the overcast instead)
  const CLOUD_TONES = {
    spooky: [[30, 24, 40], [50, 40, 64], [76, 63, 94]],
    grey: [[42, 45, 51], [62, 66, 73], [88, 92, 100]],
    storm: [[26, 29, 38], [42, 47, 58], [62, 68, 82]], // (weather.js's: a thunderstorm's, the hail's)
    snow: [[74, 78, 88], [100, 104, 114], [128, 132, 142]], // (and the snow's: pale, heavy)
  };
  let clouds = null;
  const cloudLane = () => api.lane.classList.contains('game-walkers');
  const cloudSeason = () => typeof Season !== 'undefined' && (Season.is('halloween') || Season.is('november'));
  // (tone: the weather's, weather.js, which holds the sky while it rains or snows)
  function startClouds(stays = false, tone = null) {
    if (clouds || !cloudLane()) return clouds;
    const now = performance.now();
    const el = (cls) => {
      const e = document.createElement(cls.startsWith('cloud-layer') ? 'canvas' : 'div');
      e.className = cls;
      e.setAttribute('aria-hidden', 'true');
      api.lane.appendChild(e);
      return e;
    };
    clouds = {
      phase: 'in', at: now, front: 0, level: 0, dir: Math.random() < 0.5 ? 1 : -1, t: rand(0, 200), drawn: 0, stays, spooky: spooky(),
      dark: el('cloud-dark'), flash: el('cloud-flash'), layers: [0, 1, 2].map((i) => el(`cloud-layer cloud-${i}`)),
      until: now + rand(150000, 260000), nextFlash: now + rand(5000, 12000), tone,
    };
    for (const v of list) if (v.alt !== undefined) setAlt(v, v.alt); // (the flyers already up: among them)
    api.botEvent('visit-overcast');
    return clouds;
  }
  function endClouds() {
    clouds.layers.forEach((c) => c.remove());
    clouds.dark.remove();
    clouds.flash.remove();
    api.lane.classList.remove('lightning');
    clouds = null;
  }
  function cloudsFrame(now) {
    const c = clouds;
    const age = now - c.at;
    if (c.phase === 'in') {
      c.front = Math.min(1, age / 20000);
      c.level = Math.min(1, age / 5000);
      if (c.front >= 1) { c.phase = 'stand'; c.at = now; }
    } else if (c.phase === 'stand') {
      if (c.stays && !(fog && fog.haunted)) { c.stays = false; c.until = now + rand(60000, 120000); } // (the forest gone: it lifts in a while)
      if (!c.stays && !c.held && now > c.until) { c.phase = 'lift'; c.at = now; }
    } else if (c.phase === 'lift') {
      c.level = 1 - Math.min(1, age / 12000);
      if (age > 12000) { endClouds(); return; }
    }
    c.dark.style.opacity = (c.level * Math.min(1, c.front * 1.5)).toFixed(2);
    if (c.spooky && c.phase === 'stand' && now > c.nextFlash) { // (lightning, deep in the cloud: a flicker and a second)
      c.nextFlash = now + rand(7000, 20000);
      c.flash.style.left = `${rand(5, 65).toFixed(0)}%`;
      const on = (ms, off) => setTimeout(() => { api.lane.classList.add('lightning'); setTimeout(() => api.lane.classList.remove('lightning'), off); }, ms);
      on(0, 90);
      on(170, 60);
      if (Math.random() < 0.5) on(420, 110);
    }
    const low = document.documentElement.classList.contains('low-fx');
    if (now - c.drawn < (low ? 240 : 120)) return;
    c.t += (now - (c.drawn || now)) / 1000;
    c.drawn = now;
    c.layers.forEach((cv, i) => drawClouds(cv, c, i, low));
  }
  function drawClouds(cv, c, i, low) {
    const cell = low ? 6 : 4;
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    if (!W || !H) return;
    const cw = Math.ceil(W / cell);
    const ch = Math.ceil(H / cell);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    const tone = CLOUD_TONES[c.spooky ? 'spooky' : c.tone || 'grey'][i];
    const drift = [0.05, 0.1, 0.17][i] * c.t * c.dir;
    const seed = [3, 47, 91][i];
    const sx = cell / [70, 56, 44][i];
    const sy = cell / [20, 17, 14][i];
    const yc = [0.32, 0.48, 0.62][i]; // (the far layer higher up, the near one lower)
    const hb = [0.36, 0.3, 0.26][i];
    const thr = [0.44, 0.5, 0.56][i]; // (the near one patchier: broken masses with sky between)
    const dens = new Float32Array(cw * ch);
    const top = Math.max(1, ch * 0.18);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        // (each mass its own height: the band rising and falling along the sky; fading out at the
        // very top, so no hard edge under the grid)
        const lift = 0.16 * (noise(x * sx * 0.35 - drift * 0.5 + seed * 2, seed) - 0.5);
        const v = (y / ch - yc - lift) / hb;
        const env = Math.max(0, 1 - v * v) * Math.min(1, y / top);
        if (!env) continue;
        const px = c.dir > 0 ? x / cw : 1 - x / cw;
        // (rolling in: the front ragged, not a line, and the masses thinning and breaking up toward
        // it, so the cloud drifts in rather than sliding in under a hard edge)
        const ragged = 0.18 * (noise(seed * 3, y * sy * 0.6 + c.t * 0.05) - 0.5);
        const edge = Math.max(0, Math.min(1, (c.front * 1.35 - px + ragged) * 2.2));
        if (!edge) continue;
        const n = 0.62 * noise(x * sx - drift + seed, y * sy + seed) + 0.38 * noise(x * sx * 2.2 - drift * 1.6 + seed, y * sy * 2.2 + seed);
        dens[y * cw + x] = (n * env * 1.25 * (0.55 + 0.45 * edge) - thr) * c.level * edge;
      }
    }
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(cw, ch);
    const opa = [0.96, 0.9, 0.78][i];
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const d = dens[y * cw + x];
        if (d <= 0) continue;
        const a = Math.ceil(Math.min(1, d * 5) * 4) / 4; // (in steps: a pixel cloud, not a blur)
        const up = y > 1 ? dens[(y - 2) * cw + x] : 0;
        const dn = y < ch - 2 ? dens[(y + 2) * cw + x] : 0;
        const shade = up < d * 0.45 ? 1.4 : dn < d * 0.45 ? 0.72 : 1; // (lit on top, dark underneath: its thickness)
        const k = (y * cw + x) * 4;
        img.data[k] = Math.min(255, Math.round(tone[0] * shade));
        img.data[k + 1] = Math.min(255, Math.round(tone[1] * shade));
        img.data[k + 2] = Math.min(255, Math.round(tone[2] * shade));
        img.data[k + 3] = Math.round(255 * a * opa);
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  // (a flyer's depth among the clouds: 0 behind the middle layer, 1 between, 2 in front of them all)
  function setAlt(v, alt) {
    v.el.classList.remove('v-alt-0', 'v-alt-1', 'v-alt-2');
    v.alt = alt;
    v.el.classList.add(`v-alt-${alt}`);
  }
  function forestVisit() {
    const r = Math.random();
    if (r < 0.2) { hordeVisit(); return; } // (a horde out of the trees and the mist)
    if (r < 0.3) bloodFog();
    else if (r < 0.42) swell();
    else eyesIn();
  }
  function swell() {
    const f = forest();
    if (f.phase !== 'light') return;
    f.phase = 'swell';
    f.at = performance.now();
    f.from = f.level;
    f.wraithGone = false;
  }
  // A MOON rising behind the trees: the BLOOD FOG's, or the WEREWOLF's full moon (moonSet: it sinks)
  function moonSprite(blood) {
    const R = 7;
    const craters = new Set(['3,4', '4,4', '4,5', '9,3', '10,3', '10,4', '10,9', '11,9', '10,10', '11,10', '9,10', '5,10', '6,10', '5,11', '7,6', '8,6', '12,6']);
    const a = [];
    for (let y = -R; y <= R; y++) {
      let row = '';
      for (let x = -R; x <= R; x++) {
        if (x * x + y * y > R * R + 2) row += '.';
        else row += craters.has(`${x + R},${y + R}`) ? 'M' : 'm';
      }
      a.push(row);
    }
    return { pal: blood ? { m: '#d8261e', M: '#9c1510' } : { m: '#f3edcf', M: '#cfc7a2' }, a };
  }
  function moonRise(blood) {
    const sky = document.createElement('div');
    sky.className = `moon-sky${blood ? ' blood' : ''}`;
    sky.setAttribute('aria-hidden', 'true');
    const def = moonSprite(blood);
    const size = 15 * (tall() ? 6 : 1.7);
    sky.innerHTML = `<svg class="moon" viewBox="0 0 15 15" width="${size}" height="${size}" shape-rendering="crispEdges">${rects(def.a, def.pal)}</svg>`;
    api.lane.insertBefore(sky, api.lane.firstChild); // (behind the trees)
    const m = sky.firstChild;
    m.style.left = `${(rand(0.55, 0.8) * api.laneW()).toFixed(0)}px`;
    m.style.bottom = `${-size - 4}px`;
    const to = tall() ? 0.34 * api.laneH() : 30;
    requestAnimationFrame(() => requestAnimationFrame(() => { m.style.bottom = `${to.toFixed(0)}px`; }));
    return sky;
  }
  function moonSet(sky) {
    if (!sky || sky.setting) return;
    sky.setting = true;
    const m = sky.firstChild;
    m.style.transitionDuration = '7s';
    m.style.bottom = `${-parseFloat(m.getAttribute('height')) - 4}px`;
    sky.style.opacity = '0';
    setTimeout(() => sky.remove(), 7500);
  }
  // THE BLOOD FOG (rare, in the HAUNTED FOREST): the mist thickens and turns from white to red as a
  // blood moon rises behind the trees; the wanderer comes out of it, red-eyed, after a bot (which
  // runs for it); gone, the red drains from the mist and the moon sinks
  function bloodFog() {
    const f = forest();
    if (f.phase !== 'light') return;
    f.phase = 'blood';
    f.at = performance.now();
    f.bstage = 'rise';
    f.chaser = false;
    f.wraithGone = false;
    f.from = f.level;
    f.moon = moonRise(true);
    api.botEvent('visit-bloodfog');
  }
  function bloodFrame(f, now, age) {
    if (f.bstage === 'rise') {
      const p = Math.min(1, age / 12000);
      f.red = p;
      f.level = f.from + (0.8 - f.from) * p;
      if (age > 9000 && !f.chaser) { f.chaser = true; chaseIn(); }
      if (f.chaser && f.wraithGone) {
        f.bstage = 'drain';
        f.drainAt = now;
        f.red0 = f.red;
        f.from = f.level;
        moonSet(f.moon);
        f.moon = null;
      }
    } else {
      const p = Math.min(1, (now - f.drainAt) / 10000);
      f.red = f.red0 * (1 - p);
      f.level = f.from + (0.35 - f.from) * p;
      if (p >= 1) { f.red = 0; f.phase = 'light'; f.at = now; }
    }
  }
  function chaseIn() {
    const W = api.laneW();
    const v = add('wraith', rand(0.15, 0.85) * W, Math.random() < 0.5 ? 1 : -1, { state: 'fadein', until: performance.now() + 1500, stops: 1, target: 0, scary: true, chaser: true, pal: { e: '#ff2a2a', c: '#9aa3ae', C: '#6b7480', h: '#0d0f13' } });
    v.el.classList.add('fog-wraith', 'scary');
    v.fogVisitor = true;
    v.el.style.opacity = '0';
    requestAnimationFrame(() => { v.el.style.opacity = '0.85'; });
    say(v, 'ooOOoo', 1400);
  }

  // THE WEREWOLF (OCTOBER): night falls over the card and a pale full moon rises; the werewolf
  // lopes in, stops, throws its head back and howls (the bots near it bolt, the rest jump), then
  // runs off at a sprint, and the moon sinks. Poked: a growl, and off
  function werewolfVisit(dir, edge, W) {
    const night = document.createElement('div');
    night.className = 'night-dark';
    night.setAttribute('aria-hidden', 'true');
    if (!fog) { api.lane.appendChild(night); requestAnimationFrame(() => requestAnimationFrame(() => night.classList.add('on'))); }
    const moon = moonRise(false);
    const v = add('werewolf', edge(SPRITES.werewolf.a[0].length * U * 1.15), dir, { state: 'wait', until: performance.now() + 3500, stopAt: rand(0.3, 0.6) * W });
    scaleTree(v, 1.15); // (a little bigger than the bots)
    v.onGone = () => {
      moonSet(moon);
      night.classList.remove('on');
      setTimeout(() => night.remove(), 3000);
    };
  }
  function werewolfFrame(v, now, dt, W) {
    if (v.state === 'wait') { if (now > v.until) v.state = 'go'; } // (the moon up first)
    else if (v.state === 'stand') { if (now > v.until) lopeOff(v); } // (there when the lights came on)
    else if (v.state === 'go') {
      v.x += v.dir * v.speed * dt;
      if ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt)) howl(v, now);
    } else if (v.state === 'howl' && now > v.until) {
      v.el.classList.remove('v-howl');
      lopeOff(v);
    } else if (v.state === 'run') v.x += v.dir * v.speed * dt;
  }
  function howl(v, now) {
    v.state = 'howl';
    v.howlAt = now;
    v.still = true;
    v.until = now + 2800;
    v.el.classList.add('v-howl');
    say(v, 'AWOOOOOO', 2600);
    api.botEvent('werewolf-howl');
    for (const b of api.walkers()) { // (the bots near it bolt; the rest jump)
      if (Math.abs(b.x - v.x) < 110) api.fright(b);
    }
    api.startle(v, 1e4);
  }
  function lopeOff(v) {
    v.state = 'run';
    v.still = false;
    v.speed *= 4;
    v.dir = v.x < api.laneW() / 2 ? -1 : 1;
  }

  // LIGHTS OUT (OCTOBER): the card goes dark, nothing showing but the bots' eyes, blinking. When the
  // lights flicker back on, one of the bots has moved, or a monster stands among them
  let lights = null;
  const EYE_X = [5, 9].map((x) => x * 34 / 16); // (the bots' eyes, on their 16-wide grid)
  function lightsOut() {
    const bots = api.walkers();
    if (lights || !bots.length) return;
    const now = performance.now();
    const dark = document.createElement('div');
    dark.className = 'lights-out';
    dark.setAttribute('aria-hidden', 'true');
    api.lane.appendChild(dark);
    lights = { dark, at: now, eyes: new Map(), outcome: Math.random() < 0.5 && bots.length > 1 ? 'moved' : 'monster', step: 0 };
    for (const b of bots) {
      api.hold(b, 6500);
      lights.eyes.set(b, darkEyes(b.x, b.look));
    }
    api.botEvent('visit-lightsout');
  }
  function darkEyes(x, look = 0, red = false) {
    const e = document.createElement('div');
    e.className = `dark-eyes${red ? ' red' : ''}`;
    e.style.left = `${(x + (look > 0 ? 1 : look < 0 ? -1 : 0)).toFixed(0)}px`;
    e.style.animationDelay = `${rand(0, 2).toFixed(2)}s`;
    e.innerHTML = EYE_X.map((ex) => `<i style="left:${ex.toFixed(1)}px"></i>`).join('');
    api.lane.appendChild(e);
    return e;
  }
  function lightsFrame(now) {
    const L = lights;
    const t = now - L.at;
    const W = api.laneW();
    if (L.step === 0 && t > 1800) { // (in the dark: one's eyes gone, or new ones open)
      L.step = 1;
      if (L.outcome === 'moved') {
        L.who = pick([...L.eyes.keys()].filter((b) => !b.leaving));
        if (L.who) L.eyes.get(L.who).style.opacity = '0';
      } else {
        const xs = [...L.eyes.keys()].map((b) => b.x);
        let x = rand(0.1, 0.8) * W;
        for (let k = 0; k < 10 && xs.some((bx) => Math.abs(bx - x) < 40); k++) x = rand(0.1, 0.8) * W;
        L.spot = x;
        L.monster = pick(['frank', 'mummy', 'nosferatu', 'creature', 'werewolf']);
        L.red = darkEyes(x + (L.monster === 'werewolf' ? 14 : 0), 0, true);
      }
    } else if (L.step === 1 && t > 2700) {
      L.step = 2;
      if (L.who) { // (somewhere else, in the dark)
        const xs = [...L.eyes.keys()].filter((b) => b !== L.who).map((b) => b.x);
        let x = rand(0.05, 0.85) * W;
        for (let k = 0; k < 12 && (xs.some((bx) => Math.abs(bx - x) < 40) || Math.abs(x - L.who.x) < 80); k++) x = rand(0.05, 0.85) * W;
        api.move(L.who, x);
        const e = L.eyes.get(L.who);
        e.style.left = `${x.toFixed(0)}px`;
        e.style.opacity = '1';
      }
    } else if (L.step === 2 && t > 4300) { // (the lights flicker back on)
      L.step = 3;
      L.dark.classList.add('on');
      L.eyes.forEach((e) => e.remove());
      if (L.red) L.red.remove();
      if (L.monster) {
        const m = add(L.monster, L.spot, Math.random() < 0.5 ? 1 : -1, { state: 'stand', until: now + 1600 });
        if (L.monster === 'werewolf') scaleTree(m, 1.15);
        say(m, pick(['BOO!', 'RAAH!', 'GRRR']), 1200);
        api.botEvent(`visit-${L.monster}`);
        for (const b of api.walkers()) {
          if (Math.abs(b.x - L.spot) < 80) api.fright(b);
          else api.say(b, 'scared', '!!');
        }
      } else if (L.who) {
        api.say(L.who, 'surprised', '?!');
        for (const b of api.walkers()) if (b !== L.who) { api.face(b, L.who.x); api.say(b, 'surprised', pick(['!?', '?'])); }
        api.botEvent('lights-moved');
      }
    } else if (L.step === 3 && t > 5100) {
      L.dark.remove();
      lights = null;
    }
  }

  // THE HAND (OCTOBER): the floor rumbles under a bot and a hand comes up through it and grabs it;
  // the bot struggles, breaks free and runs for it, and the hand sinks back. Poked: it lets go
  // A ZOMBIE HORDE (OCTOBER): three to seven, shuffling in from one side (out of the trees and the
  // mist in the forest), some clawing up out of the ground along the way; now and then, all at once,
  // they break into the THRILLER, in time with the music (or their own count, with none on), four
  // bars, then shuffle on and off the card
  let horde = null;
  function hordeVisit() {
    const W = api.laneW();
    const dir = Math.random() < 0.5 ? 1 : -1;
    const n = 3 + Math.floor(Math.random() * 5);
    const zw = 12 * U;
    const now = performance.now();
    horde = { dir, zs: [], danced: false, danceAt: now + rand(5000, 10000), dances: Math.random() < 0.65 };
    for (let i = 0; i < n; i++) {
      const up = Math.random() < 0.4; // (out of the ground, somewhere along the way)
      const x = up ? rand(0.12, 0.8) * W : (dir > 0 ? -zw - 4 - i * rand(16, 30) : W + 4 + i * rand(16, 30));
      const z = add('zombie', x, dir, { speed: KINDS.zombie.speed * rand(0.75, 1.25), horde });
      if (up) {
        z.state = 'rise';
        z.depth = 16 * U + 2;
        z.t0 = now + rand(0, 4000);
        z.el.style.clipPath = 'inset(-80px -80px 0 -80px)'; // (below the floor, out of sight)
        z.svgT = ` translateY(${z.depth}px)`;
      }
      horde.zs.push(z);
    }
    say(horde.zs[0], pick(['braaains...', 'uuurgh', 'BRAAAINS']), 1600);
    api.botEvent('visit-zombies');
  }
  // (the zombies: rising, and the dance, all of them together)
  function zombieFrame(v, now) {
    if (v.state === 'rise') {
      if (now < v.t0) return;
      const p = Math.min(1, (now - v.t0) / 1500);
      v.svgT = ` translateY(${(v.depth * (1 - p) + (p < 1 && Math.random() < 0.5 ? 1 : 0)).toFixed(1)}px)`;
      if (p >= 1) { v.state = 'go'; v.svgT = ''; v.el.style.clipPath = ''; }
    } else if (v.state === 'dance') {
      const h = v.horde;
      const i = Math.floor((now - h.t0) / h.ms);
      const left = i % 2 === 1;
      v.el.classList.toggle('z-c', !left);
      v.el.classList.toggle('z-d', left);
      v.x = v.danceX + (left ? -2 : 2) * U; // (the shuffle, side to side on the beat)
      if (now > h.until) {
        v.el.classList.remove('z-c', 'z-d');
        v.state = 'go';
        v.dir = h.dir;
        v.still = false;
      }
    }
  }
  function hordeTick(now) {
    if (!horde) return;
    const W = api.laneW();
    horde.zs = horde.zs.filter((z) => !z.gone);
    if (!horde.zs.length) { horde = null; return; }
    if (horde.danced || !horde.dances || now < horde.danceAt) return;
    const on = horde.zs.filter((z) => z.state === 'go' && z.x > 0 && z.x < W - 12 * U);
    if (on.length < 2) { horde.danceAt = now + 1500; return; }
    horde.danced = true;
    const b = typeof Music !== 'undefined' && Music.beat ? Music.beat() : null;
    horde.ms = b ? b.period * 1000 : 520;
    horde.t0 = b ? now - b.phase * horde.ms : now; // (on the music's own beat)
    horde.until = horde.t0 + horde.ms * 16;
    for (const z of horde.zs) {
      if (z.state !== 'go') continue;
      z.state = 'dance';
      z.danceX = z.x;
      z.dir = 1; // (all facing the same way, for the moves)
      z.still = true;
    }
    say(on[0], b ? '♪ THRILLER ♪' : '♪', 1800);
    api.botEvent('zombie-thriller');
  }
  function handVisit() {
    const bots = api.walkers().filter((b) => !['startled', 'vanish', 'poked'].includes(b.state));
    if (!bots.length) return;
    const b = pick(bots);
    if (b.partner) b.partner.partner = null;
    b.partner = null;
    b.state = 'idle'; // (stopped where it stands)
    api.hold(b, 5200);
    const now = performance.now();
    const H = SPRITES.hand.a.length * U;
    const side = Math.random() < 0.5 ? -1 : 1; // (at its feet, to one side: a leg)
    const v = add('hand', b.x + 17 - 4 * U + side * 13, -side, { state: 'rumble', until: now + 700, prey: b, t0: now, depth: H + 2 });
    v.el.classList.add('v-front');
    v.el.style.clipPath = 'inset(-80px -80px 0 -80px)'; // (below the floor, out of sight)
    v.svgT = ` translateY(${v.depth}px)`;
    api.say(b, 'worried', '?');
    api.botEvent('visit-hand');
  }
  function handFrame(v, now) {
    const b = v.prey;
    if (v.state === 'rumble') {
      v.svgT = ` translateY(${v.depth - (Math.random() < 0.5 ? 1 : 0)}px)`; // (the floor shaking)
      if (now > v.until) { v.state = 'rise'; v.t0 = now; }
    } else if (v.state === 'rise' || v.state === 'sink') {
      const p = Math.min(1, (now - v.t0) / 600);
      v.svgT = ` translateY(${(v.depth * (v.state === 'rise' ? 1 - p : p)).toFixed(1)}px)`;
      if (p < 1) return;
      if (v.state === 'sink') { v.gone = true; return; }
      v.state = 'grab'; // (got it)
      v.until = now + 1700;
      v.el.classList.add('step');
      if (b && !b.leaving) { api.hold(b, 2000); api.say(b, 'scared', '!!'); b.el.classList.add('shaking'); }
    } else if (v.state === 'grab' && now > v.until) letGo(v, now);
    else if (v.state === 'lost' && now > v.until) { v.state = 'sink'; v.t0 = now; }
  }
  function letGo(v, now) { // (the bot breaks free and runs; the hand grasps at the air)
    const b = v.prey;
    v.state = 'lost';
    v.until = now + 900;
    v.el.classList.remove('step');
    if (b) { b.el.classList.remove('shaking'); api.fright(b); }
    v.prey = null;
  }

  // THE POSSESSED BOT (OCTOBER): one of the bots, red-eyed, walking stiffly (wanderers.js); poked,
  // a little ghost shakes out of it (spirit()) and floats away
  function possessVisit() {
    const bots = api.walkers().filter((b) => !b.possessed);
    if (bots.length) api.possess(pick(bots));
  }
  function spirit(x) {
    const v = add('spirit', x - 3.5 * U, Math.random() < 0.5 ? 1 : -1, { state: 'rise', y: 12, until: performance.now() + 2600 });
    v.el.classList.add('v-front');
    say(v, 'ooOOoo', 1400);
    requestAnimationFrame(() => { v.el.style.transition = 'opacity 2.4s ease-in'; v.el.style.opacity = '0'; });
    api.botEvent('exorcise');
  }

  // The FOG WANDERER: out of the mist, from spot to spot, and back into it by a tree
  function wraithIn() {
    const W = api.laneW();
    if (spooky() && Math.random() < 0.6) return monsterIn(pick(['frank', 'mummy', 'creature', 'nosferatu', 'ghost']), W);
    const scary = spooky();
    const v = add('wraith', rand(0.15, 0.8) * W, Math.random() < 0.5 ? 1 : -1, { state: 'fadein', until: performance.now() + 1800, stops: 2 + Math.floor(Math.random() * 2), target: 0, scary, ...(scary ? { pal: { e: '#ff2a2a', c: '#9aa3ae', C: '#6b7480', h: '#0d0f13' } } : {}) });
    if (scary) v.el.classList.add('scary');
    v.el.classList.add('fog-wraith');
    v.fogVisitor = true;
    v.el.style.opacity = '0';
    requestAnimationFrame(() => { v.el.style.opacity = '0.85'; });
    say(v, scary ? pick(['ooOOoo', '...']) : '...', 1400);
  }
  // HALLOWEEN's fog: one of the monsters comes out of the mist by a tree near one side, crosses (the
  // bots it passes scared, as ever) and fades back into the fog before the other side
  function monsterIn(kind, W) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const v = add(kind, dir > 0 ? rand(0.03, 0.15) * W : rand(0.75, 0.88) * W, dir, { fogVisitor: true, fogExit: dir > 0 ? rand(0.68, 0.82) * W : rand(0.12, 0.25) * W });
    v.el.classList.add('fog-visitor');
    v.el.style.opacity = '0';
    requestAnimationFrame(() => { v.el.style.opacity = '1'; });
    api.botEvent(`visit-${kind}`);
  }
  function wraithFrame(v, now, dt, W) {
    v.y = 2 + Math.sin(v.age / 600) * 2; // (floating)
    if (v.state === 'fadein' && now > v.until) {
      v.state = 'roam';
      v.target = rand(0.1, 0.85) * W;
      const bots = api.walkers();
      if (v.chaser && bots.length) { // (the BLOOD FOG's: after a bot)
        v.state = 'chase';
        v.prey = pick(bots);
        v.speed = 40;
        v.until = now + 14000;
        say(v, pick(['ooOOOO', '...']), 1200);
      }
    } else if (v.state === 'chase') {
      const b = v.prey;
      if (!b || b.gone || b.x < -30 || b.x > W - 4 || now > v.until) fadeAway(v, now, 1600);
      else {
        v.dir = b.x > v.x ? 1 : -1;
        v.x += v.dir * Math.min(v.speed * dt, Math.abs(b.x - v.x));
        if (!v.caught && Math.abs(b.x - v.x) < 34) { v.caught = true; api.fright(b); api.botEvent('bloodfog-chase'); }
      }
    }
    else if (v.state === 'roam') {
      v.dir = v.target > v.x ? 1 : -1;
      v.x += v.dir * Math.min(v.speed * dt, Math.abs(v.target - v.x));
      if (Math.abs(v.target - v.x) < 0.5) { v.state = 'linger'; v.until = now + rand(1500, 2800); }
    } else if (v.state === 'linger' && now > v.until) {
      if (--v.stops > 0) { v.state = 'roam'; v.target = rand(0.1, 0.85) * W; } else fadeAway(v, now);
    } else if (v.state === 'fade' && now > v.until) { v.gone = true; if (fog) fog.wraithGone = true; }
    if (v.state !== 'fade') { // (any bot it nears: a fright, or a bolt off the card)
      for (const b of api.walkers()) {
        if (v.scared.has(b) || Math.abs(b.x - v.x) > 50) continue;
        v.scared.add(b);
        if (Math.random() < (v.scary ? 0.75 : 0.45) && api.fright) api.fright(b); // (on HALLOWEEN, most bolt)
        else api.startle(v, 50);
      }
    }
  }
  function fadeAway(v, now, ms = 2200) { // (toward the nearest tree, fading into the mist)
    const tree = fog && fog.trees.reduce((best, t) => (!best || Math.abs(t.x - v.x) < Math.abs(best.x - v.x) ? t : best), null);
    v.state = 'fade';
    v.until = now + ms;
    if (tree) v.drift = tree.x;
    v.el.style.transition = `opacity ${ms}ms ease-in`;
    v.el.style.opacity = '0';
  }

  // VIRUSES (any time of year, rarely): the PHAGE (kind 'virus'), the BUG and the TROJAN. Each walks
  // in from a side or pixelates in right on the card, scuttles from spot to spot and leaves; a bot
  // it comes near jumps (not the TROJAN's: it looks like one of them, until it's poked). Poked, it's
  // DELETED: it bursts into its own pixels (as a bit bursts, finer) or deteriorates, pixel by pixel.
  const VIRUS_KINDS = ['virus', 'bug', 'trojan', 'worm', 'ransomware', 'spyware', 'adware', 'logicbomb'];
  let virusTurn = 0;
  const nextVirus = () => (virusOften() ? VIRUS_KINDS[virusTurn++ % VIRUS_KINDS.length] : pick(VIRUS_KINDS));
  function virusVisit(kind, dir, edge, W) {
    const pop = Math.random() < 0.5;
    const w = SPRITES[kind].a[0].length * U;
    const v = add(kind, pop ? rand(0.15, 0.8) * W : edge(w), dir, { state: 'roam', target: rand(0.15, 0.8) * W, stops: 2 + Math.floor(Math.random() * 3), virus: true });
    if (kind === 'trojan') { // (in disguise: one of the bots, any of them)
      const look = miniBot(pick(['bot', 'grifter', 'bunker', 'glitch']), 'normal');
      look.classList.add('trojan-look');
      v.el.appendChild(look);
      v.el.classList.add('disguised');
      v.disguised = true;
      v.speed = rand(18, 26);
    }
    if (kind === 'logicbomb') v.boomAt = performance.now() + rand(8000, 11000); // (its fuse)
    if (kind === 'spyware') { v.fly = rand(20, 30); v.y = v.fly; }
    if (kind === 'adware') { // (no walking: it pops up, here, there, everywhere)
      v.dir = 1; // (never mirrored: its close box stays top right)
      v.state = 'popup';
      v.pops = 4 + Math.floor(Math.random() * 3);
      v.until = 0;
      v.ad = document.createElement('span');
      v.ad.className = 'adware-text';
      v.el.appendChild(v.ad);
    }
    if (pop && kind !== 'adware') {
      v.state = 'lurk';
      v.still = true;
      v.until = performance.now() + rand(1000, 1600);
      v.el.classList.add('v-popin');
      setTimeout(() => v.el.classList.remove('v-popin'), 500);
      if (!v.disguised) api.startle(v, 60); // (the bots near where it appears jump)
    }
  }
  // The other viruses, each its own way about (each returns true when it's handled the frame; false
  // leaves it to the PHAGE's scuttle from spot to spot)
  const nearest = (v) => api.walkers().slice().sort((a, b) => Math.abs(a.x - v.x) - Math.abs(b.x - v.x))[0];
  const VIRUS_WAYS = {
    // WORM: inches along; at a stop it tunnels, sinking into the floor and popping up elsewhere
    worm(v, now, dt, W) {
      const H = SPRITES.worm.a.length * U + 2;
      if (v.state === 'lurk' && now > v.until && v.stops > 1 && !v.dug) {
        v.dug = true;
        v.state = 'sink';
        v.t0 = now;
        v.el.style.clipPath = 'inset(-80px -80px 0 -80px)'; // (below the floor, out of sight)
        return true;
      }
      if (v.state === 'sink' || v.state === 'rise') {
        const p = Math.min(1, (now - v.t0) / 650);
        v.svgT = ` translateY(${((v.state === 'sink' ? p : 1 - p) * H).toFixed(1)}px)`;
        if (p >= 1 && v.state === 'sink') {
          v.x = rand(0.1, 0.85) * W;
          v.state = 'rise';
          v.t0 = now;
        } else if (p >= 1) {
          v.svgT = '';
          v.dug = false;
          v.stops--;
          v.state = 'roam';
          v.target = rand(0.1, 0.85) * W;
          if (Math.random() < 0.5) say(v, pick(['pop!', '>:)', '01']), 800);
          api.startle(v, 40);
        }
        return true;
      }
      return false;
    },
    // RANSOMWARE: walks up to a bot and demands payment; the bot freezes, worried, till it goes
    ransomware(v, now, dt, W) {
      if (v.state === 'roam' && !v.victim) {
        const b = nearest(v);
        if (b && Math.abs(b.x - v.x) < W * 0.7) { v.victim = b; v.state = 'approach'; }
      }
      if (v.state === 'approach') {
        const b = v.victim;
        if (!api.walkers().includes(b)) { v.victim = null; v.state = 'roam'; return false; }
        const to = v.x < b.x ? b.x - 26 : b.x + 36;
        v.dir = to > v.x ? 1 : -1;
        v.x += v.dir * Math.min(v.speed * dt, Math.abs(to - v.x));
        v.el.classList.add('moving');
        if (Math.abs(to - v.x) < 1) {
          v.state = 'demand';
          v.still = true;
          v.dir = b.x > v.x ? 1 : -1;
          v.until = now + 4200;
          v.el.classList.remove('moving');
          say(v, 'PAY UP', 1800);
          setTimeout(() => { if (v.state === 'demand') say(v, '1 BTC', 1800); }, 2000);
          api.hold(b, 4400);
          api.face(b, v.x);
          api.say(b, 'worried', '?!');
          api.botEvent('ransomware');
        }
        return true;
      }
      if (v.state === 'demand') {
        if (now > v.until) {
          v.still = false;
          v.state = 'out';
          v.dir = v.x < W / 2 ? -1 : 1;
          if (api.walkers().includes(v.victim)) api.say(v.victim, 'annoyed', '-_-');
        }
        return true;
      }
      return false;
    },
    // SPYWARE: a floating eye that tails a bot, peeking at it; the bot notices, suspicious
    spyware(v, now, dt, W) {
      v.y = v.fly + Math.sin(v.age / 420) * 3;
      if (v.state === 'roam' && !v.mark) {
        const b = pick(api.walkers());
        if (b) { v.mark = b; v.state = 'tail'; v.tailUntil = now + rand(7000, 10000); v.noticeAt = now + rand(1500, 2500); }
      }
      if (v.state === 'tail') {
        const b = v.mark;
        if (!api.walkers().includes(b) || now > v.tailUntil) {
          v.state = 'out';
          v.dir = v.x < W / 2 ? -1 : 1;
          return true;
        }
        const to = b.x + SIZE_BOT / 2 - (b.look || 1) * 30;
        const d = to - v.x;
        if (Math.abs(d) > 1) { v.dir = d > 0 ? 1 : -1; v.x += v.dir * Math.min(v.speed * dt, Math.abs(d)); }
        if (now > v.noticeAt) {
          api.face(b, v.x);
          api.say(b, 'skeptic', v.noticed ? 'hm' : '?');
          if (!v.noticed) api.botEvent('spyware-noticed');
          v.noticed = true;
          v.noticeAt = now + rand(2500, 3500);
        }
        return true;
      }
      return false;
    },
    // ADWARE: no walking: it pops up here, there, everywhere (WIN $$$!), then it's gone
    adware(v, now, dt, W) {
      if (v.state !== 'popup') return true;
      if (now < v.until) return true;
      if (v.pops-- <= 0) {
        v.state = 'gone';
        v.still = true;
        v.el.classList.add('v-popout');
        setTimeout(() => { v.gone = true; }, 500);
        return true;
      }
      v.x = rand(0.05, 0.8) * W;
      v.y = rand(0, 28);
      v.ad.textContent = pick(['WIN $$$!', 'CLICK ME', 'FREE RAM', 'HOT BITS', 'U WON!!', '1 NEW MSG', 'XXL RAM']);
      v.el.classList.remove('v-popin');
      void v.el.offsetWidth;
      v.el.classList.add('v-popin');
      if (Math.random() < 0.5) api.startle(v, 45);
      v.until = now + rand(1300, 2100);
      return true;
    },
    // LOGIC BOMB: walks about with its fuse lit; not poked (DEFUSED) in time, it goes off: a big
    // burst, and every bot near it is scared off
    logicbomb(v, now, dt, W) {
      if (v.state === 'gone') return true;
      const left = v.boomAt - now;
      v.el.classList.toggle('v-fuse-hot', left < 3000);
      if (left < 3000) {
        const n = String(Math.max(1, Math.ceil(left / 1000)));
        if (v.count !== n) { v.count = n; say(v, n, 700); }
      }
      if (left > 0) return false;
      v.state = 'gone';
      v.still = true;
      if (inSight(v.el) && typeof FX !== 'undefined' && FX.shatter) {
        const px = pixelsOf(v);
        FX.shatter(px.concat(px.map((p) => ({ ...p, color: '255, 160, 40' }))));
      }
      v.el.querySelector(':scope > svg').style.visibility = 'hidden';
      say(v, 'BOOM', 900);
      api.startle(v, 140);
      for (const b of api.walkers()) if (Math.abs(b.x - v.x) < 120) api.fright(b);
      api.botEvent('logic-bomb');
      setTimeout(() => { v.gone = true; }, 900);
      return true;
    },
  };
  const SIZE_BOT = 34;

  // HALLOWEEN's BIG SPIDER: scuttles from spot to spot about the card, leaping now and then (a
  // bot it lands near jumps), and out; poked, it hisses and leaps away
  function bigSpider(v, now, dt, W) {
    if (v.leap) {
      const p = Math.min(1, (now - v.leap.t0) / v.leap.ms);
      v.x = v.leap.from + (v.leap.to - v.leap.from) * p;
      v.y = Math.sin(p * Math.PI) * v.leap.h;
      if (p >= 1) { v.y = 0; v.leap = null; api.startle(v, 55); }
      return;
    }
    if (v.state === 'roam') {
      v.dir = v.target > v.x ? 1 : -1;
      v.x += v.dir * Math.min(v.speed * dt, Math.abs(v.target - v.x));
      if (Math.random() < dt * 0.45) { // (a leap: up and over, toward where it's going)
        const to = Math.max(0, Math.min(W - SPRITES.bigspider.a[0].length * U, v.x + v.dir * rand(30, 60)));
        v.leap = { t0: now, from: v.x, to, h: rand(14, 26), ms: rand(420, 560) };
      } else if (Math.abs(v.target - v.x) < 0.5) {
        v.state = 'lurk';
        v.still = true;
        v.until = now + rand(700, 1600);
      }
    } else if (v.state === 'lurk' && now > v.until) {
      v.still = false;
      if (--v.stops > 0) { v.state = 'roam'; v.target = rand(0.1, 0.85) * W; } else { v.state = 'out'; v.dir = v.x < W / 2 ? -1 : 1; }
    } else if (v.state === 'out') v.x += v.dir * v.speed * 1.5 * dt;
    v.el.classList.toggle('moving', v.state === 'roam' || v.state === 'out' || !!v.leap);
    for (const b of api.walkers()) { // (a bot it comes near jumps, once each)
      if (v.scared.has(b) || Math.abs(b.x - v.x) > 40) continue;
      v.scared.add(b);
      api.startle(v, 45);
    }
  }

  // Whether it's in sight where it stands (not under a card or menu): what's on top at its middle
  function inSight(el) {
    const r = el.getBoundingClientRect();
    if (!r.width) return false;
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && el.contains(top);
  }
  // Its own pixels as they're drawn now (the frame showing), in page coordinates and their colors
  function shownFrame(v) {
    return [...v.el.querySelectorAll(':scope > svg > g')].find((g) => getComputedStyle(g).display !== 'none');
  }
  function pixelsOf(v) {
    const g = shownFrame(v);
    const out = [];
    if (!g) return out;
    for (const r of g.querySelectorAll('rect')) {
      const b = r.getBoundingClientRect();
      const n = Number(r.getAttribute('width')) || 1;
      const u = b.width / n;
      const hex = r.getAttribute('fill');
      const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
      for (let i = 0; i < n; i++) out.push({ x: b.left + u * (i + 0.5), y: b.top + b.height / 2, size: u, color: rgb });
    }
    return out;
  }
  // DELETED: a word, then it bursts into its pixels, or crumbles away pixel by pixel
  function kill(v) {
    v.state = 'gone';
    v.still = true;
    say(v, v.kind === 'logicbomb' ? 'DEFUSED' : pick(['DELETED', 'ERR!', 'NOOO', '404']), 1000);
    api.botEvent('virus-deleted');
    const seen = inSight(v.el);
    if (Math.random() < 0.5) {
      setTimeout(() => {
        if (seen && typeof FX !== 'undefined' && FX.shatter) FX.shatter(pixelsOf(v));
        v.el.querySelector(':scope > svg').style.visibility = 'hidden';
        setTimeout(() => { v.gone = true; }, 900);
      }, 150);
    } else decay(v);
  }
  // The pixel deterioration (as the screen goes into the screen saver): its pixels drop out in a
  // random order, in steps
  // THE SNOWMAN SNEAKS OFF: a while after it's left standing, its eyes shift side to side and it
  // blinks, checking no one's watching; then it hops off the way it faces, hop after hop, off the
  // card. One time in five it trips, or its head falls off: it stays put a couple of seconds, then
  // comes apart into a fine powder of snow, every pixel of it breaking off (in finer specks),
  // drifting down as the falling snow does, from the top first so it slumps little by little,
  // settling in a heap at its feet and melting away a speck at a time.
  function snowmanWaits(v, now) {
    if (v.x !== v.lastX) { // (still being pushed, or just left)
      v.lastX = v.x;
      v.stillSince = now;
      v.sneakAfter = rand(25000, 60000);
      return;
    }
    if (now - v.stillSince < v.sneakAfter || foggy()) return; // (not in the fog)
    v.state = 'peek';
    v.peekAt = now;
    v.eyes = [...v.el.querySelectorAll('.f-a rect')].filter((r) => r.getAttribute('y') === '4' && r.getAttribute('fill') === '#1b1f27');
    v.eyeX = v.eyes.map((r) => Number(r.getAttribute('x')));
  }
  const SNOW_LOOK = [[0, -1], [550, 1], [1100, -1], [1650, 0], [2000, 'blink'], [2180, 0], [2420, 'blink'], [2600, 0]];
  function snowmanEyes(v, how) {
    v.eyes.forEach((r, i) => {
      r.setAttribute('x', v.eyeX[i] + (how === 'blink' ? 0 : how));
      r.setAttribute('fill', how === 'blink' ? '#b8c4d6' : '#1b1f27'); // (shut: a line of shade)
    });
  }
  function snowmanSneaks(v, now, dt) {
    if (v.state === 'peek') {
      const t = now - v.peekAt;
      let how = 0;
      for (const [at, h] of SNOW_LOOK) if (t >= at) how = h;
      snowmanEyes(v, how);
      if (t > 3000) {
        v.state = 'hop';
        v.hopAt = now;
        v.speed = rand(26, 34);
        v.trips = Math.random() < 0.2 ? rand(1200, 3000) : 0; // (it trips, or loses its head, this far in)
        api.botEvent('snowman-sneak');
      }
    } else if (v.state === 'hop') {
      const t = now - v.hopAt;
      const p = (t % 520) / 520; // (a hop: up and down, moving only in the air)
      v.y = Math.sin(p * Math.PI) * 7;
      if (p > 0.08 && p < 0.92) v.x += v.dir * v.speed * dt;
      if (v.trips && t > v.trips && p < 0.1) {
        v.state = 'fallen';
        v.y = 0;
        v.fallAt = now;
        // (leaning by rows, as pixel art leans: stumbling forward, or its head knocked loose)
        v.el.querySelector(':scope > svg').style.transformOrigin = '50% 100%';
        if (Math.random() < 0.5) { v.svgT = ' skewX(-22deg)'; say(v, 'oof', 1400); }
        else { v.svgT = ' skewX(14deg)'; say(v, 'my head!', 1400); }
        api.botEvent('snowman-fall');
      }
    } else if (v.state === 'fallen' && now - v.fallAt > 2000) {
      v.state = 'powder';
      snowPowder(v);
    }
  }
  // The snowman's powder: each pixel of it as it stands now, split in four, on a canvas over it
  function snowPowder(v) {
    const g = shownFrame(v);
    const box = v.el.getBoundingClientRect();
    if (!g || !box.width) { v.gone = true; return; }
    const PAD = 44; // (room either side for the heap to spread)
    const W = Math.ceil(box.width + PAD * 2);
    const H = Math.ceil(box.height + 4);
    const specks = [];
    for (const r of g.querySelectorAll('rect')) {
      const b = r.getBoundingClientRect();
      const n = Math.max(1, Number(r.getAttribute('width')) || 1);
      const u = b.width / n;
      if (!u || !b.height) continue;
      const fill = r.getAttribute('fill');
      for (let i = 0; i < n; i++) {
        for (let sy = 0; sy < 2; sy++) {
          for (let sx = 0; sx < 2; sx++) {
            const x = b.left - box.left + PAD + i * u + sx * u / 2;
            const y = b.top - box.top + sy * b.height / 2;
            specks.push({ x, y, s: u / 2, c: fill, vx: 0, vy: 0, top: y });
          }
        }
      }
    }
    if (!specks.length) { v.gone = true; return; }
    const minY = Math.min(...specks.map((p) => p.top));
    const span = Math.max(1, Math.max(...specks.map((p) => p.top)) - minY);
    const floor = H - 2;
    const heap = new Map(); // (how high the heap stands at each column of specks)
    for (const p of specks) {
      // (from the top down, so it slumps: the higher a speck, the sooner it lets go)
      p.go = ((p.top - minY) / span) * 2600 + rand(0, 700);
      p.vx = rand(-9, 9);
      p.sway = rand(0, 6.28);
    }
    const cv = document.createElement('canvas');
    cv.className = 'snow-powder';
    const dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    Object.assign(cv.style, { width: `${W}px`, height: `${H}px`, left: `${-PAD}px` });
    v.el.appendChild(cv);
    v.el.querySelector(':scope > svg').style.visibility = 'hidden';
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    const t0 = performance.now();
    let last = t0;
    const step = (now) => {
      const t = now - t0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of specks) {
        if (p.done) continue;
        alive++;
        if (t > p.go && !p.landed) { // (drifting down like the falling snow, a gentle sway)
          p.vy = Math.min(p.vy + 140 * dt, 38);
          p.x += (p.vx + Math.sin(t / 300 + p.sway) * 6) * dt;
          p.y += p.vy * dt;
          let col = Math.round(p.x / p.s);
          const h = (c) => heap.get(c) || 0;
          const LAYER = p.s * 0.34; // (a heap has depth: three specks to a layer of it)
          if (p.y >= floor - h(col) * LAYER) {
            // (a heap of powder: a speck rolls off to the lower side while it's higher than its
            // neighbors, so the snow spreads out low and wide rather than piling up)
            for (let k = 0; k < 40; k++) {
              const l = h(col - 1);
              const r = h(col + 1);
              if (h(col) <= Math.min(l, r) + 1) break;
              col += l < r || (l === r && Math.random() < 0.5) ? -1 : 1;
            }
            p.x = col * p.s;
            p.y = floor - h(col) * LAYER;
            p.col = col;
            p.landed = t;
            heap.set(col, h(col) + 1);
            p.melt = rand(300, 1800); // (then it melts, a speck at a time)
          }
        }
        let a = 1;
        if (p.landed) {
          a = 1 - (t - p.landed - p.melt) / 1400;
          if (a <= 0) { p.done = true; heap.set(p.col, Math.max(0, (heap.get(p.col) || 0) - 1)); continue; }
          a = Math.min(1, a);
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      if (alive && !v.gone) requestAnimationFrame(step);
      else v.gone = true;
    };
    requestAnimationFrame(step);
  }

  function decay(v) {
    const g = shownFrame(v);
    if (!g) { v.gone = true; return; }
    const units = [];
    for (const r of [...g.querySelectorAll('rect')]) { // (each run of color split into single pixels)
      const x = Number(r.getAttribute('x'));
      const n = Number(r.getAttribute('width')) || 1;
      for (let i = 0; i < n; i++) {
        const u = r.cloneNode();
        u.setAttribute('x', x + i);
        u.setAttribute('width', 1);
        g.appendChild(u);
        units.push(u);
      }
      r.remove();
    }
    for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
    const STEPS = 9;
    for (let k = 0; k < STEPS; k++) {
      setTimeout(() => {
        units.slice(Math.floor((k * units.length) / STEPS), Math.floor(((k + 1) * units.length) / STEPS)).forEach((u) => u.remove());
        if (k === STEPS - 1) setTimeout(() => { v.gone = true; }, 500);
      }, 200 + k * 75);
    }
  }
  // The TROJAN unmasked: its disguise pixelates off, the horse pixelates in, it laughs and bolts
  // The disguise coming off: the bot's pixels peel away from the top down, each flying off on its
  // own, while the horse resolves underneath them, top first, as they go
  function unmask(v) {
    v.disguised = false;
    const look = v.el.querySelector('.trojan-look');
    const box = v.el.getBoundingClientRect();
    const bits = [];
    if (look) {
      const lb = look.getBoundingClientRect();
      for (const r of look.querySelectorAll('rect')) {
        const cs = getComputedStyle(r);
        if (cs.display === 'none' || cs.visibility === 'hidden' || !cs.fill || cs.fill === 'none' || r.closest('[style*="display: none"]')) continue;
        const rb = r.getBoundingClientRect();
        const n = Math.max(1, Number(r.getAttribute('width')) || 1);
        const m = Math.max(1, Number(r.getAttribute('height')) || 1);
        const px = rb.width / n;
        const py = rb.height / m;
        if (!px || !py) continue;
        for (let j = 0; j < m; j++) { // (every pixel of it on its own)
          for (let i = 0; i < n; i++) {
            const y = rb.top - box.top + j * py;
            bits.push({ x: rb.left - box.left + i * px, y, w: px, h: py, c: cs.fill, row: (rb.top + j * py - lb.top) / (lb.height || 1) });
          }
        }
      }
      look.remove();
    }
    v.el.classList.remove('disguised');
    v.el.classList.add('unmasked', 'unmasking');
    const cx = box.width / 2;
    for (const b of bits) {
      const d = document.createElement('i');
      d.className = 'trojan-peel';
      Object.assign(d.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`, background: b.c });
      v.el.appendChild(d);
      const dx = (b.x - cx) * rand(0.4, 1.1) + rand(-8, 8);
      const dy = -rand(6, 22) + b.row * rand(4, 14);
      d.animate([
        { transform: 'translate(0, 0)', opacity: 1 },
        { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`, opacity: 0 },
      ], { duration: rand(380, 620), delay: b.row * 320 + rand(0, 60), easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both' });
    }
    setTimeout(() => {
      v.el.querySelectorAll('.trojan-peel').forEach((d) => d.remove());
      v.el.classList.remove('unmasking');
    }, 1100);
    say(v, pick(['HEHE', 'BUSTED', '>:)']), 1200);
    api.botEvent('trojan-unmasked');
    api.startle(v, 70);
    v.state = 'out';
    v.still = false;
    v.speed = 60;
    v.dir = v.x < api.laneW() / 2 ? -1 : 1;
  }

  // NOVEMBER's migrating birds: a flock flying over (geese in a V, ducks in a line, a scatter of
  // songbirds, swallows swooping fast). Now and then one drops out to land, pecks about, chirps at
  // a bot near it (which reacts), and flies off after the others.
  const FLOCKS = { geese: { kind: 'goose', n: [5, 8] }, ducks: { kind: 'duck', n: [3, 5] }, songbirds: { kind: 'songbird', n: [4, 7] }, swallows: { kind: 'swallow', n: [3, 6] } };
  const SONGBIRDS = [
    { b: '#6b5a4e', c: '#e0662b' }, // (robins)
    { b: '#3b6fd1', c: '#d9874a' }, // (bluebirds)
    { b: '#e8c21f', c: '#f2d84a', o: '#6b5a2e' }, // (goldfinches)
    { b: '#d42a2a', c: '#b51f1f' }, // (cardinals)
  ];
  function flock(what, dir, edge, W) {
    const f = FLOCKS[what];
    const count = f.n[0] + Math.floor(Math.random() * (f.n[1] - f.n[0] + 1));
    const base = what === 'geese' ? sky(0.55, 0.85, () => rand(22, 28)) : what === 'swallows' ? sky(0.2, 0.5, () => rand(12, 22)) : sky(0.3, 0.7, () => rand(16, 28));
    const speed = KINDS[f.kind].speed * rand(0.9, 1.1);
    const pal = what === 'songbirds' ? pick(SONGBIRDS) : undefined;
    const lander = Math.random() < 0.35 ? 1 + Math.floor(Math.random() * (count - 1)) : -1; // (never the lead goose)
    const id = {};
    const w = SPRITES[f.kind].a[0].length * U;
    for (let k = 0; k < count; k++) {
      let x = edge(w);
      let y = base;
      let sp = speed;
      if (what === 'geese') { // (a V: the leader out front, the rest behind it on either side)
        const rank = Math.ceil(k / 2);
        x -= dir * rank * 24;
        y += (k % 2 ? 1 : -1) * rank * (tall() ? 6 : 2.5);
      } else if (what === 'ducks') { // (a line, stepping down)
        x -= dir * k * 18;
        y -= k * (tall() ? 5 : 2);
      } else { // (loose: each at its own height and pace)
        x -= dir * (k * rand(12, 26) + rand(0, 10));
        y += rand(-6, 6);
        sp *= rand(0.85, 1.15);
      }
      const b = add(f.kind, x, dir, { fly: Math.max(4, y), speed: sp, flock: id, lands: k === lander, stopAt: rand(0.2, 0.7) * W, life: rand(3500, 7000), ...(pal ? { pal } : {}) });
      b.el.classList.add('v-fly');
    }
  }
  // A landed bird calls to the nearest bot, which reacts
  function greet(v) {
    const k = KINDS[v.kind];
    say(v, k.call, 1000);
    let near = null;
    for (const b of api.walkers()) if (Math.abs(b.x - v.x) < 70 && (!near || Math.abs(b.x - v.x) < Math.abs(near.x - v.x))) near = b;
    if (near) setTimeout(() => { if (!near.leaving) api.say(near, pick(['happy', 'surprised', 'love']), true); }, 450);
  }
  function wingbeat(v, now, ms) {
    if (now - v.frameAt < ms) return;
    v.frameAt = now;
    v.frame = 1 - v.frame;
    v.el.classList.toggle('step', !!v.frame);
  }
  // The season's scenery, for a wanderer to push in (wanderers.js): off the card until it's moved.
  // Its spot is clear of any already standing (and of the path to them: it never passes through)
  const standing = () => list.filter((v) => v.state === 'scenery');
  function nextScenery() {
    const here = standing();
    if (here.length >= 2) return null;
    const kinds = [...new Set(seasons().flatMap((id) => [].concat(SCENERY[id] || [])))].filter((k) => !here.some((v) => v.kind === k));
    return kinds.length ? pick(kinds) : null;
  }
  // (ok(x): whether its pusher, stopping at x beside it, has room there among the bots)
  // (bit: a numbered BIT to push instead, its number: wanderers.js)
  function makeScenery(dir, ok = () => true, bit = 0) {
    if (bit && standing().some((v) => v.kind === 'bit')) return null; // (one at a time)
    const kind = bit ? 'bit' : nextScenery();
    if (!kind) return null;
    if (bit) SPRITES.bit = bitSprite();
    if (kind === 'menorah') SPRITES.menorah = menorah(Season.hanukkahNight() || 8);
    if (kind === 'kinara') SPRITES.kinara = kinara(Season.kwanzaaDay() || 7);
    if (kind === 'sign') SPRITES.sign = sign(Season.newYear());
    const w = SPRITES[kind].a[0].length * U;
    let lo = 16 + 34; // (room at the edge for its pusher, who stops beside it)
    let hi = api.laneW() - w - 16 - 34;
    for (const o of standing()) {
      const from = Math.min(o.x, o.spot);
      const to = Math.max(o.x, o.spot) + o.w;
      if (dir > 0) hi = Math.min(hi, from - w - 12);
      else lo = Math.max(lo, to + 12);
    }
    if (hi < lo) return null;
    const t = add(kind, -400, 1, { state: 'scenery' });
    t.el.classList.add('visitor-scenery');
    t.w = w;
    t.dir = KINDS[kind].fixed ? 1 : dir;
    const pusherAt = (spot) => (dir > 0 ? spot - (34 - 6) : spot + w - 6);
    t.spot = rand(lo, hi);
    for (let i = 0; i < 12 && !ok(pusherAt(t.spot)); i++) t.spot = rand(lo, hi);
    t.x = dir > 0 ? -w - 40 : api.laneW() + 40;
    if (bit) {
      t.value = bit;
      bitCell(t, bit);
      t.decryptAt = performance.now() + rand(45000, 90000); // (left alone, it decrypts itself)
    }
    return t;
  }
  // A numbered BIT: the very bit the grid drops (a .cell.disc, [n], in the theme's look: style.css),
  // half again a bot's size, over an empty sprite that size
  function bitSprite() {
    return { pal: {}, a: Array.from({ length: 24 }, () => '.'.repeat(24)) };
  }
  function bitCell(t, n) {
    const c = document.createElement('div');
    c.className = 'cell disc pushed-bit';
    t.el.appendChild(c);
    t.cell = c;
    t.spin = null;
    bitLook(t);
  }
  // (drawn as the grid draws its bits, and again whenever the theme changes: GLYPH's glyph,
  // SPECTRUM's own hue cycle)
  function bitLook(t) {
    const theme = document.documentElement.dataset.theme || 'terminal'; // (TERMINAL sets none)
    if (t.theme === theme) return;
    t.theme = theme;
    if (typeof fillBit === 'function') fillBit(t.cell, t.value);
    else t.cell.textContent = `[${t.value}]`;
    if (typeof spinBit === 'function') spinBit(t.cell, t);
  }
  // A BIT on the card: an EASY or NORMAL bot coming near an 8 is frightened off (only the mad ones
  // push those); poked, or left long enough, it decrypts in a burst of its pixels. Each number seen
  // counts toward a hidden achievement
  function bitFrame(v, now) {
    bitLook(v);
    if (!v.seen && v.x >= 0 && v.x <= api.laneW() - v.w) {
      v.seen = true;
      api.botEvent(`seen-bit-${v.value}`);
    }
    if (v.value === 8) {
      for (const b of api.walkers()) {
        if (v.scared.has(b) || ['hard', 'insane'].includes(b.el.dataset.level) || b.pushing === v) continue;
        if (Math.abs(b.x + 17 - (v.x + v.w / 2)) > 46) continue;
        v.scared.add(b);
        api.say(b, 'scared', '!!');
        api.fright(b);
      }
    }
    if (now > v.decryptAt && v.seen) decryptBit(v);
  }
  function decryptBit(v) {
    if (v.state !== 'scenery') return;
    v.state = 'gone';
    v.still = true;
    say(v, `[${v.value}]`, 700);
    if (inSight(v.el) && typeof FX !== 'undefined' && FX.burst) FX.burst([{ el: v.cell, type: 'number' }]); // (as a bit decrypts in the grid)
    v.cell.style.visibility = 'hidden';
    api.startle(v, 50);
    if (api.lostPush) api.lostPush(v); // (the bot that pushed it in: put out, -_-, not just startled)
    setTimeout(() => { v.gone = true; }, 700);
  }
  function moveTree(t, x) {
    t.x = x;
    place(t);
  }

  function poke(v) {
    if (v.kind === 'bit') { // (a poked BIT decrypts)
      if (v.state === 'scenery' && v.seen) { api.botEvent('bit-poke'); decryptBit(v); }
      return;
    }
    if (v.state === 'scenery') {
      const k = KINDS[v.kind];
      const cls = k.poke === 'glow' ? 'v-glow' : 'v-creak';
      v.el.classList.remove(cls);
      void v.el.offsetWidth;
      v.el.classList.add(cls);
      if (k.poke === 'creak') { // (creaks, and a bat flies out of it in the season)
        say(v, 'creeeak', 1000);
        if (Season.is('halloween')) add('bat', v.x + v.w / 2, pick([-1, 1]), { fly: 40, speed: rand(60, 90), bolt: true });
      } else if (k.poke === 'brrr') say(v, 'brrr!', 900);
      else if (k.poke === 'cackle') { // (it flares up and cackles; the bots near it jump)
        say(v, pick(['HAHAHA!', 'MWAHAHA!', 'BOO!']), 1200);
        api.startle(v, 70);
      }
      else if (k.poke === 'jingle') { say(v, 'jingle!', 900); v.el.classList.add('v-blink'); setTimeout(() => v.el.classList.remove('v-blink'), 1200); }
      else if (k.poke === 'cheer') { say(v, Season.is('nye') ? 'SOON!' : 'HAPPY NEW YEAR!', 1400); firework(); }
      api.botEvent(`${v.kind}-pokes`);
      return;
    }
    if (v.kind === 'spider') {
      if (v.state === 'up') return;
      api.botEvent('visitor-pokes');
      say(v, '!', 700);
      v.state = 'up';
      v.climb = 130;
      api.startle(v, 60); // (the bots near it don't like spiders)
      return;
    }
    if (v.state === 'fogtree' || v.kind === 'spirit') return;
    if (v.kind === 'eyes') { // (they shut, and they're gone)
      if (v.state === 'eyes') { api.botEvent('visitor-pokes'); v.until = 0; }
      return;
    }
    if (v.kind === 'hand') { // (it lets go)
      if (['rumble', 'rise', 'grab'].includes(v.state)) { api.botEvent('visitor-pokes'); letGo(v, performance.now()); }
      return;
    }
    if (v.kind === 'werewolf') { // (a growl, and off on all fours)
      if (v.state === 'run') return;
      api.botEvent('visitor-pokes');
      say(v, pick(['GRRR!', 'SNARL']), 900);
      v.el.classList.remove('v-howl');
      api.startle(v, 60);
      lopeOff(v);
      return;
    }
    if (v.kind === 'gremlin') { // (a screech, and off at a run)
      if (v.state === 'out') return;
      api.botEvent('visitor-pokes');
      say(v, pick(['SKREE!', 'HISSS']), 900);
      v.el.classList.add('v-shake');
      setTimeout(() => v.el.classList.remove('v-shake'), 500);
      v.state = 'out';
      v.speed *= 3;
      v.dir = v.x < api.laneW() / 2 ? -1 : 1;
      return;
    }
    if (v.kind === 'wraith') { // (gone back into the mist, quickly)
      if (v.state === 'fade') return;
      api.botEvent('visitor-pokes');
      say(v, '...', 900);
      fadeAway(v, performance.now(), 900);
      return;
    }
    if (v.virus) { // (a TROJAN's first poke unmasks it; otherwise DELETED)
      if (v.state === 'gone') return;
      api.botEvent('visitor-pokes');
      if (v.disguised) unmask(v);
      else kill(v);
      return;
    }
    if (v.kind === 'bigspider') { // (a hiss, a big leap away, and off it scuttles)
      if (v.state === 'out' && v.spooked) return;
      api.botEvent('visitor-pokes');
      say(v, 'HSSS!', 900);
      v.spooked = true;
      v.dir = v.x < api.laneW() / 2 ? -1 : 1;
      v.leap = { t0: performance.now(), from: v.x, to: v.x + v.dir * 70, h: 30, ms: 600, big: true };
      v.state = 'out';
      v.speed *= 1.8;
      api.startle(v, 70);
      return;
    }
    if (v.state !== 'go' && v.state !== 'peck' && v.state !== 'land') return;
    api.botEvent('visitor-pokes');
    const k = KINDS[v.kind];
    if (k.poke === 'squawk') { // (a flap, then off on its belly)
      say(v, 'SQUAWK!', 900);
      v.state = 'slide';
      v.el.classList.add('v-slide');
      v.speed = 75;
      api.botEvent('penguin-slide');
      return;
    }
    if (k.poke === 'snort') { // (a snort, then a prance off at double time)
      say(v, 'SNORT!', 900);
      v.speed *= 2.2;
      v.prance = true;
      return;
    }
    if (k.poke === 'spin') { // (landed: spun again, on along the card, to land on another letter)
      if (v.state !== 'land') return;
      say(v, 'whirr', 700);
      const on = rand(30, 70);
      spin(v, v.dir > 0 ? v.x + on : api.laneW() - v.x + on); // (stopAt: from the side it came in)
      return;
    }
    if (k.poke === 'roar') { // (arms up and a stomp: nearby bots jump)
      say(v, 'RAAWR!');
      v.el.classList.add('v-stomp');
      setTimeout(() => v.el.classList.remove('v-stomp'), 700);
      api.startle(v, 80);
    } else if (k.poke === 'laugh') { // (a laugh, the jack o' lantern held high: every bot near it jumps)
      say(v, 'HAHAHAHA!', 1200);
      api.startle(v, 120);
    } else if (k.poke === 'braains') {
      say(v, pick(['BRAAAINS', 'uuurgh', 'mmmrrgh']), 1000);
      v.el.classList.add('v-wobble');
      setTimeout(() => v.el.classList.remove('v-wobble'), 900);
    } else if (k.poke === 'groan') {
      say(v, 'mmmMMPH');
      v.el.classList.add('v-wobble');
      setTimeout(() => v.el.classList.remove('v-wobble'), 900);
      v.speed *= 0.7;
    } else if (k.poke === 'blub') {
      say(v, 'BLUB!');
      for (let i = 0; i < 7; i++) drip(v, true);
    } else if (k.poke === 'hiss') { // (turns into bats)
      say(v, 'HSSSS', 700);
      v.el.classList.add('v-shake');
      v.state = 'leaving';
      setTimeout(() => {
        v.el.classList.add('v-vanish');
        for (let i = 0; i < 3; i++) add('bat', v.x + 4 + i * 6, pick([-1, 1]), { fly: rand(18, 30), speed: rand(70, 100), bolt: true });
        setTimeout(() => { v.gone = true; }, 450);
      }, 650);
    } else if (k.poke === 'boo') { // (every bot near it jumps, then it fades away)
      say(v, 'BOO!', 900);
      v.el.classList.add('v-boo');
      v.state = 'leaving';
      api.startle(v, 130);
      setTimeout(() => v.el.classList.add('v-fade'), 500);
      setTimeout(() => { v.gone = true; }, 1300);
    } else if (k.poke === 'scatter') { // (the whole flock bolts, up and away)
      for (const b of list) if (b.kind === 'bat') { b.speed *= 2; b.bolt = true; }
    } else if (k.poke === 'caw') {
      say(v, 'CAW!', 900);
      v.state = 'fly';
    } else if (k.poke === 'flush') { // (a call, and the whole flock bolts up and away)
      say(v, k.call, 900);
      for (const b of list) {
        if (b.flock !== v.flock) continue;
        b.bolt = true;
        b.speed *= 1.6;
        if (b.state !== 'go') { b.state = 'up'; b.el.classList.add('v-fly'); }
      }
    } else if (k.poke === 'gobble') { // (a flustered shake, then off at a run)
      say(v, 'GOBBLE!', 1000);
      v.el.classList.add('v-shake');
      setTimeout(() => v.el.classList.remove('v-shake'), 600);
      v.state = 'go';
      v.speed *= 3;
      v.ran = true;
    }
  }

  // Water off the creature: a drop falling from it (a splash of them when it's poked)
  function drip(v, splash = false) {
    const d = document.createElement('i');
    d.className = 'visitor-drip';
    const w = v.el.offsetWidth;
    d.style.left = `${rand(0.2, 0.8) * w}px`;
    d.style.setProperty('--dx', `${splash ? rand(-16, 16) : 0}px`);
    d.style.setProperty('--dy', `${splash ? rand(-18, -6) : rand(10, 16)}px`);
    v.el.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }

  // The dreidel: spinning along to a stop, a wobble, and it lands on a letter
  const LETTERS = ['NUN', 'GIMEL', 'HEY', 'SHIN'];
  function spin(v, stopAt) {
    v.state = 'go';
    v.still = false;
    v.stopAt = stopAt;
    v.speed = KINDS.dreidel.speed * rand(0.85, 1.15);
  }

  // WEATHER: snow in the winter (pixel flakes drifting down to the floor, a moment there, gone);
  // fireworks at the new year (a rocket up, bursting into pixel sparks that fall away)
  let flakes = [];
  let nextFlake = 0;
  let nextFirework = performance.now() + rand(2000, 5000);
  const snap = (n) => Math.round(n / U) * U;
  function snow(now, dt) {
    const W = api.laneW();
    if (now > nextFlake && flakes.length < (tall() ? 40 : 18)) {
      nextFlake = now + rand(180, 420);
      const el = document.createElement('i');
      el.className = 'visitor-flake';
      api.lane.appendChild(el);
      // (from the top of the card on the start screen, falling at the same pace across it)
      const scale = tall() ? api.laneH() / 96 : 1;
      flakes.push({ el, x: rand(0, W), y: sky(0.85, 1, () => rand(70, 96)), speed: rand(9, 16) * Math.min(scale, 4), phase: rand(0, 6.28), age: 0 });
    }
    for (const f of flakes) {
      f.age += dt * 1000;
      if (f.y > FLOOR) f.y = Math.max(FLOOR, f.y - f.speed * dt);
      else if (!f.landed) f.landed = now;
      const drift = Math.sin(f.age / 700 + f.phase) * 5;
      f.el.style.transform = `translate(${snap(f.x + drift).toFixed(1)}px, ${(-snap(f.y)).toFixed(1)}px)`;
      if (f.landed && now - f.landed > 900) f.gone = true;
    }
    flakes = flakes.filter((f) => {
      if (f.gone) f.el.remove();
      return !f.gone;
    });
  }
  const SPARKS = ['#ff3b5c', '#ffd23f', '#3bd1ff', '#7cff6b', '#b36bff', '#ff7ad9', '#ffffff'];
  function firework() {
    if (!api.lane.isConnected) return;
    const W = api.laneW();
    const x = snap(rand(0.12, 0.88) * W);
    const top = snap(sky(0.5, 0.85, () => rand(58, 84)));
    const c = pick(SPARKS);
    const piece = (cls) => {
      const el = document.createElement('i');
      el.className = cls;
      el.style.setProperty('--c', c);
      api.lane.appendChild(el);
      return el;
    };
    const rocket = piece('visitor-spark rocket');
    const up = rocket.animate([{ transform: `translate(${x}px, ${-FLOOR}px)` }, { transform: `translate(${x}px, ${-top}px)` }],
      { duration: 650, easing: `steps(${Math.round((top - FLOOR) / U / 2)}, end)`, fill: 'forwards' });
    up.onfinish = () => {
      rocket.remove();
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.15, 0.15);
        const r = rand(12, 20) * (tall() ? 1.6 : 1);
        const s = piece('visitor-spark');
        const frames = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6;
          const dx = Math.cos(a) * r * Math.sqrt(t);
          const dy = Math.sin(a) * r * Math.sqrt(t) - 10 * t * t; // (spreading, then falling)
          frames.push({ transform: `translate(${snap(x + dx)}px, ${snap(-top - dy)}px)`, opacity: k < 4 ? 1 : 1 - (k - 3) / 4, offset: t, easing: 'steps(1, end)' });
        }
        s.animate(frames, { duration: 950, fill: 'forwards' }).onfinish = () => s.remove();
      }
    };
  }

  // NEW YEAR'S EVE at the player's own midnight: the bots count down from ten and cheer, and the
  // sky fills with fireworks
  let counted = false;
  function countdown() {
    counted = true;
    for (let i = 10; i >= 1; i--) {
      setTimeout(() => api.walkers().forEach((w) => api.say(w, 'idle', String(i))), (10 - i) * 1000);
    }
    setTimeout(() => {
      const year = String(Season.newYear());
      api.walkers().forEach((w, i) => api.say(w, 'happy', i === 0 ? 'HAPPY NEW YEAR!' : pick(['WOOO!', 'YAY!', `${year}!`]))); // (one says it all)
      api.botEvent('countdown');
      for (let i = 0; i < 10; i++) setTimeout(firework, i * 320 + rand(0, 200));
    }, 10000);
    setTimeout(() => api.walkers().forEach((w) => api.say(w, 'idle', '')), 14000);
  }

  // (the lumbering in whole pixels of the sprite's grid: a pixel's shuffle side to side and a
  // pixel's bob, heights snapped to the grid too; no tilting). FLOOR: the bots' feet rest two
  // pixels of their grid above the lane's bottom edge (their 17-row grid ends two rows under the
  // legs), and every visitor stands on that same floor.
  const FLOOR = 2 * U;
  function place(v) {
    const k = KINDS[v.kind];
    const t = v.age / 1000;
    const going = v.state === 'go';
    const shuffle = k.sway && going ? Math.round(Math.sin(t * 5 + v.phase)) * U : 0;
    const bob = k.bob && going ? Math.round(Math.abs(Math.sin(t * 5 + v.phase)) * k.bob) * U : 0;
    const y = Math.round(v.y / U) * U;
    v.el.style.transform = `translate(${(v.x + shuffle).toFixed(1)}px, ${(-y - bob - FLOOR).toFixed(1)}px)`;
    v.el.querySelector('svg').style.transform = `scaleX(${v.dir})${v.svgT || ''}`;
  }

  // WEATHER (weather.js): its own spells over this lane (not the screen saver's), with the clouds
  // and the fog from here
  let scenes = null;
  const weather = typeof createWeather === 'function' && !api.lane.classList.contains('saver-lane') ? createWeather({
    lane: api.lane, tall, foggy: () => !!fog, walkers: api.walkers, botEvent: api.botEvent,
    scene: () => (scenes ? scenes.current() : null),
    say: (w, m, text) => api.say(w, m, text),
    clouds: (tone) => {
      const c = clouds && clouds.phase === 'lift' ? null : clouds || startClouds(false, tone);
      if (!c) return;
      c.held = true;
      if (!c.spooky) c.tone = tone;
    },
    releaseClouds: (soon) => { if (clouds && (clouds.held || soon) && !clouds.stays) { clouds.held = false; clouds.until = performance.now() + (soon ? 0 : rand(6000, 16000)); } },
    fog: () => { if (!fog) startFog(false, false); },
  }) : null;
  // SCENES (scenes.js): now and then the lane becomes a place (a meadow, a beach, a city...), with
  // weather to suit; not with the fog or the HAUNTED FOREST
  scenes = typeof createScenes === 'function' && weather ? createScenes({
    lane: api.lane, laneW: api.laneW, laneH: () => api.laneH(), botEvent: api.botEvent,
    foggy: () => !!fog || hauntedForest,
    fitWeather: (kinds) => weather.fit(kinds),
    // (GONE FISHING: a bot taken for it, walked out on the dock, and let go)
    walkers: api.walkers, say: (w, m, text) => api.say(w, m, text),
    claim: api.claim, go: api.go, lift: api.lift, turn: api.turn, release: api.release,
  }) : null;
  function frame(now, dt) {
    const W = api.laneW();
    if (weather) weather.frame(now, dt);
    if (scenes) scenes.frame(now);
    if (!fog && hauntedForest && spooky()) startFog(true); // (the HAUNTED FOREST stands, all month)
    if (fog) fogFrame(now);
    if (clouds) cloudsFrame(now);
    if (lights) lightsFrame(now);
    hordeTick(now);
    if (!foggy() && !lights && !list.some((v) => v.state !== 'scenery' && v.state !== 'fogtree') && now > nextVisit) {
      // (the VIRUS: any time of year, now and then; a FOG now and then in NOVEMBER; otherwise the
      // season's visitors, if any)
      if (virusOften() || Math.random() < VIRUS_ODDS) visit('virus');
      else if (fog && fog.haunted && fog.phase === 'light' && Math.random() < 0.4) forestVisit();
      else if (!fog && (fogOften() || ((Season.is('november') || Season.is('halloween')) && Math.random() < (spooky() && !hauntedForest ? FOREST_FIRST_ODDS : FOG_ODDS)))) startFog();
      else if (!clouds && cloudLane() && cloudSeason() && Math.random() < CLOUD_ODDS) startClouds();
      else if (visits().length) visit();
      nextVisit = now + (virusOften() ? rand(3000, 6000) : rand(20000, 45000));
    }
    if (Season.is('winter') || flakes.length) snow(now, dt);
    if ((Season.is('nye') || Season.is('newyear')) && now > nextFirework) {
      firework();
      nextFirework = now + rand(Season.is('newyear') ? 3000 : 6000, 11000);
    }
    if (!counted && Season.is('nye')) { // (ten seconds to the player's midnight)
      const d = new Date();
      if (d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() >= 50) countdown();
    }
    for (const v of list) {
      const k = KINDS[v.kind];
      v.age += dt * 1000;
      if (clouds && v.alt !== undefined && v.y > 20 && now > (v.altAt || 0)) { // (in the air: now and then up or down a layer, through the cloud)
        v.altAt = now + rand(1800, 4500);
        if (Math.random() < 0.45) setAlt(v, Math.max(0, Math.min(2, v.alt + (Math.random() < 0.5 ? -1 : 1))));
      }
      if (k.frameMs && !v.still && v.state !== 'slide' && now - v.frameAt > (v.state === 'peck' ? 160 : k.frameMs)) {
        v.frameAt = now;
        v.frame = 1 - v.frame;
        v.el.classList.toggle('step', !!v.frame);
      }
      if (v.state === 'fogtree') {
        // (standing in the fog)
      } else if (v.kind === 'eyes') {
        eyesFrame(v, now);
      } else if (v.kind === 'hand') {
        handFrame(v, now);
      } else if (v.kind === 'zombie' && v.state !== 'go') {
        zombieFrame(v, now);
      } else if (v.kind === 'werewolf') {
        werewolfFrame(v, now, dt, W);
      } else if (v.kind === 'spirit') { // (up and away, swaying, fading)
        v.y += 22 * dt;
        v.x += Math.sin(v.age / 300) * 10 * dt;
        if (now > v.until) v.gone = true;
      } else if (v.state === 'stand') { // (there when the lights came on: a moment, then off)
        if (now > v.until) { v.state = 'go'; v.dir = v.x < W / 2 ? -1 : 1; }
      } else if (v.kind === 'gremlin') { // (up to a bot, a prank, the next; then off)
        if (v.state === 'go') {
          v.dir = v.target > v.x ? 1 : -1;
          v.x += v.dir * Math.min(v.speed * dt, Math.abs(v.target - v.x));
          if (Math.abs(v.target - v.x) < 0.5) {
            const near = api.walkers().find((b) => Math.abs(b.x - v.x) < 34);
            if (near) {
              v.state = 'prank';
              v.until = now + rand(800, 1300);
              v.el.classList.add('v-shake');
              say(v, pick(['hehehe', 'hehe', 'ehehe!']), 1000);
              api.startle(v, 40);
            } else v.until = now + rand(300, 700), v.state = 'prank';
          }
        } else if (v.state === 'prank' && now > v.until) {
          v.el.classList.remove('v-shake');
          if (--v.pranks > 0) {
            const bots = api.walkers();
            v.target = bots.length ? pick(bots).x + rand(-20, 20) : rand(0.1, 0.85) * W;
            v.target = Math.max(4, Math.min(W - 30, v.target));
            v.state = 'go';
          } else { v.state = 'out'; v.dir = v.x < W / 2 ? -1 : 1; v.speed *= 2; }
        } else if (v.state === 'out') v.x += v.dir * v.speed * dt;
      } else if (v.kind === 'wraith') {
        if (v.state === 'fade' && v.drift !== undefined) v.x += Math.sign(v.drift - v.x) * Math.min(Math.abs(v.drift - v.x), 12 * dt);
        wraithFrame(v, now, dt, W);
      } else if (v.state === 'scenery') {
        // (scenery: pushed by a wanderer, or standing where it was left)
        if (v.kind === 'snowman') snowmanWaits(v, now);
        if (v.kind === 'bit') bitFrame(v, now);
      } else if (v.kind === 'snowman') {
        snowmanSneaks(v, now, dt);
      } else if (v.kind === 'dreidel') { // (spins along, wobbles to a stop, lands on a letter; then on)
        if (v.state === 'go') {
          v.x += v.dir * v.speed * dt;
          if (v.stopAt !== null && ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt))) {
            v.state = 'wobble';
            v.until = now + 700;
            v.el.classList.add('v-shake');
          }
        } else if (v.state === 'wobble' && now > v.until) {
          v.el.classList.remove('v-shake');
          v.state = 'land';
          v.still = true;
          const letter = pick(LETTERS);
          say(v, `${letter}!`, 1800);
          if (letter === 'GIMEL') api.botEvent('gimel');
          v.until = now + 3200;
        } else if (v.state === 'land' && now > v.until) spin(v, null); // (and off it goes)
      } else if (v.kind === 'spider') { // (down its thread, a dangle, back up)
        if (v.state === 'down') {
          v.y -= 38 * dt;
          if (v.y <= v.hang) { v.y = v.hang; v.state = 'hang'; v.until = now + v.life; }
        } else if (v.state === 'hang') {
          v.y = v.hang + Math.sin(v.age / 380) * 2;
          if (now > v.until) { v.state = 'up'; v.climb = 32; }
        } else if (v.state === 'up') {
          v.y += v.climb * dt;
        }
      } else if (v.kind === 'turkey') { // (struts in, pecks a while, struts on out)
        if (v.state === 'go') {
          v.x += v.dir * v.speed * dt;
          if (!v.pecked && !v.ran && ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt))) { v.state = 'peck'; v.until = now + v.life; v.pecked = true; }
        } else if (v.state === 'peck' && now > v.until) v.state = 'go';
      } else if (v.kind === 'bigspider') {
        bigSpider(v, now, dt, W);
      } else if (v.virus && VIRUS_WAYS[v.kind] && VIRUS_WAYS[v.kind](v, now, dt, W)) {
        // (its own way about, this frame: VIRUS_WAYS)
      } else if (v.virus) { // (scuttles from spot to spot, lurching; bots near it panic)
        if (v.state === 'roam') {
          const step = v.speed * dt * (!v.disguised && Math.random() < 0.08 ? 4 : 1); // (a disguised one walks like a bot)
          v.dir = v.target > v.x ? 1 : -1;
          v.x += v.dir * Math.min(step, Math.abs(v.target - v.x));
          if (Math.abs(v.target - v.x) < 0.5) {
            v.state = 'lurk';
            v.still = true;
            v.until = now + rand(900, 2200);
            if (Math.random() < 0.5) say(v, v.disguised ? pick(['hi', '^^', '...']) : pick(['0xBAD', '>:)', 'hehe', '01101', 'ERR']), 1000);
          }
        } else if (v.state === 'lurk' && now > v.until) {
          v.still = false;
          if (--v.stops > 0) { v.state = 'roam'; v.target = rand(0.1, 0.85) * W; } else { v.state = 'out'; v.dir = v.x < W / 2 ? -1 : 1; }
        } else if (v.state === 'out') v.x += v.dir * v.speed * 1.4 * dt;
        v.el.classList.toggle('moving', v.state === 'roam' || v.state === 'out');
        if (v.state !== 'gone' && !v.disguised) { // (a bot it comes near jumps, once each)
          for (const b of api.walkers()) {
            if (v.scared.has(b) || Math.abs(b.x - v.x) > 40) continue;
            v.scared.add(b);
            api.startle(v, 45);
          }
        }
      } else if (k.bird) {
        if (v.state === 'go') { // (with the flock, across the sky)
          v.x += v.dir * v.speed * dt;
          v.y = v.fly + Math.sin(v.age / k.waveMs + v.phase) * k.wave + (v.bolt ? v.age / 50 : 0);
          wingbeat(v, now, k.beatMs);
          if (v.kind === 'goose' && Math.random() < dt * 0.15) say(v, k.call, 800); // (the odd honk)
          if (v.lands && !v.bolt && ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt))) v.state = 'down';
        } else if (v.state === 'down') { // (gliding down to land)
          v.x += v.dir * v.speed * 0.45 * dt;
          v.y -= (tall() ? 90 : 35) * dt;
          wingbeat(v, now, k.beatMs * 2);
          if (v.y <= 0) {
            v.y = 0;
            v.state = 'peck';
            v.until = now + v.life;
            v.el.classList.remove('v-fly', 'step');
            greet(v);
          }
        } else if (v.state === 'peck') { // (pecks about, now and then turning around)
          if (now - v.frameAt > (v.frame ? 220 : rand(300, 900))) {
            v.frameAt = now;
            v.frame = 1 - v.frame;
            v.el.classList.toggle('step', !!v.frame);
            if (!v.frame && Math.random() < 0.2) v.dir = -v.dir;
          }
          if (now > v.until) { v.state = 'up'; v.el.classList.add('v-fly'); }
        } else if (v.state === 'up') { // (off up and away)
          v.x += v.dir * v.speed * dt;
          v.y += (tall() ? 0.25 * api.laneH() : 40) * dt;
          wingbeat(v, now, k.beatMs);
        }
      } else if (k.fly) { // (bats: a wavering line through the air)
        v.x += v.dir * v.speed * dt;
        v.y = v.fly + Math.sin(v.age / 260 + v.phase) * 5 + (v.bolt ? v.age / 60 : 0);
      } else if (v.kind === 'crow') {
        if (v.state === 'go') {
          v.x += v.dir * v.speed * dt;
          v.y = Math.abs(Math.sin(v.age / 110)) * 3; // (hopping)
          if ((v.dir > 0 && v.x >= v.stopAt) || (v.dir < 0 && v.x <= W - v.stopAt)) { v.state = 'peck'; v.until = now + v.life; v.y = 0; }
        } else if (v.state === 'peck') {
          if (now > v.until) v.state = 'fly';
        } else if (v.state === 'fly') { // (off up and away)
          v.x += v.dir * 60 * dt;
          v.y += (tall() ? 0.22 * api.laneH() : 55) * dt; // (up across the card, and out)
          v.el.classList.add('v-fly');
          if (now - v.frameAt > 110) { // (a wingbeat)
            v.frameAt = now;
            v.frame = 1 - v.frame;
            v.el.classList.toggle('step', !!v.frame);
          }
        }
      } else if (v.state === 'go' || v.state === 'leaving' || v.state === 'slide') {
        if (v.state !== 'leaving') v.x += v.dir * v.speed * dt;
        if (v.prance) v.y = Math.abs(Math.sin(v.age / 110)) * 4;
        if (k.float) v.y = k.float + Math.sin(v.age / 500 + v.phase) * 4;
        if (k.drips && Math.random() < dt * 1.4) drip(v);
        // A monster passing a bot gives it a fright (once each)
        if (k.monster && v.state === 'go') {
          for (const b of api.walkers()) {
            if (v.scared.has(b) || Math.abs(b.x - v.x) > 40 || b.leaving || b.state === 'walk') continue;
            v.scared.add(b);
            if (Math.random() < 0.5) api.startle(v, 45);
          }
        }
      }
      place(v);
      if (v.fogVisitor && v.fogExit !== undefined && !v.fogFading && ((v.dir > 0 && v.x >= v.fogExit) || (v.dir < 0 && v.x <= v.fogExit))) {
        v.fogFading = true; // (back into the mist)
        v.el.style.opacity = '0';
        setTimeout(() => { v.gone = true; }, 2000);
      }
      if (v.state === 'scenery' || v.state === 'fogtree') continue; // (it stays)
      const w = v.boxW || (v.boxW = v.el.offsetWidth) || 30; // (measured once: read every frame between the moves, it forced a layout per visitor)
      if (v.x < -w - 40 || v.x > W + 40 || v.y > ceiling() + 40) v.gone = true;
    }
    list = list.filter((v) => {
      if (v.gone && v.fogVisitor && fog) fog.wraithGone = true; // (the fog's visitor gone: it thins)
      if (v.gone && v.onGone) v.onGone();
      if (v.gone) v.el.remove();
      return !v.gone;
    });
  }
  // (while the fog's heavy: rolling in, or the wanderer about)
  function foggy() { return !!fog && ['in', 'thick', 'swell', 'blood'].includes(fog.phase); }
  // (forget: the dev page's CLEAR ALL, the HAUNTED FOREST too)
  function clear(forget = false) {
    if (forget) hauntedForest = false;
    if (weather) weather.clear();
    if (scenes) scenes.clear();
    horde = null;
    if (clouds) endClouds();
    if (fog) { if (fog.ground) fog.ground.remove(); fog.back.remove(); fog.fore.remove(); fog.dark.remove(); if (fog.moon) fog.moon.remove(); fog = null; }
    if (lights) { lights.dark.remove(); lights.eyes.forEach((e) => e.remove()); if (lights.red) lights.red.remove(); lights = null; }
    api.lane.querySelectorAll('.moon-sky, .night-dark').forEach((e) => e.remove());
    list.forEach((v) => v.el.remove());
    list = [];
    flakes.forEach((f) => f.el.remove());
    flakes = [];
  }
  // (the dev page's frame editor: every sprite and its frames, how fast each steps)
  function art() {
    const sprites = { ...SPRITES, menorah: menorah(8), kinara: kinara(7), sign: sign(new Date().getFullYear()), 'moon-full': moonSprite(false), 'moon-blood': moonSprite(true) };
    delete sprites.bit;
    for (const kind of ['tree', 'baretree', 'pine']) { // (the walking trees' four steps)
      const [a, b, c, d] = rootFrames(kind);
      sprites[`${kind}-walking`] = { pal: SPRITES[kind].pal, a, b, c, d };
    }
    // (the frame-by-frame ones: each animation as it is, at its own resolution)
    const anims = {};
    for (const [kind, d] of Object.entries(ART)) {
      delete sprites[kind];
      for (const name of d.anims) {
        anims[`${kind}-${name}`] = {
          res: d.res || 1,
          frames: d[name].map((f) => {
            const cells = {};
            artRows(f.rows).forEach((row, y) => [...row].forEach((ch, x) => { if (d.pal[ch]) cells[`${d.x0 + x},${d.y0 + y}`] = d.pal[ch]; }));
            return { ms: f.ms, cells };
          }),
        };
      }
    }
    return { sprites, anims, kinds: { ...KINDS, 'tree-walking': { frameMs: 190 }, 'baretree-walking': { frameMs: 190 }, 'pine-walking': { frameMs: 190 } } };
  }
  return { frame, clear, visit, list: () => list, makeScenery, moveTree, foggy, spirit, art, weather: () => (weather ? weather.current() : null) };
}
