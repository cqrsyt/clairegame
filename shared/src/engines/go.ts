/** 十九路围棋：提子、禁自杀、简单劫；无完整数目，可增强。 */
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
