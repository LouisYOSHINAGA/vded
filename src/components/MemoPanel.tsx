import { useT } from '../i18n'
import { setMemo } from '../state/actions'
import { useAppState } from '../state/store'
import { InfoTip } from './InfoTip'

/**
 * A scratchpad for whatever the machine cannot hold: which physical knob you
 * moved, what the patch is for, a setup note for next time. Saved with the
 * workspace rather than with a preset — it is about the session, not the sound.
 */
export function MemoPanel() {
  const t = useT()
  const memo = useAppState((s) => s.memo)

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">{t('memo.title')}</h2>
        <InfoTip label={t('memo.title')}>{t('memo.help')}</InfoTip>
        <div className="panel__spacer" />
        <span className="hint">{t('memo.count', { n: memo.length })}</span>
      </div>
      <div className="panel__body">
        <textarea
          className="memo__area"
          value={memo}
          spellCheck={false}
          placeholder={t('memo.placeholder')}
          aria-label={t('memo.title')}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
    </section>
  )
}
