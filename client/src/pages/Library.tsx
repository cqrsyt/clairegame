import { Link } from 'react-router-dom'
import { GAMES } from '@aether/shared'
import GameMotif from '../components/GameMotif'

const badgeLabel: Record<string, string> = {
  'full-ai': '可对战电脑',
  'full-bots': '人机可玩',
  online: '可联机',
  encyclopedia: '说明已备好',
}

export default function Library() {
  return (
    <div className="page">
      <h1>游戏目录</h1>
      <p style={{ color: 'var(--muted)' }}>点进去看规则，或直接开局。颜色和阵营都做了区分，方便一眼认清。</p>
      <div className="grid" style={{ padding: '1rem 0' }}>
        {GAMES.map((g) => (
          <Link key={g.id} to={`/game/${g.id}`} className="holo-panel game-card" style={{ color: 'inherit' }}>
            <GameMotif id={g.id} />
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
