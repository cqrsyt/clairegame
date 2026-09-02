import { Link, useParams } from 'react-router-dom'
import { getGame } from '@aether/shared'

const playableIds = new Set(['chess', 'xiangqi', 'gomoku', 'checkers', 'aeroplane', 'werewolf', 'avalon', 'mahjong', 'uno', 'doudizhu', 'go', 'junqi', 'holdem', 'monopoly'])

export default function Encyclopedia() {
  const { id } = useParams()
  const g = getGame(id || '')
  if (!g) return <div className="page"><h1>没有找到这款游戏</h1></div>
  const canPlay = playableIds.has(g.id)
  return (
    <div className="page">
      <div className="holo-panel" style={{ padding: '1.75rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.2em', color: 'var(--muted)' }}>{g.nameEn}</div>
        <h1>{g.nameZh}</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{g.encyclopedia}</p>
        <h2>怎么开始</h2>
        <ol style={{ color: 'var(--text)', lineHeight: 1.9 }}>
          {g.tutorial.map((t) => <li key={t}>{t}</li>)}
        </ol>
        <p style={{ color: 'var(--muted)' }}>对局里右侧会跟着你的每一步再讲一遍，不必把这里背下来。</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
          {canPlay ? (
            <Link className="btn" to={`/play/${g.id}`}>开始对局</Link>
          ) : (
            <button className="btn gold" disabled>完整规则仍在补充</button>
          )}
          <Link className="btn magenta" to={`/lobby?game=${g.id}`}>开联机房</Link>
          <Link className="btn" to="/library">返回目录</Link>
        </div>
      </div>
    </div>
  )
}
