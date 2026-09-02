import { useEffect, useMemo, useState } from 'react'
import { createGo, playGo, passGo, goAI, goCoach, scoreGo, isStarPoint, type GoState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'
import './GoBoard.css'

const SIZE = 19

export default function GoGame() {
  const [state, setState] = useState<GoState>(() => createGo(SIZE))
  const [vsAI, setVsAI] = useState(true)
  const myTurn = !state.winner && !(vsAI && state.turn === 2)
  const move = useMemo(() => (myTurn ? goCoach.suggestMove(state) : null), [state, myTurn])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 2) return
    const t = setTimeout(() => {
      const m = goAI(state)
      if (m === 'pass') setState((s) => passGo(s))
      else { playSfx('move'); setState((s) => playGo(s, m.r, m.c)) }
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state, vsAI])

  const sc = scoreGo(state)
  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="board-scale go-scale">
        <div className="go-board n19" style={{ width: 'min(100%, 560px)' }}>
          {state.board.map((row, r) => row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`go-cell ${state.lastMove && state.lastMove.r === r && state.lastMove.c === c ? 'last-move' : ''}`}
              onClick={() => {
                if (state.winner || (vsAI && state.turn === 2)) return
                playSfx('move')
                setState(playGo(state, r, c))
              }}
            >
              {!cell && isStarPoint(state.size, r, c) && <span className="go-hoshi" />}
              {cell === 1 && <div className="stone b piece-fly" />}
              {cell === 2 && <div className="stone w piece-fly" />}
            </div>
          )))}
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>围棋 · 十九路</h2>
        <LiveGuide
          title="助手"
          lines={[goCoach.explain(state, move), myTurn ? '气尽的棋会被提掉。连续两手停着即终局。开局可先看看星位。' : '白棋正在思考，请稍候。']}
          suggestion={move === 'pass' ? '建议：停着' : move ? `建议：第 ${move.r + 1} 行第 ${move.c + 1} 列` : null}
          onApply={move && myTurn ? () => {
            if (move === 'pass') setState(passGo(state))
            else { playSfx('move'); setState(playGo(state, move.r, move.c)) }
          } : null}
        />
        <p>黑 {sc.b.toFixed(1)} · 白 {sc.w.toFixed(1)}（含贴目 3.5）</p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战电脑（你执黑）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setState(passGo(state))}>停着</button>
          <button className="btn magenta" onClick={() => setState(createGo(SIZE))}>再来一局</button>
        </div>
        <div className="note-enhance">可增强：完整劫争、目数与死子判定。</div>
      </div>
      <ShareCard gameId="go" title="围棋" result={state.winner === 1 ? '黑棋获胜' : '白棋获胜'} open={!!state.winner} />
    </div>
  )
}
