import type { GameState, Player, Selection } from './types';
import { applyMove, checkWin, getPiecePlayer, getValidMoves } from './gameLogic';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export interface Move {
  selection: Selection;
  targetCell: number;
}

export function getAllMoves(state: GameState, player: Player): Move[] {
  const moves: Move[] = [];

  // Reserve pieces
  for (const piece of state.reserves[player]) {
    const selection: Selection = { source: 'reserve', piece };
    for (const cell of getValidMoves(state, selection)) {
      moves.push({ selection, targetCell: cell });
    }
  }

  // Board pieces
  for (let i = 0; i < 9; i++) {
    const stack = state.board[i];
    if (stack.length === 0) continue;
    const top = stack[stack.length - 1];
    if (getPiecePlayer(top) !== player) continue;
    const selection: Selection = { source: i, piece: top };
    for (const cell of getValidMoves(state, selection)) {
      moves.push({ selection, targetCell: cell });
    }
  }

  return moves;
}

function evaluateBoard(state: GameState, aiPlayer: Player): number {
  const winner = checkWin(state.board);
  if (winner === aiPlayer) return 10000;
  if (winner !== null) return -10000;

  const humanPlayer: Player = aiPlayer === 'Yellow' ? 'Red' : 'Yellow';
  let score = 0;

  for (const [a, b, c] of WIN_LINES) {
    const cells = [a, b, c];
    let aiCount = 0;
    let humanCount = 0;
    let emptyOrTakeable = 0;

    for (const idx of cells) {
      const stack = state.board[idx];
      if (stack.length === 0) {
        emptyOrTakeable++;
      } else {
        const top = stack[stack.length - 1];
        const owner = getPiecePlayer(top);
        if (owner === aiPlayer) aiCount++;
        else humanCount++;
      }
    }

    if (aiCount === 2 && humanCount === 0) score += 10;
    if (humanCount === 2 && aiCount === 0) score -= 10;
  }

  // Presence bonus
  for (let i = 0; i < 9; i++) {
    const stack = state.board[i];
    if (stack.length === 0) continue;
    const top = stack[stack.length - 1];
    if (getPiecePlayer(top) === aiPlayer) {
      score += 1;
      if (i === 4) score += 2;
    } else {
      score -= 1;
      if (i === 4) score -= 2;
    }
  }

  return score;
}

function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiPlayer: Player
): number {
  if (depth === 0 || state.winner !== null) {
    return evaluateBoard(state, aiPlayer);
  }

  const currentPlayer = maximizing ? aiPlayer : (aiPlayer === 'Yellow' ? 'Red' : 'Yellow');
  const moves = getAllMoves(state, currentPlayer);

  if (moves.length === 0) return evaluateBoard(state, aiPlayer);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const stateWithSelection = { ...state, selected: move.selection, validMoves: [] };
      const nextState = applyMove(stateWithSelection, move.targetCell);
      const evalScore = minimax(nextState, depth - 1, alpha, beta, false, aiPlayer);
      if (evalScore > maxEval) maxEval = evalScore;
      if (maxEval > alpha) alpha = maxEval;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const stateWithSelection = { ...state, selected: move.selection, validMoves: [] };
      const nextState = applyMove(stateWithSelection, move.targetCell);
      const evalScore = minimax(nextState, depth - 1, alpha, beta, true, aiPlayer);
      if (evalScore < minEval) minEval = evalScore;
      if (minEval < beta) beta = minEval;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(state: GameState, difficulty: 'easy' | 'hard'): Move | null {
  const aiPlayer: Player = 'Yellow';
  const moves = getAllMoves(state, aiPlayer);
  if (moves.length === 0) return null;

  // Always take an immediate win, regardless of difficulty
  for (const move of moves) {
    const stateWithSelection = { ...state, selected: move.selection, validMoves: [] };
    const nextState = applyMove(stateWithSelection, move.targetCell);
    if (nextState.winner === aiPlayer) return move;
  }

  // Easy: 35% chance of random move
  if (difficulty === 'easy' && Math.random() < 0.35) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === 'easy' ? 1 : 5;
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const stateWithSelection = { ...state, selected: move.selection, validMoves: [] };
    const nextState = applyMove(stateWithSelection, move.targetCell);
    const score = minimax(nextState, depth - 1, -Infinity, Infinity, false, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
