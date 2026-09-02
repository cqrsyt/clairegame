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

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

/** Consecutive run + open ends after a stone at r,c. */
function runOpen(s: GomokuState, r: number, c: number, dr: number, dc: number, p: Cell) {
  let n = 1;
  let rr = r + dr, cc = c + dc;
  while (inBound(s, rr, cc) && s.board[rr][cc] === p) { n++; rr += dr; cc += dc; }
  const openA = inBound(s, rr, cc) && s.board[rr][cc] === 0;
  rr = r - dr; cc = c - dc;
  while (inBound(s, rr, cc) && s.board[rr][cc] === p) { n++; rr -= dr; cc -= dc; }
  const openB = inBound(s, rr, cc) && s.board[rr][cc] === 0;
  return { n, opens: (openA ? 1 : 0) + (openB ? 1 : 0) };
}

type Threat = { live4: number; sleep4: number; live3: number; sleep3: number; live2: number; win: number };

function threatsAt(s: GomokuState, r: number, c: number, p: Cell): Threat {
  const t: Threat = { live4: 0, sleep4: 0, live3: 0, sleep3: 0, live2: 0, win: 0 };
  for (const [dr, dc] of DIRS) {
    const { n, opens } = runOpen(s, r, c, dr, dc, p);
    if (n >= 5) t.win++;
    else if (n === 4 && opens === 2) t.live4++;
    else if (n === 4 && opens === 1) t.sleep4++;
    else if (n === 3 && opens === 2) t.live3++;
    else if (n === 3 && opens === 1) t.sleep3++;
    else if (n === 2 && opens === 2) t.live2++;
  }
  return t;
}

function threatScore(t: Threat, attack: boolean): number {
  if (t.win) return attack ? 1e7 : 5e6;
  // 活四 / 冲四 / 活三 — classic gomoku priority
  let sc = t.live4 * 200000 + t.sleep4 * 50000 + t.live3 * 8000 + t.sleep3 * 700 + t.live2 * 80;
  if (t.live3 >= 2) sc += 40000; // 双活三
  if (t.live4 && t.live3) sc += 30000;
  return sc;
}

function nearStones(s: GomokuState, r: number, c: number, rad = 2) {
  for (let dr = -rad; dr <= rad; dr++)
    for (let dc = -rad; dc <= rad; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < s.size && cc < s.size && s.board[rr][cc]) return true;
    }
  return false;
}

export function gomokuAI(s: GomokuState): { r: number; c: number } | null {
  const moves = legalMoves(s);
  if (!moves.length) return null;
  const me = s.turn;
  const opp = (3 - me) as Cell;
  const mid = (s.size - 1) / 2;
  if (moves.length === s.size * s.size) return { r: Math.floor(mid), c: Math.floor(mid) };

  const pool = moves.filter((m) => nearStones(s, m.r, m.c, 2));
  const cand = pool.length ? pool : moves;

  let win: { r: number; c: number } | null = null;
  let block: { r: number; c: number } | null = null;
  let best = cand[0];
  let bestScore = -Infinity;
  for (const m of cand) {
    const board = s.board.map((row) => row.slice()) as Cell[][];
    board[m.r][m.c] = me;
    const placed = { ...s, board };
    const mine = threatsAt(placed, m.r, m.c, me);
    if (mine.win) { win = m; break; }
    board[m.r][m.c] = opp;
    const theirs = threatsAt({ ...s, board }, m.r, m.c, opp);
    if (theirs.win) block = m;
    let sc = threatScore(mine, true) - threatScore(theirs, false) * 1.05;
    sc -= (Math.abs(m.r - mid) + Math.abs(m.c - mid)) * 0.4;
    if (sc > bestScore) { bestScore = sc; best = m; }
  }
  if (win) return win;
  if (block) return block;
  return best;
}

function lineLen(s: GomokuState, r: number, c: number, p: Cell): number {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  let best = 1;
  for (const [dr, dc] of dirs) {
    best = Math.max(best, 1 + countDir(s, r, c, dr, dc, p) + countDir(s, r, c, -dr, -dc, p));
  }
  return best;
}

export function gomokuPosLabel(m: { r: number; c: number }) {
  return `第 ${m.r + 1} 行第 ${m.c + 1} 列`;
}

export const gomokuCoach = {
  suggestMove(state: GomokuState) { return gomokuAI(state); },
  explain(state: GomokuState, suggested?: { r: number; c: number } | null) {
    if (state.winner) return state.winner === 1 ? '黑棋连成五子，这一局结束。' : '白棋连成五子，这一局结束。';
    const m = suggested === undefined ? gomokuAI(state) : suggested;
    const who = state.turn === 1 ? '请您落黑子。' : '请您落白子。';
    if (!m) return `${who}盘上已经没有空位了。`;
    const pos = gomokuPosLabel(m);
    const me = state.turn;
    const opp = (3 - me) as Cell;
    const board = state.board.map((row) => row.slice()) as Cell[][];
    board[m.r][m.c] = me;
    const mine = threatsAt({ ...state, board }, m.r, m.c, me);
    board[m.r][m.c] = opp;
    const theirs = threatsAt({ ...state, board }, m.r, m.c, opp);
    let why: string;
    if (mine.win) why = `落在${pos}就能连成五子，这一手可以取胜。`;
    else if (theirs.win) why = `对方下一手可能在${pos}连五，请先挡住。`;
    else if (mine.live4) why = `建议落在${pos}，做成两端都空的活四，对方很难两头都挡。`;
    else if (theirs.live4 || theirs.sleep4) why = `建议落在${pos}，拦住对方即将成型的四连。`;
    else if (mine.live3) why = `建议落在${pos}，做成活三，下一步容易变成冲四。`;
    else if (theirs.live3) why = `建议落在${pos}，先拆掉对方的活三。`;
    else why = `建议落在${pos}，靠近己方棋形、兼顾中腹。`;
    return `${who}${why}`;
  },
  legalHighlights(state: GomokuState) { return legalMoves(state); },
};
