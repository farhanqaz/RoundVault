'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ReputationLookup({ defaultAddress = '' }: { defaultAddress?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultAddress);
  const [error, setError] = useState<string | null>(null);

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = query.trim();
    if (!addr.startsWith('0x') || addr.length < 10) {
      setError('Enter a valid Sui address (0x…).');
      return;
    }
    setError(null);
    router.push(`/reputation/${encodeURIComponent(addr)}`);
  };

  return (
    <form onSubmit={lookup} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Look up any wallet — 0x…"
        className="input flex-1 font-mono text-xs"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
      >
        View reputation
      </button>
      {error && <p className="text-xs text-red-400 sm:col-span-2">{error}</p>}
    </form>
  );
}
