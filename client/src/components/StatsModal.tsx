'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  userId: string;
  nickname: string;
  onClose: () => void;
}

interface Stats {
  nickname: string;
  wins: number;
  losses: number;
  drops: number;
  win_pct: number;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

export default function StatsModal({ userId, nickname, onClose }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/stats/${userId}`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/75 flex items-end justify-center z-50 px-5 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-white tracking-tight">{nickname}</h2>

          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-800 rounded-xl py-3">
                <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
                <div className="text-xs text-gray-400 mt-0.5">Wins</div>
              </div>
              <div className="bg-gray-800 rounded-xl py-3">
                <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
                <div className="text-xs text-gray-400 mt-0.5">Losses</div>
              </div>
              <div className="bg-gray-800 rounded-xl py-3">
                <div className="text-2xl font-bold text-yellow-400">{stats.drops}</div>
                <div className="text-xs text-gray-400 mt-0.5">Drops</div>
              </div>
              <div className="col-span-3 bg-gray-800 rounded-xl py-3">
                <div className="text-2xl font-bold text-indigo-400">
                  {(stats.win_pct * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Win Rate</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Could not load stats.</p>
          )}

          <button
            onClick={onClose}
            className="self-end px-5 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
