'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mistToSui } from '@/lib/config';
import { fetchRecentVaults, type VaultListing } from '@/lib/events';
import { shortenAddress } from '@/lib/utils';

export default function ExploreVaults() {
  const client = useSuiClient();
  const [vaults, setVaults] = useState<VaultListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentVaults(client)
      .then(setVaults)
      .finally(() => setLoading(false));
  }, [client]);

  if (loading) {
    return <p className="py-12 text-center text-zinc-500">Loading vaults from chain…</p>;
  }

  if (vaults.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 py-16 text-center">
        <p className="text-zinc-400">No vaults yet.</p>
        <Link href="/create" className="mt-4 inline-block text-emerald-400 hover:underline">
          Create the first one →
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800">
      {vaults.map((v) => (
        <li key={v.vaultId}>
          <Link
            href={`/vault/${v.vaultId}`}
            className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-zinc-900/80 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-zinc-100">{v.name}</p>
              <p className="font-mono text-xs text-zinc-500">{shortenAddress(v.vaultId, 6)}</p>
            </div>
            <div className="flex gap-4 text-sm text-zinc-400">
              <span>{v.maxMembers} members</span>
              <span>{mistToSui(v.contribution)} SUI / round</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
