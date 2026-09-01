import { useEffect, useState } from 'react'
import { getHistory, getNickname } from '../lib/account'
import { GAMES } from '@aether/shared'

export default function History() {
  const [items, setItems] = useState<{ gameId: string; result: string; at: number; nick: string }[]>([])
  const nick = getNickname()
  useEffect(() => { getHistory(nick).then(setItems) }, [nick])
  return (
    <div className="page">
      <h1>战绩</h1>
      <p style={{ color: 'var(--muted)' }}>昵称「{nick}」最近 20 局（服务端内存，重启后清空）。</p>
      <div className="holo-panel" style={{ padding: '1.25rem' }}>
        {!items.length && <p style={{ color: 'var(--muted)' }}>暂无记录。完成本地对局后会自动写入。</p>}
        <ul className="hist-list">
          {items.map((it, i) => (
            <li key={i}>
              <strong>{GAMES.find((g) => g.id === it.gameId)?.nameZh || it.gameId}</strong>
              <span> · {it.result}</span>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(it.at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
