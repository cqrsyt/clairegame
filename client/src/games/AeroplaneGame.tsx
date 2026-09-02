import { useEffect, useMemo, useState } from 'react'
import { createAeroplane, rollDice, movablePlanes, movePlane, aeroAI, aeroCoach, type AeroState, type AeroColor, type Plane } from '@aether/shared'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'
import './AeroBoard.css'

/** Classic 飞行棋 palette — high contrast on the ivory board. */
const CAMP: Record<AeroColor, { fill: string; dark: string; pad: string; label: string }> = {
  red:    { fill: '#e31c3d', dark: '#7a0818', pad: '#ff6a7c', label: '红' },
  yellow: { fill: '#f0c400', dark: '#7a5a00', pad: '#ffe56a', label: '黄' },
  blue:   { fill: '#1a5cff', dark: '#062a8c', pad: '#7aa4ff', label: '蓝' },
  green:  { fill: '#0a9a3a', dark: '#045220', pad: '#5de080', label: '绿' },
}

const ORDER: AeroColor[] = ['red', 'yellow', 'blue', 'green']

/**
 * Coordinate system (viewBox 0 0 1000 1000)
 *
 * Main track is a 14×14 cell ring (perimeter 4×13 = 52 squares).
 * Movement is counter-clockwise so engine START_INDEX lines up with hangars:
 *   red 0  bottom-left, yellow 13 top-left, blue 26 top-right, green 39 bottom-right.
 *
 * pos  -1      hangar 2×2 pad (by plane.id)
 * pos  0–51    ring cell (absolute board index)
 * pos  52–56   home stretch, 5 squares into the center (that color’s arm of the cross)
 * pos  57      finished, stacked at the 4-triangle hub
 */
const ORIGIN = 300
const LAST = 700
const CELL = (LAST - ORIGIN) / 13
const CX = 500
const CY = 500
const CELL_W = 26

const HANGAR: Record<AeroColor, { x: number; y: number }> = {
  yellow: { x: 28, y: 28 },
  blue: { x: 724, y: 28 },
  red: { x: 28, y: 724 },
  green: { x: 724, y: 724 },
}
const HANGAR_SIZE = 248

function trackXY(pos: number): { x: number; y: number } {
  const i = ((pos % 52) + 52) % 52
  const side = Math.floor(i / 13)
  const t = i % 13
  if (side === 0) return { x: ORIGIN, y: LAST - t * CELL }       // left, south → north
  if (side === 1) return { x: ORIGIN + t * CELL, y: ORIGIN }      // top, west → east
  if (side === 2) return { x: LAST, y: ORIGIN + t * CELL }        // right, north → south
  return { x: LAST - t * CELL, y: LAST }                         // bottom, east → west
}

function homeXY(color: AeroColor, step: number): { x: number; y: number } {
  // step 0..4 → pos 52..56, marching from the ring toward the hub
  const d = 36 + step * 34
  if (color === 'red') return { x: CX, y: LAST - d }
  if (color === 'yellow') return { x: ORIGIN + d, y: CY }
  if (color === 'blue') return { x: CX, y: ORIGIN + d }
  return { x: LAST - d, y: CY }
}

function hangarPad(color: AeroColor, id: number): { x: number; y: number } {
  const h = HANGAR[color]
  const col = id % 2
  const row = Math.floor(id / 2)
  const inset = 52
  const gap = 78
  return { x: h.x + inset + col * gap + 28, y: h.y + inset + 18 + row * gap + 28 }
}

function finishXY(p: Plane): { x: number; y: number } {
  const i = ORDER.indexOf(p.color) * 4 + p.id
  const ang = -Math.PI / 2 + (i / 16) * Math.PI * 2
  return { x: CX + Math.cos(ang) * 26, y: CY + Math.sin(ang) * 26 }
}

function planeXY(p: Plane): { x: number; y: number } {
  if (p.pos === -1) return hangarPad(p.color, p.id)
  if (p.pos === 57) return finishXY(p)
  if (p.pos >= 52) return homeXY(p.color, p.pos - 52)
  return trackXY(p.pos)
}

function planeHeading(p: Plane): number {
  if (p.pos === -1 || p.pos === 57) return { red: 0, yellow: 90, blue: 180, green: -90 }[p.color]
  if (p.pos >= 52) return { red: 0, yellow: 90, blue: 180, green: -90 }[p.color]
  const side = Math.floor((((p.pos % 52) + 52) % 52) / 13)
  return ([0, 90, 180, -90] as const)[side]
}

function trackOwner(pos: number): AeroColor | null {
  for (const c of ORDER) {
    const start = { red: 0, yellow: 13, blue: 26, green: 39 }[c]
    if ((pos - start + 52) % 52 % 4 === 0) return c
  }
  return null
}

const TRACK_CELLS = Array.from({ length: 52 }, (_, i) => i)
const HOME_STEPS = [0, 1, 2, 3, 4]

function passTurn(s: AeroState): AeroState {
  const i = s.players.indexOf(s.turn)
  return { ...s, dice: null, turn: s.players[(i + 1) % s.players.length], extraRoll: false }
}

function PlaneToken({
  p, movable, onMove,
}: { p: Plane; movable: boolean; onMove: () => void }) {
  const { x, y } = planeXY(p)
  const rot = planeHeading(p)
  const camp = CAMP[p.color]
  return (
    <g
      className={`aero-plane ${movable ? 'movable' : ''}`}
      transform={`translate(${x} ${y})`}
      onClick={() => movable && onMove()}
      role={movable ? 'button' : undefined}
      tabIndex={movable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!movable) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onMove()
        }
      }}
    >
      {movable && <circle className="aero-pulse" r="18" />}
      <g transform={`rotate(${rot})`}>
        <ellipse cx="0" cy="2" rx="11" ry="7" fill="rgba(0,0,0,0.28)" />
        <path
          d="M 0 -16 L 4 -5 L 15 -3 L 15 1 L 4 3 L 2.5 11 L 8 14 L 8 16 L 0 13 L -8 16 L -8 14 L -2.5 11 L -4 3 L -15 1 L -15 -3 L -4 -5 Z"
          fill={camp.fill}
          stroke="#111"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="-6" r="2.2" fill="#fffaf0" stroke="#111" strokeWidth="0.8" />
      </g>
      <circle className="aero-plane-ring" r="17" fill="none" stroke={movable ? '#fffaf0' : 'none'} strokeWidth="2" />
    </g>
  )
}

function AeroBoard({
  state, movable, onMove,
}: {
  state: AeroState
  movable: Plane[]
  onMove: (p: Plane) => void
}) {
  const canMove = (p: Plane) => movable.some((m) => m.color === p.color && m.id === p.id)

  return (
    <div className="aero-chess-wrap">
      <svg viewBox="0 0 1000 1000" role="img" aria-label="飞行棋棋盘">
        <defs>
          <linearGradient id="aero-chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3dffff" />
            <stop offset="50%" stopColor="#c8d4e8" />
            <stop offset="100%" stopColor="#ff4ae8" />
          </linearGradient>
          <filter id="aero-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* sci-fi chrome frame */}
        <rect x="10" y="10" width="980" height="980" rx="28" fill="#070b16" stroke="url(#aero-chrome)" strokeWidth="6" />
        <rect x="28" y="28" width="944" height="944" rx="20" fill="#c4a574" stroke="#3a2208" strokeWidth="3" />
        <rect x="44" y="44" width="912" height="912" rx="14" fill="#efe4c8" stroke="#5c4018" strokeWidth="2" />

        {/* cross arms (classic plus into the hub) */}
        {ORDER.map((c) => {
          const col = CAMP[c]
          if (c === 'red') return <rect key={c} x={CX - 28} y={CY} width={56} height={LAST - CY + 14} fill={col.fill} opacity="0.92" />
          if (c === 'yellow') return <rect key={c} x={ORIGIN - 14} y={CY - 28} width={CX - ORIGIN + 14} height={56} fill={col.fill} opacity="0.92" />
          if (c === 'blue') return <rect key={c} x={CX - 28} y={ORIGIN - 14} width={56} height={CY - ORIGIN + 14} fill={col.fill} opacity="0.92" />
          return <rect key={c} x={CX} y={CY - 28} width={LAST - CX + 14} height={56} fill={col.fill} opacity="0.92" />
        })}

        {/* hangars */}
        {ORDER.map((c) => {
          const h = HANGAR[c]
          const col = CAMP[c]
          return (
            <g key={`h-${c}`}>
              <rect x={h.x} y={h.y} width={HANGAR_SIZE} height={HANGAR_SIZE} rx="16" fill={col.fill} stroke={col.dark} strokeWidth="5" />
              <rect x={h.x + 14} y={h.y + 14} width={HANGAR_SIZE - 28} height={HANGAR_SIZE - 28} rx="10" fill="none" stroke={col.pad} strokeWidth="2" strokeDasharray="8 6" opacity="0.85" />
              <text x={h.x + HANGAR_SIZE / 2} y={h.y + 36} textAnchor="middle" fontSize="22" fontWeight="700" fill="#111" fontFamily="Noto Serif SC, serif">
                {col.label}方机库
              </text>
              {[0, 1, 2, 3].map((id) => {
                const pad = hangarPad(c, id)
                return (
                  <rect
                    key={id}
                    x={pad.x - 30}
                    y={pad.y - 30}
                    width={60}
                    height={60}
                    rx="8"
                    fill={col.dark}
                    stroke="#111"
                    strokeWidth="1.5"
                    opacity="0.45"
                  />
                )
              })}
            </g>
          )
        })}

        {/* ring track */}
        {TRACK_CELLS.map((pos) => {
          const { x, y } = trackXY(pos)
          const owner = trackOwner(pos)
          const isStart = pos === 0 || pos === 13 || pos === 26 || pos === 39
          const fill = owner ? CAMP[owner].fill : '#fffaf0'
          return (
            <g key={`t-${pos}`}>
              <rect
                x={x - CELL_W / 2}
                y={y - CELL_W / 2}
                width={CELL_W}
                height={CELL_W}
                rx="4"
                fill={fill}
                stroke="#1a140c"
                strokeWidth={isStart ? 2.4 : 1.4}
              />
              {isStart && owner && (
                <polygon
                  points={`${x},${y - 7} ${x + 5},${y + 5} ${x - 5},${y + 5}`}
                  fill="#111"
                  transform={`rotate(${planeHeading({ id: 0, color: owner, pos })} ${x} ${y})`}
                />
              )}
            </g>
          )
        })}

        {/* home stretch cells */}
        {ORDER.flatMap((c) =>
          HOME_STEPS.map((step) => {
            const { x, y } = homeXY(c, step)
            return (
              <rect
                key={`home-${c}-${step}`}
                x={x - 13}
                y={y - 13}
                width={26}
                height={26}
                rx="4"
                fill={CAMP[c].pad}
                stroke={CAMP[c].dark}
                strokeWidth="1.6"
              />
            )
          }),
        )}

        {/* center hub — 4 triangles */}
        <polygon points={`${CX},${CY} ${CX - 48},${CY + 48} ${CX + 48},${CY + 48}`} fill={CAMP.red.fill} stroke="#111" strokeWidth="1.2" />
        <polygon points={`${CX},${CY} ${CX - 48},${CY - 48} ${CX - 48},${CY + 48}`} fill={CAMP.yellow.fill} stroke="#111" strokeWidth="1.2" />
        <polygon points={`${CX},${CY} ${CX - 48},${CY - 48} ${CX + 48},${CY - 48}`} fill={CAMP.blue.fill} stroke="#111" strokeWidth="1.2" />
        <polygon points={`${CX},${CY} ${CX + 48},${CY - 48} ${CX + 48},${CY + 48}`} fill={CAMP.green.fill} stroke="#111" strokeWidth="1.2" />
        <circle cx={CX} cy={CY} r="16" fill="#fffaf0" stroke="#111" strokeWidth="2" />
        <text x={CX} y={CY + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#111">终</text>

        {/* planes on top */}
        {state.planes.map((p) => (
          <PlaneToken
            key={`${p.color}-${p.id}`}
            p={p}
            movable={canMove(p)}
            onMove={() => onMove(p)}
          />
        ))}
      </svg>
    </div>
  )
}

export default function AeroplaneGame() {
  const [state, setState] = useState<AeroState>(() => createAeroplane(['red', 'yellow', 'blue', 'green']))
  const movable = useMemo(() => movablePlanes(state), [state])
  const myTurn = !state.winner && state.turn === 'red'
  const advice = useMemo(() => (myTurn ? aeroCoach.suggestMove(state) : null), [state, myTurn])

  useEffect(() => {
    if (state.winner || state.turn === 'red') return
    const t = setTimeout(() => {
      let s = state
      if (s.dice === null) s = rollDice(s)
      const m = aeroAI(s)
      if (!m) {
        setState(passTurn(s))
        return
      }
      if (state.dice === null) {
        setState(s)
        return
      }
      setState(movePlane(s, m))
    }, botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  return (
    <div className="board-wrap aero-play">
      <div className="holo-panel aero-stage">
        <AeroBoard
          state={state}
          movable={movable}
          onMove={(p) => setState(movePlane(state, { color: p.color, id: p.id }))}
        />
        <div className="aero-actions">
          <button className="btn" disabled={state.dice !== null || !!state.winner || state.turn !== 'red'} onClick={() => setState(rollDice(state))}>
            掷骰
          </button>
          <span className="aero-dice" aria-live="polite">{state.dice !== null ? state.dice : '—'}</span>
          {state.dice !== null && movable.length === 0 && state.turn === 'red' && (
            <button className="btn magenta" onClick={() => setState(passTurn(state))}>无法移动，跳过</button>
          )}
        </div>
      </div>
      <div className="holo-panel side-panel">
        <h2>飞行棋</h2>
        <LiveGuide
          title="助手"
          lines={[aeroCoach.explain(state, advice), myTurn ? (state.dice === null ? '请掷骰。掷到 6 才可从机库起飞。' : '点一架高亮的飞机前进。') : '电脑正在走棋。']}
          suggestion={
            !advice ? null
            : advice.action === 'roll' ? '建议：掷骰'
            : advice.action === 'pass' ? '建议：跳过'
            : `建议：走红方 ${advice.id + 1} 号机`
          }
          onApply={advice && myTurn ? () => {
            if (advice.action === 'roll') setState(rollDice(state))
            else if (advice.action === 'pass') setState(passTurn(state))
            else setState(movePlane(state, { color: advice.color, id: advice.id }))
          } : null}
        />
        <p style={{ color: 'var(--ivory)', fontSize: '0.9rem' }}>
          你是<span className="camp-chip red">红方</span>
          {' '}当前：<strong>{CAMP[state.turn].label}方</strong>
          {state.winner ? ` · ${CAMP[state.winner].label}方获胜` : ''}
        </p>
        <button className="btn magenta" onClick={() => setState(createAeroplane(['red', 'yellow', 'blue', 'green']))}>再来一局</button>
      </div>
    </div>
  )
}
