import { useEffect, useState } from 'react'
import { createAeroplane, rollDice, movablePlanes, movePlane, aeroAI, aeroCoach, type AeroState, type AeroColor } from '@aether/shared'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

export default function AeroplaneGame() {
  const [state, setState] = useState<AeroState>(() => createAeroplane(['red', 'yellow', 'blue', 'green']))
  const movable = movablePlanes(state)

  useEffect(() => {
    if (state.winner || state.turn === 'red') return
    const t = setTimeout(() => {
      let s = state
      if (s.dice === null) s = rollDice(s)
      const m = aeroAI(s)
      if (!m) {
        const i = s.players.indexOf(s.turn)
        setState({ ...s, dice: null, turn: s.players[(i + 1) % s.players.length], extraRoll: false })
        return
      }
      if (state.dice === null) {
        setState(s)
        return
      }
      setState(movePlane(s, m))
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const colors: AeroColor[] = state.players

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', minWidth: 320 }}>
        <div className="aero-board">
          {colors.map((color) => (
            <div key={color} className={`hangar ${color}`}>
              <strong className={`camp-chip plane-lab ${color}`}>{({red:'红',yellow:'黄',blue:'蓝',green:'绿'} as const)[color]}</strong>
              <div>
                {state.planes.filter((p) => p.color === color).map((p) => {
                  const can = movable.some((m) => m.color === p.color && m.id === p.id)
                  return (
                    <button
                      key={p.id}
                      className={`plane ${color} ${can ? 'movable' : ''}`}
                      disabled={!can}
                      onClick={() => setState(movePlane(state, { color: p.color, id: p.id }))}
                    >
                      {p.pos === -1 ? '坝' : p.pos === 57 ? '终' : p.pos}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn" disabled={state.dice !== null || !!state.winner || state.turn !== 'red'} onClick={() => setState(rollDice(state))}>
            掷骰 {state.dice !== null ? `· ${state.dice}` : ''}
          </button>
          {state.dice !== null && movable.length === 0 && state.turn === 'red' && (
            <button className="btn magenta" style={{ marginLeft: 8 }} onClick={() => {
              const i = state.players.indexOf(state.turn)
              setState({ ...state, dice: null, turn: state.players[(i + 1) % state.players.length], extraRoll: false })
            }}>无法移动，跳过</button>
          )}
        </div>
      </div>
      <div className="holo-panel side-panel">
        <h2>飞行棋</h2>
        <LiveGuide title="这一步" lines={[
          aeroCoach.explain(state),
          state.turn === 'red' ? (state.dice === null ? '请掷骰。掷到 6 才可从机库起飞。' : '点一架高亮的飞机前进。撞到别人会把它送回机库。') : '电脑正在走棋，四色飞机很好认：红、黄、蓝、绿。',
        ]} />
        <button className="btn magenta" onClick={() => setState(createAeroplane(['red', 'yellow', 'blue', 'green']))}>再来一局</button>
      </div>
    </div>
  )
}
