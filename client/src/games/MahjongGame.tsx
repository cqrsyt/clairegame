import { useEffect, useState } from 'react'
import {
  createMahjong, discardTile, passReact, claimPong, claimChi, claimHu, selfHu, canPong, canChi, canHu, mahjongBotStep,
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
  const lastNm = last ? tileName(last.tile) : ''
  const fromName = last ? state.players[last.from].name : ''
  const guide: string[] = []
  if (state.phase === 'ended' && state.winner !== null) {
    guide.push(state.winner === 0 ? '这一圈你胡了。可以再开一局练手。' : `${state.players[state.winner].name} 先胡。看看副露，下一圈再追。`)
  } else if (state.phase === 'react' && last) {
    guide.push(`${fromName} 打出了「${lastNm}」。`)
    if (canHu([...me.hand, last.tile], me.melds.length)) guide.push('胡：这张牌正好让你组成四面子加一对将，可以点炮和牌。')
    if (canPong(me.hand, last.tile)) guide.push('碰：你手里已有两张相同的牌，碰下成刻子，轮到你打牌。')
    if (chiOpts.length) guide.push('吃：只可吃上家的牌，用手里两张连成顺子（如 2、3 吃 4）。')
    if (!canHu([...me.hand, last.tile], me.melds.length) && !canPong(me.hand, last.tile) && !chiOpts.length) {
      guide.push('这张与你无关，点「过」即可。')
    }
  } else if (state.phase === 'discard' && state.turn === meIdx) {
    if (canHu(me.hand, me.melds.length)) guide.push('自摸：手牌已经能和。点「自摸胡」结束这一圈。')
    else guide.push('轮到你打牌。点一张不需要的牌打出。尽量留能成顺、成刻的牌。')
    const honors = me.hand.filter((t) => ['E', 'S', 'W', 'N', 'R', 'G', 'Wht'].includes(t))
    if (honors.length && honors.length <= 2) guide.push(`字牌如「${tileName(honors[0])}」单张很难组成面子，可优先打出。`)
  } else {
    const p = state.players[state.turn]
    guide.push(`${p.name} 正在思考。电脑每步会停一下，方便你看清牌面。`)
  }

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
        <LiveGuide title="这一步" lines={guide} />
        <h2>牌河</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <button className="btn magenta" style={{ marginTop: 12 }} onClick={() => setState(createMahjong([{ id: 'you', name: '你', isBot: false }]))}>再来一局</button>
        <div className="note-enhance">可增强：番种、花牌、国标计分。</div>
      </div>
      <ShareCard gameId="mahjong" title="麻将" result={state.winner === 0 ? '你胡牌了' : `${state.players[state.winner || 0]?.name} 胡牌`} open={state.winner !== null} />
    </div>
  )
}
