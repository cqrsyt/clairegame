type Kind = 'move' | 'capture' | 'win' | 'night'

let muted = typeof localStorage !== 'undefined' && localStorage.getItem('aether-mute') === '1'
const listeners = new Set<() => void>()
let ctx: AudioContext | null = null

function ac() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function isMuted() { return muted }
export function subscribeMute(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function setMuted(v: boolean) {
  muted = v
  localStorage.setItem('aether-mute', v ? '1' : '0')
  listeners.forEach((f) => f())
}
export function toggleMute() { setMuted(!muted) }

export function playSfx(kind: Kind) {
  if (muted) return
  try {
    const c = ac()
    const t0 = c.currentTime
    if (kind === 'night') {
      const buf = c.createBuffer(1, c.sampleRate * 0.35, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.18
      const src = c.createBufferSource()
      src.buffer = buf
      const g = c.createGain()
      g.gain.value = 0.22
      src.connect(g).connect(c.destination)
      src.start()
      return
    }
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g).connect(c.destination)
    g.gain.setValueAtTime(0.08, t0)
    if (kind === 'move') {
      o.frequency.setValueAtTime(520, t0)
      o.frequency.exponentialRampToValueAtTime(340, t0 + 0.08)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12)
      o.start(t0); o.stop(t0 + 0.13)
    } else if (kind === 'capture') {
      o.type = 'square'
      o.frequency.setValueAtTime(220, t0)
      o.frequency.exponentialRampToValueAtTime(90, t0 + 0.16)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18)
      o.start(t0); o.stop(t0 + 0.19)
    } else {
      o.type = 'triangle'
      o.frequency.setValueAtTime(523, t0)
      o.frequency.setValueAtTime(659, t0 + 0.12)
      o.frequency.setValueAtTime(784, t0 + 0.24)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45)
      o.start(t0); o.stop(t0 + 0.46)
    }
  } catch { /* autoplay / unsupported */ }
}
