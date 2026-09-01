import { useEffect, useMemo, useState } from 'react'
import { createChess, chessLegalFrom, applyChessMove, chessAI, chessCoach, type ChessState } from '@aether/shared'

const GLYPH: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

export default function ChessGame() {
  const [state, setState] = useState<ChessState>(() => createChess())
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [vsAI, setVsAI] = useState(true)
  const targets = useMemo(() => (sel ? chessLegalFrom(state, sel.r, sel.c) : []), [state, sel])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 'b') return
    const t = setTimeout(() => {
      const m = chessAI(state)
      if (m) setState((s) => applyChessMove(s, m.fr, m.fc, m.tr, m.tc))
    }, 350)
    return () => clearTimeout(t)
  }, [state, vsAI])

  const click = (r: number, c: number) => {
    if (state.winner) return
    if (vsAI && state.turn === 'b') return
    if (sel) {
      const hit = targets.some((t) => t.r === r && t.c === c)
      if (hit) {
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

  const suggest = () => {
    const m = chessCoach.suggestMove(state)
    if (m) setSel({ r: m.fr, c: m.fc })
  }

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="chess-board">
        {state.board.map((row, r) =>
          row.map((p, c) => {
            const light = (r + c) % 2 === 0
            const selected = sel?.r === r && sel?.c === c
            const target = targets.some((t) => t.r === r && t.c === c)
            return (
              <div
                key={`${r}-${c}`}
                className={`sq ${light ? 'light' : 'dark'} ${selected ? 'selected' : ''} ${target ? 'target hl' : ''}`}
                onClick={() => click(r, c)}
              >
                {p ? GLYPH[p] : ''}
              </div>
            )
          })
        )}
      </div>
      <div className="holo-panel side-panel">
        <h2>国际象棋</h2>
        <div className="coach">{chessCoach.explain(state)}</div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战 AI（你执白）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn" onClick={suggest}>AI 教练建议</button>
          <button className="btn magenta" onClick={() => { setState(createChess()); setSel(null) }}>新局</button>
        </div>
      </div>
    </div>
  )
}
