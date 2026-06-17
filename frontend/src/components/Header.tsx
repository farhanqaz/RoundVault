'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { ReputationBadge } from '@/components/ReputationCard';
import { PACKAGE_ID } from '@/lib/config';
import { explorerPackage } from '@/lib/utils';

export default function Header() {
  const account = useCurrentAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/20">
            RV
          </span>
          <div className="leading-tight">
            <span className="block font-semibold tracking-tight text-zinc-100">RoundVault</span>
            <span className="hidden text-[10px] text-zinc-500 sm:block">Trustless rotating savings</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-zinc-400 md:flex">
          <Link href="/explore" className="transition-colors hover:text-zinc-100">
            Explore
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-zinc-100">
            Leaderboard
          </Link>
          <Link href="/create" className="transition-colors hover:text-zinc-100">
            Create
          </Link>
          <Link
            href={account ? `/reputation/${account.address}` : '/leaderboard'}
            className="transition-colors hover:text-zinc-100"
          >
            Reputation
          </Link>
          <a
            href={explorerPackage(PACKAGE_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-zinc-100"
          >
            Contract
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {account && <ReputationBadge address={account.address} compact />}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
