import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function socketUrl() {
  const u = import.meta.env.VITE_SOCKET_URL as string | undefined
  return u && u.length ? u : '/'
}

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || '/', { autoConnect: true })
  }
  return socket
}

export function apiBase() {
  const u = (import.meta.env.VITE_SOCKET_URL as string | undefined) || ''
  if (!u || u === '/') return ''
  return u.replace(/\/$/, '')
}
