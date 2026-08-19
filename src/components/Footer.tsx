const SHORTCUTS: [string, string][] = [
  ['Space', '再生 / 停止'],
  ['1–6', 'パート選択'],
  ['⇧ + 1–6', 'パート試聴'],
  ['L', 'LINK L1+2'],
  ['⌘/Ctrl + S', 'Send all'],
  ['ノブ: ドラッグ / ⇧ 微調整 / W クリックで初期値', ''],
  ['ステップ: ドラッグで塗り / ⇧ クリックでアクセント', ''],
]

export function Footer() {
  return (
    <footer className="footer">
      <span className="legend">Shortcuts</span>
      <ul className="footer__list">
        {SHORTCUTS.map(([key, label]) => (
          <li key={key} className="footer__item">
            <kbd>{key}</kbd>
            {label && <span>{label}</span>}
          </li>
        ))}
      </ul>
      <div className="panel__spacer" />
      <span className="hint">
        音源は実機。VDED は MIDI を送るだけで、音は出しません。
      </span>
    </footer>
  )
}
