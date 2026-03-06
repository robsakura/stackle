'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SHARE_URL = 'https://stackle.ca';
const SHARE_TEXT = 'Play Stackle – a free 3×3 strategy game. Out-stack your opponent!';
const X_URL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`;
const FB_URL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`;

const HOW_TO_PLAY = [
  {
    heading: null,
    body: 'Get 3 of your pieces in a row to win.',
  },
  {
    heading: 'The Stack',
    body: 'Place larger pieces on top of smaller ones to take control.',
  },
  {
    heading: 'Move',
    body: 'Use your turn to place a new piece OR slide an existing one to a new spot.',
  },
  {
    heading: 'The Catch',
    body: 'Only the top piece counts. If you move a large piece, the one underneath is revealed!',
  },
  {
    heading: null,
    body: 'Think ahead. Out-stack your opponent.',
  },
];

export default function HomePage() {
  const [showHelp, setShowHelp] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Stackle', text: SHARE_TEXT, url: SHARE_URL }); } catch {}
    } else {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] gap-8 px-4 pb-16">
      <div className="w-full max-w-xs">
        <img src="/stackle_logo_white.png" alt="Stackle" className="w-full" />
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center">
          Guest Play
        </p>
        <Link
          href="/game/cpu"
          className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-semibold text-center text-lg transition-colors shadow-lg"
        >
          Single Player
        </Link>
        <Link
          href="/game/local"
          className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-center text-lg transition-colors shadow-lg"
        >
          Tabletop
        </Link>
        <Link
          href="/game/online"
          className="w-full py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold text-center text-lg transition-colors shadow-lg"
        >
          Play Online with Friends
        </Link>

        <div className="flex items-center gap-3 my-1">
          <div className="h-px flex-1 bg-gray-700" />
          <span className="text-xs text-gray-500 uppercase tracking-widest">Ranked Matches</span>
          <div className="h-px flex-1 bg-gray-700" />
        </div>

        <Link
          href="/ranked"
          className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-center text-lg transition-colors shadow-lg"
        >
          Ranked PvP
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={() => setShowHelp(true)}
          className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors"
        >
          How to Play
        </button>
        <button
          onClick={() => setShowShare(true)}
          className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors"
        >
          Share
        </button>
        <a
          href="mailto:dev@stackle.ca?subject=Stackle%20Feedback"
          className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors"
        >
          Feedback
        </a>
      </div>

      {/* Google Ads placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-[50px] pb-safe bg-gray-800/50 border-t border-gray-700 flex items-center justify-center">
        <span className="text-xs text-gray-600">Advertisement</span>
      </div>

      <AnimatePresence>
        {showShare && (
          <motion.div
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShare(false)}
          >
            <motion.div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-sm flex flex-col gap-4 shadow-2xl"
              initial={{ scale: 0.88, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white tracking-tight">Share Stackle</h2>
              <div className="flex flex-col gap-3">
                <a
                  href={X_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold text-center text-sm transition-colors border border-gray-700"
                >
                  Post on 𝕏
                </a>
                <a
                  href={FB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-[#1877F2] hover:bg-[#1565d8] text-white font-semibold text-center text-sm transition-colors"
                >
                  Share on Facebook
                </a>
                <button
                  onClick={handleNativeShare}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold text-sm transition-all"
                >
                  {copied ? '✓ Link copied!' : 'Share on Instagram'}
                </button>
              </div>
              <button
                onClick={() => setShowShare(false)}
                className="self-end px-5 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-7 w-full max-w-sm flex flex-col gap-5 shadow-2xl"
              initial={{ scale: 0.88, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white tracking-tight">How to Play Stackle</h2>

              <ul className="flex flex-col gap-3">
                {HOW_TO_PLAY.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300 leading-relaxed">
                    {item.heading && (
                      <span className="font-semibold text-white">{item.heading}: </span>
                    )}
                    {item.body}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowHelp(false)}
                className="mt-1 self-end px-5 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
