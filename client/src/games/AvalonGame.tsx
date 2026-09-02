import { useEffect, useMemo, useState } from 'react'
import ShareCard from '../components/ShareCard'
import { botThinkMs } from '../lib/botDelay'
import LiveGuide from '../components/LiveGuide'
import PortraitCard from '../components/PortraitCard'
import {
  createAvalon, proposeTeam, voteTeam, playQuestCard, assassinate, avalonBotStep, nightInfoFor,
  avalonCoach,
  type AvalonState,
} from '@aether/shared'

const PHASE_CN: Record<string, string> = {
  team_propose: '组队',
  team_vote: '表决组队',
  quest: '出征',
  assassinate: '刺杀',
  ended: '圣杯落定',
}

function PhaseBanner({ phase, quest }: { phase: string; quest: number }) {
  return (
    <div className="phase-banner">
      <svg viewBox="0 0 640 132" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="640" height="132" fill="#4a3058" />
        <ellipse cx="320" cy="70" rx="70" ry="46" fill="none" stroke="#ffc85a" strokeWidth="3" />
        <rect x="312" y="28" width="16" height="78" rx="3" fill="#e8dcc8" />
        <polygon points="320,12 348,36 292,36" fill="#ffc85a" />
        <ellipse cx="320" cy="88" rx="18" ry="10" fill="#ffb08a" />
        {phase === 'assassinate' && <path d="M80 30 L200 90 L190 98 L70 40 Z" fill="#c9c0d0" stroke="#ffc85a" />}
        {phase === 'quest' && (
          <>
            <polygon points="80,90 110,30 140,90" fill="#ffc85a" opacity="0.7" />
            <polygon points="500,90 530,30 560,90" fill="#ffb08a" opacity="0.7" />
          </>
        )}
        {[60, 120, 520, 580].map((x, i) => (
          <circle key={x} cx={x} cy={24 + i * 8} r="3" fill="#ffc85a" />
        ))}
      </svg>
      <div className="phase-title">{PHASE_CN[phase] || phase} · 任务 {quest + 1}/5</div>
    </div>
  )
}

export default function AvalonGame() {
  const [state, setState] = useState<AvalonState>(() =>
    createAvalon([
      { id: 'you', name: '你', isBot: false },
      ...Array.from({ length: 4 }, (_, i) => ({ id: `a${i}`, name: `骑士${i + 1}`, isBot: true })),
    ])
  )
  const [info, setInfo] = useState('')
  const [pick, setPick] = useState<string[]>([])
  const me = state.players.find((p) => p.id === 'you')!
  const leader = state.players[state.leader]
  const need = state.teamSizes[state.questIndex]
  const advice = useMemo(() => avalonCoach.suggestMove(state, 'you'), [state])
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name || id
  const suggestLabel = !advice || advice.action === 'wait' ? null
    : advice.action === 'propose' ? `建议：提名 ${advice.team.map(nameOf).join('、')}`
    : advice.action === 'vote' ? `建议：${advice.approve ? '同意' : '反对'}`
    : advice.action === 'quest' ? `建议：任务${advice.success ? '成功' : '失败'}`
    : advice.action === 'assassinate' ? `建议：刺杀 ${nameOf(advice.targetId)}`
    : null
  const canApply = !!advice && advice.action !== 'wait' && (
    (advice.action === 'propose' && state.phase === 'team_propose' && leader.id === 'you') ||
    (advice.action === 'vote' && state.phase === 'team_vote' && state.votes['you'] === undefined) ||
    (advice.action === 'quest' && state.phase === 'quest' && state.proposed.includes('you') && state.questCards['you'] === undefined) ||
    (advice.action === 'assassinate' && state.phase === 'assassinate' && me.role === 'assassin')
  )

  useEffect(() => {
    setInfo(nightInfoFor(state, 'you'))
  }, [])

  useEffect(() => {
    if (state.phase === 'ended') return
    const t = setTimeout(() => setState((s) => avalonBotStep(s)), botThinkMs())
    return () => clearTimeout(t)
  }, [state])

  const toggle = (id: string) => {
    if (state.phase === 'team_propose' && leader.id === 'you') {
      setPick((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < need ? [...prev, id] : prev))
    } else if (state.phase === 'assassinate' && me.role === 'assassin' && id !== me.id) {
      setState(assassinate(state, id))
    }
  }

  return (
    <div className="board-wrap" style={{ marginTop: '1rem' }}>
      <div className="holo-panel phase-scene" style={{ padding: '1rem', flex: 2, minWidth: 300 }}>
        <PhaseBanner phase={state.phase} quest={state.questIndex} />
        <div className="quest-lights">
          {state.questResults.map((r, i) => (
            <div key={i} className={`quest-light${r === true ? ' ok' : r === false ? ' fail' : ''}`} title={`Q${i + 1}`} />
          ))}
        </div>
        <p>队长：{leader.name} · 需要 {need} 人 · 拒队连击 {state.rejectStreak}/5</p>
        <div className="portrait-grid">
          {state.players.map((p, i) => (
            <PortraitCard
              key={p.id}
              name={p.name}
              index={i}
              selected={pick.includes(p.id) || state.proposed.includes(p.id)}
              hint={p.id === leader.id ? '队长' : p.isBot ? 'BOT' : 'YOU'}
              onClick={() => toggle(p.id)}
              disabled={
                (state.phase !== 'team_propose' || leader.id !== 'you') &&
                !(state.phase === 'assassinate' && me.role === 'assassin' && p.id !== me.id)
              }
            />
          ))}
        </div>

        {state.phase === 'team_propose' && leader.id === 'you' && (
          <button className="btn" style={{ marginTop: 8 }} disabled={pick.length !== need} onClick={() => setState(proposeTeam(state, 'you', pick))}>
            提交提名
          </button>
        )}
        {state.phase === 'team_vote' && state.votes['you'] === undefined && (
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => setState(voteTeam(state, 'you', true))}>同意</button>
            <button className="btn magenta" style={{ marginLeft: 8 }} onClick={() => setState(voteTeam(state, 'you', false))}>反对</button>
          </div>
        )}
        {state.phase === 'quest' && state.proposed.includes('you') && state.questCards['you'] === undefined && (
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => setState(playQuestCard(state, 'you', true))}>任务成功</button>
            <button className="btn magenta" style={{ marginLeft: 8 }} onClick={() => setState(playQuestCard(state, 'you', false))}>任务失败</button>
          </div>
        )}
        {state.winner && <div className="coach">胜负：{state.winner === 'good' ? '正派' : '奸徒'}</div>}
        <ShareCard gameId="avalon" title="阿瓦隆" result={state.winner === 'good' ? '正派胜利' : '奸徒胜利'} open={!!state.winner} />
      </div>
      <div className="holo-panel side-panel">
        <LiveGuide
          title="助手"
          lines={[info, avalonCoach.explain(state, 'you', advice)]}
          suggestion={suggestLabel}
          onApply={canApply ? () => {
            if (!advice) return
            if (advice.action === 'propose') { setPick(advice.team); setState(proposeTeam(state, 'you', advice.team)) }
            else if (advice.action === 'vote') setState(voteTeam(state, 'you', advice.approve))
            else if (advice.action === 'quest') setState(playQuestCard(state, 'you', advice.success))
            else if (advice.action === 'assassinate') setState(assassinate(state, advice.targetId))
          } : null}
        />
        <h2>日志</h2>
        <div className="log">{state.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>你的角色：{me.role}</p>
        <button className="btn magenta" onClick={() => {
          const s = createAvalon([
            { id: 'you', name: '你', isBot: false },
            ...Array.from({ length: 4 }, (_, i) => ({ id: `a${i}`, name: `骑士${i + 1}`, isBot: true })),
          ])
          setState(s)
          setInfo(nightInfoFor(s, 'you'))
          setPick([])
        }}>再来一局</button>
      </div>
    </div>
  )
}
