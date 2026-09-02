import { useEffect, useMemo, useState } from 'react'
import { createDoudizhu, playDoudizhu, passDoudizhu, doudizhuBot, doudizhuCoach, type DDState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

export default function DoudizhuGame() {
  const [state, setState] = useState<DDState>(() => createDoudizhu())
  const [sel, setSel] = useState<string[]>([])
  const me = 0
  const myTurn = state.winner === null && state.current === me
  const advice = useMemo(() => (myTurn ? doudizhuCoach.suggestMove(state, me) : null), [state, myTurn])

  useEffect(() => {
    if (state.winner !== null) return
    if (!state.players[state.current].isBot) return
    const t = setTimeout(() => setState((s) => doudizhuBot(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const toggle = (id: string) => {
    setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 280 }}>
        <h2>斗地主 · {state.players[state.current].name} 出牌</h2>
        {state.players.map((p, i) => (
          <div key={p.id} style={{ marginBottom: 6 }}>
            <strong style={{ color: i === state.current ? 'var(--gold)' : 'var(--muted)' }}>
              {p.name}（{p.role === 'landlord' ? '地主' : '农民'}）
            </strong>
            <span style={{ marginLeft: 8, color: 'var(--muted)' }}>{p.hand.length} 张</span>
          </div>
        ))}
        {state.last && <p>上一手：{state.last.cards.map((c) => c.label).join(' ')}</p>}
        <div className="mj-hand">
          {state.players[me].hand.map((c) => (
            <button
              key={c.id}
              className={`tile ${sel.includes(c.id) ? 'tile-sel' : ''}`}
              onClick={() => toggle(c.id)}
            >{c.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn" disabled={state.current !== me || state.winner !== null} onClick={() => {
            playSfx('move')
            setState(playDoudizhu(state, me, sel))
            setSel([])
          }}>出牌</button>
          <button className="btn magenta" disabled={state.current !== me || state.winner !== null} onClick={() => {
            setState(passDoudizhu(state, me)); setSel([])
          }}>不要</button>
          <button className="btn gold" onClick={() => { setState(createDoudizhu()); setSel([]) }}>新局</button>
        </div>
        {state.winner !== null && <div className="coach">{state.players[state.winner].name} 获胜</div>}
      </div>
      <div className="holo-panel side-panel">
        <LiveGuide
          title="助手"
          lines={[doudizhuCoach.explain(state, advice)]}
          suggestion={
            !advice ? null
            : advice.action === 'pass' ? '建议：不要'
            : `建议：出 ${advice.combo.cards.map((c) => c.label).join(' ')}`
          }
          onApply={advice && myTurn ? () => {
            if (advice.action === 'pass') { setState(passDoudizhu(state, me)); setSel([]) }
            else {
              playSfx('move')
              setState(playDoudizhu(state, me, advice.combo.cards.map((c) => c.id)))
              setSel([])
            }
          } : null}
        />
        <h2>记录</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
      </div>
      <ShareCard gameId="doudizhu" title="斗地主" result={state.winner === 0 ? '地主获胜' : '农民获胜'} open={state.winner !== null} />
    </div>
  )
}
