/**
 * Inline icon set.
 *
 * Everything is drawn in one 24x24 box so glyphs sit dead centre in a button —
 * text glyphs rode high because their em box is taller than the mark itself.
 * The waveform icons echo what the machine's LCD shows for each SELECT axis.
 */
export type IconName =
  | 'play'
  | 'stop'
  | 'trigger'
  | 'mute'
  | 'solo'
  | 'shiftLeft'
  | 'shiftRight'
  | 'random'
  | 'clear'
  | 'send'
  | 'refresh'
  | 'link'
  | 'overwrite'
  | 'rename'
  | 'info'
  | 'waveSine'
  | 'waveSaw'
  | 'waveNoiseHp'
  | 'waveNoiseLp'
  | 'waveNoiseBp'
  | 'modTri'
  | 'modRandom'
  | 'egAd'
  | 'egExp'
  | 'egMulti'

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const PATHS: Record<IconName, JSX.Element> = {
  play: <path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" stroke="none" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none" />,
  trigger: <path d="M9 6.5 18 12 9 17.5Z" fill="currentColor" stroke="none" />,
  mute: <path d="M5 18V6l3.6 5.2h6.8L19 6v12" {...STROKE} />,
  solo: <path d="M16.5 7.5a4 4 0 0 0-4.6-1.3c-2.6.9-2.9 4.1-.3 5l2.8 1c2.6.9 2.3 4.1-.3 5a4 4 0 0 1-4.6-1.3" {...STROKE} />,
  shiftLeft: <path d="M5 5.5v13M16.5 5.5 10 12l6.5 6.5" {...STROKE} />,
  shiftRight: <path d="M19 5.5v13M7.5 5.5 14 12l-6.5 6.5" {...STROKE} />,
  random: (
    <g>
      <rect x="4" y="4" width="16" height="16" rx="3" {...STROKE} />
      <circle cx="9" cy="9" r="1.4" fill="currentColor" />
      <circle cx="15" cy="15" r="1.4" fill="currentColor" />
      <circle cx="15" cy="9" r="1.4" fill="currentColor" />
      <circle cx="9" cy="15" r="1.4" fill="currentColor" />
    </g>
  ),
  clear: <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" {...STROKE} />,
  send: <path d="M12 19V6m0 0-5 5m5-5 5 5M5 21h14" {...STROKE} />,
  refresh: (
    <g>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" {...STROKE} />
      <path d="M20 4.5V10h-5.5" {...STROKE} />
    </g>
  ),
  link: (
    <g>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4L11.3 6.3" {...STROKE} />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0L5 12.6a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3" {...STROKE} />
    </g>
  ),
  overwrite: <path d="M12 5v13m0 0-5-5m5 5 5-5M5 3h14" {...STROKE} />,
  rename: <path d="M4 20h4L19 9a2.4 2.4 0 0 0-3.4-3.4L4.5 16.7 4 20Z" {...STROKE} />,
  info: (
    <g>
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M12 11v5" {...STROKE} />
      <circle cx="12" cy="7.8" r="1.15" fill="currentColor" />
    </g>
  ),
  waveSine: <path d="M2.5 12q3.2-8 6.3 0t6.3 0 6.4 0" {...STROKE} />,
  waveSaw: <path d="M3 17.5 8.5 6.5v11L14 6.5v11l5.5-11v6" {...STROKE} />,
  // The three noise sources differ by their filter response, so that is what
  // the icon shows.
  waveNoiseHp: <path d="M3 18h5q3 0 4.5-5T18 6h3" {...STROKE} />,
  waveNoiseLp: <path d="M3 6h3q3.5 0 5 5T16 18h5" {...STROKE} />,
  waveNoiseBp: <path d="M3 18h3.5q1.8 0 3-5.5T12 7t2.5 5.5 3 5.5H21" {...STROKE} />,
  modTri: <path d="M3 15 6 7l4 10 4-10 4 10 2-5" {...STROKE} />,
  modRandom: <path d="M3 14h3.5V8H10v9h3.5v-6H17v4h4" {...STROKE} />,
  egAd: <path d="M3 18 8 5l13 13" {...STROKE} />,
  egExp: <path d="M4.5 18V5.5c4 0 4.5 12.5 16.5 12.5" {...STROKE} />,
  egMulti: <path d="M3 18 5.5 6 8 18l2.5-8L13 18l2.5-6L18 18l1.5-4L21 18" {...STROKE} />,
}

export interface IconProps {
  name: IconName
  /** Box size in pixels. */
  size?: number
  className?: string
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

/** Icons for the three SELECT axes, in the order the option lists use. */
export const WAVE_ICONS: IconName[] = [
  'waveSine',
  'waveSaw',
  'waveNoiseHp',
  'waveNoiseLp',
  'waveNoiseBp',
]
export const MOD_ICONS: IconName[] = ['egExp', 'modTri', 'modRandom']
export const EG_ICONS: IconName[] = ['egAd', 'egExp', 'egMulti']
