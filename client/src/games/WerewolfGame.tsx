import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../lib/sfx'
import ShareCard from '../components/ShareCard'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'
import {
  createWerewolf, wolfKill, seerCheck, witchAct, castVote, resolveVotes, hunterShoot, werewolfBotStep,
  type WerewolfState,
} from '@aether/shared'

export default function WerewolfGame() {
  const [state, setState] = useState<WerewolfState>(() =>
    createWerewolf([
      { id: 'you', name: '你', isBot: false },
      ...Array.from({ length: 5 }, (_, i) => ({ id: `b${i}`, name: `居民${i + 1}`, isBot: true })),
    ])
  )
  const me = state.players.find((p) => p.id === 'you')!

  const lastPhase = useRef(state.phase)
  useEffect(() => {
    if (state.phase.startsWith('night') && lastPhase.current !== state.phase) playSfx('night')
    lastPhase.current = state.phase
    if (state.phase === 'ended') return
    const t = setTimeout(() => setState((s) => werewolfBotStep(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const alive = state.players.filter((p) => p.alive)

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel" style={{ padding: '1rem', flex: 2, minWidth: 300 }}>
        <h2>阶段：{state.phase} · 第 {state.night} 夜</h2>
                <p>你的身份：<span className={`camp-chip ${me.role === 'werewolf' ? 'camp-wolf' : me.role === 'villager' ? 'camp-villager' : 'camp-god'}`}>{({werewolf:'狼人',villager:'村民',seer:'预言家',witch:'女巫',hunter:'猎人'} as Record<string,string>)[me.role] || me.role}</span> {me.alive ? '' : '（已出局）'}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {state.players.map((p) => (
            <div key={p.id} className="holo-panel" style={{ padding: '0.5rem 0.75rem', opacity: p.alive ? 1 : 0.4 }}>
              {p.name}
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.isBot ? 'BOT' : 'YOU'}{!p.alive ? ' · 倒地' : ''}</div>
            </div>
          ))}
        </div>

        {me.alive && state.phase === 'night_wolf' && me.role === 'werewolf' && (
          <div style={{ marginTop: 12 }}>
            <h2>刀谁？</h2>
            {alive.filter((p) => p.role !== 'werewolf').map((p) => (
              <button key={p.id} className="btn" style={{ margin: 4 }} onClick={() => setState(wolfKill(state, p.id))}>{p.name}</button>
            ))}
          </div>
        )}
        {me.alive && state.phase === 'night_seer' && me.role === 'seer' && (
          <div style={{ marginTop: 12 }}>
            <h2>查验</h2>
            {alive.filter((p) => p.id !== me.id).map((p) => (
              <button key={p.id} className="btn" style={{ margin: 4 }} onClick={() => setState(seerCheck(state, p.id))}>{p.name}</button>
            ))}
            {state.seerResult && <div className="coach">{state.seerResult.isWolf ? '是狼人' : '是好人'}</div>}
          </div>
        )}
        {me.alive && state.phase === 'night_witch' && me.role === 'witch' && (
          <div style={{ marginTop: 12 }}>
            <h2>女巫行动（刀口：{state.wolfTarget && state.players.find((p) => p.id === state.wolfTarget)?.name}）</h2>
            <button className="btn" disabled={!state.witchPotions.save} onClick={() => setState(witchAct(state, { save: true }))}>救人</button>
            <button className="btn magenta" style={{ marginLeft: 8 }} onClick={() => setState(witchAct(state, { save: false }))}>不救/过</button>
          </div>
        )}
        {(state.phase === 'day_talk' || state.phase === 'day_vote') && me.alive && (
          <div style={{ marginTop: 12 }}>
            <h2>投票放逐</h2>
            {alive.filter((p) => p.id !== me.id).map((p) => (
              <button key={p.id} className="btn" style={{ margin: 4 }} onClick={() => setState(castVote(state, 'you', p.id))}>{p.name}</button>
            ))}
            <button className="btn gold" style={{ marginLeft: 8 }} onClick={() => setState(resolveVotes(werewolfBotStep({ ...state, phase: 'day_vote' })))}>结算投票</button>
          </div>
        )}
        {state.phase === 'hunter_shot' && state.hunterMayShoot === 'you' && (
          <div style={{ marginTop: 12 }}>
            <h2>猎人开枪</h2>
            {alive.map((p) => (
              <button key={p.id} className="btn" style={{ margin: 4 }} onClick={() => setState(hunterShoot(state, p.id))}>{p.name}</button>
            ))}
            <button className="btn magenta" onClick={() => setState(hunterShoot(state, null))}>放弃</button>
          </div>
        )}
        {state.winner && <div className="coach">胜负：{state.winner === 'wolves' ? '狼人' : '好人'}</div>}
        <ShareCard gameId="werewolf" title="狼人杀" result={state.winner === 'wolves' ? '狼人胜利' : '好人胜利'} open={!!state.winner} />
      </div>
      <div className="holo-panel side-panel">
        <LiveGuide title="这一步" lines={[
          state.phase.startsWith('night') ? '现在是夜晚。身份对应的人才能行动，其他人请等待。' : '白天请根据发言投票。好人要找出狼人，狼人尽量隐藏。',
          state.winner ? (state.winner === 'wolves' ? '狼人获胜。' : '好人获胜。') : `当前阶段：${state.phase}。`,
        ]} />
        <h2>事件记录</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <button className="btn magenta" style={{ marginTop: 12 }} onClick={() => setState(createWerewolf([
          { id: 'you', name: '你', isBot: false },
          ...Array.from({ length: 5 }, (_, i) => ({ id: `b${i}`, name: `居民${i + 1}`, isBot: true })),
        ]))}>再来一局</button>
      </div>
    </div>
  )
}
