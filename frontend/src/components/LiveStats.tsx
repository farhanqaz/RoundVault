'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { mistToSui } from '@/lib/config';
import { fetchProtocolStats, type ProtocolStats } from '@/lib/events';

export default function LiveStats() {
  const client = useSuiClient();
  const [stats, setStats] = useState<ProtocolStats | null>(null);

  useEffect(() => {
    fetchProtocolStats(client)
      .then(setStats)
      .catch(() => setStats({ vaultsCreated: 0, totalDistributed: 0n, totalSlashed: 0n }));
    const id = setInterval(() => {
      fetchProtocolStats(client).then(setStats).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [client]);

  const items = [
    {
      label: 'Vaults on-chain',
      value: stats ? String(stats.vaultsCreated) : '…',
    },
    {
      label: 'Total distributed',
      value: stats ? `${mistToSui(stats.totalDistributed)} SUI` : '…',
    },
    {
      label: 'Total slashed',
      value: stats ? `${mistToSui(stats.totalSlashed)} SUI` : '…',
    },
  ];

  return (
    <section className="border-y border-zinc-800 bg-zinc-900/50">
      <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-zinc-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((stat) => (
          <div key={stat.label} className="px-4 py-8 text-center">
            <p className="text-2xl font-bold tabular-nums text-zinc-100">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="pb-4 text-center text-xs text-zinc-600">Live from RoundVault events on Sui testnet</p>
    </section>
  );
}
