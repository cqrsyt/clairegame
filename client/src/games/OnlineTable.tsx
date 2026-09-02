import { useEffect, useState } from 'react'
import { getSocket } from '../lib/socket'
import ShareCard from '../components/ShareCard'
import { playSfx } from '../lib/sfx'

export default function OnlineTable({ room, state, setState }: { room: any; state: any; setState: (s: any) => void }) {
  useEffect(() => {
    const s = getSocket()
    const onState = (st: any) => setState(st)
    s.on('game_state', onState)
    const iv = setInterval(() => {
      if (room.gameId === 'werewolf' || room.gameId === 'avalon') {
        s.emit('game_action', { code: room.code, action: 'botStep', payload: {} })
      }
    }, 1200)
    return () => {
      s.off('game_state', onState)
      clearInterval(iv)
    }
  }, [room.code, room.gameId, setState])

  const act = (action: string, payload: any = {}) => {
    getSocket().emit('game_action', { code: room.code, action, payload })
  }

  if (room.gameId === 'gomoku') {
    return (
      <div className="page">
        <h1>联机五子棋 · 房间 {room.code}</h1>
        <OnlineGomoku state={state} onMove={(r, c) => { playSfx('move'); act('move', { r, c }) }} />
        <ShareCard gameId="gomoku" title="联机五子棋" result={state?.winner === 1 ? '黑胜' : '白胜'} room={room.code} open={!!state?.winner} />
      </div>
    )
  }

  if (room.gameId === 'chess') {
    return (
      <div className="page">
        <h1>联机国际象棋 · {room.code}</h1>
        <OnlineChess state={state} onMove={(fr, fc, tr, tc) => { playSfx(state?.board?.[tr]?.[tc] ? 'capture' : 'move'); act('move', { fr, fc, tr, tc }) }} />
        <ShareCard gameId="chess" title="联机国际象棋" result={state?.winner === 'w' ? '白胜' : state?.winner === 'draw' ? '和棋' : '黑胜'} room={room.code} open={!!state?.winner} />
      </div>
    )
  }

  if (room.gameId === 'xiangqi') {
    return (
      <div className="page">
        <h1>联机象棋 · {room.code}</h1>
        <OnlineXiangqi state={state} onMove={(fr, fc, tr, tc) => { playSfx(state?.board?.[tr]?.[tc] ? 'capture' : 'move'); act('move', { fr, fc, tr, tc }) }} />
        <ShareCard gameId="xiangqi" title="联机象棋" result={state?.winner === 'R' ? '红胜' : '黑胜'} room={room.code} open={!!state?.winner} />
      </div>
    )
  }

  if (room.gameId === 'werewolf') {
    return (
      <div className="page">
        <h1>联机狼人杀 · {room.code}</h1>
        {!state ? <p>等待状态…</p> : (
          <div className="holo-panel" style={{ padding: '1rem' }}>
            <h2>{state.phase} · 夜 {state.night}</h2>
            <div className="log">{state.log?.map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
            <div style={{ marginTop: 12 }}>
              {(state.players || []).filter((p: any) => p.alive).map((p: any) => (
                <button key={p.id} className="btn" style={{ margin: 4 }} onClick={() => {
                  if (state.phase === 'night_wolf') act('wolfKill', { targetId: p.id })
                  else if (state.phase === 'night_seer') act('seerCheck', { targetId: p.id })
                  else if (state.phase === 'day_vote' || state.phase === 'day_talk') act('vote', { targetId: p.id })
                  else if (state.phase === 'hunter_shot') act('hunterShoot', { targetId: p.id })
                }}>{p.name}</button>
              ))}
            </div>
            {state.phase === 'night_witch' && (
              <button className="btn magenta" onClick={() => act('witchAct', { save: false })}>女巫过</button>
            )}
            {state.phase === 'day_vote' && (
              <button className="btn gold" onClick={() => act('resolveVotes')}>结算投票</button>
            )}
            {state.winner && <div className="coach">胜负：{state.winner}</div>}
            <ShareCard gameId="werewolf" title="联机狼人杀" result={String(state.winner || '')} room={room.code} open={!!state.winner} />
          </div>
        )}
      </div>
    )
  }

  if (room.gameId === 'avalon') {
    return (
      <div className="page">
        <h1>联机阿瓦隆 · {room.code}</h1>
        {!state ? <p>等待状态…</p> : (
          <div className="holo-panel" style={{ padding: '1rem' }}>
            <h2>{state.phase} · 任务 {state.questIndex + 1}</h2>
            <button className="btn" onClick={() => act('nightInfo')}>查看夜间信息</button>
            <div style={{ marginTop: 8 }}>
              {(state.players || []).map((p: any) => (
                <button key={p.id} className="btn" style={{ margin: 4 }} onClick={() => {
                  if (state.phase === 'team_propose') {
                    const need = state.teamSizes[state.questIndex]
                    const team = state.players.slice(0, need).map((x: any) => x.id)
                    act('propose', { team })
                  } else if (state.phase === 'assassinate') act('assassinate', { targetId: p.id })
                }}>{p.name}</button>
              ))}
            </div>
            {state.phase === 'team_vote' && (
              <>
                <button className="btn" onClick={() => act('vote', { approve: true })}>同意</button>
                <button className="btn magenta" onClick={() => act('vote', { approve: false })}>反对</button>
              </>
            )}
            {state.phase === 'quest' && (
              <>
                <button className="btn" onClick={() => act('quest', { success: true })}>成功</button>
                <button className="btn magenta" onClick={() => act('quest', { success: false })}>失败</button>
              </>
            )}
            <div className="log" style={{ marginTop: 12 }}>{state.log?.map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
            {state.winner && <div className="coach">胜负：{state.winner}</div>}
            <ShareCard gameId="avalon" title="联机阿瓦隆" result={String(state.winner || '')} room={room.code} open={!!state.winner} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <h1>房间 {room.code}</h1>
      <p>该游戏联机桌为 Coming Soon 占位。</p>
    </div>
  )
}

function OnlineGomoku({ state, onMove }: { state: any; onMove: (r: number, c: number) => void }) {
  if (!state?.board) return <p>同步中…</p>
  const lm = state.lastMove
  return (
    <div className="board-scale">
      <div className="gomoku-board">
        {state.board.map((row: number[], r: number) =>
          row.map((cell: number, c: number) => (
            <div key={`${r}-${c}`} className={`gomoku-cell ${lm && lm.r === r && lm.c === c ? 'last-move' : ''}`} onClick={() => onMove(r, c)}>
              {cell === 1 && <div className={`stone b ${lm && lm.r === r && lm.c === c ? 'piece-fly' : ''}`} />}
              {cell === 2 && <div className={`stone w ${lm && lm.r === r && lm.c === c ? 'piece-fly' : ''}`} />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OnlineChess({ state, onMove }: { state: any; onMove: (fr: number, fc: number, tr: number, tc: number) => void }) {
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  if (!state?.board) return <p>同步中…</p>
  const GLYPH: Record<string, string> = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' }
  const lm = state.lastMove
  const pick = (r: number, c: number) => {
    if (!sel) setSel({ r, c })
    else {
      onMove(sel.r, sel.c, r, c)
      setSel(null)
    }
  }
  const fly = (r: number, c: number) => (lm && lm.tr === r && lm.tc === c ? 'piece-fly' : '')
  return (
    <div className="board-scale">
      <div className="chess-board">
        {state.board.map((row: any[], r: number) =>
          row.map((p: string | null, c: number) => (
            <div
              key={`${r}-${c}`}
              className={`sq ${(r + c) % 2 === 0 ? 'light' : 'dark'} ${sel?.r === r && sel?.c === c ? 'selected' : ''} ${lm && lm.tr === r && lm.tc === c ? 'last-move' : ''}`}
              onClick={() => pick(r, c)}
            >
              {p ? <span className={fly(r, c)}>{GLYPH[p]}</span> : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OnlineXiangqi({ state, onMove }: { state: any; onMove: (fr: number, fc: number, tr: number, tc: number) => void }) {
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null)
  if (!state?.board) return <p>同步中…</p>
  const lm = state.lastMove
  const pick = (r: number, c: number) => {
    if (!sel) setSel({ r, c })
    else {
      onMove(sel.r, sel.c, r, c)
      setSel(null)
    }
  }
  const fly = (r: number, c: number) => (lm && lm.tr === r && lm.tc === c ? 'piece-fly' : '')
  return (
    <div className="board-scale">
      <div className="xq-board">
        {state.board.map((row: any[], r: number) =>
          row.map((p: string | null, c: number) => (
            <div
              key={`${r}-${c}`}
              className={`xq-cell ${sel?.r === r && sel?.c === c ? 'selected' : ''} ${lm && lm.tr === r && lm.tc === c ? 'last-move' : ''}`}
              onClick={() => pick(r, c)}
            >
              {p ? <span className={fly(r, c)}>{p}</span> : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
