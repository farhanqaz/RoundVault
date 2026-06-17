'use client';

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReputationLookup from '@/components/ReputationLookup';
import {
  fetchReputationLeaderboard,
  reputationTier,
  type LeaderboardEntry,
} from '@/lib/reputation';
import { shortenAddress } from '@/lib/utils';

export default function ReputationLeaderboard() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchReputationLeaderboard(client).then((data) => {
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-zinc-100">Reputation leaderboard</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Top scores from on-chain activity across all RoundVault gacha circles. Tap any row to view
        full profile.
      </p>

      <div className="mt-6">
        <ReputationLookup />
      </div>

      {account && (
        <Link
          href={`/reputation/${account.address}`}
          className="mt-3 inline-block text-xs text-emerald-500 hover:text-emerald-400"
        >
          View my profile →
        </Link>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300">
          Rankings
        </div>

        {loading && (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-900" />
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">
            No reputation scores yet. Join a vault and contribute to appear here.
          </p>
        )}

        {!loading && entries.length > 0 && (
          <ul className="divide-y divide-zinc-800">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const tier = reputationTier(entry.score);
              const isMe = account?.address === entry.address;

              return (
                <li key={entry.address}>
                  <Link
                    href={`/reputation/${entry.address}`}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-900/60 ${
                      isMe ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <RankBadge rank={rank} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm text-zinc-200">
                        {shortenAddress(entry.address, 6)}
                        {isMe && (
                          <span className="ml-2 text-xs font-sans text-emerald-400">you</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {entry.vaultsJoined} vaults · {entry.contributions} contributions
                        {entry.slashes > 0 && (
                          <span className="text-red-400/80"> · {entry.slashes} slash</span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold tabular-nums text-emerald-400">
                        {entry.score}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                        {tier.label}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-zinc-600">
        Rankings indexed from <code className="text-zinc-500">ReputationUpdated</code> events on
        testnet.
      </p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm">
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-400/15 text-sm">
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600/15 text-sm">
        🥉
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium tabular-nums text-zinc-500">
      {rank}
    </span>
  );
}
