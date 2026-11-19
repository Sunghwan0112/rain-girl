"""The leaderboard as a picture for the READMEs: leaderboard.svg - this month's best ten and the best three ever.

Reads the board the way the game does (Supabase's REST API, with the address and the public anon key in ranking-config.js) and writes
the picture; a GitHub Action runs it every half hour and commits it when it changed (.github/workflows/leaderboard.yml). Nothing but
the standard library.

    python3 tools/leaderboard_svg.py [out.svg]
"""
import datetime as dt, json, re, sys, urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
cfg = (ROOT / 'ranking-config.js').read_text()
URL = re.search(r"url:\s*'([^']*)'", cfg).group(1); KEY = re.search(r"key:\s*'([^']*)'", cfg).group(1)


def rows(n, since=None):
    if not (URL and KEY): return None
    q = f'select=name,github,score,round,stars,won&order=score.desc,created_at.asc&limit={n}' + (f'&created_at=gte.{since}' if since else '')
    req = urllib.request.Request(f'{URL}/rest/v1/scores?{q}', headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=20) as r: return json.load(r)


now = dt.datetime.now(dt.timezone.utc); start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat().replace('+00:00', 'Z')
month, ever = rows(10, start), rows(3)
W, ROW = 650, 24; GOLD, TEXT, DIM = '#f2c21b', '#fff3d6', '#9aa1b2'


def board(x, y, title, items):
    out = [f'<text x="{x}" y="{y}" fill="{GOLD}" font-size="16" font-weight="bold">{escape(title)}</text>']
    if not items: return out + [f'<text x="{x}" y="{y + ROW + 6}" fill="{DIM}">no scores yet</text>']
    for i, e in enumerate(items):
        yy = y + (i + 1) * ROW + 6; medal = ['#f2c21b', '#c9d1d9', '#d08a4a'][i] if i < 3 else TEXT
        name = ('@' if e.get('github') else '') + e['name']
        out += [f'<text x="{x}" y="{yy}" fill="{medal}">{i + 1}.</text>', f'<text x="{x + 30}" y="{yy}" fill="{TEXT}">{escape(name[:13])}</text>',
                f'<text x="{x + 230}" y="{yy}" fill="{TEXT}" text-anchor="end">{e["score"]}</text>',
                f'<text x="{x + 244}" y="{yy}" fill="{"#5fd23a" if e["won"] else DIM}">{"CLEAR" if e["won"] else "R" + str(e["round"])}</text>']
    return out


H = 100 + 10 * ROW
body = ([f'<text x="24" y="34" fill="{GOLD}" font-size="18" font-weight="bold">Rain Girl - leaderboard</text>',
         f'<text x="24" y="{H - 16}" fill="{DIM}" font-size="12">play it: sunghwan0112.github.io/rain-girl</text>']          # (no clock in it: it changes - and is committed - only when the board does)
        + (board(24, 66, now.strftime('%B %Y'), month) + board(350, 66, 'best ever', ever) if month is not None
           else [f'<text x="24" y="70" fill="{DIM}">the online leaderboard is not set up yet</text>']))
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="14">'
       f'<rect x="1.5" y="1.5" width="{W - 3}" height="{H - 3}" rx="6" fill="#23262e" stroke="{GOLD}" stroke-width="3"/>' + ''.join(body) + '</svg>\n')
out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'leaderboard.svg'; out.write_text(svg); print(out, len(month or []), len(ever or []))
