import { useEffect, useMemo, useState } from 'react'
import { createJunqi, junqiLegal, applyJunqi, junqiAI, junqiCoach, ANIMALS, isRiver, isDen, isTrap, type JunqiState } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'

export default function JunqiGame() {
  const [state, setState] = useState<JunqiState>(() => createJunqi())
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  const [vsAI, setVsAI] = useState(true)
  const dest = useMemo(() => sel ? junqiLegal(state, sel.r, sel.c) : [], [state, sel])
  const myTurn = state.winner === null && !(vsAI && state.turn === 1)
  const move = useMemo(() => (myTurn ? junqiCoach.suggestMove(state) : null), [state, myTurn])

  useEffect(() => {
    if (!vsAI || state.winner !== null || state.turn !== 1) return
    const t = setTimeout(() => {
      const m = junqiAI(state)
      if (m) {
        playSfx('move')
        setState((s) => applyJunqi(s, m.fr, m.fc, m.tr, m.tc))
      }
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state, vsAI])

  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="board-scale">
        <div className="junqi-board">
          {state.board.map((row, r) => row.map((p, c) => {
            const cls = [
              'junqi-cell',
              isRiver(r, c) ? 'river' : '',
              isDen(r, c) ? 'den' : '',
              isTrap(r, c) ? 'trap' : '',
              p ? `p${p.side}` : '',
              sel?.r === r && sel?.c === c ? 'sel' : '',
              dest.some((d) => d.r === r && d.c === c) ? 'hl' : '',
            ].join(' ')
            return (
              <div
                key={`${r}-${c}`}
                className={cls}
                onClick={() => {
                  if (state.winner !== null || (vsAI && state.turn === 1)) return
                  if (sel && dest.some((d) => d.r === r && d.c === c)) {
                    playSfx(p ? 'capture' : 'move')
                    setState(applyJunqi(state, sel.r, sel.c, r, c))
                    setSel(null)
                    return
                  }
                  if (p && p.side === state.turn) setSel({ r, c })
                  else setSel(null)
                }}
              >
                {p ? ANIMALS[8 - p.rank] : (isDen(r, c) ? '穴' : isRiver(r, c) ? '河' : '')}
              </div>
            )
          }))}
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>军棋 · 斗兽棋</h2>
        <LiveGuide
          title="助手"
          lines={[junqiCoach.explain(state, move)]}
          suggestion={move ? `建议：第 ${move.fr + 1} 行第 ${move.fc + 1} 列 → 第 ${move.tr + 1} 行第 ${move.tc + 1} 列` : null}
          onApply={move && myTurn ? () => {
            playSfx(state.board[move.tr][move.tc] ? 'capture' : 'move')
            setState(applyJunqi(state, move.fr, move.fc, move.tr, move.tc))
            setSel(null)
          } : null}
        />
        <p><span className="camp-chip camp-wolf">红方 · 你</span>　<span className="camp-chip camp-good">蓝方 · 电脑</span></p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战电脑
        </label>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <button className="btn magenta" onClick={() => { setState(createJunqi()); setSel(null) }}>再来一局</button>
        <div className="note-enhance">可增强：陆战棋暗子布局、地雷与军旗。</div>
      </div>
      <ShareCard gameId="junqi" title="军棋" result={state.winner === 0 ? '红方获胜' : '蓝方获胜'} open={state.winner !== null} />
    </div>
  )
}
