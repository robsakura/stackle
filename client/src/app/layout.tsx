import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stackle',
  description: 'Triple-Stack Tactics — 3×3 Gobblet-style strategy game',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9902853095574618"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-gray-950 text-white min-h-screen antialiased">{children}</body>
    </html>
  );
}
