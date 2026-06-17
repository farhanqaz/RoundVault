import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Providers from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'RoundVault — Trustless Rotating Savings on Sui',
  description:
    'RoundVault brings rotating savings clubs on-chain. Stake collateral, contribute each round, receive the pot — enforced by smart contract.',
  icons: {
    icon: '/roundvault-mark.svg',
    shortcut: '/roundvault-mark.svg',
    apple: '/roundvault-mark.svg',
  },
  openGraph: {
    title: 'RoundVault',
    description: 'No custodian holds the pot. Defaults get slashed.',
    images: ['/roundvault-logo.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
            RoundVault Protocol · Trustless rotating savings on Sui
          </footer>
        </Providers>
      </body>
    </html>
  );
}
