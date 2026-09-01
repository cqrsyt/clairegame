import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getSocket } from '../lib/socket'
import { GAMES } from '@aether/shared'
import OnlineTable from '../games/OnlineTable'

export default function Lobby() {
  const { code: codeParam } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [name, setName] = useState(() => localStorage.getItem('aether-name') || '旅人')
  const [gameId, setGameId] = useState(params.get('game') || 'werewolf')
  const [joinCode, setJoinCode] = useState(codeParam || '')
  const [room, setRoom] = useState<any>(null)
  const [state, setState] = useState<any>(null)
  const [error, setError] = useState('')

  const onlineGames = useMemo(
    () => GAMES.filter((g) => ['chess', 'xiangqi', 'gomoku', 'werewolf', 'avalon'].includes(g.id)),
    []
  )

  useEffect(() => {
    const s = getSocket()
    const onRoom = (r: any) => setRoom(r)
    const onState = (st: any) => setState(st)
    s.on('room_update', onRoom)
    s.on('game_state', onState)
    return () => {
      s.off('room_update', onRoom)
      s.off('game_state', onState)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('aether-name', name)
  }, [name])

  const create = () => {
    setError('')
    getSocket().emit('create_room', { gameId, name }, (res: any) => {
      if (!res?.ok) return setError(res?.error || '创建失败')
      setRoom(res.room)
      nav(`/lobby/${res.room.code}`)
    })
  }

  const join = () => {
    setError('')
    getSocket().emit('join_room', { code: joinCode, name }, (res: any) => {
      if (!res?.ok) return setError(res?.error || '加入失败')
      setRoom(res.room)
      nav(`/lobby/${res.room.code}`)
    })
  }

  if (room?.status === 'playing') {
    return <OnlineTable room={room} state={state} setState={setState} />
  }

  return (
    <div className="page">
      <h1>联机大厅</h1>
      <p style={{ color: 'var(--muted)' }}>输入昵称，创建或加入房间。狼人杀 / 阿瓦隆 / 棋类支持双标签页联机。</p>
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
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="房间码" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
          <button className="btn magenta" onClick={join}>加入</button>
        </div>
        {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
      </div>

      {room && (
        <div className="holo-panel" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
          <h2>房间 {room.code}</h2>
          <p style={{ color: 'var(--muted)' }}>游戏：{GAMES.find((g) => g.id === room.gameId)?.nameZh} · 分享房间码给另一标签页</p>
          <ul>
            {room.players.map((p: any) => (
              <li key={p.id}>{p.name} {p.ready ? '✓' : ''} {p.id === room.host ? '（房主）' : ''}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => getSocket().emit('toggle_ready', { code: room.code })}>准备切换</button>
            <button className="btn gold" onClick={() => getSocket().emit('start_game', { code: room.code })}>开始游戏</button>
            <Link className="btn magenta" to="/library">离开</Link>
          </div>
        </div>
      )}
    </div>
  )
}
