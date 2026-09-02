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
  lastMove: { fr: number; fc: number; tr: number; tc: number } | null;
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
    lastMove: null,
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
    lastMove: { fr, fc, tr, tc },
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
  let developed = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const t = p.toLowerCase();
      const v = VAL[t] || 0;
      const center = 3.5;
      const pos = 8 - (Math.abs(r - center) + Math.abs(c - center));
      let s = v + pos * (t === 'p' || t === 'n' || t === 'b' ? 3 : 1);
      const home = isWhite(p) ? 7 : 0;
      if ((t === 'n' || t === 'b') && r !== home) s += 22;
      if (t === 'k') {
        const safeFile = c === 6 || c === 2 || c === 1 || c === 5;
        if (safeFile && r === home) s += 45; // 易位后的王
        else if (c >= 3 && c <= 4 && r === home) s -= 18; // 滞留中路
        if (attackedBy(state.board, r, c, isWhite(p) ? 'b' : 'w')) s -= 60;
      }
      score += colorOf(p) === side ? s : -s;
      if (colorOf(p) === side && (t === 'n' || t === 'b') && r !== home) developed++;
    }
  score += developed * 6;
  const meCastle = side === 'w' ? (state.castling.wK || state.castling.wQ) : (state.castling.bK || state.castling.bQ);
  if (meCastle) score += 12;
  if (inCheck(state, side)) score -= 70;
  return score;
}

function chessBook(state: ChessState) {
  const b = state.board;
  const ok = (fr: number, fc: number, tr: number, tc: number) =>
    chessLegalFrom(state, fr, fc).some((m) => m.r === tr && m.c === tc);
  if (state.turn === 'w') {
    if (b[6][4] === 'P' && ok(6, 4, 4, 4)) return { fr: 6, fc: 4, tr: 4, tc: 4 }; // e4
    if (b[6][3] === 'P' && ok(6, 3, 4, 3)) return { fr: 6, fc: 3, tr: 4, tc: 3 }; // d4
    if (b[7][6] === 'N' && ok(7, 6, 5, 5)) return { fr: 7, fc: 6, tr: 5, tc: 5 }; // Nf3
    if (b[7][1] === 'N' && ok(7, 1, 5, 2)) return { fr: 7, fc: 1, tr: 5, tc: 2 }; // Nc3
    if (b[7][4] === 'K' && ok(7, 4, 7, 6)) return { fr: 7, fc: 4, tr: 7, tc: 6 }; // O-O
  } else {
    if (b[4][4] === 'P' && b[1][4] === 'p' && ok(1, 4, 3, 4)) return { fr: 1, fc: 4, tr: 3, tc: 4 }; // e5
    if (b[4][3] === 'P' && b[1][3] === 'p' && ok(1, 3, 3, 3)) return { fr: 1, fc: 3, tr: 3, tc: 3 }; // d5
    if (b[0][1] === 'n' && ok(0, 1, 2, 2)) return { fr: 0, fc: 1, tr: 2, tc: 2 }; // Nc6
    if (b[0][6] === 'n' && ok(0, 6, 2, 5)) return { fr: 0, fc: 6, tr: 2, tc: 5 }; // Nf6
    if (b[0][4] === 'k' && ok(0, 4, 0, 6)) return { fr: 0, fc: 4, tr: 0, tc: 6 };
  }
  return null;
}

function seeish(state: ChessState, m: { fr: number; fc: number; tr: number; tc: number }) {
  const vic = state.board[m.tr][m.tc];
  const att = state.board[m.fr][m.fc];
  if (!vic || !att) return 0;
  const gain = VAL[vic.toLowerCase()] || 0;
  const next = applyChessMove(state, m.fr, m.fc, m.tr, m.tc, true);
  const opp = state.turn === 'w' ? 'b' : 'w';
  if (attackedBy(next.board, m.tr, m.tc, opp)) return gain - (VAL[att.toLowerCase()] || 0) * 0.85;
  return gain;
}

export function chessAI(state: ChessState): { fr: number; fc: number; tr: number; tc: number } | null {
  if (state.winner) return null;
  const book = chessBook(state);
  if (book) return book;
  const moves = allLegalMoves(state);
  if (!moves.length) return null;
  moves.sort((a, b) => seeish(state, b) - seeish(state, a));
  const me = state.turn;
  let best = moves[0];
  let bestScore = -Infinity;
  const root = moves.slice(0, 32);
  for (const m of root) {
    const next = applyChessMove(state, m.fr, m.fc, m.tr, m.tc);
    if (next.winner === me) return m;
    let sc = evalBoard(next, me) + seeish(state, m) * 0.15;
    if (state.board[m.fr][m.fc]?.toLowerCase() === 'k' && Math.abs(m.tc - m.fc) === 2) sc += 80; // 易位
    const replies = allLegalMoves(next);
    replies.sort((a, b) => seeish(next, b) - seeish(next, a));
    let worst = replies.length ? Infinity : sc;
    for (const r of replies.slice(0, 22)) {
      const n2 = applyChessMove(next, r.fr, r.fc, r.tr, r.tc, true);
      if (n2.winner && n2.winner !== me && n2.winner !== 'draw') { worst = -99999; break; }
      worst = Math.min(worst, evalBoard(n2, me));
    }
    if (replies.length) sc = worst;
    if (sc > bestScore) { bestScore = sc; best = m; }
  }
  return best;
}

export type ChessMove = { fr: number; fc: number; tr: number; tc: number };

export function chessSq(r: number, c: number) {
  return `${'abcdefgh'[c]}${8 - r}`;
}

export function chessMoveLabel(state: ChessState, m: ChessMove) {
  const names: Record<string, string> = { p: '兵', n: '马', b: '象', r: '车', q: '后', k: '王' };
  const p = state.board[m.fr][m.fc];
  const name = names[(p || 'p').toLowerCase()] || '棋';
  if (p && p.toLowerCase() === 'k' && Math.abs(m.tc - m.fc) === 2) {
    return m.tc > m.fc ? '短易位' : '长易位';
  }
  return `${name}${chessSq(m.fr, m.fc)} 到 ${chessSq(m.tr, m.tc)}`;
}

export const chessCoach = {
  suggestMove(state: ChessState) { return chessAI(state); },
  explain(state: ChessState, suggested?: ChessMove | null) {
    if (state.winner === 'draw') return '双方无子可动，这是和棋。';
    if (state.winner) return state.winner === 'w' ? '白方将死，这一局结束。' : '黑方将死，这一局结束。';
    const names: Record<string, string> = { p: '兵', n: '马', b: '象', r: '车', q: '后', k: '王' };
    if (suggested === null) return state.turn === 'w' ? '请您走白棋。' : '请稍候，黑方正在思考。';
    const m = suggested === undefined ? chessAI(state) : suggested;
    const who = inCheck(state) ? '将军！请先应将。' : (state.turn === 'w' ? '请您走白棋。' : '轮到黑棋。');
    if (!m) return `${who}没有可走的棋了。`;
    const label = chessMoveLabel(state, m);
    const cap = state.board[m.tr][m.tc];
    let why: string;
    if (cap) why = `可以吃掉对方的${names[cap.toLowerCase()]}，请确认不会被白白反吃。`;
    else if (label.includes('易位')) why = '王向旁边跳两格，车绕到内侧，王会安全许多。';
    else if ([3, 4].includes(m.tr) && [3, 4].includes(m.tc)) why = '先占中心四格，后面出子会轻松一些。';
    else why = '这是当前局面比较稳妥的一手。';
    return `${who}建议走「${label}」。${why}`;
  },
  legalHighlights(state: ChessState) { return allLegalMoves(state); },
};
