// 우비소녀의 여행 - 1장 「불꽃 숲」
// A real pixel game: everything is drawn at 960x540, one art pixel = one game pixel, and the page scales the whole
// picture up (2x on a 1080p screen) without smoothing. Nothing is shown at a fractional size of its art.
//   the girl: SpriteCast pixel art, 96 px - four facings (the diagonals) of walking with the umbrella and its swing
//   the fire monster (64 px, three faces), the ground tile: pixel art drawn by GPT on a grid and read back (assets/px/)
//   the trees, bushes, stumps: 3D models (Tripo) at her exact angle and scale, drawn as pixel art by SpriteCast, four sides each (assets/px/props/)
//   the effects, the hearts, the fireball: a few pixels each, made here; the letters: Galmuri11 (SIL OFL)

const W = 960, H = 540;
const FONT = "Galmuri11, 'Noto Sans CJK SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif";          // (a letter Galmuri11 has not - some Chinese - from the next)

// Pixel lettering. Galmuri11 is drawn on a 12 px grid, so it is set at 12 px and never at another size: bigger words are the same
// letters shown 2x or 3x, as a sprite is. The browser smooths the edges of what it writes, so each letter is made hard again (a
// pixel is there or it is not) and given a dark pixel outline, heavier below - the way a pixel game's words are drawn by hand.
const TREE_DIM = 0.82;          // how bright a green tree is shown, of how it was drawn (1: as drawn)
const BUSH_DIM = 0.82;          // the same for a green bush, drawn brighter than the trees; its two brighter sides (0 and 270) are brought down to the other two
const ROCK_DIM = 0.9;          // and for a rock
const dimmed = (c, k = 1) => k === 1 ? c : (Math.round((c >> 16 & 255) * k) << 16) | (Math.round((c >> 8 & 255) * k) << 8) | Math.round((c & 255) * k);
const ASSET_V = 48;          // (the soft edges below are made in code: no new pictures)
// a mushroom's cap: as drawn (red), orange, wine - the reds of the cap only; its pale spots, the stem and the grass as they are
const CAP_HUES = [null, (r, g, b) => [r, Math.round(g + (r - g) * 0.42), b], (r, g, b) => [Math.round(r * 0.8), Math.round(g * 0.62), Math.round(b + (r - b) * 0.28)]];
const INK = [0x2b, 0x24, 0x18];
function hardText(o) {
  const c = o.canvas, w = c.width, h = c.height; if (!w || !h) return;
  const im = o.context.getImageData(0, 0, w, h), d = im.data, on = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) on[i] = d[i * 4 + 3] >= 112 ? 1 : 0;
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && on[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (on[y * w + x]) { d[i + 3] = 255; continue; }
    const edge = at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) || at(x - 1, y - 1) || at(x + 1, y - 1) || at(x - 1, y + 1) || at(x + 1, y + 1) || at(x, y - 2) || at(x - 1, y - 2) || at(x + 1, y - 2);
    if (edge) { d[i] = INK[0]; d[i + 1] = INK[1]; d[i + 2] = INK[2]; d[i + 3] = 255; } else d[i + 3] = 0;
  }
  o.context.putImageData(im, 0, 0);
  if (o.renderer && o.renderer.gl) o.frame.source.glTexture = o.renderer.canvasToTexture(c, o.frame.source.glTexture, true);
}
function ptext(scene, x, y, t = '', size = 11, col = '#fff8e8', gap = 0) {          // (size: 11, 22 or 33 as before - the letters 1x, 2x, 3x; gap: between lines, in screen pixels)
  const k = Math.max(1, Math.round(size / 11));
  const o = scene.add.text(x, y, '', { fontFamily: FONT, fontSize: '12px', color: col, align: 'center', resolution: 1, padding: { x: 2, y: 3 }, lineSpacing: gap / k });
  const draw = o.updateText; o.updateText = function () { draw.call(this); hardText(this); return this; };
  return o.setScale(k).setText(t);
}
const FACINGS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
const DIAG = ['south-east', 'south-west', 'north-east', 'north-west'];          // the facings drawn ("facings": 4)
// the girl's frames, feet, shadows and water: assets/girlpx/pixel.js (PIXEL), written from pixel.json by tools/sync_girl.py
const PX = { w: PIXEL.frame[0], h: PIXEL.frame[1], ax: PIXEL.feet[0], ay: PIXEL.feet[1] };
const GIRL = { walk: { frames: 8, fps: 11 }, slash: { frames: 8, fps: 15 }, stand: { frames: 3, fps: 0.75 } };          // (standing: 3 frames over 4 s, a breath and a sway)
const SHADOW = PIXEL.shadows;
// THE COMBO: a downward cut, and pressed again before it ends, a spinning backhand - their own set (assets/girlpx/attack.js, ATTACK: drawn
// from Mixamo moves on a bigger canvas, so its own frame size and feet). Each has its own reach: the cut is long and narrow, ahead of her;
// the backhand turns her round, short, all the way round. `hit`: the frames whose water lands.
const AX = { w: ATTACK.frame[0], h: ATTACK.frame[1], ax: ATTACK.feet[0], ay: ATTACK.feet[1] };
const MOVES = {
  downward: { frames: 8, fps: 15, hit: [3, 5], reach: 155, half: Phaser.Math.DegToRad(42), next: 'backhand' },
  backhand: { frames: 8, fps: 15, hit: [3, 6], reach: 118, half: Math.PI, next: null },
};
const TRAIL = Object.fromEntries(Object.keys(MOVES).flatMap((m) => DIAG.map((f) => [`${m}-${f}`, ATTACK.trails[`${m}-${f}`]])));
Object.assign(PIXEL.shadows, ATTACK.shadows);
const SPEED = 145;          // (a little faster since the ground went isometric: up and down is half as fast on the screen)
const REACH = 130, HALF_ANGLE = Phaser.Math.DegToRad(68);
// THE FIRES: four colours, each its own trouble. hp: the water it takes; spread: how fast its fire on the ground spreads; hits: the
// swings its ground fire takes to put out; life: how long that burns; kb: how far the water throws it; shots: fireballs at once
const KINDS = {
  red:    { hp: 2, speed: 70,  hop: 0.7,  shoot: [1700, 3000], shots: 1, spread: 1.0, hits: 1, life: 1.0, kb: 1.0, flame: ['#c8321c', '#ff9a2a', '#ffe48a'], glow: 0xffffff },
  green:  { hp: 2, speed: 100, hop: 0.55, shoot: [2400, 3800], shots: 1, spread: 2.0, hits: 1, life: 0.8, kb: 1.0, flame: ['#1f8a2c', '#5fd23a', '#d8ff8a'], glow: 0x8aff7a },
  purple: { hp: 3, speed: 62,  hop: 0.75, shoot: [2000, 3200], shots: 3, spread: 1.0, hits: 1, life: 1.0, kb: 0.9, flame: ['#7a1f9a', '#d03ad8', '#ffb0f0'], glow: 0xe07aff },
  blue:   { hp: 6, speed: 58,  hop: 0.9,  shoot: [1900, 3100], shots: 1, spread: 0.8, hits: 2, life: 1.4, kb: 0.4, flame: ['#1c46c8', '#2aa0ff', '#bfe8ff'], glow: 0x6aa0ff },
};
// ten rounds; a monster's hp grows a little each round; "boss": the last round's blue flame, twice as tough
const ROUNDS = [
  ['red', 'red', 'red'],
  ['red', 'red', 'red', 'green'],
  ['green', 'green', 'red', 'red'],
  ['purple', 'red', 'red', 'green'],
  ['blue', 'red', 'red', 'red'],
  ['purple', 'purple', 'green', 'green', 'red'],
  ['blue', 'blue', 'red', 'red'],
  ['purple', 'purple', 'green', 'green', 'blue'],
  ['blue', 'blue', 'purple', 'purple', 'green', 'green'],
  ['boss', 'purple', 'purple', 'green', 'green', 'blue'],
];
const WAVES = ROUNDS.map((r, n) => r.map((k) => k === 'boss' ? { kind: 'blue', hp: 18, boss: true } : { kind: k, hp: KINDS[k].hp + (n >= 6 ? 1 : 0) }));
// THE CURVE: how hard a round is, 0 (round 1) to 1 (round 10) - the fire catches and spreads more, the fireballs come faster
const HARD = (w) => Math.min(1, Math.max(0, w / (ROUNDS.length - 1)));
const lerp = (a, b, u) => a + (b - a) * u;
const flameKey = (i, kind, size = '') => (kind === 'red' ? `flame-${i}` : `flame-${i}-${kind}`) + size;          // (size: '' whole, '-m' about 2/3, '-s' under a half)
// THE GROUND BURNS: a grid of 16 px squares. Where a fire monster lands and where a fireball falls the grass catches; a fire spreads to
// the squares beside it now and then, burns ~18 s and leaves scorched ground. The girl cannot walk into a burning square (her water puts
// it out); caught in one - it catches under her - she is hurt and thrown clear.
// her: five hearts; a water tank the swing draws on (the rain fills it again); a monster put out may leave a heart (a life back), or a
// potion that makes the tank bigger (WATER_GROW a potion, up to WATER_CAP: the game it lasts)
// THE SMOKE GHOSTS: what rises from a tree or a bush burnt through - the more of the forest burns, the more of them. They float through
// the trees at her, half see-through (SpriteCast: rigged from its 3D model - the tail sways, the arms swing - drawn as pixel art four
// frames a sheet, see-through by the model's thickness, the thin parts fading now and then); a touch takes water from her tank, not a
// heart, and it drifts back; one hit of her water scatters it. Gone at the end of the round.
// the fire monster's three faces, each a strip of 8 frames: see-through by its 3D model's thickness, the tips fading now and then (SpriteCast translucent, "fire")
const WAVER = [1, 0.82, 0.66, 0.82];          // a flame's see-through waver, by steps
const FIRE_FRAME = { normal: [42, 64], hurt: [41, 57], dead: [45, 49] };
const GHOST = { tree: 0.6, bush: 0.3, max: 3, speed: 38, drain: 45, life: 26, fw: 69, fh: 58, fps: 9 };
const TANK = { capL: 29, capR: 30, top: 4, bot: 20 };          // (the tank's picture: its caps' widths, the glass's inside rows)
const DROP = { heart: { w: 29, h: 24, foot: [14.5, 23.5], sh: [-10, 10], perUp: [-37.8, -35.1], ppm: 90 }, potion: { w: 22, h: 34, foot: [9.9, 31.4], sh: [-9, 15], perUp: [-47.46, -44.07], ppm: 113 } };          // (the heart drawn smaller than the potion - the user: it looked too big beside it)          // (the items on the ground: size, where each stands, its 3D shadow's top-left; how far a shadow moves for each metre up - spritecast's pixel.json)
const HEARTS = 5, WATER_MAX = 200, WATER_GROW = 25, WATER_CAP = 300, SWING_COST = 18, WATER_REGEN = 15, DROP_CHANCE = 0.5, POTION_SHARE = 0.4;          // (a drop or, POTION_SHARE of the time while the tank can grow, a potion)
// PUDDLES: two or three each round, somewhere new - fire does not catch on them, a fireball dies in them, and standing in one fills
// the tank three times as fast. They dry up from the edge: gone ~35 s into the round.
const PUDDLES = [2, 3], PUDDLE_LIFE = 35, PUDDLE_DRY = 22, PUDDLE_FILL = 3, PUDDLE_BOIL = 4;          // (BOIL: the seconds of its life a fire landing in it boils away)
// THE GROUND IS ISOMETRIC, as the girl is (SpriteCast renders her from 30 degrees down: 2:1): its squares are 32 x 16 diamonds, a
// column u going down-right and a row v down-left. A "world" distance counts a screen pixel up or down twice (2:1).
const DW = 32, DH = 16, ISO_X = 480;
const wdist = (dx, dy) => Math.hypot(dx, dy * 2);
const TILE = 16, FIRE_LIFE = 15, FIRE_MAX = 330;          // (how fast it spreads goes with the round: HARD)
const TREES = [[68, 112, 'tree'], [195, 92, 'tree-burnt'], [352, 106, 'tree'], [615, 98, 'tree'], [772, 112, 'tree-burnt'], [900, 94, 'tree'],
               [44, 318, 'tree'], [920, 352, 'tree-burnt'], [104, 528, 'tree-burnt'], [862, 530, 'tree']];
const DECOR = [[248, 196, 'bush'], [735, 226, 'stump'], [450, 488, 'bush'], [615, 420, 'stump'], [196, 390, 'bush'], [810, 450, 'bush'], [525, 182, 'stump']];
const SWAY = { tree: 2, 'tree-half': 2, bush: 1, 'tree-burnt': 1, stump: 0, mushrooms: 1 };          // how far a prop's top moves in the wind, in pixels (whole pixels: frames, not a stretch)
const SWAY_TOP = 1;          // (rows of room above a prop's picture in its sway frames)
const BEAT = 12;          // (frames in a crown's beat: each clump of leaves goes a pixel aside and back once in it)
const ROCKS = [[330, 255], [690, 330], [140, 240]];          // boulders: in the way, and nothing burns on them
// MUSHROOMS: five patches, one at a tree and no more - at wood only (a stump, a tree's foot, a dead tree: never a rock), on its
// shadow side (lower left of it: the sun is upper right). The one wine patch is by the dead tree.
// [x, y, caps]: caps is the colours of its caps (CAP_HUES: 0 red, 1 orange, 2 wine), a digit a cap in threes - 0 all red, 13 all
// orange, 26 all wine, 1 the far cap orange and the near one red, 3 the other way round, 2 and 6 the same with wine
const MUSHROOMS = [[590, 428, 13], [714, 237, 3],                         // (the two stumps)
                   [332, 124, 0], [70, 330, 0], [896, 366, 26]];          // (two trees' feet, the dead tree)
// the footpath: a band of earth from the bottom left into the trees at the top right, along the ground's 2:1, winding a little
const PATH_Y = (x) => 500 - 0.5 * x + 18 * Math.sin(x / 90), PATH_HALF = 24;
// THE WEATHER: the dark of a rainy day, lit by the fires; more smoke, darker, as the forest burns; lightning now and then; a wind
// that changes each round - the rain slants with it, the trees lean with it, smoke and sparks drift with it, the fire spreads with it
const PROP_PPM = 74, PROP_TALL = { tree: 2.4, 'tree-half': 2.4, 'tree-burnt': 2.1, bush: 0.7, stump: 0.45, rock: 0.6, mushrooms: 0.35 };          // (the props' pixels a metre; how tall each is, m - SpriteCast's specs)
const PROP_SHADOW = 1;          // (a prop's shadow as baked: its own steps of darkness are in its picture)
const FIRE_SHADOW = 0.65;       // (under a fire: it makes its own light, so its shadow is small - but dark enough to stand it on the ground)
const SHADOW_MORE = 0.6;        // (every baked shadow - the props' and hers - laid a second time at this much: 56 % at its deepest -> 71 %, 10 % at its far edge -> 16 %)
const SHOT_UP = 35;          // (how high a fireball flies: it is shot from a monster's middle at hers)
const DARK = 0.11, DARK_SMOKE = 0.12, LIGHTNING = [11, 24];          // (the dark's strength, and what the burning adds; seconds between flashes)
const WINDS = [-1, -0.6, 0.6, 1];
const TREE_SAVE = 4;                              // a burning tree put out within this many seconds is as it was; later, half burnt; left to burn 10 s, burnt
const TOP = 132;                                  // the band of trees along the top: nobody walks above it

// little pictures made here, one character a pixel
const FLAMES = [
  ['....r.....', '...rr...r.', '...ryr..r.', '..ryyr.rr.', '..ryyrrry.', '.rryWyryr.', '.ryyWWyyr.', 'rryWWWyyrr', 'ryyWWWWyyr', '.rryyyyrr.'],
  ['.....r....', '..r.rr....', '..rryr..r.', '..ryyr.ryr', '.rryyrryr.', '.ryyWyyyr.', '.ryWWWyyrr', 'rryWWWWyyr', 'ryyWWWWyyr', '.rryyyyrr.'],
  ['...r......', '...rr..r..', '..ryr..rr.', '..ryyrryr.', '.rryyyyyr.', '.ryyWWyrr.', 'rryWWWyyr.', 'ryyWWWWyrr', 'ryyWWWWyyr', '.rryyyyrr.'],
];
const PIX = {
  fireball: { map: ['..ooo..', '.oyyyo.', 'oyWWyyo', 'oyWyyro', 'oyyyrro', '.orrro.', '..ooo..'], col: { o: '#8a1e10', y: '#ffb22e', W: '#fff4c2', r: '#e8501c' } },
  heart: { map: ['.kkk...kkk.', 'krrrk.krrrk', 'krWrrkrrrrk', 'krrrrrrrrrk', 'krrrrrrrrrk', '.krrrrrrrk.', '..krrrrrk..', '...krrrk...', '....krk....', '.....k.....'],
           col: { k: '#2b2418', r: '#e8485a', W: '#ffd0d6' } },
  heartEmpty: { map: ['.kkk...kkk.', 'kgggk.kgggk', 'kgggggggggk', 'kgggggggggk', 'kgggggggggk', '.kgggggggk.', '..kgggggk..', '...kgggk...', '....kgk....', '.....k.....'],
                col: { k: '#2b2418', g: '#5a4a44' } },
  steam: { map: ['..www..', '.wwwww.', 'wwwwwww', 'wwwwwww', 'wwwwwww', '.wwwww.', '..www..'], col: { w: '#ffffff' } },
  drop: { map: ['.b.', 'bbb', 'bWb', '.b.'], col: { b: '#5fb0ee', W: '#d8f0ff' } },
  // where the water strikes: a four-pointed burst, white at the heart
  splat: { map: ['....b....', '....b....', '...bWb...', '.b.WWW.b.', 'bbWWWWWbb', '.b.WWW.b.', '...bWb...', '....b....', '....b....'], col: { b: '#9fd4f8', W: '#ffffff' } },
  bigdrop: { map: ['...k...', '..kbk..', '.kbbbk.', 'kbWbbbk', 'kbWbbbk', 'kbbbbbk', '.kbbbk.', '..kkk..'], col: { k: '#1d3a5c', b: '#5fb0ee', W: '#e8f6ff' } },
  // a potion: a round flask of violet, a gold cap - nothing like the blue drop beside it - and a star that twinkles by it
  potion: { map: ['....ooo....', '...ooOoo...', '....kgk....', '....kgk....', '...kgggk...', '..kWtttTk..', '.kWttttttk.', 'kWtttttttdk', 'kWttTttttdk', 'kttttttttdk', 'kttttttttdk', '.kttttttdk.', '..kdddddk..', '...kkkkk...'],
            col: { o: '#e8b23a', O: '#fff1a8', k: '#3a1d4a', g: '#e8f4ff', W: '#ffffff', t: '#c75bd8', T: '#f6c8ff', d: '#8a2fa0' } },
  twinkle: { map: ['..w..', '..w..', 'wwWww', '..w..', '..w..'], col: { w: '#fff1a8', W: '#ffffff' } },
};

// the drawn facing for a direction: a diagonal as it is; straight across or up and down, the nearest diagonal - the one shown
// last when two are as near (walking east after north-east stays north-east: no flicker)
// the thumbs' places on a phone: where the stick rests, the umbrella's button, how far the stick goes
const PAD_A = [118, H - 112], PAD_B = [W - 112, H - 112], PAD_R = 52;
// a crown's clump at each pixel (clumps.js: runs of clump, count); a clump no number has is no leaf
function clumpIds(base, w, h) {
  const [cw, ch, runs] = CLUMP_PX[base], n = CLUMPS[base].length, a = new Uint8Array(w * h); if (cw !== w || ch !== h) return a;
  for (let r = 0, i = 0; r < runs.length; r += 2) { const c = runs[r] <= n ? runs[r] : 0; a.fill(c, i, i + runs[r + 1]); i += runs[r + 1]; }
  return a;
}
function diagOf(dx, dy, was) {
  const v = dy > 0 ? 'south' : dy < 0 ? 'north' : was.split('-')[0];
  const h = dx > 0 ? 'east' : dx < 0 ? 'west' : was.split('-')[1];
  return `${v}-${h}`;
}
function facingOf(dx, dy) { const i = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); return FACINGS[(i + 8) % 8]; }
function vecOf(f) { const a = FACINGS.indexOf(f) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; }          // (in world terms: x, 2y)
const R = Math.round;

class Chapter1 extends Phaser.Scene {
  constructor() { super('chapter1'); }

  preload() {
    // what is happening, in words on the page until the title is up - and a load that stops is let go: a sound that will not
    // decode (an iPhone's way with some files) is left out, the game goes on without it
    const boot = document.getElementById('boot'); let last = performance.now(), pct = 0;
    this.load.on('progress', (v) => { pct = Math.round(v * 100); last = performance.now(); if (boot) boot.textContent = `Loading ${pct}%`; });
    this.load.on('loaderror', (f) => { BOOT.lost.push(f.key); });
    const watch = setInterval(() => {
      if (!this.load.isLoading()) { clearInterval(watch); return; }
      if (performance.now() - last < 8000) return;
      last = performance.now(); const all = (q) => (Array.isArray(q.entries) ? q.entries.slice() : [...q]), stuck = [...all(this.load.queue), ...all(this.load.inflight)];
      if (boot) boot.textContent = `Loading ${pct}% - skipping ${stuck.length} file(s) that did not open`;
      for (const f of stuck) { BOOT.lost.push(f.key); try { f.onProcessError ? f.onProcessError() : this.load.nextFile(f, false); } catch (e) {} }
    }, 1000);
    // a browser keeps pictures and sounds it has fetched; a changed one is fetched again only under a new address - ASSET_V, to raise
    // whenever a file in assets/ changes
    this.load.on('addfile', (key, type, loader, file) => { if (typeof file.url === 'string' && !file.url.includes('?') && !file.url.startsWith('data:')) file.url += `?v=${ASSET_V}`; });
    for (const f of DIAG) for (const a of ['carry', 'stand']) {          // (the swing: the combo's own set, below)
      this.load.spritesheet(`${a}-${f}`, `assets/girlpx/${a}-${f}.png`, { frameWidth: PX.w, frameHeight: PX.h });
      const s = SHADOW[`${a}-${f}`]; this.load.spritesheet(`sh-${a}-${f}`, `assets/girlpx/shadows/${a}-${f}.png`, { frameWidth: s[0], frameHeight: s[1] });
    }
    this.load.image('item-heart', 'assets/items/heart-hud.png');          // (her hearts: the same 3D heart as the one on the ground, drawn from the front)
     this.load.image('item-potion', 'assets/items/potion.png'); for (const n of ['heart', 'potion']) { this.load.image(`drop-${n}`, `assets/items/${n}-iso.png`); this.load.image(`drop-${n}-sh`, `assets/items/${n}-iso-shadow.png`); } for (const n of ['cap-l', 'cap-r', 'glass']) this.load.image(`tank-${n}`, `assets/items/tank-${n}.png`);          // (assets/items/CREDITS.md)
    for (const [k, e] of Object.entries(FX)) this.load.spritesheet(`fx-${k}`, `assets/fx/${k}.png`, { frameWidth: e.w, frameHeight: e.h });          // (PVFX Foundry, CC0)
    for (const m of Object.keys(MOVES)) for (const f of DIAG) {
      const n = `${m}-${f}`, s = ATTACK.shadows[n];
      this.load.spritesheet(n, `assets/girlpx/attack/${n}.png`, { frameWidth: AX.w, frameHeight: AX.h });
      this.load.spritesheet(`sh-${n}`, `assets/girlpx/attack/shadows/${n}.png`, { frameWidth: s[0], frameHeight: s[1] });
      this.load.spritesheet(`trail-${n}`, `assets/girlpx/attack/trails/${n}.png`, { frameWidth: TRAIL[n].w, frameHeight: TRAIL[n].h });
    }
    // the music (Suno) and the sounds (assets/audio/CREDITS.md)
    for (const n of ['hit_wet_0', 'hit_wet_1', 'douse_out', 'thunder_0', 'thunder_1', 'step_puddle_0', 'step_puddle_1', ...[0, 1, 2, 3, 4].flatMap((i) => [`step_grass_${i}`, `step_dirt_${i}`])]) this.load.audio(n, [`assets/audio/${n}.m4a`, `assets/audio/${n}.ogg`]);          // (m4a plays everywhere, an iPhone too; ogg for a browser without it)
    for (const n of ['bgm_stage', 'bgm_boss', 'bgm_title', 'fire_loop', 'rain_loop', 'spray_0', 'spray_1', 'jingle_clear', 'jingle_win', 'jingle_over', 'jingle_boss_in', 'hr_steam_0', 'poof_0',
                     'hurt_cute_0', 'hurt_cute_1', 'cry_boss_0', 'shot_fire_0', 'hit_1', 'crit_0', 'coin_0', 'error_0', 'hit_soft_0', 'hit_soft_1']) this.load.audio(n, [`assets/audio/${n}.m4a`, `assets/audio/${n}.ogg`]);          // (m4a plays everywhere, an iPhone too; ogg for a browser without it)
    for (const k of Object.keys(SHADE)) this.load.image(`${k}-shade`, `assets/px/props/${k}-shade.png`);
    // (the crowns' clumps of leaves, for the wind, come as numbers: clumps.js)          // (the props' shadows, baked from 3D)
    for (const f of DIAG) this.load.image(`hurt-${f}`, `assets/girlpx/hurt-${f}.png`);
    for (const f of DIAG) for (const c of ['carry', 'stand']) this.load.spritesheet(`refl-${c}-${f}`, `assets/girlpx/refl-${c}-${f}.png`, { frameWidth: PX.w, frameHeight: PX.h });          // (her reflection: seen from below, as the water shows her - tools/reflect_girl.py)          // (hit: the standing frame with the eyes squeezed shut - the faces that show)
    for (const n of ['normal', 'hurt', 'dead']) this.load.spritesheet(`fire-${n}`, `assets/px/fire-${n}.png`, { frameWidth: FIRE_FRAME[n][0], frameHeight: FIRE_FRAME[n][1] });
    this.load.spritesheet('ghost', 'assets/px/ghost.png', { frameWidth: GHOST.fw, frameHeight: GHOST.fh });          // (SpriteCast: the smoke ghost's 8 frames)
    for (let j = 0; j < 5; j++) this.load.image(`puddle-${j}`, `assets/px/puddle-${j}.png`);          // (round puddles, big to tiny: drawn by GPT)
    for (const n of ['burn', 'ash', 'flame-0', 'flame-1', 'flame-2']) this.load.image(n, `assets/px/${n}.png`);          // (the burning ground, its ash, the flames on it: drawn by GPT)
    for (const n of ['ground', 'dirt', 'crown', 'block', 'grassfield', 'terrain', 'grassfront']) this.load.image(n, `assets/px/${n}.png`);          // (block: where nothing passes, marked by hand on the map - tools/blockedit.py)          // (the crown: drawn by GPT, read back on its grid)
    for (const k of Object.keys(FOOT)) this.load.image(k, `assets/px/props/${k}.png`);          // (each prop from four sides: tree-0 .. stump-270)
  }

  // THE GROUND AS IT BURNS AND AFTER: 16 px squares made here, a few of each so the grid does not show - the burning ground (dark,
  // embers glowing, three frames), and the ash it leaves (grey, a few cinders); their edges ragged, so neighbours run into each other
  // THE BURNT GROUND AND THE ASH: ONE LAYER over the whole map (the user: the squares should lie on the iso grid and not show between them),
  // not a picture a square. Each pixel asks which squares round it burn (or are ash) - their share, eased between the squares' middles
  // along the iso grid, with a 2-pixel ragged noise - so burning squares side by side are one patch with no seam, and only the patch's
  // own edge shows, sinking into the grass in steps (solid, 0.8, 0.5). Its colour is GPT's seamless 64 px ground, by screen position,
  // turned to the forest's tones: charred, dark and warm, some embers left glowing (they flicker); ash a grey-brown
  groundTiles() {
    const rd = (k) => { const s_ = this.textures.get(k).getSourceImage(), cv = document.createElement('canvas'); cv.width = s_.width; cv.height = s_.height; const x = cv.getContext('2d'); x.drawImage(s_, 0, 0); return { S: s_.width, d: x.getImageData(0, 0, s_.width, s_.height).data }; };
    this.burnSrc = { burn: rd('burn'), ash: rd('ash') };
    this.burnTex = this.textures.createCanvas('burnlayer', W, H); this.burnDirt = new Set();
    this.add.image(0, 0, 'burnlayer').setOrigin(0).setDepth(-950);
  }
  // THE REFLECTIONS IN THE PUDDLES (the user: by the laws of light). Flat water is a mirror: the camera's mirror image looks UP 30
  // degrees, so the water shows each thing from below, upside down about the ground under it, the same size (a point h up shows h cos30
  // above its foot, its image as far below) - one in the air (a hop, a ghost's float) as far below as it is above. So it reaches a puddle
  // only from beside or behind it, never from in front. Each puddle has a canvas of its own: its reflections drawn in, then cut to its
  // water (alpha over 128) - by hand, so it works in WebGL and Canvas alike (a bitmap mask did not hold) - laid over it, dim: water gives
  // back little light at this angle. Her picture is her rig rendered from below; the monsters' (no such render yet) their own, turned
  reflections() {
    const g = this.girl, gr = this.girlRefl;
    for (const p of this.puddles || []) {
      if (p.gone || !p.spr.active) continue;
      const pk = p.spr.texture.key, src = this.textures.get(pk).getSourceImage(), pw = src.width, ph = src.height, x0 = Math.round(p.x - pw / 2), y0 = Math.round(p.y - ph / 2);
      const items = [];
      if (gr && gr.show && Math.abs(g.x - p.x) < pw / 2 + 24 && g.y < p.y + ph / 2 && g.y > p.y - ph / 2 - PX.h) items.push({ key: gr.key, frame: gr.frame, x: gr.x, top: gr.top, ready: true });
      const mon = (spr, gy, x, a) => { const f = spr.frame, w = f.cutWidth * spr.scaleX, h = f.cutHeight * spr.scaleY, top = spr.y - spr.originY * h, bot = top + h;
        if (Math.abs(x - p.x) < pw / 2 + w / 2 && gy < p.y + ph / 2 && gy > p.y - ph / 2 - h) items.push({ key: spr.texture.key, frame: f.name, x: spr.x - spr.originX * w, top: 2 * gy - bot, w, h, flipX: spr.flipX, mon: true }); };
      for (const m of this.monsters) if (!m.dead && m.spr.visible && m.spr.alpha > 0.5) mon(m.spr, m.y, m.x);
      for (const gh of this.ghosts || []) if (!gh.dead) mon(gh.spr, gh.y, gh.x);
      if (!items.length) { if (p.rimg) p.rimg.setVisible(false); continue; }
      const key = `reflcv-${p.rid}`;
      if (!p.rcv || p.rcv.width !== pw || p.rcv.height !== ph) { this.dropRefl(p); p.rcv = this.textures.createCanvas(key, pw, ph); p.rimg = this.add.image(x0, y0, key).setOrigin(0).setDepth(-944).setAlpha(0.42); }
      const c = p.rcv.getContext(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, pw, ph); c.imageSmoothingEnabled = false;
      for (const it of items) {
        const f = this.textures.getFrame(it.key, it.frame), im = f.source.image, w = it.w || f.cutWidth, h = it.h || f.cutHeight;
        if (it.ready) c.setTransform(1, 0, 0, 1, it.x - x0, it.top - y0);          // (hers: turned over already, about the ground's own line)
        else c.setTransform(it.flipX ? -1 : 1, 0, 0, -1, (it.flipX ? it.x + w : it.x) - x0, it.top + h - y0);          // (upside down: its foot row on the ground's line)
        c.drawImage(im, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, w, h);
      }
      c.setTransform(p.spr.flipX ? -1 : 1, 0, 0, 1, p.spr.flipX ? pw : 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(this.waterOf(pk), 0, 0);
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; p.rcv.refresh(); p.rimg.setPosition(x0, y0).setVisible(true);
    }
  }
  waterOf(key) {          // a puddle picture's water only (alpha over 128), as a canvas - what its reflections are cut to
    this.waterCv = this.waterCv || {}; if (this.waterCv[key]) return this.waterCv[key];
    const im = this.textures.get(key).getSourceImage(), cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
    const d = c.getImageData(0, 0, cv.width, cv.height); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 128 ? 255 : 0; c.putImageData(d, 0, 0); return (this.waterCv[key] = cv);
  }
  dropRefl(p) { if (p.rimg) p.rimg.destroy(); if (p.rcv) this.textures.remove(p.rcv.key); p.rimg = null; p.rcv = null; }
  // round each one walking: the plants rooted just in front of their feet, a few strips cropped to them, from a pool
  grassFeet() {
    if (!this.gfFeet) return; let n = 0;
    const who = [[this.girl.x, this.girl.y, 14]];          // (her, and the items - the user: the items hidden by the grass too; not a fire monster - it burns the grass it stands in - nor a ghost, floating over it)
    for (const it of this.items) if (it.spr.visible) who.push([it.x, it.y, DROP[it.kind === 'potion' ? 'potion' : 'heart'].w / 2, it.y - 7]);          // (floating: only its lowest few px in the grass - low, its bottom in it; high, clear of it)
    for (const [wx, wy, half, top] of who) for (const [i, a, b] of (this.wetAt(wx, wy) || this.wetAt(wx, wy + 6) ? [] : this.gfFeet(wx, wy - 1, half, 10))) {          // (in a puddle: no grass in front - it came up through the water)
      const r = this.gf[i]; let im = this.gfPool[n]; if (!im) im = this.gfPool[n] = this.add.image(0, 0, 'grassfront', 's0').setOrigin(0);
      const cy = top === undefined ? 0 : Math.max(0, Math.min(r[4], top - r[2]));
      im.setFrame('s' + i).setPosition(r[1], r[2]).setCrop(a - r[1], cy, b - a, r[4] - cy).setDepth(r[0] + 0.25).setVisible(true); n++;
    }
    for (let k = n; k < this.gfPool.length; k++) this.gfPool[k].setVisible(false);
  }
  burnDirty(c, r) { this.burnDirt.add(c + ',' + r); }
  burnClear() { this.burnTex.getContext().clearRect(0, 0, W, H); this.burnTex.refresh(); this.burnDirt.clear(); }
  burnRedraw() {
    if (!this.burnDirt.size) return;
    const ctx = this.burnTex.getContext(), state = (c, r) => { const k = c + ',' + r, f = this.fire.get(k); return f ? (f.br ? 3 : 2) : this.ash.has(k) ? 1 : 0; };
    for (const key of this.burnDirt) {
      const [c, r] = key.split(',').map(Number); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const [cx, cy] = this.centre(c + dc, r + dr); x0 = Math.min(x0, cx - DW / 2); x1 = Math.max(x1, cx + DW / 2); y0 = Math.min(y0, cy - DH / 2); y1 = Math.max(y1, cy + DH / 2); }
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
      if (x1 <= x0 || y1 <= y0) continue;
      const bw = x1 - x0, bh = y1 - y0, img = ctx.createImageData(bw, bh), o = img.data, memo = new Map(), st = (cc, rr) => { const k = cc * 4096 + rr; if (!memo.has(k)) memo.set(k, state(cc, rr)); return memo.get(k); };
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const a = (x + 0.5 - ISO_X) / (DW / 2), b = (y + 0.5) / (DH / 2), u = (a + b) / 2 - 0.5, v = (b - a) / 2 - 0.5, i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
        let F = 0, Fb = 0, br = 0;
        for (const [di, dj, w] of [[0, 0, (1 - fu) * (1 - fv)], [1, 0, fu * (1 - fv)], [0, 1, (1 - fu) * fv], [1, 1, fu * fv]]) { const s_ = st(i0 + di, j0 + dj); if (s_) { F += w; if (s_ >= 2) { Fb += w; if (s_ === 3) br += w; } } }
        if (F <= 0) continue;
        const n = ((((x >> 1) * 73 + (y >> 1) * 151) * 2654435761 >>> 0) % 100 / 100 - 0.5) * 0.36, G = F + n;
        if (G < 0.5) continue;
        const burn = Fb * 2 >= F, src = burn ? this.burnSrc.burn : this.burnSrc.ash, so = ((y % src.S) * src.S + (x % src.S)) * 4;
        let R_ = src.d[so], Gg = src.d[so + 1], B_ = src.d[so + 2]; const l = (R_ + Gg + B_) / 3;
        const h2 = ((((x >> 1) * 197 + (y >> 1) * 89) * 2246822519 >>> 0) % 100) / 100;
        if (burn && R_ > 120 && R_ > B_ + 40 && h2 < 0.42) {
          if (br * 2 >= Fb) { R_ = Math.min(255, R_ * 1.15); Gg = Math.min(255, Gg * 1.3 + 12); }
          const f_ = this.fire.get(Math.floor(u + 0.5) + ',' + Math.floor(v + 0.5)), kd = f_ ? f_.kind : 'red';          // (the embers in the fire's own colour, as its flames are: recolour's channels)
          if (kd === 'blue') { const t_ = R_; R_ = B_; B_ = t_; } else if (kd === 'green') { const t_ = R_; R_ = B_; B_ = Math.round(Gg * 0.5); Gg = t_; } else if (kd === 'purple') { const t_ = R_; R_ = Math.round(t_ * 0.85); Gg = B_; B_ = Math.min(255, Math.round(t_ * 0.95)); }
        }
        else if (!burn) { const q = l * 0.62 + 18; R_ = q * 1.04; Gg = q; B_ = q * 0.9; }
        else { const q = l * 0.42 + 10; R_ = q * 1.12 + 6; Gg = q * 0.98 + 4; B_ = q * 0.78 + 2; }
        const p_ = ((y - y0) * bw + (x - x0)) * 4; o[p_] = R_; o[p_ + 1] = Gg; o[p_ + 2] = B_; o[p_ + 3] = Math.round((G > 0.8 ? 1 : G > 0.65 ? 0.78 : 0.5) * (burn ? 178 : 150));          // (see-through: the grass under it shows a little - the user)
      }
      ctx.putImageData(img, x0, y0);
    }
    this.burnDirt.clear(); this.burnTex.refresh();
  }

  // a prop's picture, stood on its foot (FOOT: assets/px/props/foot.js)
  setProp(img, key, lean = 0, f = 0) {
    const a = this.swayPad(key), [fx, fy] = FOOT[key]; img.setTexture(this.swayFrame(key, lean, f, img.hue || 0));
    const dim = /^tree-(?!burnt)/.test(key) ? TREE_DIM : /^bush-(?!burnt)/.test(key) ? BUSH_DIM * (/-(0|270)$/.test(key) ? 0.91 : 1) : /^rock-/.test(key) ? ROCK_DIM : 1; if (img.dim !== dim) { img.dim = dim; img.setTint(dimmed(0xffffff, dim)); }          // (green leaves - a tree, a bush - a little darker than they were drawn)
    return img.setOrigin((fx + a) / img.width, (fy + SWAY_TOP + 0.5) / img.height);
  }
  swayPad(key) { return (SWAY[key.replace(/-\d+$/, '')] || 0) + 2; }
  // THE WIND IN A TREE. The crown is boughs, not one sheet: each clump of leaves (cut out of the tree's 3D model - CLUMPS,
  // <key>-clumps.png, tools/hitmask.py) moves WHOLE, a pixel at a time, its shape kept; the far clumps are laid first and the near
  // ones over them; the trunk, the branches and the roots stand. Each clump has its own moment in the beat (by where it is across the
  // tree: the wind reaches one after another), and in a gust the upper clumps lean a pixel more. A frame is made when first shown.
  swayData(key) {
    this.swayD = this.swayD || {}; if (this.swayD[key]) return this.swayD[key];
    const read = (k) => { const im = this.textures.get(k).getSourceImage(), c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); return g.getImageData(0, 0, im.width, im.height); };
    const base = key.replace('bush-burnt', 'bush'), src = read(key), w = src.width, h = src.height, cl = CLUMPS[base] && CLUMP_PX[base] && !key.includes('burnt') ? clumpIds(base, w, h) : null;
    const pix = []; if (cl) for (let i = 0; i < w * h; i++) { const c = cl[i]; if (c) (pix[c - 1] = pix[c - 1] || []).push(i); }          // (each clump's pixels)
    if (cl && !key.startsWith('mushrooms')) {
      // (the dark line round the crown is not green, so no clump had it - and it stood where it was while its leaves moved off. A
      // pixel of the picture at its edge, no clump's, with two or more leaves of clumps round it, goes with the clump most of them are)
      const id = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : cl[y * w + x], clear = (x, y) => x < 0 || y < 0 || x >= w || y >= h || src.data[(y * w + x) * 4 + 3] < 128, add = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (clear(x, y) || id(x, y) || !(clear(x - 1, y) || clear(x + 1, y) || clear(x, y - 1) || clear(x, y + 1))) continue;
        const n = {}; let top = 0, cnt = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = id(x + dx, y + dy); if (c) { n[c] = (n[c] || 0) + 1; cnt++; if (n[c] > (n[top] || 0)) top = c; } }
        if (cnt >= 2) add.push([top, y * w + x]);
      }
      for (const [c, i] of add) pix[c - 1].push(i);
    }
    const tall = Math.max(...(CLUMPS[base] || [[0, 1, 0]]).map((c) => c[1]));
    // (a row of room above the picture: a clump lifts a pixel, and a crown's top or a mushroom's cap was cut off at the picture's edge)
    const up = new Uint8ClampedArray(w * (h + SWAY_TOP) * 4); up.set(src.data, w * SWAY_TOP * 4);
    return (this.swayD[key] = { w, h: h + SWAY_TOP, px: up, pix: pix.map((q) => q && q.map((i) => i + w * SWAY_TOP)), at: cl ? CLUMPS[base] : [], tall });
  }
  swayFrame(key, lean = 0, f = 0, hue = 0) {          // (hue: a mushroom's cap in another colour - CAP_HUES)
    const name = `${key}~${lean}_${f}` + (hue ? `_h${hue}` : ''); if (this.textures.exists(name)) return name;
    const D = this.swayData(key), { w, h, pix, at, tall } = D, a = this.swayPad(key), W2 = w + 2 * a;
    if (hue && !D.hues) D.hues = {}; if (hue && !D.hues[hue]) {          // (hue: a digit a cap, in threes - cap k's colour is its k-th digit; red not in a cap goes with the first)
      const q = D.hues[hue] = new Uint8ClampedArray(D.px), of = new Uint8Array(w * h); pix.forEach((c, k) => { for (const i of c || []) of[i] = k; });
      for (let i = 0; i < q.length; i += 4) { const r = q[i], g = q[i + 1], b = q[i + 2], fn = CAP_HUES[Math.floor(hue / 3 ** of[i / 4]) % 3]; if (fn && r > g * 1.5 && r > b * 1.5 && r > 90) [q[i], q[i + 1], q[i + 2]] = fn(r, g, b); }
    }
    const px = hue ? D.hues[hue] : D.px;
    const t = this.textures.createCanvas(name, W2, h), c = t.getContext(), out = c.createImageData(W2, h), o = out.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, j2 = (y * W2 + x + a) * 4; if (px[i + 3] > 127) { o[j2] = px[i]; o[j2 + 1] = px[i + 1]; o[j2 + 2] = px[i + 2]; o[j2 + 3] = 255; } }          // (the tree as it stands)
    // (a mushroom's cap is one smooth shape: left under the moved one it shows as a second edge - so its caps are lifted off first, and
    // what a cap leaves bare is the stem below it carried up, or nothing; leaves hide theirs, and stay as they are)
    const clean = key.startsWith('mushrooms'), bare = [], put = new Uint8Array(W2 * h), rose = new Uint8Array(w * h);          // (put: where a clump was laid; rose: the pixels of the caps that went up this frame)
    if (clean) for (const q of pix) for (const i of q || []) { const j2 = (Math.floor(i / w) * W2 + i % w + a) * 4; o[j2 + 3] = 0; bare.push(i); }
    for (let k = 0; k < pix.length; k++) {          // (then each clump, far to near, a pixel aside or up by its place in the beat)
      if (!pix[k] || !at[k]) continue; const [cx, cy] = at[k], th = 2 * Math.PI * (f / BEAT - cx * 0.55 - (k % 3) * 0.11), up = cy / tall;
      const ln = Math.abs(lean) === 1 ? (up > 0.72 ? 1 : 0) : Math.abs(lean) === 2 ? (up > 0.72 ? 2 : up > 0.45 ? 1 : 0) : 0;          // (a gust: first the top clumps a pixel, then those two and the middle one)
      // (a mushroom does not stir: a stiff little thing, it only gives a pixel at the cap when a gust leans on it - the steady nodding
      // made for leaves read as a tremble on it)
      const dx = clean ? Math.sign(lean) * Math.min(1, ln) : Math.round(0.8 * Math.sin(th)) + Math.sign(lean) * ln, dy = clean ? 0 : Math.sin(th + 1.3) > 0.9 ? -1 : 0;
      if (!dx && !dy && !clean) { for (const i of pix[k]) put[Math.floor(i / w) * W2 + i % w + a] = 1; continue; }
      if (clean && dy < 0) for (const i of pix[k]) rose[i] = 1;
      for (const i of pix[k]) { const x = i % w + dx + a, y = Math.floor(i / w) + dy; if (x < 0 || y < 0 || x >= W2 || y >= h) continue; const j2 = (y * W2 + x) * 4; o[j2] = px[i * 4]; o[j2 + 1] = px[i * 4 + 1]; o[j2 + 2] = px[i * 4 + 2]; o[j2 + 3] = 255; put[y * W2 + x] = 1; }
    }
    if (!clean && pix.length) {
      // a crown: where a clump has gone from, the leaves it left show - right inside the crown (more leaves), wrong at its edge (a second
      // outline beside the moved one). So what a clump left behind is taken off from the outside in, as far as a clump moves (3 pixels):
      // the edge goes with its clump, the inside stays whole
      let left = []; for (const q of pix) for (const i of q || []) { const n = Math.floor(i / w) * W2 + i % w + a; if (!put[n]) left.push(n); }
      const open = (n, dx, dy) => { const x = n % W2 + dx, y = Math.floor(n / W2) + dy; return x < 0 || y < 0 || x >= W2 || y >= h || o[(y * W2 + x) * 4 + 3] === 0; };
      for (let r = 0; r < 3 && left.length; r++) {
        const off = left.filter((n) => open(n, -1, 0) || open(n, 1, 0) || open(n, 0, -1) || open(n, 0, 1)); if (!off.length) break;
        for (const n of off) { o[n * 4 + 3] = 0; put[n] = 2; } left = left.filter((n) => put[n] !== 2);
      }
    }
    if (clean) {
      const cl = new Uint8Array(w * h); for (const i of bare) cl[i] = 1;
      const lit = (x, y) => x >= 0 && y >= 0 && x < W2 && y < h && o[(y * W2 + x) * 4 + 3] > 0;
      // (what a cap leaves bare is the ground behind it - nothing, see-through - not a colour of the mushroom: a cap that swings aside
      // shows what it stood in front of. Two things only are filled: under a cap that LIFTED the stem goes up after it, a pixel; and a
      // slit shut in by caps on three sides or four, with a cap's colour. It was filled with the stem's pale colour wherever a stem
      // was below, and a cap that swung aside left a white rim behind it)
      for (const i of bare) {
        const x = i % w, y = Math.floor(i / w), X = x + a, j2 = (y * W2 + X) * 4; if (o[j2 + 3]) continue;
        if (rose[i] && y + 1 < h && !cl[i + w] && px[(i + w) * 4 + 3] > 127) { const from = (i + w) * 4; o[j2] = px[from]; o[j2 + 1] = px[from + 1]; o[j2 + 2] = px[from + 2]; o[j2 + 3] = 255; continue; }
        const nb = [[X, y + 1], [X - 1, y], [X + 1, y], [X, y - 1]].filter(([u, v]) => lit(u, v)), part = nb.find(([u, v]) => put[v * W2 + u]);
        if (nb.length >= 3 && part) { const n = (part[1] * W2 + part[0]) * 4; o[j2] = o[n]; o[j2 + 1] = o[n + 1]; o[j2 + 2] = o[n + 2]; o[j2 + 3] = 255; put[y * W2 + X] = 1; }
      }
    }
    c.putImageData(out, 0, 0); t.refresh(); return name;
  }
  // a burnt bush: the bush's own pixels taken to charcoal by their lightness, a few embers in it
  burntBush(key) {
    const src = this.textures.get(key).getSourceImage(), w = src.width, h = src.height, t = this.textures.createCanvas(key.replace('bush', 'bush-burnt'), w, h), c = t.getContext();
    c.drawImage(src, 0, 0); const d = c.getImageData(0, 0, w, h), rnd = new Phaser.Math.RandomDataGenerator([key]);
    const CH = [[22, 18, 16], [38, 32, 28], [58, 50, 44], [84, 74, 64]];
    for (let i = 0; i < d.data.length; i += 4) {
      if (d.data[i + 3] < 128) continue;
      const l = (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) / 255, q = CH[Math.min(3, Math.floor(l * 4.2))];
      const ember = rnd.frac() < 0.012 && l > 0.3; d.data[i] = ember ? 236 : q[0]; d.data[i + 1] = ember ? 112 : q[1]; d.data[i + 2] = ember ? 40 : q[2];
    }
    c.putImageData(d, 0, 0); t.refresh(); FOOT[key.replace('bush', 'bush-burnt')] = FOOT[key];
  }
  // SHADOWS, baked from each prop's 3D model (tools/hitmask.py): the light on the ground is the sun's part and the sky's, each as much
  // as the thing leaves open - so deep close by it (by a trunk's foot, under a low rock) and soft and pale where it falls from high up
  // (a crown's); in a few steps, as pixel art. A burnt bush casts the bush's
  // IN THE SHADE: how much of the sun the props' baked shadows take from a point of her (x, y on the ground, h metres up) - the shadow
  // on the ground where the line from that point away from the sun comes down (the sun: SpriteCast's, 0.42 m left and 0.78 m back for
  // every metre up), counted only from a prop taller than h (a rock shades her feet, not her head); each prop's shadow as it stands
  // now (a burning tree's is pale) -> 0 in the sun .. ~0.56 deep in the shade
  shadeOn(x, y, h) {
    const gx = x - 0.42 * h * PROP_PPM, gy = y - 0.78 * h * 0.5 * PROP_PPM; let lit = 1;
    for (const p of [...this.trees, ...this.decor]) {
      const key = p.img.texture.key.split('~')[0].replace('bush-burnt', 'bush'), m = this.shadeMap(key); if (!m || (PROP_TALL[key.replace(/-\d+$/, '')] || 0) <= h) continue;
      const i = Math.floor(gx - (p.x - m.ox)), j = Math.floor(gy - (p.y - m.oy)); if (i < 0 || j < 0 || i >= m.w || j >= m.h) continue;
      lit *= 1 - m.a[j * m.w + i] / 255 * (p.shadow ? p.shadow.alpha : 1);
    }
    return 1 - lit;
  }
  shadeMap(key) {          // (a prop's shadow picture read once: its alpha, and where it sits from the prop's foot)
    this.shadeMaps = this.shadeMaps || {}; if (key in this.shadeMaps) return this.shadeMaps[key];
    if (!SHADE[key] || !this.textures.exists(`${key}-shade`)) return (this.shadeMaps[key] = null);
    const src = this.textures.get(`${key}-shade`).getSourceImage(), c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0); const d = g.getImageData(0, 0, src.width, src.height).data, a = new Uint8Array(src.width * src.height);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
    const [x0, y0] = SHADE[key], [fx, fy] = FOOT[key];
    return (this.shadeMaps[key] = { a, w: src.width, h: src.height, ox: fx - x0, oy: fy + 0.5 - y0 });
  }

  shadowOf(key, x, y, alpha = PROP_SHADOW) {
    const k = key.replace('bush-burnt', 'bush'), t = `${k}-shade`, [x0, y0] = SHADE[k], [fx, fy] = FOOT[k], src = this.textures.get(t).getSourceImage();
    return this.add.image(R(x), R(y), `${t}-deep`).setOrigin((fx - x0) / src.width, (fy + 0.5 - y0) / src.height).setAlpha(alpha).setDepth(-500);
  }

  // a picture from a map of characters
  pix(key, { map, col }) {
    const t = this.textures.createCanvas(key, map[0].length, map.length), c = t.getContext();
    map.forEach((row, j) => [...row].forEach((ch, i) => { if (col[ch]) { c.fillStyle = col[ch]; c.fillRect(i, j, 1, 1); } })); t.refresh();
  }

  // the other colours: the red flame's pixels with its channels moved round - blue (red and blue swapped), green, purple
  recolour(key, kind) {
    const src = this.textures.get(key).getSourceImage(), t = this.textures.createCanvas(`${key}-${kind}`, src.width, src.height), c = t.getContext();
    c.drawImage(src, 0, 0); const d = c.getImageData(0, 0, src.width, src.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2];
      if (r > 1.25 * b + 20 && r >= g) {          // (the flame's reds, oranges, yellows - not the eyes' white or the outline's black)
        if (kind === 'blue') { d.data[i] = b; d.data[i + 2] = r; }
        else if (kind === 'green') { d.data[i] = b; d.data[i + 1] = r; d.data[i + 2] = Math.round(g * 0.5); }
        else if (kind === 'purple') { d.data[i] = Math.round(r * 0.85); d.data[i + 1] = b; d.data[i + 2] = Math.min(255, Math.round(r * 0.95)); }
      }
    }
    c.putImageData(d, 0, 0);
    const from = this.textures.get(key);          // (a sprite sheet keeps its frames in the copy: the fireball's flight)
    for (const n of from.getFrameNames()) { const f = from.get(n); t.add(n, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight); }
    t.refresh();
  }

  // A FLAME'S SOFT EDGE (no 3D model to measure, so the distance in from its edge stands for its thickness): the rim pixel 0.3, the next
  // 0.55, inside 0.8, the brightest core kept - in steps, so it stays pixel art. The ground's flames, the trees' and the fireball's flight;
  // they waver besides, each to its own beat (WAVER)
  softEdge(key) {
    const tex = this.textures.get(key), src = tex.getSourceImage(), W = src.width, H = src.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.drawImage(src, 0, 0); const d = c.getImageData(0, 0, W, H), q = d.data, D = new Uint16Array(W * H);
    for (let i = 0; i < W * H; i++) D[i] = q[i * 4 + 3] > 0 ? 999 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : D[y * W + x]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (D[i]) D[i] = Math.min(D[i], at(x - 1, y) + 1, at(x - 1, y - 1) + 1, at(x, y - 1) + 1, at(x + 1, y - 1) + 1); }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (D[i]) D[i] = Math.min(D[i], at(x + 1, y) + 1, at(x + 1, y + 1) + 1, at(x, y + 1) + 1, at(x - 1, y + 1) + 1); }
    for (let i = 0; i < W * H; i++) {
      if (!D[i]) continue; const l = (q[i * 4] + q[i * 4 + 1] + q[i * 4 + 2]) / 3;
      let a = D[i] <= 1 ? 0.3 : D[i] === 2 ? 0.55 : 0.8; if (l > 225 && D[i] > 1) a = 0.9;
      q[i * 4 + 3] = Math.round(q[i * 4 + 3] * a);
    }
    c.putImageData(d, 0, 0);
    const frames = tex.getFrameNames().map((n) => { const f = tex.get(n); return [n, f.cutX, f.cutY, f.cutWidth, f.cutHeight]; });
    this.textures.remove(key); const t = this.textures.addCanvas(key, cv);
    for (const [n, x, y, w, h] of frames) t.add(n, 0, x, y, w, h);
  }

  // a smaller copy of a pixel picture: each new pixel one of the old (nearest), so it stays pixel art - for flames young or dying
  smaller(key, suf, k) {
    const src = this.textures.get(key).getSourceImage(), w = Math.max(3, R(src.width * k)), h = Math.max(4, R(src.height * k)), t = this.textures.createCanvas(key + suf, w, h), c = t.getContext();
    c.imageSmoothingEnabled = false; c.drawImage(src, 0, 0, w, h); t.refresh();
  }

  // an oval in hard pixels (shadows), drawn into a texture once
  oval(key, w, h, rgba) {
    const t = this.textures.createCanvas(key, w, h), c = t.getContext(); c.fillStyle = rgba;
    for (let y = 0; y < h; y++) { const v = (y + 0.5 - h / 2) / (h / 2), half = Math.floor(w / 2 * Math.sqrt(Math.max(0, 1 - v * v))); c.fillRect(R(w / 2 - half), y, half * 2, 1); }
    t.refresh();
  }

  create() {
    BOOT.el.textContent = 'Building the forest...';
    // a sound that did not load is silence, not an error
    { const has = (k) => this.cache.audio.exists(k), add = this.sound.add.bind(this.sound), play = this.sound.play.bind(this.sound);
      const none = () => ({ key: '', isPlaying: false, rate: 1, volume: 0, play() {}, stop() {}, setVolume() { return this; }, once(e, f) { if (e === 'complete' && f) setTimeout(f, 0); return this; } });
      this.sound.add = (k, c) => (has(k) ? add(k, c) : none()); this.sound.play = (k, c) => has(k) && play(k, c); }
    for (const [k, v] of Object.entries(PIX)) this.pix(k, v);
    for (let i = 0; i < 3; i++) this.softEdge(`flame-${i}`); this.softEdge('fx-fireflight');          // (before the colours and the smaller copies: they take it with them)
    for (const k of ['blue', 'green', 'purple']) for (let i = 0; i < 3; i++) this.recolour(`flame-${i}`, k);          // (GPT's flame, in each fire's colour)
    for (const k of ['red', 'blue', 'green', 'purple']) for (let i = 0; i < 3; i++) { this.smaller(flameKey(i, k), '-m', 0.66); this.smaller(flameKey(i, k), '-s', 0.42); }
    this.oval('scorch', 18, 10, 'rgba(30,20,12,0.55)');
    this.groundTiles();
    this.puddles = []; this.wet = new Map();          // "col,row" -> the puddle's square
    this.fire = new Map(); this.ash = new Map(); this.spreadT = 0;          // "col,row" -> { age, life, spr, gnd } / the ash a fire left
    for (const k of ['blue', 'green', 'purple']) { for (const n of ['normal', 'hurt', 'dead']) this.recolour(`fire-${n}`, k); this.recolour('fireball', k); this.recolour('fx-fireflight', k); }

    // the props' shadows as they are drawn: each baked one laid on itself SHADOW_MORE times more (its own picture is kept as baked: shadeOn reads it)
    for (const k of Object.keys(SHADE)) {
      const src = this.textures.get(`${k}-shade`).getSourceImage(), t = this.textures.createCanvas(`${k}-shade-deep`, src.width, src.height), c = t.getContext(); c.drawImage(src, 0, 0);
      const d = c.getImageData(0, 0, src.width, src.height), q = d.data;
      for (let i = 3; i < q.length; i += 4) { const al = q[i] / 255; q[i] = Math.round(255 * (1 - (1 - al) * (1 - SHADOW_MORE * al))); }
      c.putImageData(d, 0, 0); t.refresh();
    }
    this.oval('shadow-fire', 46, 12, `rgba(30,18,6,${FIRE_SHADOW})`);
    this.oval('shadow-item', 22, 7, 'rgba(30,18,6,0.5)');          // (an item's: just round, on the ground under it as it bobs)          // (a fire makes its own light: only a contact shadow, a rim of it showing round its foot)
    this.oval('firelight', 120, 40, 'rgba(255,140,60,0.16)'); this.oval('firelight-in', 70, 22, 'rgba(255,170,80,0.16)');
    // the glow behind a fire monster: three hard rings, laid on with ADD
    const gc = this.textures.createCanvas('glow', 96, 96), gx = gc.getContext();
    for (const [r, a] of [[46, 0.12], [34, 0.16], [22, 0.22]]) { gx.fillStyle = `rgba(255,140,50,${a})`; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); gx.fillRect(48 - w, 48 + y, w * 2, 1); } }
    gc.refresh();

    // the ground: one tile, each copy flipped at random so the repeat does not show
    const gw = this.textures.get('ground').getSourceImage().width;
    this.add.image(0, 0, 'grassfield').setOrigin(0).setDepth(-1000);          // THE GRASS: one picture of the whole ground, no tile - GPT's tufts cut out and scattered at random where a Gaussian density says (thick patches and thin, stretched 2:1 along the iso ground), back to front (tools/grassfield.py; the user: no square grid, no seams, a natural meadow)
    // (the footpath is in the meadow's picture now: earth, two wheel ruts and gravel, rendered in 3D with it - tools/meadow3d.py)
    this.add.image(0, 0, 'terrain').setOrigin(0).setDepth(-949);          // THE GROUND'S RISE AND FALL: a 3D height map's slopes lit by the props' sun, over the grass, the path and the burnt ground (tools/terrain.py)
    // the props: each from one of its four sides, at random - a tree that burns stands burnt from the same side
    const side = () => [0, 90, 180, 270][Phaser.Math.Between(0, 3)];
    for (const v of [0, 90, 180, 270]) this.burntBush(`bush-${v}`);
    // what burns: the trees, and the bushes (low: walked through, not round); a burnt tree stays a burnt tree
    this.trees = [...TREES, ...DECOR.filter((d) => d[2] === 'bush')].map(([x, y, k]) => {
      const v = side(), key = `${k}-${v}`, bush = k === 'bush';
      return { x, y, v, base: bush ? 'bush' : 'tree', solid: !bush, r: bush ? 12 : k === 'tree' ? 18 : 13, kind: k, state: k === 'tree' || bush ? 'green' : 'burnt', shadow: this.shadowOf(key, x, y), img: this.setProp(this.add.image(x, y, key), key).setDepth(y), ph: Math.random() * 6 };
    });
    // WHERE NOTHING PASSES: marked by hand on the map, 4 x 4 pixel squares (white: solid) - her, the monsters and the fireballs alike
    { const im = this.textures.get('block').getSourceImage(), c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const cx = c.getContext('2d'); cx.drawImage(im, 0, 0); const d = cx.getImageData(0, 0, c.width, c.height).data;
      this.block = { w: c.width, h: c.height, s: W / c.width, on: Uint8Array.from({ length: c.width * c.height }, (_, i) => d[i * 4] > 127 ? 1 : 0) }; }
    const still = [...DECOR.filter((d) => d[2] !== 'bush'), ...ROCKS.map(([x, y]) => [x, y, 'rock']), ...MUSHROOMS.map(([x, y, c]) => [x, y, 'mushrooms', c])];
    this.decor = still.map(([x, y, k, caps]) => { const key = `${k}-${side()}`, im = this.add.image(x, y, key); this.shadowOf(key, x, y); if (k === 'mushrooms') im.hue = caps; return { x, y, kind: k, img: this.setProp(im, key).setDepth(y) }; });
    // THE GRASS IN FRONT (the user: her feet hidden in the grass, and the trees' feet too). The meadow (tools/meadow3d.py) comes with its
    // plants cut into strips by where each is rooted (GRASSFRONT: [root y, x, y, w, h, y in the picture]); a strip drawn at its root's
    // depth covers whoever stands behind those plants. Only where it matters - a prop's foot (for good) and round each one walking (every
    // frame, a few strips cropped to their feet) - so the meadow's shadows stay as they are everywhere else
    this.gf = [];
    if (typeof GRASSFRONT !== 'undefined' && this.textures.exists('grassfront')) {
      const t = this.textures.get('grassfront'); GRASSFRONT.forEach((r, i) => { t.add('s' + i, 0, 0, r[5], r[3], r[4]); this.gf.push(r); });
      const feet = (x, y, half, reach, depthOf) => { const out = []; for (let i = 0; i < this.gf.length; i++) { const r = this.gf[i]; if (r[0] <= y || r[0] > y + reach) continue; const a = Math.max(r[1], x - half), b = Math.min(r[1] + r[3], x + half); if (b <= a) continue; out.push([i, a, b]); } return out; };
      this.gfFeet = feet;
      for (const pr of [...this.trees, ...this.decor]) {          // (a prop's foot: its trunk's, a rock's, a stump's - as wide as its base, the plants just in front of it)
        if (pr.kind === 'mushrooms') continue;          // (too low: the grass would hide half of them)
        const half = pr.solid ? 16 : 12, reach = pr.solid ? 12 : 7;
        for (const [i, a, b] of feet(pr.x, pr.y - 2, half, reach)) { const r = this.gf[i]; this.add.image(r[1], r[2], 'grassfront', 's' + i).setOrigin(0).setCrop(a - r[1], 0, b - a, r[4]).setDepth(r[0] + 0.25); }
      }
      this.gfPool = [];
    }
    this.rocks = this.decor.filter((d) => d.kind === 'rock').map((d) => ({ x: d.x, y: d.y, r: 20, solid: true }));
    this.lightT = 0;
    // the dark: a quarter-size picture, scaled up 4x without smoothing (light in 4-pixel steps), over the world and under the rain
    this.darkT = this.textures.createCanvas('dark', W / 4, H / 4); this.darkImg = this.add.image(0, 0, 'dark').setOrigin(0).setScale(4).setDepth(4500);
    this.warmT = this.textures.createCanvas('warm', W / 4, H / 4); this.warmImg = this.add.image(0, 0, 'warm').setOrigin(0).setScale(4).setDepth(4490).setBlendMode(Phaser.BlendModes.ADD);
    this.darkClock = 0;
    this.flashImg = this.add.rectangle(0, 0, W, H, 0xe8f0ff, 0).setOrigin(0).setDepth(4510);
    this.boltT = Phaser.Math.Between(...LIGHTNING); this.wind = WINDS[Phaser.Math.Between(0, 3)]; this.splashes = []; this.stepFr = -1;
    this.pix('smoke', { map: ['.ss.', 'ssss', 'ssss', '.ss.'], col: { s: '#4a4640' } });
    this.pix('smoke-big', { map: ['..ss..', '.ssss.', 'ssssss', 'ssssss', '.ssss.', '..ss..'], col: { s: '#3e3a36' } });
    this.ripples = []; this.pmask = {}; this.rippleG = this.add.graphics().setDepth(-940);

    // the girl
    this.girl = { x: W / 2, y: H / 2 + 50, facing: 'south', show: 'south-east', walkT: 0, attack: null, hearts: HEARTS, water: WATER_MAX, waterMax: WATER_MAX, hurtT: 0, push: [0, 0] };
    this.girlShadow = this.add.sprite(0, 0, 'sh-carry-south-east', 0).setOrigin(0);
    this.girlShadow2 = this.add.sprite(0, 0, 'sh-carry-south-east', 0).setOrigin(0).setAlpha(SHADOW_MORE);
    this.girlSpr = this.add.sprite(0, 0, 'carry-south-east', 0).setOrigin(0);
    this.trailSpr = this.add.sprite(0, 0, 'trail-downward-south-east', 0).setOrigin(0).setVisible(false);

    this.monsters = []; this.shots = []; this.ghosts = [];
    this.wave = -1; this.state = 'title';

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,R,ENTER,L');
    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    // a tap is kept until the next update: a very short press (down and up in one frame) is never lost
    this.swingAsked = false;
    for (const kk of ['SPACE', 'J']) this.input.keyboard.on(`keydown-${kk}`, () => { this.swingAsked = true; });

    // TOUCH: a phone gets a stick under the left thumb and the umbrella under the right; a computer never sees them. Which it is
    // follows what is used - a finger on the screen turns them on, a key turns them off. The fingers are read from the page, not
    // the canvas: on a wide phone the thumbs rest on the bars beside the picture
    this.touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); this.fingers = new Map(); this.stick = null; this.stateAt = 0;
    this.padG = this.add.graphics().setDepth(6500); this.padDrop = this.add.image(PAD_B[0], PAD_B[1], 'bigdrop').setScale(2).setDepth(6501).setAlpha(0.7).setVisible(false);
    const at = (t) => { const dx = t.clientX - innerWidth / 2, dy = t.clientY - innerHeight / 2, [lx, ly] = FIT.turned ? [dy, -dx] : [dx, dy]; return [lx / FIT.k + W / 2, ly / FIT.k + H / 2]; };          // (a finger's place in the picture, turned or not)
    // (the name box: while it is open the fingers are its own - and for a moment after it shuts, so a button pressed twice does not start a game)
    let shutAt = -1e9, wasOpen = false; const boxOpen = () => { const o = document.getElementById('namebox').style.display === 'flex'; if (wasOpen && !o) shutAt = performance.now(); wasOpen = o; return o || performance.now() - shutAt < 700; };
    setInterval(boxOpen, 100);
    this.onTouch = (e) => {
      if (boxOpen()) return;
      for (const t of e.changedTouches) {
        const [x, y] = at(t);
        if (e.type === 'touchstart') { this.fingers.set(t.identifier, { x0: x, y0: y, x, y }); if (!this.touch) { this.touch = true; this.retext(); } this.tap(x, y); }
        else if (e.type === 'touchmove') { const f = this.fingers.get(t.identifier); if (f) { f.x = x; f.y = y; } }
        else { this.fingers.delete(t.identifier); if (this.stick === t.identifier) this.stick = null; }
      }
    };
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) window.addEventListener(ev, this.onTouch, { passive: true });
    this.input.keyboard.on('keydown', () => { if (this.touch) { this.touch = false; this.fingers.clear(); this.stick = null; this.retext(); } });

    this.rain = Array.from({ length: 110 }, () => this.newDrop(true));
    this.rainG = this.add.graphics().setDepth(5000);

    // letters: the pixel font at its own size (11 px) or twice or three times that - never between
    const txt = (x, y, size, col = '#fff8e8') => ptext(this, x, y, '', size, col);
    // her hearts: the heart she picks up, seen from the front (assets/items/CREDITS.md); a lost one the same heart, dark and grey
    { const src = this.textures.get('item-heart').getSourceImage(), t = this.textures.createCanvas('item-heart-empty', src.width, src.height), c = t.getContext();
      c.drawImage(src, 0, 0); const d = c.getImageData(0, 0, src.width, src.height);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.round((0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2]) * 0.55); d.data[i] = v + 8; d.data[i + 1] = v + 2; d.data[i + 2] = v; }
      c.putImageData(d, 0, 0); t.refresh(); }
    this.hearts = Array.from({ length: HEARTS }, (_, i) => this.add.image(8 + i * 32, 5, 'item-heart').setOrigin(0).setDepth(6000));
    // THE WATER TANK: a glass tube with brass caps (a 3D model drawn from the front, assets/items/CREDITS.md) - the caps kept, the glass
    // between them one clean column stretched as the tank grows; the water drawn under the glass each frame (drawTank): it ripples, sloshes
    // when she swings, bubbles while the rain fills it
    this.tankWater = this.add.graphics().setDepth(6001);
    this.tankGlass = this.add.image(8 + TANK.capL, 36, 'tank-glass').setOrigin(0).setDepth(6002);
    this.tankCapL = this.add.image(8, 36, 'tank-cap-l').setOrigin(0).setDepth(6003); this.tankCapR = this.add.image(0, 36, 'tank-cap-r').setOrigin(0).setDepth(6003);
    this.tankWas = WATER_MAX; this.slosh = 0; this.bubbles = [];
    this.bars = this.add.graphics().setDepth(6000);
    this.scoreText = txt(W - 12, 26, 11, '#ffe6b0').setOrigin(1, 0).setDepth(6000);
    this.bossText = txt(W / 2, 8, 11, '#bfe8ff').setOrigin(0.5, 0).setDepth(6000);
    this.items = [];
    this.best = 0; try { this.best = +localStorage.getItem('rain-girl-best') || 0; } catch (e) {}
    this.waveText = txt(W - 12, 10, 11).setOrigin(1, 0).setDepth(6000);
    this.help = txt(W / 2, H - 8, 11).setOrigin(0.5, 1).setDepth(6000).setText(T('help'));
    this.banner = txt(W / 2, 150, 33, '#fff3d6').setOrigin(0.5).setDepth(7000);
    this.sub = txt(W / 2, 215, 22, '#fff3d6').setOrigin(0.5, 0).setDepth(7000).setLineSpacing(3);
    this.dim = this.add.rectangle(0, 0, W, H, 0x10140c, 0.5).setOrigin(0).setDepth(6900);
    this.boardText = txt(W / 2 - 165, 346, 11, '#ffe6b0').setOrigin(0.5, 0).setDepth(7000).setLineSpacing(3);          // (this month's best ten)
    this.boardText2 = txt(W / 2 + 200, 346, 11, '#ffe6b0').setOrigin(0.5, 0).setDepth(7000).setLineSpacing(3);         // (the best three ever, and who is signed in)
    this.langBtn = txt(W - 14, 12, 22, '#ffe6b0').setOrigin(1, 0).setDepth(7000);          // (on a phone: the language, tapped)
    this.titleScreen(); setLang(LANG);
    // back from the GitHub sign-in: the score that was waiting goes up under their GitHub name
    Ranking.fromSignIn().then(async (pending) => { if (pending) { const r = await Ranking.submit(pending); if (!r.ok) this.say(T('rankFail', { why: r.why })); } this.showBoard(); });
    // sound: the rain all the time, the fire as loud as there is fire on the ground, one music at a time; browsers let sound start
    // only after a key is pressed - the title's music starts with the first one
    this.rainS = this.sound.add('rain_loop', { loop: true, volume: 0.22 }); this.fireS = this.sound.add('fire_loop', { loop: true, volume: 0 });
    const sounds = () => { if (this.rainS.isPlaying) return; this.rainS.play(); this.fireS.play(); if (!this.music) this.playMusic('bgm_title'); };
    this.input.keyboard.once('keydown', sounds); window.addEventListener('touchend', () => (this.sound.locked ? this.sound.once('unlocked', sounds) : sounds()), { once: true, passive: true });
    window.G = this;                             // for tests
    BOOT.up();
  }

  playMusic(key, vol = 0.45, rate = 1) {
    if (this.music && this.music.key === key && this.music.isPlaying && this.music.rate === rate) return;
    if (this.music) this.music.stop(); this.music = this.sound.add(key, { loop: true, volume: vol, rate }); this.music.play();
  }
  // a sound; given where it is (x), from that side - left or right of the middle, not all the way
  sfx(key, vol = 0.6, x = null, det = 80) { if (Array.isArray(key)) key = key[Math.floor(Math.random() * key.length)]; this.sound.play(key, { volume: vol, detune: Phaser.Math.Between(-det, det), pan: x === null ? 0 : Phaser.Math.Clamp((x - W / 2) / (W / 2), -1, 1) * 0.7 }); }
  jingle(key, then) { if (this.music) this.music.stop(); this.music = null; const j = this.sound.add(key, { volume: 0.6 }); j.once('complete', () => then && then()); j.play(); }

  titleScreen() { this.showTitle(T('title'), `${T('chapter')}\n\n${T(this.touch ? 'startT' : 'start')}`); this.showBoard(); }
  // (an end screen's last line says which key plays again: on a phone, a tap)
  showTitle(a, b) { this.shown = [a, b]; this.banner.setText(a); this.sub.setText(this.touch && this.state !== 'title' ? b.replace(/[^\n]*$/, T('tapAgain')) : b); this.dim.setVisible(true); this.boardText.setVisible(true); this.boardText2.setVisible(true); this.retext(false); }
  hideTitle() { this.shown = null; this.banner.setText(''); this.sub.setText(''); this.dim.setVisible(false); this.boardText.setVisible(false); this.boardText2.setVisible(false); this.retext(false); }
  // the words that name a key, for keys or for fingers
  retext(all = true) {
    this.help.setText(T(this.touch ? 'helpT' : 'help')); this.langBtn.setText(this.touch && this.state === 'title' ? T('langT', { name: LANG_NAME[LANG] }) : '');
    if (all && this.shown) { if (this.state === 'title') this.titleScreen(); else this.showTitle(...this.shown); }
  }
  // a finger put down: on the title it starts the game (on the language, the next language); on an end screen it plays again
  tap(x, y) {
    if (this.state === 'play' || this.time.now - this.stateAt < 1500) return;
    if (this.state === 'title') { if (x > W - 300 && y < 60) { setLang(LANGS[(LANGS.indexOf(LANG) + 1) % LANGS.length]); this.titleScreen(); return; } }
    this.fingers.clear(); this.stick = null; this.start();
  }
  // the thumbs in a round: [dx, dy, swing]. The stick begins where the left thumb comes down and gives the eight ways she walks
  // (the ground is drawn 2:1, so a thumb along a tile's edge walks along it); any finger on the right half swings
  thumbs() {
    let dx = 0, dy = 0, swing = false;
    if (this.stick !== null && !this.fingers.has(this.stick)) this.stick = null;
    for (const [id, f] of this.fingers) { if (f.x0 >= W / 2) swing = true; else if (this.stick === null) this.stick = id; }
    const f = this.stick !== null && this.fingers.get(this.stick);
    if (f) {
      const vx = f.x - f.x0, vy = f.y - f.y0, n = Math.hypot(vx, vy);
      if (n > PAD_R) { f.x0 = f.x - vx / n * PAD_R; f.y0 = f.y - vy / n * PAD_R; }          // (the stick comes along with a thumb that goes far)
      if (n > 12) { const a = Math.round(Math.atan2(vy * 2, vx) / (Math.PI / 4)) * Math.PI / 4; dx = Math.round(Math.cos(a)); dy = Math.round(Math.sin(a)); }
    }
    return [dx, dy, swing];
  }
  drawPad() {
    const g = this.padG.clear(), on = this.touch && this.state === 'play'; this.padDrop.setVisible(on); if (!on) return;
    const f = this.stick !== null && this.fingers.get(this.stick), [sx, sy] = f ? [f.x0, f.y0] : PAD_A;
    g.lineStyle(3, 0xfff3d6, f ? 0.5 : 0.22).strokeCircle(sx, sy, PAD_R); g.fillStyle(0xfff3d6, f ? 0.5 : 0.18).fillCircle(f ? f.x : sx, f ? f.y : sy, 20);
    const down = [...this.fingers.values()].some((q) => q.x0 >= W / 2);
    g.fillStyle(0x8fd0ff, down ? 0.42 : 0.2).fillCircle(PAD_B[0], PAD_B[1], 46); g.lineStyle(3, 0xbfe8ff, down ? 0.75 : 0.4).strokeCircle(PAD_B[0], PAD_B[1], 46);
  }

  // THE LEADERBOARD (ranking.js): the best ten under the title; at the end of a game, a name asked for and the score sent
  async showBoard() {          // this month's best ten, the best three ever (a GitHub player marked @)
    const { month, ever } = await Ranking.boards(), on = Ranking.online();
    const row = (e, i) => `${String(i + 1).padStart(2, ' ')}. ${((e.github ? '@' : '') + e.name).slice(0, 13).padEnd(13, ' ')} ${String(e.score).padStart(6, ' ')}  ${e.won ? T('clear') : `R${e.round}`}`;
    this.boardText.setText([on ? T('boardMonth', { month: monthName() }) : T('boardLocal'), ...(month.length ? month.map(row) : [T('noScores')])].join('\n'));
    const me = Ranking.who();
    this.boardText2.setText([on ? T('boardEver') : T('boardEverLocal'), ...(ever.length ? ever.map(row) : [T('none')]), '', on ? (me ? T('signedIn', { me }) : Ranking.canSignIn() ? T('signInHint') : '') : '', '', this.touch ? '' : T('lang') + ' (' + LANG_NAME[LANG] + ')'].join('\n'));
  }
  askName(entry) {          // at the end: up under their GitHub name (signed in, or signing in now) or a guest's name - or not at all
    const box = document.getElementById('namebox'), form = box.querySelector('form'), input = box.querySelector('input'), skip = box.querySelector('#skip');
    const gh = document.getElementById('gh'), me = document.getElementById('nb-me'), asme = document.getElementById('asme'), out = document.getElementById('out'), m = document.getElementById('nb-msg');
    const kb = this.input.keyboard; kb.enabled = false; kb.clearCaptures(); kb.resetKeys();          // (no key kept from the box: the letters and Enter are its)
    try { input.value = localStorage.getItem('rain-girl-name') || ''; } catch (e) {}
    document.getElementById('nb-score').textContent = T('nbScore', { score: entry.score, how: entry.won ? T('nbClear') : T('nbRound', { n: entry.round }) });
    for (const [id, k] of [['gh', 'gh'], ['out', 'out'], ['skip', 'skip']]) document.getElementById(id).textContent = T(k); form.querySelector('button:not([type])').textContent = T('send'); m.textContent = '';
    const who = Ranking.who(), on = Ranking.online();
    document.getElementById('nb-guest').textContent = on ? (Ranking.canSignIn() || who ? T('nbGuest') : T('nbName')) : T('nbLocal');          // (no sign-in to choose - inside another site's frame: just her name)
    document.getElementById('nb-gh').style.display = on && !who && Ranking.canSignIn() ? 'block' : 'none'; me.style.display = on && who ? 'block' : 'none'; asme.textContent = T('asMe', { who });
    box.style.display = 'flex'; setTimeout(() => input.focus(), 50);
    const close = () => { form.onsubmit = null; skip.onclick = null; gh.onclick = null; asme.onclick = null; out.onclick = null; box.style.display = 'none';
      kb.enabled = true; kb.addCapture('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,R,ENTER'); kb.resetKeys(); this.showBoard(); };
    const send = async (name, signed) => {
      const r = await Ranking.submit({ ...entry, name }); if (!r.ok) { m.textContent = T('sendFail', { why: r.why }); if (signed) return; }
      close();
    };
    form.onsubmit = (ev) => { ev.preventDefault(); try { localStorage.setItem('rain-girl-name', input.value.trim()); } catch (e) {} if (who) Ranking.signOut(); send(input.value, false); };
    skip.onclick = () => close();
    gh.onclick = () => Ranking.signIn(entry);          // (off to GitHub; the score goes up on the way back)
    asme.onclick = () => send(who, true);
    out.onclick = () => { Ranking.signOut(); close(); };
  }
  endGame(won) {
    const rounds = this.wave + (won ? 0 : 1), ground = Math.floor(W * (H - TOP) / (DW * DH / 2));
    const entry = { score: this.total, round: Math.min(WAVES.length, rounds), stars: this.starsTotal || 0, burnt: Math.round(100 * (this.burntSum || 0) / Math.max(1, ground * Math.max(1, rounds))), won };
    this.time.delayedCall(1300, () => this.askName(entry));
  }

  start() {
    this.stopT = 0;
    for (const m of this.monsters) this.dropMonster(m);
    for (const s of this.shots) s.obj.destroy();
    this.monsters = []; this.shots = []; this.clearGhosts();
    for (const f of this.fire.values()) { f.spr.destroy(); f.gnd.destroy(); } this.fire.clear();
    for (const a of this.ash.values()) a.destroy(); this.ash.clear(); this.burnClear(); for (const sc of this.scorches || []) sc.destroy(); this.scorches = [];
    this.clearPuddles();
    for (const tr of this.trees) { for (const fl of tr.flames || []) fl.destroy(); tr.flames = null; if (tr.glowG) { tr.glowG.destroy(); tr.glowG = null; } tr.state = tr.kind === 'tree-burnt' ? 'burnt' : 'green'; tr.burnT = 0; tr.saveT = 0; tr.img.clearTint(); this.setProp(tr.img, `${tr.kind}-${tr.v}`); tr.shadow.destroy(); tr.shadow = this.shadowOf(`${tr.kind}-${tr.v}`, tr.x, tr.y); }
    Object.assign(this.girl, { x: W / 2, y: H / 2 + 50, facing: 'south', show: 'south-east', attack: null, hearts: HEARTS, water: WATER_MAX, waterMax: WATER_MAX, hurtT: 0, push: [0, 0] });
    for (const it of this.items) it.spr.destroy(); this.items = []; this.total = 0; this.starsTotal = 0; this.burntSum = 0;
    this.swingAsked = false;
    this.state = 'play'; this.wave = -1; this.toSpawn = 0; this.waiting = false; this.hideTitle(); this.playMusic('bgm_stage'); this.nextWave();
  }

  nextWave() {
    this.wave++;
    if (this.wave >= WAVES.length) { this.state = 'clear'; this.jingle('jingle_win', () => this.playMusic('bgm_title')); /* (won: bright, then the lullaby as it is) */ this.showTitle(T('winTitle'), T('winSub', { score: this.total, best: this.saveBest() })); this.endGame(true); return; }
    this.wind = WINDS[Phaser.Math.Between(0, 3)];          // (a new wind each round)
    this.flash(T('roundFlash', { n: this.wave + 1, of: WAVES.length, arrow: `${this.wind > 0 ? '→' : '←'}${Math.abs(this.wind) > 0.8 ? (this.wind > 0 ? '→' : '←') : ''}` }));
    this.round = { t0: this.time.now, hits: 0, burnt: 0, kills: 0 }; this.clearGhosts();
    this.clearPuddles(); const n = Phaser.Math.Between(...PUDDLES); for (let i = 0; i < n; i++) this.makePuddle();
    if (WAVES[this.wave].some((m) => m.boss)) { this.sfx('jingle_boss_in', 0.6); this.time.delayedCall(1400, () => this.state === 'play' && this.playMusic('bgm_boss', 0.5)); }
    else this.playMusic('bgm_stage');
    this.toSpawn = WAVES[this.wave].length;
    WAVES[this.wave].forEach((m, i) => this.time.delayedCall(400 + i * 450, () => { this.toSpawn--; if (this.state === 'play') this.spawn(m); }));
  }

  say(t) {          // a few words over her head
    const x = ptext(this, R(this.girl.x), R(this.girl.y - 112), t, 11, '#bfe8ff').setOrigin(0.5).setDepth(7000);
    this.tweens.add({ targets: x, y: x.y - 10, alpha: 0, delay: 500, duration: 400, ease: 'Stepped', easeParams: [4], onComplete: () => x.destroy() });
  }

  flash(t) {
    const x = ptext(this, W / 2, 90, t, 22, '#ffe6b0').setOrigin(0.5).setDepth(7000);
    this.tweens.add({ targets: x, y: 70, alpha: 0, delay: 700, duration: 600, ease: 'Stepped', easeParams: [6], onComplete: () => x.destroy() });
  }

  spawn(def) {
    // from an edge, away from the girl
    let x, y;
    do { const e = Phaser.Math.Between(0, 3); x = e === 0 ? 40 : e === 1 ? W - 40 : Phaser.Math.Between(60, W - 60); y = e === 2 ? TOP + 30 : e === 3 ? H - 30 : Phaser.Math.Between(TOP + 40, H - 40); }
    while (Phaser.Math.Distance.Between(x, y, this.girl.x, this.girl.y) < 260);
    const K = KINDS[def.kind], big = !!def.boss, sfx = def.kind === 'red' ? '' : '-' + def.kind;
    const m = { x, y, hp: def.hp, maxHp: def.hp, big, sfx, kind: def.kind, K, hitBy: -1, hurtT: 0, shootT: Phaser.Math.Between(1800, 3500), wobble: Math.random() * 10, kb: [0, 0], dead: false,
                hopT: Math.random(), face: 'normal', faceT: 0, fadeT: 0, flashT: 0, pulse: 0, flip: false };
    m.shadow = this.add.image(x, y, 'shadow-fire');
    m.light = [];          // (its light on the ground: drawDark, soft and in its own colour)
    m.glow = this.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(K.glow).setAlpha(0.4);
    m.spr = this.add.image(x, y, 'fire-normal' + sfx, 0).setOrigin(0.5, 0.97).setAlpha(0);
    m.over = this.add.image(x, y, 'fire-hurt' + sfx, 0).setOrigin(0.5, 0.97).setVisible(false);   // the face it is turning from, shown on alternate frames
    this.tweens.add({ targets: m.spr, alpha: 1, duration: 320, ease: 'Stepped', easeParams: [4] });          // (comes in by steps, not by growing)
    if (big) { m.crown = this.add.image(x, y, 'crown').setOrigin(0.5, 1); this.sfx('cry_boss_0', 0.7, x); this.cameras.main.shake(450, 0.006); }          /* (the boss comes: the ground shakes) */          // (the boss: a crown, and its own bar at the top)
    this.monsters.push(m);
  }

  newDrop(anywhere) {
    return { x: Math.random() * (W + 300) - 150, y: anywhere ? Math.random() * H : -15, v: 420 + Math.random() * 220, l: 6 + Math.floor(Math.random() * 6), gy: TOP - 40 + Math.random() * (H - TOP + 40) };          // (gy: where it lands)
  }

  update(time, dtMs) {
    // HIT-STOP: the world holds still a moment when the water strikes (the sound and the screen's shake go on)
    if (this.stopT > 0) { this.stopT -= dtMs / 1000; this.time.timeScale = 0; this.tweens.timeScale = 0; return; }
    const n = window.SPEEDUP || 1; this.time.timeScale = n; this.tweens.timeScale = n;
    for (let i = 0; i < n; i++) this.step(time + i * Math.min(dtMs, 50), dtMs);
  }

  step(time, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000, k = this.keys;
    if (this.state !== this.wasState) { this.wasState = this.state; this.stateAt = this.time.now; this.retext(false); }
    this.drawPad();
    if (this.state !== 'play') {
      if (this.state === 'title' && Phaser.Input.Keyboard.JustDown(k.L)) { setLang(LANGS[(LANGS.indexOf(LANG) + 1) % LANGS.length]); this.titleScreen(); }          // (the language, round the six)
      if ((this.state === 'title' && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) ||
          (this.state !== 'title' && Phaser.Input.Keyboard.JustDown(k.R))) this.start();
      this.updateProps(dt); this.drawGirl(); this.drawRain(dt); this.drawUi();
      return;
    }
    const g = this.girl;
    g.hurtT = Math.max(0, g.hurtT - dt);

    // the swing
    if (g.attack) {
      const a = g.attack, M = MOVES[a.move]; a.t += dt;
      const fr = Math.floor(a.t * M.fps);
      if (fr >= M.hit[0] && fr <= M.hit[1]) this.waterHits(a);
      // THE FINISHER'S OWN SHOW: a water ring swept round her as she turns, and a ring along the ground from her feet - both drawn twice
      // their size, as wide as the backhand reaches (PVFX Foundry, CC0)
      if (a.move === 'backhand' && fr >= 3 && !a.shown) { a.shown = true; this.fx('spin', g.x, g.y - 26, 0, g.y + 2, a.show.endsWith('west'), 2, g.y - 2); this.fx('ring', g.x, g.y, 0, -498, false, 2); const rx = g.x, ry = g.y; this.time.delayedCall(100, () => this.fx('ripple', rx, ry, 2, -498, false, 2)); }          // (the water's ripple 100 ms after the ring, from its 3rd cell: SpriteCast's water-swing set)
      if (this.swingAsked && M.next && fr >= 1) a.chain = true;          // (pressed again during the cut: the backhand follows it)
      if (fr >= M.frames) {
        g.attack = null;
        if (a.chain && g.water >= SWING_COST) this.swing(M.next, time + 1);
      }
    } else if (this.swingAsked) {
      if (g.water >= SWING_COST) this.swing('downward', time);
      else if (!this.dryT || time - this.dryT > 900) { this.dryT = time; this.puff(g.x + 10, g.y - 50, 2); this.say(T('noWater')); this.sfx('error_0', 0.4); }          // (the tank is empty: a puff of nothing)
    }
    if (!g.attack) g.water = Math.min(g.waterMax, g.water + WATER_REGEN * dt * (this.wetAt(g.x, g.y) ? PUDDLE_FILL : 1));          // (the rain fills it again; a puddle three times as fast)
    this.updatePuddles(dt);
    this.swingAsked = false;

    // walking (not while swinging)
    let dx = (k.D.isDown || k.RIGHT.isDown) - (k.A.isDown || k.LEFT.isDown);
    let dy = (k.S.isDown || k.DOWN.isDown) - (k.W.isDown || k.UP.isDown);
    if (this.touch) { const th = this.thumbs(); if (th[0] || th[1]) { dx = th[0]; dy = th[1]; } if (th[2]) this.swingAsked = true; }
    if (window.BOT) { const b = window.BOT(this); dx = b[0]; dy = b[1]; if (b[2]) this.swingAsked = true; }          // (tests: a bot plays)
    g.moving = false;
    if (!g.attack && (dx || dy)) {
      const n = Math.hypot(dx, dy); dx /= n; dy /= n;
      g.facing = facingOf(dx, dy); g.show = diagOf(dx, dy, g.show); g.moving = true;
      this.moveGirl(dx * SPEED * dt, dy * 0.5 * SPEED * dt); g.walkT += dt;          // (a diagonal goes along the ground's 2:1, as she is drawn walking)
    }
    this.moveGirl(g.push[0] * dt, g.push[1] * dt); g.push[0] *= Math.pow(0.002, dt); g.push[1] *= Math.pow(0.002, dt);
    this.keepOut(g);
    // a fire caught under her: hurt, and thrown to the nearest square that is not burning
    if (this.burning(g.x, g.y)) {
      const c = this.clearNear(g.x, g.y);
      if (g.hurtT <= 0) this.hurt(0, 0);
      this.tweens.add({ targets: g, x: c[0], y: c[1], duration: 160, ease: 'Quad.Out' }); g.push = [0, 0];          // (thrown clear, over the flames)
    }
    this.updateFire(dt);

    this.updateMonsters(dt);
    this.updateShots(dt);
    this.updateGhosts(dt);

    if (this.monsters.length === 0 && this.toSpawn === 0 && !this.waiting) {
      this.waiting = true; this.roundDone(); for (const gh of this.ghosts) this.scatterGhost(gh, true);
      this.time.delayedCall(2600, () => { this.waiting = false; if (this.state === 'play') this.nextWave(); });
    }
    this.updateItems(dt); this.updateProps(dt); this.burnRedraw(); this.grassFeet();
    this.drawGirl(); this.reflections(); this.drawRain(dt); this.drawUi();
  }

  // A ROUND'S SCORE: the monsters put out, the time, the hits she took - and how little of the forest burned (the squares that caught
  // this round, against the ground she can walk on). Three stars: no hit, and under 5 % burned, on top of finishing.
  roundDone() {
    if (this.wave < WAVES.length - 1) this.sfx('jingle_clear', 0.55);
    const r = this.round, secs = (this.time.now - r.t0) / 1000, ground = Math.floor(W * (H - TOP) / (DW * DH / 2)), burnt = r.burnt / ground;
    const pts = r.kills * 100 + Math.max(0, Math.round(600 - secs * 10)) + Math.round(Math.max(0, 1 - burnt * 4) * 800) - r.hits * 150;
    const stars = 1 + (r.hits === 0 ? 1 : 0) + (burnt < 0.05 ? 1 : 0); this.total += Math.max(0, pts); this.starsTotal = (this.starsTotal || 0) + stars; this.burntSum = (this.burntSum || 0) + r.burnt;
    const lines = [T('roundDone', { n: this.wave + 1, stars: '★'.repeat(stars) + '☆'.repeat(3 - stars) }), T('roundStats', { s: Math.round(secs), hits: r.hits, burnt: Math.round(burnt * 100) }), `+${Math.max(0, pts)}`];
    const box = ptext(this, W / 2, 150, lines.join('\n'), 22, '#fff3d6', 6).setOrigin(0.5, 0).setDepth(7000);
    this.tweens.add({ targets: box, alpha: 0, delay: 2000, duration: 400, ease: 'Stepped', easeParams: [4], onComplete: () => box.destroy() });
  }
  saveBest() {
    const nb = this.total > this.best; if (nb) { this.best = this.total; try { localStorage.setItem('rain-girl-best', String(this.best)); } catch (e) {} }
    return nb ? T('bestNew') : T('best', { best: this.best });
  }

  // A DROP that heals: left now and then by a monster put out (always by the boss); a heart back and the tank a little fuller
  dropItem(x, y, kind = 'drop') {
    const n = kind === 'potion' ? 'potion' : 'heart', D = DROP[n];          // (seen at the game's angle, as everything on the ground; the potion's glass see-through)
    const it = { x, y, kind, age: Math.random() * 3, spr: this.add.image(R(x), R(y), `drop-${n}`).setOrigin(D.foot[0] / D.w, D.foot[1] / D.h).setDepth(y) };
    it.sh = this.add.image(0, 0, `drop-${n}-sh`).setOrigin(0).setDepth(-499); it.sh0 = [x - D.foot[0] + D.sh[0], y - D.foot[1] + D.sh[1]]; it.D = D; it.age0 = it.age;          // (its shadow cast from its 3D model by the props' sun)
    this.items.push(it);
  }
  updateItems(dt) {
    const g = this.girl;
    for (const it of this.items) {
      it.age += dt; const up = 5 + 3.5 * Math.sin(it.age * 2.6);          // (floating: up and down softly, 1.5-8.5 px over the ground, each at its own beat)
      it.spr.setY(R(it.y - up)).setVisible(it.age - it.age0 < 7 || Math.floor(it.age * 8) % 2 === 0);
      const hm = up / (it.D.ppm * Math.cos(Math.PI / 6));          // (floating: its shadow slides along the sun's ray by how high it is, a little fainter)
      it.sh.setPosition(R(it.sh0[0] + it.D.perUp[0] * hm), R(it.sh0[1] + it.D.perUp[1] * hm)).setAlpha(1 - up * 0.03);
      if (wdist(it.x - g.x, it.y - g.y) < 26) {
        if (it.kind === 'potion') { const grow = Math.min(WATER_GROW, WATER_CAP - g.waterMax); g.waterMax += grow; g.water = Math.min(g.waterMax, g.water + 60 + grow); if (grow > 0) this.say(T('tankBigger')); }          // (a potion: the tank bigger, and fuller)
        else { g.hearts = Math.min(HEARTS, g.hearts + 1); g.water = Math.min(g.waterMax, g.water + 40); }          // (a heart: a life back, and some water)
        this.fx(it.kind === 'potion' ? 'potion' : 'heart', it.x, it.y - 8); it.age = 99; this.sfx('coin_0', 0.6); }
      it.sh.setVisible(it.spr.visible);
      if (it.age - it.age0 > 9) { it.spr.destroy(); it.sh.destroy(); }
    }
    this.items = this.items.filter((it) => it.age - it.age0 <= 9);
  }

  // the puddles: a picture each (big, then smaller as it dries: 2, 3, 4, gone); wet = the squares whose middle its picture covers
  wetAt(x, y) { return this.wet.has(this.cell(x, y).join(',')); }
  clearPuddles() { for (const p of this.puddles) { p.spr.destroy(); this.dropRefl(p); } this.wet.clear(); this.puddles = []; }
  wetCells(p) {          // the squares under the puddle's picture now
    const img = this.textures.get(p.spr.texture.key).getSourceImage(), w = img.width, h = img.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.drawImage(img, 0, 0); const a = c.getImageData(0, 0, w, h).data;
    const x0 = p.x - Math.floor(w / 2), y0 = p.y - Math.floor(h / 2), out = [], seen = new Set();
    for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) {          // (every diamond whose middle the picture covers)
      const [u, v] = this.cell(x0 + x, y0 + y), k = u + ',' + v; if (seen.has(k)) continue; seen.add(k);
      const [cx, cy] = this.centre(u, v), px = Math.floor(cx - x0), py = Math.floor(cy - y0);
      if (px >= 0 && py >= 0 && px < w && py < h && a[(py * w + px) * 4 + 3] > 128) out.push(k);
    }
    return out;
  }
  setWet(p) {
    for (const k of p.cells || []) this.wet.delete(k);
    p.cells = this.wetCells(p);
    for (const k of p.cells) {
      this.wet.set(k, p);
      const f = this.fire.get(k); if (f) { f.spr.destroy(); f.gnd.destroy(); this.fire.delete(k); }          // (a fire there goes out - no ash under water)
      const a = this.ash.get(k); if (a) { a.destroy(); this.ash.delete(k); }
    }
  }
  makePuddle() {
    for (let tries = 0; tries < 40; tries++) {
      const x = Phaser.Math.Between(70, W - 70), y = Phaser.Math.Between(TOP + 30, H - 40);
      if ([...this.trees, ...this.rocks].some((t) => Math.hypot(t.x - x, (t.y - y) * 1.5) < (t.solid ? 70 : 50)) || this.puddles.some((p) => Math.hypot(p.x - x, p.y - y) < 120)) continue;
      const p = { x, y, age: 0, stage: -1, spr: this.add.image(x, y, `puddle-${Phaser.Math.Between(0, 1)}`).setDepth(-945).setFlipX(Math.random() < 0.5).setAlpha(0) };
      p.rid = (this.reflN = (this.reflN || 0) + 1);          // (its reflections: drawn into a canvas of its own each frame - reflections())
      this.tweens.add({ targets: p.spr, alpha: 1, duration: 600, ease: 'Stepped', easeParams: [3] });
      this.setWet(p); this.puddles.push(p); return;
    }
  }
  updatePuddles(dt) {
    for (const p of this.puddles) {
      p.age += dt;
      const stage = p.age < PUDDLE_DRY ? -1 : Math.floor((p.age - PUDDLE_DRY) / ((PUDDLE_LIFE - PUDDLE_DRY) / 4));          // (-1: as it came; 0..2: puddle 2, 3, 4; 3: gone)
      if (stage !== p.stage) {
        p.stage = stage;
        if (stage >= 3) { p.spr.destroy(); this.dropRefl(p); for (const k of p.cells) this.wet.delete(k); p.cells = []; p.gone = true; continue; }
        if (stage >= 0) { p.spr.setTexture(`puddle-${2 + stage}`); this.setWet(p); }
      }
    }
    this.puddles = this.puddles.filter((p) => !p.gone);
  }

  // the burning ground
  cell(x, y) { const a = (x - ISO_X) / (DW / 2), b = y / (DH / 2); return [Math.floor((a + b) / 2), Math.floor((b - a) / 2)]; }          // (the diamond a point is in)
  centre(u, v) { return [ISO_X + (u - v) * DW / 2, (u + v + 1) * DH / 2]; }
  tileKey(key, u, v) { return `${key}_${(((u - v) % 4) + 4) % 4}_${(((u + v) % 8) + 8) % 8}`; }
  burning(x, y) { const [c, r] = this.cell(x, y); return this.fire.has(c + ',' + r); }
  blockAt(x, y) { const b = this.block, i = Math.floor(x / b.s), j = Math.floor(y / b.s); return i >= 0 && j >= 0 && i < b.w && j < b.h ? j * b.w + i : -1; }          // (the square's number, or -1)
  solid(x, y) { const k = this.blockAt(x, y); return k >= 0 && this.block.on[k] === 1; }
  // a step, one axis at a time, not into a burning square or a marked one (her feet: a few pixels either side). Only INTO: a step that
  // brings one under her feet that was not there, or more of her feet on them, is stopped; one already at her feet does not hold her
  moveGirl(mx, my) {
    const g = this.girl, feet = (x, y) => [[x - 5, y], [x + 5, y], [x, y - 3], [x, y]].flatMap(([px, py]) =>
      [...(this.burning(px, py) ? ['f' + this.cell(px, py).join(',')] : []), ...(this.solid(px, py) ? ['s' + this.blockAt(px, py)] : [])]);
    const into = (x, y) => { const now = feet(g.x, g.y), then = feet(x, y); return then.length > now.length || then.some((k) => !now.includes(k)); };
    if (mx && !into(g.x + mx, g.y)) g.x += mx;
    if (my && !into(g.x, g.y + my)) g.y += my;
  }
  clearNear(x, y) {
    for (let r = 1; r < 8; r++) for (let a = 0; a < 16; a++) { const px = x + Math.cos(a / 16 * 2 * Math.PI) * r * DW / 2, py = y + Math.sin(a / 16 * 2 * Math.PI) * r * DH / 2;
      if (py > TOP && py < H - 10 && px > 20 && px < W - 20 && !this.burning(px, py) && !this.solid(px, py)) return [px, py]; }
    return [x, y];
  }
  ignite(x, y, rad = 0, kind = 'red') {
    const [c0, r0] = this.cell(x, y);
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      const c = c0 + dc, r = r0 + dr, k = c + ',' + r, [cx, cy] = this.centre(c, r);
      if (rad > 0 && (Math.abs(dc) + Math.abs(dr) > rad + 1 || (Math.abs(dc) + Math.abs(dr) > rad && Math.random() < 0.6) || (Math.max(Math.abs(dc), Math.abs(dr)) === rad && Math.random() < 0.25))) continue;          // (a blob, ragged at its edge - not a square of squares)
      if (this.fire.has(k) || this.ash.has(k) || this.wet.has(k) || this.fire.size >= FIRE_MAX || cy < TOP - 40 || cy > H - 8 || cx < 8 || cx > W - 8) continue;          // (ash does not burn again)
      if (this.trees.some((t) => Math.abs(t.x - cx) < t.r && Math.abs(t.y - cy) < t.r / 2 + 6)) continue;          // (not inside a trunk)
      const v = 0, gnd = { setTexture: () => this.burnDirty(c, r), destroy: () => this.burnDirty(c, r) }; this.burnDirty(c, r);          // (its ground: the burnt layer's, drawn again when it changes)
      // a flame on about half the squares, anywhere in its square, each its own size and its own beat - not one flame stamped on a grid
      const fx = cx + Phaser.Math.Between(-9, 9), fy = cy + Phaser.Math.Between(-3, 5);
      const K = KINDS[kind], spr = this.add.image(fx, fy, flameKey(0, kind, '-s')).setOrigin(0.5, 1).setDepth(fy).setVisible(Math.random() < 0.5);
      if (Math.random() < 0.6) { const a = Math.random() * Math.PI * 2, sc = this.add.image(R(cx + Math.cos(a) * 20), R(cy + Math.sin(a) * 10), 'scorch').setDepth(-960).setAlpha(0.85).setFlipX(Math.random() < 0.5); (this.scorches || (this.scorches = [])).push(sc); }          // (soot past its edge: the burnt patch is not a sharp diamond)
      if (this.round) this.round.burnt++;
      this.fire.set(k, { c, r, age: 0, life: FIRE_LIFE * K.life * (0.8 + Math.random() * 0.4), spr, gnd, v, kind, big: Math.random() < 0.55, fps: 6 + Math.random() * 5, hits: K.hits + (kind === 'blue' && this.monsters.some((m) => m.big) ? 1 : 0), hitBy: -1, ph: Math.floor(Math.random() * 3) });
    }
  }
  toAsh(k, f) { f.spr.destroy(); this.fire.delete(k); f.gnd.setTexture(this.tileKey('ash', f.c, f.r)); this.ash.set(k, f.gnd); }
  douseGround(x, y, id) {          // one hit a swing: a blue fire takes three
    const k = this.cell(x, y).join(','), f = this.fire.get(k); if (!f || f.hitBy === id) return false;
    f.hitBy = id; if (--f.hits > 0) { f.spr.setTintFill(0xffffff); this.time.delayedCall(70, () => f.spr.active && f.spr.clearTint()); return false; }
    this.toAsh(k, f); { const [px, py] = this.centre(f.c, f.r); this.fx('drip', px, py + 6, 0, py); if (Math.random() < 0.4) this.puff(px, py - 4, 1); }
    if (!this.hissT || this.time.now - this.hissT > 250) { this.hissT = this.time.now; this.sfx('hr_steam_0', 0.25, x); } return true;
  }
  // which square a fire spreads to: any of the four beside it, those the wind blows toward up to 2.5 times as likely
  downwind() {
    const N = [[1, 0], [-1, 0], [0, 1], [0, -1]], wt = N.map(([c, r]) => 1 + 1.5 * Math.max(0, Math.sign(c - r) * this.wind));
    let u = Math.random() * wt.reduce((a, b) => a + b); for (let i = 0; i < 4; i++) { u -= wt[i]; if (u <= 0) return N[i]; } return N[0];
  }
  updateFire(dt) {
    this.spreadT += dt; const spread = this.spreadT >= 0.6; if (spread) this.spreadT = 0;
    const born = [];
    for (const [k, f] of this.fire) {
      f.age += dt;
      if (f.age > f.life) { this.toAsh(k, f); continue; }
      const br_ = (Math.floor(f.age * 4) + f.ph) % 3 === 0; if (br_ !== f.br) { f.br = br_; this.burnDirty(f.c, f.r); }          // (the embers flicker: its square drawn again when they do)
      if (Math.random() < dt * 0.5) { const [sx, sy] = this.centre(f.c, f.r); this.smoke(sx, sy - 6, Math.random() < 0.35); }          // (smoke, and steam where the rain falls on it)
      const u = f.age / f.life, sz = u < 0.1 || u > 0.88 ? '-s' : u < 0.25 || u > 0.7 || !f.big ? '-m' : '';          // (it catches small, burns up, dies down to a lick)
      f.spr.setTexture(flameKey((Math.floor(f.age * f.fps) + f.ph) % 3, f.kind, sz)).setFlipX(Math.floor(f.age * f.fps * 0.4 + f.ph) % 2 === 0).setAlpha(WAVER[Math.floor(f.age * 4.5 + f.ph * 1.7) % 4]);
      if (spread && f.age > 2 && f.age < f.life - 3 && Math.random() < lerp(0.07, 0.12, HARD(this.wave)) * KINDS[f.kind].spread) { const [dc, dr] = this.downwind(); born.push([...this.centre(f.c + dc, f.r + dr), f.kind]); }
    }
    for (const [x, y, kd] of born) this.ignite(x, y, 0, kd);
    this.updateTrees(dt, spread);
  }

  // TREES CATCH: a green tree with fire on the ground at its foot may catch (a chance at each spread); it burns ~10 s - flames in its
  // crown, the ground round its trunk catching - and stands burnt after (its burnt picture). Water on its crown puts it out: burnt.
  updateTrees(dt, spread) {
    for (const tr of this.trees) {
      if ((tr.state === 'green' || tr.state === 'half') && spread) {
        let near = false; for (const f of this.fire.values()) { const [fx, fy] = this.centre(f.c, f.r); if (Math.abs(fx - tr.x) < tr.r + 20 && Math.abs(fy - tr.y) < 18) { near = true; break; } }
        if (near && Math.random() < 0.18) this.lightTree(tr);
      } else if (tr.state === 'burning') {
        tr.burnT += dt;
        if (tr.solid && tr.burnT >= TREE_SAVE && !tr.img.texture.key.startsWith('tree-half')) this.setProp(tr.img, `tree-half-${tr.v}`);          // (past saving: half of it gone)
        tr.flames.forEach((fl, i) => fl.setTexture(flameKey((Math.floor(tr.burnT * 8) + i) % 3, 'red')).setFlipX((Math.floor(tr.burnT * 3) + i) % 2 === 0).setAlpha(WAVER[Math.floor(tr.burnT * 4.5 + i * 1.3) % 4]));
        if (spread && Math.random() < (tr.solid ? 0.25 : 0.15)) { const s = tr.solid ? 28 : 14; this.ignite(tr.x + Phaser.Math.Between(-s, s), tr.y + Phaser.Math.Between(-6, 10)); }
        if (tr.burnT > (tr.solid ? 10 : 7)) this.burnOut(tr);
      }
    }
  }
  lightTree(tr) {
    tr.was = tr.state; tr.state = 'burning'; tr.burnT = tr.was === 'half' ? TREE_SAVE : 0; const h = tr.img.height, w = tr.img.width;
    tr.shadow.setAlpha(PROP_SHADOW * 0.35); 
    tr.flames = Array.from({ length: tr.solid ? 9 : 3 }, () => this.add.image(R(tr.x + Phaser.Math.Between(-w * 0.35, w * 0.35)), R(tr.y - h * Phaser.Math.FloatBetween(0.35, 0.9)), 'flame-0')
      .setOrigin(0.5, 1).setScale(1).setDepth(tr.y + 1));
  }
  // put out (or burnt through): within TREE_SAVE seconds it is green again, a moment darker; after that it stands burnt
  burnOut(tr) {
    for (const fl of tr.flames || []) fl.destroy(); tr.flames = null; if (tr.glowG) { tr.glowG.destroy(); tr.glowG = null; }
    const left = tr.solid && tr.burnT < 10 ? (tr.burnT < TREE_SAVE ? 'green' : 'half') : null;          // (put out in time: green; later: half burnt; burnt through: burnt)
    if (left === 'half') { tr.state = 'half'; tr.shadow.destroy(); tr.shadow = this.shadowOf(`tree-half-${tr.v}`, tr.x, tr.y); this.puff(tr.x, tr.y - 90, 4); this.say(T('halfBurnt')); return; }
    if (tr.burnT < TREE_SAVE) {
      tr.state = tr.was === 'half' ? 'half' : 'green'; tr.shadow.setAlpha(PROP_SHADOW); tr.saveT = 1.6;          // (a moment darker: four shades back to its own colour, in updateProps)
      this.puff(tr.x, tr.y - (tr.solid ? 90 : 30), 4); this.say(tr.solid ? T('savedTree') : T('savedBush')); return;
    }
    const k = `${tr.base}-burnt-${tr.v}`; tr.state = 'burnt'; this.setProp(tr.img, k);
    if (this.state === 'play' && Math.random() < (tr.solid ? GHOST.tree : GHOST.bush)) this.time.delayedCall(700, () => this.spawnGhost(tr.x, tr.y - (tr.solid ? 50 : 16)));          // (out of the smoke: a ghost)
    tr.shadow.destroy(); tr.shadow = this.shadowOf(k, tr.x, tr.y); /* (its shadow now the bare tree's) */ this.puff(tr.x, tr.y - (tr.solid ? 90 : 30), 6);
  }

  // THE PROPS ALIVE: the wind (each its own beat), see-through when someone is behind a big one, the fire's light on them, a saved
  // tree's colour coming back, rain rings on the puddles
  updateProps(dt) {
    const t = this.time.now / 1000, all = [...this.trees, ...this.decor], who = [this.girl, ...(this.monsters || []).filter((m) => !m.dead)];
    this.lightT -= dt; const relight = this.lightT <= 0; if (relight) this.lightT = 0.25;
    let hot = null;
    if (relight) {          // (where it burns: the ground on fire, the burning trees, the fire monsters)
      hot = [...this.fire.values()].map((f) => this.centre(f.c, f.r));
      for (const tr of this.trees) if (tr.state === 'burning') hot.push([tr.x, tr.y]);
      for (const m of this.monsters || []) if (!m.dead) hot.push([m.x, m.y]);
      this.hot = hot;
      // the fire's roar: as loud as the fire NEAR her, from the side it is on
      if (this.fireS) { let v = 0, px = 0; for (const [hx, hy] of hot) { const k = Math.max(0, 1 - wdist(hx - this.girl.x, hy - this.girl.y) / 420); v += k; px += k * (hx - this.girl.x); }
        this.fireS.setVolume(Math.min(0.6, v * 0.035)); if (this.fireS.setPan) this.fireS.setPan(v ? Phaser.Math.Clamp(px / v / 300, -0.7, 0.7) : 0); }
    }
    if ((this.darkClock -= dt) <= 0) { this.darkClock = 0.08; this.drawDark(this.hot || []); }          // (the firelight moves smoothly, more often than the rest)
    // lightning: a white flash in two steps, the shadows deep for that moment, the thunder after it (the farther, the later)
    if ((this.boltT -= dt) <= 0) {
      this.boltT = Phaser.Math.Between(...LIGHTNING); const far = Math.random();
      this.flashImg.setAlpha(0.55); this.time.delayedCall(70, () => this.flashImg.setAlpha(0)); this.time.delayedCall(140, () => this.flashImg.setAlpha(0.3)); this.time.delayedCall(220, () => this.flashImg.setAlpha(0));
      for (const tr of this.trees) { tr.shadow.setAlpha(Math.min(1, PROP_SHADOW * 2)); this.time.delayedCall(220, () => tr.shadow.active && tr.shadow.setAlpha(tr.state === 'burning' ? PROP_SHADOW * 0.35 : PROP_SHADOW)); }
      this.time.delayedCall(300 + far * 1400, () => { this.sfx(['thunder_0', 'thunder_1'], 0.75 - far * 0.35); if (far < 0.3) this.cameras.main.shake(260, 0.004); });
    }
    for (const p of all) {
      const key = p.img.texture.key.split('~')[0];
      // the wind: leaning with it; a strong one keeps them bent
      // (the clumps of leaves stir all the time, slowly - a little quicker in a strong wind - each tree at its own point in the beat;
      // the upper clumps lean only as a gust passes: gusts run across the forest the way the wind blows)
      if (CLUMPS[key.replace('bush-burnt', 'bush')] && !key.includes('burnt')) {
        const ph = p.ph ?? p.x * 0.07, wd = Math.sign(this.wind) || 1, ws = Math.abs(this.wind);
        const gust = Math.pow(Math.max(0, Math.sin(t * 0.55 - wd * p.x / 140)), 6);
        let f = key.startsWith('mushrooms') ? 0 : Math.floor(t * (3.2 + 1.6 * ws + 2 * gust) + ph * 5) % BEAT;          // (a mushroom has no beat: it leans in a gust and that is all) if (wd < 0) f = (BEAT - f) % BEAT;
        const lean = Math.max(-2, Math.min(2, Math.round(wd * (0.4 * ws + 1.9 * gust))));
        if (p.img.swayAt !== lean * 100 + f) { p.img.swayAt = lean * 100 + f; this.setProp(p.img, key, lean, f); }
      }
      // behind a tall one (its crown over them): see-through, so nobody is lost behind a tree
      if (p.solid) p.img.setAlpha(who.some((o) => o.y < p.y - 2 && o.y > p.y - p.img.height * 0.8 && Math.abs(o.x - p.x) < p.img.width * 0.42) ? 0.55 : 1);
      if (p.saveT > 0) { p.saveT -= dt; const k = Math.floor((1 - p.saveT / 1.6) * 4) / 4; p.img.setTint(dimmed(Phaser.Display.Color.GetColor(138 + 117 * k, 128 + 127 * k, 112 + 143 * k), p.img.dim)); if (p.saveT <= 0) p.img.setTint(dimmed(0xffffff, p.img.dim)); continue; }
      if (relight) {          // the fire's light: warmer the nearer it is, in four steps
        let d = 1e9; for (const [hx, hy] of hot) { const e = wdist(hx - p.x, hy - p.y); if (e < d) d = e; }
        const lv = d < 45 ? 3 : d < 80 ? 2 : d < 120 ? 1 : 0; p.img.setTint(dimmed([0xffffff, 0xfff0dc, 0xffe0b8, 0xffd096][lv], p.img.dim));
      }
    }
    this.updateRipples(dt);
  }

  // RAIN ON A PUDDLE: where a drop lands on it, a ring spreads - bigger and slower for a bigger drop, now and then a second ring inside
  // the first, fading as it goes; drawn a pixel at a time, flattened 2:1 as the ground is seen, and only on the water (never past its edge)
  ripple(x, y, size) {
    const q = this.puddles.find((p) => this.onPuddle(p, x, y)); if (!q) return false;
    const max = [3, 5, 8][size], life = [0.35, 0.5, 0.7][size];
    this.ripples.push({ x: R(x), y: R(y), t: 0, max, life, q, two: size > 0 && Math.random() < 0.4 }); return true;
  }
  onPuddle(p, x, y) {          // is this point on the puddle's water (its picture's own pixels)?
    if (p.gone || !p.spr.active) return false;
    const key = p.spr.texture.key, m = this.pmask[key] || (this.pmask[key] = (() => { const img = this.textures.get(key).getSourceImage(), cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const c = cv.getContext('2d'); c.drawImage(img, 0, 0); return { w: img.width, h: img.height, a: c.getImageData(0, 0, img.width, img.height).data }; })());
    let px = Math.floor(x - (p.x - m.w / 2)); const py = Math.floor(y - (p.y - m.h / 2)); if (p.spr.flipX) px = m.w - 1 - px;
    return px >= 1 && py >= 1 && px < m.w - 1 && py < m.h - 1 && m.a[(py * m.w + px) * 4 + 3] > 100 && p.spr.alpha > 0.5;
  }
  updateRipples(dt) {
    const g = this.rippleG; g.clear();
    for (const q of this.puddles) if (q.stage < 2 && Math.random() < dt * 6) {          // (drops the rain streaks do not show: more rings)
      const w = q.spr.width / 2, h = q.spr.height / 2; this.ripple(q.x + (Math.random() * 2 - 1) * w, q.y + (Math.random() * 2 - 1) * h, Phaser.Math.Between(0, 2));
    }
    for (const r of this.ripples) {
      r.t += dt; const u = r.t / r.life, fade = 1 - u;
      const ring = (rad, al) => {
        if (rad < 1) { g.fillStyle(0xe4f2ff, al); g.fillRect(r.x, r.y, 1, 1); return; }
        const seen = new Set(), n = Math.max(8, Math.ceil(rad * 7));
        g.fillStyle(0xe4f2ff, al);
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2, X = r.x + Math.round(Math.cos(a) * rad), Y = r.y + Math.round(Math.sin(a) * rad * 0.5), k = X * 4096 + Y;
          if (seen.has(k) || !this.onPuddle(r.q, X, Y)) continue; seen.add(k); g.fillRect(X, Y, 1, 1);
        }
      };
      ring(Math.floor(r.max * Math.min(1, u * 1.15)), 0.75 * fade);          // (grows by whole pixels)
      if (r.two && u > 0.35) ring(Math.floor(r.max * (u - 0.35) * 1.3), 0.55 * fade);
    }
    this.ripples = this.ripples.filter((r) => r.t < r.life);
  }

  // THE DARK, and the firelight in it: each fire lights round it the way a flame does - brightest at it and fading smoothly away
  // (falls off with distance; no edge), a little warm colour on what it lights, flickering by a slow waver of its own, not a jump.
  // Many small fires together light more. Drawn at a quarter size and scaled up whole (light in 4-pixel steps).
  drawDark(hot) {
    const c = this.darkT.getContext(), wc = this.warmT.getContext(), w = W / 4, h = H / 4, t = this.time.now / 1000;
    const burnt = this.round ? Math.min(1, this.fire.size / 120) : 0, a = DARK + DARK_SMOKE * burnt;
    c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, w, h); wc.clearRect(0, 0, w, h);
    c.fillStyle = `rgba(${R(lerp(14, 40, burnt))},${R(lerp(22, 32, burnt))},${R(lerp(44, 30, burnt))},${a})`; c.fillRect(0, 0, w, h);          // (blue-grey rain; browner with smoke)
    c.globalCompositeOperation = 'destination-out'; wc.globalCompositeOperation = 'lighter';
    const lit = (x, y, r, k, warm, seed, sy = 0.55) => {
      const f = 0.9 + 0.07 * Math.sin(t * 9.1 + seed) + 0.05 * Math.sin(t * 15.7 + seed * 2.3);          // (a flame's waver)
      const X = x / 4, Y = y / 4, rr = r * f / 4;
      c.save(); c.translate(X, Y); c.scale(1, sy);          // (on the ground: flattened as the ground is seen; in the air, round)
      const g = c.createRadialGradient(0, 0, 0, 0, 0, rr); g.addColorStop(0, `rgba(0,0,0,${k * f})`); g.addColorStop(0.35, `rgba(0,0,0,${k * f * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(-rr, -rr, rr * 2, rr * 2); c.restore();
      if (!warm) return;
      wc.save(); wc.translate(X, Y); wc.scale(1, sy);
      const q = wc.createRadialGradient(0, 0, 0, 0, 0, rr * 0.8); q.addColorStop(0, `rgba(${warm},${0.16 * f})`); q.addColorStop(0.4, `rgba(${warm},${0.07 * f})`); q.addColorStop(1, `rgba(${warm},0)`);
      wc.fillStyle = q; wc.fillRect(-rr, -rr, rr * 2, rr * 2); wc.restore();
    };
    const GLOW = { red: '255,120,40', green: '120,220,60', purple: '200,90,255', blue: '70,150,255' };
    for (const f of this.fire.values()) { const [x, y] = this.centre(f.c, f.r); lit(x, y, 46, 0.22, GLOW[f.kind], f.c * 3.1 + f.r * 1.7); }
    for (const tr of this.trees) if (tr.state === 'burning') {
      lit(tr.x, tr.y - 10, tr.solid ? 170 : 80, 0.6, GLOW.red, tr.x);          // (on the ground round it)
      (tr.flames || []).forEach((fl, i) => lit(fl.x, fl.y - 8, 60, 0.5, GLOW.red, tr.x + i * 1.7, 0.9));          // (and each flame in its crown, lighting the leaves round it)
    }
    for (const m of this.monsters || []) if (!m.dead) lit(m.x, m.y - 6, m.big ? 120 : 90, 0.5, GLOW[m.kind], m.wobble);
    for (const s of this.shots) if (!s.dead) lit(s.x, s.y, 40, 0.4, GLOW[s.kind], s.x);
    lit(this.girl.x, this.girl.y - 20, 56, 0.3, null, 0);          // (her yellow coat: never lost in the dark)
    this.darkT.refresh(); this.warmT.refresh();
  }

  keepOut(o) { o.x = Phaser.Math.Clamp(o.x, 30, W - 30); o.y = Phaser.Math.Clamp(o.y, TOP, H - 12); }          // (on the screen; the trunks and rocks: the marked squares, in each step)

  // the water: a fan in front of her, from the 3rd to the 6th frame of the swing; one hit per monster per swing
  swing(move, id) {          // a move of the combo begins: the water it costs, the spray's sound
    const g = this.girl; g.water -= SWING_COST; g.attack = { move, t: 0, id, facing: g.facing, show: g.show };
    this.time.delayedCall(move === 'backhand' ? 150 : 110, () => this.sfx(['spray_0', 'spray_1'], 0.55));
  }
  waterHits(a) {
    const g = this.girl, [fx, fy] = vecOf(a.facing), cy = g.y - 20, M = MOVES[a.move] || MOVES.downward, REACH = M.reach;
    const inFan = (x, y) => {          // (in world terms: a pixel up or down counts twice)
      const dx = x - g.x, dy = (y - cy) * 2, d = Math.hypot(dx, dy);
      if (d > REACH + 24) return false;
      return d < 26 || M.half >= Math.PI || Math.acos(Phaser.Math.Clamp((dx * fx + dy * fy) / d, -1, 1)) < M.half;
    };
    for (const m of this.monsters) {
      if (m.dead || m.hitBy === a.id) continue;
      if (inFan(m.x, m.y - 28) || inFan(m.x, m.y - 6)) {
        m.hitBy = a.id; let [kx, ky] = [fx, fy];
        if (M.half >= Math.PI) { const ddx = m.x - g.x, ddy = (m.y - g.y) * 2, dd = Math.hypot(ddx, ddy) || 1; kx = ddx / dd; ky = ddy / dd; }          // (the backhand, all round: thrown away from her)
        this.douse(m, kx, ky / 2);
      }
    }
    for (const gh of this.ghosts) if (!gh.dead && (inFan(gh.x, gh.y - 30) || inFan(gh.x, gh.y - 10))) { this.scatterGhost(gh); if (this.round) this.round.kills++; }
    for (const s of this.shots) if (!s.dead && inFan(s.x, s.y)) { s.dead = true; this.puff(s.x, s.y, 3); s.obj.destroy(); }
    for (const tr of this.trees) if (tr.state === 'burning' && wdist(tr.x - g.x, tr.y - g.y) < REACH + 40 && (inFan(tr.x, tr.y - 10) || inFan(tr.x, tr.y - (tr.solid ? 40 : 20)))) this.burnOut(tr);
    for (const f of [...this.fire.values()]) { const [x, y] = this.centre(f.c, f.r); if (wdist(x - g.x, y - g.y) < REACH && inFan(x, y + 14)) this.douseGround(x, y, a.id); }
  }

  // hit: a white flash for a moment hides the change of face, and the body squashes by whole pixels; it springs back
  // the weight of it: the world stops a moment (longer for the last hit, longest for the boss's), the screen jolts, a wet thump
  // under the hiss, a burst where the water struck and the water flung on the way it was going; thrown hard, stopped quick
  douse(m, fx, fy, soft = false) {          // (soft: a puddle did it, not her swing - no stop, no jolt)
    m.hp--; const out = m.hp <= 0, big = m.big ? 1.6 : 1;
    this.sfx('hr_steam_0', 0.35, m.x); this.sfx(['hit_soft_0', 'hit_soft_1'], 0.35, m.x);
    this.sfx(out ? 'douse_out' : ['hit_wet_0', 'hit_wet_1'], out ? 0.8 : 0.65, m.x, 170);
    if (!soft) { if (!window.BOT) this.stopT = Math.max(this.stopT || 0, out ? (m.big ? 0.25 : 0.11) : (m.big ? 0.08 : 0.06)); this.cameras.main.shake(out ? 140 : 90, (out ? 0.005 : 0.0025) * big); }
    this.splat(m.x - fx * 10, m.y - 30 - fy * 10, out); this.fx('hit', m.x - fx * 6, m.y - 22 - fy * 6);
    if (out) this.fx('out', m.x, m.y - 14, 0, m.y + 1);
    m.hurtT = 0.35; m.kb = [fx * 420 * m.K.kb, fy * 420 * m.K.kb]; m.flashT = 0.09; m.pulse = 0.28;
    this.puff(m.x, m.y - 32, out ? 4 : 6); this.drops(m.x, m.y - 32, fx, fy, out ? 16 : 10);
    if (out) {
      // beaten: steam bursts over the change to the dizzy face, it shakes a moment, then sinks away in steps
      m.dead = true; m.face = 'dead'; m.over.setVisible(false); this.sfx('poof_0', 0.7, m.x);
      this.puff(m.x, m.y - 32, 12);
      this.monsters = this.monsters.filter(o => o !== m);
      if (this.round) this.round.kills++;
      const potion = () => this.girl.waterMax < WATER_CAP && Math.random() < POTION_SHARE;
      if (m.big) this.time.delayedCall(600, () => { this.dropItem(m.x - 14, m.y, 'drop'); if (this.girl.waterMax < WATER_CAP) this.dropItem(m.x + 14, m.y, 'potion'); });          // (the boss: a drop and a potion)
      else if (Math.random() < DROP_CHANCE) this.time.delayedCall(600, () => this.dropItem(m.x, m.y, potion() ? 'potion' : 'drop'));
      if (m.crown) m.crown.destroy();
      m.spr.setTexture('fire-dead' + m.sfx, 0).setScale(1).setY(m.y).setTintFill(0xffffff);
      this.time.delayedCall(80, () => m.spr.clearTint());
      this.tweens.add({ targets: m.spr, x: { from: m.x - 2, to: m.x + 2 }, duration: 70, yoyo: true, repeat: 3, ease: 'Stepped', easeParams: [2] });
      this.tweens.add({ targets: m.glow, alpha: 0, duration: 500, ease: 'Stepped', easeParams: [3] });
      this.tweens.add({ targets: m.spr, delay: 560, scaleY: 0.25, alpha: 0, duration: 380, ease: 'Stepped', easeParams: [4],
                        onStart: () => this.puff(m.x, m.y - 14, 6), onComplete: () => this.dropMonster(m) });
      this.tweens.add({ targets: [m.shadow, ...m.light], delay: 560, alpha: 0, duration: 380, ease: 'Stepped', easeParams: [3] });
    } else {
      m.face = 'hurt'; m.faceT = 0.38; this.sfx(['hurt_cute_0', 'hurt_cute_1'], 0.45);
    }
  }

  // THE SMOKE GHOSTS (GHOST above)
  spawnGhost(x, y) {
    if (this.state !== 'play' || this.ghosts.filter((g_) => !g_.dead).length >= GHOST.max) return;
    const gh = { x, y, age: 0, dead: false, cool: 0, ph: Math.random() * 6, kb: [0, 0], flip: false };
    gh.sh = this.add.image(R(x), R(y), 'shadow-item').setAlpha(0.45).setDepth(-499);
    gh.spr = this.add.sprite(R(x), R(y), 'ghost', 0).setOrigin(0.5, 0.86).setAlpha(0);
    this.tweens.add({ targets: gh.spr, alpha: 1, duration: 500, ease: 'Stepped', easeParams: [4] }); this.puff(x, y - 30, 5); this.sfx('poof_0', 0.35, x);
    this.ghosts.push(gh);
  }
  updateGhosts(dt) {
    const g = this.girl;
    for (const gh of this.ghosts) {
      if (gh.dead) continue;
      gh.age += dt; gh.cool = Math.max(0, gh.cool - dt);
      if (gh.age > GHOST.life) { this.scatterGhost(gh, true); continue; }
      const dx = g.x - gh.x, dy = (g.y - gh.y) * 2, d = Math.hypot(dx, dy) || 1, sp = GHOST.speed * (gh.cool > 0 ? -0.6 : 1);          // (after a touch: it drifts back)
      gh.x += (dx / d * sp + Math.sin(gh.age * 1.3 + gh.ph) * 14 + gh.kb[0]) * dt; gh.y += (dy / d * sp * 0.5 + Math.cos(gh.age * 1.1 + gh.ph) * 6 + gh.kb[1]) * dt;          // (through the trees: no square stops it)
      gh.kb[0] *= Math.pow(0.01, dt); gh.kb[1] *= Math.pow(0.01, dt); this.keepOut(gh);
      if (Math.abs(dx) > 8) gh.flip = dx > 0;          // (drawn facing left: turned to her)
      const bob = Math.sin(gh.age * 2.2 + gh.ph) * 3, fr = Math.floor((gh.age + gh.ph) * GHOST.fps) % 8;
      gh.spr.setFrame(fr).setPosition(R(gh.x), R(gh.y - 8 + bob)).setFlipX(gh.flip).setDepth(gh.y);
      gh.sh.setPosition(R(gh.x), R(gh.y)).setDepth(-499);
      if (d < 34 && gh.cool <= 0 && g.hurtT <= 0) {          // a touch: cold - it takes water, not a heart
        gh.cool = 1.6; g.water = Math.max(0, g.water - GHOST.drain); this.say(T('ghostChill')); this.sfx('error_0', 0.35, gh.x); this.puff(g.x, g.y - 40, 4);
        g.push = [-dx / d * 120, -dy / d * 60]; gh.kb = [-dx / d * 160, -dy / d * 80];
      }
    }
    this.ghosts = this.ghosts.filter((gh) => !gh.gone);
  }
  scatterGhost(gh, quiet = false) {          // (her water, or the round's end, or its own time up)
    if (gh.dead) return; gh.dead = true;
    if (!quiet) { this.sfx('poof_0', 0.55, gh.x); this.sfx(['hit_soft_0', 'hit_soft_1'], 0.35, gh.x); this.drops(gh.x, gh.y - 30, 0, 0, 8); }
    this.puff(gh.x, gh.y - 30, quiet ? 4 : 9);
    this.tweens.add({ targets: [gh.spr, gh.sh], alpha: 0, y: '-=10', duration: quiet ? 600 : 360, ease: 'Stepped', easeParams: [4], onComplete: () => { gh.spr.destroy(); gh.sh.destroy(); gh.gone = true; } });
  }
  clearGhosts() { for (const gh of this.ghosts || []) { gh.spr.destroy(); gh.sh.destroy(); } this.ghosts = []; }

  dropMonster(m) { for (const o of [m.spr, m.over, m.glow, m.shadow, m.crown, ...(m.light || [])]) if (o) o.destroy(); }

  // SMOKE drifting off with the wind (or white steam: the rain on the fire), and now and then a spark going up
  smoke(x, y, steam) {
    const c = this.add.image(R(x + Phaser.Math.Between(-6, 6)), R(y), steam ? 'steam' : Math.random() < 0.5 ? 'smoke' : 'smoke-big').setAlpha(steam ? 0.45 : 0.55).setDepth(4400);
    const up = Phaser.Math.Between(40, 90);
    this.tweens.add({ targets: c, y: c.y - up, x: c.x + this.wind * up * 1.1, alpha: 0, scale: steam ? 1.5 : 2, duration: Phaser.Math.Between(1300, 2200), ease: 'Stepped', easeParams: [6], onComplete: () => c.destroy() });
    if (Math.random() < 0.3) {
      const e = this.add.rectangle(R(x), R(y), 1, 1, Math.random() < 0.5 ? 0xffd25a : 0xff8a2e).setDepth(4600);
      this.tweens.add({ targets: e, y: e.y - Phaser.Math.Between(30, 60), x: e.x + this.wind * 40 + Phaser.Math.Between(-8, 8), alpha: 0, duration: 900, ease: 'Stepped', easeParams: [8], onComplete: () => e.destroy() });
    }
  }

  // steam: hard pixel puffs that grow by whole steps (1x, 2x) and go, never a soft circle
  puff(x, y, n) {
    for (let i = 0; i < n; i++) {
      const c = this.add.image(R(x + Phaser.Math.Between(-14, 14)), R(y + Phaser.Math.Between(-10, 10)), 'steam').setAlpha(0.85).setDepth(4000);
      this.tweens.add({ targets: c, y: c.y - Phaser.Math.Between(22, 50), x: c.x + Phaser.Math.Between(-14, 14), alpha: 0, scale: 2, duration: Phaser.Math.Between(500, 850),
                        ease: 'Stepped', easeParams: [5], onComplete: () => c.destroy() });
    }
  }

  // the water flung off a hit: most of it on the way the swing went (a fan), a few drops anywhere; they arc down
  drops(x, y, fx = 0, fy = 0, n = 10) {
    const aim = Math.atan2(fy, fx), dir = fx || fy;
    for (let i = 0; i < n; i++) {
      const c = this.add.image(R(x), R(y), 'drop').setDepth(4001);
      const any = !dir || i % 4 === 3, a = any ? Math.random() * Math.PI * 2 : aim + (Math.random() - 0.5) * 1.6, d = any ? Phaser.Math.Between(14, 34) : Phaser.Math.Between(26, 64);
      this.tweens.add({ targets: c, x: x + Math.cos(a) * d, duration: 420, ease: 'Quad.Out', onComplete: () => c.destroy() });
      this.tweens.add({ targets: c, y: { from: y, to: y + Math.sin(a) * d * 0.6 + 24 }, alpha: { from: 1, to: 0.2 }, duration: 420, ease: 'Back.In' });
    }
  }

  // the burst where the water struck: two steps, whole pixels (1x, then 2x), then gone
  // AN EFFECT from PVFX Foundry (CC0): played once where it happens, on its own pivot, at its own pace, then gone. `from`: the frame to
  // start at (a fireball's impact sheet flies in first - here only its burst)
  fx(k, x, y, from = 0, depth = 4003, flip = false, scale = 1, back = null) {          // (flip: drawn going right - mirrored for a blow to the left; scale: whole times, so it stays pixel art)
    // back: a RING round her is cut at its middle line - the far half drawn at `back` (behind her), the near half at `depth` (in front):
    // drawn whole in front of her, the ring went through her body
    const e = FX[k]; if (!e) return;
    const make = (d) => this.add.sprite(R(x), R(y), `fx-${k}`, from).setOrigin(e.px / e.w, e.py / e.h).setDepth(d).setFlipX(flip).setScale(scale);
    const ss = back === null ? [make(depth)] : [make(back).setCrop(0, 0, e.w, e.py), make(depth).setCrop(0, e.py, e.w, e.h - e.py)]; let f = from;
    const tick = this.time.addEvent({ delay: e.ms, repeat: e.n - from - 1, callback: () => { f++; if (f >= e.n) { ss.forEach((s) => s.destroy()); tick.remove(); } else ss.forEach((s) => s.setFrame(f)); } });
  }
  splat(x, y, big) {
    const c = this.add.image(R(x), R(y), 'splat').setDepth(4002).setScale(big ? 2 : 1);
    this.time.delayedCall(50, () => c.setScale(big ? 3 : 2).setAlpha(0.7));
    this.time.delayedCall(110, () => c.destroy());
  }

  updateMonsters(dt) {
    const g = this.girl;
    for (const m of this.monsters) {
      m.hurtT = Math.max(0, m.hurtT - dt); m.wobble += dt;
      const dx = g.x - m.x, dy = g.y - m.y, d = wdist(dx, dy) || 1;          // (world terms: they come at her along the ground)
      // it hops: moves only while in the air, squashes when it lands
      const P = m.K.hop * (m.big ? 1.2 : 1); m.hopT += dt * (m.hurtT > 0 ? 0.4 : 1);
      const ph = (m.hopT % P) / P, air = ph < 0.62;
      if (m.wasAir && !air && Math.random() < (m.big ? 0.9 : lerp(0.3, 0.55, HARD(this.wave)))) this.ignite(m.x, m.y - 2, m.big ? 1 : 0, m.kind);          // (landing: the grass catches)
      // landing in a puddle: it hisses and loses one of its lives (a small fire is out in two or three landings), and boils some of
      // the puddle away - so a puddle is a trap to lead them through, and one that does not last
      if (m.wasAir && !air && this.wetAt(m.x, m.y)) {
        const q = this.puddles.find((p) => Math.hypot(p.x - m.x, (p.y - m.y) * 2) < 90); if (q) q.age += PUDDLE_BOIL;
        this.splashes.push({ x: R(m.x), y: R(m.y), t: 0 }); this.douse(m, 0, 0, true);
        if (m.dead) continue;
      }
      m.wasAir = air;
      const sp = m.K.speed * (m.big ? 0.85 : 1) * (m.hurtT > 0 ? 0.2 : 1) * (air ? 1.6 : 0);
      // a step, one axis at a time, not onto a marked square (one it already stands on does not hold it); stopped across, it goes round
      const mx = dx / d * sp * dt + Math.sin(m.wobble * 2.3) * 10 * dt * (air ? 1 : 0) + m.kb[0] * dt;
      const my = dy / d * sp * dt + Math.cos(m.wobble * 1.7) * 9 * dt * (air ? 1 : 0) + m.kb[1] * dt;
      const ok = (x, y) => !this.solid(x, y) || this.solid(m.x, m.y);
      m.side = m.side || (Math.random() < 0.5 ? -1 : 1);          // (which way it goes round, kept for a while so it does not dither)
      if (ok(m.x + mx, m.y)) m.x += mx; else if (ok(m.x, m.y + m.side * Math.abs(mx) * 0.6)) m.y += m.side * Math.abs(mx) * 0.6; else m.side = -m.side;
      if (ok(m.x, m.y + my)) m.y += my; else if (ok(m.x + m.side * Math.abs(my) * 2, m.y)) m.x += m.side * Math.abs(my) * 2; else m.side = -m.side;
      const a = air ? Math.sin(Math.PI * ph / 0.62) : 0, q = air ? 0 : Math.sin(Math.PI * (ph - 0.62) / 0.38);
      m.hop = R(a * (m.big ? 16 : 22));
      m.kb[0] *= Math.pow(0.0005, dt); m.kb[1] *= Math.pow(0.0005, dt);          // (thrown hard, stopped quick - about as far as before)
      this.keepOut(m);
      // a fireball now and then
      m.shootT -= dt * 1000;
      if (m.shootT <= 0) { const u = lerp(1.45, 0.95, HARD(this.wave)); m.shootT = Phaser.Math.Between(m.K.shoot[0] * u, m.K.shoot[1] * u); if (d < 420) this.shoot(m); }          // (slower in the first rounds)
      // touching her
      if (d < 40 && g.hurtT <= 0) this.hurt(dx / d, dy / d);
      // the face: hurt for a moment, then back to angry - the old face shown on every other frame for a moment (pixel art has no half-see-through)
      if (m.face === 'hurt' && (m.faceT -= dt) <= 0) { m.face = 'normal'; m.fadeT = 0.14; }
      m.fadeT = Math.max(0, m.fadeT - dt); m.flashT = Math.max(0, m.flashT - dt);
      // squash and stretch by WHOLE PIXELS: a few rows taken off or put on the art's height, a few columns on its width
      const [tw, th] = FIRE_FRAME[m.face], fi = Math.floor(this.time.now / 1000 * 9 + m.wobble * 3) % 8;          // (its frame: the see-through waver)
      let dh = R(3 * a - 6 * q), dw = R(-2 * a + 5 * q);
      if (m.pulse > 0) { const u = m.pulse / 0.28, wv = Math.cos((1 - u) * 9) * u; dh -= R(8 * wv); dw += R(8 * wv); m.pulse -= dt; }
      if (Math.abs(dx) > 12) m.flip = dx < 0;
      const X = R(m.x), Y = R(m.y - m.hop), sx = (tw + dw) / tw, sy = (th + dh) / th;
      const showOld = m.fadeT > 0 && Math.floor(m.fadeT * 40) % 2 === 0;
      m.spr.setTexture(showOld ? `fire-hurt${m.sfx}` : `fire-${m.face}${m.sfx}`, fi).setPosition(X, Y).setScale(sx, sy).setFlipX(m.flip).setDepth(m.y);
      if (m.flashT > 0) m.spr.setTintFill(0xffffff); else m.spr.clearTint();
      // the glow flickers by steps
      const fl = [1, 1, 0.9, 1.1][Math.floor(m.wobble * 12) % 4];
      m.glow.setPosition(X, R(Y - th * 0.42)).setScale(m.big ? 1.2 : 1).setDepth(m.y - 0.5);
      if (m.crown) m.crown.setPosition(X + (m.flip ? 2 : -2), R(Y - th * sy * 0.62)).setDepth(m.y + 1);          // (sat on the top of the flame)
      m.shadow.setPosition(X, R(m.y)).setDepth(m.y - 1).setScale((m.hop > 12 ? 0.75 : 1) * tw / 42);          // (as wide as the fire over it; smaller while it is in the air)
      for (const l of m.light) l.setPosition(X, R(m.y - 4)).setAlpha(fl > 1 ? 1 : 0.85);
    }
  }

  shoot(m) {
    const g = this.girl, sx = m.x, sy = m.y - (m.hop || 0) - 36;
    const dx = g.x - sx, dy = (g.y - 34) - sy, d = Math.hypot(dx, dy) || 1, v = 170, n = m.K.shots; this.sfx('shot_fire_0', 0.3, sx);
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.32;          // (three: a fan)
      const F_ = FX.fireflight, obj = this.add.sprite(R(sx), R(sy), 'fx-fireflight' + m.sfx, 0).setOrigin(F_.px / F_.w, F_.py / F_.h).setRotation(a).setDepth(3000);          // (PVFX Foundry's fireball, turned the way it flies)
      this.shots.push({ x: sx, y: sy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: Math.min(3.2, (d + 30) / v), obj, dead: false, kind: m.kind, t: 0 });
    }          // (it falls a little past where she was aimed at: and sets fire there)
  }

  updateShots(dt) {
    const g = this.girl;
    for (const s of this.shots) {
      if (s.dead) continue;
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      // it flies ~35 px off the ground: drawn in front of what stands behind its spot on the ground, behind what stands in front
      const gy = s.y + SHOT_UP;
      s.t += dt; s.obj.setPosition(R(s.x), R(s.y)).setFrame(Math.floor(s.t * 1000 / FX.fireflight.ms) % FX.fireflight.n).setDepth(gy + 0.5).setAlpha(WAVER[Math.floor(s.t * 6) % 4]);          // (its flight's own frames)
      // COVER: whatever of a prop stands at the fireball's height (its 3D model, cut there: a trunk, a rock, a bush - not a crown,
      // not a mushroom) stops it - sparks; a green or half-burnt tree or bush it strikes may catch
      const wall = this.struck(s.x, gy);
      if (wall) {
        s.dead = true; s.obj.destroy(); this.sparks(s.x, s.y); this.fx('spark', s.x, s.y + 20, 3, gy + 1); this.sfx(['hit_soft_0', 'hit_soft_1'], 0.3, s.x);
        if ((wall.state === 'green' || wall.state === 'half') && Math.random() < 0.35) this.lightTree(wall);
        continue;
      }
      if (Math.random() < 0.5) { const e = this.add.rectangle(R(s.x), R(s.y), 2, 2, 0xffb22e).setDepth(gy); this.tweens.add({ targets: e, alpha: 0, duration: 300, ease: 'Stepped', easeParams: [3], onComplete: () => e.destroy() }); }
      if (Phaser.Math.Distance.Between(s.x, s.y, g.x, g.y - 34) < 22 && g.hurtT <= 0) { s.dead = true; s.obj.destroy(); this.hurt(s.vx / 170, s.vy / 170); }
      else if (s.life <= 0 || this.landed(s)) { s.dead = true; if (this.wetAt(s.x, s.y + 10)) { this.puff(s.x, s.y, 3); this.sfx('hr_steam_0', 0.3, s.x); } else this.ignite(s.x, s.y, 1, s.kind);          /* (into a puddle: it dies) */ this.tweens.add({ targets: s.obj, alpha: 0, duration: 200, ease: 'Stepped', easeParams: [2], onComplete: () => s.obj.destroy() }); }
    }
    this.shots = this.shots.filter(s => !s.dead);
  }

  landed(s) { return s.life < 0.05; }

  // the prop a fireball over ground point (x, gy) strikes, or null: its side's cut at the ball's height (HIT, tools/hitmask.py), in
  // the sprite's own pixels from its foot. A burnt bush is the bush's shape; a sway frame the still one's
  struck(x, gy) {
    if (!this.hitRows) this.hitRows = Object.fromEntries(Object.entries(HIT).map(([k, [x0, y0, w, h, r]]) => [k, { x0, y0, w, h, on: Uint8Array.from(r, (c) => c === '1') }]));
    for (const p of [...this.trees, ...this.decor]) {
      const key = p.img.texture.key.split('~')[0], m = this.hitRows[key.replace('bush-burnt', 'bush')]; if (!m) continue;
      const [fx, fy] = FOOT[key] || FOOT[key.replace('bush-burnt', 'bush')], i = Math.floor(x - p.x + fx + 0.5) - m.x0, j = Math.floor(gy - p.y + fy + 0.5) - m.y0;
      if (i >= 0 && j >= 0 && i < m.w && j < m.h && m.on[j * m.w + i]) return p;
    }
    return null;
  }

  // a fireball broken on cover: sparks flung back and falling, a wisp of smoke
  sparks(x, y) {
    for (let i = 0; i < 9; i++) {
      const e = this.add.rectangle(R(x), R(y), 2, 2, i % 3 ? 0xffb22e : 0xffe27a).setDepth(4600), a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(10, 30);
      this.tweens.add({ targets: e, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.6 + 18, alpha: 0, duration: Phaser.Math.Between(300, 520), ease: 'Stepped', easeParams: [5], onComplete: () => e.destroy() });
    }
    this.smoke(x, y, false);
  }

  hurt(nx, ny) {
    const g = this.girl;
    this.sfx('hit_1', 0.6); this.sfx('crit_0', 0.35);
    g.hearts--; g.hurtT = 1.3; if (this.round) this.round.hits++; g.push = [nx * 420, ny * 420];
    this.cameras.main.shake(180, 0.008);
    if (g.hearts <= 0) {
      this.state = 'over'; g.attack = null; this.jingle('jingle_over', () => this.playMusic('bgm_title', 0.32, 0.8)); /* (lost: falling, then the lullaby slowed and low - sadder) */
      this.showTitle(T('loseTitle'), T('loseSub', { n: this.wave + 1, score: this.total, best: this.saveBest() })); this.endGame(false);
    }
  }

  // A FOOTSTEP (the walk's 2nd and 6th frames): its sound by the ground under her, and water kicked up - a splash in a puddle
  footstep() {
    const g = this.girl, wet = this.wetAt(g.x, g.y), path = Math.abs(g.y - PATH_Y(g.x)) * 1.414 < PATH_HALF;
    this.sfx(wet ? ['step_puddle_0', 'step_puddle_1'] : [0, 1, 2, 3, 4].map((i) => `step_${path ? 'dirt' : 'grass'}_${i}`), wet ? 0.35 : path ? 0.16 : 0.22, g.x);
    for (let i = 0; i < (wet ? 6 : 2); i++) {
      const e = this.add.rectangle(R(g.x + Phaser.Math.Between(-6, 6)), R(g.y - 1), 1, 1, wet ? 0xd6ecff : 0xa8c4d8).setDepth(g.y + 2).setAlpha(0.8);
      this.tweens.add({ targets: e, y: e.y - Phaser.Math.Between(wet ? 5 : 2, wet ? 11 : 4), x: e.x + Phaser.Math.Between(-5, 5), alpha: 0, duration: wet ? 300 : 180, ease: 'Stepped', easeParams: [3], onComplete: () => e.destroy() });
    }
  }

  drawGirl() {
    const g = this.girl, spr = this.girlSpr, X = R(g.x), Y = R(g.y);
    let left = X - PX.ax, top = Y - PX.ay, anim, fr;
    if (g.attack) {
      const f = g.attack.show, M = MOVES[g.attack.move]; anim = `${g.attack.move}-${f}`; fr = Math.min(M.frames - 1, Math.floor(g.attack.t * M.fps));
      left = X - AX.ax; top = Y - AX.ay;          // (the attack set's own frame and feet)
      const tr = TRAIL[anim], cell = Math.min(tr.cells - 1, Math.floor(g.attack.t * M.fps * tr.per));
      this.trailSpr.setTexture(`trail-${anim}`, cell).setPosition(left + tr.x, top + tr.y).setVisible(true).setDepth(g.y + 1);          // (the water's own render in each facing)
    } else {
      this.trailSpr.setVisible(false);
      if (g.hurtT > 0.85) { anim = `stand-${g.show}`; fr = 0; }          // (just hit: a wince - drawn below with the hurt face)
      else if (g.moving) { anim = `carry-${g.show}`; fr = Math.floor(g.walkT * GIRL.walk.fps) % GIRL.walk.frames; g.standT = 0; if (fr !== this.stepFr && (fr === 1 || fr === 5)) this.footstep(); }
      else { anim = `stand-${g.show}`; g.standT = (g.standT || 0) + this.game.loop.delta / 1000; fr = Math.floor(g.standT * GIRL.stand.fps * GIRL.stand.frames / 1) % GIRL.stand.frames; }          // (standing still: SpriteCast's idle, a breath and a sway)
    }
    this.stepFr = g.moving && !g.attack ? fr : -1;
    const wince = !g.attack && g.hurtT > 0.85;
    if (wince) spr.setTexture(`hurt-${g.show}`); else spr.setTexture(anim, fr);
    spr.setPosition(left, top).setDepth(g.y);
    // her reflection's picture (seen from below: refl-*, tools/reflect_girl.py) and where it goes - drawn by reflections()
    { const rk = !wince && this.textures.exists(`refl-${anim}`) ? `refl-${anim}` : `refl-stand-${g.show}`; const rfr = rk === `refl-${anim}` ? fr : 0; this.girlRefl = { key: rk, frame: rfr, x: X - PX.ax, top: Y - PX.ay + REFL[rk.slice(5)][rfr], show: spr.visible }; }          // (from the ground's own line down, as it is: tools/reflect_girl.py turned it over there)
    // in a prop's shade she is darker - her top by what shades her head and middle, her feet by what shades them; in steps, as pixel art
    const sh = [0.05, 0.6, 1.1].map((h) => this.shadeOn(g.x, g.y, h)), tone = (a) => { const v = Math.round((1 - 0.95 * a) * 8) / 8; return Phaser.Display.Color.GetColor(v * 255, v * 255, Math.min(255, v * 270)); };
    const topT = tone((sh[2] + sh[1]) / 2), botT = tone((sh[1] + sh[0]) / 2); spr.setTint(topT, topT, botT, botT); this.trailSpr.setTint(topT, topT, botT, botT);
    spr.setVisible(wince || !(g.hurtT > 0 && Math.floor(g.hurtT * 12) % 2 === 0));          // (hurt: the wince first, then she blinks, on and off)
    const s = SHADOW[anim]; for (const o of [this.girlShadow, this.girlShadow2]) o.setTexture(`sh-${anim}`, fr).setPosition(left + s[2], top + s[3]).setDepth(-499);          // (on the ground, over the props' shadows and under the props: it does not fall across a bush beside her)
  }

  // the rain: one-pixel streaks, slanting two pixels across for every five down
  drawRain(dt) {
    const r = this.rainG, sl = 0.15 + 0.35 * (this.wind || 0); r.clear(); r.fillStyle(0xcfe4ff, 0.5);          // (slanting with the wind)
    for (let i = 0; i < this.rain.length; i++) {
      const d = this.rain[i]; d.y += d.v * dt; d.x += d.v * sl * dt;
      if (d.y >= d.gy) { if (!this.ripple(d.x, d.gy, d.l < 8 ? 0 : d.l < 10 ? 1 : 2)) this.splashes.push({ x: R(d.x), y: R(d.gy), t: 0 }); this.rain[i] = this.newDrop(false); continue; }          // (on a puddle: a ring by the drop's size)
      const x0 = R(d.x), y0 = R(d.y);
      for (let j = 0; j < d.l; j++) r.fillRect(x0 - Math.floor(j * sl), y0 - j, 1, 1);
    }
    // where a drop lands on the ground: a crown of two pixels, then two wider (on a puddle: a ring, updateRipples)
    for (const p of this.splashes) {
      p.t += dt; const k = p.t < 0.06 ? 0 : 1;
      { r.fillStyle(0xcfe4ff, 0.45); if (k) { r.fillRect(p.x - 2, p.y - 1, 1, 1); r.fillRect(p.x + 2, p.y - 1, 1, 1); } else { r.fillRect(p.x - 1, p.y - 1, 1, 1); r.fillRect(p.x + 1, p.y - 1, 1, 1); } }
    }
    this.splashes = this.splashes.filter((p) => p.t < 0.13);
  }

  drawTank() {
    const g = this.girl, max = g.waterMax || WATER_MAX, water = Math.max(0, g.water ?? max), w = 40 + Math.round(max * 0.5);          // (longer with each potion)
    const x0 = 8 + TANK.capL, inner = w - TANK.capL - TANK.capR, fill = inner * water / max, low = water < SWING_COST, t = this.time.now / 1000, dt = Math.min(0.05, this.game.loop.delta / 1000);
    this.tankGlass.setDisplaySize(inner, 21); this.tankCapR.setX(x0 + inner);
    if (water < this.tankWas - 5) this.slosh = 1;          // (a swing: the water sloshes, then settles)
    const filling = water > this.tankWas + 1e-6 && water < max; this.tankWas = water; this.slosh = Math.max(0, this.slosh - dt * 1.4);
    const q = this.tankWater.clear(), top = 36 + TANK.top, bot = 36 + TANK.bot, n = Math.floor(fill), blink = low && Math.floor(t * 4) % 2 === 0;
    const body = blink ? 0xd86a6a : 0x2a86d8, deep = blink ? 0xa04848 : 0x1a5aa8, lite = blink ? 0xffc0c0 : 0x9ad8ff;          // (the puddles' and the drops' blues; nearly empty: it blinks red)
    q.fillStyle(0x0a1620, 0.55).fillRect(x0, top, inner, bot - top);          // (the empty glass: dim inside, so where the water ends reads at a glance over a busy forest)
    for (let i = 0; i < n + 1 && i < inner; i++) {
      const edge = i >= n, wv = Math.sin(i * 0.55 - t * 5) * (0.5 + 2.2 * this.slosh) + Math.sin(i * 0.21 + t * 3.1) * 0.4 * (1 + this.slosh), y = Math.max(top, Math.min(bot - 4, Math.round(top + 1 + wv + (edge ? 2 + Math.sin(t * 9) : 0))));          // (the surface: small ripples, big ones after a swing; the front a little lower)
      if (edge && fill - n < 0.35) break;
      q.fillStyle(body, 1).fillRect(x0 + i, y, 1, bot - y - 2); q.fillStyle(deep, 1).fillRect(x0 + i, bot - 2, 1, 2); q.fillStyle(lite, 1).fillRect(x0 + i, y, 1, 1);
    }
    if (filling && Math.random() < dt * 9 && n > 2) this.bubbles.push({ x: x0 + 1 + Math.floor(Math.random() * (n - 2)), y: bot - 3, v: 6 + Math.random() * 6 });          // (the rain filling it: bubbles rise)
    for (const p of this.bubbles) { p.y -= p.v * dt; if (p.x < x0 + n && p.y > top + 2) q.fillStyle(0xcdeeff, 0.9).fillRect(p.x, Math.round(p.y), 1, 1); }
    this.bubbles = this.bubbles.filter((p) => p.y > top + 2 && p.x < x0 + n);
    for (let x = SWING_COST; x < max; x += SWING_COST) q.fillStyle(0x0c1a24, 0.5).fillRect(x0 + Math.round(inner * x / max), top + 3, 1, bot - top - 6);          // (a notch a swing)
  }

  drawUi() {
    const g = this.girl, b = this.bars; b.clear();
    this.hearts.forEach((h, i) => h.setTexture(i < g.hearts ? 'item-heart' : 'item-heart-empty'));
    // the water tank: a bar in whole pixels beside a drop
    this.drawTank();
    // the boss's bar
    const boss = this.monsters.find((m) => m.big);
    if (boss && this.state === 'play') { const bw = 300, f = Math.round(bw * boss.hp / boss.maxHp); b.fillStyle(0x2b2418, 1).fillRect(W / 2 - bw / 2 - 2, 24, bw + 4, 10); b.fillStyle(0x1a2a4a, 1).fillRect(W / 2 - bw / 2, 26, bw, 6); b.fillStyle(0x2aa0ff, 1).fillRect(W / 2 - bw / 2, 26, f, 6); this.bossText.setText(T('boss')); }
    else this.bossText.setText('');
    this.scoreText.setText(this.state === 'title' ? '' : T('score', { score: this.total || 0 }));
    this.waveText.setText(this.state === 'play' ? T('wave', { m: this.monsters.length, n: Math.max(1, this.wave + 1), of: WAVES.length }) : '');
  }
}

// the letters are pixels too: start once the pixel font is there
// (the font is waited for 3 s at most: a phone that never answers still gets its game)
// THE PICTURE IN THE WINDOW: whole and in the middle, as large as fits. A phone held upright gets it turned a quarter, filling the
// screen - the player holds the phone sideways; a phone that turns its own screen is sideways already and gets it as it is
const FIT = { k: 1, turned: false };
function fit() {
  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches), w = innerWidth, h = innerHeight; FIT.turned = coarse && h > w;
  const [aw, ah] = FIT.turned ? [h, w] : [w, h]; FIT.k = Math.min(aw / W, ah / H); const st = document.documentElement.style;
  st.setProperty('--gw', `${W * FIT.k}px`); st.setProperty('--gh', `${H * FIT.k}px`); st.setProperty('--turn', FIT.turned ? '90deg' : '0deg'); document.body.classList.toggle('turned', FIT.turned);
}
fit(); for (const ev of ['resize', 'orientationchange']) window.addEventListener(ev, () => { fit(); setTimeout(fit, 300); });
BOOT.el.textContent = 'Getting the font...';
Promise.race([document.fonts.load(`12px ${FONT}`).catch(() => {}), new Promise((r) => setTimeout(r, 3000))]).then(() => { BOOT.el.textContent = 'Starting the game...'; return new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, backgroundColor: '#1d2318', parent: document.body, pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },          // (fitted by `fit`, below)
  scene: [Chapter1],
}); });
