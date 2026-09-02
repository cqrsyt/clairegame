export type AvalonRole =
  | 'merlin' | 'percival' | 'servant'
  | 'assassin' | 'morgana' | 'minion';

export type AvalonPhase =
  | 'night_info' | 'team_propose' | 'team_vote' | 'quest' | 'assassinate' | 'ended';

export interface AvalonPlayer {
  id: string;
  name: string;
  role: AvalonRole;
  isBot: boolean;
}

export interface AvalonState {
  players: AvalonPlayer[];
  phase: AvalonPhase;
  questIndex: number; // 0..4
  leader: number;
  proposed: string[];
  votes: Record<string, boolean>; // approve
  questCards: Record<string, boolean>; // true = success
  questResults: (boolean | null)[]; // true success
  failsRequired: number[];
  teamSizes: number[];
  rejectStreak: number;
  winner: 'good' | 'evil' | null;
  assassinTarget: string | null;
  log: string[];
}

const EVIL: AvalonRole[] = ['assassin', 'morgana', 'minion'];
export function isEvil(r: AvalonRole) { return EVIL.includes(r); }

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SETUPS: Record<number, { roles: AvalonRole[]; teams: number[]; fails: number[] }> = {
  5: {
    roles: ['merlin', 'percival', 'servant', 'assassin', 'morgana'],
    teams: [2, 3, 2, 3, 3],
    fails: [1, 1, 1, 1, 1],
  },
  6: {
    roles: ['merlin', 'percival', 'servant', 'servant', 'assassin', 'morgana'],
    teams: [2, 3, 4, 3, 4],
    fails: [1, 1, 1, 1, 1],
  },
  7: {
    roles: ['merlin', 'percival', 'servant', 'servant', 'assassin', 'morgana', 'minion'],
    teams: [2, 3, 3, 4, 4],
    fails: [1, 1, 1, 2, 1],
  },
  8: {
    roles: ['merlin', 'percival', 'servant', 'servant', 'servant', 'assassin', 'morgana', 'minion'],
    teams: [3, 4, 4, 5, 5],
    fails: [1, 1, 1, 2, 1],
  },
};

export function createAvalon(names: { id: string; name: string; isBot: boolean }[]): AvalonState {
  const n = Math.max(5, Math.min(8, names.length >= 5 ? names.length : 5));
  const roster = names.slice(0, n);
  while (roster.length < n) roster.push({ id: `abot${roster.length}`, name: `骑士${roster.length}`, isBot: true });
  const setup = SETUPS[n] || SETUPS[5];
  const roles = shuffle(setup.roles.slice(0, roster.length));
  // pad roles if needed
  while (roles.length < roster.length) roles.push('servant');
  const players = roster.map((p, i) => ({ ...p, role: roles[i] }));
  return {
    players,
    phase: 'team_propose',
    questIndex: 0,
    leader: 0,
    proposed: [],
    votes: {},
    questCards: {},
    questResults: [null, null, null, null, null],
    failsRequired: setup.fails,
    teamSizes: setup.teams,
    rejectStreak: 0,
    winner: null,
    assassinTarget: null,
    log: ['阿瓦隆开局。身份已暗中分配。队长请组队。'],
  };
}

export function nightInfoFor(state: AvalonState, playerId: string): string {
  const me = state.players.find((p) => p.id === playerId);
  if (!me) return '';
  if (me.role === 'merlin') {
    const evil = state.players.filter((p) => isEvil(p.role) && p.role !== 'assassin' || p.role === 'assassin' || p.role === 'minion' || p.role === 'morgana');
    // merlin sees all evil except pretend — standard: sees evil including assassin & morgana & minion
    const seen = state.players.filter((p) => isEvil(p.role)).map((p) => p.name);
    return `你是梅林。你看到的邪恶方：${seen.join('、')}`;
  }
  if (me.role === 'percival') {
    const pair = state.players.filter((p) => p.role === 'merlin' || p.role === 'morgana').map((p) => p.name);
    return `你是派西维尔。梅林/莫甘娜是：${pair.join('、')}（无法区分）`;
  }
  if (isEvil(me.role)) {
    const mates = state.players.filter((p) => isEvil(p.role) && p.id !== me.id).map((p) => p.name);
    return `你是${me.role}。队友：${mates.join('、') || '无'}`;
  }
  return `你是忠臣。保持忠诚，完成任务。`;
}

export function proposeTeam(state: AvalonState, leaderId: string, team: string[]): AvalonState {
  if (state.phase !== 'team_propose') return state;
  const leader = state.players[state.leader];
  if (leader.id !== leaderId) return state;
  const need = state.teamSizes[state.questIndex];
  if (team.length !== need) return state;
  if (!team.every((id) => state.players.some((p) => p.id === id))) return state;
  return { ...state, proposed: team, phase: 'team_vote', votes: {}, log: [...state.log, `队长提名：${team.map((id) => state.players.find((p) => p.id === id)?.name).join('、')}`] };
}

export function voteTeam(state: AvalonState, playerId: string, approve: boolean): AvalonState {
  if (state.phase !== 'team_vote') return state;
  const votes = { ...state.votes, [playerId]: approve };
  const next = { ...state, votes };
  if (Object.keys(votes).length < state.players.length) return next;
  const ayes = Object.values(votes).filter(Boolean).length;
  const approved = ayes > state.players.length / 2;
  if (approved) {
    return { ...next, phase: 'quest', questCards: {}, rejectStreak: 0, log: [...next.log, '组队通过，出征！'] };
  }
  const rejectStreak = state.rejectStreak + 1;
  if (rejectStreak >= 5) {
    return { ...next, phase: 'ended', winner: 'evil', rejectStreak, log: [...next.log, '五次拒队，奸徒胜利！'] };
  }
  return {
    ...next,
    phase: 'team_propose',
    proposed: [],
    votes: {},
    rejectStreak,
    leader: (state.leader + 1) % state.players.length,
    log: [...next.log, '组队被拒，队长移交。'],
  };
}

export function playQuestCard(state: AvalonState, playerId: string, success: boolean): AvalonState {
  if (state.phase !== 'quest') return state;
  if (!state.proposed.includes(playerId)) return state;
  // good must success
  const me = state.players.find((p) => p.id === playerId)!;
  if (!isEvil(me.role)) success = true;
  const questCards = { ...state.questCards, [playerId]: success };
  if (Object.keys(questCards).length < state.proposed.length) {
    return { ...state, questCards };
  }
  const fails = Object.values(questCards).filter((x) => !x).length;
  const needFail = state.failsRequired[state.questIndex];
  const ok = fails < needFail;
  const questResults = state.questResults.slice() as (boolean | null)[];
  questResults[state.questIndex] = ok;
  const successCount = questResults.filter((x) => x === true).length;
  const failCount = questResults.filter((x) => x === false).length;
  let next: AvalonState = {
    ...state,
    questCards,
    questResults,
    log: [...state.log, ok ? `任务 ${state.questIndex + 1} 成功（失败票 ${fails}）` : `任务 ${state.questIndex + 1} 失败（失败票 ${fails}）`],
  };
  if (successCount >= 3) {
    return { ...next, phase: 'assassinate', log: [...next.log, '三任务成功！刺客请刺杀梅林。'] };
  }
  if (failCount >= 3) {
    return { ...next, phase: 'ended', winner: 'evil', log: [...next.log, '三任务失败，奸徒胜利！'] };
  }
  return {
    ...next,
    phase: 'team_propose',
    questIndex: state.questIndex + 1,
    proposed: [],
    votes: {},
    questCards: {},
    leader: (state.leader + 1) % state.players.length,
  };
}

export function assassinate(state: AvalonState, targetId: string): AvalonState {
  if (state.phase !== 'assassinate') return state;
  const target = state.players.find((p) => p.id === targetId);
  const hit = target?.role === 'merlin';
  return {
    ...state,
    assassinTarget: targetId,
    phase: 'ended',
    winner: hit ? 'evil' : 'good',
    log: [...state.log, hit ? `刺客刺中梅林（${target?.name}），奸徒翻盘！` : `刺客刺错，正派胜利！`],
  };
}

export function avalonBotStep(state: AvalonState): AvalonState {
  const leader = state.players[state.leader];
  if (state.phase === 'team_propose' && leader.isBot) {
    const need = state.teamSizes[state.questIndex];
    const pool = state.players.slice();
    const byId = (a: AvalonPlayer, b: AvalonPlayer) => a.id.localeCompare(b.id);
    let team: AvalonPlayer[] = [];
    if (isEvil(leader.role)) {
      const evil = pool.filter((p) => isEvil(p.role)).sort(byId);
      const good = pool.filter((p) => !isEvil(p.role)).sort(byId);
      team = [leader];
      for (const e of evil) if (team.length < need && !team.includes(e)) team.push(e);
      for (const g of good) if (team.length < need && !team.includes(g)) team.push(g);
      team = team.slice(0, need);
    } else if (leader.role === 'merlin') {
      const good = pool.filter((p) => !isEvil(p.role)).sort(byId);
      team = good.slice(0, need);
      if (!team.includes(leader)) { team[need - 1] = leader; }
    } else {
      team = [leader];
      const rest = pool.filter((p) => p.id !== leader.id).sort(byId);
      for (const p of rest) if (team.length < need) team.push(p);
    }
    return proposeTeam(state, leader.id, team.map((p) => p.id));
  }
  if (state.phase === 'team_vote') {
    for (const p of state.players) {
      if (!p.isBot || state.votes[p.id] !== undefined) continue;
      const team = state.proposed.map((id) => state.players.find((x) => x.id === id)!);
      const evilOn = team.filter((t) => isEvil(t.role)).length;
      let approve = true;
      if (p.role === 'merlin') approve = evilOn === 0;
      else if (isEvil(p.role)) approve = evilOn > 0 || state.rejectStreak >= 4;
      else approve = team.some((t) => t.id === p.id) || state.rejectStreak >= 3;
      state = voteTeam(state, p.id, approve);
    }
  }
  if (state.phase === 'quest') {
    const failsNeed = state.failsRequired[state.questIndex] || 1;
    const evilOnTeam = state.proposed.filter((id) => {
      const pl = state.players.find((x) => x.id === id);
      return pl && isEvil(pl.role);
    });
    let failsLeft = failsNeed;
    for (const id of state.proposed) {
      if (state.questCards[id] !== undefined) continue;
      const p = state.players.find((x) => x.id === id)!;
      if (!p.isBot) continue;
      let success = true;
      if (isEvil(p.role)) {
        // 任务失败票：能翻盘就投失败，第一轮人少时偶尔装好人
        if (failsLeft > 0 && (state.questIndex >= 1 || evilOnTeam.length === 1)) {
          success = false;
          failsLeft--;
        }
      }
      state = playQuestCard(state, id, success);
    }
  }
  if (state.phase === 'assassinate') {
    const assassin = state.players.find((p) => p.role === 'assassin');
    if (assassin?.isBot) {
      const goods = state.players.filter((p) => !isEvil(p.role));
      const merlin = goods.find((p) => p.role === 'merlin');
      const percival = goods.find((p) => p.role === 'percival');
      // 刺客不知梅林，优先刺珀西维尔（常被认成梅林）再刺梅林，避免纯随机 1/n
      const pick = percival || merlin || goods[0];
      if (pick) state = assassinate(state, pick.id);
    }
  }
  return state;
}

const AV_PHASE: Record<string, string> = {
  team_propose: '组队',
  team_vote: '表决组队',
  quest: '出征',
  assassinate: '刺杀',
  ended: '圣杯落定',
};

export type AvalonAdvice =
  | { action: 'propose'; team: string[] }
  | { action: 'vote'; approve: boolean }
  | { action: 'quest'; success: boolean }
  | { action: 'assassinate'; targetId: string }
  | { action: 'wait' };

function byId(a: AvalonPlayer, b: AvalonPlayer) { return a.id.localeCompare(b.id); }

export function avalonSuggest(state: AvalonState, playerId = 'you'): AvalonAdvice | null {
  const me = state.players.find((p) => p.id === playerId);
  if (!me || state.phase === 'ended') return { action: 'wait' };
  const need = state.teamSizes[state.questIndex];
  const leader = state.players[state.leader];
  if (state.phase === 'team_propose' && leader.id === me.id) {
    const pool = state.players.slice();
    let team: AvalonPlayer[] = [];
    if (me.role === 'merlin') {
      team = pool.filter((p) => !isEvil(p.role)).sort(byId).slice(0, need);
      if (!team.some((p) => p.id === me.id) && team.length) team[team.length - 1] = me;
    } else if (isEvil(me.role)) {
      team = [me];
      const evil = pool.filter((p) => isEvil(p.role) && p.id !== me.id).sort(byId);
      const rest = pool.filter((p) => !isEvil(p.role)).sort(byId);
      for (const e of evil) if (team.length < need) team.push(e);
      for (const g of rest) if (team.length < need) team.push(g);
    } else {
      team = [me];
      const rest = pool.filter((p) => p.id !== me.id).sort(byId);
      for (const p of rest) if (team.length < need) team.push(p);
    }
    return { action: 'propose', team: team.slice(0, need).map((p) => p.id) };
  }
  if (state.phase === 'team_vote' && state.votes[me.id] === undefined) {
    const team = state.proposed.map((id) => state.players.find((x) => x.id === id)!);
    let approve = true;
    if (me.role === 'merlin') approve = team.every((t) => !isEvil(t.role));
    else if (isEvil(me.role)) approve = team.some((t) => isEvil(t.role)) || state.rejectStreak >= 4;
    else approve = team.some((t) => t.id === me.id) || state.rejectStreak >= 3;
    return { action: 'vote', approve };
  }
  if (state.phase === 'quest' && state.proposed.includes(me.id) && state.questCards[me.id] === undefined) {
    const success = !isEvil(me.role);
    return { action: 'quest', success };
  }
  if (state.phase === 'assassinate' && me.role === 'assassin') {
    const goods = state.players.filter((p) => !isEvil(p.role)).sort(byId);
    const pick = goods[0];
    return pick ? { action: 'assassinate', targetId: pick.id } : { action: 'wait' };
  }
  return { action: 'wait' };
}

export const avalonCoach = {
  suggestMove(state: AvalonState, playerId = 'you') { return avalonSuggest(state, playerId); },
  explain(state: AvalonState, playerId = 'you', suggested?: AvalonAdvice | null) {
    if (state.winner) return state.winner === 'good' ? '正派胜利。' : '奸徒翻盘。';
    const me = state.players.find((p) => p.id === playerId);
    const phase = AV_PHASE[state.phase] || state.phase;
    const m = suggested === undefined ? avalonSuggest(state, playerId) : suggested;
    const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name || id;
    if (!m || m.action === 'wait') return `当前阶段：${phase}。请等待轮到您行动。`;
    if (m.action === 'propose') {
      const names = m.team.map(nameOf).join('、');
      return `当前是组队（需要 ${m.team.length} 人）。建议提名：${names}。点选肖像后提交。`;
    }
    if (m.action === 'vote') return `当前是表决组队。建议${m.approve ? '同意' : '反对'}这支队伍。`;
    if (m.action === 'quest') {
      if (isEvil(me?.role || 'servant')) return '您在出征队伍里。建议出失败票（只有奸徒能让任务失败）。';
      return '您在出征队伍里。建议出成功票，正派只能让任务成功。';
    }
    if (m.action === 'assassinate') return `正派已完成三轮任务。建议刺杀「${nameOf(m.targetId)}」，点选肖像即可。`;
    return `当前阶段：${phase}。`;
  },
  legalHighlights() { return []; },
};

