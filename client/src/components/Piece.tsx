'use client';

import { motion } from 'framer-motion';
import type { Piece as PieceType, Size } from '@/lib/types';
import { getPiecePlayer, getPieceSize } from '@/lib/gameLogic';

interface PieceProps {
  piece: PieceType;
  isSelected?: boolean;
  dimmed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RADII: Record<Size, { r: number; strokeWidth: number; filled: boolean }> = {
  S: { r: 13, strokeWidth: 0, filled: true },
  M: { r: 20, strokeWidth: 5, filled: false },
  L: { r: 31, strokeWidth: 8, filled: false },
};

const COLORS: Record<'Red' | 'Yellow', { fill: string; stroke: string }> = {
  Red: { fill: '#f43f5e', stroke: '#f43f5e' },
  Yellow: { fill: '#facc15', stroke: '#facc15' },
};

export default function Piece({ piece, isSelected = false, dimmed = false }: PieceProps) {
  const sz = getPieceSize(piece);
  const player = getPiecePlayer(piece);
  const { r, strokeWidth, filled } = RADII[sz];
  const { fill, stroke } = COLORS[player];

  return (
    <motion.svg
      viewBox="0 0 72 72"
      className="w-full h-full"
      style={{ opacity: dimmed ? 0.35 : 1 }}
      animate={isSelected ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={
        isSelected
          ? { repeat: Infinity, duration: 0.8, ease: 'easeInOut' }
          : { duration: 0.15 }
      }
    >
      <circle
        cx={36}
        cy={36}
        r={r}
        fill={filled ? fill : 'none'}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </motion.svg>
  );
}
