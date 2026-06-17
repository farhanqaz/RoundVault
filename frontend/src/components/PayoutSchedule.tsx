import { shortenAddress } from '@/lib/utils';

type Props = {
  payoutHistory: string[];
  currentRound: number;
  totalRounds: number;
  eligibleCount?: number;
  members?: { fields: { addr: string; received_payout: boolean } }[];
};

export default function PayoutSchedule({
  payoutHistory,
  currentRound,
  totalRounds,
  eligibleCount,
  members,
}: Props) {
  const remaining = eligibleCount ?? members?.filter((m) => !m.fields.received_payout).length ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-300">Gacha draw history</span>
        <span className="text-xs text-violet-400">🎲 random each round</span>
      </div>

      {currentRound < totalRounds && (
        <div className="border-b border-zinc-800 bg-violet-500/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-400/90">
            Round {currentRound + 1} — pending draw
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {remaining} member{remaining === 1 ? '' : 's'} eligible · winner revealed on distribute
          </p>
        </div>
      )}

      <ul className="divide-y divide-zinc-800">
        {payoutHistory.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-600">No draws yet</li>
        )}
        {payoutHistory.map((addr, i) => (
          <li key={`${i}-${addr}`} className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs font-medium text-violet-300">
                {i + 1}
              </span>
              <span className="font-mono text-xs text-zinc-300">{shortenAddress(addr)}</span>
            </div>
            <span className="text-xs text-emerald-400">Won pot 🎉</span>
          </li>
        ))}
        {Array.from({ length: Math.max(0, totalRounds - payoutHistory.length - (currentRound < totalRounds ? 1 : 0)) }).map(
          (_, i) => (
            <li key={`future-${i}`} className="flex items-center justify-between px-4 py-3 text-sm opacity-60">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-600">
                  ?
                </span>
                <span className="text-xs text-zinc-600">TBD — gacha</span>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
