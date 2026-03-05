import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  applyServerMove,
  createRoom,
  getRoom,
  getRoomBySocket,
  getSlotForSocket,
  joinRoom,
  rejoinRoom,
  removePlayer,
  resetRoom,
  scheduleRemovePlayer,
} from './roomManager';

const app = express();
const httpServer = createServer(app);
const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
const clientUrlWww = clientUrl.replace('://', '://www.');
const io = new Server(httpServer, {
  cors: {
    origin: [clientUrl, clientUrlWww],
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', socket => {
  console.log('connected:', socket.id);

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
        // Broadcast full state to both players
        io.to(roomCode).emit('room:full');
        io.to(roomCode).emit('game:state', room.state);
      }
    } catch (err) {
      socket.emit('game:error', { message: (err as Error).message });
    }
  });

  socket.on(
    'game:move',
    ({ roomCode, targetCell, selection }: { roomCode: string; targetCell: number; selection: import('./lib/types').Selection }) => {
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
    ({ roomCode, slot }: { roomCode: string; slot: import('./lib/types').Player }) => {
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

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    const room = getRoomBySocket(socket.id);
    if (room) {
      scheduleRemovePlayer(socket.id);
      // Notify opponent but let them keep playing; if the player reconnects within 60s it's fine
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
