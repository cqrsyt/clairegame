export type UnoColor = 'R' | 'G' | 'B' | 'Y' | 'W';
export type UnoValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | '+2' | 'wild' | '+4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
}

export interface UnoPlayer {
  id: string;
  name: string;
  isBot: boolean;
  hand: UnoCard[];
}

export interface UnoState {
  players: UnoPlayer[];
  deck: UnoCard[];
  discard: UnoCard[];
  current: number;
  dir: 1 | -1;
  color: UnoColor;
  pendingDraw: number;
  winner: number | null;
  log: string[];
}

const COLORS: UnoColor[] = ['R', 'G', 'B', 'Y'];
const COLOR_ZH: Record<UnoColor, string> = { R: '红', G: '绿', B: '蓝', Y: '黄', W: '万能' };

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function labelUno(c: UnoCard): string {
  if (c.value === 'wild') return '变色';
  if (c.value === '+4') return '+4';
  return `${COLOR_ZH[c.color]}${c.value === 'skip' ? '跳过' : c.value === 'reverse' ? '反转' : c.value}`;
}

function buildDeck(): UnoCard[] {
  const cards: UnoCard[] = [];
  let n = 0;
  for (const color of COLORS) {
    cards.push({ id: `c${n++}`, color, value: '0' });
    for (const v of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2'] as UnoValue[]) {
      cards.push({ id: `c${n++}`, color, value: v });
      cards.push({ id: `c${n++}`, color, value: v });
    }
  }
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `c${n++}`, color: 'W', value: 'wild' });
    cards.push({ id: `c${n++}`, color: 'W', value: '+4' });
  }
  return shuffle(cards);
}

function drawFrom(state: UnoState, count: number): UnoCard[] {
  const out: UnoCard[] = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      const top = state.discard.pop();
      state.deck = shuffle(state.discard);
      state.discard = top ? [top] : [];
    }
    const c = state.deck.pop();
    if (c) out.push(c);
  }
  return out;
}

export function createUno(names?: { id: string; name: string; isBot: boolean }[]): UnoState {
  const roster = (names || [{ id: 'you', name: '你', isBot: false }]).slice(0, 4);
  while (roster.length < 4) roster.push({ id: `u${roster.length}`, name: `旅人${roster.length}`, isBot: true });
  const deck = buildDeck();
  const players: UnoPlayer[] = roster.map((p) => ({ ...p, hand: [] }));
  for (let i = 0; i < 7; i++) for (const p of players) p.hand.push(deck.pop()!);
  let start = deck.pop()!;
  while (start.color === 'W') {
    deck.unshift(start);
    start = deck.pop()!;
  }
  return {
    players,
    deck,
    discard: [start],
    current: 0,
    dir: 1,
    color: start.color,
    pendingDraw: 0,
    winner: null,
    log: [`开局明牌 ${labelUno(start)}`],
  };
}

export function canPlayUno(card: UnoCard, state: UnoState): boolean {
  if (state.winner !== null) return false;
  if (state.pendingDraw > 0) {
    return card.value === '+2' || card.value === '+4';
  }
  if (card.value === 'wild' || card.value === '+4') return true;
  const top = state.discard[state.discard.length - 1];
  return card.color === state.color || card.value === top.value;
}

function nextIndex(state: UnoState, from = state.current, skip = 0): number {
  const n = state.players.length;
  let i = from;
  const steps = 1 + skip;
  for (let k = 0; k < steps; k++) i = (i + state.dir + n) % n;
  return i;
}

export function drawUno(state: UnoState, player: number): UnoState {
  if (state.winner !== null || state.current !== player) return state;
  const next: UnoState = {
    ...state,
    players: state.players.map((p) => ({ ...p, hand: p.hand.slice() })),
    deck: state.deck.slice(),
    discard: state.discard.slice(),
    log: state.log.slice(),
  };
  const n = next.pendingDraw || 1;
  const cards = drawFrom(next, n);
  next.players[player].hand.push(...cards);
  next.pendingDraw = 0;
  next.log.push(`${next.players[player].name} 摸 ${n} 张`);
  next.current = nextIndex(next);
  return next;
}

export function playUno(state: UnoState, player: number, cardId: string, wildColor?: UnoColor): UnoState {
  if (state.winner !== null || state.current !== player) return state;
  const hand = state.players[player].hand;
  const card = hand.find((c) => c.id === cardId);
  if (!card || !canPlayUno(card, state)) return state;
  const next: UnoState = {
    ...state,
    players: state.players.map((p, i) => ({ ...p, hand: i === player ? p.hand.filter((c) => c.id !== cardId) : p.hand.slice() })),
    deck: state.deck.slice(),
    discard: [...state.discard, card],
    log: state.log.slice(),
    dir: state.dir,
    pendingDraw: state.pendingDraw,
  };
  let skip = 0;
  if (card.value === 'wild' || card.value === '+4') {
    next.color = wildColor && wildColor !== 'W' ? wildColor : COLORS[Math.floor(Math.random() * 4)];
  } else {
    next.color = card.color;
  }
  if (card.value === 'reverse') {
    next.dir = (next.dir === 1 ? -1 : 1) as 1 | -1;
    if (next.players.length === 2) skip = 1;
  }
  if (card.value === 'skip') skip = 1;
  if (card.value === '+2') next.pendingDraw += 2;
  if (card.value === '+4') next.pendingDraw += 4;
  next.log.push(`${next.players[player].name} 出 ${labelUno(card)}${card.color === 'W' ? '→' + COLOR_ZH[next.color] : ''}`);
  if (next.players[player].hand.length === 0) {
    next.winner = player;
    next.log.push(`${next.players[player].name} 出完，获胜！`);
    return next;
  }
  next.current = nextIndex(next, player, skip);
  return next;
}

export type UnoAdvice =
  | { action: 'draw' }
  | { action: 'play'; card: UnoCard; wildColor: UnoColor };

export function unoSuggest(state: UnoState, player = state.current): UnoAdvice | null {
  if (state.winner !== null) return null;
  const p = state.players[player];
  const playable = p.hand.filter((c) => canPlayUno(c, state));
  if (!playable.length) return { action: 'draw' };
  const nextI = nextIndex(state);
  const nextHand = state.players[nextI].hand.length;
  const counts: Record<string, number> = { R: 0, G: 0, B: 0, Y: 0 };
  for (const c of p.hand) if (c.color !== 'W') counts[c.color]++;
  const wildColor = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as UnoColor) || 'R';
  const score = (c: UnoCard) => {
    let sc = 0;
    if (c.value === '+4') sc -= 20;
    else if (c.value === 'wild') sc -= 12;
    else if (c.value === '+2' || c.value === 'skip') sc += nextHand <= 2 ? 30 : 6;
    else if (c.value === 'reverse') sc += nextHand <= 2 ? 18 : 4;
    if (c.color === wildColor) sc += 8;
    if (c.color === state.color) sc += 5;
    const n = parseInt(c.value, 10);
    if (!Number.isNaN(n)) sc += n * 0.2;
    if (p.hand.length === 1) sc += 50;
    return sc;
  };
  playable.sort((a, b) => score(b) - score(a));
  return { action: 'play', card: playable[0], wildColor };
}

export function unoBotStep(state: UnoState): UnoState {
  if (state.winner !== null) return state;
  const p = state.players[state.current];
  if (!p.isBot) return state;
  const sug = unoSuggest(state, state.current);
  if (!sug || sug.action === 'draw') return drawUno(state, state.current);
  return playUno(state, state.current, sug.card.id, sug.wildColor);
}

export const unoCoach = {
  suggestMove(state: UnoState, player = 0) { return unoSuggest(state, player); },
  explain(state: UnoState, suggested?: UnoAdvice | null) {
    if (state.winner !== null) return `${state.players[state.winner].name} 已经出完牌。`;
    if (state.current !== 0) return `${state.players[state.current].name} 正在出牌。当前颜色是${COLOR_ZH[state.color]}。`;
    if (suggested === null) return `${state.players[state.current].name} 正在出牌。当前颜色是${COLOR_ZH[state.color]}。`;
    const m = suggested === undefined ? unoSuggest(state, 0) : suggested;
    if (!m || m.action === 'draw') return `当前颜色是${COLOR_ZH[state.color]}。手里没有能配上的牌，建议摸一张。`;
    const lab = labelUno(m.card);
    if (m.card.value === 'wild' || m.card.value === '+4') {
      return `建议出「${lab}」，并把颜色改成${COLOR_ZH[m.wildColor]}。对手剩得少时，功能牌更有用。`;
    }
    return `当前颜色是${COLOR_ZH[state.color]}。建议出「${lab}」，对上颜色或数字即可。`;
  },
  legalHighlights() { return []; },
};
