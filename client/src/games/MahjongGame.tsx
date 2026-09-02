import { useEffect, useMemo, useState } from 'react'
import {
  createMahjong, discardTile, passReact, claimPong, claimChi, claimHu, selfHu, canPong, canChi, canHu, mahjongBotStep,
  mahjongCoach, mahjongTileName,
  type MahjongState,
} from '@aether/shared'
import ShareCard from '../components/ShareCard'
import MahjongTile, { tileName } from '../components/MahjongTile'
import LiveGuide from '../components/LiveGuide'
import { playSfx } from '../lib/sfx'
import { botThinkMs } from '../lib/botDelay'

export default function MahjongGame() {
  const [state, setState] = useState<MahjongState>(() =>
    createMahjong([{ id: 'you', name: '你', isBot: false }])
  )
  const meIdx = 0
  const me = state.players[meIdx]

  useEffect(() => {
    if (state.phase === 'ended') return
    const t = setTimeout(() => setState((s) => mahjongBotStep(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const chiOpts = state.lastDiscard ? canChi(me.hand, state.lastDiscard.tile) : []
  const last = state.lastDiscard
  const myAct = (state.phase === 'discard' && state.turn === meIdx) || state.phase === 'react'
  const advice = useMemo(() => (state.phase !== 'ended' && myAct ? mahjongCoach.suggestMove(state, meIdx) : null), [state, myAct])
  const suggestLabel = !advice || advice.action === 'wait' ? null
    : advice.action === 'selfHu' ? '建议：自摸胡'
    : advice.action === 'hu' ? '建议：胡'
    : advice.action === 'pong' ? '建议：碰'
    : advice.action === 'chi' ? `建议：吃（${advice.need.map(mahjongTileName).join('、')}）`
    : advice.action === 'pass' ? '建议：过'
    : `建议：打出「${mahjongTileName(advice.tile)}」`

  return (
    <div className="board-wrap play-layout" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 280 }}>
        <h2>麻将 · 牌山还剩 {state.wall.length} 张</h2>
        {state.players.map((p, i) => (
          <div key={p.id} className="mj-seat">
            <strong style={{ color: i === state.turn ? 'var(--gold)' : 'var(--ivory)' }}>{p.name}</strong>
            <span style={{ marginLeft: 8, color: 'var(--muted)' }}>副露 {p.melds.length} · 手牌 {p.hand.length}</span>
            <div className="mj-hand">
              {p.melds.map((m, mi) => (
                <span key={mi} style={{ display: 'inline-flex', gap: 2, marginRight: 8 }}>
                  {m.map((t, ti) => <MahjongTile key={ti} tile={t} small />)}
                </span>
              ))}
            </div>
            {i === meIdx && (
              <div className="mj-hand">
                {me.hand.map((t, ti) => (
                  <MahjongTile
                    key={`${t}-${ti}`}
                    tile={t}
                    disabled={state.phase !== 'discard' || state.turn !== meIdx}
                    onClick={() => { playSfx('move'); setState(discardTile(state, meIdx, t)) }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {state.phase === 'discard' && state.turn === meIdx && canHu(me.hand, me.melds.length) && (
          <button className="btn gold" onClick={() => { playSfx('win'); setState(selfHu(state, meIdx)) }}>自摸胡</button>
        )}
        {state.phase === 'react' && last && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span>桌上这张：</span>
            <MahjongTile tile={last.tile} small />
            {canHu([...me.hand, last.tile], me.melds.length) && (
              <button className="btn gold" onClick={() => setState(claimHu(state, meIdx))}>胡</button>
            )}
            {canPong(me.hand, last.tile) && (
              <button className="btn" onClick={() => setState(claimPong(state, meIdx))}>碰</button>
            )}
            {chiOpts.map((need, i) => (
              <button key={i} className="btn magenta" onClick={() => setState(claimChi(state, meIdx, need))}>
                吃（用 {need.map(tileName).join('、')}）
              </button>
            ))}
            <button className="btn" onClick={() => setState(passReact(state))}>过</button>
          </div>
        )}
      </div>
      <div className="holo-panel side-panel coach-panel">
        <LiveGuide
          title="助手"
          lines={[mahjongCoach.explain(state, advice)]}
          suggestion={suggestLabel}
          onApply={advice && myAct ? () => {
            if (advice.action === 'selfHu') { playSfx('win'); setState(selfHu(state, meIdx)) }
            else if (advice.action === 'hu') setState(claimHu(state, meIdx))
            else if (advice.action === 'pong') setState(claimPong(state, meIdx))
            else if (advice.action === 'chi') setState(claimChi(state, meIdx, advice.need))
            else if (advice.action === 'pass') setState(passReact(state))
            else if (advice.action === 'discard') { playSfx('move'); setState(discardTile(state, meIdx, advice.tile)) }
          } : null}
        />
        <h2>牌河</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <button className="btn magenta" style={{ marginTop: 12 }} onClick={() => setState(createMahjong([{ id: 'you', name: '你', isBot: false }]))}>再来一局</button>
        <div className="note-enhance">可增强：番种、花牌、国标计分。</div>
      </div>
      <ShareCard gameId="mahjong" title="麻将" result={state.winner === 0 ? '你胡牌了' : `${state.players[state.winner || 0]?.name} 胡牌`} open={state.winner !== null} />
    </div>
  )
}
