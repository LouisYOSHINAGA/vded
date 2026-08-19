import { midiEngine } from '../midi/engine'
import { useMidiSnapshot } from '../hooks/useMidiSnapshot'

/** Explains, in one place, why nothing is reaching the machine yet. */
export function ConnectionBanner() {
  const midi = useMidiSnapshot()

  if (midi.status === 'unsupported') {
    return (
      <div className="banner banner--error">
        <div>
          <strong>このブラウザは Web MIDI API に対応していません。</strong>
          <div>
            Chrome / Edge / Opera など Chromium 系のデスクトップブラウザで開いてください。
            エディット自体は可能ですが、実機への送信はできません。
          </div>
        </div>
      </div>
    )
  }

  if (midi.status === 'denied') {
    return (
      <div className="banner banner--error">
        <div>
          <strong>MIDI へのアクセスが拒否されました。</strong>
          <div>
            アドレスバーのサイト設定から MIDI デバイスの使用を許可し、ページを再読み込みしてください。
          </div>
        </div>
      </div>
    )
  }

  if (midi.status === 'idle' || midi.status === 'requesting') {
    return (
      <div className="banner banner--info">
        <div>
          <strong>MIDI に接続してください。</strong>
          <div>
            上部の <em>MIDI に接続</em> を押すとブラウザが許可を求めます。許可すると接続中の
            MIDI 出力が一覧に表示され、volca drum らしいポートは自動で選択されます。
          </div>
        </div>
        <div className="panel__spacer" />
        <button type="button" className="btn btn--accent btn--sm" onClick={() => void midiEngine.connect()}>
          MIDI に接続
        </button>
      </div>
    )
  }

  if (!midi.outputId) {
    return (
      <div className="banner banner--warn">
        <div>
          <strong>MIDI 出力が選択されていません。</strong>
          <div>
            上部の DEVICE から volca drum を接続したポートを選んでください。
            {midi.outputs.length === 0 && ' 現在、利用できる MIDI 出力が見つかりません（⟳ で再スキャン）。'}
          </div>
        </div>
      </div>
    )
  }

  const selected = midi.outputs.find((port) => port.id === midi.outputId)
  if (selected && !selected.isVolcaDrum) {
    return (
      <div className="banner banner--warn">
        <div>
          <strong>選択中のポートは volca drum として認識されていません。</strong>
          <div>
            USB-MIDI インターフェイス経由の場合は正常です（{selected.name}）。
            意図したポートかどうかだけ確認してください。
          </div>
        </div>
      </div>
    )
  }

  return null
}
