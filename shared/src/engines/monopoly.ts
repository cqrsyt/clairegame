/** 星域棋庭：约 40 格方环。掷骰、购地、收租、机会/税/星轨；完整房屋可增强。 */
export interface MonoPlayer {
  id: string;
  name: string;
  isBot: boolean;
  cash: number;
  pos: number;
  bankrupt: boolean;
  inJail: boolean;
  jailWait: number;
}
export type MonoKind = 'prop' | 'start' | 'tax' | 'park' | 'jail' | 'gotojail' | 'chance' | 'rail' | 'util';
export interface MonoTile {
  name: string;
  price: number;
  rent: number;
  owner: number | null;
  kind: MonoKind;
  group?: string;
  hue?: string;
}
export interface MonoState {
  players: MonoPlayer[];
  tiles: MonoTile[];
  turn: number;
  dice: number | null;
  winner: number | null;
  log: string[];
}

type Spec = {
  name: string;
  kind: MonoKind;
  price?: number;
  rent?: number;
  group?: string;
  hue?: string;
};

const H = {
  deng: '#8a4a28',
  xing: '#6ec8e6',
  mu: '#d478a8',
  xia: '#e88840',
  chi: '#c43c3c',
  jin: '#e8c44a',
  cui: '#3a9a58',
  xuan: '#3a4a9a',
  rail: '#c4b8a0',
  util: '#7a8a9a',
};

/** 40 格：四角 起点/监狱/免费停车/去坐牢，八段色组，机会·税·星轨。 */
const SPECS: Spec[] = [
  { name: '起点', kind: 'start' },
  { name: '灯港·埠', kind: 'prop', price: 60, rent: 20, group: '灯港', hue: H.deng },
  { name: '机会', kind: 'chance' },
  { name: '灯港·湾', kind: 'prop', price: 80, rent: 28, group: '灯港', hue: H.deng },
  { name: '所得税', kind: 'tax', rent: 200 },
  { name: '星轨·南站', kind: 'rail', price: 200, rent: 25, group: '星轨', hue: H.rail },
  { name: '星轨·廊', kind: 'prop', price: 100, rent: 32, group: '星轨', hue: H.xing },
  { name: '命运', kind: 'chance' },
  { name: '星轨·台', kind: 'prop', price: 100, rent: 32, group: '星轨', hue: H.xing },
  { name: '星轨·闸', kind: 'prop', price: 120, rent: 40, group: '星轨', hue: H.xing },
  { name: '监狱', kind: 'jail' },
  { name: '暮城·巷', kind: 'prop', price: 140, rent: 48, group: '暮城', hue: H.mu },
  { name: '能源网', kind: 'util', price: 150, rent: 40, group: '公用', hue: H.util },
  { name: '暮城·楼', kind: 'prop', price: 140, rent: 48, group: '暮城', hue: H.mu },
  { name: '暮城·阙', kind: 'prop', price: 160, rent: 56, group: '暮城', hue: H.mu },
  { name: '星轨·西站', kind: 'rail', price: 200, rent: 25, group: '星轨', hue: H.rail },
  { name: '霞市·坊', kind: 'prop', price: 180, rent: 64, group: '霞市', hue: H.xia },
  { name: '机会', kind: 'chance' },
  { name: '霞市·肆', kind: 'prop', price: 180, rent: 64, group: '霞市', hue: H.xia },
  { name: '霞市·阁', kind: 'prop', price: 200, rent: 72, group: '霞市', hue: H.xia },
  { name: '免费停车', kind: 'park' },
  { name: '赤环·街', kind: 'prop', price: 220, rent: 80, group: '赤环', hue: H.chi },
  { name: '命运', kind: 'chance' },
  { name: '赤环·津', kind: 'prop', price: 220, rent: 80, group: '赤环', hue: H.chi },
  { name: '赤环·阙', kind: 'prop', price: 240, rent: 90, group: '赤环', hue: H.chi },
  { name: '星轨·北站', kind: 'rail', price: 200, rent: 25, group: '星轨', hue: H.rail },
  { name: '金阙·廊', kind: 'prop', price: 260, rent: 96, group: '金阙', hue: H.jin },
  { name: '金阙·殿', kind: 'prop', price: 260, rent: 96, group: '金阙', hue: H.jin },
  { name: '水网', kind: 'util', price: 150, rent: 40, group: '公用', hue: H.util },
  { name: '金阙·冕', kind: 'prop', price: 280, rent: 108, group: '金阙', hue: H.jin },
  { name: '去坐牢', kind: 'gotojail' },
  { name: '翠穹·庭', kind: 'prop', price: 300, rent: 116, group: '翠穹', hue: H.cui },
  { name: '翠穹·苑', kind: 'prop', price: 300, rent: 116, group: '翠穹', hue: H.cui },
  { name: '机会', kind: 'chance' },
  { name: '翠穹·阙', kind: 'prop', price: 320, rent: 128, group: '翠穹', hue: H.cui },
  { name: '星轨·东站', kind: 'rail', price: 200, rent: 25, group: '星轨', hue: H.rail },
  { name: '奢侈税', kind: 'tax', rent: 100 },
  { name: '玄极·门', kind: 'prop', price: 350, rent: 140, group: '玄极', hue: H.xuan },
  { name: '命运', kind: 'chance' },
  { name: '玄极·宫', kind: 'prop', price: 400, rent: 180, group: '玄极', hue: H.xuan },
];

export const MONO_SPACE_COUNT = SPECS.length;
const JAIL = SPECS.findIndex((s) => s.kind === 'jail');

function makeTiles(): MonoTile[] {
  return SPECS.map((s) => ({
    name: s.name,
    price: s.price ?? 0,
    rent: s.rent ?? 0,
    owner: null,
    kind: s.kind,
    group: s.group,
    hue: s.hue,
  }));
}

export function createMonopoly(): MonoState {
  const players: MonoPlayer[] = [
    { id: 'you', name: '你', isBot: false, cash: 1500, pos: 0, bankrupt: false, inJail: false, jailWait: 0 },
    { id: 'b1', name: '旅伴甲', isBot: true, cash: 1500, pos: 0, bankrupt: false, inJail: false, jailWait: 0 },
    { id: 'b2', name: '旅伴乙', isBot: true, cash: 1500, pos: 0, bankrupt: false, inJail: false, jailWait: 0 },
  ];
  return {
    players,
    tiles: makeTiles(),
    turn: 0,
    dice: null,
    winner: null,
    log: ['星域棋庭开盘。每人 1500。路过起点 +200。买下地产与星轨，可向停靠者收租。'],
  };
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

function ownsGroup(tiles: MonoTile[], owner: number, group: string | undefined) {
  if (!group) return false;
  const g = tiles.filter((t) => t.group === group && t.kind === 'prop');
  return g.length > 0 && g.every((t) => t.owner === owner);
}

function countOwned(tiles: MonoTile[], owner: number, kind: MonoKind) {
  return tiles.filter((t) => t.kind === kind && t.owner === owner).length;
}

function dueRent(s: MonoState, tile: MonoTile, owner: number, dice: number) {
  if (tile.kind === 'rail') {
    const n = countOwned(s.tiles, owner, 'rail');
    return [25, 50, 100, 200][Math.max(0, n - 1)] ?? 200;
  }
  if (tile.kind === 'util') {
    const n = countOwned(s.tiles, owner, 'util');
    return dice * (n >= 2 ? 10 : 4);
  }
  if (tile.kind === 'prop') {
    return ownsGroup(s.tiles, owner, tile.group) ? tile.rent * 2 : tile.rent;
  }
  return tile.rent;
}

function bankrupt(me: MonoPlayer, tiles: MonoTile[], turn: number, log: string[]) {
  me.bankrupt = true;
  me.cash = 0;
  me.inJail = false;
  const next = tiles.map((t) => t.owner === turn ? { ...t, owner: null } : t);
  log.unshift(`${me.name} 破产，地产回流。`);
  return next;
}

function payCash(me: MonoPlayer, amount: number, tiles: MonoTile[], turn: number, log: string[], reason: string) {
  me.cash -= amount;
  log.unshift(reason);
  if (me.cash < 0) return bankrupt(me, tiles, turn, log);
  return tiles;
}

const CHANCE = [
  { text: '星港补给到账 +150', cash: 150 },
  { text: '灯港夜市分红 +80', cash: 80 },
  { text: '缴纳星尘税 −75', cash: -75 },
  { text: '轨道检修 −100', cash: -100 },
  { text: '跃迁回起点，领薪 200', go: 0, passGo: true },
  { text: '紧急押送监狱', jail: true },
  { text: '暮城巡游，前往暮城·阙', go: 14 },
  { text: '免费停靠补给 +50', cash: 50 },
];

function applyChance(s: MonoState, players: MonoPlayer[], me: MonoPlayer, tiles: MonoTile[], log: string[], dice: number) {
  const card = CHANCE[Math.floor(Math.random() * CHANCE.length)];
  log.unshift(`${me.name} 抽到机会：「${card.text}」。`);
  let curTiles = tiles;
  if (card.cash) {
    if (card.cash > 0) {
      me.cash += card.cash;
    } else {
      curTiles = payCash(me, -card.cash, curTiles, s.turn, log, `${me.name} ${card.text}。`);
    }
  }
  if (card.jail) {
    me.pos = JAIL;
    me.inJail = true;
    me.jailWait = 0;
    log.unshift(`${me.name} 被送进监狱。`);
    return curTiles;
  }
  if (card.go != null) {
    const prev = me.pos;
    me.pos = card.go;
    if (card.passGo || me.pos < prev) {
      me.cash += 200;
      log.unshift(`${me.name} 路过起点，+200。`);
    }
    const landed = curTiles[me.pos];
    curTiles = resolveLand({ ...s, tiles: curTiles, players, dice }, players, me, curTiles, log, dice, landed, true);
  }
  return curTiles;
}

function resolveLand(
  s: MonoState,
  players: MonoPlayer[],
  me: MonoPlayer,
  tiles: MonoTile[],
  log: string[],
  dice: number,
  tile: MonoTile,
  fromChance: boolean,
): MonoTile[] {
  if (tile.kind === 'tax') {
    return payCash(me, tile.rent, tiles, s.turn, log, `${me.name} 缴税 ${tile.rent}。`);
  }
  if (tile.kind === 'gotojail') {
    me.pos = JAIL;
    me.inJail = true;
    me.jailWait = 0;
    log.unshift(`${me.name} 被押去坐牢。`);
    return tiles;
  }
  if (tile.kind === 'chance' && !fromChance) {
    return applyChance(s, players, me, tiles, log, dice);
  }
  const buyable = tile.kind === 'prop' || tile.kind === 'rail' || tile.kind === 'util';
  if (buyable && tile.owner !== null && tile.owner !== s.turn && !players[tile.owner].bankrupt) {
    const rent = dueRent({ ...s, tiles }, tile, tile.owner, dice);
    players[tile.owner].cash += rent;
    return payCash(me, rent, tiles, s.turn, log, `${me.name} 付给 ${players[tile.owner].name} 租金 ${rent}。`);
  }
  return tiles;
}

export function monoRoll(s: MonoState): MonoState {
  if (s.winner !== null || s.dice !== null) return s;
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const n = d1 + d2;
  const players = s.players.map((p) => ({ ...p }));
  const me = players[s.turn];
  if (me.bankrupt) return { ...s, turn: nextTurn(s) };
  const log = [`${me.name} 掷出 ${d1}+${d2}=${n}。`, ...s.log];
  let tiles = s.tiles;

  if (me.inJail) {
    if (d1 === d2) {
      me.inJail = false;
      me.jailWait = 0;
      log.unshift(`${me.name} 掷出对子，离开监狱。`);
    } else if (me.jailWait >= 1) {
      me.inJail = false;
      me.jailWait = 0;
      tiles = payCash(me, 50, tiles, s.turn, log, `${me.name} 交保释金 50，离开监狱。`);
      if (me.bankrupt) return settle({ ...s, players, tiles, dice: n, log: log.slice(0, 40) });
    } else {
      me.jailWait += 1;
      log.unshift(`${me.name} 仍在监狱中，下回合可交保或再掷。`);
      return settle({ ...s, players, tiles, dice: n, log: log.slice(0, 40) });
    }
  }

  const prev = me.pos;
  me.pos = (me.pos + n) % s.tiles.length;
  log.unshift(`${me.name} 来到「${s.tiles[me.pos].name}」。`);
  if (me.pos < prev) {
    me.cash += 200;
    log.unshift(`${me.name} 路过起点，+200。`);
  }
  tiles = resolveLand({ ...s, players, tiles, dice: n }, players, me, tiles, log, n, tiles[me.pos], false);
  return settle({ ...s, players, tiles, dice: n, log: log.slice(0, 40) });
}

function nextTurn(s: MonoState) {
  let t = (s.turn + 1) % s.players.length;
  for (let i = 0; i < 8 && s.players[t].bankrupt; i++) t = (t + 1) % s.players.length;
  return t;
}

function isBuyable(tile: MonoTile) {
  return (tile.kind === 'prop' || tile.kind === 'rail' || tile.kind === 'util') && tile.owner === null;
}

export function monoBuy(s: MonoState): MonoState {
  if (s.winner !== null || s.dice === null) return s;
  const tile = s.tiles[s.players[s.turn].pos];
  if (!isBuyable(tile)) return s;
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

function shouldBuy(cash: number, tile: MonoTile) {
  if (!isBuyable(tile)) return false;
  if (cash < tile.price + 220) return false;
  const roi = tile.rent / Math.max(1, tile.price);
  return roi >= 0.22 || tile.price <= 140 || tile.kind === 'rail' || cash >= tile.price + 400;
}

export function monoBot(s: MonoState): MonoState {
  const p = s.players[s.turn];
  if (!p.isBot || s.winner !== null) return s;
  let cur = s;
  if (cur.dice === null) cur = monoRoll(cur);
  if (cur.winner !== null) return cur;
  const me = cur.players[cur.turn];
  const tile = cur.tiles[me.pos];
  if (shouldBuy(me.cash, tile)) cur = monoBuy(cur);
  return monoEndTurn(cur);
}

export const monopolyCoach = {
  suggestMove(state: MonoState): 'roll' | 'buy' | 'end' {
    if (state.dice === null) return 'roll';
    const me = state.players[state.turn];
    const t = state.tiles[me.pos];
    if (shouldBuy(me.cash, t)) return 'buy';
    return 'end';
  },
  explain(state: MonoState, suggested?: 'roll' | 'buy' | 'end' | null) {
    if (state.winner !== null) return `${state.players[state.winner].name} 成为最后还有现金的人。`;
    const p = state.players[state.turn];
    const t = state.tiles[p.pos];
    const act = suggested ?? monopolyCoach.suggestMove(state);
    if (act === 'roll' || state.dice === null) {
      if (p.inJail) return `${p.name} 在监狱。掷出对子可立刻离开，否则第二回合交 50 保释。现金 ${p.cash}。`;
      return `${p.name} 请掷骰。手头现金 ${p.cash}。路过起点会再领 200。`;
    }
    if (isBuyable(t)) {
      if (act === 'buy') return `建议买下「${t.name}」（${t.price}，租金 ${t.rent}）。同色地产收齐租金加倍。`;
      return `「${t.name}」可以买，但现金只剩 ${p.cash}，建议先结束回合。`;
    }
    if ((t.kind === 'prop' || t.kind === 'rail' || t.kind === 'util') && t.owner === state.turn) return '这是您的产业。建议结束回合。';
    if (t.kind === 'jail') return p.inJail ? '您在狱中。建议结束回合。' : '只是路过监狱。建议结束回合。';
    return '这一格不用买。建议结束回合，把骰子交给下一位。';
  },
  legalHighlights() { return []; },
};

/** 11×11 方环：起点在右下，逆时针沿底边向左。 */
export function monoGridPos(i: number): { row: number; col: number } {
  if (i >= 0 && i <= 10) return { row: 11, col: 11 - i };
  if (i <= 20) return { row: 11 - (i - 10), col: 1 };
  if (i <= 30) return { row: 1, col: 1 + (i - 20) };
  return { row: 1 + (i - 30), col: 11 };
}
