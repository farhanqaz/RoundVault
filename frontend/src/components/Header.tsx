'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import Image from 'next/image';
import Link from 'next/link';
import { ReputationBadge } from '@/components/ReputationCard';
import { PACKAGE_ID } from '@/lib/config';
import { explorerPackage } from '@/lib/utils';

export default function Header() {
  const account = useCurrentAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(2,5,13,0.78)] backdrop-blur-2xl shadow-[0_0_60px_rgba(70,255,224,0.08)]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6 xl:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--cyan-soft)] text-sm font-black text-[var(--cyan)] shadow-[var(--glow)]">
            <Image
              src="/roundvault-mark.svg"
              alt="RoundVault"
              width={40}
              height={40}
              unoptimized
              className="h-full w-full object-cover"
            />
          </span>
          <div className="leading-tight">
            <span className="block font-black tracking-[-0.04em] text-[var(--ink)] text-glow">RoundVault</span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[var(--cyan)] sm:block">Surface savings signal</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--muted)] md:flex">
          <Link href="/explore" className="transition hover:-translate-y-0.5 hover:text-[var(--cyan)]">
            Explore
          </Link>
          <Link href="/leaderboard" className="transition hover:-translate-y-0.5 hover:text-[var(--cyan)]">
            Leaderboard
          </Link>
          <Link href="/create" className="transition hover:-translate-y-0.5 hover:text-[var(--cyan)]">
            Create
          </Link>
          <Link
            href={account ? `/reputation/${account.address}` : '/leaderboard'}
            className="transition hover:-translate-y-0.5 hover:text-[var(--cyan)]"
          >
            Reputation
          </Link>
          <a
            href={explorerPackage(PACKAGE_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:-translate-y-0.5 hover:text-[var(--cyan)]"
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
