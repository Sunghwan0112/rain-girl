<h1 align="center">レインガール</h1>

<p align="center"><b>雨の森が燃えています。黄色いレインコートの少女の傘には、水がいっぱい。</b><br>
ブラウザですぐ遊べる小さなピクセルアートのアクションゲーム - インストールも登録もいりません。</p>

<p align="center"><a href="https://sunghwan0112.github.io/rain-girl/"><b>▶ いますぐ遊ぶ</b></a> &nbsp;·&nbsp; <a href="#how">遊び方</a> &nbsp;·&nbsp; <a href="#board">ランキング</a> &nbsp;·&nbsp; <a href="#made">作り方</a></p>

<p align="center"><a href="https://sunghwan0112.github.io/rain-girl/"><img src="docs/play.gif" alt="Rain Girl: 雨の中、少女が傘を振って炎のモンスターに水をかけている" width="100%"></a></p>

<p align="center"><a href="README.md">English</a> · <a href="README.ko.md">한국어</a> · <b>日本語</b> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> <i>(タイトル画面で L を押すとゲームの言語が変わります)</i></p>

<a name="how"></a>
## 遊び方

| | |
|---|---|
| **移動** | 矢印キー / WASD |
| **傘を振る (水をかける)** | Space / J |
| **言語を変える** | タイトル画面で L |
| **もう一度** | R |
| **スマホ・タブレット** | 左の親指: 移動 · 右の親指: 傘をふる · タップでスタート (自動でタッチ操作に切り替わります) |

炎のモンスターが森を跳ねまわります。降りた場所の草に火がつき、火は広がり、燃える地面は道をふさぎ、木にも燃え移ります。森が焼ける前に、モンスターと残した火を消してください。

- **水はなくなります。** 振るたびに水が減り、雨がまた満たします。水たまりに立つと3倍の速さでたまります。
- **風はラウンドごとに変わります。** 雨が風で傾き、木がしなり、火も風下へ広がります。
- **木を守る。** 火のついた木は4秒以内に水をかければ助かります。遅れると半分焼け、放っておくと焼け落ちます。
- **水たまりへ誘いこむ。** 炎が水たまりに降りるとジュッと音がして体力が1つ減ります。小さな炎なら2〜3回で消えます。ただしそのぶん水たまりは煮えて早く乾きます。
- **物陰を使う。** 火の玉は岩と木の幹で止まります。ただし当たった緑の木には火がつくことがあります。
- **スコアは森で決まります。** 消した火、かかった時間、森がどれだけ焼けずに残ったか。当たると減点。ラウンドごとに星は最大3つ。

赤・緑・紫・青の炎が出る**全10ラウンド**。緑は速くてよく広がり、紫は火の玉を3つ投げ、青は水がたくさん必要です。最後のラウンドには王冠をかぶった青いボスが出ます。

<p align="center"><img src="docs/title.png" alt="タイトル画面: 今月のランキングと歴代ベスト" width="80%"></p>

<a name="board"></a>
## ランキング

<p align="center"><img src="leaderboard.svg" alt="Rain Girl のランキング: 今月のトップ10と歴代トップ3"></p>

今月のトップ10と歴代トップ3が、ゲームのタイトル画面とここに出ます。ゲームが終わったら **GitHub でサインイン**して GitHub の名前 (**@** つき) で送るか、ゲストとして送れます。スコアはすべてデータベースが先に確かめます。実際のプレイでは出せないスコアは断られ、他人の GitHub 名では送れません。上の画像は30分ごとに描き直されます。

<a name="made"></a>
## 作り方

少女、木、岩、茂みは **[SpriteCast](https://github.com/Sunghwan0112/spritecast)** で作りました。3Dモデルを、ゲームのカメラ角度のピクセルアートのスプライトにする Claude Code のスキルです。

<p align="center"><img src="docs/props.png" alt="ゲームの小物スプライト28枚: 木、半分焼けた木、焼けた木、茂み、切り株、岩、キノコの4面とその影" width="100%"></p>

- **少女**: イラスト1枚 → 3Dモデル → リグをつけた歩き・振り・立ちを、ゲームの2:1アイソメトリックカメラで4方向にレンダー → フレームごとに96pxのピクセルアートに描き直しました。少女がかける水も、3Dのエフェクトを同じ方法で描いたものです。
- **森**: 3Dモデルから作った小物7つを4面ずつ、すべて48色のパレット1つにそろえました。プレイのたびに1面がランダムに出るので、森は毎回ちがいます。燃えた木は立っていた面のまま、半分焼けた木、焼けた木に変わります。
- **同じ光、本物の影**: すべての小物が同じ太陽に照らされ、地面の影は3Dモデルから焼いたものです。幹のそばは濃く、葉が落とす影は淡い。少女も木陰に入ると暗くなります。
- **3Dはゲームの中でも働く**: 火の玉がどこで止まるかは、各モデルを火の玉の高さで切って決めています。幹は止め、その上の葉は止めません。
- **葉にふく風**: 木は枝ごとにゆれます。葉を3Dモデル上の位置でかたまりに分け、かたまりごとに1pxずつ動かします - そのラウンドの風の向きに、突風ではもっと強く。手描きのフレームはありません。キノコはじっと立っていて、突風のときだけ傘が1px傾きます。傘は赤、オレンジ、ワイン色があります。
- **天気**: 炎に照らされた雨の夜、稲妻と雷、水たまりの波紋、地面によって変わる足音、鳴った場所から聞こえる音。

ルールとすべての数値は [DESIGN.md](DESIGN.md) にあります。

## 自分で動かす

静的なページなので、どんなウェブサーバーでも動きます。

```
git clone https://github.com/Sunghwan0112/rain-girl.git
cd rain-girl && python3 -m http.server 8000      # そのあと http://localhost:8000 を開く
```

オンラインのランキングを設定しなければ、ゲームはブラウザの中にランキングを保存します。

<details><summary><b>自分のオンラインランキング (Supabase、無料)</b></summary>

1. Supabase のプロジェクトを作り、SQL Editor で `supabase/schema.sql` を実行します。テーブル、ルール、スコアの検査ができます。
2. Authentication -> Providers -> GitHub をオンにします。GitHub OAuth アプリの callback は `https://<project>.supabase.co/auth/v1/callback` です。
   Authentication -> URL Configuration に、ゲームのアドレスを Site URL と Redirect URL として入れます。
3. プロジェクトの URL と anon キーを `ranking-config.js` に入れます。anon キーはもともと公開用です。テーブルは誰でも読め、検査を通ったスコアだけを追加できます。
4. `.github/workflows/leaderboard.yml` が30分ごとに `leaderboard.svg` を描き直します (`tools/leaderboard_svg.py`)。

</details>

## クレジット

- **エンジン**: [Phaser 3](https://phaser.io) (MIT)
- **フォント**: Lee Minseo さんの [Galmuri11](https://github.com/quiple/galmuri) (SIL OFL 1.1、`assets/font/OFL.md`)
- **絵**: [SpriteCast](https://github.com/Sunghwan0112/spritecast)、Tripo の3Dモデル、GPT の画像モデルで作りました
- **音**: [Kenney](https://kenney.nl) と OpenGameArt の CC0 効果音、コードで作った音、Suno で作った音楽 - [`assets/audio/CREDITS.md`](assets/audio/CREDITS.md)

## ライセンス

**コード**は MIT です。ゲームの**絵、音楽、名前**は MIT ではなく、すべての権利を保有しています。遊ぶ、読む、コードから学ぶのは歓迎ですが、ゲームの絵と音楽を再公開したり販売したりはできません。ほかの方の作品 (Phaser、フォント、CC0 の効果音) はそれぞれのライセンスに従います。[LICENSE](LICENSE) をご覧ください。
