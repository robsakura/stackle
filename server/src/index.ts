import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  applyServerMove,
  createRankedRoom,
  createRoom,
  getRoom,
  getRoomBySocket,
  getSlotForSocket,
  joinRoom,
  rejoinRoom,
  resetRoom,
  scheduleRemovePlayer,
} from './roomManager';
import { loginUser, registerUser, verifyToken } from './authManager';
import { dequeue, enqueue } from './matchmakingManager';
import { getLeaderboard, getUserStats, recordDrop, recordResult } from './statsManager';
import type { Player, Selection } from './lib/types';

const app = express();
const httpServer = createServer(app);
const clientUrls = (process.env.CLIENT_URL ?? 'http://localhost:3000')
  .split(',')
  .flatMap(url => [url.trim(), url.trim().replace('://', '://www.')]);

const corsOptions = {
  origin: clientUrls,
  methods: ['GET', 'POST'],
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(httpServer, { cors: corsOptions });

// ── REST endpoints ──────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/register', async (req, res) => {
  try {
    const { username, nickname, password } = req.body as {
      username?: string; nickname?: string; password?: string;
    };
    if (!username || !nickname || !password) {
      return res.status(400).json({ error: 'username, nickname, and password are required' });
    }
    const user = await registerUser(username.trim(), nickname.trim(), password);
    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const token = await loginUser(username.trim(), password);
    return res.json({ token });
  } catch (err) {
    return res.status(401).json({ error: (err as Error).message });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const data = await getLeaderboard();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/stats/:userId', async (req, res) => {
  try {
    const stats = await getUserStats(req.params.userId);
    if (!stats) return res.status(404).json({ error: 'User not found' });
    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ── Socket.IO events ────────────────────────────────────────────────────────

io.on('connection', socket => {
  console.log('connected:', socket.id);

  // ── Unranked events (unchanged) ──

  socket.on('room:create', () => {
    try {
      const { code, slot } = createRoom(socket.id);
      socket.join(code);
      socket.emit('room:created', { roomCode: code, slot });
    } catch (err) {
      socket.emit('game:error', { message: (err as Error).message });
    }
  });

  socket.on('room:join', ({ roomCode }: { roomCode: string }) => {
    try {
      const { slot } = joinRoom(socket.id, roomCode);
      socket.join(roomCode);
      socket.emit('room:joined', { slot });

      const room = getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit('room:full');
        io.to(roomCode).emit('game:state', room.state);
      }
    } catch (err) {
      socket.emit('game:error', { message: (err as Error).message });
    }
  });

  socket.on(
    'game:move',
    ({ roomCode, targetCell, selection }: { roomCode: string; targetCell: number; selection: Selection }) => {
      try {
        const newState = applyServerMove(roomCode, socket.id, targetCell, selection);
        io.to(roomCode).emit('game:state', newState);
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    }
  );

  socket.on('game:new', ({ roomCode }: { roomCode: string }) => {
    try {
      const room = getRoom(roomCode);
      if (!room) throw new Error('Room not found');
      const slot = getSlotForSocket(room, socket.id);
      if (!slot) throw new Error('Not a player in this room');
      const newState = resetRoom(roomCode);
      io.to(roomCode).emit('game:state', newState);
    } catch (err) {
      socket.emit('game:error', { message: (err as Error).message });
    }
  });

  socket.on(
    'room:rejoin',
    ({ roomCode, slot }: { roomCode: string; slot: Player }) => {
      try {
        const { room, state } = rejoinRoom(socket.id, roomCode, slot);
        socket.join(roomCode);
        socket.emit('room:rejoined', { slot, state });
        console.log(`rejoined: ${socket.id} slot=${slot} room=${roomCode}`);
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    }
  );

  // ── Ranked events ──

  socket.on('ranked:queue', ({ token }: { token: string }) => {
    try {
      const payload = verifyToken(token);
      enqueue(
        socket.id,
        payload.userId,
        payload.nickname,
        (socketIdA, userIdA, nicknameA, socketIdB, userIdB, nicknameB) => {
          const { code, state } = createRankedRoom(
            socketIdA, userIdA, nicknameA,
            socketIdB, userIdB, nicknameB
          );
          const socketA = io.sockets.sockets.get(socketIdA);
          const socketB = io.sockets.sockets.get(socketIdB);
          socketA?.join(code);
          socketB?.join(code);

          socketA?.emit('ranked:matched', {
            roomCode: code,
            slot: 'Red' as Player,
            myNickname: nicknameA,
            myUserId: userIdA,
            opponentNickname: nicknameB,
            opponentUserId: userIdB,
            state,
          });
          socketB?.emit('ranked:matched', {
            roomCode: code,
            slot: 'Yellow' as Player,
            myNickname: nicknameB,
            myUserId: userIdB,
            opponentNickname: nicknameA,
            opponentUserId: userIdA,
            state,
          });
        },
        (timedOutSocketId) => {
          io.to(timedOutSocketId).emit('ranked:no_match');
        }
      );
    } catch (err) {
      socket.emit('game:error', { message: (err as Error).message });
    }
  });

  socket.on('ranked:dequeue', () => {
    dequeue(socket.id);
  });

  socket.on(
    'ranked:move',
    ({ roomCode, targetCell, selection }: { roomCode: string; targetCell: number; selection: Selection }) => {
      try {
        const room = getRoom(roomCode);
        if (!room || !room.ranked) throw new Error('Ranked room not found');

        const newState = applyServerMove(roomCode, socket.id, targetCell, selection);
        const stateWithNicknames = { ...newState, nicknames: room.nicknames };
        io.to(roomCode).emit('ranked:state', stateWithNicknames);

        if (newState.winner && newState.winner !== 'draw' && !room.resultRecorded) {
          room.resultRecorded = true;
          const winnerSlot = newState.winner as Player;
          const loserSlot: Player = winnerSlot === 'Red' ? 'Yellow' : 'Red';
          const winnerId = room.userIds[winnerSlot];
          const loserId = room.userIds[loserSlot];
          if (winnerId && loserId) {
            recordResult(winnerId, loserId).catch(console.error);
          }
        }
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    }
  );

  socket.on(
    'ranked:rejoin',
    ({ roomCode, token }: { roomCode: string; token: string }) => {
      try {
        const payload = verifyToken(token);
        const room = getRoom(roomCode);
        if (!room || !room.ranked) throw new Error('Ranked room not found');

        // Find which slot belongs to this user
        const slot: Player | null =
          room.userIds.Red === payload.userId ? 'Red' :
          room.userIds.Yellow === payload.userId ? 'Yellow' :
          null;
        if (!slot) throw new Error('Not a player in this room');

        const { state } = rejoinRoom(socket.id, roomCode, slot);
        socket.join(roomCode);
        socket.emit('ranked:rejoined', {
          slot,
          state: { ...state, nicknames: room.nicknames },
          myNickname: room.nicknames[slot],
          myUserId: payload.userId,
          opponentNickname: room.nicknames[slot === 'Red' ? 'Yellow' : 'Red'],
          opponentUserId: room.userIds[slot === 'Red' ? 'Yellow' : 'Red'],
        });
        console.log(`ranked rejoin: ${socket.id} slot=${slot} room=${roomCode}`);
      } catch (err) {
        socket.emit('game:error', { message: (err as Error).message });
      }
    }
  );

  // ── Disconnect ──

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    dequeue(socket.id);
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    if (room.ranked) {
      const slot = getSlotForSocket(room, socket.id);
      const opponentSlot: Player = slot === 'Red' ? 'Yellow' : 'Red';
      const opponentSocketId = room.players[opponentSlot];
      const dropperId = slot ? room.userIds[slot] : null;
      const opponentId = room.userIds[opponentSlot];

      scheduleRemovePlayer(socket.id, () => {
        if (!room.resultRecorded && dropperId && opponentId) {
          room.resultRecorded = true;
          recordDrop(dropperId, opponentId).catch(console.error);
          if (opponentSocketId) {
            io.to(opponentSocketId).emit('ranked:you_win');
          }
        }
      });
      socket.to(room.code).emit('ranked:opponent_disconnected');
    } else {
      scheduleRemovePlayer(socket.id);
      socket.to(room.code).emit('game:opponent_disconnected');
    }
  });
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);
console.log(`Starting server. PORT env: ${process.env.PORT}, using: ${PORT}`);
console.log(`CLIENT_URL: ${process.env.CLIENT_URL}`);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Stackle server running on port ${PORT}`);
});
