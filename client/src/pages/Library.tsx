import { Link } from 'react-router-dom'
import { GAMES } from '@aether/shared'

const badgeLabel: Record<string, string> = {
  'full-ai': '本地 AI 可玩',
  'full-bots': '人机完整',
  online: '联机',
  encyclopedia: '图鉴 · Soon',
}

export default function Library() {
  return (
    <div className="page">
      <h1>星图库</h1>
      <p style={{ color: 'var(--muted)' }}>选择一款桌游进入图鉴，或直接开战。</p>
      <div className="grid" style={{ padding: '1rem 0' }}>
        {GAMES.map((g) => (
          <Link key={g.id} to={`/game/${g.id}`} className="holo-panel game-card" style={{ color: 'inherit' }}>
            <span className={`badge ${g.playable}`}>{badgeLabel[g.playable]}</span>
            <h3>{g.nameZh}</h3>
            <div className="en">{g.nameEn}</div>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{g.summary}</p>
            <div style={{ marginTop: 'auto', color: 'var(--gold)', fontSize: '0.85rem' }}>{g.players} 人 · {g.genre}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
