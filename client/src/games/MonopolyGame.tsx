import { useEffect, useMemo, useState } from 'react'
import { createMonopoly, monoRoll, monoBuy, monoEndTurn, monoBot, monopolyCoach, type MonoState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

export default function MonopolyGame() {
  const [state, setState] = useState<MonoState>(() => createMonopoly())

  useEffect(() => {
    if (state.winner !== null) return
    if (!state.players[state.turn].isBot) return
    const t = setTimeout(() => setState((s) => monoBot(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const me = state.players[0]
  const tile = state.tiles[me.pos]
  const canBuy = state.turn === 0 && state.dice !== null && tile.kind === 'prop' && tile.owner === null && me.cash >= tile.price
  const myTurn = state.winner === null && state.turn === 0
  const act = useMemo(() => (myTurn ? monopolyCoach.suggestMove(state) : null), [state, myTurn])
  const actZh = { roll: '掷骰', buy: '购买此地', end: '结束回合' } as const

  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 280 }}>
        <h2>大富翁 · 简化环线</h2>
        <div className="mono-track">
          {state.tiles.map((t, i) => (
            <div key={i} className={`mono-sq ${t.owner !== null ? `owned${t.owner}` : ''}`}>
              <strong>{t.name}</strong>
              <div>{t.kind === 'prop' ? `${t.price} / 租 ${t.rent}` : t.kind}</div>
              <div>
                {state.players.map((p, pi) => p.pos === i && !p.bankrupt ? <span key={p.id} className={`token t${pi}`} title={p.name} /> : null)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          {state.players.map((p, i) => (
            <div key={p.id}>
              <span className={`token t${i}`} /> {p.name}　现金 {p.cash}{p.bankrupt ? '（破产）' : ''}{state.turn === i ? ' · 行动中' : ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn" disabled={state.turn !== 0 || state.dice !== null || state.winner !== null} onClick={() => { playSfx('move'); setState(monoRoll(state)) }}>掷骰</button>
          <button className="btn gold" disabled={!canBuy} onClick={() => setState(monoBuy(state))}>购买此地</button>
          <button className="btn magenta" disabled={state.turn !== 0 || state.dice === null || state.winner !== null} onClick={() => setState(monoEndTurn(state))}>结束回合</button>
          <button className="btn" onClick={() => setState(createMonopoly())}>再来一局</button>
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>旁白</h2>
        <LiveGuide
          title="助手"
          lines={[monopolyCoach.explain(state, act)]}
          suggestion={act ? `建议：${actZh[act]}` : null}
          onApply={act && myTurn ? () => {
            if (act === 'roll') { playSfx('move'); setState(monoRoll(state)) }
            else if (act === 'buy') setState(monoBuy(state))
            else setState(monoEndTurn(state))
          } : null}
        />
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <div className="note-enhance">可增强：房屋旅馆、完整机会卡、拍卖与更多玩家。</div>
      </div>
      <ShareCard gameId="monopoly" title="大富翁" result={state.winner === 0 ? '你成为最后的持有者' : `${state.players[state.winner || 0]?.name} 获胜`} open={state.winner !== null} />
    </div>
  )
}
