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

function isHonor(t: Tile) {
  return ['E', 'S', 'W', 'N', 'R', 'G', 'Wht'].includes(t);
}

function discardScore(hand: Tile[], tile: Tile, meldCount: number): number {
  // lower = better to throw
  const rest = hand.slice();
  const i = rest.indexOf(tile);
  if (i >= 0) rest.splice(i, 1);
  const counts: Record<string, number> = {};
  for (const x of rest) counts[x] = (counts[x] || 0) + 1;
  let sc = 0;
  const n = counts[tile] || 0;
  if (n >= 2) sc += 80;
  if (n === 1) sc += 40;
  if (isHonor(tile) && n === 0) sc -= 30;
  if (/^[1-9][mps]$/.test(tile)) {
    const num = parseInt(tile[0], 10);
    const s = tile[1];
    const has = (k: number) => rest.includes(`${k}${s}`);
    if (num <= 8 && has(num + 1)) sc += 25;
    if (num >= 2 && has(num - 1)) sc += 25;
    if (num <= 7 && has(num + 2)) sc += 12;
    if (num >= 3 && has(num - 2)) sc += 12;
    if (num === 1 || num === 9) sc -= 8;
  }
  // 听牌形状：丢这张后若接近和牌则扣分少（更该留）
  if (canHu(rest, meldCount)) sc += 200;
  return sc;
}

export function mahjongBotStep(state: MahjongState): MahjongState {
  if (state.phase === 'ended') return state;
  if (state.phase === 'discard') {
    const p = state.players[state.turn];
    if (!p.isBot) return state;
    if (canHu(p.hand, p.melds.length)) return selfHu(state, state.turn);
    let best = p.hand[0];
    let bestSc = Infinity;
    const seen = new Set<Tile>();
    for (const tile of p.hand) {
      if (seen.has(tile)) continue;
      seen.add(tile);
      const sc = discardScore(p.hand, tile, p.melds.length);
      if (sc < bestSc) { bestSc = sc; best = tile; }
    }
    return discardTile(state, state.turn, best);
  }
  if (state.phase === 'react' && state.lastDiscard) {
    for (let i = 0; i < 4; i++) {
      if (i === state.lastDiscard.from) continue;
      const p = state.players[i];
      if (!p.isBot) continue;
      if (canHu([...p.hand, state.lastDiscard.tile], p.melds.length)) return claimHu(state, i);
      if (canPong(p.hand, state.lastDiscard.tile)) return claimPong(state, i);
    }
    const next = (state.lastDiscard.from + 1) % 4;
    const np = state.players[next];
    if (np.isBot) {
      const opts = canChi(np.hand, state.lastDiscard.tile);
      if (opts.length) {
        // 吃掉能成顺且不拆刻子的
        const safe = opts.find((need) => need.every((t) => np.hand.filter((x) => x === t).length < 3));
        return claimChi(state, next, safe || opts[0]);
      }
    }
    return passReact(state);
  }
  return state;
}

const WAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function mahjongTileName(tile: Tile) {
  if (/^[1-9]m$/.test(tile)) return WAN[Number(tile[0])] + '万';
  if (/^[1-9]p$/.test(tile)) return WAN[Number(tile[0])] + '筒';
  if (/^[1-9]s$/.test(tile)) return WAN[Number(tile[0])] + '条';
  const z: Record<string, string> = { E: '东', S: '南', W: '西', N: '北', R: '红中', G: '发财', Wht: '白板' };
  return z[tile] || tile;
}

export type MahjongAdvice =
  | { action: 'selfHu' }
  | { action: 'hu' }
  | { action: 'pong' }
  | { action: 'chi'; need: Tile[] }
  | { action: 'discard'; tile: Tile }
  | { action: 'pass' }
  | { action: 'wait' };

function bestDiscard(p: MahjongPlayer): Tile {
  let best = p.hand[0];
  let bestSc = Infinity;
  const seen = new Set<Tile>();
  for (const tile of p.hand) {
    if (seen.has(tile)) continue;
    seen.add(tile);
    const sc = discardScore(p.hand, tile, p.melds.length);
    if (sc < bestSc) { bestSc = sc; best = tile; }
  }
  return best;
}

export function mahjongSuggest(state: MahjongState, i = 0): MahjongAdvice | null {
  if (state.phase === 'ended') return null;
  const p = state.players[i];
  if (state.phase === 'discard' && state.turn === i) {
    if (canHu(p.hand, p.melds.length)) return { action: 'selfHu' };
    return { action: 'discard', tile: bestDiscard(p) };
  }
  if (state.phase === 'react' && state.lastDiscard && state.lastDiscard.from !== i) {
    const last = state.lastDiscard.tile;
    if (canHu([...p.hand, last], p.melds.length)) return { action: 'hu' };
    if (canPong(p.hand, last)) return { action: 'pong' };
    const next = (state.lastDiscard.from + 1) % 4;
    if (next === i) {
      const opts = canChi(p.hand, last);
      if (opts.length) {
        const safe = opts.find((need) => need.every((t) => p.hand.filter((x) => x === t).length < 3));
        return { action: 'chi', need: safe || opts[0] };
      }
    }
    return { action: 'pass' };
  }
  return { action: 'wait' };
}

export const mahjongCoach = {
  suggestMove(state: MahjongState, player = 0) { return mahjongSuggest(state, player); },
  explain(state: MahjongState, suggested?: MahjongAdvice | null) {
    if (state.phase === 'ended' && state.winner !== null) {
      return state.winner === 0 ? '这一圈你胡了。可以再开一局练手。' : `${state.players[state.winner].name} 先胡。下一圈再追。`;
    }
    const m = suggested === undefined ? mahjongSuggest(state, 0) : suggested;
    if (!m || m.action === 'wait') {
      const p = state.players[state.turn];
      return `${p.name} 正在思考。电脑每步会停一下，方便你看清牌面。`;
    }
    if (m.action === 'selfHu') return '手牌已经能和。建议点「自摸胡」。';
    if (m.action === 'hu') return `桌上这张「${mahjongTileName(state.lastDiscard!.tile)}」正好能点炮。建议胡。`;
    if (m.action === 'pong') return `手里已有两张「${mahjongTileName(state.lastDiscard!.tile)}」。建议碰下成刻子。`;
    if (m.action === 'chi') return `建议吃，用「${m.need.map(mahjongTileName).join('、')}」配成顺子。`;
    if (m.action === 'pass') return `这张「${mahjongTileName(state.lastDiscard!.tile)}」与你无关，建议过。`;
    const nm = mahjongTileName(m.tile);
    const honor = ['E', 'S', 'W', 'N', 'R', 'G', 'Wht'].includes(m.tile);
    const why = honor ? '单张字牌很难组成面子。' : '留能成顺、成刻的牌。';
    return `轮到你打牌。建议打出「${nm}」。${why}`;
  },
  legalHighlights() { return []; },
};

