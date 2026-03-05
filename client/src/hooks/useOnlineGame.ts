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

  // Keep roomCodeRef in sync
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  // Persist state when it changes
  useEffect(() => {
    if (roomCode) {
      saveState(`stackle-online-${roomCode}`, state);
    }
  }, [state, roomCode]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    const socket = io(SERVER_URL, { transports: ['polling', 'websocket'] });
    socketRef.current = socket;

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
    });

    socket.on('game:state', (newState: GameState) => {
      setState(s => {
        // Preserve local selection (not from server)
        return { ...newState, selected: null, validMoves: [] };
      });
      setGameKey(k => {
        // Only increment gameKey on winner reset (new game detection)
        return k;
      });
    });

    socket.on('game:error', ({ message }: { message: string }) => {
      setErrorMessage(message);
      setRoomStatus('error');
    });

    socket.on('disconnect', () => {
      setRoomStatus('error');
      setErrorMessage('Disconnected from server');
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
