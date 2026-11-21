<h1 align="center">Rain Girl</h1>

<p align="center"><b>Uma floresta na chuva está pegando fogo. Uma menina de capa de chuva amarela tem um guarda-chuva cheio de água.</b><br>
Um pequeno jogo de ação em pixel art para jogar no navegador: sem instalar nada e sem conta.</p>

<p align="center"><a href="https://sunghwan0112.github.io/rain-girl/"><b>▶ Jogar agora</b></a> &nbsp;·&nbsp; <a href="#how">Como jogar</a> &nbsp;·&nbsp; <a href="#board">Ranking</a> &nbsp;·&nbsp; <a href="#made">Como foi feito</a></p>

<p align="center"><a href="https://sunghwan0112.github.io/rain-girl/"><img src="docs/play.gif" alt="Rain Girl: a menina balança o guarda-chuva e joga água nos monstros de fogo na chuva" width="100%"></a></p>

<p align="center"><a href="README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.ja.md">日本語</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.es.md">Español</a> · <b>Português</b> <i>(aperte L na tela de título para trocar o idioma do jogo)</i></p>

<a name="how"></a>
## Como jogar

| | |
|---|---|
| **Mover** | setas / WASD |
| **Balançar o guarda-chuva (jogar água)** | Space / J - de novo durante o golpe: um revés giratório |
| **Trocar o idioma** | L, na tela de título |
| **Jogar de novo** | R |
| **No celular ou tablet** | polegar esquerdo: mover · polegar direito: balançar o guarda-chuva · toque para começar (o jogo muda para toque sozinho) |

Monstros de fogo pulam pela floresta. Onde eles caem, a grama pega fogo; o fogo se espalha, o chão em chamas bloqueia o caminho e as árvores queimam. Apague os monstros, e os fogos que eles deixam, antes que a floresta queime.

- **A água acaba.** Cada golpe gasta água; a chuva enche o tanque de novo, três vezes mais rápido se você estiver numa poça. Uma poção deixada por um fogo aumenta o tanque.
- **O vento muda a cada rodada.** A chuva se inclina com ele, as árvores se dobram e o fogo se espalha na direção dele.
- **Salve as árvores.** Uma árvore que pega fogo pode ser salva com água em 4 segundos. Depois disso fica meio queimada; se você deixar, queima inteira.
- **Leve-os para a água.** Um fogo que cai numa poça chia e perde uma vida: duas ou três quedas apagam um pequeno. Mas ele ferve a poça, que seca mais rápido.
- **Use cobertura.** As bolas de fogo se quebram em pedras e troncos, mas uma árvore verde atingida pode pegar fogo.
- **A pontuação olha a floresta.** Fogos apagados, tempo e quanto da floresta sobrou; levar golpes tira pontos. Até três estrelas por rodada.

**Dez rodadas** de fogos vermelhos, verdes, roxos e azuis: os verdes são rápidos e se espalham, os roxos jogam três bolas de fogo, os azuis precisam de mais água. Na última, um chefe azul de coroa.

<p align="center"><img src="docs/title.png" alt="A tela de título: o ranking do mês e o melhor de todos os tempos" width="80%"></p>

<a name="board"></a>
## Ranking

<p align="center"><img src="leaderboard.svg" alt="Ranking de Rain Girl: os dez melhores do mês e os três melhores de todos os tempos"></p>

Os dez melhores do mês e os três melhores de todos os tempos, na tela de título do jogo e aqui. No fim de uma partida, **entre com o GitHub** para enviar com seu nome do GitHub (marcado com **@**), ou envie como convidado. O banco de dados confere cada pontuação antes de mostrá-la: uma pontuação que um jogo de verdade não consegue fazer é recusada, e ninguém pode enviar com o nome do GitHub de outra pessoa. A imagem acima é redesenhada a cada meia hora.

<a name="made"></a>
## Como foi feito

A menina, as árvores, as pedras e os arbustos foram feitos com o **[SpriteCast](https://github.com/Sunghwan0112/spritecast)**, uma skill do Claude Code que transforma um modelo 3D em sprites de pixel art no ângulo de câmera do jogo.

<p align="center"><img src="docs/props.png" alt="Os 28 sprites de objetos do jogo: quatro lados de uma árvore, uma árvore meio queimada, uma árvore queimada, um arbusto, um toco, uma pedra e cogumelos, cada um com sua sombra" width="100%"></p>

- **A menina**: uma ilustração, um modelo 3D, e uma caminhada, um golpe e uma pose parada com rig, renderizados na câmera isométrica 2:1 do jogo em quatro direções; cada quadro redesenhado como pixel art de 96 px. A água que ela joga é um efeito 3D desenhado do mesmo jeito.
- **A floresta**: sete objetos feitos a partir de modelos 3D, quatro lados cada, todos numa única paleta de 48 cores. Cada um mostra um lado ao acaso, então nenhuma floresta é igual à outra; uma árvore que queima fica meio queimada e depois queimada, do lado em que estava.
- **Uma luz só, sombras de verdade**: todos os objetos são iluminados pelo mesmo sol, e a sombra no chão é assada do modelo 3D: escura junto ao tronco, mais clara onde cai da copa. Se a menina entra na sombra de uma árvore, ela também escurece.
- **O 3D continua trabalhando**: onde uma bola de fogo se quebra vem de cada modelo, cortado na altura da bola: um tronco a para, a copa acima não.
- **Vento nas folhas**: as copas balançam galho a galho. As folhas são agrupadas por onde estão no modelo 3D e cada grupo se move inteiro, um pixel por vez, com o vento da rodada e mais forte numa rajada. Sem quadros desenhados à mão. Os cogumelos ficam parados e só cedem um pixel no chapéu quando uma rajada os empurra; os chapéus são vermelhos, laranja e cor de vinho.
- **O tempo**: uma noite escura de chuva iluminada pelos fogos, raios e trovões, anéis de chuva nas poças, passos conforme o chão que ela pisa, e som vindo de onde acontece.

As regras e todos os números estão em [DESIGN.md](DESIGN.md).

## Rode você mesmo

É uma página estática: qualquer servidor web serve.

```
git clone https://github.com/Sunghwan0112/rain-girl.git
cd rain-girl && python3 -m http.server 8000      # depois abra http://localhost:8000
```

Sem o ranking online configurado, o jogo guarda um ranking no seu navegador.

<details><summary><b>Seu próprio ranking online (Supabase, grátis)</b></summary>

1. Crie um projeto no Supabase e rode `supabase/schema.sql` no SQL Editor: a tabela, as regras e as conferências de pontuação.
2. Authentication -> Providers -> GitHub: ligue, com um app OAuth do GitHub cujo callback seja `https://<project>.supabase.co/auth/v1/callback`.
   Authentication -> URL Configuration: o endereço do seu jogo como Site URL e nas Redirect URLs.
3. Coloque a URL do projeto e a chave anon em `ranking-config.js`. A chave anon é pública por design: a tabela só deixa ler o ranking e adicionar uma pontuação conferida.
4. `.github/workflows/leaderboard.yml` redesenha `leaderboard.svg` a cada meia hora (`tools/leaderboard_svg.py`).

</details>

## Créditos

- **Motor**: [Phaser 3](https://phaser.io) (MIT)
- **Fonte**: [Galmuri11](https://github.com/quiple/galmuri) de Lee Minseo (SIL OFL 1.1, `assets/font/OFL.md`)
- **Arte**: feita com o [SpriteCast](https://github.com/Sunghwan0112/spritecast), modelos 3D da Tripo e modelos de imagem do GPT
- **Efeitos**: acertos, fogos apagados, bolas de fogo, itens e os anéis do revés são do [PVFX Foundry](https://nerijs.itch.io/pvfx-foundry) da Pixel VFX Studio (CC0 1.0) - [`assets/fx/CREDITS.md`](assets/fx/CREDITS.md) · [`assets/items/CREDITS.md`](assets/items/CREDITS.md).
- **Som**: sons CC0 de [Kenney](https://kenney.nl) e OpenGameArt, alguns feitos em código; música feita com Suno: veja [`assets/audio/CREDITS.md`](assets/audio/CREDITS.md)

## Licença

O **código** é MIT. A **arte, a música e o nome** do jogo não são: todos os direitos reservados. Jogue, leia e aprenda com o código, mas não publique de novo nem venda as imagens e a música do jogo. O trabalho de outras pessoas (Phaser, a fonte, os sons CC0) mantém a própria licença. Veja [LICENSE](LICENSE).
