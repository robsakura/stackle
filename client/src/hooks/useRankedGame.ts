'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPiecePlayer, getValidMoves, initGameState } from '@/lib/gameLogic';
import type { GameState, Piece, Player } from '@/lib/types';

type RankedStatus = 'idle' | 'queuing' | 'playing' | 'no_match' | 'error';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

export function useRankedGame(token: string | null) {
  const [state, setState] = useState<GameState>(initGameState);
  const [gameKey, setGameKey] = useState(0);
  const [mySlot, setMySlot] = useState<Player>('Red');
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState<RankedStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [myNickname, setMyNickname] = useState('');
  const [myUserId, setMyUserId] = useState('');
  const [opponentNickname, setOpponentNickname] = useState('');
  const [opponentUserId, setOpponentUserId] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef(token);
  const roomCodeRef = useRef('');
  const mySlotRef = useRef<Player>('Red');
  const prevWinnerRef = useRef<GameState['winner']>(null);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { mySlotRef.current = mySlot; }, [mySlot]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SERVER_URL, {
      auth: { token: tokenRef.current },
      transports: ['polling', 'websocket'],
    });
    socketRef.current = socket;

    socket.io.on('reconnect', () => {
      if (roomCodeRef.current && tokenRef.current) {
        socket.emit('ranked:rejoin', {
          roomCode: roomCodeRef.current,
          token: tokenRef.current,
        });
      }
    });

    socket.on('connect_error', (err) => {
      setErrorMessage(`Could not reach server: ${err.message}`);
      if (!roomCodeRef.current) {
        setStatus('error');
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    });

    socket.on('ranked:matched', ({
      roomCode: code,
      slot,
      myNickname: nick,
      myUserId: uid,
      opponentNickname: oppNick,
      opponentUserId: oppUid,
      state: newState,
    }: {
      roomCode: string;
      slot: Player;
      myNickname: string;
      myUserId: string;
      opponentNickname: string;
      opponentUserId: string;
      state: GameState;
    }) => {
      setRoomCode(code);
      setMySlot(slot);
      setMyNickname(nick);
      setMyUserId(uid);
      setOpponentNickname(oppNick);
      setOpponentUserId(oppUid);
      setState(() => ({ ...newState, selected: null, validMoves: [] }));
      setStatus('playing');
      setErrorMessage('');
    });

    socket.on('ranked:no_match', () => {
      setStatus('no_match');
    });

    socket.on('ranked:state', (data: GameState & { nicknames?: unknown }) => {
      if (prevWinnerRef.current !== null && data.winner === null) {
        setGameKey(k => k + 1);
      }
      prevWinnerRef.current = data.winner;
      setState(() => ({ ...data, selected: null, validMoves: [] }));
      setErrorMessage('');
    });

    socket.on('ranked:rejoined', ({
      slot,
      state: newState,
      myNickname: nick,
      myUserId: uid,
      opponentNickname: oppNick,
      opponentUserId: oppUid,
    }: {
      slot: Player;
      state: GameState & { nicknames?: unknown };
      myNickname: string;
      myUserId: string;
      opponentNickname: string;
      opponentUserId: string;
    }) => {
      setMySlot(slot);
      setMyNickname(nick);
      setMyUserId(uid);
      setOpponentNickname(oppNick);
      setOpponentUserId(oppUid);
      setState(() => ({ ...newState, selected: null, validMoves: [] }));
      setStatus('playing');
    });

    socket.on('ranked:opponent_disconnected', () => {
      setErrorMessage('Opponent disconnected — waiting for them to reconnect…');
    });

    socket.on('ranked:you_win', () => {
      setErrorMessage('Opponent forfeited. You win!');
    });

    socket.on('game:error', ({ message }: { message: string }) => {
      setErrorMessage(message);
    });

    socket.on('disconnect', () => {
      if (!roomCodeRef.current) {
        setStatus('error');
        setErrorMessage('Disconnected from server');
      }
    });
  }, []);

  const joinQueue = useCallback(() => {
    if (!tokenRef.current) return;
    setStatus('queuing');
    setErrorMessage('');
    if (socketRef.current?.connected) {
      socketRef.current.emit('ranked:queue', { token: tokenRef.current });
    } else {
      connect();
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit('ranked:queue', { token: tokenRef.current });
      });
    }
  }, [connect]);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('ranked:dequeue');
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus('idle');
    setRoomCode('');
  }, []);

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

      if (state.selected && state.validMoves.includes(index)) {
        socketRef.current?.emit('ranked:move', {
          roomCode: roomCodeRef.current,
          targetCell: index,
          selection: state.selected,
        });
        setState(s => ({ ...s, selected: null, validMoves: [] }));
        return;
      }

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

      setState(s => ({ ...s, selected: null, validMoves: [] }));
    },
    [state, mySlot]
  );

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus('idle');
    setRoomCode('');
    setState(initGameState());
    setGameKey(k => k + 1);
  }, []);

  return {
    state,
    gameKey,
    mySlot,
    roomCode,
    status,
    errorMessage,
    myNickname,
    myUserId,
    opponentNickname,
    opponentUserId,
    joinQueue,
    leaveQueue,
    handleReserveClick,
    handleCellClick,
    disconnect,
  };
}
