import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Library from './pages/Library'
import Encyclopedia from './pages/Encyclopedia'
import PlayPage from './pages/PlayPage'
import Lobby from './pages/Lobby'
import History from './pages/History'
import Fit from './pages/Fit'
import { isMuted, subscribeMute, toggleMute } from './lib/sfx'
import { fetchMe, githubLoginUrl, getNickname, setNickname, type GhUser } from './lib/account'

export default function App() {
  const [mute, setMute] = useState(isMuted)
  const [user, setUser] = useState<GhUser>(null)
  const [oauth, setOauth] = useState(false)
  const [msg, setMsg] = useState('')
  const [nick, setNick] = useState(getNickname)
  const [editing, setEditing] = useState(false)

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

  const ghLogin = () => {
    setMsg('')
    if (!oauth) {
      setMsg('先用昵称即可，账号登录以后再开。')
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
          <NavLink to="/library" className={({ isActive }) => (isActive ? 'active' : '')}>目录</NavLink>
          <NavLink to="/fit" className={({ isActive }) => (isActive ? 'active' : '')}>择席</NavLink>
          <NavLink to="/lobby" className={({ isActive }) => (isActive ? 'active' : '')}>房间</NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>战绩</NavLink>
          <button className="btn icon-btn" onClick={toggleMute} aria-label="静音">{mute ? '声音已关' : '音效'}</button>
          {editing ? (
            <input
              className="input"
              style={{ width: 120 }}
              value={nick}
              autoFocus
              onChange={(e) => setNick(e.target.value)}
              onBlur={() => { setNickname(nick); setEditing(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setNickname(nick); setEditing(false) } }}
            />
          ) : (
            <button className="btn icon-btn" onClick={() => setEditing(true)}>昵称 · {nick}</button>
          )}
          {user ? (
            <span className="gh-user"><img src={user.avatar} alt="" width={22} height={22} />{user.login}</span>
          ) : oauth ? (
            <button className="btn magenta icon-btn" onClick={ghLogin}>登录</button>
          ) : null}
        </nav>
      </header>
      {msg && <div className="banner">{msg}</div>}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/library" element={<Library />} />
        <Route path="/fit" element={<Fit />} />
        <Route path="/game/:id" element={<Encyclopedia />} />
        <Route path="/play/:id" element={<PlayPage />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/lobby/:code" element={<Lobby />} />
        <Route path="/history" element={<History />} />
      </Routes>
      <footer className="footer">星域棋庭 · AETHER TABLE · 本地可玩，联机看服务器是否在线</footer>
    </div>
  )
}
