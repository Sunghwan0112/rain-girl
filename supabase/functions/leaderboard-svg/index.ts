// The leaderboard as a picture, for a README: GET -> image/svg+xml of the best ten. Deployed with
//   supabase functions deploy leaderboard-svg --no-verify-jwt
// and put in a README as ![leaderboard](https://<project>.supabase.co/functions/v1/leaderboard-svg)
const URL_ = Deno.env.get('SUPABASE_URL')!, KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
Deno.serve(async () => {
  const r = await fetch(`${URL_}/rest/v1/scores?select=name,score,round,stars,burnt,won&order=score.desc,created_at.asc&limit=10`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const rows: { name: string; score: number; round: number; stars: number; burnt: number; won: boolean }[] = r.ok ? await r.json() : [];
  const W = 480, rowH = 26, H = 70 + Math.max(1, rows.length) * rowH;
  const lines = rows.length ? rows.map((e, i) => {
    const y = 70 + i * rowH, medal = ['#f2c21b', '#c9d1d9', '#d08a4a'][i] ?? '#fff3d6';
    return `<text x="24" y="${y}" fill="${medal}">${i + 1}.</text><text x="62" y="${y}" fill="#fff3d6">${esc(e.name)}</text>` +
      `<text x="300" y="${y}" fill="#fff3d6" text-anchor="end">${e.score}</text><text x="320" y="${y}" fill="#ffe6b0">★${e.stars}</text>` +
      `<text x="456" y="${y}" fill="${e.won ? '#5fd23a' : '#9aa1b2'}" text-anchor="end">${e.won ? 'CLEAR' : 'R' + e.round} · ${e.burnt}%</text>`;
  }).join('') : `<text x="24" y="70" fill="#9aa1b2">no scores yet</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + 14}" viewBox="0 0 ${W} ${H + 14}" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="16">` +
    `<rect width="100%" height="100%" rx="6" fill="#23262e" stroke="#f2c21b" stroke-width="3"/>` +
    `<text x="24" y="34" fill="#f2c21b" font-size="18" font-weight="bold">Rain Girl - Leaderboard</text>${lines}</svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
});
