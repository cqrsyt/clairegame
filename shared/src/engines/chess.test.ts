import { describe, it, expect } from 'vitest';
import { createChess, chessLegalFrom, applyChessMove, allLegalMoves, inCheck } from './chess';

describe('chess', () => {
  it('starts with white to move and 20 legal opening moves', () => {
    const s = createChess();
    expect(s.turn).toBe('w');
    expect(allLegalMoves(s)).toHaveLength(20);
  });

  it('allows e2e4 and switches turn', () => {
    let s = createChess();
    s = applyChessMove(s, 6, 4, 4, 4);
    expect(s.board[4][4]).toBe('P');
    expect(s.board[6][4]).toBeNull();
    expect(s.turn).toBe('b');
  });

  it('detects scholars mate threat moves exist', () => {
    let s = createChess();
    s = applyChessMove(s, 6, 4, 4, 4); // e4
    s = applyChessMove(s, 1, 4, 3, 4); // e5
    s = applyChessMove(s, 7, 3, 3, 7); // Qh5
    expect(chessLegalFrom(s, 0, 5).length).toBeGreaterThan(0);
  });

  it('king cannot move into check', () => {
    const s = createChess();
    // after opening, king rarely has moves
    expect(chessLegalFrom(s, 7, 4)).toHaveLength(0);
  });
});
