import { useEffect, useMemo, useState } from 'react'
import {
  createCheckers, destinations, moveChecker, checkersAI, checkersCoach,
  STAR_CELLS, CAMP_ORDER, campOf, hexPixel,
  type CheckersState, type CampId,
} from '@aether/shared'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'
import './CheckersBoard.css'

const CAMP_FILL: Record<CampId | 'center', string> = {
  N: '#3dffff',
  NE: '#ffc85a',
  SE: '#b8ff3d',
  S: '#ff8a1a',
  SW: '#ffb08a',
  NW: '#a78bff',
  center: '#efe4c8',
}

const SIZE = 18
const PAD = 48

function boardBox() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const k of STAR_CELLS) {
    const [q, r] = k.split(',').map(Number)
    const { x, y } = hexPixel(q, r, SIZE)
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  return { minX: minX - PAD, minY: minY - PAD, w: maxX - minX + PAD * 2, h: maxY - minY + PAD * 2 }
}

export default function CheckersGame() {
  const [state, setState] = useState<CheckersState>(() => createCheckers())
  const [vsAI, setVsAI] = useState(true)
  const dests = useMemo(() => (state.selected ? destinations(state, state.selected) : []), [state])
  const myTurn = !state.winner && !(vsAI && state.turn === 2)
  const move = useMemo(() => (myTurn ? checkersCoach.suggestMove(state) : null), [state, myTurn])
  const box = useMemo(() => boardBox(), [])

  useEffect(() => {
    if (!vsAI || state.winner || state.turn !== 2) return
    const t = setTimeout(() => {
      const m = checkersAI(state)
      if (m) setState((s) => moveChecker(s, m.from, m.to))
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state, vsAI])

  const onHole = (k: string) => {
    if (state.winner || (vsAI && state.turn === 2)) return
    if (state.selected && dests.includes(k)) {
      setState(moveChecker(state, state.selected, k))
      return
    }
    if (state.cells[k] === state.turn) setState({ ...state, selected: k })
    else setState({ ...state, selected: null })
  }

  return (
    <div className="board-wrap checkers-play">
      <div className="holo-panel checkers-stage">
        <div className="checkers-star-wrap">
          <svg viewBox={`${box.minX} ${box.minY} ${box.w} ${box.h}`} role="img" aria-label="中国跳棋六角星棋盘">
            <defs>
              <linearGradient id="cc-chrome" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffb08a" />
                <stop offset="50%" stopColor="#3dffff" />
                <stop offset="100%" stopColor="#ff4ae8" />
              </linearGradient>
            </defs>
            <rect x={box.minX} y={box.minY} width={box.w} height={box.h} rx="22" fill="#2a1422" stroke="url(#cc-chrome)" strokeWidth="4" />
            <rect x={box.minX + 10} y={box.minY + 10} width={box.w - 20} height={box.h - 20} rx="16" fill="#3a2438" />
            {[...STAR_CELLS].map((k) => {
              const [q, r] = k.split(',').map(Number)
              const { x, y } = hexPixel(q, r, SIZE)
              const camp = campOf(k)
              const v = state.cells[k]
              const isDest = dests.includes(k)
              const isSel = state.selected === k
              const hole = CAMP_FILL[camp]
              return (
                <g
                  key={k}
                  className="checkers-hole"
                  transform={`translate(${x} ${y})`}
                  onClick={() => onHole(k)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHole(k) }
                  }}
                >
                  <circle r="11.5" fill={hole} opacity={camp === 'center' ? 0.55 : 0.38} />
                  <circle className="checkers-ring" r="9.2" fill="#1a1014" stroke={isSel ? '#fffaf0' : isDest ? '#ffc85a' : 'rgba(255,244,228,0.35)'} strokeWidth={isSel || isDest ? 2.2 : 1} />
                  {isDest && !v && <circle r="4" fill="#ffc85a" opacity="0.9" />}
                  {v === 1 && (
                    <>
                      <circle r="7.4" fill="#c45a08" />
                      <circle r="6.2" fill="#ff8a1a" />
                      <circle cx="-1.6" cy="-1.8" r="2" fill="#ffd2a8" opacity="0.7" />
                    </>
                  )}
                  {v === 2 && (
                    <>
                      <circle r="7.4" fill="#0a6a6a" />
                      <circle r="6.2" fill="#3dffff" />
                      <circle cx="-1.6" cy="-1.8" r="2" fill="#e8ffff" opacity="0.75" />
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <div className="holo-panel side-panel">
        <h2>跳棋 · 六角星</h2>
        <LiveGuide
          title="助手"
          lines={[checkersCoach.explain(state, move), myTurn ? '暖橙是您的南营，青色是北营。点一枚棋，再点高亮的孔。能跳就连跳。' : '北营正在走棋，请稍候。']}
          suggestion={move ? `建议：(${move.from}) → (${move.to})` : null}
          onApply={move && myTurn ? () => setState(moveChecker(state, move.from, move.to)) : null}
        />
        <p style={{ color: 'var(--ivory)', fontSize: '0.88rem' }}>
          121 孔六角星。六个尖角是营地
          {CAMP_ORDER.map((id) => (
            <span key={id} style={{ color: CAMP_FILL[id], marginLeft: 6 }}>{id}</span>
          ))}
        </p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={vsAI} onChange={(e) => setVsAI(e.target.checked)} /> 对战电脑（您执南营）
        </label>
        <button className="btn magenta" style={{ marginTop: 12 }} onClick={() => setState(createCheckers())}>再来一局</button>
      </div>
    </div>
  )
}
