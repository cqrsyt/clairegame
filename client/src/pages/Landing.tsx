import { Link } from 'react-router-dom'
import GameMotif from '../components/GameMotif'

export default function Landing() {
  return (
    <section className="hero">
      <div className="hero-ornament" aria-hidden="true">
        <svg viewBox="0 0 640 140" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffb08a" />
              <stop offset="1" stopColor="#ffc85a" />
            </linearGradient>
          </defs>
          <ellipse cx="320" cy="72" rx="210" ry="48" fill="none" stroke="url(#ringGold)" strokeWidth="1.6" opacity="0.85" />
          <ellipse cx="320" cy="72" rx="150" ry="32" fill="none" stroke="#ff4ae8" strokeWidth="1" opacity="0.45" />
          <ellipse cx="320" cy="72" rx="90" ry="18" fill="none" stroke="#fff4e4" strokeWidth="0.8" opacity="0.5" />
          <circle cx="320" cy="72" r="8" fill="#ffc85a" opacity="0.9" />
          {[
            [80, 28, 4], [120, 90, 3], [540, 30, 4], [560, 96, 3],
            [200, 18, 2.5], [430, 16, 3], [250, 118, 2.4], [400, 122, 3],
            [40, 70, 2], [600, 64, 2.2],
          ].map(([x, y, r], i) => (
            <polygon
              key={i}
              points={`${x},${y - r} ${x + r * 0.35},${y - r * 0.2} ${x + r},${y} ${x + r * 0.35},${y + r * 0.2} ${x},${y + r} ${x - r * 0.35},${y + r * 0.2} ${x - r},${y} ${x - r * 0.35},${y - r * 0.2}`}
              fill={i % 2 ? '#ffb08a' : '#ffc85a'}
              opacity="0.9"
            />
          ))}
        </svg>
      </div>
      <div className="tagline">请坐。今晚想下一盘什么？</div>
      <h1>星域棋庭</h1>
      <p>
        象棋、国际象棋、五子棋、围棋、跳棋、飞行棋都可以和电脑下；
        麻将、斗地主、UNO、狼人杀、阿瓦隆有人机陪打。
        联机房间需要后端在线；若连不上，先跟电脑下也完全可以。
      </p>
      <div className="hero-cta">
        <Link className="btn" to="/library">浏览游戏</Link>
        <Link className="btn magenta" to="/play/xiangqi">下一盘象棋</Link>
        <Link className="btn gold" to="/lobby">开房间</Link>
      </div>
      <div className="motif-preview-row">
        {['xiangqi', 'chess', 'mahjong', 'holdem'].map((id) => (
          <GameMotif key={id} id={id} />
        ))}
      </div>
      <div style={{ marginTop: '3rem' }} className="holo-panel">
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
          {[
            ['本地对弈', '电脑会想一会儿再走'],
            ['牌类与推理', '麻将、斗地主、狼人杀'],
            ['联机', '分享房间码即可'],
            ['说明', '每一步旁边都有提示'],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', margin: '0 0 0.4rem', fontSize: '0.95rem', letterSpacing: '0.12em' }}>{t}</h3>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
