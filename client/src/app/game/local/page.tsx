'use client';

import Link from 'next/link';
import { useLocalGame } from '@/hooks/useLocalGame';
import GameLayout from '@/components/GameLayout';

export default function LocalGamePage() {
  const { state, gameKey, handleReserveClick, handleCellClick, handleNewGame } = useLocalGame();

  return (
    <GameLayout
      state={state}
      myPlayer="Red"
      opponentPlayer="Yellow"
      gameKey={gameKey}
      onReserveClick={handleReserveClick}
      onCellClick={handleCellClick}
      onNewGame={handleNewGame}
      showNewGameAlways
      backButton={
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
      }
    />
  );
}
