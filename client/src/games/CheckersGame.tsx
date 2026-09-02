import { useEffect, useMemo, useState } from 'react'
import { createCheckers, destinations, moveChecker, checkersAI, checkersCoach, STAR_CELLS, type CheckersState } from '@aether/shared'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

export default function CheckersGame() {
  const [state, setState] = useState<CheckersState>(() => createCheckers())
  const [vsAI, setVsAI] = useState(true)
  const dests = useMemo(() => (state.selected ? destinations(state, state.selected) : []), [state])
  const myTurn = !state.winner && !(vsAI && state.turn === 2)
  const move = useMemo(() => (myTurn ? checkersCoach.suggestMove(state) : null), [state, myTurn])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 2) return
    const t = setTimeout(() => {
      const m = checkersAI(state)
      if (m) setState((s) => moveChecker(s, m.from, m.to))
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state, vsAI])

  const cells = [...STAR_CELLS].sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number)
    const [bq, br] = b.split(',').map(Number)
    return ar - br || aq - bq
  })

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="checkers-board">
        {cells.map((k) => {
          const v = state.cells[k]
          return (
            <div
              key={k}
              className={`hex ${v === 1 ? 'p1' : v === 2 ? 'p2' : ''} ${state.selected === k ? 'sel' : ''} ${dests.includes(k) ? 'dest' : ''}`}
              title={k}
              onClick={() => {
                if (state.winner || (vsAI && state.turn === 2)) return
                if (state.selected && dests.includes(k)) {
                  setState(moveChecker(state, state.selected, k))
                  return
                }
                if (v === state.turn) setState({ ...state, selected: k })
                else setState({ ...state, selected: null })
              }}
            />
          )
        })}
      </div>
      <div className="holo-panel side-panel">
        <h2>跳棋</h2>
        <LiveGuide
          title="助手"
          lines={[checkersCoach.explain(state, move), myTurn ? '青色是你的棋，品红是对方。能跳就连跳。' : '对方正在走棋。']}
          suggestion={move ? `建议：(${move.from}) → (${move.to})` : null}
          onApply={move && myTurn ? () => setState(moveChecker(state, move.from, move.to)) : null}
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战 AI
        </label>
        <button className="btn magenta" style={{ marginTop: 12 }} onClick={() => setState(createCheckers())}>新局</button>
      </div>
    </div>
  )
}
