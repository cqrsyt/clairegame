import { apiBase } from './socket'

const NAME_KEY = 'aether-name'

export function getNickname() {
  return localStorage.getItem(NAME_KEY) || '旅人'
}
export function setNickname(n: string) {
  localStorage.setItem(NAME_KEY, n.trim() || '旅人')
}

export type GhUser = { login: string; avatar: string } | null

export async function fetchMe(): Promise<{ user: GhUser; oauth: boolean }> {
  try {
    const r = await fetch(`${apiBase()}/api/me`, { credentials: 'include' })
    return await r.json()
  } catch {
    return { user: null, oauth: false }
  }
}

export async function fetchAuthConfig(): Promise<boolean> {
  try {
    const r = await fetch(`${apiBase()}/api/auth/config`)
    const j = await r.json()
    return !!j.enabled
  } catch {
    return false
  }
}

export function githubLoginUrl() {
  const next = encodeURIComponent(window.location.href.split('#')[0])
  return `${apiBase()}/auth/github?next=${next}`
}

const HIST_KEY = 'aether-history'
export type HistItem = { gameId: string; result: string; at: number; nick: string }

export function recordLocalHistory(gameId: string, result: string) {
  const item: HistItem = { gameId, result, at: Date.now(), nick: getNickname() }
  const list = getLocalHistory()
  list.unshift(item)
  localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, 30)))
  return list
}
export function getLocalHistory(): HistItem[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]') } catch { return [] }
}

export async function postHistory(gameId: string, result: string) {
  const nick = getNickname()
  recordLocalHistory(gameId, result)
  try {
    await fetch(`${apiBase()}/api/history`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, gameId, result }),
    })
  } catch { /* offline local still ok */ }
}

export async function getHistory(nick?: string) {
  try {
    const r = await fetch(`${apiBase()}/api/history?nick=${encodeURIComponent(nick || getNickname())}`, { credentials: 'include' })
    const j = await r.json()
    const remote = (j.items || []) as HistItem[]
    const local = getLocalHistory()
    const merged = [...local]
    for (const it of remote) {
      if (!merged.some((x) => x.at === it.at && x.result === it.result)) merged.push(it)
    }
    merged.sort((a, b) => b.at - a.at)
    return merged.slice(0, 30)
  } catch {
    return getLocalHistory()
  }
}

const STAR_KEY = 'aether-stars'
export function getStars(): { nicks: string[]; rooms: string[] } {
  try { return JSON.parse(localStorage.getItem(STAR_KEY) || '{"nicks":[],"rooms":[]}') } catch { return { nicks: [], rooms: [] } }
}
export function toggleStarNick(nick: string) {
  const s = getStars()
  s.nicks = s.nicks.includes(nick) ? s.nicks.filter((x) => x !== nick) : [...s.nicks, nick]
  localStorage.setItem(STAR_KEY, JSON.stringify(s))
  return s
}
export function toggleStarRoom(code: string) {
  const s = getStars()
  s.rooms = s.rooms.includes(code) ? s.rooms.filter((x) => x !== code) : [...s.rooms, code]
  localStorage.setItem(STAR_KEY, JSON.stringify(s))
  return s
}
