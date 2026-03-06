'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyMove, getPiecePlayer, getValidMoves, initGameState } from '@/lib/gameLogic';
import { getBestMove } from '@/lib/aiEngine';
import type { GameState, Piece } from '@/lib/types';

const AI_PLAYER = 'Yellow' as const;
const HUMAN_PLAYER = 'Red' as const;

export function useAIGame(difficulty: 'easy' | 'challenging' | 'expert') {
  const [state, setState] = useState<GameState>(initGameState);
  const [gameKey, setGameKey] = useState(0);
  const thinkingRef = useRef(false);

  // AI move trigger
  useEffect(() => {
    if (state.winner !== null) return;
    if (state.currentPlayer !== AI_PLAYER) return;
    if (thinkingRef.current) return;

    thinkingRef.current = true;
    const timer = setTimeout(() => {
      setState(current => {
        if (current.currentPlayer !== AI_PLAYER || current.winner !== null) {
          thinkingRef.current = false;
          return current;
        }
        const move = getBestMove(current, difficulty);
        if (!move) {
          thinkingRef.current = false;
          return current;
        }
        const stateWithSelection = { ...current, selected: move.selection, validMoves: [] };
        const next = applyMove(stateWithSelection, move.targetCell);
        thinkingRef.current = false;
        return next;
      });
    }, 600);

    return () => {
      clearTimeout(timer);
      thinkingRef.current = false;
    };
  }, [state.currentPlayer, state.winner, difficulty]);

  const handleReserveClick = useCallback(
    (piece: Piece) => {
      const owner = getPiecePlayer(piece);
      if (owner !== HUMAN_PLAYER) return;
      if (state.currentPlayer !== HUMAN_PLAYER) return;

      const selection = { source: 'reserve' as const, piece };
      const validMoves = getValidMoves(state, selection);
      setState(s => ({ ...s, selected: selection, validMoves }));
    },
    [state]
  );

  const handleCellClick = useCallback(
    (index: number) => {
      if (state.currentPlayer !== HUMAN_PLAYER) return;

      if (state.selected && state.validMoves.includes(index)) {
        setState(s => applyMove(s, index));
        return;
      }

      const stack = state.board[index];
      if (stack.length > 0) {
        const topPiece = stack[stack.length - 1];
        if (getPiecePlayer(topPiece) === HUMAN_PLAYER) {
          const selection = { source: index, piece: topPiece };
          const validMoves = getValidMoves(state, selection);
          setState(s => ({ ...s, selected: selection, validMoves }));
          return;
        }
      }

      setState(s => ({ ...s, selected: null, validMoves: [] }));
    },
    [state]
  );

  const handleNewGame = useCallback(() => {
    thinkingRef.current = false;
    setGameKey(k => k + 1);
    setState(initGameState());
  }, []);

  return {
    state,
    gameKey,
    handleReserveClick,
    handleCellClick,
    handleNewGame,
  };
}
