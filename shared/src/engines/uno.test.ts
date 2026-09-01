import { describe, it, expect } from 'vitest';
import { createUno, canPlayUno, playUno, drawUno } from './uno';

describe('uno', () => {
  it('deals 7 cards to 4 players', () => {
    const s = createUno();
    expect(s.players).toHaveLength(4);
    expect(s.players.every((p) => p.hand.length === 7)).toBe(true);
    expect(s.discard).toHaveLength(1);
    expect(s.color).not.toBe('W');
  });

  it('allows matching color or value, rejects mismatch', () => {
    const s = createUno();
    const top = s.discard[0];
    const match = { id: 'x', color: top.color, value: top.value === '0' ? '1' : '0' as const };
    const wild = { id: 'w', color: 'W' as const, value: 'wild' as const };
    const miss = { id: 'm', color: (['R','G','B','Y'] as const).find((c) => c !== top.color)!, value: '9' as const };
    if (miss.value === top.value) miss.value = '8';
    expect(canPlayUno(match, s)).toBe(true);
    expect(canPlayUno(wild, s)).toBe(true);
    const reallyMiss = { ...miss, value: (top.value === '5' ? '6' : '5') as '5' };
    if (reallyMiss.color !== top.color && reallyMiss.value !== top.value) {
      expect(canPlayUno(reallyMiss, s)).toBe(false);
    }
  });

  it('skip advances over the next player', () => {
    let s = createUno();
    s.players[0].isBot = false;
    const skip = { id: 'sk', color: s.color, value: 'skip' as const };
    s.players[0].hand.push(skip);
    const after = playUno(s, 0, 'sk');
    expect(after.current).toBe(2);
  });

  it('draw adds a card and passes turn', () => {
    const s = createUno();
    const n = s.players[0].hand.length;
    const after = drawUno(s, 0);
    expect(after.players[0].hand.length).toBe(n + 1);
    expect(after.current).toBe(1);
  });
});
