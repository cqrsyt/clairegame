/** Xiangqi — 9x10 board, red at bottom (rows 7-9), black at top (rows 0-2) */
export type XPiece =
  | 'RK' | 'RA' | 'RB' | 'RN' | 'RR' | 'RC' | 'RP'
  | 'BK' | 'BA' | 'BB' | 'BN' | 'BR' | 'BC' | 'BP'
  | null;

export interface XiangqiState {
  board: XPiece[][];
  turn: 'R' | 'B';
  winner: 'R' | 'B' | null;
}

const ROWS = 10, COLS = 9;

export function createXiangqi(): XiangqiState {
  const e = null;
  const board: XPiece[][] = [
    ['BR','BN','BB','BA','BK','BA','BB','BN','BR'],
    [e,e,e,e,e,e,e,e,e],
    [e,'BC',e,e,e,e,e,'BC',e],
    ['BP',e,'BP',e,'BP',e,'BP',e,'BP'],
    [e,e,e,e,e,e,e,e,e],
    [e,e,e,e,e,e,e,e,e],
    ['RP',e,'RP',e,'RP',e,'RP',e,'RP'],
    [e,'RC',e,e,e,e,e,'RC',e],
    [e,e,e,e,e,e,e,e,e],
    ['RR','RN','RB','RA','RK','RA','RB','RN','RR'],
  ];
  return { board, turn: 'R', winner: null };
}

function sideOf(p: XPiece): 'R' | 'B' | null {
  if (!p) return null;
  return p[0] as 'R' | 'B';
}
function kind(p: XPiece) { return p ? p.slice(1) : ''; }
function inBound(r: number, c: number) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }
function inPalace(r: number, c: number, side: 'R' | 'B') {
  if (c < 3 || c > 5) return false;
  return side === 'R' ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
}
function crossedRiver(r: number, side: 'R' | 'B') {
  return side === 'R' ? r <= 4 : r >= 5;
}

function findKing(board: XPiece[][], side: 'R' | 'B') {
  const t = side === 'R' ? 'RK' : 'BK';
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === t) return { r, c };
  return { r: -1, c: -1 };
}

function flyingGeneral(board: XPiece[][]): boolean {
  const rk = findKing(board, 'R');
  const bk = findKing(board, 'B');
  if (rk.c !== bk.c) return false;
  const c = rk.c;
  const [lo, hi] = rk.r < bk.r ? [rk.r, bk.r] : [bk.r, rk.r];
  for (let r = lo + 1; r < hi; r++) if (board[r][c]) return false;
  return true;
}

function rawMoves(state: XiangqiState, r: number, c: number): { r: number; c: number }[] {
  const p = state.board[r][c];
  if (!p) return [];
  const side = sideOf(p)!;
  const k = kind(p);
  const moves: { r: number; c: number }[] = [];
  const tryPush = (rr: number, cc: number) => {
    if (!inBound(rr, cc)) return;
    const t = state.board[rr][cc];
    if (!t || sideOf(t) !== side) moves.push({ r: rr, c: cc });
  };

  if (k === 'K') {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const rr = r + dr, cc = c + dc;
      if (inPalace(rr, cc, side)) tryPush(rr, cc);
    }
  } else if (k === 'A') {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const rr = r + dr, cc = c + dc;
      if (inPalace(rr, cc, side)) tryPush(rr, cc);
    }
  } else if (k === 'B') {
    for (const [dr, dc] of [[-2,-2],[-2,2],[2,-2],[2,2]]) {
      const rr = r + dr, cc = c + dc;
      const er = r + dr / 2, ec = c + dc / 2;
      if (!inBound(rr, cc) || state.board[er][ec]) continue;
      if (side === 'R' && rr < 5) continue;
      if (side === 'B' && rr > 4) continue;
      tryPush(rr, cc);
    }
  } else if (k === 'N') {
    const legs = [
      { leg: [-1,0], dest: [[-2,-1],[-2,1]] },
      { leg: [1,0], dest: [[2,-1],[2,1]] },
      { leg: [0,-1], dest: [[-1,-2],[1,-2]] },
      { leg: [0,1], dest: [[-1,2],[1,2]] },
    ];
    for (const L of legs) {
      const lr = r + L.leg[0], lc = c + L.leg[1];
      if (!inBound(lr, lc) || state.board[lr][lc]) continue;
      for (const [dr, dc] of L.dest) tryPush(r + dr, c + dc);
    }
  } else if (k === 'R') {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let rr = r + dr, cc = c + dc;
      while (inBound(rr, cc)) {
        if (!state.board[rr][cc]) moves.push({ r: rr, c: cc });
        else { tryPush(rr, cc); break; }
        rr += dr; cc += dc;
      }
    }
  } else if (k === 'C') {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let rr = r + dr, cc = c + dc;
      let jumped = false;
      while (inBound(rr, cc)) {
        if (!jumped) {
          if (!state.board[rr][cc]) moves.push({ r: rr, c: cc });
          else jumped = true;
        } else {
          if (state.board[rr][cc]) { tryPush(rr, cc); break; }
        }
        rr += dr; cc += dc;
      }
    }
  } else if (k === 'P') {
    const forward = side === 'R' ? -1 : 1;
    tryPush(r + forward, c);
    if (crossedRiver(r, side)) {
      tryPush(r, c - 1);
      tryPush(r, c + 1);
    }
  }
  return moves;
}

export function isInCheck(state: XiangqiState, side: 'R' | 'B'): boolean {
  const king = findKing(state.board, side);
  const opp = side === 'R' ? 'B' : 'R';
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (sideOf(state.board[r][c]) !== opp) continue;
      if (rawMoves({ ...state, turn: opp }, r, c).some((m) => m.r === king.r && m.c === king.c))
        return true;
    }
  if (flyingGeneral(state.board)) return true;
  return false;
}

export function xiangqiLegalFrom(state: XiangqiState, r: number, c: number) {
  const p = state.board[r][c];
  if (!p || sideOf(p) !== state.turn || state.winner) return [];
  return rawMoves(state, r, c).filter((m) => {
    const next = applyXiangqiMove(state, r, c, m.r, m.c, true);
    return !isInCheck(next, state.turn) && !flyingGeneral(next.board);
  });
}

export function allLegal(state: XiangqiState) {
  const out: { fr: number; fc: number; tr: number; tc: number }[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      for (const m of xiangqiLegalFrom(state, r, c))
        out.push({ fr: r, fc: c, tr: m.r, tc: m.c });
  return out;
}

export function applyXiangqiMove(state: XiangqiState, fr: number, fc: number, tr: number, tc: number, skip = false): XiangqiState {
  if (!skip) {
    if (!xiangqiLegalFrom(state, fr, fc).some((m) => m.r === tr && m.c === tc)) return state;
  }
  const board = state.board.map((row) => row.slice()) as XPiece[][];
  const captured = board[tr][tc];
  board[tr][tc] = board[fr][fc];
  board[fr][fc] = null;
  const next: XiangqiState = {
    board,
    turn: state.turn === 'R' ? 'B' : 'R',
    winner: null,
  };
  if (captured === 'RK') next.winner = 'B';
  else if (captured === 'BK') next.winner = 'R';
  else if (!skip && allLegal(next).length === 0) next.winner = state.turn;
  return next;
}

const VAL: Record<string, number> = { K: 10000, R: 900, C: 450, N: 400, B: 200, A: 200, P: 100 };

function evalX(state: XiangqiState, side: 'R' | 'B') {
  let s = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const v = VAL[kind(p)] || 0;
      s += sideOf(p) === side ? v : -v;
    }
  return s;
}

export function xiangqiAI(state: XiangqiState) {
  const moves = allLegal(state);
  if (!moves.length) return null;
  const me = state.turn;
  let best = moves[0], bestScore = -Infinity;
  for (const m of moves) {
    const next = applyXiangqiMove(state, m.fr, m.fc, m.tr, m.tc);
    if (next.winner === me) return m;
    let sc = evalX(next, me);
    if (isInCheck(next, next.turn)) sc += 50;
    if (sc > bestScore) { bestScore = sc; best = m; }
  }
  return best;
}

export const xiangqiCoach = {
  suggestMove(state: XiangqiState) { return xiangqiAI(state); },
  explain(state: XiangqiState) {
    if (state.winner) return state.winner === 'R' ? '红方胜利！' : '黑方胜利！';
    if (isInCheck(state, state.turn)) return '将军！必须应将。';
    return state.turn === 'R' ? '红方行棋。注意炮架与车的通路。' : '黑方行棋。留意过河兵与马的卧槽。';
  },
  legalHighlights(state: XiangqiState) { return allLegal(state); },
};
