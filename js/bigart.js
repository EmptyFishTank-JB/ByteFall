// Visitors drawn in the frame editor (dev-tools/frames.html), frame by frame, built into the game
// (visitors.js shows them in place of a visitor's plain sprite). None at the moment: the BIG SPIDER
// and the WEREWOLF that were here were more detailed than the rest, and went back to plain sprites.
// Each entry: res (1: the bots' own pixels, 2: half pixels), pal, anims (its animations' names),
// and each animation's frames, their rows palette letters with runs written count+letter; x0, y0:
// its top left on the editor's grid (the bot's box at 0,0; the floor under the last row)
window.BIG_ART = {};
