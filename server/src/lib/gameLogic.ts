import type { Board, CellStack, GameState, Piece, Player, Selection, Size } from './types';

export const SIZE_ORDER: Record<Size, number> = { S: 0, M: 1, L: 2 };

export function getPieceSize(piece: Piece): Size {
  return piece[0] as Size;
}

export function getPiecePlayer(piece: Piece): Player {
  return piece.split('-')[1] as Player;
}

export function canGobble(attacker: Piece, targetStack: CellStack): boolean {
  if (targetStack.length === 0) return true;
  const top = targetStack[targetStack.length - 1];
  return SIZE_ORDER[getPieceSize(attacker)] > SIZE_ORDER[getPieceSize(top)];
}

export function getValidMoves(state: GameState, selection: Selection): number[] {
  const valid: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (selection.source === i) continue;
    if (canGobble(selection.piece, state.board[i])) {
      valid.push(i);
    }
  }
  return valid;
}

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkWin(board: Board): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    const sa = board[a];
    const sb = board[b];
    const sc = board[c];
    if (!sa.length || !sb.length || !sc.length) continue;
    const pa = getPiecePlayer(sa[sa.length - 1]);
    const pb = getPiecePlayer(sb[sb.length - 1]);
    const pc = getPiecePlayer(sc[sc.length - 1]);
    if (pa === pb && pb === pc) return pa;
  }
  return null;
}

export function detectRepetition(history: string[], board: Board): boolean {
  const snapshot = JSON.stringify(board);
  const count = history.filter(h => h === snapshot).length;
  return count >= 3;
}

export function applyMove(state: GameState, targetCell: number): GameState {
  const { selected } = state;
  if (!selected) return state;

  const newBoard: Board = state.board.map(stack => [...stack]);
  const newReserves = {
    Red: [...state.reserves.Red],
    Yellow: [...state.reserves.Yellow],
  };

  // Remove piece from source
  if (selected.source === 'reserve') {
    const player = getPiecePlayer(selected.piece);
    const idx = newReserves[player].indexOf(selected.piece);
    if (idx !== -1) newReserves[player].splice(idx, 1);
  } else {
    newBoard[selected.source] = [...newBoard[selected.source]];
    newBoard[selected.source].pop();
  }

  // Place piece on target
  newBoard[targetCell] = [...newBoard[targetCell], selected.piece];

  // Check win
  const winner = checkWin(newBoard);

  // Build history and check repetition
  const snapshot = JSON.stringify(newBoard);
  const newHistory = [...state.boardHistory, snapshot];
  const isDraw = !winner && detectRepetition(newHistory, newBoard);

  const nextPlayer: Player = state.currentPlayer === 'Red' ? 'Yellow' : 'Red';

  // Determine phase for next player
  const nextPhase = newReserves[nextPlayer].length > 0 ? 'place' : 'move';

  return {
    board: newBoard,
    reserves: newReserves,
    currentPlayer: nextPlayer,
    selected: null,
    validMoves: [],
    phase: nextPhase,
    winner: winner ?? (isDraw ? 'draw' : null),
    boardHistory: newHistory,
  };
}

export function initGameState(): GameState {
  const makeReserve = (color: Player): Piece[] => [
    `L-${color}`, `L-${color}`, `M-${color}`, `M-${color}`, `S-${color}`, `S-${color}`,
  ] as Piece[];

  return {
    board: Array.from({ length: 9 }, () => []),
    reserves: {
      Red: makeReserve('Red'),
      Yellow: makeReserve('Yellow'),
    },
    currentPlayer: Math.random() < 0.5 ? 'Red' : 'Yellow',
    selected: null,
    validMoves: [],
    phase: 'place',
    winner: null,
    boardHistory: [],
  };
}
