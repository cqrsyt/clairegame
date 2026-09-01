import { describe, it, expect } from 'vitest';
import { createGomoku, playGomoku, checkWin, legalMoves } from './gomoku';

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
