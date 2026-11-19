// THE WORDS, in six languages. English is the default; the player's choice (L on the title screen, or ?lang=ko in the address) is kept,
// else the browser's language if it is one of these, else English.
const LANGS = ['en', 'ko', 'ja', 'zh', 'es', 'pt'];
const LANG_NAME = { en: 'English', ko: '한국어', ja: '日本語', zh: '简体中文', es: 'Español', pt: 'Português' };
const WORDS = {
  en: {
    page: 'Rain Girl - Chapter 1', title: 'Rain Girl', chapter: 'Chapter 1 · The Burning Forest', start: 'Press Space to start',
    help: 'Move: arrows / WASD      Spray: Space / J      Water puts the fire out', lang: 'L: language',
    rankFail: 'Not on the board: {why}', clear: 'CLEAR', boardMonth: '— {month} —', boardLocal: '— this computer —', noScores: 'No scores yet',
    boardEver: '— best ever —', boardEverLocal: '— best ever (this computer) —', none: 'None yet', signedIn: '@{me} signed in', signInHint: 'Sign in with GitHub to keep your name',
    nbScore: 'Score {score} · {how}', nbClear: 'Cleared!', nbRound: 'Round {n}', nbGuest: 'or as a guest', nbName: 'Your name for the board', nbLocal: 'Your name for the board (this computer only)',
    asMe: 'Post as @{who}', sendFail: 'Could not post it: {why}', gh: 'Sign in with GitHub to post', out: 'Sign out', send: 'Post', skip: 'Skip',
    winTitle: 'Chapter 1 cleared!', winSub: 'Every fire in the forest is out\n\nScore {score}{best}\n\nPress R to play again',
    roundFlash: 'Round {n} / {of}   Wind {arrow}', noWater: 'Out of water', roundDone: 'Round {n} done  {stars}', roundStats: 'Time {s}s · hits {hits} · burnt {burnt}%',
    bestNew: '  (new best!)', best: '  (best {best})', halfBurnt: 'Half burnt', savedTree: 'Tree saved!', savedBush: 'Bush saved!',
    loseTitle: 'Ouch, hot!', loseSub: 'Down in round {n}\n\nScore {score}{best}\n\nPress R to try again', boss: 'Blue Fire Chief', score: 'Score {score}',
    wave: 'Fire monsters {m}  ·  Round {n} / {of}',
  },
  ko: {
    page: '우비소녀의 여행 - 1장', title: '우비소녀의 여행', chapter: '1장 · 불꽃 숲', start: 'Space 를 눌러 시작',
    help: '이동: 방향키 / WASD      물뿌리기: Space / J      불길은 물로 꺼요', lang: 'L: 언어',
    rankFail: '랭킹에 못 올렸어요: {why}', clear: '클리어', boardMonth: '— {month}의 랭킹 —', boardLocal: '— 이 컴퓨터의 랭킹 —', noScores: '아직 기록이 없어요',
    boardEver: '— 역대 최고 —', boardEverLocal: '— 역대 (이 컴퓨터) —', none: '아직 없어요', signedIn: '@{me} 로그인됨', signInHint: 'GitHub로 로그인하면 이름이 그대로',
    nbScore: '점수 {score} · {how}', nbClear: '클리어!', nbRound: '{n}라운드', nbGuest: '또는 손님 이름으로', nbName: '랭킹에 올릴 이름', nbLocal: '랭킹에 올릴 이름 (이 컴퓨터에만)',
    asMe: '@{who} 로 올리기', sendFail: '못 올렸어요: {why}', gh: 'GitHub로 로그인해서 올리기', out: '로그아웃', send: '올리기', skip: '안 올리기',
    winTitle: '1장 클리어!', winSub: '숲의 불이 모두 꺼졌어요\n\n점수 {score}{best}\n\nR 을 눌러 다시 하기',
    roundFlash: '라운드 {n} / {of}   바람 {arrow}', noWater: '물이 부족해요', roundDone: '라운드 {n} 완료  {stars}', roundStats: '시간 {s}초 · 맞음 {hits} · 탄 땅 {burnt}%',
    bestNew: '  (최고 기록!)', best: '  (최고 {best})', halfBurnt: '반쯤 탔어요', savedTree: '나무를 지켰다!', savedBush: '덤불을 지켰다!',
    loseTitle: '앗, 뜨거워!', loseSub: '라운드 {n} 에서 쓰러졌어요\n\n점수 {score}{best}\n\nR 을 눌러 다시 하기', boss: '대장 파란 불꽃', score: '점수 {score}',
    wave: '불꽃 몬스터 {m}  ·  라운드 {n} / {of}',
  },
  ja: {
    page: 'レインガール - 第1章', title: 'レインガール', chapter: '第1章 · 燃える森', start: 'Space でスタート',
    help: '移動: 矢印キー / WASD      水をまく: Space / J      炎は水で消そう', lang: 'L: 言語',
    rankFail: 'ランキングに載せられませんでした: {why}', clear: 'クリア', boardMonth: '— {month}のランキング —', boardLocal: '— このパソコンのランキング —', noScores: 'まだ記録がありません',
    boardEver: '— 歴代ベスト —', boardEverLocal: '— 歴代 (このパソコン) —', none: 'まだありません', signedIn: '@{me} でログイン中', signInHint: 'GitHub でログインすると名前がそのまま',
    nbScore: 'スコア {score} · {how}', nbClear: 'クリア!', nbRound: 'ラウンド {n}', nbGuest: 'またはゲストの名前で', nbName: 'ランキングに載せる名前', nbLocal: 'ランキングに載せる名前 (このパソコンだけ)',
    asMe: '@{who} で載せる', sendFail: '載せられませんでした: {why}', gh: 'GitHub でログインして載せる', out: 'ログアウト', send: '載せる', skip: '載せない',
    winTitle: '第1章クリア!', winSub: '森の火はすべて消えました\n\nスコア {score}{best}\n\nR でもう一度',
    roundFlash: 'ラウンド {n} / {of}   風 {arrow}', noWater: '水が足りません', roundDone: 'ラウンド {n} 完了  {stars}', roundStats: '時間 {s}秒 · 被弾 {hits} · 焼けた地面 {burnt}%',
    bestNew: '  (新記録!)', best: '  (最高 {best})', halfBurnt: '半分焼けました', savedTree: '木を守った!', savedBush: '茂みを守った!',
    loseTitle: 'あつっ!', loseSub: 'ラウンド {n} で倒れました\n\nスコア {score}{best}\n\nR でもう一度', boss: '青い炎の親分', score: 'スコア {score}',
    wave: '炎モンスター {m}  ·  ラウンド {n} / {of}',
  },
  zh: {
    page: '雨衣女孩 - 第1章', title: '雨衣女孩', chapter: '第1章 · 燃烧的森林', start: '按 Space 开始',
    help: '移动: 方向键 / WASD      洒水: Space / J      用水扑灭火焰', lang: 'L: 语言',
    rankFail: '没能上榜: {why}', clear: '通关', boardMonth: '— {month}排行榜 —', boardLocal: '— 本机排行榜 —', noScores: '还没有记录',
    boardEver: '— 历史最佳 —', boardEverLocal: '— 历史 (本机) —', none: '还没有', signedIn: '@{me} 已登录', signInHint: '用 GitHub 登录, 名字不变',
    nbScore: '分数 {score} · {how}', nbClear: '通关!', nbRound: '第 {n} 轮', nbGuest: '或用访客名字', nbName: '上榜用的名字', nbLocal: '上榜用的名字 (仅本机)',
    asMe: '以 @{who} 上榜', sendFail: '没能上榜: {why}', gh: '用 GitHub 登录并上榜', out: '退出登录', send: '上榜', skip: '不上榜',
    winTitle: '第1章通关!', winSub: '森林里的火全灭了\n\n分数 {score}{best}\n\n按 R 再玩一次',
    roundFlash: '第 {n} / {of} 轮   风 {arrow}', noWater: '水不够了', roundDone: '第 {n} 轮完成  {stars}', roundStats: '时间 {s}秒 · 被击中 {hits} · 烧毁 {burnt}%',
    bestNew: '  (新纪录!)', best: '  (最佳 {best})', halfBurnt: '烧了一半', savedTree: '保住了树!', savedBush: '保住了灌木!',
    loseTitle: '好烫!', loseSub: '在第 {n} 轮倒下了\n\n分数 {score}{best}\n\n按 R 再试一次', boss: '蓝火首领', score: '分数 {score}',
    wave: '火焰怪物 {m}  ·  第 {n} / {of} 轮',
  },
  es: {
    page: 'Rain Girl - Capítulo 1', title: 'Rain Girl', chapter: 'Capítulo 1 · El bosque en llamas', start: 'Pulsa Espacio para empezar',
    help: 'Mover: flechas / WASD      Rociar: Espacio / J      El agua apaga el fuego', lang: 'L: idioma',
    rankFail: 'No entró en la tabla: {why}', clear: 'FIN', boardMonth: '— {month} —', boardLocal: '— este ordenador —', noScores: 'Aún no hay puntuaciones',
    boardEver: '— lo mejor —', boardEverLocal: '— lo mejor (este ordenador) —', none: 'Aún nada', signedIn: '@{me} conectado', signInHint: 'Entra con GitHub para usar tu nombre',
    nbScore: 'Puntos {score} · {how}', nbClear: '¡Completado!', nbRound: 'Ronda {n}', nbGuest: 'o como invitado', nbName: 'Tu nombre para la tabla', nbLocal: 'Tu nombre para la tabla (solo este ordenador)',
    asMe: 'Publicar como @{who}', sendFail: 'No se pudo publicar: {why}', gh: 'Entrar con GitHub y publicar', out: 'Salir', send: 'Publicar', skip: 'Omitir',
    winTitle: '¡Capítulo 1 completado!', winSub: 'Todos los fuegos del bosque están apagados\n\nPuntos {score}{best}\n\nPulsa R para jugar otra vez',
    roundFlash: 'Ronda {n} / {of}   Viento {arrow}', noWater: 'Sin agua', roundDone: 'Ronda {n} terminada  {stars}', roundStats: 'Tiempo {s}s · golpes {hits} · quemado {burnt}%',
    bestNew: '  (¡récord!)', best: '  (récord {best})', halfBurnt: 'Medio quemado', savedTree: '¡Árbol salvado!', savedBush: '¡Arbusto salvado!',
    loseTitle: '¡Ay, quema!', loseSub: 'Caíste en la ronda {n}\n\nPuntos {score}{best}\n\nPulsa R para intentarlo otra vez', boss: 'Jefe Fuego Azul', score: 'Puntos {score}',
    wave: 'Monstruos de fuego {m}  ·  Ronda {n} / {of}',
  },
  pt: {
    page: 'Rain Girl - Capítulo 1', title: 'Rain Girl', chapter: 'Capítulo 1 · A floresta em chamas', start: 'Aperte Espaço para começar',
    help: 'Mover: setas / WASD      Borrifar: Espaço / J      A água apaga o fogo', lang: 'L: idioma',
    rankFail: 'Não entrou no placar: {why}', clear: 'FIM', boardMonth: '— {month} —', boardLocal: '— este computador —', noScores: 'Ainda sem pontuações',
    boardEver: '— melhores de todos —', boardEverLocal: '— melhores (este computador) —', none: 'Ainda nada', signedIn: '@{me} conectado', signInHint: 'Entre com o GitHub para usar seu nome',
    nbScore: 'Pontos {score} · {how}', nbClear: 'Concluído!', nbRound: 'Rodada {n}', nbGuest: 'ou como convidado', nbName: 'Seu nome no placar', nbLocal: 'Seu nome no placar (só este computador)',
    asMe: 'Publicar como @{who}', sendFail: 'Não deu para publicar: {why}', gh: 'Entrar com GitHub e publicar', out: 'Sair', send: 'Publicar', skip: 'Pular',
    winTitle: 'Capítulo 1 concluído!', winSub: 'Todo o fogo da floresta apagado\n\nPontos {score}{best}\n\nAperte R para jogar de novo',
    roundFlash: 'Rodada {n} / {of}   Vento {arrow}', noWater: 'Sem água', roundDone: 'Rodada {n} concluída  {stars}', roundStats: 'Tempo {s}s · golpes {hits} · queimado {burnt}%',
    bestNew: '  (novo recorde!)', best: '  (recorde {best})', halfBurnt: 'Meio queimada', savedTree: 'Árvore salva!', savedBush: 'Arbusto salvo!',
    loseTitle: 'Ai, que quente!', loseSub: 'Caiu na rodada {n}\n\nPontos {score}{best}\n\nAperte R para tentar de novo', boss: 'Chefe Fogo Azul', score: 'Pontos {score}',
    wave: 'Monstros de fogo {m}  ·  Rodada {n} / {of}',
  },
};
let LANG = (() => {
  const q = new URLSearchParams(location.search).get('lang'); if (LANGS.includes(q)) { try { localStorage.setItem('rain-girl-lang', q); } catch (e) {} return q; }
  try { const s = localStorage.getItem('rain-girl-lang'); if (LANGS.includes(s)) return s; } catch (e) {}
  const b = (navigator.languages || [navigator.language || 'en']).map((l) => String(l).slice(0, 2).toLowerCase()).find((l) => LANGS.includes(l)); return b || 'en';
})();
function T(key, v = {}) { const s = (WORDS[LANG] && WORDS[LANG][key]) ?? WORDS.en[key] ?? key; return s.replace(/\{(\w+)\}/g, (_, k) => (k in v ? v[k] : `{${k}}`)); }
function monthName() { try { return new Date().toLocaleDateString({ en: 'en', ko: 'ko', ja: 'ja', zh: 'zh-CN', es: 'es', pt: 'pt-BR' }[LANG], { month: 'long' }); } catch (e) { return String(new Date().getMonth() + 1); } }
function setLang(l) { LANG = l; try { localStorage.setItem('rain-girl-lang', l); } catch (e) {} document.documentElement.lang = l; document.title = T('page'); }
