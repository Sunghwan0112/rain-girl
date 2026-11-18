// the leaderboard: Supabase's REST API when ranking-config.js has its address, this browser's storage otherwise
const Ranking = {
  online: () => !!(RANKING.url && RANKING.key),
  headers: () => ({ apikey: RANKING.key, Authorization: `Bearer ${RANKING.key}`, 'Content-Type': 'application/json' }),
  local() { try { return JSON.parse(localStorage.getItem('rain-girl-board') || '[]'); } catch (e) { return []; } },
  async top(n = 10) {
    if (!this.online()) return this.local().sort((a, b) => b.score - a.score).slice(0, n);
    try {
      const r = await fetch(`${RANKING.url}/rest/v1/scores?select=name,score,round,stars,burnt,won&order=score.desc,created_at.asc&limit=${n}`, { headers: this.headers() });
      return r.ok ? await r.json() : [];
    } catch (e) { return []; }
  },
  async submit(entry) {
    entry = { ...entry, name: String(entry.name || '').trim().slice(0, 12) || '???' };
    if (!this.online()) { const b = this.local(); b.push(entry); try { localStorage.setItem('rain-girl-board', JSON.stringify(b.sort((a, b2) => b2.score - a.score).slice(0, 50))); } catch (e) {} return true; }
    try { const r = await fetch(`${RANKING.url}/rest/v1/scores`, { method: 'POST', headers: { ...this.headers(), Prefer: 'return=minimal' }, body: JSON.stringify(entry) }); return r.ok; }
    catch (e) { return false; }
  },
};
