import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Library from './pages/Library'
import Encyclopedia from './pages/Encyclopedia'
import PlayPage from './pages/PlayPage'
import Lobby from './pages/Lobby'
import History from './pages/History'
import { isMuted, subscribeMute, toggleMute } from './lib/sfx'
import { fetchMe, githubLoginUrl, getNickname, setNickname, type GhUser } from './lib/account'

export default function App() {
  const [mute, setMute] = useState(isMuted)
  const [user, setUser] = useState<GhUser>(null)
  const [oauth, setOauth] = useState(true)
  const [msg, setMsg] = useState('')
  const [nick, setNick] = useState(getNickname)

  useEffect(() => subscribeMute(() => setMute(isMuted())), [])
  useEffect(() => {
    fetchMe().then((r) => {
      setUser(r.user)
      setOauth(r.oauth)
      if (r.user?.login) {
        setNick(r.user.login)
        setNickname(r.user.login)
      }
    })
  }, [])

  const ghLogin = async () => {
    setMsg('')
    if (!oauth) {
      setMsg('主机尚未配置 GitHub OAuth。请在 Render 设置 GITHUB_CLIENT_ID 与 GITHUB_CLIENT_SECRET。')
      return
    }
    window.location.href = githubLoginUrl()
  }

  return (
    <div className="app-shell">
      <header className="topnav">
        <NavLink to="/" className="brand">
          AETHER TABLE
          <small>星域棋庭</small>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/library" className={({ isActive }) => (isActive ? 'active' : '')}>星图库</NavLink>
          <NavLink to="/lobby" className={({ isActive }) => (isActive ? 'active' : '')}>联机大厅</NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>战绩</NavLink>
          <button className="btn icon-btn" onClick={toggleMute} aria-label="静音">{mute ? '静音' : '音效'}</button>
          <span className="nick-chip">旅人 · {nick}</span>
          {user ? (
            <span className="gh-user"><img src={user.avatar} alt="" width={22} height={22} />{user.login}</span>
          ) : (
            <button className="btn magenta icon-btn" onClick={ghLogin}>用 GitHub 登录</button>
          )}
        </nav>
      </header>
      {msg && <div className="banner">{msg}</div>}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/library" element={<Library />} />
        <Route path="/game/:id" element={<Encyclopedia />} />
        <Route path="/play/:id" element={<PlayPage />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/lobby/:code" element={<Lobby />} />
        <Route path="/history" element={<History />} />
      </Routes>
      <footer className="footer">星域棋庭 · AETHER TABLE — 霓虹虚空中的桌游门户</footer>
    </div>
  )
}
