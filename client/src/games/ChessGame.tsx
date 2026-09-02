import { useEffect, useMemo, useState } from 'react'
import { createChess, chessLegalFrom, applyChessMove, chessAI, chessCoach, chessMoveLabel, type ChessState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

const GLYPH: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

export default function ChessGame() {
  const [state, setState] = useState<ChessState>(() => createChess())
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [vsAI, setVsAI] = useState(true)
  const targets = useMemo(() => (sel ? chessLegalFrom(state, sel.r, sel.c) : []), [state, sel])
  const lm = state.lastMove
  const myTurn = !state.winner && !(vsAI && state.turn === 'b')
  const move = useMemo(() => (myTurn ? chessCoach.suggestMove(state) : null), [state, myTurn])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 'b') return
    const t = setTimeout(() => {
      const m = chessAI(state)
      if (m) {
        const cap = !!state.board[m.tr][m.tc]
        playSfx(cap ? 'capture' : 'move')
        setState((s) => applyChessMove(s, m.fr, m.fc, m.tr, m.tc))
      }
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state, vsAI])

  const click = (r: number, c: number) => {
    if (state.winner) return
    if (vsAI && state.turn === 'b') return
    if (sel) {
      const hit = targets.some((t) => t.r === r && t.c === c)
      if (hit) {
        playSfx(state.board[r][c] ? 'capture' : 'move')
        setState(applyChessMove(state, sel.r, sel.c, r, c))
        setSel(null)
        return
      }
    }
    const p = state.board[r][c]
    if (p && ((state.turn === 'w' && p === p.toUpperCase()) || (state.turn === 'b' && p === p.toLowerCase()))) {
      setSel({ r, c })
    } else setSel(null)
  }

  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="board-scale">
        <div className="chess-board">
          {state.board.map((row, r) =>
            row.map((p, c) => {
              const light = (r + c) % 2 === 0
              const selected = sel?.r === r && sel?.c === c
              const target = targets.some((t) => t.r === r && t.c === c)
              const last = lm && ((lm.tr === r && lm.tc === c) || (lm.fr === r && lm.fc === c))
              return (
                <div
                  key={`${r}-${c}`}
                  className={`sq ${light ? 'light' : 'dark'} ${selected ? 'selected' : ''} ${target ? 'target hl' : ''} ${last ? 'last-move' : ''}`}
                  onClick={() => click(r, c)}
                >
                  {p ? <span className={`piece ${p === p.toUpperCase() ? 'camp-ivory' : 'camp-void'} ${lm && lm.tr === r && lm.tc === c ? 'piece-fly' : ''}`}>{GLYPH[p]}</span> : ''}
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>国际象棋</h2>
        <LiveGuide
          title="助手"
          lines={[chessCoach.explain(state, move), myTurn ? '点棋子后，亮格就是能走的位置。' : '黑方正在思考，请稍候。']}
          suggestion={move ? `建议：${chessMoveLabel(state, move)}` : null}
          onApply={move && myTurn ? () => {
            playSfx(state.board[move.tr][move.tc] ? 'capture' : 'move')
            setState(applyChessMove(state, move.fr, move.fc, move.tr, move.tc))
            setSel(null)
          } : null}
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战电脑（你执白）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn magenta" onClick={() => { setState(createChess()); setSel(null) }}>再来一局</button>
        </div>
      </div>
      <ShareCard gameId="chess" title="国际象棋" result={state.winner === 'draw' ? '和棋' : state.winner === 'w' ? '白方胜利' : '黑方胜利'} open={!!state.winner} />
    </div>
  )
}
