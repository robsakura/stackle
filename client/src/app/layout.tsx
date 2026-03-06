import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from '@/components/Providers';
import Analytics from '@/components/Analytics';

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
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-PXLNT2MJY1" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-PXLNT2MJY1');
      `}</Script>
      <body className="bg-gray-950 text-white min-h-screen antialiased">
        <Providers>
          <Analytics />
          {children}
        </Providers>
      </body>
    </html>
  );
}
