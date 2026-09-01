import { describe, it, expect } from 'vitest';
import { createAvalon, proposeTeam, voteTeam, playQuestCard, isEvil } from './avalon';

describe('avalon phases', () => {
  it('creates 5-player game with roles', () => {
    const s = createAvalon([
      { id: '1', name: 'A', isBot: false },
      { id: '2', name: 'B', isBot: true },
      { id: '3', name: 'C', isBot: true },
      { id: '4', name: 'D', isBot: true },
      { id: '5', name: 'E', isBot: true },
    ]);
    expect(s.players).toHaveLength(5);
    expect(s.players.some((p) => p.role === 'merlin')).toBe(true);
    expect(s.players.some((p) => p.role === 'assassin')).toBe(true);
    expect(s.phase).toBe('team_propose');
  });

  it('team vote and quest flow', () => {
    let s = createAvalon([
      { id: '1', name: 'A', isBot: false },
      { id: '2', name: 'B', isBot: true },
      { id: '3', name: 'C', isBot: true },
      { id: '4', name: 'D', isBot: true },
      { id: '5', name: 'E', isBot: true },
    ]);
    const leader = s.players[s.leader];
    const team = s.players.slice(0, s.teamSizes[0]).map((p) => p.id);
    s = proposeTeam(s, leader.id, team);
    expect(s.phase).toBe('team_vote');
    for (const p of s.players) s = voteTeam(s, p.id, true);
    expect(s.phase).toBe('quest');
    for (const id of s.proposed) {
      const p = s.players.find((x) => x.id === id)!;
      s = playQuestCard(s, id, !isEvil(p.role));
    }
    expect(s.questResults[0]).not.toBeNull();
  });
});
