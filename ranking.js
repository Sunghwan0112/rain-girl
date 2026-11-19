// THE LEADERBOARD: Supabase's REST API when ranking-config.js has its address, this browser's storage otherwise.
// Two boards: this month's best ten and the best three ever. A player may sign in with GitHub (Supabase's own sign-in page: the score
// then goes up under their GitHub name, which the database takes from the sign-in) or play as a guest under a name they type.
const Ranking = {
  online: () => !!(RANKING.url && RANKING.key),
  token() { try { const t = JSON.parse(localStorage.getItem('rain-girl-auth') || 'null'); return t && t.exp > Date.now() / 1000 + 30 ? t : null; } catch (e) { return null; } },
  headers(auth = true) { const t = auth && this.token(); return { apikey: RANKING.key, Authorization: `Bearer ${t ? t.access : RANKING.key}`, 'Content-Type': 'application/json' }; },
  local() { try { return JSON.parse(localStorage.getItem('rain-girl-board') || '[]'); } catch (e) { return []; } },
  monthStart() { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString(); },
  async top(n = 10, since = null) {
    if (!this.online()) return this.local().filter((e) => !since || (e.at || '') >= since).sort((a, b) => b.score - a.score).slice(0, n);
    try {
      const q = `select=name,github,score,round,stars,burnt,won,created_at&order=score.desc,created_at.asc&limit=${n}` + (since ? `&created_at=gte.${encodeURIComponent(since)}` : '');
      const r = await fetch(`${RANKING.url}/rest/v1/scores?${q}`, { headers: this.headers(false) });
      return r.ok ? await r.json() : [];
    } catch (e) { return []; }
  },
  async boards() { const [month, ever] = await Promise.all([this.top(10, this.monthStart()), this.top(3)]); return { month, ever }; },
  async submit(entry) {
    entry = { score: entry.score, round: entry.round, stars: entry.stars, burnt: entry.burnt, won: entry.won, name: String(entry.name || '').trim().slice(0, 12) || '???' };
    if (!this.online()) {
      const b = this.local(); b.push({ ...entry, at: new Date().toISOString() });
      try { localStorage.setItem('rain-girl-board', JSON.stringify(b.sort((a, b2) => b2.score - a.score).slice(0, 50))); } catch (e) {} return { ok: true };
    }
    try {
      const r = await fetch(`${RANKING.url}/rest/v1/scores`, { method: 'POST', headers: { ...this.headers(), Prefer: 'return=minimal' }, body: JSON.stringify(entry) });
      return r.ok ? { ok: true } : { ok: false, why: ((await r.json().catch(() => ({}))).message || r.status) };
    } catch (e) { return { ok: false, why: 'no connection' }; }
  },
  // GitHub sign-in: off to Supabase's page and back here with the token in the address; the score waiting is kept to send on return
  signIn(pending) {
    try { localStorage.setItem('rain-girl-pending', JSON.stringify(pending || null)); } catch (e) {}
    const back = location.origin + location.pathname; location.href = `${RANKING.url}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(back)}`;
  },
  signOut() { try { localStorage.removeItem('rain-girl-auth'); } catch (e) {} },
  async fromSignIn() {          // (on load: a token in the address - from the sign-in - is kept, the address cleaned; who it is, asked)
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get('access_token')) {
      const t = { access: h.get('access_token'), exp: Math.floor(Date.now() / 1000) + (+h.get('expires_in') || 3600) };
      try { const r = await fetch(`${RANKING.url}/auth/v1/user`, { headers: { apikey: RANKING.key, Authorization: `Bearer ${t.access}` } }); const u = await r.json(); t.login = (u.user_metadata || {}).user_name || (u.user_metadata || {}).preferred_username || ''; } catch (e) {}
      try { localStorage.setItem('rain-girl-auth', JSON.stringify(t)); } catch (e) {}
      history.replaceState(null, '', location.pathname + location.search);
    }
    let pending = null; try { pending = JSON.parse(localStorage.getItem('rain-girl-pending') || 'null'); localStorage.removeItem('rain-girl-pending'); } catch (e) {}
    return pending;
  },
  who() { const t = this.token(); return t && t.login ? t.login : null; },
};
