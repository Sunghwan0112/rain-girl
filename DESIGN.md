# Rain Girl - how the game is made

What the game is, its rules and numbers, where every picture and sound came from, and how to make them again.
The numbers live at the top of `game.js`; this file says what they mean and why they are what they are.

## The game
A girl in a yellow raincoat puts out fire monsters with the water her closed umbrella throws, before the forest burns.
Ten rounds; the last has a crowned blue boss. Arrow keys / WASD move, Space / J swings.

- **The screen**: 960 x 540 game pixels, scaled up whole (2x on a 1080p screen) without smoothing - every art pixel is a game pixel.
- **The view**: 2:1 isometric, as the girl is rendered (30 degrees down). The ground is a grid of 32 x 16 diamonds; walking diagonally
  goes along it; a screen pixel up or down counts twice as far as one across (`wdist`).

## The rules
| | |
|---|---|
| Hearts | 5. A hit: knocked back, 1.3 s safe, the wince face for a moment |
| Water tank | 100; a swing costs 18; the rain fills it 15 a second (3x standing in a puddle) |
| The swing | a fan in front of her, 130 world px, 68 degrees each side, on frames 3-6; one hit a monster a swing |
| Fire on the ground | catches where a monster lands and where a fireball falls (a ragged blob, not a square); spreads to the diamond beside it - downwind up to 2.5x as likely; burns ~15 s, then ash |
| The wind | a new one each round (shown with the round's number): the rain slants with it, the trees lean, smoke and sparks drift, the fire spreads its way |
| Burning ground | she cannot walk into it; caught on it, she is hurt and thrown clear; water puts it out (a blue fire takes two, three while the boss lives) |
| Trees | a green tree with fire at its foot may catch and burns ~10 s: water within 4 s (`TREE_SAVE`) saves it (green again, a moment darker); after 4 s it is half burnt (its picture changes while it burns) and stays so if put out; left 10 s, burnt. A half-burnt tree can catch again |
| Rocks | three boulders: walked round, like a tree trunk |
| Bushes | catch the same way, burn ~7 s, saved within 4 s; walked through, not round |
| Puddles | 2-3 a round, somewhere new; fire does not catch on them, fireballs die in them; a fire monster landing in one loses 1 hp and boils 4 s of the puddle's life away; dry up 22-35 s in |
| Drops | a monster put out leaves one 30 % of the time (the boss always): a heart and 40 water |

### The fires
| | hp | trait | its ground fire |
|---|---|---|---|
| red | 2 | - | one swing |
| green | 2 | fast | spreads 2x |
| purple | 3 | three fireballs at once | one swing |
| blue | 6 | thrown less far by water | two swings, burns 1.4x as long |
| boss (blue) | 18 | a crown, a bar at the top | three swings |

From round 7 every monster has +1 hp. **The curve** (`HARD`, 0 in round 1 to 1 in round 10): the chance the grass catches where a
monster lands goes 30 % -> 55 %, a fire's chance to spread 7 % -> 12 % (every 0.6 s), the fireballs come 1.45x -> 0.95x as far apart.

### Rounds
1 rrr · 2 rrrg · 3 ggrr · 4 prrg · 5 brrr · 6 ppggr · 7 bbrr · 8 ppggb · 9 bbppgg · 10 boss ppggb (r red, g green, p purple, b blue)

### Score
A round: fires put out x 100 + time bonus (600 - 10 a second) + **unburned forest** (up to 800: 0 when a quarter of the ground caught)
- hits x 150. Stars: 1 for the round, +1 with no hit, +1 with under 5 % burned.

## How hard (measured)
A bot (keeps a little away from the nearest fire, aims, swings when in reach and there is water, walks round burning ground, steps
aside from fireballs, picks up drops) at 6x speed, 10 games (with the wind, rocks and burning bushes): rounds reached 4-9, average 7.0, no clear. Aimed at: a first game ends
around round 6-7; someone who has learned it can clear. (Before the balance pass: 5.5; before the ground went isometric: 7.3.)
The hook stays in the game for this: `window.BOT = (scene) => [dx, dy, swing]`, `window.SPEEDUP = n`.

## The pictures
| | made how |
|---|---|
| The girl (walk with umbrella, swing, stand, in four diagonal facings) | SpriteCast: a 3D model (Tripo) rigged and rendered at 30 degrees, each frame redrawn as 96 px pixel art by an image model, read back on its grid; the umbrella's colours fixed frame to frame; white specks and the odd frame fixed by hand in pixeledit |
| The standing loop | SpriteCast's own idle (`idleclip.py`) - a breath and a sway, 3 frames |
| Her water | the swing's effect rendered in 3D and turned into pixel art by SpriteCast, every facing |
| The wince | the standing frame with the eyes squeezed shut, by rule (`tools/make_hurt.py`) |
| Fire monster (three faces) | its 3D model baked to a picture, then drawn as pixel art by an image model; the other colours by moving its channels round in code |
| Ground tile, burning ground, ash, flames, crown, puddles | drawn as pixel art by an image model on a grid and read back at the grid it drew |
| Trees (green, half burnt, burnt), bushes, stumps, rocks, mushrooms | SpriteCast: a 3D model each (Tripo) rendered at the girl's angle and scale (74 px a metre: a tree 2.4 m is ~175 px), from four sides, each drawn as pixel art; white specks the cut-out left cleared by the render; all on one 48-colour palette with the ground (`tools/sync_props.py`). A burnt bush is the bush's pixels taken to charcoal in code. Each prop shows one side at random; a tree that burns stands burnt from the same side (`assets/px/props/`, `foot.js` - where each stands) |
| The footpath | an earth tile drawn as pixel art by an image model (beside the grass tile, to match it); the path - a winding band along the ground's 2:1 - cut from it in code, its edge ragged in 2-pixel steps with a darker rim and grass leaning over |
| The weather | a dark rainy layer over the world (a quarter-size picture, so the light comes in 4-pixel steps), a hole of firelight round every fire, monster and fireball, a little round her; browner and darker the more is burning; lightning every 11-24 s - a flash in two steps, the shadows deep, thunder after (later and softer when far), a shake when near |
| Fire on the ground, drawn | each square's flame anywhere in it, on about half the squares, its own size and beat; it catches small, burns up, dies down to a lick; the burning and ash diamonds spill past their edges in ragged clumps (overlapping where both burn - the same ground), soot past the edge; smoke and steam rise, sparks fly |
| Contact | footsteps by the ground (grass, the path, a puddle) with water kicked up; raindrops splash where they land; on a puddle a ring spreads by the drop's size (three sizes, now and then a second ring inside), drawn a pixel at a time and only on the water. The puddles' water is see-through (the ground under it shows); the rings GPT had drawn into them were painted out, so only the live ones move; sounds come from where they are (left/right); the fire's roar as loud as the fire near her, from its side; the boss's arrival shakes the screen |
| The props alive | the wind: a crown is boughs, not one sheet - its leaves are cut into clumps from the tree's 3D model (`tools/hitmask.py`: each leaf pixel takes the model's point it shows, the points grouped by where they are in 3D; 12 clumps a tree, 3 a bush) and each clump moves whole, a pixel at a time, far ones laid first; the trunk, branches and anything burnt stand still; each clump has its own moment in a 12-frame beat, and in a gust - gusts run across the forest the wind's way - the top clumps lean a pixel, then the middle ones too; a big one goes see-through when someone is behind it; the fire's light warms the props near it in four steps; rain rings on the puddles Mushrooms do not stir - they stand, and the cap gives a pixel when a gust leans on it (the steady nod made for leaves read as a tremble): too small for the model to tell one cap from the next, their caps are read off the sprite (its red patches); the caps are red, orange or wine (`CAP_HUES`), each cap of a patch its own or all the one. Five patches, placed by hand (`MUSHROOMS`): one at a tree and no more, at wood only (a stump, a tree's foot, a dead tree - never a rock), on its shadow side (lower left) - the two stumps, two trees' feet, and the one wine patch by the dead tree. |
| Shadows | the girl's from 3D; the props' baked from their 3D models by SpriteCast's way (`tools/hitmask.py`): the sun's light and the sky's, deep close by, paler far out, the real sun's size, five steps; in a prop's shade she is darker (her feet, middle and head each read the shadow where the line from them away from the sun comes down, only from props taller than that) |
| Hearts, fireball, steam, drops, glow, rain | a few pixels each, made in code |

## The sounds
See `assets/audio/CREDITS.md`: the music made with Suno; CC0 sounds from Kenney and OpenGameArt; some made in code.
Jingles were chosen by measuring their key and the way the tune goes (a round won: major and rising; lost: minor and falling).

## Languages
`i18n.js`: every word the game shows in English (the default), Korean, Japanese, Simplified Chinese, Spanish and Portuguese. The
player's choice is kept (L on the title screen cycles them; `?lang=ko` in the address picks one), else the browser's language if it is
one of these, else English. Galmuri11 has Latin, Korean and Japanese; a Chinese letter it lacks comes from the system's CJK font.

## The leaderboard
`ranking.js`: Supabase when `ranking-config.js` has its address, the player's browser otherwise. Two boards: this month's best ten and
the best three ever (title screen; `leaderboard.svg` for the READMEs, redrawn every half hour by a GitHub Action from
`tools/leaderboard_svg.py`). At the end of a game: sign in with GitHub (Supabase's own sign-in page; the score waits and goes up on the
way back, under the GitHub name, which the database takes from the sign-in), or a guest name, or not at all. `supabase/schema.sql`:
anyone may read and add; nobody may change or delete; the database fills in who and when and refuses a score a played game cannot
make (more than 3200 a round, three stars a round, a win before round 10), and one signed-in player one score every 20 s.

## Files
`index.html`, `game.js` (the game), `ranking*.js`, `assets/girlpx/` (the girl and `pixel.js`, her frame data), `assets/px/` (the rest of
the art), `assets/audio/`, `assets/font/` (Galmuri11, OFL), `phaser.min.js` (Phaser 3.90, MIT), `supabase/`.
