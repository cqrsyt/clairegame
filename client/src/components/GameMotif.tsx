import { useState, type ReactNode } from 'react'

const FONT = '"Noto Sans SC","ZCOOL KuaiLe",sans-serif'

function Frame({ children, fill }: { children: ReactNode; fill: string }) {
  return (
    <g>
      <rect width="140" height="88" rx="0" fill={fill} />
      {children}
    </g>
  )
}

function xiangqi() {
  return (
    <Frame fill="#c4a574">
      <rect x="8" y="10" width="124" height="68" fill="none" stroke="#5a3310" strokeWidth="1.2" />
      {[22, 36, 50, 64, 78, 92, 106, 120].map((x) => (
        <line key={x} x1={x} y1="10" x2={x} y2="78" stroke="#7a4a1c" strokeWidth="0.7" />
      ))}
      {[24, 38, 52, 66].map((y) => (
        <line key={y} x1="8" y1={y} x2="132" y2={y} stroke="#7a4a1c" strokeWidth="0.7" />
      ))}
      <text x="70" y="48" textAnchor="middle" fontFamily={FONT} fontSize="11" fill="#8b2a12">楚河  汉界</text>
      <g>
        <circle cx="42" cy="30" r="14" fill="#c8102e" stroke="#fff3d6" strokeWidth="2" />
        <text x="42" y="35" textAnchor="middle" fontFamily={FONT} fontSize="13" fill="#fff8e8" fontWeight="700">帅</text>
        <circle cx="98" cy="62" r="14" fill="#1a1a20" stroke="#e8e8f0" strokeWidth="2" />
        <text x="98" y="67" textAnchor="middle" fontFamily={FONT} fontSize="13" fill="#f4f6ff" fontWeight="700">将</text>
      </g>
    </Frame>
  )
}

function aeroplane() {
  const cols = [
    { x: 18, y: 18, c: '#ff3358' },
    { x: 104, y: 18, c: '#ffd24a' },
    { x: 18, y: 54, c: '#3dffff' },
    { x: 104, y: 54, c: '#b8ff3d' },
  ]
  return (
    <Frame fill="#1e3a6e">
      <rect x="52" y="8" width="36" height="72" rx="4" fill="#2a5088" />
      <rect x="8" y="32" width="124" height="24" rx="4" fill="#2a5088" />
      <circle cx="70" cy="44" r="12" fill="#ff4ae8" opacity="0.85" />
      {cols.map((p) => (
        <g key={p.c}>
          <rect x={p.x} y={p.y} width="18" height="16" rx="3" fill={p.c} />
          <polygon points={`${p.x + 9},${p.y + 2} ${p.x + 16},${p.y + 13} ${p.x + 2},${p.y + 13}`} fill="#fffaf0" />
        </g>
      ))}
    </Frame>
  )
}

function werewolf() {
  return (
    <Frame fill="#1a1438">
      <circle cx="108" cy="22" r="14" fill="#fff7e8" />
      <circle cx="114" cy="18" r="10" fill="#1a1438" />
      <ellipse cx="62" cy="62" rx="38" ry="18" fill="#2a1f4a" />
      <path d="M28 70 C34 40 52 28 70 36 C78 22 96 28 98 48 C108 52 110 68 92 74 C70 80 40 78 28 70Z" fill="#3a3048" />
      <ellipse cx="58" cy="52" rx="5" ry="3.5" fill="#ffd24a" />
      <ellipse cx="78" cy="52" rx="5" ry="3.5" fill="#ffd24a" />
      <path d="M66 58 L70 66 L74 58" fill="#ff4ae8" />
    </Frame>
  )
}

function avalon() {
  return (
    <Frame fill="#16324f">
      <ellipse cx="70" cy="50" rx="32" ry="34" fill="#1e4d7a" stroke="#ffd24a" strokeWidth="3" />
      <path d="M70 22 L92 50 L70 78 L48 50 Z" fill="#3dffff" opacity="0.35" />
      <rect x="66" y="16" width="8" height="58" rx="2" fill="#c9d4e0" />
      <polygon points="70,8 80,20 60,20" fill="#ffd24a" />
      <rect x="50" y="40" width="40" height="8" rx="2" fill="#a78bff" />
      <text x="70" y="64" textAnchor="middle" fontFamily={FONT} fontSize="11" fill="#fff7e8">圣杯</text>
    </Frame>
  )
}

function chess() {
  const sq = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 7; c++) {
      if ((r + c) % 2 === 0) sq.push(<rect key={`${r}-${c}`} x={8 + c * 18} y={10 + r * 17} width="18" height="17" fill="#2a1a10" />)
    }
  }
  return (
    <Frame fill="#e8d5b0">
      {sq}
      <g transform="translate(34,18)">
        <circle cx="12" cy="8" r="6" fill="#f4f1ea" />
        <rect x="6" y="12" width="12" height="18" rx="2" fill="#f4f1ea" />
        <rect x="2" y="30" width="20" height="6" rx="2" fill="#f4f1ea" />
      </g>
      <g transform="translate(86,22)">
        <rect x="8" y="8" width="10" height="22" fill="#1a120c" />
        <circle cx="13" cy="6" r="5" fill="#1a120c" />
        <rect x="2" y="30" width="22" height="6" rx="2" fill="#1a120c" />
      </g>
    </Frame>
  )
}

function checkers() {
  const sq = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 7; c++) {
      sq.push(
        <rect
          key={`${r}-${c}`}
          x={8 + c * 18}
          y={8 + r * 18}
          width="18"
          height="18"
          fill={(r + c) % 2 ? '#5a2a12' : '#f0d9b5'}
        />,
      )
    }
  }
  return (
    <Frame fill="#3a2210">
      {sq}
      <circle cx="35" cy="35" r="8" fill="#c8102e" stroke="#fff" strokeWidth="1" />
      <circle cx="71" cy="53" r="8" fill="#1a1a1a" stroke="#ffd24a" strokeWidth="1" />
      <circle cx="107" cy="35" r="8" fill="#c8102e" stroke="#fff" strokeWidth="1" />
      <circle cx="53" cy="71" r="8" fill="#1a1a1a" />
    </Frame>
  )
}

function mahjong() {
  const tile = (x: number, face: ReactNode) => (
    <g transform={`translate(${x},14)`}>
      <rect width="32" height="60" rx="5" fill="#f8f1dc" stroke="#3a2a12" strokeWidth="1.4" />
      <rect x="2" y="2" width="28" height="56" rx="4" fill="#fffaf0" />
      {face}
    </g>
  )
  return (
    <Frame fill="#1e4a3a">
      {tile(14, <text x="16" y="38" textAnchor="middle" fontFamily={FONT} fontSize="22" fill="#c8102e" fontWeight="700">中</text>)}
      {tile(54, (
        <g>
          {[ [10, 14], [22, 14], [16, 30], [10, 46], [22, 46] ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="4" fill={i === 2 ? '#dc2626' : '#1d4ed8'} />
          ))}
        </g>
      ))}
      {tile(94, (
        <g>
          <rect x="12" y="10" width="8" height="40" rx="2" fill="#16a34a" />
          <line x1="12" y1="22" x2="20" y2="22" stroke="#052e16" />
          <line x1="12" y1="34" x2="20" y2="34" stroke="#052e16" />
        </g>
      ))}
    </Frame>
  )
}

function gomoku() {
  const lines = []
  for (let i = 0; i < 7; i++) {
    lines.push(<line key={`h${i}`} x1="16" y1={14 + i * 10} x2="124" y2={14 + i * 10} stroke="#3a2a12" strokeWidth="0.8" />)
    lines.push(<line key={`v${i}`} x1={16 + i * 18} y1="14" x2={16 + i * 18} y2="74" stroke="#3a2a12" strokeWidth="0.8" />)
  }
  const stones: [number, number, string][] = [
    [52, 34, '#111'], [70, 34, '#111'], [88, 34, '#111'], [106, 34, '#111'], [34, 34, '#111'],
    [52, 44, '#f4f1ea'], [70, 44, '#f4f1ea'], [88, 24, '#f4f1ea'],
  ]
  return (
    <Frame fill="#d4b48a">
      {lines}
      {stones.map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r="5.5" fill={fill} stroke="#222" strokeWidth="0.4" />
      ))}
    </Frame>
  )
}

function goBoard() {
  const lines = []
  for (let i = 0; i < 8; i++) {
    lines.push(<line key={`h${i}`} x1="18" y1={12 + i * 9} x2="122" y2={12 + i * 9} stroke="#222" strokeWidth="0.6" />)
    lines.push(<line key={`v${i}`} x1={18 + i * 14.8} y1="12" x2={18 + i * 14.8} y2="75" stroke="#222" strokeWidth="0.6" />)
  }
  const stones: [number, number, string][] = [
    [47.6, 39, '#111'], [62.4, 39, '#f8f4e8'], [77.2, 48, '#111'], [32.8, 30, '#f8f4e8'],
    [92, 30, '#111'], [62.4, 57, '#111'], [47.6, 57, '#f8f4e8'],
  ]
  return (
    <Frame fill="#e0c090">
      {lines}
      {stones.map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill={fill} />
      ))}
    </Frame>
  )
}

function junqi() {
  return (
    <Frame fill="#2a3a28">
      <rect x="10" y="18" width="54" height="52" rx="6" fill="#c8102e" />
      <rect x="76" y="18" width="54" height="52" rx="6" fill="#1d4ed8" />
      <text x="37" y="42" textAnchor="middle" fontFamily={FONT} fontSize="12" fill="#fff7e8">军旗</text>
      <text x="37" y="58" textAnchor="middle" fontFamily={FONT} fontSize="10" fill="#ffd24a">司令</text>
      <text x="103" y="42" textAnchor="middle" fontFamily={FONT} fontSize="12" fill="#fff7e8">军旗</text>
      <text x="103" y="58" textAnchor="middle" fontFamily={FONT} fontSize="10" fill="#3dffff">工兵</text>
    </Frame>
  )
}

function doudizhu() {
  const card = (x: number, label: string, color: string, back?: boolean) => (
    <g transform={`translate(${x},12) rotate(-8 16 32)`}>
      <rect width="32" height="64" rx="4" fill={back ? '#c8102e' : '#fffaf0'} stroke="#111" />
      {!back && (
        <>
          <text x="16" y="28" textAnchor="middle" fontFamily={FONT} fontSize={label.length > 1 ? 11 : 16} fill={color} fontWeight="700">{label}</text>
          <text x="16" y="50" textAnchor="middle" fontSize="14" fill={color}>{color === '#c8102e' ? '♥' : '♠'}</text>
        </>
      )}
    </g>
  )
  return (
    <Frame fill="#14532d">
      {card(22, 'A', '#111')}
      {card(54, '2', '#c8102e')}
      {card(86, '王', '#c8102e')}
    </Frame>
  )
}

function uno() {
  const cards = [
    { x: 18, rot: -18, c: '#dc2626', n: '7' },
    { x: 46, rot: -6, c: '#2563eb', n: '2' },
    { x: 74, rot: 8, c: '#eab308', n: '9' },
    { x: 100, rot: 18, c: '#16a34a', n: '4' },
  ]
  return (
    <Frame fill="#111827">
      {cards.map((k) => (
        <g key={k.c} transform={`translate(${k.x},14) rotate(${k.rot} 14 30)`}>
          <rect width="28" height="60" rx="6" fill={k.c} stroke="#fff" strokeWidth="1.2" />
          <ellipse cx="14" cy="30" rx="10" ry="16" fill="#fffaf0" />
          <text x="14" y="35" textAnchor="middle" fontFamily={FONT} fontSize="16" fill={k.c} fontWeight="800">{k.n}</text>
        </g>
      ))}
    </Frame>
  )
}

function holdem() {
  return (
    <Frame fill="#14532d">
      <ellipse cx="70" cy="48" rx="58" ry="32" fill="#166534" stroke="#ffd24a" strokeWidth="2" />
      <g transform="translate(28,22) rotate(-8)">
        <rect width="28" height="42" rx="4" fill="#fffaf0" />
        <text x="14" y="20" textAnchor="middle" fontSize="14" fill="#c8102e" fontWeight="700">A</text>
        <text x="14" y="36" textAnchor="middle" fontSize="12" fill="#c8102e">♥</text>
      </g>
      <g transform="translate(50,24) rotate(10)">
        <rect width="28" height="42" rx="4" fill="#fffaf0" />
        <text x="14" y="20" textAnchor="middle" fontSize="14" fill="#111" fontWeight="700">K</text>
        <text x="14" y="36" textAnchor="middle" fontSize="12" fill="#111">♠</text>
      </g>
      <circle cx="108" cy="58" r="12" fill="#c8102e" stroke="#ffd24a" />
      <text x="108" y="62" textAnchor="middle" fontFamily={FONT} fontSize="9" fill="#ffd24a">100</text>
      <circle cx="92" cy="66" r="10" fill="#1d4ed8" />
    </Frame>
  )
}

function monopoly() {
  return (
    <Frame fill="#e8f4e0">
      <rect x="8" y="8" width="124" height="72" fill="none" stroke="#166534" strokeWidth="3" />
      <rect x="8" y="8" width="22" height="22" fill="#c8102e" />
      <rect x="110" y="8" width="22" height="22" fill="#1d4ed8" />
      <rect x="8" y="58" width="22" height="22" fill="#eab308" />
      <rect x="110" y="58" width="22" height="22" fill="#16a34a" />
      <rect x="52" y="32" width="18" height="14" fill="#16a34a" />
      <polygon points="50,32 61,22 72,32" fill="#14532d" />
      <rect x="78" y="36" width="14" height="18" fill="#c8102e" />
      <rect x="36" y="48" width="12" height="12" rx="2" fill="#fffaf0" stroke="#111" />
      <circle cx="42" cy="54" r="1.5" fill="#111" />
      <text x="70" y="78" textAnchor="middle" fontFamily={FONT} fontSize="9" fill="#166534">大富翁</text>
    </Frame>
  )
}

function fallback() {
  return (
    <Frame fill="#2a4470">
      <circle cx="70" cy="44" r="22" fill="none" stroke="#3dffff" strokeWidth="3" />
      <circle cx="70" cy="44" r="8" fill="#ff4ae8" />
    </Frame>
  )
}

const MOTIFS: Record<string, () => ReactNode> = {
  xiangqi,
  aeroplane,
  werewolf,
  avalon,
  chess,
  checkers,
  mahjong,
  gomoku,
  go: goBoard,
  junqi,
  doudizhu,
  uno,
  holdem,
  monopoly,
}

const PNG_IDS = new Set(['xiangqi', 'aeroplane', 'werewolf', 'mahjong'])

export default function GameMotif({ id, compact }: { id: string; compact?: boolean }) {
  const cls = compact ? 'play-motif' : 'game-card-art'
  const Art = MOTIFS[id] ?? fallback
  const [usePng, setUsePng] = useState(() => PNG_IDS.has(id))
  if (usePng) {
    return (
      <div className={cls} aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}motifs/${id}.png`}
          alt=""
          onError={() => setUsePng(false)}
        />
      </div>
    )
  }
  return (
    <div className={cls} aria-hidden="true">
      <svg viewBox="0 0 140 88" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {Art()}
      </svg>
    </div>
  )
}
