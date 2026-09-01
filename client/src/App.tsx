import { NavLink, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Library from './pages/Library'
import Encyclopedia from './pages/Encyclopedia'
import PlayPage from './pages/PlayPage'
import Lobby from './pages/Lobby'

export default function App() {
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
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/library" element={<Library />} />
        <Route path="/game/:id" element={<Encyclopedia />} />
        <Route path="/play/:id" element={<PlayPage />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/lobby/:code" element={<Lobby />} />
      </Routes>
      <footer className="footer">星域棋庭 · AETHER TABLE — 霓虹虚空中的桌游门户</footer>
    </div>
  )
}
