import { useEffect, useState } from 'react'
import { postHistory } from '../lib/account'
import { playSfx } from '../lib/sfx'

const SHARE = 'https://cqrsyt.github.io/clairegame'

export default function ShareCard({
  gameId, title, result, room, open,
}: { gameId: string; title: string; result: string; room?: string; open: boolean }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (open) {
      setShow(true)
      playSfx('win')
      postHistory(gameId, result)
    }
  }, [open, gameId, result])

  if (!show) return null
  const path = `${SHARE}/play/${gameId}${room ? `?room=${room}` : ''}`
  const text = `星域棋庭 · ${title}\n${result}\n${path}`

  return (
    <div className="modal-backdrop" onClick={() => setShow(false)}>
      <div className="holo-panel share-card" onClick={(e) => e.stopPropagation()}>
        <h2>对局战报</h2>
        <p className="share-result">{result}</p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{path}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={async () => {
            try { await navigator.clipboard.writeText(text); setCopied('已复制链接') }
            catch { setCopied(path) }
          }}>复制分享链接</button>
          <button className="btn magenta" onClick={() => setShow(false)}>关闭</button>
        </div>
        {copied && <div className="coach">{copied}</div>}
      </div>
    </div>
  )
}
