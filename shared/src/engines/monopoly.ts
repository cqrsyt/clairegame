/** 环形地产子集：掷骰、购地、收租。完整机会卡/房屋可增强。 */
export interface MonoPlayer { id: string; name: string; isBot: boolean; cash: number; pos: number; bankrupt: boolean; }
export interface MonoTile { name: string; price: number; rent: number; owner: number | null; kind: 'prop' | 'start' | 'tax' | 'park'; }
export interface MonoState {
  players: MonoPlayer[];
  tiles: MonoTile[];
  turn: number;
  dice: number | null;
  winner: number | null;
  log: string[];
}

const NAMES = ['起点','月港','日冕街','税站','织女坊','河鼓','休憩','天市','天津','税站','箕宿','斗宿','休憩','牛宿','女宿','虚宿'];

export function createMonopoly(): MonoState {
  const tiles: MonoTile[] = NAMES.map((name, i) => {
    if (i === 0) return { name, price: 0, rent: 0, owner: null, kind: 'start' };
    if (i === 3 || i === 9) return { name, price: 0, rent: 0, owner: null, kind: 'tax' };
    if (i === 6 || i === 12) return { name, price: 0, rent: 0, owner: null, kind: 'park' };
    return { name, price: 60 + i * 12, rent: 18 + i * 4, owner: null, kind: 'prop' };
  });
  const players: MonoPlayer[] = [
    { id: 'you', name: '你', isBot: false, cash: 1500, pos: 0, bankrupt: false },
    { id: 'b1', name: '旅伴甲', isBot: true, cash: 1500, pos: 0, bankrupt: false },
    { id: 'b2', name: '旅伴乙', isBot: true, cash: 1500, pos: 0, bankrupt: false },
  ];
  return { players, tiles, turn: 0, dice: null, winner: null, log: ['每人 1500。路过起点 +200。买下地产可向停靠者收租。'] };
}

function alive(s: MonoState) { return s.players.filter((p) => !p.bankrupt); }

function settle(s: MonoState): MonoState {
  const a = alive(s);
  if (a.length === 1) {
    const winner = s.players.findIndex((p) => p.id === a[0].id);
    return { ...s, winner, log: [`${a[0].name} 成为最后持有现金的人。`, ...s.log] };
  }
  return s;
}

export function monoRoll(s: MonoState): MonoState {
  if (s.winner !== null || s.dice !== null) return s;
  const n = 1 + Math.floor(Math.random() * 6) + (1 + Math.floor(Math.random() * 6));
  const players = s.players.map((p) => ({ ...p }));
  const me = players[s.turn];
  if (me.bankrupt) return { ...s, turn: nextTurn(s) };
  const prev = me.pos;
  me.pos = (me.pos + n) % s.tiles.length;
  const log = [`${me.name} 掷出 ${n}，来到「${s.tiles[me.pos].name}」。`, ...s.log];
  if (me.pos < prev) { me.cash += 200; log.unshift(`${me.name} 路过起点，+200。`); }
  const tile = s.tiles[me.pos];
  if (tile.kind === 'tax') {
    me.cash -= 80;
    log.unshift(`${me.name} 缴税 80。`);
    if (me.cash < 0) { me.bankrupt = true; me.cash = 0; log.unshift(`${me.name} 破产。`); }
  }
  let tiles = s.tiles;
  if (tile.kind === 'prop' && tile.owner !== null && tile.owner !== s.turn && !players[tile.owner].bankrupt) {
    const rent = tile.rent;
    me.cash -= rent;
    players[tile.owner].cash += rent;
    log.unshift(`${me.name} 付给 ${players[tile.owner].name} 租金 ${rent}。`);
    if (me.cash < 0) {
      me.bankrupt = true;
      me.cash = 0;
      tiles = s.tiles.map((t) => t.owner === s.turn ? { ...t, owner: null } : t);
      log.unshift(`${me.name} 破产，地产回流。`);
    }
  }
  return settle({ ...s, players, tiles, dice: n, log: log.slice(0, 30) });
}

function nextTurn(s: MonoState) {
  let t = (s.turn + 1) % s.players.length;
  for (let i = 0; i < 8 && s.players[t].bankrupt; i++) t = (t + 1) % s.players.length;
  return t;
}

export function monoBuy(s: MonoState): MonoState {
  if (s.winner !== null || s.dice === null) return s;
  const tile = s.tiles[s.players[s.turn].pos];
  if (tile.kind !== 'prop' || tile.owner !== null) return s;
  const players = s.players.map((p) => ({ ...p }));
  const me = players[s.turn];
  if (me.cash < tile.price) return s;
  me.cash -= tile.price;
  const tiles = s.tiles.map((t, i) => i === me.pos ? { ...t, owner: s.turn } : t);
  return { ...s, players, tiles, log: [`${me.name} 买下「${tile.name}」（${tile.price}）。`, ...s.log] };
}

export function monoEndTurn(s: MonoState): MonoState {
  if (s.winner !== null || s.dice === null) return s;
  return { ...s, dice: null, turn: nextTurn(s) };
}

export function monoBot(s: MonoState): MonoState {
  const p = s.players[s.turn];
  if (!p.isBot || s.winner !== null) return s;
  let cur = s;
  if (cur.dice === null) cur = monoRoll(cur);
  const tile = cur.tiles[cur.players[cur.turn].pos];
  if (tile.kind === 'prop' && tile.owner === null && cur.players[cur.turn].cash >= tile.price + 80) {
    cur = monoBuy(cur);
  }
  return monoEndTurn(cur);
}

export const monopolyCoach = {
  suggestMove(state: MonoState) {
    const t = state.tiles[state.players[0].pos];
    if (t.kind === 'prop' && t.owner === null) return 'buy';
    return 'end';
  },
  explain(state: MonoState) {
    if (state.winner !== null) return `${state.players[state.winner].name} 获胜。`;
    const p = state.players[state.turn];
    const t = state.tiles[p.pos];
    if (state.dice === null) return `${p.name} 请掷骰。现金 ${p.cash}。`;
    if (t.kind === 'prop' && t.owner === null) return `可以买下「${t.name}」，价格 ${t.price}，租金 ${t.rent}。钱不够就结束回合。`;
    return '这格不必购买。结束回合，把骰子交给下一位。';
  },
  legalHighlights() { return []; },
};
