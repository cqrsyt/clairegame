import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { randomBytes } from 'crypto';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import {
  createChess, applyChessMove, chessAI,
  createXiangqi, applyXiangqiMove, xiangqiAI,
  createGomoku, playGomoku, gomokuAI,
  createWerewolf, wolfKill, seerCheck, witchAct, castVote, resolveVotes, hunterShoot, werewolfBotStep,
  createAvalon, proposeTeam, voteTeam, playQuestCard, assassinate, avalonBotStep, nightInfoFor,
} from '@aether/shared';

const app = express();
app.use(cors());
app.get('/api/health', (_req, res) => res.json({ ok: true, name: '星域棋庭' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
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
      players: [{ id: socket.id, name: name || '旅人', ready: true }],
      status: 'lobby',
      state: null,
    };
    rooms.set(c, room);
    socket.join(c);
    cb?.({ ok: true, room });
    io.to(c).emit('room_update', room);
  });

  socket.on('join_room', ({ code: c, name }, cb) => {
    const room = rooms.get(String(c).toUpperCase());
    if (!room) return cb?.({ ok: false, error: '房间不存在' });
    if (room.status !== 'lobby') return cb?.({ ok: false, error: '对局已开始' });
    if (room.players.length >= 12) return cb?.({ ok: false, error: '房间已满' });
    room.players.push({ id: socket.id, name: name || '旅人', ready: false });
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
      while (guests.length < 6) guests.push({ id: `bot${guests.length}`, name: `机器人${guests.length}`, isBot: true });
      room.state = createWerewolf(guests);
    } else if (room.gameId === 'avalon') {
      while (guests.length < 5) guests.push({ id: `bot${guests.length}`, name: `骑士${guests.length}`, isBot: true });
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
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`AETHER TABLE server on :${PORT}`);
});
