'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Board as BoardType, GameState } from '@/lib/types';
import Cell from './Cell';

interface BoardProps {
  board: BoardType;
  selected: GameState['selected'];
  validMoves: number[];
  onCellClick: (index: number) => void;
  gameKey: number;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const cellVariants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  exit: { scale: 0.6, opacity: 0, transition: { duration: 0.15 } },
};

export default function Board({ board, selected, validMoves, onCellClick, gameKey }: BoardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gameKey}
        className="grid grid-cols-3 gap-2 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {board.map((stack, i) => (
          <motion.div key={i} variants={cellVariants} className="relative">
            <Cell
              stack={stack}
              index={i}
              isHighlighted={validMoves.includes(i)}
              isSelected={selected?.source === i}
              onClick={onCellClick}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
