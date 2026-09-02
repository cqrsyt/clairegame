import { describe, it, expect } from 'vitest';
import { STAR_CELLS, CAMP_CELLS, createCheckers, destinations, moveChecker, campOf } from './checkers';

describe('chinese checkers hexagram', () => {
  it('has 121 holes and six camps of 10', () => {
    expect(STAR_CELLS.size).toBe(121);
    expect(CAMP_CELLS.N).toHaveLength(10);
    expect(CAMP_CELLS.S).toHaveLength(10);
    expect(CAMP_CELLS.NE).toHaveLength(10);
    expect(CAMP_CELLS.NW).toHaveLength(10);
    expect(CAMP_CELLS.SE).toHaveLength(10);
    expect(CAMP_CELLS.SW).toHaveLength(10);
    expect(campOf('0,-8')).toBe('N');
    expect(campOf('0,8')).toBe('S');
  });

  it('starts 10 vs 10 on opposite points', () => {
    const s = createCheckers();
    const p1 = Object.values(s.cells).filter((v) => v === 1).length;
    const p2 = Object.values(s.cells).filter((v) => v === 2).length;
    expect(p1).toBe(10);
    expect(p2).toBe(10);
    expect(s.cells['0,8']).toBe(1);
    expect(s.cells['0,-8']).toBe(2);
  });

  it('allows a step into an empty neighbor', () => {
    const s = createCheckers();
    const from = CAMP_CELLS.S.find((k) => destinations(s, k).length > 0);
    expect(from).toBeTruthy();
    const to = destinations(s, from!)[0];
    const next = moveChecker(s, from!, to);
    expect(next.cells[to]).toBe(1);
    expect(next.cells[from!]).toBe(0);
    expect(next.turn).toBe(2);
  });
});
