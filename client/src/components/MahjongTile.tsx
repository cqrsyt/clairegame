import { useId } from 'react'

type Props = { tile: string; disabled?: boolean; selected?: boolean; onClick?: () => void; small?: boolean }

const WAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** Brush-stroke numerals so 万 tiles stay readable even if CJK fonts fail to load. */
function WanNumeral({ n }: { n: number }) {
  const s = { fill: 'none' as const, stroke: '#8f1212', strokeWidth: 2.35, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (n === 1) return <path {...s} d="M6 16 H34" />
  if (n === 2) return <g><path {...s} d="M8 11 H32" /><path {...s} d="M7 22 H33" /></g>
  if (n === 3) return <g><path {...s} d="M8 9 H32" /><path {...s} d="M7 16 H33" /><path {...s} d="M6 23 H34" /></g>
  if (n === 4) {
    return (
      <g>
        <path {...s} d="M10 7 V22 H30 V7" />
        <path {...s} d="M10 14 H30" />
        <path {...s} d="M20 7 V14" />
        <path {...s} d="M13 22 L10 27" />
        <path {...s} d="M27 22 L30 27" />
      </g>
    )
  }
  if (n === 5) {
    return (
      <g>
        <path {...s} d="M8 8 H32" />
        <path {...s} d="M14 8 V15 H28" />
        <path {...s} d="M12 15 Q20 12 28 15" />
        <path {...s} d="M7 22 H33" />
      </g>
    )
  }
  if (n === 6) {
    return (
      <g>
        <path {...s} d="M20 6 V12" />
        <path {...s} d="M10 12 H30" />
        <path {...s} d="M16 12 L10 26" />
        <path {...s} d="M24 12 L30 26" />
      </g>
    )
  }
  if (n === 7) return <g><path {...s} d="M8 9 H32" /><path {...s} d="M26 9 L16 27" /></g>
  if (n === 8) return <g><path {...s} d="M14 8 L8 26" /><path {...s} d="M26 8 L32 26" /></g>
  return (
    <g>
      <path {...s} d="M16 7 Q12 16 10 26" />
      <path {...s} d="M16 7 H26 Q30 10 26 15 H18" />
      <path {...s} d="M24 15 Q32 18 28 27" />
    </g>
  )
}

/** Traditional 萬 as strokes (no font tofu). */
function WanGlyph() {
  const s = { fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const d = "M8 32 H32 M14 30 V36 M26 30 V36 M10 36 H30 M10 36 V48 H30 V36 M20 36 V48 M10 42 H30 M14 48 L11 53 M26 48 L29 53"
  return (
    <g>
      <path {...s} d={d} stroke="#3a0a08" strokeWidth="3.2" />
      <path {...s} d={d} stroke="#c41e3a" strokeWidth="1.85" />
    </g>
  )
}

function Coin({ x, y, r, hue }: { x: number; y: number; r: number; hue: 'red' | 'blue' | 'green' }) {
  const ring = hue === 'red' ? '#b91c1c' : hue === 'green' ? '#15803d' : '#1d4ed8'
  const inner = hue === 'red' ? '#7f1d1d' : hue === 'green' ? '#14532d' : '#1e3a8a'
  const mid = hue === 'red' ? '#ef4444' : hue === 'green' ? '#22c55e' : '#3b82f6'
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={inner} />
      <circle cx={x} cy={y} r={r * 0.78} fill="#fff8e8" />
      <circle cx={x} cy={y} r={r * 0.58} fill={ring} />
      <circle cx={x} cy={y} r={r * 0.38} fill="#fff8e8" />
      <circle cx={x} cy={y} r={r * 0.22} fill={mid} />
      <circle cx={x - r * 0.22} cy={y - r * 0.28} r={r * 0.14} fill="#fff" opacity="0.55" />
    </g>
  )
}

function Dots({ n }: { n: number }) {
  if (n === 1) {
    return (
      <g>
        {/* 一筒 · bird over a large coin (classic Chinese 筒) */}
        <Coin x={20} y={34} r={11} hue="red" />
        <ellipse cx="20" cy="16" rx="9" ry="7" fill="#1d4ed8" />
        <ellipse cx="20" cy="15" rx="6.5" ry="5" fill="#60a5fa" />
        <circle cx="17.2" cy="14.2" r="1.15" fill="#111" />
        <circle cx="22.6" cy="14.2" r="1.15" fill="#111" />
        <path d="M14 12 Q20 6 26 12" fill="none" stroke="#1e3a8a" strokeWidth="1.3" />
        <path d="M28 18 Q34 10 31 7" fill="none" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 20 Q20 24 24 20" fill="none" stroke="#1e3a8a" strokeWidth="1.1" />
      </g>
    )
  }
  const layouts: Record<number, [number, number, 'red' | 'blue' | 'green'][]> = {
    2: [[20, 16, 'green'], [20, 40, 'red']],
    3: [[20, 13, 'green'], [20, 28, 'blue'], [20, 43, 'red']],
    4: [[12, 16, 'blue'], [28, 16, 'blue'], [12, 40, 'red'], [28, 40, 'red']],
    5: [[12, 14, 'blue'], [28, 14, 'blue'], [20, 28, 'green'], [12, 42, 'red'], [28, 42, 'red']],
    6: [[12, 13, 'green'], [28, 13, 'green'], [12, 28, 'blue'], [28, 28, 'blue'], [12, 43, 'red'], [28, 43, 'red']],
    7: [[12, 12, 'green'], [28, 12, 'green'], [20, 22, 'green'], [12, 33, 'blue'], [28, 33, 'blue'], [12, 45, 'red'], [28, 45, 'red']],
    8: [[12, 11, 'green'], [28, 11, 'green'], [12, 23, 'green'], [28, 23, 'green'], [12, 35, 'red'], [28, 35, 'red'], [12, 47, 'red'], [28, 47, 'red']],
    9: [[11, 12, 'green'], [20, 12, 'green'], [29, 12, 'green'], [11, 28, 'blue'], [20, 28, 'blue'], [29, 28, 'blue'], [11, 44, 'red'], [20, 44, 'red'], [29, 44, 'red']],
  }
  const pts = layouts[n] || []
  const r = n >= 8 ? 4.05 : n >= 6 ? 4.45 : n === 5 ? 4.7 : 5.15
  return (
    <g>
      {pts.map(([x, y, hue], i) => <Coin key={i} x={x} y={y} r={r} hue={hue} />)}
    </g>
  )
}

function Stick({ x, y, h, lean = 0 }: { x: number; y: number; h: number; lean?: number }) {
  const x2 = x + lean
  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y + h} stroke="#052e16" strokeWidth="5.2" strokeLinecap="round" />
      <line x1={x} y1={y} x2={x2} y2={y + h} stroke="#166534" strokeWidth="4.1" strokeLinecap="round" />
      <line x1={x} y1={y} x2={x2} y2={y + h} stroke="#4ade80" strokeWidth="2.1" strokeLinecap="round" />
      <line x1={x - 1.7} y1={y + h * 0.32} x2={x2 + 1.7} y2={y + h * 0.32} stroke="#052e16" strokeWidth="1.15" />
      <line x1={x - 1.7} y1={y + h * 0.64} x2={x2 + 1.7} y2={y + h * 0.64} stroke="#052e16" strokeWidth="1.15" />
      <path d={`M${x - 0.4} ${y + 2} Q${x - 5} ${y + 4} ${x - 6} ${y + 8}`} fill="none" stroke="#15803d" strokeWidth="1.05" />
    </g>
  )
}

function Bamboo({ n }: { n: number }) {
  if (n === 1) {
    return (
      <g>
        {/* 一条 · bird (classic) */}
        <ellipse cx="20" cy="32" rx="11" ry="9" fill="#14532d" />
        <ellipse cx="20" cy="22" rx="8" ry="7.2" fill="#22c55e" />
        <ellipse cx="20" cy="21" rx="5.5" ry="5" fill="#86efac" />
        <circle cx="16.8" cy="20.5" r="1.35" fill="#111" />
        <circle cx="23.4" cy="20.5" r="1.35" fill="#111" />
        <circle cx="17" cy="20.2" r="0.4" fill="#fff" />
        <path d="M13 16 Q20 8 27 16" fill="none" stroke="#14532d" strokeWidth="1.6" />
        <path d="M15 38 Q20 44 25 38" fill="none" stroke="#14532d" strokeWidth="1.3" />
        <path d="M29 26 Q36 16 33 8" fill="none" stroke="#92400e" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M31 14 l4 -1" stroke="#92400e" strokeWidth="1.1" />
      </g>
    )
  }
  const sticks: [number, number, number?][] =
    n === 2 ? [[14, 10], [26, 10]]
    : n === 3 ? [[12, 10], [20, 10], [28, 10]]
    : n === 4 ? [[14, 6], [26, 6], [14, 30], [26, 30]]
    : n === 5 ? [[14, 6], [26, 6], [20, 19], [14, 32], [26, 32]]
    : n === 6 ? [[12, 6], [20, 6], [28, 6], [12, 30], [20, 30], [28, 30]]
    : n === 7 ? [[12, 5], [20, 5], [28, 5], [20, 21], [12, 35], [20, 35], [28, 35]]
    : n === 8 ? [[12, 5], [20, 5], [28, 5], [12, 21], [28, 21], [12, 36], [20, 36], [28, 36]]
    : [[12, 4], [20, 4], [28, 4], [12, 21], [20, 21], [28, 21], [12, 38], [20, 38], [28, 38]]
  const h = n >= 8 ? 13 : n >= 7 ? 14 : n >= 4 ? 18 : 34
  return (
    <g>
      {sticks.map(([x, y], i) => <Stick key={i} x={x} y={y} h={h} />)}
    </g>
  )
}

function Honor({ glyph, color }: { glyph: string; color: string }) {
  return (
    <text
      x="20"
      y="36"
      textAnchor="middle"
      fontFamily="Noto Sans SC, ZCOOL KuaiLe, serif"
      fontSize="24"
      fontWeight="700"
      fill={color}
      stroke="#1a1008"
      strokeWidth="0.7"
      paintOrder="stroke"
    >
      {glyph}
    </text>
  )
}

function Face({ tile }: { tile: string }) {
  if (/^[1-9]m$/.test(tile)) {
    const n = Number(tile[0])
    return (
      <g>
        <WanNumeral n={n} />
        <WanGlyph />
      </g>
    )
  }
  if (/^[1-9]p$/.test(tile)) return <Dots n={Number(tile[0])} />
  if (/^[1-9]s$/.test(tile)) return <Bamboo n={Number(tile[0])} />
  if (tile === 'E') return <Honor glyph="東" color="#1e3a8a" />
  if (tile === 'S') return <Honor glyph="南" color="#1e3a8a" />
  if (tile === 'W') return <Honor glyph="西" color="#1e3a8a" />
  if (tile === 'N') return <Honor glyph="北" color="#1e3a8a" />
  if (tile === 'R') return <Honor glyph="中" color="#dc2626" />
  if (tile === 'G') return <Honor glyph="發" color="#15803d" />
  if (tile === 'Wht') {
    return (
      <g>
        <rect x="7" y="11" width="26" height="34" rx="2" fill="none" stroke="#1d4ed8" strokeWidth="2.8" />
        <Honor glyph="白" color="#1e40af" />
      </g>
    )
  }
  return (
    <text x="20" y="32" textAnchor="middle" fontSize="11" fill="#3a2208" fontWeight="700">{tile}</text>
  )
}

export default function MahjongTile({ tile, disabled, selected, onClick, small }: Props) {
  const uid = useId().replace(/:/g, '')
  const gid = `mj-face-${uid}`
  const inner = (
    <svg viewBox="0 0 40 56" width={small ? 28 : 44} height={small ? 40 : 62} aria-label={tile}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.55" stopColor="#f3e3c4" />
          <stop offset="1" stopColor="#e4c98e" />
        </linearGradient>
      </defs>
      <rect x="0.6" y="0.6" width="38.8" height="54.8" rx="5" fill="#4a2c18" />
      <rect x="1.8" y="1.8" width="36.4" height="52.4" rx="4.2" fill={`url(#${gid})`} />
      <rect x="3.2" y="3.2" width="33.6" height="49.6" rx="3.2" fill="none" stroke="#8b5a2b" strokeWidth="0.85" />
      <rect x="4.2" y="4.2" width="31.6" height="47.6" rx="2.4" fill="none" stroke="#fff8e8" strokeWidth="0.45" opacity="0.7" />
      <Face tile={tile} />
    </svg>
  )
  if (!onClick) return <span className={`mj-tile ${selected ? 'tile-sel' : ''}`}>{inner}</span>
  return (
    <button type="button" className={`mj-tile-btn ${selected ? 'tile-sel' : ''}`} disabled={disabled} onClick={onClick} aria-label={tile}>
      {inner}
    </button>
  )
}

export function tileName(tile: string) {
  if (/^[1-9]m$/.test(tile)) return WAN[Number(tile[0])] + '万'
  if (/^[1-9]p$/.test(tile)) return WAN[Number(tile[0])] + '筒'
  if (/^[1-9]s$/.test(tile)) return WAN[Number(tile[0])] + '条'
  const z: Record<string, string> = { E: '东', S: '南', W: '西', N: '北', R: '红中', G: '发财', Wht: '白板' }
  return z[tile] || tile
}
