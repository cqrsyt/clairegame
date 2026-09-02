export interface DDCard {
  id: string;
  rank: number; // 3-15 (2=15), 16 small joker, 17 big joker
  suit: string;
  label: string;
}

export interface DDPlayer {
  id: string;
  name: string;
  isBot: boolean;
  hand: DDCard[];
  role: 'landlord' | 'farmer';
}

export type ComboKind = 'pass' | 'solo' | 'pair' | 'triple' | 'triple1' | 'triple2' | 'straight' | 'bomb' | 'rocket';

export interface Combo {
  kind: ComboKind;
  rank: number;
  cards: DDCard[];
  len?: number;
}

export interface DDState {
  players: DDPlayer[];
  landlord: number;
  current: number;
  last: Combo | null;
  lastPlayer: number | null;
  passes: number;
  winner: number | null;
  phase: 'play' | 'ended';
  log: string[];
}

const SUITS = ['♠', '♥', '♣', '♦'];
const RANK_LABEL: Record<number, string> = {
  3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: '小王', 17: '大王',
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): DDCard[] {
  const cards: DDCard[] = [];
  let n = 0;
  for (const suit of SUITS) {
    for (let rank = 3; rank <= 15; rank++) {
      cards.push({ id: `d${n++}`, rank, suit, label: `${suit}${RANK_LABEL[rank]}` });
    }
  }
  cards.push({ id: `d${n++}`, rank: 16, suit: 'j', label: '小王' });
  cards.push({ id: `d${n++}`, rank: 17, suit: 'J', label: '大王' });
  return shuffle(cards);
}

function sortHand(h: DDCard[]) {
  return h.slice().sort((a, b) => a.rank - b.rank || a.suit.localeCompare(b.suit));
}

export function createDoudizhu(names?: { id: string; name: string; isBot: boolean }[]): DDState {
  const roster = (names || [{ id: 'you', name: '你', isBot: false }]).slice(0, 3);
  while (roster.length < 3) roster.push({ id: `dd${roster.length}`, name: `农民${roster.length}`, isBot: true });
  const deck = buildDeck();
  const hands: DDCard[][] = [[], [], []];
  for (let i = 0; i < 17; i++) for (let p = 0; p < 3; p++) hands[p].push(deck.pop()!);
  const landlord = 0; // bidding skipped: you are landlord
  hands[landlord].push(...deck);
  const players: DDPlayer[] = roster.map((p, i) => ({
    ...p,
    hand: sortHand(hands[i]),
    role: i === landlord ? 'landlord' : 'farmer',
  }));
  return {
    players,
    landlord,
    current: landlord,
    last: null,
    lastPlayer: null,
    passes: 0,
    winner: null,
    phase: 'play',
    log: ['跳过叫分，你为地主，底牌已收入。'],
  };
}

function groups(cards: DDCard[]): Map<number, DDCard[]> {
  const m = new Map<number, DDCard[]>();
  for (const c of cards) {
    const g = m.get(c.rank) || [];
    g.push(c);
    m.set(c.rank, g);
  }
  return m;
}

export function classifyCombo(cards: DDCard[]): Combo | null {
  if (!cards.length) return { kind: 'pass', rank: 0, cards: [] };
  const sorted = sortHand(cards);
  const g = groups(sorted);
  const ranks = [...g.keys()].sort((a, b) => a - b);
  if (sorted.length === 2 && sorted.every((c) => c.rank >= 16)) {
    return { kind: 'rocket', rank: 17, cards: sorted };
  }
  if (sorted.length === 4 && ranks.length === 1) {
    return { kind: 'bomb', rank: ranks[0], cards: sorted };
  }
  if (sorted.length === 1) return { kind: 'solo', rank: sorted[0].rank, cards: sorted };
  if (sorted.length === 2 && ranks.length === 1) return { kind: 'pair', rank: ranks[0], cards: sorted };
  if (sorted.length === 3 && ranks.length === 1) return { kind: 'triple', rank: ranks[0], cards: sorted };
  if (sorted.length === 4 && ranks.length === 2) {
    const triple = ranks.find((r) => g.get(r)!.length === 3);
    const kicker = ranks.find((r) => g.get(r)!.length === 1);
    if (triple !== undefined && kicker !== undefined) return { kind: 'triple1', rank: triple, cards: sorted };
  }
  if (sorted.length === 5 && ranks.length === 2) {
    const triple = ranks.find((r) => g.get(r)!.length === 3);
    const pair = ranks.find((r) => g.get(r)!.length === 2);
    if (triple !== undefined && pair !== undefined) return { kind: 'triple2', rank: triple, cards: sorted };
  }
  if (sorted.length >= 5 && ranks.length === sorted.length && ranks.every((r) => r <= 14)) {
    let ok = true;
    for (let i = 1; i < ranks.length; i++) if (ranks[i] !== ranks[i - 1] + 1) ok = false;
    if (ok) return { kind: 'straight', rank: ranks[0], cards: sorted, len: sorted.length };
  }
  return null;
}

export function beats(play: Combo, last: Combo | null): boolean {
  if (play.kind === 'pass') return true;
  if (!last || last.kind === 'pass') return true;
  if (play.kind === 'rocket') return true;
  if (last.kind === 'rocket') return false;
  if (play.kind === 'bomb' && last.kind !== 'bomb') return true;
  if (play.kind === 'bomb' && last.kind === 'bomb') return play.rank > last.rank;
  if (play.kind !== last.kind) return false;
  if (play.kind === 'straight' && play.len !== last.len) return false;
  return play.rank > last.rank;
}

export function playDoudizhu(state: DDState, player: number, cardIds: string[]): DDState {
  if (state.phase !== 'play' || state.current !== player || state.winner !== null) return state;
  const hand = state.players[player].hand;
  const cards = cardIds.map((id) => hand.find((c) => c.id === id)).filter(Boolean) as DDCard[];
  if (cards.length !== cardIds.length) return state;
  const combo = classifyCombo(cards);
  if (!combo || combo.kind === 'pass') return state;
  const leading = !state.last || state.lastPlayer === player;
  if (!leading && !beats(combo, state.last)) return state;
  const next: DDState = {
    ...state,
    players: state.players.map((p, i) => ({
      ...p,
      hand: i === player ? sortHand(p.hand.filter((c) => !cardIds.includes(c.id))) : p.hand.slice(),
    })),
    log: state.log.slice(),
    last: combo,
    lastPlayer: player,
    passes: 0,
  };
  next.log.push(`${next.players[player].name} 出 ${combo.cards.map((c) => c.label).join(' ')}`);
  if (next.players[player].hand.length === 0) {
    next.winner = player;
    next.phase = 'ended';
    next.log.push(`${next.players[player].name}（${next.players[player].role === 'landlord' ? '地主' : '农民'}）获胜！`);
    return next;
  }
  next.current = (player + 1) % 3;
  return next;
}

export function passDoudizhu(state: DDState, player: number): DDState {
  if (state.phase !== 'play' || state.current !== player || state.winner !== null) return state;
  if (!state.last || state.lastPlayer === player) return state; // must lead
  const next: DDState = {
    ...state,
    log: [...state.log, `${state.players[player].name} 不要`],
    passes: state.passes + 1,
    current: (player + 1) % 3,
  };
  if (next.passes >= 2) {
    next.last = null;
    next.lastPlayer = null;
    next.passes = 0;
    next.log.push('无人压制，重新出牌。');
  }
  return next;
}

function combosFromHand(hand: DDCard[]): Combo[] {
  const out: Combo[] = [];
  const g = groups(hand);
  const ranks = [...g.keys()].sort((a, b) => a - b);
  for (const r of ranks) {
    const cs = g.get(r)!;
    if (cs.length >= 1) out.push({ kind: 'solo', rank: r, cards: [cs[0]] });
    if (cs.length >= 2) out.push({ kind: 'pair', rank: r, cards: cs.slice(0, 2) });
    if (cs.length >= 3) out.push({ kind: 'triple', rank: r, cards: cs.slice(0, 3) });
    if (cs.length >= 4) out.push({ kind: 'bomb', rank: r, cards: cs.slice(0, 4) });
  }
  const jokers = hand.filter((c) => c.rank >= 16);
  if (jokers.length === 2) out.push({ kind: 'rocket', rank: 17, cards: jokers });
  for (let len = 5; len <= ranks.length; len++) {
    for (let i = 0; i + len <= ranks.length; i++) {
      const slice = ranks.slice(i, i + len);
      if (slice.some((r) => r > 14)) continue;
      let ok = true;
      for (let k = 1; k < slice.length; k++) if (slice[k] !== slice[k - 1] + 1) ok = false;
      if (!ok) continue;
      const cards = slice.map((r) => g.get(r)![0]);
      out.push({ kind: 'straight', rank: slice[0], cards, len });
    }
  }
  for (const r of ranks) {
    const t = g.get(r)!;
    if (t.length < 3) continue;
    for (const k of ranks) {
      if (k === r) continue;
      const ks = g.get(k)!;
      if (ks.length >= 1) out.push({ kind: 'triple1', rank: r, cards: [...t.slice(0, 3), ks[0]] });
      if (ks.length >= 2) out.push({ kind: 'triple2', rank: r, cards: [...t.slice(0, 3), ...ks.slice(0, 2)] });
    }
  }
  return out;
}

const COMBO_ZH: Record<ComboKind, string> = {
  pass: '不要', solo: '单张', pair: '对子', triple: '三张', triple1: '三带一', triple2: '三带二',
  straight: '顺子', bomb: '炸弹', rocket: '王炸',
};

export type DDAdvice = { action: 'pass' } | { action: 'play'; combo: Combo };

export function doudizhuSuggest(state: DDState, player = state.current): DDAdvice | null {
  if (state.winner !== null) return null;
  const p = state.players[player];
  const leading = !state.last || state.lastPlayer === player;
  const options = combosFromHand(p.hand).filter((c) => leading ? c.kind !== 'pass' : beats(c, state.last));
  if (!options.length) return { action: 'pass' };
  const canFinish = options.find((c) => c.cards.length === p.hand.length);
  if (canFinish) return { action: 'play', combo: canFinish };
  const bombs = options.filter((c) => c.kind === 'bomb' || c.kind === 'rocket');
  const normal = options.filter((c) => c.kind !== 'bomb' && c.kind !== 'rocket');
  const pool = normal.length ? normal : bombs;
  pool.sort((a, b) => {
    if (leading) {
      if (a.kind === 'straight' && b.kind !== 'straight') return -1;
      if (b.kind === 'straight' && a.kind !== 'straight') return 1;
      return a.rank - b.rank || a.cards.length - b.cards.length;
    }
    return a.rank - b.rank || a.cards.length - b.cards.length;
  });
  const choice = pool[0];
  if (!leading && p.role === 'farmer') {
    const lastP = state.lastPlayer;
    const lastRole = lastP !== null ? state.players[lastP].role : null;
    if (lastRole === 'farmer' && lastP !== player && (choice.kind === 'bomb' || choice.rank >= 14)) {
      return { action: 'pass' };
    }
  }
  return { action: 'play', combo: choice };
}

export function doudizhuBot(state: DDState): DDState {
  if (state.winner !== null) return state;
  const p = state.players[state.current];
  if (!p.isBot) return state;
  const sug = doudizhuSuggest(state, state.current);
  if (!sug || sug.action === 'pass') return passDoudizhu(state, state.current);
  return playDoudizhu(state, state.current, sug.combo.cards.map((c) => c.id));
}

export const doudizhuCoach = {
  suggestMove(state: DDState, player = 0) { return doudizhuSuggest(state, player); },
  explain(state: DDState, suggested?: DDAdvice | null) {
    if (state.winner !== null) return `${state.players[state.winner].name} 已经出完。`;
    if (state.current !== 0) return `${state.players[state.current].name} 正在出牌。您是地主。`;
    const m = suggested === undefined ? doudizhuSuggest(state, 0) : suggested;
    const leading = !state.last || state.lastPlayer === 0;
    if (!m || m.action === 'pass') return '这一手压不过上家，建议点「不要」，把出牌权让给队友。';
    const cards = m.combo.cards.map((c) => c.label).join(' ');
    const kind = COMBO_ZH[m.combo.kind];
    if (leading) return `您是地主，现在领出。建议出${kind}：${cards}。先出小牌、能走顺子更好。`;
    return `上家是 ${state.last?.cards.map((c) => c.label).join(' ')}。建议用${kind}压：${cards}。`;
  },
  legalHighlights() { return []; },
};
