# 우비소녀의 여행 · Rain Girl

A small pixel action game: a girl in a yellow raincoat puts out fire monsters with her umbrella's water before the forest burns.

**▶ Play: https://sunghwan0112.github.io/rain-girl/** (arrow keys / WASD to move, Space / J to swing)

<!-- leaderboard: the picture comes from the Supabase function supabase/functions/leaderboard-svg -->
![Leaderboard](https://YOUR-PROJECT.supabase.co/functions/v1/leaderboard-svg)

- Ten rounds of red, green, purple and blue fires, a crowned blue boss in the last.
- The fire burns the ground and spreads; burning ground blocks the way, then turns to ash. Trees catch too.
- Your water tank empties as you swing and the rain fills it. Drops left by the fires heal.
- The score counts how little of the forest burned, not only the fires put out.

The girl was made with [SpriteCast](https://github.com/Sunghwan0112/spritecast) - a 3D model turned into pixel-art frames in four facings.

## Run it yourself
Any static web server: `python3 -m http.server` in this folder, then open http://localhost:8000.

## The leaderboard (Supabase)
1. Make a Supabase project; run `supabase/schema.sql` in its SQL editor.
2. Put its URL and anon key in `ranking-config.js` (the anon key is public by design: the table only lets anyone add a score and read the list).
3. `supabase functions deploy leaderboard-svg --no-verify-jwt`, and put the function's address in the picture above.

Without step 2 the game keeps a leaderboard in the player's browser only.

## Credits
- Code: Phaser 3 (MIT). Font: Galmuri11 by Lee Minseo (SIL OFL, `assets/font/OFL.md`).
- Art: made with SpriteCast and GPT image models.
- Sounds and music: see `assets/audio/CREDITS.md` (CC0 sounds from Kenney and OpenGameArt; music made with Suno).
