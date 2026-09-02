/** Xiangqi — 9x10 board, red at bottom (rows 7-9), black at top (rows 0-2) */
export type XPiece =
  | 'RK' | 'RA' | 'RB' | 'RN' | 'RR' | 'RC' | 'RP'
  | 'BK' | 'BA' | 'BB' | 'BN' | 'BR' | 'BC' | 'BP'
  | null;

export interface XiangqiState {
  board: XPiece[][];
  turn: 'R' | 'B';
  winner: 'R' | 'B' | null;
  lastMove: { fr: number; fc: number; tr: number; tc: number } | null;
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
  return { board, turn: 'R', winner: null, lastMove: null };
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
    lastMove: { fr, fc, tr, tc },
  };
  if (captured === 'RK') next.winner = 'B';
  else if (captured === 'BK') next.winner = 'R';
  else if (!skip && allLegal(next).length === 0) next.winner = state.turn;
  return next;
}

const VAL: Record<string, number> = { K: 10000, R: 900, C: 450, N: 400, B: 200, A: 200, P: 100 };

function evalX(state: XiangqiState, side: 'R' | 'B') {
  let s = 0;
  const myK = findKing(state.board, side);
  const opK = findKing(state.board, side === 'R' ? 'B' : 'R');
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const k = kind(p);
      const mine = sideOf(p) === side;
      let v = VAL[k] || 0;
      if (k === 'P') {
        if (crossedRiver(r, sideOf(p)!)) v += 40;
        if (c === 4) v += 12; // 中兵
        v += (sideOf(p) === 'R' ? 9 - r : r) * 4;
      }
      if (k === 'N') {
        // 马腿通畅略加分
        const blocked = [[-1,0],[1,0],[0,-1],[0,1]].filter(([dr, dc]) => inBound(r+dr, c+dc) && state.board[r+dr][c+dc]).length;
        v += 18 - blocked * 6;
      }
      if (k === 'C') {
        if (c === 4 || r === myK.r || c === opK.c) v += 18; // 中炮 / 沉底意识
      }
      if (k === 'R' && (c === 4 || r === 0 || r === 9)) v += 10;
      if ((k === 'A' || k === 'B') && inPalace(myK.r, myK.c, sideOf(p)!)) v += 8;
      s += mine ? v : -v;
    }
  if (isInCheck(state, side)) s -= 80;
  if (isInCheck(state, side === 'R' ? 'B' : 'R')) s += 55;
  // 将帅安全：偏中、有士象
  s += (3 - Math.abs(myK.c - 4)) * 8;
  s -= (3 - Math.abs(opK.c - 4)) * 6;
  return s;
}

function xiangqiBook(state: XiangqiState) {
  const b = state.board;
  const legal = (fr: number, fc: number, tr: number, tc: number) =>
    xiangqiLegalFrom(state, fr, fc).some((m) => m.r === tr && m.c === tc);
  if (state.turn === 'R') {
    if (b[7][1] === 'RC' && !b[7][4] && legal(7, 1, 7, 4)) return { fr: 7, fc: 1, tr: 7, tc: 4 }; // 炮二平五
    if (b[7][7] === 'RC' && !b[7][4] && legal(7, 7, 7, 4)) return { fr: 7, fc: 7, tr: 7, tc: 4 };
    if (b[9][1] === 'RN' && legal(9, 1, 7, 2)) return { fr: 9, fc: 1, tr: 7, tc: 2 }; // 马二进三
    if (b[9][7] === 'RN' && legal(9, 7, 7, 6)) return { fr: 9, fc: 7, tr: 7, tc: 6 };
    if (b[6][4] === 'RP' && legal(6, 4, 5, 4)) return { fr: 6, fc: 4, tr: 5, tc: 4 }; // 中兵
  } else {
    if (b[2][7] === 'BC' && !b[2][4] && legal(2, 7, 2, 4)) return { fr: 2, fc: 7, tr: 2, tc: 4 }; // 炮8平5
    if (b[2][1] === 'BC' && !b[2][4] && legal(2, 1, 2, 4)) return { fr: 2, fc: 1, tr: 2, tc: 4 };
    if (b[0][7] === 'BN' && legal(0, 7, 2, 6)) return { fr: 0, fc: 7, tr: 2, tc: 6 };
    if (b[0][1] === 'BN' && legal(0, 1, 2, 2)) return { fr: 0, fc: 1, tr: 2, tc: 2 };
    if (b[3][4] === 'BP' && legal(3, 4, 4, 4)) return { fr: 3, fc: 4, tr: 4, tc: 4 };
  }
  return null;
}

function orderX(state: XiangqiState, moves: { fr: number; fc: number; tr: number; tc: number }[]) {
  return moves.slice().sort((a, b) => {
    const va = state.board[a.tr][a.tc] ? VAL[kind(state.board[a.tr][a.tc]!)] : 0;
    const vb = state.board[b.tr][b.tc] ? VAL[kind(state.board[b.tr][b.tc]!)] : 0;
    return vb - va;
  });
}

function evalXQuiet(state: XiangqiState, me: 'R' | 'B', m: { fr: number; fc: number; tr: number; tc: number }) {
  const next = applyXiangqiMove(state, m.fr, m.fc, m.tr, m.tc, true);
  if (next.winner === me) return 1e6;
  if (next.winner && next.winner !== me) return -1e6;
  let sc = evalX(next, me);
  if (isInCheck(next, next.turn)) sc += 40;
  return sc;
}

export function xiangqiAI(state: XiangqiState) {
  if (state.winner) return null;
  const book = xiangqiBook(state);
  if (book) return book;
  const moves = orderX(state, allLegal(state));
  if (!moves.length) return null;
  const me = state.turn;
  let best = moves[0], bestScore = -Infinity;
  const rootCap = Math.min(moves.length, 28);
  for (let i = 0; i < rootCap; i++) {
    const m = moves[i];
    const next = applyXiangqiMove(state, m.fr, m.fc, m.tr, m.tc);
    if (next.winner === me) return m;
    const replies = orderX(next, allLegal(next)).slice(0, 18);
    let worst = replies.length ? Infinity : evalX(next, me);
    for (const r of replies) {
      const n2 = applyXiangqiMove(next, r.fr, r.fc, r.tr, r.tc, true);
      if (n2.winner && n2.winner !== me) { worst = -99999; break; }
      worst = Math.min(worst, evalX(n2, me));
    }
    const sc = replies.length ? worst : evalXQuiet(state, me, m);
    if (sc > bestScore) { bestScore = sc; best = m; }
  }
  return best;
}

const CN_FILE = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function xqPieceName(p: XPiece) {
  if (!p) return '棋';
  const red: Record<string, string> = { K: '帅', A: '仕', B: '相', N: '马', R: '车', C: '炮', P: '兵' };
  const black: Record<string, string> = { K: '将', A: '士', B: '象', N: '马', R: '车', C: '炮', P: '卒' };
  return (p[0] === 'R' ? red : black)[kind(p)] || '棋';
}

export type XiangqiMove = { fr: number; fc: number; tr: number; tc: number };

export function xiangqiNotation(state: XiangqiState, m: XiangqiMove) {
  const p = state.board[m.fr][m.fc];
  if (!p) return '';
  const red = p[0] === 'R';
  const name = xqPieceName(p);
  const fromFile = red ? 9 - m.fc : m.fc + 1;
  const toFile = red ? 9 - m.tc : m.tc + 1;
  const k = kind(p);
  if (m.fr === m.tr) return `${name}${CN_FILE[fromFile]}平${CN_FILE[toFile]}`;
  const forward = red ? m.tr < m.fr : m.tr > m.fr;
  const verb = forward ? '进' : '退';
  if (k === 'N' || k === 'B' || k === 'A') return `${name}${CN_FILE[fromFile]}${verb}${CN_FILE[toFile]}`;
  return `${name}${CN_FILE[fromFile]}${verb}${CN_FILE[Math.abs(m.tr - m.fr)]}`;
}

export const xiangqiCoach = {
  suggestMove(state: XiangqiState) { return xiangqiAI(state); },
  explain(state: XiangqiState, suggested?: XiangqiMove | null) {
    if (state.winner) return state.winner === 'R' ? '红方将死对方，这一局结束。' : '黑方将死对方，这一局结束。';
    if (suggested === null) return state.turn === 'R' ? '请您走红棋。' : '请稍候，黑方正在思考。';
    const m = suggested === undefined ? xiangqiAI(state) : suggested;
    const who = isInCheck(state, state.turn)
      ? '将军！请先应将。'
      : (state.turn === 'R' ? '请您走红棋。' : '轮到黑棋。');
    if (!m) return `${who}没有可走的棋了。`;
    const n = xiangqiNotation(state, m);
    const cap = state.board[m.tr][m.tc];
    let why: string;
    if (cap) why = `这手可以吃掉对方的${xqPieceName(cap)}。`;
    else if (isInCheck(state, state.turn)) why = '躲将、垫子或反吃，先把将解开。';
    else if (kind(state.board[m.fr][m.fc]) === 'C' && m.tc === 4 && m.fr === m.tr) why = '炮架到中路，隔子打将很常见。';
    else why = '这是当前局面比较稳妥的一手。';
    return `${who}建议走「${n}」。${why}`;
  },
  legalHighlights(state: XiangqiState) { return allLegal(state); },
};
