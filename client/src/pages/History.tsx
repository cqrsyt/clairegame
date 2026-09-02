import { useEffect, useState } from 'react'
import { getHistory, getNickname, getLocalHistory, type HistItem } from '../lib/account'
import { GAMES } from '@aether/shared'

export default function History() {
  const [items, setItems] = useState<HistItem[]>([])
  const nick = getNickname()
  useEffect(() => {
    getHistory(nick).then((list) => setItems(list.length ? list : getLocalHistory()))
  }, [nick])
  return (
    <div className="page">
      <h1>战绩</h1>
      <p style={{ color: 'var(--muted)' }}>以昵称「{nick}」记下最近对局。存在本机；若服务器在线也会同步一份（重启服务器会清空远端）。</p>
      <div className="holo-panel" style={{ padding: '1.25rem' }}>
        {!items.length && <p style={{ color: 'var(--muted)' }}>还没有记录。下完一盘会自动出现在这里。</p>}
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
