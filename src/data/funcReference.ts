/**
 * Front-panel FUNC shortcuts, summarised from the volca drum owner's manual.
 * `mirrored` marks the ones VDED can perform itself; everything else has to be
 * done on the machine because the volca drum accepts no SysEx and no program
 * change, so its memories and motion data are unreachable over MIDI.
 */
export interface FuncEntry {
  /** Legend printed on the panel. */
  label: string
  /** Step button held with FUNC, when the manual assigns one. */
  step?: number
  description: string
  mirrored?: string
}

export const FUNC_ENTRIES: FuncEntry[] = [
  {
    label: 'COPY',
    step: 7,
    description: 'カレントパートの音色・シーケンス・モーションを別のパートへコピー。',
    mirrored: 'PART EDIT の Copy to… と同じ操作です（音色とステップをコピー）。',
  },
  {
    label: 'CHOKE',
    step: 8,
    description: 'パートごとのチョーク（同時発音の打ち消し）の有効／無効を切り替え。',
  },
  {
    label: 'RANDOMIZE LAYER',
    step: 9,
    description: '選択中のレイヤの音色パラメータをランダム化。',
    mirrored: 'レイヤ見出しの ⚄ ボタン。',
  },
  {
    label: 'RANDOMIZE PATTERN',
    step: 10,
    description: '選択中のパートのステップ・スライス・アクセント・アクティブステップをランダム化。',
    mirrored: 'シーケンサ行の ⚄ ボタン（ステップとベロシティのみ）。',
  },
  {
    label: 'MODEL',
    step: 11,
    description: 'ウェーブガイド・レゾネータのモデル（tube / string）を切り替え。',
    mirrored: 'WAVE GUIDE パネルの Model スイッチ（CC116）。',
  },
  {
    label: 'MOTION ON/OFF',
    step: 12,
    description: 'ノブのモーションシーケンスの有効／無効。',
  },
  { label: 'MOTION CLR PART', step: 13, description: '選択中パートのモーションデータを消去。' },
  { label: 'MOTION CLR ALL', step: 14, description: '全パートのモーションデータを消去。' },
  {
    label: 'CLEAR PART',
    step: 15,
    description: '選択中のパートのデータを消去。',
    mirrored: 'シーケンサ行の ✕（ステップのみ）／ PART EDIT の Init（音色のみ）。',
  },
  {
    label: 'SAVE KIT / LOAD KIT',
    description: 'キット（6 パートの音色）をメモリに保存・呼び出し。ステップボタン 1–16 が保存先。',
    mirrored: 'PRESETS タブ。実機メモリとは別に、ブラウザ側へ無制限に保存できます。',
  },
  {
    label: 'SAVE PRG / LOAD PRG',
    description: 'プログラム（キット＋シーケンス）を保存・呼び出し。ステップボタン 1–16 が保存先。',
    mirrored: 'PRESETS タブの「パターンも含める」を ON にして保存。',
  },
  {
    label: 'STEP JUMP',
    description: 'FUNC を押しながら STEP JUMP。押しているステップだけを繰り返す。',
  },
]

export interface GlobalSetting {
  title: string
  body: string
  critical?: boolean
}

export const GLOBAL_SETTINGS: GlobalSetting[] = [
  {
    title: 'MIDI RX ShortMessage を ON にする',
    body: 'このグローバルパラメータが OFF だと、コントロールチェンジを一切受信しません。VDED のノブが効かないときは最初にここを確認してください。',
    critical: true,
  },
  {
    title: 'MIDI チャンネルの設定（split / single）',
    body: '●REC を押しながら電源を入れ、ステップボタンでチャンネルを選択。もう一度押すと [MID 1--6]（split channel）表示になります。●REC で確定。split channel が工場出荷時の設定で、レイヤ別制御と BIT / FOLD / DRIVE / DRY GAIN はこのモードでのみ使えます。',
    critical: true,
  },
  {
    title: 'MIDI Clock src',
    body: 'Internal のときは外部クロックを受信しません。VDED の MIDI CLOCK を使うときは Auto にしてください。',
  },
  {
    title: 'MIDI で操作できないパネル操作',
    body: 'VOLUME は完全なアナログ回路で、MIDI からは操作できません。TEMPO / SWING も実機のシーケンサ用で、VDED から変更することはできません（MIDI CLOCK を送ればテンポには追従します）。',
  },
  {
    title: 'ファームウェア v1.11 以降',
    body: 'v1.10 以前は BIT の CC が効かず、他のパラメータが誤って変化する不具合があります。',
  },
]
