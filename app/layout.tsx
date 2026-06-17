import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SwapX Exchange — DEX + CEX',
  description: 'Trade crypto on a simulated DEX + CEX. Google OAuth, Redis-backed portfolio, 30+ tokens, real-time prices.',
  openGraph: {
    title: 'SwapX Exchange',
    description: 'Simulated DEX + CEX with real token prices, 30+ tokens, Google OAuth.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
