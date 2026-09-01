import { useEffect, useState } from 'react'
import {
  createAvalon, proposeTeam, voteTeam, playQuestCard, assassinate, avalonBotStep, nightInfoFor,
  type AvalonState,
} from '@aether/shared'

export default function AvalonGame() {
  const [state, setState] = useState<AvalonState>(() =>
    createAvalon([
      { id: 'you', name: '你', isBot: false },
      ...Array.from({ length: 4 }, (_, i) => ({ id: `a${i}`, name: `骑士${i + 1}`, isBot: true })),
    ])
  )
  const [info, setInfo] = useState('')
  const [pick, setPick] = useState<string[]>([])
  const me = state.players.find((p) => p.id === 'you')!
  const leader = state.players[state.leader]
  const need = state.teamSizes[state.questIndex]

  useEffect(() => {
    setInfo(nightInfoFor(state, 'you'))
  }, [])

  useEffect(() => {
    if (state.phase === 'ended') return
    const t = setTimeout(() => setState((s) => avalonBotStep(s)), 700)
    return () => clearTimeout(t)
  }, [state])

  const toggle = (id: string) => {
    setPick((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < need ? [...prev, id] : prev))
  }

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 300 }}>
        <h2>任务 {state.questIndex + 1}/5 · {state.phase}</h2>
        <div className="coach">{info}</div>
        <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
          {state.questResults.map((r, i) => (
            <div key={i} className="holo-panel" style={{ padding: '0.4rem 0.7rem', color: r === true ? 'var(--success)' : r === false ? 'var(--danger)' : 'var(--muted)' }}>
              Q{i + 1}:{r === null ? '·' : r ? '成' : '败'}
            </div>
          ))}
        </div>
        <p>队长：{leader.name} · 需要 {need} 人 · 拒队连击 {state.rejectStreak}/5</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {state.players.map((p) => (
            <button
              key={p.id}
              className={`btn ${pick.includes(p.id) ? 'gold' : ''}`}
              onClick={() => toggle(p.id)}
            >{p.name}</button>
          ))}
        </div>

        {state.phase === 'team_propose' && leader.id === 'you' && (
          <button className="btn" style={{ marginTop: 12 }} disabled={pick.length !== need} onClick={() => setState(proposeTeam(state, 'you', pick))}>
            提交提名
          </button>
        )}
        {state.phase === 'team_vote' && state.votes['you'] === undefined && (
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => setState(voteTeam(state, 'you', true))}>同意</button>
            <button className="btn magenta" style={{ marginLeft: 8 }} onClick={() => setState(voteTeam(state, 'you', false))}>反对</button>
          </div>
        )}
        {state.phase === 'quest' && state.proposed.includes('you') && state.questCards['you'] === undefined && (
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => setState(playQuestCard(state, 'you', true))}>任务成功</button>
            <button className="btn magenta" style={{ marginLeft: 8 }} onClick={() => setState(playQuestCard(state, 'you', false))}>任务失败</button>
          </div>
        )}
        {state.phase === 'assassinate' && me.role === 'assassin' && (
          <div style={{ marginTop: 12 }}>
            <h2>刺杀梅林</h2>
            {state.players.filter((p) => p.id !== me.id).map((p) => (
              <button key={p.id} className="btn gold" style={{ margin: 4 }} onClick={() => setState(assassinate(state, p.id))}>{p.name}</button>
            ))}
          </div>
        )}
        {state.winner && <div className="coach">胜负：{state.winner === 'good' ? '正派' : '奸徒'}</div>}
      </div>
      <div className="holo-panel side-panel">
        <h2>日志</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>你的角色（调试显示）：{me.role}</p>
        <button className="btn magenta" onClick={() => {
          const s = createAvalon([
            { id: 'you', name: '你', isBot: false },
            ...Array.from({ length: 4 }, (_, i) => ({ id: `a${i}`, name: `骑士${i + 1}`, isBot: true })),
          ])
          setState(s)
          setInfo(nightInfoFor(s, 'you'))
          setPick([])
        }}>新开一局</button>
      </div>
    </div>
  )
}
