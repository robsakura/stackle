import type { GameState, Player } from './lib/types';
import { applyMove, initGameState } from './lib/gameLogic';

interface Room {
  code: string;
  state: GameState;
  players: { Red: string | null; Yellow: string | null };
  createdAt: number;
}

const rooms = new Map<string, Room>();

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(socketId: string): { code: string; slot: Player } {
  let code = randomCode();
  while (rooms.has(code)) code = randomCode();

  const room: Room = {
    code,
    state: initGameState(),
    players: { Red: socketId, Yellow: null },
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return { code, slot: 'Red' };
}

export function joinRoom(socketId: string, code: string): { slot: Player } {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');
  if (room.players.Yellow !== null) throw new Error('Room is full');
  room.players.Yellow = socketId;
  return { slot: 'Yellow' };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.Red === socketId || room.players.Yellow === socketId) {
      return room;
    }
  }
  return undefined;
}

export function getSlotForSocket(room: Room, socketId: string): Player | null {
  if (room.players.Red === socketId) return 'Red';
  if (room.players.Yellow === socketId) return 'Yellow';
  return null;
}

export function applyServerMove(
  code: string,
  socketId: string,
  targetCell: number
): GameState {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');

  const slot = getSlotForSocket(room, socketId);
  if (!slot) throw new Error('Not a player in this room');
  if (slot !== room.state.currentPlayer) throw new Error('Not your turn');

  room.state = applyMove(room.state, targetCell);
  return room.state;
}

export function resetRoom(code: string): GameState {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');
  room.state = initGameState();
  return room.state;
}

export function removePlayer(socketId: string): void {
  for (const [code, room] of rooms.entries()) {
    if (room.players.Red === socketId) room.players.Red = null;
    if (room.players.Yellow === socketId) room.players.Yellow = null;
    if (!room.players.Red && !room.players.Yellow) {
      rooms.delete(code);
    }
  }
}

// Clean up rooms older than 2 hours every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}, 30 * 60 * 1000);
