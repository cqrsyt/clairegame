/**
 * Chinese Checkers — simplified star board as hex axial coords packed into a diamond grid.
 * We use a 2-player mode on a 17x17 grid with valid star cells.
 */
export type CPlayer = 1 | 2;
export interface CheckersState {
  cells: Record<string, CPlayer | 0>;
  turn: CPlayer;
  winner: CPlayer | 0;
  selected: string | null;
}

/** Valid positions for 2-player Chinese checkers (simplified diamond). */
function buildStar(): Set<string> {
  const s = new Set<string>();
  // center hex of radius 4 + two opposite triangles
  for (let r = -4; r <= 4; r++)
    for (let q = -4; q <= 4; q++)
      if (Math.abs(r + q) <= 4) s.add(`${q},${r}`);
  // top triangle (player 2 home) r=-8..-5
  for (let r = -8; r <= -5; r++) {
    const width = r + 9;
    for (let i = 0; i < width; i++) {
      const q = -i;
      s.add(`${q},${r}`);
    }
  }
  // bottom triangle (player 1 home) r=5..8
  for (let r = 5; r <= 8; r++) {
    const width = 9 - r;
    for (let i = 0; i < width; i++) {
      const q = i;
      s.add(`${q},${r}`);
    }
  }
  return s;
}

export const STAR_CELLS = buildStar();

const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];

function key(q: number, r: number) { return `${q},${r}`; }
function parse(k: string) { const [q, r] = k.split(',').map(Number); return { q, r }; }

export function createCheckers(): CheckersState {
  const cells: Record<string, CPlayer | 0> = {};
  for (const c of STAR_CELLS) cells[c] = 0;
  // player 1 bottom
  for (let r = 5; r <= 8; r++) {
    const width = 9 - r;
    for (let i = 0; i < width; i++) cells[key(i, r)] = 1;
  }
  // player 2 top
  for (let r = -8; r <= -5; r++) {
    const width = r + 9;
    for (let i = 0; i < width; i++) cells[key(-i, r)] = 2;
  }
  return { cells, turn: 1, winner: 0, selected: null };
}

function neighbors(k: string) {
  const { q, r } = parse(k);
  return DIRS.map(([dq, dr]) => key(q + dq, r + dr)).filter((x) => STAR_CELLS.has(x));
}

function jumpTargets(state: CheckersState, from: string, visited: Set<string>): string[] {
  const out: string[] = [];
  const { q, r } = parse(from);
  for (const [dq, dr] of DIRS) {
    const mid = key(q + dq, r + dr);
    const land = key(q + 2 * dq, r + 2 * dr);
    if (!STAR_CELLS.has(mid) || !STAR_CELLS.has(land)) continue;
    if (!state.cells[mid]) continue;
    if (state.cells[land]) continue;
    if (visited.has(land)) continue;
    out.push(land);
  }
  return out;
}

export function destinations(state: CheckersState, from: string): string[] {
  if (!state.cells[from] || state.cells[from] !== state.turn) return [];
  const steps = neighbors(from).filter((n) => !state.cells[n]);
  const jumps = new Set<string>();
  const queue: string[] = [from];
  const visited = new Set<string>([from]);
  while (queue.length) {
    const cur = queue.pop()!;
    for (const j of jumpTargets(state, cur, visited)) {
      jumps.add(j);
      visited.add(j);
      queue.push(j);
    }
  }
  return [...steps, ...jumps];
}

function homeFilled(state: CheckersState, player: CPlayer): boolean {
  if (player === 1) {
    for (let r = -8; r <= -5; r++) {
      const width = r + 9;
      for (let i = 0; i < width; i++) {
        if (state.cells[key(-i, r)] !== 1) return false;
      }
    }
    return true;
  }
  for (let r = 5; r <= 8; r++) {
    const width = 9 - r;
    for (let i = 0; i < width; i++) {
      if (state.cells[key(i, r)] !== 2) return false;
    }
  }
  return true;
}

export function moveChecker(state: CheckersState, from: string, to: string): CheckersState {
  const dests = destinations(state, from);
  if (!dests.includes(to)) return state;
  const cells = { ...state.cells };
  cells[to] = cells[from];
  cells[from] = 0;
  const next: CheckersState = {
    cells,
    turn: state.turn === 1 ? 2 : 1,
    winner: 0,
    selected: null,
  };
  if (homeFilled(next, state.turn)) next.winner = state.turn;
  return next;
}

function inGoal(k: string, player: CPlayer) {
  const { r } = parse(k);
  return player === 1 ? r <= -5 : r >= 5;
}

export function checkersAI(state: CheckersState): { from: string; to: string } | null {
  const mine = Object.keys(state.cells).filter((k) => state.cells[k] === state.turn);
  let best: { from: string; to: string } | null = null;
  let bestScore = -Infinity;
  const targetR = state.turn === 1 ? -8 : 8;
  for (const from of mine) {
    const dests = destinations(state, from);
    for (const to of dests) {
      const { q: fq, r: fr } = parse(from);
      const { q: tq, r: tr } = parse(to);
      const progress = state.turn === 1 ? fr - tr : tr - fr;
      const dist = Math.abs(tr - targetR) + Math.abs(tq - (state.turn === 1 ? -tr : 0));
      const jumpBonus = Math.abs(tr - fr) + Math.abs(tq - fq) > 1 ? 8 : 0;
      let sc = progress * 8 + jumpBonus * Math.max(1, Math.abs(tr - fr)) - dist;
      if (inGoal(from, state.turn) && !inGoal(to, state.turn)) sc -= 40; // 不要把自己已进营的子拉回来
      if (inGoal(to, state.turn) && !inGoal(from, state.turn)) sc += 25;
      // 尽量动后面的子，避免前面堵死自己
      sc += (state.turn === 1 ? fr : -fr) * 0.8;
      if (progress < 0) sc -= 20;
      if (sc > bestScore) {
        bestScore = sc;
        best = { from, to };
      }
    }
  }
  return best;
}

export const checkersCoach = {
  suggestMove(state: CheckersState) { return checkersAI(state); },
  explain(state: CheckersState, suggested?: { from: string; to: string } | null) {
    if (state.winner) return `棋子已经占满对角营地，玩家 ${state.winner} 先到。`;
    if (suggested === null) return state.turn === 1 ? '请走青色棋。' : '请稍候，对方正在走棋。';
    const m = suggested === undefined ? checkersAI(state) : suggested;
    const who = state.turn === 1 ? '请走青色棋。' : '轮到品红棋。';
    if (!m) return `${who}没有可走的子了。`;
    const a = parse(m.from);
    const b = parse(m.to);
    const jump = Math.abs(b.r - a.r) + Math.abs(b.q - a.q) > 1;
    const why = jump ? '这一步是跳跃，能跳就连跳，让后面的子跟上。' : '把后面的子往前送，不要堵住自己的路。';
    return `${who}建议把棋从 (${a.q},${a.r}) 走到 (${b.q},${b.r})。${why}`;
  },
  legalHighlights(state: CheckersState) {
    if (!state.selected) return [];
    return destinations(state, state.selected);
  },
};
