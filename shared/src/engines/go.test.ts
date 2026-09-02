import { describe, it, expect } from 'vitest';
import { createGo, playGo, passGo, goAI, starPoints, isStarPoint } from './go';

describe('go 9x9 subset', () => {
  it('still supports a 9-road board', () => {
    const s = createGo(9);
    expect(s.size).toBe(9);
    expect(s.board).toHaveLength(9);
    expect(s.board[0]).toHaveLength(9);
  });

  it('captures a stone with no liberties on 9x9', () => {
    let s = createGo(9);
    s = playGo(s, 0, 1);
    s = playGo(s, 0, 0);
    s = playGo(s, 1, 0);
    expect(s.board[0][0]).toBe(0);
    expect(s.captures[0]).toBe(1);
  });
});

describe('go 19x19', () => {
  it('defaults to a 19-road board', () => {
    const s = createGo();
    expect(s.size).toBe(19);
    expect(s.board).toHaveLength(19);
    expect(s.board[0]).toHaveLength(19);
    expect(starPoints(19)).toHaveLength(9);
    expect(isStarPoint(19, 3, 3)).toBe(true);
  });

  it('smoke: play one stone and AI answers on 19x19 without scanning the whole grid as minimax', () => {
    let s = createGo(19);
    s = playGo(s, 3, 3);
    expect(s.board[3][3]).toBe(1);
    const t0 = Date.now();
    const m = goAI(s);
    const elapsed = Date.now() - t0;
    expect(m).not.toBe('pass');
    if (m !== 'pass') {
      expect(m.r).toBeGreaterThanOrEqual(0);
      expect(m.r).toBeLessThan(19);
      expect(s.board[m.r][m.c]).toBe(0);
      const next = playGo(s, m.r, m.c);
      expect(next.board[m.r][m.c]).toBe(2);
    }
    expect(elapsed).toBeLessThan(400);
  });

  it('does not fill its own eye', () => {
    const s = createGo(19);
    s.board[4][5] = 1;
    s.board[6][5] = 1;
    s.board[5][4] = 1;
    s.board[5][6] = 1;
    s.board[10][10] = 2;
    s.turn = 1;
    const m = goAI(s);
    if (m !== 'pass') expect(!(m.r === 5 && m.c === 5)).toBe(true);
  });

  it('two passes end the game', () => {
    let s = createGo(19);
    s = playGo(s, 3, 3);
    s = passGo(s);
    s = passGo(s);
    expect(s.winner).toBeGreaterThan(0);
  });
});
