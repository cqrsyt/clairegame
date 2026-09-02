/** 简化德州：2 人限注，翻牌（三张）后再行动一次，然后发完摊牌。 */
export type HCard = { r: number; s: number; id: string };
export interface HPlayer { id: string; name: string; isBot: boolean; hole: HCard[]; stack: number; folded: boolean; bet: number; }
export interface HoldemState {
  players: HPlayer[];
  board: HCard[];
  pot: number;
  toAct: number;
  phase: 'pre' | 'flop' | 'show' | 'ended';
  winner: number | null;
  log: string[];
  deck: HCard[];
}

const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];

export function labelH(c: HCard) { return RANKS[c.r] + SUITS[c.s]; }
export function isRedH(c: HCard) { return c.s === 1 || c.s === 3; }

function deck(): HCard[] {
  const d: HCard[] = [];
  let i = 0;
  for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) d.push({ r, s, id: `${i++}` });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function rank7(cards: HCard[]): [number, number[]] {
  // best 5 of 7: category then kickers. 8=straight flush .. 0=high
  const combos: HCard[][] = [];
  const pick = (start: number, chosen: HCard[]) => {
    if (chosen.length === 5) { combos.push(chosen); return; }
    for (let i = start; i < cards.length; i++) pick(i + 1, chosen.concat(cards[i]));
  };
  pick(0, []);
  let best: [number, number[]] = [-1, []];
  for (const five of combos) {
    const ev = eval5(five);
    if (cmp(ev, best) > 0) best = ev;
  }
  return best;
}

function eval5(five: HCard[]): [number, number[]] {
  const rs = five.map((c) => c.r).sort((a, b) => b - a);
  const ss = five.map((c) => c.s);
  const flush = ss.every((s) => s === ss[0]);
  const uniq = [...new Set(rs)];
  let straight = false;
  let top = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) { straight = true; top = uniq[0]; }
    if (uniq[0] === 12 && uniq[1] === 3 && uniq[4] === 0) { straight = true; top = 3; } // A2345
  }
  const counts = new Map<number, number>();
  for (const r of rs) counts.set(r, (counts.get(r) || 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  if (straight && flush) return [8, [top]];
  if (groups[0][1] === 4) return [7, [groups[0][0], groups[1][0]]];
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, [groups[0][0], groups[1][0]]];
  if (flush) return [5, rs];
  if (straight) return [4, [top]];
  if (groups[0][1] === 3) return [3, [groups[0][0], ...groups.slice(1).map((g) => g[0])]];
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const p = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    return [2, [...p, groups[2][0]]];
  }
  if (groups[0][1] === 2) return [1, [groups[0][0], ...groups.slice(1).map((g) => g[0])]];
  return [0, rs];
}

function cmp(a: [number, number[]], b: [number, number[]]) {
  if (a[0] !== b[0]) return a[0] - b[0];
  for (let i = 0; i < Math.max(a[1].length, b[1].length); i++) {
    const d = (a[1][i] || 0) - (b[1][i] || 0);
    if (d) return d;
  }
  return 0;
}

const CAT = ['高牌', '一对', '两对', '三条', '顺子', '同花', '葫芦', '四条', '同花顺'];

export function createHoldem(): HoldemState {
  const d = deck();
  const players: HPlayer[] = [
    { id: 'you', name: '你', isBot: false, hole: [d.pop()!, d.pop()!], stack: 100, folded: false, bet: 0 },
    { id: 'bot', name: '对手', isBot: true, hole: [d.pop()!, d.pop()!], stack: 100, folded: false, bet: 0 },
  ];
  // blinds
  players[0].stack -= 1; players[0].bet = 1;
  players[1].stack -= 2; players[1].bet = 2;
  return {
    players,
    board: [],
    pot: 3,
    toAct: 0,
    phase: 'pre',
    winner: null,
    log: ['小盲 1、大盲 2。你可以跟注、加注或弃牌。'],
    deck: d,
  };
}

function dealBoard(s: HoldemState) {
  const d = s.deck.slice();
  const board = s.board.slice();
  while (board.length < 5 && d.length) board.push(d.pop()!);
  return { ...s, deck: d, board };
}

function acting(s: HoldemState, i: number) {
  return (s.phase === 'pre' || s.phase === 'flop') && s.toAct === i && s.winner === null;
}

export function holdemFold(s: HoldemState, i: number): HoldemState {
  if (!acting(s, i)) return s;
  const players = s.players.map((p, k) => k === i ? { ...p, folded: true } : p);
  const w = 1 - i;
  players[w] = { ...players[w], stack: players[w].stack + s.pot };
  return { ...s, players, phase: 'ended', winner: w, log: [`${players[i].name} 弃牌。${players[w].name} 收下底池。`, ...s.log] };
}

function goFlop(s: HoldemState, from: number): HoldemState {
  if (s.board.length >= 3) return showdown(s);
  const d = s.deck.slice();
  const board = [d.pop()!, d.pop()!, d.pop()!];
  return {
    ...s,
    deck: d,
    board,
    phase: 'flop',
    toAct: 1 - from,
    log: [`翻牌 ${board.map(labelH).join(' ')}。`, ...s.log],
  };
}

export function holdemCall(s: HoldemState, i: number): HoldemState {
  if (!acting(s, i)) return s;
  const need = Math.max(...s.players.map((p) => p.bet)) - s.players[i].bet;
  const pay = Math.min(need, s.players[i].stack);
  const players = s.players.map((p, k) => k === i ? { ...p, stack: p.stack - pay, bet: p.bet + pay } : p);
  const pot = s.pot + pay;
  const next = { ...s, players, pot, log: [`${players[i].name} 跟注 ${pay}。`, ...s.log] };
  if (next.phase === 'pre' && next.board.length === 0) return goFlop(next, i);
  return showdown(next);
}

export function holdemRaise(s: HoldemState, i: number, extra = 10): HoldemState {
  if (!acting(s, i)) return s;
  const maxBet = Math.max(...s.players.map((p) => p.bet));
  const need = maxBet - s.players[i].bet + extra;
  const pay = Math.min(need, s.players[i].stack);
  const players = s.players.map((p, k) => k === i ? { ...p, stack: p.stack - pay, bet: p.bet + pay } : p);
  const pot = s.pot + pay;
  const next = { ...s, players, pot, toAct: 1 - i, log: [`${players[i].name} 加注至 ${players[i].bet}。`, ...s.log] };
  if (players[i].stack === 0 || players[1 - i].stack === 0) {
    const withBoard = next.board.length ? next : goFlop(next, i);
    return showdown(withBoard);
  }
  return next;
}

function showdown(s: HoldemState): HoldemState {
  const dealt = dealBoard(s);
  const evs = dealt.players.map((p) => rank7([...p.hole, ...dealt.board]));
  let winner = 0;
  if (cmp(evs[1], evs[0]) > 0) winner = 1;
  const players = dealt.players.map((p, i) => i === winner ? { ...p, stack: p.stack + dealt.pot } : p);
  const desc = CAT[evs[winner][0]];
  return {
    ...dealt,
    players,
    pot: 0,
    phase: 'ended',
    winner,
    log: [`摊牌：${players[winner].name} 以${desc}获胜。`, ...dealt.log],
  };
}

function holeScore(h: HCard[]) {
  const [a, b] = h[0].r >= h[1].r ? [h[0], h[1]] : [h[1], h[0]];
  let sc = a.r + 2;
  if (a.r === b.r) sc = a.r * 2 + 8; // 对子
  if (a.s === b.s) sc += 2;
  if (Math.abs(a.r - b.r) === 1) sc += 1;
  if (a.r >= 10 && b.r >= 8) sc += 3;
  return sc;
}

function botActionFor(s: HoldemState, i: number): 'fold' | 'call' | 'raise' {
  const hole = s.players[i].hole;
  if (s.phase === 'flop' && s.board.length >= 3) {
    const ev = rank7([...hole, ...s.board]);
    if (ev[0] >= 3) return 'raise'; // 三条以上
    if (ev[0] >= 1) return 'call';
    if (holeScore(hole) >= 16) return 'call';
    return 'fold';
  }
  const sc = holeScore(hole);
  if (sc >= 22) return 'raise';
  if (sc >= 12) return 'call';
  return 'fold';
}

export function holdemBot(s: HoldemState): HoldemState {
  if ((s.phase !== 'pre' && s.phase !== 'flop') || !s.players[s.toAct].isBot) return s;
  const i = s.toAct;
  const act = botActionFor(s, i);
  if (act === 'fold') return holdemFold(s, i);
  if (act === 'raise') return holdemRaise(s, i, 8);
  return holdemCall(s, i);
}

const ACT_ZH = { fold: '弃牌', call: '跟注', raise: '加注' } as const;

export const holdemCoach = {
  suggestMove(state: HoldemState) {
    return botActionFor(state, 0);
  },
  explain(state: HoldemState, suggested?: 'fold' | 'call' | 'raise' | null) {
    if (state.winner !== null) return state.log[0];
    const h = state.players[0].hole;
    const act = suggested ?? botActionFor(state, 0);
    const hint = `建议${ACT_ZH[act]}。`;
    if (state.phase === 'flop') {
      const ev = rank7([...h, ...state.board]);
      return `翻牌已出。您现在大约是「${CAT[ev[0]]}」。${hint}`;
    }
    if (h[0].r === h[1].r) return `口袋对子，底气较足。${hint}`;
    if (h[0].s === h[1].s) return `同花起手，后面可能走同花。${hint}`;
    if (h[0].r >= 10 && h[1].r >= 10) return `两张高牌。${hint}`;
    return `先看两张底牌再决定。${hint}`;
  },
  legalHighlights() { return []; },
};
