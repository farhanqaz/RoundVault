import ExploreVaults from '@/components/ExploreVaults';

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-100">Explore vaults</h1>
      <p className="mt-2 text-sm text-zinc-400">
        All savings vaults created on RoundVault — public, on-chain, verifiable.
      </p>
      <div className="mt-8">
        <ExploreVaults />
      </div>
    </div>
  );
}
