'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPiecePlayer, getValidMoves, initGameState } from '@/lib/gameLogic';
import { clearState, loadState, saveState } from '@/lib/storage';
import type { GameState, Piece, Player } from '@/lib/types';

type RoomStatus = 'idle' | 'connecting' | 'waiting' | 'playing' | 'error';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

export function useOnlineGame() {
  const [state, setState] = useState<GameState>(initGameState);
  const [gameKey, setGameKey] = useState(0);
  const [mySlot, setMySlot] = useState<Player>('Red');
  const [roomCode, setRoomCode] = useState('');
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef('');
  const mySlotRef = useRef<Player>('Red');

  // Keep refs in sync
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    mySlotRef.current = mySlot;
  }, [mySlot]);

  // Persist state when it changes
  useEffect(() => {
    if (roomCode) {
      saveState(`stackle-online-${roomCode}`, state);
    }
  }, [state, roomCode]);

  const connect = useCallback(() => {
    // Disconnect stale socket if present
    if (socketRef.current) {
      if (socketRef.current.connected) return;
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SERVER_URL, { transports: ['polling', 'websocket'] });
    socketRef.current = socket;

    // Auto-rejoin only on REconnect (not on the initial connect)
    socket.io.on('reconnect', () => {
      if (roomCodeRef.current) {
        socket.emit('room:rejoin', {
          roomCode: roomCodeRef.current,
          slot: mySlotRef.current,
        });
      }
    });

    socket.on('connect_error', (err) => {
      setErrorMessage(`Could not reach server: ${err.message}`);
      // Only give up entirely if we're not mid-reconnect for an active room
      if (!roomCodeRef.current) {
        setRoomStatus('error');
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    });

    socket.on('room:created', ({ roomCode: code, slot }: { roomCode: string; slot: Player }) => {
      setRoomCode(code);
      setMySlot(slot);
      setRoomStatus('waiting');
    });

    socket.on('room:joined', ({ slot }: { slot: Player }) => {
      setMySlot(slot);
      setRoomStatus('waiting');
    });

    socket.on('room:full', () => {
      setRoomStatus('playing');
      setErrorMessage('');
    });

    socket.on('game:state', (newState: GameState) => {
      setState(() => ({ ...newState, selected: null, validMoves: [] }));
      setErrorMessage('');
    });

    socket.on('room:rejoined', ({ slot, state: newState }: { slot: Player; state: GameState }) => {
      setMySlot(slot);
      setState(() => ({ ...newState, selected: null, validMoves: [] }));
      setRoomStatus('playing');
    });

    socket.on('game:opponent_disconnected', () => {
      // Don't error — opponent has 60 s grace period to come back
      setErrorMessage('Opponent disconnected — waiting for them to reconnect…');
    });

    socket.on('game:error', ({ message }: { message: string }) => {
      setErrorMessage(message);
      setRoomStatus('error');
    });

    socket.on('disconnect', () => {
      // Socket.io will try to reconnect automatically.
      // Only show an error if we were idle (not in a room).
      if (!roomCodeRef.current) {
        setRoomStatus('error');
        setErrorMessage('Disconnected from server');
      }
    });
  }, []);

  const createRoom = useCallback(() => {
    setRoomStatus('connecting');
    setErrorMessage('');
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:create');
    } else {
      connect();
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('room:create');
      });
    }
  }, [connect]);

  const joinRoom = useCallback(
    (code: string) => {
      setRoomStatus('connecting');
      setErrorMessage('');
      setRoomCode(code);
      const saved = loadState(`stackle-online-${code}`);
      if (saved) setState(saved);
      if (socketRef.current?.connected) {
        socketRef.current.emit('room:join', { roomCode: code });
      } else {
        connect();
        socketRef.current?.once('connect', () => {
          socketRef.current?.emit('room:join', { roomCode: code });
        });
      }
    },
    [connect]
  );

  const handleReserveClick = useCallback(
    (piece: Piece) => {
      const owner = getPiecePlayer(piece);
      if (owner !== mySlot || state.currentPlayer !== mySlot) return;

      const selection = { source: 'reserve' as const, piece };
      const validMoves = getValidMoves(state, selection);
      setState(s => ({ ...s, selected: selection, validMoves }));
    },
    [state, mySlot]
  );

  const handleCellClick = useCallback(
    (index: number) => {
      if (state.currentPlayer !== mySlot) return;

      // Valid move → send to server
      if (state.selected && state.validMoves.includes(index)) {
        socketRef.current?.emit('game:move', {
          roomCode: roomCodeRef.current,
          targetCell: index,
          selection: state.selected,
        });
        setState(s => ({ ...s, selected: null, validMoves: [] }));
        return;
      }

      // Select own board piece
      const stack = state.board[index];
      if (stack.length > 0) {
        const topPiece = stack[stack.length - 1];
        const topOwner = getPiecePlayer(topPiece);
        if (topOwner === mySlot) {
          const selection = { source: index, piece: topPiece };
          const validMoves = getValidMoves(state, selection);
          setState(s => ({ ...s, selected: selection, validMoves }));
          return;
        }
      }

      // Deselect
      setState(s => ({ ...s, selected: null, validMoves: [] }));
    },
    [state, mySlot]
  );

  const handleNewGame = useCallback(() => {
    if (!roomCodeRef.current) return;
    clearState(`stackle-online-${roomCodeRef.current}`);
    setGameKey(k => k + 1);
    socketRef.current?.emit('game:new', { roomCode: roomCodeRef.current });
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setRoomStatus('idle');
    setRoomCode('');
    setState(initGameState());
    setGameKey(k => k + 1);
  }, []);

  return {
    state,
    gameKey,
    mySlot,
    roomCode,
    roomStatus,
    errorMessage,
    createRoom,
    joinRoom,
    handleReserveClick,
    handleCellClick,
    handleNewGame,
    disconnect,
  };
}
