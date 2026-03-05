'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  wins: number;
  losses: number;
  drops: number;
  win_pct: number;
}

interface LeaderboardEntry {
  id: string;
  nickname: string;
  wins: number;
  total: number;
  win_pct: number;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

export default function DashboardPage() {
  const { isLoggedIn, user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!isLoggedIn) router.replace('/ranked');
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`${SERVER_URL}/api/stats/${user.userId}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
    fetch(`${SERVER_URL}/api/leaderboard`)
      .then(r => r.json())
      .then(setLeaderboard)
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const total = stats ? stats.wins + stats.losses + stats.drops : 0;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Home
        </Link>
        <span className="text-sm font-semibold text-gray-300">Ranked</span>
        <button
          onClick={() => { logout(); router.push('/ranked'); }}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center gap-6 px-4 py-8 pb-16 overflow-y-auto">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome, <span className="text-indigo-400">{user.nickname}</span>
          </h1>

          {stats && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="bg-gray-800 rounded-xl py-3 text-center">
                <div className="text-xl font-bold text-green-400">{stats.wins}</div>
                <div className="text-xs text-gray-400 mt-0.5">W</div>
              </div>
              <div className="bg-gray-800 rounded-xl py-3 text-center">
                <div className="text-xl font-bold text-red-400">{stats.losses}</div>
                <div className="text-xs text-gray-400 mt-0.5">L</div>
              </div>
              <div className="bg-gray-800 rounded-xl py-3 text-center">
                <div className="text-xl font-bold text-yellow-400">{stats.drops}</div>
                <div className="text-xs text-gray-400 mt-0.5">D</div>
              </div>
              <div className="bg-gray-800 rounded-xl py-3 text-center">
                <div className="text-xl font-bold text-indigo-400">
                  {total > 0 ? (stats.win_pct * 100).toFixed(0) : '—'}%
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Win%</div>
              </div>
            </div>
          )}

          <Link
            href="/game/ranked"
            className="mt-6 block w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-center text-lg transition-colors shadow-lg"
          >
            Random Match
          </Link>
        </div>

        {leaderboard.length > 0 && (
          <div className="w-full max-w-sm">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Top 20 Leaderboard
            </h2>
            <div className="bg-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-xs">
                    <th className="text-left px-4 py-2">#</th>
                    <th className="text-left px-4 py-2">Player</th>
                    <th className="text-right px-4 py-2">W</th>
                    <th className="text-right px-4 py-2">Win%</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-gray-700/50 last:border-0 ${
                        entry.id === user.userId ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-white">{entry.nickname}</td>
                      <td className="px-4 py-2.5 text-right text-green-400">{entry.wins}</td>
                      <td className="px-4 py-2.5 text-right text-indigo-400">
                        {(entry.win_pct * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Min. 5 games to appear</p>
          </div>
        )}
      </main>
    </div>
  );
}
