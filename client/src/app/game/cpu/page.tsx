'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAIGame } from '@/hooks/useAIGame';
import GameLayout from '@/components/GameLayout';

type Difficulty = 'easy' | 'hard';

function DifficultyPicker({ onSelect }: { onSelect: (d: Difficulty) => void }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] gap-8 px-4">
      <div className="w-full max-w-xs">
        <img src="/stackle_logo_white.png" alt="Stackle" className="w-full" />
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center">
          Choose Difficulty
        </p>
        <button
          onClick={() => onSelect('easy')}
          className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-center text-lg transition-colors shadow-lg"
        >
          Easy
        </button>
        <button
          onClick={() => onSelect('hard')}
          className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-center text-lg transition-colors shadow-lg"
        >
          Hard
        </button>
      </div>
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors">
        Back to Home
      </Link>
    </main>
  );
}

function CPUGame({ difficulty }: { difficulty: Difficulty }) {
  const { state, gameKey, handleReserveClick, handleCellClick, handleNewGame } = useAIGame(difficulty);

  return (
    <GameLayout
      state={state}
      myPlayer="Red"
      opponentPlayer="Yellow"
      gameKey={gameKey}
      onReserveClick={handleReserveClick}
      onCellClick={handleCellClick}
      onNewGame={handleNewGame}
      showNewGameAlways={false}
      playerNickname="You"
      opponentNickname="CPU"
      backButton={
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
      }
    />
  );
}

export default function CPUPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  if (!difficulty) {
    return <DifficultyPicker onSelect={setDifficulty} />;
  }

  return <CPUGame difficulty={difficulty} />;
}
