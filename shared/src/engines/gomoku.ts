export type Cell = 0 | 1 | 2; // empty, black, white
export interface GomokuState {
  board: Cell[][];
  turn: 1 | 2;
  winner: 0 | 1 | 2;
  lastMove: { r: number; c: number } | null;
  size: number;
}

export function createGomoku(size = 15): GomokuState {
  return {
    board: Array.from({ length: size }, () => Array(size).fill(0) as Cell[]),
    turn: 1,
    winner: 0,
    lastMove: null,
    size,
  };
}

function inBound(s: GomokuState, r: number, c: number) {
  return r >= 0 && c >= 0 && r < s.size && c < s.size;
}

export function legalMoves(s: GomokuState): { r: number; c: number }[] {
  if (s.winner) return [];
  const moves: { r: number; c: number }[] = [];
  for (let r = 0; r < s.size; r++)
    for (let c = 0; c < s.size; c++)
      if (s.board[r][c] === 0) moves.push({ r, c });
  return moves;
}

function countDir(s: GomokuState, r: number, c: number, dr: number, dc: number, p: Cell) {
  let n = 0;
  let rr = r + dr, cc = c + dc;
  while (inBound(s, rr, cc) && s.board[rr][cc] === p) {
    n++; rr += dr; cc += dc;
  }
  return n;
}

export function checkWin(s: GomokuState, r: number, c: number): boolean {
  const p = s.board[r][c];
  if (!p) return false;
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (const [dr, dc] of dirs) {
    const total = 1 + countDir(s, r, c, dr, dc, p) + countDir(s, r, c, -dr, -dc, p);
    if (total >= 5) return true;
  }
  return false;
}

export function playGomoku(s: GomokuState, r: number, c: number): GomokuState {
  if (s.winner || !inBound(s, r, c) || s.board[r][c] !== 0) return s;
  const board = s.board.map((row) => row.slice()) as Cell[][];
  board[r][c] = s.turn;
  const next: GomokuState = {
    ...s,
    board,
    lastMove: { r, c },
    turn: s.turn === 1 ? 2 : 1,
    winner: 0,
  };
  if (checkWin(next, r, c)) next.winner = s.turn;
  else if (legalMoves(next).length === 0) next.winner = 0; // draw stays 0 but no moves
  return next;
}

function scoreLine(cells: Cell[], p: Cell): number {
  const o = (3 - p) as Cell;
  let best = 0;
  for (let i = 0; i < cells.length; i++) {
    let mine = 0, empty = 0, blocked = false;
    for (let k = 0; k < 5 && i + k < cells.length; k++) {
      const v = cells[i + k];
      if (v === p) mine++;
      else if (v === 0) empty++;
      else { blocked = true; break; }
    }
    if (!blocked && mine + empty === 5) {
      const table = [0, 10, 100, 1000, 10000, 100000];
      best = Math.max(best, table[mine] || 0);
    }
  }
  return best;
}

function evaluate(s: GomokuState, p: Cell): number {
  let score = 0;
  const lines: Cell[][] = [];
  for (let r = 0; r < s.size; r++) lines.push(s.board[r]);
  for (let c = 0; c < s.size; c++) lines.push(s.board.map((row) => row[c]));
  for (let d = -s.size; d < s.size; d++) {
    const diag: Cell[] = [], diag2: Cell[] = [];
    for (let r = 0; r < s.size; r++) {
      const c = r + d;
      if (c >= 0 && c < s.size) diag.push(s.board[r][c]);
      const c2 = s.size - 1 - r + d;
      if (c2 >= 0 && c2 < s.size) diag2.push(s.board[r][c2]);
    }
    if (diag.length >= 5) lines.push(diag);
    if (diag2.length >= 5) lines.push(diag2);
  }
  for (const line of lines) {
    score += scoreLine(line, p);
    score -= scoreLine(line, (3 - p) as Cell) * 1.1;
  }
  return score;
}

export function gomokuAI(s: GomokuState): { r: number; c: number } | null {
  const moves = legalMoves(s);
  if (!moves.length) return null;
  // prefer near existing stones
  const candidates = moves.filter(({ r, c }) => {
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < s.size && cc < s.size && s.board[rr][cc]) return true;
      }
    return false;
  });
  const pool = candidates.length ? candidates : moves;
  let best = pool[0];
  let bestScore = -Infinity;
  const me = s.turn;
  for (const m of pool) {
    const next = playGomoku(s, m.r, m.c);
    if (next.winner === me) return m;
    let sc = evaluate(next, me);
    // center bias
    sc -= (Math.abs(m.r - 7) + Math.abs(m.c - 7)) * 0.5;
    if (sc > bestScore) { bestScore = sc; best = m; }
  }
  return best;
}

export const gomokuCoach = {
  suggestMove(state: GomokuState) { return gomokuAI(state); },
  explain(state: GomokuState) {
    if (state.winner) return state.winner === 1 ? '黑棋连五获胜。' : '白棋连五获胜。';
    return state.turn === 1 ? '轮到黑棋落子。留意活四与冲四威胁。' : '轮到白棋落子。优先阻断对手四连。';
  },
  legalHighlights(state: GomokuState) { return legalMoves(state); },
};
