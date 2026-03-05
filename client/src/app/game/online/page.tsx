'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import GameLayout from '@/components/GameLayout';

export default function OnlineGamePage() {
  const {
    state,
    gameKey,
    mySlot,
    roomCode,
    roomStatus,
    errorMessage,
    createRoom,
    joinRoom,
    handleReserveClick,
    handleCellClick,
    handleNewGame,
    disconnect,
  } = useOnlineGame();

  const [joinCode, setJoinCode] = useState('');

  const opponentPlayer = mySlot === 'Red' ? 'Yellow' : 'Red';

  if (roomStatus === 'playing' || (roomStatus === 'waiting' && roomCode)) {
    if (roomStatus === 'waiting') {
      return (
        <div className="h-[100dvh] flex flex-col overflow-hidden">
          <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <button
              onClick={disconnect}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Leave
            </button>
            <span className="text-sm font-semibold text-gray-300">Online PvP</span>
            <div className="w-12" />
          </header>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
            <div className="text-2xl font-bold text-gray-300">Waiting for opponent…</div>
            <p className="text-gray-400 text-sm">Share this room code:</p>
            <div className="text-3xl font-mono font-bold tracking-widest text-white bg-gray-800 px-6 py-3 rounded-xl">
              {roomCode}
            </div>
          </div>
        </div>
      );
    }

    return (
      <GameLayout
        state={state}
        myPlayer={mySlot}
        opponentPlayer={opponentPlayer}
        gameKey={gameKey}
        onReserveClick={handleReserveClick}
        onCellClick={handleCellClick}
        onNewGame={handleNewGame}
        showNewGameAlways={false}
        statusMessage={
          errorMessage
            ? errorMessage
            : state.currentPlayer !== mySlot
            ? `Waiting for ${opponentPlayer}…`
            : undefined
        }
        backButton={
          <button
            onClick={disconnect}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Leave
          </button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
        <span className="text-sm font-semibold text-gray-300">Online PvP</span>
        <div className="w-12" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <h2 className="text-2xl font-bold">Join or Create a Room</h2>

        {errorMessage && (
          <div className="w-full max-w-xs bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-300 text-center">
            {errorMessage}
          </div>
        )}

        <button
          onClick={createRoom}
          disabled={roomStatus === 'connecting'}
          className="w-full max-w-xs py-4 rounded-2xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-semibold text-lg transition-colors"
        >
          {roomStatus === 'connecting' ? 'Connecting…' : 'Create Room'}
        </button>

        <div className="w-full max-w-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-700" />
            <span className="text-gray-500 text-sm">or join</span>
            <div className="h-px flex-1 bg-gray-700" />
          </div>

          <input
            type="text"
            placeholder="Room code"
            maxLength={4}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-center text-xl font-mono tracking-widest uppercase text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => joinRoom(joinCode)}
            disabled={joinCode.length < 1 || roomStatus === 'connecting'}
            className="w-full py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-semibold text-lg transition-colors"
          >
            Join Room
          </button>
        </div>
      </main>
    </div>
  );
}
