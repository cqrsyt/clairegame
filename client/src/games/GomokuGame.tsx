import { useEffect, useState } from 'react'
import { createGomoku, playGomoku, gomokuAI, gomokuCoach, type GomokuState } from '@aether/shared'

export default function GomokuGame() {
  const [state, setState] = useState<GomokuState>(() => createGomoku())
  const [vsAI, setVsAI] = useState(true)

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 2) return
    const t = setTimeout(() => {
      const m = gomokuAI(state)
      if (m) setState((s) => playGomoku(s, m.r, m.c))
    }, 280)
    return () => clearTimeout(t)
  }, [state, vsAI])

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="gomoku-board">
        {state.board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="gomoku-cell"
              onClick={() => {
                if (state.winner || (vsAI && state.turn === 2)) return
                setState(playGomoku(state, r, c))
              }}
            >
              {cell === 1 && <div className="stone b" />}
              {cell === 2 && <div className="stone w" />}
            </div>
          ))
        )}
      </div>
      <div className="holo-panel side-panel">
        <h2>五子棋</h2>
        <div className="coach">{gomokuCoach.explain(state)}</div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战 AI（你执黑）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={() => {
            const m = gomokuCoach.suggestMove(state)
            if (m) setState(playGomoku(state, m.r, m.c))
          }}>AI 教练落子</button>
          <button className="btn magenta" onClick={() => setState(createGomoku())}>新局</button>
        </div>
      </div>
    </div>
  )
}
