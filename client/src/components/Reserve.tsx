'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Piece, Player, Size } from '@/lib/types';
import { getPieceSize } from '@/lib/gameLogic';
import PieceComp from './Piece';

interface ReserveProps {
  pieces: Piece[];
  player: Player;
  flipped?: boolean;
  selectedPiece: Piece | null;
  isActive: boolean;
  onPieceClick: (piece: Piece) => void;
}

const SIZES: Size[] = ['S', 'M', 'L'];

export default function Reserve({
  pieces,
  player,
  flipped = false,
  selectedPiece,
  isActive,
  onPieceClick,
}: ReserveProps) {
  return (
    <div
      className={[
        'flex items-center justify-center gap-4 py-3 px-4 rounded-xl',
        flipped ? 'rotate-180' : '',
        isActive ? 'bg-gray-800/60' : 'bg-gray-900/40',
      ].join(' ')}
    >
      {SIZES.map(size => {
        const group = pieces.filter(p => getPieceSize(p) === size);
        return (
          <div key={size} className="flex gap-1">
            <AnimatePresence>
              {group.map((piece, idx) => (
                <motion.button
                  key={`${piece}-${idx}`}
                  className={[
                    'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
                    isActive ? 'hover:bg-gray-700 cursor-pointer' : 'cursor-default',
                    selectedPiece === piece ? 'bg-yellow-400/20 ring-2 ring-yellow-400' : '',
                  ].join(' ')}
                  onClick={() => isActive && onPieceClick(piece)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  whileTap={isActive ? { scale: 0.9 } : {}}
                >
                  <PieceComp
                    piece={piece}
                    isSelected={selectedPiece === piece}
                    dimmed={!isActive}
                  />
                </motion.button>
              ))}
            </AnimatePresence>
            {group.length === 0 && (
              <div className="w-10 h-10 rounded-full border border-dashed border-gray-700 opacity-30" />
            )}
          </div>
        );
      })}
    </div>
  );
}
