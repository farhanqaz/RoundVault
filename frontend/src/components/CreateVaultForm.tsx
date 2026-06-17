'use client';

import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { buildCreateVaultTx } from '@/lib/transactions';

const DEMO_NAMES = ['Team Savings', 'Freelancer Circle', 'DAO Round', 'Gacha Circle'];

export default function CreateVaultForm() {
  const account = useCurrentAccount();
  const router = useRouter();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [name, setName] = useState('Gacha Circle');
  const [maxMembers, setMaxMembers] = useState(5);
  const [contribution, setContribution] = useState('0.1');
  const [stake, setStake] = useState('0.1');
  const [intervalHours, setIntervalHours] = useState(24);
  const [error, setError] = useState<string | null>(null);

  const loadDemoPreset = () => {
    setName(DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)]!);
    setMaxMembers(5);
    setContribution('0.1');
    setStake('0.1');
    setIntervalHours(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!account) {
      setError('Connect your wallet first (Sui Testnet).');
      return;
    }

    try {
      const tx = buildCreateVaultTx({
        name,
        maxMembers,
        contributionSui: contribution,
        stakeSui: stake,
        intervalMs: intervalHours * 3600 * 1000,
      });

      const result = await signAndExecute({ transaction: tx });
      const txResult = await client.waitForTransaction({
        digest: result.digest,
        options: { showObjectChanges: true },
      });

      const vaultChange = txResult.objectChanges?.find(
        (change) =>
          change.type === 'created' && change.objectType?.includes('::vault::Vault'),
      );

      if (vaultChange && vaultChange.type === 'created') {
        router.push(`/vault/${vaultChange.objectId}`);
      } else {
        setError('Vault created — check your wallet for the AdminCap and vault object ID.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed.');
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-zinc-100">Create savings vault</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Set up a rotating savings group with <strong className="text-zinc-300">gacha payouts</strong>.
        Each round, one random member who hasn&apos;t won yet takes the full pot — on-chain via Sui
        Random.
      </p>

      <button
        type="button"
        onClick={loadDemoPreset}
        className="mt-4 text-xs text-emerald-500 hover:text-emerald-400"
      >
        Load demo preset (1h rounds, 0.1 SUI) →
      </button>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Field label="Vault name" hint="Visible to all members on-chain">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Gacha Circle"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Members" hint="Each member wins exactly once over N rounds">
            <input
              type="number"
              min={2}
              max={20}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Round interval (hours)" hint="Time to contribute each round">
            <input
              type="number"
              min={1}
              value={intervalHours}
              onChange={(e) => setIntervalHours(Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contribution (SUI)" hint="Paid every round → goes into the pot">
            <input
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Stake bond (SUI)" hint="Collateral on join — slashed if you default">
            <input value={stake} onChange={(e) => setStake(e.target.value)} className="input" />
          </Field>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-zinc-400">
          <span className="font-medium text-violet-300">🎲 Gacha mode</span> — no fixed payout order.
          When everyone contributes, <code className="text-zinc-300">Distribute</code> runs a verifiable
          random draw among members who haven&apos;t won yet.
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !account}
          className="w-full rounded-xl bg-emerald-500 py-3.5 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {isPending ? 'Creating on-chain…' : account ? 'Create gacha vault' : 'Connect wallet first'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-300">{label}</span>
      {hint && <span className="mb-2 block text-xs text-zinc-600">{hint}</span>}
      {children}
    </label>
  );
}
