'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyMove, getPiecePlayer, getValidMoves, initGameState } from '@/lib/gameLogic';
import { clearState, loadState, saveState } from '@/lib/storage';
import type { GameState, Piece } from '@/lib/types';

const STORAGE_KEY = 'stackle-local';

export function useLocalGame() {
  const [state, setState] = useState<GameState>(initGameState);
  const [gameKey, setGameKey] = useState(0);
  const initialized = useRef(false);

  // Load from localStorage once on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadState(STORAGE_KEY);
    if (saved) setState(saved);
  }, []);

  // Persist on every state change
  useEffect(() => {
    if (!initialized.current) return;
    saveState(STORAGE_KEY, state);
  }, [state]);

  const handleReserveClick = useCallback(
    (piece: Piece) => {
      const owner = getPiecePlayer(piece);
      if (owner !== state.currentPlayer) return;

      const selection = { source: 'reserve' as const, piece };
      const validMoves = getValidMoves(state, selection);

      setState(s => ({
        ...s,
        selected: selection,
        validMoves,
      }));
    },
    [state]
  );

  const handleCellClick = useCallback(
    (index: number) => {
      // If a piece is selected and this is a valid move → apply
      if (state.selected && state.validMoves.includes(index)) {
        setState(s => applyMove(s, index));
        return;
      }

      // Try to select a board piece (move phase, or gobble over opponent)
      const stack = state.board[index];
      if (stack.length > 0) {
        const topPiece = stack[stack.length - 1];
        const topOwner = getPiecePlayer(topPiece);
        if (topOwner === state.currentPlayer) {
          const selection = { source: index, piece: topPiece };
          const validMoves = getValidMoves(state, selection);
          setState(s => ({
            ...s,
            selected: selection,
            validMoves,
          }));
          return;
        }
      }

      // Deselect
      setState(s => ({ ...s, selected: null, validMoves: [] }));
    },
    [state]
  );

  const handleNewGame = useCallback(() => {
    clearState(STORAGE_KEY);
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
