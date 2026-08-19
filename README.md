# VDED — KORG volca drum GUI Editor

ブラウザ（Web MIDI API）から実機の **KORG volca drum** をエディットするためのコントロール
サーフェスです。音源は実機のみで、VDED は音を出しません。すべての操作は MIDI で実機へ送られます。

![tabs: PART EDIT / ALL LAYERS / FUNC / MIDI MAP](docs/screenshot.png)

---

## 動作環境

| 項目 | 要件 |
| --- | --- |
| ブラウザ | Web MIDI API 対応（Chrome / Edge / Opera などデスクトップの Chromium 系） |
| 接続 | PC → USB-MIDI インターフェイス → volca drum の MIDI IN |
| 実機ファームウェア | **v1.11 以降**（v1.10 以前は BIT の CC が正しく動作しません） |

## セットアップ

```sh
npm install
npm run dev       # http://localhost:5173
```

```sh
npm run build     # dist/ に静的ファイルを出力（そのままどこにでも置けます）
npm run preview
npm test          # CC マップと SELECT エンコードのテスト
```

## 実機側で最初に確認すること

VDED を使う前に、volca drum 本体で次の 2 つを設定してください。ここが合っていないと
**ノブを動かしても一切反応しません**。

1. **MIDI RX ShortMessage を ON。** OFF だとコントロールチェンジを受信しません。
2. **MIDI チャンネルを split channel（既定）に。**
   `●REC` を押しながら電源投入 → ステップボタンでチャンネル選択 → もう一度押すと
   `[MID 1--6]` 表示 → `●REC` で確定。

`MIDI Clock src` は、VDED のシーケンサに同期させるなら `Auto` にします。

## 2 つのチャンネルモード

| | **split channel**（推奨・工場出荷時） | single channel |
| --- | --- | --- |
| チャンネル | パート 1–6 → CH 1–6 | 全パートで 1 本 |
| レイヤ 1 / 2 の個別制御 | ○ | **×**（1 つの CC が両レイヤに効く） |
| BIT / FOLD / DRIVE / DRY GAIN | ○ | **×**（公式チャートに存在しない） |
| PAN / WG SEND | ○ | ○ |
| シーケンサから 6 パートを鳴らす | ○ | ×（鳴るのは選択中のパートのみ） |

VDED は両モードに対応していますが、single channel ではエディタの大半の機能が実機に届きません。
特別な理由がなければ split channel を使ってください。UI は現在のモードで送れないパラメータを
自動的に無効表示します。

## 画面

### 上部バー

- **DEVICE** — 接続中の MIDI 出力／入力を一覧・選択。名前に volca と drum を含むポートは
  ★ 付きで表示され、初回接続時に自動で選ばれます。`⟳` で再スキャン。
- **MODE / CH** — split / single の切り替えとベースチャンネル。使用するチャンネル範囲が横に出ます。
- **SEND ALL PARAMETERS** — 画面上のすべての値を CC で実機に一括送信します（下記）。
- **PANIC** — 使用中のノートに対してノートオフを送信。

### STEP SEQUENCER

6 パート × 16 ステップを一覧できるグリッド。

- クリックでステップの ON / OFF、そのままドラッグで塗り
- `Shift` + クリックでアクセント（velocity 127 → 96 → 64 を巡回）
- 行ごとに **M**（ミュート）/ **S**（ソロ）/ **▸**（試聴）、`‹ ›` シフト、`⚄` ランダマイズ、`✕` クリア
- 下段の **VELOCITY** レーンで、選択中パートのステップごとのベロシティを縦ドラッグ編集
- `BPM` / `SWING`（偶数ステップを最大 75% 後ろへ）/ `GATE`（ノート長 ms）/ `LEN`（1–16）
- **MIDI CLOCK** を ON にすると 24ppqn クロックと START / STOP も送信します

シーケンサは VDED 内蔵で、ノートを MIDI で送ることで実機を鳴らします（実機のシーケンサとは別物）。

### PART EDIT

選択中パートのレイヤ 1 / 2 を左右に並べて表示します。

- **SOURCE / MOD TYPE / AMP EG** — 実機の SELECT ノブは 45 通りを 1 つの値に詰め込んでいるため、
  3 つの軸に分解しています。合成後の CC 値も併記されます。
- **LEVEL / PITCH / EG ATTACK / EG RELEASE / MOD AMOUNT / MOD RATE** — レイヤごとのノブ。
- **LINK L1+2** — 両レイヤを同時に編集し、`L1+2` の CC 1 通で送信します。
- **PART PROCESSING** — WG SEND / PAN / BIT RED / FOLD / DRIVE / DRY GAIN。
  実機では EDIT ページの隠しパラメータにあたります。

ノブは縦ドラッグ、`Shift` で微調整、ダブルクリック（または右クリック）で初期値に戻ります。
キーボードの矢印キーでも操作できます。

### ALL LAYERS

6 パート × 2 レイヤ = 12 レイヤ分のパラメータを 1 つの表で俯瞰します。セルは上下ドラッグ、
ダブルクリックで直接入力。パート単位のパラメータは 2 行にまたがって表示されます。

### FUNC

実機の FUNC ボタンで使える機能の早見表と、VDED 側から実行できる代替操作。
MIDI リアルタイム（START / CONTINUE / STOP）、パートごとのトリガーノート番号、
実機側で設定が必要なグローバルパラメータもここにまとまっています。

### MIDI MAP

送信に使う CC 番号の一覧です。**すべて編集できます。** 手元の個体や将来のファームウェアで
番号が食い違った場合は、この表を直せば再ビルドなしで追従できます。
既定値から変更したセルはオレンジ色で表示され、`RESET TO DEFAULT` で戻せます。

送出間隔（既定: 通常 1.6 ms / 一括送信 4 ms）もここで調整します。取りこぼしがあるようなら
大きくしてください。

### PRESETS

キット（6 パートの全パラメータ＋ウェーブガイド）に名前を付けて保存します。
「パターンも含める」を ON にするとシーケンスも一緒に保存されます。

- プリセットはブラウザの localStorage に保存され、`EXPORT` / `IMPORT` で JSON ファイルとして
  やり取りできます
- 読み込み時に「読込時に実機へ送信」が ON なら、そのまま SEND ALL が走ります

## SEND ALL PARAMETERS について

volca drum は **システムエクスクルーシブに対応していません**。つまり:

- 実機の音色を読み出すことはできません（通信は片方向）
- プリセットは実機メモリではなくエディタ側に保存されます
- 画面の状態を実機に反映する唯一の方法が、全パラメータの CC 一括送信です

**SEND ALL PARAMETERS** は split channel で 124 通、single channel で 58 通の CC を、
取りこぼさない間隔で順に送信します。プリセットを読み込んだ直後や、実機を触ってしまって
画面と食い違ったときに押してください。パート単位なら PART EDIT の `SEND PART` が使えます。

## キーボードショートカット

| キー | 動作 |
| --- | --- |
| `Space` | 再生 / 停止 |
| `1`–`6` | パート選択 |
| `Shift` + `1`–`6` | そのパートを試聴 |
| `L` | LINK L1+2 の切り替え |
| `Ctrl` / `Cmd` + `S` | SEND ALL PARAMETERS |

## MIDI 実装について

CC マップの根拠、SELECT の値エンコード、single / split の差、出典は
[`docs/midi-implementation.md`](docs/midi-implementation.md) にまとめています。

## 既知の制約

- モーションシーケンス、チョーク、実機メモリ（プログラム／キット）の保存・呼び出しは
  MIDI から操作できません。実機のパネルで行ってください。
- 実機のノブを回しても VDED には反映されません（volca drum は CC を送信しません）。
  画面と実機がずれたら SEND ALL で揃えます。
- `PITCH MOD QUANT`（CC53）は公式チャートに記載がないため、既定では送信しません。
  MIDI MAP タブで有効化できます。

## ライセンス

MIT
