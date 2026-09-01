/** 9路围棋子集：提子、禁自杀；无完整劫争/数目，可增强。 */
export type GoColor = 1 | 2;
export interface GoState {
  size: number;
  board: number[][];
  turn: GoColor;
  winner: 0 | 1 | 2;
  lastMove: { r: number; c: number } | null;
  captures: [number, number];
  passes: number;
  ko: { r: number; c: number } | null;
}

export function createGo(size = 9): GoState {
  return {
    size,
    board: Array.from({ length: size }, () => Array(size).fill(0)),
    turn: 1,
    winner: 0,
    lastMove: null,
    captures: [0, 0],
    passes: 0,
    ko: null,
  };
}

function neighbors(size: number, r: number, c: number) {
  const out: [number, number][] = [];
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < size && cc < size) out.push([rr, cc]);
  }
  return out;
}

function groupAndLibs(board: number[][], r: number, c: number) {
  const size = board.length;
  const color = board[r][c];
  const group = new Set<string>();
  const libs = new Set<string>();
  const stack = [[r, c]];
  group.add(`${r},${c}`);
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    for (const [nr, nc] of neighbors(size, cr, cc)) {
      const v = board[nr][nc];
      if (v === 0) libs.add(`${nr},${nc}`);
      else if (v === color) {
        const k = `${nr},${nc}`;
        if (!group.has(k)) { group.add(k); stack.push([nr, nc]); }
      }
    }
  }
  return { group, libs };
}

function removeGroup(board: number[][], group: Set<string>) {
  for (const k of group) {
    const [r, c] = k.split(',').map(Number);
    board[r][c] = 0;
  }
}

export function playGo(s: GoState, r: number, c: number): GoState {
  if (s.winner || r < 0 || c < 0 || r >= s.size || c >= s.size) return s;
  if (s.board[r][c] !== 0) return s;
  if (s.ko && s.ko.r === r && s.ko.c === c) return s;
  const board = s.board.map((row) => row.slice());
  board[r][c] = s.turn;
  const opp = (3 - s.turn) as GoColor;
  let captured = 0;
  let lastCap: { r: number; c: number } | null = null;
  for (const [nr, nc] of neighbors(s.size, r, c)) {
    if (board[nr][nc] !== opp) continue;
    const g = groupAndLibs(board, nr, nc);
    if (g.libs.size === 0) {
      captured += g.group.size;
      if (g.group.size === 1) lastCap = { r: nr, c: nc };
      removeGroup(board, g.group);
    }
  }
  const self = groupAndLibs(board, r, c);
  if (self.libs.size === 0) return s;
  const captures: [number, number] = [...s.captures];
  captures[s.turn - 1] += captured;
  const ko = captured === 1 && lastCap && self.group.size === 1 && self.libs.size === 1 ? lastCap : null;
  return {
    ...s,
    board,
    turn: opp,
    lastMove: { r, c },
    captures,
    passes: 0,
    ko,
  };
}

export function passGo(s: GoState): GoState {
  if (s.winner) return s;
  const passes = s.passes + 1;
  if (passes >= 2) {
    const score = scoreGo({ ...s, passes });
    return { ...s, passes, winner: score.b >= score.w ? 1 : 2, turn: s.turn, ko: null };
  }
  return { ...s, turn: (3 - s.turn) as GoColor, passes, lastMove: null, ko: null };
}

export function scoreGo(s: GoState) {
  let b = s.captures[0], w = s.captures[1] + 3.5;
  for (const row of s.board) for (const v of row) {
    if (v === 1) b++;
    if (v === 2) w++;
  }
  return { b, w };
}

export function goAI(s: GoState): { r: number; c: number } | 'pass' {
  const moves: { r: number; c: number; sc: number }[] = [];
  const mid = (s.size - 1) / 2;
  for (let r = 0; r < s.size; r++)
    for (let c = 0; c < s.size; c++) {
      if (s.board[r][c] !== 0) continue;
      const next = playGo(s, r, c);
      if (next === s || next.board[r][c] === 0) continue;
      let sc = next.captures[s.turn - 1] * 12;
      sc -= Math.abs(r - mid) + Math.abs(c - mid);
      const g = groupAndLibs(next.board, r, c);
      sc += Math.min(4, g.libs.size);
      moves.push({ r, c, sc });
    }
  if (!moves.length) return 'pass';
  moves.sort((a, b) => b.sc - a.sc);
  return { r: moves[0].r, c: moves[0].c };
}

export const goCoach = {
  suggestMove(state: GoState) { return goAI(state); },
  explain(state: GoState) {
    if (state.winner) {
      const sc = scoreGo(state);
      return `终局。黑 ${sc.b.toFixed(1)}，白 ${sc.w.toFixed(1)}。${state.winner === 1 ? '黑胜。' : '白胜。'}`;
    }
    const who = state.turn === 1 ? '黑棋' : '白棋';
    const sc = scoreGo(state);
    return `${who}落子。提子：黑 ${state.captures[0]} / 白 ${state.captures[1]}。目前子数加提子大约黑 ${sc.b.toFixed(0)}、白 ${sc.w.toFixed(0)}。连下两手停着即收官。`;
  },
  legalHighlights() { return []; },
};
