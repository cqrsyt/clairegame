import { useEffect, useState } from 'react'
import { createGo, playGo, passGo, goAI, goCoach, scoreGo, type GoState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

export default function GoGame() {
  const [state, setState] = useState<GoState>(() => createGo(9))
  const [vsAI, setVsAI] = useState(true)

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
      <div className="board-scale">
        <div className="go-board n9">
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
              {cell === 1 && <div className="stone b piece-fly" />}
              {cell === 2 && <div className="stone w piece-fly" />}
            </div>
          )))}
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>围棋 · 九路</h2>
        <LiveGuide title="这一步" lines={[goCoach.explain(state), "气尽的棋会被提掉。连续两手停着即终局。"]} />
        <p>黑 {sc.b.toFixed(1)} · 白 {sc.w.toFixed(1)}（含贴目 3.5）</p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战电脑（你执黑）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setState(passGo(state))}>停着</button>
          <button className="btn" onClick={() => {
            const m = goAI(state)
            if (m !== 'pass') setState(playGo(state, m.r, m.c))
          }}>请教练帮忙</button>
          <button className="btn magenta" onClick={() => setState(createGo(9))}>再来一局</button>
        </div>
        <div className="note-enhance">可增强：完整劫争、数目与死子判定、十九路棋盘。</div>
      </div>
      <ShareCard gameId="go" title="围棋" result={state.winner === 1 ? '黑棋获胜' : '白棋获胜'} open={!!state.winner} />
    </div>
  )
}
