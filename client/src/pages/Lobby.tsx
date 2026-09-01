import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getSocket } from '../lib/socket'
import { GAMES } from '@aether/shared'
import OnlineTable from '../games/OnlineTable'
import { getNickname, setNickname, getStars, toggleStarNick, toggleStarRoom } from '../lib/account'

export default function Lobby() {
  const { code: codeParam } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [name, setName] = useState(() => getNickname())
  const [gameId, setGameId] = useState(params.get('game') || 'werewolf')
  const [joinCode, setJoinCode] = useState(codeParam || params.get('room') || '')
  const [room, setRoom] = useState<any>(null)
  const [state, setState] = useState<any>(null)
  const [error, setError] = useState('')
  const [stars, setStars] = useState(getStars)
  const [connected, setConnected] = useState(false)

  const onlineGames = useMemo(
    () => GAMES.filter((g) => ['chess', 'xiangqi', 'gomoku', 'werewolf', 'avalon'].includes(g.id)),
    []
  )

  useEffect(() => {
    const s = getSocket()
    const onRoom = (r: any) => setRoom(r)
    const onState = (st: any) => setState(st)
    const onErr = (e: string) => setError(e)
    s.on('room_update', onRoom)
    s.on('game_state', onState)
    s.on('error_msg', onErr)
    s.on('connect', () => setConnected(true))
    s.on('connect_error', () => { setConnected(false); setError('cannot connect (Render free instance may be waking)') })
    if (s.connected) setConnected(true)
    return () => {
      s.off('room_update', onRoom)
      s.off('game_state', onState)
      s.off('error_msg', onErr)
    }
  }, [])

  useEffect(() => {
    setNickname(name)
  }, [name])

  const create = () => {
    setError('')
    getSocket().emit('create_room', { gameId, name }, (res: any) => {
      if (!res?.ok) return setError(res?.error || 'create failed')
      setRoom(res.room)
      nav(`/lobby/${res.room.code}`)
    })
  }

  const join = (code?: string) => {
    setError('')
    const c = (code || joinCode).toUpperCase()
    getSocket().emit('join_room', { code: c, name }, (res: any) => {
      if (!res?.ok) return setError(res?.error || 'join failed')
      setRoom(res.room)
      nav(`/lobby/${res.room.code}`)
    })
  }

  useEffect(() => {
    const auto = codeParam || params.get('room')
    if (auto && !room) {
      const t = setTimeout(() => join(auto), 400)
      return () => clearTimeout(t)
    }
  }, [codeParam, connected])

  if (room?.status === 'playing') {
    return <OnlineTable room={room} state={state} setState={setState} />
  }

  return (
    <div className="page">
      <h1>lobby</h1>
      <p style={{ color: 'var(--muted)' }}>
        chess / xiangqi / gomoku / werewolf / avalon online.
        {connected ? ' connected' : ' connecting...'}
      </p>
      <div className="holo-panel" style={{ padding: '1.25rem', display: 'grid', gap: '1rem', maxWidth: 560 }}>
        <label>
          nick
          <input className="input" style={{ width: '100%', marginTop: 6 }} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          game
          <select className="input" style={{ width: '100%', marginTop: 6 }} value={gameId} onChange={(e) => setGameId(e.target.value)}>
            {onlineGames.map((g) => (
              <option key={g.id} value={g.id}>{g.nameZh}</option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={create}>create room</button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input" placeholder="room code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          <button className="btn magenta" onClick={() => join()}>join</button>
        </div>
        {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
      </div>

      <div className="holo-panel" style={{ marginTop: '1.5rem', padding: '1.25rem', maxWidth: 560 }}>
        <h2>starred</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stars.nicks.map((n) => (
            <button key={n} className="btn" onClick={() => setName(n)}>{n}</button>
          ))}
          {stars.rooms.map((c) => (
            <button key={c} className="btn gold" onClick={() => { setJoinCode(c); join(c) }}>room {c}</button>
          ))}
        </div>
      </div>

      {room && (
        <div className="holo-panel" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
          <h2>room {room.code}</h2>
          <p style={{ color: 'var(--muted)' }}>{GAMES.find((g) => g.id === room.gameId)?.nameZh}</p>
          <ul>
            {room.players.map((p: any) => (
              <li key={p.id}>
                {p.name} {p.ready ? 'Y' : ''} {p.id === room.host ? '(host)' : ''}
                <button className="btn icon-btn" style={{ marginLeft: 8 }} onClick={() => setStars(toggleStarNick(p.name))}>star</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => getSocket().emit('toggle_ready', { code: room.code })}>ready</button>
            <button className="btn gold" onClick={() => getSocket().emit('start_game', { code: room.code })}>start</button>
            <button className="btn" onClick={() => setStars(toggleStarRoom(room.code))}>star room</button>
            <Link className="btn magenta" to="/library">leave</Link>
          </div>
        </div>
      )}
    </div>
  )
}
