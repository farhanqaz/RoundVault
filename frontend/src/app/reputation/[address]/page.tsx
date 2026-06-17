import Link from 'next/link';
import ReputationCard from '@/components/ReputationCard';
import ReputationLookup from '@/components/ReputationLookup';
import CopyButton from '@/components/CopyButton';
import { shortenAddress } from '@/lib/utils';

export default async function ReputationPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/leaderboard" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Leaderboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-zinc-100">On-chain reputation</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Portable score earned across all RoundVault circles — view anyone&apos;s track record
        before joining their vault.
      </p>

      <div className="mt-6">
        <ReputationLookup defaultAddress={address.startsWith('0x') ? address : ''} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-zinc-400">{shortenAddress(address, 10)}</span>
        <CopyButton text={address} label="Copy address" />
      </div>

      <div className="mt-6">
        <ReputationCard address={address} />
      </div>
    </div>
  );
}
