import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const HOST_WAKE_HINT = '棋庭主机刚睡醒，请稍候再进房'

export function socketUrl() {
  const u = import.meta.env.VITE_SOCKET_URL as string | undefined
  return u && u.length ? u : '/'
}

export function apiBase() {
  const u = (import.meta.env.VITE_SOCKET_URL as string | undefined) || ''
  if (!u || u === '/') return ''
  return u.replace(/\/$/, '')
}

export async function checkHostHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/api/health`, { cache: 'no-store' })
    if (!res.ok) return false
    const j = await res.json() as { ok?: boolean }
    return !!j.ok
  } catch {
    return false
  }
}

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1200,
    })
  }
  return socket
}

/** Probe health and reconnect a couple of times. Returns true if socket is up. */
export async function wakeHost(onHint?: (msg: string) => void): Promise<boolean> {
  const s = getSocket()
  for (let i = 0; i < 3; i++) {
    const ok = await checkHostHealth()
    if (ok) {
      if (!s.connected) s.connect()
      if (s.connected) return true
    } else {
      onHint?.(HOST_WAKE_HINT)
    }
    if (!s.connected) s.connect()
    await new Promise((r) => setTimeout(r, 900))
    if (s.connected) return true
  }
  if (!s.connected) onHint?.(HOST_WAKE_HINT)
  return s.connected
}
