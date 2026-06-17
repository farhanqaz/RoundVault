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
      label: 'Vaults',
      value: stats ? String(stats.vaultsCreated) : '…',
    },
    {
      label: 'Pooled',
      value: stats ? `${mistToSui(stats.totalDistributed)} SUI` : '…',
    },
    {
      label: 'Slashed',
      value: stats ? `${mistToSui(stats.totalSlashed)} SUI` : '…',
    },
  ];

  return (
    <section>
      <div className="grid grid-cols-3 divide-x divide-[var(--line)]">
        {items.map((stat) => (
          <div key={stat.label} className="px-2 py-2.5">
            <p className="tabular text-sm font-black text-[var(--ink)] xl:text-base">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--faint)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
