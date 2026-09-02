import { useEffect, useMemo, useState } from 'react'
import { createXiangqi, xiangqiLegalFrom, applyXiangqiMove, xiangqiAI, xiangqiCoach, xiangqiNotation, type XiangqiState, type XPiece } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

const LABEL: Record<string, string> = {
  RK: '帅', RA: '仕', RB: '相', RN: '马', RR: '车', RC: '炮', RP: '兵',
  BK: '将', BA: '士', BB: '象', BN: '马', BR: '车', BC: '炮', BP: '卒',
}

export default function XiangqiGame() {
  const [state, setState] = useState<XiangqiState>(() => createXiangqi())
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [vsAI, setVsAI] = useState(true)
  const targets = useMemo(() => (sel ? xiangqiLegalFrom(state, sel.r, sel.c) : []), [state, sel])
  const lm = state.lastMove
  const myTurn = !state.winner && !(vsAI && state.turn === 'B')
  const move = useMemo(() => (myTurn ? xiangqiCoach.suggestMove(state) : null), [state, myTurn])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 'B') return
    const t = setTimeout(() => {
      const m = xiangqiAI(state)
      if (m) {
        playSfx(state.board[m.tr][m.tc] ? 'capture' : 'move')
        setState((s) => applyXiangqiMove(s, m.fr, m.fc, m.tr, m.tc))
      }
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state, vsAI])

  const click = (r: number, c: number) => {
    if (state.winner) return
    if (vsAI && state.turn === 'B') return
    if (sel && targets.some((t) => t.r === r && t.c === c)) {
      playSfx(state.board[r][c] ? 'capture' : 'move')
      setState(applyXiangqiMove(state, sel.r, sel.c, r, c))
      setSel(null)
      return
    }
    const p = state.board[r][c]
    if (p && p[0] === state.turn) setSel({ r, c })
    else setSel(null)
  }

  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="board-scale">
        <div className="xq-board">
          {state.board.map((row, r) =>
            row.map((p: XPiece, c) => {
              const selected = sel?.r === r && sel?.c === c
              const hl = targets.some((t) => t.r === r && t.c === c)
              const last = lm && ((lm.tr === r && lm.tc === c) || (lm.fr === r && lm.fc === c))
              return (
                <div
                  key={`${r}-${c}`}
                  className={`xq-cell ${selected ? 'selected' : ''} ${hl ? 'hl' : ''} ${last ? 'last-move' : ''}`}
                  onClick={() => click(r, c)}
                >
                  {p ? (
                    <span className={`xq-disc ${p.startsWith('R') ? 'red' : 'black'} ${lm && lm.tr === r && lm.tc === c ? 'piece-fly' : ''}`}>{LABEL[p]}</span>
                  ) : ((r === 4 || r === 5) && c === 4 ? '河' : '')}
                </div>
              )
            })
          )}
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>中国象棋</h2>
        <LiveGuide
          title="助手"
          lines={[xiangqiCoach.explain(state, move), myTurn ? '红字棋是你的；点棋子后，亮格就是能走的位置。' : '黑方正在思考，请稍候。']}
          suggestion={move ? `建议：${xiangqiNotation(state, move)}` : null}
          onApply={move && myTurn ? () => {
            playSfx(state.board[move.tr][move.tc] ? 'capture' : 'move')
            setState(applyXiangqiMove(state, move.fr, move.fc, move.tr, move.tc))
            setSel(null)
          } : null}
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战电脑（你执红）
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn magenta" onClick={() => { setState(createXiangqi()); setSel(null) }}>再来一局</button>
        </div>
      </div>
      <ShareCard gameId="xiangqi" title="中国象棋" result={state.winner === 'R' ? '红方胜利' : '黑方胜利'} open={!!state.winner} />
    </div>
  )
}
