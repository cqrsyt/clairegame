import { useEffect, useState } from 'react'
import { createUno, playUno, drawUno, canPlayUno, unoBotStep, labelUno, type UnoState, type UnoColor } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

const COLS: UnoColor[] = ['R', 'G', 'B', 'Y']

export default function UnoGame() {
  const [state, setState] = useState<UnoState>(() => createUno())
  const [wildFor, setWildFor] = useState<string | null>(null)
  const me = 0

  useEffect(() => {
    if (state.winner !== null) return
    if (!state.players[state.current].isBot) return
    const t = setTimeout(() => setState((s) => unoBotStep(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const play = (id: string, color?: UnoColor) => {
    const card = state.players[me].hand.find((c) => c.id === id)
    if (card && (card.value === 'wild' || card.value === '+4') && !color) {
      setWildFor(id)
      return
    }
    setWildFor(null)
    playSfx('move')
    setState(playUno(state, me, id, color))
  }

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 280 }}>
        <h2>UNO · 当前色 {state.color} · 弃牌 {state.discard.length ? labelUno(state.discard[state.discard.length - 1]) : ''}</h2>
        {state.players.map((p, i) => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <strong style={{ color: i === state.current ? 'var(--cyan)' : 'var(--muted)' }}>{p.name}</strong>
            <span style={{ marginLeft: 8, color: 'var(--muted)' }}>{p.hand.length} 张</span>
          </div>
        ))}
        <div className="mj-hand">
          {state.players[me].hand.map((c) => (
            <button
              key={c.id}
              className={`tile uno-tile uno-${c.color}`}
              disabled={state.current !== me || state.winner !== null || !canPlayUno(c, state)}
              onClick={() => play(c.id)}
            >{labelUno(c)}</button>
          ))}
        </div>
        {wildFor && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLS.map((col) => (
              <button key={col} className="btn" onClick={() => play(wildFor, col)}>{col}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn" disabled={state.current !== me || state.winner !== null} onClick={() => { playSfx('move'); setState(drawUno(state, me)) }}>摸牌</button>
          <button className="btn magenta" onClick={() => setState(createUno())}>新局</button>
        </div>
        {state.winner !== null && <div className="coach">{state.players[state.winner].name} 获胜</div>}
      </div>
      <div className="holo-panel side-panel">
        <LiveGuide title="这一步" lines={[state.current===0 ? "对上颜色或数字就能出。没有牌就摸一张。" : "对手正在出牌。", state.winner!==null ? "有人出完了。" : "当前颜色："+state.color]} />
        <h2>记录</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
      </div>
      <ShareCard gameId="uno" title="UNO" result={state.winner === 0 ? '你赢了 UNO' : `${state.players[state.winner || 0]?.name} 获胜`} open={state.winner !== null} />
    </div>
  )
}
