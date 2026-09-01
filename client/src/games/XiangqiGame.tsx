import { useEffect, useMemo, useState } from 'react'
import { createXiangqi, xiangqiLegalFrom, applyXiangqiMove, xiangqiAI, xiangqiCoach, type XiangqiState, type XPiece } from '@aether/shared'

const LABEL: Record<string, string> = {
  RK: '帅', RA: '仕', RB: '相', RN: '马', RR: '车', RC: '炮', RP: '兵',
  BK: '将', BA: '士', BB: '象', BN: '马', BR: '车', BC: '炮', BP: '卒',
}

export default function XiangqiGame() {
  const [state, setState] = useState<XiangqiState>(() => createXiangqi())
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [vsAI, setVsAI] = useState(true)
  const targets = useMemo(() => (sel ? xiangqiLegalFrom(state, sel.r, sel.c) : []), [state, sel])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 'B') return
    const t = setTimeout(() => {
      const m = xiangqiAI(state)
      if (m) setState((s) => applyXiangqiMove(s, m.fr, m.fc, m.tr, m.tc))
    }, 400)
    return () => clearTimeout(t)
  }, [state, vsAI])

  const click = (r: number, c: number) => {
    if (state.winner) return
    if (vsAI && state.turn === 'B') return
    if (sel && targets.some((t) => t.r === r && t.c === c)) {
      setState(applyXiangqiMove(state, sel.r, sel.c, r, c))
      setSel(null)
      return
    }
    const p = state.board[r][c]
    if (p && p[0] === state.turn) setSel({ r, c })
    else setSel(null)
  }

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="xq-board">
        {state.board.map((row, r) =>
          row.map((p: XPiece, c) => {
            const selected = sel?.r === r && sel?.c === c
            const hl = targets.some((t) => t.r === r && t.c === c)
            return (
              <div
                key={`${r}-${c}`}
                className={`xq-cell ${p?.startsWith('R') ? 'red' : ''} ${selected ? 'selected' : ''} ${hl ? 'hl' : ''}`}
                onClick={() => click(r, c)}
              >
                {p ? LABEL[p] : (r === 4 || r === 5) && c === 4 ? '楚' : ''}
              </div>
            )
          })
        )}
      </div>
      <div className="holo-panel side-panel">
        <h2>中国象棋</h2>
        <div className="coach">{xiangqiCoach.explain(state)}</div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战 AI（你执红）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={() => {
            const m = xiangqiCoach.suggestMove(state)
            if (m) setSel({ r: m.fr, c: m.fc })
          }}>AI 教练建议</button>
          <button className="btn magenta" onClick={() => { setState(createXiangqi()); setSel(null) }}>新局</button>
        </div>
      </div>
    </div>
  )
}
