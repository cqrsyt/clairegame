import { useEffect, useRef, useState } from 'react'
import { playSfx } from '../lib/sfx'
import ShareCard from '../components/ShareCard'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'
import PortraitCard from '../components/PortraitCard'
import {
  createWerewolf, wolfKill, seerCheck, witchAct, castVote, resolveVotes, hunterShoot, werewolfBotStep,
  type WerewolfState,
} from '@aether/shared'

const ROLE_CN: Record<string, string> = {
  werewolf: '狼人', villager: '村民', seer: '预言家', witch: '女巫', hunter: '猎人',
}

const PHASE_CN: Record<string, string> = {
  night_wolf: '天黑请闭眼',
  night_seer: '预言家请睁眼',
  night_witch: '女巫请行动',
  day_talk: '投票放逐',
  day_vote: '投票放逐',
  hunter_shot: '猎人开枪',
  ended: '胜负已分',
}

function PhaseBanner({ phase, night }: { phase: string; night: number }) {
  const nightish = phase.startsWith('night')
  const vote = phase === 'day_talk' || phase === 'day_vote'
  return (
    <div className="phase-banner">
      <svg viewBox="0 0 640 132" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="640" height="132" fill={nightish ? '#3a2438' : vote ? '#5a3850' : '#4a3050'} />
        {nightish && (
          <>
            <circle cx="540" cy="42" r="28" fill="#fff4e4" />
            <circle cx="554" cy="34" r="22" fill="#3a2438" />
            <path d="M40 120 C120 40 220 70 280 90 C340 40 460 30 600 110" fill="none" stroke="#ffc85a" strokeWidth="1.2" opacity="0.5" />
            <ellipse cx="90" cy="96" rx="50" ry="18" fill="#2a1830" />
            <path d="M50 100 C58 60 90 48 110 62 C122 44 150 54 154 78 C168 86 160 110 120 116 C80 122 48 114 50 100Z" fill="#5a4860" />
          </>
        )}
        {vote && (
          <>
            <rect x="40" y="20" width="560" height="90" rx="12" fill="none" stroke="#ffc85a" strokeWidth="2" />
            <rect x="56" y="34" width="528" height="62" rx="8" fill="rgba(255,200,90,0.08)" />
            {[80, 160, 240, 320, 400, 480, 560].map((x) => (
              <circle key={x} cx={x} cy="66" r="10" fill="none" stroke="#ffb08a" strokeWidth="1.4" />
            ))}
            <line x1="80" y1="66" x2="560" y2="66" stroke="#ff4ae8" strokeWidth="1" opacity="0.6" />
          </>
        )}
        {!nightish && !vote && (
          <>
            <polygon points="320,16 340,70 300,70" fill="#ffc85a" />
            <circle cx="120" cy="50" r="18" fill="#c8102e" />
            <circle cx="520" cy="50" r="18" fill="#ffb08a" />
          </>
        )}
        {[40, 90, 140, 500, 580, 610].map((x, i) => (
          <circle key={x} cx={x} cy={18 + (i % 3) * 12} r={2 + (i % 2)} fill="#ffc85a" />
        ))}
      </svg>
      <div className="phase-title">{PHASE_CN[phase] || phase} · 第 {night} 夜</div>
    </div>
  )
}

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

  const canPickWolf = me.alive && state.phase === 'night_wolf' && me.role === 'werewolf'
  const canPickSeer = me.alive && state.phase === 'night_seer' && me.role === 'seer'
  const canVote = me.alive && (state.phase === 'day_talk' || state.phase === 'day_vote')
  const canHunt = state.phase === 'hunter_shot' && state.hunterMayShoot === 'you'

  const tap = (id: string) => {
    if (canPickWolf && id !== me.id) setState(wolfKill(state, id))
    else if (canPickSeer && id !== me.id) setState(seerCheck(state, id))
    else if (canVote && id !== me.id) setState(castVote(state, 'you', id))
    else if (canHunt) setState(hunterShoot(state, id))
  }

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel phase-scene" style={{ padding: '1rem', flex: 2, minWidth: 300 }}>
        <PhaseBanner phase={state.phase} night={state.night} />
        <p>你的身份：<span className={`camp-chip ${me.role === 'werewolf' ? 'camp-wolf' : me.role === 'villager' ? 'camp-villager' : 'camp-god'}`}>{ROLE_CN[me.role] || me.role}</span> {me.alive ? '' : '（已出局）'}</p>
        <div className="portrait-grid">
          {state.players.map((p, i) => (
            <PortraitCard
              key={p.id}
              name={p.name}
              index={i}
              dead={!p.alive}
              selected={state.wolfTarget === p.id || state.votes['you'] === p.id}
              hint={p.isBot ? 'BOT' : 'YOU'}
              onClick={() => tap(p.id)}
              disabled={
                !p.alive ||
                (!canPickWolf && !canPickSeer && !canVote && !canHunt) ||
                ((canPickWolf || canPickSeer || canVote) && p.id === me.id) ||
                (canPickWolf && p.role === 'werewolf')
              }
            />
          ))}
        </div>

        {me.alive && state.phase === 'night_witch' && me.role === 'witch' && (
          <div style={{ marginTop: 8 }}>
            <h2>女巫行动（刀口：{state.wolfTarget && state.players.find((p) => p.id === state.wolfTarget)?.name}）</h2>
            <button className="btn" disabled={!state.witchPotions.save} onClick={() => setState(witchAct(state, { save: true }))}>救人</button>
            <button className="btn magenta" style={{ marginLeft: 8 }} onClick={() => setState(witchAct(state, { save: false }))}>不救/过</button>
          </div>
        )}
        {canVote && (
          <button className="btn gold" style={{ marginTop: 8 }} onClick={() => setState(resolveVotes(werewolfBotStep({ ...state, phase: 'day_vote' })))}>结算投票</button>
        )}
        {canHunt && (
          <button className="btn magenta" onClick={() => setState(hunterShoot(state, null))}>放弃开枪</button>
        )}
        {state.seerResult && <div className="coach">{state.seerResult.isWolf ? '是狼人' : '是好人'}</div>}
        {state.winner && <div className="coach">胜负：{state.winner === 'wolves' ? '狼人' : '好人'}</div>}
        <ShareCard gameId="werewolf" title="狼人杀" result={state.winner === 'wolves' ? '狼人胜利' : '好人胜利'} open={!!state.winner} />
      </div>
      <div className="holo-panel side-panel">
        <LiveGuide title="这一步" lines={[
          state.phase.startsWith('night') ? '现在是夜晚。点选肖像行动，其他人请等待。' : '白天请根据发言点选肖像投票。',
          state.winner ? (state.winner === 'wolves' ? '狼人获胜。' : '好人获胜。') : `当前阶段：${PHASE_CN[state.phase] || state.phase}。`,
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
