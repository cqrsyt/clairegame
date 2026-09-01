import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { randomBytes } from 'crypto';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import {
  createChess, applyChessMove,
  createXiangqi, applyXiangqiMove,
  createGomoku, playGomoku,
  createWerewolf, wolfKill, seerCheck, witchAct, castVote, resolveVotes, hunterShoot, werewolfBotStep,
  createAvalon, proposeTeam, voteTeam, playQuestCard, assassinate, avalonBotStep, nightInfoFor,
} from '@aether/shared';

const ORIGINS = [
  'https://cqrsyt.github.io',
  'https://clairegame.onrender.com',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
];

function originOk(origin?: string) {
  if (!origin) return true;
  return ORIGINS.some((o) => origin === o || origin.startsWith(o));
}

const app = express();
app.use(cors({
  origin: (origin, cb) => cb(null, originOk(origin || undefined)),
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, name: '星域棋庭' }));

const GH_ID = process.env.GITHUB_CLIENT_ID || '';
const GH_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND = process.env.FRONTEND_URL || 'https://cqrsyt.github.io/clairegame';

type SessionUser = { login: string; avatar: string };
const sessions = new Map<string, SessionUser>();

function parseCookie(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sidFrom(req: express.Request) {
  return parseCookie(req.headers.cookie)['aether_sid'];
}

app.get('/api/auth/config', (_req, res) => {
  res.json({ enabled: !!(GH_ID && GH_SECRET) });
});

app.get('/auth/github', (req, res) => {
  if (!GH_ID || !GH_SECRET) {
    return res.status(501).json({
      ok: false,
      error: 'host needs GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET; callback https://clairegame.onrender.com/auth/github/callback',
    });
  }
  const next = typeof req.query.next === 'string' ? req.query.next : FRONTEND;
  const state = Buffer.from(JSON.stringify({ n: randomBytes(8).toString('hex'), next })).toString('base64url');
  const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(GH_ID)}&scope=read:user&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

app.get('/auth/github/callback', async (req, res) => {
  const next = (() => {
    try {
      const st = String(req.query.state || '');
      const parsed = JSON.parse(Buffer.from(st, 'base64url').toString());
      return typeof parsed.next === 'string' ? parsed.next : FRONTEND;
    } catch {
      return FRONTEND;
    }
  })();
  if (!GH_ID || !GH_SECRET) return res.redirect(next);
  const code = String(req.query.code || '');
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GH_ID, client_secret: GH_SECRET, code }),
    });
    const tokenJson = await tokenRes.json() as { access_token?: string };
    if (!tokenJson.access_token) throw new Error('no token');
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}`, 'User-Agent': 'clairegame', Accept: 'application/json' },
    });
    const user = await userRes.json() as { login?: string; avatar_url?: string };
    const sid = randomBytes(16).toString('hex');
    sessions.set(sid, { login: user.login || 'github', avatar: user.avatar_url || '' });
    res.setHeader('Set-Cookie', `aether_sid=${sid}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=1209600`);
    res.redirect(`${next}${next.includes('?') ? '&' : '?'}login=ok`);
  } catch {
    res.redirect(`${next}${next.includes('?') ? '&' : '?'}login=fail`);
  }
});

app.get('/api/me', (req, res) => {
  const sid = sidFrom(req);
  const user = sid ? sessions.get(sid) : undefined;
  res.json({ user: user || null, oauth: !!(GH_ID && GH_SECRET) });
});

app.post('/auth/logout', (req, res) => {
  const sid = sidFrom(req);
  if (sid) sessions.delete(sid);
  res.setHeader('Set-Cookie', 'aether_sid=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0');
  res.json({ ok: true });
});

type Hist = { gameId: string; result: string; at: number; nick: string };
const history = new Map<string, Hist[]>();

app.get('/api/history', (req, res) => {
  const nick = String(req.query.nick || '').trim() || 'traveler';
  res.json({ items: history.get(nick) || [] });
});

app.post('/api/history', (req, res) => {
  const nick = String(req.body?.nick || '').trim() || 'traveler';
  const gameId = String(req.body?.gameId || 'unknown');
  const result = String(req.body?.result || '');
  const list = history.get(nick) || [];
  list.unshift({ nick, gameId, result, at: Date.now() });
  history.set(nick, list.slice(0, 20));
  res.json({ ok: true, items: history.get(nick) });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ORIGINS, credentials: true },
});

type Room = {
  code: string;
  gameId: string;
  host: string;
  players: { id: string; name: string; ready: boolean }[];
  status: 'lobby' | 'playing' | 'ended';
  state: any;
};

const rooms = new Map<string, Room>();

function code() {
  return randomBytes(3).toString('hex').toUpperCase();
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ gameId, name }, cb) => {
    const c = code();
    const room: Room = {
      code: c,
      gameId,
      host: socket.id,
      players: [{ id: socket.id, name: name || 'traveler', ready: true }],
      status: 'lobby',
      state: null,
    };
    rooms.set(c, room);
    socket.join(c);
    cb?.({ ok: true, room });
    io.to(c).emit('room_update', room);
  });

  socket.on('join_room', ({ code: c, name }, cb) => {
    const room = rooms.get(String(c || '').toUpperCase());
    if (!room) return cb?.({ ok: false, error: 'no room' });
    if (room.status !== 'lobby') return cb?.({ ok: false, error: 'started' });
    if (room.players.length >= 12) return cb?.({ ok: false, error: 'full' });
    if (!room.players.some((p) => p.id === socket.id)) {
      room.players.push({ id: socket.id, name: name || 'traveler', ready: false });
    }
    socket.join(room.code);
    cb?.({ ok: true, room });
    io.to(room.code).emit('room_update', room);
  });

  socket.on('toggle_ready', ({ code: c }) => {
    const room = rooms.get(c);
    if (!room) return;
    const p = room.players.find((x) => x.id === socket.id);
    if (p) p.ready = !p.ready;
    io.to(c).emit('room_update', room);
  });

  socket.on('start_game', ({ code: c }) => {
    const room = rooms.get(c);
    if (!room || room.host !== socket.id) return;
    room.status = 'playing';
    const guests = room.players.map((p) => ({ id: p.id, name: p.name, isBot: false }));
    if (room.gameId === 'chess') room.state = createChess();
    else if (room.gameId === 'xiangqi') room.state = createXiangqi();
    else if (room.gameId === 'gomoku') room.state = createGomoku();
    else if (room.gameId === 'werewolf') {
      while (guests.length < 6) guests.push({ id: `bot${guests.length}`, name: `bot${guests.length}`, isBot: true });
      room.state = createWerewolf(guests);
    } else if (room.gameId === 'avalon') {
      while (guests.length < 5) guests.push({ id: `bot${guests.length}`, name: `knight${guests.length}`, isBot: true });
      room.state = createAvalon(guests);
    } else {
      room.state = { stub: true };
    }
    io.to(c).emit('room_update', room);
    io.to(c).emit('game_state', room.state);
  });

  socket.on('game_action', ({ code: c, action, payload }) => {
    const room = rooms.get(c);
    if (!room || room.status !== 'playing') return;
    try {
      if (room.gameId === 'chess') {
        if (action === 'move') {
          room.state = applyChessMove(room.state, payload.fr, payload.fc, payload.tr, payload.tc);
        }
      } else if (room.gameId === 'xiangqi') {
        if (action === 'move') room.state = applyXiangqiMove(room.state, payload.fr, payload.fc, payload.tr, payload.tc);
      } else if (room.gameId === 'gomoku') {
        if (action === 'move') room.state = playGomoku(room.state, payload.r, payload.c);
      } else if (room.gameId === 'werewolf') {
        if (action === 'wolfKill') room.state = wolfKill(room.state, payload.targetId);
        if (action === 'seerCheck') room.state = seerCheck(room.state, payload.targetId);
        if (action === 'witchAct') room.state = witchAct(room.state, payload);
        if (action === 'vote') room.state = castVote(room.state, socket.id, payload.targetId);
        if (action === 'resolveVotes') room.state = resolveVotes(room.state);
        if (action === 'hunterShoot') room.state = hunterShoot(room.state, payload.targetId);
        if (action === 'botStep') room.state = werewolfBotStep(room.state);
      } else if (room.gameId === 'avalon') {
        if (action === 'propose') room.state = proposeTeam(room.state, socket.id, payload.team);
        if (action === 'vote') room.state = voteTeam(room.state, socket.id, payload.approve);
        if (action === 'quest') room.state = playQuestCard(room.state, socket.id, payload.success);
        if (action === 'assassinate') room.state = assassinate(room.state, payload.targetId);
        if (action === 'botStep') room.state = avalonBotStep(room.state);
        if (action === 'nightInfo') {
          socket.emit('night_info', nightInfoFor(room.state, socket.id));
        }
      }
      io.to(c).emit('game_state', room.state);
      io.to(c).emit('room_update', room);
    } catch (e) {
      socket.emit('error_msg', String(e));
    }
  });

  socket.on('disconnect', () => {
    for (const [c, room] of rooms) {
      const before = room.players.length;
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length === 0) rooms.delete(c);
      else if (before !== room.players.length) {
        if (room.host === socket.id) room.host = room.players[0].id;
        io.to(c).emit('room_update', room);
      }
    }
  });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`AETHER TABLE server on :${PORT}`);
});
