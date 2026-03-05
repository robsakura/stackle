'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RankedPage() {
  const { isLoggedIn, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.replace('/ranked/dashboard');
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), nickname.trim(), password);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
        <span className="text-sm font-semibold text-gray-300">Ranked Matches</span>
        <div className="w-12" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <h2 className="text-2xl font-bold text-white">
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </h2>

        {error && (
          <div className="w-full max-w-xs bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Display nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold text-lg transition-colors"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Register'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          className="text-sm text-gray-400 hover:text-gray-200 underline underline-offset-4 transition-colors"
        >
          {mode === 'login' ? 'No account? Register instead' : 'Already have an account? Log in'}
        </button>
      </main>
    </div>
  );
}
