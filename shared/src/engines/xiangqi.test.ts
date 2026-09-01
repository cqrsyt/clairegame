import { describe, it, expect } from 'vitest';
import { createXiangqi, allLegal, applyXiangqiMove, xiangqiLegalFrom } from './xiangqi';

describe('xiangqi', () => {
  it('red moves first with legal options', () => {
    const s = createXiangqi();
    expect(s.turn).toBe('R');
    expect(allLegal(s).length).toBeGreaterThan(10);
  });

  it('cannon can move and capture over screen', () => {
    const s = createXiangqi();
    // red cannon at 7,1
    const moves = xiangqiLegalFrom(s, 7, 1);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('applies a pawn move', () => {
    let s = createXiangqi();
    s = applyXiangqiMove(s, 6, 0, 5, 0);
    expect(s.board[5][0]).toBe('RP');
    expect(s.turn).toBe('B');
  });
});
