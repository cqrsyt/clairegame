/**
 * 中国跳棋：121 孔六角星（中心六边形半径 4 + 六个四层三角营各 10 孔）。
 * 轴向坐标 (q, r)，六向相邻；可单步入空，或沿同向跳过邻子并连跳。
 */
export type CPlayer = 1 | 2;
export type CampId = 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';

export interface CheckersState {
  cells: Record<string, CPlayer | 0>;
  turn: CPlayer;
  winner: CPlayer | 0;
  selected: string | null;
}

function key(q: number, r: number) { return `${q},${r}`; }
function parse(k: string) { const [q, r] = k.split(',').map(Number); return { q, r }; }

/** 60° clockwise: (q, r) → (-r, q+r) */
function rot60(q: number, r: number): [number, number] {
  return [-r, q + r];
}

function northTriangle(): [number, number][] {
  const out: [number, number][] = [];
  for (let d = 0; d < 4; d++) {
    const r = -8 + d;
    for (let i = 0; i <= d; i++) out.push([-i, r]);
  }
  return out;
}

function buildCamps(): Record<CampId, string[]> {
  const ids: CampId[] = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];
  const camps = {} as Record<CampId, string[]>;
  let pts = northTriangle();
  for (const id of ids) {
    camps[id] = pts.map(([q, r]) => key(q, r));
    pts = pts.map(([q, r]) => rot60(q, r));
  }
  return camps;
}

export const CAMP_CELLS = buildCamps();
export const CAMP_ORDER: CampId[] = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];

export function campOf(k: string): CampId | 'center' {
  for (const id of CAMP_ORDER) {
    if (CAMP_CELLS[id].includes(k)) return id;
  }
  return 'center';
}

function buildStar(): Set<string> {
  const s = new Set<string>();
  for (let q = -4; q <= 4; q++)
    for (let r = -4; r <= 4; r++)
      if (Math.abs(q + r) <= 4) s.add(key(q, r));
  for (const cells of Object.values(CAMP_CELLS)) for (const c of cells) s.add(c);
  return s;
}

export const STAR_CELLS = buildStar();

/** 您执南营，电脑执北营；目标是对面的三角。 */
export const START_CAMP: Record<CPlayer, CampId> = { 1: 'S', 2: 'N' };
export const GOAL_CAMP: Record<CPlayer, CampId> = { 1: 'N', 2: 'S' };

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

/** Pointy-top hex → pixel (origin at board centre). */
export function hexPixel(q: number, r: number, size = 18) {
  return {
    x: size * Math.sqrt(3) * (q + r / 2),
    y: size * 1.5 * r,
  };
}

export function createCheckers(): CheckersState {
  const cells: Record<string, CPlayer | 0> = {};
  for (const c of STAR_CELLS) cells[c] = 0;
  for (const c of CAMP_CELLS.S) cells[c] = 1;
  for (const c of CAMP_CELLS.N) cells[c] = 2;
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
  return CAMP_CELLS[GOAL_CAMP[player]].every((c) => state.cells[c] === player);
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
  return CAMP_CELLS[GOAL_CAMP[player]].includes(k);
}

export function checkersAI(state: CheckersState): { from: string; to: string } | null {
  const mine = Object.keys(state.cells).filter((k) => state.cells[k] === state.turn);
  let best: { from: string; to: string } | null = null;
  let bestScore = -Infinity;
  const goal = CAMP_CELLS[GOAL_CAMP[state.turn]];
  const tips = { N: { q: 0, r: -8 }, S: { q: 0, r: 8 } } as const;
  const tip = state.turn === 1 ? tips.N : tips.S;
  for (const from of mine) {
    const dests = destinations(state, from);
    for (const to of dests) {
      const { q: fq, r: fr } = parse(from);
      const { q: tq, r: tr } = parse(to);
      const distFrom = Math.abs(fr - tip.r) + Math.abs(fq - tip.q);
      const distTo = Math.abs(tr - tip.r) + Math.abs(tq - tip.q);
      const progress = distFrom - distTo;
      const jumpBonus = Math.abs(tr - fr) + Math.abs(tq - fq) > 1 ? 10 : 0;
      let sc = progress * 10 + jumpBonus * Math.max(1, Math.abs(tr - fr));
      if (inGoal(from, state.turn) && !inGoal(to, state.turn)) sc -= 40;
      if (inGoal(to, state.turn) && !inGoal(from, state.turn)) sc += 28;
      sc += (state.turn === 1 ? fr : -fr) * 0.6;
      if (progress < 0) sc -= 22;
      void goal;
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
    if (state.winner) {
      return state.winner === 1
        ? '南营的棋已经占满北营，您先到了。'
        : '北营的棋已经占满南营，对方先到。';
    }
    if (suggested === null) return state.turn === 1 ? '请走您的南营棋（暖橙）。' : '请稍候，北营正在走棋。';
    const m = suggested === undefined ? checkersAI(state) : suggested;
    const who = state.turn === 1 ? '请走您的南营棋。' : '轮到北营。';
    if (!m) return `${who}没有可走的子了。`;
    const a = parse(m.from);
    const b = parse(m.to);
    const jump = Math.abs(b.r - a.r) + Math.abs(b.q - a.q) > 1;
    const why = jump ? '这一步是跳跃，能跳就连跳，让后面的子跟上。' : '把后面的子沿六角星往前送，不要堵住自己的路。';
    return `${who}建议把棋从 (${a.q},${a.r}) 走到 (${b.q},${b.r})。${why}`;
  },
  legalHighlights(state: CheckersState) {
    if (!state.selected) return [];
    return destinations(state, state.selected);
  },
};
