export interface DDCard {
  id: string;
  rank: number;
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

const SUITS = ['S', 'H', 'C', 'D'];
const RANK_LABEL: Record<number, string> = {
  3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: 'jw', 17: 'JW',
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
  cards.push({ id: `d${n++}`, rank: 16, suit: 'j', label: 'jw' });
  cards.push({ id: `d${n++}`, rank: 17, suit: 'J', label: 'JW' });
  return shuffle(cards);
}

function sortHand(h: DDCard[]) {
  return h.slice().sort((a, b) => a.rank - b.rank || a.suit.localeCompare(b.suit));
}

export function createDoudizhu(names?: { id: string; name: string; isBot: boolean }[]): DDState {
  const roster = (names || [{ id: 'you', name: 'you', isBot: false }]).slice(0, 3);
  while (roster.length < 3) roster.push({ id: `dd${roster.length}`, name: `bot${roster.length}`, isBot: true });
  const deck = buildDeck();
  const hands: DDCard[][] = [[], [], []];
  for (let i = 0; i < 17; i++) for (let p = 0; p < 3; p++) hands[p].push(deck.pop()!);
  const landlord = 0;
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
    log: ['skip bid, you are landlord'],
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
  next.log.push(`${next.players[player].name} play ${combo.cards.map((c) => c.label).join(' ')}`);
  if (next.players[player].hand.length === 0) {
    next.winner = player;
    next.phase = 'ended';
    next.log.push(`${next.players[player].name} wins`);
    return next;
  }
  next.current = (player + 1) % 3;
  return next;
}

export function passDoudizhu(state: DDState, player: number): DDState {
  if (state.phase !== 'play' || state.current !== player || state.winner !== null) return state;
  if (!state.last || state.lastPlayer === player) return state;
  const next: DDState = {
    ...state,
    log: [...state.log, `${state.players[player].name} pass`],
    passes: state.passes + 1,
    current: (player + 1) % 3,
  };
  if (next.passes >= 2) {
    next.last = null;
    next.lastPlayer = null;
    next.passes = 0;
    next.log.push('new lead');
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

export function doudizhuBot(state: DDState): DDState {
  if (state.winner !== null) return state;
  const p = state.players[state.current];
  if (!p.isBot) return state;
  const options = combosFromHand(p.hand).filter((c) => {
    const leading = !state.last || state.lastPlayer === state.current;
    return leading ? c.kind !== 'pass' : beats(c, state.last);
  });
  options.sort((a, b) => {
    const bomb = (k: ComboKind) => (k === 'bomb' || k === 'rocket' ? 1 : 0);
    if (bomb(a.kind) !== bomb(b.kind)) return bomb(a.kind) - bomb(b.kind);
    return a.cards.length - b.cards.length || a.rank - b.rank;
  });
  if (!options.length) return passDoudizhu(state, state.current);
  return playDoudizhu(state, state.current, options[0].cards.map((c) => c.id));
}
