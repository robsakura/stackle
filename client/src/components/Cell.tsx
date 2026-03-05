'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { CellStack, Player } from '@/lib/types';
import { getPiecePlayer, getPieceSize } from '@/lib/gameLogic';

const RADII = {
  S: { r: 13, strokeWidth: 0, filled: true },
  M: { r: 20, strokeWidth: 5, filled: false },
  L: { r: 31, strokeWidth: 8, filled: false },
};

const COLOR: Record<Player, string> = {
  Red: '#f43f5e',
  Yellow: '#facc15',
};

const TINT: Record<Player, string> = {
  Red: 'rgba(244,63,94,0.13)',
  Yellow: 'rgba(250,204,21,0.13)',
};

const BG_EMPTY = 'rgba(17,24,39,1)';

interface CellProps {
  stack: CellStack;
  index: number;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: (index: number) => void;
}

export default function Cell({ stack, index, isHighlighted, isSelected, onClick }: CellProps) {
  const topPiece = stack.length > 0 ? stack[stack.length - 1] : null;
  const topPlayer = topPiece ? getPiecePlayer(topPiece) : null;
  const bgColor = topPlayer ? TINT[topPlayer] : BG_EMPTY;

  return (
    <motion.button
      className={[
        'relative w-full aspect-square flex items-center justify-center rounded-lg border-2',
        isSelected
          ? 'border-yellow-400'
          : isHighlighted
            ? 'border-emerald-400'
            : 'border-gray-700 hover:border-gray-500',
      ].join(' ')}
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 0.35 }}
      onClick={() => onClick(index)}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-4/5 h-4/5 flex items-center justify-center">
        <AnimatePresence>
          {stack.length > 0 ? (
            <motion.svg
              key={stack.join(',')}
              viewBox="0 0 72 72"
              className="w-full h-full overflow-visible"
              initial={{ scale: 0.5, opacity: 0, y: -12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            >
              {stack.map(piece => {
                const sz = getPieceSize(piece);
                const player = getPiecePlayer(piece);
                const { r, strokeWidth, filled } = RADII[sz];
                const color = COLOR[player];
                return (
                  <circle
                    key={sz}
                    cx={36}
                    cy={36}
                    r={r}
                    fill={filled ? color : 'none'}
                    stroke={filled ? 'none' : color}
                    strokeWidth={strokeWidth}
                  />
                );
              })}
            </motion.svg>
          ) : (
            <motion.div
              key="empty"
              className="w-2 h-2 rounded-full bg-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-emerald-400 pointer-events-none"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}
    </motion.button>
  );
}
