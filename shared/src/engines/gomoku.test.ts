import { describe, it, expect } from 'vitest';
import { createGomoku, playGomoku, checkWin, legalMoves, gomokuAI } from './gomoku';

describe('gomoku', () => {
  it('empty board has 225 moves', () => {
    expect(legalMoves(createGomoku())).toHaveLength(225);
  });

  it('detects five in a row', () => {
    let s = createGomoku();
    for (let c = 0; c < 4; c++) {
      s = playGomoku(s, 7, c);
      s = playGomoku(s, 8, c);
    }
    s = playGomoku(s, 7, 4);
    expect(s.winner).toBe(1);
    expect(checkWin(s, 7, 4)).toBe(true);
  });
});

describe('gomokuAI threats', () => {
  it('takes a win in one move', () => {
    const s = createGomoku();
    for (let c = 0; c < 4; c++) {
      s.board[7][c] = 1;
      s.board[8][c] = 2;
    }
    s.turn = 1;
    const m = gomokuAI(s);
    expect(m).toBeTruthy();
    const next = playGomoku(s, m!.r, m!.c);
    expect(next.winner).toBe(1);
  });

  it('blocks opponent four', () => {
    const s = createGomoku();
    for (let c = 0; c < 4; c++) s.board[7][c] = 1;
    s.board[9][9] = 2;
    s.turn = 2;
    const m = gomokuAI(s)!;
    expect(m).toEqual({ r: 7, c: 4 });
  });
});
