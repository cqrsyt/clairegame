/** Simplified Mahjong — craks/bamboos/dots 1-9 + winds, 4 players, chi/pong/kong/hu */
export type Tile = string; // e.g. '1m','9p','5s','E','S','W','N','R','G','Wht'

export interface MahjongPlayer {
  id: string;
  name: string;
  hand: Tile[];
  melds: Tile[][];
  isBot: boolean;
  discarded: Tile[];
}

export interface MahjongState {
  players: MahjongPlayer[];
  wall: Tile[];
  turn: number;
  lastDiscard: { tile: Tile; from: number } | null;
  phase: 'draw' | 'discard' | 'react' | 'ended';
  winner: number | null;
  reactDeadlineFrom: number | null;
  log: string[];
}

const SUITS = ['m', 'p', 's'];
const WINDS = ['E', 'S', 'W', 'N'];
const DRAGONS = ['R', 'G', 'Wht'];

function buildWall(): Tile[] {
  const tiles: Tile[] = [];
  for (const s of SUITS)
    for (let n = 1; n <= 9; n++)
      for (let i = 0; i < 4; i++) tiles.push(`${n}${s}`);
  for (const w of WINDS) for (let i = 0; i < 4; i++) tiles.push(w);
  for (const d of DRAGONS) for (let i = 0; i < 4; i++) tiles.push(d);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

export function createMahjong(names: { id: string; name: string; isBot: boolean }[]): MahjongState {
  const roster = names.slice(0, 4);
  while (roster.length < 4) roster.push({ id: `mj${roster.length}`, name: `雀士${roster.length}`, isBot: true });
  const wall = buildWall();
  const players: MahjongPlayer[] = roster.map((p) => ({
    ...p,
    hand: [] as Tile[],
    melds: [],
    discarded: [],
  }));
  for (let r = 0; r < 13; r++)
    for (let i = 0; i < 4; i++) players[i].hand.push(wall.pop()!);
  // dealer draws 14th
  players[0].hand.push(wall.pop()!);
  players.forEach((p) => p.hand.sort());
  return {
    players,
    wall,
    turn: 0,
    lastDiscard: null,
    phase: 'discard',
    winner: null,
    reactDeadlineFrom: null,
    log: ['牌山已洗，开打！'],
  };
}

function removeTiles(hand: Tile[], tiles: Tile[]): Tile[] | null {
  const h = hand.slice();
  for (const t of tiles) {
    const i = h.indexOf(t);
    if (i < 0) return null;
    h.splice(i, 1);
  }
  return h;
}

/** Basic win: 4 melds + 1 pair (including existing melds) */
export function canHu(hand: Tile[], meldCount: number): boolean {
  const needMelds = 4 - meldCount;
  return canForm(hand.slice().sort(), needMelds, false);
}

function canForm(hand: Tile[], meldsNeeded: number, pairUsed: boolean): boolean {
  if (hand.length === 0) return meldsNeeded === 0 && pairUsed;
  if (meldsNeeded < 0) return false;
  const sorted = hand.slice().sort();
  const first = sorted[0];
  // pair
  if (!pairUsed) {
    if (sorted.filter((t) => t === first).length >= 2) {
      const next = removeTiles(sorted, [first, first])!;
      if (canForm(next, meldsNeeded, true)) return true;
    }
  }
  // pung
  if (sorted.filter((t) => t === first).length >= 3) {
    const next = removeTiles(sorted, [first, first, first])!;
    if (canForm(next, meldsNeeded - 1, pairUsed)) return true;
  }
  // chow
  if (/^[1-9][mps]$/.test(first)) {
    const n = parseInt(first[0], 10);
    const s = first[1];
    if (n <= 7) {
      const a = `${n}${s}`, b = `${n + 1}${s}`, c = `${n + 2}${s}`;
      if (sorted.includes(b) && sorted.includes(c)) {
        const next = removeTiles(sorted, [a, b, c]);
        if (next && canForm(next, meldsNeeded - 1, pairUsed)) return true;
      }
    }
  }
  return false;
}

export function canPong(hand: Tile[], tile: Tile) {
  return hand.filter((t) => t === tile).length >= 2;
}
export function canKong(hand: Tile[], tile: Tile) {
  return hand.filter((t) => t === tile).length >= 3;
}
export function canChi(hand: Tile[], tile: Tile): Tile[][] {
  if (!/^[1-9][mps]$/.test(tile)) return [];
  const n = parseInt(tile[0], 10);
  const s = tile[1];
  const opts: Tile[][] = [];
  const trySet = (nums: number[]) => {
    if (!nums.includes(n)) return;
    const tiles = nums.map((x) => `${x}${s}`);
    const need = tiles.filter((t) => t !== tile);
    if (need.every((t) => hand.includes(t))) opts.push(need);
  };
  if (n >= 1 && n <= 7) trySet([n, n + 1, n + 2]);
  if (n >= 2 && n <= 8) trySet([n - 1, n, n + 1]);
  if (n >= 3 && n <= 9) trySet([n - 2, n - 1, n]);
  return opts;
}

export function discardTile(state: MahjongState, playerIndex: number, tile: Tile): MahjongState {
  if (state.phase !== 'discard' || state.turn !== playerIndex) return state;
  const players = state.players.map((p) => ({ ...p, hand: p.hand.slice(), melds: p.melds.map((m) => m.slice()), discarded: p.discarded.slice() }));
  const hand = removeTiles(players[playerIndex].hand, [tile]);
  if (!hand) return state;
  players[playerIndex].hand = hand;
  players[playerIndex].discarded.push(tile);
  return {
    ...state,
    players,
    lastDiscard: { tile, from: playerIndex },
    phase: 'react',
    reactDeadlineFrom: playerIndex,
    log: [...state.log, `${players[playerIndex].name} 打出 ${tile}`],
  };
}

export function passReact(state: MahjongState): MahjongState {
  if (state.phase !== 'react') return state;
  const nextTurn = (state.lastDiscard!.from + 1) % 4;
  const players = state.players.map((p) => ({ ...p, hand: p.hand.slice() }));
  const wall = state.wall.slice();
  if (!wall.length) {
    return { ...state, phase: 'ended', winner: null, log: [...state.log, '流局'] };
  }
  players[nextTurn].hand.push(wall.pop()!);
  players[nextTurn].hand.sort();
  return {
    ...state,
    players,
    wall,
    turn: nextTurn,
    phase: 'discard',
    lastDiscard: null,
    reactDeadlineFrom: null,
  };
}

export function claimPong(state: MahjongState, playerIndex: number): MahjongState {
  if (state.phase !== 'react' || !state.lastDiscard) return state;
  const tile = state.lastDiscard.tile;
  const players = state.players.map((p) => ({ ...p, hand: p.hand.slice(), melds: p.melds.map((m) => m.slice()) }));
  if (!canPong(players[playerIndex].hand, tile)) return state;
  const hand = removeTiles(players[playerIndex].hand, [tile, tile])!;
  players[playerIndex].hand = hand;
  players[playerIndex].melds.push([tile, tile, tile]);
  return {
    ...state,
    players,
    turn: playerIndex,
    phase: 'discard',
    lastDiscard: null,
    log: [...state.log, `${players[playerIndex].name} 碰！`],
  };
}

export function claimChi(state: MahjongState, playerIndex: number, need: Tile[]): MahjongState {
  if (state.phase !== 'react' || !state.lastDiscard) return state;
  if ((state.lastDiscard.from + 1) % 4 !== playerIndex) return state;
  const tile = state.lastDiscard.tile;
  const players = state.players.map((p) => ({ ...p, hand: p.hand.slice(), melds: p.melds.map((m) => m.slice()) }));
  const hand = removeTiles(players[playerIndex].hand, need);
  if (!hand) return state;
  players[playerIndex].hand = hand;
  players[playerIndex].melds.push([...need, tile].sort());
  return {
    ...state,
    players,
    turn: playerIndex,
    phase: 'discard',
    lastDiscard: null,
    log: [...state.log, `${players[playerIndex].name} 吃！`],
  };
}

export function claimHu(state: MahjongState, playerIndex: number): MahjongState {
  if (!state.lastDiscard && state.phase !== 'discard') return state;
  const players = state.players;
  let hand = players[playerIndex].hand.slice();
  if (state.phase === 'react' && state.lastDiscard) hand = [...hand, state.lastDiscard.tile];
  if (!canHu(hand, players[playerIndex].melds.length)) return state;
  return {
    ...state,
    phase: 'ended',
    winner: playerIndex,
    log: [...state.log, `${players[playerIndex].name} 胡牌！`],
  };
}

export function selfHu(state: MahjongState, playerIndex: number): MahjongState {
  if (state.phase !== 'discard' || state.turn !== playerIndex) return state;
  if (!canHu(state.players[playerIndex].hand, state.players[playerIndex].melds.length)) return state;
  return {
    ...state,
    phase: 'ended',
    winner: playerIndex,
    log: [...state.log, `${state.players[playerIndex].name} 自摸！`],
  };
}

export function mahjongBotStep(state: MahjongState): MahjongState {
  if (state.phase === 'ended') return state;
  if (state.phase === 'discard') {
    const p = state.players[state.turn];
    if (!p.isBot) return state;
    if (canHu(p.hand, p.melds.length)) return selfHu(state, state.turn);
    // discard isolated honors first
    const hand = p.hand.slice();
    const counts: Record<string, number> = {};
    for (const t of hand) counts[t] = (counts[t] || 0) + 1;
    hand.sort((a, b) => (counts[a] - counts[b]) || a.localeCompare(b));
    return discardTile(state, state.turn, hand[0]);
  }
  if (state.phase === 'react' && state.lastDiscard) {
    // bots may pong/hu randomly
    for (let i = 0; i < 4; i++) {
      if (i === state.lastDiscard.from) continue;
      const p = state.players[i];
      if (!p.isBot) continue;
      if (canHu([...p.hand, state.lastDiscard.tile], p.melds.length) && Math.random() > 0.2) {
        return claimHu(state, i);
      }
      if (canPong(p.hand, state.lastDiscard.tile) && Math.random() > 0.5) {
        return claimPong(state, i);
      }
    }
    // chi for next player bot
    const next = (state.lastDiscard.from + 1) % 4;
    const np = state.players[next];
    if (np.isBot) {
      const opts = canChi(np.hand, state.lastDiscard.tile);
      if (opts.length && Math.random() > 0.6) return claimChi(state, next, opts[0]);
    }
    return passReact(state);
  }
  return state;
}
