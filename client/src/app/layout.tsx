import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stackle',
  description: 'Triple-Stack Tactics — 3×3 Gobblet-style strategy game',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen antialiased">{children}</body>
    </html>
  );
}
