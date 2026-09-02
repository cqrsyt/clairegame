import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getSocket, wakeHost, HOST_WAKE_HINT } from '../lib/socket'
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
    const onConnect = () => { setConnected(true); setError('') }
    const onFail = () => { setConnected(false); setError(HOST_WAKE_HINT) }
    s.on('room_update', onRoom)
    s.on('game_state', onState)
    s.on('error_msg', onErr)
    s.on('connect', onConnect)
    s.on('connect_error', onFail)
    if (s.connected) setConnected(true)
    else void wakeHost((msg) => setError(msg))
    return () => {
      s.off('room_update', onRoom)
      s.off('game_state', onState)
      s.off('error_msg', onErr)
      s.off('connect', onConnect)
      s.off('connect_error', onFail)
    }
  }, [])

  useEffect(() => {
    setNickname(name)
  }, [name])

  const create = () => {
    setError('')
    getSocket().emit('create_room', { gameId, name }, (res: any) => {
      if (!res?.ok) return setError(res?.error || '创建失败')
      setRoom(res.room)
      nav(`/lobby/${res.room.code}`)
    })
  }

  const join = (code?: string) => {
    setError('')
    const c = (code || joinCode).toUpperCase()
    getSocket().emit('join_room', { code: c, name }, (res: any) => {
      if (!res?.ok) return setError(res?.error || '加入失败')
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
      <h1>联机大厅</h1>
      <p style={{ color: 'var(--muted)' }}>
        填一个昵称，创建或加入房间。象棋、国际象棋、五子棋、狼人杀、阿瓦隆可以联机。
        {connected ? ' · 已连上房间服务' : ' · 正在连接…'}
      </p>
      <div className="holo-panel" style={{ padding: '1.25rem', display: 'grid', gap: '1rem', maxWidth: 560 }}>
        <label>
          昵称
          <input className="input" style={{ width: '100%', marginTop: 6 }} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          游戏
          <select className="input" style={{ width: '100%', marginTop: 6 }} value={gameId} onChange={(e) => setGameId(e.target.value)}>
            {onlineGames.map((g) => (
              <option key={g.id} value={g.id}>{g.nameZh}</option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={create}>创建房间</button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input className="input" placeholder="房间码" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          <button className="btn magenta" onClick={() => join()}>加入</button>
        </div>
        {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
      </div>

      <div className="holo-panel" style={{ marginTop: '1.5rem', padding: '1.25rem', maxWidth: 560 }}>
        <h2>收藏的人和房间</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>存在本机，方便下次再进。</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stars.nicks.map((n) => (
            <button key={n} className="btn" onClick={() => setName(n)}>{n}</button>
          ))}
          {stars.rooms.map((c) => (
            <button key={c} className="btn gold" onClick={() => { setJoinCode(c); join(c) }}>房 {c}</button>
          ))}
        </div>
      </div>

      {room && (
        <div className="holo-panel" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
          <h2>房间 {room.code}</h2>
          <p style={{ color: 'var(--muted)' }}>游戏：{GAMES.find((g) => g.id === room.gameId)?.nameZh} · 分享房间码或链接</p>
          <ul>
            {room.players.map((p: any) => (
              <li key={p.id}>
                {p.name} {p.ready ? '✓' : ''} {p.id === room.host ? '（房主）' : ''}
                <button className="btn icon-btn" style={{ marginLeft: 8 }} onClick={() => setStars(toggleStarNick(p.name))}>星标</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => getSocket().emit('toggle_ready', { code: room.code })}>切换准备</button>
            <button className="btn gold" onClick={() => getSocket().emit('start_game', { code: room.code })}>开始对局</button>
            <button className="btn" onClick={() => setStars(toggleStarRoom(room.code))}>收藏这个房间</button>
            <Link className="btn magenta" to="/library">离开</Link>
          </div>
        </div>
      )}
    </div>
  )
}
