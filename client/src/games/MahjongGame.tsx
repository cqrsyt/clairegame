import { useEffect, useState } from 'react'
import {
  createMahjong, discardTile, passReact, claimPong, claimChi, claimHu, selfHu, canPong, canChi, canHu, mahjongBotStep,
  type MahjongState,
} from '@aether/shared'

export default function MahjongGame() {
  const [state, setState] = useState<MahjongState>(() =>
    createMahjong([{ id: 'you', name: '你', isBot: false }])
  )
  const meIdx = 0
  const me = state.players[meIdx]

  useEffect(() => {
    if (state.phase === 'ended') return
    const t = setTimeout(() => setState((s) => mahjongBotStep(s)), 500)
    return () => clearTimeout(t)
  }, [state])

  const chiOpts = state.lastDiscard ? canChi(me.hand, state.lastDiscard.tile) : []

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 300 }}>
        <h2>麻将 · {state.phase} · 牌山 {state.wall.length}</h2>
        {state.players.map((p, i) => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <strong style={{ color: i === state.turn ? 'var(--cyan)' : 'var(--muted)' }}>{p.name}</strong>
            <span style={{ marginLeft: 8, color: 'var(--muted)' }}>副露 {p.melds.length} · 牌 {p.hand.length}</span>
            <div className="mj-hand">
              {p.melds.map((m, mi) => (
                <span key={mi} style={{ display: 'inline-flex', gap: 2, marginRight: 8 }}>
                  {m.map((t, ti) => <span key={ti} className="tile" style={{ opacity: 0.85 }}>{t}</span>)}
                </span>
              ))}
            </div>
            {i === meIdx && (
              <div className="mj-hand">
                {me.hand.map((t, ti) => (
                  <button
                    key={`${t}-${ti}`}
                    className="tile"
                    disabled={state.phase !== 'discard' || state.turn !== meIdx}
                    onClick={() => setState(discardTile(state, meIdx, t))}
                  >{t}</button>
                ))}
              </div>
            )}
          </div>
        ))}

        {state.phase === 'discard' && state.turn === meIdx && canHu(me.hand, me.melds.length) && (
          <button className="btn gold" onClick={() => setState(selfHu(state, meIdx))}>自摸胡</button>
        )}
        {state.phase === 'react' && state.lastDiscard && (
          <div style={{ marginTop: 8 }}>
            <div>待响应：{state.lastDiscard.tile}</div>
            {canHu([...me.hand, state.lastDiscard.tile], me.melds.length) && (
              <button className="btn gold" onClick={() => setState(claimHu(state, meIdx))}>胡</button>
            )}
            {canPong(me.hand, state.lastDiscard.tile) && (
              <button className="btn" style={{ marginLeft: 8 }} onClick={() => setState(claimPong(state, meIdx))}>碰</button>
            )}
            {chiOpts.map((need, i) => (
              <button key={i} className="btn magenta" style={{ marginLeft: 8 }} onClick={() => setState(claimChi(state, meIdx, need))}>
                吃 {need.join('+')}
              </button>
            ))}
            <button className="btn" style={{ marginLeft: 8 }} onClick={() => setState(passReact(state))}>过</button>
          </div>
        )}
        {state.winner !== null && <div className="coach">{state.players[state.winner].name} 胡牌！</div>}
      </div>
      <div className="holo-panel side-panel">
        <h2>牌局日志</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <button className="btn magenta" style={{ marginTop: 12 }} onClick={() => setState(createMahjong([{ id: 'you', name: '你', isBot: false }]))}>新局</button>
      </div>
    </div>
  )
}
