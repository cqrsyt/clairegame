import type { ComponentType } from 'react'
import { useParams, Link, useSearchParams, Navigate } from 'react-router-dom'
import { getGame } from '@aether/shared'
import ChessGame from '../games/ChessGame'
import XiangqiGame from '../games/XiangqiGame'
import GomokuGame from '../games/GomokuGame'
import CheckersGame from '../games/CheckersGame'
import AeroplaneGame from '../games/AeroplaneGame'
import WerewolfGame from '../games/WerewolfGame'
import AvalonGame from '../games/AvalonGame'
import MahjongGame from '../games/MahjongGame'
import UnoGame from '../games/UnoGame'
import DoudizhuGame from '../games/DoudizhuGame'

const map: Record<string, ComponentType> = {
  chess: ChessGame,
  xiangqi: XiangqiGame,
  gomoku: GomokuGame,
  checkers: CheckersGame,
  aeroplane: AeroplaneGame,
  werewolf: WerewolfGame,
  avalon: AvalonGame,
  mahjong: MahjongGame,
  uno: UnoGame,
  doudizhu: DoudizhuGame,
}

export default function PlayPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const room = params.get('room')
  const g = getGame(id || '')
  const Comp = id ? map[id] : null
  if (room && id) return <Navigate to={`/lobby/${room}?game=${id}`} replace />
  if (!g || !Comp) {
    return (
      <div className="page">
        <h1>尚未开放完整对局</h1>
        <Link className="btn" to={`/game/${id}`}>查看图鉴</Link>
      </div>
    )
  }
  return (
    <div className="page play-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ marginBottom: 0 }}>{g.nameZh}</h1>
        <Link to={`/game/${g.id}`} style={{ color: 'var(--muted)' }}>图鉴与教程</Link>
      </div>
      <Comp />
    </div>
  )
}
