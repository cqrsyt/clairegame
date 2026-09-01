import { describe, it, expect } from 'vitest';
import { createDoudizhu, classifyCombo, beats, playDoudizhu, passDoudizhu } from './doudizhu';

const c = (rank: number, id: string) => ({ id, rank, suit: 's', label: String(rank) });

describe('doudizhu', () => {
  it('deals 20 landlord cards and 17 farmers, 54 total', () => {
    const s = createDoudizhu();
    expect(s.players).toHaveLength(3);
    expect(s.players[0].hand).toHaveLength(20);
    expect(s.players[1].hand).toHaveLength(17);
    expect(s.players[2].hand).toHaveLength(17);
    expect(s.players[0].role).toBe('landlord');
  });

  it('classifies solo, pair, bomb, rocket', () => {
    expect(classifyCombo([c(5, 'a')])?.kind).toBe('solo');
    expect(classifyCombo([c(7, 'a'), c(7, 'b')])?.kind).toBe('pair');
    expect(classifyCombo([c(9, 'a'), c(9, 'b'), c(9, 'c'), c(9, 'd')])?.kind).toBe('bomb');
    expect(classifyCombo([
      { id: 'j', rank: 16, suit: 'j', label: 'xiaowang' },
      { id: 'J', rank: 17, suit: 'J', label: 'dawang' },
    ])?.kind).toBe('rocket');
  });

  it('bomb beats pair; pair does not beat bomb', () => {
    const pair = classifyCombo([c(8, 'a'), c(8, 'b')])!;
    const bomb = classifyCombo([c(4, 'a'), c(4, 'b'), c(4, 'c'), c(4, 'd')])!;
    expect(beats(bomb, pair)).toBe(true);
    expect(beats(pair, bomb)).toBe(false);
  });

  it('play then pass cycle returns lead', () => {
    let s = createDoudizhu();
    const card = s.players[0].hand[0];
    s = playDoudizhu(s, 0, [card.id]);
    expect(s.current).toBe(1);
    s = passDoudizhu(s, 1);
    expect(s.current).toBe(2);
    s = passDoudizhu(s, 2);
    expect(s.last).toBeNull();
    expect(s.current).toBe(0);
  });
});
