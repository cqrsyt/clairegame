type Props = { tile: string; disabled?: boolean; selected?: boolean; onClick?: () => void; small?: boolean }

const WAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function Dots({ n }: { n: number }) {
  const pal = ['#1d4ed8', '#16a34a', '#dc2626']
  const color = (i: number) => pal[i % 3]
  if (n === 1) {
    return (
      <g>
        <circle cx="20" cy="28" r="11" fill="#1e3a8a" />
        <circle cx="20" cy="28" r="8" fill="#f8f1dc" />
        <circle cx="20" cy="28" r="5.5" fill="#dc2626" />
        <circle cx="20" cy="28" r="2.2" fill="#f8f1dc" />
        <path d="M20 20 l1.4 3.2 3.5.2-2.7 2.2.9 3.4L20 27.2 17 28.8l.9-3.4-2.7-2.2 3.5-.2z" fill="#eab308" />
      </g>
    )
  }
  const layouts: Record<number, [number, number][]> = {
    2: [[20, 16], [20, 40]],
    3: [[20, 14], [20, 28], [20, 42]],
    4: [[12, 16], [28, 16], [12, 40], [28, 40]],
    5: [[12, 15], [28, 15], [20, 28], [12, 41], [28, 41]],
    6: [[12, 14], [28, 14], [12, 28], [28, 28], [12, 42], [28, 42]],
    7: [[12, 13], [28, 13], [20, 22], [12, 32], [28, 32], [12, 44], [28, 44]],
    8: [[12, 12], [28, 12], [12, 23], [28, 23], [12, 34], [28, 34], [12, 45], [28, 45]],
    9: [[11, 12], [20, 12], [29, 12], [11, 28], [20, 28], [29, 28], [11, 44], [20, 44], [29, 44]],
  }
  const pts = layouts[n] || []
  const r = n >= 8 ? 3.3 : n >= 6 ? 3.7 : 4.4
  return (
    <g>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={color(i)} />
          <circle cx={x - 1} cy={y - 1.2} r={r * 0.32} fill="#fff" opacity="0.55" />
        </g>
      ))}
    </g>
  )
}

function Bamboo({ n }: { n: number }) {
  if (n === 1) {
    return (
      <g>
        <ellipse cx="20" cy="30" rx="11" ry="8" fill="#166534" />
        <ellipse cx="20" cy="22" rx="7" ry="6" fill="#22c55e" />
        <circle cx="17" cy="21" r="1.3" fill="#111" />
        <circle cx="23" cy="21" r="1.3" fill="#111" />
        <path d="M14 18 Q20 10 26 18" fill="none" stroke="#14532d" strokeWidth="1.4" />
        <path d="M16 34 Q20 38 24 34" fill="none" stroke="#14532d" strokeWidth="1.2" />
        <path d="M28 26 Q34 18 32 12" fill="none" stroke="#854d0e" strokeWidth="1.4" />
      </g>
    )
  }
  const sticks: [number, number][] =
    n === 2 ? [[14, 12], [26, 12]]
    : n === 3 ? [[12, 12], [20, 12], [28, 12]]
    : n === 4 ? [[14, 8], [26, 8], [14, 30], [26, 30]]
    : n === 5 ? [[14, 8], [26, 8], [20, 20], [14, 32], [26, 32]]
    : n === 6 ? [[12, 8], [20, 8], [28, 8], [12, 30], [20, 30], [28, 30]]
    : n === 7 ? [[12, 6], [20, 6], [28, 6], [20, 22], [12, 34], [20, 34], [28, 34]]
    : n === 8 ? [[12, 6], [20, 6], [28, 6], [12, 22], [28, 22], [12, 34], [20, 34], [28, 34]]
    : [[12, 6], [20, 6], [28, 6], [12, 22], [20, 22], [28, 22], [12, 36], [20, 36], [28, 36]]
  const h = n >= 7 ? 14 : 18
  return (
    <g>
      {sticks.map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 3} y={y} width="6" height={h} rx="2" fill={i % 2 ? '#166534' : '#22c55e'} />
          <line x1={x - 3} y1={y + h * 0.33} x2={x + 3} y2={y + h * 0.33} stroke="#052e16" strokeWidth="1" />
          <line x1={x - 3} y1={y + h * 0.66} x2={x + 3} y2={y + h * 0.66} stroke="#052e16" strokeWidth="1" />
        </g>
      ))}
    </g>
  )
}

function Face({ tile }: { tile: string }) {
  if (/^[1-9]m$/.test(tile)) {
    const n = Number(tile[0])
    return (
      <g>
        <text x="20" y="22" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="16" fontWeight="700" fill="#b91c1c">{WAN[n]}</text>
        <text x="20" y="44" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="16" fontWeight="700" fill="#7f1d1d">萬</text>
      </g>
    )
  }
  if (/^[1-9]p$/.test(tile)) return <Dots n={Number(tile[0])} />
  if (/^[1-9]s$/.test(tile)) return <Bamboo n={Number(tile[0])} />
  if (tile === 'E') return <text x="20" y="36" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="22" fill="#1e3a8a" fontWeight="700">東</text>
  if (tile === 'S') return <text x="20" y="36" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="22" fill="#1e3a8a" fontWeight="700">南</text>
  if (tile === 'W') return <text x="20" y="36" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="22" fill="#1e3a8a" fontWeight="700">西</text>
  if (tile === 'N') return <text x="20" y="36" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="22" fill="#1e3a8a" fontWeight="700">北</text>
  if (tile === 'R') return <text x="20" y="36" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="22" fill="#dc2626" fontWeight="700">中</text>
  if (tile === 'G') return <text x="20" y="36" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="20" fill="#15803d" fontWeight="700">發</text>
  if (tile === 'Wht') {
    return (
      <g>
        <rect x="8" y="12" width="24" height="32" rx="2" fill="none" stroke="#2563eb" strokeWidth="2.4" />
        <text x="20" y="36" textAnchor="middle" fontFamily="Noto Serif SC, serif" fontSize="14" fill="#1e40af">白</text>
      </g>
    )
  }
  return <text x="20" y="32" textAnchor="middle" fontSize="10">{tile}</text>
}

export default function MahjongTile({ tile, disabled, selected, onClick, small }: Props) {
  const inner = (
    <svg viewBox="0 0 40 56" width={small ? 28 : 44} height={small ? 40 : 62} aria-label={tile}>
      <defs>
        <linearGradient id="mjg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#e8d9b0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="54" rx="5" fill="#6b4f2a" />
      <rect x="2.4" y="2.4" width="35.2" height="51.2" rx="4" fill="#f4ead0" />
      <rect x="3.2" y="3.2" width="33.6" height="49.6" rx="3.2" fill="none" stroke="#c4b089" strokeWidth="0.6" />
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
