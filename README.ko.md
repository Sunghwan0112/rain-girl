<h1 align="center">우비소녀의 여행 · Rain Girl</h1>

<p align="center"><b>비 오는 숲에 불이 났어요. 노란 우비를 입은 소녀에게는 물이 가득 담긴 우산이 있어요.</b><br>
브라우저에서 바로 하는 작은 픽셀 아트 액션 게임 - 설치도, 가입도 필요 없어요.</p>

<p align="center"><a href="https://sunghwan0112.github.io/rain-girl/"><b>▶ 지금 플레이하기</b></a> &nbsp;·&nbsp; <a href="#하는-법">하는 법</a> &nbsp;·&nbsp; <a href="#랭킹">랭킹</a> &nbsp;·&nbsp; <a href="#만든-방법">만든 방법</a></p>

<p align="center"><a href="https://sunghwan0112.github.io/rain-girl/"><img src="docs/play.gif" alt="우비소녀의 여행: 비 오는 숲에서 소녀가 우산을 휘둘러 불꽃 몬스터에게 물을 뿌리는 장면" width="100%"></a></p>

<p align="center"><a href="README.md">English</a> · <b>한국어</b> · <a href="README.ja.md">日本語</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> <i>(게임 언어는 시작 화면에서 L)</i></p>

## 하는 법

| | |
|---|---|
| **이동** | 방향키 / WASD |
| **우산 휘두르기** (물 뿌리기) | Space / J |
| **언어 바꾸기** | 시작 화면에서 L |
| **다시 하기** | R |

불꽃 몬스터가 숲을 뛰어다녀요. 몬스터가 내려앉은 자리에 풀이 타기 시작하고, 불은 번지고, 타는 땅은 길을 막고, 나무에도 불이
붙어요. 숲이 다 타기 전에 몬스터와 몬스터가 남긴 불을 꺼 주세요.

- **물은 떨어져요.** 휘두를 때마다 물이 줄고, 비가 다시 채워 줘요. 웅덩이에 서 있으면 세 배 빨리 차요.
- **바람은 라운드마다 바뀌어요.** 비가 바람 따라 기울고, 나무가 흔들리고, 불도 바람 쪽으로 번져요.
- **나무를 지켜요.** 불붙은 나무는 4초 안에 물을 뿌리면 살아나요. 늦으면 반쯤 타고, 그대로 두면 다 타 버려요.
- **물웅덩이로 유인해요.** 불꽃이 웅덩이에 내려앉으면 치익 하고 체력이 하나 줄어요. 작은 불꽃은 두세 번이면 꺼져요. 대신
  웅덩이도 그만큼 끓어서 빨리 말라요.
- **엄폐물을 써요.** 불덩이는 바위와 나무 줄기에 막혀요. 다만 맞은 초록 나무에 불이 붙을 수도 있어요.
- **점수는 숲을 봐요.** 끈 불, 걸린 시간, 숲이 얼마나 덜 탔는지로 매기고, 맞으면 깎여요. 라운드마다 별 최대 3개.

빨강, 초록, 보라, 파랑 불꽃이 나오는 **10라운드**예요. 초록은 빠르고 잘 번지고, 보라는 불덩이 세 개를 던지고, 파랑은 물이
더 많이 들어요. 마지막 라운드에는 왕관을 쓴 파란 대장 불꽃이 나와요.

<p align="center"><img src="docs/title.png" alt="시작 화면: 이번 달 랭킹과 역대 최고" width="80%"></p>

## 랭킹

<p align="center"><img src="leaderboard.svg" alt="우비소녀의 여행 랭킹: 이번 달 TOP 10과 역대 TOP 3"></p>

이번 달 TOP 10과 역대 TOP 3이 게임 시작 화면과 여기에 나와요. 게임이 끝나면 **GitHub로 로그인**해서 GitHub 이름(**@** 표시)으로
올리거나, 손님 이름으로 올릴 수 있어요. 모든 점수는 데이터베이스가 먼저 검사해요. 실제 게임으로 나올 수 없는 점수는 거절하고,
남의 GitHub 이름으로는 올릴 수 없어요. 위 그림은 30분마다 새로 그려져요.

## 만든 방법

소녀, 나무, 바위, 덤불은 **[SpriteCast](https://github.com/Sunghwan0112/spritecast)**로 만들었어요. 3D 모델을 게임 카메라 각도의
픽셀 아트 스프라이트로 바꿔 주는 Claude Code 스킬이에요.

<p align="center"><img src="docs/props.png" alt="게임의 소품 스프라이트 28개: 나무, 반쯤 탄 나무, 다 탄 나무, 덤불, 그루터기, 바위, 버섯의 네 면과 그림자" width="100%"></p>

- **소녀**: 일러스트 한 장 → 3D 모델 → 뼈대를 넣은 걷기, 휘두르기, 서 있기를 게임의 2:1 아이소 카메라로 네 방향 렌더 → 프레임마다
  96px 픽셀 아트로 다시 그렸어요. 소녀가 뿌리는 물도 3D 효과를 같은 방식으로 그린 거예요.
- **숲**: 3D 모델로 만든 소품 일곱 개를 네 면씩, 모두 48색 팔레트 하나로 맞췄어요. 판마다 한 면이 무작위로 나와서 숲이 매번
  달라요. 불탄 나무는 서 있던 면 그대로 반쯤 탄 나무, 다 탄 나무로 바뀌어요.
- **같은 빛, 진짜 그림자**: 모든 소품이 같은 해에서 빛을 받고, 땅 그림자는 3D 모델에서 구웠어요. 줄기 옆은 진하고, 나뭇잎이 드리운
  곳은 옅어요. 소녀도 나무 그늘에 들어가면 어두워져요.
- **3D는 게임 안에서도 쓰여요**: 불덩이가 어디서 막히는지는 각 모델을 불덩이 높이에서 잘라 정해요. 줄기는 막고, 그 위 나뭇잎은
  안 막아요.
- **나뭇잎의 바람**: 나무가 가지 단위로 흔들려요. 나뭇잎을 3D 모델 위의 위치대로 뭉치로 나누고, 뭉치마다 통째로 1px씩
  움직여요 - 라운드의 바람 쪽으로, 돌풍에는 더 세게. 손으로 그린 프레임은 없어요.
  버섯은 가만히 서 있다가 돌풍이 지나갈 때만 갓이 한 픽셀 기울어요. 갓 색은 빨강, 주황, 와인색이 있어요.
- **날씨**: 불빛이 비추는 비 오는 밤, 번개와 천둥, 웅덩이의 빗물 고리, 바닥에 따라 다른 발소리, 소리가 난 쪽에서 들리는 효과음.

규칙과 모든 수치는 [DESIGN.md](DESIGN.md)에 있어요.

## 직접 실행하기

정적 페이지라 아무 웹 서버로나 돼요.

```
git clone https://github.com/Sunghwan0112/rain-girl.git
cd rain-girl && python3 -m http.server 8000      # 그다음 http://localhost:8000 열기
```

온라인 랭킹을 설정하지 않으면 게임이 브라우저 안에 랭킹을 저장해요.

<details><summary><b>나만의 온라인 랭킹 (Supabase, 무료)</b></summary>

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql`을 실행해요. 표, 규칙, 점수 검사가 만들어져요.
2. Authentication -> Providers -> GitHub를 켜요. GitHub OAuth 앱의 callback은 `https://<project>.supabase.co/auth/v1/callback`이에요.
   Authentication -> URL Configuration에 게임 주소를 Site URL과 Redirect URL로 넣어요.
3. 프로젝트 URL과 anon 키를 `ranking-config.js`에 넣어요. anon 키는 원래 공개용이에요. 표는 누구나 읽고, 검사를 통과한 점수만
   추가할 수 있어요.
4. `.github/workflows/leaderboard.yml`이 30분마다 `leaderboard.svg`를 다시 그려요(`tools/leaderboard_svg.py`).

</details>

## 만든 것들

- **엔진**: [Phaser 3](https://phaser.io) (MIT)
- **글꼴**: 이민서 님의 [Galmuri11](https://github.com/quiple/galmuri) (SIL OFL 1.1, `assets/font/OFL.md`)
- **그림**: [SpriteCast](https://github.com/Sunghwan0112/spritecast), Tripo 3D 모델, GPT 이미지 모델로 만들었어요
- **소리**: [Kenney](https://kenney.nl)와 OpenGameArt의 CC0 효과음, 코드로 만든 소리, Suno로 만든 음악 -
  [`assets/audio/CREDITS.md`](assets/audio/CREDITS.md)

## 라이선스

**코드**는 MIT예요. 게임의 **그림, 음악, 이름**은 MIT가 아니고 모든 권리를 보유해요. 플레이하고, 읽고, 코드에서 배우는 건
환영이지만, 게임의 그림과 음악을 다시 올리거나 팔 수는 없어요. 다른 분들의 것(Phaser, 글꼴, CC0 효과음)은 각자의 라이선스를
따라요. [LICENSE](LICENSE)를 보세요.
