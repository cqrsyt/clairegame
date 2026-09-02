import { useState, type ReactNode } from 'react'

const FONT = '"Noto Sans SC","ZCOOL KuaiLe",sans-serif'

function Frame({ children, fill }: { children: ReactNode; fill: string }) {
  return (
    <g>
      <rect width="160" height="100" rx="0" fill={fill} />
      {children}
    </g>
  )
}

function star(x: number, y: number, r: number, fill = '#ffc85a', k: string) {
  return <circle key={k} cx={x} cy={y} r={r} fill={fill} />
}

function lantern(x: number, y: number, k: string, hue = '#c8102e') {
  return (
    <g key={k}>
      <line x1={x} y1={y - 10} x2={x} y2={y - 2} stroke="#ffc85a" strokeWidth="1.2" />
      <ellipse cx={x} cy={y + 6} rx="6" ry="9" fill={hue} stroke="#ffc85a" strokeWidth="1" />
      <rect x={x - 6} y={y - 2} width="12" height="3" rx="1" fill="#ffc85a" />
    </g>
  )
}

function xiangqi() {
  return (
    <Frame fill="#c9a06a">
      <rect x="6" y="8" width="148" height="84" fill="#d8b57c" stroke="#5a3310" strokeWidth="1.4" />
      {[22, 38, 54, 70, 86, 102, 118, 134, 150].map((x) => (
        <line key={x} x1={x} y1="12" x2={x} y2="88" stroke="#7a4a1c" strokeWidth="0.7" />
      ))}
      {lantern(16, 22, 'l1')}
      {lantern(144, 22, 'l2', '#8b2a12')}
      {star(28, 14, 2.2, '#fff4e4', 's1')}
      {[
        [32, 28, '#c8102e', '帅'], [56, 28, '#c8102e', '仕'], [80, 24, '#c8102e', '炮'],
        [104, 76, '#1a1a20', '将'], [128, 76, '#1a1a20', '士'], [48, 76, '#1a1a20', '马'],
      ].map(([cx, cy, fill, g], i) => (
        <g key={i}>
          <circle cx={cx as number} cy={cy as number} r="11" fill={fill as string} stroke="#fff3d6" strokeWidth="1.6" />
          <text x={cx as number} y={(cy as number) + 4} textAnchor="middle" fontFamily={FONT} fontSize="11" fill="#fff8e8" fontWeight="700">{g as string}</text>
        </g>
      ))}
      <text x="80" y="52" textAnchor="middle" fontFamily={FONT} fontSize="11" fill="#8b2a12">楚河  汉界</text>
    </Frame>
  )
}

function aeroplane() {
  const hangars = [
    { x: 10, y: 10, c: '#ff3358' }, { x: 118, y: 10, c: '#ffc85a' },
    { x: 10, y: 66, c: '#ffb08a' }, { x: 118, y: 66, c: '#7dff6b' },
  ]
  return (
    <Frame fill="#5a3858">
      <rect x="58" y="6" width="44" height="88" rx="6" fill="#c9a06a" />
      <rect x="8" y="38" width="144" height="24" rx="6" fill="#d8b57c" />
      <circle cx="80" cy="50" r="16" fill="#ff4ae8" stroke="#ffc85a" strokeWidth="2" />
      {hangars.map((p, i) => (
        <g key={i}>
          <rect x={p.x} y={p.y} width="32" height="24" rx="4" fill="#3a2438" stroke={p.c} strokeWidth="2" />
          <polygon points={`${p.x + 10},${p.y + 18} ${p.x + 16},${p.y + 4} ${p.x + 22},${p.y + 18}`} fill={p.c} />
        </g>
      ))}
    </Frame>
  )
}

function werewolf() {
  return (
    <Frame fill="#4a3050">
      <circle cx="128" cy="24" r="16" fill="#fff4e4" />
      <circle cx="136" cy="20" r="12" fill="#3a2438" />
      {star(18, 16, 2, '#ffc85a', 'w1')}{star(40, 12, 1.6, '#fff4e4', 'w2')}{star(72, 18, 2, '#ffb08a', 'w3')}
      {lantern(22, 38, 'wl')}{lantern(148, 42, 'wr', '#8b2a12')}
      <ellipse cx="78" cy="78" rx="52" ry="16" fill="#2a1830" />
      <path d="M36 78 C42 42 64 28 82 38 C92 20 118 30 122 52 C136 58 138 78 116 86 C88 96 50 90 36 78Z" fill="#5a4860" />
      <ellipse cx="70" cy="58" rx="6" ry="4" fill="#ffc85a" />
      <ellipse cx="96" cy="58" rx="6" ry="4" fill="#ffc85a" />
    </Frame>
  )
}

function avalon() {
  return (
    <Frame fill="#4a3058">
      <ellipse cx="80" cy="58" rx="38" ry="36" fill="#5a3868" stroke="#ffc85a" strokeWidth="3" />
      <rect x="76" y="18" width="8" height="62" rx="2" fill="#e8dcc8" />
      <polygon points="80,8 92,22 68,22" fill="#ffc85a" />
      {star(22, 18, 2.5, '#ffc85a', 'av1')}{star(140, 22, 2, '#fff4e4', 'av2')}
      <text x="80" y="74" textAnchor="middle" fontFamily={FONT} fontSize="8" fill="#3a2438">圣杯</text>
    </Frame>
  )
}

function chess() {
  const sq = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
    if ((r + c) % 2 === 0) sq.push(<rect key={`${r}-${c}`} x={8 + c * 18} y={8 + r * 17} width="18" height="17" fill="#5a3310" />)
  }
  return (
    <Frame fill="#ead6b0">
      {sq}
      <g transform="translate(22,16)"><circle cx="12" cy="8" r="6" fill="#fff4e4" /><rect x="6" y="12" width="12" height="22" rx="2" fill="#fff4e4" /><rect x="2" y="34" width="20" height="6" rx="2" fill="#fff4e4" /></g>
      <g transform="translate(108,18)"><rect x="8" y="8" width="10" height="26" fill="#1a120c" /><circle cx="13" cy="6" r="5" fill="#1a120c" /><rect x="2" y="34" width="22" height="6" rx="2" fill="#1a120c" /></g>
    </Frame>
  )
}

function checkers() {
  const sq = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
    sq.push(<rect key={`${r}-${c}`} x={8 + c * 18} y={6 + r * 18} width="18" height="18" fill={(r + c) % 2 ? '#6a2e14' : '#f3d9b4'} />)
  }
  const stones: [number, number, string][] = [[35,33,'#c8102e'],[71,33,'#c8102e'],[107,33,'#c8102e'],[143,33,'#c8102e'],[53,51,'#1a1a1a'],[89,51,'#1a1a1a'],[125,51,'#1a1a1a'],[35,69,'#1a1a1a'],[71,87,'#c8102e'],[107,69,'#1a1a1a']]
  return <Frame fill="#3a2210">{sq}{stones.map(([cx,cy,fill],i)=><circle key={i} cx={cx} cy={cy} r="7.5" fill={fill} stroke="#fff4e4" strokeWidth="1" />)}</Frame>
}

function mahjong() {
  const tile = (x: number, face: ReactNode) => (
    <g transform={`translate(${x},12)`}>
      <rect width="34" height="76" rx="5" fill="#e6d7b0" stroke="#3a2a12" strokeWidth="1.4" />
      <rect x="2" y="2" width="30" height="72" rx="4" fill="#fffaf0" />{face}
    </g>
  )
  return (
    <Frame fill="#4a5c44">
      {tile(8, <text x="17" y="46" textAnchor="middle" fontFamily={FONT} fontSize="22" fill="#c8102e" fontWeight="700">中</text>)}
      {tile(44, <g>{[[10,16],[24,16],[17,38],[10,60],[24,60]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="4.2" fill={i===2?'#dc2626':'#1d4ed8'} />)}</g>)}
      {tile(80, <rect x="13" y="12" width="8" height="52" rx="2" fill="#16a34a" />)}
      {tile(116, <text x="17" y="46" textAnchor="middle" fontFamily={FONT} fontSize="22" fill="#1d4ed8" fontWeight="700">發</text>)}
    </Frame>
  )
}

function gomoku() {
  const lines = []
  for (let i = 0; i < 8; i++) {
    lines.push(<line key={`h${i}`} x1="14" y1={12 + i * 11} x2="146" y2={12 + i * 11} stroke="#3a2a12" strokeWidth="0.8" />)
    lines.push(<line key={`v${i}`} x1={14 + i * 19} y1="12" x2={14 + i * 19} y2="89" stroke="#3a2a12" strokeWidth="0.8" />)
  }
  const stones: [number, number, string][] = [[52,34,'#111'],[71,34,'#111'],[90,34,'#111'],[109,34,'#111'],[33,34,'#111'],[52,45,'#fff4e4'],[71,45,'#fff4e4'],[90,23,'#fff4e4'],[128,56,'#111'],[71,67,'#fff4e4'],[33,56,'#fff4e4'],[109,67,'#111']]
  return <Frame fill="#d4b48a">{lines}{stones.map(([cx,cy,fill],i)=><circle key={i} cx={cx} cy={cy} r="5.8" fill={fill} />)}</Frame>
}

function goBoard() {
  const lines = []
  for (let i = 0; i < 9; i++) {
    lines.push(<line key={`h${i}`} x1="16" y1={10 + i * 10} x2="144" y2={10 + i * 10} stroke="#222" strokeWidth="0.6" />)
    lines.push(<line key={`v${i}`} x1={16 + i * 16} y1="10" x2={16 + i * 16} y2="90" stroke="#222" strokeWidth="0.6" />)
  }
  const stones: [number, number, string][] = [[48,40,'#111'],[64,40,'#fff4e4'],[80,50,'#111'],[32,30,'#fff4e4'],[96,30,'#111'],[64,60,'#111'],[48,60,'#fff4e4'],[112,40,'#fff4e4'],[80,70,'#111'],[96,70,'#fff4e4'],[32,70,'#111']]
  return <Frame fill="#e0c090">{lines}{stones.map(([cx,cy,fill],i)=><circle key={i} cx={cx} cy={cy} r="6.2" fill={fill} />)}</Frame>
}

function junqi() {
  return (
    <Frame fill="#3a4a32">
      <rect x="8" y="16" width="68" height="68" rx="8" fill="#c8102e" stroke="#ffc85a" strokeWidth="2" />
      <rect x="84" y="16" width="68" height="68" rx="8" fill="#1d4ed8" stroke="#ffb08a" strokeWidth="2" />
      <text x="42" y="44" textAnchor="middle" fontFamily={FONT} fontSize="13" fill="#fff4e4">军旗</text>
      <text x="42" y="64" textAnchor="middle" fontFamily={FONT} fontSize="11" fill="#ffc85a">司令</text>
      <text x="118" y="44" textAnchor="middle" fontFamily={FONT} fontSize="13" fill="#fff4e4">军旗</text>
      <text x="118" y="64" textAnchor="middle" fontFamily={FONT} fontSize="11" fill="#ffb08a">工兵</text>
    </Frame>
  )
}

function doudizhu() {
  const card = (x: number, label: string, color: string, rot: number) => (
    <g transform={`translate(${x},14) rotate(${rot} 18 36)`}>
      <rect width="36" height="72" rx="4" fill="#fffaf0" stroke="#111" />
      <text x="18" y="30" textAnchor="middle" fontFamily={FONT} fontSize={label.length > 1 ? 12 : 18} fill={color} fontWeight="700">{label}</text>
      <text x="18" y="54" textAnchor="middle" fontSize="16" fill={color}>{color === '#c8102e' ? '♥' : '♠'}</text>
    </g>
  )
  return <Frame fill="#2a4a32">{card(18,'A','#111',-12)}{card(52,'2','#c8102e',-4)}{card(86,'K','#111',6)}{card(118,'王','#c8102e',14)}</Frame>
}

function uno() {
  const cards = [{ x: 12, rot: -18, c: '#dc2626', n: '7' }, { x: 46, rot: -6, c: '#2563eb', n: '2' }, { x: 80, rot: 8, c: '#eab308', n: '9' }, { x: 112, rot: 18, c: '#16a34a', n: '4' }]
  return (
    <Frame fill="#3a2438">
      {cards.map((k) => (
        <g key={k.c} transform={`translate(${k.x},12) rotate(${k.rot} 16 38)`}>
          <rect width="32" height="76" rx="6" fill={k.c} stroke="#fff4e4" strokeWidth="1.2" />
          <ellipse cx="16" cy="38" rx="11" ry="18" fill="#fffaf0" />
          <text x="16" y="44" textAnchor="middle" fontFamily={FONT} fontSize="18" fill={k.c} fontWeight="800">{k.n}</text>
        </g>
      ))}
    </Frame>
  )
}

function holdem() {
  return (
    <Frame fill="#2d4a32">
      <ellipse cx="80" cy="54" rx="68" ry="36" fill="#3d6a40" stroke="#ffc85a" strokeWidth="2.4" />
      <g transform="translate(24,24) rotate(-10)"><rect width="30" height="46" rx="4" fill="#fffaf0" /><text x="15" y="22" textAnchor="middle" fontSize="15" fill="#c8102e" fontWeight="700">A</text><text x="15" y="38" textAnchor="middle" fontSize="13" fill="#c8102e">♥</text></g>
      <g transform="translate(50,26) rotate(8)"><rect width="30" height="46" rx="4" fill="#fffaf0" /><text x="15" y="22" textAnchor="middle" fontSize="15" fill="#111" fontWeight="700">K</text><text x="15" y="38" textAnchor="middle" fontSize="13" fill="#111">♠</text></g>
      <g transform="translate(76,28) rotate(-4)"><rect width="30" height="46" rx="4" fill="#fffaf0" /><text x="15" y="22" textAnchor="middle" fontSize="15" fill="#c8102e" fontWeight="700">Q</text><text x="15" y="38" textAnchor="middle" fontSize="13" fill="#c8102e">♦</text></g>
      <circle cx="128" cy="66" r="13" fill="#c8102e" stroke="#ffc85a" /><text x="128" y="70" textAnchor="middle" fontFamily={FONT} fontSize="9" fill="#ffc85a">100</text>
      <circle cx="112" cy="78" r="10" fill="#ffc85a" /><circle cx="140" cy="78" r="8" fill="#1d4ed8" />
    </Frame>
  )
}

function monopoly() {
  return (
    <Frame fill="#efe6c8">
      <rect x="8" y="8" width="144" height="84" fill="none" stroke="#166534" strokeWidth="3" />
      <rect x="8" y="8" width="24" height="24" fill="#c8102e" /><rect x="128" y="8" width="24" height="24" fill="#1d4ed8" />
      <rect x="8" y="68" width="24" height="24" fill="#eab308" /><rect x="128" y="68" width="24" height="24" fill="#16a34a" />
      <rect x="58" y="36" width="20" height="16" fill="#16a34a" /><polygon points="56,36 68,24 80,36" fill="#14532d" />
      <circle cx="108" cy="58" r="8" fill="#ffc85a" /><circle cx="118" cy="50" r="6" fill="#ffb08a" />
      <text x="80" y="90" textAnchor="middle" fontFamily={FONT} fontSize="9" fill="#166534">大富翁</text>
    </Frame>
  )
}

function fallback() {
  return (
    <Frame fill="#5a3850">
      <circle cx="80" cy="50" r="26" fill="none" stroke="#ffc85a" strokeWidth="3" />
      <circle cx="80" cy="50" r="10" fill="#ff4ae8" />
    </Frame>
  )
}

const MOTIFS: Record<string, () => ReactNode> = {
  xiangqi, aeroplane, werewolf, avalon, chess, checkers, mahjong, gomoku, go: goBoard, junqi, doudizhu, uno, holdem, monopoly,
}
const PNG_IDS = new Set(['xiangqi', 'aeroplane', 'werewolf', 'mahjong'])

export default function GameMotif({ id, compact }: { id: string; compact?: boolean }) {
  const cls = compact ? 'play-motif' : 'game-card-art'
  const Art = MOTIFS[id] ?? fallback
  const [usePng, setUsePng] = useState(() => PNG_IDS.has(id))
  if (usePng) {
    return (
      <div className={cls} aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}motifs/${id}.png`} alt="" onError={() => setUsePng(false)} />
      </div>
    )
  }
  return (
    <div className={cls} aria-hidden="true">
      <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">{Art()}</svg>
    </div>
  )
}
