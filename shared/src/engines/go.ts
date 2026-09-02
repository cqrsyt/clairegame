/** 十九路围棋：提子、禁自杀、简单劫；无完整目数，可增强。 */
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

export function createGo(size = 19): GoState {
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
  if (self.libs.size === 0) return s; // suicide
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
  // 子集：子数 + 提子，贴目 3.5 给白。目数与死子判定可增强。
  let b = s.captures[0], w = s.captures[1] + 3.5;
  for (const row of s.board) for (const v of row) {
    if (v === 1) b++;
    if (v === 2) w++;
  }
  return { b, w };
}

function isOwnEye(board: number[][], r: number, c: number, color: number) {
  if (board[r][c] !== 0) return false;
  const nbs = neighbors(board.length, r, c);
  if (!nbs.length) return false;
  return nbs.every(([nr, nc]) => board[nr][nc] === color);
}

function atariLiberties(board: number[][], color: number) {
  const seen = new Set<string>();
  const libs: { r: number; c: number; size: number }[] = [];
  const size = board.length;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== color) continue;
      const k = `${r},${c}`;
      if (seen.has(k)) continue;
      const g = groupAndLibs(board, r, c);
      for (const x of g.group) seen.add(x);
      if (g.libs.size === 1) {
        const [lr, lc] = [...g.libs][0].split(',').map(Number);
        libs.push({ r: lr, c: lc, size: g.group.size });
      }
    }
  return libs;
}

/** 星位：十九路为 4-4 / 天元等九点。 */
export function starPoints(size: number): [number, number][] {
  if (size >= 19) {
    const hs = [3, 9, 15];
    const out: [number, number][] = [];
    for (const r of hs) for (const c of hs) out.push([r, c]);
    return out;
  }
  if (size >= 13) {
    const hs = [3, 6, 9];
    const out: [number, number][] = [];
    for (const r of hs) for (const c of hs) out.push([r, c]);
    return out;
  }
  const d = 2;
  const m = Math.floor(size / 2);
  return [[d, d], [d, size - 1 - d], [size - 1 - d, d], [size - 1 - d, size - 1 - d], [m, m]];
}

export function isStarPoint(size: number, r: number, c: number) {
  return starPoints(size).some(([sr, sc]) => sr === r && sc === c);
}

/** 快启发式：不在 361 点上做 minimax。只看星位、邻子、打吃与气。 */
export function goAI(s: GoState): { r: number; c: number } | 'pass' {
  const me = s.turn;
  const opp = (3 - me) as GoColor;
  const size = s.size;
  const stones = s.board.flat().filter(Boolean).length;
  const oppAtari = atariLiberties(s.board, opp);
  const myAtari = atariLiberties(s.board, me);

  const cand = new Map<string, { r: number; c: number }>();
  const add = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    if (s.board[r][c] !== 0) return;
    if (s.ko && s.ko.r === r && s.ko.c === c) return;
    if (isOwnEye(s.board, r, c, me)) return;
    cand.set(`${r},${c}`, { r, c });
  };

  for (const [r, c] of starPoints(size)) add(r, c);
  for (const a of oppAtari) add(a.r, a.c);
  for (const a of myAtari) add(a.r, a.c);

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!s.board[r][c]) continue;
      for (const [nr, nc] of neighbors(size, r, c)) add(nr, nc);
    }

  if (stones < 30) {
    const line = size >= 19 ? 3 : 2;
    for (const r of [line, size - 1 - line]) {
      add(r, line);
      add(r, size - 1 - line);
      add(r, Math.floor(size / 2));
    }
    for (const c of [line, size - 1 - line]) {
      add(line, c);
      add(size - 1 - line, c);
      add(Math.floor(size / 2), c);
    }
  }

  if (!cand.size) {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) add(r, c);
  }

  const moves: { r: number; c: number; sc: number }[] = [];
  for (const { r, c } of cand.values()) {
    const next = playGo(s, r, c);
    if (next === s || next.board[r][c] === 0) continue;
    const g = groupAndLibs(next.board, r, c);
    let sc = 0;
    const captured = next.captures[me - 1] - s.captures[me - 1];
    sc += captured * 42;
    const hitOpp = oppAtari.find((a) => a.r === r && a.c === c);
    if (hitOpp) sc += 55 + hitOpp.size * 8;
    if (myAtari.some((a) => a.r === r && a.c === c)) sc += 48;
    sc += Math.min(4, g.libs.size) * 6;
    if (g.libs.size === 1 && captured === 0) sc -= 36;
    if (captured > 0 && g.libs.size >= 2) sc += 12;
    const d = Math.min(r, c, size - 1 - r, size - 1 - c);
    if (d === 0) sc += stones < 40 ? -22 : 3;
    else if (d === 1) sc += stones < 60 ? -6 : 4;
    else if (d === 2) sc += 11;
    else if (d === 3) sc += 16;
    else if (d === 4) sc += 7;
    else sc += 2;
    if (isStarPoint(size, r, c) && stones < 16) sc += 18;
    moves.push({ r, c, sc });
  }

  if (!moves.length) return 'pass';
  moves.sort((a, b) => b.sc - a.sc);
  const late = size * size * 0.72;
  if (stones > late && moves[0].sc < 8) return 'pass';
  return { r: moves[0].r, c: moves[0].c };
}

export const goCoach = {
  suggestMove(state: GoState) { return goAI(state); },
  explain(state: GoState, suggested?: { r: number; c: number } | 'pass' | null) {
    if (state.winner) {
      const sc = scoreGo(state);
      return `收官了。黑大约 ${sc.b.toFixed(1)}，白大约 ${sc.w.toFixed(1)}（白贴 3.5 目）。${state.winner === 1 ? '黑棋多。' : '白棋多。'}`;
    }
    if (suggested === null) return state.turn === 1 ? '请您落黑子。' : '请稍候，白棋正在思考。';
    const m = suggested === undefined ? goAI(state) : suggested;
    const who = state.turn === 1 ? '请您落黑子。' : '轮到白棋。';
    if (!m || m === 'pass') return `${who}建议这一手停着，局面已经没有急所了。`;
    const pos = `第 ${m.r + 1} 行第 ${m.c + 1} 列`;
    const oppAtari = atariLiberties(state.board, (3 - state.turn) as GoColor);
    const myAtari = atariLiberties(state.board, state.turn);
    const stones = state.board.flat().filter(Boolean).length;
    let why = `建议落在${pos}。`;
    if (oppAtari.some((a) => a.r === m.r && a.c === m.c)) why = `建议落在${pos}，对方这块棋只剩一口气，可以提掉或继续收紧。`;
    else if (myAtari.some((a) => a.r === m.r && a.c === m.c)) why = `建议落在${pos}，先给自己只剩一口气的棋找出路。`;
    else if (isStarPoint(state.size, m.r, m.c) && stones < 16) {
      why = `建议落在${pos}，这是星位。十九路开局先占星位或角上的四线，把势力立住，再慢慢向边与腹过渡。`;
    } else if (stones < 12) {
      why = `建议落在${pos}。开局不妨靠近星位或三四线，角与边比急着填中腹更从容。`;
    }
    return `${who}${why}`;
  },
  legalHighlights() { return []; },
};
