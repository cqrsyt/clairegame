import { useEffect, useMemo, useState } from 'react'
import { createGomoku, playGomoku, gomokuAI, gomokuCoach, gomokuPosLabel, type GomokuState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

export default function GomokuGame() {
  const [state, setState] = useState<GomokuState>(() => createGomoku())
  const [vsAI, setVsAI] = useState(true)
  const lm = state.lastMove
  const myTurn = !state.winner && !(vsAI && state.turn === 2)
  const move = useMemo(() => (myTurn ? gomokuCoach.suggestMove(state) : null), [state, myTurn])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 2) return
    const t = setTimeout(() => {
      const m = gomokuAI(state)
      if (m) {
        playSfx('move')
        setState((s) => playGomoku(s, m.r, m.c))
      }
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state, vsAI])

  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="board-scale">
        <div className="gomoku-board">
          {state.board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`gomoku-cell ${lm && lm.r === r && lm.c === c ? 'last-move' : ''}`}
                onClick={() => {
                  if (state.winner || (vsAI && state.turn === 2)) return
                  playSfx('move')
                  setState(playGomoku(state, r, c))
                }}
              >
                {cell === 1 && <div className={`stone b ${lm && lm.r === r && lm.c === c ? 'piece-fly' : ''}`} />}
                {cell === 2 && <div className={`stone w ${lm && lm.r === r && lm.c === c ? 'piece-fly' : ''}`} />}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>五子棋</h2>
        <LiveGuide
          title="助手"
          lines={[gomokuCoach.explain(state, move), vsAI && state.turn === 2 ? '白棋正在思考，请稍候。' : '']}
          suggestion={move ? `建议：${gomokuPosLabel(move)}` : null}
          onApply={move && myTurn ? () => { playSfx('move'); setState(playGomoku(state, move.r, move.c)) } : null}
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战电脑（你执黑）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn magenta" onClick={() => setState(createGomoku())}>再来一局</button>
        </div>
      </div>
      <ShareCard gameId="gomoku" title="五子棋" result={state.winner === 1 ? '黑棋连五获胜' : '白棋连五获胜'} open={!!state.winner} />
    </div>
  )
}
