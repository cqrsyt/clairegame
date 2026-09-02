import { useEffect, useMemo, useState } from 'react'
import { createMonopoly, monoRoll, monoBuy, monoEndTurn, monoBot, monopolyCoach, monoGridPos, type MonoState, type MonoTile } from '@aether/shared'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'
import './MonopolyBoard.css'

function kindLabel(t: MonoTile) {
  if (t.kind === 'prop') return `${t.price} / 租 ${t.rent}`
  if (t.kind === 'rail') return `星轨 ${t.price}`
  if (t.kind === 'util') return `公用 ${t.price}`
  if (t.kind === 'tax') return `税 ${t.rent}`
  if (t.kind === 'chance') return t.name
  if (t.kind === 'start') return '+200'
  if (t.kind === 'jail') return '探监'
  if (t.kind === 'park') return '歇脚'
  if (t.kind === 'gotojail') return '入狱'
  return t.kind
}

function isBuyable(t: MonoTile) {
  return (t.kind === 'prop' || t.kind === 'rail' || t.kind === 'util') && t.owner === null
}

function CourtArt() {
  return (
    <svg viewBox="0 0 400 400" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a3a58" />
          <stop offset="45%" stopColor="#3a2438" />
          <stop offset="100%" stopColor="#1a1018" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffb08a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffc85a" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#sky)" />
      <circle cx="310" cy="72" r="36" fill="#ffc85a" opacity="0.85" />
      <circle cx="310" cy="72" r="52" fill="#ffb08a" opacity="0.18" />
      <circle cx="70" cy="48" r="2" fill="#fff4e4" />
      <circle cx="120" cy="32" r="1.5" fill="#fff4e4" />
      <circle cx="180" cy="58" r="1.8" fill="#ffc85a" />
      <circle cx="240" cy="28" r="1.4" fill="#fff4e4" />
      <circle cx="50" cy="90" r="1.2" fill="#ffb08a" />
      <path d="M0 250 L70 210 L110 230 L160 180 L210 220 L260 160 L320 205 L400 170 L400 400 L0 400 Z" fill="#2a1828" />
      <rect x="40" y="228" width="36" height="90" fill="#4a3048" />
      <rect x="48" y="238" width="8" height="10" fill="#ffc85a" opacity="0.7" />
      <rect x="62" y="252" width="8" height="10" fill="#ffb08a" opacity="0.55" />
      <rect x="100" y="200" width="52" height="118" fill="#3a2438" />
      <rect x="112" y="214" width="10" height="12" fill="#ff4ae8" opacity="0.45" />
      <rect x="130" y="230" width="10" height="12" fill="#ffc85a" opacity="0.55" />
      <polygon points="100,200 126,172 152,200" fill="#5a3850" />
      <rect x="180" y="236" width="44" height="82" fill="#423048" />
      <rect x="248" y="188" width="70" height="130" fill="#352030" />
      <rect x="262" y="202" width="12" height="14" fill="#ffc85a" opacity="0.65" />
      <rect x="284" y="222" width="12" height="14" fill="#6ec8e6" opacity="0.5" />
      <polygon points="248,188 283,150 318,188" fill="#6a3a50" />
      <path d="M0 318 Q100 300 200 318 T400 312" fill="none" stroke="url(#glow)" strokeWidth="4" />
      <path d="M0 328 Q100 310 200 328 T400 322" fill="none" stroke="#6ec8e6" strokeOpacity="0.35" strokeWidth="2" />
      <text x="200" y="118" textAnchor="middle" fill="#fff4e4" fontSize="28" fontFamily="serif" letterSpacing="6">星域棋庭</text>
      <text x="200" y="146" textAnchor="middle" fill="#ffc85a" fontSize="13" opacity="0.9">灯港 · 星轨 · 暮城</text>
    </svg>
  )
}

export default function MonopolyGame() {
  const [state, setState] = useState<MonoState>(() => createMonopoly())

  useEffect(() => {
    if (state.winner !== null) return
    if (!state.players[state.turn].isBot) return
    const t = setTimeout(() => setState((s) => monoBot(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const me = state.players[0]
  const tile = state.tiles[me.pos]
  const canBuy = state.turn === 0 && state.dice !== null && isBuyable(tile) && me.cash >= tile.price
  const myTurn = state.winner === null && state.turn === 0
  const act = useMemo(() => (myTurn ? monopolyCoach.suggestMove(state) : null), [state, myTurn])
  const actZh = { roll: '掷骰', buy: '购买此地', end: '结束回合' } as const
  const here = state.players[state.turn]?.pos

  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="holo-panel mono-stage">
        <h2>大富翁 · 星域棋庭</h2>
        <div className="mono-court" role="grid" aria-label="星域棋庭">
          <div className="mono-center"><CourtArt /></div>
          {state.tiles.map((t, i) => {
            const { row, col } = monoGridPos(i)
            const corner = t.kind === 'start' || t.kind === 'jail' || t.kind === 'park' || t.kind === 'gotojail'
            const owned = t.owner !== null ? `owned${t.owner}` : ''
            return (
              <div
                key={i}
                className={`mono-sq kind-${t.kind} ${owned} ${here === i ? 'here' : ''} ${corner ? 'corner' : ''}`}
                style={{ gridRow: row, gridColumn: col }}
                title={t.group ? `${t.name} · ${t.group}` : t.name}
              >
                {t.hue ? <div className="mono-bar" style={{ background: t.hue }} /> : null}
                <div className="mono-name">{t.name}</div>
                <div className="mono-meta">{kindLabel(t)}</div>
                <div className="mono-tokens">
                  {state.players.map((p, pi) => p.pos === i && !p.bankrupt ? <span key={p.id} className={`token t${pi}`} title={p.name} /> : null)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mono-legend">
          {state.players.map((p, i) => (
            <div key={p.id}>
              <span className={`token t${i}`} /> {p.name}　现金 {p.cash}
              {p.inJail ? '（狱中）' : ''}
              {p.bankrupt ? '（破产）' : ''}
              {state.turn === i ? ' · 行动中' : ''}
            </div>
          ))}
        </div>
        <div className="mono-actions">
          <span className="mono-dice">{state.dice ?? '—'}</span>
          <button className="btn" disabled={state.turn !== 0 || state.dice !== null || state.winner !== null} onClick={() => { playSfx('move'); setState(monoRoll(state)) }}>掷骰</button>
          <button className="btn gold" disabled={!canBuy} onClick={() => setState(monoBuy(state))}>购买此地</button>
          <button className="btn magenta" disabled={state.turn !== 0 || state.dice === null || state.winner !== null} onClick={() => setState(monoEndTurn(state))}>结束回合</button>
          <button className="btn" onClick={() => setState(createMonopoly())}>再来一局</button>
        </div>
      </div>
      <div className="holo-panel side-panel coach-panel">
        <h2>旁白</h2>
        <LiveGuide
          title="助手"
          lines={[monopolyCoach.explain(state, act)]}
          suggestion={act ? `建议：${actZh[act]}` : null}
          onApply={act && myTurn ? () => {
            if (act === 'roll') { playSfx('move'); setState(monoRoll(state)) }
            else if (act === 'buy') setState(monoBuy(state))
            else setState(monoEndTurn(state))
          } : null}
        />
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <div className="note-enhance">可增强：房屋旅馆、拍卖与更多玩家。</div>
      </div>
      <ShareCard gameId="monopoly" title="大富翁" result={state.winner === 0 ? '你成为最后的持有者' : `${state.players[state.winner || 0]?.name} 获胜`} open={state.winner !== null} />
    </div>
  )
}
