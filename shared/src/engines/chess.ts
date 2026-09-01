export type Piece =
  | 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'
  | 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
  | null;
export type ChessBoard = Piece[][];

export interface ChessState {
  board: ChessBoard;
  turn: 'w' | 'b';
  castling: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  ep: { r: number; c: number } | null;
  winner: 'w' | 'b' | 'draw' | null;
  halfmove: number;
}

const START: string[] = [
  'rnbqkbnr',
  'pppppppp',
  '........',
  '........',
  '........',
  '........',
  'PPPPPPPP',
  'RNBQKBNR',
];

export function createChess(): ChessState {
  const board = START.map((row) =>
    row.split('').map((ch) => (ch === '.' ? null : (ch as Piece)))
  );
  return {
    board,
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    ep: null,
    winner: null,
    halfmove: 0,
  };
}

function isWhite(p: Piece) { return !!p && p === p.toUpperCase(); }
function isBlack(p: Piece) { return !!p && p === p.toLowerCase(); }
function colorOf(p: Piece): 'w' | 'b' | null {
  if (!p) return null;
  return isWhite(p) ? 'w' : 'b';
}
function inBound(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function findKing(board: ChessBoard, side: 'w' | 'b'): { r: number; c: number } {
  const target = side === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === target) return { r, c };
  return { r: -1, c: -1 };
}

function attackedBy(board: ChessBoard, r: number, c: number, by: 'w' | 'b'): boolean {
  const enemyPawn = by === 'w' ? 'P' : 'p';
  const pr = by === 'w' ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    if (inBound(pr, c + dc) && board[pr][c + dc] === enemyPawn) return true;
  }
  const kn = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of kn) {
    const rr = r + dr, cc = c + dc;
    if (!inBound(rr, cc)) continue;
    const p = board[rr][cc];
    if (p && colorOf(p) === by && p.toLowerCase() === 'n') return true;
  }
  const kingD = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of kingD) {
    const rr = r + dr, cc = c + dc;
    if (!inBound(rr, cc)) continue;
    const p = board[rr][cc];
    if (p && colorOf(p) === by && p.toLowerCase() === 'k') return true;
  }
  const rays: { d: number[][]; pieces: string[] }[] = [
    { d: [[-1,0],[1,0],[0,-1],[0,1]], pieces: ['r', 'q'] },
    { d: [[-1,-1],[-1,1],[1,-1],[1,1]], pieces: ['b', 'q'] },
  ];
  for (const ray of rays) {
    for (const [dr, dc] of ray.d) {
      let rr = r + dr, cc = c + dc;
      while (inBound(rr, cc)) {
        const p = board[rr][cc];
        if (p) {
          if (colorOf(p) === by && ray.pieces.includes(p.toLowerCase())) return true;
          break;
        }
        rr += dr; cc += dc;
      }
    }
  }
  return false;
}

export function inCheck(state: ChessState, side?: 'w' | 'b'): boolean {
  const s = side ?? state.turn;
  const k = findKing(state.board, s);
  return attackedBy(state.board, k.r, k.c, s === 'w' ? 'b' : 'w');
}

function rawMoves(state: ChessState, r: number, c: number): { r: number; c: number }[] {
  const p = state.board[r][c];
  if (!p) return [];
  const side = colorOf(p)!;
  const moves: { r: number; c: number }[] = [];
  const enemy = (rr: number, cc: number) => {
    const q = state.board[rr][cc];
    return !!q && colorOf(q) !== side;
  };
  const empty = (rr: number, cc: number) => !state.board[rr][cc];
  const push = (rr: number, cc: number) => {
    if (!inBound(rr, cc)) return;
    const q = state.board[rr][cc];
    if (!q || colorOf(q) !== side) moves.push({ r: rr, c: cc });
  };
  const slide = (dirs: number[][]) => {
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inBound(rr, cc)) {
        if (empty(rr, cc)) { moves.push({ r: rr, c: cc }); }
        else { if (enemy(rr, cc)) moves.push({ r: rr, c: cc }); break; }
        rr += dr; cc += dc;
      }
    }
  };
  const t = p.toLowerCase();
  if (t === 'p') {
    const dir = side === 'w' ? -1 : 1;
    const start = side === 'w' ? 6 : 1;
    if (empty(r + dir, c)) {
      moves.push({ r: r + dir, c });
      if (r === start && empty(r + 2 * dir, c)) moves.push({ r: r + 2 * dir, c });
    }
    for (const dc of [-1, 1]) {
      const rr = r + dir, cc = c + dc;
      if (inBound(rr, cc) && enemy(rr, cc)) moves.push({ r: rr, c: cc });
      if (state.ep && state.ep.r === rr && state.ep.c === cc) moves.push({ r: rr, c: cc });
    }
  } else if (t === 'n') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) push(r+dr, c+dc);
  } else if (t === 'b') slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
  else if (t === 'r') slide([[-1,0],[1,0],[0,-1],[0,1]]);
  else if (t === 'q') slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
  else if (t === 'k') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) push(r+dr, c+dc);
    // castling
    if (side === 'w' && r === 7 && c === 4) {
      if (state.castling.wK && empty(7,5) && empty(7,6) &&
          !attackedBy(state.board,7,4,'b') && !attackedBy(state.board,7,5,'b') && !attackedBy(state.board,7,6,'b'))
        moves.push({ r: 7, c: 6 });
      if (state.castling.wQ && empty(7,3) && empty(7,2) && empty(7,1) &&
          !attackedBy(state.board,7,4,'b') && !attackedBy(state.board,7,3,'b') && !attackedBy(state.board,7,2,'b'))
        moves.push({ r: 7, c: 2 });
    }
    if (side === 'b' && r === 0 && c === 4) {
      if (state.castling.bK && empty(0,5) && empty(0,6) &&
          !attackedBy(state.board,0,4,'w') && !attackedBy(state.board,0,5,'w') && !attackedBy(state.board,0,6,'w'))
        moves.push({ r: 0, c: 6 });
      if (state.castling.bQ && empty(0,3) && empty(0,2) && empty(0,1) &&
          !attackedBy(state.board,0,4,'w') && !attackedBy(state.board,0,3,'w') && !attackedBy(state.board,0,2,'w'))
        moves.push({ r: 0, c: 2 });
    }
  }
  return moves;
}

export function chessLegalFrom(state: ChessState, r: number, c: number): { r: number; c: number }[] {
  const p = state.board[r][c];
  if (!p || colorOf(p) !== state.turn || state.winner) return [];
  return rawMoves(state, r, c).filter((m) => {
    const next = applyChessMove(state, r, c, m.r, m.c, true);
    return !inCheck(next, state.turn);
  });
}

export function allLegalMoves(state: ChessState): { fr: number; fc: number; tr: number; tc: number }[] {
  const out: { fr: number; fc: number; tr: number; tc: number }[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      for (const m of chessLegalFrom(state, r, c))
        out.push({ fr: r, fc: c, tr: m.r, tc: m.c });
  return out;
}

export function applyChessMove(state: ChessState, fr: number, fc: number, tr: number, tc: number, skipLegal = false): ChessState {
  if (!skipLegal) {
    const legal = chessLegalFrom(state, fr, fc).some((m) => m.r === tr && m.c === tc);
    if (!legal) return state;
  }
  const board = state.board.map((row) => row.slice()) as ChessBoard;
  const piece = board[fr][fc];
  let ep: ChessState['ep'] = null;
  let halfmove = state.halfmove + 1;
  // en passant capture
  if (piece && piece.toLowerCase() === 'p' && state.ep && tr === state.ep.r && tc === state.ep.c) {
    board[fr][tc] = null;
  }
  if (piece && piece.toLowerCase() === 'p' && Math.abs(tr - fr) === 2) {
    ep = { r: (fr + tr) / 2, c: fc };
  }
  if (board[tr][tc] || (piece && piece.toLowerCase() === 'p')) halfmove = 0;
  board[tr][tc] = piece;
  board[fr][fc] = null;
  // promotion
  if (piece === 'P' && tr === 0) board[tr][tc] = 'Q';
  if (piece === 'p' && tr === 7) board[tr][tc] = 'q';
  // castling rook move
  const castling = { ...state.castling };
  if (piece === 'K') {
    castling.wK = castling.wQ = false;
    if (fr === 7 && fc === 4 && tr === 7 && tc === 6) { board[7][5] = 'R'; board[7][7] = null; }
    if (fr === 7 && fc === 4 && tr === 7 && tc === 2) { board[7][3] = 'R'; board[7][0] = null; }
  }
  if (piece === 'k') {
    castling.bK = castling.bQ = false;
    if (fr === 0 && fc === 4 && tr === 0 && tc === 6) { board[0][5] = 'r'; board[0][7] = null; }
    if (fr === 0 && fc === 4 && tr === 0 && tc === 2) { board[0][3] = 'r'; board[0][0] = null; }
  }
  if (piece === 'R' && fr === 7 && fc === 0) castling.wQ = false;
  if (piece === 'R' && fr === 7 && fc === 7) castling.wK = false;
  if (piece === 'r' && fr === 0 && fc === 0) castling.bQ = false;
  if (piece === 'r' && fr === 0 && fc === 7) castling.bK = false;

  const next: ChessState = {
    board,
    turn: state.turn === 'w' ? 'b' : 'w',
    castling,
    ep,
    winner: null,
    halfmove,
  };
  if (!skipLegal) {
    const moves = allLegalMoves(next);
    if (moves.length === 0) {
      next.winner = inCheck(next) ? state.turn : 'draw';
    }
  }
  return next;
}

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

function evalBoard(state: ChessState, side: 'w' | 'b'): number {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const v = VAL[p.toLowerCase()] || 0;
      const center = 3.5;
      const pos = 8 - (Math.abs(r - center) + Math.abs(c - center));
      const s = v + pos * 2;
      score += colorOf(p) === side ? s : -s;
    }
  return score;
}

export function chessAI(state: ChessState): { fr: number; fc: number; tr: number; tc: number } | null {
  const moves = allLegalMoves(state);
  if (!moves.length) return null;
  const me = state.turn;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const next = applyChessMove(state, m.fr, m.fc, m.tr, m.tc);
    if (next.winner === me) return m;
    let sc = evalBoard(next, me);
    // one-ply opponent threat
    const replies = allLegalMoves(next).slice(0, 24);
    let worst = Infinity;
    for (const r of replies) {
      const n2 = applyChessMove(next, r.fr, r.fc, r.tr, r.tc);
      if (n2.winner && n2.winner !== me && n2.winner !== 'draw') { worst = -99999; break; }
      worst = Math.min(worst, evalBoard(n2, me));
    }
    if (replies.length) sc = sc * 0.4 + worst * 0.6;
    if (sc > bestScore) { bestScore = sc; best = m; }
  }
  return best;
}

export const chessCoach = {
  suggestMove(state: ChessState) { return chessAI(state); },
  explain(state: ChessState) {
    if (state.winner === 'draw') return '僵局，和棋。';
    if (state.winner) return state.winner === 'w' ? '白方胜利。' : '黑方胜利。';
    if (inCheck(state)) return '你正处于将军之中，必须应将！';
    return state.turn === 'w' ? '白方行棋。注意中心控制与子力协调。' : '黑方行棋。寻找战术打击点。';
  },
  legalHighlights(state: ChessState) { return allLegalMoves(state); },
};
