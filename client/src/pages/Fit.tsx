import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGame } from '@aether/shared'
import GameMotif from '../components/GameMotif'
import styles from './Fit.module.css'

type AxisId = 'mind' | 'veil' | 'table' | 'fortune'

type Axes = Record<AxisId, number>

type Choice = {
  label: string
  note?: string
  delta: Partial<Axes>
}

type Question = {
  id: string
  scene: string
  prompt: string
  choices: Choice[]
}

type GameVec = { id: string; vec: Axes }

const STORAGE_KEY = 'aether-fit-last'

const QUESTIONS: Question[] = [
  {
    id: 'evening',
    scene: '暮色刚落，棋庭里只亮着一圈暖金。',
    prompt: '友人替你拉开两张空椅。你会坐哪一边？',
    choices: [
      { label: '靠近窗边的小桌，只对一人，棋盘已经摆好。', delta: { table: -2, mind: -1, fortune: -1 } },
      { label: '大厅中央的圆桌，杯盏碰撞，还不知道今晚几个人。', delta: { table: 2, fortune: 1, veil: 1 } },
      { label: '先站一会儿，看哪一桌的规矩我更熟，再落座。', delta: { mind: -1, veil: -1 } },
    ],
  },
  {
    id: 'fog',
    scene: '中盘，局面忽然像起了薄雾。',
    prompt: '你更愿意怎么走下去？',
    choices: [
      { label: '把能看见的格子都算一遍，宁可慢，也不想漏掉关键一手。', delta: { mind: -2, fortune: -1, veil: -1 } },
      { label: '凭这一手的手感落子——气口对了，再细算也不迟。', delta: { mind: 2, fortune: 1 } },
      { label: '先观察别人的神色与习惯，信息往往不在盘上。', delta: { veil: 2, table: 1, mind: 1 } },
    ],
  },
  {
    id: 'secret',
    scene: '有人提议：今晚可以盖住一部分牌面。',
    prompt: '你心里怎么想？',
    choices: [
      { label: '还是摊开的好。胜负应当来自看得见的功夫。', delta: { veil: -2, fortune: -1, mind: -1 } },
      { label: '留一点未知才有味道，读人、骗招、试探都可以。', delta: { veil: 2, table: 1 } },
      { label: '未知可以有，但规则要清楚，别让运气单独决定结局。', delta: { veil: 1, fortune: -1 } },
    ],
  },
  {
    id: 'company',
    scene: '周末只有两小时。',
    prompt: '怎样才算好好度过？',
    choices: [
      { label: '与一位对手从容下完一盘，中间几乎不必说话。', delta: { table: -2, mind: -1, fortune: -1 } },
      { label: '三五人围坐，互相拆招、起哄、偶尔结盟。', delta: { table: 2, veil: 1 } },
      { label: '人可以多，但各自经营自己的地盘，不必一直对视。', delta: { table: 1, fortune: 1, mind: 1 } },
    ],
  },
  {
    id: 'dice',
    scene: '骰子在托盘里轻轻一响。',
    prompt: '这一声对你意味着什么？',
    choices: [
      { label: '最好少出现。我想赢在布局，而不是在点数。', delta: { fortune: -2, mind: -1 } },
      { label: '可以热闹一下——翻转、爆发、被送上天，都算今晚的一部分。', delta: { fortune: 2, mind: 1, table: 1 } },
      { label: '运气可以入场，但后面仍要会经营、会收束。', delta: { fortune: 1, mind: -1 } },
    ],
  },
  {
    id: 'pressure',
    scene: '对桌忽然加快了节奏，像在逼你当场表态。',
    prompt: '你习惯怎样接住？',
    choices: [
      { label: '请对方稍等。我要把变化树再捋一遍。', delta: { mind: -2, fortune: -1 } },
      { label: '跟着气口走，临场反应往往比复盘更准。', delta: { mind: 2 } },
      { label: '先说话、试探、把节奏夺回来，盘外也是棋。', delta: { table: 2, veil: 1, mind: 1 } },
    ],
  },
  {
    id: 'loss',
    scene: '这一手已经无法挽回。',
    prompt: '散场时，你更想带走什么？',
    choices: [
      { label: '那一手为什么错。下次换一条更稳的路。', delta: { mind: -1, fortune: -2, veil: -1 } },
      { label: '桌上的笑声、一次漂亮的翻盘，或者一次成功的伪装。', delta: { table: 1, fortune: 1, veil: 1, mind: 1 } },
      { label: '下一次的位置——地、牌、角色，下次可以经营得更好。', delta: { fortune: 1, mind: -1, table: 1 } },
    ],
  },
  {
    id: 'talk',
    scene: '邻座开始闲聊规则以外的事。',
    prompt: '你更自在的气氛是？',
    choices: [
      { label: '棋声即可。话多了，算路会散。', delta: { table: -2, mind: -1 } },
      { label: '不妨说。社交本身就是这盘游戏的一半。', delta: { table: 2, veil: 1 } },
      { label: '可以轻松说话，但关键回合请让我安静几秒。', delta: { table: 0, mind: -1, fortune: 0 } },
    ],
  },
  {
    id: 'horizon',
    scene: '有人问你：今晚要一盘短的，还是一盘能铺开的？',
    prompt: '你点哪一种？',
    choices: [
      { label: '铺得开的。疆域、气、子力，我愿意慢慢长出来。', delta: { mind: -2, fortune: -2, table: -1 } },
      { label: '短而利落。几轮就能分出高下，或把场面点燃。', delta: { mind: 1, fortune: 1, table: 1 } },
      { label: '中等就好：有结构，也不把整晚锁死。', delta: { mind: -1, fortune: 1 } },
    ],
  },
  {
    id: 'trust',
    scene: '队长要组一队出门，名单还没写完。',
    prompt: '你更想扮演哪一种角色？',
    choices: [
      { label: '独自把关的人。盘面清楚，责任也清楚。', delta: { table: -2, veil: -2, mind: -1 } },
      { label: '读阵营、护同伴、必要时把怀疑说出口的人。', delta: { table: 2, veil: 2, mind: 0 } },
      { label: '手里握着筹码或地契的人，输赢可以一点一点堆。', delta: { fortune: 1, table: 1, mind: -1, veil: -1 } },
    ],
  },
]

const GAMES: GameVec[] = [
  { id: 'xiangqi', vec: { mind: -0.85, veil: -0.9, table: -0.95, fortune: -0.8 } },
  { id: 'chess', vec: { mind: -0.92, veil: -0.9, table: -0.95, fortune: -0.9 } },
  { id: 'gomoku', vec: { mind: -0.5, veil: -0.95, table: -0.9, fortune: -0.75 } },
  { id: 'go', vec: { mind: -0.98, veil: -0.88, table: -0.95, fortune: -0.95 } },
  { id: 'checkers', vec: { mind: 0.15, veil: -0.85, table: -0.45, fortune: -0.35 } },
  { id: 'aeroplane', vec: { mind: 0.55, veil: -0.65, table: 0.4, fortune: 0.88 } },
  { id: 'junqi', vec: { mind: -0.35, veil: -0.15, table: -0.9, fortune: -0.45 } },
  { id: 'mahjong', vec: { mind: -0.2, veil: 0.12, table: 0.72, fortune: 0.42 } },
  { id: 'doudizhu', vec: { mind: 0.18, veil: 0.38, table: 0.55, fortune: 0.42 } },
  { id: 'uno', vec: { mind: 0.62, veil: 0.22, table: 0.7, fortune: 0.78 } },
  { id: 'werewolf', vec: { mind: 0.4, veil: 0.95, table: 0.95, fortune: 0.08 } },
  { id: 'avalon', vec: { mind: -0.12, veil: 0.92, table: 0.9, fortune: -0.18 } },
  { id: 'holdem', vec: { mind: -0.32, veil: 0.55, table: 0.38, fortune: 0.48 } },
  { id: 'monopoly', vec: { mind: 0.08, veil: -0.55, table: 0.72, fortune: 0.52 } },
]

const AXIS_META: Record<AxisId, { low: string; high: string; title: string }> = {
  mind: { title: '算路', low: '计算深度', high: '临场直觉' },
  veil: { title: '信息', low: '局面透明', high: '身份隐匿' },
  table: { title: '席面', low: '一对一对弈', high: '多人社交' },
  fortune: { title: '起伏', low: '稳健经营', high: '运气爆发' },
}

function emptyAxes(): Axes {
  return { mind: 0, veil: 0, table: 0, fortune: 0 }
}

function addDelta(a: Axes, d: Partial<Axes>): Axes {
  return {
    mind: a.mind + (d.mind ?? 0),
    veil: a.veil + (d.veil ?? 0),
    table: a.table + (d.table ?? 0),
    fortune: a.fortune + (d.fortune ?? 0),
  }
}

function normalize(a: Axes): Axes {
  const cap = 12
  const n = (v: number) => Math.max(-1, Math.min(1, v / cap))
  return { mind: n(a.mind), veil: n(a.veil), table: n(a.table), fortune: n(a.fortune) }
}

function dist(a: Axes, b: Axes) {
  return (['mind', 'veil', 'table', 'fortune'] as AxisId[])
    .reduce((s, k) => s + (a[k] - b[k]) ** 2, 0)
}

function poles(n: Axes) {
  return {
    mind: n.mind >= 0 ? '感' : '策',
    veil: n.veil >= 0 ? '隐' : '明',
    table: n.table >= 0 ? '众' : '对',
    fortune: n.fortune >= 0 ? '运' : '稳',
  }
}

function portraitName(n: Axes) {
  const p = `${poles(n).mind}${poles(n).veil}${poles(n).table}${poles(n).fortune}`
  const names: Record<string, string> = {
    策明对稳: '星图策士',
    策明对运: '灯下弈客',
    策明众稳: '环线东家',
    策明众运: '坊间掌柜',
    策隐对稳: '暗子校尉',
    策隐对运: '限注行人',
    策隐众稳: '圆桌谋士',
    策隐众运: '牌河舵手',
    感明对稳: '连珠行者',
    感明对运: '星轨旅人',
    感明众稳: '暖席东道',
    感明众运: '骰声嘉宾',
    感隐对稳: '读气之人',
    感隐对运: '翻盘浪客',
    感隐众稳: '夜谈密使',
    感隐众运: '星港牌手',
  }
  return names[p] ?? '棋庭访客'
}

function portraitBlurb(n: Axes) {
  const bits: string[] = []
  bits.push(n.mind < 0 ? '你习惯把变化摊开看清，再落一手。' : '你更信当场的气口，算路是为直觉让路。')
  bits.push(n.veil < 0 ? '信息公开时，你更踏实。' : '未知并不叫你慌——读人、藏招，你也乐意。')
  bits.push(n.table < 0 ? '两人对坐，已经足够盛大。' : '人一多，这盘戏才完整。')
  bits.push(n.fortune < 0 ? '你愿意把胜负交给经营，而不是一次翻转。' : '起伏来时，你并不急着躲开。')
  return bits.join('')
}

function reasonFor(id: string, n: Axes) {
  const extra: Record<string, string> = {
    xiangqi: '楚河汉界把一切摊在灯下，适合你这种愿意把一手棋想明白的客人。',
    chess: '子力与格位都看得见，深度换来从容，很衬你的坐姿。',
    gomoku: '规则清浅，却要盯住冲四与拦截——透明盘上的短兵。',
    go: '九路已经够深。气与空会慢慢长出来，适合把整晚交给一盘的人。',
    checkers: '跳跃与占营，算得少一些，手感与路线更要紧。',
    aeroplane: '骰声一响，桌面就活了。运气入场，但不妨碍你把飞机送回家。',
    junqi: '斗兽棋比大小、过河跳河，一对一的军略，开局不必说话。',
    mahjong: '吃碰之间既有手牌经营，也有围桌的温度，适合你这种软硬都要的坐法。',
    doudizhu: '三人桌，牌力与时机并重，爆发来时可以痛快出完。',
    uno: '颜色对上就能走。场面说变就变，适合今晚想轻松一点的你。',
    werewolf: '夜里有人倒下，白天要开口。隐匿与社交，正好落在你这边。',
    avalon: '信任要投票，任务里仍可能藏着失败票。隐幕之中仍要冷静组队。',
    holdem: '两张底牌是你的秘密，公共牌是大家的天气——算与运都在桌上。',
    monopoly: '掷骰走环，买地收租。经营是主线，点数只是风。',
  }
  void n
  return extra[id] ?? '与今晚的气质相近。'
}

function maybeReason(id: string) {
  const extra: Record<string, string> = {
    xiangqi: '若想把算路再练沉一点，可以来一盘中国象棋。',
    chess: '若想试试更冷的格位算术，国际象棋值得坐一坐。',
    gomoku: '想换一盘短而清楚的对坐，五子棋不会辜负你。',
    go: '若还想把深度再推一步，九路围棋会很安静地等你。',
    checkers: '想在透明盘上多一点手感，跳棋是轻松的入口。',
    aeroplane: '若今晚忽然想听骰子，飞行棋可以把气氛点燃。',
    junqi: '想换一对一的军略，斗兽棋规矩清楚、节奏干脆。',
    mahjong: '若想把围桌与经营叠在一起，麻将会很温柔地接待你。',
    doudizhu: '想试三人桌的爆发，斗地主来得快。',
    uno: '想把规则卸下来一点，UNO 不会让你正襟危坐。',
    werewolf: '若还想开口读人，狼人杀是另一扇夜门。',
    avalon: '想在隐匿里仍保持冷静组队，阿瓦隆值得一试。',
    holdem: '若想让底牌成为秘密、公共牌成为天气，可以坐进德州练习桌。',
    monopoly: '想把整晚铺成一条环线，大富翁让你慢慢当东家。',
  }
  return extra[id] ?? '顺路可以再试一试。'
}

export type SavedFit = {
  answers: number[]
  axes: Axes
  picks: string[]
  maybe: string
  at: number
}

function rankGames(raw: Axes) {
  const n = normalize(raw)
  const scored = GAMES.map((g) => ({ id: g.id, d: dist(n, g.vec) }))
    .sort((a, b) => a.d - b.d)
  const picks = scored.slice(0, 3).map((s) => s.id)
  const maybe = scored[3]?.id ?? scored[2].id
  return { n, picks, maybe }
}

function loadSaved(): SavedFit | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as SavedFit
    if (!Array.isArray(v.answers) || v.answers.length !== QUESTIONS.length) return null
    return v
  } catch {
    return null
  }
}

function persist(v: SavedFit) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
}

export default function Fit() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [saved, setSaved] = useState<SavedFit | null>(() => loadSaved())
  const [showSaved, setShowSaved] = useState(false)

  const axes = useMemo(() => {
    let a = emptyAxes()
    answers.forEach((ci, qi) => {
      const ch = QUESTIONS[qi]?.choices[ci]
      if (ch) a = addDelta(a, ch.delta)
    })
    return a
  }, [answers])

  const done = answers.length === QUESTIONS.length
  const result = done ? rankGames(axes) : null

  const restart = () => {
    setAnswers([])
    setStep(0)
    setShowSaved(false)
  }

  const pick = (ci: number) => {
    const next = answers.slice(0, step)
    next[step] = ci
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
      return
    }
    let a = emptyAxes()
    next.forEach((choiceIndex, qi) => {
      const ch = QUESTIONS[qi]?.choices[choiceIndex]
      if (ch) a = addDelta(a, ch.delta)
    })
    const ranked = rankGames(a)
    const payload: SavedFit = {
      answers: next,
      axes: a,
      picks: ranked.picks,
      maybe: ranked.maybe,
      at: Date.now(),
    }
    persist(payload)
    setSaved(payload)
  }

  const n = result?.n ?? (saved && showSaved ? normalize(saved.axes) : null)
  const displayPicks = result?.picks ?? (showSaved ? saved?.picks : undefined)
  const displayMaybe = result?.maybe ?? (showSaved ? saved?.maybe : undefined)
  const showingResult = Boolean(done && result) || Boolean(showSaved && saved)

  return (
    <div className={`page ${styles.page}`}>
      <p className={styles.kicker}>AETHER TABLE · 择席</p>
      <h1>今晚，你坐哪一席</h1>
      <p className={styles.lead}>
        不必测验性格。请把这十问当作入座前的寒暄——星域棋庭按你的坐姿，从本馆目录里为你点灯。
      </p>

      {!showingResult && saved && answers.length === 0 && (
        <div className={`holo-panel ${styles.savedBar}`}>
          <div>
            <div className={styles.savedTitle}>上次的席位还在</div>
            <div className={styles.muted}>可以先看看那一晚的画像，或从第一问重新入座。</div>
          </div>
          <div className={styles.row}>
            <button className="btn gold" type="button" onClick={() => setShowSaved(true)}>打开上次结果</button>
            <button className="btn" type="button" onClick={restart}>重新择席</button>
          </div>
        </div>
      )}

      {!showingResult && (
        <div className={`holo-panel ${styles.quiz}`}>
          <div className={styles.progress} aria-hidden="true">
            {QUESTIONS.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i < answers.length ? styles.dotOn : ''} ${i === step ? styles.dotNow : ''}`}
              />
            ))}
          </div>
          <div className={styles.scene}>{QUESTIONS[step].scene}</div>
          <h2 className={styles.prompt}>{QUESTIONS[step].prompt}</h2>
          <div className={styles.choices}>
            {QUESTIONS[step].choices.map((c, i) => (
              <button
                key={c.label}
                type="button"
                className={`${styles.choice} ${answers[step] === i ? styles.choiceOn : ''}`}
                onClick={() => pick(i)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className={styles.navRow}>
            <button className="btn icon-btn" type="button" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              上一问
            </button>
            <span className={styles.muted}>{step + 1} / {QUESTIONS.length}</span>
          </div>
        </div>
      )}

      {showingResult && n && displayPicks && displayMaybe && (
        <ResultCard n={n} picks={displayPicks} maybe={displayMaybe} onRestart={restart} fromSaved={Boolean(showSaved && !done)} />
      )}
    </div>
  )
}

function ResultCard({
  n, picks, maybe, onRestart, fromSaved,
}: {
  n: Axes
  picks: string[]
  maybe: string
  onRestart: () => void
  fromSaved: boolean
}) {
  const name = portraitName(n)
  const code = `${poles(n).mind}${poles(n).veil}${poles(n).table}${poles(n).fortune}`
  return (
    <div className={`holo-panel ${styles.result}`}>
      {fromSaved && <div className={styles.muted}>这是你留在棋庭里的上一幅画像。</div>}
      <div className={styles.portraitHead}>
        <div>
          <div className={styles.kicker}>席位画像</div>
          <h2 className={styles.portraitName}>{name}</h2>
          <div className={styles.code}>{code} · 四轴速写</div>
        </div>
      </div>
      <p className="coach">{portraitBlurb(n)}</p>
      <div className={styles.axes}>
        {(Object.keys(AXIS_META) as AxisId[]).map((k) => {
          const meta = AXIS_META[k]
          const v = n[k]
          const pct = (v + 1) / 2 * 100
          return (
            <div key={k} className={styles.axis}>
              <div className={styles.axisLabels}>
                <span>{meta.low}</span>
                <span>{meta.high}</span>
              </div>
              <div className={styles.axisTrack}>
                <div className={styles.axisFill} style={{ width: `${pct}%` }} />
                <i className={styles.axisMark} style={{ left: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <h2>为你点亮的席</h2>
      <div className={styles.picks}>
        {picks.map((id, i) => {
          const g = getGame(id)
          if (!g) return null
          return (
            <article key={id} className={`holo-panel game-card ${styles.pick}`}>
              <GameMotif id={id} />
              <span className="badge full-ai">{i === 0 ? '最贴合' : '也适合'}</span>
              <h3>{g.nameZh}</h3>
              <div className="en">{g.nameEn}</div>
              <p className={styles.why}>{reasonFor(id, n)}</p>
              <div className={styles.row}>
                <Link className="btn" to={`/play/${id}`}>入座开局</Link>
                <Link className="btn gold" to={`/game/${id}`}>先看说明</Link>
              </div>
            </article>
          )
        })}
      </div>
      {(() => {
        const g = getGame(maybe)
        if (!g) return null
        return (
          <div className={`holo-panel ${styles.maybe}`}>
            <GameMotif id={maybe} compact />
            <div>
              <div className={styles.kicker}>顺路一试</div>
              <h3 style={{ margin: '0.2rem 0 0.4rem', fontFamily: 'var(--font-accent)' }}>{g.nameZh}</h3>
              <p className={styles.why}>{maybeReason(maybe)}</p>
              <div className={styles.row}>
                <Link className="btn peach" to={`/play/${maybe}`}>试一盘</Link>
                <Link className="btn" to={`/game/${maybe}`}>百科</Link>
              </div>
            </div>
          </div>
        )
      })()}
      <div className={styles.row} style={{ marginTop: '1.25rem' }}>
        <button className="btn magenta" type="button" onClick={onRestart}>重新择席</button>
        <Link className="btn" to="/library">去目录看看</Link>
      </div>
    </div>
  )
}
