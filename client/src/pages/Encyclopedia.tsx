import { Link, useParams } from 'react-router-dom'
import { getGame } from '@aether/shared'

const playableIds = new Set(['chess', 'xiangqi', 'gomoku', 'checkers', 'aeroplane', 'werewolf', 'avalon', 'mahjong'])

export default function Encyclopedia() {
  const { id } = useParams()
  const g = getGame(id || '')
  if (!g) return <div className="page"><h1>未找到该星图</h1></div>
  const canPlay = playableIds.has(g.id)
  return (
    <div className="page">
      <div className="holo-panel" style={{ padding: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.2em', color: 'var(--muted)' }}>{g.nameEn}</div>
        <h1>{g.nameZh}</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{g.encyclopedia}</p>
        <h2>AI 教程入口</h2>
        <ol style={{ color: 'var(--text)', lineHeight: 1.9 }}>
          {g.tutorial.map((t) => <li key={t}>{t}</li>)}
        </ol>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          {canPlay ? (
            <Link className="btn" to={`/play/${g.id}`}>进入对局</Link>
          ) : (
            <button className="btn gold" disabled>Coming Soon 房间</button>
          )}
          <Link className="btn magenta" to={`/lobby?game=${g.id}`}>创建联机房</Link>
          <Link className="btn" to="/library">返回星图库</Link>
        </div>
        {!canPlay && (
          <div className="holo-panel" style={{ marginTop: '1.5rem', padding: '1rem', borderColor: 'var(--gold)' }}>
            <strong style={{ color: 'var(--gold)' }}>Coming Soon</strong>
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>完整房间 UI 已预留。当前可浏览图鉴与创建联机大厅占位。</p>
          </div>
        )}
      </div>
    </div>
  )
}
