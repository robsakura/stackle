import type { GameState, Player } from './lib/types';
import { applyMove, initGameState } from './lib/gameLogic';

export interface Room {
  code: string;
  state: GameState;
  players: { Red: string | null; Yellow: string | null };
  createdAt: number;
  ranked: boolean;
  userIds: { Red: string | null; Yellow: string | null };
  nicknames: { Red: string | null; Yellow: string | null };
  resultRecorded: boolean;
}

const rooms = new Map<string, Room>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

const GRACE_PERIOD_MS = 60_000; // 60 seconds before a player is truly removed

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
    ranked: false,
    userIds: { Red: null, Yellow: null },
    nicknames: { Red: null, Yellow: null },
    resultRecorded: false,
  };
  rooms.set(code, room);
  return { code, slot: 'Red' };
}

export function createRankedRoom(
  socketIdRed: string, userIdRed: string, nicknameRed: string,
  socketIdYellow: string, userIdYellow: string, nicknameYellow: string
): { code: string; state: GameState } {
  let code = randomCode();
  while (rooms.has(code)) code = randomCode();

  const state = initGameState();
  const room: Room = {
    code,
    state,
    players: { Red: socketIdRed, Yellow: socketIdYellow },
    createdAt: Date.now(),
    ranked: true,
    userIds: { Red: userIdRed, Yellow: userIdYellow },
    nicknames: { Red: nicknameRed, Yellow: nicknameYellow },
    resultRecorded: false,
  };
  rooms.set(code, room);
  return { code, state };
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
  targetCell: number,
  selection: import('./lib/types').Selection
): GameState {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');

  const slot = getSlotForSocket(room, socketId);
  if (!slot) throw new Error('Not a player in this room');
  if (slot !== room.state.currentPlayer) throw new Error('Not your turn');

  room.state = applyMove({ ...room.state, selected: selection }, targetCell);
  return room.state;
}

export function resetRoom(code: string): GameState {
  const room = rooms.get(code);
  if (!room) throw new Error('Room not found');
  room.state = initGameState();
  return room.state;
}

/** Schedule player removal after grace period. Calls onExpired (if provided) when timer fires. */
export function scheduleRemovePlayer(socketId: string, onExpired?: () => void): void {
  const existing = disconnectTimers.get(socketId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    disconnectTimers.delete(socketId);
    onExpired?.();
    for (const [code, room] of rooms.entries()) {
      if (room.players.Red === socketId) room.players.Red = null;
      if (room.players.Yellow === socketId) room.players.Yellow = null;
      if (!room.players.Red && !room.players.Yellow) {
        rooms.delete(code);
      }
    }
  }, GRACE_PERIOD_MS);

  disconnectTimers.set(socketId, timer);
}

/** Rejoin an existing room with a new socket ID. Returns the room and slot, or throws. */
export function rejoinRoom(
  newSocketId: string,
  roomCode: string,
  slot: Player
): { room: Room; state: GameState } {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found');

  const slotKey = slot as 'Red' | 'Yellow';
  const oldSocketId = room.players[slotKey];

  if (oldSocketId) {
    const timer = disconnectTimers.get(oldSocketId);
    if (timer) {
      clearTimeout(timer);
      disconnectTimers.delete(oldSocketId);
    }
  }

  room.players[slotKey] = newSocketId;
  return { room, state: room.state };
}

/** Immediately remove a player (used only when no rejoin is expected). */
export function removePlayer(socketId: string): void {
  const timer = disconnectTimers.get(socketId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(socketId);
  }
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
