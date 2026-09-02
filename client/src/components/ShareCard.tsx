import { useEffect, useRef, useState } from 'react'
import { postHistory } from '../lib/account'
import { playSfx } from '../lib/sfx'

const SHARE = 'https://aether-table.com'

export default function ShareCard({
  gameId, title, result, room, open,
}: { gameId: string; title: string; result: string; room?: string; open: boolean }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) {
      setShow(true)
      playSfx('win')
      postHistory(gameId, result)
    }
  }, [open, gameId, result])

  useEffect(() => {
    if (!show) return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    c.width = 720
    c.height = 400
    const g = ctx.createLinearGradient(0, 0, 720, 400)
    g.addColorStop(0, '#04050a')
    g.addColorStop(1, '#12203a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 720, 400)
    ctx.strokeStyle = '#3dffff'
    ctx.lineWidth = 4
    ctx.strokeRect(16, 16, 688, 368)
    ctx.fillStyle = '#ffd24a'
    ctx.font = '28px "Noto Serif SC", serif'
    ctx.fillText('星域棋庭', 48, 80)
    ctx.fillStyle = '#fffaf0'
    ctx.font = '42px "Noto Serif SC", serif'
    ctx.fillText(title, 48, 150)
    ctx.fillStyle = '#3dffff'
    ctx.font = '32px "Noto Serif SC", serif'
    ctx.fillText(result, 48, 220)
    ctx.fillStyle = '#d2dcec'
    ctx.font = '18px sans-serif'
    ctx.fillText(SHARE, 48, 340)
  }, [show, title, result])

  if (!show) return null
  const path = `${SHARE}/play/${gameId}${room ? `?room=${room}` : ''}`
  const text = `星域棋庭 · ${title}\n${result}\n${path}`

  const download = () => {
    const c = canvasRef.current
    if (!c) return
    const a = document.createElement('a')
    a.download = `aether-${gameId}.png`
    a.href = c.toDataURL('image/png')
    a.click()
  }

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `星域棋庭 · ${title}`, text: result, url: path })
        return
      }
    } catch { /* fall through */ }
    try { await navigator.clipboard.writeText(text); setCopied('已复制链接') }
    catch { setCopied(path) }
  }

  return (
    <div className="modal-backdrop" onClick={() => setShow(false)}>
      <div className="holo-panel share-card" onClick={(e) => e.stopPropagation()}>
        <h2>这一局</h2>
        <p className="share-result">{result}</p>
        <canvas ref={canvasRef} className="share-preview" />
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{path}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={share}>分享</button>
          <button className="btn gold" onClick={download}>下载战报图</button>
          <button className="btn magenta" onClick={() => setShow(false)}>关闭</button>
        </div>
        {copied && <div className="coach">{copied}</div>}
      </div>
    </div>
  )
}
