import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <section className="hero">
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
      <div style={{ marginTop: '3rem' }} className="holo-panel">
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
          {[
            ['本地对弈', '电脑会想一会儿再走'],
            ['牌类与推理', '麻将、斗地主、狼人杀'],
            ['联机', '分享房间码即可'],
            ['说明', '每一步旁边都有提示'],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)', margin: '0 0 0.4rem', fontSize: '0.95rem', letterSpacing: '0.12em' }}>{t}</h3>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
