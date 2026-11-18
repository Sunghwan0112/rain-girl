// 우비소녀의 여행 - 1장 「불꽃 숲」
// A real pixel game: everything is drawn at 960x540, one art pixel = one game pixel, and the page scales the whole
// picture up (2x on a 1080p screen) without smoothing. Nothing is shown at a fractional size of its art.
//   the girl: SpriteCast pixel art, 96 px - four facings (the diagonals) of walking with the umbrella and its swing
//   the fire monster (64 px, three faces), the ground tile, the trees: pixel art drawn by GPT on a grid and read back (assets/px/)
//   the effects, the hearts, the fireball: a few pixels each, made here; the letters: Galmuri11 (SIL OFL)

const W = 960, H = 540;
const FONT = 'Galmuri11';
const FACINGS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
const DIAG = ['south-east', 'south-west', 'north-east', 'north-west'];          // the facings drawn ("facings": 4)
// the girl's frames, feet, shadows and water: assets/girlpx/pixel.js (PIXEL), written from pixel.json by tools/sync_girl.py
const PX = { w: PIXEL.frame[0], h: PIXEL.frame[1], ax: PIXEL.feet[0], ay: PIXEL.feet[1] };
const GIRL = { walk: { frames: 8, fps: 11 }, slash: { frames: 8, fps: 15 }, stand: { frames: 3, fps: 0.75 } };          // (standing: 3 frames over 4 s, a breath and a sway)
const SHADOW = PIXEL.shadows;
const TRAIL = Object.fromEntries(DIAG.map((f) => [f, PIXEL.trails[`slash-${f}`]]));
const SPEED = 130;
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
// THE GROUND BURNS: a grid of 16 px squares. Where a fire monster lands and where a fireball falls the grass catches; a fire spreads to
// the squares beside it now and then, burns ~18 s and leaves scorched ground. The girl cannot walk into a burning square (her water puts
// it out); caught in one - it catches under her - she is hurt and thrown clear.
// her: five hearts; a water tank the swing draws on (the rain fills it again); a monster put out may leave a drop that heals
const HEARTS = 5, WATER_MAX = 100, SWING_COST = 18, WATER_REGEN = 13, DROP_CHANCE = 0.3;
const TILE = 16, FIRE_LIFE = 15, FIRE_MAX = 330;          // (how fast it spreads goes with the round: HARD)
const TREES = [[68, 112, 'tree'], [195, 92, 'tree-burnt'], [352, 106, 'tree'], [615, 98, 'tree'], [772, 112, 'tree-burnt'], [900, 94, 'tree'],
               [44, 318, 'tree'], [920, 352, 'tree-burnt'], [104, 528, 'tree-burnt'], [862, 530, 'tree']];
const DECOR = [[248, 196, 'bush'], [735, 226, 'stump'], [450, 488, 'bush'], [615, 420, 'stump'], [196, 390, 'bush'], [810, 450, 'bush'], [525, 182, 'stump']];
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
  bigdrop: { map: ['...k...', '..kbk..', '.kbbbk.', 'kbWbbbk', 'kbWbbbk', 'kbbbbbk', '.kbbbk.', '..kkk..'], col: { k: '#1d3a5c', b: '#5fb0ee', W: '#e8f6ff' } },
};

// the drawn facing for a direction: a diagonal as it is; straight across or up and down, the nearest diagonal - the one shown
// last when two are as near (walking east after north-east stays north-east: no flicker)
function diagOf(dx, dy, was) {
  const v = dy > 0 ? 'south' : dy < 0 ? 'north' : was.split('-')[0];
  const h = dx > 0 ? 'east' : dx < 0 ? 'west' : was.split('-')[1];
  return `${v}-${h}`;
}
function facingOf(dx, dy) { const i = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); return FACINGS[(i + 8) % 8]; }
function vecOf(f) { const a = FACINGS.indexOf(f) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; }
const R = Math.round;

class Chapter1 extends Phaser.Scene {
  constructor() { super('chapter1'); }

  preload() {
    for (const f of DIAG) for (const a of ['carry', 'slash', 'stand']) {
      this.load.spritesheet(`${a}-${f}`, `assets/girlpx/${a}-${f}.png`, { frameWidth: PX.w, frameHeight: PX.h });
      const s = SHADOW[`${a}-${f}`]; this.load.spritesheet(`sh-${a}-${f}`, `assets/girlpx/shadows/${a}-${f}.png`, { frameWidth: s[0], frameHeight: s[1] });
    }
    for (const f of DIAG) this.load.spritesheet(`trail-${f}`, `assets/girlpx/trails/slash-${f}.png`, { frameWidth: TRAIL[f].w, frameHeight: TRAIL[f].h });
    // the music (Suno) and the sounds (assets/audio/CREDITS.md)
    for (const n of ['bgm_stage', 'bgm_boss', 'bgm_title', 'fire_loop', 'rain_loop', 'spray_0', 'spray_1', 'jingle_clear', 'jingle_win', 'jingle_over', 'jingle_boss_in', 'hr_steam_0', 'poof_0',
                     'hurt_cute_0', 'hurt_cute_1', 'cry_boss_0', 'shot_fire_0', 'hit_1', 'crit_0', 'coin_0', 'error_0', 'hit_soft_0', 'hit_soft_1']) this.load.audio(n, `assets/audio/${n}.ogg`);
    for (const f of DIAG) this.load.image(`hurt-${f}`, `assets/girlpx/hurt-${f}.png`);          // (hit: the standing frame with the eyes squeezed shut - the faces that show)
    for (const n of ['normal', 'hurt', 'dead']) this.load.image(`fire-${n}`, `assets/px/fire-${n}.png`);
    for (const n of ['ground', 'tree', 'tree-burnt', 'bush', 'stump', 'crown']) this.load.image(n, `assets/px/${n}.png`);          // (the crown: drawn by GPT, read back on its grid)
  }

  // THE GROUND AS IT BURNS AND AFTER: 16 px squares made here, a few of each so the grid does not show - the burning ground (dark,
  // embers glowing, three frames), and the ash it leaves (grey, a few cinders); their edges ragged, so neighbours run into each other
  groundTiles() {
    const rnd = (n) => Math.floor(Math.random() * n), T = TILE;
    const tile = (key, base, specks, ragged) => {
      const tx = this.textures.createCanvas(key, T, T), c = tx.getContext();
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
        const edge = Math.min(x, y, T - 1 - x, T - 1 - y);
        if (ragged && edge === 0 && Math.random() < 0.45) continue;
        let col = base[rnd(base.length)];
        for (const [p, cs] of specks) if (Math.random() < p) col = cs[rnd(cs.length)];
        c.fillStyle = col; c.fillRect(x, y, 1, 1);
      }
      tx.refresh();
    };
    for (let v = 0; v < 4; v++) {
      for (let f = 0; f < 3; f++) tile(`burnt${v}_${f}`, ['#3a1d10', '#2e170d', '#43220f'], [[0.10, ['#8a2a14', '#a8361a']], [0.05, ['#e0601c', '#ff8a2a']], [0.015, ['#ffd060']]], true);
      tile(`ash${v}`, ['#4b4743', '#55504b', '#423e3a'], [[0.08, ['#6e6862', '#7a746d']], [0.04, ['#2c2926']], [0.01, ['#9a2c16']]], true);
    }
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
    c.putImageData(d, 0, 0); t.refresh();
  }

  // an oval in hard pixels (shadows), drawn into a texture once
  oval(key, w, h, rgba) {
    const t = this.textures.createCanvas(key, w, h), c = t.getContext(); c.fillStyle = rgba;
    for (let y = 0; y < h; y++) { const v = (y + 0.5 - h / 2) / (h / 2), half = Math.floor(w / 2 * Math.sqrt(Math.max(0, 1 - v * v))); c.fillRect(R(w / 2 - half), y, half * 2, 1); }
    t.refresh();
  }

  create() {
    for (const [k, v] of Object.entries(PIX)) this.pix(k, v);
    for (const [k, K] of Object.entries(KINDS)) FLAMES.forEach((map, i) => this.pix(`flame${i}-${k}`, { map, col: { r: K.flame[0], y: K.flame[1], W: K.flame[2] } }));
    this.oval('scorch', 18, 10, 'rgba(30,20,12,0.55)');
    this.groundTiles();
    this.fire = new Map(); this.ash = new Map(); this.spreadT = 0;          // "col,row" -> { age, life, spr, gnd } / the ash a fire left
    for (const k of ['blue', 'green', 'purple']) { for (const n of ['normal', 'hurt', 'dead']) this.recolour(`fire-${n}`, k); this.recolour('fireball', k); }
    this.oval('shadow-tree', 64, 16, 'rgba(16,24,12,0.35)'); this.oval('shadow-small', 34, 9, 'rgba(16,24,12,0.3)'); this.oval('shadow-fire', 40, 10, 'rgba(42,26,8,0.32)');
    // the glow behind a fire monster: three hard rings, laid on with ADD
    const gc = this.textures.createCanvas('glow', 96, 96), gx = gc.getContext();
    for (const [r, a] of [[46, 0.12], [34, 0.16], [22, 0.22]]) { gx.fillStyle = `rgba(255,140,50,${a})`; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); gx.fillRect(48 - w, 48 + y, w * 2, 1); } }
    gc.refresh();

    // the ground: one tile, each copy flipped at random so the repeat does not show
    const gw = this.textures.get('ground').getSourceImage().width;
    for (let y = 0; y < H; y += gw) for (let x = 0; x < W; x += gw) this.add.image(x, y, 'ground').setOrigin(0).setFlip(Math.random() < 0.5, Math.random() < 0.5).setDepth(-1000);
    this.trees = TREES.map(([x, y, k]) => {
      this.add.image(x, y - 3, k === 'tree' ? 'shadow-tree' : 'shadow-small').setDepth(y - 1);
      return { x, y, r: k === 'tree' ? 18 : 13, kind: k, state: k === 'tree' ? 'green' : 'burnt', img: this.add.image(x, y, k).setOrigin(0.5, 0.97).setDepth(y) };
    });
    for (const [x, y, k] of DECOR) { this.add.image(x, y - 2, 'shadow-small').setDepth(y - 1); this.add.image(x, y, k).setOrigin(0.5, 0.95).setDepth(y); }

    // the girl
    this.girl = { x: W / 2, y: H / 2 + 50, facing: 'south', show: 'south-east', walkT: 0, attack: null, hearts: HEARTS, water: WATER_MAX, hurtT: 0, push: [0, 0] };
    this.girlShadow = this.add.sprite(0, 0, 'sh-carry-south-east', 0).setOrigin(0);
    this.girlSpr = this.add.sprite(0, 0, 'carry-south-east', 0).setOrigin(0);
    this.trailSpr = this.add.sprite(0, 0, 'trail-south-east', 0).setOrigin(0).setVisible(false);

    this.monsters = []; this.shots = [];
    this.wave = -1; this.state = 'title';

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,R,ENTER');
    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    // a tap is kept until the next update: a very short press (down and up in one frame) is never lost
    this.swingAsked = false;
    for (const kk of ['SPACE', 'J']) this.input.keyboard.on(`keydown-${kk}`, () => { this.swingAsked = true; });

    this.rain = Array.from({ length: 110 }, () => this.newDrop(true));
    this.rainG = this.add.graphics().setDepth(5000);

    // letters: the pixel font at its own size (11 px) or twice or three times that - never between
    const txt = (x, y, size, col = '#fff8e8') => this.add.text(x, y, '', { fontFamily: FONT, fontSize: `${size}px`, color: col, stroke: '#2b2418', strokeThickness: size / 11 * 3, align: 'center', resolution: 1 });
    this.hearts = Array.from({ length: HEARTS }, (_, i) => this.add.image(10 + i * 24, 8, 'heart').setOrigin(0).setScale(2).setDepth(6000));
    this.add.image(10, 34, 'bigdrop').setOrigin(0).setDepth(6000);
    this.bars = this.add.graphics().setDepth(6000);
    this.scoreText = txt(W - 12, 26, 11, '#ffe6b0').setOrigin(1, 0).setDepth(6000);
    this.bossText = txt(W / 2, 8, 11, '#bfe8ff').setOrigin(0.5, 0).setDepth(6000);
    this.items = [];
    this.best = 0; try { this.best = +localStorage.getItem('rain-girl-best') || 0; } catch (e) {}
    this.waveText = txt(W - 12, 10, 11).setOrigin(1, 0).setDepth(6000);
    this.help = txt(W / 2, H - 8, 11).setOrigin(0.5, 1).setDepth(6000).setText('이동: 방향키 / WASD      물뿌리기: Space / J      불길은 물로 꺼요');
    this.banner = txt(W / 2, 150, 33, '#fff3d6').setOrigin(0.5).setDepth(7000);
    this.sub = txt(W / 2, 215, 22, '#fff3d6').setOrigin(0.5, 0).setDepth(7000).setLineSpacing(6);
    this.dim = this.add.rectangle(0, 0, W, H, 0x10140c, 0.5).setOrigin(0).setDepth(6900);
    this.boardText = txt(W / 2, 380, 11, '#ffe6b0').setOrigin(0.5, 0).setDepth(7000).setLineSpacing(3);
    this.showTitle('우비소녀의 여행', '1장 · 불꽃 숲\n\nSpace 를 눌러 시작'); this.showBoard();
    // sound: the rain all the time, the fire as loud as there is fire on the ground, one music at a time; browsers let sound start
    // only after a key is pressed - the title's music starts with the first one
    this.rainS = this.sound.add('rain_loop', { loop: true, volume: 0.22 }); this.fireS = this.sound.add('fire_loop', { loop: true, volume: 0 });
    this.input.keyboard.once('keydown', () => { this.rainS.play(); this.fireS.play(); if (!this.music) this.playMusic('bgm_title'); });
    window.G = this;                             // for tests
  }

  playMusic(key, vol = 0.45, rate = 1) {
    if (this.music && this.music.key === key && this.music.isPlaying && this.music.rate === rate) return;
    if (this.music) this.music.stop(); this.music = this.sound.add(key, { loop: true, volume: vol, rate }); this.music.play();
  }
  sfx(key, vol = 0.6) { if (Array.isArray(key)) key = key[Math.floor(Math.random() * key.length)]; this.sound.play(key, { volume: vol, detune: Phaser.Math.Between(-80, 80) }); }
  jingle(key, then) { if (this.music) this.music.stop(); this.music = null; const j = this.sound.add(key, { volume: 0.6 }); j.once('complete', () => then && then()); j.play(); }

  showTitle(a, b) { this.banner.setText(a); this.sub.setText(b); this.dim.setVisible(true); this.boardText.setVisible(true); }
  hideTitle() { this.banner.setText(''); this.sub.setText(''); this.dim.setVisible(false); this.boardText.setVisible(false); }

  // THE LEADERBOARD (ranking.js): the best ten under the title; at the end of a game, a name asked for and the score sent
  async showBoard() {
    const top = await Ranking.top(8);
    const head = Ranking.online() ? '— 랭킹 —' : '— 이 컴퓨터의 랭킹 —';
    this.boardText.setText(top.length ? [head, ...top.map((e, i) => `${i + 1}. ${e.name.padEnd(12, ' ')} ${String(e.score).padStart(6, ' ')}  ${'★'.repeat(Math.min(30, e.stars || 0)) ? `★${e.stars}` : ''}  ${e.won ? '클리어' : `R${e.round}`}`)].join('\n') : `${head}\n아직 기록이 없어요`);
  }
  askName(entry) {
    const box = document.getElementById('namebox'), form = box.querySelector('form'), input = box.querySelector('input'), skip = box.querySelector('#skip');
    const kb = this.input.keyboard; kb.enabled = false; kb.clearCaptures(); kb.resetKeys();          // (no key kept from the box: the letters and Enter are its)
    try { input.value = localStorage.getItem('rain-girl-name') || ''; } catch (e) {}
    box.style.display = 'flex'; setTimeout(() => input.focus(), 50);
    const done = async (send) => {
      form.onsubmit = null; skip.onclick = null; box.style.display = 'none';
      if (send) { try { localStorage.setItem('rain-girl-name', input.value.trim()); } catch (e) {} await Ranking.submit({ ...entry, name: input.value }); }
      kb.enabled = true; kb.addCapture('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,J,R,ENTER'); kb.resetKeys(); this.showBoard();
    };
    form.onsubmit = (ev) => { ev.preventDefault(); done(true); }; skip.onclick = () => done(false);
  }
  endGame(won) {
    const rounds = this.wave + (won ? 0 : 1), ground = Math.floor(W / TILE) * Math.floor((H - TOP) / TILE);
    const entry = { score: this.total, round: Math.min(WAVES.length, rounds), stars: this.starsTotal || 0, burnt: Math.round(100 * (this.burntSum || 0) / Math.max(1, ground * Math.max(1, rounds))), won };
    this.time.delayedCall(1300, () => this.askName(entry));
  }

  start() {
    for (const m of this.monsters) this.dropMonster(m);
    for (const s of this.shots) s.obj.destroy();
    this.monsters = []; this.shots = [];
    for (const f of this.fire.values()) { f.spr.destroy(); f.gnd.destroy(); } this.fire.clear();
    for (const a of this.ash.values()) a.destroy(); this.ash.clear();
    for (const tr of this.trees) { for (const fl of tr.flames || []) fl.destroy(); tr.flames = null; tr.state = tr.kind === 'tree' ? 'green' : 'burnt'; tr.img.setTexture(tr.kind); }
    Object.assign(this.girl, { x: W / 2, y: H / 2 + 50, facing: 'south', show: 'south-east', attack: null, hearts: HEARTS, water: WATER_MAX, hurtT: 0, push: [0, 0] });
    for (const it of this.items) it.spr.destroy(); this.items = []; this.total = 0; this.starsTotal = 0; this.burntSum = 0;
    this.swingAsked = false;
    this.state = 'play'; this.wave = -1; this.toSpawn = 0; this.waiting = false; this.hideTitle(); this.playMusic('bgm_stage'); this.nextWave();
  }

  nextWave() {
    this.wave++;
    if (this.wave >= WAVES.length) { this.state = 'clear'; this.jingle('jingle_win', () => this.playMusic('bgm_title')); /* (won: bright, then the lullaby as it is) */ this.showTitle('1장 클리어!', `숲의 불이 모두 꺼졌어요\n\n점수 ${this.total}${this.saveBest()}\n\nR 을 눌러 다시 하기`); this.endGame(true); return; }
    this.flash(`라운드 ${this.wave + 1} / ${WAVES.length}`);
    this.round = { t0: this.time.now, hits: 0, burnt: 0, kills: 0 };
    if (WAVES[this.wave].some((m) => m.boss)) { this.sfx('jingle_boss_in', 0.6); this.time.delayedCall(1400, () => this.state === 'play' && this.playMusic('bgm_boss', 0.5)); }
    else this.playMusic('bgm_stage');
    this.toSpawn = WAVES[this.wave].length;
    WAVES[this.wave].forEach((m, i) => this.time.delayedCall(400 + i * 450, () => { this.toSpawn--; if (this.state === 'play') this.spawn(m); }));
  }

  say(t) {          // a few words over her head
    const x = this.add.text(R(this.girl.x), R(this.girl.y - 112), t, { fontFamily: FONT, fontSize: '11px', color: '#bfe8ff', stroke: '#2b2418', strokeThickness: 3, resolution: 1 }).setOrigin(0.5).setDepth(7000);
    this.tweens.add({ targets: x, y: x.y - 10, alpha: 0, delay: 500, duration: 400, ease: 'Stepped', easeParams: [4], onComplete: () => x.destroy() });
  }

  flash(t) {
    const x = this.add.text(W / 2, 90, t, { fontFamily: FONT, fontSize: '22px', color: '#ffe6b0', stroke: '#2b2418', strokeThickness: 6, resolution: 1 }).setOrigin(0.5).setDepth(7000);
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
    m.glow = this.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(K.glow);
    m.spr = this.add.image(x, y, 'fire-normal' + sfx).setOrigin(0.5, 0.97).setAlpha(0);
    m.over = this.add.image(x, y, 'fire-hurt' + sfx).setOrigin(0.5, 0.97).setVisible(false);   // the face it is turning from, shown on alternate frames
    this.tweens.add({ targets: m.spr, alpha: 1, duration: 320, ease: 'Stepped', easeParams: [4] });          // (comes in by steps, not by growing)
    if (big) { m.crown = this.add.image(x, y, 'crown').setOrigin(0.5, 1); this.sfx('cry_boss_0', 0.7); }          // (the boss: a crown, and its own bar at the top)
    this.monsters.push(m);
  }

  newDrop(anywhere) {
    return { x: Math.random() * (W + 150) - 75, y: anywhere ? Math.random() * H : -15, v: 420 + Math.random() * 220, l: 6 + Math.floor(Math.random() * 6) };
  }

  update(time, dtMs) {
    const n = window.SPEEDUP || 1; this.time.timeScale = n; this.tweens.timeScale = n;
    for (let i = 0; i < n; i++) this.step(time + i * Math.min(dtMs, 50), dtMs);
  }

  step(time, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000, k = this.keys;
    if (this.state !== 'play') {
      if ((this.state === 'title' && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) ||
          (this.state !== 'title' && Phaser.Input.Keyboard.JustDown(k.R))) this.start();
      this.drawGirl(); this.drawRain(dt); this.drawUi();
      return;
    }
    const g = this.girl;
    g.hurtT = Math.max(0, g.hurtT - dt);

    // the swing
    if (g.attack) {
      g.attack.t += dt;
      const fr = Math.floor(g.attack.t * GIRL.slash.fps);
      if (fr >= 2 && fr <= 5) this.waterHits(g.attack);
      if (fr >= GIRL.slash.frames) g.attack = null;
    } else if (this.swingAsked) {
      if (g.water >= SWING_COST) { g.water -= SWING_COST; g.attack = { t: 0, id: time, facing: g.facing, show: g.show }; this.time.delayedCall(110, () => this.sfx(['spray_0', 'spray_1'], 0.55)); }
      else if (!this.dryT || time - this.dryT > 900) { this.dryT = time; this.puff(g.x + 10, g.y - 50, 2); this.say('물이 부족해요'); this.sfx('error_0', 0.4); }          // (the tank is empty: a puff of nothing)
    }
    if (!g.attack) g.water = Math.min(WATER_MAX, g.water + WATER_REGEN * dt);          // (the rain fills it again)
    this.swingAsked = false;

    // walking (not while swinging)
    let dx = (k.D.isDown || k.RIGHT.isDown) - (k.A.isDown || k.LEFT.isDown);
    let dy = (k.S.isDown || k.DOWN.isDown) - (k.W.isDown || k.UP.isDown);
    if (window.BOT) { const b = window.BOT(this); dx = b[0]; dy = b[1]; if (b[2]) this.swingAsked = true; }          // (tests: a bot plays)
    g.moving = false;
    if (!g.attack && (dx || dy)) {
      const n = Math.hypot(dx, dy); dx /= n; dy /= n;
      g.facing = facingOf(dx, dy); g.show = diagOf(dx, dy, g.show); g.moving = true;
      this.moveGirl(dx * SPEED * dt, dy * SPEED * dt); g.walkT += dt;
    }
    this.moveGirl(g.push[0] * dt, g.push[1] * dt); g.push[0] *= Math.pow(0.002, dt); g.push[1] *= Math.pow(0.002, dt);
    this.keepOut(g, 16);
    // a fire caught under her: hurt, and thrown to the nearest square that is not burning
    if (this.burning(g.x, g.y)) {
      const c = this.clearNear(g.x, g.y);
      if (g.hurtT <= 0) this.hurt(0, 0);
      this.tweens.add({ targets: g, x: c[0], y: c[1], duration: 160, ease: 'Quad.Out' }); g.push = [0, 0];          // (thrown clear, over the flames)
    }
    this.updateFire(dt);

    this.updateMonsters(dt);
    this.updateShots(dt);

    if (this.monsters.length === 0 && this.toSpawn === 0 && !this.waiting) {
      this.waiting = true; this.roundDone();
      this.time.delayedCall(2600, () => { this.waiting = false; if (this.state === 'play') this.nextWave(); });
    }
    this.updateItems(dt);
    this.drawGirl(); this.drawRain(dt); this.drawUi();
  }

  // A ROUND'S SCORE: the monsters put out, the time, the hits she took - and how little of the forest burned (the squares that caught
  // this round, against the ground she can walk on). Three stars: no hit, and under 5 % burned, on top of finishing.
  roundDone() {
    if (this.wave < WAVES.length - 1) this.sfx('jingle_clear', 0.55);
    const r = this.round, secs = (this.time.now - r.t0) / 1000, ground = Math.floor(W / TILE) * Math.floor((H - TOP) / TILE), burnt = r.burnt / ground;
    const pts = r.kills * 100 + Math.max(0, Math.round(600 - secs * 10)) + Math.round(Math.max(0, 1 - burnt * 4) * 800) - r.hits * 150;
    const stars = 1 + (r.hits === 0 ? 1 : 0) + (burnt < 0.05 ? 1 : 0); this.total += Math.max(0, pts); this.starsTotal = (this.starsTotal || 0) + stars; this.burntSum = (this.burntSum || 0) + r.burnt;
    const lines = [`라운드 ${this.wave + 1} 완료  ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, `시간 ${Math.round(secs)}초 · 맞음 ${r.hits} · 탄 땅 ${Math.round(burnt * 100)}%`, `+${Math.max(0, pts)}`];
    const box = this.add.text(W / 2, 150, lines.join('\n'), { fontFamily: FONT, fontSize: '22px', color: '#fff3d6', stroke: '#2b2418', strokeThickness: 6, align: 'center', lineSpacing: 6, resolution: 1 }).setOrigin(0.5, 0).setDepth(7000);
    this.tweens.add({ targets: box, alpha: 0, delay: 2000, duration: 400, ease: 'Stepped', easeParams: [4], onComplete: () => box.destroy() });
  }
  saveBest() {
    const nb = this.total > this.best; if (nb) { this.best = this.total; try { localStorage.setItem('rain-girl-best', String(this.best)); } catch (e) {} }
    return nb ? '  (최고 기록!)' : `  (최고 ${this.best})`;
  }

  // A DROP that heals: left now and then by a monster put out (always by the boss); a heart back and the tank a little fuller
  dropItem(x, y) { this.items.push({ x, y, age: 0, spr: this.add.image(R(x), R(y), 'bigdrop').setOrigin(0.5, 1).setScale(2).setDepth(y) }); }
  updateItems(dt) {
    const g = this.girl;
    for (const it of this.items) {
      it.age += dt; it.spr.setY(R(it.y - 2 - (Math.floor(it.age * 4) % 2) * 2)).setVisible(it.age < 7 || Math.floor(it.age * 8) % 2 === 0);
      if (Math.hypot(it.x - g.x, it.y - g.y) < 22) { g.hearts = Math.min(HEARTS, g.hearts + 1); g.water = Math.min(WATER_MAX, g.water + 40); this.puff(it.x, it.y - 10, 4); it.age = 99; this.sfx('coin_0', 0.6); }
      if (it.age > 9) it.spr.destroy();
    }
    this.items = this.items.filter((it) => it.age <= 9);
  }

  // the burning ground
  cell(x, y) { return [Math.floor(x / TILE), Math.floor(y / TILE)]; }
  burning(x, y) { const [c, r] = this.cell(x, y); return this.fire.has(c + ',' + r); }
  moveGirl(mx, my) {          // a step, one axis at a time, not into a burning square (her feet: a few pixels either side)
    const g = this.girl, feet = (x, y) => this.burning(x - 5, y) || this.burning(x + 5, y) || this.burning(x, y - 3);
    if (mx && !feet(g.x + mx, g.y)) g.x += mx;
    if (my && !feet(g.x, g.y + my)) g.y += my;
  }
  clearNear(x, y) {
    for (let r = 1; r < 8; r++) for (let a = 0; a < 16; a++) { const px = x + Math.cos(a / 16 * 2 * Math.PI) * r * TILE, py = y + Math.sin(a / 16 * 2 * Math.PI) * r * TILE;
      if (py > TOP && py < H - 10 && px > 20 && px < W - 20 && !this.burning(px, py)) return [px, py]; }
    return [x, y];
  }
  ignite(x, y, rad = 0, kind = 'red') {
    const [c0, r0] = this.cell(x, y);
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      const c = c0 + dc, r = r0 + dr, k = c + ',' + r, cx = c * TILE + TILE / 2, cy = r * TILE + TILE / 2;
      if (this.fire.has(k) || this.ash.has(k) || this.fire.size >= FIRE_MAX || cy < TOP - 40 || cy > H - 8 || cx < 8 || cx > W - 8) continue;          // (ash does not burn again)
      if (this.trees.some((t) => Math.abs(t.x - cx) < t.r && Math.abs(t.y - cy) < t.r / 2 + 6)) continue;          // (not inside a trunk)
      const v = Math.floor(Math.random() * 4), gnd = this.add.image(c * TILE, r * TILE, `burnt${v}_0`).setOrigin(0).setDepth(-950);
      const K = KINDS[kind], spr = this.add.image(c * TILE + TILE / 2, r * TILE + TILE, `flame0-${kind}`).setOrigin(0.5, 1).setDepth(r * TILE + TILE - 2);
      if (this.round) this.round.burnt++;
      this.fire.set(k, { c, r, age: 0, life: FIRE_LIFE * K.life * (0.8 + Math.random() * 0.4), spr, gnd, v, kind, hits: K.hits + (kind === 'blue' && this.monsters.some((m) => m.big) ? 1 : 0), hitBy: -1, ph: Math.floor(Math.random() * 3) });
    }
  }
  toAsh(k, f) { f.spr.destroy(); this.fire.delete(k); f.gnd.setTexture(`ash${f.v}`); this.ash.set(k, f.gnd); }
  douseGround(x, y, id) {          // one hit a swing: a blue fire takes three
    const k = this.cell(x, y).join(','), f = this.fire.get(k); if (!f || f.hitBy === id) return false;
    f.hitBy = id; if (--f.hits > 0) { f.spr.setTintFill(0xffffff); this.time.delayedCall(70, () => f.spr.active && f.spr.clearTint()); return false; }
    this.toAsh(k, f); if (Math.random() < 0.4) this.puff(f.c * TILE + TILE / 2, f.r * TILE + 4, 1);
    if (!this.hissT || this.time.now - this.hissT > 250) { this.hissT = this.time.now; this.sfx('hr_steam_0', 0.25); } return true;
  }
  updateFire(dt) {
    this.spreadT += dt; const spread = this.spreadT >= 0.6; if (spread) this.spreadT = 0;
    const born = [];
    for (const [k, f] of this.fire) {
      f.age += dt;
      if (f.age > f.life) { this.toAsh(k, f); continue; }
      f.gnd.setTexture(`burnt${f.v}_${(Math.floor(f.age * 5) + f.ph) % 3}`);
      f.spr.setTexture(`flame${(Math.floor(f.age * 8) + f.ph) % 3}-${f.kind}`).setFlipX(Math.floor(f.age * 3 + f.ph) % 2 === 0);
      if (spread && f.age > 2 && f.age < f.life - 3 && Math.random() < lerp(0.07, 0.12, HARD(this.wave)) * KINDS[f.kind].spread) { const [dc, dr] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)]; born.push([(f.c + dc) * TILE + TILE / 2, (f.r + dr) * TILE + TILE / 2, f.kind]); }
    }
    for (const [x, y, kd] of born) this.ignite(x, y, 0, kd);
    this.updateTrees(dt, spread);
    if (this.fireS) this.fireS.setVolume(Math.min(0.55, this.fire.size / 160 + this.trees.filter((tr) => tr.state === 'burning').length * 0.08));          // (as loud as the fire is big)
  }

  // TREES CATCH: a green tree with fire on the ground at its foot may catch (a chance at each spread); it burns ~10 s - flames in its
  // crown, the ground round its trunk catching - and stands burnt after (its burnt picture). Water on its crown puts it out: burnt.
  updateTrees(dt, spread) {
    for (const tr of this.trees) {
      if (tr.state === 'green' && spread) {
        let near = false; for (const f of this.fire.values()) if (Math.abs(f.c * TILE + 8 - tr.x) < tr.r + 18 && Math.abs(f.r * TILE + 8 - tr.y) < 22) { near = true; break; }
        if (near && Math.random() < 0.18) this.lightTree(tr);
      } else if (tr.state === 'burning') {
        tr.burnT += dt;
        tr.flames.forEach((fl, i) => fl.setTexture(`flame${(Math.floor(tr.burnT * 8) + i) % 3}-red`).setFlipX((Math.floor(tr.burnT * 3) + i) % 2 === 0));
        if (spread && Math.random() < 0.25) this.ignite(tr.x + Phaser.Math.Between(-28, 28), tr.y + Phaser.Math.Between(-6, 10));
        if (tr.burnT > 10) this.burnOut(tr);
      }
    }
  }
  lightTree(tr) {
    tr.state = 'burning'; tr.burnT = 0; const h = tr.img.height, w = tr.img.width;
    tr.flames = Array.from({ length: 7 }, () => this.add.image(R(tr.x + Phaser.Math.Between(-w * 0.35, w * 0.35)), R(tr.y - h * Phaser.Math.FloatBetween(0.35, 0.9)), 'flame0-red')
      .setOrigin(0.5, 1).setScale(2).setDepth(tr.y + 1));
  }
  burnOut(tr) {
    for (const fl of tr.flames || []) fl.destroy(); tr.flames = null; tr.state = 'burnt'; tr.img.setTexture('tree-burnt'); this.puff(tr.x, tr.y - 50, 6);
  }

  keepOut(o, r) {
    o.x = Phaser.Math.Clamp(o.x, 30, W - 30); o.y = Phaser.Math.Clamp(o.y, TOP, H - 12);
    for (const t of this.trees) {
      const ddx = o.x - t.x, ddy = (o.y - t.y) * 2, d = Math.hypot(ddx, ddy), m = t.r + r;
      if (d < m && d > 0.01) { o.x = t.x + ddx / d * m; o.y = t.y + ddy / d * m / 2; }
    }
  }

  // the water: a fan in front of her, from the 3rd to the 6th frame of the swing; one hit per monster per swing
  waterHits(a) {
    const g = this.girl, [fx, fy] = vecOf(a.facing), cy = g.y - 20;
    const inFan = (x, y) => {
      const dx = x - g.x, dy = (y - cy), d = Math.hypot(dx, dy);
      if (d > REACH + 24) return false;
      return d < 26 || Math.acos(Phaser.Math.Clamp((dx * fx + dy * fy) / d, -1, 1)) < HALF_ANGLE;
    };
    for (const m of this.monsters) {
      if (m.dead || m.hitBy === a.id) continue;
      if (inFan(m.x, m.y - 28)) { m.hitBy = a.id; this.douse(m, fx, fy); }
    }
    for (const s of this.shots) if (!s.dead && inFan(s.x, s.y)) { s.dead = true; this.puff(s.x, s.y, 3); s.obj.destroy(); }
    for (const tr of this.trees) if (tr.state === 'burning' && Math.hypot(tr.x - g.x, tr.y - g.y) < REACH + 30 && (inFan(tr.x, tr.y - 10) || inFan(tr.x, tr.y - 40))) this.burnOut(tr);
    for (const f of [...this.fire.values()]) { const x = f.c * TILE + TILE / 2, y = f.r * TILE + TILE / 2; if (Math.hypot(x - g.x, y - g.y) < REACH && inFan(x, y + 14)) this.douseGround(x, y, a.id); }
  }

  // hit: a white flash for a moment hides the change of face, and the body squashes by whole pixels; it springs back
  douse(m, fx, fy) {
    this.sfx('hr_steam_0', 0.35); this.sfx(['hit_soft_0', 'hit_soft_1'], 0.5);
    m.hp--; m.hurtT = 0.35; m.kb = [fx * 300 * m.K.kb, fy * 300 * m.K.kb]; m.flashT = 0.09; m.pulse = 0.28;
    this.puff(m.x, m.y - 32, 6); this.drops(m.x, m.y - 32);
    if (m.hp <= 0) {
      // beaten: steam bursts over the change to the dizzy face, it shakes a moment, then sinks away in steps
      m.dead = true; m.face = 'dead'; m.over.setVisible(false); this.sfx('poof_0', 0.7);
      this.puff(m.x, m.y - 32, 12);
      this.monsters = this.monsters.filter(o => o !== m);
      if (this.round) this.round.kills++;
      if (m.big || Math.random() < DROP_CHANCE) this.time.delayedCall(600, () => this.dropItem(m.x, m.y));
      if (m.crown) m.crown.destroy();
      m.spr.setTexture('fire-dead' + m.sfx).setScale(1).setY(m.y).setTintFill(0xffffff);
      this.time.delayedCall(80, () => m.spr.clearTint());
      this.tweens.add({ targets: m.spr, x: { from: m.x - 2, to: m.x + 2 }, duration: 70, yoyo: true, repeat: 3, ease: 'Stepped', easeParams: [2] });
      this.tweens.add({ targets: m.glow, alpha: 0, duration: 500, ease: 'Stepped', easeParams: [3] });
      this.tweens.add({ targets: m.spr, delay: 560, scaleY: 0.25, alpha: 0, duration: 380, ease: 'Stepped', easeParams: [4],
                        onStart: () => this.puff(m.x, m.y - 14, 6), onComplete: () => this.dropMonster(m) });
      this.tweens.add({ targets: m.shadow, delay: 560, alpha: 0, duration: 380, ease: 'Stepped', easeParams: [3] });
    } else {
      m.face = 'hurt'; m.faceT = 0.38; this.sfx(['hurt_cute_0', 'hurt_cute_1'], 0.45);
    }
  }

  dropMonster(m) { for (const o of [m.spr, m.over, m.glow, m.shadow, m.crown]) if (o) o.destroy(); }

  // steam: hard pixel puffs that grow by whole steps (1x, 2x) and go, never a soft circle
  puff(x, y, n) {
    for (let i = 0; i < n; i++) {
      const c = this.add.image(R(x + Phaser.Math.Between(-14, 14)), R(y + Phaser.Math.Between(-10, 10)), 'steam').setAlpha(0.85).setDepth(4000);
      this.tweens.add({ targets: c, y: c.y - Phaser.Math.Between(22, 50), x: c.x + Phaser.Math.Between(-14, 14), alpha: 0, scale: 2, duration: Phaser.Math.Between(500, 850),
                        ease: 'Stepped', easeParams: [5], onComplete: () => c.destroy() });
    }
  }

  drops(x, y) {
    for (let i = 0; i < 10; i++) {
      const c = this.add.image(R(x), R(y), 'drop').setDepth(4001);
      const a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(16, 42);
      this.tweens.add({ targets: c, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.6 + 20, alpha: 0, duration: 450, ease: 'Quad.Out', onComplete: () => c.destroy() });
    }
  }

  updateMonsters(dt) {
    const g = this.girl;
    for (const m of this.monsters) {
      m.hurtT = Math.max(0, m.hurtT - dt); m.wobble += dt;
      const dx = g.x - m.x, dy = g.y - m.y, d = Math.hypot(dx, dy) || 1;
      // it hops: moves only while in the air, squashes when it lands
      const P = m.K.hop * (m.big ? 1.2 : 1); m.hopT += dt * (m.hurtT > 0 ? 0.4 : 1);
      const ph = (m.hopT % P) / P, air = ph < 0.62;
      if (m.wasAir && !air && Math.random() < (m.big ? 0.9 : lerp(0.3, 0.55, HARD(this.wave)))) this.ignite(m.x, m.y - 2, m.big ? 1 : 0, m.kind);          // (landing: the grass catches)
      m.wasAir = air;
      const sp = m.K.speed * (m.big ? 0.85 : 1) * (m.hurtT > 0 ? 0.2 : 1) * (air ? 1.6 : 0);
      m.x += dx / d * sp * dt + Math.sin(m.wobble * 2.3) * 10 * dt * (air ? 1 : 0) + m.kb[0] * dt;
      m.y += dy / d * sp * dt + Math.cos(m.wobble * 1.7) * 9 * dt * (air ? 1 : 0) + m.kb[1] * dt;
      const a = air ? Math.sin(Math.PI * ph / 0.62) : 0, q = air ? 0 : Math.sin(Math.PI * (ph - 0.62) / 0.38);
      m.hop = R(a * (m.big ? 16 : 22));
      m.kb[0] *= Math.pow(0.004, dt); m.kb[1] *= Math.pow(0.004, dt);
      this.keepOut(m, 14);
      // a fireball now and then
      m.shootT -= dt * 1000;
      if (m.shootT <= 0) { const u = lerp(1.45, 0.95, HARD(this.wave)); m.shootT = Phaser.Math.Between(m.K.shoot[0] * u, m.K.shoot[1] * u); if (d < 420) this.shoot(m); }          // (slower in the first rounds)
      // touching her
      if (d < 36 && g.hurtT <= 0) this.hurt(dx / d, dy / d);
      // the face: hurt for a moment, then back to angry - the old face shown on every other frame for a moment (pixel art has no half-see-through)
      if (m.face === 'hurt' && (m.faceT -= dt) <= 0) { m.face = 'normal'; m.fadeT = 0.14; }
      m.fadeT = Math.max(0, m.fadeT - dt); m.flashT = Math.max(0, m.flashT - dt);
      // squash and stretch by WHOLE PIXELS: a few rows taken off or put on the art's height, a few columns on its width
      const tex = this.textures.get(`fire-${m.face}${m.sfx}`).getSourceImage(), tw = tex.width, th = tex.height;
      let dh = R(3 * a - 6 * q), dw = R(-2 * a + 5 * q);
      if (m.pulse > 0) { const u = m.pulse / 0.28, wv = Math.cos((1 - u) * 9) * u; dh -= R(8 * wv); dw += R(8 * wv); m.pulse -= dt; }
      if (Math.abs(dx) > 12) m.flip = dx < 0;
      const X = R(m.x), Y = R(m.y - m.hop), sx = (tw + dw) / tw, sy = (th + dh) / th;
      const showOld = m.fadeT > 0 && Math.floor(m.fadeT * 40) % 2 === 0;
      m.spr.setTexture(showOld ? `fire-hurt${m.sfx}` : `fire-${m.face}${m.sfx}`).setPosition(X, Y).setScale(sx, sy).setFlipX(m.flip).setDepth(m.y);
      if (m.flashT > 0) m.spr.setTintFill(0xffffff); else m.spr.clearTint();
      // the glow flickers by steps
      const fl = [1, 1, 0.9, 1.1][Math.floor(m.wobble * 12) % 4];
      m.glow.setPosition(X, R(Y - th * 0.42)).setScale(fl * (m.big ? 1.2 : 1)).setDepth(m.y - 0.5);
      if (m.crown) m.crown.setPosition(X + (m.flip ? 2 : -2), R(Y - th * sy * 0.62)).setDepth(m.y + 1);          // (sat on the top of the flame)
      m.shadow.setPosition(X, R(m.y - 2)).setDepth(m.y - 1).setScale(m.hop > 12 ? 0.75 : 1);
    }
  }

  shoot(m) {
    const g = this.girl, sx = m.x, sy = m.y - (m.hop || 0) - 36;
    const dx = g.x - sx, dy = (g.y - 34) - sy, d = Math.hypot(dx, dy) || 1, v = 170, n = m.K.shots; this.sfx('shot_fire_0', 0.3);
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.32;          // (three: a fan)
      const obj = this.add.image(R(sx), R(sy), 'fireball' + m.sfx).setScale(2).setDepth(3000);
      this.shots.push({ x: sx, y: sy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: Math.min(3.2, (d + 30) / v), obj, dead: false, kind: m.kind });
    }          // (it falls a little past where she was aimed at: and sets fire there)
  }

  updateShots(dt) {
    const g = this.girl;
    for (const s of this.shots) {
      if (s.dead) continue;
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      s.obj.setPosition(R(s.x), R(s.y)).setFlip(Math.floor(s.life * 16) % 2 === 0, Math.floor(s.life * 12) % 2 === 0);          // (it flickers by flipping, not by growing)
      if (Math.random() < 0.5) { const e = this.add.rectangle(R(s.x), R(s.y), 2, 2, 0xffb22e).setDepth(2999); this.tweens.add({ targets: e, alpha: 0, duration: 300, ease: 'Stepped', easeParams: [3], onComplete: () => e.destroy() }); }
      if (Phaser.Math.Distance.Between(s.x, s.y, g.x, g.y - 34) < 22 && g.hurtT <= 0) { s.dead = true; s.obj.destroy(); this.hurt(s.vx / 170, s.vy / 170); }
      else if (s.life <= 0 || this.landed(s)) { s.dead = true; this.ignite(s.x, s.y, 1, s.kind); this.tweens.add({ targets: s.obj, alpha: 0, duration: 200, ease: 'Stepped', easeParams: [2], onComplete: () => s.obj.destroy() }); }
    }
    this.shots = this.shots.filter(s => !s.dead);
  }

  landed(s) { return s.life < 0.05; }

  hurt(nx, ny) {
    const g = this.girl;
    this.sfx('hit_1', 0.6); this.sfx('crit_0', 0.35);
    g.hearts--; g.hurtT = 1.3; if (this.round) this.round.hits++; g.push = [nx * 420, ny * 420];
    this.cameras.main.shake(180, 0.008);
    if (g.hearts <= 0) {
      this.state = 'over'; g.attack = null; this.jingle('jingle_over', () => this.playMusic('bgm_title', 0.32, 0.8)); /* (lost: falling, then the lullaby slowed and low - sadder) */
      this.showTitle('앗, 뜨거워!', `라운드 ${this.wave + 1} 에서 쓰러졌어요\n\n점수 ${this.total}${this.saveBest()}\n\nR 을 눌러 다시 하기`); this.endGame(false);
    }
  }

  drawGirl() {
    const g = this.girl, spr = this.girlSpr, X = R(g.x), Y = R(g.y);
    const left = X - PX.ax, top = Y - PX.ay; let anim, fr;
    if (g.attack) {
      const f = g.attack.show; anim = `slash-${f}`; fr = Math.min(GIRL.slash.frames - 1, Math.floor(g.attack.t * GIRL.slash.fps));
      const tr = TRAIL[f], cell = Math.min(tr.cells - 1, Math.floor(g.attack.t * GIRL.slash.fps * tr.per));
      this.trailSpr.setTexture(`trail-${f}`, cell).setPosition(left + tr.x, top + tr.y).setVisible(true).setDepth(g.y + 1);          // (the water's own render in each facing)
    } else {
      this.trailSpr.setVisible(false);
      if (g.hurtT > 0.85) { anim = `stand-${g.show}`; fr = 0; }          // (just hit: a wince - drawn below with the hurt face)
      else if (g.moving) { anim = `carry-${g.show}`; fr = Math.floor(g.walkT * GIRL.walk.fps) % GIRL.walk.frames; g.standT = 0; }
      else { anim = `stand-${g.show}`; g.standT = (g.standT || 0) + this.game.loop.delta / 1000; fr = Math.floor(g.standT * GIRL.stand.fps * GIRL.stand.frames / 1) % GIRL.stand.frames; }          // (standing still: SpriteCast's idle, a breath and a sway)
    }
    const wince = !g.attack && g.hurtT > 0.85;
    if (wince) spr.setTexture(`hurt-${g.show}`); else spr.setTexture(anim, fr);
    spr.setPosition(left, top).setDepth(g.y);
    spr.setVisible(wince || !(g.hurtT > 0 && Math.floor(g.hurtT * 12) % 2 === 0));          // (hurt: the wince first, then she blinks, on and off)
    const s = SHADOW[anim]; this.girlShadow.setTexture(`sh-${anim}`, fr).setPosition(left + s[2], top + s[3]).setDepth(g.y - 1);
  }

  // the rain: one-pixel streaks, slanting two pixels across for every five down
  drawRain(dt) {
    const r = this.rainG; r.clear(); r.fillStyle(0xcfe4ff, 0.5);
    for (let i = 0; i < this.rain.length; i++) {
      const d = this.rain[i]; d.y += d.v * dt; d.x -= d.v * 0.4 * dt;
      if (d.y > H + 15) this.rain[i] = this.newDrop(false);
      const x0 = R(d.x), y0 = R(d.y);
      for (let j = 0; j < d.l; j++) r.fillRect(x0 + Math.floor(j * 0.4), y0 - j, 1, 1);
    }
  }

  drawUi() {
    const g = this.girl, b = this.bars; b.clear();
    this.hearts.forEach((h, i) => h.setTexture(i < g.hearts ? 'heart' : 'heartEmpty'));
    // the water tank: a bar in whole pixels beside a drop
    const w = 100, fill = Math.round(w * (g.water ?? WATER_MAX) / WATER_MAX), low = (g.water ?? WATER_MAX) < SWING_COST;
    b.fillStyle(0x2b2418, 1).fillRect(20, 36, w + 4, 8); b.fillStyle(0x1d3a5c, 1).fillRect(22, 38, w, 4);
    b.fillStyle(low ? 0xe8485a : 0x5fb0ee, 1).fillRect(22, 38, fill, 4); b.fillStyle(0xd8f0ff, 1).fillRect(22, 38, fill, 1);
    for (let x = SWING_COST; x < WATER_MAX; x += SWING_COST) b.fillStyle(0x2b2418, 1).fillRect(22 + x, 38, 1, 4);          // (a notch a swing)
    // the boss's bar
    const boss = this.monsters.find((m) => m.big);
    if (boss && this.state === 'play') { const bw = 300, f = Math.round(bw * boss.hp / boss.maxHp); b.fillStyle(0x2b2418, 1).fillRect(W / 2 - bw / 2 - 2, 24, bw + 4, 10); b.fillStyle(0x1a2a4a, 1).fillRect(W / 2 - bw / 2, 26, bw, 6); b.fillStyle(0x2aa0ff, 1).fillRect(W / 2 - bw / 2, 26, f, 6); this.bossText.setText('대장 파란 불꽃'); }
    else this.bossText.setText('');
    this.scoreText.setText(this.state === 'title' ? '' : `점수 ${this.total || 0}`);
    this.waveText.setText(this.state === 'play' ? `불꽃 몬스터 ${this.monsters.length}  ·  라운드 ${Math.max(1, this.wave + 1)} / ${WAVES.length}` : '');
  }
}

// the letters are pixels too: start once the pixel font is there
document.fonts.load(`11px ${FONT}`).then(() => document.fonts.load(`22px ${FONT}`)).catch(() => {}).then(() => new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, backgroundColor: '#1d2318', parent: document.body, pixelArt: true, roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Chapter1],
}));
