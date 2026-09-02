import { describe, it, expect } from 'vitest';
import { createWerewolf, wolfKill, seerCheck, witchAct, werewolfBotStep, werewolfDayTalkLines } from './werewolf';

describe('werewolf phases', () => {
  it('deals roles for 6 players', () => {
    const s = createWerewolf([
      { id: 'u', name: '你', isBot: false },
      { id: 'b1', name: 'B1', isBot: true },
      { id: 'b2', name: 'B2', isBot: true },
      { id: 'b3', name: 'B3', isBot: true },
      { id: 'b4', name: 'B4', isBot: true },
      { id: 'b5', name: 'B5', isBot: true },
    ]);
    expect(s.players).toHaveLength(6);
    expect(s.players.filter((p) => p.role === 'werewolf')).toHaveLength(2);
    expect(s.phase).toBe('night_wolf');
  });

  it('night to dawn pipeline', () => {
    let s = createWerewolf(Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, isBot: i > 0 })));
    const prey = s.players.find((p) => p.role !== 'werewolf')!;
    s = wolfKill(s, prey.id);
    expect(s.phase).toBe('night_seer');
    const other = s.players.find((p) => p.id !== s.players.find((x) => x.role === 'seer')?.id)!;
    s = seerCheck(s, other.id);
    expect(s.phase).toBe('night_witch');
    s = witchAct(s, { save: false });
    expect(['day_talk', 'hunter_shot', 'ended']).toContain(s.phase);
  });

  it('day_talk bots speak without outing wolves', () => {
    let s = createWerewolf(Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, isBot: true })));
    s = { ...s, phase: 'day_talk' };
    const talks = werewolfDayTalkLines(s);
    expect(talks.length).toBeGreaterThan(0);
    expect(talks.length).toBeLessThanOrEqual(3);
    for (const line of talks) {
      expect(line).toMatch(/：「/);
      expect(line).not.toMatch(/我是狼|我们是狼|我是狼人/);
    }
    for (const p of s.players.filter((x) => x.role === 'werewolf')) {
      const mine = talks.find((l) => l.startsWith(`${p.name}：`));
      if (!mine) continue;
      expect(mine).not.toMatch(/我是狼/);
    }
    const next = werewolfBotStep(s);
    expect(next.phase).toBe('day_vote');
    expect(next.log.some((l) => l.includes('：「'))).toBe(true);
  });
});
