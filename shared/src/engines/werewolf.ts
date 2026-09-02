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

function pickStable<T>(arr: T[], key: (x: T) => string): T | undefined {
  if (!arr.length) return undefined;
  return arr.slice().sort((a, b) => key(a).localeCompare(key(b)))[0];
}

function priorityKill(state: WerewolfState) {
  const prey = good(state);
  const seer = prey.find((p) => p.role === 'seer');
  const witch = prey.find((p) => p.role === 'witch');
  const hunter = prey.find((p) => p.role === 'hunter');
  // 狼人只知道同伴；夜里优先刀发言/投票针对过狼人的人。无历史时按身份价值（神职优先）——对局内机器人知道身份用于教学局。
  return seer || witch || hunter || pickStable(prey, (p) => p.id);
}

/** Advance bots for current phase */
export function werewolfBotStep(state: WerewolfState): WerewolfState {
  const bots = state.players.filter((p) => p.isBot && p.alive);
  if (state.phase === 'night_wolf') {
    const wolvesAlive = wolves(state);
    if (!wolvesAlive.some((w) => !w.isBot)) {
      const prey = priorityKill(state);
      if (prey) return wolfKill(state, prey.id);
    }
  }
  if (state.phase === 'night_seer') {
    const seer = state.players.find((p) => p.role === 'seer' && p.alive);
    if (seer?.isBot) {
      const others = alive(state).filter((p) => p.id !== seer.id);
      const unseen = others.filter((p) => state.seerResult?.id !== p.id);
      const wolvesFirst = unseen.filter((p) => p.role === 'werewolf');
      const pick = pickStable(wolvesFirst.length ? wolvesFirst : unseen.length ? unseen : others, (p) => p.id);
      if (pick) return seerCheck(state, pick.id);
      return { ...state, phase: 'night_witch' };
    }
    if (!seer) return { ...state, phase: 'night_witch' };
  }
  if (state.phase === 'night_witch') {
    const witch = state.players.find((p) => p.role === 'witch' && p.alive);
    if (!witch || witch.isBot) {
      const tgt = state.players.find((p) => p.id === state.wolfTarget);
      const saveSelf = tgt?.id === witch?.id;
      const saveGod = tgt && (tgt.role === 'seer' || tgt.role === 'hunter' || tgt.role === 'witch');
      const save = !!(witch?.isBot && state.witchPotions.save && state.wolfTarget && (saveSelf || saveGod || state.night === 1));
      let poisonId: string | null = null;
      if (witch?.isBot && state.witchPotions.poison && !save && state.night >= 2) {
        const wolf = wolves(state).filter((w) => w.id !== witch.id && w.id !== state.wolfTarget).sort((a, b) => a.id.localeCompare(b.id))[0];
        if (wolf) poisonId = wolf.id;
      }
      return witchAct(state, { save, poisonId });
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
      let pickId: string | undefined;
      if (b.role === 'werewolf') {
        const pool = targets.filter((t) => t.role !== 'werewolf');
        pickId = pickStable(pool.length ? pool : targets, (p) => p.id)?.id;
      } else if (b.role === 'seer' && state.seerResult) {
        if (state.seerResult.isWolf && targets.some((t) => t.id === state.seerResult!.id)) pickId = state.seerResult.id;
        else pickId = pickStable(targets.filter((t) => t.id !== state.seerResult!.id && t.role === 'werewolf').concat(targets), (p) => p.id)?.id;
      } else {
        // 好人：跟预言家的票，否则投狼人（教学）否则按名字稳定选择
        const seerVote = Object.entries(state.votes).find(([vid, tid]) => {
          const v = state.players.find((p) => p.id === vid);
          return v?.role === 'seer' && targets.some((t) => t.id === tid);
        });
        if (seerVote) pickId = seerVote[1];
        else pickId = pickStable(targets.filter((t) => t.role === 'werewolf').concat(targets), (p) => p.id)?.id;
      }
      if (pickId) state = castVote(state, b.id, pickId);
    }
    const living = alive(state);
    if (living.every((p) => state.votes[p.id]) || living.filter((p) => !p.isBot).every((p) => state.votes[p.id])) {
      if (living.every((p) => state.votes[p.id])) return resolveVotes(state);
    }
  }
  if (state.phase === 'hunter_shot') {
    const hunter = state.players.find((p) => p.id === state.hunterMayShoot);
    if (hunter?.isBot || !hunter) {
      const targets = alive(state).filter((p) => p.id !== hunter?.id);
      const wolf = targets.filter((t) => t.role === 'werewolf');
      const pick = pickStable(wolf.length ? wolf : targets, (p) => p.id);
      return hunterShoot(state, pick?.id ?? null);
    }
  }
  return state;
}

const WW_PHASE: Record<string, string> = {
  night_wolf: '天黑，狼人请睁眼',
  night_seer: '预言家请睁眼',
  night_witch: '女巫请行动',
  day_talk: '白天发言、投票放逐',
  day_vote: '投票放逐',
  hunter_shot: '猎人开枪',
  ended: '胜负已分',
};

export type WWAdvice =
  | { action: 'kill' | 'check' | 'vote' | 'shoot'; targetId: string }
  | { action: 'save' }
  | { action: 'skip' }
  | { action: 'wait' };

function publicPick(players: WWPlayer[]) {
  return players.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
}

export function werewolfSuggest(state: WerewolfState, playerId = 'you'): WWAdvice | null {
  const me = state.players.find((p) => p.id === playerId);
  if (!me) return null;
  if (state.phase === 'ended' || !me.alive) return { action: 'wait' };
  const others = state.players.filter((p) => p.alive && p.id !== me.id);
  if (state.phase === 'night_wolf' && me.role === 'werewolf') {
    const prey = others.filter((p) => p.role !== 'werewolf');
    const pick = publicPick(prey.length ? prey : others);
    return pick ? { action: 'kill', targetId: pick.id } : { action: 'wait' };
  }
  if (state.phase === 'night_seer' && me.role === 'seer') {
    const unseen = others.filter((p) => state.seerResult?.id !== p.id);
    const pick = publicPick(unseen.length ? unseen : others);
    return pick ? { action: 'check', targetId: pick.id } : { action: 'wait' };
  }
  if (state.phase === 'night_witch' && me.role === 'witch') {
    const tgt = state.players.find((p) => p.id === state.wolfTarget);
    if (state.witchPotions.save && tgt && (state.night === 1 || tgt.id === me.id)) return { action: 'save' };
    return { action: 'skip' };
  }
  if ((state.phase === 'day_talk' || state.phase === 'day_vote') && !state.votes[me.id]) {
    if (me.role === 'seer' && state.seerResult?.isWolf) {
      const t = others.find((p) => p.id === state.seerResult!.id);
      if (t) return { action: 'vote', targetId: t.id };
    }
    let pool = others;
    if (me.role === 'werewolf') pool = others.filter((p) => p.role !== 'werewolf');
    else {
      const voted = Object.values(state.votes)
        .map((id) => others.find((p) => p.id === id))
        .filter((p): p is WWPlayer => !!p);
      if (voted.length) pool = voted;
    }
    const pick = publicPick(pool.length ? pool : others);
    return pick ? { action: 'vote', targetId: pick.id } : { action: 'wait' };
  }
  if (state.phase === 'hunter_shot' && state.hunterMayShoot === me.id) {
    const pick = publicPick(others);
    return pick ? { action: 'shoot', targetId: pick.id } : { action: 'skip' };
  }
  return { action: 'wait' };
}

export const werewolfCoach = {
  suggestMove(state: WerewolfState, playerId = 'you') { return werewolfSuggest(state, playerId); },
  explain(state: WerewolfState, playerId = 'you', suggested?: WWAdvice | null) {
    if (state.winner) return state.winner === 'wolves' ? '狼人获胜。' : '好人获胜。';
    const me = state.players.find((p) => p.id === playerId);
    const phase = WW_PHASE[state.phase] || state.phase;
    const m = suggested === undefined ? werewolfSuggest(state, playerId) : suggested;
    const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name || id;
    if (!me || !me.alive) return `当前阶段：${phase}。您已出局，请旁观。`;
    if (!m || m.action === 'wait') return `当前阶段：${phase}。请等待轮到您行动。`;
    if (m.action === 'kill') return `当前是狼人夜。建议刀「${nameOf(m.targetId)}」，点选肖像即可。`;
    if (m.action === 'check') return `预言家请睁眼。建议查验「${nameOf(m.targetId)}」，不要把查验结果直接说破身份。`;
    if (m.action === 'save') {
      const tgt = state.players.find((p) => p.id === state.wolfTarget);
      return `女巫回合。刀口是「${tgt?.name}」。建议救人。`;
    }
    if (m.action === 'skip' && state.phase === 'night_witch') return '女巫回合。建议过，把药留到更关键的夜晚。';
    if (m.action === 'vote') return `白天投票。建议投给「${nameOf(m.targetId)}」，点选肖像即可。`;
    if (m.action === 'shoot') return `猎人可以开枪。建议带走「${nameOf(m.targetId)}」。`;
    if (m.action === 'skip') return `当前阶段：${phase}。可以放弃开枪。`;
    return `当前阶段：${phase}。`;
  },
  legalHighlights() { return []; },
};

