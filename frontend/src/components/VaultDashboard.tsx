'use client';

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import CopyButton from '@/components/CopyButton';
import PayoutSchedule from '@/components/PayoutSchedule';
import { ReputationBadge } from '@/components/ReputationCard';
import { mistToSui, MODULE, PACKAGE_ID, STATUS_LABELS, suiToMist } from '@/lib/config';
import {
  buildActivateVaultTx,
  buildContributeTx,
  buildJoinVaultTx,
  buildSettleRoundTx,
  buildWithdrawStakeTx,
} from '@/lib/transactions';
import { decodeVaultName, explorerObject, explorerTx, parseBalanceField, shortenAddress } from '@/lib/utils';

type VaultFields = {
  name: number[];
  admin: string;
  max_members: string;
  contribution: string;
  stake_amount: string;
  total_rounds: number;
  current_round: number;
  interval_ms: string;
  round_deadline_ms: string;
  payout_history?: string[];
  payout_order?: string[]; // legacy vaults
  status: number;
  total_slashed: string;
  pot?: unknown;
  members?: { fields: MemberFields }[];
};

type MemberFields = {
  addr: string;
  staked: boolean;
  paid_current_round: boolean;
  received_payout: boolean;
  miss_count: number;
  stake_withdrawn?: boolean;
};

export default function VaultDashboard({ vaultId }: { vaultId: string }) {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [vault, setVault] = useState<VaultFields | null>(null);
  const [potBalance, setPotBalance] = useState('0');
  const [adminCapId, setAdminCapId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ msg: string; digest?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const settlingRef = useRef(false);
  const lastSettleRoundRef = useRef(-1);

  const loadVault = useCallback(async () => {
    try {
      const obj = await client.getObject({
        id: vaultId,
        options: { showContent: true },
      });
      const fields = (obj.data?.content as unknown as { fields: VaultFields })?.fields;
      if (fields) {
        setVault(fields);
        setPotBalance(parseBalanceField(fields.pot));
        setError(null);
      }
    } catch {
      setError('Could not load vault. Check the object ID and network (testnet).');
    } finally {
      setLoading(false);
    }
  }, [client, vaultId]);

  useEffect(() => {
    loadVault();
    const interval = setInterval(loadVault, 8_000);
    return () => clearInterval(interval);
  }, [loadVault]);

  useEffect(() => {
    if (!account) return;
    client
      .getOwnedObjects({
        owner: account.address,
        filter: { StructType: `${PACKAGE_ID}::${MODULE}::AdminCap` },
        options: { showContent: true },
      })
      .then((res) => {
        const cap = res.data.find(
          (o) =>
            (o.data?.content as unknown as { fields: { vault_id: string } })?.fields
              ?.vault_id === vaultId,
        );
        if (cap?.data?.objectId) setAdminCapId(cap.data.objectId);
      })
      .catch(() => {});
  }, [account, client, vaultId]);

  const runTx = async (
    label: string,
    build: () => ReturnType<typeof buildContributeTx>,
  ) => {
    setError(null);
    setSuccess(null);
    try {
      const result = await signAndExecute({ transaction: build() });
      await loadVault();
      setSuccess({ msg: `${label} successful`, digest: result.digest });
      return true;
    } catch (err) {
      setError(`${label} failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      return false;
    }
  };

  const unpaidStaked =
    vault?.members?.filter((m) => m.fields.staked && !m.fields.paid_current_round) ?? [];
  const deadlinePassed =
    vault != null && Number(vault.round_deadline_ms) > 0 && Number(vault.round_deadline_ms) <= Date.now();
  const shouldAutoSettleDeadline =
    vault?.status === 1 && account != null && deadlinePassed && unpaidStaked.length > 0;

  useEffect(() => {
    if (!shouldAutoSettleDeadline || settlingRef.current || isPending) return;
    if (vault && vault.current_round === lastSettleRoundRef.current) return;

    settlingRef.current = true;
    lastSettleRoundRef.current = vault?.current_round ?? -1;

    runTx('Auto-settle round', () => buildSettleRoundTx(vaultId)).finally(() => {
      settlingRef.current = false;
    });
  }, [shouldAutoSettleDeadline, isPending, vault, vaultId]);

  if (loading && !vault) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-zinc-800" />
          <div className="h-40 rounded-2xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-zinc-400">{error ?? 'Vault not found.'}</p>
        <Link href="/explore" className="mt-4 inline-block text-emerald-400 hover:underline">
          ← Back to explore
        </Link>
      </div>
    );
  }

  const name = decodeVaultName(vault.name);
  const status = STATUS_LABELS[vault.status] ?? 'Unknown';
  const deadline = Number(vault.round_deadline_ms);
  const countdown = deadline > nowMs() ? Math.floor((deadline - nowMs()) / 1000) : 0;
  const paidCount = vault.members?.filter((m) => m.fields.paid_current_round).length ?? 0;
  const memberCount = vault.members?.length ?? 0;
  const maxMembers = Number(vault.max_members);
  const isMember = vault.members?.some((m) => m.fields.addr === account?.address);
  const myMember = vault.members?.find((m) => m.fields.addr === account?.address);
  const canContribute = myMember && !myMember.fields.paid_current_round && vault.status === 1;
  const payoutHistory =
    vault.payout_history ??
    vault.payout_order?.slice(0, vault.current_round) ??
    [];
  const eligibleCount =
    vault.members?.filter((m) => m.fields.staked && !m.fields.received_payout).length ?? 0;
  const imEligible =
    myMember?.fields.staked && !myMember.fields.received_payout && vault.status === 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/explore" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← All vaults
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100">{name}</h1>
            <StatusBadge status={status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-zinc-500">{shortenAddress(vaultId, 8)}</span>
            <CopyButton text={vaultId} label="Copy ID" />
            <a
              href={explorerObject(vaultId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-500/80 hover:text-emerald-400"
            >
              Explorer ↗
            </a>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Contribution" value={`${mistToSui(vault.contribution)} SUI`} sub="per round" />
        <MiniStat label="Stake bond" value={`${mistToSui(vault.stake_amount)} SUI`} sub="on join" />
        <MiniStat label="Members" value={`${memberCount}/${maxMembers}`} sub={vault.status === 0 ? 'forming' : 'joined'} />
      </div>

      {/* Main panel */}
      <div className="mt-6 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-zinc-400">
            Round <strong className="text-zinc-200">{vault.current_round + 1}</strong> of{' '}
            {vault.total_rounds}
          </span>
          {vault.status === 1 && countdown > 0 && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-400">
              ⏱ {formatCountdown(countdown)}
            </span>
          )}
          {vault.status === 1 && countdown === 0 && deadline > 0 && (
            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">
              Deadline passed — auto-settling…
            </span>
          )}
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-zinc-400">Pot this round</span>
            <span className="font-semibold tabular-nums text-emerald-400">
              {mistToSui(potBalance)} SUI
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${maxMembers ? (paidCount / maxMembers) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            {paidCount} of {maxMembers} members contributed
          </p>
        </div>

        {vault.status === 1 && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-400/90">
              🎲 Gacha draw this round
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {eligibleCount} eligible member{eligibleCount === 1 ? '' : 's'} — gacha runs automatically
              when everyone pays or the deadline passes
            </p>
            {imEligible && (
              <p className="mt-1 text-xs text-violet-300">You&apos;re in the pool — good luck!</p>
            )}
          </div>
        )}

        {Number(vault.total_slashed) > 0 && (
          <p className="text-sm text-red-400">
            ⚠ Total slashed from defaults: {mistToSui(vault.total_slashed)} SUI
          </p>
        )}
      </div>

      {/* Payout schedule */}
      <div className="mt-6">
        <PayoutSchedule
          payoutHistory={payoutHistory}
          currentRound={vault.current_round}
          totalRounds={vault.total_rounds}
          eligibleCount={eligibleCount}
          members={vault.members}
        />
      </div>

      {/* Members */}
      {vault.members && vault.members.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
          <div className="border-b border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300">
            Members
          </div>
          <ul className="divide-y divide-zinc-800">
            {vault.members.map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="truncate font-mono text-xs text-zinc-400">
                  {m.fields.addr === account?.address ? (
                    <span className="text-zinc-200">{shortenAddress(m.fields.addr)} (you)</span>
                  ) : (
                    shortenAddress(m.fields.addr, 8)
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ReputationBadge address={m.fields.addr} compact />
                  {m.fields.paid_current_round && (
                    <Tag color="emerald">Paid</Tag>
                  )}
                  {m.fields.received_payout && <Tag color="blue">Received</Tag>}
                  {m.fields.miss_count > 0 && <Tag color="red">{m.fields.miss_count}× miss</Tag>}
                  {!m.fields.staked && <Tag color="red">Slashed</Tag>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 space-y-4">
        {!account && (
          <p className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm text-zinc-400">
            Connect wallet (Sui Testnet) to interact
          </p>
        )}

        {vault.status === 0 && (
          <div className="flex flex-wrap gap-3">
            {!isMember && (
              <button
                onClick={() =>
                  runTx('Join', () =>
                    buildJoinVaultTx(vaultId, suiToMist(mistToSui(vault.stake_amount))),
                  )
                }
                disabled={isPending || !account || memberCount >= maxMembers}
                className="action-btn"
              >
                Join & stake {mistToSui(vault.stake_amount)} SUI
              </button>
            )}
            {isMember && (
              <p className="text-sm text-emerald-400">✓ You&apos;re in — waiting for {maxMembers - memberCount} more</p>
            )}
            {adminCapId && memberCount >= maxMembers && (
              <button
                onClick={() => runTx('Activate', () => buildActivateVaultTx(vaultId, adminCapId))}
                disabled={isPending}
                className="action-btn"
              >
                Activate vault
              </button>
            )}
          </div>
        )}

        {vault.status === 1 && (
          <div className="flex flex-wrap gap-3">
            {canContribute && (
              <button
                onClick={() =>
                  runTx('Contribute', () =>
                    buildContributeTx(vaultId, suiToMist(mistToSui(vault.contribution))),
                  )
                }
                disabled={isPending}
                className="action-btn"
              >
                Contribute {mistToSui(vault.contribution)} SUI
              </button>
            )}
            {isMember && myMember?.fields.paid_current_round && (
              <p className="self-center text-sm text-emerald-400">✓ You paid this round</p>
            )}
            {paidCount >= maxMembers && vault.status === 1 && (
              <p className="self-center text-sm text-violet-300">
                All paid — gacha draw runs automatically
              </p>
            )}
          </div>
        )}

        {vault.status === 2 && (
          <div className="flex flex-wrap gap-3">
            <p className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center text-sm text-emerald-400">
              Vault completed all rounds
            </p>
            {isMember && myMember?.fields.staked && !myMember.fields.stake_withdrawn && (
              <button
                onClick={() => runTx('Withdraw stake', () => buildWithdrawStakeTx(vaultId))}
                disabled={isPending}
                className="action-btn"
              >
                Withdraw stake (+ reputation)
              </button>
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="animate-fade-in mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success.msg}
          {success.digest && (
            <>
              {' '}
              <a
                href={explorerTx(success.digest)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-emerald-300"
              >
                View tx ↗
              </a>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-zinc-100">{value}</p>
      <p className="text-[10px] text-zinc-600">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Forming: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
    Collecting: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
    Completed: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status] ?? 'bg-zinc-800 text-zinc-400 ring-zinc-700'}`}
    >
      {status}
    </span>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: 'emerald' | 'blue' | 'red' }) {
  const c = {
    emerald: 'bg-emerald-500/15 text-emerald-400',
    blue: 'bg-blue-500/15 text-blue-400',
    red: 'bg-red-500/15 text-red-400',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c[color]}`}>{children}</span>;
}

function formatCountdown(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function nowMs() {
  return Date.now();
}
