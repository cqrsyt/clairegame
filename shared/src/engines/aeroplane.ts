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

export function aeroAI(state: AeroState): { color: AeroColor; id: number } | null {
  let s = state;
  if (s.dice === null) s = rollDice(s);
  const opts = movablePlanes(s);
  if (!opts.length) {
    // pass turn
    return null;
  }
  // prefer finishing, then advancing furthest
  opts.sort((a, b) => b.pos - a.pos);
  return { color: opts[0].color, id: opts[0].id };
}

export const aeroCoach = {
  suggestMove(state: AeroState) { return aeroAI(state); },
  explain(state: AeroState) {
    if (state.winner) return `${state.winner} 全员抵达终点！`;
    if (state.dice === null) return `${state.turn} 方请掷骰。`;
    return `骰点 ${state.dice}。选择一架可移动的飞机。`;
  },
  legalHighlights(state: AeroState) { return movablePlanes(state); },
};
