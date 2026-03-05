'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameState, Piece, Player } from '@/lib/types';
import Board from './Board';
import Reserve from './Reserve';
import Fireworks from './Fireworks';

const HOW_TO_PLAY = [
  { heading: null, body: 'Get 3 of your pieces in a row to win.' },
  { heading: 'The Stack', body: 'Place larger pieces on top of smaller ones to take control.' },
  { heading: 'Move', body: 'Use your turn to place a new piece OR slide an existing one to a new spot.' },
  { heading: 'The Catch', body: 'Only the top piece counts. If you move a large piece, the one underneath is revealed!' },
  { heading: null, body: 'Think ahead. Out-stack your opponent.' },
];

interface GameLayoutProps {
  state: GameState;
  myPlayer: Player;
  opponentPlayer: Player;
  gameKey: number;
  onReserveClick: (piece: Piece) => void;
  onCellClick: (index: number) => void;
  onNewGame: () => void;
  showNewGameAlways?: boolean;
  statusMessage?: string;
  backButton?: React.ReactNode;
}

const PLAYER_COLORS: Record<Player, string> = {
  Red: 'text-rose-400',
  Yellow: 'text-yellow-400',
};

const PLAYER_BG: Record<Player, string> = {
  Red: 'bg-rose-500',
  Yellow: 'bg-yellow-400',
};

export default function GameLayout({
  state,
  myPlayer,
  opponentPlayer,
  gameKey,
  onReserveClick,
  onCellClick,
  onNewGame,
  showNewGameAlways = false,
  statusMessage,
  backButton,
}: GameLayoutProps) {
  const [showHelp, setShowHelp] = useState(false);
  const isMyTurn = state.currentPlayer === myPlayer;
  const isOpponentTurn = state.currentPlayer === opponentPlayer;

  const selectedReservePiece =
    state.selected?.source === 'reserve' ? state.selected.piece : null;

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="h-full w-full max-w-sm mx-auto flex flex-col">

        {/* Back button row — above logo */}
        {backButton && (
          <div className="shrink-0 px-4 pt-3 pb-0">
            {backButton}
          </div>
        )}

        {/* Logo */}
        <div className="shrink-0 px-8 py-1">
          <img src="/stackle_logo_white.png" alt="Stackle" className="w-full" />
        </div>

        {/* Everything else centered as one group */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 min-h-0 overflow-hidden">

          {/* Winner banner or turn indicator */}
          <AnimatePresence mode="wait">
            {state.winner !== null ? (
              <motion.div
                key="winner"
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                {state.winner === 'draw' ? (
                  <>
                    <div className="text-2xl font-bold text-gray-300">Draw!</div>
                    <p className="text-xs text-gray-400">Board position repeated 3 times</p>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${PLAYER_BG[state.winner]}`} />
                    <div className={`text-2xl font-bold ${PLAYER_COLORS[state.winner]}`}>
                      {state.winner} wins!
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="turn"
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
                  <span className={`w-2.5 h-2.5 rounded-full ${PLAYER_BG[state.currentPlayer]}`} />
                  <span className={PLAYER_COLORS[state.currentPlayer]}>
                    {state.currentPlayer}&apos;s turn
                  </span>
                </div>
                {statusMessage && <p className="text-xs text-gray-400">{statusMessage}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <Reserve
            pieces={state.reserves[opponentPlayer]}
            player={opponentPlayer}
            flipped
            selectedPiece={isOpponentTurn ? selectedReservePiece : null}
            isActive={isOpponentTurn}
            onPieceClick={onReserveClick}
          />
          <Board
            board={state.board}
            selected={state.selected}
            validMoves={state.validMoves}
            onCellClick={onCellClick}
            gameKey={gameKey}
          />
          <Reserve
            pieces={state.reserves[myPlayer]}
            player={myPlayer}
            selectedPiece={isMyTurn ? selectedReservePiece : null}
            isActive={isMyTurn}
            onPieceClick={onReserveClick}
          />

          {/* New game + how to play — inside centered group so they never overlap */}
          <div className="flex items-center gap-4 pt-1">
            {(showNewGameAlways || state.winner !== null) && (
              <button
                onClick={onNewGame}
                className="px-5 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                New Game
              </button>
            )}
            <button
              onClick={() => setShowHelp(true)}
              className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors"
            >
              How to Play
            </button>
          </div>

        </div>

        {/* Google Ads placeholder — always at bottom */}
        <div className="shrink-0 w-full h-[50px] bg-gray-800/50 border-t border-gray-700 flex items-center justify-center">
          <span className="text-xs text-gray-600">Advertisement</span>
        </div>

      </div>

      {/* Fireworks */}
      {state.winner !== null && state.winner !== 'draw' && (
        <Fireworks key={state.winner} winner={state.winner} />
      )}

      {/* How to Play modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-sm flex flex-col gap-5 shadow-2xl"
              initial={{ scale: 0.88, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white tracking-tight">How to Play Stackle</h2>
              <ul className="flex flex-col gap-3">
                {HOW_TO_PLAY.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300 leading-relaxed">
                    {item.heading && (
                      <span className="font-semibold text-white">{item.heading}: </span>
                    )}
                    {item.body}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-1 self-end px-5 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
