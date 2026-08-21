import type { Lang } from '../i18n'

/**
 * Front-panel FUNC shortcuts, summarised from the volca drum owner's manual.
 * `mirrored` marks the ones VDED can perform itself; everything else has to be
 * done on the machine because the volca drum accepts no SysEx and no program
 * change, so its memories and motion data are unreachable over MIDI.
 */
export type Localised = Record<Lang, string>

export interface FuncEntry {
  /** Legend printed on the panel. */
  label: string
  /** Step button held with FUNC, when the manual assigns one. */
  step?: number
  description: Localised
  mirrored?: Localised
}

export const FUNC_ENTRIES: FuncEntry[] = [
  {
    label: 'COPY',
    step: 7,
    description: {
      en: "Copies the current part's sound, sequence and motion to another part.",
      ja: 'カレント PART の音色・シーケンス・モーションを別の PART へコピー。',
    },
    mirrored: {
      en: 'The Copy to… menu in Part edit (sound and steps).',
      ja: 'Part edit の Copy to…（音色とステップ）。',
    },
  },
  {
    label: 'CHOKE',
    step: 8,
    description: {
      en: 'Turns choke — one part cutting another off — on or off per part.',
      ja: 'PART ごとのチョーク（同時発音の打ち消し）の有効／無効を切り替え。',
    },
  },
  {
    label: 'RANDOMIZE LAYER',
    step: 9,
    description: {
      en: "Randomizes the selected layer's sound parameters.",
      ja: '選択中の LAYER の音色パラメータをランダム化。',
    },
    mirrored: { en: 'The dice button on the layer header.', ja: 'LAYER 見出しのダイスボタン。' },
  },
  {
    label: 'RANDOMIZE PATTERN',
    step: 10,
    description: {
      en: 'Randomizes steps, slices, accents and active steps for the selected part.',
      ja: '選択中 PART のステップ・スライス・アクセント・アクティブステップをランダム化。',
    },
    mirrored: {
      en: 'The dice button on the sequencer row (steps and velocity only).',
      ja: 'シーケンサ行のダイスボタン（ステップと velocity のみ）。',
    },
  },
  {
    label: 'MODEL',
    step: 11,
    description: {
      en: 'Switches the waveguide resonator model between tube and string.',
      ja: 'Wave guide のモデル（tube / string）を切り替え。',
    },
    mirrored: { en: 'The Model switch in Wave guide (CC116).', ja: 'Wave guide の Model（CC116）。' },
  },
  {
    label: 'MOTION ON/OFF',
    step: 12,
    description: { en: 'Enables or disables knob motion recording.', ja: 'ノブのモーションシーケンスの有効／無効。' },
  },
  {
    label: 'MOTION CLR PART',
    step: 13,
    description: { en: 'Clears motion data for the selected part.', ja: '選択中 PART のモーションデータを消去。' },
  },
  {
    label: 'MOTION CLR ALL',
    step: 14,
    description: { en: 'Clears motion data for every part.', ja: '全 PART のモーションデータを消去。' },
  },
  {
    label: 'CLEAR PART',
    step: 15,
    description: { en: 'Clears the selected part.', ja: '選択中の PART のデータを消去。' },
    mirrored: {
      en: 'The clear button on the sequencer row (steps), or Init in Part edit (sound).',
      ja: 'シーケンサ行のクリア（ステップ）／ Part edit の Init（音色）。',
    },
  },
  {
    label: 'SAVE KIT / LOAD KIT',
    description: {
      en: 'Stores or recalls a kit — the six part sounds. Step buttons 1–16 are the slots.',
      ja: 'キット（6 PART の音色）をメモリに保存・呼び出し。ステップボタン 1–16 が保存先。',
    },
    mirrored: {
      en: 'The Presets tab. Browser storage is separate from the machine memories and unlimited.',
      ja: 'Presets タブ。実機メモリとは別に、ブラウザ側へ無制限に保存できます。',
    },
  },
  {
    label: 'SAVE PRG / LOAD PRG',
    description: {
      en: 'Stores or recalls a program — kit plus sequence. Step buttons 1–16 are the slots.',
      ja: 'プログラム（キット＋シーケンス）を保存・呼び出し。ステップボタン 1–16 が保存先。',
    },
    mirrored: {
      en: 'The Presets tab with "Include the pattern" turned on.',
      ja: 'Presets タブで「パターンも含める」を ON にして保存。',
    },
  },
  {
    label: 'STEP JUMP',
    description: {
      en: 'Hold FUNC and press STEP JUMP to loop only the steps you hold.',
      ja: 'FUNC を押しながら STEP JUMP。押しているステップだけを繰り返す。',
    },
  },
]

export interface GlobalSetting {
  title: Localised
  body: Localised
  critical?: boolean
}

export const GLOBAL_SETTINGS: GlobalSetting[] = [
  {
    title: { en: 'Turn MIDI RX ShortMessage on', ja: 'MIDI RX ShortMessage を ON にする' },
    body: {
      en: 'With this global parameter off the machine ignores control change entirely. Check it first if the knobs here do nothing.',
      ja: 'このグローバルパラメータが OFF だと、コントロールチェンジを一切受信しません。ノブが効かないときは最初にここを確認してください。',
    },
    critical: true,
  },
  {
    title: { en: 'MIDI channel (split / single)', ja: 'MIDI チャンネルの設定（split / single）' },
    body: {
      en: 'Hold ●REC while powering on, pick a channel with the step buttons, press again for the [MID 1--6] display, then ●REC to confirm. Split channel is the factory setting and the only one with per-layer control and BIT / FOLD / DRIVE / DRY GAIN.',
      ja: '●REC を押しながら電源投入 → ステップボタンでチャンネル選択 → もう一度押すと [MID 1--6] 表示 → ●REC で確定。split channel が工場出荷時の設定で、LAYER 別制御と BIT / FOLD / DRIVE / DRY GAIN はこのモードでのみ使えます。',
    },
    critical: true,
  },
  {
    title: { en: 'MIDI Clock src', ja: 'MIDI Clock src' },
    body: {
      en: 'Set to Internal the machine ignores external clock. Choose Auto to follow the editor.',
      ja: 'Internal のときは外部クロックを受信しません。VDED の MIDI CLOCK を使うときは Auto にしてください。',
    },
  },
  {
    title: { en: 'Panel-only controls', ja: 'MIDI で操作できないパネル操作' },
    body: {
      en: 'VOLUME is analogue and cannot be driven over MIDI. TEMPO and SWING belong to the machine sequencer; sending MIDI clock is the only way to affect its tempo.',
      ja: 'VOLUME は完全なアナログ回路で、MIDI からは操作できません。TEMPO / SWING も実機のシーケンサ用です（MIDI CLOCK を送ればテンポには追従します）。',
    },
  },
  {
    title: { en: 'Firmware v1.11 or later', ja: 'ファームウェア v1.11 以降' },
    body: {
      en: 'On v1.10 and earlier the BIT CC does nothing and the neighbouring parameters change instead.',
      ja: 'v1.10 以前は BIT の CC が効かず、他のパラメータが誤って変化する不具合があります。',
    },
  },
]
