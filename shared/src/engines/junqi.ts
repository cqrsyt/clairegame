/** 斗兽棋子集（常作军棋入门）。完整陆战棋暗子/军旗可增强。 */
export type JPiece = { side: 0 | 1; rank: number } | null;
export interface JunqiState {
  board: JPiece[][];
  turn: 0 | 1;
  winner: null | 0 | 1;
  last: { r: number; c: number } | null;
  log: string[];
}

export const ANIMALS = ['象', '狮', '虎', '豹', '狼', '狗', '猫', '鼠'];
// rank 8..1
const START: [number, number, 0 | 1, number][] = [
  [0, 0, 1, 7], [0, 2, 1, 8], [0, 4, 1, 6], [0, 6, 1, 3],
  [1, 1, 1, 2], [1, 5, 1, 4], [2, 0, 1, 1], [2, 6, 1, 5],
  [8, 0, 0, 5], [8, 6, 0, 1], [7, 1, 0, 4], [7, 5, 0, 2],
  [6, 0, 0, 3], [6, 2, 0, 6], [6, 4, 0, 8], [6, 6, 0, 7],
];

export function isRiver(r: number, c: number) {
  return (r === 3 || r === 4 || r === 5) && (c === 1 || c === 2 || c === 4 || c === 5);
}
export function isDen(r: number, c: number, side?: 0 | 1) {
  if (r === 0 && c === 3) return side === undefined || side === 0;
  if (r === 8 && c === 3) return side === undefined || side === 1;
  return false;
}
export function isTrap(r: number, c: number) {
  return (r === 0 && (c === 2 || c === 4)) || (r === 1 && c === 3)
    || (r === 8 && (c === 2 || c === 4)) || (r === 7 && c === 3);
}

export function createJunqi(): JunqiState {
  const board: JPiece[][] = Array.from({ length: 9 }, () => Array(7).fill(null));
  for (const [r, c, side, rank] of START) board[r][c] = { side, rank };
  return { board, turn: 0, winner: null, last: null, log: ['红方先走。象吃全兽，鼠可吃象；河中仅鼠可游。'] };
}

function inB(r: number, c: number) { return r >= 0 && c >= 0 && r < 9 && c < 7; }

function canEnterRiver(p: JPiece, r: number, c: number) {
  if (!p) return false;
  if (!isRiver(r, c)) return true;
  return p.rank === 1; // rat
}

function beats(att: NonNullable<JPiece>, def: NonNullable<JPiece>, trap: boolean) {
  if (trap) return true;
  if (att.rank === 1 && def.rank === 8) return true;
  if (att.rank === 8 && def.rank === 1) return false;
  return att.rank >= def.rank;
}

function jumpPathClear(board: JPiece[][], fr: number, fc: number, tr: number, tc: number) {
  if (fr === tr) {
    const step = tc > fc ? 1 : -1;
    for (let c = fc + step; c !== tc; c += step) if (board[fr][c]) return false;
    return true;
  }
  if (fc === tc) {
    const step = tr > fr ? 1 : -1;
    for (let r = fr + step; r !== tr; r += step) if (board[r][fc]) return false;
    return true;
  }
  return false;
}

export function junqiLegal(s: JunqiState, fr: number, fc: number): { r: number; c: number }[] {
  const p = s.board[fr][fc];
  if (!p || p.side !== s.turn || s.winner !== null) return [];
  const out: { r: number; c: number }[] = [];
  const tryMove = (r: number, c: number) => {
    if (!inB(r, c) || isDen(r, c, p.side)) return;
    if (!canEnterRiver(p, r, c)) return;
    const t = s.board[r][c];
    if (t && t.side === p.side) return;
    if (isRiver(fr, fc) && isRiver(r, c) && (fr !== r && fc !== c)) return;
    if (t && !beats(p, t, isTrap(r, c))) return;
    out.push({ r, c });
  };
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) tryMove(fr + dr, fc + dc);
  // lion/tiger jump river
  if (p.rank === 7 || p.rank === 6) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let r = fr + dr, c = fc + dc;
      if (!inB(r, c) || !isRiver(r, c)) continue;
      while (inB(r, c) && isRiver(r, c)) { r += dr; c += dc; }
      if (!inB(r, c)) continue;
      if (!jumpPathClear(s.board, fr, fc, r, c)) continue;
      const t = s.board[r][c];
      if (t && t.side === p.side) continue;
      if (t && !beats(p, t, isTrap(r, c))) continue;
      if (!isDen(r, c, p.side)) out.push({ r, c });
    }
  }
  return out;
}

export function applyJunqi(s: JunqiState, fr: number, fc: number, tr: number, tc: number): JunqiState {
  const legal = junqiLegal(s, fr, fc).some((m) => m.r === tr && m.c === tc);
  if (!legal) return s;
  const board = s.board.map((row) => row.slice());
  const p = board[fr][fc]!;
  const t = board[tr][tc];
  board[tr][tc] = p;
  board[fr][fc] = null;
  const log = s.log.slice();
  if (t) log.unshift(`${ANIMALS[8 - p.rank]} 吃掉 ${ANIMALS[8 - t.rank]}`);
  let winner: null | 0 | 1 = null;
  if (isDen(tr, tc) && !isDen(tr, tc, p.side)) winner = p.side;
  const oppHas = board.flat().some((x) => x && x.side !== p.side);
  if (!oppHas) winner = p.side;
  return { board, turn: (1 - s.turn) as 0 | 1, winner, last: { r: tr, c: tc }, log: log.slice(0, 24) };
}

function adjHas(board: JPiece[][], r: number, c: number, pred: (p: NonNullable<JPiece>) => boolean) {
  for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const rr = r + dr, cc = c + dc;
    if (!inB(rr, cc)) continue;
    const x = board[rr][cc];
    if (x && pred(x)) return true;
  }
  return false;
}

export function junqiAI(s: JunqiState) {
  const moves: { fr: number; fc: number; tr: number; tc: number; sc: number }[] = [];
  const enemyDenR = s.turn === 0 ? 0 : 8;
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 7; c++) {
      const p = s.board[r][c];
      if (!p || p.side !== s.turn) continue;
      for (const m of junqiLegal(s, r, c)) {
        let sc = 0;
        const t = s.board[m.r][m.c];
        const trap = isTrap(m.r, m.c);
        if (t) sc += t.rank * 12 + 8;
        if (isDen(m.r, m.c) && !isDen(m.r, m.c, p.side)) sc += 1000;
        sc += (p.side === 0 ? (8 - m.r) : m.r) * 3; // 向对方兽穴推进
        if (trap && !t) sc -= 28; // 空陷阱别随便踩
        if (trap && t && t.side !== p.side) sc += 20; // 陷阱里的敌子可被任意棋吃
        if (p.rank === 8 && adjHas(s.board, m.r, m.c, (x) => x.side !== p.side && x.rank === 1)) sc -= 50; // 象避开鼠
        if (p.rank === 1 && isRiver(m.r, m.c)) sc += 14; // 鼠控河
        if ((p.rank === 7 || p.rank === 6) && Math.abs(m.r - r) + Math.abs(m.c - c) > 1) sc += 10; // 狮虎跳河
        if (Math.abs(m.r - enemyDenR) + Math.abs(m.c - 3) < Math.abs(r - enemyDenR) + Math.abs(c - 3)) sc += 6;
        moves.push({ fr: r, fc: c, tr: m.r, tc: m.c, sc });
      }
    }
  if (!moves.length) return null;
  moves.sort((a, b) => b.sc - a.sc);
  return moves[0];
}

export const junqiCoach = {
  suggestMove(state: JunqiState) { return junqiAI(state); },
  explain(state: JunqiState, suggested?: { fr: number; fc: number; tr: number; tc: number } | null) {
    if (state.winner !== null) return state.winner === 0 ? '红方走进对方兽穴，这一局结束。' : '蓝方走进对方兽穴，这一局结束。';
    if (suggested === null) return state.turn === 0 ? '请您走红棋。' : '请稍候，蓝方正在思考。';
    const m = suggested === undefined ? junqiAI(state) : suggested;
    const who = state.turn === 0 ? '请您走红棋。' : '轮到蓝棋。';
    if (!m) return `${who}没有可走的棋了。`;
    const p = state.board[m.fr][m.fc];
    const name = p ? ANIMALS[8 - p.rank] : '棋';
    const dest = `第 ${m.tr + 1} 行第 ${m.tc + 1} 列`;
    const t = state.board[m.tr][m.tc];
    let why = `建议把${name}走到${dest}。`;
    if (isDen(m.tr, m.tc) && p && !isDen(m.tr, m.tc, p.side)) why = `建议把${name}送进对方兽穴（${dest}），这一手可以取胜。`;
    else if (t) why = `建议用${name}走到${dest}，去吃对方的${ANIMALS[8 - t.rank]}。`;
    else if (isTrap(m.tr, m.tc)) why = `建议把${name}走进陷阱格（${dest}）时要小心，陷阱里的棋会被任何棋吃掉。`;
    else why = `建议把${name}走到${dest}，向对方兽穴推进。`;
    return `${who}${why}`;
  },
  legalHighlights() { return []; },
};
