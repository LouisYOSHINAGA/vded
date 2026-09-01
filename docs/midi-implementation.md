# volca drum MIDI 実装メモ

VDED が送信する MIDI メッセージの根拠をまとめる。実装は `src/midi/ccmap.ts` がこの文書の
機械可読版であり、値がずれた場合はアプリ内の **MIDI MAP** パネルから CC 番号を上書きできる。

## 0. 出典

| 記号 | 出典 | 信頼度 |
| --- | --- | --- |
| `OFFICIAL-SINGLE` | KORG 公式 `volca_drum_single_ch_MIDI_Chart_J1.pdf`（本リポジトリ作成時に添付されたもの） | 一次資料 |
| `OFFICIAL-SPLIT` | KORG 公式 `volca_drum_split_ch_MIDI_Chart_E1.pdf`（パラメータ名の一覧のみ取得） | 一次資料（番号は下記で照合） |
| `CROSS` | 実働する既存エディタ／ハードウェアコントローラの実装と一致を確認 | 二次資料・実機動作で確認済み |

`CROSS` の照合先:

- `sensai7/CCVDrum`（Volca Drum 用 MIDI CC コントローラ基板のファームウェア）
  `CCValues[] = {0x31, 0x32, 0x33, 0x0A, 0x34}` = BIT(49) / FOLD(50) / DRIVE(51) / PAN(10) / GAIN(52)、
  送信チャンネルは `0xB0 + part`（パート n → ch n）。レイヤ選択ボタンは CC 14 / 15 / 16。
- `synthmata` の volca drum Web エディタ（`data-cclsb` 属性に CC 番号が埋まっている）。
  下表の split 番号すべてと SELECT の値エンコードが一致。

## 1. 基本仕様（OFFICIAL-SINGLE より）

| 項目 | 受信 | 送信 |
| --- | --- | --- |
| Basic Channel | 1–16（設定可） | × |
| Note On | ○ `9nH` v=1–127 | × |
| Note Off | × | × |
| After Touch / Pitch Bend | × | × |
| Control Change | ○ | × |
| Program Change | × | × |
| **System Exclusive** | **×** | **×** |
| Song Pos / Song Sel / Tune | × | × |
| Clock | ○ | × |
| Start / Stop / Continue | ○ | × |
| Local On/Off, All Notes Off, Active Sensing, Reset | × | × |

**重要な帰結:**

1. **SysEx が無い。** 音色のバルクダンプ／リクエストは不可能。よってプリセットの保存・読込は
   すべてエディタ側で行い、実機への反映は CC の一括送信（SEND ALL）で実現する。
   実機から現在値を吸い上げることもできない（片方向）。
2. **Program Change が無い。** 実機のプログラム／キットメモリはパネル操作でしか呼べない。
3. ノートナンバーは音色選択に使われない（「どのノートナンバーを受信しても同じ音が発音する」）。
   どのパートが鳴るかは MIDI チャンネルで決まる。
4. CC 受信はグローバルパラメータ `MIDI RX ShortMessage` が ON のときのみ有効（公式注記 *1）。
5. Clock はグローバルパラメータ `MIDI Clock src` が `Internal` のとき受信しない。
   `Auto` のとき受信する（公式注記 *2）。

## 2. Single channel mode（OFFICIAL-SINGLE）

全パートが 1 本の MIDI チャンネルを共有する。**レイヤ 1 / 2 を独立に制御できない**
（1 つの CC がレイヤ 1 と 2 の両方に効く。公式表記 `SELECT1-2` 等）。
さらに BIT RED / FOLD / DRIVE / DRY GAIN / PAN は **この表に存在しない = 制御不可**。

| Part | SELECT1-2 | LEVEL1-2 | MODAMT1-2 | MODRATE1-2 | PITCH1-2 | EGATT1-2 | EGREL1-2 | SEND | PAN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 103 | 109 |
| 2 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 104 | 110 |
| 3 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 105 | 111 |
| 4 | 55 | 56 | 57 | 58 | 59 | 60 | 61 | 106 | 112 |
| 5 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 107 | 113 |
| 6 | 89 | 90 | 96 | 97 | 98 | 99 | 100 | 108 | 114 |

グローバル（WAVE GUIDE）: `116` MODEL / `117` DECAY / `118` BODY / `119` TUNE

## 3. Split channel mode（OFFICIAL-SPLIT + CROSS）— 推奨

パート n が MIDI チャンネル n を受け持つ（工場出荷時の既定動作）。CC 番号は全パート共通で、
**チャンネルがパートを選ぶ**。レイヤ別制御と隠しパラメータが使えるのはこのモードのみ。

| パラメータ | Layer 1 | Layer 2 | Layer 1+2 同時 |
| --- | --- | --- | --- |
| SELECT | 14 | 15 | 16 |
| LEVEL | 17 | 18 | 19 |
| EG ATTACK | 20 | 21 | 22 |
| EG RELEASE | 23 | 24 | 25 |
| PITCH | 26 | 27 | 28 |
| MOD AMOUNT | 29 | 30 | 31 |
| MOD RATE | 46 | 47 | 48 |

パート単位（レイヤ共通）:

| パラメータ | CC | 備考 |
| --- | --- | --- |
| BIT REDUCTION | 49 | 実機では EDIT/STEP の隠しページ |
| FOLD | 50 | 同上 |
| DRIVE | 51 | 同上 |
| DRY GAIN | 52 | 同上 |
| PAN | 10 | 同上。標準 CC10 |
| WAVE GUIDE SEND | 103 | |
| PITCH MOD QUANTIZE | 53 | `CROSS` のみ。公式表には記載がなく、番号は有志の解析による |

グローバル（どのチャンネルでも受信）: `116` MODEL / `117` DECAY / `118` BODY / `119` TUNE

> 注: BIT / FOLD / DRIVE / DRY GAIN が正しく効くには本体ファームウェア **v1.11 以降** が必要
> （v1.10 以前は BIT が効かず他のパラメータが誤って変化する既知の不具合がある）。

## 4. SELECT の値エンコード

SELECT は 1 つの CC に「波形 × MOD タイプ × EG タイプ」の 45 通りが詰め込まれている。

- 波形 (5): `Sine` / `Saw` / `Noise HP` / `Noise LP` / `Noise BP`
- MOD タイプ (3): `Exp`(rise-fall) / `Tri`(oscillate) / `Random`
- Amp EG タイプ (3): `AD` / `Exp` / `Multi-peak`

インデックスと CC 値:

```
index = wave * 9 + mod * 3 + env      (0..44)
value = ceil(index * 128 / 45)        (0..127)
```

切り上げなのは、各組み合わせのバケットの先頭値に合わせるため。実働エディタが送っている値と
完全に一致し、`floor(value * 45 / 128)` で復号しても元のインデックスに戻る（四捨五入だと
index 4 などで 1 つ手前のバケットに落ちる）。

各成分の寄与（実測エディタと一致）:

| 成分 | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| wave | 0 | 26 | 52 | 77 | 103 |
| mod | 0 | 9 | 18 | – | – |
| env | 0 | 3 | 6 | – | – |

CC 値 → インデックスの復号は `floor(value * 45 / 128)` を使う。

## 5. WAVE GUIDE MODEL の値

CC116 は 2 値。`0` = **Tube**（筒／胴の共鳴）、`64` 以上 = **String**（弦の金属的共鳴）。

## 6. 送出レート

volca 系は MIDI 入力バッファが小さく、CC を詰めて送ると取りこぼす。VDED は
送信キューで **既定 1.6 ms 間隔**（SEND ALL は 4 ms 間隔）に整形し、同一 CC の連続変化は
最新値に畳み込む。
