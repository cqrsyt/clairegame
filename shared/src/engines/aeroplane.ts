/** Aeroplane Chess — 4 colors, simplified track */
export type AeroColor = 'red' | 'yellow' | 'blue' | 'green';

export interface Plane {
  id: number;
  color: AeroColor;
  /** -1 hangar, 0-51 main track, 52-56 final stretch, 57 finished */
  pos: number;
}

export interface AeroState {
  planes: Plane[];
  turn: AeroColor;
  dice: number | null;
  winner: AeroColor | null;
  extraRoll: boolean;
  players: AeroColor[];
}

const ORDER: AeroColor[] = ['red', 'yellow', 'blue', 'green'];
const START_INDEX: Record<AeroColor, number> = { red: 0, yellow: 13, blue: 26, green: 39 };
const ENTRY: Record<AeroColor, number> = { red: 50, yellow: 11, blue: 24, green: 37 };

export function createAeroplane(players: AeroColor[] = ['red', 'yellow']): AeroState {
  const planes: Plane[] = [];
  players.forEach((color) => {
    for (let i = 0; i < 4; i++) planes.push({ id: i, color, pos: -1 });
  });
  return { planes, turn: players[0], dice: null, winner: null, extraRoll: false, players };
}

export function rollDice(state: AeroState): AeroState {
  if (state.winner || state.dice !== null) return state;
  const dice = 1 + Math.floor(Math.random() * 6);
  return { ...state, dice, extraRoll: dice === 6 };
}

function trackPos(color: AeroColor, steps: number): number {
  // absolute board index after leaving hangar with `steps` along main track (0..51)
  return (START_INDEX[color] + steps) % 52;
}

function stepsFromStart(color: AeroColor, abs: number): number {
  return (abs - START_INDEX[color] + 52) % 52;
}

export function movablePlanes(state: AeroState): Plane[] {
  if (state.dice === null || state.winner) return [];
  const dice = state.dice;
  return state.planes.filter((p) => {
    if (p.color !== state.turn) return false;
    if (p.pos === 57) return false;
    if (p.pos === -1) return dice === 6;
    if (p.pos >= 52) return p.pos + dice <= 57;
    return true;
  });
}

export function movePlane(state: AeroState, planeKey: { color: AeroColor; id: number }): AeroState {
  const dice = state.dice;
  if (dice === null) return state;
  const idx = state.planes.findIndex((p) => p.color === planeKey.color && p.id === planeKey.id);
  if (idx < 0) return state;
  const plane = state.planes[idx];
  if (!movablePlanes(state).some((p) => p.color === plane.color && p.id === plane.id)) return state;

  const planes = state.planes.map((p) => ({ ...p }));
  const me = planes[idx];

  if (me.pos === -1) {
    me.pos = START_INDEX[me.color];
  } else if (me.pos >= 52) {
    me.pos = me.pos + dice;
    if (me.pos === 57) me.pos = 57;
  } else {
    const steps = stepsFromStart(me.color, me.pos) + dice;
    if (steps >= 50) {
      // enter final stretch: 50 -> 52, 51->53 ... 54->56, 55->57
      const over = steps - 50;
      me.pos = 52 + over;
      if (me.pos > 57) {
        // bounce back not implemented — must exact; revert illegal
        return state;
      }
    } else {
      me.pos = trackPos(me.color, steps);
    }
  }

  // collisions on main track
  if (me.pos >= 0 && me.pos < 52) {
    for (const o of planes) {
      if (o === me) continue;
      if (o.pos === me.pos) o.pos = -1;
    }
  }

  const finished = planes.filter((p) => p.color === me.color && p.pos === 57).length === 4;
  let nextTurn = state.turn;
  let nextDice: number | null = null;
  if (!state.extraRoll) {
    const i = state.players.indexOf(state.turn);
    nextTurn = state.players[(i + 1) % state.players.length];
  }
  // if extra roll (rolled 6), keep turn and clear dice for another roll
  return {
    ...state,
    planes,
    turn: finished ? state.turn : nextTurn,
    dice: nextDice,
    winner: finished ? me.color : null,
    extraRoll: false,
  };
}

function landingPos(plane: Plane, dice: number): number | null {
  if (plane.pos === -1) return dice === 6 ? START_INDEX[plane.color] : null;
  if (plane.pos >= 52) {
    const n = plane.pos + dice;
    return n <= 57 ? n : null;
  }
  const steps = stepsFromStart(plane.color, plane.pos) + dice;
  if (steps >= 50) {
    const over = steps - 50;
    const n = 52 + over;
    return n <= 57 ? n : null;
  }
  return trackPos(plane.color, steps);
}

export function aeroAI(state: AeroState): { color: AeroColor; id: number } | null {
  let s = state;
  if (s.dice === null) s = rollDice(s);
  const dice = s.dice!;
  const opts = movablePlanes(s);
  if (!opts.length) return null;
  let best = opts[0];
  let bestSc = -Infinity;
  for (const p of opts) {
    const dest = landingPos(p, dice);
    if (dest === null) continue;
    let sc = 0;
    if (p.pos === -1) sc += 90; // 优先起飞
    if (dest === 57) sc += 120; // 进终点
    if (dest >= 52) sc += 35; // 进航道
    // 离终点越近越好（主航道步数）
    const progress = p.pos === -1 ? 0 : p.pos >= 52 ? 50 + (p.pos - 52) : stepsFromStart(p.color, p.pos);
    sc += progress;
    if (dest >= 0 && dest < 52) {
      const hit = s.planes.some((o) => o !== p && o.color !== p.color && o.pos === dest);
      if (hit) sc += 70; // 撞回对手
      const stack = s.planes.some((o) => o.color === p.color && o.id !== p.id && o.pos === dest);
      if (stack) sc += 15;
    }
    if (sc > bestSc) { bestSc = sc; best = p; }
  }
  return { color: best.color, id: best.id };
}

export type AeroAdvice =
  | { action: 'roll' }
  | { action: 'pass' }
  | { action: 'move'; color: AeroColor; id: number };

export const aeroCoach = {
  suggestMove(state: AeroState): AeroAdvice | null {
    if (state.winner) return null;
    if (state.dice === null) return { action: 'roll' };
    const m = aeroAI(state);
    if (!m) return { action: 'pass' };
    return { action: 'move', color: m.color, id: m.id };
  },
  explain(state: AeroState, suggested?: AeroAdvice | null) {
    if (state.winner) return `${state.winner} 的飞机都到家了。`;
    const m = suggested === undefined ? aeroCoach.suggestMove(state) : suggested;
    const camp: Record<AeroColor, string> = { red: '红', yellow: '黄', blue: '蓝', green: '绿' };
    if (!m || m.action === 'roll') return `${camp[state.turn]}方请掷骰。掷到 6 才可以从机库起飞。`;
    if (m.action === 'pass') return `骰点是 ${state.dice}。这一手没有能走的飞机，建议跳过。`;
    const plane = state.planes.find((p) => p.color === m.color && p.id === m.id);
    const tag = `${camp[m.color]}方 ${m.id + 1} 号机`;
    if (plane?.pos === -1) return `骰点是 ${state.dice}。建议让${tag}从机库起飞。`;
    if (plane && plane.pos >= 52) return `骰点是 ${state.dice}。建议走${tag}，送进航道或终点，步数要刚好。`;
    return `骰点是 ${state.dice}。建议走${tag}；能叠到对手身上就把它打回机库。`;
  },
  legalHighlights(state: AeroState) { return movablePlanes(state); },
};
