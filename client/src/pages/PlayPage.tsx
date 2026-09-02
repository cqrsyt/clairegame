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
import GoGame from '../games/GoGame'
import JunqiGame from '../games/JunqiGame'
import HoldemGame from '../games/HoldemGame'
import MonopolyGame from '../games/MonopolyGame'
import GameMotif from '../components/GameMotif'

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
  go: GoGame,
  junqi: JunqiGame,
  holdem: HoldemGame,
  monopoly: MonopolyGame,
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
        <h1>这款还不能坐下来玩</h1>
        <p style={{ color: 'var(--muted)' }}>可以先看说明，或换一款已经开放的。</p>
        <Link className="btn" to={`/game/${id}`}>查看说明</Link>
      </div>
    )
  }
  return (
    <div className="page play-page">
      <div className="play-header">
        <GameMotif id={g.id} compact />
        <h1 style={{ marginBottom: 0 }}>{g.nameZh}</h1>
        <Link to={`/game/${g.id}`} style={{ color: 'var(--muted)', marginLeft: 'auto' }}>规则说明</Link>
      </div>
      <Comp />
    </div>
  )
}
