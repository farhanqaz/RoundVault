'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mistToSui } from '@/lib/config';
import { fetchReputationProfile, isEmptyProfile, reputationTier, type ReputationProfile } from '@/lib/reputation';
import { shortenAddress } from '@/lib/utils';

export default function ReputationCard({ address }: { address: string }) {
  const client = useSuiClient();
  const [profile, setProfile] = useState<ReputationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchReputationProfile(client, address).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [client, address]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="h-6 w-32 rounded bg-zinc-800" />
        <div className="mt-4 h-10 w-20 rounded bg-zinc-800" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
        Could not load reputation. Check the address and that{' '}
        <code className="text-zinc-400">NEXT_PUBLIC_REPUTATION_REGISTRY_ID</code> is set.
      </div>
    );
  }

  const tier = reputationTier(profile.score);
  const unrated = isEmptyProfile(profile);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Portable reputation
          </p>
          <p className="mt-1 font-mono text-sm text-zinc-300">{shortenAddress(address, 6)}</p>
          <Link
            href={`/leaderboard`}
            className="mt-1 inline-block text-xs text-emerald-500/80 hover:text-emerald-400"
          >
            See leaderboard ↗
          </Link>
        </div>
        <TierBadge label={tier.label} color={tier.color} />
      </div>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums text-emerald-400">
          {unrated ? '—' : profile.score}
        </span>
        <span className="text-sm text-zinc-500">{unrated ? 'no activity yet' : 'score'}</span>
      </div>

      {unrated ? (
        <p className="mt-4 text-sm text-zinc-500">
          This wallet hasn&apos;t joined or contributed in a RoundVault yet.
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Vaults joined" value={profile.vaultsJoined} />
            <Stat label="Completed" value={profile.vaultsCompleted} />
            <Stat label="Contributions" value={profile.contributions} />
            <Stat label="Payouts" value={profile.payoutsReceived} />
            <Stat label="Total contributed" value={`${mistToSui(profile.totalContributed)} SUI`} wide />
            <Stat label="Total received" value={`${mistToSui(profile.totalPayoutAmount)} SUI`} wide />
            {profile.slashes > 0 && <Stat label="Slashes" value={profile.slashes} danger />}
          </div>

          <p className="mt-4 text-xs text-zinc-600">
            Score follows you across all RoundVault vaults — join +5, contribute +10, payout +30,
            complete +100, slash −200.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  wide,
  danger,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 ${wide ? 'col-span-2 sm:col-span-2' : ''}`}>
      <p className="text-[10px] uppercase tracking-wide text-zinc-600">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${danger ? 'text-red-400' : 'text-zinc-200'}`}>
        {value}
      </p>
    </div>
  );
}

function TierBadge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
    amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    zinc: 'bg-zinc-800 text-zinc-400 ring-zinc-700',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${colors[color] ?? colors.zinc}`}>
      {label}
    </span>
  );
}

export function ReputationBadge({ address, compact }: { address: string; compact?: boolean }) {
  const client = useSuiClient();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    fetchReputationProfile(client, address).then((p) => setScore(p?.score ?? 0));
  }, [client, address]);

  if (score === null) return null;
  const tier = reputationTier(score);

  if (compact) {
    return (
      <Link
        href={`/reputation/${address}`}
        className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20"
        title={`Reputation: ${score}`}
      >
        ★ {score}
      </Link>
    );
  }

  return (
    <Link
      href={`/reputation/${address}`}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-400"
    >
      <span className="text-emerald-400">★</span>
      <span>{score}</span>
      <span className="text-zinc-600">·</span>
      <span>{tier.label}</span>
    </Link>
  );
}
