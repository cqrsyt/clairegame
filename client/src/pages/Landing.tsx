import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <section className="hero">
      <div className="tagline">深空霓虹 · 棋庭永夜</div>
      <h1>星域棋庭</h1>
      <p>
        在虚空全息板上落子、推理、结盟。中国象棋、国际象棋、五子棋、飞行棋、跳棋本地 AI 可战；
        狼人杀与阿瓦隆机器人闭环；麻将、斗地主、UNO 可对人机；Pages + Render 联机。
      </p>
      <div className="hero-cta">
        <Link className="btn" to="/library">进入星图库</Link>
        <Link className="btn magenta" to="/play/xiangqi">立即对弈·象棋</Link>
        <Link className="btn gold" to="/lobby">开启联机房间</Link>
      </div>
      <div style={{ marginTop: '3rem' }} className="holo-panel">
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
          {[
            ['本地 AI', '棋类完整可玩 + 教练高亮'],
            ['牌类', '麻将 · 斗地主 · UNO'],
            ['联机', 'Socket.IO 房间码'],
            ['图鉴', '十四款星域桌游'],
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
