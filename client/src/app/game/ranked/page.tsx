'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRankedGame } from '@/hooks/useRankedGame';
import GameLayout from '@/components/GameLayout';
import StatsModal from '@/components/StatsModal';

export default function RankedGamePage() {
  const { isLoggedIn, token } = useAuth();
  const router = useRouter();
  const {
    state,
    gameKey,
    mySlot,
    status,
    errorMessage,
    myNickname,
    myUserId,
    opponentNickname,
    opponentUserId,
    joinQueue,
    leaveQueue,
    handleReserveClick,
    handleCellClick,
  } = useRankedGame(token);

  const [statsTarget, setStatsTarget] = useState<{ userId: string; nickname: string } | null>(null);
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/ranked');
      return;
    }
    if (!hasJoined.current) {
      hasJoined.current = true;
      joinQueue();
    }
  }, [isLoggedIn, router, joinQueue]);

  // Countdown while queuing
  useEffect(() => {
    if (status === 'queuing') {
      setCountdown(30);
      countdownRef.current = setInterval(() => {
        setCountdown(c => Math.max(0, c - 1));
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  const handleCancel = () => {
    leaveQueue();
    router.push('/ranked/dashboard');
  };

  if (status === 'queuing') {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <span className="text-sm font-semibold text-gray-300">Ranked</span>
          <div className="w-12" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
          <div className="w-14 h-14 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <div className="text-xl font-semibold text-white">Finding opponent…</div>
          <div className="text-4xl font-mono font-bold text-gray-400">{countdown}s</div>
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-full bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (status === 'no_match' || (status === 'error' && !state.winner)) {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <Link href="/ranked/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
          <span className="text-sm font-semibold text-gray-300">Ranked</span>
          <div className="w-12" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
          <div className="text-xl font-semibold text-white">No players available</div>
          <p className="text-gray-400 text-sm">Nobody joined within 30 seconds. Try again later!</p>
          <Link
            href="/ranked/dashboard"
            className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'playing') {
    const opponentPlayer = mySlot === 'Red' ? 'Yellow' : 'Red';
    return (
      <>
        <GameLayout
          state={state}
          myPlayer={mySlot}
          opponentPlayer={opponentPlayer}
          gameKey={gameKey}
          onReserveClick={handleReserveClick}
          onCellClick={handleCellClick}
          onNewGame={() => {}}
          showNewGameAlways={false}
          playerNickname={myNickname}
          opponentNickname={opponentNickname}
          onPlayerClick={() => setStatsTarget({ userId: myUserId, nickname: myNickname })}
          onOpponentClick={() => setStatsTarget({ userId: opponentUserId, nickname: opponentNickname })}
          statusMessage={
            errorMessage
              ? errorMessage
              : state.currentPlayer !== mySlot
              ? `Waiting for ${opponentNickname}…`
              : undefined
          }
          backButton={
            state.winner !== null ? (
              <Link
                href="/ranked/dashboard"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Dashboard
              </Link>
            ) : undefined
          }
        />
        {statsTarget && (
          <StatsModal
            userId={statsTarget.userId}
            nickname={statsTarget.nickname}
            onClose={() => setStatsTarget(null)}
          />
        )}
      </>
    );
  }

  return null;
}
