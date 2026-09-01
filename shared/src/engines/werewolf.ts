export type WWRole = 'werewolf' | 'seer' | 'witch' | 'hunter' | 'villager';
export type WWPhase =
  | 'night_wolf' | 'night_seer' | 'night_witch'
  | 'dawn' | 'day_talk' | 'day_vote' | 'hunter_shot' | 'ended';

export interface WWPlayer {
  id: string;
  name: string;
  role: WWRole;
  alive: boolean;
  isBot: boolean;
}

export interface WerewolfState {
  players: WWPlayer[];
  phase: WWPhase;
  night: number;
  wolfTarget: string | null;
  seerTarget: string | null;
  seerResult: { id: string; isWolf: boolean } | null;
  witchSave: boolean;
  witchPoison: string | null;
  witchPotions: { save: boolean; poison: boolean };
  dawnDeaths: string[];
  votes: Record<string, string>; // voter -> target
  hunterMayShoot: string | null;
  winner: 'wolves' | 'villagers' | null;
  log: string[];
}

const ROLE_SETS: Record<number, WWRole[]> = {
  6: ['werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'villager'],
  8: ['werewolf', 'werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'villager', 'villager'],
  9: ['werewolf', 'werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'villager', 'villager', 'villager'],
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createWerewolf(names: { id: string; name: string; isBot: boolean }[]): WerewolfState {
  const n = names.length >= 8 ? 8 : 6;
  const roster = names.slice(0, n);
  while (roster.length < n) {
    roster.push({ id: `bot${roster.length}`, name: `机器人${roster.length}`, isBot: true });
  }
  const roles = shuffle(ROLE_SETS[n]);
  const players: WWPlayer[] = roster.map((p, i) => ({
    ...p,
    role: roles[i],
    alive: true,
  }));
  return {
    players,
    phase: 'night_wolf',
    night: 1,
    wolfTarget: null,
    seerTarget: null,
    seerResult: null,
    witchSave: false,
    witchPoison: null,
    witchPotions: { save: true, poison: true },
    dawnDeaths: [],
    votes: {},
    hunterMayShoot: null,
    winner: null,
    log: [`第 1 夜降临。狼人请睁眼。`],
  };
}

function alive(s: WerewolfState) { return s.players.filter((p) => p.alive); }
function wolves(s: WerewolfState) { return alive(s).filter((p) => p.role === 'werewolf'); }
function good(s: WerewolfState) { return alive(s).filter((p) => p.role !== 'werewolf'); }

function checkWin(s: WerewolfState): WerewolfState {
  if (wolves(s).length === 0) return { ...s, phase: 'ended', winner: 'villagers', log: [...s.log, '好人阵营胜利！'] };
  if (wolves(s).length >= good(s).length) return { ...s, phase: 'ended', winner: 'wolves', log: [...s.log, '狼人屠边胜利！'] };
  return s;
}

export function wolfKill(state: WerewolfState, targetId: string): WerewolfState {
  if (state.phase !== 'night_wolf') return state;
  const t = state.players.find((p) => p.id === targetId && p.alive && p.role !== 'werewolf');
  if (!t) return state;
  return { ...state, wolfTarget: targetId, phase: 'night_seer', log: [...state.log, '狼人已锁定猎物。'] };
}

export function seerCheck(state: WerewolfState, targetId: string): WerewolfState {
  if (state.phase !== 'night_seer') return state;
  const seer = state.players.find((p) => p.role === 'seer' && p.alive);
  if (!seer) return { ...state, phase: 'night_witch' };
  const t = state.players.find((p) => p.id === targetId && p.alive);
  if (!t) return state;
  return {
    ...state,
    seerTarget: targetId,
    seerResult: { id: targetId, isWolf: t.role === 'werewolf' },
    phase: 'night_witch',
    log: [...state.log, '预言家已查验。'],
  };
}

export function witchAct(
  state: WerewolfState,
  opts: { save?: boolean; poisonId?: string | null }
): WerewolfState {
  if (state.phase !== 'night_witch') return state;
  const potions = { ...state.witchPotions };
  let witchSave = false;
  let witchPoison: string | null = null;
  if (opts.save && potions.save && state.wolfTarget) {
    witchSave = true;
    potions.save = false;
  }
  if (opts.poisonId && potions.poison) {
    witchPoison = opts.poisonId;
    potions.poison = false;
  }
  // resolve dawn
  const deaths = new Set<string>();
  if (state.wolfTarget && !witchSave) deaths.add(state.wolfTarget);
  if (witchPoison) deaths.add(witchPoison);

  let players = state.players.map((p) =>
    deaths.has(p.id) ? { ...p, alive: false } : p
  );

  let hunterMayShoot: string | null = null;
  for (const id of deaths) {
    const p = state.players.find((x) => x.id === id);
    if (p?.role === 'hunter') hunterMayShoot = id;
  }

  const deathNames = [...deaths].map((id) => state.players.find((p) => p.id === id)?.name ?? id);
  let next: WerewolfState = {
    ...state,
    players,
    witchSave,
    witchPoison,
    witchPotions: potions,
    dawnDeaths: [...deaths],
    phase: hunterMayShoot ? 'hunter_shot' : 'day_talk',
    hunterMayShoot,
    votes: {},
    log: [
      ...state.log,
      deathNames.length ? `天亮了，倒下的是：${deathNames.join('、')}` : '天亮了，平安夜。',
    ],
  };
  next = checkWin(next);
  if (next.phase === 'ended') return next;
  if (!hunterMayShoot) next.phase = 'day_talk';
  return next;
}

export function hunterShoot(state: WerewolfState, targetId: string | null): WerewolfState {
  if (state.phase !== 'hunter_shot') return state;
  let players = state.players;
  const log = [...state.log];
  if (targetId) {
    const t = players.find((p) => p.id === targetId && p.alive);
    if (t) {
      players = players.map((p) => (p.id === targetId ? { ...p, alive: false } : p));
      log.push(`猎人开枪带走了 ${t.name}`);
    }
  }
  let next: WerewolfState = {
    ...state,
    players,
    hunterMayShoot: null,
    phase: 'day_talk',
    log,
  };
  return checkWin(next);
}

export function castVote(state: WerewolfState, voterId: string, targetId: string): WerewolfState {
  if (state.phase !== 'day_vote' && state.phase !== 'day_talk') return state;
  const voter = state.players.find((p) => p.id === voterId && p.alive);
  const target = state.players.find((p) => p.id === targetId && p.alive);
  if (!voter || !target) return state;
  const votes = { ...state.votes, [voterId]: targetId };
  const phase: WWPhase = 'day_vote';
  return { ...state, votes, phase };
}

export function resolveVotes(state: WerewolfState): WerewolfState {
  if (state.phase !== 'day_vote') return state;
  const counts: Record<string, number> = {};
  for (const t of Object.values(state.votes)) counts[t] = (counts[t] || 0) + 1;
  let best: string | null = null;
  let bestN = 0;
  let tie = false;
  for (const [id, n] of Object.entries(counts)) {
    if (n > bestN) { best = id; bestN = n; tie = false; }
    else if (n === bestN) tie = true;
  }
  if (!best || tie) {
    return {
      ...state,
      phase: 'night_wolf',
      night: state.night + 1,
      wolfTarget: null,
      seerTarget: null,
      seerResult: null,
      votes: {},
      log: [...state.log, '投票平票，无人放逐。夜幕再次降临。'],
    };
  }
  let players = state.players.map((p) => (p.id === best ? { ...p, alive: false } : p));
  const victim = state.players.find((p) => p.id === best)!;
  let hunterMayShoot: string | null = victim.role === 'hunter' ? best : null;
  let next: WerewolfState = {
    ...state,
    players,
    phase: hunterMayShoot ? 'hunter_shot' : 'night_wolf',
    hunterMayShoot,
    night: hunterMayShoot ? state.night : state.night + 1,
    wolfTarget: null,
    seerTarget: null,
    seerResult: null,
    votes: {},
    log: [...state.log, `${victim.name} 被放逐。身份是 ${victim.role}。`],
  };
  next = checkWin(next);
  if (next.phase === 'ended') return next;
  if (!hunterMayShoot) {
    next = {
      ...next,
      phase: 'night_wolf',
      night: state.night + 1,
      log: [...next.log, `第 ${state.night + 1} 夜降临。`],
    };
  }
  return next;
}

/** Advance bots for current phase */
export function werewolfBotStep(state: WerewolfState): WerewolfState {
  const bots = state.players.filter((p) => p.isBot && p.alive);
  if (state.phase === 'night_wolf') {
    const wolvesAlive = wolves(state);
    if (!wolvesAlive.some((w) => !w.isBot)) {
      const prey = good(state);
      if (prey.length) return wolfKill(state, prey[Math.floor(Math.random() * prey.length)].id);
    }
  }
  if (state.phase === 'night_seer') {
    const seer = state.players.find((p) => p.role === 'seer' && p.alive);
    if (seer?.isBot) {
      const others = alive(state).filter((p) => p.id !== seer.id);
      if (others.length) return seerCheck(state, others[Math.floor(Math.random() * others.length)].id);
      return { ...state, phase: 'night_witch' };
    }
    if (!seer) return { ...state, phase: 'night_witch' };
  }
  if (state.phase === 'night_witch') {
    const witch = state.players.find((p) => p.role === 'witch' && p.alive);
    if (!witch || witch.isBot) {
      const save = !!(witch?.isBot && state.witchPotions.save && state.wolfTarget && Math.random() > 0.4);
      return witchAct(state, { save, poisonId: null });
    }
  }
  if (state.phase === 'day_talk') {
    return { ...state, phase: 'day_vote' };
  }
  if (state.phase === 'day_vote') {
    for (const b of bots) {
      if (state.votes[b.id]) continue;
      const targets = alive(state).filter((p) => p.id !== b.id);
      if (!targets.length) continue;
      // wolves vote non-wolves preferentially
      const pool = b.role === 'werewolf'
        ? targets.filter((t) => t.role !== 'werewolf')
        : targets;
      const pick = (pool.length ? pool : targets)[Math.floor(Math.random() * (pool.length || targets.length))];
      state = castVote(state, b.id, pick.id);
    }
    const living = alive(state);
    if (living.every((p) => state.votes[p.id]) || living.filter((p) => !p.isBot).every((p) => state.votes[p.id])) {
      // if all humans voted, resolve (bots already filled)
      if (living.every((p) => state.votes[p.id])) return resolveVotes(state);
    }
  }
  if (state.phase === 'hunter_shot') {
    const hunter = state.players.find((p) => p.id === state.hunterMayShoot);
    if (hunter?.isBot || !hunter) {
      const targets = alive(state);
      const pick = targets[Math.floor(Math.random() * targets.length)];
      return hunterShoot(state, pick?.id ?? null);
    }
  }
  return state;
}
