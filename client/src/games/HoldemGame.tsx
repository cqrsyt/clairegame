import { useEffect, useState } from 'react'
import { createHoldem, holdemCall, holdemFold, holdemRaise, holdemBot, holdemCoach, labelH, isRedH, type HoldemState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'

function Cards({ cards, hide }: { cards: { r: number; s: number; id: string }[]; hide?: boolean }) {
  return (
    <div className="mj-hand">
      {cards.map((c) => (
        <div key={c.id} className={`playing-card ${isRedH(c) ? 'red' : 'black'}`}>{hide ? '✦' : labelH(c)}</div>
      ))}
    </div>
  )
}

export default function HoldemGame() {
  const [state, setState] = useState<HoldemState>(() => createHoldem())

  useEffect(() => {
    if (state.phase !== 'pre' && state.phase !== 'flop') return
    if (!state.players[state.toAct].isBot) return
    const t = setTimeout(() => setState((s) => holdemBot(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const ended = state.winner !== null
  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 280 }}>
        <h2>德州扑克 · 底池 {state.pot}</h2>
        <p>公共牌</p>
        <Cards cards={state.board} />
        {state.players.map((p, i) => (
          <div key={p.id} style={{ marginTop: 10 }}>
            <strong className={i === 0 ? 'camp-chip camp-good' : 'camp-chip camp-wolf'}>{p.name}</strong>
            <span style={{ marginLeft: 8 }}>筹码 {p.stack} · 已下 {p.bet}</span>
            <Cards cards={p.hole} hide={i !== 0 && !ended} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn" disabled={ended || (state.phase !== 'pre' && state.phase !== 'flop') || state.toAct !== 0} onClick={() => { playSfx('move'); setState(holdemCall(state, 0)) }}>跟注</button>
          <button className="btn gold" disabled={ended || (state.phase !== 'pre' && state.phase !== 'flop') || state.toAct !== 0} onClick={() => { playSfx('move'); setState(holdemRaise(state, 0)) }}>加注</button>
          <button className="btn magenta" disabled={ended || (state.phase !== 'pre' && state.phase !== 'flop') || state.toAct !== 0} onClick={() => setState(holdemFold(state, 0))}>弃牌</button>
          <button className="btn" onClick={() => setState(createHoldem())}>再来一局</button>
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>旁白</h2>
        <div className="coach">{holdemCoach.explain(state)}</div>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <div className="note-enhance">跟注后会先看到三张翻牌，再行动一次，然后发完摊牌。</div>
      </div>
      <ShareCard gameId="holdem" title="德州扑克" result={state.winner === 0 ? '你赢下底池' : '对手赢下底池'} open={ended} />
    </div>
  )
}
